# R1 – Segurança, LGPD e Auditoria (proposta)

Evidências: inventários (inv-*.md) e consultas SELECT de 27/11 nos bancos `xqxjmeioodmdhxhivyqu` (único) e `ckgsdvhkpnrrmctlqtma` (legado), além do relatório de segurança do Supabase (get_advisors).

## 0. Diagnóstico em números
| Achado | Evidência | Gravidade |
|---|---|---|
| Documentos/POPs: Operações entra com **uma chave compartilhada** (`config.admin_key`), e todo registro sai como "Operações" (4.101 ações sem autor real) | inv-documentos, Perfis e Números | Alta: não há trilha individual |
| POPs: a clínica entra com **CNPJ + qualquer e-mail, sem senha** (117 logins) | inv-documentos, Matriz POPs | Alta: CNPJ é público |
| Segredos no código: `x-link` (exportar-docs/docs-regulatorios), hash do consultor, `x-cron` de `automacoes`/`rastreio`, chave publicável no cron `compras-limpar-orfaos`, 2 chaves x-omie aceitas | inv-documentos, Problemas; inv-pedidos, §9 | Alta |
| Legado: 57 tabelas, todas com RLS ligado, mas **32 com GRANT de DELETE/TRUNCATE para `anon`**; 8 policies alcançam anon/public (nenhuma `true`) | consulta `has_table_privilege` no legado | Média: hoje fechado, mas uma policy mal escrita abre |
| Banco único, `public`: as 21 tabelas têm GRANT total para `anon` (RLS ligado, 0 policy). **3 funções SECURITY DEFINER executáveis por anon** via `/rest/v1/rpc`: `nut_enviar_estoque_v2`, `nut_form_dados`, `itens_obs_hist`. 10 outras (`zuria_import`, `nut_set_preco_*`, `nut_rodada_*`) executáveis por qualquer usuário logado | get_advisors (lints 0028/0029) | Média/Alta: `nut_enviar_estoque_v2` grava sem login |
| Premiação: as edge functions conectam como dono do banco (`SUPABASE_DB_URL`), **sem RLS**; a barreira por loja é só `podeUnidade()` no código. 9 tabelas com RLS desligado, entre elas `bizneo_cadastro` (CPF) e 4 `bkp_*` com CPF e valor pago; 39 funções com `search_path` mutável. O schema não tem USAGE para anon, então hoje não fica exposto pela API | inv-premiacao §1 e §3; consulta `relrowsecurity`; ACL do schema | Média: um erro no código vaza CPF e prêmio entre lojas |
| 4 schemas `premiacao_copia_*` (141 tabelas, sem RLS) e `bak_20261105_*` em produção, com hash de senha e CPF | consultas; inv-documentos | Média: cópia de dado sensível sem regra de guarda |
| MFA: banco único com 2 usuários no Auth e 1 fator; legado 0 fatores. Proteção contra senha vazada **desligada** | consulta `auth.mfa_factors`; get_advisors | Média |
| Primeiro acesso da Premiação sem prova de identidade (código não vai mais por e-mail desde 23/11) | inv-premiacao §3 | Média |
| Backup: legado semanal só dos registros (sem arquivos); Premiação guarda 7 dias de cópia no próprio banco; Documentos e POPs **sem backup** | inv-pedidos §9; inv-premiacao §1 | Alta para arquivos (~1,1 GB entre buckets) |

Ponto positivo a manter: todos os buckets são privados (consulta `storage.buckets` nos dois bancos); Pedidos novo já tem senha temporária, troca obrigatória, MFA para admin/financeiro e segredos no Vault (inv-pedidos §5 e §9).

## 1. Unificar: a segurança é o primeiro motivo
Hoje há **5 a 7 bases de login** para as mesmas pessoas (inv-pedidos §7; inv-documentos, Dados que se repetem). Proponho unificar agora: **um login (Supabase Auth), uma tabela de acesso (pessoa × papel × unidade) e um registro de auditoria**. Isso vem antes de qualquer tela. Os módulos continuam separados por schema, cada um com o seu código.

## 2. Perfis: quadro papel / vê / faz / aprova
Regra-base: o acesso é sempre (papel, lista de unidades); "todas" é um valor explícito, nunca a falta de filtro.

| Papel | Vê | Faz | Aprova | MFA |
|---|---|---|---|---|
| Operações | Tudo, a rede inteira, inclusive orçamento e % da meta | Tudo, e toda correção exige justificativa; "ver como" só leitura | Tudo, menos o que ela mesma lançou quando houver segregação (compras, reembolso) | Sim |
| Sócio | O mesmo que Operações, **só nas suas lojas**, sem orçamento nem % da meta (regra `semOrc`/`semPct`) | Pedir correção (vira pedido), responder pendência, anexar documento | A loja dele (premiação, compras, reembolso da loja). Nunca o próprio prêmio | Recomendado |
| Gestor da unidade | A sua unidade: pedidos, documentos, pendências, premiação da equipe (sem orçamento) | Lançar solicitação, enviar documento, responder pendência | De acordo de 1º nível (compras) | Não |
| RT / clínica | POPs, documentos regulatórios, receitas e prescritores da unidade | Emitir POP, assinar receita, enviar carteira/CRT | Receita (assinatura do RT) | Não |
| Financeiro | Parcelas, títulos, reembolsos e orçamentos; **não vê resultado da premiação** (inv-premiacao §3) | Baixa de pagamento, PIX, orçamento | Pagamento, nunca o que solicitou | Sim |
| Compras | Solicitações, cotações e fornecedores de todas as unidades | Cotar, cadastrar fornecedor | Nada que tenha cotado | Não |
| Contabilidade | Meses aprovados: resultados, recibos | Só exporta | — | Sim (vê salários e CPF) |
| Colaborador | Só o próprio CPF/CNPJ, só em mês aprovado | Ciência, contestação, pedido de reembolso | — | Não |
| Consultor externo | Só os itens liberados, com prazo de validade | Comentar | — | Sim |
| Robô (integração) | Só a tabela de entrada | Gravar a importação | — | Chave no Vault, por robô |

Marketing e RH como "área responsável" de pendência (inv-premiacao §7, item 3) entram como papéis de fila, sem ver valores.

## 3. Autenticação
- E-mail + senha no Supabase Auth para todos (premissa). Usar o modelo do Pedidos novo: senha temporária, troca obrigatória e **MFA por autenticador obrigatório** para Operações, financeiro e contabilidade. Ligar a proteção contra senha vazada.
- Migração sem pedir senha nova: Nutra já tem o plano de levar o hash (inv-compras §6, item 9). Premiação (PBKDF2) e Documentos (`acessos.senha_hash`) não são compatíveis com o Auth: no primeiro acesso, valida a senha antiga uma vez e grava no Auth.
- **POPs: acabar com CNPJ + e-mail.** A clínica passa a entrar com o login do responsável da unidade, que já existe nas 53 unidades (inv-documentos, Perfis).
- **Chave compartilhada de Operações: desligar** assim que houver 2 logins individuais. Cada ação passa a ter autor real.
- Sessão de 12 h; bloqueio após 5 erros (já existe na Premiação).

## 4. Dados sensíveis (LGPD)
| Dado | Onde está hoje | Regra |
|---|---|---|
| CPF | 19 tabelas da Premiação, `reb_*`, `cmp_*` | Mostrar mascarado (***.123.456-**) fora da ficha da pessoa; busca pelo número completo |
| Salário, prêmio, orçamento | premiacao.resultados, lancamentos | Só Operações, sócio (as lojas dele, sem orçamento), contabilidade e o próprio colaborador |
| Dados bancários / PIX / cartão | legado `cmp_cartoes`, `cmp_fornecedores`, `reb_pessoas`, `reb_solicitacoes`, `cmp_titulos` (consulta de colunas) | Só financeiro e Operações. Troca de PIX depois de aprovada volta para aprovação (o gatilho `reb_sol_guard_t` já faz isso). Número de cartão nunca é guardado, só os 4 últimos dígitos (conferir `cmp_cartoes`) |
| Receita / paciente | Pedidos (paciente só por código, inv-pedidos §4) | Manter o código; nenhum nome de paciente no sistema |
| Prescritor/RT (conselho, CRBM) | `pedidos_novo.pessoa`, `pop_unidade_cfg` | Dado profissional; a unidade vê os seus |
| Hash de senha | `premiacao.usuarios`, `public.acessos`, `bak_*` | Apagar dos backups soltos depois da migração para o Auth |

Toda exportação (Excel, PDF) de CPF ou valores fica registrada no log, com quem baixou.

## 5. Como o banco aplica a regra
1. Todo schema novo sem USAGE para anon. As telas chamam só funções do servidor que conferem (usuário, papel, unidade) **e** RLS por unidade como segunda barreira, usando uma função única `pode(unidade, acao)`.
2. Revogar o GRANT de anon em `public` e no legado; revogar EXECUTE de anon nas 3 funções SECURITY DEFINER **depois de 01/12** (o formulário Nutra usa `nut_enviar_estoque_v2`: trocar só junto com a migração do Nutra, para não quebrar a rodada).
3. Premiação: **não mexer agora** (premissa). Registrar o risco; no módulo do sistema único, ligar RLS nas 9 tabelas e trocar a conexão de dono por um papel limitado, depois que outubro fechar.
4. Segredos: tudo no Vault; trocar `x-link`, `x-cron`, a chave antiga x-omie e o hash do consultor, uma por vez, com teste (as funções do legado continuam rodando até o desligamento).

## 6. Registro de quem mudou o quê
Uma tabela única `auditoria` (quando, quem, papel, unidade, módulo, registro, ação, antes, depois, justificativa, IP), gravada por gatilho e não editável por ninguém (só inserção). Os históricos atuais (`premiacao.historico` 1.711, `public.historico`, `pedidos_novo.evento`, `cmp_eventos` 303) entram como origem, sem apagar. A justificativa é obrigatória para correção manual (premissa). "Ver como" e downloads também ficam registrados.

## 7. Lixeira recuperável
Nada é apagado de verdade pela tela: `excluido_em`, `excluido_por`, `motivo`. A lixeira fica em Operações por 90 dias; restaurar também vai para o registro. A exclusão definitiva só acontece por rotina, e nunca de algo aprovado ou pago (premissa "nada aprovado se perde"). Arquivos seguem a regra do Documentos (sem exclusão, com versão). O `cmp_eventos` mostra 6 títulos apagados em teste: é o caso que a lixeira evita.

## 8. Backup e restauração
- Supabase Pro (já necessário, premissas): backup diário com 7 dias e, de preferência, PITR (volta a qualquer minuto).
- Arquivos (buckets) não entram no backup do banco: cópia semanal para um armazenamento fora do Supabase (Google Drive da empresa), cifrada.
- Tirar os `bak_*`, `bkp_*` e `premiacao_copia_*` do banco de produção depois que existir backup oficial (a Premiação só depois de outubro fechar).
- **Teste de restauração mensal** num ambiente de teste, com resultado registrado. Backup que nunca foi restaurado não conta.

## 9. Fases e não interferir
Ordem pela segurança: (1) login único + tabela de acesso + auditoria + lixeira, sem módulo novo; (2) Documentos/POPs, que têm o maior risco (chave compartilhada e login sem senha) e baixo risco de negócio; (3) Pedidos (já está no padrão); (4) Nutra, depois de 01/12; (5) Compras/Reembolsos; (6) Premiação por último, com outubro fechado. Cada troca de login roda em paralelo: o login antigo continua até todos entrarem no novo.

## 10. API do Claude
Entra na leitura de NF, cartão CNPJ e contrato (já há `ler-documento`). Não entra em decisão de acesso, aprovação ou pagamento, e não recebe CPF, salário ou dado bancário além do que está no documento lido. A chave fica no Vault, e cada leitura fica no registro.

## 11. Crítica ao pedido
- "Operações pode tudo" sem segregação fere o próprio controle: proponho "pode tudo, menos aprovar o que ela mesma lançou" nos fluxos com dinheiro (compras e reembolso já preveem isso).
- "Sócio vê o que Operações vê" não pode incluir orçamento e % da meta, que a Premiação esconde de propósito.
- "Mesma senha" é bom para a adoção, mas exige MFA nos papéis financeiros e a proteção contra senha vazada ligada.
- O usuário não é técnico: o painel de segurança (quem tem acesso a quê, último acesso, MFA, último backup testado) precisa ser uma tela, não uma consulta.
