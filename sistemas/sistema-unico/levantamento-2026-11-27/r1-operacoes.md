# Rodada 1 – Proposta de OPERAÇÕES (usuária principal)

Fontes: inv-pedidos.md (IP), inv-documentos.md (ID), inv-premiacao.md (IPR), inv-compras-reembolsos-nutra.md (IC), pesquisa-mercado.md (PM), premissas.md.

## 1. Como é a minha manhã hoje (e quantos sistemas abro)

| Hora | O que faço | Onde | Volume real |
|---|---|---|---|
| 1 | Pedidos: ver o que mudou na planilha do lab e no rastreio | Pedidos antigo (`pedidos-drhair`), pois o novo ainda não cria pedido (IP §8.1) | 276 pedidos alterados no antigo depois de 26/11 (IP §8.10) |
| 2 | Pagamentos: conferir as 3 baixas por parcela | Pedidos novo (`v_parcela`), Omie pelo navegador do dono, planilha Google do lab | falta planilha 61, falta Omie 40, vencidas 20, falta baixa no sistema 10 (IP §1) |
| 3 | Divergências de pedido de venda e de NF | Antigo (o novo não tem lugar para elas) | 63 `pendPV` abertas, 58 conferências pedido × NF divergentes (IP §1, §3) |
| 4 | Documentos vencendo | Documentação dos imóveis, com a chave de admin compartilhada | 37 vencidos, 90 vencem em 60 dias, sem nenhum alerta (ID §A Números, Problemas 1) |
| 5 | Premiação de outubro | Premiação `/app/` | 100 pendências (68 com a loja, 22 comigo, 10 Marketing, 1 RH), 35 lojas sem aprovação do sócio, 9 conflitos, 6 pessoas sem CPF/CNPJ (IPR §7.2) |
| 6 | Rodada Nutra | Estoque Nutra (legado) | 54 respostas de 50 unidades, 4 unidades com envio duplicado, rodada vira em 01/12 e o painel antigo tem filtro fixo `nov-2026` (IC §3.1, §6.1–6.3) |

São **5 sites e 7 bases de login** para as mesmas pessoas (ID §D "Logins"; IP §7). E várias tarefas nem estão em sistema: pedido de venda lido numa sessão do Claude e enviado por `importar-pv` (174 registros, IP §6); Omie sincronizada pelo navegador do dono (IP §1); termos anexados por `anexar-termo` (IP §2).

## 2. O que me obriga a pular de sistema

1. **Mesmo dado, vários cadastros**: unidade em 8 lugares, RT em 4 sem ligação, sócio em 4 como texto (ID §D). Quando muda o RT, atualizo POPs, checklist antigo e prescritores à mão.
2. **Pendência sem o documento ao lado**: para resolver "falta planilha" preciso abrir a planilha do lab; para "divergência PV" preciso do PDF e do pedido; para documento vencido preciso descobrir quem cobrar.
3. **Cobrança fora do sistema**: os avisos de Documentos (258) são escritos à mão (ID §A); a cobrança de baixa do lab só "monta o texto" (`cobranca_baixa`, IP §3).
4. **Sem autoria**: no Documentos tudo sai como "Operações" (ID §A Perfis 2). Não sei quem da equipe fez o quê.

## 3. Tela inicial: "O que precisa de mim hoje"

Uma única fila, com todos os módulos, ordenada por prazo e por quem está esperando (PM §4.6, padrão 2). Nada de cartões decorativos.

**Linha 1 – contadores clicáveis por módulo** (mesmo formato do "Falta para aprovar o mês" da Premiação, IPR §5 Início):
Pagamentos (131) · Divergências de pedido (121) · Documentos (37 vencidos / 90 a vencer) · Premiação outubro (100) · Nutra (4 envios duplicados; unidades sem resposta) · Receitas do mês.

**Linha 2 – tabela única** com as colunas: Prazo · Módulo · Unidade · O que falta · Quem resolve · Valor (R$ com centavos) · Ação. Uma linha por pendência, sem repetir informação (premissas).

**Abas salvas**: "Comigo", "Com a unidade", "Com o laboratório", "Vencendo esta semana". O filtro de unidade do cabeçalho vale aqui e no site todo.

O sócio vê a mesma tela restrita às lojas dele, com "Você" no lugar de "Quem resolve" (IPR §5 Início item 7).

## 4. Resolver dentro da própria pendência (sem abrir outra tela)

Cada linha abre um painel com: o documento em visualização, os dados já preenchidos e no máximo 2 botões de decisão, com justificativa obrigatória quando é correção manual.

| Pendência | O painel mostra | Botões |
|---|---|---|
| Parcela "falta Omie" (40) | parcela, boleto, comprovante, última leitura da Omie | "Cobrar laboratório" (envia o texto já montado e registra) · "Baixa sem comprovante" só se a Omie já baixou (premissas) |
| Parcela "falta planilha" (61) | linha da planilha lida no dia, Data Pagto vazia | "Cobrar laboratório" · "Marcar como informado" com justificativa |
| Parcela "falta baixa no sistema" (10) | comprovante sugerido pelo valor e data | "Confirmar baixa" (1 clique) |
| Divergência PV (63) / NF (58) | PDF do PV ou da NF lado a lado com o pedido, item que diverge destacado, preço da tabela vigente na emissão | "Vale o pedido" · "Vale o laboratório" · "Pedir correção ao lab" |
| Documento vencido (37) | arquivo atual, validade, responsável da unidade | "Cobrar unidade" (aviso + e-mail) · "Recebi o novo": anexa, a leitura sugere a validade, eu confirmo |
| Premiação | reaproveita o modelo atual de pendência (IPR §5 Pendência) | só leitura até a Fase de login único |
| Nutra duplicada (4) | os dois envios lado a lado | "Vale o último" · "Vale este" |

Ações em lote em tudo que é repetitivo: "Cobrar laboratório nas 101 parcelas", "Cobrar as 37 unidades" (PM padrão 13).

## 5. O que deve virar automação (ordem de ganho para mim)

1. **Alerta de vencimento de documento**: rotina diária gera pendência em 60/30/0 dias e manda e-mail ao responsável da unidade. Hoje não existe nenhum cron de documentos (ID §Rotinas).
2. **Cobrança do laboratório**: rotina diária agrupa "falta Omie" e "falta planilha" por laboratório e prepara um único e-mail para eu aprovar com 1 clique.
3. **Sincronização Omie sem o navegador do dono**: enquanto não houver API, a tarefa agendada passa a enviar à função `omie` do novo (IP §8.6). Depende de quem tem o login do portal.
4. **Leitura do pedido de venda e do comprovante dentro do sistema**: reaproveitar `ler-documento` (IP §6) para preencher e já abrir a divergência. Eu só confirmo.
5. **Casamento comprovante × parcela**: sugerir a parcela pelo valor, CNPJ e data; eu confirmo.
6. **Receitas do dia 01**: manter o cálculo do antigo (média de N meses, múltiplos de 50) e entregar em Rascunho para eu revisar (IP §4).
7. **Nutra**: "última resposta vale" como regra do banco, com a anterior guardada; lembrete às unidades sem resposta 3 dias antes do prazo (IC §6.3).
8. **Cadastro de RT único**: mudar o RT em um lugar só e refletir em POPs, termo e receitas (ID §D).

## 6. Temas obrigatórios (breve)

1. **Unificar?** Sim: login, cadastro de unidade/empresa/pessoa, tela inicial de pendências e layout. Premiação, Bizneo e ZurIA ficam só em consulta (premissas).
2. **Ordem**: (a) núcleo + login + tela de pendências lendo Pedidos novo e Documentos; (b) Pedidos completo (criar pedido, PV, receitas) para desligar o antigo; (c) Documentos com alertas; (d) Nutra; (e) Compras/Reembolsos (sem uso real hoje, IC §1.1, §2.1); (f) Premiação no login único só com autorização, entre competências (IPR §7).
3. **Não interferir**: nada de Nutra antes de 01/12 (deixar o job do legado rodar e conferir o painel por rodada); Premiação intacta até outubro fechar; Pedidos antigo e novo em paralelo até a sincronização final dos 276 alterados, com uma só numeração DH definida antes (IP §9).
4. **Cadastro único**: unidade a partir de `public.unidades` + `pedidos_novo.unidade` (53/53 ligadas, ID "Dados que se repetem"); CNPJ com vigência no modelo `cmp_unidade_empresa`; pessoa a partir de `premiacao.pessoas` (697); RT/prescritor a partir do antigo (48 + 43 RTs); documento do sistema A, sem duplicar.
5. **Perfis**: Operações (tudo, com autor individual), sócio (o mesmo que eu, só as lojas dele), unidade, financeiro, contabilidade, laboratório não entra.
6. **Padrão de tela**: lista em tabela densa → ficha com histórico no fim → pendência com painel de decisão → aprovação em lote → documento em visualização na tela → relatório exportável (IPR §5 Padrões gerais).
7. **Infra**: GitHub, link de teste a cada mudança, Supabase de teste e Pro (arquivos: 894 MB + 207 MB a copiar, IP §8.5).
8. **IA**: ler PV, NF, comprovante, cartão CNPJ, validade de documento, sempre sugerindo para eu confirmar (PM §5). Não decide divergência nem prêmio.
9. **Crítica ao pedido**: "tudo num sistema só" de uma vez atrasaria o que mais me dói (alertas de documento e cobrança do lab) e mexeria na Premiação no pior momento. Alternativa: a tela de pendências vem primeiro e já entrega valor lendo os módulos existentes; os módulos migram atrás dela. Outro risco: "nenhuma função perdida" sem lista conferida — usar as matrizes do inventário como checklist de aceite de cada fase.
