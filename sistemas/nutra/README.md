# Nutra (Estoque Nutra) no banco único

## O que é

O **Estoque Nutra** é o levantamento mensal do estoque de nutracêuticos e
dermocosméticos das clínicas. Funciona em duas partes:

- **Formulário público**: cada clínica escolhe a unidade, informa quem contou e
  digita as quantidades de cada produto. Não precisa de login.
- **Painel**: as pessoas cadastradas entram com o e-mail e veem as respostas das
  suas unidades. O administrador vê tudo, abre e fecha rodadas e define preços.

Até agora tudo isso fica no projeto Supabase antigo (`ckgsdvhkpnrrmctlqtma`),
nas tabelas `public.nut_*`. Este módulo é uma **cópia completa** dentro do
banco único (`xqxjmeioodmdhxhivyqu`), numa área separada chamada `nutra`.
O sistema antigo continua sendo o oficial até a virada.

## Onde ficam os dados (schema `nutra`)

| Tabela | Para que serve | Origem no legado |
|---|---|---|
| `nutra.rodadas` | Cada mês de levantamento (nome, prazo, aberta/fechada, aviso) | `nut_rodadas` |
| `nutra.produtos` | Lista de produtos do formulário | `nut_produtos` |
| `nutra.estoque_respostas` | Cada envio do formulário (quantidades em JSON) | `nut_estoque_respostas` |
| `nutra.precos` | Preço atual de cada produto (painel antigo) | `nut_precos` |
| `nutra.precos_rodada` | Preço de cada produto em cada rodada | `nut_precos_rodada` |
| `nutra.socios` | Sócio responsável de cada unidade | `nut_socios` |
| `nutra.config` | Configurações (aberto, sugestões, hash da senha do painel antigo) | `nut_config` |
| `nutra.membros` | Quem pode entrar no painel, se é admin e quais unidades vê | `membros` |
| `nutra.unidades` | Lista de clínicas | `cmp_unidades` |

Ninguém de fora acessa essas tabelas diretamente: o acesso da API (anon e
authenticated) foi retirado e o RLS está ligado sem regras, igual ao
`pedidos_novo`. Só as funções abaixo leem e gravam nelas.

Funções internas (não chamadas pelo site): `nutra.is_admin()`,
`nutra.is_membro()` e `nutra.minhas_unidades()`. Elas olham o e-mail de quem
está logado e consultam `nutra.membros`, com a mesma regra do legado.

## Funções que o site chama

Têm **o mesmo nome e os mesmos parâmetros** do legado e ficam em `public`,
então o site não precisa mudar nenhuma chamada `supabase.rpc('nut_...')`.

| Função | Quem pode chamar |
|---|---|
| `nut_form_dados()` | público (anon) e logados |
| `nut_enviar_estoque_v2(p_unidade, p_responsavel, p_itens, p_obs, p_outros)` | público (anon) e logados |
| `nut_painel_r(p_como, p_rodada)` | logados |
| `nut_painel_me()`, `nut_painel_ver(p_como)` | logados |
| `nut_rodada_nova`, `nut_rodada_editar`, `nut_rodada_situacao` | logados (a função exige admin) |
| `nut_set_preco_me`, `nut_set_preco_r` | logados (a função exige admin) |
| `nut_enviar_estoque`, `nut_painel(p_senha)`, `nut_set_preco(p_senha, ...)` | só servidor (como no legado) |
| `nut_rodada_auto()` | só servidor (usada pelo agendamento) |

As versões com senha leem o hash em `nutra.config` (chave `senha_hash`).

## Agendamento mensal

O job `nutra-rodada-dia-01` (dia 1 de cada mês, 10:00 UTC = 07:00 de Brasília)
abre a rodada do mês. Ele foi criado **desligado**, porque o legado ainda tem o
job `nut-rodada-dia-01` ligado. Não podem ficar os dois ligados.

## Como fazer a virada (cutover)

1. **Usuários de login**: copiar os usuários do Supabase Auth do legado para o
   projeto novo mantendo os mesmos hashes de senha (assim ninguém precisa
   trocar a senha). Os e-mails devem bater com `nutra.membros`.
2. **Dados novos**: copiar de novo o que mudou no legado desde esta cópia
   (respostas novas, rodadas, preços, membros, unidades). Depois de copiar
   `estoque_respostas`, acertar a sequência do `id` para o maior id copiado.
3. **Site**: trocar a URL e a chave anon do Supabase no site Nutra para as do
   projeto `xqxjmeioodmdhxhivyqu`.
4. **Agendamento**: ligar o job novo e desligar o antigo:
   - no banco único: `select cron.alter_job((select jobid from cron.job where jobname='nutra-rodada-dia-01'), active := true);`
   - no legado: desligar o job `nut-rodada-dia-01`.
5. Testar o formulário e o painel no site. Se algo der errado, basta voltar a
   URL/chave do site para o legado.

## Arquivos

- `supabase/migrations/0001_nutra_modulo.sql`: estrutura, funções, permissões e
  agendamento desligado. Não contém dados nem segredos.
