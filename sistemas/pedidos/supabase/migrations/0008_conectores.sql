-- Robôs (conectores) do sistema novo: planilha do laboratório e rastreio Quality.
-- Chamados pelo pg_cron via pg_net, com a chave guardada no Vault (nunca no código).
alter table pedidos_novo.pedido
  add column if not exists rastreio_situacao text,
  add column if not exists rastreio_em timestamptz,
  add column if not exists rastreio_detalhe jsonb;

alter table pedidos_novo.execucao_conector add column if not exists resumo jsonb;

-- pg_net fica no schema extensions (aviso de segurança do Supabase)
drop extension if exists pg_net;
create extension pg_net with schema extensions;

-- chave dos robôs: criada no Vault só se ainda não existir
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'pedidos_novo_cron_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'pedidos_novo_cron_key', 'Chave dos robôs do Sistema de Pedidos (novo)');
  end if;
end $$;

create or replace function pedidos_novo.chamar_conector(acao text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare k text; r bigint;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'pedidos_novo_cron_key';
  select net.http_post(
    url := 'https://xqxjmeioodmdhxhivyqu.supabase.co/functions/v1/conectores',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron', k),
    body := jsonb_build_object('acao', acao),
    timeout_milliseconds := 150000) into r;
  return r;
end $$;
revoke all on function pedidos_novo.chamar_conector(text) from public, anon, authenticated;
