-- =====================================================================
-- Nutra (Estoque Nutra) - módulo isolado no banco único
-- Projeto alvo: xqxjmeioodmdhxhivyqu
-- Origem (legado, somente leitura): ckgsdvhkpnrrmctlqtma (tabelas public.nut_*)
--
-- Conteúdo: schema nutra (tabelas + helpers), RPCs public.nut_* com os
-- mesmos nomes/assinaturas do legado, grants e job pg_cron INATIVO.
-- NÃO contém dados nem segredos. Os dados são copiados à parte.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Schema isolado
-- ---------------------------------------------------------------------
create schema if not exists nutra;
revoke all on schema nutra from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Tabelas
-- ---------------------------------------------------------------------

-- Cópia de public.cmp_unidades do legado (lida pelas funções como "unidades")
create table nutra.unidades (
  id               text primary key,
  nome             text not null,
  sigla            text not null unique,
  cidade           text,
  uf               text,
  endereco_entrega text,
  responsavel      text,
  ativo            boolean not null default true
);

-- Cópia de public.membros do legado (quem pode entrar no painel)
create table nutra.membros (
  email    text primary key check (email = lower(email)),
  nome     text,
  admin    boolean not null default false,
  ativo    boolean not null default true,
  criado   timestamptz not null default now(),
  leitura  boolean not null default false,
  unidades text[] not null default '{}'::text[]
);

create table nutra.config (
  chave text primary key,
  valor text not null
);

create table nutra.produtos (
  id           text primary key,
  nome         text not null,
  apresentacao text not null,
  ordem        integer not null,
  ativo        boolean not null default true,
  categoria    text not null default 'Nutracêuticos'
);

create table nutra.rodadas (
  id         text primary key,
  nome       text not null,
  prazo      date,
  aberta     boolean not null default false,
  criada_em  timestamptz not null default now(),
  fechada_em timestamptz,
  aviso      text
);
create unique index nutra_rodadas_uma_aberta on nutra.rodadas (aberta) where aberta;

create table nutra.estoque_respostas (
  id           bigint generated always as identity primary key,
  levantamento text not null default 'nov-2026',
  unidade_id   text not null references nutra.unidades(id),
  responsavel  text not null,
  itens        jsonb not null,
  observacao   text,
  criado_em    timestamptz not null default now(),
  outros       jsonb not null default '[]'::jsonb
);
create index nutra_resp_unid on nutra.estoque_respostas (levantamento, unidade_id, criado_em desc);

create table nutra.precos (
  chave         text primary key,
  valor         numeric(12,2) not null check (valor >= 0),
  atualizado_em timestamptz not null default now()
);

create table nutra.precos_rodada (
  rodada        text not null references nutra.rodadas(id),
  chave         text not null,
  valor         numeric(12,2) not null check (valor >= 0),
  atualizado_em timestamptz not null default now(),
  primary key (rodada, chave)
);

create table nutra.socios (
  unidade_id text primary key references nutra.unidades(id),
  socio      text not null
);

-- Isolamento: RLS ligado sem políticas + nenhum privilégio para os papéis da API
alter table nutra.unidades          enable row level security;
alter table nutra.membros           enable row level security;
alter table nutra.config            enable row level security;
alter table nutra.produtos          enable row level security;
alter table nutra.rodadas           enable row level security;
alter table nutra.estoque_respostas enable row level security;
alter table nutra.precos            enable row level security;
alter table nutra.precos_rodada     enable row level security;
alter table nutra.socios            enable row level security;

revoke all on all tables    in schema nutra from public, anon, authenticated;
revoke all on all sequences in schema nutra from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Helpers (mesma lógica de public.is_admin/is_membro/minhas_unidades do legado)
-- ---------------------------------------------------------------------
create function nutra.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from nutra.membros m where m.email = lower(auth.jwt()->>'email') and m.ativo and m.admin and not m.leitura)
$$;

create function nutra.is_membro()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from nutra.membros m where m.email = lower(auth.jwt()->>'email') and m.ativo)
$$;

create function nutra.minhas_unidades()
returns text[] language sql stable security definer set search_path = ''
as $$
  select coalesce((select m.unidades from nutra.membros m where m.email = lower(auth.jwt()->>'email') and m.ativo), '{}'::text[])
$$;

revoke all on function nutra.is_admin()        from public, anon, authenticated;
revoke all on function nutra.is_membro()       from public, anon, authenticated;
revoke all on function nutra.minhas_unidades() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. RPCs chamadas pelo site (schema public, mesmos nomes e assinaturas)
-- ---------------------------------------------------------------------

-- Formulário público: dados da rodada aberta, unidades e produtos
create function public.nut_form_dados()
returns jsonb language sql security definer set search_path = ''
as $$
  select jsonb_build_object(
    'rodada', (select nome from nutra.rodadas where aberta),
    'aviso', (select aviso from nutra.rodadas where aberta),
    'prazo', (select to_char(prazo,'DD/MM/YYYY') from nutra.rodadas where aberta),
    'aberto', case when exists(select 1 from nutra.rodadas where aberta) then 'sim' else 'nao' end,
    'unidades', (select jsonb_agg(jsonb_build_object('id',u.id,'nome',u.nome,'uf',u.uf) order by u.uf,u.nome) from nutra.unidades u where u.ativo),
    'produtos', (select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome,'apresentacao',p.apresentacao,'categoria',p.categoria) order by p.ordem) from nutra.produtos p where p.ativo),
    'sugestoes', (select coalesce(jsonb_agg(s order by s),'[]'::jsonb) from (
        select trim(x) s from unnest(string_to_array(coalesce((select valor from nutra.config where chave='sugestoes_outros'),''),';')) x where trim(x)<>''
        union select o->>'nome' from nutra.estoque_respostas r, jsonb_array_elements(r.outros) o) t)
  );
$$;

-- Envio do formulário (versão antiga, sem "outros")
create function public.nut_enviar_estoque(p_unidade text, p_responsavel text, p_itens jsonb, p_obs text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_prod record; v_val jsonb; v_limpo jsonb := '{}'::jsonb; v_id bigint;
begin
  if coalesce((select valor from nutra.config where chave='aberto'),'sim') <> 'sim' then
    raise exception 'O levantamento está encerrado.'; end if;
  if not exists (select 1 from nutra.unidades where id = p_unidade and ativo) then
    raise exception 'Unidade inválida.'; end if;
  if length(trim(coalesce(p_responsavel,''))) < 3 then
    raise exception 'Informe o nome de quem fez a contagem.'; end if;
  for v_prod in select id from nutra.produtos where ativo loop
    v_val := p_itens -> v_prod.id;
    if v_val is null or jsonb_typeof(v_val) <> 'number' or (v_val::text)::numeric < 0 or (v_val::text)::numeric <> trunc((v_val::text)::numeric) or (v_val::text)::numeric > 100000 then
      raise exception 'Quantidade inválida para o item %.', v_prod.id; end if;
    v_limpo := v_limpo || jsonb_build_object(v_prod.id, (v_val::text)::int);
  end loop;
  insert into nutra.estoque_respostas(unidade_id, responsavel, itens, observacao)
  values (p_unidade, left(trim(p_responsavel),120), v_limpo, nullif(left(trim(coalesce(p_obs,'')),1000),''))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'em', now());
end; $$;

-- Envio do formulário (versão atual, com "outros")
create function public.nut_enviar_estoque_v2(p_unidade text, p_responsavel text, p_itens jsonb, p_obs text, p_outros jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_prod record; v_val jsonb; v_limpo jsonb := '{}'::jsonb; v_out jsonb := '[]'::jsonb; v_o jsonb; v_nome text; v_q numeric; v_id bigint; v_vistos text[] := '{}'; v_rod text;
begin
  select id into v_rod from nutra.rodadas where aberta;
  if v_rod is null then raise exception 'O levantamento está encerrado.'; end if;
  if not exists (select 1 from nutra.unidades where id = p_unidade and ativo) then raise exception 'Unidade inválida.'; end if;
  if length(trim(coalesce(p_responsavel,''))) < 3 then raise exception 'Informe o nome de quem fez a contagem.'; end if;
  for v_prod in select id from nutra.produtos where ativo loop
    v_val := p_itens -> v_prod.id;
    if v_val is null or jsonb_typeof(v_val) <> 'number' or (v_val::text)::numeric < 0 or (v_val::text)::numeric <> trunc((v_val::text)::numeric) or (v_val::text)::numeric > 100000 then
      raise exception 'Quantidade inválida para o item %.', v_prod.id; end if;
    v_limpo := v_limpo || jsonb_build_object(v_prod.id, (v_val::text)::int);
  end loop;
  if p_outros is not null and jsonb_typeof(p_outros) = 'array' then
    if jsonb_array_length(p_outros) > 30 then raise exception 'Máximo de 30 outros produtos.'; end if;
    for v_o in select * from jsonb_array_elements(p_outros) loop
      v_nome := regexp_replace(trim(coalesce(v_o->>'nome','')), '\s+', ' ', 'g');
      if v_nome = '' then continue; end if;
      if length(v_nome) > 80 then raise exception 'Nome de produto muito longo: %.', left(v_nome,30); end if;
      begin v_q := (v_o->>'qtd')::numeric; exception when others then v_q := null; end;
      if v_q is null or v_q < 0 or v_q <> trunc(v_q) or v_q > 100000 then raise exception 'Quantidade inválida para %.', v_nome; end if;
      if lower(v_nome) = any(v_vistos) then raise exception 'O produto % foi informado duas vezes.', v_nome; end if;
      v_vistos := v_vistos || lower(v_nome);
      v_out := v_out || jsonb_build_array(jsonb_build_object('nome', v_nome, 'qtd', v_q::int));
    end loop;
  end if;
  insert into nutra.estoque_respostas(levantamento, unidade_id, responsavel, itens, observacao, outros)
  values (v_rod, p_unidade, left(trim(p_responsavel),120), v_limpo, nullif(left(trim(coalesce(p_obs,'')),1000),''), v_out)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'em', now());
end; $$;

-- Painel antigo por senha (o hash fica em nutra.config, chave 'senha_hash')
create function public.nut_painel(p_senha text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_hash text;
begin
  select valor into v_hash from nutra.config where chave='senha_hash';
  if v_hash is null or extensions.crypt(coalesce(p_senha,''), v_hash) <> v_hash then
    perform pg_catalog.pg_sleep(1); raise exception 'Senha incorreta.'; end if;
  return jsonb_build_object(
    'produtos', (select jsonb_agg(jsonb_build_object('id',id,'nome',nome,'apresentacao',apresentacao,'categoria',categoria) order by ordem) from nutra.produtos where ativo),
    'unidades', (select jsonb_agg(jsonb_build_object('id',u.id,'nome',u.nome,'uf',u.uf,'socio',coalesce(s.socio,'Sem sócio cadastrado')) order by u.uf,u.nome) from nutra.unidades u left join nutra.socios s on s.unidade_id=u.id where u.ativo),
    'respostas', coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'unidade_id',r.unidade_id,'responsavel',r.responsavel,'itens',r.itens,'outros',r.outros,'observacao',r.observacao,'criado_em',r.criado_em) order by r.criado_em desc) from nutra.estoque_respostas r where r.levantamento='nov-2026'),'[]'::jsonb),
    'precos', coalesce((select jsonb_object_agg(chave, valor) from nutra.precos),'{}'::jsonb),
    'aberto', coalesce((select valor from nutra.config where chave='aberto'),'sim')
  );
end; $$;

create function public.nut_painel_me()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_admin boolean := nutra.is_admin(); v_un text[] := nutra.minhas_unidades(); v_nome text;
begin
  if not nutra.is_membro() then raise exception 'Seu e-mail não está autorizado. Fale com o Departamento de Operações.'; end if;
  select nome into v_nome from nutra.membros where email = lower(auth.jwt()->>'email');
  return jsonb_build_object(
    'eu', jsonb_build_object('email', lower(auth.jwt()->>'email'), 'nome', v_nome, 'admin', v_admin),
    'produtos', (select jsonb_agg(jsonb_build_object('id',id,'nome',nome,'apresentacao',apresentacao,'categoria',categoria) order by ordem) from nutra.produtos where ativo),
    'unidades', coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'nome',u.nome,'uf',u.uf,'socio',coalesce(s.socio,'Sem sócio cadastrado')) order by u.uf,u.nome)
                 from nutra.unidades u left join nutra.socios s on s.unidade_id=u.id where u.ativo and (v_admin or u.id = any(v_un))),'[]'::jsonb),
    'respostas', coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'unidade_id',r.unidade_id,'responsavel',r.responsavel,'itens',r.itens,'outros',r.outros,'observacao',r.observacao,'criado_em',r.criado_em) order by r.criado_em desc)
                 from nutra.estoque_respostas r where r.levantamento='nov-2026' and (v_admin or r.unidade_id = any(v_un))),'[]'::jsonb),
    'precos', coalesce((select jsonb_object_agg(chave, valor) from nutra.precos),'{}'::jsonb),
    'aberto', coalesce((select valor from nutra.config where chave='aberto'),'sim')
  );
end; $$;

create function public.nut_painel_ver(p_como text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_eu text := lower(auth.jwt()->>'email'); v_admin boolean := nutra.is_admin(); v_un text[] := nutra.minhas_unidades();
        v_nome text; v_como text := lower(trim(coalesce(p_como,''))); v_comonome text; v_lista jsonb;
begin
  if not nutra.is_membro() then raise exception 'Seu e-mail não está autorizado. Fale com o Departamento de Operações.'; end if;
  select nome into v_nome from nutra.membros where email = v_eu;
  if v_admin then
    select jsonb_agg(jsonb_build_object('email',email,'nome',nome) order by nome) into v_lista from nutra.membros where ativo and not admin;
  end if;
  if v_como <> '' then
    if not v_admin then raise exception 'Somente o administrador pode usar "Ver como".'; end if;
    select nome, coalesce(unidades,'{}') into v_comonome, v_un from nutra.membros where email = v_como and ativo;
    if v_comonome is null then raise exception 'Pessoa não encontrada.'; end if;
    v_admin := false;
  end if;
  return jsonb_build_object(
    'eu', jsonb_build_object('email', v_eu, 'nome', v_nome, 'admin', v_admin, 'superadmin', nutra.is_admin(), 'vendo_como', case when v_como<>'' then jsonb_build_object('email',v_como,'nome',v_comonome) end),
    'membros', v_lista,
    'produtos', (select jsonb_agg(jsonb_build_object('id',id,'nome',nome,'apresentacao',apresentacao,'categoria',categoria) order by ordem) from nutra.produtos where ativo),
    'unidades', coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'nome',u.nome,'uf',u.uf,'socio',coalesce(s.socio,'Sem sócio cadastrado')) order by u.uf,u.nome)
                 from nutra.unidades u left join nutra.socios s on s.unidade_id=u.id where u.ativo and (v_admin or u.id = any(v_un))),'[]'::jsonb),
    'respostas', coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'unidade_id',r.unidade_id,'responsavel',r.responsavel,'itens',r.itens,'outros',r.outros,'observacao',r.observacao,'criado_em',r.criado_em) order by r.criado_em desc)
                 from nutra.estoque_respostas r where r.levantamento='nov-2026' and (v_admin or r.unidade_id = any(v_un))),'[]'::jsonb),
    'precos', coalesce((select jsonb_object_agg(chave, valor) from nutra.precos),'{}'::jsonb),
    'aberto', coalesce((select valor from nutra.config where chave='aberto'),'sim')
  );
end; $$;

-- Painel atual (por rodada)
create function public.nut_painel_r(p_como text, p_rodada text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_eu text := lower(auth.jwt()->>'email'); v_admin boolean := nutra.is_admin(); v_super boolean := nutra.is_admin(); v_un text[] := nutra.minhas_unidades();
        v_nome text; v_como text := lower(trim(coalesce(p_como,''))); v_comonome text; v_lista jsonb; v_rod nutra.rodadas; v_ant text;
begin
  if not nutra.is_membro() then raise exception 'Seu e-mail não está autorizado. Fale com o Departamento de Operações.'; end if;
  select nome into v_nome from nutra.membros where email = v_eu;
  if v_admin then select jsonb_agg(jsonb_build_object('email',email,'nome',nome) order by nome) into v_lista from nutra.membros where ativo and not admin; end if;
  if v_como <> '' then
    if not v_admin then raise exception 'Somente o administrador pode usar "Ver como".'; end if;
    select nome, coalesce(unidades,'{}') into v_comonome, v_un from nutra.membros where email = v_como and ativo;
    if v_comonome is null then raise exception 'Pessoa não encontrada.'; end if;
    v_admin := false;
  end if;
  select * into v_rod from nutra.rodadas where id = p_rodada;
  if v_rod.id is null then select * into v_rod from nutra.rodadas order by aberta desc, criada_em desc limit 1; end if;
  select id into v_ant from nutra.rodadas where criada_em < v_rod.criada_em order by criada_em desc limit 1;
  return jsonb_build_object(
    'eu', jsonb_build_object('email', v_eu, 'nome', v_nome, 'admin', v_admin, 'superadmin', v_super, 'vendo_como', case when v_como<>'' then jsonb_build_object('email',v_como,'nome',v_comonome) end),
    'membros', v_lista,
    'rodada', jsonb_build_object('id',v_rod.id,'nome',v_rod.nome,'prazo',v_rod.prazo,'aberta',v_rod.aberta,'anterior',v_ant,'anterior_nome',(select nome from nutra.rodadas where id=v_ant)),
    'rodadas', (select jsonb_agg(jsonb_build_object('id',r.id,'nome',r.nome,'prazo',r.prazo,'aberta',r.aberta,'criada_em',r.criada_em,'fechada_em',r.fechada_em,'aviso',r.aviso,
                 'enviadas',(select count(distinct x.unidade_id) from nutra.estoque_respostas x where x.levantamento=r.id and (v_admin or x.unidade_id = any(v_un))))
                 order by r.criada_em desc) from nutra.rodadas r),
    'produtos', (select jsonb_agg(jsonb_build_object('id',id,'nome',nome,'apresentacao',apresentacao,'categoria',categoria) order by ordem) from nutra.produtos where ativo),
    'unidades', coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'nome',u.nome,'uf',u.uf,'socio',coalesce(s.socio,'Sem sócio cadastrado')) order by u.uf,u.nome)
                 from nutra.unidades u left join nutra.socios s on s.unidade_id=u.id where u.ativo and (v_admin or u.id = any(v_un))),'[]'::jsonb),
    'respostas', coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'unidade_id',r.unidade_id,'responsavel',r.responsavel,'itens',r.itens,'outros',r.outros,'observacao',r.observacao,'criado_em',r.criado_em) order by r.criado_em desc)
                 from nutra.estoque_respostas r where r.levantamento=v_rod.id and (v_admin or r.unidade_id = any(v_un))),'[]'::jsonb),
    'anteriores', coalesce((select jsonb_agg(jsonb_build_object('unidade_id',r.unidade_id,'itens',r.itens,'criado_em',r.criado_em) order by r.criado_em desc)
                 from nutra.estoque_respostas r where v_ant is not null and r.levantamento=v_ant and (v_admin or r.unidade_id = any(v_un))),'[]'::jsonb),
    'precos', coalesce((select jsonb_object_agg(chave, valor) from nutra.precos_rodada where rodada=v_rod.id),'{}'::jsonb),
    'aberto', case when v_rod.aberta then 'sim' else 'nao' end
  );
end; $$;

create function public.nut_rodada_nova(p_nome text, p_prazo date)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_nome text := regexp_replace(trim(coalesce(p_nome,'')),'\s+',' ','g'); v_id text; v_ant text;
begin
  if not nutra.is_admin() then raise exception 'Somente o administrador pode abrir rodadas.'; end if;
  if length(v_nome) < 3 then raise exception 'Informe o nome da rodada (ex.: Dezembro/2026).'; end if;
  if p_prazo is null then raise exception 'Informe o prazo de preenchimento.'; end if;
  if exists (select 1 from nutra.rodadas where lower(nome)=lower(v_nome)) then raise exception 'Já existe uma rodada com esse nome.'; end if;
  select id into v_ant from nutra.rodadas order by criada_em desc limit 1;
  update nutra.rodadas set aberta=false, fechada_em=now() where aberta;
  v_id := 'r-' || to_char(now() at time zone 'America/Sao_Paulo','YYYYMMDD-HH24MISS');
  insert into nutra.rodadas(id,nome,prazo,aberta) values (v_id, v_nome, p_prazo, true);
  insert into nutra.precos_rodada(rodada,chave,valor) select v_id,chave,valor from nutra.precos_rodada where rodada=v_ant;
  return jsonb_build_object('ok',true,'id',v_id);
end; $$;

create function public.nut_rodada_editar(p_id text, p_nome text, p_prazo date, p_aviso text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_nome text := regexp_replace(trim(coalesce(p_nome,'')),'\s+',' ','g');
begin
  if not nutra.is_admin() then raise exception 'Somente o administrador pode alterar rodadas.'; end if;
  if not exists (select 1 from nutra.rodadas where id=p_id) then raise exception 'Rodada inválida.'; end if;
  if length(v_nome) < 3 then raise exception 'Informe o nome da rodada.'; end if;
  if exists (select 1 from nutra.rodadas where lower(nome)=lower(v_nome) and id<>p_id) then raise exception 'Já existe uma rodada com esse nome.'; end if;
  if p_prazo is null then raise exception 'Informe o prazo.'; end if;
  update nutra.rodadas set nome=v_nome, prazo=p_prazo, aviso=nullif(left(trim(coalesce(p_aviso,'')),3000),'') where id=p_id;
  return jsonb_build_object('ok',true);
end; $$;

create function public.nut_rodada_situacao(p_id text, p_aberta boolean, p_prazo date)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not nutra.is_admin() then raise exception 'Somente o administrador pode alterar rodadas.'; end if;
  if not exists (select 1 from nutra.rodadas where id=p_id) then raise exception 'Rodada inválida.'; end if;
  if p_aberta then update nutra.rodadas set aberta=false, fechada_em=coalesce(fechada_em,now()) where aberta and id<>p_id; end if;
  update nutra.rodadas set aberta=p_aberta, prazo=coalesce(p_prazo,prazo), fechada_em=case when p_aberta then null else coalesce(fechada_em,now()) end where id=p_id;
  return jsonb_build_object('ok',true);
end; $$;

-- Rodada automática do dia 1 (chamada pelo pg_cron)
create function public.nut_rodada_auto()
returns text language plpgsql security definer set search_path = ''
as $$
declare v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
        v_meses text[] := array['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        v_nome text; v_id text; v_ant text; v_prazo date;
begin
  v_nome := v_meses[extract(month from v_hoje)::int] || '/' || extract(year from v_hoje)::int;
  if exists (select 1 from nutra.rodadas where lower(nome)=lower(v_nome)) then return 'já existe: '||v_nome; end if;
  v_prazo := (date_trunc('month', v_hoje) + interval '1 month - 1 day')::date;   -- último dia do mês
  select id into v_ant from nutra.rodadas order by criada_em desc limit 1;
  update nutra.rodadas set aberta=false, fechada_em=now() where aberta;
  v_id := 'r-' || to_char(now() at time zone 'America/Sao_Paulo','YYYYMMDD-HH24MISS');
  insert into nutra.rodadas(id,nome,prazo,aberta) values (v_id, v_nome, v_prazo, true);
  insert into nutra.precos_rodada(rodada,chave,valor) select v_id,chave,valor from nutra.precos_rodada where rodada=v_ant;
  return 'aberta: '||v_nome;
end; $$;

-- Preço por senha (versão antiga; hash em nutra.config)
create function public.nut_set_preco(p_senha text, p_chave text, p_valor numeric)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_hash text; v_k text;
begin
  select valor into v_hash from nutra.config where chave='senha_hash';
  if v_hash is null or extensions.crypt(coalesce(p_senha,''), v_hash) <> v_hash then
    perform pg_catalog.pg_sleep(1); raise exception 'Senha incorreta.'; end if;
  v_k := lower(trim(coalesce(p_chave,'')));
  if v_k = '' or length(v_k) > 90 then raise exception 'Produto inválido.'; end if;
  if v_k not like 'o:%' and not exists (select 1 from nutra.produtos where id = v_k) then raise exception 'Produto inválido.'; end if;
  if p_valor is null then
    delete from nutra.precos where chave = v_k;
  else
    if p_valor < 0 or p_valor > 1000000 then raise exception 'Valor inválido.'; end if;
    insert into nutra.precos(chave,valor) values (v_k, round(p_valor,2))
    on conflict (chave) do update set valor=excluded.valor, atualizado_em=now();
  end if;
  return jsonb_build_object('ok',true);
end; $$;

create function public.nut_set_preco_me(p_chave text, p_valor numeric)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_k text;
begin
  if not nutra.is_admin() then raise exception 'Somente o administrador pode alterar valores.'; end if;
  v_k := lower(trim(coalesce(p_chave,'')));
  if not exists (select 1 from nutra.produtos where id = v_k) then raise exception 'Produto inválido.'; end if;
  if p_valor is null then delete from nutra.precos where chave = v_k;
  else
    if p_valor < 0 or p_valor > 1000000 then raise exception 'Valor inválido.'; end if;
    insert into nutra.precos(chave,valor) values (v_k, round(p_valor,2)) on conflict (chave) do update set valor=excluded.valor, atualizado_em=now();
  end if;
  return jsonb_build_object('ok',true);
end; $$;

create function public.nut_set_preco_r(p_rodada text, p_chave text, p_valor numeric)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_k text := lower(trim(coalesce(p_chave,'')));
begin
  if not nutra.is_admin() then raise exception 'Somente o administrador pode alterar valores.'; end if;
  if not exists (select 1 from nutra.rodadas where id=p_rodada) then raise exception 'Rodada inválida.'; end if;
  if not exists (select 1 from nutra.produtos where id = v_k) then raise exception 'Produto inválido.'; end if;
  if p_valor is null then delete from nutra.precos_rodada where rodada=p_rodada and chave = v_k;
  else
    if p_valor < 0 or p_valor > 1000000 then raise exception 'Valor inválido.'; end if;
    insert into nutra.precos_rodada(rodada,chave,valor) values (p_rodada, v_k, round(p_valor,2)) on conflict (rodada,chave) do update set valor=excluded.valor, atualizado_em=now();
  end if;
  return jsonb_build_object('ok',true);
end; $$;

-- ---------------------------------------------------------------------
-- 5. Grants (iguais ao legado)
--    anon + authenticated: nut_form_dados, nut_enviar_estoque_v2
--    authenticated:        nut_painel_me, nut_painel_ver, nut_painel_r,
--                          nut_rodada_nova, nut_rodada_editar, nut_rodada_situacao,
--                          nut_set_preco_me, nut_set_preco_r
--    só service_role:      nut_enviar_estoque, nut_painel, nut_set_preco, nut_rodada_auto
-- ---------------------------------------------------------------------
revoke all on function public.nut_form_dados()                                   from public, anon, authenticated;
revoke all on function public.nut_enviar_estoque(text, text, jsonb, text)        from public, anon, authenticated;
revoke all on function public.nut_enviar_estoque_v2(text, text, jsonb, text, jsonb) from public, anon, authenticated;
revoke all on function public.nut_painel(text)                                   from public, anon, authenticated;
revoke all on function public.nut_painel_me()                                    from public, anon, authenticated;
revoke all on function public.nut_painel_ver(text)                               from public, anon, authenticated;
revoke all on function public.nut_painel_r(text, text)                           from public, anon, authenticated;
revoke all on function public.nut_rodada_nova(text, date)                        from public, anon, authenticated;
revoke all on function public.nut_rodada_editar(text, text, date, text)          from public, anon, authenticated;
revoke all on function public.nut_rodada_situacao(text, boolean, date)           from public, anon, authenticated;
revoke all on function public.nut_rodada_auto()                                  from public, anon, authenticated;
revoke all on function public.nut_set_preco(text, text, numeric)                 from public, anon, authenticated;
revoke all on function public.nut_set_preco_me(text, numeric)                    from public, anon, authenticated;
revoke all on function public.nut_set_preco_r(text, text, numeric)               from public, anon, authenticated;

grant execute on function public.nut_form_dados()                                    to anon, authenticated, service_role;
grant execute on function public.nut_enviar_estoque_v2(text, text, jsonb, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.nut_painel_me()                                     to authenticated, service_role;
grant execute on function public.nut_painel_ver(text)                                to authenticated, service_role;
grant execute on function public.nut_painel_r(text, text)                            to authenticated, service_role;
grant execute on function public.nut_rodada_nova(text, date)                         to authenticated, service_role;
grant execute on function public.nut_rodada_editar(text, text, date, text)           to authenticated, service_role;
grant execute on function public.nut_rodada_situacao(text, boolean, date)            to authenticated, service_role;
grant execute on function public.nut_set_preco_me(text, numeric)                     to authenticated, service_role;
grant execute on function public.nut_set_preco_r(text, text, numeric)                to authenticated, service_role;
grant execute on function public.nut_enviar_estoque(text, text, jsonb, text)         to service_role;
grant execute on function public.nut_painel(text)                                    to service_role;
grant execute on function public.nut_set_preco(text, text, numeric)                  to service_role;
grant execute on function public.nut_rodada_auto()                                   to service_role;

-- ---------------------------------------------------------------------
-- 6. Job mensal (mesmo horário do legado: dia 1, 10:00 UTC) - criado INATIVO.
--    O legado continua sendo o sistema em uso até a virada.
-- ---------------------------------------------------------------------
select cron.schedule('nutra-rodada-dia-01', '0 10 1 * *', 'select public.nut_rodada_auto()');
update cron.job set active = false where jobname = 'nutra-rodada-dia-01';
