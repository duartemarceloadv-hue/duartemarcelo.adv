-- Agenda dos robôs: 1 vez ao dia (decisão do dono, 27/11/2026). pg_cron usa UTC (Brasília = UTC-3).
select cron.schedule('pedidos-novo-planilha', '0 10 * * *', $$select pedidos_novo.chamar_conector('planilha')$$);  -- 07:00
select cron.schedule('pedidos-novo-rastreio', '20 10 * * *', $$select pedidos_novo.chamar_conector('rastreio')$$); -- 07:20
