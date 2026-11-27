-- Arquivo (somente leitura) do sistema antigo de pedidos: cópia fiel de todos os registros,
-- para nada se perder ao desligar o projeto antigo (decisão do dono, 27/11/2026).
create table if not exists pedidos_novo.legado_doc (
  col text not null, id text not null, data jsonb not null,
  updated_at timestamptz, updated_by text, copiado_em timestamptz not null default now(),
  primary key (col, id));
create table if not exists pedidos_novo.legado_log (
  id bigint primary key, col text, doc_id text, entry jsonb, ts bigint, por text, created_at timestamptz,
  copiado_em timestamptz not null default now());
create index if not exists legado_log_doc on pedidos_novo.legado_log (col, doc_id);
create table if not exists pedidos_novo.legado_tabela (
  tabela text not null, chave text not null, linha jsonb not null, copiado_em timestamptz not null default now(),
  primary key (tabela, chave));
alter table pedidos_novo.legado_doc enable row level security;
alter table pedidos_novo.legado_log enable row level security;
alter table pedidos_novo.legado_tabela enable row level security;
revoke all on pedidos_novo.legado_doc, pedidos_novo.legado_log, pedidos_novo.legado_tabela from public, anon, authenticated;
