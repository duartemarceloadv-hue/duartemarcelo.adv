# R2/R3 — Designer de UX/UI: crítica e revisão

Siglas: **IP** = inv-premiacao.md, **IPd** = inv-pedidos.md, **Pn-css** = `sistemas/pedidos/web/app.css`. As propostas da rodada 1 são citadas por papel e seção, por exemplo "Op §3" para r1-operacoes.md, seção 3.

## A. CRÍTICA

### A.1 Conflitos entre propostas (precisam de uma decisão só)

| # | Conflito | Risco se ficar como está | Decisão proposta |
|---|---|---|---|
| C1 | **Tela inicial.** Operações quer uma tabela de 7 colunas: Prazo · Módulo · Unidade · O que falta · Quem resolve · Valor · Ação (Op §3). O sócio quer 3 blocos de frases: "Aguardando você", "Atenção na sua loja" e "Acompanhando" (Sócio §3). Eu propus 2 abas | Duas telas iniciais diferentes geram retrabalho em dobro. A Operações e o sócio passam a falar de coisas que aparecem em lugares diferentes | **Um componente só.** No computador é tabela; no celular cada linha vira uma frase em cartão, que é o pedido do sócio. As abas são "Aguardando você" e "Com outros"; a segunda equivale ao "Atenção na sua loja". A coluna "Com quem" só aparece na aba "Com outros", porque na outra a resposta seria sempre "você". **"Acompanhando" sai**: repetiria as listas dos módulos (premissa) |
| C2 | **Barra inferior.** A Premiação usa 5 itens (IP §5), o sócio pede 4 (Início · Minhas lojas · Documentos · Mais) e eu propus 5 fixos | Um número diferente por módulo faz o polegar errar o alvo | **Regra:** Pendências e Mais são fixos, com até 3 itens no meio conforme o perfil. Sócio: Pendências · Minhas lojas · Documentos · Mais. Operações: Pendências · Pedidos · Documentos · Premiação · Mais |
| C3 | **Contadores.** A Operações quer uma linha de contadores por módulo na tela inicial (Op §3). Eu propus o contador só no menu | O mesmo número aparece duas vezes na tela | Os contadores por módulo ficam **só na tela de Pendências**, como fichas que filtram a lista. O menu mostra **um único número**, o total no item Pendências. Isso também conserta o selo quebrado (IP §5) |
| C4 | **"Resolver sem abrir outra tela."** A Operações quer um painel com o documento ao lado (Op §4). Eu tinha proibido gavetas | A gaveta do Pedidos novo tem rolagem própria (`.f-corpo{overflow-y:auto}`, Pn-css linha 120). Isso infringe a premissa "sem rolagem interna" | A pendência abre **em página própria**: documento à esquerda, decisão à direita (o mesmo molde do visualizador), mais o botão **"Próxima pendência"**. O fluxo continua sem voltar à lista |
| C5 | **Palavras da aprovação.** Eu usei Aprovar, Devolver e Reprovar. O sócio usa Aprovar, Pedir explicação e Não aprovar (Sócio §4). O Compras usa `devolvida` e `reprovada` (inv-compras §1.3) | Rótulos diferentes para o mesmo ato | **Na tela, as palavras do sócio, para todos os perfis.** No banco ficam os nomes técnicos |
| C6 | **Situação da parcela.** O financeiro precisa das 7 situações (Fin §2.1; IPd §4). O sócio quer ver só "paga", "a pagar até dd/mm" e "vencida" (Sócio §5) | Um sócio que vê "falta Omie" não entende. Um financeiro que vê só "a pagar" não sabe o que cobrar | São dois campos diferentes. **Situação** (7 valores) para Operações e financeiro, **Pagamento** (3 valores, calculado) para o sócio. A coluna troca conforme o perfil e nunca aparecem as duas juntas |
| C7 | **Ficha da pessoa em 6 abas** (RH §5) contra a minha regra de seções em ordem fixa | No celular, 6 abas transbordam para a lateral, como o `nav.abas{overflow-x:auto}` do Pn-css linha 35, e as abas escondem informação | Seções em ordem fixa, com um sumário de âncoras no topo. As abas ficam reservadas para trocar de agrupamento em relatório e lista, no máximo 5, e quebram linha em vez de rolar |

### A.2 Discordâncias por proposta

**Arquiteto**
- **"Ficha com cartões" (§7):** cartões na ficha repetem os dados do cabeçalho. A consequência é uma tela poluída. Proponho rótulo sobre valor, sem cartão.
- **Premiação dentro do menu só na Fase 8:** até lá, o item do menu abre outro site com outro login. O usuário não entende por que precisa entrar duas vezes. Proponho o rótulo explícito "abre em nova aba (login próprio)".
- **HTML puro × Next.js (§5):** concordo. O kit precisa ser só tokens CSS mais componentes simples, para não depender dessa escolha.

**Operações**
- **"Documentos (37 vencidos / 90 a vencer)" (§3):** são dois dados num mesmo item, o que infringe a premissa. Devem ser duas fichas.
- **"No máximo 2 botões" (§4):** a mesma proposta lista 3 botões na divergência de pedido de venda. Proponho a regra uma primária, até duas secundárias e o resto em "Mais".
- **Lote "Cobrar laboratório nas 101 parcelas":** sem um resumo antes de executar, uma mensagem em massa pode sair errada. A confirmação deve mostrar "101 parcelas · 2 laboratórios · R$ 1.012.315,08". O valor vem de Fin §1: falta planilha mais falta Omie.

**Sócio**
- **"Olá, [nome]" no topo (§3):** gasta uma linha no celular e repete o nome que já está no menu do usuário. Sai.
- **"Minhas lojas" (§3):** aceito. Vira item do menu e leva à ficha da unidade: Empresa, Sócio, RT, Documentos, Pedidos e Premiação do mês, cada um com link para o módulo. Isso preenche uma lacuna da minha R1.
- **Botões "grandes no fim" (§4):** no computador a decisão fica no topo. No celular vira uma barra de decisão presa ao rodapé, e a barra inferior se esconde nessa tela para as duas não se sobreporem.

**Financeiro**
- **Abas de Contas a pagar:** concordo, e viram visões salvas.
- **"Última leitura da Omie" (§2.3):** é o mesmo pedido de Dados §2 e do Diabo, risco 16. Vira um padrão do kit, a linha "Atualizado em", e não um enfeite de uma tela só.
- **Cartão de orçamento no Financeiro (§2.7):** repete a tela Orçamento da Premiação. A consequência são dois lugares para conferir o mesmo número. Proponho um link, não um cartão.

**RH**
- **CPF e CNPJ:** "um campo, um dado" vale também para a tela. CPF e CNPJ de recebimento ficam em colunas separadas, e nada de "CPF/CNPJ" num campo só, como na coluna "Lojas / CPF" das Configurações da Premiação (IP §5).

**Segurança**
- **Telas que faltavam na minha R1:** concordo com o painel de segurança, a lixeira e a máscara de CPF. Viram Configurações › Segurança e acessos, Configurações › Lixeira e a regra de máscara no kit.
- **MFA no financeiro e na contabilidade:** a tela de MFA precisa de instruções em linguagem leiga. Sem isso, o usuário fica bloqueado e chama a Operações.

**Dados**
- **Código curto "U001" (§1):** se aparecer junto com o nome ("U001 – Moema"), são dois dados num campo. O código só vai para a exportação e para a busca.
- **Duas filas novas:** "Unidade não reconhecida" e falha de rotina entram na Central de pendências da Operações, sem criar uma tela de fila separada.
- **"Atualizar agora" (§7):** entra na linha "Atualizado em", só para Operações.

**Diabo**
- **Meta de 2 s com 500 pedidos (risco 14):** concordo, e adoto paginação de 50 com "Mostrar mais".
- **"Ver como" (risco 15):** o modo precisa de uma faixa sempre visível e de cor distinta, senão a Operações pode achar que está gravando.

## B. REVISÃO (o kit consolidado para o protótipo)

**O que mudou e por quê**
- C1 a C7 decididos acima.
- Entraram 4 telas: Minhas lojas, Segurança e acessos, Lixeira e Rotinas.
- Entrou a linha "Atualizado em".
- "Competência" passa a se chamar **Mês** (Sócio §5).
- Entrou a máscara de CPF.
- A barra inferior passa a ter de 4 a 5 itens conforme o perfil.

**1. Casca**
- **Menu lateral** navy #1B3A4B, item ativo em dourado #C8A96E. Tem 216 px a partir de 1280 px, 64 px entre 861 e 1279 px, e vira barra inferior até 860 px.
- **Cabeçalho** de 56 px, preso no topo, com:
  - Seletor de unidade, de seleção múltipla, gravado por usuário e na URL. Fica oculto para quem tem uma loja só.
  - Seletor de **Mês**, só em Premiação, Contagem e relatórios mensais.
  - Menu do usuário.
- **No modo "Ver como"**: faixa de atenção fixa logo abaixo do cabeçalho.
- **Página**: título (20 px) + uma ação primária. Logo abaixo, a linha "Atualizado em dd/mm hh:mm · fonte" em 12 px, nas telas alimentadas por robô.
- **Proibido**: rolagem interna vertical, rolagem lateral em 1366 e em 390 px, e gaveta. Ficam presos só o cabeçalho, a barra de lote e a barra de decisão no celular.

**2. Tipografia e cores**
- **Fonte**: Nunito Sans em 4 tamanhos: 20/600, 16/600, 14/400-600 e 12/400-600. O piso é 12 px.
- **Números**: `tabular-nums`. R$ sempre como `R$ 1.234,56`, alinhado à direita, com o sinal "−" no negativo. Datas em dd/mm/aaaa.
- **Neutros**: texto #1F2A33, rótulo #55636F, borda de campo #8A96A3, divisória #DCE2E8, fundo #F3F5F7, superfície #FFFFFF. O contraste ainda precisa ser medido no teste.
- **5 cores de situação**, sempre com texto:
  - neutro #4F5C69/#E9EDF1
  - informação #1D5A85/#E2EDF6
  - sucesso #1B6E41/#E0F1E6
  - atenção #855400/#FBEFD6
  - perigo #A8231A/#FBE7E5
- Um selo de situação por registro.
- O CPF aparece mascarado (***.456.789-**) fora da ficha da pessoa.
- Sem emojis. Ícones lineares de 20 px, só no menu e em botão de ícone.

**3. Telas-padrão**
- **Lista**:
  - Ordem: título → "Atualizado em" → fichas de contagem opcionais → visões salvas → filtros (busca + 3 + "Mais filtros", que empurra o conteúdo) → tabela → "Mostrar mais 50".
  - No máximo 8 colunas, linha de 40 px e um dado por coluna. A primeira coluna é o identificador; a penúltima, a situação; a última, no máximo uma ação.
  - Total em rodapé. Barra de lote com verbo + substantivo e confirmação com resumo de quantidade e R$.
  - As colunas mudam por perfil: as ocultas somem, não aparecem vazias.
  - No celular, cada linha vira cartão: identificador com o selo, mais até 3 campos.
- **Cartões de indicador**: no máximo 4 (2 × 2 no celular). Rótulo, número e uma comparação. O clique leva à lista filtrada e o cartão não repete o total da tabela.
- **Ficha** (página própria):
  - Cabeçalho: nome em 16 px, selo, até 4 dados, ações (1 primária, até 2 secundárias e "Mais").
  - Depois "O que falta" e as seções em ordem fixa: Dados → Itens e valores → Documentos → Ligações → Histórico. Um sumário de âncoras no topo quando houver mais de 4 seções.
  - Correção pede justificativa. O sócio vê "Pedir correção".
- **Pendências** (tela inicial):
  - Fichas por módulo com a contagem. Abas "Aguardando você" e "Com outros".
  - Colunas: Prazo · Módulo · Unidade · O que fazer · [Com quem] · Valor · Situação · Ação.
  - Ordem: vencidas, depois por prazo, depois por valor. Lista vazia mostra "Nada aguardando você".
  - Abrir uma pendência leva à página de decisão com "Próxima pendência".
- **Decisão / aprovação**:
  - Documento à esquerda (70%) e painel à direita (30%). No celular ficam empilhados, com a barra de decisão no rodapé.
  - Botões **Aprovar · Pedir explicação · Não aprovar**; os dois últimos com motivo obrigatório. Operações tem ainda "Aprovar em nome de".
  - Os valores aprovados ficam congelados e aparecem na ficha. Se mudarem, surge o selo de perigo "aprovação desfeita: R$ A → R$ B".
- **Visualizador**: o mesmo molde da decisão. Painel com tipo, unidade, validade (4 estados), origem e "Usado em". Campos lidos pela IA aparecem como "lido do documento — confirmar". Baixar é ação secundária.
- **Relatório**: o molde da lista, só de leitura, com abas de agrupamento (até 5) e exportação Excel/PDF registrada. Os cabeçalhos ficam dentro do arquivo.

**4. Menu lateral**

| Item | Submenu |
|---|---|
| Pendências | — |
| Minhas lojas (sócio) ou Unidades (Operações) | ficha da unidade |
| Premiação | Quadro do mês · Pessoas · Planos especiais · Importar dados e metas · Conferência · Recibos · Relatórios · Política (nova aba até o login único) |
| Pedidos | Pedidos · Pagamentos · Notas fiscais · Receitas do mês |
| Compras e estoque | Solicitações · Cotações · Compras · Recebimentos · Notas e contas a pagar · Estoque · Contagem mensal |
| Reembolsos | Solicitações · Pagamentos |
| Documentos | Por unidade · Conferência · Vencimentos · Avisos |
| POPs | Biblioteca · Emissões · POPs específicos |
| Cadastros | Empresas · Pessoas · Sócios · Responsáveis técnicos · Fornecedores e laboratórios · Produtos |
| Configurações | Usuários e acessos · Segurança · Alçadas · Parâmetros · Rotinas · Lixeira · Histórico geral |

- O menu se monta pelo papel e pelos módulos liberados (`modulo_liberado`, Arquiteto §3). O que não é permitido não aparece.
- O sócio não tem Cadastros nem Configurações e não vê a aba "Por sócio".

**5. Próximo passo**
- Protótipo estático de 6 telas: Pendências, Lista de pedidos, Ficha do pedido, Decisão de reembolso, Visualizador e Minhas lojas.
- Verificado em 1366 × 768 e em 390 × 844, com uma checagem automática que reprova o teste se encontrar rolagem interna, rolagem lateral ou um tamanho de fonte fora dos 4.
