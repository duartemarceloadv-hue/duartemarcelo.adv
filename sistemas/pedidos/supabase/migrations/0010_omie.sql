-- Recepção dos dados do Portal Omie (tarefa "Sincronizar Portal Omie" no computador do dono).
alter table pedidos_novo.nota_fiscal
  add column if not exists link text,
  add column if not exists chave_acesso text,
  add column if not exists situacao_omie text,
  add column if not exists destinatario text,
  add column if not exists omie_em timestamptz;
-- liga a parcela à NF e à parcela k/N da Omie (estável entre sincronizações)
alter table pedidos_novo.parcela
  add column if not exists nota_id uuid references pedidos_novo.nota_fiscal(id),
  add column if not exists chave_omie text,
  add column if not exists boleto_linha text,
  add column if not exists boleto_numero text;
create unique index if not exists parcela_chave_omie on pedidos_novo.parcela (pedido_id, chave_omie) where chave_omie is not null;
