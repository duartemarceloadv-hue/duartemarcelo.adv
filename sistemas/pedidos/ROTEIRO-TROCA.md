# Roteiro do dia da troca — Laboratórios (Pedidos antigo → novo)

Preparado em 28/11/2026. **Nada deste roteiro foi executado**, exceto a simulação do passo 6 (feita e desfeita).
Ferramentas no banco novo: migration `supabase/migrations/0017_troca_preparada.sql` (aplicada; só cria funções e uma tabela vazia).
Condições do dono para marcar o dia: lista de aceite (`aceite-troca.md`) toda conferida, teste do dono no site de teste,
cópia de segurança funcionando, janela entre os dias 05 e 20 do mês, longe de 14/12 e do recesso.

## 1. Congelar o antigo (feito pelo dono, ou por mim com a autorização dele; não executar antes do dia)
1. Avisar a central e as unidades: a partir de HH:MM ninguém grava no sistema antigo de Pedidos.
2. Pausar a tarefa "Sincronizar Portal Omie" no computador do dono (será reapontada para a função `omie` do novo no passo 9).
3. No projeto antigo, desligar **só** as rotinas do Pedidos: planilha (de hora em hora), rastreio (2x/dia) e `gerar_receitas` (dia 01).
   **Não tocar** em `nut_*` (Estoque Nutra, em uso), `cmp_*`, `reb_*` nem `membros`: continuam gravando (desenho global, Fase 2).
4. Deixar em somente leitura as coleções e funções do Pedidos (docs col = pedidos, omieNF, receitas, clinicas, prescritores; inj_*;
   automacoes, rastreio, omie-sync, importar-pv, anexar-*). Ficam assim por 90 dias.
5. Anotar a hora do congelamento (é a referência da sincronização final).

## 2. Guardar a cópia de antes (banco novo)
```sql
create table pedidos_novo.legado_doc_base as select * from pedidos_novo.legado_doc;
alter table pedidos_novo.legado_doc_base enable row level security;
revoke all on pedidos_novo.legado_doc_base from public, anon, authenticated;
```
Retrato de antes: `select pedidos_novo.troca_retrato();` e `sistemas/nucleo/conferencia/retrato.sql`; guardar em `sistemas/nucleo/conferencia/`.

## 3. Sincronização final (o que mudou no antigo depois da cópia)
A cópia do antigo (`legado_doc`, `legado_log`, `legado_tabela`) vai até **26/11/2026 20:29 UTC**. Conferido por leitura em 28/11:
depois disso o antigo mudou **183 pedidos**, **3 NFs da Omie**, **62 registros de histórico** e recebeu **6 arquivos** (o número cresce até o congelamento).
- **Como recopiar sem alterar o antigo:** ler no antigo só com `select` e gravar no novo por upsert, nas mesmas tabelas `legado_*`
  (mesmo formato da função `importar-legado`: `on conflict ... do update` em `legado_doc`, `do nothing` em `legado_log`).
  O caminho antigo (o banco antigo enviando por `pg_net`) grava no antigo e só pode ser usado com autorização do dono.
- **Revisar:** `select * from pedidos_novo.troca_diferencas();` lista, pedido a pedido, os campos que o antigo mudou depois da cópia
  (`novo_no_antigo = true` = pedido que não existia na cópia). Os campos que o novo também guarda (etapa, previsão, NF, rastreio,
  recebimento, parcelas, baixas) são corrigidos na ficha do novo, com justificativa "sincronização final da troca".
  Os robôs do novo (planilha, rastreio) e a Omie já trazem a maior parte disso sozinhos; a lista mostra o que sobrou.
- **Pedidos que só existem no antigo:** hoje 2 (DH-2026-0471 e DH-2026-0472, pedidos internos de 26/11). Precisam entrar no novo
  **com o número do antigo** (D13). Ainda falta a função que cria pedido com número dado (ver aceite).
- **Arquivos:** depende da decisão do dono sobre onde os arquivos ficam (ver aceite, item "Arquivos").

## 4. Logins (D25)
Conferido por leitura em 28/11: os 18 logins do antigo usam senha **bcrypt `$2a$10$`**, o mesmo formato do login (Auth) do projeto novo,
então podem vir **com a mesma senha** (cópia cifrada; ninguém vê a senha). Dos 21 cadastros de `membros`: 17 têm login,
**4 não têm login** no antigo (vão criar senha pelo "esqueci a senha"), e 1 login do antigo não está em `membros` (não vem).
2 dos logins já existem no novo (os administradores): ficam como estão (senha e autenticador do novo).
No dia: copiar `auth.users` (e-mail, senha cifrada, confirmação) + `auth.identities` dos 15 restantes e criar o papel de cada um em
`nucleo.usuario_papel` conforme a decisão do dono (quem é unidade, sócio, financeiro). Nenhum e-mail ou senha vai para o repositório.
Atenção: os mesmos logins entram no Estoque Nutra (mesmo projeto antigo).

## 5. Apagar os pedidos de teste, renumerar (D13) e ligar a numeração oficial — tudo numa função
`pedidos_novo.troca_laboratorios(p_simular)`, em uma transação:
1. retrato antes;
2. `apagar_pedidos_teste()` (só `teste = true`, com itens, parcelas, comprovantes de teste, ligações e fila);
3. D13: cada pedido migrado do Centro Paulista passa a ter o DH do antigo; os que só existem no novo (os 7 da Injemed)
   ganham número acima do maior do antigo (contador do antigo incluído); o número anterior fica em
   `pedidos_novo.num_interno_anterior` (pesquisável) e no histórico da ficha (justificativa "Troca do sistema (D13)");
   confere antes que nenhum número se repete;
4. liga a numeração oficial (`criar_pedido_teste = false`; contador DH ajustado);
5. retrato depois e comparação (pedidos, R$, parcelas, pagamentos, NF, receitas e hash linha a linha sem o nº).

## 6. Simulação (pode rodar quantas vezes quiser; desfaz tudo)
```sql
select pedidos_novo.troca_laboratorios(true);
```
**Rodada em 28/11/2026** (dados de hoje): 0 pedidos de teste; **53 renumerados** = 46 do Centro Paulista com DH diferente do antigo
(2 trocas 0025↔0026 e 0130↔0131 + 42 deslocados de 0432–0477 para 0429–0470) + 7 da Injemed (0429, 0430, 0431, 0457, 0458, 0459, 0460 → 0473 a 0479);
depois disso **0 pedidos com DH diferente do antigo**; próximo número oficial **DH-2026-0480**; pedidos 484 (R$ 5.248.612,23),
parcelas, pagamentos, NF e receitas **iguais** antes e depois (contagem, soma e hash). Conferido depois: nada ficou gravado
(mesmo retrato de `retrato-antes-0017-2026-11-28.json`).
Obs.: a simulação de hoje usa a cópia de 26/11; no dia, rodar de novo **depois** do passo 3 (os números do antigo podem ter mudado).

## 7. Valer (só no dia, depois da simulação conferida)
```sql
with c as (select set_config('pedidos_novo.troca_confirmo', 'SIM', true))
select pedidos_novo.troca_laboratorios(false) from c;
select pedidos_novo.recalcular_conferencia_nf();
```
Guardar o resultado e os retratos em `sistemas/nucleo/conferencia/retrato-*-troca-AAAA-MM-DD.json`.

## 8. Depois
- Publicar a `pedidos-api` v10 (CORS do Cloudflare; já no repositório) e o site no Cloudflare Pages (`operacoes-drhair`).
- Reapontar a tarefa "Sincronizar Portal Omie" para a função `omie` do novo e retirar a chave antiga das duas funções.
- Conferir no Início: divergências, parcelas, e a busca pelo número anterior.
- O antigo fica em somente leitura por 90 dias; só é desligado depois da Contagem (Nutra) e do Compras (desenho global).

## Desfazer
Até o passo 7 nada muda no novo. Depois do passo 7: `num_interno_anterior` guarda o número de antes de cada pedido renumerado;
para voltar, aplicar o mesmo esquema de dois passos ao contrário e religar `criar_pedido_teste = true`.
