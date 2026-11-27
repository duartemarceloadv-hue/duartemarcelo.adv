-- =====================================================================
-- 0016: Laboratórios › Notas e PV — conferência pedido × NF recalculável e fila de divergências com dono
--  * pedidos_novo.conferir_pedido_nf(pedido): MESMA REGRA da conferência do sistema antigo (função conferir() do
--    omie-sync v16, lida em 27/11/2026), agora com os dados do sistema novo:
--      - soma as quantidades de todas as NFs não canceladas do pedido (venda + bonificação CFOP 5910/6910);
--        a bonificação soma quantidade, não soma valor;
--      - item do pedido × NF: confere se pedido = vendido + bonificado, ou pedido = vendido (bonificação a mais vira aviso);
--        itens que no antigo vieram da própria NF ("itensFonte = nota fiscal") não são comparados;
--      - item da NF que não está na tabela de produtos; preço de cada item × tabela vigente na data de emissão da NF;
--      - frete do pedido × frete das NFs; valor do pedido × NF (com ou sem frete); cobrado pelo laboratório
--        (parcelas vindas da Omie) × NF; tolerância de R$ 0,50 como no antigo.
--    Adaptações (explicadas no README): valor do pedido = itens + frete do sistema novo, e o "valor informado"
--    do antigo (campo que o sistema novo não tem) entra como linha própria nos pedidos migrados; NF ligada a mais
--    de um pedido confere o grupo de pedidos junto (no antigo cada NF tinha um pedido só).
--  * conferencia_nf: último resultado por pedido (recalculado por botão, ao editar o pedido e nesta migration).
--  * divergencia: fila "Notas e PV" com dono e decisão (aceitar com justificativa / cobrar o laboratório / corrigido).
--      tipo nf: aberta pelo recálculo; fecha sozinha quando a conferência passa a bater.
--      tipo pv: as 63 divergências com o pedido de venda do laboratório (pendPV) abertas no sistema antigo,
--      importadas como estão (o pedido de venda foi lido fora do sistema; o antigo só guardou as diferenças).
--  Nenhum dado existente é alterado.
--  Aplicada em duas partes (a 1ª tentativa inteira caiu por tempo de resposta do servidor e não gravou nada):
--  pedidos_novo_0016_notas_e_pv (estrutura e funções) e pedidos_novo_0016b_carga_notas_e_pv (a "carga inicial" do fim).
-- =====================================================================

-- ---------- formatação (padrão brasileiro, como o texto do antigo) ----------
create or replace function pedidos_novo.fmt_r(v numeric) returns text language sql immutable set search_path = '' as $$
  select replace(replace(replace(to_char(round(coalesce(v,0),2), 'FM999G999G999G990D00'), ',', '#'), '.', ','), '#', '.') $$;
create or replace function pedidos_novo.fmt_q(v numeric) returns text language sql immutable set search_path = '' as $$
  select case when v = trunc(v) then trunc(v)::bigint::text else replace(trim(trailing '0' from v::text), '.', ',') end $$;
create or replace function pedidos_novo.fmt_d(d date) returns text language sql immutable set search_path = '' as $$ select to_char(d, 'DD/MM/YY') $$;
-- nomes curtos dos produtos usados nas mensagens do antigo (NOME do omie-sync)
create or replace function pedidos_novo.nome_conf(c text) returns text language sql immutable set search_path = '' as $$
  select case c when 'fator' then 'Fatores de crescimento' when 'dutasterida' then 'Dutasterida' when 'minox-2' then 'Minoxidil 2%'
    when 'minox-05' then 'Minoxidil 0,5%' when 'pillfood' then 'Pill Food' when 'complexo' then 'Complexo vitamínico' when 'lidocaina' then 'Lidocaína'
    when 'luteolina' then 'Luteolina' when 'cafeisilane' then 'Cafeisilane' when 'cloreto' then 'Cloreto' when 'cafeina' then 'Cafeína'
    when 'tacrolimus' then 'Tacrolimus' when 'triancinolona' then 'Triancinolona' else c end $$;

create or replace function pedidos_novo.conferir_pedido_nf(p_pedido uuid) returns jsonb
language plpgsql stable set search_path = '' as $$
-- Conferência pedido × NF: mesma regra da função conferir() do sistema antigo (omie-sync v16), lendo os dados do sistema novo.
-- Uma NF pode valer para mais de um pedido: os pedidos que dividem NFs são conferidos juntos (soma dos pedidos × soma das NFs).
declare
  v_grupo uuid[]; pe record; n record; it record;
  v_nfs text[] := '{}'; v_notas jsonb := '[]'; v_itens_nf jsonb := '{}'; v_venda jsonb := '{}'; v_bonif jsonb := '{}';
  v_itens_ped jsonb := '{}'; v_dif jsonb := '[]'; v_outros text[] := '{}'; v_diverg text[] := '{}'; v_avisos text[] := '{}';
  v_frete numeric := 0; v_total numeric := 0; v_bx_tot numeric := 0; v_acima numeric := 0; bx numeric; bx_itens text[];
  v_tab record; v_dif1 numeric; v_tem boolean; k text; a numeric; v numeric; bo numeric; nome text;
  v_cobrado numeric; v_lab int; v_prod numeric; v_val_ant numeric; v_n_ant int;
begin
  with recursive g(pid) as (
    select p_pedido
    union
    select np2.pedido_id from g join pedidos_novo.nota_pedido np1 on np1.pedido_id = g.pid
      join pedidos_novo.nota_fiscal nf on nf.id = np1.nota_id and not nf.cancelada
      join pedidos_novo.nota_pedido np2 on np2.nota_id = np1.nota_id)
  select array_agg(pid order by pid) into v_grupo from g;
  select coalesce(sum(p.frete), 0) frete, coalesce(sum(vp.subtotal), 0) subtotal, coalesce(sum(vp.total), 0) total, count(*) n,
         bool_and(coalesce((select d.data->>'itensFonte' from pedidos_novo.legado_doc d where d.col = 'pedidos' and p.legado_ref like 'cp:%' and d.id = substr(p.legado_ref, 4)), '') <> 'nota fiscal') fonte_ok
    into pe from pedidos_novo.pedido p join pedidos_novo.v_pedido vp on vp.id = p.id where p.id = any(v_grupo);
  if pe.n = 0 then return null; end if;
  for n in select distinct nf.id, nf.numero, nf.emissao, coalesce(nf.total,0) total, coalesce(nf.frete,0) frete
             from pedidos_novo.nota_pedido np join pedidos_novo.nota_fiscal nf on nf.id = np.nota_id
            where np.pedido_id = any(v_grupo) and not nf.cancelada and exists (select 1 from pedidos_novo.nota_item i where i.nota_id = nf.id)
            order by nf.emissao, nf.numero loop
    v_nfs := v_nfs || n.numero; v_frete := v_frete + n.frete;
    -- bonificação/remessa (CFOP 5910/6910): soma quantidade, não soma valor
    select coalesce(sum(coalesce(i.total, i.qtd * coalesce(i.preco_unit,0))),0),
           coalesce(array_agg(coalesce(pedidos_novo.nome_conf(pr.codigo), i.descricao) || ' ' || pedidos_novo.fmt_q(i.qtd) order by i.id), '{}')
      into bx, bx_itens
      from pedidos_novo.nota_item i left join pedidos_novo.produto pr on pr.id = i.produto_id
     where i.nota_id = n.id and i.cfop ~ '^[56]910$';
    v_bx_tot := v_bx_tot + bx; v_total := v_total + n.total - bx;
    v_notas := v_notas || jsonb_build_object('nf', n.numero, 'emissao', n.emissao, 'total', n.total, 'frete', n.frete,
      'tipo', case when bx <> 0 and abs(bx - n.total) < 0.01 then 'bonificação' when bx <> 0 then 'venda + bonificação' else 'venda' end, 'bonif', to_jsonb(bx_itens));
    for it in select i.*, pr.codigo from pedidos_novo.nota_item i left join pedidos_novo.produto pr on pr.id = i.produto_id where i.nota_id = n.id order by i.id loop
      if it.codigo is null then v_outros := v_outros || (pedidos_novo.fmt_q(it.qtd) || ' × ' || it.descricao); continue; end if;
      v_itens_nf := jsonb_set(v_itens_nf, array[it.codigo], to_jsonb(coalesce((v_itens_nf->>it.codigo)::numeric,0) + it.qtd));
      if it.cfop ~ '^[56]910$' then
        v_bonif := jsonb_set(v_bonif, array[it.codigo], to_jsonb(coalesce((v_bonif->>it.codigo)::numeric,0) + it.qtd)); continue;
      end if;
      v_venda := jsonb_set(v_venda, array[it.codigo], to_jsonb(coalesce((v_venda->>it.codigo)::numeric,0) + it.qtd));
      if not coalesce(it.preco_unit,0) > 0 then continue; end if;
      -- preço conferido com a tabela vigente na data de emissão da NF
      select pc.de, pc.valor into v_tab from pedidos_novo.preco pc where pc.produto_id = it.produto_id and n.emissao is not null and pc.de <= n.emissao order by pc.de desc limit 1;
      if v_tab.de is not null and abs(it.preco_unit - v_tab.valor) > 0.005 then
        v_dif1 := (it.preco_unit - v_tab.valor) * it.qtd; v_acima := v_acima + v_dif1;
        v_dif := v_dif || jsonb_build_object('nf', n.numero, 'emissao', n.emissao, 'id', it.codigo, 'unit', it.preco_unit, 'tabela', v_tab.valor, 'vigDe', v_tab.de, 'qtd', it.qtd, 'dif', round(v_dif1, 2));
      end if;
    end loop;
  end loop;
  if cardinality(v_nfs) = 0 then return null; end if;
  select coalesce(jsonb_object_agg(codigo, q), '{}') into v_itens_ped from (
    select pr.codigo, sum(pi.qtd) q from pedidos_novo.pedido_item pi join pedidos_novo.produto pr on pr.id = pi.produto_id
     where pi.pedido_id = any(v_grupo) and pi.qtd > 0 group by pr.codigo) x;
  -- itens que no sistema antigo vieram da própria NF não são comparados com ela
  v_tem := pe.fonte_ok and v_itens_ped <> '{}';
  if v_tem then
    for k in select x from (select jsonb_object_keys(v_itens_ped) x union select jsonb_object_keys(v_itens_nf)) y order by 1 loop
      a := coalesce((v_itens_ped->>k)::numeric, 0); v := coalesce((v_venda->>k)::numeric, 0); bo := coalesce((v_bonif->>k)::numeric, 0); nome := pedidos_novo.nome_conf(k);
      if abs(a - v - bo) < 0.001 then
        if bo <> 0 then v_avisos := v_avisos || format('%s: %s vendidos + %s em bonificação = %s do pedido', nome, pedidos_novo.fmt_q(v), pedidos_novo.fmt_q(bo), pedidos_novo.fmt_q(a)); end if;
        continue;
      end if;
      if abs(a - v) < 0.001 then
        if bo <> 0 then v_avisos := v_avisos || format('%s: %s a mais em bonificação (sem cobrança)', nome, pedidos_novo.fmt_q(bo)); end if;
        continue;
      end if;
      v_diverg := v_diverg || format('%s: pedido %s · NF %s%s', nome, pedidos_novo.fmt_q(a), pedidos_novo.fmt_q(v + bo),
        case when bo <> 0 then format(' (%s vendidos + %s em bonificação)', pedidos_novo.fmt_q(v), pedidos_novo.fmt_q(bo)) else '' end);
    end loop;
  end if;
  foreach k in array v_outros loop v_diverg := v_diverg || ('Item na NF fora da tabela: ' || k); end loop;
  for it in select * from jsonb_to_recordset(v_dif) as d(nf text, emissao date, id text, unit numeric, tabela numeric, "vigDe" date, qtd numeric, dif numeric) loop
    v_diverg := v_diverg || format('Preço %s na NF %s (emitida %s): R$ %s · tabela vigente desde %s: R$ %s — %s un. = R$ %s %s',
      pedidos_novo.nome_conf(it.id), it.nf, pedidos_novo.fmt_d(it.emissao), pedidos_novo.fmt_r(it.unit), pedidos_novo.fmt_d(it."vigDe"), pedidos_novo.fmt_r(it.tabela),
      pedidos_novo.fmt_q(it.qtd), pedidos_novo.fmt_r(abs(it.dif)), case when it.dif > 0 then 'a mais' else 'a menos' end);
  end loop;
  if abs(pe.frete - v_frete) > 0.5 then
    v_diverg := v_diverg || format('Frete: pedido R$ %s · NF R$ %s', pedidos_novo.fmt_r(pe.frete), pedidos_novo.fmt_r(v_frete)); end if;
  -- valor do pedido = itens + frete do sistema novo; como no antigo, só diverge se não bater nem com nem sem o frete
  v_prod := v_total - v_frete;
  if abs(pe.total - v_total) > 0.5 and abs(pe.subtotal - v_prod) > 0.5 then
    v_diverg := v_diverg || format('Valor: pedido R$ %s · NF R$ %s (produtos R$ %s + frete R$ %s)', pedidos_novo.fmt_r(pe.total), pedidos_novo.fmt_r(v_total), pedidos_novo.fmt_r(v_prod), pedidos_novo.fmt_r(v_frete)); end if;
  -- valor informado no sistema antigo (planilha do laboratório / pedido de venda): a regra do antigo comparava este campo,
  -- que não existe no sistema novo; vale só para pedidos migrados e só se todos os do grupo tiverem o valor
  select count(*), sum((d.data->>'valor')::numeric) into v_n_ant, v_val_ant
    from pedidos_novo.pedido p join pedidos_novo.legado_doc d on d.col = 'pedidos' and p.legado_ref = 'cp:' || d.id
   where p.id = any(v_grupo) and jsonb_typeof(d.data->'valor') = 'number';
  if v_n_ant = pe.n and abs(v_val_ant - v_total) > 0.5 and abs(v_val_ant - v_prod) > 0.5 and abs(v_val_ant - pe.total) > 0.5 then
    v_diverg := v_diverg || format('Valor informado no sistema antigo: R$ %s · NF R$ %s (produtos R$ %s + frete R$ %s)', pedidos_novo.fmt_r(v_val_ant), pedidos_novo.fmt_r(v_total), pedidos_novo.fmt_r(v_prod), pedidos_novo.fmt_r(v_frete)); end if;
  -- o que o laboratório cobrou (parcelas vindas da Omie) × NF
  select count(*), coalesce(sum(valor),0) into v_lab, v_cobrado from pedidos_novo.parcela
   where pedido_id = any(v_grupo) and cancelada_motivo is null and origem ilike '%omie%';
  if v_lab > 0 and abs(v_cobrado - v_total) > 0.5 then
    v_diverg := v_diverg || format('Cobrado pelo laboratório R$ %s · NF R$ %s', pedidos_novo.fmt_r(v_cobrado), pedidos_novo.fmt_r(v_total)); end if;
  return jsonb_build_object('grupo', to_jsonb(v_grupo), 'nfs', array_to_string(v_nfs, ', '), 'itensPedido', v_itens_ped, 'itensNF', v_itens_nf, 'venda', v_venda, 'bonif', v_bonif,
    'freteNF', round(v_frete,2), 'totalNF', round(v_total,2), 'produtosNF', round(v_prod,2), 'cobrado', round(v_cobrado,2), 'difPreco', v_dif, 'difPrecoTotal', round(v_acima,2),
    'bonifValor', round(v_bx_tot,2), 'notas', v_notas, 'avisos', to_jsonb(v_avisos), 'diverg', to_jsonb(v_diverg), 'ok', cardinality(v_diverg) = 0,
    'itensDoPedido', v_tem, 'pedido', jsonb_build_object('subtotal', pe.subtotal, 'frete', pe.frete, 'total', pe.total, 'valorAntigo', case when v_n_ant = pe.n then v_val_ant end));
end $$;

-- ---------- último resultado da conferência por pedido ----------
create table if not exists pedidos_novo.conferencia_nf (
  pedido_id uuid primary key references pedidos_novo.pedido(id),
  em        timestamptz not null default now(),
  ok        boolean not null,
  resultado jsonb not null
);
alter table pedidos_novo.conferencia_nf enable row level security;
revoke all on pedidos_novo.conferencia_nf from public, anon, authenticated;

-- ---------- fila de divergências (Notas e PV) ----------
create table if not exists pedidos_novo.divergencia (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null check (tipo in ('nf','pv')),
  pedido_id    uuid not null references pedidos_novo.pedido(id),
  origem       text not null check (origem in ('recalculo','sistema_antigo')),
  assinatura   text not null,                    -- md5 das linhas de diferença (mesma diferença = mesma assinatura)
  itens        jsonb not null,                   -- linhas de diferença, no texto da regra
  dados        jsonb,                            -- nf: resultado da conferência; pv: arquivo e data do antigo
  desde        date not null default pedidos_novo.hoje(),
  status       text not null default 'aberta' check (status in ('aberta','cobrar_lab','aceita','corrigida','resolvida','substituida')),
  dono         text check (dono in ('operacoes','laboratorio')),
  justificativa text,
  decidido_por text,
  decidido_em  timestamptz,
  criada_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (tipo, pedido_id, assinatura),
  check ((status in ('aberta','cobrar_lab')) = (dono is not null))
);
create index if not exists divergencia_aberta_idx on pedidos_novo.divergencia (status, tipo) where status in ('aberta','cobrar_lab');
alter table pedidos_novo.divergencia enable row level security;
revoke all on pedidos_novo.divergencia from public, anon, authenticated;
create trigger t_atualizado before update on pedidos_novo.divergencia for each row execute function pedidos_novo.toca_atualizado();
create trigger t_audita after insert or update or delete on pedidos_novo.divergencia for each row execute function pedidos_novo.audita();

-- assinatura: as mesmas linhas, em qualquer ordem
create or replace function pedidos_novo.assinatura_div(p jsonb) returns text language sql immutable set search_path = '' as $$
  select md5(coalesce(string_agg(x, '|' order by x), '')) from jsonb_array_elements_text(p) x $$;

-- ---------- recálculo (todos os pedidos ou só os indicados) ----------
create or replace function pedidos_novo.recalcular_conferencia_nf(p_pedidos uuid[] default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record; c jsonb; v_ass text; n_conf int := 0; n_div int := 0; n_novas int := 0; n_fech int := 0; k int; v_ids uuid[];
begin
  -- pedidos indicados + os que dividem NF com eles (a conferência é do grupo)
  if p_pedidos is not null then
    with recursive g(pid) as (
      select unnest(p_pedidos)
      union
      select np2.pedido_id from g join pedidos_novo.nota_pedido np1 on np1.pedido_id = g.pid join pedidos_novo.nota_pedido np2 on np2.nota_id = np1.nota_id)
    select array_agg(distinct pid) into v_ids from g;
  end if;
  for r in select p.id from pedidos_novo.pedido p where v_ids is null or p.id = any(v_ids) order by p.id loop
    c := pedidos_novo.conferir_pedido_nf(r.id);
    if c is null then
      delete from pedidos_novo.conferencia_nf where pedido_id = r.id;
      update pedidos_novo.divergencia set status = 'resolvida', dono = null, decidido_em = now(), decidido_por = 'recálculo',
             justificativa = 'O pedido não tem mais nota fiscal com itens para conferir.'
       where tipo = 'nf' and pedido_id = r.id and status in ('aberta','cobrar_lab');
      get diagnostics k = row_count; n_fech := n_fech + k;
      continue;
    end if;
    n_conf := n_conf + 1;
    insert into pedidos_novo.conferencia_nf (pedido_id, em, ok, resultado) values (r.id, now(), (c->>'ok')::boolean, c)
      on conflict (pedido_id) do update set em = excluded.em, ok = excluded.ok, resultado = excluded.resultado;
    if (c->>'ok')::boolean then
      update pedidos_novo.divergencia set status = 'resolvida', dono = null, decidido_em = now(), decidido_por = 'recálculo',
             justificativa = 'A conferência pedido × NF passou a bater.'
       where tipo = 'nf' and pedido_id = r.id and status in ('aberta','cobrar_lab');
      get diagnostics k = row_count; n_fech := n_fech + k;
      continue;
    end if;
    n_div := n_div + 1;
    v_ass := pedidos_novo.assinatura_div(c->'diverg');
    if exists (select 1 from pedidos_novo.divergencia where tipo = 'nf' and pedido_id = r.id and assinatura = v_ass) then
      update pedidos_novo.divergencia set dados = c where tipo = 'nf' and pedido_id = r.id and assinatura = v_ass and dados is distinct from c;
    else
      update pedidos_novo.divergencia set status = 'substituida', dono = null, decidido_em = now(), decidido_por = 'recálculo',
             justificativa = 'A conferência mudou: as diferenças de agora estão em outra linha da fila.'
       where tipo = 'nf' and pedido_id = r.id and status in ('aberta','cobrar_lab');
      insert into pedidos_novo.divergencia (tipo, pedido_id, origem, assinatura, itens, dados, dono)
        values ('nf', r.id, 'recalculo', v_ass, c->'diverg', c, 'operacoes');
      n_novas := n_novas + 1;
    end if;
  end loop;
  return jsonb_build_object('conferidos', n_conf, 'divergentes', n_div, 'novas', n_novas, 'fechadas', n_fech);
end $$;
revoke all on function pedidos_novo.recalcular_conferencia_nf(uuid[]) from public, anon, authenticated;

-- ---------- regra do pedido de venda (importar-pv do antigo), pronta para quando o PV for lido no sistema novo ----------
-- p_pv = {dataPedido, forma, frete, total, itens:{codigo:qtd}, outros:[texto], credito, notas:[texto]}; devolve as linhas de diferença.
create or replace function pedidos_novo.divergencias_pv(p_pedido uuid, p_pv jsonb)
returns text[] language plpgsql stable set search_path = '' as $$
declare pe record; d text[] := '{}'; k text; a numeric; b numeric; v_itens jsonb;
begin
  select p.enviado_em, p.frete, vp.total into pe from pedidos_novo.pedido p join pedidos_novo.v_pedido vp on vp.id = p.id where p.id = p_pedido;
  select coalesce(jsonb_object_agg(pr.codigo, i.qtd), '{}') into v_itens from pedidos_novo.pedido_item i join pedidos_novo.produto pr on pr.id = i.produto_id where i.pedido_id = p_pedido and i.qtd > 0;
  if v_itens <> '{}' then
    for k in select x from (select jsonb_object_keys(v_itens) x union select jsonb_object_keys(coalesce(p_pv->'itens', '{}'))) y order by 1 loop
      a := coalesce((v_itens->>k)::numeric, 0); b := coalesce((p_pv->'itens'->>k)::numeric, 0);
      if a <> b then d := d || format('%s: sistema %s · pedido de venda %s', pedidos_novo.nome_conf(k), pedidos_novo.fmt_q(a), pedidos_novo.fmt_q(b)); end if;
    end loop;
  end if;
  if p_pv ? 'total' and abs(pe.total - (p_pv->>'total')::numeric) > 0.5 then
    d := d || format('Valor: sistema R$ %s · pedido de venda R$ %s', pedidos_novo.fmt_r(pe.total), pedidos_novo.fmt_r((p_pv->>'total')::numeric)); end if;
  if pe.enviado_em is not null and coalesce(p_pv->>'dataPedido', '') <> '' and pe.enviado_em <> (p_pv->>'dataPedido')::date then
    d := d || format('Data do pedido: sistema %s · pedido de venda %s', to_char(pe.enviado_em, 'DD/MM/YYYY'), to_char((p_pv->>'dataPedido')::date, 'DD/MM/YYYY')); end if;
  if p_pv ? 'frete' and jsonb_typeof(p_pv->'frete') = 'number' and abs(pe.frete - (p_pv->>'frete')::numeric) > 0.5 then
    d := d || format('Frete: sistema R$ %s · pedido de venda R$ %s', pedidos_novo.fmt_r(pe.frete), pedidos_novo.fmt_r((p_pv->>'frete')::numeric)); end if;
  for k in select jsonb_array_elements_text(coalesce(p_pv->'outros', '[]')) loop d := d || ('Item fora da tabela no pedido de venda: ' || k); end loop;
  if coalesce(p_pv->>'credito', '') <> '' then d := d || ('Pagamento com abatimento de crédito: ' || (p_pv->>'credito')); end if;
  for k in select jsonb_array_elements_text(coalesce(p_pv->'notas', '[]')) loop d := d || k; end loop;
  return d;
end $$;

-- ---------- apagar os pedidos de TESTE antes da virada (não toca nos migrados: só teste = true) ----------
create or replace function pedidos_novo.apagar_pedidos_teste()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_ids uuid[]; v_pag uuid[]; n jsonb := '{}'; k int;
begin
  select coalesce(array_agg(id), '{}') into v_ids from pedidos_novo.pedido where teste;
  if cardinality(v_ids) = 0 then return jsonb_build_object('pedidos', 0); end if;
  select coalesce(array_agg(distinct pp.pagamento_id), '{}') into v_pag
    from pedidos_novo.pagamento_parcela pp join pedidos_novo.parcela pa on pa.id = pp.parcela_id where pa.pedido_id = any(v_ids);
  if exists (select 1 from pedidos_novo.pagamento_parcela pp join pedidos_novo.parcela pa on pa.id = pp.parcela_id
              where pp.pagamento_id = any(v_pag) and not (pa.pedido_id = any(v_ids))) then
    raise exception 'Um comprovante de pedido de teste também paga parcela de pedido verdadeiro. Nada foi apagado; confira à mão.';
  end if;
  delete from pedidos_novo.pagamento_parcela where pagamento_id = any(v_pag);
  delete from pedidos_novo.pagamento where id = any(v_pag); get diagnostics k = row_count; n := n || jsonb_build_object('pagamentos', k);
  delete from pedidos_novo.divergencia where pedido_id = any(v_ids);
  delete from pedidos_novo.conferencia_nf where pedido_id = any(v_ids);
  delete from pedidos_novo.pendencia where pedido_id = any(v_ids) or parcela_id in (select id from pedidos_novo.parcela where pedido_id = any(v_ids));
  delete from pedidos_novo.parcela where pedido_id = any(v_ids); get diagnostics k = row_count; n := n || jsonb_build_object('parcelas', k);
  delete from pedidos_novo.pedido_item where pedido_id = any(v_ids); get diagnostics k = row_count; n := n || jsonb_build_object('itens', k);
  delete from pedidos_novo.pedido_receita where pedido_id = any(v_ids);
  delete from pedidos_novo.pedido_arquivo where pedido_id = any(v_ids);
  delete from pedidos_novo.nota_pedido where pedido_id = any(v_ids);
  delete from pedidos_novo.etapa_lab where pedido_id = any(v_ids);
  update pedidos_novo.pedido set mae_id = null where mae_id = any(v_ids) and not teste;
  delete from pedidos_novo.pedido where id = any(v_ids); get diagnostics k = row_count; n := n || jsonb_build_object('pedidos', k);
  delete from pedidos_novo.numeracao where serie = 'TST';
  return n;
end $$;
revoke all on function pedidos_novo.apagar_pedidos_teste() from public, anon, authenticated;

-- ---------- carga inicial ----------
-- 1) as 63 divergências com o pedido de venda que estavam abertas no sistema antigo (texto como está)
select set_config('request.jwt.claims', '{"email":"importacao-sistema-antigo"}', true);
insert into pedidos_novo.divergencia (tipo, pedido_id, origem, assinatura, itens, dados, desde, dono)
select 'pv', p.id, 'sistema_antigo', pedidos_novo.assinatura_div(d.data->'pendPV'->'itens'), d.data->'pendPV'->'itens',
       jsonb_build_object('arquivo', d.data->'pendPV'->>'arquivo', 'em', d.data->'pendPV'->>'em', 'legado', d.id),
       coalesce((d.data->'pendPV'->>'em')::date, pedidos_novo.hoje()), 'operacoes'
  from pedidos_novo.legado_doc d join pedidos_novo.pedido p on p.legado_ref = 'cp:' || d.id
 where d.col = 'pedidos' and jsonb_typeof(d.data->'pendPV') = 'object' and d.data->'pendPV'->>'status' = 'aberta'
on conflict (tipo, pedido_id, assinatura) do nothing;
-- 2) conferência pedido × NF de todos os pedidos com NF
select set_config('request.jwt.claims', '{"email":"recalculo-conferencia"}', true);
select pedidos_novo.recalcular_conferencia_nf(null);
