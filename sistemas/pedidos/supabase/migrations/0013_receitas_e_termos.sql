-- =====================================================================
-- 0013: Receitas do mês e termos de responsabilidade (Laboratórios)
--  * receita passa a guardar também a RECEITA MENSAL DA UNIDADE (tipo = 'mensal'), com o fluxo do sistema antigo:
--    rascunho → gerada → enviada ao RT (só marca; nenhum e-mail é enviado).
--  * regra do dia 01 MIGRADA COMO ESTÁ (legado public.gerar_receitas + receitas_completar_unidades):
--    soma os itens dos pedidos não cancelados dos últimos N meses (N = ficha do laboratório, 3 como no config
--    'receitas' do antigo, entre 1 e 24), divide pelos meses em que a unidade teve pedido com itens,
--    arredonda PARA CIMA em múltiplos de 50, troca minox-2 → minox-05 e complexo → pillfood, cria em rascunho,
--    não sobrescreve ajustes, e cria rascunho vazio para a unidade sem pedido. Aqui só por botão (sem rotina agendada).
--  * importa as 51 receitas do sistema antigo (legado_doc col = 'receitas') e os termos de responsabilidade
--    com o Centro Paulista que constam no cadastro de clínicas (arquivo continua no sistema antigo).
-- =====================================================================

-- ---------- protocolo clínico da unidade (Antigo/Novo), como está no legado ----------
create table if not exists pedidos_novo.unidade_protocolo (
  unidade_id uuid primary key references nucleo.unidade(id),
  protocolo  text not null check (protocolo in ('Antigo','Novo')),
  fonte      text not null
);
alter table pedidos_novo.unidade_protocolo enable row level security;
revoke all on pedidos_novo.unidade_protocolo from public, anon, authenticated;
create trigger t_audita after insert or update or delete on pedidos_novo.unidade_protocolo for each row execute function pedidos_novo.audita();

-- ---------- receita ----------
alter table pedidos_novo.receita
  alter column prescritor_id drop not null,
  alter column emitida_em drop not null,
  alter column validade drop not null,
  add column if not exists tipo text not null default 'paciente' check (tipo in ('mensal','paciente')),
  add column if not exists mes date check (mes is null or mes = date_trunc('month', mes)::date),
  add column if not exists status text not null default 'rascunho' check (status in ('rascunho','gerada','enviada_rt','cancelada')),
  add column if not exists status_em jsonb not null default '{}',
  add column if not exists calculo jsonb,
  add column if not exists legado_ref text unique,
  add column if not exists legado jsonb,
  add column if not exists atualizado_em timestamptz not null default now();
alter table pedidos_novo.receita add constraint receita_mensal_tem_mes check (tipo <> 'mensal' or mes is not null);
create unique index if not exists receita_mensal_unica on pedidos_novo.receita (unidade_id, laboratorio_id, mes) where tipo = 'mensal' and status <> 'cancelada';
create trigger t_atualizado before update on pedidos_novo.receita for each row execute function pedidos_novo.toca_atualizado();

alter table pedidos_novo.receita_item drop constraint if exists receita_item_qtd_check;
alter table pedidos_novo.receita_item
  add constraint receita_item_qtd_check check (qtd >= 0),
  add column if not exists qtd_calculada numeric(12,2),
  add column if not exists media numeric(12,2),
  add column if not exists total_periodo numeric(12,2),
  add column if not exists ajustado boolean not null default false,
  add column if not exists ajuste_justificativa text,
  add column if not exists ajustado_por text,
  add column if not exists ajustado_em timestamptz;

-- janela de meses e trocas de produto (config 'receitas' do antigo: meses = 3)
update pedidos_novo.laboratorio set ficha = ficha || '{"receita_meses": 3, "receita_trocas": {"minox-2": "minox-05", "complexo": "pillfood"}}'::jsonb where id = 'CP';

-- ---------- geração da receita do mês (botão; p_simular = só calcula, não grava) ----------
create or replace function pedidos_novo.gerar_receitas_mes(p_mes date, p_simular boolean default true)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_mes date := date_trunc('month', p_mes)::date; n int; ini date; r record; rid uuid; st text;
  res jsonb := '[]'; cri int := 0; atu int := 0; ign int := 0; calc jsonb; trocas jsonb;
begin
  select greatest(1, least(24, coalesce((ficha->>'receita_meses')::int, 3))), coalesce(ficha->'receita_trocas', '{}')
    into n, trocas from pedidos_novo.laboratorio where id = 'CP';
  ini := (v_mes - make_interval(months => n))::date;
  for r in
    with p as (
      select pe.id, pe.num_interno, pe.unidade_id, to_char(pe.enviado_em, 'YYYY-MM') m from pedidos_novo.pedido pe
      where pe.laboratorio_id = 'CP' and pe.cancelado_em is null and not pe.rascunho and pe.enviado_em >= ini and pe.enviado_em < v_mes),
    pi as (
      select p.unidade_id, p.m, p.id pedido_id, coalesce(trocas->>pr.codigo, pr.codigo) cod, i.qtd
      from p join pedidos_novo.pedido_item i on i.pedido_id = p.id join pedidos_novo.produto pr on pr.id = i.produto_id where i.qtd > 0),
    nm as (select unidade_id, greatest(1, count(distinct m))::int n, array_agg(distinct m order by m) meses from pi group by 1),
    it as (select unidade_id, cod, sum(qtd) q from pi group by 1, 2),
    np as (select p.unidade_id, count(*) peds,
                  coalesce(array_agg(p.num_interno order by p.num_interno) filter (where not exists (select 1 from pi where pi.pedido_id = p.id)), '{}') sem
           from p group by 1)
    select u.id unidade_id, u.nome, coalesce(np.peds, 0) peds, nm.n nmeses, coalesce(nm.meses, '{}') meses, coalesce(np.sem, '{}') sem,
           (select jsonb_object_agg(it.cod, jsonb_build_object('total', it.q, 'media', round(it.q / nm.n, 1), 'qtd', (ceil(it.q / nm.n / 50) * 50)::int))
              from it where it.unidade_id = u.id) itens,
           coalesce((select x.protocolo from pedidos_novo.unidade_protocolo x where x.unidade_id = u.id), 'Antigo') protocolo
    from nucleo.unidade u left join np on np.unidade_id = u.id left join nm on nm.unidade_id = u.id
    where u.ativo order by u.nome
  loop
    calc := jsonb_build_object('itens', coalesce(r.itens, '{}'), 'pedidos', r.peds, 'pedidosSemItens', to_jsonb(r.sem), 'protocolo', r.protocolo,
                               'janelaMeses', n, 'mesesComDados', r.nmeses, 'meses', to_jsonb(r.meses), 'semPedidos', r.peds = 0,
                               'periodo', jsonb_build_object('de', ini, 'ate', v_mes - 1), 'calculadoEm', now());
    select id, status into rid, st from pedidos_novo.receita
     where tipo = 'mensal' and unidade_id = r.unidade_id and laboratorio_id = 'CP' and mes = v_mes and status <> 'cancelada';
    if rid is null then
      cri := cri + 1; st := 'criada';
      if not p_simular then
        insert into pedidos_novo.receita (unidade_id, laboratorio_id, tipo, mes, status, status_em, calculo)
        values (r.unidade_id, 'CP', 'mensal', v_mes, 'rascunho', jsonb_build_object('rascunho', pedidos_novo.hoje()), calc) returning id into rid;
        insert into pedidos_novo.receita_item (receita_id, produto_id, qtd, qtd_calculada, media, total_periodo)
        select rid, pr.id, (e.value->>'qtd')::numeric, (e.value->>'qtd')::numeric, (e.value->>'media')::numeric, (e.value->>'total')::numeric
        from jsonb_each(coalesce(r.itens, '{}')) e join pedidos_novo.produto pr on pr.laboratorio_id = 'CP' and pr.codigo = e.key;
      end if;
    elsif st = 'rascunho' then
      atu := atu + 1; st := 'atualizada';
      if not p_simular then
        update pedidos_novo.receita set calculo = calc where id = rid;
        delete from pedidos_novo.receita_item ri using pedidos_novo.produto pr
         where ri.receita_id = rid and pr.id = ri.produto_id and not ri.ajustado and not (coalesce(r.itens, '{}') ? pr.codigo);
        update pedidos_novo.receita_item ri set qtd_calculada = null, media = null, total_periodo = null
          from pedidos_novo.produto pr where ri.receita_id = rid and pr.id = ri.produto_id and not (coalesce(r.itens, '{}') ? pr.codigo);
        insert into pedidos_novo.receita_item (receita_id, produto_id, qtd, qtd_calculada, media, total_periodo)
        select rid, pr.id, (e.value->>'qtd')::numeric, (e.value->>'qtd')::numeric, (e.value->>'media')::numeric, (e.value->>'total')::numeric
        from jsonb_each(coalesce(r.itens, '{}')) e join pedidos_novo.produto pr on pr.laboratorio_id = 'CP' and pr.codigo = e.key
        on conflict (receita_id, produto_id) do update
          set qtd_calculada = excluded.qtd_calculada, media = excluded.media, total_periodo = excluded.total_periodo,
              qtd = case when pedidos_novo.receita_item.ajustado then pedidos_novo.receita_item.qtd else excluded.qtd end;
      end if;
    else
      ign := ign + 1; st := 'ignorada (' || st || ')';
    end if;
    res := res || jsonb_build_object('unidade_id', r.unidade_id, 'unidade', r.nome, 'acao', st, 'pedidos', r.peds, 'itens', coalesce(r.itens, '{}'));
  end loop;
  return jsonb_build_object('mes', to_char(v_mes, 'YYYY-MM'), 'janelaMeses', n, 'periodo', jsonb_build_object('de', ini, 'ate', v_mes - 1),
                            'criadas', cri, 'atualizadas', atu, 'ignoradas', ign, 'simulado', p_simular, 'unidades', res);
end $$;
revoke all on function pedidos_novo.gerar_receitas_mes(date, boolean) from public, anon, authenticated;

-- ---------- termo ----------
alter table pedidos_novo.termo
  add column if not exists arquivo_nome text,
  add column if not exists arquivo_local text not null default 'sistema_novo' check (arquivo_local in ('sistema_antigo','sistema_novo')),
  add column if not exists legado_ref text unique,
  add column if not exists obs text,
  add column if not exists criado_em timestamptz not null default now();

-- =====================================================================
-- CARGA do sistema antigo (por = importacao-sistema-antigo no registro de alterações)
-- =====================================================================
select set_config('request.jwt.claims', '{"email":"importacao-sistema-antigo"}', false);

create temp table m_cli as
  select d.id cli, d.data->>'nome' cli_nome, ue.unidade_id, d.data
  from pedidos_novo.legado_doc d join nucleo.empresa e on e.cnpj = regexp_replace(d.data->>'cnpj', '\D', '', 'g')
  join nucleo.unidade_empresa ue on ue.empresa_id = e.id and ue.ate is null
  where d.col = 'clinicas';

insert into pedidos_novo.unidade_protocolo (unidade_id, protocolo, fonte)
select unidade_id, data->>'protocolo', 'sistema antigo (clinicas.protocolo)' from m_cli where data->>'protocolo' in ('Antigo','Novo');

-- termos de responsabilidade com o Centro Paulista (checklist da clínica, status OK). RT = pessoa criada a partir de rtTermo/crbmTermo.
insert into pedidos_novo.termo (unidade_id, laboratorio_id, rt_id, de, arquivo_nome, arquivo_local, legado_ref, obs)
select m.unidade_id, 'CP', po.pessoa_id, (t.v->>'emissao')::date, t.v->'anexo'->>'nome', 'sistema_antigo', 'clinicas:' || m.cli,
       'RT no termo (sistema antigo): ' || btrim(m.data->>'rtTermo') || coalesce(' · ' || nullif(btrim(m.data->>'crbmTermo'), ''), ' · registro não informado')
from m_cli m
cross join lateral (select m.data->'docs'->'termo-de-responsabilidade-no-laboratorio-centro-paulista' v) t
join nucleo.pessoa_origem po on po.sistema = 'pedidos-antigo:clinicas.rtTermo' and po.ref = m.cli
where t.v->>'status' = 'OK' and t.v->>'emissao' ~ '^\d{4}-\d{2}-\d{2}$';

-- 51 receitas mensais do antigo. Assinante ligado ao núcleo só pelo registro (conselho + número), nunca pelo nome.
insert into pedidos_novo.receita (unidade_id, laboratorio_id, prescritor_id, emitida_em, tipo, mes, status, status_em, calculo, legado_ref, legado, criado_em)
select m.unidade_id, 'CP', ass.pessoa_id, nullif(d.data->>'emitidaEm', '')::date, 'mensal', (d.data->>'mes' || '-01')::date,
       case d.data->>'status' when 'Rascunho' then 'rascunho' when 'Gerada' then 'gerada' when 'Enviada ao RT' then 'enviada_rt' end,
       jsonb_strip_nulls(jsonb_build_object('rascunho', d.data->'statusEm'->'Rascunho', 'gerada', d.data->'statusEm'->'Gerada', 'enviada_rt', d.data->'statusEm'->'Enviada ao RT')),
       d.data->'calc', 'receitas:' || d.id,
       jsonb_strip_nulls(jsonb_build_object('assinante', d.data->'assinante', 'statusEm', d.data->'statusEm', 'ajustes', d.data->'ajustes',
                                            'interno', d.data->'interno', 'internoEm', d.data->'internoEm', 'status', d.data->>'status')),
       coalesce((d.data->>'criado')::timestamptz, now())
from pedidos_novo.legado_doc d
join m_cli m on m.cli_nome = d.data->>'clinica'
left join lateral (
  select min(pr.pessoa_id::text)::uuid pessoa_id from nucleo.ler_registro(d.data->'assinante'->>'crbm') reg
  join nucleo.profissional pr on pr.conselho = reg.conselho and pr.registro = reg.registro
  having count(distinct pr.pessoa_id) = 1) ass on true
where d.col = 'receitas';

insert into pedidos_novo.receita_item (receita_id, produto_id, qtd, qtd_calculada, media, total_periodo, ajustado, ajuste_justificativa)
select r.id, pr.id,
       coalesce((d.data->'ajustes'->>k.k)::numeric, (d.data->'calc'->'itens'->k.k->>'qtd')::numeric, 0),
       (d.data->'calc'->'itens'->k.k->>'qtd')::numeric, (d.data->'calc'->'itens'->k.k->>'media')::numeric, (d.data->'calc'->'itens'->k.k->>'total')::numeric,
       d.data->'ajustes' ? k.k,
       case when d.data->'ajustes' ? k.k then 'Ajuste feito no sistema antigo (motivo não registrado no cadastro da receita)' end
from pedidos_novo.receita r
join pedidos_novo.legado_doc d on d.col = 'receitas' and 'receitas:' || d.id = r.legado_ref
cross join lateral (select jsonb_object_keys(coalesce(d.data->'calc'->'itens', '{}')) k union select jsonb_object_keys(coalesce(d.data->'ajustes', '{}'))) k
join pedidos_novo.produto pr on pr.laboratorio_id = 'CP' and pr.codigo = k.k;

drop table m_cli;
select set_config('request.jwt.claims', '', false);
