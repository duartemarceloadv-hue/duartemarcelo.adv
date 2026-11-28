# Sistema de Pedidos Dr. Hair (novo)

Reconstrução do zero do sistema de pedidos aos laboratórios (Centro Paulista, Injemed e próximos),
conforme o documento de decisão do conselho de 26/11/2026.

## Onde mora

- **Banco:** Supabase `drhair-documentacao-imoveis` (banco único do Sistema Dr. Hair), na área isolada `pedidos_novo`.
  Nenhuma tabela dos outros sistemas (Documentos, POPs, Premiação) é alterada.
- **Sistema atual:** continua funcionando no projeto `pedidos-centro-paulista`, intocado, até a virada aprovada.

## Decisões já tomadas

| Tema | Decisão |
|---|---|
| Quem pede | No início a central pede e a unidade confirma o recebimento; a unidade passa a pedir na fase 2 |
| Quem paga | Cada unidade (CNPJ) paga o seu |
| Pagamento | A parcela só finaliza com **3 baixas**: Omie (controle do laboratório), planilha do laboratório e nosso sistema (comprovante, ou baixa sem comprovante quando a Omie já baixou). Falta Omie: pedir ao laboratório. Falta planilha: pendência de informação. Injemed não tem Omie/planilha: só vale a nossa baixa (ficha.baixas). A planilha do Centro Paulista só registra a 1ª parcela ("Data Pagto" por pedido): da 2ª em diante valem Omie + nossa baixa (ficha.planilha_so_primeira) |
| Aprovação | Pedido não precisa de aprovação |
| Prazo do laboratório | 30 dias corridos (não há prazo contratado) |
| Prescritor | Só o RT do termo da unidade com o laboratório |
| Receita | Limita a quantidade pelo saldo (no começo só avisa) |
| Paciente | Em alguns casos; identificado por código, nunca pelo nome |
| Nº interno | DH-AAAA-NNNN (TST-AAAA-NNNN para pedido criado no ambiente de teste) |
| Alertas | E-mail e tela do sistema |

## Estrutura (migrations)

- `0005_omie_e_controle_do_laboratorio.sql` (substituída) `0006_tres_baixas.sql` e `0007_planilha_so_primeira_parcela.sql`: situação da parcela pelas 3 baixas.
  Em 27/11/2026 as datas de pagamento da planilha "Dr Hair - controle Edu" foram gravadas nas 1ªs parcelas sem baixa
  (65 parcelas, registro de alterações com por = `importacao-planilha-cp`).
- `0012_usa_nucleo.sql` e `0013_receitas_e_termos.sql`: ver "Núcleo, Receitas do mês e Termos" abaixo.
- `supabase/migrations/0001_pedidos_novo_base.sql`: cadastros, pedido, receita com saldo, parcela × pagamento,
  nota fiscal, pendências, execução dos conectores, situação calculada (`v_pedido`, `v_parcela`),
  registro de alterações imutável e isolamento total (RLS em tudo, sem acesso pela internet).

## Ambiente de teste (primeira versão funcionando)

| Peça | Onde |
|---|---|
| Telas (Início, Pedidos, Pagamentos, ficha) | `web/` — HTML/CSS/JS puros, mesmo visual do `modelo/`; publicar a pasta no site Netlify `pedidos-novo-drhair` |
| API | função `pedidos-api` do Supabase (`supabase/functions/pedidos-api/index.ts`), exige login |
| Acesso | `supabase/migrations/0004_acesso.sql`: os 2 administradores e o bucket privado `pedidos-novo` |

**Entrar:** e-mail + senha temporária (entregue à parte, nunca no repositório) → o sistema obriga a trocar a senha →
quem é administrador ou financeiro cadastra um aplicativo autenticador (código de 6 números) → telas.

**Quem vê o quê:** `admin`, `central`, `financeiro`, `leitura` veem todas as unidades (ou só as do papel, se a unidade estiver preenchida);
`unidade` e `socio` veem só as unidades do papel. `leitura` não grava. Desde 27/11/2026 os papéis estão em `nucleo.usuario_papel` (módulo `laboratorios`).

**O que grava nesta versão** (tudo passa pelo registro de alterações, com o e-mail de quem fez):
- *Confirmar recebimento* (na ficha): data não pode ser futura nem antes do envio; não vale para cancelado/rascunho.
- *Anexar comprovante* (na ficha ou marcando parcelas em Pagamentos): PDF/JPG/PNG/XML até 10 MB, uma unidade por comprovante,
  não deixa pagar mais do que falta, avisa se o mesmo arquivo já foi enviado.
- *Gerar cobrança de baixa*: só monta o texto para copiar e mandar ao laboratório; não envia nada.

Ações da API (POST com `acao`): `sessao`, `trocar_senha`, `inicio`, `pedidos`, `pedido`, `pagamentos`,
`confirmar_recebimento`, `anexar_comprovante`, `baixar_sem_comprovante`, `cobranca_baixa`, `abrir_arquivo`,
`editar_pedido`, `cancelar_pedido`, `reabrir_pedido` (só admin), `salvar_parcela`, `cancelar_parcela`, `produtos`, `salvar_itens`
(desde 27/11/2026 as correções pedem justificativa; ver "Criar pedido e Notas e PV").
`unidades` (lista das unidades do usuário para o seletor do cabeçalho; 27/11/2026) e `inicio` aceita `unidade_id`.

**Casca e ficha (27/11/2026):** a tela segue o kit do sistema único (menu lateral navy com Laboratórios › Pedidos / Pagamentos,
cabeçalho fixo de 56 px com seletor de unidade que vale em todas as telas e fica guardado no navegador, Nunito Sans em 4 tamanhos,
5 cores de situação, sem rolagem interna; no celular o menu vira barra inferior). A ficha do pedido é página própria
(`#pedido/<id>`) e segue "uma informação, um lugar só": cabeçalho (número, unidade, laboratório, situação, total) → O que falta →
Itens → Entrega (envio, previsão, saída, rastreio, recebimento) → Pagamento (boleto e comprovante na própria parcela) →
Notas fiscais (DANFE, XML, Portal Omie, conferência) → Outros anexos → Do sistema antigo (só campos que não existem no novo) →
Histórico (eventos do sistema novo e do antigo mesclados por data). A função `pedidos-historico` devolve também `campos`
(dados do sistema antigo com nomes fixos) e `novos` (registro de alterações do sistema novo em texto).

**Edição (27/11/2026):** dados do pedido, cancelamento com motivo (nada é apagado), parcelas (lançar, corrigir, cancelar;
parcela com comprovante não pode ser cancelada nem ficar menor que o pago) e itens (preço sugerido pela tabela vigente na data do envio).

## Núcleo, Receitas do mês e Termos (27/11/2026)

O Laboratórios passou a usar o **núcleo** (`sistemas/nucleo/`, schema `nucleo`): unidades, empresas/CNPJ, pessoas (RT, prescritor, sócio),
logins e papéis. Migrations `0012_usa_nucleo.sql` e `0013_receitas_e_termos.sql` (aplicadas); funções `pedidos-api` v7 e `pedidos-historico` v3 (publicadas);
telas em `web/` (**não publicadas**).

- **Unidade = uuid de `public.unidades`.** `pedido.unidade_id` e `pagamento.unidade_id` foram re-apontados pela equivalência `nucleo.unidade_ref`
  (id antigo do Laboratórios → id do núcleo). `receita`, `termo` → `nucleo.unidade` / `nucleo.pessoa`.
- `pedidos_novo.unidade`, `unidade_cnpj`, `unidade_alias`, `pessoa` e `usuario` agora são **views de compatibilidade** sobre o núcleo, com as mesmas colunas:
  os robôs `conectores` e `omie` continuam iguais (não foram republicados).
- **Acesso** vem de `nucleo.usuario_papel` por `nucleo.acesso(email, 'laboratorios')`, com o mesmo comportamento: admin/financeiro exigem o
  app autenticador; unidade/sócio só veem as unidades do papel; leitura não grava. O financeiro **não vê receitas** (mestre §7).
- **Conferência** (`sistemas/nucleo/conferencia/`): retrato antes e depois idênticos — 484 pedidos (R$ 5.248.612,23), 541 parcelas
  (R$ 3.647.979,81, mesmas quantidades e somas por situação), 83 pagamentos (R$ 757.184,76), mesmas somas por unidade, ids/atualizado_em/nº DH dos pedidos iguais.

**Receitas do mês** (menu Laboratórios › Receitas do mês):
- 51 receitas de 11/2026 importadas do antigo (10 rascunho, 40 geradas, 1 enviada ao RT), 327 itens (149 com ajuste feito no antigo, sem motivo registrado lá).
  Quem assina foi ligado ao núcleo **só pelo registro no conselho**: 23 ligadas; nas outras 28 o antigo dizia "PREENCHER" ou nada (o texto fica em "Do sistema antigo").
- Regra do dia 01 **migrada como está** (`pedidos_novo.gerar_receitas_mes`): pedidos CP não cancelados dos últimos N meses (N = 3, do config do antigo),
  soma por produto ÷ meses com pedido com itens, para cima em múltiplos de 50, minox-2 → minox-05 e complexo → pillfood; cria em rascunho; não
  sobrescreve ajuste; unidade sem pedido ganha rascunho vazio. **Só por botão** ("Gerar receitas do mês", com prévia antes de gravar) — nenhuma rotina agendada.
  Conferência com o antigo para 11/2026: mesmas quantidades em 33 das 51 unidades; as 18 diferenças vêm dos itens/datas dos pedidos, que no sistema
  novo foram corrigidos pela NF/Omie depois do cálculo do antigo (05/11).
- Fluxo Rascunho → Gerada (assina o RT do termo vigente; sem termo, não gera) → Enviada ao RT (só marca a data; **nenhum e-mail**).
  Ajuste de quantidade pede justificativa e fica no registro de alterações. "Criar pedido" a partir da receita: liberado desde 27/11/2026 para receita gerada ou enviada ao RT (ver "Criar pedido e Notas e PV").

**Termos** (menu Laboratórios › Termos): 36 termos de responsabilidade com o Centro Paulista do checklist das clínicas (status OK), com RT,
data de emissão e nome do arquivo; o **arquivo continua no sistema antigo** até a cópia dos arquivos. Injemed: o antigo não tinha termo preenchido.
Protocolo clínico (Antigo/Novo) das 53 unidades em `pedidos_novo.unidade_protocolo`, como estava no antigo.

**Cadastros** (menu Cadastros, só Operações/administrador): Unidades, Pessoas e Pendências de cadastro — ver `sistemas/nucleo/README.md`.

Novas ações da API: `receitas`, `receita`, `gerar_receitas` (`simular`), `ajustar_receita`, `receita_status`, `termos`, `cad_unidades`, `cad_unidade`,
`cad_salvar_unidade`, `cad_pessoas`, `cad_pessoa`, `cad_salvar_pessoa`, `cad_buscar_pessoa`, `cad_pendencias`, `cad_decidir_pendencia`.
As telas novas são arquivos próprios (`web/receitas.js`, `web/cadastros.js`) carregados pela casca (`app.js` expõe `window.DH`).

**Teste** (dados fictícios, Playwright 1366×768 e 390×844): 416 verificações, sem erro no console, sem rolagem horizontal nem interna,
só 4 tamanhos de letra, nada repetido nas fichas.

## Criar pedido e Notas e PV (27/11/2026 — entregas para a virada)

Migrations `0015_criar_pedido.sql` e `0016_notas_e_pv.sql` (aplicadas; a 0016 em duas partes: `pedidos_novo_0016_notas_e_pv` e
`pedidos_novo_0016b_carga_notas_e_pv`). Funções `pedidos-api` **v9** e `pedidos-historico` **v5** (publicadas). Telas novas em `web/`
(`novo-pedido.js`, `notas.js`, ajustes em `app.js`, `receitas.js`, `index.html`, `app.css`) — **não publicadas** (o dono publica no Netlify).

**Conferência dos dados (retrato antes × depois, `sistemas/nucleo/conferencia/retrato-*-0015/0016-2026-11-27.json`):** iguais —
484 pedidos (R$ 5.248.612,23), 541 parcelas (R$ 3.647.979,81, mesmas somas por situação), 83 pagamentos (R$ 757.184,76), 377 NFs,
1.599 itens de NF, 51 receitas, 325 itens de receita; hash linha a linha igual em pedido, item, parcela, pagamento, NF, receita e cópia do antigo.
Registros novos só os previstos: 63 + 60 itens da fila e o parâmetro de teste.

### Criar pedido (Laboratórios › Pedidos › Novo pedido, e "Criar pedido" na ficha da receita)
- Nasce em **rascunho**: unidade, laboratório, receita do mês e itens. Pela receita, os itens vêm do **saldo** da receita
  (receita − o que outros pedidos não cancelados dela já pediram) e a receita fica ligada ao pedido (`pedido_receita`); quem assinou a receita
  (RT do termo) é o prescritor do pedido. Preço = tabela vigente no dia (produto sem preço aparece marcado).
- **Centro Paulista exige receita** do mês já gerada (assinada pelo RT do termo); receita em rascunho não pode ser usada. Passar do saldo
  **só avisa** (pede "estou ciente" no envio). Mudar os itens que vieram da receita pede **justificativa**.
- Como no antigo, a criação **não pede forma de pagamento nem parcelas** (vêm depois, do laboratório/Omie), e **nenhuma data é inventada**:
  a previsão fica em branco até o laboratório informar.
- **Confirmar envio**: grava a data de envio (hoje), gera o número e registra no histórico ("Envio confirmado: nº …").
  Cancelar rascunho pede motivo (nada é apagado).
- **Numeração** (`pedidos_novo.proximo_num_interno`): DH-AAAA-NNNN por ano, sempre maior que o maior número do ano no sistema novo,
  na cópia do antigo e no contador do antigo (`interno_dh`); trava no banco + tabela `numeracao` + número único: dois envios ao mesmo tempo
  nunca repetem número. Hoje o próximo oficial seria **DH-2026-0478** (conferido numa simulação desfeita).
- **Ambiente de teste** (enquanto o sistema antigo estiver em uso): a tela mostra "Ambiente de teste — o pedido não é enviado ao laboratório";
  o pedido fica com `teste = true` e recebe número **TST-AAAA-NNNN** (o prefixo de teste que o antigo já usava), para não gastar números DH
  que o antigo ainda está emitindo. A marca de teste não pode ser trocada depois.
  **Antes da virada:** `select pedidos_novo.apagar_pedidos_teste();` (apaga só `teste = true`, com itens, parcelas, comprovantes de teste,
  ligações e fila; não toca nos 484 migrados) e `update pedidos_novo.parametro set valor = 'false' where chave = 'criar_pedido_teste';`
  (a partir daí o número é DH).
- **Correções com justificativa:** editar dados, itens ou parcela de pedido já enviado passou a exigir justificativa, que vai para o
  registro de alterações (`evento.justificativa`, a mesma ideia do núcleo) e aparece no Histórico da ficha. Cancelamentos usam o motivo.

### Notas e PV (Laboratórios › Notas e PV; contadores no Início)
- **Conferência pedido × NF** (`pedidos_novo.conferir_pedido_nf`, recalculável): a mesma regra do antigo (função `conferir()` do
  `omie-sync`): soma as NFs não canceladas do pedido; bonificação (CFOP 5910/6910) soma quantidade e não valor; item do pedido × vendido
  (+ bonificado); item da NF fora da tabela; preço × tabela vigente na emissão; frete; valor (com ou sem frete); cobrado pelo laboratório
  (parcelas da Omie) × NF; tolerância de R$ 0,50. Recalcula pelo botão "Recalcular conferência", ao editar itens/frete/parcelas e na decisão "Corrigido".
- **Resultado:** 319 pedidos conferidos, **60 com diferença**. Reproduz **as 58** divergentes do antigo (58 de 58) e acrescenta 2:
  DH-2026-0130 e DH-2026-0131 (pedidos 125076 e 125076-2), porque no sistema novo a NF 70511 está ligada aos dois pedidos e a soma deles
  (R$ 37.350,00) não bate com a NF (R$ 18.675,00) — provável pedido duplicado. Conferidos: 320 no antigo × 319 no novo porque as NFs 76659
  e 74978 não têm itens no sistema novo (pedidos DH-2026-0354 e 0371) e o 125076-2 passou a ser conferido.
- **Adaptações (para reproduzir com os dados do novo):** (1) o "valor do pedido" do antigo era um campo da planilha/PV que o novo não tem:
  o valor agora é itens + frete do sistema novo, e o valor do antigo entra como linha própria "Valor informado no sistema antigo" nos
  pedidos migrados (é o que mantém as 15 divergências que no antigo eram só de valor); (2) NF ligada a mais de um pedido confere o grupo
  junto (no antigo cada NF tinha um pedido só); (3) "tabela vigente desde" mostra 23/07/26 (o antigo repetia o mesmo preço com data 27/07/26).
- **Divergências com o pedido de venda (PV):** as **63** abertas no antigo foram trazidas como estavam (o PV era lido fora do sistema e o antigo
  só guardou as diferenças, então não há como recalcular). Na tela, cada linha "campo: sistema A · pedido de venda B" vira colunas e mostra
  o que o sistema tem **hoje** (igual ao PV / diferente / sem este dado no sistema novo). A regra do `importar-pv` ficou pronta em
  `pedidos_novo.divergencias_pv(pedido, pv)` para quando o PV for lido no sistema novo.
- **Fila** (`pedidos_novo.divergencia`): uma linha por pedido e diferença, com dono (Operações; "Laboratório" quando marcada para cobrar).
  Decisões, sempre com justificativa: **aceitar a diferença**, **cobrar o laboratório** (continua aberta, com o laboratório) ou **corrigido**
  (na NF o sistema confere de novo e só aceita se a diferença sumiu). Item da NF fecha sozinho quando a conferência passa a bater; se
  mudar, o antigo vira "substituído" e entra um novo. Administrador pode reabrir. Lista em colunas com filtros (tipo, situação, com quem,
  laboratório, busca) + filtro de unidade do cabeçalho; cada item abre com pedido × nota (ou × PV) lado a lado, documentos (DANFE/XML/PV),
  decisão, histórico e botão **Próxima**. O financeiro vê só a parte da NF (o PV tem prescritor e CRBM).

Novas ações da API: `np_opcoes`, `np_receitas`, `np_criar`, `np_rascunho`, `np_salvar`, `np_enviar`, `notas_lista`, `notas_item`,
`notas_decidir`, `notas_recalcular`; `editar_pedido`, `salvar_itens` e `salvar_parcela` (edição) agora exigem `justificativa`.

**Teste** (dados fictícios, Playwright 1366×768 e 390×844): 774 verificações (as 594 anteriores, com as telas de edição pedindo justificativa,
e as novas de Novo pedido, rascunho, envio, receita → pedido, fila Notas e PV, decisão, Próxima e Início), sem erro no console, sem rolagem
horizontal nem interna, só 4 tamanhos de letra, uma informação por célula.

**Fora desta entrega:** ler o PDF do pedido de venda dentro do sistema (continua fora; a regra está pronta); copiar os arquivos do antigo
(DANFE/PV do antigo aparecem como "no sistema antigo"); ligar a numeração oficial (só na virada, depois de apagar os pedidos de teste).

## Robôs (conectores)

Função `conectores` (`supabase/functions/conectores/index.ts`), chamada pelo pg_cron 1 vez ao dia (decisão de 27/11/2026),
com a chave guardada no Vault (`pedidos_novo_cron_key`; no código só o SHA-256). Cada execução fica em
`pedidos_novo.execucao_conector` (lidos, aplicados, erros, resumo) e cada alteração no registro de alterações
(por = `robo-planilha-cp` / `robo-rastreio-quality`). Teste sem gravar: corpo `{"acao": "...", "simular": true}`.

| Robô | Quando (Brasília) | O que faz |
|---|---|---|
| `planilha` | 07:00 | Lê a planilha "Dr Hair - controle Edu" (aba 1). Etapa do laboratório e previsão do lab. (histórico em `etapa_lab`), previsão do pedido = a da planilha (nunca inventada; regra do dono 27/11/2026), saída do laboratório só quando vazia, observação só quando vazia, liga NFs ao pedido, "Data Pagto" = baixa na planilha da 1ª parcela. Pedidos da planilha que não existem no sistema viram alerta. |
| `rastreio` | 07:20 | Consulta a Quality por NF + CNPJ da unidade (pedidos do Centro Paulista não recebidos). Grava situação do rastreio, saída (se vazia) e entrega (quando todas as NFs foram entregues). Retirada em Sorocaba = entregue. |
| Omie | — | Ainda depende da tarefa "Sincronizar Portal Omie" (computador do dono), que hoje envia só ao sistema atual. |

**Regra: nenhuma data inventada (27/11/2026).** Previsão só a informada pelo laboratório; o prazo de 30 dias serve
apenas para marcar atraso. As 2 datas de recebimento estimadas na migração (envio + 2 dias) foram apagadas
(DH-2026-0014 e DH-2026-0211, ficam para confirmar).

## Preparação da troca (28/11/2026)

- **D14 (somar todas as NFs):** conferido. O sistema novo não tem regra de R$ 500,00 (SQL e funções `omie`/`conectores`); a regra do antigo
  (`omie-sync`: NF < R$ 500 não entrava no campo "NF" do pedido) não foi migrada. As 7 NFs abaixo de R$ 500 (9 ligações a pedidos, R$ 1.212,82)
  já entram na conferência. Recalculadas as 484: **0 mudanças** (319 conferidos, 60 com diferença). Nenhuma migration foi necessária.
- **Migration `0017_troca_preparada.sql`** (aplicada como `pedidos_novo_0017_troca_preparada`; não muda dados): `num_interno_anterior`,
  `troca_retrato()`, `troca_diferencas()` e `troca_laboratorios(p_simular)` (apaga TST, renumera D13, liga a numeração oficial; simulação desfaz tudo).
  Simulação de 28/11: 53 renumerados, próximo DH-2026-0480, tudo igual antes/depois. Roteiro: `ROTEIRO-TROCA.md`; lista de aceite: `aceite-troca.md`.
- **CORS do Cloudflare Pages** (`operacoes-drhair.pages.dev` e prévias `*.operacoes-drhair.pages.dev`), mantendo o Netlify: `pedidos-historico` **v6 publicada**
  (testada: aceita as duas origens e o Netlify, recusa outras); `pedidos-api` **v10 no repositório, ainda não publicada**.
- **Arquivos do antigo:** cópia suspensa (o dono decide se os arquivos ficam onde estão). Levantamento em `aceite-troca.md`, item B5.
