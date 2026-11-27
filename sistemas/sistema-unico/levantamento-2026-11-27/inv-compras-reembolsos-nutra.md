# Inventário: Compras/Estoque, Reembolsos e Estoque Nutra (Dr. Hair)

Levantamento feito em 27/11/2026, só com leitura (SELECT, leitura de funções e de edge functions). Nada foi alterado.
Bancos: legado `ckgsdvhkpnrrmctlqtma` (schema public) e banco único `xqxjmeioodmdhxhivyqu` (schema `nutra`).
Não há dados pessoais neste documento, só contagens. O conteúdo de `reb_omie_credenciais` não foi lido: só confirmei que a tabela existe e quantas linhas tem.

---

## Visão geral

| Sistema | Onde está | Site | Estágio | Registros reais | Último uso |
|---|---|---|---|---|---|
| Compras/Estoque | legado, `cmp_*` (26 tabelas + view `cmp_saldos`), bucket `compras` | `compras-drhair` (Netlify) | **Construído e em piloto/teste**. Fluxo completo no banco, quase sem uso real | 3 solicitações, 7 cotações, 1 fornecedor, 1 contrato, 9 produtos. 0 compras, notas, títulos, recebimentos e movimentos de estoque | 04/11/2026 (último evento de auditoria) |
| Reembolsos | legado, `reb_*` (9 tabelas), usa os perfis do Compras | sem site próprio identificado; provavelmente uma tela do `compras-drhair` | **Só estrutura (esqueleto)**. Não há funções de gravação | 0 solicitações, 0 pessoas, 0 itens, 0 eventos. Só cadastros-base: 16 categorias, 2 configurações, 51 empresas em `reb_empresa_pagto` | 13/11/2026 (carga das empresas). Nunca foi usado |
| Estoque Nutra | legado, `nut_*` (7 tabelas) + `membros` + `cmp_unidades`. **Cópia** no banco único, schema `nutra` | `estoque-nutra-drhair` (Netlify) | **Em produção**. O legado ainda é o oficial; a cópia está pronta para a virada | 1 rodada (Novembro/2026, aberta, prazo 30/11), 54 respostas de 50 unidades, 12 produtos, 12 preços | 26/11/2026 (última resposta) |

---

## 1. Compras / Estoque (`cmp_*`)

### 1.1 Estágio e volumes

| Tabela | Linhas | Observação |
|---|---|---|
| cmp_unidades | 51 | todas ativas. É a **lista de unidades usada também pelo Nutra e pelo Reembolso** |
| cmp_empresas | 51 | todas ativas; **49 CNPJs distintos** (há 1 CNPJ repetido) |
| cmp_unidade_empresa | 51 | vínculo unidade → CNPJ com vigência; todos os 51 vigentes |
| cmp_perfis | 6 (todos ativos) | papéis: solicitante 6, sócio 4, gestor 1, compras 1, admin 1 |
| cmp_areas / cmp_categorias | 9 / 16 | 4 categorias "reguladas" (saúde/Anvisa) |
| cmp_config | 4 | cotações mínimas por faixa (até R$1.000 = 1; até R$5.000 = 2; acima = 3), tolerância de valor 2%, lembrete 48h, reposição automática **ligada** (dia 1, cobertura 30 dias) |
| cmp_solicitacoes (SC) / cmp_sc_itens | 3 / 19 | situação: 2 em aprovação, 1 em cotação. Criadas entre 27/10 e 04/11 |
| cmp_cotacoes | 7 | |
| cmp_fornecedores / produto_fornecedor / fornecedor_banco_hist | 1 / 9 / 0 | |
| cmp_contratos / contrato_itens / precos | 1 / 9 / 9 | contrato de catálogo carregado em 04/11 |
| cmp_produtos | 9 | |
| cmp_compras, cmp_notas, cmp_titulos, cmp_recebimentos, cmp_estoque_mov, cmp_cartoes, cmp_anexos | **0** | nenhuma compra fechada até hoje. O bucket `compras` está vazio |
| cmp_eventos (auditoria) | 303 | de 27/10 a 04/11. Há 6 eventos de títulos para 0 títulos existentes, ou seja, títulos de teste já apagados |

Conclusão: o sistema está construído de ponta a ponta (SC → cotação → aprovação → compra → recebimento → NF → título → pagamento → estoque), mas só foi exercitado com dados de teste. **Não está em uso operacional.**

### 1.2 Matriz de funcionalidades

| Módulo | Tela (deduzida) | Função (RPC) | Quem usa | Tabelas | Origem do dado | Automação |
|---|---|---|---|---|---|---|
| Solicitação de compra (SC) | Nova SC / Minhas SCs | insert direto (RLS) + `cmp_sc_enviar`, `cmp_sc_cancelar`, `cmp_sc_importar` (importa documento/pedido) | solicitante (unidade), compras, admin | cmp_solicitacoes, cmp_sc_itens, cmp_anexos | digitação ou documento lido por IA (`ler-documento`) | trigger `cmp_sc_guard` (regras de situação) e auditoria |
| Cotação | Cotações da SC | insert direto + `cmp_pode_cotar`, `cmp_sc_cotavel`, `cmp_sc_reabrir_cotacao`, `cmp_min_cotacoes` | compras | cmp_cotacoes, cmp_anexos (print/PDF obrigatório) | digitação, print da loja | trigger `cmp_cot_after` |
| Validação ("de acordo") | Aguardando meu de acordo | `cmp_sc_validar` | solicitante ou gestor da unidade | cmp_solicitacoes | — | — |
| Aprovação | Aprovações (individual e em lote) | `cmp_sc_decidir`, `cmp_sc_aprovar_lote` | sócio | cmp_solicitacoes | — | lembrete de 48h configurado (não achei job que envie o lembrete) |
| Pedido/compra | Registrar compra, pedido de catálogo | `cmp_compra_registrar`, `cmp_compra_corrigir`, `cmp_compra_atualizar`, `cmp_pedido_catalogo` | compras | cmp_compras, cmp_cartoes | cotação vencedora ou contrato de catálogo | `cmp_compra_gerar_titulos`, trigger de preços |
| Contratos e catálogo | Contratos / tabela de preços | `cmp_contrato_salvar` | compras, admin | cmp_contratos, cmp_contrato_itens, cmp_precos | contrato lido por IA (`ler-documento`) | trigger `cmp_precos_do_contrato` |
| Fornecedores | Cadastro de fornecedor | insert/update direto + `cmp_fornecedor_confirmar_banco` | compras, financeiro, admin | cmp_fornecedores, cmp_fornecedor_banco_hist | cartão CNPJ lido por IA; consulta de CNPJ | `cmp_forn_guard`: troca de dados bancários fica "pendente" até alguém confirmar por outro canal (antifraude). Nota do fornecedor recalculada pelas avaliações |
| Recebimento | Receber pedido | `cmp_receber`, `cmp_recebimento_avaliar`, `cmp_recebimento_estornar` | unidade/gestor | cmp_recebimentos, cmp_estoque_mov | conferência física | gera entrada de estoque e avaliação de prazo e qualidade |
| Notas fiscais | Notas / conferência | `cmp_nota_registrar`, `cmp_nota_prestador`, `cmp_nota_conferir`, `cmp_nota_vincular`, `cmp_nota_aceitar`, `cmp_nota_cancelar`, `cmp_nota_corrigir` | compras, financeiro | cmp_notas | XML/PDF (edge `anexo-leitura`/`ler-documento`) | conferência automática NF × compra (divergências, retenções, IBS/CBS, prazo de manifestação); `cmp_reavaliar_titulos` |
| Contas a pagar | Títulos / faturas de cartão | `cmp_titulo_programar`, `cmp_titulo_pagar`, `cmp_titulo_atualizar`, `cmp_titulo_cancelar`, `cmp_fatura_pagar` | financeiro | cmp_titulos, cmp_cartoes | gerados pela compra | bloqueios automáticos (aguardando nota, dados bancários pendentes) |
| Estoque | Saldos, contagem, transferência | `cmp_estoque_lancar`, `cmp_estoque_contagem`, `cmp_estoque_transferir`, view `cmp_saldos` | unidade, compras | cmp_estoque_mov | lançamentos | — |
| Reposição | Sugestão de reposição | `cmp_reposicao_sugerir`, `cmp_reposicao_gerar` | compras | gera SCs a partir do consumo | média de consumo (3 meses), estoque mínimo | **job `compras-reposicao-diaria` 09:20 UTC** → `cmp_reposicao_auto()` (29 execuções, todas OK, sem itens gerados) |
| Cadastros/admin | Pessoas e papéis, unidades, empresas | `cmp_pessoa_salvar`; insert/update com RLS de admin | admin | cmp_perfis, cmp_unidades, cmp_empresas, cmp_unidade_empresa | manual (51 empresas carregadas em 27/10) | — |
| Limpeza | — | edge `limpar-orfaos` | sistema | bucket `compras` | — | **job `compras-limpar-orfaos` 06:17 UTC** (29 execuções OK) |

Edge functions ligadas ao Compras: `ler-documento` (leitura por IA de cartão CNPJ, pedido/NF e contrato; exige perfil ativo em `cmp_perfis`), `anexo-leitura`, `limpar-orfaos`, `docs-regulatorios` (provável checagem de AFE/licença).

### 1.3 Fluxo de aprovação (SC)

`rascunho` → (solicitante envia) `enviada` → (compras cota) `em_cotacao` → (compras escolhe a vencedora) `em_validacao` → (solicitante ou gestor dá o "de acordo") `em_aprovacao` → (sócio decide) `aprovada` / `reprovada` / `devolvida` → `comprada` → `recebida` → `concluida` (ou `cancelada`).

Regras que estão no banco:
- número mínimo de cotações por faixa de valor (dispensado para fornecedor "fixo");
- print ou PDF obrigatório em cada cotação (ou motivo de não ter);
- se a cotação escolhida não for a mais barata, é preciso justificar;
- categoria regulada (saúde) não pode ser comprada em loja online;
- **segregação de funções**: quem pediu, quem cotou e quem deu o "de acordo" não podem dar a aprovação final; quem cotou não pode dar o "de acordo";
- a unidade precisa ter empresa (CNPJ) vigente.

### 1.4 Perfis de acesso
- Login pelo Supabase Auth. É preciso estar ativo em `membros` **e** em `cmp_perfis` (`cmp_meus_papeis`).
- Papéis: `solicitante`, `gestor`, `compras`, `financeiro`, `socio`, `admin`.
- "Staff" (compras, financeiro, sócio, admin) vê todas as unidades. Os demais veem só as unidades de `cmp_perfis.unidades`.
- RLS ligado em todas as tabelas `cmp_*`.

### 1.5 Integrações
- Leitura por IA (API da Anthropic) no `ler-documento`. Funciona só se o segredo da chave estiver cadastrado; sem ele, o site usa a leitura local.
- Não há integração com o Omie nem com bancos no Compras (os títulos são pagos à mão).

---

## 2. Reembolsos (`reb_*`)

### 2.1 Estágio e volumes

| Tabela | Linhas |
|---|---|
| reb_solicitacoes / reb_itens / reb_anexos / reb_eventos | **0 / 0 / 0 / 0** |
| reb_pessoas (cadastro do colaborador com PIX) | 0 |
| reb_categorias | 16 (grupos: Deslocamento, Viagem e treinamento, Operação da unidade, Implantação, Equipe, Pacientes, Outros). **0 com categoria Omie mapeada** |
| reb_config | 2: `segregacao_pagamento = true`, `prazo_complemento_dias = 5` |
| reb_empresa_pagto | 51 empresas, todas no modo `omie_cash` com `omie_ativo = false` (carga de 13/11/2026) |
| reb_omie_credenciais | existe; **0 linhas** (valores não lidos) |

Conclusão: **modelo de dados pronto, sem uso e sem camada de gravação.** Não há nenhuma RPC `reb_*` de criação, envio, aprovação ou pagamento: só funções auxiliares (papéis, permissões, validação de CPF, CNPJ e PIX). As tabelas só têm regras de RLS de leitura (exceto as de configuração, que admin e financeiro podem editar). Com RLS ligado e sem regra de INSERT/UPDATE, hoje **nenhum usuário consegue gravar uma solicitação** pelo site. Não encontrei site nem edge function dedicados.

### 2.2 Matriz de funcionalidades (planejada, deduzida do modelo)

| Módulo | Tela | Função existente | Quem usa | Tabelas | Origem do dado | Automação |
|---|---|---|---|---|---|---|
| Cadastro do colaborador | Meus dados / PIX | `reb_pix_detectar`, `reb_pix_normalizar`, `reb_pix_valido`, `reb_cpf_valido`, `reb_cnpj_valido` | colaborador (CLT/PJ), com vínculo pendente → ativo/recusado | reb_pessoas | digitação | — |
| Solicitação | Novo reembolso (itens + comprovantes) | **falta** (só `reb_pode_editar_sol`) | colaborador | reb_solicitacoes, reb_itens, reb_anexos | digitação + comprovante | — |
| Aprovação do sócio | Aprovar reembolsos da unidade | **falta** (só `reb_aprova_unidade`) | sócio ou gestor da unidade, admin | reb_solicitacoes (socio_email/em/obs), reb_eventos | — | — |
| Análise do financeiro | Conferir, glosar, pedir complemento | **falta** | financeiro | reb_itens (glosa), reb_solicitacoes (complemento, prazo de 5 dias) | — | — |
| Pagamento | Programar e pagar (PIX) | **falta** | financeiro | reb_solicitacoes (programado_para, pago_em, valor_pago, modo_pagamento) | — | trigger `reb_sol_guard_t`: se trocar a chave PIX depois da aprovação, volta para `aguardando_financeiro`; bloqueia mudanças depois de paga |
| Envio ao Omie | — | **falta** | sistema | reb_solicitacoes.omie_* , reb_empresa_pagto, reb_omie_credenciais | — | situações previstas: nao_aplicavel, pendente, simulado, enviado, baixado, erro |
| Configuração | Categorias, empresas, modo de pagamento | update direto (RLS de financeiro/admin) | financeiro, admin | reb_categorias, reb_config, reb_empresa_pagto | manual | — |

### 2.3 Fluxo de aprovação (pelas situações previstas)
`rascunho` → `aguardando_socio` (sócio ou gestor da unidade aprova) → `aguardando_financeiro` (financeiro confere; pode pedir `complemento` com prazo de 5 dias, glosar itens ou `reprovada`) → `aprovada` → `programada` → `paga` (ou `cancelada`).
Com `segregacao_pagamento = true`, a ideia é que quem aprova não seja quem paga (a regra ainda não está escrita em nenhuma função). Os campos `complemento_de` e `origem`/`origem_ref` preveem reembolso complementar e origem externa.

### 2.4 Perfis de acesso
`reb_papeis()` reaproveita o Compras: `colaborador` (pessoa ativa em `reb_pessoas`), mais `socio`, `gestor`, `financeiro` e `admin`, que vêm de `cmp_perfis`. Visibilidade: o próprio solicitante; financeiro e admin veem tudo; sócio e gestor veem as unidades de `cmp_perfis.unidades`.

### 2.5 Integração Omie: **preparada, não ligada**
- Modo `omie_cash` por empresa, mas `omie_ativo = false` nas 51;
- 0 credenciais cadastradas e 0 categorias Omie mapeadas;
- não existe edge function de envio para reembolso. A `omie-sync` existente é de **Pedidos/Health** (portal Omie do laboratório) e não toca em `reb_*`.

---

## 3. Estoque Nutra (`nut_*`, cópia em `nutra.*`)

### 3.1 Estágio e volumes

| Tabela (legado) | Linhas | Cópia em `nutra.*` |
|---|---|---|
| nut_rodadas | 1 (id `nov-2026`, "Novembro/2026", aberta, prazo 30/11/2026, criada em 18/11) | 1 |
| nut_estoque_respostas | 54 (50 unidades distintas; 4 unidades enviaram mais de uma vez; 6 respostas com "outros produtos"); envios de 18/11 a 26/11 | 54 (máx. 26/11 19:03, **igual ao legado**) |
| nut_produtos | 12 ativos (9 nutracêuticos, 3 dermocosméticos) | 12 |
| nut_precos / nut_precos_rodada | 12 / 12 (atualizados em 24 e 25/11) | 12 (25/11, igual) |
| nut_socios | 51 (12 sócios distintos) | 51 |
| nut_config | 4 (aberto, prazo, sugestões, hash da senha) | sim |
| membros (compartilhada) | 21 (3 admin, 18 só leitura com unidades) | 21 |
| cmp_unidades (compartilhada) | 51 | 51 |

**Em uso real** (um ciclo mensal completo em andamento). A cópia no banco único está sincronizada até 26/11. O job novo está desligado e o legado é o oficial.

### 3.2 Matriz de funcionalidades

| Módulo | Tela | Função | Quem usa | Tabelas | Origem do dado | Automação |
|---|---|---|---|---|---|---|
| Formulário de contagem | Formulário público (sem login): escolhe a unidade, informa quem contou e as quantidades | `nut_form_dados`, `nut_enviar_estoque_v2` (a v1 `nut_enviar_estoque` está fechada) | equipe da clínica (anônimo) | nut_estoque_respostas, nut_produtos, nut_rodadas, cmp_unidades, nut_config (sugestões) | contagem física mensal | valida quantidades inteiras, até 30 "outros produtos", sem nomes repetidos |
| Painel | Respostas por unidade e rodada, valor do estoque | `nut_painel_me`, `nut_painel_ver(p_como)`, `nut_painel_r(p_como, p_rodada)` (a antiga `nut_painel(p_senha)` está fechada) | membros (sócios e gestores veem as suas unidades; admin vê tudo; "ver como" para admin) | respostas, precos, precos_rodada, socios, membros | — | — |
| Rodadas | Abrir, fechar e editar rodada | `nut_rodada_nova`, `nut_rodada_editar`, `nut_rodada_situacao` | admin | nut_rodadas | — | **job `nut-rodada-dia-01` (dia 1, 10:00 UTC) → `nut_rodada_auto()`**: fecha a rodada aberta, abre a do mês e copia os preços. Ainda não rodou nenhuma vez |
| Preços | Preço por produto (atual e por rodada) | `nut_set_preco_me`, `nut_set_preco_r` (a antiga `nut_set_preco(p_senha)` está fechada) | admin | nut_precos, nut_precos_rodada | manual | — |

### 3.3 Aprovação
Não há fluxo de aprovação: é uma coleta mensal. O sócio responsável de cada unidade (`nut_socios`) aparece no painel para cobrança.

### 3.4 Perfis de acesso
- Formulário: anônimo.
- Painel: login por e-mail, valendo `membros` (`is_membro`, `is_admin` = admin e não leitura, `minhas_unidades`). É a **mesma tabela `membros` do sistema de Pedidos/Health** (o `docs`/`logs` do legado).
- Há uma senha antiga do painel (hash em `nut_config`) ainda usada pelas funções fechadas para o público.

### 3.5 Integrações
Nenhuma (nem Omie nem ERP). A relação com "pedidos Health" é só por dados compartilhados (`membros`, unidades). Os pedidos de nutracêuticos e manipulados ficam no sistema de Pedidos (`docs` col=pedidos: 479; omieNF: 385; insumos: 13), que tem a `omie-sync` (Portal Omie do laboratório, chamada pela coleta diária do navegador).

---

## 4. Dados que se repetem com outros sistemas

| Dado | Onde aparece (contagens) | Observação |
|---|---|---|
| **Unidades** | legado `cmp_unidades` 51 · legado `docs` col=clinicas 53 (Pedidos) · legado `inj_unidades` 4 · banco único `nutra.unidades` 51 · `public.unidades` 54 · `premiacao.unidades` 56 (+ `zuria_unidade_map` 52) · `pedidos_novo.unidade` 53 (+ 71 apelidos em `unidade_alias`) | só 34 das 51 `cmp_unidades` batem com `clinicas` por id ou nome: **identificadores diferentes entre sistemas** |
| **Empresas / CNPJ** | `cmp_empresas` 51 (49 CNPJs distintos) · `cmp_unidade_empresa` 51 · `reb_empresa_pagto` 51 · `clinicas` 53 com CNPJ (49 batem com `cmp_empresas`) · `pedidos_novo.unidade_cnpj` 53 | 3 a 4 cadastros diferentes de CNPJ por unidade |
| **Fornecedores / laboratórios** | `cmp_fornecedores` 1 · legado `lab` 2 · `pedidos_novo.laboratorio` 2 · CNPJ do laboratório fixo no código da `omie-sync` | o fornecedor de manipulados do Pedidos ainda não está em `cmp_fornecedores` |
| **Pessoas** | `reb_pessoas` 0 · `premiacao.pessoas` 697 · `pedidos_novo.pessoa` 0 · `docs` col=prescritores 48 | o Reembolso vai precisar de colaboradores com PIX, que a Premiação já tem (pessoas) |
| **Logins / perfis** | legado `auth.users` 18 · `membros` 21 (4 sem usuário no Auth; 1 usuário do Auth sem membro) · `cmp_perfis` 6 (todos também em `membros`) · `nutra.membros` 21 · banco único `auth.users` 2 · `premiacao.usuarios` 30 · `pedidos_novo.usuario` 2 | **3 camadas de permissão no legado** (`membros` → `cmp_perfis` → `reb_papeis`). Sócios aparecem em `cmp_perfis` (4) e em `nut_socios` (12 nomes, em texto livre e sem e-mail) |
| Sócio por unidade | `nut_socios` 51 (texto) · `cmp_perfis` papel sócio + unidades · `cmp_empresas.quem_autoriza` | sem chave comum |
| Produtos | `cmp_produtos` 9 · `nut_produtos` 12 · `docs` insumos 13 (Pedidos) · categoria "Nutracêuticos / suplementos" em `cmp_categorias` | o mesmo item pode existir em 3 catálogos |
| Estoque | `cmp_estoque_mov`/`cmp_saldos` (0) · `nut_estoque_respostas` (contagem mensal em JSON) | dois modelos de estoque: Nutra = contagem, Compras = movimentos |

---

## 5. Rotinas agendadas (cron)

**Legado (`ckgsdvhkpnrrmctlqtma`)**: todas ativas.

| Job | Quando (UTC) | O que faz | Sistema |
|---|---|---|---|
| compras-reposicao-diaria | 09:20 todo dia | `cmp_reposicao_auto()` | Compras |
| compras-limpar-orfaos | 06:17 todo dia | edge `limpar-orfaos` (a chave publicável fica no comando do job) | Compras |
| nut-rodada-dia-01 | dia 1, 10:00 | `nut_rodada_auto()` | Nutra |
| backup-semanal | domingo 06:00 | `chamar_automacao('backup')` | geral |
| planilha-horaria | :15, das 10h às 22h | `chamar_automacao('planilha')` | Pedidos |
| rastreio-manha / rastreio-tarde | 10:00 / 17:00 | `chamar_automacao('rastreio')` | Pedidos |
| receitas-dia-01 | dia 1, 09:05 | `gerar_receitas()` | Pedidos/receitas |

**Banco único (`xqxjmeioodmdhxhivyqu`)**: `nutra-rodada-dia-01` (dia 1, 10:00, **desligado**), `pedidos-novo-planilha`, `pedidos-novo-rastreio`, `premiacao-copia-diaria`, `premiacao-encerrar-vencidas` (estes ligados).

---

## 6. Problemas conhecidos e riscos

1. **Nutra, virada do mês em 01/12/2026 (daqui a 4 dias).** O job do legado vai fechar a rodada `nov-2026` (o prazo vai até 30/11, então está ok) e abrir "Dezembro/2026" com id `r-AAAAMMDD-...`. Mas `nut_painel_me()` tem o filtro **fixo `levantamento='nov-2026'`**: o painel antigo vai continuar mostrando novembro. O painel por rodada (`nut_painel_r`) não tem esse problema. Também é a primeira execução do job, então não há histórico de teste.
2. **Nutra, prazo duplicado**: `nut_config.prazo = 19/11/2026`, enquanto a rodada tem prazo 30/11. A configuração antiga `aberto/prazo` ficou parada, e `nut_painel_me` ainda lê `aberto` dela.
3. **Nutra, respostas duplicadas**: 4 unidades com mais de um envio na rodada. Não há regra de "última vale" no banco; quem decide é o painel.
4. **Nutra, permissões amplas**: `anon` tem GRANT completo (inclusive DELETE/TRUNCATE) em `nut_estoque_respostas`, `reb_solicitacoes`, `reb_itens` e `reb_pessoas`. O RLS está ligado e sem regra de escrita, então hoje não há brecha, mas qualquer regra criada sem cuidado abre acesso anônimo. Na cópia `nutra.*` o acesso foi retirado (melhor).
5. **Nutra, dados em JSON e texto livre**: quantidades em `itens` (jsonb, chave = id do produto), "outros" em texto livre e sócio por nome (sem e-mail ou id).
6. **Reembolsos sem camada de gravação**: não há RPC nem regra de RLS para criar, aprovar ou pagar. O site não consegue operar. A regra de segregação existe só como configuração. Também falta o envio ao Omie (credenciais, categorias e conta corrente vazias).
7. **Compras não adotado**: 0 compras depois de 1 mês. O job de reposição roda todo dia sem gerar nada (só 9 produtos, nenhum consumo). O "lembrete 48h" está configurado, mas não há job que o envie.
8. **Compras, chave no cron**: a chave publicável está escrita no comando do job `compras-limpar-orfaos` (é pública, mas fica exposta no banco). A edge function usa a service role.
9. **Três camadas de usuários no legado** (`membros`, `cmp_perfis`, `reb_pessoas`) e 4 membros sem login no Auth. O banco único tem só 2 usuários no Auth: a virada do Nutra depende de migrar os usuários com o hash da senha (está no README).
10. **Identificadores de unidade divergentes** entre `cmp_unidades` e as clínicas do Pedidos (só 34 de 51 batem); há 1 CNPJ repetido em `cmp_empresas`.
11. **Edge functions sem verificação de JWT** (verify_jwt=false) em várias do legado (`omie-sync`, `automacoes`, `anexo-leitura`, `importar-*`, `contas`, `docs-regulatorios`). Elas fazem a própria checagem por cabeçalho ou hash; vale revisar no desenho único.
12. `cmp_eventos` registra 6 eventos de títulos apagados: houve teste com exclusão. A auditoria continua, mas não existe ambiente separado de teste.

---

## 7. Pontos para o desenho do sistema único
- **Cadastro mestre único** de unidade (id estável + apelidos), empresa/CNPJ com vigência (o `cmp_unidade_empresa` é o melhor modelo), pessoa (Premiação já tem 697) e fornecedor (unir `cmp_fornecedores` e `lab`).
- **Um único modelo de acesso** (pessoa → papéis por unidade) para substituir `membros` + `cmp_perfis` + `reb_papeis`.
- Aproveitar a máquina de situações, a segregação de funções e a auditoria do Compras também no Reembolso (sócio → financeiro → pagamento).
- O Nutra pode virar uma "contagem de estoque" dentro do módulo de Estoque, com produtos do catálogo único, em vez de JSON.
- Omie: definir se o Reembolso entra como contas a pagar (`omie_cash`) e reaproveitar o mesmo cadastro de credenciais por empresa para o Compras.
