# Rodada 2 – Crítica e revisão do SÓCIO / FRANQUEADO LEIGO

Quem fala: dono de 1 a 3 clínicas, uso quase só o celular. Pergunta de teste para cada proposta: "eu entenderia isso sozinho, sem treinamento, numa tela de celular?". As fontes são as propostas r1-*.md e os inventários.

## A. CRÍTICA

### r1-arquiteto
- **Eu ficaria com dois logins por meses.** A Premiação só entra no login único na Fase 8 (r1-arquiteto §6), e a Premiação é justamente onde eu aprovo todo mês. Até lá eu continuo com a senha da Premiação e mais uma senha nova. É o que mais me faz desistir: hoje só 6 de 19 sócios criaram senha na Premiação (inv-premiacao §4).
- O ponto bom: a migração "no primeiro acesso", em que eu entro com a senha que já tenho (r1-arquiteto §6, último parágrafo). Ela tem de valer para todos os módulos.
- "Ver como" e `modulo_liberado` não aparecem para mim. Tudo bem, desde que continue assim.

### r1-designer
- **Menu grande demais para mim.** O sócio veria "os mesmos itens que a Operações, menos Configurações e Cadastros" (r1-designer §4). São 7 módulos com submenus, e só Compras tem 7 itens (Solicitações, Cotações, Compras, Recebimentos, Notas e contas a pagar...). Eu me perderia ali.
- **Jargão na tabela de situação**: "falta planilha" e "falta Omie" (em vermelho), "protocolo", "substituído" (r1-designer §2). Se esses rótulos chegarem a mim, eu acho que o problema é meu. Preciso de uma tradução para o sócio, por exemplo "aguardando o laboratório".
- O seletor de unidade é "agrupado por sócio" (r1-designer §1). Para mim ele não pode mostrar o nome de outro sócio, nem as lojas dele.
- Na aprovação, **Devolver e Reprovar lado a lado** (r1-designer §3.6) confundem: eu não sei a diferença. Para mim os textos teriam de ser "Pedir para corrigir" e "Não aprovar".
- Concordo com a barra inferior de 5 posições, com "Pendências" fixa (r1-designer §1), com as abas "Aguardando você" e "Aguardando outros" (§3.5) e com o comprovante abrindo na tela (§3.7). Esses pontos eu adoto.

### r1-operacoes
- **"O sócio vê a mesma tela restrita às lojas dele"** (r1-operacoes §3). Essa tela tem os contadores Pagamentos, Divergências de pedido (PV/NF) e Nutra duplicada, e a coluna "Quem resolve". Quase nada disso é tarefa minha. Se eu vir "Divergências de pedido (12)", vou ligar para a Operações achando que errei.
- Em compensação, a cobrança automática de documento vencido por e-mail (r1-operacoes §5, item 1) me ajuda muito.

### r1-financeiro
- As palavras "título", "programado", "baixa", "glosa" e "alçada" (r1-financeiro §2.1 e §2.4) estão no anti-padrão nº 9 (pesquisa-mercado §7). Para mim: "conta", "agendado para dd/mm", "pago", "valor recusado pelo financeiro", "limite".
- Concordo que o sócio aprove o reembolso pela pendência no celular (§2.4) e que a regra das 3 baixas não seja imposta a reembolso (§9b).
- Sobre Compras: "entender por que ninguém usou" (§2.5) é a pergunta certa. Com 7 etapas até chegar em mim (inv-compras §1.3), eu também não usaria.

### r1-rh
- A ficha da pessoa tem 6 abas (Vínculos, Lotações, Registro profissional, Pagamento, Acessos, Histórico; r1-rh §5.6). Isso serve à Operações. Eu só preciso de nome, cargo, loja e o prêmio.
- O primeiro acesso "por CPF + código" (r1-rh §6) é bom para o colaborador. Para mim, que já tenho e-mail cadastrado, basta o e-mail.

### r1-seguranca
- **"MFA recomendado" para o sócio** (r1-seguranca §2) e "MFA por autenticador" (§3): um aplicativo autenticador de 6 dígitos me faria desistir no primeiro dia. Não sei instalar e, se trocar de celular, fico trancado do lado de fora.
- **Sessão de 12 h** (§3): no celular eu teria de digitar a senha todo dia. Hoje o Documentos mantém a sessão por 30 dias (inv-documentos §A), e é por isso que lá eu entro.
- Concordo muito: CPF mascarado, nenhuma loja de outro sócio, e o orçamento e o % da meta escondidos (§2, linha Sócio).
- Login do POPs com CNPJ e sem senha: concordo que acabe, desde que ele vire o mesmo login que eu já tenho, e não mais um.

### r1-dados
- Robôs 1 vez ao dia (§7): eu preciso ver "atualizado em dd/mm hh:mm" em cada informação de pedido. Sem isso, acho que o sistema travou.
- Código "U001" (§1): para mim a loja aparece sempre pelo nome.
- As filas "Unidade não reconhecida" e a tela "Rotinas" ficam só para a Operações.

### r1-diabo
- Concordo com o risco 15 (o sócio ver a loja de outro) e com o teste do "ver como" usando cada perfil real antes de liberar.
- O risco 9 diz "login novo para todos de uma vez não". Concordo, mas login por fases não pode significar uma senha nova a cada fase.

### Conflitos entre propostas que me afetam
1. **Tela inicial do sócio**: Operações quer a tela dela restrita às minhas lojas. O designer propõe "Aguardando você / Aguardando outros". Eu proponho a tela por blocos. **Fico com a do designer**, com o filtro "é do sócio" aplicado.
2. **Login**: o arquiteto põe a Premiação na Fase 8. A segurança quer MFA e sessão de 12 h. Eu quero uma senha e o celular lembrado.
3. **Vocabulário**: o designer e o financeiro usam termos de sistema; a pesquisa (§7.9) proíbe esses termos para o sócio. É preciso **um dicionário do sócio** valendo em todos os módulos.
4. **Menu**: o designer dá ao sócio quase tudo o que a Operações vê (r1-designer §4), enquanto a premissa diz "sócio vê o que Operações vê". Para mim, o padrão é ver só o que é meu, e o resto fica em "Mais".

## B. REVISÃO (o que mudou e por quê)

1. **Tela inicial**: adoto as duas abas do designer. "Aguardando você" vem aberta, com: aprovar premiação, reembolsos e compras; responder pendência; reenviar documento recusado ou vencendo. "Acompanhando" mostra pedidos, boletos e reembolsos em andamento. Sai o meu "Atenção na sua loja" como bloco próprio, porque repetia informação (premissa). Mudei porque o designer já resolve o mesmo problema sem criar uma terceira tela.
2. **Menu do sócio no celular**: Pendências · Minhas lojas · Documentos · Pedidos · Mais. No computador, os demais módulos ficam dentro de "Mais". Mudei de 4 para 5 itens para seguir a barra do designer.
3. **Login**: aceito que seja feito por fases (diabo, arquiteto). A condição é usar **o mesmo e-mail e a mesma senha** que eu já uso, aproveitados no primeiro acesso, e ter a Premiação no login único logo depois do fechamento de novembro, não por último. Peço também: celular lembrado por 30 dias; "Esqueci a senha" que funcione sozinho; e, no lugar de aplicativo autenticador, código por e-mail só quando eu entrar por um aparelho novo. O MFA por app fica para Operações, financeiro e contabilidade. Mudei porque a segurança tem razão em proteger quem mexe em dinheiro da rede, mas o sócio aprova só a própria loja.
4. **Dicionário do sócio**: um único arquivo de rótulos que todos os módulos usam, com exemplos como competência → mês; falta Omie / falta planilha → aguardando o laboratório; título → conta; baixa → pago; glosa → valor recusado; Devolver → Pedir para corrigir. Esse item é novo, nasce da crítica a designer e financeiro, e o teste dele é eu ler a tela sem perguntar nada.
5. **Aprovação**: os três botões ficam "Aprovar", "Pedir para corrigir" e "Não aprovar" (os dois últimos com motivo). Aprovo só o que passa do limite que a Operações definir, e o resto eu só vejo (financeiro e pesquisa §7.3). Aprovação em lote só para itens dentro da regra. O link por e-mail abre a ficha, sem aprovar direto.
6. **"Atualizado em dd/mm hh:mm"** em toda informação que vem de robô (veio de r1-dados).
7. **Nunca aparecer** (mantido): outras lojas e outros sócios, orçamento, % da meta, observação interna, nome de paciente, telas de importação, rotinas, conflitos e divergências de PV/NF.
8. **A cada fase nova**, um aviso de uma tela: "o que mudou para você" (novo). Assim eu não preciso de treinamento.
