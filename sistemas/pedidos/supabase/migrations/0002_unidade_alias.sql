create table pedidos_novo.unidade_alias (
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid not null references pedidos_novo.unidade(id),
  nome        text not null,
  nome_norm   text generated always as (upper(regexp_replace(translate(nome,'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç','AAAAEEIOOOUCaaaaeeiooouc'),'[^A-Za-z0-9]+',' ','g'))) stored,
  sistema     text not null,
  unique (nome_norm, unidade_id)
);
create index on pedidos_novo.unidade_alias (nome_norm);
alter table pedidos_novo.unidade_alias enable row level security;
revoke all on pedidos_novo.unidade_alias from public, anon, authenticated;
create trigger t_audita after insert or update or delete on pedidos_novo.unidade_alias for each row execute function pedidos_novo.audita();
