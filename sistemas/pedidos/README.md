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
| Pagamento | Comprovante + planilha do laboratório + baixa na Omie têm que bater. Com comprovante e sem baixa: "paga, aguardando baixa", e o sistema gera a cobrança ao laboratório |
| Aprovação | Pedido não precisa de aprovação |
| Prazo do laboratório | 30 dias corridos (não há prazo contratado) |
| Prescritor | Só o RT do termo da unidade com o laboratório |
| Receita | Limita a quantidade pelo saldo (no começo só avisa) |
| Paciente | Em alguns casos; identificado por código, nunca pelo nome |
| Nº interno | DH-AAAA-NNNN |
| Alertas | E-mail e tela do sistema |

## Estrutura (migrations)

- `supabase/migrations/0001_pedidos_novo_base.sql`: cadastros, pedido, receita com saldo, parcela × pagamento,
  nota fiscal, pendências, execução dos conectores, situação calculada (`v_pedido`, `v_parcela`),
  registro de alterações imutável e isolamento total (RLS em tudo, sem acesso pela internet).
