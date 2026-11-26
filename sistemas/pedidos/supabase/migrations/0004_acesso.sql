-- =====================================================================
-- 0004: acesso ao Sistema de Pedidos novo (ambiente de teste)
--  * os 2 administradores aprovados
--  * bucket privado 'pedidos-novo' para comprovantes enviados pelo sistema novo
--    (sem políticas: só a função pedidos-api, com a chave de serviço, lê e grava)
-- A conta de login (Supabase Auth) é criada à parte, com senha temporária e
-- troca obrigatória no primeiro acesso; admin/financeiro exigem o app autenticador (MFA).
-- =====================================================================

insert into pedidos_novo.usuario (email, nome, papel, unidades, ativo) values
  ('operacoesdrhair@gmail.com', 'Operações Dr. Hair', 'admin', '{}', true),
  ('comprasdrhair@gmail.com',   'Compras Dr. Hair',   'admin', '{}', true)
on conflict (email) do update set nome = excluded.nome, papel = excluded.papel, ativo = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pedidos-novo', 'pedidos-novo', false, 10485760,
        array['application/pdf','image/jpeg','image/png','application/xml','text/xml'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;

-- índice para as buscas da API (pagamentos por parcela e último passo do laboratório)
create index if not exists pagamento_parcela_parcela_idx on pedidos_novo.pagamento_parcela (parcela_id);
create index if not exists etapa_lab_pedido_idx on pedidos_novo.etapa_lab (pedido_id, em desc);
create index if not exists parcela_pedido_idx on pedidos_novo.parcela (pedido_id);
