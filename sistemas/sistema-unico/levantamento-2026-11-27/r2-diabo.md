# R2/R3 — Advogado do Diabo: crítica e revisão

Fontes: as 9 propostas r1-*.md, os inventários e a minha consulta de 27/11 (banco 144 MB, arquivos 853 MB, 62 MB de `premiacao_copia_*`). Somente leitura.

## A. CRÍTICA

### A.0 O problema comum a todas: tamanho
Somando as propostas, o conselho pede: um schema de núcleo com mais de 20 tabelas, de 8 a 9 fases (arquiteto §6), um kit visual com verificação automática (designer §5.6), uma central de pendências de todos os módulos (operações §3), contas a pagar própria (financeiro §2.1), um modelo de pessoa em 9 tabelas (RH §2), auditoria única, lixeira, MFA e painel de segurança (segurança §6–§11), e ainda os schemas `imp`, `ops.rotina` e `ia_leitura` (dados §2, §5, §6). A equipe real é uma pessoa não técnica e sessões do Claude **sem memória entre si**. O Pedidos novo, um módulo só, ainda não cria pedido depois de 11 migrations (inv-pedidos §1, §8). **Ninguém estimou prazo.** Proponho cortar: só entra na fase seguinte o que destrava o desligamento do legado ou fecha um risco medido.

### A.1 Arquiteto
- **A Fase 0 "até 30/11" é otimista demais.** Ela junta plano Pro, código de 5 sistemas no git e ambiente de teste em 3 dias, e o próprio arquiteto mostrou que não há nenhum branch (`list_branches` vazio).
- **Renomear `pedidos_novo`→`pedidos` e tirar Documentos/POPs do `public`** (§2) é risco grátis: os dois sistemas estão vivos (1.013 arquivos, 977 emissões, inv-documentos) e todas as funções e caminhos mudam. Exijo **não renomear schema em produção**.
- **Login da Premiação "no primeiro acesso", conferindo o PBKDF2** (§6): é código de segurança novo escrito pelo Claude, sem revisão humana.
- **A regra "um módulo nunca lê o schema de outro"** (§2) inviabiliza a central de pendências da Operações e a tela de contas a pagar do Financeiro (que lê `v_parcela`). O conflito ficou sem solução.
- Ponto bom: a casca em HTML puro em vez do Next.js da raiz (§5). **Isso precisa ser decidido**, porque o AGENTS.md avisa que o Next ali "não é o que você conhece".

### A.2 Designer
- **Trocar a ficha em gaveta do Pedidos novo por página própria** e as abas por menu lateral (§0, §3.4) é reescrever a tela do único módulo quase pronto, logo antes da virada. Prefiro manter a tela atual e corrigir só as rolagens internas.
- O menu tem 7 subitens para Compras, que teve 0 compras (inv-compras §1.1). É menu para módulo sem uso.
- A verificação automática de fontes e rolagem no link de teste é boa, mas alguém precisa mantê-la. Sem dono, ela some na 3ª mudança.
- O designer admite que haverá **dois visuais por meses** (§5.3), e o sócio pede justamente não ter de reaprender (sócio §6). Isso não foi tratado.

### A.3 Operações
- **A central lê a Premiação "só leitura"** (§4), mas a Premiação não tem RLS e só filtra por `podeUnidade()` no código (segurança §0). Para ler pendências dela por fora, é preciso replicar essa regra, e um erro mostra a loja de outro sócio.
- "Cobrar as 37 unidades" e "cobrar o laboratório em 101 parcelas" por e-mail (§4, §5) dependem de envio de e-mail, que está **decidido e não implementado** (inv-pedidos §6). Nenhuma proposta diz qual serviço de e-mail será usado nem quanto custa.
- A lista de 8 automações não tem prioridade de corte. "Omie sem o navegador" está na lista, mas a solução real é a mesma tarefa no mesmo navegador.

### A.4 Sócio
- **O código de primeiro acesso de 6 dígitos** é exatamente o risco apontado pela segurança (sem prova de identidade desde 23/11, inv-premiacao §3).
- "Esqueci a senha sozinho" exige e-mail transacional configurado. O e-mail padrão do Supabase é limitado e não serve para 60 unidades. Fica uma dependência não listada.
- **A adesão é o risco escondido:** só 6 de 19 sócios criaram senha na Premiação e 13 de 20 no Documentos (sócio §1). Login único não resolve adesão. É preciso uma meta e uma cobrança.

### A.5 Financeiro
- **A Fase 3 migra as 541 parcelas e os 83 pagamentos de `pedidos_novo` para `financeiro.titulo`** (§3). Isso reescreve a regra das 3 baixas, que acabou de ser decidida em 26–27/11, no módulo que ainda nem virou. Exijo: **nada disso antes de o Pedidos rodar 2 meses sozinho**.
- O diagnóstico mais útil do conselho é dele: R$ 661.463,51 parados em "falta planilha" (Q2). O gargalo é cobrar o laboratório, não ter mais telas.
- **NF tem três donos propostos**: `pedidos_novo.nota_fiscal`, `financeiro.documento_fiscal` e `nucleo.documento`. Ninguém resolveu.

### A.6 RH
- O modelo de 9 tabelas (pessoa, documento fiscal, vínculo, lotação, papel técnico, RT da unidade, pagamento, conta, acesso) é **uma cópia da Premiação e da Bizneo**, com "carga noturna" (§3), o que cria uma segunda fonte de verdade e mais um robô.
- O próprio RH provou que **0 de 697 pessoas têm e-mail** (§1). Login para cerca de 400 colaboradores não é viável agora. É preciso tirar isso do escopo.
- Concordo com ele: casar prescritor por nome ("41 de 48") é frágil. O casamento tem de ser confirmado por CRBM.

### A.7 Segurança
- **"MFA por autenticador obrigatório para Operações"** (§3) choca com a premissa "o usuário não instala nada", porque é um aplicativo no celular. Se o celular for perdido, a única administradora fica trancada para fora. É preciso decisão do usuário e um código de recuperação guardado fora do Claude.
- "Revogar o GRANT de anon em `public`" (§5.2) pode derrubar o Documentos se alguma tela usar a chave publicável. Só aceito depois de testar no ambiente de teste.
- A cópia semanal cifrada para o Google Drive e o teste de restauração mensal (§8) são bons, mas **não dizem quem executa**. Se for uma tarefa agendada do Claude, as credenciais do Drive ficam dentro da automação.
- Pôr Documentos/POPs como fase 2 contradiz o arquiteto, que põe em 6. O argumento dela (chave compartilhada, login sem senha) é o mais forte.

### A.8 Dados
- **O arquivo morto `legado_ckg` copia o legado inteiro para o banco único** (§3), inclusive `membros`, hashes de senha e a tabela `reb_omie_credenciais`. Isso aumenta o que pode vazar do ponto único de falha. Exijo excluir segredos e hashes da cópia, ou guardar o pg_dump fora do Supabase.
- A estimativa de custo da API (US$ 15–30/mês) usa preços que ninguém conferiu. Ela vale só como hipótese até o teste com 20 documentos.
- **"Vale o número do antigo"** obriga a renumerar 43 + 4 pedidos no novo. Concordo, porque é o que as unidades viram. Mas tem de acontecer **no mesmo dia** do congelamento, senão o problema reaparece.
- A janela do Nutra "entre o fechamento de dezembro e 01/01" cai no fim de ano, com a equipe reduzida.

### A.9 A minha própria R1
Subestimei o custo do e-mail transacional e a adesão dos sócios. A minha exigência de "um segundo humano com acesso" não diz quem é nem quanto custa.

### A.10 Conflitos sem solução
1. **Ordem das fases**: o arquiteto e o designer começam por Pedidos; a segurança, por Documentos e POPs; o sócio quer Reembolsos em 2º; o financeiro, contas a pagar em leitura; a Operações, a central de pendências.
2. **Nome e dono do núcleo**: `nucleo` (arquiteto, RH), `core` (dados), `cadastro` (financeiro). Os modelos de pessoa e RT são diferentes no arquiteto e no RH.
3. **Leitura entre schemas**: proibida pelo arquiteto, exigida pela Operações e pelo Financeiro.
4. **O sócio vê orçamento e % da meta?** A premissa diz que vê o mesmo que Operações; a segurança e o sócio dizem que não.
5. **"Operações pode tudo"** contra a segregação ("não aprova o que lançou").
6. **MFA** contra "não instala nada".
7. **Filtro global**: o designer limita à unidade; a premissa diz que o filtro "vale no site inteiro".
8. **Primeiro acesso**: código de 6 dígitos, senha antiga PBKDF2 ou convite por e-mail.
9. **Dono da NF** e onde fica a regra das 3 baixas.

## B. REVISÃO

### Condições revisadas para aceitar
1. **Corte de escopo escrito.** Fase 1 = cadastro de unidade/CNPJ, login único e casca, estreados no Pedidos novo. Fase 2 = Pedidos completo e desligamento do Pedidos antigo. Nada de títulos financeiros, pessoa em 9 tabelas, login de colaborador nem Compras antes disso.
2. **Nenhuma renomeação ou mudança de schema em sistema vivo**: `public`, `premiacao` e `pedidos_novo` ficam como estão. O núcleo é aditivo.
3. **Premiação congelada** até outubro e novembro fecharem. O código vai para o git só como cópia. A central de pendências não lê a Premiação até ela ter RLS.
4. **Nutra**: 01/12 roda no legado e é conferido. A virada acontece na janela de fim de rodada, com os 21 logins testados. Se a janela cair no recesso, adia-se um mês.
5. **Desligamento do Pedidos antigo só com**: a lista de aceite da matriz toda verde; arquivos com contagem e checksum conferidos; DH renumerado no dia do congelamento; Omie redirecionada e chave antiga revogada; receitas de 01/12 geradas pelo antigo.
6. **Legado nunca apagado de uma vez.** Ele passa 30 dias pausado, e o pg_dump fica fora do Supabase, sem segredos copiados para o banco único.
7. **Backup**: plano Pro com limite de gasto, uma restauração testada antes da Fase 2 e cópia dos arquivos para fora com dono definido.
8. **Custos com teto**: Supabase, API do Claude (registro por leitura, sem reler o mesmo hash) e e-mail transacional, num orçamento mensal escrito e aprovado.
9. **Continuidade**: um documento-mestre único que toda sessão do Claude lê primeiro, todo o código no GitHub, código de recuperação de MFA e senhas mestras guardados pelo usuário fora do Claude, e um nome de técnico de emergência.
10. **Meta de adesão**: percentual de sócios com senha criada antes de cada virada de login. O login antigo só é desligado depois de a meta ser atingida.

### Riscos que continuam ALTOS e pedem decisão do usuário
| Risco | Decisão necessária |
|---|---|
| Equipe de uma pessoa + Claude para mais de 20 tabelas e 8 fases | Aceitar o corte de escopo e um prazo por fase |
| Omie depende do navegador e do login do dono | Aceitar a dependência (com alerta) ou buscar acesso por API com o laboratório |
| Ponto único de falha: um banco para 6 sistemas | Aceitar com backup testado ou separar a Premiação em outro projeto |
| MFA da única administradora | Usar ou não, e onde guardar o código de recuperação |
| O sócio vê orçamento e % da meta? | Sim ou não (a premissa e a Premiação atual divergem) |
| "Operações pode tudo" e segregação nos fluxos com dinheiro | Manter tudo ou excluir "aprovar o que lançou" |
| Numeração DH | Confirmar "vale o antigo" e a data do congelamento |
| Custos mensais (Pro, branch de teste, API, e-mail) | Aprovar o teto |
| Ordem das fases (Pedidos ou Documentos/POPs primeiro) | Escolher. Recomendo Pedidos, porque destrava o desligamento do legado |
| Casca em HTML puro ou Next.js | Escolher uma tecnologia e não misturar |
