# R2 – Segurança, LGPD e Auditoria: crítica e revisão

Base: as 9 propostas r1-*.md, os inventários e as consultas da R1 (get_advisors e SELECT de 27/11). Nada foi alterado.

## A. CRÍTICA

### Arquiteto (r1-arquiteto)
| Ponto | Risco | Exigência |
|---|---|---|
| §6: Documentos/POPs só na **Fase 6** | É onde estão os dois piores furos medidos: a chave de admin compartilhada (4.101 ações sem autor, inv-documentos) e o POPs com CNPJ + qualquer e-mail, sem senha (117 logins). Esperar 5 fases deixa os furos abertos por meses | Fazer uma contenção antes (ver B.4) |
| §3: `usuario_papel` com módulo "todos" e escopo "rede" | Um papel "rede/todos" dado por engano equivale a acesso total | Só Operações concede; quem concede ≠ quem recebe; a concessão vai para o registro e para revisão mensal |
| §3: "Ver como" mantido | Hoje é só leitura (inv-premiacao §3). No sistema único, se puder agir, vira impersonação | Continua só leitura, com registro de início e fim |
| §2: as funções do núcleo usadas no RLS **e** nas edge functions | Certo. Mas, se as edge functions continuarem com service role (como Documentos e Pedidos novo) ou como dono do banco (como a Premiação), o RLS não protege nada | As funções novas chamam o banco com o token do usuário, e o RLS vale de verdade |

### Designer (r1-designer)
| Ponto | Risco | Exigência |
|---|---|---|
| §1: filtro global **espelhado na URL**, "o link compartilhado leva o filtro" | Um sócio que receber o link de outro sócio (ou o link encaminhado no WhatsApp) não pode ver a loja do outro só porque o id está na URL. O id na URL também fica no histórico do navegador e nas pré-visualizações de link | A URL só carrega ids; o servidor sempre cruza com `minhas_unidades()`; uma unidade fora do escopo some do filtro sem erro e sem dizer o nome |
| §3.6: "Aprovar em nome de [sócio]" | Se o registro gravar o sócio como aprovador, a trilha mente | Gravar "Operações (nome) em nome de sócio (nome)", com motivo obrigatório, e avisar o sócio |
| §3.7: "Usado em" no visualizador | Um arquivo reaproveitado (contrato de fornecedor, NF de vários pedidos) mostraria registros de outras lojas | Listar só os registros que quem vê pode abrir |
| §3.4: ações destrutivas no "Mais" | Bom. Falta dizer que "excluir" é lixeira, não apagar | Ver B.6 |
| §4: o seletor de unidade é "agrupado por sócio" | Para o sócio, a lista de sócios da rede não pode aparecer (r1-socio §5) | O agrupamento por sócio é só de Operações |

### Operações (r1-operacoes)
| Ponto | Risco | Exigência |
|---|---|---|
| §4–5: "Cobrar unidade (aviso + e-mail)", cobrança de laboratório em lote | O e-mail sai do sistema com valor, NF e CNPJ. Destinatário errado é vazamento; um e-mail sem autenticação do remetente cai como spam ou permite falsificação | O destinatário vem do cadastro (nunca digitado na hora). O e-mail leva o resumo e o link, sem anexos nem CPF. O domínio de envio é autenticado. Cada envio fica registrado |
| §4: "Baixa sem comprovante" e "Marcar como informado" | Baixa sem prova é o ponto de fraude clássico em contas a pagar | Justificativa obrigatória, papel financeiro ou Operações e relatório mensal das baixas sem comprovante |
| §4: Nutra "vale o último" | Sem guardar o anterior, perde-se o dado | O envio anterior fica guardado (ela já propõe isso) |

### Sócio (r1-socio)
| Ponto | Risco | Exigência |
|---|---|---|
| §4: link por e-mail/WhatsApp | Ele mesmo exige login. Concordo: **nenhum link carrega token de acesso** ou aprova sozinho (pesquisa §4.7 só admite isso para valor baixo) | O link abre a tela de login e depois o item |
| §7: aprovação tácita aceita com aviso | Para pendência da Premiação ("vale o sistema" em 5 dias úteis, regra que já existe, inv-premiacao §7) é aceitável. Para saída de dinheiro (reembolso, compra, pagamento), a falta de resposta não pode virar aprovação | Tácito só onde a regra já existe. Dinheiro só sai com aprovação explícita |
| §2: código de 6 dígitos por 7 dias | Ver RH abaixo | — |
| §6: "Esqueci a senha" sozinho | Só é seguro se o e-mail for comprovado. No POPs qualquer e-mail entra (inv-documentos) | A troca de senha vai só para o e-mail já validado no cadastro. Para papéis com MFA, a recuperação também pede o autenticador ou passa por Operações |

### Financeiro (r1-financeiro)
| Ponto | Risco | Exigência |
|---|---|---|
| §3 Fase 1: tela lendo a **vista** `pedidos_novo.v_parcela` | No Postgres, uma view roda com o dono por padrão e ignora o RLS: o sócio veria parcelas de todas as lojas | A view é `security_invoker` ou fica atrás de função que filtra por unidade |
| §2.1: segregação "quem aprova não paga" | Bom, e coerente com `segregacao_pagamento = true` (inv-compras §2) | Vale também para Operações (B.1) |
| §2.2: dados bancários com confirmação por outro canal | Bom (`cmp_forn_guard`) | A troca de conta bancária gera alerta para dois papéis, não só para quem trocou |

### DP/RH (r1-rh)
| Ponto | Risco | Exigência |
|---|---|---|
| §1 e §6: **primeiro acesso por CPF + código** para cerca de 400 pessoas sem e-mail | O CPF não é segredo (está em holerite, contrato e recibo). Quem distribui o código (gestora, Operações) pode criar a conta no lugar do colaborador e ver o salário e o prêmio dele. O código vale 7 dias e, desde 23/11, não vai por e-mail (inv-premiacao §3) | O código é individual, de uso único e vale 48 h. É entregue à própria pessoa, nunca à gestora em lista. No primeiro acesso, o colaborador cadastra e confirma o próprio e-mail. A gestora não vê o código. Melhor ainda: trazer o e-mail da Bizneo |
| §6: "dados de saúde do RT" | Registro no conselho não é dado de saúde. O dado sensível de saúde está na **receita e no paciente**, que o Pedidos já trata só por código (inv-pedidos §4) | Classificar direito (B.5) |
| §2: PIX informado pela própria pessoa e confirmado por Operações | Bom | Mesma trava antifraude do fornecedor |

### Dados e IA (r1-dados)
| Ponto | Risco | Exigência |
|---|---|---|
| §3: arquivo morto `legado_ckg` com o legado **inteiro** | Leva para o banco único hashes de senha (`membros`), dados bancários e de cartão (`cmp_cartoes`, `cmp_fornecedores`, `reb_*`) e os logs. É dado pessoal guardado sem uso (LGPD: necessidade) | O schema fica sem USAGE para a API, só Operações lê, os hashes de senha não são copiados e o prazo de guarda é definido (5 anos para dado fiscal, apagar o resto em 12 meses) |
| §5: `ia_leitura` guarda o JSON extraído | Contrato social e comprovante PIX trazem CPF, RG, endereço e conta. O JSON vira uma segunda cópia do dado pessoal | O JSON fica com o mesmo acesso do documento de origem e vai para a lixeira junto com ele |
| §5: documentos enviados à API da Anthropic | É transferência para operador estrangeiro (LGPD art. 33). Receita com nome de paciente é dado de saúde | Nunca enviar receita nem nada com paciente; enviar só os tipos listados; conferir os termos de retenção da API e registrá-los no inventário de tratamento |
| §3 e §6: cópia dos buckets no Google Drive | Uma pasta do Drive compartilhada por engano expõe 1 GB de contratos | Pasta numa conta de serviço, sem compartilhamento, com arquivos cifrados |
| §3: pg_dump antes de desligar | Onde fica e quem guarda? | No mesmo cofre cifrado, com a senha fora do Claude |

### Advogado do Diabo (r1-diabo)
Concordo com os riscos 8, 12 e 15. Acrescento ao risco 12: o "segundo humano com credenciais fora do Claude" precisa de um **cofre de senhas** e de uma conta de emergência com MFA, que só se usa com registro e troca de senha depois. Senha em e-mail ou em planilha não vale.

### Conflitos entre propostas
1. **Ordem de Documentos/POPs**: Fase 6 (arquiteto) contra cedo (eu e o designer). Solução: contenção cedo e migração completa depois (B.4).
2. **Onde fica o filtro global**: no banco (arquiteto §3) ou na URL (designer). Os dois servem, desde que nenhum dos dois decida o acesso.
3. **Aprovação tácita**: o sócio aceita; o financeiro e eu exigimos aprovação explícita para dinheiro.
4. **Visão "Por sócio"**: existe na Premiação (inv-premiacao §5), o designer agrupa o seletor por sócio e o sócio proíbe. Fica só para Operações.
5. **Colaborador**: RH e sócio querem um acesso fácil; segurança quer posse comprovada do e-mail. A solução está na exigência do RH acima.

## B. REVISÃO (o que muda na minha proposta)

**B.1 Quadro final papel / vê / faz / aprova**
| Papel | Vê | Faz | Aprova | MFA |
|---|---|---|---|---|
| Operações | Tudo, inclusive orçamento, % da meta e visão por sócio | Tudo, com justificativa; "ver como" só leitura; "em nome de" registrado | Tudo, menos o que ela mesma lançou ou cotou em fluxo com dinheiro | Sim |
| Sócio | As suas lojas: o mesmo que Operações, **sem** orçamento, % da meta, observação interna, lista de sócios ou total da rede | Pedir correção, responder pendência, anexar documento | A loja dele (premiação, compra, reembolso). Nunca o próprio prêmio | Sim (aprova dinheiro) |
| Gestor da unidade | A sua unidade, sem orçamento e sem prêmio individual de outros | Solicitar, enviar documento, responder pendência | De acordo de 1º nível | Não |
| RT / clínica | POPs, documentos regulatórios e receitas da unidade | Emitir POP, enviar carteira/CRT | Assinar receita | Não |
| Financeiro | Parcelas, títulos, reembolsos e dados bancários; não vê resultado da premiação | Baixa, pagamento, orçamento | Pagamento, nunca o que lançou | Sim |
| Compras | Solicitações, cotações e fornecedores | Cotar, cadastrar fornecedor (sem dado bancário) | Nada que tenha cotado | Não |
| Contabilidade | Meses aprovados | Exportar (registrado) | — | Sim |
| Colaborador | Só o próprio CPF/CNPJ, em mês aprovado | Ciência, contestação, reembolso | — | Não |
| Área (Marketing, RH) | As pendências da área, sem valores | Responder | — | Não |
| Consultor externo | Os itens liberados, com data de fim | Comentar | — | Sim |
| Robô | Só a tabela de entrada | Gravar a importação | — | Chave no Vault |
| Emergência | Tudo | Só com registro e troca de senha depois | — | Sim |

Mudou: MFA para o sócio (antes era só recomendado), porque ele aprova saída de dinheiro. Entraram os papéis "área" e "emergência". O sócio também deixa de ver observação interna e lista de sócios (r1-socio §5).

**B.2 Primeiro acesso** (novo): o código é de uso único, vale 48 h e vai para a própria pessoa. A pessoa confirma o próprio e-mail. A recuperação de senha só vai para e-mail validado. A virada de login não acontece em 01/12 nem no fechamento (r1-socio §7).

**B.3 Regras de link, filtro e tácito** (novo): nenhum link carrega token; a URL nunca decide o acesso; views com `security_invoker`; tácito só onde a regra já existe e nunca para dinheiro.

**B.4 Ordem**: aceito o Pedidos como primeiro módulo (arquiteto, designer, Operações). Mas a contenção do Documentos/POPs entra logo depois do login único, antes da migração completa: logins individuais de Operações no lugar da `admin_key`, POPs com o login do responsável que já existe nas 53 unidades, troca da chave `x-link` e retirada da chave antiga x-omie. A revogação do anon nas 3 funções SECURITY DEFINER fica para a virada do Nutra (`nut_enviar_estoque_v2` é o formulário em uso).

**B.5 Classificação LGPD** (refinada): **saúde** = receita e paciente (nunca vão para a IA nem para o colaborador); **financeiro pessoal** = salário, prêmio, PIX, conta (papéis mínimos, leitura registrada); **identificação** = CPF (mascarado); **profissional** = conselho e CRBM (visível na unidade). Haverá um inventário de tratamento com finalidade, base legal e prazo de guarda por tabela, incluindo o `legado_ckg` e a `ia_leitura`.

**B.6 Mantido**: o registro único de quem mudou o quê, que ninguém edita (agora também com "em nome de", envio de e-mail e leitura de dado financeiro); a lixeira de 90 dias; o Pro com PITR; a cópia cifrada dos buckets numa conta de serviço; o teste de restauração mensal; a Premiação intocada até out/nov fecharem; e o cofre de senhas com a conta de emergência.
