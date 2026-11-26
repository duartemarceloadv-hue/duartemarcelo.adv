-- Regra decidida pelo dono em 26/11/2026:
-- * A Omie é o sistema de controle do laboratório. Baixa na Omie = parcela paga (quitada),
--   com ou sem comprovante nosso. Não é preciso anexar comprovante nesses casos.
-- * Comprovante nosso sem baixa na Omie = "paga_aguardando_baixa" (cobrar a baixa do laboratório).
-- * Baixa só na planilha do laboratório (Omie ainda não baixou) = "baixa_so_planilha":
--   conferir pela forma de pagamento se foi pago de fato ou se há boleto pendente.
create or replace view pedidos_novo.v_parcela as
select p.id, p.pedido_id, p.n, p.de, p.vencimento, p.valor, p.forma,
       p.baixa_planilha_em, p.baixa_omie_em, p.boleto_arquivo_id, p.cancelada_motivo, p.origem,
       coalesce(pg.pago, 0::numeric) as pago_por_nos,
       coalesce(pg.pago, 0::numeric) >= (p.valor - 0.01) as quitada_por_nos,
       case
         when p.cancelada_motivo is not null then 'cancelada'
         when p.baixa_omie_em is not null then 'quitada'
         when coalesce(pg.pago, 0) >= p.valor - 0.01 then 'paga_aguardando_baixa'
         when p.baixa_planilha_em is not null then 'baixa_so_planilha'
         when p.vencimento < pedidos_novo.hoje() then 'vencida'
         else 'a_vencer'
       end as situacao
from pedidos_novo.parcela p
left join (select parcela_id, sum(valor) as pago from pedidos_novo.pagamento_parcela group by parcela_id) pg
  on pg.parcela_id = p.id;
