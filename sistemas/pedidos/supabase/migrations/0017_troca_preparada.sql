-- =====================================================================
-- 0017: troca do sistema antigo de Laboratórios (Pedidos) pelo novo — PREPARAÇÃO (28/11/2026)
-- Esta migration NÃO muda nenhum dado: só cria
--   * pedidos_novo.num_interno_anterior  (número DH que o pedido tinha antes da renumeração D13; pesquisável)
--   * pedidos_novo.troca_retrato()        (retrato de pedidos, parcelas, pagamentos, NF e receitas)
--   * pedidos_novo.troca_diferencas()     (o que mudou no antigo depois da cópia, pedido a pedido, para revisar)
--   * pedidos_novo.troca_laboratorios(p_simular)  (o dia da troca: apaga TST, renumera D13, liga a numeração oficial)
-- Por padrão roda em SIMULAÇÃO: faz tudo e desfaz no fim, devolvendo os números.
-- Para valer, além de p_simular = false, é preciso na mesma transação:
--   select set_config('pedidos_novo.troca_confirmo', 'SIM', true);
-- Roteiro completo: sistemas/pedidos/ROTEIRO-TROCA.md
-- D14 (somar todas as notas): conferido em 28/11/2026 — o sistema novo não tem regra de R$ 500,00
-- (conferir_pedido_nf soma toda NF não cancelada; a função omie liga toda NF ao pedido). Nada a mudar.
-- =====================================================================

create table if not exists pedidos_novo.num_interno_anterior (
  pedido_id uuid primary key references pedidos_novo.pedido(id),
  anterior  text not null,
  novo      text not null,
  em        timestamptz not null default now(),
  motivo    text not null
);
create index if not exists num_interno_anterior_busca on pedidos_novo.num_interno_anterior (anterior);
alter table pedidos_novo.num_interno_anterior enable row level security;
revoke all on pedidos_novo.num_interno_anterior from public, anon, authenticated;

-- ---------- retrato (contagens e somas em R$; hash linha a linha sem as colunas que a troca muda de propósito) ----------
create or replace function pedidos_novo.troca_retrato() returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'pedidos', (select jsonb_build_object('n', count(*), 'teste', count(*) filter (where teste), 'oficiais', count(*) filter (where not teste),
                  'rs_oficiais', (select sum(v.total) from pedidos_novo.v_pedido v join pedidos_novo.pedido p on p.id = v.id where not p.teste))
                from pedidos_novo.pedido),
    'pedidos_por_situacao', (select jsonb_object_agg(situacao, jsonb_build_array(n, v)) from (
        select v.situacao, count(*) n, sum(v.total) v from pedidos_novo.v_pedido v join pedidos_novo.pedido p on p.id = v.id where not p.teste group by 1) x),
    'itens', (select count(*) from pedidos_novo.pedido_item i join pedidos_novo.pedido p on p.id = i.pedido_id where not p.teste),
    'parcelas', (select jsonb_build_object('n', count(*), 'rs', sum(x.valor)) from pedidos_novo.parcela x join pedidos_novo.pedido p on p.id = x.pedido_id where not p.teste),
    'parcelas_por_situacao', (select jsonb_object_agg(situacao, jsonb_build_array(n, v)) from (
        select v.situacao, count(*) n, sum(v.valor) v from pedidos_novo.v_parcela v join pedidos_novo.pedido p on p.id = v.pedido_id where not p.teste group by 1) x),
    'pagamentos', (select jsonb_build_object('n', count(*), 'rs', sum(valor)) from pedidos_novo.pagamento),
    'pagamento_parcela_rs', (select sum(valor) from pedidos_novo.pagamento_parcela),
    'notas', (select jsonb_build_object('n', count(*), 'rs', sum(total), 'ligacoes', (select count(*) from pedidos_novo.nota_pedido)) from pedidos_novo.nota_fiscal),
    'nota_item', (select count(*) from pedidos_novo.nota_item),
    'receitas', (select jsonb_build_object('n', count(*), 'itens', (select count(*) from pedidos_novo.receita_item)) from pedidos_novo.receita),
    'divergencias_abertas', (select count(*) from pedidos_novo.divergencia where status in ('aberta','cobrar_lab')),
    'conferencia_nf', (select jsonb_build_object('conferidos', count(*), 'com_diferenca', count(*) filter (where not ok)) from pedidos_novo.conferencia_nf),
    'hash', jsonb_build_object(
      'pedido_sem_num', (select md5(string_agg((to_jsonb(x) - 'num_interno' - 'atualizado_em')::text, ',' order by x.id)) from pedidos_novo.pedido x where not x.teste),
      'parcela', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.parcela x join pedidos_novo.pedido p on p.id = x.pedido_id where not p.teste),
      'pagamento', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.pagamento x),
      'nota_fiscal', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.nota_fiscal x),
      'receita', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.receita x)),
    'numeracao', jsonb_build_object(
      'maior_dh_novo', (select max(num_interno) from pedidos_novo.pedido where num_interno ~ '^DH-\d{4}-\d{4,}$'),
      'maior_dh_antigo', (select max(data->>'interno') from pedidos_novo.legado_doc where col = 'pedidos' and data->>'interno' ~ '^DH-\d{4}-\d{4,}$'),
      'contador_antigo', (select data from pedidos_novo.legado_doc where col = 'config' and id = 'interno_dh'),
      'criar_pedido_teste', (select valor from pedidos_novo.parametro where chave = 'criar_pedido_teste'),
      'dh_diferente_do_antigo', (select count(*) from pedidos_novo.pedido p join pedidos_novo.legado_doc d on d.col = 'pedidos' and p.legado_ref = 'cp:' || d.id
                                  where d.data->>'interno' is distinct from p.num_interno))
  ) $$;
revoke all on function pedidos_novo.troca_retrato() from public, anon, authenticated;

-- ---------- o que mudou no antigo depois da cópia (precisa de pedidos_novo.legado_doc_base, criada no dia) ----------
-- Três lados: base = cópia de 26/11 guardada antes de recopiar; antigo = cópia recopiada no dia; novo = sistema novo hoje.
-- Lista, por pedido, os campos do antigo que mudaram depois da cópia. Não grava nada: é a lista de revisão do dia.
create or replace function pedidos_novo.troca_diferencas()
returns table (pedido text, num_novo text, ref text, novo_no_antigo boolean, campos text[])
language plpgsql stable set search_path = '' as $$
begin
  if to_regclass('pedidos_novo.legado_doc_base') is null then
    raise exception 'Guarde a cópia de antes (passo 2 do roteiro) antes de recopiar o antigo.';
  end if;
  return query execute $q$
    select d.data->>'interno', p.num_interno, d.id, b.id is null,
           array(select k from jsonb_object_keys(d.data) k
                  where k not in ('atualizado','hist','confNF','finLab')
                    and (b.data -> k) is distinct from (d.data -> k)
                 union
                 select k from jsonb_object_keys(coalesce(b.data, '{}')) k where not (d.data ? k)
                 order by 1)
      from pedidos_novo.legado_doc d
      left join pedidos_novo.legado_doc_base b on b.col = d.col and b.id = d.id
      left join pedidos_novo.pedido p on p.legado_ref = 'cp:' || d.id
     where d.col = 'pedidos' and (b.id is null or b.data is distinct from d.data)
     order by 1 $q$;
end $$;
revoke all on function pedidos_novo.troca_diferencas() from public, anon, authenticated;

-- ---------- o dia da troca ----------
create or replace function pedidos_novo.troca_laboratorios(p_simular boolean default true) returns jsonb
language plpgsql volatile set search_path = '' as $$
declare
  v_antes jsonb; v_depois jsonb; v_teste jsonb; v_res jsonb; v_map jsonb; v_n int; v_base int; v_ano int; v_dup text; v_proximo text;
begin
  if not p_simular and coalesce(current_setting('pedidos_novo.troca_confirmo', true), '') <> 'SIM' then
    raise exception 'Para valer, rode antes: select set_config(''pedidos_novo.troca_confirmo'', ''SIM'', true);';
  end if;
  begin
    perform set_config('request.jwt.claims', '{"email":"troca-laboratorios","role":"service_role"}', true);
    perform set_config('nucleo.origem', 'troca', true);
    v_antes := pedidos_novo.troca_retrato();

    -- 1. apagar os pedidos de teste (TST-…); não toca nos pedidos oficiais
    perform set_config('nucleo.justificativa', 'Troca do sistema: pedidos do ambiente de teste apagados', true);
    v_teste := pedidos_novo.apagar_pedidos_teste();

    -- 2. renumeração D13: vale o DH do antigo; os que só existem no novo ganham número acima do maior existente
    create temp table _troca_num on commit drop as
      select p.id, p.num_interno atual, d.data->>'interno' alvo, 'D13: vale o número do sistema antigo'::text motivo
        from pedidos_novo.pedido p join pedidos_novo.legado_doc d on d.col = 'pedidos' and p.legado_ref = 'cp:' || d.id
       where not p.teste and d.data->>'interno' ~ '^DH-\d{4}-\d{4,}$';
    v_ano := extract(year from pedidos_novo.hoje())::int;
    select greatest(
      coalesce((select max(substr(data->>'interno', 9)::int) from pedidos_novo.legado_doc
                 where col = 'pedidos' and data->>'interno' ~ ('^DH-' || v_ano || '-\d{4,}$')), 0),
      coalesce((select (data->>'seq')::int from pedidos_novo.legado_doc
                 where col = 'config' and id = 'interno_dh' and data->>'ano' = v_ano::text and data->>'seq' ~ '^\d+$'), 0))
      into v_base;
    insert into _troca_num
      select p.id, p.num_interno, 'DH-' || v_ano || '-' || lpad((v_base + row_number() over (order by p.num_interno, p.id))::text, 4, '0'),
             'D13: pedido que só existe no sistema novo; número acima do maior do antigo'
        from pedidos_novo.pedido p
       where not p.teste and p.num_interno is not null and p.id not in (select id from _troca_num);
    -- conferências antes de mexer: nenhum número repetido, nenhum alvo já usado por quem não muda
    select string_agg(alvo, ', ') into v_dup from (select alvo from _troca_num group by alvo having count(*) > 1) x;
    if v_dup is not null then raise exception 'Renumeração com número repetido: %', v_dup; end if;
    select string_agg(t.alvo, ', ') into v_dup from _troca_num t join pedidos_novo.pedido p on p.num_interno = t.alvo
      where p.id not in (select id from _troca_num);
    if v_dup is not null then raise exception 'Número de destino já usado por outro pedido: %', v_dup; end if;
    delete from _troca_num where alvo = atual;
    select coalesce(jsonb_agg(jsonb_build_object('de', atual, 'para', alvo) order by alvo), '[]') into v_map from _troca_num;
    -- dois passos (a trava de número único não é adiável): número provisório e depois o definitivo
    perform set_config('nucleo.justificativa', 'Troca do sistema (D13): número provisório durante a renumeração', true);
    update pedidos_novo.pedido p set num_interno = 'TROCA-' || p.id from _troca_num t where t.id = p.id;
    perform set_config('nucleo.justificativa', 'Troca do sistema (D13): vale o número DH do sistema antigo', true);
    update pedidos_novo.pedido p set num_interno = t.alvo from _troca_num t where t.id = p.id;
    insert into pedidos_novo.num_interno_anterior (pedido_id, anterior, novo, motivo)
      select id, atual, alvo, motivo from _troca_num
      on conflict (pedido_id) do update set anterior = excluded.anterior, novo = excluded.novo, em = now(), motivo = excluded.motivo;
    get diagnostics v_n = row_count;

    -- 3. numeração oficial: o próximo pedido criado no novo recebe DH acima de tudo o que existe
    select coalesce(max(substr(num_interno, 9)::int), 0) into v_base from pedidos_novo.pedido where num_interno ~ ('^DH-' || v_ano || '-\d{4,}$');
    insert into pedidos_novo.numeracao (serie, ano, ultimo) values ('DH', v_ano, v_base)
      on conflict (serie, ano) do update set ultimo = greatest(pedidos_novo.numeracao.ultimo, excluded.ultimo);
    perform set_config('nucleo.justificativa', 'Troca do sistema: numeração oficial ligada', true);
    update pedidos_novo.parametro set valor = 'false' where chave = 'criar_pedido_teste';
    -- o próximo número, sem gastar: mesma regra de proximo_num_interno
    v_proximo := 'DH-' || v_ano || '-' || lpad((greatest(v_base,
      coalesce((select max(substr(data->>'interno', 9)::int) from pedidos_novo.legado_doc where col = 'pedidos' and data->>'interno' ~ ('^DH-' || v_ano || '-\d{4,}$')), 0),
      coalesce((select (data->>'seq')::int from pedidos_novo.legado_doc where col = 'config' and id = 'interno_dh' and data->>'ano' = v_ano::text and data->>'seq' ~ '^\d+$'), 0)) + 1)::text, 4, '0');

    v_depois := pedidos_novo.troca_retrato();
    v_res := jsonb_build_object('simulacao', p_simular, 'antes', v_antes, 'depois', v_depois, 'teste_apagados', v_teste,
      'renumerados', v_n, 'renumeracao', v_map, 'proximo_numero', v_proximo,
      'iguais', jsonb_build_object(
        'pedidos_oficiais', v_antes->'pedidos'->'oficiais' = v_depois->'pedidos'->'oficiais',
        'pedidos_rs', v_antes->'pedidos'->'rs_oficiais' = v_depois->'pedidos'->'rs_oficiais',
        'parcelas', v_antes->'parcelas' = v_depois->'parcelas',
        'pagamentos', v_antes->'pagamentos' = v_depois->'pagamentos',
        'notas', v_antes->'notas' = v_depois->'notas',
        'receitas', v_antes->'receitas' = v_depois->'receitas',
        'hash_pedido_sem_num', v_antes->'hash'->'pedido_sem_num' = v_depois->'hash'->'pedido_sem_num',
        'hash_parcela', v_antes->'hash'->'parcela' = v_depois->'hash'->'parcela',
        'hash_pagamento', v_antes->'hash'->'pagamento' = v_depois->'hash'->'pagamento',
        'hash_nota', v_antes->'hash'->'nota_fiscal' = v_depois->'hash'->'nota_fiscal',
        'hash_receita', v_antes->'hash'->'receita' = v_depois->'hash'->'receita'));
    if p_simular then raise exception using errcode = 'P0D13', message = 'simulacao-desfeita'; end if;
  exception when sqlstate 'P0D13' then
    -- simulação: tudo o que foi feito acima é desfeito; o resultado já está guardado em v_res
    null;
  end;
  return v_res;
end $$;
revoke all on function pedidos_novo.troca_laboratorios(boolean) from public, anon, authenticated;
