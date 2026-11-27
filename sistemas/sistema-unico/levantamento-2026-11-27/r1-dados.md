# R1 – Proposta do Engenheiro de Dados, Integrações e IA

Base: inventários (inv-*.md) e duas consultas SELECT feitas em 27/11 (tamanho do banco, buckets e `cron.job` nos dois projetos). Nada foi alterado.

Evidência das consultas: banco único `xqxjmeioodmdhxhivyqu` com 144 MB de banco e bucket `documentos` com 1.015 objetos / 853 MiB (são os ~894 MB do inventário). Legado `ckgsdvhkpnrrmctlqtma` com 29 MB de banco, `anexos` 1.320 objetos / 189 MiB, `injemed` 24 / 9,4 MiB, `backups` 12 / 21 MiB, e `logs` com 6.178 linhas.

## 1. Cadastro único: chave e apelidos

**Chave: um id interno fixo (`core.unidade.id`, uuid) e um código curto legível (ex.: U001).** O CNPJ não serve de chave primária, mas é a chave de reconhecimento. Ele bate 100% nos 53 de Documentos, legado/clinicas, Premiação e pedidos_novo (inv-documentos D; inv-premiacao, tabela de cadastros). Pelo nome, só 39 de 53 batem (inv-premiacao). O CNPJ pode mudar: `pedidos_novo.unidade_cnpj` já guarda vigência de/até. Além disso, `cmp_empresas` tem 51 linhas e só 49 CNPJs distintos (inv-compras 1.1), e isso precisa ser esclarecido na conciliação.

Não criar nada do zero. O embrião já existe: `pedidos_novo.unidade` + `unidade_cnpj` + `unidade_alias` (71 apelidos, colunas `unidade_id, nome, nome_norm, sistema`, confirmadas por consulta), com `doc_unidade_id` ligado a 53 de 53 em `public.unidades`. Proposta: promover esse conjunto ao schema `core`, com estas tabelas:

| Tabela | Conteúdo |
|---|---|
| `core.unidade` | id, código, nome oficial, situação, inauguração, UF/região, `teste` (sim/não) |
| `core.unidade_cnpj` | CNPJ só com os 14 dígitos, vigência; único entre os vigentes |
| `core.unidade_apelido` | sistema, nome original, `nome_norm` (sem acento, caixa e espaços), unidade_id, quem criou e justificativa. Único por (sistema, nome_norm) |
| `core.unidade_ref` | sistema, id externo, unidade_id. Liga os ids de premiacao.unidades (56), cmp_unidades (51), nutra.unidades (51), zuria_unidade_map (52) e Bizneo sem mexer nesses sistemas |

**Regra de reconhecimento em toda importação:** (1) CNPJ; (2) id externo em `unidade_ref`; (3) apelido exato normalizado. Se nada bater, a linha vai para a fila "Unidade não reconhecida". Nunca se cria unidade automaticamente e nunca se aproxima nome. Operações liga o nome a uma unidade uma vez, com justificativa, e o apelido fica gravado para a próxima importação.

Os mesmos princípios valem para empresa (CNPJ), pessoa (CPF/CNPJ do PJ; `premiacao.pessoas` 697, das quais 488 ligadas à Bizneo), prescritor/RT (CRBM; 48 no legado) e fornecedor (CNPJ). Os cadastros de Premiação, Bizneo e ZurIA só são lidos, por visões. Nada é gravado neles (premissas).

## 2. Importações: um padrão só

Um schema `imp` com duas tabelas: `lote` (fonte, arquivo, sha256, recebido em, por, situação) e `linha` (dado bruto em jsonb, unidade reconhecida, erro). O fluxo tem quatro passos: **receber → validar → prévia (simulação) → aplicar**.

- O mesmo arquivo (mesmo hash) não entra duas vezes.
- Uma correção manual nunca é sobrescrita. A diferença vira conflito para Operações decidir, que é o padrão `fn_protege_correcao` da Premiação (inv-premiacao).

| Fonte | Como entra | Cuidados |
|---|---|---|
| ZurIA | Já é ingerido pela Premiação (`premiacao-rel ingest*`, relatórios 5028/5031/5036/5037/5003) | O sistema único **lê** de `premiacao` e não reimporta. Isso evita duas versões do faturamento |
| Bizneo | `premiacao-import` (bizneo_cadastro 704) | `core.pessoa` nasce como visão sobre esse espelho. Mudar a carga só depois que outubro fechar |
| Omie | Tarefa no navegador do dono → hoje `omie-sync` (antigo) | Trocar o destino para `omie` (novo) só na virada e retirar a chave antiga (inv-pedidos 9). Depende do navegador estar logado, por isso a falta da carga do dia tem de gerar alerta |
| Planilha do laboratório | CSV público, colunas identificadas por nome | Conferir o cabeçalho antes de ler e **abortar com alerta** se mudar. Não cria pedido e só preenche campos vazios (decisão já tomada) |
| Rastreio Quality | Leitura do HTML do site | O ano é deduzido pela emissão da NF. Registrar "não encontrada" sem apagar o que já foi gravado |

## 3. Migração do legado (inteiro)

**Princípio: duas camadas.**

1. **Arquivo morto completo.** Copiar o banco legado inteiro (29 MB: `docs`, `logs` 6.178, `inj_*`, `cmp_*`, `reb_*`, `nut_*`, `membros`) para o schema `legado_ckg` do banco único, **somente leitura**. Isso garante a premissa "TODAS as informações" sem poluir o modelo novo.
2. **Modelo limpo.** Só o que tem uso entra nas tabelas relacionais. A cópia já existe em `pedidos_novo` e `nutra`. Os prefixos TST, as tabelas `bkp_*` e os registros de teste ficam só no arquivo morto.

**Ordem da migração:**

1. **Nutra.** A rodada de dezembro abre no legado em 01/12 às 07:00 (job `nut-rodada-dia-01`). Não mexer antes disso. Fazer a virada entre o fechamento da rodada de dezembro e 01/01 às 07:00: desliga-se o job antigo e liga-se `nutra-rodada-dia-01` no novo, no mesmo ato. As senhas são mantidas copiando os usuários do auth com o mesmo hash, porque são 18 em `auth.users`.
2. **Pedidos.** Congelar o antigo, que deixa de gerar números DH. Ressincronizar o que mudou desde 26/11 05:33 UTC (276 pedidos, inv-pedidos 8). Trocar o destino da Omie. Desligar os jobs antigos.
3. **Compras e Reembolso.** Quase vazios: 3 solicitações, 0 compras e 0 reembolsos. Vão só para o arquivo morto e os cadastros-base (16 categorias, 51 empresas) são conciliados com `core`.
4. **Arquivos.** 1.344 objetos (~198 MiB) de `anexos` + `injemed`, mais 21 MiB de `backups`, que vão para um bucket de arquivo não visível. Na cópia, calcular o sha256 de cada objeto. Arquivos iguais viram um objeto só com várias referências: são 37 arquivos com 45 cópias extras (inv-pedidos 9), o que atende a premissa "anexado uma vez e reaproveitado". Os 114 que já estão em Documentos não são copiados (inv-pedidos 7). Depois, reescrever `arquivo.caminho` (hoje `legado-cp:anexos`) e conferir quantidade, tamanho e hash, origem contra destino, antes de desligar.
5. **Desligar o legado.** Só depois de 30 dias sem acesso. Antes, baixar um pg_dump e os buckets para fora do Supabase.

**Supabase Pro é obrigatório, não opcional.** O plano gratuito tem 1 GB de arquivos. Hoje já são 853 MiB; somando ~219 MiB do legado, o total passa de 1,07 GiB. O banco (144 MB) ainda cabe. Atenção: **o backup diário do Pro cobre o banco, não os arquivos do Storage.** Por isso propomos uma cópia semanal dos buckets para fora (ex.: Google Drive da empresa), com conferência por hash. Preço e limites devem ser conferidos na página da Supabase no dia da contratação.

## 4. Conflito dos números DH

**Fatos:** 43 pedidos têm DH diferente entre antigo e novo. DH-2026-0469 a 0472 apontam para pedidos **diferentes**: no antigo, 2 de receita e 2 internos criados em 26/11; no novo, pedidos do laboratório 136115–136216. 5 pedidos do antigo não têm par no novo (inv-pedidos 9).

**Proposta:**
- **Vale o número do antigo**, porque foi o que unidades e laboratório viram.
- Os 43 do novo recebem o número do antigo.
- Os pedidos que só existem no novo (inclusive os que hoje ocupam 0469–0472) ganham um número novo de uma sequência única que começa acima do maior dos dois sistemas.
- Cada pedido guarda `numero_anterior`, e a busca encontra o pedido por qualquer um dos números.
- Depois da virada, o DH sai de uma única sequência no banco único, é imutável e nunca é reaproveitado. Na noite da virada, `proximo_interno` do antigo é bloqueado.
- A lista dos 43 + 4 + 5 vai para Operações conferir antes de aplicar.

## 5. API do Claude (leitura de documentos)

Reaproveitar `ler-documento`, que já chama a Anthropic e hoje é exclusiva do Compras (inv-documentos B). Mudanças: trazê-la para o banco único, guardar a chave em segredo (nunca no código) e padronizar com um esquema de saída fixo por tipo de documento.

| Documento | Usar IA? | O que extrai |
|---|---|---|
| NF | **Só quando não houver XML.** O XML da Omie já é estruturado | itens, valores, CFOP |
| Cartão CNPJ | Leitura e conferência contra o cadastro | razão social, situação, CNAE, endereço |
| Contrato social | Sim | sócios, participação, administração, data da alteração |
| Pedido de venda do lab | Sim. Hoje é feito fora do sistema (174 registros "Pedido de venda"; 63 `pendPV` sem lugar) | prescritor, CRBM, itens, total |
| Comprovante de pagamento | Sim | valor, data, CNPJ pagador e favorecido, para sugerir a parcela |

**Regras:**
- A IA **propõe** e uma pessoa confirma. A IA nunca grava em tabela final.
- Cada leitura fica em `ia_leitura`: hash do arquivo, tipo, modelo, tokens, custo, JSON, quem revisou.
- O mesmo hash nunca é lido duas vezes.

**Controle de custo:**
- Teto mensal em `config`, com contador e alerta a 80%. Acima do teto, as leituras vão para uma fila.
- Instruções fixas com cache de prompt.
- Carga histórica (backfill) pela Batch API, que custa 50% menos.

**Estimativa (a confirmar com 20 documentos reais)**, no modelo padrão Opus 5.5 (US$ 4 por milhão de tokens de entrada e US$ 20 de saída): cerca de US$ 0,03 por NF ou comprovante de 1 página e cerca de US$ 0,20 por contrato social de 15 páginas. Com algo como 400 documentos por mês, ficaria na faixa de US$ 15–30. Usar um modelo mais barato (Haiku 5.5) para comprovantes é decisão do usuário depois do teste comparativo.

**Onde a IA não entra:** cálculo de prêmio, as 3 baixas, aprovações, reconhecimento de unidade (CNPJ é determinístico), dados bancários de fornecedor (antifraude de `cmp_forn_guard`), ZurIA e Bizneo (que já são estruturados).

## 6. Rotinas agendadas

**Registro central:**
- `ops.rotina`: nome, horário, função, dono, ativa.
- `ops.execucao`: início, fim, situação, linhas lidas e alteradas, erro. É a generalização de `execucao_conector`.
- Uma tela "Rotinas" e um alerta no Início quando alguma falha ou não roda.
- A definição dos jobs fica versionada no GitHub (`supabase/cron.sql`).

**Divisão de responsabilidade:** `pg_cron` cuida do que é determinístico. As tarefas agendadas do Claude ficam só para o que exige leitura humana ou IA, como a carga do ZurIA e da Bizneo.

| Horário (Brasília) | Rotina | Situação |
|---|---|---|
| 00:10 diária | premiacao-encerrar-vencidas | existe; **não tocar** |
| 03:30 diária | premiacao-copia-diaria | existe; **não tocar** |
| 06:30 (esperada) | Omie (navegador do dono) | alerta às 08:00 se não chegou |
| 07:00 diária | planilha do lab | existe (10:00 UTC) |
| 07:20 diária | rastreio Quality | existe |
| 07:40 diária | vencimentos: certificado digital, alvará, AVCB, VISA | **nova** |
| 06:05 dia 1 | receitas do mês | portar do antigo |
| 07:00 dia 1 | rodada Nutra | ligar na virada |
| 04:00 domingo | cópia dos buckets para fora + conferência por hash; relatório de arquivos órfãos (sem apagar) | **nova** |

Desligar no legado, na virada: planilha de hora em hora, rastreio 2x/dia, backup semanal e os jobs do Compras. Hoje `compras-limpar-orfaos` envia a chave pública e provavelmente falha (inv-pedidos 9).

## 7. Análise crítica do pedido

- **"Trazer TODAS as informações" para o sistema novo** levaria teste, duplicados e `bkp_*` para o núcleo. A alternativa é o arquivo morto somente leitura mais o modelo limpo.
- **Robôs 1x/dia:** o antigo lia a planilha de hora em hora. Com 1 leitura por dia, a etapa do laboratório chega com até um dia de atraso, e isso precisa ser avisado às unidades. A alternativa é um botão "Atualizar agora" para Operações.
- **Unificar cadastro e login de uma vez** quebraria 5 bases de login em uso. A alternativa é começar o núcleo pela unidade (CNPJ) e migrar o login por módulo, a cada virada.
