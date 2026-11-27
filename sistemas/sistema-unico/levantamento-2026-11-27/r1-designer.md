# R1 — Designer de UX/UI de sistemas de gestão: proposta

Siglas: **IP** = inv-premiacao.md, **IPd** = inv-pedidos.md, **ID** = inv-documentos.md, **IC** = inv-compras-reembolsos-nutra.md, **PM** = pesquisa-mercado.md. **Pn-css** = `sistemas/pedidos/web/app.css` (Pedidos novo, lido no repositório).

## 0. Ponto de partida medido
- **O que se copia da Premiação**: menu lateral navy #1B3A4B com item ativo dourado #C8A96E; cabeçalho com seletor; linha "Falta para aprovar" clicável; 4 cartões; tabela que abre a ficha; ficha com o histórico de correções sempre por último; pendência em blocos fixos; selo de situação com texto; tabela que vira cartão no celular (IP §5).
- **O que não se copia (IP §5 e §7.6)**:
  - 24 tamanhos de letra, alguns de 10 e 11 px.
  - Rolagem interna em 5 áreas.
  - 3 cinzas reprovados no contraste (#6B7C8A, #D5DCE2).
  - O filtro só vale no Início.
  - O selo de pendências do menu está quebrado.
  - O Quadro do mês tem 12 colunas, e a coluna "Pendências com Quem resolve e prazo" junta 3 dados num campo. O cartão "Faturamento líquido (com bruto e cancelamentos)" junta 3 números. As duas coisas violam a premissa "dois dados no mesmo campo".
- **O Pedidos novo tem os mesmos vícios (Pn-css)**:
  - 14 tamanhos (de 11 a 28 px).
  - A ficha é gaveta lateral com rolagem própria (`.f-corpo{overflow-y:auto}`, linha 120). O histórico tem `max-height:340px;overflow-y:auto` (linha 308).
  - A navegação é por abas no topo (`nav.abas`), não por menu lateral.
  - Para aproveitar: as 5 cores semânticas já em tokens, com tema escuro.

## 1. A casca (igual em todos os módulos)

| Zona | Computador (≥ 861 px) | Celular (≤ 860 px, o mesmo corte da Premiação) |
|---|---|---|
| Menu lateral | Fixo, 216 px. Entre 861 e 1279 px recolhe para 64 px (ícone e dica). Dois níveis: o módulo abre o submenu, com um só aberto por vez | Barra inferior com 5 posições: **Pendências** (fixa), 3 módulos do perfil e **Mais** (fixa) |
| Cabeçalho (56 px, preso no topo) | Seletor de unidade · seletor de competência (só nos módulos por mês) · usuário (Trocar senha, Sair) | Uma linha: seletor de unidade, que abre em tela cheia, e usuário |
| Página | Título (20 px) + uma ação primária à direita, na mesma linha. Margem de 24 px | Título; a ação primária vira botão no fim do conteúdo. Margem de 16 px |

**Seletor de unidade (o filtro global)**
- Seleção múltipla, com busca e agrupada por sócio. A primeira opção é "Todas as minhas unidades" (PM §4.8 e §6.1).
- Quem tem uma unidade só não vê o seletor.
- Fica gravado **no banco, por usuário**, e espelhado na URL, para que o link compartilhado leve o filtro (Polaris, PM §4.2). Não se usa localStorage, porque o filtro precisa valer em qualquer aparelho.
- O botão mostra o estado ("3 unidades"). Ao restringir, ganha fundo de informação e um "Limpar". Esse é o aviso de filtro ativo da NN/g (PM §4.5). Não há faixa extra, para não repetir a informação.
- **Competência (mês)** só aparece em Premiação, Contagem de estoque e nos relatórios mensais. As listas de Pedidos, Compras e Reembolsos usam filtro de data dentro da própria lista. Misturar o "mês" de cada módulo num seletor global criaria regras ocultas.

**Regras da casca**
- A página inteira rola. **Nenhum elemento tem `overflow:auto` no eixo vertical.** Gaveta, modal com conteúdo longo e lista com altura máxima ficam proibidos.
- Rolagem horizontal é proibida em 1366 px e em 390 px.
- Só podem ficar presos no topo o cabeçalho e a barra de ações em lote.

## 2. Tipografia e cores (o kit)

**Tipografia: Nunito Sans (a da Premiação), 4 tamanhos, 2 pesos**

| Tamanho | Uso |
|---|---|
| 20 px / 600 | Título da página e número do cartão |
| 16 px / 600 | Título de seção na ficha e nome do registro no cabeçalho da ficha |
| 14 px / 400 e 600 | Corpo, tabela, campos e botões |
| 12 px / 400 e 600 | Rótulo de campo, cabeçalho de coluna, selo, legenda e linha do tempo. É o mínimo absoluto |

- Os números usam `tabular-nums`. R$ vai alinhado à direita e sempre como `R$ 1.234,56`. Valor negativo leva o sinal "−", nunca só a cor.
- Datas vão como dd/mm/aaaa, e dd/mm/aaaa hh:mm na linha do tempo.
- "Pode reduzir fonte" para caber: o piso é 12 px. Abaixo disso o problema é de colunas, não de fonte.

**Cores neutras (corrigindo os reprovados da IP)**
- Texto: #1F2A33.
- Rótulo: #55636F. Troca o #6B7C8A; é preciso medir ≥ 4,5:1 sobre o branco no teste.
- Borda de campo: #8A96A3. Troca o #D5DCE2; é preciso medir ≥ 3:1. A borda de divisória fica em #DCE2E8.
- Fundo da página: #F3F5F7. Superfície: #FFFFFF.
- Navy e dourado só no menu e no logotipo. O dourado não aparece sobre o branco.
- Os botões primários usam o navy.

**Situação: 5 cores fixas, com texto sempre** (Atlassian, PM §4.3 e §6.14; os tokens já existem no Pn-css)

| Cor | Tokens | Significa | Exemplos (vocabulário real dos inventários) |
|---|---|---|---|
| Neutro | #4F5C69 / #E9EDF1 | Ainda não começou ou está encerrado sem efeito | Rascunho, cancelada, não se aplica, substituído |
| Informação | #1D5A85 / #E2EDF6 | Em andamento, com outra pessoa | Enviada, em cotação, em trânsito, aguardando financeiro, protocolo |
| Sucesso | #1B6E41 / #E0F1E6 | Concluído | Aprovado, quitada, entregue, paga, vigente |
| Atenção | #855400 / #FBEFD6 | Precisa de ação, ainda dentro do prazo | Aguardando você, vence em 60 dias, falta planilha, justificada |
| Perigo | #A8231A / #FBE7E5 | Vencido, recusado ou bloqueado | Vencida, recusado, reprovada, conflito, falta Omie |

- O selo é um texto de 12 px dentro de uma cápsula de 20 px de altura.
- Cada registro tem **um** selo de situação. Uma segunda dimensão, como a situação de pagamento do pedido, vai numa coluna própria.
- Ícones lineares de 20 px, só no menu e em botão de ícone com dica. Sem emojis e sem ilustração decorativa.
- O espaçamento segue uma régua de 4 px (Fluent, PM §4.4).

## 3. As telas-padrão

### 3.1 Lista (tabela)
- **Ordem na página**: título com a ação primária → linha "Falta resolver" (opcional; itens clicáveis, como o `impedimentos` da IP) → cartões (opcional) → abas de visões salvas → barra de filtros → tabela → "Mostrar mais 50".
- **Orçamento de colunas**: em 1366 × 768 a 100%, com o menu de 216 px e as margens, sobram cerca de 1.100 px. Isso dá **no máximo 8 colunas**. O que passar disso vai para a ficha. O Quadro do mês de 12 colunas é o contraexemplo.
- **Linhas**:
  - Uma densidade só, com linha de 40 px. É o meio-termo entre o short (32) e o default (48) do Carbon (PM §4.1). Uma segunda densidade fica para depois.
  - Uma linha de texto por célula, com reticências e o texto inteiro na dica.
  - Um dado por coluna.
- **Primeira coluna**: o identificador (nome ou número), em 600. A linha inteira abre a ficha.
- **Situação**: sempre a penúltima coluna.
- **Última coluna**: no máximo **uma** ação na linha, a do próximo passo de quem vê (por exemplo, "Aprovar" ou "Responder"). As demais ações ficam só na ficha.
- **Total**: em linha de rodapé, nunca repetido em cartão.
- **Lote**: caixa de seleção na primeira coluna. Ao marcar, a barra presa no topo mostra "3 selecionados · Aprovar reembolsos · Exportar", com rótulos de verbo e substantivo (Polaris).
- **Celular**: cada linha vira um cartão com o identificador e o selo na 1ª linha e no máximo 3 campos rotulados abaixo. A ação da linha vira botão no rodapé do cartão.
- **Vazio**: frase do que filtrar ou fazer, sem ilustração. **Erro**: mensagem e "Tentar de novo".

### 3.2 Filtros
- Ficam numa barra: busca + até 3 filtros visíveis + "Mais filtros", que abre um painel que empurra a tabela para baixo e não flutua.
- Cada filtro ativo vira uma etiqueta removível. Tudo fica na URL.
- As **visões salvas em abas** são definidas pela Operações por módulo, por exemplo Pedidos: "Aguardando NF · Boletos vencendo · Sem rastreio · Recebidos" (PM §4.2).
- O filtro global (a unidade) **nunca** se repete na barra local.

### 3.3 Cartões de indicador
- No máximo 4 por linha, e 2 × 2 no celular.
- Cada cartão tem um rótulo (12 px), um número (20 px) e no máximo uma comparação (12 px, por exemplo "de 53").
- O clique leva à lista já filtrada.
- O cartão não pode repetir o total da tabela de baixo, e não pode juntar bruto, líquido e cancelamento: são três cartões ou um só.
- Vale só como resumo. Para comparar, usa-se a tabela (NN/g, PM §4.5).

### 3.4 Ficha de registro (página própria, nunca gaveta)
1. **Cabeçalho**: nome ou número (16 px), selo de situação, até 4 dados de identificação (rótulo sobre valor) e ações à direita. As ações são uma primária, até duas secundárias e "Mais" para o resto, com as ações destrutivas sempre no "Mais".
2. **"O que falta"**: as pendências deste registro, com quem resolve, numa coluna, e o prazo, em outra.
3. **Seções em ordem fixa**: Dados → Itens e valores → Documentos (miniaturas que abrem o visualizador) → Ligações (por exemplo, pedido ↔ NF ↔ parcelas, IPd §4) → **Histórico** (sempre por último, como na IP: quem, quando, campo, de → para, justificativa).
4. **Editar**: a edição é feita na própria seção. Salvar uma correção abre o campo "Justificativa" obrigatório (premissa). O sócio vê "Pedir correção" no lugar de "Editar", como no modelo `PEDE` da IP §2.
5. **Leiaute**: no computador ≥ 1280 px, Dados ficam em 2 colunas; o resto ocupa 1 coluna. No celular, tudo em 1 coluna.

### 3.5 Central de pendências (a tela inicial de todos os perfis)
- Junta as pendências de todos os módulos (PM §4.6 e §6.2).
- Tem duas abas: **"Aguardando você"** (padrão) e "Aguardando outros".
- Colunas: Prazo · Módulo · Unidade · O que fazer · Valor · Situação · [ação].
- A ordem é por prazo vencido primeiro, depois pelo prazo, depois pelo valor.
- O contador por módulo fica **só no menu lateral**, o que conserta o selo quebrado da IP. A tela não repete esse número em cartões.
- A linha "Falta para aprovar outubro" da Premiação entra aqui como itens normais, cada um apontando para a fila da loja.
- As áreas sem usuário (Marketing, RH: 10 + 1 pendências, IP §7.2) aparecem com o rótulo da área na coluna "O que fazer", na fila da Operações.

### 3.6 Aprovação
- **Uma máquina de estados para todos** (PM §6.3): Rascunho → Enviado → Aguardando [papel] → Aprovado ou Devolvido ou Reprovado → Concluído ou Pago. Ela já existe quase igual em Compras e Reembolsos (IC §1.3 e §2.3).
- **Painel de decisão** no topo da ficha, abaixo do cabeçalho. Ele mostra:
  - O que se aprova: valor, unidade e o documento principal aberto ao lado.
  - Os botões **Aprovar** (primário), **Devolver** e **Reprovar**. Devolver e Reprovar têm motivo obrigatório, e o item devolvido volta para Pendentes (Omie, PM §1.1).
  - Para a Operações, o botão "Aprovar em nome de [sócio]", com motivo, como na IP §2.
- **Aprovação em lote**: só pela lista, e só para itens dentro da alçada. Antes de executar, aparece um resumo com "12 itens · R$ 4.310,20".
- **O que foi aprovado fica congelado**: a ficha mostra "Aprovado em dd/mm por X — valores aprovados" com a cópia daquele momento. Se algo mudar depois, aparece o selo de Perigo "aprovação caiu", como já faz a IP com `fn_aviso_aprovacao_caiu`.

### 3.7 Visualizador de documento
- Abre em **página cheia**, com URL própria e o botão "Voltar ao registro". Não é um modal com rolagem: o próprio documento rola a página.
- **No computador** são 2 colunas: o documento ocupa cerca de 70% (PDF renderizado página a página, ou a imagem), e o painel de cerca de 30% mostra:
  - Tipo, unidade e CNPJ.
  - Emissão e validade, com um selo de validade em 4 estados: válido, 60 dias, 30 dias e vencido (PM §6.11).
  - Origem (quem enviou e quando).
  - **"Usado em"**: a lista dos registros que reaproveitam este arquivo. Isso cumpre a premissa "anexar uma vez".
  - Revisão (Aprovar ou Recusar, com motivo), com as mesmas regras da §3.6.
- **No celular** o painel fica abaixo do documento.
- Baixar é uma ação secundária. Também há "Anterior" e "Próximo" entre os documentos do mesmo registro.
- Quando a leitura automática preencheu campos, cada campo mostra "lido do documento — confirmar" até alguém confirmar (padrão Conta Azul IA, PM §1.2).

### 3.8 Relatório
- Mesma estrutura da lista, só de leitura: filtros (globais + do relatório) → tabela com linha de total → **Exportar Excel / PDF**.
- O título, o período e as unidades vão **dentro do arquivo exportado**, não numa segunda faixa na tela.
- No máximo 8 colunas na tela. A exportação pode ter mais colunas, porque é o arquivo da contabilidade (IP §5, Relatórios).
- Para trocar um agrupamento, como Por loja, Por sócio ou Por cargo, usam-se abas, não telas novas.

## 4. Menu lateral do sistema único

| Módulo | Submenu (fonte) |
|---|---|
| **Pendências** | — (tela inicial) |
| **Premiação** | Quadro do mês · Pessoas · Planos especiais · Importar dados e metas · Conferência com a planilha · Recibos · Relatórios · Política (IP §5). Até a fase de login único, o item abre o site atual sem mudar nada nele |
| **Pedidos** | Pedidos · Pagamentos (parcelas e as 3 baixas) · Notas fiscais · Receitas do mês (IPd §3) |
| **Compras e estoque** | Solicitações · Cotações · Compras · Recebimentos · Notas e contas a pagar · Estoque · Contagem mensal, o Nutra (IC §1.2 e §3) |
| **Reembolsos** | Solicitações · Pagamentos (IC §2) |
| **Documentos** | Por unidade (a matriz unidade × documento) · Conferência · Vencimentos · Avisos às unidades (ID §A) |
| **POPs** | Biblioteca · Emissões · POPs específicos (ID §C) |
| **Cadastros** | Unidades e empresas (CNPJ com vigência) · Pessoas · Sócios · Responsáveis técnicos · Fornecedores e laboratórios · Produtos |
| **Configurações** | Usuários e acessos · Alçadas de aprovação · Parâmetros por módulo · Histórico geral |

- O submenu de cada perfil é um recorte do menu acima. Quem não tem permissão não vê o item: não se mostra item desabilitado.
- O sócio vê os mesmos itens que a Operações, menos Configurações e Cadastros (que para ele ficam só de leitura), restrito às lojas dele.
- O financeiro vê Pendências, Pedidos › Pagamentos, Compras › Notas e contas a pagar e Reembolsos.
- O colaborador vê Meu prêmio e Meus reembolsos.
- A equipe da clínica vê Documentos, POPs e Contagem mensal.

## 5. Temas do brief, do ponto de vista da interface
1. **Unificar já**: a casca, o kit, a Central de pendências e o Cadastro de unidade. Os módulos continuam com rotinas e dados separados.
2. **Fases**: o kit nasce no Pedidos novo, que já está no git e tem 2 usuários (IPd §5). Depois vêm Documentos e POPs, que são as maiores bases de login de clínica; depois Compras com o Nutra (só depois da rodada de 01/12, IC §6.1); depois Reembolsos, que é tela nova e já nasce no kit; e por último a Premiação.
3. **Sem interferência**: a Premiação não recebe nenhum CSS novo. Durante a transição ela vai parecer diferente, com as 24 fontes dela, e isso é aceito e registrado.
4. **Cadastro**: uma ficha de Unidade com abas Empresa/CNPJ, Sócio, RT e Documentos. Os outros módulos apontam para ela e não copiam o dado.
5. **Perfis**: o menu se monta pelo papel e pela unidade, nunca por tela (PM §7.15).
6. **Infraestrutura**: o kit fica num único CSS e num único arquivo de componentes no repositório. Todo link de teste é verificado em 1366 × 768 e em 390 × 844, com uma checagem automática que reprova o teste se encontrar rolagem interna, rolagem lateral ou um tamanho de fonte fora dos 4.
7. **API do Claude**: entra no visualizador, só para sugerir campos que alguém confirma. **Não entra** como chat de navegação nem como decisora (PM §7.14).

## 6. Análise crítica do pedido
- **"Cabe inteira" junto com "reduzir fonte"** leva a letras de 10 e 11 px, como na IP. A alternativa é o limite de 8 colunas com a ficha recebendo o resto, e o piso de 12 px.
- **"Layout da Premiação"**: copiar a estrutura sem os defeitos medidos (§0). Sem a régua de 4 tamanhos, o sistema único herda 24.
- **"Filtro vale no site inteiro"**: se valer também para o período, uma lista de pedidos pode sumir sem motivo aparente. Por isso a proposta é que só a unidade seja global, e a competência só onde o mês existe.
- **"Um layout único para computador e celular"**: a estrutura é a mesma, mas a tabela precisa virar cartão. Encolher a tabela no celular falharia.
- **Risco**: a Premiação fica fora do kit até a última fase. O usuário vai conviver com dois visuais por alguns meses.
