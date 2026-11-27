-- 0014: receitas geradas por unidade (individual) ou em lote (várias/todas). Mesma regra da 0013; só acrescenta o filtro de unidades.
drop function if exists pedidos_novo.gerar_receitas_mes(date, boolean);
create or replace function pedidos_novo.gerar_receitas_mes(p_mes date, p_simular boolean default true, p_unidades uuid[] default null)
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
    where u.ativo and (p_unidades is null or u.id = any(p_unidades)) order by u.nome
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
revoke all on function pedidos_novo.gerar_receitas_mes(date, boolean, uuid[]) from public, anon, authenticated;
