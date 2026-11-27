-- Regra decidida pelo dono em 26/11/2026 (substitui a 0005):
-- A parcela só fica "quitada" com as 3 baixas:
--   1) baixa na Omie (controle do laboratório)      -> se faltar: pedir ao laboratório baixar na Omie
--   2) baixa na planilha do laboratório               -> se faltar: pendência de informação (pedir atualização)
--   3) baixa no nosso sistema: comprovante anexado, ou -> se faltar: dar baixa no sistema
--      "baixa sem comprovante" (só quando a Omie já baixou)
-- Quais baixas do laboratório valem é definido na ficha do laboratório (ficha.baixas).
-- Injemed não tem Omie nem planilha: só vale a nossa baixa.
alter table pedidos_novo.parcela
  add column if not exists baixa_sistema_em date,
  add column if not exists baixa_sistema_por text,
  add column if not exists baixa_sistema_obs text;

update pedidos_novo.laboratorio set ficha = ficha || '{"baixas":["omie","planilha"]}'::jsonb where id = 'CP';
update pedidos_novo.laboratorio set ficha = ficha || '{"baixas":[]}'::jsonb where id = 'INJ';

create or replace view pedidos_novo.v_parcela as
with b as (
  select p.*, coalesce(pg.pago, 0::numeric) as pago,
         coalesce(l.ficha->'baixas', '["omie","planilha"]'::jsonb) ? 'omie' as exige_omie,
         coalesce(l.ficha->'baixas', '["omie","planilha"]'::jsonb) ? 'planilha' as exige_planilha
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
