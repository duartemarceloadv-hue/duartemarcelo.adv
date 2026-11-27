# R1 – DP/RH: cadastro único de PESSOA

Somente leitura. Evidência própria: SELECT em `xqxjmeioodmdhxhivyqu` em 27/11 (colunas de `premiacao.pessoas`, `vinculos`, `lancamentos`, `bizneo_cadastro`, `usuarios`, `contestacoes`; `pedidos_novo.pessoa`, `termo`, `usuario`) e contagens abaixo.

## 1. O que o banco mostra hoje (fatos que mudam o desenho)

| Fato | Número | Fonte |
|---|---|---|
| Pessoas na Premiação | 697 (585 ativas; 189 com documento de 14 dígitos = CNPJ de PJ; 17 "SEMCPF-") | consulta; inv-premiacao §5 |
| Chave da pessoa | `premiacao.pessoas.cpf` (texto): CPF para CLT/estágio, **CNPJ para PJ** | consulta; inv-premiacao §4 "PJ pelo CNPJ" |
| Ligadas à Bizneo | 488 (`bizneo_id`); espelho `bizneo_cadastro` 704 (bizneo_id, doc, status, contratos) | consulta |
| E-mail de pessoa | **0 de 697** preenchidos; o espelho da Bizneo também não traz e-mail | consulta |
| Cargo | não está na pessoa: está em `lancamentos.cargo` (por mês, 9 cargos) e em `vinculos.cargo` | consulta |
| Regimes | CLT, PJ, Estágio | consulta |
| Mais de uma loja no mesmo mês | 94 lançamentos; `vinculos` com 41 linhas de só 4 pessoas | consulta; inv-premiacao §5 |
| Prescritor/RT | legado `docs:prescritores` 48; RTs 43 + 18 encerrados; `pop_unidade_cfg` 33; `pedidos_novo.pessoa` 0 (id, nome, conselho, registro, uf, habilitado_prescrever) | inv-documentos §D; inv-pedidos §7 |
| Reembolso | `reb_pessoas` 0, prevê CLT/PJ com PIX e vínculo pendente → ativo | inv-compras §2 |
| Logins | 5 a 7 bases (Premiação 19 reais, Documentos 20, `membros` 21, POPs 42 e-mails, Pedidos novo 2) | inv-pedidos §7; inv-documentos §D |

Consequências diretas:
1. **PJ chaveado por CNPJ quebra o RT/prescritor.** O RT responde pelo registro no conselho (CRBM/COREN), que é da pessoa física; a mesma biomédica PJ aparece na Premiação pelo CNPJ da empresa dela. Unir por nome (os "41 de 48") é casamento frágil: precisa ser confirmado por CPF ou registro.
2. **Não dá para criar login de colaborador a partir da Premiação**: não há e-mail. Gerar em lote (proposta de inv-premiacao §6.4) depende de obter e-mail da Bizneo ou de primeiro acesso por CPF + código.
3. Cargo e unidade são **fatos com vigência**, não atributos fixos da pessoa.

## 2. Modelo proposto (schema `nucleo`, novo, sem tocar `premiacao`)

**`nucleo.pessoa`** – a pessoa física. Chave interna `id` (uuid). Campos: nome, CPF (único, obrigatório quando houver; "SEMCPF" vira pendência, não chave), e-mail pessoal, telefone, situação. Um campo, um dado (premissa).

**`nucleo.pessoa_documento_fiscal`** – CPF e CNPJs que a pessoa usa para receber (PJ). Uma pessoa pode ter CNPJ com vigência (troca de MEI/empresa). É a ponte com `premiacao.pessoas.cpf`: lookup por CPF **ou** CNPJ chega ao mesmo `pessoa.id`.

**`nucleo.vinculo`** – contrato de trabalho/prestação: pessoa, regime (CLT, PJ, Estágio), empresa/CNPJ contratante (do cadastro de empresas), admissão, saída, `bizneo_id`, origem = Bizneo, `consultado_em`. Só leitura na tela; mudanças vêm da carga da Bizneo (feita por Claude, como hoje em `premiacao-import`).

**`nucleo.lotacao`** – onde a pessoa trabalha e com qual cargo: vínculo, unidade, cargo (catálogo de cargos com o nome da Bizneo + apelido), `de`, `ate`, tipo (titular, empréstimo, cobertura, transferência). Transferência = fecha uma linha e abre outra, nunca sobrescreve. Isso cobre o que hoje está espalhado entre `vinculos` (41) e `lancamentos.unidade_id` por mês (94 casos multi-loja).

**`nucleo.papel_tecnico`** – registro profissional e função técnica: pessoa, conselho (CRBM, COREN, CRM), número, UF, validade da carteira, `habilitado_prescrever`. E a designação por unidade: **`nucleo.rt_unidade`** (pessoa, unidade, laboratório opcional, de/até, documento da CRT e carteira ligados ao arquivo que já está em Documentos). O "RT do termo" (`rtTermo`/`crbmTermo`, 36/34 unidades) é uma linha com laboratório preenchido. Prescritor = papel_tecnico habilitado; RT = rt_unidade vigente. Não são cadastros diferentes, são papéis da mesma pessoa.

**`nucleo.dado_pagamento`** – PIX/banco da pessoa (para reembolso), com a regra antifraude do Compras (troca fica pendente até confirmação por outro canal; inv-compras §1 `cmp_forn_guard`).

**`nucleo.conta`** – login (e-mail + senha) ligado a `pessoa.id`; **`nucleo.acesso`** – papel (operações, sócio, gestor, financeiro, contabilidade, RT, colaborador) × unidades, com vigência. Papel de sistema é separado de cargo: a gestora da loja tem cargo "gestora" na lotação e papel "gestor" no acesso; o colaborador só vê o que é dele.

Tudo com histórico (quem, quando, justificativa) – premissa "toda correção manual exige justificativa".

## 3. Como serve cada módulo sem mexer na Premiação

| Módulo | Uso | Como |
|---|---|---|
| **Premiação** | Continua com `premiacao.pessoas`, `vinculos`, `lancamentos` intactos | O núcleo **lê** a Premiação (carga noturna/visão) para semear `pessoa`, `pessoa_documento_fiscal` e `lotacao`. Nada é escrito no schema `premiacao`. Divergência núcleo × Premiação vira relatório de conferência para Operações, não correção automática |
| **Pedidos** | Prescritor e RT do termo | `pedidos_novo.pessoa` e `termo.rt_id` (vazios) passam a apontar para `nucleo.pessoa`/`rt_unidade` antes de serem povoados. Migração dos 48 prescritores e 43+18 RTs: casar por CRBM, depois CPF; nome só como sugestão para Operações confirmar |
| **Documentos** | RT da unidade, carteira CRBM, CRT (37 vencidas no total, 5 de carteira CRBM) | `rt_unidade` substitui o RT digitado no POPs (`pop_unidade_cfg`) e liga número + validade ao arquivo existente – anexado uma vez, reaproveitado |
| **Reembolsos** | Solicitante colaborador (CLT/PJ) e PIX | `reb_pessoas` não é criado de novo: solicitante = `pessoa` com vínculo ativo; aprovação pelo sócio das unidades da `lotacao` vigente na data da despesa |

## 4. Premiação: o que observar (sem alterar)
- **Fechamento/contestação**: hoje 1 contestação e `contestacoes` é chaveada por `cpf`; contestação procedente não corrige valor nem tem prazo (inv-premiacao §6.7). Registro do risco: quando a Premiação entrar no login único, a ligação conta → pessoa → CPF/CNPJ do lançamento precisa existir, senão o PJ não vê o próprio prêmio (perfil colaborador só vê "o próprio CPF ou CNPJ", inv-premiacao §3).
- **Transferência** (`movimentar`): o núcleo registra a lotação; a Premiação segue com a sua regra de loja pagadora. Não sincronizar os dois sentidos.
- Integração só entre o fechamento de uma competência e a abertura da seguinte, com autorização (inv-premiacao §7).

## 5. Temas do brief (breve)
1. **Unificar agora**: núcleo de pessoa + conta/acesso + catálogo de cargos (espelho Bizneo). Manter separado: motor e dados da Premiação.
2. **Fases (visão RH)**: (a) núcleo em leitura semeado da Premiação/Bizneo; (b) papel técnico/RT com Pedidos e Documentos (Pedidos novo ainda vazio = menor risco); (c) Reembolsos (nunca usado); (d) Premiação por último.
3. **Não interferir**: carga só lê; nada em `premiacao`, Nutra ou banco legado; outubro aberto não é afetado.
4. **Origem**: vínculo/cargo/datas = Bizneo; CPF/CNPJ de recebimento = Premiação + Bizneo; registro de conselho = carteira anexada em Documentos; e-mail/PIX = a própria pessoa no primeiro acesso, confirmado por Operações.
5. **Acesso**: papel × unidade com vigência; o sócio vê as unidades dele; colaborador vê só o próprio; DP/contabilidade só competências aprovadas.
6. **Tela de pessoa**: ficha única com abas Vínculos, Lotações (linha do tempo), Registro profissional/RT, Pagamento, Acessos, Histórico; selo "Bizneo – só consulta".
8. **IA**: leitura de carteira CRBM/CRT para extrair número e validade (com conferência humana); **não** para casar pessoas ou decidir prêmio.
9. **Crítica ao pedido**: "pessoa única" pode virar promessa de que a Premiação passa a usar o núcleo já – não deve. E chavear por CPF como a Premiação faz para CLT, mas por CNPJ para PJ, replicaria o erro. Alternativa: `pessoa.id` interno + tabela de documentos fiscais; casamento por nome nunca automático.

## 6. Riscos
- 17 pessoas sem documento e 6 sem CPF/CNPJ no fechamento de outubro (inv-premiacao §6.2) entram como pendência.
- Sem e-mail em nenhuma base de pessoas: login de ~400 colaboradores exige primeiro acesso por CPF + código (modelo que a Premiação já tem, `codigo_gerar`) ou importar e-mail da Bizneo.
- LGPD: CPF, PIX e dados de saúde do RT exigem acesso mínimo por papel e registro de leitura.
