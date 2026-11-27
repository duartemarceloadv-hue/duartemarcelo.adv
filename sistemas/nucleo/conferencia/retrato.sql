-- Retrato do Laboratórios (pedidos_novo): contagem por tabela + somas em R$.
-- Rodar antes e depois de qualquer mudança; o resultado precisa ser idêntico.
with c as (
  select 'pedido' t, count(*) n from pedidos_novo.pedido union all
  select 'pedido_item', count(*) from pedidos_novo.pedido_item union all
  select 'pedido_arquivo', count(*) from pedidos_novo.pedido_arquivo union all
  select 'pedido_receita', count(*) from pedidos_novo.pedido_receita union all
  select 'parcela', count(*) from pedidos_novo.parcela union all
  select 'pagamento', count(*) from pedidos_novo.pagamento union all
  select 'pagamento_parcela', count(*) from pedidos_novo.pagamento_parcela union all
  select 'nota_fiscal', count(*) from pedidos_novo.nota_fiscal union all
  select 'nota_item', count(*) from pedidos_novo.nota_item union all
  select 'nota_pedido', count(*) from pedidos_novo.nota_pedido union all
  select 'arquivo', count(*) from pedidos_novo.arquivo union all
  select 'etapa_lab', count(*) from pedidos_novo.etapa_lab union all
  select 'produto', count(*) from pedidos_novo.produto union all
  select 'preco', count(*) from pedidos_novo.preco union all
  select 'laboratorio', count(*) from pedidos_novo.laboratorio union all
  select 'pendencia', count(*) from pedidos_novo.pendencia union all
  select 'execucao_conector', count(*) from pedidos_novo.execucao_conector union all
  select 'legado_doc', count(*) from pedidos_novo.legado_doc union all
  select 'legado_log', count(*) from pedidos_novo.legado_log union all
  select 'legado_tabela', count(*) from pedidos_novo.legado_tabela union all
  select 'unidade', count(*) from pedidos_novo.unidade union all
  select 'unidade_cnpj', count(*) from pedidos_novo.unidade_cnpj union all
  select 'unidade_alias', count(*) from pedidos_novo.unidade_alias union all
  select 'usuario', count(*) from pedidos_novo.usuario union all
  select 'pessoa', count(*) from pedidos_novo.pessoa union all
  select 'termo', count(*) from pedidos_novo.termo union all
  select 'receita', count(*) from pedidos_novo.receita union all
  select 'receita_item', count(*) from pedidos_novo.receita_item
)
select json_build_object(
  'contagens', (select json_object_agg(t, n order by t) from c),
  'pedidos_total_rs', (select sum(total) from pedidos_novo.v_pedido),
  'pedidos_por_situacao', (select json_object_agg(situacao, json_build_array(n, v)) from (select situacao, count(*) n, sum(total) v from pedidos_novo.v_pedido group by 1) x),
  -- por unidade, pelo NOME (os ids das unidades mudam para o uuid de public.unidades na etapa 2)
  'pedidos_por_unidade_hash', (select md5(string_agg(nome||':'||n||':'||v, ',' order by nome)) from (select u.nome, count(*) n, sum(p.total) v from pedidos_novo.v_pedido p join pedidos_novo.unidade u on u.id = p.unidade_id group by 1) x),
  'parcelas_total_rs', (select sum(valor) from pedidos_novo.parcela),
  'parcelas_por_situacao', (select json_object_agg(situacao, json_build_array(n, v)) from (select situacao, count(*) n, sum(valor) v from pedidos_novo.v_parcela group by 1) x),
  'pagamentos_total_rs', (select sum(valor) from pedidos_novo.pagamento),
  'pagamento_parcela_rs', (select sum(valor) from pedidos_novo.pagamento_parcela),
  'pagamentos_por_unidade_hash', (select md5(string_agg(nome||':'||v, ',' order by nome)) from (select u.nome, sum(g.valor) v from pedidos_novo.pagamento g join pedidos_novo.unidade u on u.id = g.unidade_id group by 1) x),
  'parcelas_por_unidade_hash', (select md5(string_agg(nome||':'||n||':'||v, ',' order by nome)) from (select u.nome, count(*) n, sum(x.valor) v from pedidos_novo.v_parcela x join pedidos_novo.pedido p on p.id = x.pedido_id join pedidos_novo.unidade u on u.id = p.unidade_id group by 1) x),
  'evento_ate_agora', (select count(*) from pedidos_novo.evento),
  -- ids, atualizado_em e nº DH dos pedidos: a troca de chave da unidade não pode mexer neles
  'pedido_atualizado_hash', (select md5(string_agg(id::text||atualizado_em::text||coalesce(num_interno,''), ',' order by id)) from pedidos_novo.pedido)
,
  -- 27/11 (0015/0016): conteúdo linha a linha (sem colunas novas criadas pelas migrations 0015/0016)
  'linhas_hash', json_build_object(
    'pedido', (select md5(string_agg((to_jsonb(x) - 'teste')::text, ',' order by x.id)) from pedidos_novo.pedido x),
    'pedido_item', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.pedido_item x),
    'parcela', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.parcela x),
    'pagamento', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.pagamento x),
    'pagamento_parcela', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.pagamento_id, x.parcela_id)) from pedidos_novo.pagamento_parcela x),
    'nota_fiscal', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.nota_fiscal x),
    'nota_item', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.nota_item x),
    'nota_pedido', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.nota_id, x.pedido_id)) from pedidos_novo.nota_pedido x),
    'receita', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.id)) from pedidos_novo.receita x),
    'receita_item', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.receita_id, x.produto_id)) from pedidos_novo.receita_item x),
    'legado_doc', (select md5(string_agg(to_jsonb(x)::text, ',' order by x.col, x.id)) from pedidos_novo.legado_doc x),
    'evento_ate_id', (select max(id) from pedidos_novo.evento),
    'evento_hash', (select md5(string_agg((to_jsonb(x) - 'justificativa')::text, ',' order by x.id)) from pedidos_novo.evento x))
) retrato;
