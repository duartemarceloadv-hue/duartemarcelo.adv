# Rodada 1 – Proposta do SÓCIO / FRANQUEADO LEIGO

Quem fala: dono de 1 a 3 clínicas, uso quase só o celular, não tenho tempo para treinamento. Fontes citadas entre colchetes.

## 1. O que me incomoda hoje (com evidência)

- **Muitos logins para a mesma pessoa.** Existem 7 cadastros de usuário com regras diferentes: Documentos `acessos`, POPs `pop_logins`, legado `membros`, `cmp_perfis`, `nutra.membros`, `premiacao.usuarios`, `pedidos_novo.usuario` [inv-documentos §"Logins/pessoas", linha 161 e 192]. Dos 19 usuários reais da Premiação, só 6 criaram senha [inv-premiacao §4]; no Documentos, 13 de 20 [inv-documentos §Login]. Isso mostra o que acontece: o sócio desiste de criar senha.
- **Ninguém me avisa do que vence.** 37 documentos já vencidos e 90 vencendo em 60 dias, sem alerta a ninguém [inv-documentos linhas 66, 72, 196]. Dedetização, AVCB e CRT vencidos podem fechar a minha loja.
- **Outubro não fecha porque falto eu.** 35 lojas sem aprovação do sócio e 68 pendências "com a loja" [inv-premiacao §8, item 2]. Não é má vontade: a aprovação está escondida dentro da página da loja [inv-premiacao §5 "Página da loja"].
- **Reembolso hoje não funciona pelo site**: não há função de criar nem de aprovar [inv-compras-reembolsos-nutra §2, linha 99]. Então continua no WhatsApp.
- **Palavras que não entendo**: "falta Omie", "falta planilha", "baixa", "SC", "em validação", "competência" [inv-pedidos linha 48 e 134; inv-compras §1.3]. O próprio levantamento de mercado aponta isso como anti-padrão nº 9 [pesquisa-mercado §7].

## 2. Vale unificar? Sim, e para mim o que importa primeiro é

1. **Um login só** (e-mail e senha, como já está decidido em premissas.md), com o mesmo e-mail que eu já uso. Sugestão: no dia da virada eu recebo um código de primeiro acesso de 6 dígitos (o modelo que a Premiação já tem, válido por 7 dias [inv-premiacao §3 "Acesso"]) e crio uma senha uma vez. Os logins antigos continuam funcionando até a virada de cada módulo, para eu não ficar sem acesso no meio do mês.
2. **Uma tela "O que precisa de mim"**, juntando todos os módulos. É o padrão nº 2 da pesquisa (TOTVS "Minhas pendências") [pesquisa-mercado §6, item 2] e evita o anti-padrão "uma tela de aprovação por módulo" [§7, item 2].
3. Os módulos em si (Premiação, Pedidos etc.) podem continuar separados por dentro; eu não preciso saber disso.

**Ordem que faz sentido para mim** (só opinião de usuário; a técnica decide a data): primeiro o login único + a tela "O que precisa de mim" mostrando, só para leitura, os itens que já existem (Documentos vencendo, Pedidos com parcela vencida, Premiação aguardando aprovação). Depois Reembolsos (porque hoje nem existe). Depois Compras. Premiação entra no login único só entre o fechamento de um mês e a abertura do seguinte, como já registrado [inv-premiacao §9, linha 277]. Nada de mudar a tela da Premiação enquanto outubro estiver aberto: eu acabei de aprender aquela.

## 3. Minha tela inicial no celular (de cima para baixo)

1. **Topo**: "Olá, [nome]" e, se eu tiver mais de uma loja, um seletor "Todas as minhas lojas / Loja X". Quem tem uma loja só não vê seletor [pesquisa-mercado §4.8]. O que eu escolher vale no site todo (premissa).
2. **Bloco "Aguardando você"** – a primeira coisa, com número e prazo, ordenado pelo que vence primeiro. Uma linha por assunto, em português de gente:
   - "Premiação de outubro da loja Moema: aprovar até 05/12"
   - "2 reembolsos para aprovar – R$ 312,40"
   - "1 compra para aprovar – R$ 4.890,00"
   - "3 pendências da premiação para responder"
   Cada linha abre direto o item, não um menu.
3. **Bloco "Atenção na sua loja"** (não depende de mim, mas eu preciso saber):
   - "Dedetização vence em 12 dias – envie o novo certificado" (com botão Enviar foto/PDF)
   - "1 documento recusado: motivo – reenviar"
   - "2 boletos de laboratório vencidos – R$ 1.240,00" (o sistema de Pedidos já calcula parcela vencida: 20 hoje [inv-pedidos linha 48])
   - "Contagem do Nutra de dezembro: abre 01/12"
4. **Bloco "Acompanhando"** (só informação, recolhido): pedidos ao laboratório em andamento com etapa e rastreio, reembolsos que eu aprovei e ainda não foram pagos, resultado do mês da premiação.
5. **Barra inferior fixa** com 4 itens: Início · Minhas lojas · Documentos · Mais. A Premiação já faz isso no celular [inv-premiacao §5 "Casca"].

Regra de ouro: **se não há nada, a tela diz "Nada aguardando você"**, e não um painel cheio de zeros.

## 4. Fluxo de aprovação no celular

Mesmo jeito para premiação, reembolso e compra (padrão nº 3 da pesquisa, uma única máquina de aprovação [pesquisa-mercado §6]):

1. Toco na linha "2 reembolsos para aprovar".
2. Abre uma ficha por item, em uma tela que rola: **quem pediu · para quê · valor (R$ com centavos) · foto do comprovante aberta na tela** (premissa: documento abre para visualizar) · o que a regra diz ("dentro do limite" ou "acima do limite de R$ X").
3. Dois botões grandes no fim: **Aprovar** e **Não aprovar**. "Não aprovar" exige escrever o motivo (anti-padrão nº 4 [pesquisa-mercado §7]). Um terceiro, menor: **Pedir explicação**, que devolve ao solicitante sem reprovar (o Reembolsos já prevê "complemento" [inv-compras §2.3]).
4. Confirmação com o resumo: "Você aprovou R$ 312,40 – Fulano – 27/11 14:32". Fica no histórico, e o que foi aprovado não se perde (premissa).
5. **Aprovar vários de uma vez** só quando forem iguais e dentro da regra ("Aprovar 5 reembolsos dentro do limite").

**Premiação**: hoje o sócio aprova os números da loja uma vez e o mês aprova sozinho [inv-premiacao §7]. No celular eu quero ver só: total da loja, quantas pessoas, maior e menor prêmio, quantas pendências ainda abertas, e o botão "Aprovar os números da loja". Os detalhes (memória de cálculo por pessoa) ficam a um toque, não na frente. Se a aprovação "cair" por recálculo [inv-premiacao §3 "Loja"], quero aviso claro: "Sua aprovação foi desfeita porque o total mudou de R$ A para R$ B – aprove de novo".

**Compras**: o sócio é quem dá a decisão final [inv-compras §1.3]. Eu preciso ver as cotações lado a lado (fornecedor, preço, prazo) e qual foi escolhida, não a cadeia toda.

**Aviso por e-mail ou WhatsApp com link**: aceito, mas o link deve abrir o sistema já logado ou pedindo a senha, nunca aprovar sem login. A pesquisa só recomenda aprovar sem login para valor baixo e dentro da regra [pesquisa-mercado §4.7]; eu prefiro um toque a mais e segurança. Um resumo por dia, não uma mensagem a cada item.

## 5. O que NÃO pode aparecer para mim

- **Nada de outra loja que não é minha**, nem em total da rede, ranking com nome, lista de sócios ou exportação. É o pior erro possível num sistema de franquia [pesquisa-mercado §7, item 15]. Hoje o "Quadro do mês" tem a visão "Por sócio" [inv-premiacao §5 "Início"]: para mim ela não pode existir.
- **Orçamento e % da meta da premiação**: hoje a Premiação já esconde de mim (`semOrc`, `semPct`) [inv-premiacao §4]. Isso tem de ser mantido no sistema único (regra de "nenhuma funcionalidade perdida" vale para restrições também).
- **Observação interna da Operações** em documentos (o painel atual já esconde [inv-documentos linha 42]).
- **Telas de configuração, importação, conflitos de importação, robôs, conferência NF × pedido, "3 baixas"**. Para mim a parcela é só "paga", "a pagar até dd/mm" ou "vencida".
- **Nome de paciente** (Pedidos já usa só código [inv-pedidos linha 146]).
- **Jargão**: substituir "competência" por "mês", "SC" por "pedido de compra", "baixa" por "pago", "falta Omie" por "aguardando o laboratório confirmar".
- **Mensagens técnicas de erro** e o "Ver como" da Operações.

## 6. O que me assusta

- Perder o histórico de aprovações e documentos que já enviei ao trocar de sistema. Peço que a tela mostre "documento já enviado em dd/mm" e que eu **nunca** precise reenviar o que já está lá (premissa de anexar uma vez).
- Aprovar algo e o valor mudar depois sem eu saber.
- Ter que reaprender tudo de novo a cada fase. O layout da Premiação (que já começo a conhecer) deve ser o mesmo em tudo.
- Senha esquecida sem saída: precisa de "Esqueci a senha" que funcione sozinho, sem depender da Operações.

## 7. Análise crítica do pedido (tema 9)

- **"Sócio vê o que Operações vê, restrito às lojas dele"** (premissas.md): se for literal, eu recebo as mesmas tabelas densas da Operações (Quadro do mês com 12 colunas [inv-premiacao §5]) e me perco. Alternativa: os **mesmos dados** acessíveis, mas a **tela padrão** do sócio é a de pendências acima, com detalhe sob demanda. E ressalva: os itens da seção 5 (orçamento, % da meta, obs. interna) continuam escondidos, como já é hoje.
- **"Um layout único para computador e celular"**: ok, desde que "tabelas viram cartões no celular" [inv-premiacao §5 "Padrões gerais"] seja obrigatório em todos os módulos e os botões de aprovar fiquem no alcance do polegar.
- **Aprovar tudo** gera fadiga e eu acabo aprovando no automático [pesquisa-mercado §7, item 3]. Melhor: eu só aprovo exceções (acima do limite, fora da regra); o resto eu apenas vejo. A Operações define os limites.
- **Aprovação tácita** (prazo sem resposta = aprovado), ainda em aberto [inv-premiacao §9]: aceito, desde que eu receba aviso antes ("se não responder até 05/12, vale o valor do sistema, R$ X"), como o texto de pendência já faz [inv-premiacao §5 "Pendência"].
- **Risco de virada**: trocar o login de 7 sistemas no mesmo dia em que abre o Nutra (01/12) ou fecha outubro confunde todo mundo. Virada de login fora dessas datas, com aviso por e-mail uma semana antes.

## 8. Onde a IA do Claude me ajuda e onde não

- **Ajuda**: ler a foto do comprovante de reembolso ou do certificado de dedetização e preencher valor e validade para eu só conferir (padrão "sugere, humano confirma" [pesquisa-mercado §5, linha IA]).
- **Não**: decidir aprovação por mim, nem ser a tela principal em forma de chat [pesquisa-mercado §7, item 14].
