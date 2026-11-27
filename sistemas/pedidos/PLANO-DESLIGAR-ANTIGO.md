# Plano para desligar o sistema antigo de pedidos (inventário de 27/11/2026)

Objetivo do dono: desligar o sistema antigo; **tudo** o que existe nele precisa estar no novo, inclusive os documentos.

## Já está no sistema novo
- Pedidos (477 CP + Injemed), itens (1.805), parcelas (538 + 3 novas da Omie), NFs (367 + planilha), unidades/CNPJ/apelidos (53/53/71),
  produtos (17), pagamentos com comprovante (83).
- Robôs: planilha (07:00), rastreio Quality (07:20) e recepção da Omie (função `omie`, mesmo formato do sistema atual).
- Omie (carga inicial 27/11): 369 NFs lidas, 516 parcelas ligadas à NF/boleto (192 com linha digitável), 318 NFs com link do portal, 14 baixas novas.

## Arquivo do sistema antigo (feito em 27/11/2026)
Cópia fiel, somente leitura, em `pedidos_novo.legado_doc` (1.033 registros: 479 pedidos, 385 NFs Omie, 53 clínicas, 51 receitas,
48 prescritores, 13 insumos, 4 configurações — a configuração das automações ficou de fora por conter credenciais),
`pedidos_novo.legado_log` (6.178 registros de histórico, 05/10 a 26/11 — conferido faixa a faixa) e `pedidos_novo.legado_tabela`
(Injemed: pedidos, contrato, insumos, modelos, unidades, log; laboratórios; 21 usuários). Função `importar-legado` (upsert) refaz a cópia
na virada. Nada do sistema antigo se perde, mesmo campos que o novo não usa.

## Falta trazer (ordem de trabalho)
1. **Documentos (arquivos)** — 1.344 arquivos / ~207 MB do bucket `anexos` + `injemed`. Hoje o sistema novo só aponta para o antigo.
   O banco único está no plano gratuito (1 GB) e já usa ~853 MB (Documentos) → **precisa do Supabase Pro** para copiar.
   Inclui: 10 anexos de 26/11, 34 removidos (guardar como "removido", com quem/quando), 4 do Injemed (modelos/termo).
   **Documentos de clínicas (conferido 27/11):** dos 155 arquivos fora de pedidos, 114 já estão (idênticos) no sistema de Documentos,
   35 são comprovantes de parcela já cadastrados no novo, e 3 (contrato social/cartão CNPJ de Uberlândia e Juiz de Fora; termo CP de Serra)
   têm outra versão no Documentos → não vêm. **Vão para a pasta de Contagem no sistema de Documentos (decisão do dono):**
   "Termo de Fornecimento para Clínica" (provável termo Injemed) e "Certidão de Regularidade Profissional (quitada)".
   1 PDF solto de 14/10 (sem ligação) fica guardado junto com os removidos.
   **Duplicados:** 37 arquivos repetidos (45 cópias extras); o novo guarda 1 cópia por conteúdo (sha256) ligada a todos os pedidos.
   Conferir: pedidos de venda iguais nos pedidos DH-2026-0352 e 0353.
2. **Histórico de alterações** — 6.178 registros (`logs`) de 05/10 a 26/11: importar como histórico do pedido/clínica (somente leitura).
3. **Campos sem lugar ainda**: links do portal por pedido, conferência pedido × NF (`confNF`, inclui diferenças de preço),
   situação de pagamento antiga (`sitPag`, `dataPag`, `dataPagLab`), dados de receita/prescritor no pedido, pedido de venda (`pedidoVenda`/`pendPV`),
   previsão do laboratório, observações de parcela, boletos ligados à parcela, metadados dos anexos (fonte, quem enviou).
4. **Cadastros**: prescritores (48), receitas mensais (51), RTs e checklist de documentos das clínicas (43 RTs + 18 encerrados, 317 itens),
   histórico de preços (24 vigências) e protocolos (15), configurações (etapas, formas de pagamento, tipos de anexo).
5. **Usuários**: 21 no sistema antigo (hoje só 2 no novo) — definir quem continua e com qual papel.
6. **Sincronização final** na virada: congelar o antigo (só leitura) e trazer o que mudou depois de 26/11 05:33 UTC
   (2 pedidos novos DH-2026-0471/0472, 274 pedidos alterados, 87 registros de histórico, anexos).

## Estoque Nutra (decisão do dono, 27/11/2026)
Vem para o banco único como **módulo à parte** (área `nutra`), depois incorporado ao sistema de Compras e Estoque.
O site estoque-nutra-drhair continua igual; na virada troca só o endereço do banco. Logins: as 18 contas do sistema antigo
vêm com a **mesma senha** (cópia cifrada), feita no dia da virada.

## Atenção
- O mesmo projeto Supabase antigo também guarda o **Estoque Nutra** (`nut_*`, em uso: respostas até 26/11) e restos de Compras (`cmp_*`, piloto)
  e Reembolso (`reb_*`, vazio). Desligar o projeto inteiro derruba o Estoque Nutra.
- Backups semanais (12 arquivos JSON, 22 MB) ficam no bucket `backups` do antigo.
