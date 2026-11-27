-- =====================================================================
-- 0015: Criar pedido no sistema novo (Laboratórios › Pedidos › Novo pedido e "Criar pedido" na receita)
--  * pedido nasce em RASCUNHO (já existia a coluna rascunho); ao confirmar o envio a API grava a data de envio
--    (hoje), o gatilho numera e o registro de alterações guarda tudo (com o e-mail e a justificativa).
--  * numeração DH-AAAA-NNNN por ano, contínua com a OFICIAL: o próximo número é maior que o maior DH do ano no
--    sistema novo, na cópia do sistema antigo (legado_doc pedidos.interno) e no contador do antigo
--    (config interno_dh). Trava (pg_advisory_xact_lock) + tabela numeracao + índice único de num_interno:
--    dois envios ao mesmo tempo nunca pegam o mesmo número.
--  * AMBIENTE DE TESTE: enquanto o sistema antigo estiver em uso (parametro criar_pedido_teste = true), todo
--    pedido criado aqui fica com teste = true e numeração TST-AAAA-NNNN (o mesmo prefixo de teste do antigo,
--    config interno_tst), para não "gastar" números DH que o antigo ainda está emitindo. Antes da virada:
--    select pedidos_novo.apagar_pedidos_teste();  e  update pedidos_novo.parametro set valor = 'false' where chave = 'criar_pedido_teste';
--  * registro de alterações ganha a coluna justificativa (lida de nucleo.justificativa, como no núcleo).
--  Nenhum dado existente é alterado: a coluna teste nasce false nos 484 pedidos migrados.
-- =====================================================================

-- ---------- marca de teste ----------
alter table pedidos_novo.pedido add column if not exists teste boolean not null default false;
comment on column pedidos_novo.pedido.teste is 'Pedido criado no ambiente de teste (antes da virada). Apagar com pedidos_novo.apagar_pedidos_teste() antes da virada.';
create index if not exists pedido_teste_idx on pedidos_novo.pedido (teste) where teste;

-- origem "receita" (pedido criado a partir da receita do mês, como o antigo origem=receita)
alter table pedidos_novo.pedido drop constraint if exists pedido_origem_check;
alter table pedidos_novo.pedido add constraint pedido_origem_check
  check (origem in ('digitado','planilha','omie','pdf','migracao','receita'));

-- ---------- parâmetros do módulo ----------
create table if not exists pedidos_novo.parametro (
  chave text primary key,
  valor jsonb not null,
  obs   text,
  atualizado_em timestamptz not null default now()
);
alter table pedidos_novo.parametro enable row level security;
revoke all on pedidos_novo.parametro from public, anon, authenticated;
create trigger t_audita after insert or update or delete on pedidos_novo.parametro for each row execute function pedidos_novo.audita();
insert into pedidos_novo.parametro (chave, valor, obs) values
  ('criar_pedido_teste', 'true', 'Enquanto o sistema antigo estiver em uso: pedido criado no sistema novo é de TESTE (não vai ao laboratório, numeração TST). Desligar só na virada, depois de apagar_pedidos_teste().')
on conflict (chave) do nothing;

-- ---------- numeração ----------
create table if not exists pedidos_novo.numeracao (
  serie  text not null check (serie in ('DH','TST')),
  ano    int  not null,
  ultimo int  not null check (ultimo > 0),
  primary key (serie, ano)
);
alter table pedidos_novo.numeracao enable row level security;
revoke all on pedidos_novo.numeracao from public, anon, authenticated;

create or replace function pedidos_novo.proximo_num_interno(p_teste boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_ano int := extract(year from pedidos_novo.hoje())::int;
  v_serie text := case when p_teste then 'TST' else 'DH' end;
  v_base int := 0; v_n int;
begin
  -- uma numeração por vez (a linha da tabela numeracao também fica presa até o fim da transação)
  perform pg_advisory_xact_lock(hashtext('pedidos_novo.num_interno'));
  if p_teste then
    select coalesce(max(substr(num_interno, 10)::int), 0) into v_base
      from pedidos_novo.pedido where num_interno ~ ('^TST-' || v_ano || '-[0-9]{4,}$');
  else
    select greatest(
      coalesce((select max(substr(num_interno, 9)::int) from pedidos_novo.pedido where num_interno ~ ('^DH-' || v_ano || '-[0-9]{4,}$')), 0),
      coalesce((select max(substr(data->>'interno', 9)::int) from pedidos_novo.legado_doc
                 where col = 'pedidos' and data->>'interno' ~ ('^DH-' || v_ano || '-[0-9]{4,}$')), 0),
      coalesce((select (data->>'seq')::int from pedidos_novo.legado_doc
                 where col = 'config' and id = 'interno_dh' and data->>'ano' = v_ano::text and data->>'seq' ~ '^[0-9]+$'), 0))
      into v_base;
  end if;
  insert into pedidos_novo.numeracao (serie, ano, ultimo) values (v_serie, v_ano, v_base + 1)
    on conflict (serie, ano) do update set ultimo = greatest(pedidos_novo.numeracao.ultimo, v_base) + 1
    returning ultimo into v_n;
  return v_serie || '-' || v_ano || '-' || lpad(v_n::text, 4, '0');
end $$;
revoke all on function pedidos_novo.proximo_num_interno(boolean) from public, anon, authenticated;

-- o gatilho de numeração (0001) passa a usar a função acima; pedido de teste não vira oficial nem o contrário
create or replace function pedidos_novo.gera_num_interno() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.teste is distinct from old.teste then
    raise exception 'A marca de teste de um pedido não pode ser trocada.';
  end if;
  if new.num_interno is null and not new.rascunho then
    new.num_interno := pedidos_novo.proximo_num_interno(new.teste);
  end if;
  return new;
end $$;

-- ---------- registro de alterações com justificativa ----------
alter table pedidos_novo.evento add column if not exists justificativa text;
create or replace function pedidos_novo.audita() returns trigger
language plpgsql security definer set search_path = '' as $$
declare rid text;
begin
  rid := coalesce((to_jsonb(coalesce(new, old))->>'id'), '?');
  insert into pedidos_novo.evento (tabela, registro_id, acao, antes, depois, justificativa)
  values (tg_table_name, rid, lower(tg_op),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end,
          nullif(current_setting('nucleo.justificativa', true), ''));
  return coalesce(new, old);
end $$;
