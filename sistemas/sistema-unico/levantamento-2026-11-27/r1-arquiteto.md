# Rodada 1 — Arquiteto de software / produto

Evidências próprias (SELECT em 27/11, banco único `xqxjmeioodmdhxhivyqu`): schemas `public` 21 tabelas, `pedidos_novo` 31, `premiacao` 43, `nutra` 9 e mais 4 schemas `premiacao_copia_*` dentro da produção. O banco tem 144 MB, os arquivos somam 853 MB e há 2 usuários no Auth. `list_branches` não retornou nenhum branch, ou seja, hoje não existe ambiente de teste do Supabase.

## 1. Tese: um núcleo, uma casca, módulos independentes

Proponho **unificar já o núcleo (cadastros, login, auditoria, pendências, arquivos) e a casca (menu, cabeçalho, filtro global)**. Os módulos continuam em schemas próprios e são publicados cada um no seu tempo. "Sistema único" é o que o usuário vê. Por baixo, nada é migrado de uma vez.

Hoje há 8 cadastros de unidade, 4 de CNPJ, 4 de sócio, 4 de RT e 5 a 7 bases de login (inv-documentos §D; inv-pedidos §7). Essa é a raiz dos problemas. O layout é consequência.

## 2. Um banco, vários schemas (não vários bancos)

Fica **um projeto Supabase**, como já foi decidido nas premissas, com estes schemas e uma regra de dependência.

| Schema | Conteúdo | Origem |
|---|---|---|
| `nucleo` | cadastros, acesso, auditoria, pendências, arquivos | novo |
| `pedidos` | o atual `pedidos_novo`, renomeado só quando o antigo for desligado | inv-pedidos §1 |
| `compras` | Compras, Estoque e a contagem Nutra | legado `cmp_*`, `nutra.*` |
| `reembolsos` | modelo `reb_*` reescrito sobre o núcleo (tem 0 linhas) | inv-compras §2 |
| `documentos` e `pops` | o que hoje está em `public` | inv-documentos §A e §C |
| `premiacao` | **intocado** | premissa |
| `integracao` | conectores, staging de importações, registro de execuções dos robôs | `pedidos_novo.execucao_conector`, `premiacao._imp_*` |

Regras de dependência:
- Um módulo **lê** o `nucleo` e só grava nele por funções (`nucleo.*`), nunca direto.
- Um módulo **nunca lê nem grava o schema de outro módulo**. Quando precisa, usa uma view pública do núcleo ou uma pendência.
- As cópias de segurança saem da produção. Os `premiacao_copia_*` hoje somam 141 tabelas no mesmo banco. Elas passam a ser dumps no Storage, ou o backup do plano Pro.

Por que não vários bancos: as unidades só se casam pelo CNPJ (53/53, inv-premiacao §6). A permissão por unidade precisa de uma única função `minhas_unidades()`. E o volume é pequeno: o maior registro tem 9.744 eventos (inv-pedidos §1). Vários bancos trariam de volta o problema que hoje temos com o legado.

## 3. Tabelas do núcleo

**Cadastro**
- `nucleo.unidade`: id, nome, apelido, uf, regiao, inauguracao, situacao, teste. **O id é o mesmo de `public.unidades` (Documentos)**, porque `pedidos_novo.unidade.doc_unidade_id` já aponta para ele em 53 de 53 (inv-documentos, "Dados que se repetem"). É o embrião do cadastro mestre, sem renumerar nada.
- `nucleo.unidade_alias`: sistema e código externo, cobrindo ZurIA, Premiação, `cmp_unidades`, clínicas do legado e Injemed. Parte dos 71 apelidos de `pedidos_novo.unidade_alias` e dos 52 de `zuria_unidade_map`.
- `nucleo.empresa`: cnpj (único), razão social, regime, IE, IM, `certificado_validade`. Consolida A, `cmp_empresas` e o checklist do legado (inv-documentos §B).
- `nucleo.unidade_empresa`: unidade, empresa, vigência de/até. É o modelo de `cmp_unidade_empresa` e `pedidos_novo.unidade_cnpj`, porque o CNPJ pode mudar (pesquisa §7, anti-padrão 1).
- `nucleo.pessoa`: nome, CPF ou CNPJ, e-mail, telefone, `bizneo_id`. A carga inicial é uma **cópia de leitura** de `premiacao.pessoas` (697) e dos prescritores (48). A Bizneo continua dona dos dados de RH.
- `nucleo.pessoa_pix`: chave PIX com histórico e confirmação, para o Reembolso.
- `nucleo.socio_unidade`: pessoa, unidade, vigência. Substitui `nut_socios`, `premiacao.unidades.socio` e `clinicas.socio`, que hoje são texto.
- `nucleo.profissional`: pessoa, conselho (CRBM ou COREN), número, UF, validade da carteira.
- `nucleo.unidade_rt`: unidade, profissional, papel (RT ou prescritor), vigência, documento do termo do laboratório. Une os 4 lugares onde o RT vive hoje (inv-documentos §D).
- `nucleo.fornecedor`: empresa, tipo (laboratório, serviço, material) e dados bancários. Herda a trava antifraude do `cmp_forn_guard` (inv-compras §1.2), com `nucleo.fornecedor_banco_hist`.
- `nucleo.produto`: catálogo único, para não manter 3 catálogos (inv-compras §4).

**Documentos e arquivos**
- `nucleo.arquivo`: bucket, caminho, sha256 (único), mime, tamanho, quem enviou. Com isso o arquivo é **anexado uma vez**, e o hash elimina os 37 repetidos do Pedidos (inv-pedidos §9).
- `nucleo.documento_tipo`: o catálogo vira tabela. Hoje está fixo no código (inv-documentos §A). Cada tipo diz a quem pertence (unidade, empresa, pessoa ou fornecedor), se tem validade e quem revisa.
- `nucleo.documento`: dono, tipo, validade, situação e revisão. O histórico de versões fica em `nucleo.documento_versao` (documento, arquivo). Os módulos guardam só o `arquivo_id` ou o `documento_id`.

**Acesso**
- Login: `auth.users`, um único Supabase Auth.
- `nucleo.usuario`: auth_id e pessoa_id.
- `nucleo.papel`: catálogo de papéis. Exemplos: operacoes, socio, gestor, unidade, financeiro, compras, contabilidade, colaborador, consultor.
- `nucleo.usuario_papel`: usuário, papel, módulo (ou "todos"), escopo (rede ou uma lista de unidades), vigência, quem concedeu e justificativa.
- O escopo do sócio é **derivado de `socio_unidade`** e não é digitado (pesquisa §6, item 1).
- Funções: `nucleo.minhas_unidades()`, `nucleo.tem_papel(modulo, papel)` e `nucleo.pode_unidade(id)`. Elas são usadas no RLS de todos os módulos novos e nas edge functions. Substituem `membros` → `cmp_perfis` → `reb_papeis` (inv-compras §6, item 9).
- Mantém-se "Ver como" somente leitura, como na Premiação (inv-premiacao §3).

**Comum**
- `nucleo.evento`: auditoria imutável com quem, quando, entidade, campo, de → para, justificativa e módulo. Gravar exige justificativa quando a correção é manual.
- `nucleo.pendencia`: a caixa única, com módulo, referência, unidade, quem resolve, prazo, situação e bloqueio. Cada módulo publica nela. A tela "Minhas pendências" lê só essa tabela.
- `nucleo.preferencia`: guarda o filtro global por usuário (unidades e competência). Isso faz o filtro "valer no site inteiro", o que hoje só acontece no Início da Premiação (inv-premiacao §5).
- `nucleo.modulo_liberado`: liga o módulo por usuário ou unidade. Permite publicar para Operações primeiro e voltar atrás sem novo deploy.

## 4. Crescimento para 60+ unidades

- Toda tabela de módulo tem `unidade_id` (FK para `nucleo.unidade`), índice `(unidade_id, competencia)` e RLS por `minhas_unidades()`.
- Não haverá schema nem banco por unidade.
- Abrir uma unidade passa a ser **um único formulário**. Ele cria a unidade, a empresa, o sócio e o RT, gera as pendências do checklist de `documento_tipo` e libera os módulos. Hoje isso significa cadastrar em 8 lugares.
- O gargalo real é o espaço de arquivos: são 853 MB para um limite de 1 GB, e ainda faltam ~207 MB do legado (inv-pedidos §8). **O plano Pro é pré-requisito da Fase 0.**

## 5. Versionamento, testes e como voltar atrás

- **GitHub como fonte única.** Estrutura `sistemas/nucleo`, `sistemas/casca` e `sistemas/<modulo>/{supabase/migrations, functions, web}`, no padrão que o Pedidos já usa (migrations 0001 a 0011).
- Premiação, Documentos e POPs não estão em git (inv-premiacao §1). O primeiro passo é **baixar o código publicado das edge functions para o repositório, só como cópia**. Ler não altera nada.
- **Teste**: um branch do Supabase (exige Pro) ou um segundo projeto `drhair-teste`, recriado a partir das migrations e com dados anonimizados. O Netlify gera um link de teste a cada mudança. A produção só recebe o que passou no link de teste e no checklist de funcionalidades do módulo, que é a matriz dos inventários usada como roteiro de aceite.
- **Migrations em duas etapas**, primeiro expandir e depois contrair: cria a estrutura nova, copia os dados, troca a leitura e só apaga o antigo numa migration posterior, depois de 30 dias sem uso.
- **Voltar atrás**: o Netlify volta à publicação anterior com um clique. O `modulo_liberado` desliga um módulo para um grupo. O backup diário do plano Pro substitui as cópias dentro do schema.
- Atenção: a raiz do repositório é um app Next.js com Prisma (AGENTS.md), enquanto o Pedidos novo é HTML/JS puro. **Proponho manter a casca em HTML/JS puro**, como o Pedidos em produção, e não misturar os dois sem decisão explícita.

## 6. Ordem de migração (sem quebrar o que está em uso)

| Fase | O quê | Respeita |
|---|---|---|
| 0, até 30/11 | Plano Pro, código no GitHub, ambiente de teste. **Nada em produção.** O job do Nutra no legado roda em 01/12 como está | Rodada Nutra de dezembro; outubro da Premiação aberto |
| 1 | Schema `nucleo` criado e carregado por cópia (Documentos, `pedidos_novo.unidade_cnpj`, `cmp_empresas`, `premiacao.pessoas` como leitura). Nenhum módulo em uso passa a depender dele ainda | Nada muda para quem usa |
| 2 | Casca e login único, estreados no **Pedidos novo**, que tem só 2 usuários (inv-pedidos §1) | Risco mínimo |
| 3 | Pedidos completo: criar pedido, receitas, RT e prescritores no núcleo, cópia dos arquivos, sincronização final, desligar o `pedidos-drhair` | inv-pedidos §8 |
| 4 | Nutra muda para `compras` **entre duas rodadas**, depois de fechar dezembro e antes do job de 01/01. Usuários migrados com o hash da senha | Rodada aberta nunca é migrada |
| 5 | Reembolsos, construído direto no núcleo (0 dados), e Compras (0 compras; migram só os cadastros) | inv-compras §1 e §2 |
| 6 | Documentos e POPs: a chave única de admin vira login individual, o catálogo vira tabela, entra o alerta de vencimento (37 documentos vencidos) | inv-documentos §A |
| 7 | Legado `ckgsdvhkpnrrmctlqtma` desligado, com um dump final guardado | Só depois das fases 3, 4 e 5 |
| 8 | Premiação entra na casca e no login, **só depois do "sim" do usuário e com outubro e novembro fechados**. Até lá, o núcleo apenas lê dela | Premissa |

Login da Premiação: ela usa PBKDF2 próprio, e esse hash não entra no Supabase Auth. A migração será "no primeiro acesso": a pessoa entra com a senha atual, uma função confere e grava a nova. A mesma solução vale para `acessos` do Documentos.

## 7. Telas, IA e crítica (breve)

- **Padrão de telas.** São seis moldes na casca, e os módulos só os preenchem: lista (tabela densa com filtros), ficha (cabeçalho, cartões, seções, histórico por último), pendência (o modelo de blocos da Premiação), aprovação (uma máquina de estados com segregação de funções, como no Compras), documento (visualizador na tela) e relatório (exporta Excel).
- **Onde entra a API do Claude.** Só na edge `ler-documento` do núcleo: cartão CNPJ, contrato social, NF, pedido de venda, comprovante. Ela **sugere campos para uma pessoa confirmar**.
- **Onde não entra.** Fica fora do cálculo de prêmio, das permissões, das aprovações, das baixas de pagamento e das datas (premissa "não inventar datas").
- **Crítica ao pedido.**
  - "Um sistema só" entendido como entrega única é o maior risco. A alternativa é uma casca única com módulos liberados um a um.
  - Copiar o layout da Premiação "inteiro" copia também os problemas dela: 5 rolagens internas, 24 tamanhos de fonte e cinzas reprovados no contraste (inv-premiacao §5). Deve-se copiar a estrutura e corrigir esses pontos.
  - "Nenhuma funcionalidade perdida" só pode ser cobrado com a matriz dos inventários virando roteiro de aceite por módulo.
- **Riscos registrados (premissas).**
  - Deixar a Premiação fora do login único mantém duas bases de usuários até a Fase 8.
  - O espaço de arquivos depende do plano Pro.
