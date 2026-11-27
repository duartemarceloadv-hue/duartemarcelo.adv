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
  'pedidos_por_unidade_hash', (select md5(string_agg(unidade_id::text||':'||n||':'||v, ',' order by unidade_id)) from (select unidade_id, count(*) n, sum(total) v from pedidos_novo.v_pedido group by 1) x),
  'parcelas_total_rs', (select sum(valor) from pedidos_novo.parcela),
  'parcelas_por_situacao', (select json_object_agg(situacao, json_build_array(n, v)) from (select situacao, count(*) n, sum(valor) v from pedidos_novo.v_parcela group by 1) x),
  'pagamentos_total_rs', (select sum(valor) from pedidos_novo.pagamento),
  'pagamento_parcela_rs', (select sum(valor) from pedidos_novo.pagamento_parcela),
  'pagamentos_por_unidade_hash', (select md5(string_agg(unidade_id::text||':'||v, ',' order by unidade_id)) from (select unidade_id, sum(valor) v from pedidos_novo.pagamento group by 1) x),
  'evento_ate_agora', (select count(*) from pedidos_novo.evento)
) retrato;
