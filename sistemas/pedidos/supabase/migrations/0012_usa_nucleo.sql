-- =====================================================================
-- 0012: o Laboratórios passa a usar o NÚCLEO (schema nucleo, sistemas/nucleo/migrations/0001_nucleo.sql)
--  * unidade = nucleo.unidade, cujo id é o uuid de public.unidades (desenho global §3.1).
--    A equivalência id antigo do Laboratórios → id do núcleo fica em nucleo.unidade_ref
--    (sistema = 'pedidos_novo.unidade'); pedido.unidade_id e pagamento.unidade_id são re-apontados por ela.
--  * receita.prescritor_id e termo.rt_id → nucleo.pessoa.
--  * unidade, unidade_cnpj, unidade_alias, pessoa e usuario do pedidos_novo viram VIEWS de compatibilidade
--    (mesmas colunas), para os robôs conectores e omie continuarem iguais, sem republicar.
--  * O acesso do Laboratórios passa a vir de nucleo.usuario_papel (pedidos-api e pedidos-historico).
-- A troca de chave é técnica (mesma unidade, outro número): os gatilhos de auditoria e de atualizado_em
-- ficam desligados só durante o UPDATE, e um único registro em pedidos_novo.evento descreve a troca.
-- Conferência: sistemas/nucleo/conferencia/retrato.sql antes e depois (contagens e somas idênticas).
-- =====================================================================

-- todas as unidades usadas no Laboratórios têm equivalência no núcleo (senão a migração para aqui)
do $$ begin
  if exists (select 1 from pedidos_novo.pedido p where not exists (select 1 from nucleo.unidade_ref r where r.sistema = 'pedidos_novo.unidade' and r.ref = p.unidade_id::text))
     or exists (select 1 from pedidos_novo.pagamento p where not exists (select 1 from nucleo.unidade_ref r where r.sistema = 'pedidos_novo.unidade' and r.ref = p.unidade_id::text))
  then raise exception 'Unidade do Laboratórios sem equivalência no núcleo'; end if;
end $$;

alter table pedidos_novo.pedido    drop constraint pedido_unidade_id_fkey;
alter table pedidos_novo.pagamento drop constraint pagamento_unidade_id_fkey;
alter table pedidos_novo.receita   drop constraint receita_unidade_id_fkey, drop constraint receita_prescritor_id_fkey;
alter table pedidos_novo.termo     drop constraint termo_unidade_id_fkey, drop constraint termo_rt_id_fkey;

alter table pedidos_novo.pedido    disable trigger t_audita, disable trigger t_atualizado, disable trigger pedido_num_interno;
alter table pedidos_novo.pagamento disable trigger t_audita;
update pedidos_novo.pedido p set unidade_id = r.unidade_id
  from nucleo.unidade_ref r where r.sistema = 'pedidos_novo.unidade' and r.ref = p.unidade_id::text;
update pedidos_novo.pagamento p set unidade_id = r.unidade_id
  from nucleo.unidade_ref r where r.sistema = 'pedidos_novo.unidade' and r.ref = p.unidade_id::text;
alter table pedidos_novo.pedido    enable trigger t_audita, enable trigger t_atualizado, enable trigger pedido_num_interno;
alter table pedidos_novo.pagamento enable trigger t_audita;

insert into pedidos_novo.evento (tabela, registro_id, acao, antes, depois, por)
values ('migracao', '0012_usa_nucleo', 'update', null,
        jsonb_build_object('o_que', 'unidade_id de pedido e pagamento re-apontado para nucleo.unidade (uuid de public.unidades)',
                           'equivalencia', 'nucleo.unidade_ref (sistema = pedidos_novo.unidade)',
                           'pedidos', (select count(*) from pedidos_novo.pedido), 'pagamentos', (select count(*) from pedidos_novo.pagamento)),
        'migracao-nucleo');

alter table pedidos_novo.pedido    add constraint pedido_unidade_id_fkey    foreign key (unidade_id) references nucleo.unidade(id);
alter table pedidos_novo.pagamento add constraint pagamento_unidade_id_fkey foreign key (unidade_id) references nucleo.unidade(id);
alter table pedidos_novo.receita   add constraint receita_unidade_id_fkey   foreign key (unidade_id) references nucleo.unidade(id),
                                   add constraint receita_prescritor_id_fkey foreign key (prescritor_id) references nucleo.pessoa(id);
alter table pedidos_novo.termo     add constraint termo_unidade_id_fkey     foreign key (unidade_id) references nucleo.unidade(id),
                                   add constraint termo_rt_id_fkey          foreign key (rt_id) references nucleo.pessoa(id);

-- as tabelas antigas saem (o conteúdo está no núcleo, com os mesmos ids de CNPJ e apelido; o id antigo da unidade em unidade_ref)
drop table pedidos_novo.unidade_alias;
drop table pedidos_novo.unidade_cnpj;
drop table pedidos_novo.unidade;
drop table pedidos_novo.pessoa;
drop table pedidos_novo.usuario;

-- ---------- views de compatibilidade (mesmas colunas de antes) ----------
create view pedidos_novo.unidade with (security_invoker = true) as
  select id, doc_unidade_id, nome, cidade, uf, ativo, criado_em, atualizado_em from nucleo.unidade;
create view pedidos_novo.unidade_cnpj with (security_invoker = true) as
  select ue.id, ue.unidade_id, e.cnpj, e.razao_social, ue.de, ue.ate
  from nucleo.unidade_empresa ue join nucleo.empresa e on e.id = ue.empresa_id;
create view pedidos_novo.unidade_alias with (security_invoker = true) as
  select id, unidade_id, nome, nome_norm, sistema from nucleo.unidade_apelido;
create view pedidos_novo.pessoa with (security_invoker = true) as
  select p.id, p.nome, pr.conselho, pr.registro, pr.uf, coalesce(pr.habilitado_prescrever, false) habilitado_prescrever, p.ativo and p.juntada_em is null ativo
  from nucleo.pessoa p
  left join lateral (select * from nucleo.profissional x where x.pessoa_id = p.id order by x.registro is null, x.habilitado_prescrever desc limit 1) pr on true;
create view pedidos_novo.usuario with (security_invoker = true) as
  select u.email, u.nome,
         (select up.papel from nucleo.usuario_papel up where up.email = u.email and up.modulo in ('laboratorios','todos')
          order by array_position(array['operacoes','admin','financeiro','central','socio','unidade','leitura'], up.papel) nulls last limit 1) papel,
         coalesce((select array_agg(up.unidade_id) from nucleo.usuario_papel up
                   where up.email = u.email and up.modulo in ('laboratorios','todos') and up.unidade_id is not null), '{}'::uuid[]) unidades,
         u.ativo, u.criado_em, u.atualizado_em
  from nucleo.usuario u;
revoke all on pedidos_novo.unidade, pedidos_novo.unidade_cnpj, pedidos_novo.unidade_alias, pedidos_novo.pessoa, pedidos_novo.usuario
  from public, anon, authenticated;
