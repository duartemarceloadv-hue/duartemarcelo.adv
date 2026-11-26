-- Conferência no DESTINO (pedidos_novo). Comparar com os números de origem do relatório.
-- 1) pedidos por laboratório/mês e soma v_pedido.total (destino) x valor antigo (staging)
select p.laboratorio_id lab, to_char(p.enviado_em,'YYYY-MM') mes, count(*) n,
       sum(v.total) total_destino,
       sum(coalesce((s.j->>'v')::numeric,(s.j->>'v')::numeric)) valor_antigo,
       count(*) filter (where p.cancelado_em is not null) cancelados
from pedidos_novo.pedido p join pedidos_novo.v_pedido v on v.id=p.id
left join pedidos_novo._mig_src s on (s.src='cp' and 'cp:'||s.ref=p.legado_ref) or (s.src='inj' and p.legado_ref in ('inj:'||s.ref,'inj-contrato:'||s.ref))
where p.origem='migracao' group by 1,2 order by 1,2;
-- 2) parcelas
select pe.laboratorio_id, count(*), sum(pa.valor), count(*) filter (where pa.cancelada_motivo is not null) canc
from pedidos_novo.parcela pa join pedidos_novo.pedido pe on pe.id=pa.pedido_id where pe.origem='migracao' group by 1;
-- 3) NFs
select count(*), sum(total), count(*) filter (where cancelada) from pedidos_novo.nota_fiscal where origem='migracao';
-- 4) arquivos por categoria / bucket
select bucket, categoria, count(*) from pedidos_novo.arquivo where bucket like 'legado-%' group by 1,2 order by 1,2;
-- 5) pagamentos
select count(*), sum(valor) from pedidos_novo.pagamento where registrado_por='migracao';
-- 6) parcelas sem comprovante cuja Omie/planilha já deu baixa ("pagas sem comprovante")
select count(*), sum(pa.valor) from pedidos_novo.v_parcela pa join pedidos_novo.pedido pe on pe.id=pa.pedido_id
where pe.origem='migracao' and pa.cancelada_motivo is null and pa.pago_por_nos=0 and (pa.baixa_omie_em is not null or pa.baixa_planilha_em is not null);
-- 7) itens sem preço / sem produto
select * from pedidos_novo._mig_diag where preco is null or sem_produto;
select fonte, lab, count(*) from pedidos_novo._mig_diag group by 1,2;
-- 8) limpeza das tabelas de trabalho (depois de conferir)
-- drop table pedidos_novo._mig_diag; drop table pedidos_novo._mig_src;
