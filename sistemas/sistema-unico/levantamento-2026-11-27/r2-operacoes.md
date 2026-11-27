# Rodadas 2 e 3 – OPERAÇÕES: crítica e revisão

Fontes: r1-arquiteto (ARQ), r1-designer (DES), r1-socio (SOC), r1-financeiro (FIN), r1-rh (RH), r1-seguranca (SEG), r1-dados (DAD), r1-diabo (DIA), r1-operacoes (OP), inventários (IP = inv-pedidos, ID = inv-documentos, IPR = inv-premiacao, IC = inv-compras-reembolsos-nutra). Somente leitura.

## A. CRÍTICA

### A.1 Onde cada proposta piora o meu dia

| Proposta | Onde me prejudica | Evidência | O que eu peço |
|---|---|---|---|
| **ARQ** | O alerta de vencimento e o login individual do Documentos ficam para a **Fase 6**. Até lá os 37 vencidos e os 90 que vencem em 60 dias continuam sem aviso, e sigo assinando tudo como "Operações". A Fase 0 "até 30/11" tem 3 dias e não entrega nada para mim | ARQ §6; ID §A Números | Rotina de vencimento lendo `public.itens` já na Fase 1, sem migrar o módulo |
| **DES** | (1) Ficha "página própria, nunca gaveta" e visualizador "em página cheia": se a decisão e o documento ficam em páginas diferentes, cada pendência custa ida e volta. Nas 121 divergências de pedido, isso dobra os cliques. (2) Contador "só no menu lateral" tira da tela os números que eu uso para planejar a manhã | DES §3.4, §3.5, §3.7 | A página da pendência já é o visualizador: documento a 70% e decisão a 30%, com "Próxima" para seguir na fila |
| **SOC** | Trocar "falta Omie" por "aguardando o laboratório" é bom para o sócio, mas para mim junta 2 situações diferentes (falta Omie 40, falta planilha 61), e cada uma pede uma cobrança diferente | SOC §5; IP §1 | Mesmo dado, rótulo por papel: o sócio vê a versão simples e eu vejo a precisa |
| **FIN** | (1) Uma tela "Contas a pagar" separada com abas que repetem a minha fila. (2) A Fase 3 move as 541 parcelas para `financeiro.titulo` enquanto o Pedidos ainda está virando: risco de parar o que funciona, e nenhum ganho para mim | FIN §3; IP §1 | A lista de contas a pagar existe, mas a pendência aponta para ela. A Fase 3 do FIN só depois do antigo desligado |
| **RH** | E-mail e PIX "confirmados por Operações" para cerca de 400 colaboradores (0 de 697 têm e-mail), mais o casamento manual de 48 prescritores e 61 RTs: isso vira trabalho meu, um a um | RH §1, §5.4, §6 | Fila de confirmação em lote com sugestão (CRBM e CPF primeiro) e "Confirmar selecionados". E-mail vindo da Bizneo antes de pedir à pessoa |
| **SEG** | (1) MFA obrigatório para Operações: na rotina de várias abas e aparelhos, pedir código a toda hora me atrasa. (2) Segregação "Operações não aprova o que lançou": somos 2 usuários de Operações (IPR §3), então reembolso e compra podem travar sem ninguém para aprovar. (3) Trocar o login dos POPs (117 logins, 42 e-mails) gera chamado para mim | SEG §2, §3; ID §C | MFA sim, mas sem pedir código em todo login no mesmo aparelho (se a ferramenta não permitir, sessão de 12 h). Segregação com outro aprovador definido: o sócio da unidade. Troca dos POPs por códigos de primeiro acesso gerados em lote |
| **DAD** | A fila "Unidade não reconhecida" e a revisão dos 52 números DH (43 + 4 + 5) caem em mim. Aceito, mas uma vez só. Robô 1 vez ao dia sem "Atualizar agora" me faz voltar ao antigo, que lê de hora em hora | DAD §1, §4, §7 | O botão "Atualizar agora" e a data da última leitura na tela, como DAD e DIA já propõem |
| **DIA** | (1) "Antigo em leitura por 30 dias" após cada virada: se houver digitação nos dois, eu trabalho dobrado. (2) "Lista de aceite 100% verde" antes de desligar pode prender o Pedidos antigo por meses, e o próprio DIA §4 aceita "função no antigo por enquanto, com data". (3) Virar o Nutra no "meio de dezembro" cai com a rodada aberta | DIA §2 riscos 1, 5, 9 | Antigo só em leitura, nunca digitação dupla. Aceite "verde ou com data marcada". Nutra só depois do prazo da rodada de dezembro |

### A.2 Conflitos entre propostas (para o conselho decidir)

1. **"Operações pode tudo" contra a segregação** (SEG §11, FIN §2.1, IC §1.3). Minha posição: a segregação vale só onde há dinheiro saindo e um segundo aprovador real (compra e reembolso, com o sócio aprovando). Em pedido ao laboratório não precisa: as 3 baixas já são um controle externo, e "baixa sem comprovante" só vale com a Omie baixada (premissas). Fora disso, Operações pode tudo, com justificativa.
2. **MFA** (SEG §3, inv-pedidos §5 já exige para admin) contra a fluidez: aceito, com a condição acima.
3. **Ordem das fases**: ARQ põe Documentos em 6º, SEG em 2º, DIA depois do Nutra, DES em 2º. O alerta de vencimento **não depende da ordem**: DAD §6 já propõe a rotina de vencimentos às 07:40 como nova. Proposta de desempate: a rotina de vencimento e a fila de pendências entram na Fase 1, e o módulo Documentos é migrado depois.
4. **Virada do Nutra**: DIA quer o meio de dezembro, ARQ e DAD querem depois do fechamento da rodada e antes de 01/01. Fico com ARQ e DAD (rodada aberta não migra).
5. **Contador na tela inicial** (OP r1) contra **contador só no menu** (DES): aceito o DES, desde que o menu mostre o número de cada módulo e as abas filtrem a fila.
6. **Tela do sócio**: SOC pede uma tela simplificada, e a premissa diz "sócio vê o que Operações vê". Solução: os mesmos dados e a mesma fila, com rótulos simples por papel e sem orçamento nem % da meta (IPR §3).
7. **Quem é o dono do contas a pagar**: FIN quer o próprio módulo, ARQ quer `nucleo.pendencia`. As duas coisas cabem juntas: a lista pertence ao FIN, e a pendência é publicada no núcleo apontando para ela.

### A.3 O que as outras propostas me dão e eu adoto
O FIN mostrou que o gargalo é a **planilha do laboratório: R$ 661.463,51 em 61 parcelas**, e isso passa à frente na minha fila. Também adoto o alerta "Omie sem dados há 2 dias" (FIN e DIA), a lixeira e o autor real em cada ação (SEG), o "Esqueci a senha" sem passar por mim (SOC) e o `modulo_liberado` para voltar atrás sem novo deploy (ARQ).

## B. REVISÃO (o que mudou e por quê)

**1. Tela inicial.** Fica a fila única "Aguardando você / Aguardando outros", com 7 colunas: Prazo · Módulo · Unidade · O que fazer · Valor · Situação · Ação. *Mudou:* saiu a linha de contadores e os números foram para o menu (DES §3.5), para não repetir informação. *Mudou:* ordenação por prazo vencido, depois por valor em R$. Assim a "falta planilha" (R$ 661.463,51) aparece antes de itens pequenos (FIN §1).

**2. Resolver na pendência.** Clicar na linha abre a página da pendência, que já é o visualizador: documento à esquerda, e à direita os dados, no máximo 2 decisões e o botão "Próxima". *Mudou:* deixou de ser um painel, para seguir a regra de não ter gaveta nem rolagem interna (DES §1, §3.7) sem me fazer ir e voltar.

**3. Rótulo por papel.** A situação é uma só no banco, com dois rótulos: "falta Omie" e "falta planilha" para mim, "aguardando o laboratório" para o sócio. *Por quê:* atender o SOC sem perder a precisão de que eu preciso.

**4. Fases revisadas.**
- **Fase 1:** núcleo em leitura, login no Pedidos novo e a fila lendo `v_parcela`, `public.itens` (validade) e as divergências. Entram já 2 rotinas: vencimento de documentos (60/30/0 dias, com e-mail ao responsável) e cobrança diária ao laboratório, que eu aprovo com 1 clique.
- **Fase 2:** Pedidos completo e desligamento do antigo, com o aceite "verde ou com data".
- **Fase 3:** Nutra, depois do prazo da rodada de dezembro.
- **Fase 4:** Documentos e POPs com login individual.
- **Fase 5:** Reembolsos e Compras.
- **Fase 6:** Premiação, com autorização.

*Mudou:* o alerta de documento já não espera o módulo (conflito 3).

**5. Segregação e MFA.** Aceito MFA para Operações, sem pedir código em todo login no mesmo aparelho. Aceito "não aprovar o que eu mesma lancei" em compra e reembolso, com o sócio da unidade como segundo aprovador. Nos demais fluxos, Operações pode tudo, com justificativa. *Por quê:* SEG tem razão no risco, mas sem um segundo aprovador definido o fluxo para.

**6. Filas de confirmação em lote.** Unidade não reconhecida (DAD), casamento de RT e prescritor (RH), os 52 números DH (DAD) e o e-mail dos colaboradores (RH): tudo entra como pendência, com a sugestão já preenchida e "Confirmar selecionados". *Por quê:* sem lote, o cadastro único vira semanas de digitação para mim.

**7. Robôs.** Rodam 1 vez ao dia, com "Atualizar agora" e a data da última leitura em cada tela. Há alerta se a Omie ficar 2 dias sem dados. *Novo*, vindo de DAD, FIN e DIA.

**8. Convivência com o antigo.** Depois de cada virada, o antigo fica 30 dias só em leitura, com a digitação bloqueada. *Mudou:* aceito o período do DIA, mas sem digitação dupla.

**9. O que se mantém.** Tudo resolvido na pendência, ações em lote (cobrar o laboratório nas 101 parcelas, cobrar as 37 unidades), IA só sugerindo, Premiação intacta e 01/12 rodando no legado (receitas e Nutra), com conferência minha no mesmo dia pelo painel por rodada (IC §6.1).
