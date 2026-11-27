# Inventário — Pedidos aos laboratórios (Centro Paulista e Injemed)

Levantamento somente leitura feito em 27/11/2026 (SELECT no banco, leitura das edge functions e do repositório).
Sem dados pessoais: só contagens. "Antigo" = sistema em uso; "Novo" = `pedidos_novo`.

---

## 1. Onde está cada versão

| | ANTIGO (em uso) | NOVO (quase pronto) |
|---|---|---|
| Site | Netlify `pedidos-drhair` (plano dev, publicado à mão; **código-fonte da tela não está no repositório** e o site não pôde ser lido daqui — telas abaixo foram inferidas do banco e das funções) | Netlify `pedidos-novo-drhair` (pasta `sistemas/pedidos/web`, HTML/CSS/JS puros) |
| Banco | Supabase `ckgsdvhkpnrrmctlqtma` ("pedidos-centro-paulista"), schema `public` | Supabase `xqxjmeioodmdhxhivyqu` ("drhair-documentacao-imoveis", banco único), schema `pedidos_novo` |
| Modelo de dados | **Documentos JSON** em `docs(col,id,data)` + histórico `logs`. As tabelas `pedido`, `pedido_item`, `pedido_parcela`, `pedido_arquivo` são **cópia estática** feita por `sincronizar_base_unica()` em 21/11 (não são atualizadas). Injemed em tabelas próprias `inj_*` | Relacional: unidade/CNPJ/apelido, laboratório (ficha jsonb), produto/preço com vigência, pedido/itens, parcela × pagamento, NF × pedido, etapa do lab, pendência, receita, termo, registro de alterações imutável (`evento`), arquivo somente leitura do antigo (`legado_*`) |
| Arquivos | buckets `anexos` (1.320 arq., 189 MB), `injemed` (24, 9 MB), `backups` (12, 21 MB) | bucket privado `pedidos-novo` (comprovantes novos); os 1.152 arquivos migrados **apontam para os buckets do antigo** (`legado-cp:anexos` 1.132, `legado-inj:injemed` 20) |
| Código | Edge functions no projeto antigo (sem repositório) | `sistemas/pedidos/supabase/{migrations 0001–0011, functions}` |
| Mesmo projeto também tem | Estoque Nutra (`nut_*`, em uso), restos de Compras (`cmp_*`, piloto) e Reembolso (`reb_*`, vazio) | Documentos/Imóveis (`public`), POPs, Premiação (`premiacao` + cópias diárias), `nutra` (já criado) |

### Contagens e datas máximas — ANTIGO

| Tabela / coleção | Registros | Última alteração |
|---|---|---|
| docs:pedidos (fonte real dos pedidos CP) | 479 | 26/11 20:29 UTC |
| docs:omieNF (NFs lidas do Portal Omie) | 385 | 26/11 15:57 |
| docs:clinicas (unidades, RTs, checklist de documentos) | 53 | 21/11 |
| docs:prescritores | 48 | 20/11 |
| docs:receitas (receitas mensais) | 51 (todas de 2026-11: 40 Gerada, 10 Rascunho, 1 Enviada ao RT) | 25/11 |
| docs:insumos (produtos + vigências de preço) | 13 | 05/10 |
| docs:config (automacoes, geral, interno_dh, interno_tst, receitas) | 5 | 26/11 |
| logs (histórico) | 6.178 (pedidos 5.618, receitas 415, clínicas 145) | 26/11 20:29 |
| inj_contratos / inj_pedidos / inj_insumos / inj_modelos / inj_unidades / inj_log / inj_receitas | 1 / 6 / 4 / 2 / 4 / 36 / **0** | 18/11 |
| membros (logins do sistema) | 21 (3 admin, 18 leitura com unidades) | 25/11 |
| auth.users | 18 (14 entraram em novembro; último 26/11) | — |
| pedido / item / parcela / arquivo (cópia de 21/11) | 481 / 1.551 / 480 / 1.057 | 21/11 |
| pedidos por origem | planilha 412, omie 62, receita 3, interno 2 | — |
| sitPag (situação de pagamento antiga) | PAGO 350, PENDENTE 87, CANCELADO 33, SOLICITADO 8, LINK ENVIADO 1 | — |
| confNF (conferência pedido × NF) | 320 conferidos: 262 conferem, **58 divergentes** | — |
| pendPV (divergências com pedido de venda) | **63 abertas** | — |
| dataPedido | de 07/10/2025 a 26/11/2026 | — |

### Contagens — NOVO (`pedidos_novo`)

pedido 484 (CP 477, INJ 7; maior nº DH-2026-0477) · pedido_item 1.805 · parcela 541 · pagamento 83 (89 ligações a parcelas) ·
nota_fiscal 377 (1.599 itens, 382 ligações NF×pedido) · arquivo 1.152 · etapa_lab 320 · unidade 53 / CNPJ 53 / apelido 71 ·
produto 17 / preço 20 · evento (registro) 9.744 (último 27/11 02:50) · execucao_conector 5 (planilha 3, rastreio 1, omie 1) ·
legado_doc 1.033 / legado_log 6.178 / legado_tabela 76 · usuario 2 (admin) · auth.users 2 ·
**vazias:** pessoa, termo, receita, receita_item, pedido_receita, pendencia.
Situação das parcelas (v_parcela): quitada 334, a vencer 70, falta planilha 61, falta Omie 40, vencida 20, falta baixa no sistema 10, cancelada 6.

### Rotinas agendadas (`cron.job`)

| Banco | Rotina | Horário (UTC → Brasília) | O que chama | Ativa |
|---|---|---|---|---|
| Antigo | planilha-horaria | 15 10-22 * * * → de hora em hora 07:15–19:15 | `chamar_automacao('planilha')` | sim |
| Antigo | rastreio-manha / rastreio-tarde | 10:00 e 17:00 → 07:00 e 14:00 | `chamar_automacao('rastreio')` | sim |
| Antigo | receitas-dia-01 | 09:05 dia 1 → 06:05 dia 1 | `gerar_receitas()` | sim |
| Antigo | backup-semanal | domingo 06:00 → 03:00 | `chamar_automacao('backup')` (último 22/11) | sim |
| Antigo | nut-rodada-dia-01 | dia 1 10:00 | Estoque Nutra | sim |
| Antigo | compras-limpar-orfaos / compras-reposicao-diaria | 06:17 / 09:20 | Compras (piloto) | sim |
| Novo | pedidos-novo-planilha | 10:00 → 07:00 | `chamar_conector('planilha')` | sim |
| Novo | pedidos-novo-rastreio | 10:20 → 07:20 | `chamar_conector('rastreio')` | sim |
| Novo | nutra-rodada-dia-01 | dia 1 10:00 | Nutra (preparado) | **não** |
| Novo | premiacao-* (2) | — | Premiação | sim |

Omie nos dois: não é cron do banco; é a tarefa "Sincronizar Portal Omie" no navegador do dono (já logado no portal), que hoje envia **só ao antigo** (`omie-sync`). A função `omie` do novo aceita o mesmo formato; carga inicial feita em 27/11.

---

## 2. Edge functions do ANTIGO (ações aceitas)

| Função | Autenticação | Ações / entrada | O que faz | Equivalente no novo |
|---|---|---|---|---|
| `automacoes` | cabeçalho x-cron (**chave fixa no código**) ou login de membro editor | `rastreio`, `planilha` (`simular`), `backup` | Rastreio Quality; leitura da planilha do lab (CSV público do Google) — atualiza **e cria** pedidos; backup JSON semanal (mantém 12) | `conectores` (`planilha`, `rastreio`, `simular`). Backup: **não** |
| `rastreio` | x-cron (chave fixa no código) | `{de, qtd}` (lotes) | "Rastreio completo": reconsulta todos os pedidos com NF, inclusive entregues; relatório de não encontradas, sem baixa, em trânsito | parcial (o conector só consulta não recebidos) |
| `omie-sync` | x-omie (hash SHA-256; 2 chaves aceitas) | corpo `{docs[], mapa{}, anexar[], conf[], reconferir, lote}` | Liga NF→pedido (carta de correção, XML `xPed`, nº no pedido, nome do anexo); cria pedido a partir da NF (emissão ≥ 01/09/2026); remove NF cancelada; links do portal; anexa DANFE/XML/boleto; reconstrói parcelas da Omie preservando dados nossos (comprovante, pagoDH); marca PAGO; **conferência pedido × NF** (itens, bonificação CFOP 5910/6910, frete, valor, preço × tabela vigente na emissão) | `omie` (mesmo formato): NF, ligação, parcelas, baixa Omie, boleto/linha, arquivos, itens. Conferência pedido×NF e criação de pedido a partir da NF: **parcial/não** (conferência antiga só visível na seção "Sistema antigo") |
| `importar-pv` | x-omie | `{pedidos:{num:{prescritor,crbm,dataReceita,arquivo,dataPedido,forma,frete,total,itens,outros,credito,notas,b64}}, dry}` | Recebe pedido de venda do lab **já lido fora do sistema** (sessão do Claude): preenche só campos vazios, anexa o PDF, registra divergências em `pendPV` | **não** |
| `anexar-manual` | x-omie | `{arquivos:[{ped,nome,cat,tipo,b64,por,obs}]}` | Anexa comprovante/pedido de venda/receita/NF/boleto em lote | parcial (`anexar_comprovante` na tela, só comprovante) |
| `anexar-termo` | x-omie | `{termos:[{cli,nome,emissao,b64}]}` | Anexa o termo de responsabilidade do lab (CP) ao cadastro da unidade e marca o item do checklist "OK" | **não** (tabela `termo` vazia) |
| `contas` | login admin | `status`, `redefinir` (`primeiro` desativado 26/11 por segurança) | Lista contas e último acesso; admin cria/troca senha de membro | parcial (troca de senha obrigatória + MFA; sem tela de gestão de usuários) |
| `ler-documento` | login + `cmp_perfis` | `{tipo: fornecedor/pedido/contrato, base64|texto}` | Leitura por IA (Anthropic) — **pertence ao Compras**, não a Pedidos | n/a |
| `limpar-orfaos` | JWT | — | Limpa bucket `compras` (Compras) | n/a |
| `anexo-leitura`, `importar-temp` | — | — | **Desativadas** (respondem 410) | n/a |

Funções SQL do antigo usadas por pedidos: `gerar_receitas`, `receitas_completar_unidades`, `proximo_interno` (DH-AAAA-NNNN e prefixo de teste TST), `proximo_num_interno`, `doc_update`, `is_admin/is_editor/is_membro`, `minhas_unidades`, `pode_ver_doc/anexo/log`, `chamar_automacao`, `sincronizar_base_unica`.

---

## 3. MATRIZ DE FUNCIONALIDADES do sistema ANTIGO

Telas: nomes inferidos (código da tela não disponível). Quem usa: Central = admins/operações-compras; Unidade = membros "leitura" com unidades.

| Módulo | Tela (inferida) | Função | Quem usa | Tabelas | Origem do dado | Automação | No NOVO? |
|---|---|---|---|---|---|---|---|
| Pedidos CP | Lista de pedidos | Listar/filtrar por unidade, situação, etapa, pagamento | Central; Unidade (só as suas) | docs:pedidos | planilha do lab, Omie, digitação | — | **sim** (Pedidos, filtros, "só com ação") |
| Pedidos CP | Ficha do pedido | Ver dados, itens, parcelas, anexos, histórico | Central; Unidade | docs:pedidos, logs | todos | — | **sim** (+ seção "Sistema antigo" com histórico/links/confNF) |
| Pedidos CP | Novo pedido | Criar pedido interno (DH-…), também a partir da receita | Central | docs:pedidos, config:interno_dh | digitação / receita | `proximo_interno` | **não** ("Novo pedido ainda não faz parte desta versão") |
| Pedidos CP | Ficha | Editar dados (nº lab, datas, rastreio, frete, obs) | Central | docs:pedidos | digitação | log automático | **sim** (`editar_pedido`) |
| Pedidos CP | Ficha | Cancelar / reabrir | Central | docs:pedidos | digitação / planilha (statusLab) | — | **sim** (com motivo; reabrir só admin) |
| Pedidos CP | Ficha | Itens por produto (quantidades) e fonte dos itens (pedido de venda / NF) | Central | docs:pedidos.itens, insumos | PV, NF, digitação | omie-sync, importar-pv | **sim** (`salvar_itens`, preço pela tabela vigente) |
| Pedidos CP | (automático) | Criar/atualizar pedido pela planilha do laboratório | — | docs:pedidos, logs | planilha Google "controle" | **de hora em hora** 07:15–19:15 | **parcial**: 1x/dia; **não cria** pedido (vira alerta); só preenche campos vazios |
| Pedidos CP | (automático) | Etapa e previsão do laboratório (statusLab, previsaoLab, obsLab) | — | docs:pedidos | planilha | planilha | **sim** (`etapa_lab` com histórico) |
| Pedidos CP | (automático) | Pedido criado a partir da NF Omie | — | docs:pedidos | Portal Omie | omie-sync | **não** |
| Rastreio | Ficha / lista | Situação Quality por NF+CNPJ, saída, entrega; retirada em Sorocaba; NF "seguiu junto" com outra | Central; Unidade | docs:pedidos (quality, qualityNF, envio, entregue) | site da Quality | **2x/dia** + "rastreio completo" manual | **parcial**: 1x/dia; sem "seguiu junto" e sem rastreio completo |
| Recebimento | Ficha | Registrar recebimento na unidade | Central (unidade só lê) | docs:pedidos.entregue | rastreio / digitação | rastreio | **sim** (`confirmar_recebimento`, validações) |
| Financeiro | Ficha / Pagamentos | Parcelas do pedido (manuais + da Omie), boleto, linha digitável | Central | docs:pedidos.parcelas, omieNF | Omie, digitação | omie-sync | **sim** (`salvar_parcela`, `cancelar_parcela`, NF/boleto ligados) |
| Financeiro | Ficha | Anexar comprovante de pagamento | Central | docs:pedidos.anexos + bucket | upload / anexar-manual | — | **sim** (1 unidade por comprovante, não paga a mais, aviso de duplicado) |
| Financeiro | Lista | Situação de pagamento do pedido (sitPag/dataPag/dataPagLab) | Central | docs:pedidos | planilha "Data Pagto", Omie, digitação | planilha, omie | **sim, com outra regra** (3 baixas por parcela) |
| Financeiro | Resumo | finLab: pago/aberto/vencido segundo o laboratório | Central | docs:pedidos.finLab | Omie | omie-sync | **parcial** (situação por parcela; sem resumo "segundo o lab") |
| Financeiro | — | Cobrar baixa do laboratório | Central | — | — | — | **sim/novo** (`cobranca_baixa`, só monta o texto) |
| NF | Ficha | NFs do pedido, links do Portal Omie, DANFE/XML | Central; Unidade | docs:omieNF, pedidos.links/anexos | Omie | omie-sync | **sim** (nota_fiscal, link, chave, arquivos) |
| NF | Ficha | Conferência pedido × NF (itens, bonificação, frete, valor, preço × tabela) | Central | pedidos.confNF | Omie XML + insumos.vigencias | omie-sync | **parcial** (só leitura do resultado antigo; não recalcula) |
| Pedido de venda | Ficha | Anexo do PV + divergências PV × sistema (pendPV) | Central | pedidos.pedidoVenda/pendPV | PDF do lab lido fora (Claude) | importar-pv | **não** (63 pendências abertas sem lugar) |
| Receitas | Receitas do mês | Gerar receita mensal por unidade (média dos últimos N meses, arredonda p/ múltiplos de 50) | Central | docs:receitas, config:receitas | pedidos | **dia 01 06:05** `gerar_receitas` | **não** (tabelas vazias, sem rotina, sem API) |
| Receitas | Receitas do mês | Ajustes, assinante (RT), status Rascunho → Gerada → Enviada ao RT; pedido a partir da receita | Central | docs:receitas, logs | digitação | — | **não** |
| Cadastros | Clínicas | Unidade, razão, CNPJ, cidade, sócio, protocolo (Antigo/Novo), abertura | Central | docs:clinicas | digitação | — | **parcial** (unidade/CNPJ/apelidos; sem sócio, protocolo, abertura) |
| Cadastros | Clínicas | RTs (43 ativos + 18 encerrados), RT/CRBM do termo | Central | docs:clinicas.rts/rtsEnc/rtTermo | digitação | — | **não** (`pessoa` vazia) |
| Cadastros | Clínicas | Checklist de documentos da unidade (317 itens) com anexos e histórico | Central | docs:clinicas.docs/anexos/hist | upload | anexar-termo | **não** (vai para o sistema de Documentos; 114 de 155 arquivos já estão lá) |
| Cadastros | Prescritores | 48 prescritores (CRBM, unidades, apelidos, mescla) | Central | docs:prescritores | digitação / PV | importar-pv | **não** |
| Cadastros | Insumos | 13 produtos, ordem, protocolos, vigências de preço (24) | Central | docs:insumos | digitação | — | **sim** (produto 17, preço 20 vigências) |
| Cadastros | Configurações | Etapas, formas de pagamento, tipos de anexo, URL da planilha, janela de meses da receita | Admin | docs:config | digitação | — | **parcial** (ficha do laboratório; resto fixo no código) |
| Injemed | Contrato (pedido mãe) | Contrato com itens, condição, pagamento | Central | inj_contratos | digitação | — | **sim** (como pedido mãe, migrado) |
| Injemed | Pedidos Injemed | 6 pedidos: itens, parcelas, NF, rastreio, anexos | Central | inj_pedidos | digitação / PDF Injemed | — | **sim** (lab INJ, só a nossa baixa) |
| Injemed | Modelos/termo | Modelos de documentos (2) com versões | Central | inj_modelos + bucket injemed | upload | — | **não** (só no arquivo `legado_tabela`) |
| Injemed | Unidades Injemed | 4 unidades com código de cliente e termo | Central | inj_unidades | digitação | — | **parcial** (unidade sim; termo/código não) |
| Injemed | Receitas Injemed | receitas por paciente/sessões (estrutura pronta) | — | inj_receitas | — | — | **não** (0 registros no antigo também) |
| Histórico | Ficha | Histórico de alterações por pedido/clínica/receita | todos | logs | todas as fontes | todas | **sim** (`evento` novo + `legado_log` leitura) |
| Acesso | Usuários | Membros, admin/leitura, unidades; criar/trocar senha | Admin | membros, auth | digitação | contas | **parcial** (2 usuários; papéis prontos; sem tela de gestão) |
| Backup | — | Backup JSON semanal, 12 cópias | — | bucket backups | docs+logs | **semanal** | **não** (banco único: avaliar backup do plano Pro) |

---

## 4. Regras de negócio

**3 baixas (novo, decisão de 26–27/11/2026)** — a parcela só fica *quitada* com: (1) baixa na **Omie** (controle do laboratório), (2) baixa na **planilha** do laboratório, (3) **nossa** baixa (comprovante que cobre o valor, ou "baixa sem comprovante" só quando a Omie já baixou). Quais baixas valem está em `laboratorio.ficha.baixas`: CP = omie+planilha; **Injemed = nenhuma do lab** (só a nossa). CP: `planilha_so_primeira` — a planilha só tem "Data Pagto" por pedido, então só a 1ª parcela exige planilha. Situações: quitada / falta_omie (pedir ao lab) / falta_planilha (pendência de informação) / falta_baixa_sistema / vencida / a_vencer / cancelada. No antigo a regra era por pedido (`sitPag`), e "Data Pagto" da planilha marcava PAGO direto.

**Receitas do dia 01 (antigo)** — `gerar_receitas()` todo dia 1 às 06:05: para cada unidade, soma os itens dos pedidos não cancelados dos últimos N meses (config `receitas.meses`, padrão 3, máx 24), divide pelos meses em que a unidade teve pedido com itens, arredonda **para cima em múltiplos de 50**; troca minox-2 → minox-05 e complexo → pillfood; protocolo da unidade (Antigo/Novo). Cria em "Rascunho" (não sobrescreve ajustes), e `receitas_completar_unidades` cria rascunho vazio para unidades sem pedido. Fluxo: Rascunho → Gerada → Enviada ao RT (assinante), e pedido pode nascer da receita (3 pedidos `origem=receita`). Novo: decisão "receita limita a quantidade pelo saldo (no começo só avisa)"; prescritor = **só o RT do termo** da unidade.

**Rastreio Quality** — consulta por NF + CNPJ da unidade (cada NF separada quando o pedido tem várias). Situações: ENTREGUE, EM TRÂNSITO, EM ROTA sem baixa (>3 dias), NÃO ENCONTRADA, NÃO RASTREADA (NF confirmada por anexo/Omie/confNF, mas outra transportadora). Retirada em Sorocaba (planilha) = entregue na data de envio. Antigo: grava saída só se vazia, entrega quando todas as NFs entregues; NF de frete zero, mesma emissão e mesma unidade de outra NF entregue = "seguiu junto". A Quality não mostra o ano: deduz pela emissão da NF. Novo: mesma base, 1x/dia, só pedidos CP não recebidos.

**Termos** — termo de responsabilidade da unidade com o laboratório (CP) era item do checklist da clínica (`anexar-termo`); RT/CRBM do termo em `rtTermo/crbmTermo` (36/34 unidades). Injemed: termo em `inj_unidades.termo` e modelos em `inj_modelos`. Novo: tabela `termo` criada, vazia; "Termo de Fornecimento" e certidão vão para a pasta da unidade no sistema de Documentos (decisão do dono).

**NF** — uma NF pode valer para vários pedidos e vice-versa; ligação pela carta de correção (2 casos fixos no código), pelo nº do pedido impresso no XML, pelo campo NF ou pelo nome do anexo; NF cancelada sai do pedido e cancela só parcelas sem pagamento; NF < R$ 500 não é somada ao pedido (antigo); bonificação (CFOP 5910/6910) soma quantidade mas não valor; preço confere com a tabela **vigente na data de emissão**.

**Boletos** — vêm da Omie (parcela k/N da NF, nº do boleto, linha digitável, link do portal); 131 arquivos "Boleto" no antigo; novo: 516 parcelas ligadas à NF/boleto, 192 com linha digitável. Dados nossos na parcela (comprovante, quem pagou) nunca são sobrescritos pela Omie.

**Outras** — nº interno DH-AAAA-NNNN (prefixo TST para teste); sem aprovação de pedido; prazo do lab 30 dias corridos só para marcar atraso; **nenhuma data inventada** (previsão só a do lab); cada unidade (CNPJ) paga o seu; paciente só por código; planilha nunca sobrescreve observação ou dado corrigido à mão (antigo compara com a última leitura `plan`).

---

## 5. Perfis de acesso

| Antigo (`membros` + RLS por função) | Novo (`usuario.papel`) |
|---|---|
| **admin** (3): tudo + contas | **admin**: tudo, reabrir pedido (2 cadastrados) |
| **editor** (membro ativo não-leitura): grava tudo, roda automações | **central**, **financeiro**: gravam; veem todas as unidades ou as de `unidades` |
| **leitura** com `unidades` (18): só vê pedidos/clínicas/NFs das suas unidades | **leitura**: vê, não grava · **unidade**, **socio**: só as suas unidades |
| Senha definida pelo admin (`contas`); sem MFA | Senha temporária + troca obrigatória; **MFA obrigatório** para admin/financeiro; tudo via API com chave de serviço (RLS fechada) |

---

## 6. Integrações e uso de IA

| Integração | Antigo | Novo |
|---|---|---|
| Planilha Google do lab ("controle") | CSV público, de hora em hora, cria e atualiza | 1x/dia, não cria pedido, só campos vazios + etapa/previsão + Data Pagto da 1ª parcela |
| Portal Omie (CP) | tarefa no navegador do dono → `omie-sync` | função `omie` pronta; a tarefa ainda envia só ao antigo |
| Quality Entregas | site público (HTML) | idem |
| Google Drive/Documentos | — | unidade ligada ao sistema de Documentos (`doc_unidade_id`, 53/53) |
| E-mail | — | decidido (alertas por e-mail e tela), **não implementado** |

**IA / leitura de documentos:** não há IA dentro do sistema de pedidos. A leitura de pedidos de venda, comprovantes e termos era feita **fora**, em sessões do Claude, e o resultado entrava por `importar-pv`, `anexar-manual`, `anexar-termo` (logs "Claude (comprovantes)" 5, "Claude (conferência)" 1, "Pedido de venda do laboratório" 174). A única leitura por IA no servidor (`ler-documento`, API da Anthropic) é do **Compras** (perfis `cmp_perfis`), com esquemas fornecedor/pedido/contrato — candidata a ser reaproveitada no sistema único (pedido de venda, NF, comprovante, receita).

---

## 7. Dados que se repetem com outros sistemas

| Dado | Onde aparece | Contagem / cruzamento |
|---|---|---|
| Unidades + CNPJ | antigo `docs:clinicas` 53; `inj_unidades` 4; `cmp_unidades`/`cmp_empresas` 51; `nut_socios` 51 · novo `pedidos_novo.unidade` 53 (+71 apelidos); `public.unidades` (Documentos) 54; `premiacao.unidades` 56; `nutra.unidades` 51 | Os **53 CNPJs** de pedidos estão nos 3 (Pedidos, Documentos, Premiação); 53/53 unidades de pedidos já ligadas ao Documentos; 43 unidades têm pedido |
| Pessoas / prescritores / RTs | antigo `prescritores` 48, RTs 43 + 18 encerrados; `premiacao.pessoas` 697; `reb_pessoas` | 41 dos 48 prescritores têm o mesmo nome em `premiacao.pessoas`; `pedidos_novo.pessoa` vazia |
| Logins | antigo `membros` 21 / auth 18; `cmp_perfis` 6; novo `usuario` 2 / auth 2; `nutra.membros` 21; `premiacao.usuarios` 19 reais (30 com teste); `public.unidades` (login por unidade, 16 e-mails); `pop_logins` 117 acessos | Dos 21 do antigo: 21 em nutra, 17 em Premiação, 8 no Documentos, 6 no Compras, 2 no novo → **5 bases de login diferentes** para as mesmas pessoas |
| Produtos/insumos | `docs:insumos` 13, `inj_insumos` 4, `cmp_produtos`, `nut_produtos`; novo `produto` 17 | mapeamento por regex no código (omie, omie-sync) |
| Documentos das unidades | checklist das clínicas (317 itens, 155 arquivos fora de pedidos) × sistema de Documentos | 114 idênticos já no Documentos, 35 são comprovantes já no novo, 3 com outra versão, 2 vão para Contagem |

---

## 8. O que falta para desligar o antigo

1. **Criar pedido** no novo (hoje bloqueado na tela) — sem isso a central continua no antigo.
2. **Receitas mensais**: modelo, cálculo do dia 01, ajustes, assinatura do RT, pedido a partir da receita, saldo (51 receitas de nov/26 + config de meses).
3. **Cadastros sem lugar**: prescritores (48), RTs e termos por unidade, protocolo/sócio da unidade, configurações (etapas, formas, tipos de anexo).
4. **Pedido de venda**: anexar + registrar divergências (63 `pendPV` abertas) e **conferência pedido × NF** recalculada (58 divergentes).
5. **Documentos (arquivos)**: copiar 1.344 arquivos / ~207 MB dos buckets do antigo — depende do **Supabase Pro** (banco único já usa ~853 MB de 1 GB). Hoje o novo só aponta para o antigo: desligar o antigo quebra os anexos.
6. **Omie**: trocar o destino da tarefa "Sincronizar Portal Omie" para a função `omie` e retirar a chave antiga aceita.
7. **Robôs**: decidir frequência (antigo: planilha de hora em hora, rastreio 2x/dia; novo: 1x/dia) e se a planilha volta a criar pedidos; rastreio "seguiu junto" e rastreio completo.
8. **Usuários**: 21 no antigo × 2 no novo — definir papéis (as 18 contas de unidade) e tela de gestão.
9. **Alertas por e-mail** (decidido, não feito) e backup.
10. **Sincronização final**: congelar o antigo e trazer o que mudou após 26/11 05:33 UTC (**276 pedidos alterados**, 2 novos, histórico e anexos); `importar-legado` refaz a cópia.
11. **Não desligar o projeto inteiro**: o Estoque Nutra (`nut_*`, em uso) e o Compras piloto moram no mesmo projeto — migrar Nutra antes (área `nutra` já existe no banco único, rotina ainda desativada).

---

## 9. Problemas conhecidos

- **Números internos diferentes entre antigo e novo**: 43 pedidos têm DH-… diferente nos dois sistemas, e DH-2026-0469 a 0472 designam pedidos **diferentes** (no antigo: 2 de receita e 2 internos criados em 26/11; no novo: pedidos do lab 136115–136216). 5 pedidos do antigo (origem receita/interno) não têm par no novo. Risco de confusão em comunicação com unidades e lab — definir qual numeração vale antes da virada.
- **Chave fixa no código** das funções `automacoes` e `rastreio` do antigo (x-cron) — qualquer um com o código chama as automações; o novo guarda a chave no Vault.
- Rotina `compras-limpar-orfaos` envia chave pública no comando, e a função exige JWT — provavelmente falha (conferir).
- `omie` (novo) e `omie-sync` (antigo) aceitam a **chave antiga** até a tarefa ser atualizada; `importar-pv`, `anexar-manual`, `anexar-termo`, `importar-legado` usam a mesma chave x-omie para tudo.
- Tabelas `pedido*` do antigo estão **desatualizadas** desde 21/11 (cópia estática) — não usar como fonte.
- Novo: anexos migrados dependem dos buckets do antigo; tabelas `pessoa`, `termo`, `receita`, `pendencia` vazias; sem criação de pedido; 2 datas de recebimento a confirmar (DH-2026-0014 e 0211); conferir PVs iguais em DH-2026-0352/0353; 37 arquivos repetidos (45 cópias extras).
- Planilha do lab: só registra a 1ª parcela; colunas identificadas por nome (mudança de cabeçalho quebra a leitura); planilha precisa estar pública por link.
- Quality não informa o ano (inferido); NFs de outra transportadora ficam "não rastreadas".
- Backup semanal do antigo grava só registros (não os arquivos).
- Código da tela antiga não está em repositório (publicado à mão no Netlify).
- 5 cadastros de login separados para as mesmas pessoas (ver seção 7).
