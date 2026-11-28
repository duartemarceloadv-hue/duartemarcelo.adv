-- 0018: cartas de correção (NF -> nº do pedido no laboratório corrigido) saem do código da integração Omie
-- e passam para a ficha do laboratório. Os 2 casos que estavam fixos no código continuam iguais.
update pedidos_novo.laboratorio
   set ficha = coalesce(ficha, '{}'::jsonb)
             || jsonb_build_object('cartas_correcao', coalesce(ficha->'cartas_correcao', '{}'::jsonb) || '{"70511": "125076", "67890": "120414"}'::jsonb)
 where id = 'CP';
