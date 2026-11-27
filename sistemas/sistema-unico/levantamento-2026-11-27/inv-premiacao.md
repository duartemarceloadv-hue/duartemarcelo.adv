# Inventário — Sistema de Premiação Dr. Hair

Levantado em 27/11/2026 só com leitura: SELECT no banco, leitura do código das edge functions e leitura de documentos. Nada foi alterado. Este arquivo não traz nomes, CPFs nem e-mails, só contagens.

Fontes lidas:
- Código completo das funções `premiacao` (v61, index.ts com 1.390 linhas e engine.ts com 340), `premiacao-import` (v1), `premiacao-rel` (v4), `premiacao-deb` (v2) e `premiacao-metas` (v1).
- Schema `premiacao`: tabelas, colunas, 41 gatilhos, 43 funções SQL e contagens.
- `cron.job` e `cron.job_run_details`.
- Claude Docs: "Premiação Dr. Hair — documento-mestre" (rev. 19, atualizado em 24/11) e "Premiação — Auditoria de uso, clique a clique" (23/11).
- Na pasta de rascunho: "Análise dos sistemas atuais" e "Sistema único — documento-mestre", que já tinham medido o front-end publicado em 25/11.

O site `premiacao-drhair.netlify.app` está bloqueado pelo proxy deste container (CONNECT 403), e a API da Netlify recusou sem token (401). Por isso o layout foi reconstruído a partir de três coisas: as ações que o servidor aceita, os documentos acima e as medições do front-end feitas em 25/11.

---

## 1. Onde está

| Item | Onde | Observação |
|---|---|---|
| Site (front-end) | Netlify, projeto `premiacao-drhair` (site id `b86dfd9a-…`, deploy atual `6b0857f85765ad55f1526b9f`) | A tela em uso é **/app/**. As telas antigas **/** e **/novo/** continuam publicadas. Página estática que chama as edge functions com POST e `{action, sessao, …}`. Não abre a partir deste container |
| Banco | Supabase `xqxjmeioodmdhxhivyqu` (projeto "drhair-documentacao-imoveis"), schema `premiacao` | O mesmo banco de Documentos, POPs (schema `public`) e Pedidos novo (`pedidos_novo`). A conexão é feita direto por `SUPABASE_DB_URL` (postgres.js), sem RLS: quem vê o quê é decidido só pelo código das funções |
| Tabelas do schema | 43 tabelas, 13 delas auxiliares | 30 de negócio. Auxiliares: `_imp_token`, `_pag_cand`, `_pag_import` (staging de importação); `bkp_comparecimentos_20261125`, `bkp_valor_informado_20261126`, `bkp_valor_pago_20261125`, `bkp_valor_pago_20261126` (backups soltos); `copias`, `chaves_internas`, `config`, `sessoes`, `historico`, `pendencias_descartadas` |
| Cópias de segurança | 4 schemas `premiacao_copia_20261123` a `_20261126` (31, 32, 37 e 41 tabelas) | Feitas pelo job diário `fazer_copia(7)`, que guarda 7 dias |
| Edge functions | `premiacao` v61 (principal, ~60 ações), `premiacao-metas` v1, `premiacao-rel` v4, `premiacao-deb` v2, `premiacao-import` v1 | Todas com `verify_jwt=false`. A autenticação é própria, por token de sessão. `premiacao`, `-deb` e `-rel` guardam cada uma a sua cópia do motor ou da sessão (engine.ts e `dadosApuracao` aparecem duplicados em `premiacao` e em `premiacao-deb`) |
| Versionamento | **Não há repositório git.** O repositório local `duartemarceloadv-hue/duartemarcelo.adv` tem só `sistemas/pedidos` e `sistemas/nutra`; nenhum arquivo cita "premiacao" | A única história de versões é a das edge functions no Supabase (v61) e o registro de mudanças do documento-mestre. O conselho do sistema único pôs como inegociável: "nenhuma mudança sem o código no GitHub" |
| Ambiente de teste | Dentro do mesmo banco, com a coluna `teste` em competências, unidades e usuários | 3 unidades de teste, 11 usuários de teste e as competências 2025-10 e 2025-11 de teste. Os gatilhos `fn_trava_teste` e `fn_trava_teste_usuario` impedem o teste de tocar dado real |

---

## 2. Matriz de funcionalidades

Papéis usados abaixo: **Op** = Operações (`operacoes`), **Sócio** = perfil `unidade`, **Colab** = `colaborador`, **Fin** = `financeiro`, **Cont** = `contabilidade`.

| Módulo | Tela / aba | Função (ações do servidor) | Quem usa | Dados lidos / gravados | Origem do dado | Automação |
|---|---|---|---|---|---|---|
| Acesso | Entrar / Primeiro acesso / Trocar senha / Sair | `login`, `primeiro_acesso` (código de 6 dígitos, vale 7 dias), `trocar_senha`, `sair`, `eu` | Todos | usuarios, sessoes, historico | manual | Bloqueio de 15 min depois de 5 erros; sessão de 12 h; PBKDF2 com 150 mil iterações |
| Início | Quadro do mês: "Falta para aprovar o mês", 4 indicadores, filtros, tabela de lojas, fila por loja, lote por assunto (Op) | `competencias`, `competencia`, `resultados`, `pend_listar`, `aprovacoes`, `impedimentos`, `pedidos`, `conflitos`, `avisos` | Op, Sócio (só as lojas dele) | competencias, unidade_competencia, apuracoes, resultados, pendencias, aprovacoes_loja, pedidos, conflitos_importacao, avisos | calculado | Ler a tela recalcula o mês se algum dado mudou (`autoRecalc`, no máximo a cada 40 s) |
| Início, por sócio | Agrupado por sócio | (cálculo na tela) | Op | resultados, unidades | calculado | — |
| Loja | Página da loja: cabeçalho, cartões, Equipe e prêmios, pendências e pedidos da loja, conflitos, Aprovar números, Apontar problema, Aprovar em nome do sócio | `loja_aprovar`, `loja_problema`, `uc_aprovar`, `aprovacoes`, `pend_*` | Sócio aprova; Op aprova em nome dele (com motivo) | aprovacoes_loja, pendencias, avisos | manual | O gatilho `trg_auto_aprovar` aprova o mês quando nada mais impede. Se o total da loja mudar no recálculo, a aprovação cai e o gatilho `fn_aviso_aprovacao_caiu` avisa o sócio |
| Loja | Dados do mês (números da loja e grade das pessoas) | `dados_loja`, `uc_salvar`, `uc_lote` | Op grava; o Sócio só pede (vira pedido) | unidade_competencia, lancamentos, ajustes | ZurIA (faturamento, à vista), planilha (faltas etc.), manual com justificativa | Recalcula ao salvar. Cancelamentos só podem ser alterados por Op |
| Loja | Cancelamentos do mês (consulta) | `canc_listar`, `canc_anexo`, `canc_importar` (Op). `canc_salvar`, `canc_excluir` e `canc_validar` respondem 410, desativados | Op, Sócio | cancelamentos (228) | ZurIA, relatório 5003 | — |
| Loja | Relatórios de origem do ZurIA (arquivos por loja e pessoa) e aviso "vendeu em outra loja" | `premiacao-rel`: `listar`, `anexo`, `outra_loja`; ingestão com chave interna: `ingest`, `ingest_mov`, `ingest_debito`, `ingest_listar`, `ingest_baixar`, `ingest_apagar` | Op, Sócio (leitura); Claude faz a ingestão | relatorios_origem (602 arquivos: 5028, 5029, 5031, 5036 e 5037, com 44 de cada, e 382 com código 0), vendas_mov, vendas_debito | ZurIA | Gatilhos `fn_trg_outra_loja` em lancamentos e a função `fn_avisos_outra_loja` |
| Pessoas | Lista de pessoas e Pessoa (cabeçalho, dados considerados, memória de cálculo, régua, conferência sistema × planilha prêmio × planilha financeiro, cadastro Bizneo, "esta pessoa no mês", histórico de correções, recibo) | `competencia`, `resultados`, `ajustes`, `lanc_salvar`, `lanc_excluir`, `movimentar` (transferência ou empréstimo) | Op grava; Sócio pede | lancamentos, pessoas, ajustes, resultados | Bizneo (cargo, datas), ZurIA (produção, renovação, comparecimentos), planilha, manual | Recalcula ao salvar. `fn_protege_correcao` impede que uma importação mude um valor corrigido; a diferença vira conflito |
| Pessoas | Incluir pessoa | `lanc_salvar` sem id | Op; Sócio pede | lancamentos, pessoas | manual | — |
| Pendências | Fila de pendências e detalhe (diagnóstico, "Vale o sistema" / "Vale a planilha", explicar, pedir correção, concordar) | `pend_listar`, `pend_justificar`, `pend_concordar` (Sócio); `pend_analisar`, `pend_lote`, `pend_criar` (Op); `premiacao-deb`: `pend_sug_debito` (simula o débito no à vista) | Sócio responde; Op decide | pendencias (337 vivas e 213 descartadas), ajustes, resultados.premio_ajuste | automático (cálculo × planilha), manual | `recalcular` abre ou atualiza uma divergência por pessoa e por loja. `pend_prazo` dá 5 dias úteis. O job das 3h10 encerra as vencidas ("vale o sistema"). Há gatilhos de centavos, de responsável, de descarte automático e de explicação de convergência |
| Pedidos da loja | Pedidos de correção (antes e depois) | `pedidos`, `pedido_cancelar` (quem pediu), `pedido_decidir` (Op, em lote, até 300 de uma vez) | Sócio pede; Op aprova ou recusa | pedidos (4), pendencias | manual | Toda alteração do Sócio (`PEDE`: lanc_salvar, lanc_excluir, dados_loja, uc_salvar, uc_lote, movimentar, importar, importar_unidades) vira pedido. Recusa: `fn_aviso_pedido_recusado` |
| Conflitos de importação | Lista na loja e no Início | `conflitos`, `conflito_decidir` (manter a correção ou usar a fonte) | Op | conflitos_importacao (9), ajustes | importação × correção | Recalcula |
| Planos especiais | Planos (deslocamento, cobertura, extra) | `planos`, `plano_criar`, `plano_cancelar`, `plano_decidir` | Sócio pede; Op decide | planos (0 hoje), lancamentos | manual | Ao aprovar, cria o lançamento e recalcula |
| Importar dados e metas (antigo Fechamento) | Cartões por fonte; orçamento, meta e NPS por loja; publicar metas; abrir mês; forma da faixa; importar pessoas e lojas | `comp_criar`, `comp_forma`, `metas_publicar`, `importar`, `importar_unidades`, `uc_salvar` (NPS biomédica e recepção, só Op); `premiacao-metas`: `metas_publicar_sel`, `metas_orcamento`, `metas_reabrir` | Op | competencias, unidade_competencia, lancamentos, ajustes | Financeiro (orçamento), Marketing ou Op (NPS), upload de planilha | `fn_nps_replica` copia o NPS da loja para biomédicas e recepcionistas. Meta = orçamento × `meta_pct_orcamento` |
| Fechamento | Aprovar / Reabrir o mês | `aprovar`, `reabrir`, `impedimentos`, `apurar` (fica no servidor; o botão Calcular saiu em 24/11) | Op | apuracoes (61: 57 substituídas, 3 rascunhos, 1 aprovada), competencias | — | `fn_auto_aprovar` roda no banco e no servidor depois das ações da lista `AUTO`. `impedimentos(comp)` é a regra única |
| Orçamento | Orçamento das lojas (mês atual e os 2 seguintes) | `orcamentos`, `orc_salvar` | Fin, Op | unidade_competencia.orcamento, ajustes | Financeiro (manual) | Cria a competência se ela não existir. Bloqueia depois que a meta é publicada |
| Meu prêmio | Demonstrativo, régua, "como chegamos neste valor", ciência, contestação | `minha_regua` (simula na hora), `minhas_competencias`, `ciencia`, `minhas_ciencias`, `contestar` | Colab | resultados, ciencias (1), contestacoes (1) | calculado | Só aparece depois que o mês é aprovado |
| Contestações | Responder procedente ou improcedente | `contestacoes`, `contestacao_responder` | Op | contestacoes | manual | — |
| Recibos | Lista e recibo A4 (prêmio CLT, honorário PJ, bolsa de estágio), com selo "PRÉVIA" antes da aprovação | `resultados`, `ciencias` | Op, Sócio, Cont (só mês aprovado) | resultados, ciencias | calculado | — |
| Relatórios | Exportação Excel (pessoas, folha CLT, PJ, lojas, pendências, por cargo, contabilidade) | `resultados` (planilha montada no navegador) | Op, Sócio, Cont | resultados | calculado | — |
| Política | Texto e versões | `competencias` (versões), `parametros_ler` | Todos (texto); Op (parâmetros) | politica_versoes (6: 0.9, 1.0 e quatro sub-versões 1.0.1…) | manual | — |
| Configurações | Regras e limites | `parametros_salvar` | Op | politica_versoes, historico | manual | Gera sub-versão quando há mês aprovado ou quando é teste; recalcula os meses abertos |
| Configurações | Lojas | `unidade_salvar`, `unidades` | Op | unidades (56) | manual | `fn_unid_inaug` |
| Configurações | Usuários, Gerar código, Resetar senha, Ver como | `usuarios`, `usuario_salvar`, `codigo_gerar` (até 200 de uma vez), `usuario_resetar`, `ver_como` (só leitura) | Op | usuarios, sessoes | manual | — |
| Configurações | Histórico | `historico` (últimos 300) | Op | historico (1.711) | — | Toda ação grava em `log` |
| Integração RH | Carga do cadastro da Bizneo | `premiacao-import` (chave de uso único em `config.import_key_sha256`) | Claude | cadastro_rh (0), bizneo_cadastro (704), bizneo_contratos (0); pessoas.bizneo_id (488 pessoas ligadas) | Bizneo | Manual, feita por Claude |
| Motor | Cálculo da política (engine.ts) | `apurar()`: fatores de dias, quadro do 1º dia útil, metas por cargo, curvas A1, A2 e B a G, trava da loja, atestado, planos, custo por loja pagadora, data de pagamento (5º dia útil de M+2) | — | lê lancamentos, unidade_competencia, planos, vendas_dias; grava apuracoes, resultados | — | Toda gravação recalcula |

### Ações do servidor `premiacao`, agrupadas

- **Leitura**: eu, competencias, unidades, competencia, resultados, minha_regua, minhas_competencias, ajustes, orcamentos, contestacoes, pend_listar, aprovacoes, minhas_ciencias, ciencias, planos, canc_listar, canc_anexo, pedidos, avisos, conflitos. Só essas são permitidas no "ver como".
- **Loja e Op**: uc_salvar, uc_lote, dados_loja, uc_aprovar, lanc_salvar, lanc_excluir, movimentar, importar, importar_unidades, orc_salvar, contestar, pend_justificar, pend_concordar, loja_aprovar, loja_problema, ciencia, aviso_lido, pedido_cancelar, plano_criar, plano_cancelar.
- **Só Op**: plano_decidir, pedido_decidir, conflito_decidir, canc_importar, pend_lote, propria_aprovar, pend_criar, pend_analisar, contestacao_responder, parametros_ler, parametros_salvar, comp_criar, comp_forma, metas_publicar, apurar, aprovar, impedimentos, reabrir, unidade_salvar, usuarios, usuario_salvar, codigo_gerar, usuario_resetar, historico.

---

## 3. Perfis de acesso e regras

| Perfil | Usuários reais (com senha) | Vê | Pode |
|---|---|---|---|
| operacoes | 2 | Tudo, da rede inteira, inclusive o orçamento e o % que leva à meta (`meta_pct_orcamento`) | Tudo. "Ver como" qualquer usuário, só leitura |
| unidade (sócio ou gestor) | 17 (15 com mais de uma loja) | Só as lojas em `usuarios.unidades` (array de uuid), incluindo resultados em que a loja é a pagadora. **Nunca vê o orçamento nem o % da meta**: `semOrc` e `semPct` tiram esses dados da resposta | Responder pendência, concordar, aprovar a loja, apontar problema, pedir plano. **Não grava nenhum dado direto**: toda alteração vira pedido para Op. Não aprova o próprio prêmio, que Op aprova em `aprovacoes_proprias` |
| colaborador | 0 | Só o próprio CPF ou CNPJ, e só em mês aprovado | Dar ciência e contestar |
| financeiro | 0 | Lista de lojas e orçamentos; não vê resultados | Lançar orçamento no mês atual e nos 2 seguintes, até a meta ser publicada |
| contabilidade | 0 | Todas as lojas, só em mês aprovado (resultados, recibos, ciências, aprovações) | Só consulta |

Ao todo são 19 usuários reais e 11 de teste. Só 6 dos reais já criaram senha.

Regras de acesso:
- A barreira por unidade é `podeUnidade(u, id)` e os filtros no código. **Não há RLS no banco.**
- O primeiro acesso exige o código gerado por Op. Desde 23/11 o código não é mais enviado por e-mail, e a "Auditoria" tinha apontado o risco do primeiro acesso sem prova de identidade.
- A competência aprovada ou paga fica travada (`editavel`) até ser reaberta com motivo.
- O ambiente de teste só enxerga competências, unidades e usuários com `teste=true`.

---

## 4. Rotinas, automações e integrações

### Cron (`cron.job`, todos ativos)

| Job | Horário (UTC) | Comando | Situação nos últimos 7 dias |
|---|---|---|---|
| premiacao-encerrar-vencidas | 03:10 todo dia | `premiacao.encerrar_vencidas()`: pendência "com a loja" vencida há mais de 5 dias úteis é encerrada como "vale o sistema" | 5 execuções, todas ok (a última em 27/11) |
| premiacao-copia-diaria | 06:30 todo dia | `premiacao.fazer_copia(7)`: cópia em schema `premiacao_copia_AAAAMMDD`, guarda 7 | 4 ok (a última em 26/11) |
| pedidos-novo-planilha / pedidos-novo-rastreio | 10:00 e 10:20 | São do Pedidos, não da Premiação | — |
| nutra-rodada-dia-01 | dia 1 às 10:00 | Do Estoque nutra, inativo | — |

### Gatilhos do banco que agem sozinhos (41 no total)

- **Aprovação automática do mês**: `fn_trg_auto_aprovar`, disparado por aprovacoes_loja, aprovacoes_proprias, cancelamentos, pedidos, pendencias e planos. O servidor também chama `fn_auto_aprovar`.
- **Avisos ao sócio** (tabela avisos, 4 hoje): aprovação que caiu, pedido recusado, resposta ao problema apontado.
- **Pendências**: prazo de 5 dias úteis (`pend_prazo`); diferença de centavos vale o sistema (`fn_div_centavos`); responsável (`fn_pend_responsavel`); descarte automático (`fn_descartar_auto`, que leva para pendencias_descartadas); explicação de convergência; manter justificada; descrição da planilha.
- **Lançamentos**: proteção da correção (`fn_protege_correcao`, que gera conflito); NPS (`fn_nps_lancamento`); cadastro (`fn_lanc_cad`); gestora sem dias cedidos; pendência de cargo em empréstimo; fonte da planilha (`fn_planilha_fonte`); "vendeu em outra loja"; marca de dado alterado para o recálculo (`fn_marca_alterado`).

### Integrações (todas manuais, feitas por Claude; nenhuma exportação automática)

| Sistema | O que entra | Como entra | Tabelas |
|---|---|---|---|
| **ZurIA** (vendas) | Faturamento, à vista pago (dinheiro, PIX, débito), produção e renovação por vendedor, comparecimentos (KPI SDR 5031 e lista 5028), vendas por dia (5037), débito pago (5036), cancelamentos (5003), arquivos originais | Claude extrai e manda para `premiacao-rel` (`ingest*`, com chave interna) e para `canc_importar` / `importar`; vínculo de loja em zuria_unidade_map (52) | unidade_competencia.zuria_*, vendas_colaborador (474), vendas_dias (3.469), vendas_mov (7.916), vendas_debito (275), zuria_total, cancelamentos, relatorios_origem |
| **Bizneo** (RH) | Equipe, cargo pelo contrato, regime, admissão e saída, CPF ou CNPJ do PJ | `premiacao-import` com chave de uso único | bizneo_cadastro (704), cadastro_rh (vazia), bizneo_contratos (vazia), pessoas.bizneo_* |
| **Financeiro** | Orçamento mensal por loja | Tela Orçamento (perfil financeiro, sem usuário real) ou Op | unidade_competencia.orcamento |
| **Marketing** | NPS por cargo | Op digita em Importar dados e metas | unidade_competencia.nps_biomedica e nps_recepcao |
| **Planilha da loja** | Planilha prêmio (com o cálculo) e planilha financeiro (só o valor a pagar), faltas, indicações | Importação feita por Claude ou upload em Importar | lancamentos.valor_informado, valor_pago, planilha_fonte |
| **Omie** | Nenhuma integração na Premiação | — | — |
| **Contabilidade e DP** | Valor bruto, folha CLT, arquivo PJ, recibos | Exportação Excel (no navegador) | — |

Origem dos lançamentos (916 linhas): bizneo 476, zuria+bizneo 122, pagamento-out 126, planilha-out 76, manual 50, zuria_teste 39, importacao 19, zuria-5031 8.

---

## 5. Layout (a referência do sistema único)

> O site não abre a partir deste container. A descrição junta três fontes: as ações e os campos do servidor, as auditorias de 23 e 24/11 e as medições do front-end de 25/11 ("Análise dos sistemas atuais").

### Casca
- **Menu lateral fixo à esquerda, fundo navy** (#1B3A4B). Item ativo e logotipo em dourado (#C8A96E, que só tem contraste sobre o navy). Ícone mais texto.
  - No celular (até cerca de 860 px), o menu vira **barra inferior** (Início, Lojas, Pessoas, Pendências, Mais, na versão auditada em 23/11).
  - O selo de pendências no menu está quebrado: procura um item que não existe mais.
- **Cabeçalho**: título da página e **seletor de competência (mês)**. O sistema abre no mês que está sendo fechado, o mais antigo ainda não aprovado.
  - Aparece a faixa "Vendo como [usuário] — nada é gravado" quando Op usa o Ver como.
  - O botão de usuário dá acesso a Trocar senha e Sair.
- **Fonte Nunito Sans.** Hoje há 24 tamanhos de letra, alguns de 10 e 11 px. Cantos arredondados de 10 px (campos e botões) e 14 px (cartões). Cinzas de rótulo (#6B7C8A) e de borda de campo (#D5DCE2) reprovam no contraste. O detalhe da pessoa usa as cores Dr. Hair, azul-marinho e dourado.
- **Há rolagem interna em 5 áreas do /app/.** Isso contraria a regra "cabe inteira, sem rolagem lateral".

### Menu por perfil (desde 23 e 24/11)

| Perfil | Itens |
|---|---|
| Operações | Início · Pessoas · Planos especiais · Importar dados e metas (antigo Fechamento, juntado ao Início em 24/11) · Conferência com a planilha · Relatórios · Recibos · Política · Configurações |
| Sócio | Início · Pessoas · Planos especiais · Relatórios · Recibos · Política |
| Colaborador | Meu prêmio · Política |
| Financeiro | Orçamento das lojas |
| Contabilidade | Relatórios · Recibos |

Lojas, Pendências e Pedidos saíram do menu em 23/11. Hoje ficam dentro da página da loja e da fila do Início.

### Filtros globais
Os filtros ficam no Início: região, estado (UF), sócio, loja, cargo, regime e situação, mais os atalhos "Por cargo" e "Por sócio".
- Desde 24/11, região e UF vêm do cadastro da loja.
- A decisão de 21/11 diz que "o filtro escolhido vale no site todo". Na prática ele só vale no Início. No sistema único, ele vai para o cabeçalho global (unidade e mês), guardado por usuário.

### Início (redesenhado em 24/11)
1. **Linha "Falta para aprovar o mês"**. Cada item é clicável e vem de `premiacao.impedimentos()`. Para outubro, hoje: 1 loja sem orçamento, 100 pendências abertas, 35 lojas sem aprovação do sócio, 1 pedido aguardando, 6 pessoas sem CPF ou CNPJ, 9 conflitos de importação.
2. **4 cartões de indicador**: faturamento líquido (com bruto e cancelamentos), lojas que bateram a meta, prêmios (com % do faturamento) e pessoas com prêmio. Também mostra quantas pessoas conferem com a planilha.
3. **Filtros.**
4. **Tabela única de lojas, o "Quadro do mês"**: Posição · Loja · Sócio · Faturamento líquido · % da meta · Prêmios · Planilha prêmio · Planilha financeiro · Prêmios / líquido · Situação · Pendências com "Quem resolve" e prazo · Sócio aprovou. A linha abre a loja.
5. Visões recolhidas: **Por sócio** (Sócio · Lojas · Bateram a meta · Líquido · % da meta · Prêmios · Prêmios / líquido · Pendências · Aprovadas), Por cargo e **Lote por assunto** (Op).
6. Para Op, **fila "O que precisa de mim" por loja**. "Resolver" abre só os itens daquela loja.
7. Para o sócio, o mesmo quadro restrito às lojas dele, com "Você" no lugar de "Quem resolve".

### Página da loja (padrão de ficha)
- **Cabeçalho**: nome, sócio, idade da loja e o selo "inaugurada no mês".
- **Cartões**: líquido × meta, prêmios, % sobre o líquido, planilha e pagamento.
- **Ações**: Ver como o sócio, Aprovar números (sócio), Aprovar em nome do sócio (Op, com motivo), Apontar problema, + Incluir pessoa, Pedir plano.
- **Tabela "Equipe e prêmios"**: Pessoa · Vendeu no ZurIA · À vista · Base do prêmio · Prêmio do sistema · Planilha prêmio · Planilha financeiro · Situação. Clicar mostra o resumo, com "Explicar a diferença" e "Ver todos os dados".
- Também na página: pendências, pedidos e conflitos da loja; Dados do mês (números da loja mais a grade das pessoas, com uma justificativa para tudo); cancelamentos (Loja · Comanda / cliente · Valor no ZurIA · A loja disse · Valor do distrato · Venda · Explicação · Comprovante · Situação); arquivos de origem do ZurIA; aviso de "vendeu em outra loja".
- A loja fora do mês mostra quem foi lançado nela e o que fazer.

### Página da pessoa (ficha com memória de cálculo)
1. Cabeçalho: cargo, regime, loja, loja que paga e documento.
2. Selo "só no sistema" quando há correção fora do ZurIA ou da Bizneo.
3. Dados considerados no cálculo. Para PJ, aparece "não desconta" em faltas.
4. **Memória de cálculo**, em tabela: Item · Base e regra aplicada · Política · Resultado. Os passos são em tópicos, no mesmo formato.
5. Régua com a posição da pessoa.
6. Conferência: sistema × planilha prêmio × planilha financeiro.
7. Cadastro da Bizneo, com o selo "consultado em · só consulta".
8. "Esta pessoa no mês", com as outras lojas e períodos.
9. **Histórico de correções**, sempre a última seção: quem, campo, de → para, justificativa.
10. Recibo.

### Pendência (modelo que o sistema único vai copiar)
- Um item por pessoa e por loja, com tipo (divergencia, cadastro, dado, regra, pagamento_fora_regra, outro), quem resolve (Loja, Operações, Marketing, RH), prazo e situação (aberta, justificada, recusada, aceita, resolvida).
- O texto tem blocos fixos: "O QUE A PLANILHA FEZ", "O QUE A POLÍTICA MANDA (conta refeita em dd/mm)", "CORREÇÕES FEITAS NOS DADOS", "SE NÃO RESPONDER ATÉ dd/mm: vale o sistema, R$ x" e "OUTRAS QUESTÕES DESTA PESSOA". O servidor reescreve esse texto a cada cálculo.
- Respostas da loja: Concordo (vale o sistema), Explicar, Pedir correção. As decisões de Op são "Vale o sistema" e "Vale a planilha", com o valor a pagar, ou "Autorizar fora da regra".
- Para divergência de à vista, a sugestão "o débito explica" vem de `premiacao-deb`.

### Outras telas e seus padrões de tabela
| Tela | Colunas |
|---|---|
| Importar dados e metas | Cartões por fonte (modelo, envio, erros). Tabela: Loja · Orçamento · Meta · Situação da meta · NPS biomédicas (%) · NPS recepção (%). Publicar metas por loja escolhida |
| Conferência com a planilha | Pessoa · Planilha prêmio · Sistema · Diferença · Causa. Diferença por causa: Critério · Pessoas · Lojas · Diferença. Hoje a tela está sem estilo |
| Relatórios | Por cargo: Cargo · Pessoas · Com prêmio · Total · Média · Divergências. Contabilidade: Pessoa · Loja · Cargo · Prêmio do sistema · Planilha prêmio · Planilha financeiro · A pagar · Situação |
| Recibos | Pessoa · Loja · Valor · Ciência. Recibo em documento A4 com cabeçalho navy |
| Planos especiais | Pessoa · Tipo · Período / objetivo · Situação. Pedidos de correção: Pedido · Loja · Alterações · Situação |
| Política | Versão · Data · Autor · Situação · Dispositivos · Alteração e motivo |
| Configurações | Limites e parâmetros (Parâmetro · Valor · Dispositivo, 28 parâmetros na v0.9) · Usuários (Nome / e-mail · Perfil · Lojas / CPF · Situação) · Lojas (Loja · Sócio · Razão social / CNPJ · Inauguração, mais UF e região) · Histórico |

### Padrões gerais
- Valores em R$ sempre com centavos.
- Toda correção pede justificativa e grava de → para em `ajustes`.
- Toda situação aparece em selo com texto.
- Tabelas viram cartões no celular.
- Exportação Excel em toda lista.
- O Ver como mostra a tela de outro perfil sem gravar nada.

---

## 6. Dados que se repetem com outros sistemas (no mesmo banco)

| Dado | Premiação | Outros sistemas | Sobreposição |
|---|---|---|---|
| Unidades | 56 (53 reais e ativas, 3 de teste), com UF e região preenchidas em todas | Documentos `public.unidades`: 54 · Pedidos novo `pedidos_novo.unidade`: 53 (mais unidade_cnpj com vigência) · Compras 51 e Estoque nutra 51 (segundo a análise de 25/11) | **Pelo CNPJ, as 53 batem com Documentos e com Pedidos novo.** Pelo nome, só 39 de 53 batem: os nomes divergem. Não há chave comum além do CNPJ |
| CNPJs das lojas | 53 distintos (`unidades.cnpj`, texto livre) | Documentos 54 · Pedidos novo 53 | 53 de 53 iguais nos dois |
| Sócios | 12 sócios distintos no campo texto `unidades.socio`. Os usuários de perfil unidade são 17, e 15 deles têm mais de uma loja | Documentos: responsável, e-mail e senha por unidade · POPs: logins por unidade | Mesmo sócio com várias senhas |
| Pessoas | 697 em `pessoas` (189 identificadas por CNPJ de PJ, 17 sem documento "SEMCPF-"), 488 ligadas à Bizneo. Espelho da Bizneo com 704 | Pedidos novo `pessoa` (prescritores e RT, outro universo) · POPs (RT e gestora digitados) · Compras (prestadores PJ) | É a maior base de pessoas da rede; candidata a núcleo |
| Vínculos multi-loja | 41 linhas e 4 pessoas (treinadora, diretora, gestora) | — | — |
| Logins | 19 reais e 11 de teste, em `premiacao.usuarios` (senha própria) | Documentos `public.acessos`: 20 · Pedidos novo `usuario`: 2 (Supabase Auth) · POPs `pop_logins` | **17 dos 19 e-mails da Premiação também estão em Documentos**; 1 está em Pedidos novo. Há 5 modelos de login diferentes na rede |
| Mapa ZurIA → loja | `zuria_unidade_map`: 52 | Pesquisa ZurIA e Estoque | — |
| Histórico / auditoria | `premiacao.historico` 1.711 e `ajustes` 599 | `public.historico`, `pedidos_novo.evento`, `legado_log` | Auditoria separada em cada sistema |
| Cópias / backups | 4 schemas de cópia e 4 tabelas `bkp_*` | `public.bak_20261105_*` | Sem política de guarda única |

---

## 7. Problemas conhecidos e decisões já tomadas (documento-mestre e auditorias)

### Decisões em vigor (resumo)
- **Meta** = 90% do orçamento, publicada antes do mês. O sistema nunca mostra isso fora de Op ("meta é meta").
- **Trava**: a meta inteira da loja é condição para qualquer pessoa receber.
- **Idade da loja** com corte no dia 15. No mês da inauguração, a meta não é reduzida (o orçamento já vem proporcional).
- Proporção em **dias corridos**.
- A meta individual é fixada pelo quadro do 1º dia útil; a de quem já estava só pode baixar.
- **Gestora** que entrou no meio do mês: meta e faturamento só do período, usando as vendas diárias do ZurIA.
- **Diretoras**: valor fixo na meta e em 120%, ou um % próprio. Não aprovam o próprio prêmio.
- **Treinadora** recebe 0,5% da produção das consultoras e a **técnica** 0,2% da renovação das biomédicas. A única condição é a meta da loja.
- **Captadora**: comparecimento pelo KPI SDR 5031 ("Atendido" mais ficha ou orçamento). Captadora por comparecimento recebe valor fixo por comparecimento. DOCA dividido em partes iguais.
- **NPS** ×1,3 só no 1º mês da loja. O NPS vem do Marketing e é lançado por loja e cargo.
- **À vista** é só o recebido de fato (dinheiro, PIX, débito), sem proporção de dias.
- **CLT**: faltas, suspensão e afastamento reduzem por dia; atestado reduz só o prêmio fixo, e a tela mostra com e sem atestado. **PJ** não tem desconto por falta.
- **Cancelamentos** vêm só do ZurIA, e o sistema só mostra.
- **Arredondamento**: nada é arredondado. Diferença de 1 centavo vale o sistema; acima disso abre pendência.
- **Fontes**: ZurIA e Bizneo são só para consulta, nunca alterados. A importação é sempre feita por Claude.
- **Correções**: a correção feita no sistema, com justificativa, prevalece sobre a importação. A diferença vira conflito que Op decide.
- **Cadastro**: PJ pelo CNPJ, CLT pelo CPF. O cargo vale pelo contrato (Bizneo).
- **Pendências**: uma por pessoa e por loja. Ficam com a loja até ela responder; sem resposta em 5 dias úteis, vale o sistema. O prazo conta uma vez.
- **Pedidos**: o sócio não altera nada direto; tudo vira pedido.
- **Aprovação**: o sócio aprova uma vez, e o mês aprova sozinho quando nada impede (uma regra só, `impedimentos`). Os valores aprovados não se perdem, porque fica a cópia da apuração ligada a cada aprovação.
- **Pagamento**: competência M é apurada em M+1 e paga no 5º dia útil de M+2. A contabilidade recebe o valor bruto.
- **Duas planilhas**: planilha prêmio (com cálculo) e planilha financeiro (só o valor). `valor_pago` é sempre a planilha financeiro.
- **Recálculo** só no servidor, ao salvar ou ao ler quando algo mudou. Não há mais botão Calcular.
- **Telas**: abrir a loja mostra todas as pendências dela. A tela tem que caber inteira, sem rolagem lateral. A memória de cálculo tem que ser legível por leigo.
- **Testes** nunca alteram dado real.
- Ficam em aberto pelo documento: as competências 2026-10 e 2026-11 estão "apuradas" com a política v0.9 e faixa forma 2. A v1.0 vale a partir de dez/2026.

### Problemas conhecidos (ainda abertos)
1. **Sem git e sem RLS.** O acesso por unidade depende só do código. O motor está copiado em duas funções (`premiacao` e `premiacao-deb`).
2. **Outubro não fecha** (impedimentos de hoje): 100 pendências abertas (68 com a loja, 22 com Op, 10 com Marketing, 1 com RH), 35 lojas sem aprovação (13 já aprovaram), 1 loja sem orçamento, 6 pessoas sem CPF ou CNPJ, 9 conflitos, 1 pedido aguardando.
3. **Quem resolve**: a fila entende só Loja ou Operações, mas há pendências com Marketing e RH sem usuário. A etiqueta por área ainda depende de decisão.
4. **Perfis sem uso**: colaborador, financeiro e contabilidade não têm nenhum usuário real. Só 6 de 19 usuários criaram senha. Criar acesso para cerca de 400 colaboradores um a um não é viável; a proposta é gerar em lote a partir da Bizneo.
5. **Cópias de apuração pesadas** (61 apurações e 27 mil linhas de resultado). Já foram apagadas 134 em 24/11. Ainda há backups soltos (`bkp_*`) e 4 schemas de cópia.
6. **Telas**: rolagem interna em 5 áreas; 24 tamanhos de letra; 3 cores reprovam no contraste; a Conferência com a planilha está sem estilo; o filtro não vale no site todo; o selo do menu está quebrado; as telas antigas (/ e /novo/) continuam no ar; há rotas duplicadas (Início, Pessoa e Política definidas duas vezes).
7. **Contestação procedente não corrige nada**: o valor continua o mesmo e o prazo não é controlado.
8. **Cancelamentos**: o desconto da planilha continua até Marcelo validar loja por loja (pode estar em dobro). Desde agosto há cancelamentos sem valor no ZurIA.
9. **Texto da pendência acumula "ATUALIZAÇÃO EM…"**. A proposta é ter três partes fixas e um histórico em linha do tempo.
10. **Memória de cálculo**: pode mostrar ÷31 quando o motor usou uma base de 30 dias (`dias_base`).
11. **Relatórios Excel montados no navegador** com biblioteca externa. A folha e o arquivo PJ precisam refletir o valor decidido; isso já está coberto por `premio_ajuste` desde 22/11.

### Decisões pendentes com Marcelo
- Quando a loja para de mandar o valor calculado na planilha.
- Quando ligar a aprovação tácita do sócio, e com qual prazo.
- As pendências de Marketing, DP, RH e Financeiro ficam na fila de Op com a área como etiqueta?
- As decisões de política da rede que ainda faltam (NPS sem dono a partir de dez/2026, estagiárias com R$ 750 fixos, cancelamentos sem valor no ZurIA).
- A Premiação só entra no login único (Fase 5 do sistema único) com autorização expressa, entre o fechamento de uma competência e a abertura da seguinte. Até lá ela fica intacta. **Ela é a referência de layout, e nada nela é alterado agora.**
