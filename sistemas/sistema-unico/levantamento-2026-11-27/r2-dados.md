# R2/R3 – Dados, Integrações e IA: crítica e revisão

Base: as 9 propostas r1-*.md, os inventários e as consultas SELECT da R1 (buckets, tamanho dos bancos, `cron.job`). Somente leitura.

## A. CRÍTICA

### A.1 Riscos de dado em cada proposta

| Proposta | Risco de dado | Evidência | O que eu peço |
|---|---|---|---|
| **Arquiteto** | (1) `nucleo.pessoa` com um campo "CPF ou CNPJ" repete o erro da Premiação: o mesmo profissional PJ vira duas pessoas. (2) `nucleo.arquivo.sha256` único, somado à lixeira da Segurança, bloqueia reenviar um arquivo que já foi para a lixeira. (3) "Cópia de leitura" de `premiacao.pessoas` sem regra de quem manda gera duas versões. | r1-rh §1 (189 pessoas com CNPJ de 14 dígitos); r1-seguranca §7 | Usar o modelo de pessoa do RH (`pessoa` + `pessoa_documento_fiscal`). Índices únicos parciais (`where excluido_em is null`). A Premiação é a dona do CPF/CNPJ até entrar no núcleo: carga só de leitura e relatório de divergência, sem gravar nada de volta. |
| **Operações** | A tela de pendências "lendo os módulos existentes" mostraria situação errada no Pedidos. A equipe ainda trabalha no antigo (276 pedidos alterados depois de 26/11), então uma baixa dada no antigo aparece como "falta baixa no sistema" no novo. Ler o legado ao vivo é consulta entre dois projetos Supabase: frágil e sem RLS comum. | inv-pedidos §8.10; inv-pedidos §1 (as tabelas relacionais do antigo são cópia estática) | Na Fase 1, a Central lê só o banco único: Documentos (vencimentos), Premiação (somente leitura) e Nutra quando virar. Pedidos entra na Central **depois da virada**. Até lá, a linha de Pedidos mostra "dados de dd/mm" ou fica fora. |
| **Financeiro** | (1) "Redirecionar a Omie ao novo na Fase 0" corta NF, boleto e parcela do antigo, que ainda está em uso. (2) Migrar as 541 parcelas e os 83 pagamentos para `financeiro.titulo` na Fase 3 é a **segunda migração** do mesmo dado em poucas semanas, com risco de gravar em dois lugares e divergir. | inv-pedidos §1, §6; r1-financeiro §3 | (1) A tarefa Omie envia **aos dois** destinos (`omie-sync` e `omie` aceitam o mesmo formato) até a virada. (2) `financeiro.titulo` nasce como **visão** sobre `pedidos_novo.parcela`. A cópia física só quando houver uma segunda origem real (Reembolso). Os totais por situação (ex.: falta planilha 61 / R$ 661.463,51) viram a conferência obrigatória de cada migração. |
| **Segurança** | (1) Revogar o EXECUTE de anon em `nut_enviar_estoque_v2` **quebra o formulário público** do Nutra, que funciona sem login por desenho. (2) Uma tabela de auditoria única "gravada por gatilho" não pode ter gatilho no schema `premiacao`. (3) Tirar `premiacao_copia_*` antes de haver restauração testada elimina o único "voltar atrás" da Premiação. | inv-compras §3 (formulário anônimo); premissas; r1-diabo risco 3 | (1) Trocar o acesso anônimo por uma edge function com token por unidade e limite de envios, junto com a virada do Nutra. (2) A auditoria da Premiação entra como **visão de leitura** de `premiacao.historico`. (3) Apagar as cópias só depois do primeiro teste de restauração do Pro. |
| **Diabo** | O Nutra "no meio de dezembro" cai **dentro** da rodada aberta: as respostas teriam de ser sincronizadas entre dois bancos e alguma pode se perder. | inv-compras §3 (rodada mensal; nov: 54 respostas entre 18 e 26/11) | A virada do Nutra é **entre rodadas** (depois do prazo de dezembro e antes de 01/01, 07:00). Concordo com todas as outras condições, principalmente: lista de aceite, checksum, numeração DH, spend cap e restauração testada. |
| **RH** | Sem e-mail em 0 de 697 pessoas, nem no espelho da Bizneo. Login em lote e aviso por e-mail não têm de onde tirar o e-mail. | r1-rh §1 | Coletar o e-mail como pendência no primeiro acesso (CPF + código). Nenhuma rotina pode depender de e-mail que não existe. |
| **Sócio / Operações** | Resumo diário por e-mail e "Cobrar laboratório com 1 clique" pressupõem envio de e-mail, que **não existe** hoje: os avisos do Documentos são só na tela, e a Premiação parou de enviar código por e-mail em 23/11. Uma rotina de e-mail que falha não avisa ninguém. | inv-documentos §A (258 avisos na tela); inv-premiacao §3 | O envio de e-mail é uma integração nova: provedor, remetente verificado, registro de cada envio (entregue ou falhou) em `integracao.execucao`. Até existir, a cobrança só **monta** o texto, como `cobranca_baixa` já faz. |
| **Designer** | "Lido do documento — confirmar" por campo é o par certo para a IA. Falta dizer onde o campo não confirmado fica guardado. | r1-designer §3.6 | A sugestão fica em `ia_leitura` e não vai para o campo final até alguém confirmar. Campo não confirmado não entra em relatório nem em cálculo. |

**Custo de IA, que ninguém estimou:** RH quer ler a carteira CRBM e o CRT. Operações quer validade de documento, PV e comprovante. Sócio quer foto de comprovante e de certificado. Se alguém mandar "preencher a validade dos 1.013 arquivos que já estão no Documentos", são cerca de US$ 50 a 200 de uma vez. Isso só deve acontecer como lote opcional pela Batch API, com teto próprio e aprovação de Operações.

### A.2 Conflitos entre propostas

1. **Nome do schema.** O Arquiteto e o RH usam `nucleo`, o Financeiro usa `cadastro.*` e eu usei `core`. **Adoto `nucleo`.** Integrações e rotinas vão para `integracao` (Arquiteto), não para os meus `imp`/`ops`.
2. **Id da unidade.** O Arquiteto usa o id de `public.unidades` (Documentos). Eu tinha proposto promover `pedidos_novo.unidade`. O dele é melhor: 53/53 já ligados por `doc_unidade_id`, sem renumerar o Documentos, que tem 1.013 arquivos. A unidade de teste (1 das 54) fica com `teste=true`.
3. **Pendências.** O Arquiteto propõe uma tabela em que "cada módulo publica"; Operações propõe ler ao vivo. A Premiação não pode publicar, porque está congelada e não aceita gatilho. Solução: `nucleo.pendencia` para os módulos novos + a visão `nucleo.v_pendencia`, que soma a leitura de `premiacao.pendencias` e `premiacao.impedimentos()`. Nada ao vivo no legado.
4. **Ordem Nutra × Pedidos × Documentos.** Arquiteto: Pedidos e depois Nutra. Segurança e Designer: Documentos antes. Operações: Pedidos antes de Documentos. Do ponto de vista do dado, **o Nutra tem janela fixa no calendário** (entre rodadas) e pouco volume; o Pedidos depende da lista de aceite. Nenhum dos dois bloqueia o outro. O desligamento do legado espera os dois e o arquivamento do Compras. Documentos não migra dado (já está no banco único), então pode entrar na casca a qualquer momento.
5. **Omie.** O Financeiro quer redirecionar agora; eu e o Diabo, só na virada. Resolução: **envio duplo** até a virada (item A.1).

## B. REVISÃO (minha proposta)

**O que mudou e por quê:**

1. **Schemas `nucleo` e `integracao`**, para convergir com Arquiteto e RH.
2. **Id da unidade = id de `public.unidades`.** O `nucleo.unidade_ref` liga os ids de `pedidos_novo.unidade` (53), `premiacao.unidades` (56), `cmp_unidades` (51), `nutra.unidades` (51) e `zuria_unidade_map` (52). O reconhecimento continua igual: CNPJ → id externo → apelido exato. O que não bater vai para a fila "não reconhecida" e nada é criado sozinho.
3. **Pessoa no modelo do RH.** `pessoa` + `pessoa_documento_fiscal`, juntando por CPF, CNPJ ou CRBM, e nunca por nome. A carga de `premiacao.pessoas` e da Bizneo é noturna, só de leitura. Divergência vira relatório, não correção.
4. **Pendências sem leitura ao vivo do legado.** Pedidos entra na Central só depois da virada.
5. **Omie com envio duplo** até a virada. Depois, a chave antiga é retirada.
6. **Financeiro como visão primeiro.** Nada de segunda migração das parcelas.
7. **Nutra:** a virada é entre o prazo de dezembro e 01/01, 07:00. O formulário público passa para uma edge function com token por unidade, sem perder o envio anônimo.
8. **Conferência de toda migração em três níveis:** quantidade de linhas, soma em R$ por situação e sha256 por arquivo. Relatório antes e depois, aprovado por Operações antes de desligar qualquer coisa.
9. **Lixeira com únicos parciais**, para sha256, linha digitável, chave de NF e número DH.

**O que fica igual:**
- Legado inteiro no arquivo morto `legado_ckg`, somente leitura. Modelo limpo só com o que tem uso.
- Arquivos copiados com hash. Arquivos repetidos viram um só (37 arquivos com 45 cópias extras).
- Supabase Pro obrigatório: 853 MiB hoje + ~219 MiB do legado, acima de 1 GB.
- Cópia semanal dos buckets para fora do Supabase, cifrada (Segurança concorda).
- **DH:** vale o número do antigo. Os pedidos que só existem no novo, inclusive os que hoje ocupam 0469–0472, ganham número de uma sequência única acima do maior existente. O número anterior fica guardado e pesquisável. `proximo_interno` do antigo é bloqueado na virada. As receitas de 01/12 continuam no antigo (Diabo) e entram na sincronização final.
- **IA:** `ler-documento` no banco único, chave no Vault. A IA propõe e uma pessoa confirma. O mesmo hash nunca é relido.

**Custo de IA:**
- Teto mensal no console da Anthropic **e** no `config`.
- Alerta a 80%; acima do teto, fila.
- Carga histórica só pela Batch API, com teto separado.
- Estimativa no Opus 5.5: US$ 15–30 por mês. Confirmar com 20 documentos reais.

**Rotinas e e-mail:**
- `integracao.rotina` e `integracao.execucao`, com tela "Rotinas" e alerta "não rodou ou falhou" na Central.
- Envio de e-mail tratado como integração nova, registrada envio a envio.
- Os horários da R1 continuam. Somam-se a pendência "e-mail faltando" (RH) e o alerta "Omie sem leitura há 2 dias" (Financeiro).
- Nenhuma rotina da Premiação é tocada.
