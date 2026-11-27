-- Decisão do dono em 27/11/2026: a planilha do laboratório (Centro Paulista) só registra o
-- pagamento da 1ª parcela de cada pedido ("Data Pagto" por pedido). Por isso a baixa na
-- planilha só é exigida na 1ª parcela; da 2ª em diante a parcela finaliza com Omie + nossa baixa.
update pedidos_novo.laboratorio set ficha = ficha || '{"planilha_so_primeira": true}'::jsonb where id = 'CP';

create or replace view pedidos_novo.v_parcela as
with b as (
  select p.*, coalesce(pg.pago, 0::numeric) as pago,
         coalesce(l.ficha->'baixas', '["omie","planilha"]'::jsonb) ? 'omie' as exige_omie,
         coalesce(l.ficha->'baixas', '["omie","planilha"]'::jsonb) ? 'planilha'
           and (p.n = 1 or coalesce((l.ficha->>'planilha_so_primeira')::boolean, false) = false) as exige_planilha
  from pedidos_novo.parcela p
  join pedidos_novo.pedido pe on pe.id = p.pedido_id
  join pedidos_novo.laboratorio l on l.id = pe.laboratorio_id
  left join (select parcela_id, sum(valor) as pago from pedidos_novo.pagamento_parcela group by parcela_id) pg
    on pg.parcela_id = p.id
), f as (
  select b.*,
         (b.pago >= b.valor - 0.01 or b.baixa_sistema_em is not null) as nossa,
         b.exige_omie and b.baixa_omie_em is null as f_omie,
         b.exige_planilha and b.baixa_planilha_em is null as f_plan
  from b
)
select f.id, f.pedido_id, f.n, f.de, f.vencimento, f.valor, f.forma,
       f.baixa_planilha_em, f.baixa_omie_em, f.boleto_arquivo_id, f.cancelada_motivo, f.origem,
       f.pago as pago_por_nos,
       f.pago >= (f.valor - 0.01) as quitada_por_nos,
       case
         when f.cancelada_motivo is not null then 'cancelada'
         when not f.f_omie and not f.f_plan and f.nossa then 'quitada'
         when f.baixa_omie_em is null and f.baixa_planilha_em is null and not f.nossa
           then case when f.vencimento < pedidos_novo.hoje() then 'vencida' else 'a_vencer' end
         when f.f_omie then 'falta_omie'
         when f.f_plan then 'falta_planilha'
         else 'falta_baixa_sistema'
       end as situacao,
       f.baixa_sistema_em, f.baixa_sistema_por, f.baixa_sistema_obs,
       f.nossa as baixa_nossa, f.f_omie as falta_omie, f.f_plan as falta_planilha, not f.nossa as falta_nossa,
       f.exige_omie, f.exige_planilha
from f;
