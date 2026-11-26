-- Migração sistema antigo -> pedidos_novo (idempotente: apaga e refaz o que é origem='migracao' / bucket legado-*)
create or replace function pg_temp.dt(int) returns date language sql immutable as $$ select date '2025-01-01' + $1 $$;
create or replace function pg_temp.norm(text) returns text language sql immutable as $$ select trim(upper(regexp_replace(translate($1,'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç','AAAAEEIOOOUCaaaaeeiooouc'),'[^A-Za-z0-9]+',' ','g'))) $$;
create or replace function pg_temp.valor_nome(text) returns numeric language sql immutable as $$
  select replace(replace(substring($1 from 'R\$? ?([0-9][0-9\.]*,[0-9]{2})'),'.',''),',','.')::numeric $$;
create or replace function pg_temp.data_nome(text, date) returns date language sql immutable as $$
  select coalesce(
    case when $1 ~ '(\d{2})-(\d{2})-(\d{4})' then to_date(substring($1 from '(\d{2}-\d{2}-\d{4})'),'DD-MM-YYYY') end,
    case when $1 ~ '^\d{2}\.\d{2}[ _]' then make_date(extract(year from $2)::int, substring($1 from 4 for 2)::int, substring($1 from 1 for 2)::int) end) $$;
create or replace function pg_temp.forma(text) returns text language sql immutable as $$
  select case when $1 is null then null
    when $1 ilike 'P' or $1 ilike '%pix%' or $1 ilike '%vista%' then 'pix'
    when $1 ilike 'B' or $1 ilike '%boleto%' then 'boleto'
    when $1 ilike 'C' or $1 ilike '%cart%' then 'cartao' else 'outro' end $$;
create or replace function pg_temp.mime(text) returns text language sql immutable as $$
  select case lower(substring($1 from '\.([A-Za-z0-9]+)$')) when 'pdf' then 'application/pdf' when 'xml' then 'application/xml'
    when 'jpg' then 'image/jpeg' when 'jpeg' then 'image/jpeg' when 'png' then 'image/png'
    when 'xlsx' then 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' end $$;

begin;
drop table if exists _mp,_ma,_prod,_cp,_inj,_it,_pa,_pf,_ipf,_arq,_pag,_pp,_nf;
-- 0. limpeza
create temp table _mp as select id from pedidos_novo.pedido where origem='migracao';
create temp table _ma as select id from pedidos_novo.arquivo where bucket like 'legado-%';
delete from pedidos_novo.pagamento_parcela where pagamento_id in (select id from pedidos_novo.pagamento where comprovante_id in (select id from _ma));
delete from pedidos_novo.pagamento where comprovante_id in (select id from _ma);
delete from pedidos_novo.pedido_arquivo where pedido_id in (select id from _mp) or arquivo_id in (select id from _ma);
delete from pedidos_novo.nota_pedido where pedido_id in (select id from _mp) or nota_id in (select id from pedidos_novo.nota_fiscal where origem='migracao');
delete from pedidos_novo.nota_item where nota_id in (select id from pedidos_novo.nota_fiscal where origem='migracao');
delete from pedidos_novo.nota_fiscal where origem='migracao';
delete from pedidos_novo.etapa_lab where pedido_id in (select id from _mp);
delete from pedidos_novo.parcela where pedido_id in (select id from _mp);
delete from pedidos_novo.pedido_item where pedido_id in (select id from _mp);
update pedidos_novo.pedido set mae_id=null where id in (select id from _mp);
delete from pedidos_novo.pedido where id in (select id from _mp);
delete from pedidos_novo.arquivo where id in (select id from _ma);

-- 1. mapas
create temp table _prod as
select m.l, m.codigo, p.id pid from (values ('a','minox-2'),('b','pillfood'),('c','minox-05'),('d','complexo'),('e','fator'),('f','dutasterida'),('g','luteolina'),('h','cafeisilane'),('i','lidocaina'),('j','cloreto')) m(l,codigo)
left join pedidos_novo.produto p on p.laboratorio_id='CP' and p.codigo=m.codigo;

create temp table _cp as
select s.ref r, s.j, gen_random_uuid() pid,
  (select a.unidade_id from pedidos_novo.unidade_alias a where trim(a.nome_norm)=pg_temp.norm(s.j->>'u') limit 1) uid,
  pg_temp.dt(coalesce((s.j->>'d')::int,(s.j->>'ds')::int,(s.j->>'cr')::int)) dped,
  (s.j->>'s'='C' or coalesce(s.j->>'sl','')='CANCELADO') canc
from pedidos_novo._mig_src s where s.src='cp';

create temp table _inj as
select s.ref r, s.j, gen_random_uuid() pid,
  coalesce((select a.unidade_id from pedidos_novo.unidade_alias a where trim(a.nome_norm)=pg_temp.norm(s.j->>'u') limit 1),
           (select uc.unidade_id from pedidos_novo.unidade_cnpj uc where uc.cnpj=s.j->>'c' limit 1)) uid,
  (s.j->>'d')::date dped,
  m.num
from pedidos_novo._mig_src s
left join (values ('BETIM-INJ-1','DH-2026-0430'),('70091','DH-2026-0429'),('70198','DH-2026-0431'),('70822','DH-2026-0458'),('70824','DH-2026-0460'),('70828','DH-2026-0459'),('BETIM-INJ-1-L2','DH-2026-0457')) m(r,num) on m.r=s.ref
where s.src='inj';

-- 2. pedidos
insert into pedidos_novo.pedido (id,num_interno,laboratorio_id,unidade_id,num_lab,tipo,rascunho,enviado_em,previsao_envio,expedido_em,recebido_em,recebido_obs,frete,cancelado_em,cancelado_motivo,origem,legado_ref,obs,criado_por)
select pid,
 case when j ? 'n' then 'DH-20'||((j->>'n')::int/10000)||'-'||lpad(((j->>'n')::int%10000)::text,4,'0') end,
 'CP', uid, case when r like 'DH-%' then null else r end, 'normal', false, dped,
 pg_temp.dt(coalesce((j->>'pl')::int,(j->>'pv')::int)),
 pg_temp.dt((j->>'ev')::int),
 coalesce(pg_temp.dt(coalesce((j->>'en')::int,(j->>'rc')::int)), case when j->>'qu'='1' and j ? 'ev' then pg_temp.dt((j->>'ev')::int)+2 end),
 case when not (j ? 'en' or j ? 'rc') and j->>'qu'='1' and j ? 'ev' then 'Migração: entregue no sistema antigo sem data de recebimento; data estimada = envio + 2 dias' end,
 coalesce((j->>'f')::numeric,0),
 case when canc then (pg_temp.dt(coalesce((j->>'at')::int,(j->>'d')::int)))::timestamptz end,
 case when canc then 'Cancelado no sistema antigo' end,
 'migracao','cp:'||r,
 nullif(concat_ws(' | ', replace(j->>'o','#1','Não consta na planilha do laboratório — cadastrado a partir das NFs do Portal Omie (controle geral).'), 'Lab: '||(j->>'ol')),''),
 'migracao'
from _cp where j ? 'n';

insert into pedidos_novo.pedido (id,num_interno,laboratorio_id,unidade_id,num_lab,tipo,mae_id,rascunho,enviado_em,frete,origem,legado_ref,obs,criado_por)
select i.pid, i.num, 'INJ', i.uid, case when i.r ~ '^\d+$' then i.r end,
  case when i.j ? 'mae' then 'mae' when i.j ? 'm' then 'remessa' else 'normal' end,
  (select m.pid from _inj m where m.r=i.j->>'m'), false, i.dped, coalesce((i.j->>'f')::numeric,0), 'migracao',
  case when i.j ? 'mae' then 'inj-contrato:'||i.r else 'inj:'||i.r end, i.j->>'o', 'migracao'
from _inj i order by (i.j ? 'mae') desc;

select setval('pedidos_novo.num_interno_seq', 474, true);

insert into pedidos_novo.pedido (id,num_interno,laboratorio_id,unidade_id,num_lab,tipo,rascunho,enviado_em,previsao_envio,frete,origem,legado_ref,obs,criado_por)
select pid, null, 'CP', uid, null, 'normal', false, dped, pg_temp.dt(coalesce((j->>'pl')::int,(j->>'pv')::int)), coalesce((j->>'f')::numeric,0),
 'migracao','cp:'||r, nullif(concat_ws(' | ', j->>'o', 'Lab: '||(j->>'ol'), 'Nº exibido no sistema antigo: '||r||' (este número pertence a outro pedido em public.pedido; novo nº gerado)'),''), 'migracao'
from _cp where not j ? 'n' order by r;

-- 3. itens
create temp table _it as
select c.pid, c.r, c.dped, 'CP'::text lab, e.key l, (e.value)::numeric qtd, pr.pid prod_id, pr.codigo,
  (select v.valor from pedidos_novo.preco v where v.produto_id=pr.pid and v.de<=c.dped order by v.de desc limit 1) p_tab,
  (c.j->'pr'->>e.key)::numeric p_conf,
  (select round(avg((ii->>2)::numeric),2) from pedidos_novo._mig_src n, jsonb_array_elements(n.j->6) ii
     where n.src='nf' and n.j->>1=c.r and ii->>0=e.key and (ii->>2)::numeric >= 1) p_nf,
  case when (select count(*) from jsonb_object_keys(c.j->'it'))=1 and (c.j->>'v') is not null
       then round(((c.j->>'v')::numeric - coalesce((c.j->>'f')::numeric,0))/(e.value)::numeric,2) end p_val,
  null::numeric p_orig, null::text lote, null::date val
from _cp c cross join lateral jsonb_each(c.j->'it') e left join _prod pr on pr.l=e.key
where (e.value)::numeric > 0;
insert into _it
select i.pid, i.r, i.dped, 'INJ', x->>0, (x->>1)::numeric, p.id, p.codigo,
  (select v.valor from pedidos_novo.preco v where v.produto_id=p.id and v.de<=i.dped order by v.de desc limit 1),
  null, null, null, (x->>2)::numeric, x->>3, (x->>4)::date
from _inj i cross join lateral jsonb_array_elements(i.j->'it') x left join pedidos_novo.produto p on p.laboratorio_id='INJ' and p.codigo=x->>0;
alter table _it add column preco numeric, add column fonte text;
update _it set preco = coalesce(p_tab, p_conf, p_nf, p_val),
  fonte = case when p_tab is not null then 'tabela' when p_conf is not null then 'NF (confNF.precos)' when p_nf is not null then 'NF Omie (item)' when p_val is not null then 'valor/qtd' end;
insert into pedidos_novo.pedido_item (pedido_id,produto_id,qtd,preco_unit,lote,validade_lote)
select pid, prod_id, qtd, preco, lote, val from _it where prod_id is not null and preco is not null;

-- 4. parcelas CP
create temp table _pa as
select c.pid, c.r, c.j, c.canc, p.n::int idx,
  pg_temp.dt((p.e->>0)::int) venc, (p.e->>1)::numeric valor, p.e->>2 fl,
  pg_temp.dt((p.e->>3)::int) pago_src, pg_temp.dt((p.e->>4)::int) pago_dh, p.e->>5 forma_dh,
  p.e->>6 comp_id, p.e->>7 comp_nome, pg_temp.dt((p.e->>8)::int) comp_em,
  (c.r, p.n::int) in (('122447',1),('122447',2),('122447',3),('122448',1),('122448',2),('122448',3),('122451',2),('122451',3),('122451',4),('122451',5),('122451',6),('122686',1),('122688',1),('123771',1),('123771',2)) manual,
  null::int merged_into
from _cp c cross join lateral jsonb_array_elements(c.j->'pa') with ordinality p(e,n);
update _pa m set merged_into = (select o.idx from _pa o where o.pid=m.pid and not o.manual and o.venc=m.venc and o.valor=m.valor order by o.idx limit 1) where m.manual;

create temp table _pf as
select t.*, row_number() over (partition by t.pid order by t.idx)::int nn, count(*) over (partition by t.pid)::int de, gen_random_uuid() parcela_id
from (
 select o.pid,o.r,o.j,o.canc,o.idx,o.venc,o.valor,o.fl,o.manual, (m.idx is not null) recebeu_manual,
  case when o.manual then null else o.pago_src end baixa_omie,
  coalesce(o.comp_id, m.comp_id) comp_id, coalesce(o.comp_nome,m.comp_nome) comp_nome, coalesce(o.comp_em,m.comp_em) comp_em,
  coalesce(o.pago_dh, m.pago_dh, case when o.manual then o.pago_src end, m.pago_src) pago_dh,
  coalesce(o.forma_dh, m.forma_dh, m.fl) forma_dh
 from _pa o left join _pa m on m.pid=o.pid and m.manual and m.merged_into=o.idx
 where not (o.manual and o.merged_into is not null) and o.valor > 0
) t;

insert into pedidos_novo.parcela (id,pedido_id,n,de,vencimento,valor,forma,baixa_planilha_em,baixa_omie_em,cancelada_motivo,origem)
select parcela_id, pid, nn, de, venc, valor, pg_temp.forma(fl),
  case when pg_temp.dt(coalesce((j->>'dl')::int,(j->>'dp')::int)) >= venc - 7 then pg_temp.dt(coalesce((j->>'dl')::int,(j->>'dp')::int)) end,
  baixa_omie,
  case when canc then 'Pedido cancelado no sistema antigo' end,
  case when manual then 'migracao (lançada à mão no sistema antigo)' else 'migracao (Omie)' end
from _pf;

-- parcelas INJ
create temp table _ipf as
select i.pid, i.r, i.uid, (x->>0)::int nn, jsonb_array_length(i.j->'pa') de, (x->>1)::date venc, (x->>2)::numeric valor, x->>3 meio,
  (x->>4)::date pago_em, x->>5 st, x->>6 comp_id, x->>7 comp_nome, (x->>8)::timestamptz comp_em, (x->>9)::bigint tam, x->>10 tipo, gen_random_uuid() parcela_id
from _inj i cross join lateral jsonb_array_elements(i.j->'pa') x;
insert into pedidos_novo.parcela (id,pedido_id,n,de,vencimento,valor,forma,cancelada_motivo,origem)
select parcela_id, pid, nn, de, venc, valor, pg_temp.forma(meio),
  case when st='contrato' then 'Parcela do espelho da remessa: coberta pelo pagamento à vista do contrato BETIM-INJ-1 (PIX 11/11/2026) — não cobrar' end,
  'migracao (Injemed)'
from _ipf;

-- 5. arquivos
create temp table _arq as
select distinct on (bucket, path) * from (
 select 'legado-cp:anexos'::text bucket, a.e->>0 path, c.pid,
   case a.e->>1 when 'X' then 'NF-e '||(a.e->>2)||' - XML.xml' when 'D' then 'NF-e '||(a.e->>2)||' - DANFE.pdf' else a.e->>2 end nome,
   case a.e->>1 when 'X' then 'xml_nf' when 'D' then 'nota_fiscal' when 'N' then case when a.e->>2 ilike '%.xml' then 'xml_nf' else 'nota_fiscal' end
     when 'B' then 'boleto' when 'P' then 'pedido_venda' when 'R' then 'receita' when 'C' then 'comprovante' else 'outro' end categoria,
   pg_temp.dt((a.e->>3)::int)::timestamptz em, null::bigint tam, a.e->>1 code, case when a.e->>1 in ('X','D') then a.e->>2 end nfnum
 from _cp c cross join lateral jsonb_array_elements(c.j->'an') a(e)
 union all
 select 'legado-cp:anexos', comp_id, pid, comp_nome, 'comprovante', comp_em::timestamptz, null, 'PC', null from _pf where comp_id is not null
 union all
 select 'legado-inj:injemed', a->>0, i.pid, a->>2, a->>1, (a->>3)::timestamptz, (a->>4)::bigint, 'INJ', null from _inj i cross join lateral jsonb_array_elements(i.j->'an') a
 union all
 select 'legado-inj:injemed', comp_id, pid, comp_nome, 'comprovante', comp_em, tam, 'INJC', null from _ipf where comp_id is not null
) z order by bucket, path, code;
alter table _arq add column arquivo_id uuid default gen_random_uuid();
insert into pedidos_novo.arquivo (id,bucket,path,nome,tipo,tamanho,categoria,enviado_em,enviado_por)
select arquivo_id, bucket, path, nome, pg_temp.mime(nome), tam, categoria, coalesce(em, now()), 'migracao' from _arq;
insert into pedidos_novo.pedido_arquivo (pedido_id, arquivo_id)
select distinct z.pid, a.arquivo_id from (
  select 'legado-cp:anexos' b, a.e->>0 p, c.pid from _cp c cross join lateral jsonb_array_elements(c.j->'an') a(e)
  union select 'legado-cp:anexos', comp_id, pid from _pf where comp_id is not null
  union select 'legado-inj:injemed', a->>0, i.pid from _inj i cross join lateral jsonb_array_elements(i.j->'an') a
  union select 'legado-inj:injemed', comp_id, pid from _ipf where comp_id is not null
) z join _arq a on a.bucket=z.b and a.path=z.p;

-- 6. pagamentos (comprovante na parcela)
create temp table _pag (pagamento_id uuid default gen_random_uuid(), arquivo_id uuid, pid uuid, unidade_id uuid, pago_em date, valor numeric, forma text, tipo text, obs text);
insert into _pag (arquivo_id,pid,unidade_id,pago_em,valor,forma,tipo,obs)
select a.arquivo_id, min(f.pid::text)::uuid, min(p.unidade_id::text)::uuid,
  coalesce(min(f.pago_dh), pg_temp.data_nome(min(f.comp_nome), min(f.comp_em)), min(f.comp_em)),
  coalesce(pg_temp.valor_nome(min(f.comp_nome)), sum(f.valor)),
  coalesce(pg_temp.forma(min(f.forma_dh)), pg_temp.forma(min(f.fl)), 'outro'), 'parcela',
  'Migrado do sistema antigo (comprovante anexado à parcela)'
from _pf f join _arq a on a.bucket='legado-cp:anexos' and a.path=f.comp_id join pedidos_novo.pedido p on p.id=f.pid
where f.comp_id is not null group by a.arquivo_id;
insert into _pag (arquivo_id,pid,unidade_id,pago_em,valor,forma,tipo,obs)
select a.arquivo_id, f.pid, f.uid, coalesce(f.pago_em, f.comp_em::date), coalesce(pg_temp.valor_nome(f.comp_nome), f.valor), coalesce(pg_temp.forma(f.meio),'outro'), 'parcela', 'Migrado do sistema antigo (Injemed)'
from _ipf f join _arq a on a.bucket='legado-inj:injemed' and a.path=f.comp_id where f.comp_id is not null;

create temp table _pp (pagamento_id uuid, parcela_id uuid, valor numeric);
-- liga comprovante de parcela às parcelas dele (rateio na ordem)
do $$
declare g record; f record; resto numeric;
begin
  for g in select * from _pag where tipo='parcela' loop
    resto := g.valor;
    for f in (select x.parcela_id, x.valor, x.venc, x.nn from _pf x join _arq a on a.bucket='legado-cp:anexos' and a.path=x.comp_id where a.arquivo_id=g.arquivo_id
              union all select x.parcela_id, x.valor, x.venc, x.nn from _ipf x join _arq a on a.bucket='legado-inj:injemed' and a.path=x.comp_id where a.arquivo_id=g.arquivo_id)
             order by 3, 4 loop
      exit when resto <= 0;
      insert into _pp values (g.pagamento_id, f.parcela_id, least(resto, f.valor));
      resto := resto - least(resto, f.valor);
    end loop;
  end loop;
end $$;

-- comprovantes anexados ao pedido (não ligados a parcela): rateia nas parcelas sem comprovante, por vencimento
do $$
declare c record; f record; resto numeric; rem numeric; v numeric; pid_pag uuid; parsed numeric; fm text;
begin
  for c in
    select a.arquivo_id, cp.pid, cp.r, cp.j, cp.uid, z.nome, z.em::date em
    from _cp cp cross join lateral jsonb_array_elements(cp.j->'an') an
    join _arq a on a.bucket='legado-cp:anexos' and a.path=an->>0
    join lateral (select an->>2 nome, pg_temp.dt((an->>3)::int) em) z on true
    where an->>1='C' and not exists (select 1 from _pag g where g.arquivo_id=a.arquivo_id)
    order by cp.r, z.em, an->>0
  loop
    parsed := pg_temp.valor_nome(c.nome);
    select coalesce(sum(x.valor - coalesce((select sum(pp.valor) from _pp pp where pp.parcela_id=x.parcela_id),0)),0) into rem
      from _pf x where x.pid=c.pid and x.comp_id is null and not x.canc;
    v := case when rem > 0 then least(coalesce(parsed, rem), rem) else coalesce(parsed, (c.j->>'v')::numeric) end;
    continue when v is null or v <= 0;
    fm := case when c.nome ilike '%cart%' then 'cartao' when c.nome ilike '%pix%' then 'pix' else null end;
    pid_pag := gen_random_uuid();
    insert into _pag (pagamento_id, arquivo_id,pid,unidade_id,pago_em,valor,forma,tipo,obs)
      values (pid_pag, c.arquivo_id, c.pid, c.uid,
        coalesce(pg_temp.data_nome(c.nome, c.em), pg_temp.dt(coalesce((c.j->>'dp')::int,(c.j->>'dl')::int)), c.em),
        v, coalesce(fm, (select pg_temp.forma(x.fl) from _pf x where x.pid=c.pid order by x.venc, x.nn limit 1), 'outro'), 'pedido',
        'Migrado do sistema antigo (comprovante anexado ao pedido)'||case when parsed is not null and parsed <> v then '; valor no nome do arquivo R$ '||parsed||' (cobre outros pedidos/parcelas)' else '' end);
    resto := v;
    for f in select x.parcela_id, x.valor - coalesce((select sum(pp.valor) from _pp pp where pp.parcela_id=x.parcela_id),0) livre
             from _pf x where x.pid=c.pid and x.comp_id is null and not x.canc order by x.venc, x.nn loop
      exit when resto <= 0;
      continue when f.livre <= 0;
      insert into _pp values (pid_pag, f.parcela_id, least(resto, f.livre));
      resto := resto - least(resto, f.livre);
    end loop;
  end loop;
end $$;

insert into pedidos_novo.pagamento (id,unidade_id,pago_em,valor,forma,comprovante_id,obs,registrado_por)
select pagamento_id, unidade_id, pago_em, valor, forma, arquivo_id, obs, 'migracao' from _pag;
insert into pedidos_novo.pagamento_parcela (pagamento_id, parcela_id, valor)
select pagamento_id, parcela_id, sum(valor) from _pp where valor > 0 group by 1,2;

-- 7. notas fiscais (CP / Omie)
create temp table _nf as select s.j, (s.j->>0) numero, gen_random_uuid() nid from pedidos_novo._mig_src s where s.src='nf';
insert into pedidos_novo.nota_fiscal (id,laboratorio_id,numero,emissao,total,frete,cancelada,xml_id,danfe_id,origem)
select n.nid, 'CP', n.numero, pg_temp.dt((n.j->>2)::int), (n.j->>3)::numeric, coalesce((n.j->>4)::numeric,0), (n.j->>5)='1',
  (select a.arquivo_id from _arq a where a.code='X' and a.nfnum=n.numero limit 1),
  (select a.arquivo_id from _arq a where a.code='D' and a.nfnum=n.numero limit 1), 'migracao'
from _nf n;
insert into pedidos_novo.nota_item (nota_id,produto_id,descricao,cfop,qtd,preco_unit,total)
select n.nid, pr.pid,
  case x->>0 when 'a' then 'Minoxidil 2% (20 mg/ml) 2ml - Ampola' when 'b' then 'Pill Food - L-Metionina 25+L-Taurina 50+L-Prolina 10+Biotina 10+Vit B2 5+Vit B3 10+Vit B6 10+Vit B5 10 (mg) 2ml - Ampola'
    when 'c' then 'Minoxidil 0,5% (5 mg/ml) 2ml - Ampola' when 'd' then 'Complexo Vitaminico: B2 10mcg +B5 20mcg +B6 100mcg +B7 50mcg +LArginina 200mcg +Cromo0,2mcg +Cobre 2mcg 2ml - Ampola'
    when 'e' then 'bFGF; IGF; VEGF; Copper Peptideos 1,2% 2ml - Ampola' when 'f' then 'Dutasterida 0,1% (1 mg/ml) 1ml - Frascos-Ampola'
    when 'g' then 'Luteolina 0,25% (2,5 mg/ml) 2ml - Ampola' when 'h' then 'Cafeisilane C® 3% (30 mg/mL) 2mL - Ampola'
    when 'i' then 'Lidocaina HCl 1% (10 mg/ml) 2ml - Ampola' when '8611' then 'Finasterida 0,05% (0,5 mg/ml) 1ml - Ampola' else 'cód. '||(x->>0) end,
  coalesce(x->>4,'5102'), (x->>1)::numeric, (x->>2)::numeric, coalesce((x->>3)::numeric, round((x->>1)::numeric*(x->>2)::numeric,2))
from _nf n cross join lateral jsonb_array_elements(n.j->6) x left join _prod pr on pr.l=x->>0;
insert into pedidos_novo.nota_pedido (nota_id, pedido_id)
select distinct n.nid, c.pid from _nf n join _cp c on c.r = n.j->>1
union
select n.nid, c.pid from _cp c cross join lateral jsonb_array_elements_text(c.j->'nf') x join _nf n on n.numero = x;

-- 8. etapa no laboratório
insert into pedidos_novo.etapa_lab (pedido_id, etapa, previsao, origem)
select pid, concat_ws(' / ', j->>'sl', case when j->>'e' is distinct from j->>'sl' then j->>'e' end),
  pg_temp.dt(coalesce((j->>'pl')::int,(j->>'pv')::int)), 'migracao'
from _cp where j ? 'sl' or j ? 'e';
insert into pedidos_novo.etapa_lab (pedido_id, etapa, origem) select pid, j->>'st', 'migracao' from _inj;

-- 9. sequência
select setval('pedidos_novo.num_interno_seq', (select max(substring(num_interno from 9)::int) from pedidos_novo.pedido where num_interno like 'DH-2026-%'), true);

-- 10. diagnósticos para o relatório (tabela de trabalho, apagada no fim)
drop table if exists pedidos_novo._mig_diag;
create table pedidos_novo._mig_diag as
select 'item'::text k, r ref, lab, l cod, codigo, qtd, preco, fonte, p_tab, p_conf, p_nf, p_val, p_orig, (prod_id is null) sem_produto from _it;
alter table pedidos_novo._mig_diag enable row level security;
revoke all on pedidos_novo._mig_diag from public, anon, authenticated;
commit;
select (select count(*) from pedidos_novo.pedido where origem='migracao') pedidos,
       (select count(*) from pedidos_novo.pedido_item i join pedidos_novo.pedido p on p.id=i.pedido_id where p.origem='migracao') itens,
       (select count(*) from pedidos_novo.parcela p join pedidos_novo.pedido x on x.id=p.pedido_id where x.origem='migracao') parcelas,
       (select count(*) from pedidos_novo.arquivo where bucket like 'legado-%') arquivos,
       (select count(*) from pedidos_novo.pagamento where registrado_por='migracao') pagamentos, (select count(*) from pedidos_novo.pagamento_parcela pp join pedidos_novo.pagamento g on g.id=pp.pagamento_id where g.registrado_por='migracao') pag_parc,
       (select count(*) from pedidos_novo.nota_fiscal where origem='migracao') nfs;
