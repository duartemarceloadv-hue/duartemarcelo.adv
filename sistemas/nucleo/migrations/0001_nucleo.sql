-- =====================================================================
-- NÚCLEO do sistema de operações Dr. Hair (cadastro comum) — schema "nucleo"
-- Banco único xqxjmeioodmdhxhivyqu. Documento-mestre §4 (Arquitetura) e §7 (Perfis).
--
-- Regras:
--  * unidade com número próprio que nunca muda: o MESMO uuid de public.unidades (desenho global §3.1),
--    com a equivalência dos ids do Laboratórios em nucleo.unidade_ref;
--    o CNPJ fica num vínculo com início e fim (unidade_empresa);
--  * pessoa = pessoa física, id interno; CPF/CNPJ em pessoa_documento_fiscal (com vigência);
--    registro no conselho em profissional; RT e sócio são funções com período;
--  * pessoa (quem trabalha) e usuário (quem faz login) são cadastros separados;
--    acesso = papel × módulo × unidade, decidido por UMA função: nucleo.pode(unidade, acao);
--  * casamento automático só por documento/registro idêntico; nome parecido vira
--    pendência para Operações decidir (nucleo.pendencia_cadastro), nunca vínculo automático;
--  * auditoria do próprio banco (nucleo.evento), só acrescenta, com o e-mail do JWT;
--  * RLS ligado em tudo; nenhuma tabela exposta a anon/authenticated (acesso pelas edge functions).
-- Nada de public, premiacao*, nutra é alterado. public.unidades só é lida (doc_unidade_id).
-- =====================================================================

create schema if not exists nucleo;
comment on schema nucleo is 'Núcleo do sistema de operações Dr. Hair: unidades, empresas, pessoas, logins e papéis, auditoria';
revoke all on schema nucleo from public, anon, authenticated;
grant usage on schema nucleo to authenticated;   -- só para executar pode()/minhas_unidades(); nenhuma tabela é concedida

-- ---------- utilitários ----------
create or replace function nucleo.sem_acento(p text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select translate(coalesce(p, ''), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ', 'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn')
$$;
create or replace function nucleo.norm(p text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select btrim(regexp_replace(upper(nucleo.sem_acento(p)), '[^A-Z0-9]+', ' ', 'g'))
$$;
-- chave para achar POSSÍVEIS duplicadas (nunca para juntar sozinha): sem acento, sem "de/da/dos",
-- letras dobradas viram uma, Z→S, Y→I, W→V, TH→T, PH→F
create or replace function nucleo.chave_nome(p text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select btrim(regexp_replace(regexp_replace(regexp_replace(
           translate(replace(replace(nucleo.norm(p), 'TH', 'T'), 'PH', 'F'), 'ZYW0123456789', 'SIV'),
           '\m(DE|DA|DO|DOS|DAS|E)\M', ' ', 'g'), '([A-Z])\1+', '\1', 'g'), '\s+', ' ', 'g'))
$$;
-- lê um registro de conselho escrito de qualquer jeito ("CRBM-1 37175", "61585-SP", "COREN-RS 602340", "04867 CRBM-7")
-- registro = maior grupo de dígitos, sem zeros à esquerda; UF só quando escrita; conselho padrão quando não escrito
create or replace function nucleo.ler_registro(p text, p_padrao text default 'CRBM', out conselho text, out registro text, out uf text)
language plpgsql immutable set search_path = '' as $$
declare s text := upper(nucleo.sem_acento(coalesce(p, ''))); m text[]; best text := '';
begin
  if s !~ '\d{3,}' then return; end if;
  conselho := case when s ~ 'CORE[NM]' then 'COREN' when s ~ 'CRBM' then 'CRBM' when s ~ '\mCRM\M' then 'CRM'
                   when s ~ '\mCRF\M' then 'CRF' else p_padrao end;
  for m in select regexp_matches(s, '\d+', 'g') loop
    if length(m[1]) > length(best) then best := m[1]; end if;
  end loop;
  registro := nullif(ltrim(best, '0'), '');
  m := regexp_match(s, '(?:^|[^A-Z])(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)(?:[^A-Z]|$)');
  uf := m[1];
end $$;

create or replace function nucleo.email_jwt() returns text
language sql stable set search_path = '' as $$
  select nullif(lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'email', '')), '')
$$;

create or replace function nucleo.toca_atualizado() returns trigger
language plpgsql set search_path = '' as $$ begin new.atualizado_em := now(); return new; end $$;

-- ---------- auditoria única do núcleo ----------
create table nucleo.evento (
  id            bigint generated always as identity primary key,
  tabela        text not null,
  registro_id   text not null,
  acao          text not null check (acao in ('insert','update','delete')),
  antes         jsonb,
  depois        jsonb,
  por           text not null default coalesce(nucleo.email_jwt(), current_user),
  origem        text,          -- tela | carga | rotina | claude (definido pela função que grava)
  justificativa text,
  em            timestamptz not null default now()
);
create index on nucleo.evento (tabela, registro_id);
create index on nucleo.evento (em desc);

create or replace function nucleo.audita() returns trigger
language plpgsql security definer set search_path = '' as $$
declare rid text;
begin
  rid := coalesce(to_jsonb(coalesce(new, old))->>'id', to_jsonb(coalesce(new, old))->>'email',
                  concat_ws(':', to_jsonb(coalesce(new, old))->>'pessoa_id', to_jsonb(coalesce(new, old))->>'unidade_id', to_jsonb(coalesce(new, old))->>'ref'));
  insert into nucleo.evento (tabela, registro_id, acao, antes, depois, origem, justificativa)
  values (tg_table_name, rid, lower(tg_op),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end,
          nullif(current_setting('nucleo.origem', true), ''),
          nullif(current_setting('nucleo.justificativa', true), ''));
  return coalesce(new, old);
end $$;
create or replace function nucleo.bloqueia() returns trigger
language plpgsql set search_path = '' as $$ begin raise exception 'O registro de alterações do núcleo não pode ser alterado nem apagado'; end $$;
create trigger evento_imutavel before update or delete on nucleo.evento for each row execute function nucleo.bloqueia();

-- ---------- unidades e empresas ----------
-- id = o MESMO uuid de public.unidades (desenho global §3.1); public.unidades não é alterada.
create table nucleo.unidade (
  id             uuid primary key default gen_random_uuid(),   -- número próprio; nunca muda (= public.unidades.id)
  doc_unidade_id uuid unique,                                  -- id em public.unidades (sistema Documentos); só leitura
  nome           text not null unique,
  cidade         text,
  uf             text check (uf ~ '^[A-Z]{2}$'),
  ativo          boolean not null default true,
  abertura       date,                                         -- data de abertura informada no sistema antigo de pedidos
  obs            text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- equivalência com os ids de cada sistema (pedidos_novo, premiacao, compras, nutra, zuria...)
create table nucleo.unidade_ref (
  sistema    text not null,
  ref        text not null,
  unidade_id uuid not null references nucleo.unidade(id),
  primary key (sistema, ref)
);
create index on nucleo.unidade_ref (unidade_id);

create table nucleo.unidade_apelido (
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid not null references nucleo.unidade(id),
  nome        text not null,
  nome_norm   text generated always as (upper(regexp_replace(translate(nome,'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç','AAAAEEIOOOUCaaaaeeiooouc'),'[^A-Za-z0-9]+',' ','g'))) stored,
  sistema     text not null,
  unique (nome_norm, unidade_id)
);
create index on nucleo.unidade_apelido (nome_norm);

create table nucleo.empresa (
  id            uuid primary key default gen_random_uuid(),
  razao_social  text not null,
  cnpj          text not null unique check (cnpj ~ '^\d{14}$'),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table nucleo.unidade_empresa (     -- CNPJ da unidade com vigência (migração à holding, troca de CNPJ)
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid not null references nucleo.unidade(id),
  empresa_id  uuid not null references nucleo.empresa(id),
  de          date,                        -- nulo = início não informado na fonte
  ate         date,
  obs         text,
  check (ate is null or de is null or ate >= de)
);
create index on nucleo.unidade_empresa (unidade_id);
create unique index unidade_empresa_uma_vigente on nucleo.unidade_empresa (unidade_id) where ate is null;

-- ---------- pessoas ----------
create table nucleo.pessoa (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  outros_nomes  text[] not null default '{}',   -- grafias vistas nas fontes (apelidos, nome no termo etc.)
  ativo         boolean not null default true,
  juntada_em    uuid references nucleo.pessoa(id),   -- quando Operações junta duas pessoas, a de baixo aponta para a que fica
  obs           text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on nucleo.pessoa (nucleo.chave_nome(nome));

create table nucleo.pessoa_origem (   -- de qual registro de qual sistema veio (reimportar não duplica)
  pessoa_id  uuid not null references nucleo.pessoa(id),
  sistema    text not null,           -- ex.: 'pedidos-antigo:prescritores', 'pedidos-antigo:clinicas.rts'
  ref        text not null,
  nome_fonte text,
  primary key (sistema, ref)
);
create index on nucleo.pessoa_origem (pessoa_id);

create table nucleo.pessoa_documento_fiscal (
  id         uuid primary key default gen_random_uuid(),
  pessoa_id  uuid not null references nucleo.pessoa(id),
  tipo       text not null check (tipo in ('CPF','CNPJ')),
  numero     text not null,
  de         date,
  ate        date,
  check ((tipo = 'CPF' and numero ~ '^\d{11}$') or (tipo = 'CNPJ' and numero ~ '^\d{14}$')),
  check (ate is null or de is null or ate >= de),
  unique (tipo, numero, pessoa_id)
);

create table nucleo.profissional (
  id                    uuid primary key default gen_random_uuid(),
  pessoa_id             uuid not null references nucleo.pessoa(id),
  conselho              text check (conselho in ('CRBM','CRM','CRF','COREN','outro')),
  registro              text,          -- só dígitos, sem zeros à esquerda
  uf                    text check (uf ~ '^[A-Z]{2}$'),
  registro_original     text,          -- como estava escrito na fonte
  habilitado_prescrever boolean not null default false,
  ativo                 boolean not null default true,
  check ((registro is null) = (conselho is null))
);
create unique index profissional_registro on nucleo.profissional (conselho, registro, coalesce(uf, '')) where registro is not null;
create index on nucleo.profissional (pessoa_id);

create table nucleo.prescritor_unidade (   -- onde o prescritor atua (lista do sistema antigo)
  pessoa_id  uuid not null references nucleo.pessoa(id),
  unidade_id uuid not null references nucleo.unidade(id),
  fonte      text not null,
  primary key (pessoa_id, unidade_id)
);

create table nucleo.unidade_rt (
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid not null references nucleo.unidade(id),
  pessoa_id   uuid not null references nucleo.pessoa(id),
  tipo        text check (tipo in ('titular','substituta')),   -- nulo = não informado na fonte
  de          date not null,
  ate         date,
  vinculo     text,
  cargo       text,
  fonte       text,
  obs         text,
  check (ate is null or ate >= de)
);
create index on nucleo.unidade_rt (unidade_id);
create index on nucleo.unidade_rt (pessoa_id);

create table nucleo.socio_unidade (
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid not null references nucleo.unidade(id),
  pessoa_id   uuid not null references nucleo.pessoa(id),
  de          date,             -- nulo = não informado na fonte
  ate         date,
  fonte       text,
  check (ate is null or de is null or ate >= de)
);
create index on nucleo.socio_unidade (unidade_id);
create index on nucleo.socio_unidade (pessoa_id);

-- ---------- logins e papéis ----------
create table nucleo.usuario (
  email         text primary key check (email = lower(email)),
  nome          text not null,
  pessoa_id     uuid references nucleo.pessoa(id),
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table nucleo.usuario_papel (
  id          uuid primary key default gen_random_uuid(),
  email       text not null references nucleo.usuario(email),
  papel       text not null check (papel in ('operacoes','admin','central','financeiro','socio','diretora','gestora',
                                             'unidade','compras','contabilidade','advogado','leitura','colaborador')),
  modulo      text not null check (modulo ~ '^[a-z_]+$'),     -- 'todos' ou o nome do módulo (ex.: 'laboratorios')
  unidade_id  uuid references nucleo.unidade(id),            -- nulo = todas as unidades
  criado_em   timestamptz not null default now(),
  check (papel not in ('unidade','socio','diretora','gestora') or unidade_id is not null)
);
create unique index usuario_papel_unico on nucleo.usuario_papel (email, papel, modulo, coalesce(unidade_id, '00000000-0000-0000-0000-000000000000'));

-- ---------- pendências de cadastro (Operações decide) ----------
create table nucleo.pendencia_cadastro (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null check (tipo in ('possivel_duplicada','socio_empresa','datas_inconsistentes','unidade_nao_reconhecida','outro')),
  descricao     text not null,
  pessoa_a      uuid references nucleo.pessoa(id),
  pessoa_b      uuid references nucleo.pessoa(id),
  unidade_id    uuid references nucleo.unidade(id),
  dados         jsonb not null default '{}',
  status        text not null default 'aberta' check (status in ('aberta','juntadas','mantidas_separadas','resolvida','descartada')),
  justificativa text,
  decidido_por  text,
  decidido_em   timestamptz,
  criado_em     timestamptz not null default now(),
  check ((status = 'aberta') = (decidido_em is null))
);
create unique index pendencia_par on nucleo.pendencia_cadastro (tipo, pessoa_a, pessoa_b) where pessoa_a is not null and pessoa_b is not null;

-- ---------- acesso: UMA regra, usada pelas edge functions e pelo RLS ----------
-- Ações: '<modulo>.ver' | '<modulo>.gravar' | '<modulo>.admin' | 'cadastros.ver' | 'cadastros.editar'.
create or replace function nucleo.acesso(p_email text, p_modulo text)
returns jsonb language sql stable security definer set search_path = '' as $$
  with p as (
    select up.papel, up.unidade_id
    from nucleo.usuario_papel up join nucleo.usuario u on u.email = up.email and u.ativo
    where up.email = lower(p_email) and (up.modulo = p_modulo or up.modulo = 'todos' or up.papel = 'operacoes')
  )
  select jsonb_build_object(
    'papeis',   coalesce((select jsonb_agg(distinct papel) from p), '[]'::jsonb),
    -- null = todas as unidades; lista = só essas
    'unidades', case when exists (select 1 from p where unidade_id is null) then null
                     else coalesce((select jsonb_agg(distinct unidade_id) from p), '[]'::jsonb) end,
    'ver',      exists (select 1 from p),
    'gravar',   exists (select 1 from p where papel in ('operacoes','admin','central','financeiro','unidade','socio')),
    'admin',    exists (select 1 from p where papel in ('operacoes','admin')),
    'mfa',      exists (select 1 from p where papel in ('operacoes','admin','financeiro','contabilidade')),
    'cadastros',exists (select 1 from nucleo.usuario_papel up join nucleo.usuario u on u.email = up.email and u.ativo
                        where up.email = lower(p_email) and up.papel in ('operacoes','admin') and up.unidade_id is null)
  )
$$;

create or replace function nucleo.pode(p_unidade uuid, p_acao text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare e text := nucleo.email_jwt(); m text := split_part(p_acao, '.', 1); v text := split_part(p_acao, '.', 2); a jsonb;
begin
  if e is null or v = '' then return false; end if;
  if m = 'cadastros' then
    return (nucleo.acesso(e, m)->>'cadastros')::boolean;
  end if;
  a := nucleo.acesso(e, m);
  if not coalesce((a->>v)::boolean, false) then return false; end if;
  if p_unidade is null or a->'unidades' = 'null'::jsonb then return true; end if;
  return a->'unidades' ? p_unidade::text;
end $$;

create or replace function nucleo.minhas_unidades(p_modulo text default 'laboratorios')
returns setof uuid language sql stable security definer set search_path = '' as $$
  select u.id from nucleo.unidade u
  where u.ativo and nucleo.pode(u.id, p_modulo || '.ver')
$$;

revoke all on all functions in schema nucleo from public, anon, authenticated;
grant execute on function nucleo.pode(uuid, text), nucleo.minhas_unidades(text) to authenticated;

-- ---------- gatilhos: atualizado_em e auditoria (só nas tabelas do núcleo) ----------
create trigger t_atualizado before update on nucleo.unidade  for each row execute function nucleo.toca_atualizado();
create trigger t_atualizado before update on nucleo.empresa  for each row execute function nucleo.toca_atualizado();
create trigger t_atualizado before update on nucleo.pessoa   for each row execute function nucleo.toca_atualizado();
create trigger t_atualizado before update on nucleo.usuario  for each row execute function nucleo.toca_atualizado();
do $$
declare t text;
begin
  foreach t in array array['unidade','unidade_ref','unidade_apelido','empresa','unidade_empresa','pessoa','pessoa_origem','pessoa_documento_fiscal',
                           'profissional','prescritor_unidade','unidade_rt','socio_unidade','usuario','usuario_papel','pendencia_cadastro']
  loop
    execute format('create trigger t_audita after insert or update or delete on nucleo.%I for each row execute function nucleo.audita()', t);
  end loop;
end $$;

-- ---------- isolamento ----------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'nucleo' loop
    execute format('alter table nucleo.%I enable row level security', t);
    execute format('revoke all on nucleo.%I from public, anon, authenticated', t);
  end loop;
end $$;
revoke all on all sequences in schema nucleo from public, anon, authenticated;
alter default privileges in schema nucleo revoke all on tables from public, anon, authenticated;
alter default privileges in schema nucleo revoke all on functions from public, anon, authenticated;

-- =====================================================================
-- CARGA (fontes: pedidos_novo.unidade/_alias/_cnpj/usuario e o arquivo do sistema antigo
-- pedidos_novo.legado_doc: prescritores, clinicas). Nenhum dado é inventado:
-- campo ausente na fonte fica nulo. Nenhum CPF existe nas fontes → nenhum CPF importado.
-- =====================================================================
select set_config('request.jwt.claims', '{"email":"carga-inicial-nucleo"}', false);
select set_config('nucleo.origem', 'carga', false);
select set_config('nucleo.justificativa', 'Carga inicial do núcleo (27/11/2026) a partir do Laboratórios e do arquivo do sistema antigo', false);

-- unidades (uuid de public.unidades, que já estava em pedidos_novo.unidade.doc_unidade_id: 53/53),
-- equivalência com os ids do Laboratórios, apelidos, empresas e vínculo de CNPJ
insert into nucleo.unidade (id, doc_unidade_id, nome, cidade, uf, ativo, abertura, criado_em, atualizado_em)
select u.doc_unidade_id, u.doc_unidade_id, u.nome, u.cidade, u.uf, u.ativo,
       (select (d.data->>'abertura')::date from pedidos_novo.unidade_cnpj c join pedidos_novo.legado_doc d
          on d.col = 'clinicas' and regexp_replace(d.data->>'cnpj', '\D', '', 'g') = c.cnpj
        where c.unidade_id = u.id and d.data->>'abertura' ~ '^\d{4}-\d{2}-\d{2}$' limit 1),
       u.criado_em, u.atualizado_em
from pedidos_novo.unidade u;

insert into nucleo.unidade_ref (sistema, ref, unidade_id)
select 'pedidos_novo.unidade', u.id::text, u.doc_unidade_id from pedidos_novo.unidade u;

insert into nucleo.unidade_apelido (id, unidade_id, nome, sistema)
select a.id, u.doc_unidade_id, a.nome, a.sistema from pedidos_novo.unidade_alias a join pedidos_novo.unidade u on u.id = a.unidade_id;

insert into nucleo.empresa (razao_social, cnpj)
select distinct on (cnpj) razao_social, cnpj from pedidos_novo.unidade_cnpj order by cnpj, de desc;

-- 2000-01-01 era marcador de "sem data" na carga do Laboratórios: vira nulo (início não informado)
insert into nucleo.unidade_empresa (id, unidade_id, empresa_id, de, ate)
select c.id, u.doc_unidade_id, e.id, nullif(c.de, '2000-01-01'::date), c.ate
from pedidos_novo.unidade_cnpj c join nucleo.empresa e on e.cnpj = c.cnpj join pedidos_novo.unidade u on u.id = c.unidade_id;

-- usuários e papéis (o Laboratórios tinha papel único + lista de unidades)
insert into nucleo.usuario (email, nome, ativo, criado_em, atualizado_em)
select email, nome, ativo, criado_em, atualizado_em from pedidos_novo.usuario;
insert into nucleo.usuario_papel (email, papel, modulo, unidade_id)
select u.email, u.papel, 'laboratorios', (select x.doc_unidade_id from pedidos_novo.unidade x where x.id = un) from pedidos_novo.usuario u
  left join lateral unnest(case when cardinality(u.unidades) > 0 then u.unidades else array[null::uuid] end) un on true;

-- ---------- pessoas, profissionais, RTs, sócios ----------
do $carga$
declare
  r record; reg record; pid uuid; prof record; n int; nome_t text; tit text; cnt int;
begin
  -- mapa clínica do sistema antigo → unidade (pelo CNPJ, que bate 53/53)
  create temp table m_cli on commit drop as
    select d.id cli, d.data->>'nome' cli_nome, ue.unidade_id, d.data
    from pedidos_novo.legado_doc d join nucleo.empresa e on e.cnpj = regexp_replace(d.data->>'cnpj', '\D', '', 'g')
    join nucleo.unidade_empresa ue on ue.empresa_id = e.id and ue.ate is null
    where d.col = 'clinicas';

  -- todas as menções a pessoas, na ordem em que serão lidas
  create temp table fonte (ord serial, sistema text, ref text, nome text, reg_txt text, unidade_id uuid, de date, ate date,
                           vinculo text, cargo text, prescreve boolean, ativo boolean, apelidos text[], pessoa_id uuid) on commit drop;
  insert into fonte (sistema, ref, nome, reg_txt, prescreve, ativo, apelidos)
    select 'pedidos-antigo:prescritores', d.id, btrim(d.data->>'nome'), d.data->>'crbm', true, coalesce((d.data->>'ativo')::boolean, true),
           coalesce((select array_agg(btrim(a)) from jsonb_array_elements_text(case when jsonb_typeof(d.data->'alias') = 'array' then d.data->'alias' else '[]' end) a), '{}')
    from pedidos_novo.legado_doc d where d.col = 'prescritores' order by (d.data->>'ativo')::boolean desc nulls last, d.id;
  insert into fonte (sistema, ref, nome, reg_txt, unidade_id, de, ate, vinculo, cargo, prescreve, ativo, apelidos)
    select 'pedidos-antigo:clinicas.rts', m.cli || '#' || (x.i - 1), btrim(x.r->>'nome'), coalesce(x.r->>'crbm', x.r->>'conselho'), m.unidade_id,
           nullif(coalesce(x.r->>'inicioRT', x.r->>'inicio'), '')::date, null, x.r->>'vinculo', x.r->>'cargo', false, true,
           coalesce((select array_agg(btrim(a)) from jsonb_array_elements_text(case when jsonb_typeof(x.r->'alias') = 'array' then x.r->'alias' else '[]' end) a), '{}')
    from m_cli m, jsonb_array_elements(coalesce(m.data->'rts', '[]')) with ordinality x(r, i) order by m.cli, x.i;
  insert into fonte (sistema, ref, nome, reg_txt, unidade_id, de, ate, vinculo, cargo, prescreve, ativo, apelidos)
    select 'pedidos-antigo:clinicas.rtsEnc', m.cli || '#' || (x.i - 1), btrim(x.r->>'nome'), coalesce(x.r->>'crbm', x.r->>'conselho'), m.unidade_id,
           nullif(coalesce(x.r->>'inicioRT', x.r->>'inicio'), '')::date, nullif(x.r->>'fim', '')::date, x.r->>'vinculo', x.r->>'cargo', false, true, '{}'
    from m_cli m, jsonb_array_elements(coalesce(m.data->'rtsEnc', '[]')) with ordinality x(r, i) order by m.cli, x.i;
  insert into fonte (sistema, ref, nome, reg_txt, unidade_id, de, prescreve, ativo, apelidos)
    select 'pedidos-antigo:clinicas.rtTermo', m.cli, btrim(m.data->>'rtTermo'), m.data->>'crbmTermo', m.unidade_id,
           nullif(m.data->'docs'->'termo-de-responsabilidade-no-laboratorio-centro-paulista'->>'emissao', '')::date, true, true, '{}'
    from m_cli m where coalesce(btrim(m.data->>'rtTermo'), '') <> '' order by m.cli;
  insert into fonte (sistema, ref, nome, reg_txt, unidade_id, prescreve, ativo, apelidos)
    select 'pedidos-antigo:inj_unidades.rt', t.chave, btrim(t.linha->'dados'->'rt'->>'nome'), t.linha->'dados'->'rt'->>'crbm', ue.unidade_id, true, true, '{}'
    from pedidos_novo.legado_tabela t left join nucleo.empresa e on e.cnpj = regexp_replace(t.linha->>'cnpj', '\D', '', 'g')
    left join nucleo.unidade_empresa ue on ue.empresa_id = e.id and ue.ate is null
    where t.tabela = 'inj_unidades' and coalesce(btrim(t.linha->'dados'->'rt'->>'nome'), '') <> '' order by t.chave;

  -- 1) pessoas: junta só quando conselho + registro são iguais (UF igual ou ausente em um dos lados)
  for r in select * from fonte order by ord loop
    select * into reg from nucleo.ler_registro(r.reg_txt);
    pid := null;
    if reg.registro is not null then
      select p.* into prof from nucleo.profissional p
       where p.conselho = reg.conselho and p.registro = reg.registro and (p.uf is null or reg.uf is null or p.uf = reg.uf)
       order by p.uf nulls last limit 1;
      if found then
        pid := prof.pessoa_id;
        update nucleo.profissional set uf = coalesce(uf, reg.uf), habilitado_prescrever = habilitado_prescrever or r.prescreve where id = prof.id;
      end if;
    end if;
    if pid is null then
      insert into nucleo.pessoa (nome, ativo) values (r.nome, true) returning id into pid;
      insert into nucleo.profissional (pessoa_id, conselho, registro, uf, registro_original, habilitado_prescrever)
      values (pid, case when reg.registro is null then null else reg.conselho end, reg.registro, case when reg.registro is null then null else reg.uf end,
              nullif(btrim(coalesce(r.reg_txt, '')), ''), r.prescreve);
    end if;
    update fonte set pessoa_id = pid where ord = r.ord;
    insert into nucleo.pessoa_origem (pessoa_id, sistema, ref, nome_fonte) values (pid, r.sistema, r.ref, r.nome);
    -- grafias diferentes do mesmo registro e apelidos ficam guardados na pessoa (nome de empresa vai para a observação)
    update nucleo.pessoa p set
      outros_nomes = (select coalesce(array_agg(distinct x), '{}') from unnest(p.outros_nomes || array[r.nome] || r.apelidos) x
                      where nucleo.chave_nome(x) <> nucleo.chave_nome(p.nome) and x !~* '\m(LTDA|EIRELI|ME|S/?A|CLINICA)\M'),
      obs = case when exists (select 1 from unnest(r.apelidos) x where x ~* '\m(LTDA|EIRELI|S/?A)\M')
                 then concat_ws(' · ', p.obs, 'Empresa ligada no sistema antigo (sem CNPJ na fonte): ' ||
                      (select string_agg(x, ', ') from unnest(r.apelidos) x where x ~* '\m(LTDA|EIRELI|S/?A)\M'))
                 else p.obs end
    where p.id = pid;
  end loop;
  -- quem só aparece como prescritor inativo no antigo fica inativo
  update nucleo.pessoa p set ativo = false
   where exists (select 1 from fonte f where f.pessoa_id = p.id)
     and not exists (select 1 from fonte f where f.pessoa_id = p.id and f.ativo);
  update nucleo.profissional pr set ativo = false
   where not exists (select 1 from fonte f where f.pessoa_id = pr.pessoa_id and f.ativo);

  -- 2) onde o prescritor atua (nomes de clínica do antigo → unidade; o que não for reconhecido vira pendência)
  insert into nucleo.prescritor_unidade (pessoa_id, unidade_id, fonte)
  select distinct f.pessoa_id, coalesce(m.unidade_id, ap.unidade_id), 'pedidos-antigo:prescritores'
  from fonte f join pedidos_novo.legado_doc d on d.col = 'prescritores' and d.id = f.ref,
       jsonb_array_elements_text(case when jsonb_typeof(d.data->'unidades') = 'array' then d.data->'unidades' else '[]' end) un(nome)
  left join m_cli m on nucleo.norm(m.cli_nome) = nucleo.norm(un.nome)
  left join lateral (select a.unidade_id from nucleo.unidade_apelido a where a.nome_norm = nucleo.norm(un.nome) limit 1) ap on m.unidade_id is null
  where f.sistema = 'pedidos-antigo:prescritores' and coalesce(m.unidade_id, ap.unidade_id) is not null
  on conflict do nothing;
  insert into nucleo.pendencia_cadastro (tipo, descricao, pessoa_a, dados)
  select 'unidade_nao_reconhecida', 'Prescritor ligado a uma clínica que não foi reconhecida: ' || un.nome, f.pessoa_id, jsonb_build_object('clinica', un.nome, 'fonte', f.ref)
  from fonte f join pedidos_novo.legado_doc d on d.col = 'prescritores' and d.id = f.ref,
       jsonb_array_elements_text(case when jsonb_typeof(d.data->'unidades') = 'array' then d.data->'unidades' else '[]' end) un(nome)
  where f.sistema = 'pedidos-antigo:prescritores'
    and not exists (select 1 from m_cli m where nucleo.norm(m.cli_nome) = nucleo.norm(un.nome))
    and not exists (select 1 from nucleo.unidade_apelido a where a.nome_norm = nucleo.norm(un.nome));
  insert into nucleo.prescritor_unidade (pessoa_id, unidade_id, fonte)
  select distinct pessoa_id, unidade_id, 'pedidos-antigo:inj_unidades' from fonte
  where sistema = 'pedidos-antigo:inj_unidades.rt' and unidade_id is not null on conflict do nothing;

  -- 3) RTs da unidade (vigentes e encerradas); titular = a única vigente, ou a 1ª citada no campo "RT" do antigo
  for r in select f.*, m.data->>'rt' rt_campo from fonte f join m_cli m on m.unidade_id = f.unidade_id
           where f.sistema in ('pedidos-antigo:clinicas.rts', 'pedidos-antigo:clinicas.rtsEnc') order by f.ord loop
    if r.de is null then
      insert into nucleo.pendencia_cadastro (tipo, descricao, pessoa_a, unidade_id, dados)
      values ('datas_inconsistentes', 'RT sem data de início no sistema antigo: ' || r.nome, r.pessoa_id, r.unidade_id, jsonb_build_object('fonte', r.ref, 'fim', r.ate));
      continue;
    end if;
    if r.ate is not null and r.ate < r.de then
      insert into nucleo.pendencia_cadastro (tipo, descricao, pessoa_a, unidade_id, dados)
      values ('datas_inconsistentes', 'RT encerrada com fim (' || to_char(r.ate, 'DD/MM/YYYY') || ') antes do início como RT (' || to_char(r.de, 'DD/MM/YYYY') || '): ' || r.nome,
              r.pessoa_id, r.unidade_id, jsonb_build_object('fonte', r.ref, 'inicio', r.de, 'fim', r.ate, 'vinculo', r.vinculo, 'cargo', r.cargo));
      continue;
    end if;
    tit := null;
    if r.sistema = 'pedidos-antigo:clinicas.rts' then
      select count(*) into cnt from fonte f2 where f2.sistema = r.sistema and f2.unidade_id = r.unidade_id;
      if cnt = 1 then tit := 'titular';
      elsif nucleo.chave_nome(split_part(coalesce(r.rt_campo, ''), '/', 1)) = nucleo.chave_nome(r.nome) then tit := 'titular';
      elsif exists (select 1 from fonte f2 where f2.sistema = r.sistema and f2.unidade_id = r.unidade_id and f2.ord <> r.ord
                    and nucleo.chave_nome(split_part(coalesce(r.rt_campo, ''), '/', 1)) = nucleo.chave_nome(f2.nome)) then tit := 'substituta';
      end if;
    end if;
    insert into nucleo.unidade_rt (unidade_id, pessoa_id, tipo, de, ate, vinculo, cargo, fonte)
    values (r.unidade_id, r.pessoa_id, tit, r.de, r.ate, nullif(r.vinculo, ''), nullif(r.cargo, ''), r.sistema);
  end loop;

  -- 4) sócios: o antigo só tem o primeiro nome, sem documento. Casamento nunca é por nome (desenho global §3.1):
  --    um cadastro por unidade; os nomes iguais viram "possível duplicada" para Operações juntar.
  --    "Crescimentum" é empresa, sem CNPJ na fonte: vira pendência
  for r in select m.cli, m.unidade_id, btrim(m.data->>'socio') nome from m_cli m
           where coalesce(btrim(m.data->>'socio'), '') <> '' and m.data->>'socio' !~* 'crescimentum' order by m.cli loop
    insert into nucleo.pessoa (nome) values (r.nome) returning id into pid;
    insert into nucleo.pessoa_origem (pessoa_id, sistema, ref, nome_fonte) values (pid, 'pedidos-antigo:clinicas.socio', r.cli, r.nome);
    insert into nucleo.socio_unidade (unidade_id, pessoa_id, fonte) values (r.unidade_id, pid, 'pedidos-antigo:clinicas.socio');
  end loop;
  insert into nucleo.pendencia_cadastro (tipo, descricao, unidade_id, dados)
  select 'socio_empresa', 'Sócio informado como empresa (' || btrim(m.data->>'socio') || '), sem CNPJ no sistema antigo: cadastrar a empresa e as pessoas sócias', m.unidade_id,
         jsonb_build_object('socio', m.data->>'socio', 'clinica', m.cli_nome)
  from m_cli m where m.data->>'socio' ~* 'crescimentum';
end $carga$;

-- ---------- possíveis duplicadas (por nome): NUNCA junta sozinho ----------
-- regra: mesma chave de nome (sem acento, Z/S, letras dobradas...), ou um nome contido no outro (mesmo 1º nome e
-- todas as palavras do menor no maior, com 2+ palavras), ou a chave de um igual a uma grafia guardada do outro;
-- entre sócios (só 1º nome na fonte), mesmo 1º nome. Cada pessoa de um grupo aponta para a mais antiga do grupo.
with p as (
  select pe.id, pe.criado_em, pe.nome, nucleo.chave_nome(pe.nome) k, string_to_array(nucleo.chave_nome(pe.nome), ' ') t,
         array(select nucleo.chave_nome(x) from unnest(pe.outros_nomes) x) ko,
         exists (select 1 from nucleo.socio_unidade s where s.pessoa_id = pe.id) socio,
         row_number() over (order by pe.criado_em, pe.id) ord
  from nucleo.pessoa pe
), par as (
  select a.id a, b.id b, a.ord ao, b.ord bo
  from p a join p b on a.ord < b.ord and a.socio = b.socio
  where a.k = b.k
     or b.k = any(a.ko) or a.k = any(b.ko)
     or (not a.socio and a.t[1] = b.t[1] and least(cardinality(a.t), cardinality(b.t)) >= 2
         and (a.t <@ b.t or b.t <@ a.t))
     or (a.socio and a.t[1] = b.t[1])
), ancora as (select distinct on (b) a, b from par order by b, ao)
insert into nucleo.pendencia_cadastro (tipo, descricao, pessoa_a, pessoa_b, dados)
select 'possivel_duplicada', 'Possível mesma pessoa: ' || pa.nome || ' × ' || pb.nome, x.a, x.b,
       jsonb_build_object('nome_a', pa.nome, 'nome_b', pb.nome)
from ancora x join nucleo.pessoa pa on pa.id = x.a join nucleo.pessoa pb on pb.id = x.b;

select set_config('request.jwt.claims', '', false), set_config('nucleo.origem', '', false), set_config('nucleo.justificativa', '', false);
