# Lista de aceite — troca do Laboratórios (Pedidos antigo → novo)

Situação em 28/11/2026. Fontes: desenho global (Fase 2 e regras do Laboratório em A.2), levantamento `inv-pedidos.md` (§3 e §8),
decisões do dono D1–D25. Roteiro do dia: `ROTEIRO-TROCA.md`.

Legenda: **pronto** = feito e conferido no sistema novo · **falta** = trabalho ainda a fazer · **depende do dono** = precisa de decisão ou ação do dono.

## A. Regras do Laboratório (testes de aceite da Fase 2)

| # | Regra | Estado | Como foi conferido / o que falta |
|---|---|---|---|
| A1 | Parcela só quita com as 3 baixas (Omie, planilha, nosso sistema) | pronto | migrations 0006/0007; parcelas por situação iguais ao retrato (334 quitadas, R$ 2.277.952,95) |
| A2 | Planilha do laboratório exigida só na 1ª parcela | pronto | `ficha.planilha_so_primeira` (0007) |
| A3 | Injemed só com a nossa baixa | pronto | `ficha.baixas` do laboratório INJ |
| A4 | Baixa sem comprovante só quando a Omie já baixou | pronto | ação `baixar_sem_comprovante` |
| A5 | Robôs 1 vez ao dia | pronto | planilha 07:00 e rastreio 07:20 (função `conectores`, chave no Vault) |
| A6 | Nenhuma data inventada (previsão só a do laboratório) | pronto | regra de 27/11; as 2 datas estimadas foram apagadas |
| A7 | D14 — somar todas as NFs, inclusive abaixo de R$ 500,00 | pronto | 28/11: não há regra de R$ 500 no novo (SQL e funções). A regra do antigo (`omie-sync`: NF < R$ 500 não entrava no campo "NF" do pedido) não foi migrada. As 7 NFs abaixo de R$ 500 (9 ligações a pedidos, R$ 1.212,82) entram na conta. Recalculadas as 484 conferências: **0 mudanças** (319 conferidos, 60 com diferença) |
| A8 | Preço conferido com a tabela vigente na data de emissão da NF | pronto | `conferir_pedido_nf` (0016); reproduz as 58 divergentes do antigo |
| A9 | Bonificação (CFOP 5910/6910) soma quantidade, não valor | pronto | `conferir_pedido_nf` |
| A10 | NF cancelada cancela só as parcelas sem pagamento | pronto | função `omie` |
| A11 | Ligação NF → pedido: carta de correção, xPed, número, nome do anexo | pronto | carta de correção, mapa, xPed e nº do pedido: prontos. As cartas de correção saíram do código e estão na ficha do laboratório (0018). Campo "NF" do antigo: as 364 ligações do antigo conferem no novo (0 faltando, 28/11); para as próximas, botão "Ligar NF"/"desligar" na ficha do pedido, com justificativa e histórico. Nome do anexo: os 846 anexos com nº de NF no nome já estão ligados; no novo a unidade só anexa comprovante, e os anexos da Omie já vêm com o nº da NF |
| A12 | Prazo de 30 dias só marca atraso | pronto | `prazo_envio_dias` |
| A13 | Retirada em Sorocaba conta como entregue | pronto | robô `rastreio` |
| A14 | Quality sem ano: ano deduzido pela emissão | pronto | conferido no rastreio completo de 28/11: 312 pedidos entregues, ano certo em todos (inclusive 2025); 310 com a mesma data do recebimento registrado; 2 diferentes explicados (DH-2026-0036: "seguiu junto" usava a data do pedido da outra NF, corrigido; DH-2026-0223: segunda NF entregue depois, recebimento mantido) |
| A15 | Campo "crédito" do pedido de venda | pronto (regra) | `divergencias_pv` trata o crédito; o PV continua sendo lido fora do sistema (D5) |
| A16 | Receita pela média de N meses (N = 3) | pronto | `gerar_receitas_mes`; 33 de 51 iguais ao antigo, as 18 diferenças explicadas |
| A17 | Arredondar para cima em múltiplos de 50 | pronto | idem |
| A18 | minox-2 → minox-05 e complexo → pillfood fora do código | pronto | `laboratorio.ficha.receita_trocas` |
| A19 | Protocolo Antigo/Novo e rascunho vazio para unidade sem pedido | pronto | `unidade_protocolo` (53) |
| A20 | Receita gerada **automaticamente às 06:05 do dia 01** | falta / depende do dono | hoje só por botão (com prévia). Para a troca: agendar a rotina, ou o dono confirmar que fica no botão |

## B. O que o antigo faz e o novo precisa fazer (inv-pedidos §3 e §8)

| # | Item | Estado | Observação |
|---|---|---|---|
| B1 | Criar pedido (central e a partir da receita) | pronto | 0015; em teste gera TST-… |
| B2 | Receitas do mês (cálculo, ajuste, RT, pedido a partir da receita, saldo) | pronto | 51 receitas de 11/2026 |
| B3 | Cadastros (prescritores, RTs, termos, protocolo, sócio) | pronto | no núcleo; configurações (etapas, formas, tipos de anexo) fixas no código |
| B4 | Pedido de venda e conferência pedido × NF recalculada | pronto | 63 divergências de PV + 60 de NF na fila Notas e PV |
| B5 | **Arquivos do antigo** (1.326 anexos / 188,8 MB + 24 Injemed / 9,2 MB; bucket `backups` fica fora) | depende do dono | o dono está decidindo se os arquivos ficam onde estão. Se for copiar: cabe no plano grátis (arquivos do projeto novo 409,7 MB + 198 MB ≈ 608 MB de 1 GB; banco 173 MB, limite à parte). Falta a chave do projeto antigo para ler os arquivos (buckets privados) |
| B6 | Omie: tarefa "Sincronizar Portal Omie" enviando para a função `omie` do novo | depende do dono | a tarefa roda no computador do dono; trocar endereço e chave no dia |
| B7 | Rastreio "seguiu junto" e "rastreio completo" | pronto | "seguiu junto" com a regra do antigo (frete zero, mesma emissão e unidade de NF entregue; empate pela NF de número vizinho); conferido com o antigo: mesmos 4 casos. "Rastreio completo": botão "Rastreio da Quality" na tela Pedidos (relatório do robô diário e do completo); 328 pedidos em 41 s, nenhuma data alterada |
| B8 | Usuários: 21 do antigo | falta / depende do dono | D25 conferido: senhas em bcrypt `$2a$10$`, compatível; 18 logins (17 em `membros` + 1 fora), 4 membros sem login (criam senha), 2 já existem no novo. Falta: o dono definir o papel de cada um; copiar no dia; tela de gestão de usuários |
| B9 | Avisos | pronto | D9: só na tela |
| B10 | Cópia de segurança diária (D2) | depende do dono / falta | condição do dono para a troca; conferir que está rodando |
| B11 | Sincronização final | falta (parcial) | preparado: `troca_diferencas()` e o roteiro. Hoje: 183 pedidos, 3 NFs, 62 históricos e 6 arquivos mudaram no antigo depois da cópia. Falta: criar no novo, com o número do antigo, os pedidos que só existem lá (hoje DH-2026-0471 e 0472) |
| B12 | Não desligar o projeto antigo inteiro (Nutra, Compras e membros moram nele) | pronto | regra no roteiro, passo 1 |

## C. Preparação da troca

| # | Item | Estado | Observação |
|---|---|---|---|
| C1 | D13 — vale o DH do antigo; os só-do-novo acima do maior; número anterior guardado | pronto (simulado) | `troca_laboratorios`: 53 renumerados (46 CP + 7 Injemed → 0473–0479); 0 diferentes depois; próximo DH-2026-0480 |
| C2 | Busca pelo número anterior na tela | pronto | a busca de Pedidos e de Pagamentos olha também o número anterior; a ficha mostra "Nº anterior" |
| C3 | Apagar pedidos TST e ligar a numeração oficial | pronto (simulado) | na mesma função; hoje há 0 pedidos de teste |
| C4 | Retrato antes/depois (pedidos, parcelas, pagamentos, NF, receitas) | pronto | `troca_retrato()`; simulação com tudo igual; `nucleo/conferencia/retrato-antes/depois-0017-2026-11-28.json` |
| C5 | Reconciliação em 3 níveis (linhas, R$ por situação, hash) | pronto | refazer no dia, depois da sincronização |
| C6 | Funções publicadas com o CORS do Cloudflare (`operacoes-drhair`) | falta (parcial) | `pedidos-historico` v6 publicada e testada; `pedidos-api` v10 pronta no repositório, falta publicar |
| C7 | Site no Cloudflare Pages | depende do dono | conta grátis com verificação em duas etapas (D4) |
| C8 | Teste do dono no site de teste | depende do dono | condição do dono |
| C9 | Restauração testada num projeto à parte | falta | portão da Fase 2 |
| C10 | Teste "Contagem e Compras continuam funcionando com o Pedidos congelado" | falta | fazer no dia, logo depois do congelamento |
| C11 | Pacote de treinamento por papel | falta | portão da Fase 2 |
| C12 | Pendências de conferência: 2 datas de recebimento (DH-2026-0014 e 0211), PVs iguais (0352/0353), provável pedido duplicado (125076 e 125076-2) | depende do dono | ficam na fila; não travam a troca |
| C13 | Janela da troca: entre os dias 05 e 20, longe de 14/12 e do recesso | depende do dono | |
