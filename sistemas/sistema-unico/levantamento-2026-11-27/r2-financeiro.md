# R2 – Financeiro e Compras (crítica e revisão)

Fontes: as 9 propostas r1-* desta pasta, inventários (IP = inv-pedidos, IC = inv-compras-reembolsos-nutra, IPr = inv-premiacao), premissas.md e as minhas consultas do R1 (`pedidos_novo.v_parcela` e colunas de `parcela`/`pagamento`). Fiz só leitura, nada foi alterado.

## A. CRÍTICA

### A.1 Por proposta: riscos financeiros concretos

**Arquiteto.** Ele separa `compras` e `reembolsos` em schemas próprios e proíbe um módulo de ler o schema de outro (r1-arquiteto §2).
- O resultado são **três contas a pagar**: `parcela` em Pedidos, título em Compras (`cmp_titulos`) e pagamento em Reembolsos. Um mesmo comprovante PIX ou TED pode ser lançado em dois módulos sem que nenhum perceba: é o **pagamento duplicado**.
- A **conciliação por empresa fica impossível**: o extrato de um CNPJ mistura laboratório, compra e reembolso, e não haveria uma tabela onde casar o extrato com esses lançamentos.
- O mesmo choque atinge o meu R1. Minha fase 1 previa uma tela de financeiro lendo `pedidos_novo.v_parcela`, o que fere a regra de dependência dele. A solução está na revisão (B).
- Renomear `pedidos_novo` para `pedidos` na virada (§2) muda o destino da função `omie`. Se a tarefa no navegador do dono não for trocada no mesmo dia, as baixas da Omie deixam de entrar. Hoje são 40 parcelas em falta Omie, somando R$ 350.851,57.

**Designer.** O menu (r1-designer §4) tem "Pedidos › Pagamentos", "Compras › Notas e contas a pagar" e "Reembolsos › Pagamentos".
- São **três lugares para pagar**. O financeiro programa o dia em telas separadas e não vê o total a pagar por CNPJ.
- Ponto bom a manter: aprovação congelada e o selo "aprovação caiu" (§3.6). Ele precisa valer também para o pagamento. Se o valor, o favorecido ou o PIX mudar depois de aprovado, o pagamento fica bloqueado. O gatilho `reb_sol_guard_t` já faz isso com o PIX (IC 2.2).

**Operações.** O painel de pendências (r1-operacoes §3) tem duas ações de risco.
- **"Marcar como informado"** na parcela em falta planilha. São 61 parcelas, R$ 661.463,51. Se isso contar como a baixa da planilha, é **baixa errada**: o laboratório continua sem registrar, e a cobrança dele some do radar.
- **"Confirmar baixa" com 1 clique** a partir do comprovante sugerido por valor e data. Unidades diferentes têm parcelas de valor igual, e ligar o comprovante à parcela errada quita a parcela errada. A sugestão precisa exigir que o **CNPJ pagador do comprovante seja o da unidade** da parcela. A regra "cada unidade paga o seu" está em IP §4.
- A cobrança ao laboratório em lote (101 parcelas) está certa: é onde está o dinheiro parado.

**Sócio.** Pede "aprovar só exceções" e aceita **aprovação tácita** com aviso (r1-socio §6).
- Em reembolso e compra, tácita significa **dinheiro sai sem ninguém ter aprovado**. Isso quebra a segregação prevista (`segregacao_pagamento = true`, IC 2.1) e o padrão de mercado de "bloqueado até aprovar" (pesquisa-mercado §1.1).
- Na Premiação, a tácita só confirma o valor calculado pelo sistema. É outro caso, e não é da minha alçada.
- O sócio também quer ver "2 boletos de laboratório vencidos" (§3). Sem dizer quem paga, há **risco de a unidade pagar o boleto por fora** enquanto o financeiro também paga.
- "Pago", na linguagem do sócio, deve querer dizer "nós pagamos". "Aguardando o laboratório confirmar" é outro selo, separado.

**RH.** O `dado_pagamento` com a trava antifraude e o aprovador pela lotação vigente na data da despesa estão corretos (r1-rh §2).
- O PIX é informado pela própria pessoa e confirmado por Operações. Se Operações também aprova o reembolso, uma só pessoa controla o favorecido e a aprovação. A confirmação do PIX deve ser feita pelo financeiro, por outro canal.
- Reembolso a PJ: o RH prevê CLT e PJ. Para PJ, pode ser exigida NF do serviço em vez de recibo. É uma decisão da contabilidade, ainda em aberto.

**Segurança.** Concordo com "Operações pode tudo, menos aprovar o que lançou" e com o financeiro nunca pagando o que solicitou (r1-seguranca §2 e §9).
- Falta uma regra: a lixeira nunca pode receber parcela paga nem pagamento ligado. Cancelar uma parcela com pagamento exige estorno registrado. Os 6 títulos apagados em teste (`cmp_eventos`, IC 6.12) mostram que isso já aconteceu.

**Dados.** O arquivo morto para `cmp_*` e `reb_*` e "IA na NF só sem XML" estão certos (r1-dados §3 e §5).
- Risco: o padrão de importação (receber, prévia, aplicar) aplicado à Omie. A `omie-sync` **reconstrói parcelas** preservando os nossos dados (IP §2). Se a chave de identificação não for `chave_omie` + NF + número da parcela, a reconstrução cria **parcela duplicada** ou desliga o comprovante da parcela.
- O alerta às 08:00 quando a Omie não chega está correto.

**Advogado do diabo.**
- **Numeração DH divergente**: 43 pedidos diferentes, e DH-2026-0469 a 0472 trocados (r1-diabo risco 10). Isso é **pagamento no pedido errado**. A numeração tem de ser decidida antes de qualquer migração de parcelas.
- **Anexos apontando para o legado**: 1.152 arquivos (risco 6). Se o legado for desligado antes, comprovantes e boletos se perdem: é o **boleto perdido**.
- Discordo de "não construir Reembolsos agora" (§3). O reembolso existe e é feito hoje pelo WhatsApp, sem trilha (r1-socio §1). O que não vale é migrar o piloto, que está vazio.

### A.2 Conflitos entre propostas

| Conflito | Posições | Minha posição |
|---|---|---|
| Contas a pagar | Arquiteto: um schema por módulo. Designer: três telas de pagamento. Eu (R1): `financeiro` único | `financeiro` como **serviço**, igual ao núcleo: os módulos gravam só por função e ele nunca lê os schemas dos módulos. Atende a regra do arquiteto e evita três contas a pagar |
| Aprovação tácita | Sócio aceita. Segurança e Compras pedem segregação | Proibida em dinheiro. Na Premiação, a decisão é de Operações |
| "Aprovar só exceções" | Sócio, pesquisa (fadiga) | Aceito como **regra de autoaprovação explícita**, cadastrada por Operações por categoria e teto, registrada como "aprovado pela regra N", com teto mensal por pessoa e amostra revisada pelo financeiro. Não é tácita |
| Quem confirma o PIX | RH: Operações | Financeiro, por outro canal |
| Ordem de Reembolsos | Diabo: não agora. Arquiteto: fase 5. Sócio: logo após o login | Fase 5 do arquiteto, logo depois da virada do Pedidos, construído do zero |

## B. REVISÃO (o que mudou e por quê)

1. **`financeiro` vira serviço, não módulo que lê os outros.** Pedidos, Compras e Reembolsos chamam `financeiro.lancar_titulo()`, `baixar()` e `cancelar()`. O título guarda `origem` e `origem_id`, e a ficha do título abre a ficha de origem pela casca. *Por quê:* atende a regra de dependência do arquiteto e mantém uma só conta a pagar.
2. **Fase 1 muda de lugar.** A tela "Contas a pagar" nasce dentro de Pedidos (o "Pedidos › Pagamentos" do designer), lendo a própria `v_parcela`. Ela passa para Financeiro na fase 3, quando o título único existir. *Por quê:* nenhuma dependência entre schemas antes da hora.
3. **Um só lugar para pagar.** Só "Financeiro › Contas a pagar" programa e paga. Os módulos mostram a situação dos seus títulos, só para leitura. *Por quê:* evita três telas e o pagamento duplicado.
4. **Baixa e dispensa são coisas diferentes.** Surge uma situação nova, "planilha dispensada", com justificativa e autor. Ela quita a parcela para nós, mas mantém a cobrança ao laboratório aberta. *Por quê:* a ação "Marcar como informado" de Operações não pode virar baixa falsa nos R$ 661.463,51.
5. **Travas contra duplicidade em todas as origens.** São quatro:
   - linha digitável do boleto única;
   - chave de acesso da NF única;
   - hash do arquivo de comprovante único;
   - alerta de mesmo favorecido + valor + data em qualquer origem.

   A sugestão de parcela pelo comprovante exige que o CNPJ pagador seja o da unidade. A Omie é identificada por `chave_omie` + NF + número da parcela.
6. **Aprovação:** sem tácita em dinheiro. A autoaprovação só vale por regra explícita (item do quadro A.2). O que foi aprovado fica congelado: mudança de valor, favorecido ou PIX bloqueia o pagamento. Quem lança não aprova, quem aprova não paga, e o PIX é confirmado pelo financeiro.
7. **Lixeira:** nunca para parcela paga. Cancelar uma parcela paga exige estorno registrado.
8. **Ordem ajustada às outras propostas:**
   - 0: nada até 01/12.
   - 1: Contas a pagar dentro de Pedidos.
   - 2: fornecedor no `nucleo`.
   - 3: **decidir a numeração DH**, copiar os 1.152 anexos e só então migrar as 541 parcelas e os 83 pagamentos para `financeiro`, conferindo os totais por situação.
   - 4: Reembolsos do zero, com alçadas.
   - 5: NF por XML genérica e boletos.
   - 6: Compras simplificado.
   - 7: conciliação por extrato.
9. **Sem mudança:** a regra das 3 baixas fica configurada por fornecedor, a Omie é só entrada de dados (com o alerta das 08:00), o orçamento da premiação fica na Premiação e o prêmio não vira título.
10. **Em aberto, para a contabilidade:** se o reembolso a PJ exige NF, e se a Dr. Hair quer lançar no futuro títulos na sua própria Omie (`omie_cash`). Até lá, só sai um relatório exportável.
