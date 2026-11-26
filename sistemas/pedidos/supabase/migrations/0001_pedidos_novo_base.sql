-- =====================================================================
-- Sistema de Pedidos Dr. Hair (novo) — área separada "pedidos_novo"
-- Banco único: drhair-documentacao-imoveis (Supabase)
-- 0001: estrutura base do MVP. Nenhuma tabela existente é alterada.
--
-- Princípios (documento de decisão do conselho, 26/11/2026):
--  * laboratório = cadastro com ficha de regras (versão guardada)
--  * situação do pedido e da parcela é CALCULADA (views), nunca digitada
--  * pagamento da Dr. Hair separado da parcela do laboratório;
--    parcela só fecha quando comprovante + planilha do lab + baixa Omie batem
--  * nada se apaga: cancelamento com motivo; arquivos com hash
--  * registro de alterações feito pelo próprio banco (gatilho)
--  * sem acesso pela internet até as regras de acesso (RLS) serem aprovadas
-- =====================================================================

create schema if not exists pedidos_novo;
comment on schema pedidos_novo is 'Sistema de Pedidos Dr. Hair (novo) — em construção, isolado dos demais sistemas';
revoke all on schema pedidos_novo from public, anon, authenticated;

set search_path = pedidos_novo, public;

-- ---------- utilitários ----------
create or replace function pedidos_novo.hoje() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

create or replace function pedidos_novo.toca_atualizado() returns trigger
language plpgsql set search_path = '' as $$ begin new.atualizado_em := now(); return new; end $$;

-- ---------- registro de alterações (auditoria) ----------
create table pedidos_novo.evento (
  id          bigint generated always as identity primary key,
  tabela      text not null,
  registro_id text not null,
  acao        text not null check (acao in ('insert','update','delete')),
  antes       jsonb,
  depois      jsonb,
  por         text not null default coalesce(current_setting('request.jwt.claims', true)::jsonb->>'email', current_user),
  em          timestamptz not null default now()
);
create index on pedidos_novo.evento (tabela, registro_id);

create or replace function pedidos_novo.audita() returns trigger
language plpgsql security definer set search_path = '' as $$
declare rid text;
begin
  rid := coalesce((to_jsonb(coalesce(new, old))->>'id'), '?');
  insert into pedidos_novo.evento (tabela, registro_id, acao, antes, depois)
  values (tg_table_name, rid, lower(tg_op),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

-- o registro de alterações não pode ser alterado nem apagado
create or replace function pedidos_novo.bloqueia_alteracao() returns trigger
language plpgsql set search_path = '' as $$ begin raise exception 'Registro de alterações não pode ser alterado nem apagado'; end $$;
create trigger evento_imutavel before update or delete on pedidos_novo.evento
  for each row execute function pedidos_novo.bloqueia_alteracao();

-- ---------- usuários e papéis ----------
create table pedidos_novo.usuario (
  email       text primary key check (email = lower(email)),
  nome        text not null,
  papel       text not null check (papel in ('admin','central','financeiro','unidade','socio','leitura')),
  unidades    uuid[] not null default '{}',   -- vazio = todas (admin/central/financeiro)
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- cadastros ----------
-- Unidade: liga ao cadastro oficial de documentos (public.unidades) e guarda o CNPJ com vigência
create table pedidos_novo.unidade (
  id            uuid primary key default gen_random_uuid(),
  doc_unidade_id uuid unique references public.unidades(id),
  nome          text not null unique,
  cidade        text,
  uf            text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table pedidos_novo.unidade_cnpj (
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid not null references pedidos_novo.unidade(id),
  cnpj        text not null check (cnpj ~ '^\d{14}$'),
  razao_social text not null,
  de          date not null,
  ate         date,
  check (ate is null or ate >= de)
);
create index on pedidos_novo.unidade_cnpj (cnpj);

create table pedidos_novo.laboratorio (
  id            text primary key,                 -- ex.: 'CP', 'INJ'
  nome          text not null,
  cnpj          text check (cnpj ~ '^\d{14}$'),
  ativo         boolean not null default true,
  prazo_envio_dias int not null default 30,       -- decisão 26/11: 30 dias corridos
  ficha         jsonb not null default '{}',      -- regras: origem, situação, NF, rastreio, condição, documento exigido...
  ficha_versao  int not null default 1,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table pedidos_novo.pessoa (            -- prescritores / RTs
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  conselho    text check (conselho in ('CRBM','CRM','CRF','COREN','outro')),
  registro    text,
  uf          text,
  habilitado_prescrever boolean not null default false,
  ativo       boolean not null default true,
  unique (conselho, registro, uf)
);

create table pedidos_novo.arquivo (
  id          uuid primary key default gen_random_uuid(),
  bucket      text not null,
  path        text not null,
  nome        text not null,
  tipo        text,
  tamanho     bigint,
  sha256      text,                               -- aviso de documento repetido pelo conteúdo
  categoria   text not null check (categoria in ('receita','termo','comprovante','nota_fiscal','xml_nf','boleto','pedido_venda','espelho','outro')),
  enviado_em  timestamptz not null default now(),
  enviado_por text,
  substituido_por uuid references pedidos_novo.arquivo(id),   -- nunca apaga: substitui
  unique (bucket, path)
);
create index on pedidos_novo.arquivo (sha256);

-- Termo da unidade com o laboratório: define o RT que pode prescrever (decisão 26/11: só o RT do termo)
create table pedidos_novo.termo (
  id            uuid primary key default gen_random_uuid(),
  unidade_id    uuid not null references pedidos_novo.unidade(id),
  laboratorio_id text not null references pedidos_novo.laboratorio(id),
  rt_id         uuid not null references pedidos_novo.pessoa(id),
  de            date not null,
  ate           date,
  arquivo_id    uuid references pedidos_novo.arquivo(id),
  check (ate is null or ate >= de)
);

create table pedidos_novo.produto (
  id            uuid primary key default gen_random_uuid(),
  laboratorio_id text not null references pedidos_novo.laboratorio(id),
  codigo        text not null,                  -- código interno (ex.: 'fator', 'dutasterida')
  descricao     text not null,
  apresentacao  text,
  controlado    boolean not null default false,
  ativo         boolean not null default true,
  unique (laboratorio_id, codigo)
);

create table pedidos_novo.preco (                -- preço com vigência
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references pedidos_novo.produto(id),
  de          date not null,
  valor       numeric(12,2) not null check (valor >= 0),
  unique (produto_id, de)
);

-- ---------- receita (com saldo por produto) ----------
create table pedidos_novo.receita (
  id            uuid primary key default gen_random_uuid(),
  unidade_id    uuid not null references pedidos_novo.unidade(id),
  laboratorio_id text not null references pedidos_novo.laboratorio(id),
  prescritor_id uuid not null references pedidos_novo.pessoa(id),
  paciente_codigo text,                          -- pseudônimo; nunca nome (LGPD)
  emitida_em    date not null,
  validade      date not null,
  arquivo_id    uuid references pedidos_novo.arquivo(id),
  cancelada_motivo text,
  criado_em     timestamptz not null default now(),
  check (validade >= emitida_em)
);

create table pedidos_novo.receita_item (
  receita_id  uuid not null references pedidos_novo.receita(id),
  produto_id  uuid not null references pedidos_novo.produto(id),
  qtd         numeric(12,2) not null check (qtd > 0),
  primary key (receita_id, produto_id)
);

-- ---------- pedido ----------
create sequence pedidos_novo.num_interno_seq;

create table pedidos_novo.pedido (
  id            uuid primary key default gen_random_uuid(),
  num_interno   text unique,                     -- DH-AAAA-NNNN (gerado ao enviar)
  laboratorio_id text not null references pedidos_novo.laboratorio(id),
  unidade_id    uuid not null references pedidos_novo.unidade(id),
  num_lab       text,                            -- nº no laboratório (NetSuite, Injemed...)
  mae_id        uuid references pedidos_novo.pedido(id),   -- pedido mãe (opcional)
  tipo          text not null default 'normal' check (tipo in ('normal','mae','remessa')),
  rascunho      boolean not null default true,
  enviado_em    date,
  confirmado_lab_em date,
  previsao_envio date,
  expedido_em   date,
  rastreio      text,
  recebido_em   date,
  recebido_por  text,
  recebido_obs  text,
  frete         numeric(12,2) not null default 0,
  cancelado_em  timestamptz,
  cancelado_motivo text,
  origem        text not null default 'digitado' check (origem in ('digitado','planilha','omie','pdf','migracao')),
  legado_ref    text,                            -- id no sistema antigo
  obs           text,
  criado_por    text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check ((cancelado_em is null) = (cancelado_motivo is null)),
  unique (laboratorio_id, num_lab)
);
create index on pedidos_novo.pedido (unidade_id);

create table pedidos_novo.pedido_item (
  id          uuid primary key default gen_random_uuid(),
  pedido_id   uuid not null references pedidos_novo.pedido(id),
  produto_id  uuid not null references pedidos_novo.produto(id),
  qtd         numeric(12,2) not null check (qtd > 0),
  preco_unit  numeric(12,2) not null check (preco_unit >= 0),   -- congelado no momento do pedido
  total       numeric(14,2) generated always as (round(qtd * preco_unit, 2)) stored,
  lote        text,
  validade_lote date,
  unique (pedido_id, produto_id)
);

create table pedidos_novo.pedido_receita (
  pedido_id   uuid not null references pedidos_novo.pedido(id),
  receita_id  uuid not null references pedidos_novo.receita(id),
  primary key (pedido_id, receita_id)
);

create table pedidos_novo.pedido_arquivo (
  pedido_id   uuid not null references pedidos_novo.pedido(id),
  arquivo_id  uuid not null references pedidos_novo.arquivo(id),
  primary key (pedido_id, arquivo_id)
);

-- situação no laboratório informada pelas fontes (planilha, manual...), com origem
create table pedidos_novo.etapa_lab (
  id          bigint generated always as identity primary key,
  pedido_id   uuid not null references pedidos_novo.pedido(id),
  etapa       text not null,
  previsao    date,
  origem      text not null,
  em          timestamptz not null default now()
);

-- ---------- financeiro ----------
create table pedidos_novo.parcela (              -- o que o laboratório cobra
  id          uuid primary key default gen_random_uuid(),
  pedido_id   uuid not null references pedidos_novo.pedido(id),
  n           int not null,
  de          int not null,
  vencimento  date not null,
  valor       numeric(12,2) not null check (valor > 0),
  forma       text not null check (forma in ('cartao','pix','boleto','outro')),
  baixa_planilha_em date,                       -- o lab registrou na planilha dele
  baixa_omie_em date,                           -- o lab deu baixa na Omie
  boleto_arquivo_id uuid references pedidos_novo.arquivo(id),
  cancelada_motivo text,
  origem      text not null default 'digitado',
  unique (pedido_id, n, de)
);

create table pedidos_novo.pagamento (            -- o que a Dr. Hair pagou (com comprovante)
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid not null references pedidos_novo.unidade(id),   -- decisão 26/11: cada CNPJ paga o seu
  pago_em     date not null,
  valor       numeric(12,2) not null check (valor > 0),
  forma       text not null check (forma in ('cartao','pix','boleto','outro')),
  comprovante_id uuid not null references pedidos_novo.arquivo(id),
  obs         text,
  registrado_por text,
  registrado_em timestamptz not null default now()
);

create table pedidos_novo.pagamento_parcela (    -- quanto de cada pagamento vai para cada parcela
  pagamento_id uuid not null references pedidos_novo.pagamento(id),
  parcela_id   uuid not null references pedidos_novo.parcela(id),
  valor        numeric(12,2) not null check (valor > 0),
  primary key (pagamento_id, parcela_id)
);

create table pedidos_novo.nota_fiscal (
  id          uuid primary key default gen_random_uuid(),
  laboratorio_id text not null references pedidos_novo.laboratorio(id),
  numero      text not null,
  emissao     date,
  cnpj_destino text,
  total       numeric(14,2),
  frete       numeric(12,2) default 0,
  cancelada   boolean not null default false,
  xml_id      uuid references pedidos_novo.arquivo(id),
  danfe_id    uuid references pedidos_novo.arquivo(id),
  origem      text not null default 'digitado',
  unique (laboratorio_id, numero)
);

create table pedidos_novo.nota_item (
  id          uuid primary key default gen_random_uuid(),
  nota_id     uuid not null references pedidos_novo.nota_fiscal(id),
  produto_id  uuid references pedidos_novo.produto(id),
  descricao   text not null,
  cfop        text,
  qtd         numeric(12,2) not null,
  preco_unit  numeric(12,4),
  total       numeric(14,2),
  lote        text,
  validade_lote date
);

create table pedidos_novo.nota_pedido (           -- uma NF pode valer para vários pedidos e vice-versa
  nota_id     uuid not null references pedidos_novo.nota_fiscal(id),
  pedido_id   uuid not null references pedidos_novo.pedido(id),
  primary key (nota_id, pedido_id)
);

-- ---------- pendências (o que fazer) e monitoramento das automações ----------
create table pedidos_novo.pendencia (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null,                     -- ex.: 'cobrar_baixa', 'nf_diverge', 'atraso', 'documento_vencido'
  pedido_id   uuid references pedidos_novo.pedido(id),
  parcela_id  uuid references pedidos_novo.parcela(id),
  descricao   text not null,
  valor       numeric(14,2),
  responsavel text,
  status      text not null default 'aberta' check (status in ('aberta','em_andamento','resolvida','descartada')),
  resolucao   text,
  criada_em   timestamptz not null default now(),
  resolvida_em timestamptz
);

create table pedidos_novo.execucao_conector (
  id          bigint generated always as identity primary key,
  conector    text not null,                     -- 'planilha_cp', 'omie', 'quality', 'pdf'
  laboratorio_id text references pedidos_novo.laboratorio(id),
  inicio      timestamptz not null default now(),
  fim         timestamptz,
  status      text not null default 'rodando' check (status in ('rodando','ok','erro','parcial')),
  lidos       int default 0,
  aplicados   int default 0,
  erros       jsonb default '[]',
  arquivo_bruto_id uuid references pedidos_novo.arquivo(id)
);

-- ---------- situação CALCULADA ----------
create or replace view pedidos_novo.v_parcela with (security_invoker = true) as
select p.*,
  coalesce(pg.pago, 0)                                   as pago_por_nos,
  (coalesce(pg.pago,0) >= p.valor - 0.01)                as quitada_por_nos,
  case
    when p.cancelada_motivo is not null then 'cancelada'
    when coalesce(pg.pago,0) >= p.valor - 0.01 and p.baixa_planilha_em is not null and p.baixa_omie_em is not null then 'quitada'
    when coalesce(pg.pago,0) >= p.valor - 0.01 then 'paga_aguardando_baixa'   -- gera cobrança de baixa ao laboratório
    when p.vencimento < pedidos_novo.hoje() then 'vencida'
    else 'a_vencer'
  end as situacao
from pedidos_novo.parcela p
left join (select parcela_id, sum(valor) pago from pedidos_novo.pagamento_parcela group by 1) pg on pg.parcela_id = p.id;

create or replace view pedidos_novo.v_pedido with (security_invoker = true) as
select pe.*,
  coalesce(it.subtotal,0)                    as subtotal,
  coalesce(it.subtotal,0) + pe.frete         as total,
  case
    when pe.cancelado_em is not null then 'cancelado'
    when pe.rascunho then 'rascunho'
    when pe.recebido_em is not null then 'recebido'
    when pe.expedido_em is not null then 'a_caminho'
    when pe.confirmado_lab_em is not null then 'no_laboratorio'
    else 'enviado_ao_laboratorio'
  end as situacao,
  case when pe.recebido_em is null and pe.expedido_em is null and pe.cancelado_em is null and not pe.rascunho
        and coalesce(pe.previsao_envio, pe.enviado_em + l.prazo_envio_dias) < pedidos_novo.hoje()
       then pedidos_novo.hoje() - coalesce(pe.previsao_envio, pe.enviado_em + l.prazo_envio_dias) else 0 end as dias_atraso
from pedidos_novo.pedido pe
join pedidos_novo.laboratorio l on l.id = pe.laboratorio_id
left join (select pedido_id, sum(total) subtotal from pedidos_novo.pedido_item group by 1) it on it.pedido_id = pe.id;

-- ---------- número interno DH-AAAA-NNNN ----------
create or replace function pedidos_novo.gera_num_interno() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.num_interno is null and not new.rascunho then
    new.num_interno := 'DH-' || extract(year from pedidos_novo.hoje())::int || '-' || lpad(nextval('pedidos_novo.num_interno_seq')::text, 4, '0');
  end if;
  return new;
end $$;
create trigger pedido_num_interno before insert or update on pedidos_novo.pedido
  for each row execute function pedidos_novo.gera_num_interno();

-- ---------- gatilhos de atualizado_em e auditoria ----------
create trigger t_atualizado before update on pedidos_novo.pedido      for each row execute function pedidos_novo.toca_atualizado();
create trigger t_atualizado before update on pedidos_novo.unidade     for each row execute function pedidos_novo.toca_atualizado();
create trigger t_atualizado before update on pedidos_novo.laboratorio for each row execute function pedidos_novo.toca_atualizado();
create trigger t_atualizado before update on pedidos_novo.usuario     for each row execute function pedidos_novo.toca_atualizado();

do $$
declare t text;
begin
  foreach t in array array['usuario','unidade','unidade_cnpj','laboratorio','pessoa','arquivo','termo','produto','preco',
                           'receita','receita_item','pedido','pedido_item','pedido_receita','pedido_arquivo',
                           'parcela','pagamento','pagamento_parcela','nota_fiscal','nota_item','nota_pedido','pendencia']
  loop
    execute format('create trigger t_audita after insert or update or delete on pedidos_novo.%I for each row execute function pedidos_novo.audita()', t);
  end loop;
end $$;

-- ---------- isolamento: RLS em tudo, nenhum acesso pela internet por enquanto ----------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'pedidos_novo' loop
    execute format('alter table pedidos_novo.%I enable row level security', t);
    execute format('revoke all on pedidos_novo.%I from public, anon, authenticated', t);
  end loop;
end $$;
revoke all on all functions in schema pedidos_novo from public, anon, authenticated;
revoke all on all sequences in schema pedidos_novo from public, anon, authenticated;
alter default privileges in schema pedidos_novo revoke all on tables from public, anon, authenticated;
alter default privileges in schema pedidos_novo revoke all on functions from public, anon, authenticated;
