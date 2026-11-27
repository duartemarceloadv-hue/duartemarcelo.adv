# Premissas já decididas pelo usuário (não se rediscutem; só se registra o risco)

Contexto: Dr. Hair, rede de clínicas capilares (53 unidades hoje, rumo a 60+). Usuário principal: Operações (gestora central, pode tudo com registro). O usuário não é técnico: não instala nada; o trabalho é conduzido no app do Claude.

## Sistema
- Um sistema só, com módulos separados. Layout de referência: o da Premiação (menu lateral, cabeçalho, cartões — a estrutura, não só as cores).
- Premiação, Bizneo HR e ZurIA ERP: somente consulta, nunca alterar nada (a Premiação está em implantação; outubro ainda não fechou).
- Página inteira rola; sem barras de rolagem internas; no notebook a 100% as telas cabem inteiras (pode reduzir fonte); um layout único para computador e celular.
- Filtro escolhido (ex.: loja) vale no site inteiro.
- Valores em R$ sempre completos, com centavos.
- Aparência profissional (Conta Azul / Omie como referência), sem emojis, sem cara de "feito por IA".
- Não repetir a mesma informação em vários lugares da tela; não colocar dois dados no mesmo campo/coluna.
- Documentos abrem para visualizar na tela (download opcional); documento anexado uma vez e reaproveitado; cadastro único da empresa/unidade.
- Login por e-mail e senha; cada pessoa vê só as suas unidades; sócio vê o que Operações vê, restrito às lojas dele; Operações pode tudo (com registro).
- Toda correção manual exige justificativa e fica registrada; nada aprovado se perde.
- Nenhuma funcionalidade existente pode ser perdida; sempre testar antes de publicar.
- Sem links para a Omie (o financeiro não tem acesso); arquivos guardados no próprio sistema.

## Decisões já tomadas no módulo Pedidos (nesta conversa)
- Banco único: Supabase `xqxjmeioodmdhxhivyqu` (já hospeda Documentos, POPs, Premiação, Pedidos novo e Nutra em schemas separados). O banco legado `ckgsdvhkpnrrmctlqtma` será desligado quando o novo estiver pronto, com TODAS as informações e documentos trazidos.
- Pagamento de parcela só está quitado com 3 baixas: Omie + planilha do laboratório + baixa no nosso sistema. Planilha só exigida na 1ª parcela (Centro Paulista). Injemed: só a nossa baixa. Baixa sem comprovante só quando a Omie já baixou.
- Robôs (planilha do laboratório, rastreio Quality, Omie) rodam 1 vez ao dia.
- Não inventar datas (ex.: previsão de entrega só se o laboratório informar).
- Estoque Nutra entra no banco único como parte de Compras/Estoque; usuários mantêm a mesma senha.
- Documentos das clínicas que já estão no sistema de Documentos não são duplicados.
- Supabase Pro será necessário para copiar os arquivos (plano gratuito 1 GB; Documentos já usa ~894 MB).

## Infraestrutura proposta (criar só após o "sim")
- GitHub como fonte oficial do código (já existe repositório `duartemarceloadv-hue/duartemarcelo.adv` com Pedidos novo e Nutra; Premiação, Documentos, POPs, Compras, Reembolsos NÃO estão em git).
- Netlify ligado ao repositório com link de teste a cada mudança.
- Supabase com ambiente de teste.
- API do Claude como componente (leitura de NF, cartão CNPJ, contrato social, pedidos), não como lugar de construção.
- Rotinas recorrentes como tarefas agendadas.

## DECISÃO DO DONO (27/11, durante o conselho global) — vale acima de qualquer proposta
- A PREMIAÇÃO FICA FORA do sistema de operações. É um sistema à parte, com regras próprias, e a política ainda vai ser criada antes. Não desenhar a Premiação como módulo do sistema único.
- O dono pediu DEBATE, não concordância: o conselho deve apresentar com honestidade os prós e contras de deixar a Premiação fora (ex.: segundo login para sócios, cadastro de pessoas duplicado, aprovações do sócio em dois lugares) e, se houver, o contra-argumento e uma alternativa. A decisão final é do dono.
- O que ainda pode ser avaliado (como sugestão, não como módulo): a Premiação apenas LER os cadastros comuns do núcleo (unidades, pessoas) para não duplicar dados, e eventualmente avisar pendências na tela inicial por link. Nada além disso.
