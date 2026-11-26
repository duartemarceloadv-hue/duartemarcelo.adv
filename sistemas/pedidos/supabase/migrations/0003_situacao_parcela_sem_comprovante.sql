-- Parcela que o laboratório já baixou (planilha ou Omie) mas sem comprovante da Dr. Hair
-- deixa de aparecer como "vencida" e passa a "baixada_sem_comprovante".
create or replace view pedidos_novo.v_parcela with (security_invoker = true) as
select p.*,
  coalesce(pg.pago, 0)                                   as pago_por_nos,
  (coalesce(pg.pago,0) >= p.valor - 0.01)                as quitada_por_nos,
  case
    when p.cancelada_motivo is not null then 'cancelada'
    when coalesce(pg.pago,0) >= p.valor - 0.01 and p.baixa_planilha_em is not null and p.baixa_omie_em is not null then 'quitada'
    when coalesce(pg.pago,0) >= p.valor - 0.01 then 'paga_aguardando_baixa'
    when p.baixa_planilha_em is not null or p.baixa_omie_em is not null then 'baixada_sem_comprovante'
    when p.vencimento < pedidos_novo.hoje() then 'vencida'
    else 'a_vencer'
  end as situacao
from pedidos_novo.parcela p
left join (select parcela_id, sum(valor) pago from pedidos_novo.pagamento_parcela group by 1) pg on pg.parcela_id = p.id;
