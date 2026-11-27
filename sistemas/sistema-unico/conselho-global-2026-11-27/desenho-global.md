# Sistema de Operações Dr. Hair: desenho global

Versão do conselho de 27/11/2026, **revisada pelo moderador após 2 rodadas de críticas (45 problemas: 14 de gravidade alta, 25 média, 6 baixa)**, para aprovação do dono. Foi feita só com leitura: nenhum sistema, banco, site ou repositório foi alterado.

Como o desenho foi decidido. Havia 3 candidatos, avaliados por 21 especialistas. O placar foi C 88,5, A 82 e B 71,5. A base escolhida é a **C** ("cada dado tem um único dono"). Dela vêm a regra de dono único por dado, os 5 processos de negócio, o critério de entrada de módulo novo, a reconciliação em 3 níveis e o lugar reservado para contas a receber. Da **A** vieram o menu (Indicadores como item próprio e Pagamentos com esse nome), a lista do que fica fora, a Fase 0,5 de ganho rápido e a regra "nenhum módulo novo antes de desligar um sistema antigo". Da **B** vieram as jornadas por papel, que servem de teste de aceite, a aba "Acompanhando" e a "Minha unidade".

Sobre as 103 objeções bloqueantes: elas formam 42 grupos (seção 9.2). **31 grupos foram aceitos no desenho, 3 foram mitigados e 8 dependem de decisão do dono.** Esta revisão reabriu 7 dos aceitos (ver 9.4). Nenhuma está "resolvida" só por ter sido empurrada para decisão: cada decisão tem um comportamento padrão que vale enquanto o dono não decidir (seção 8).

**O que mudou nesta revisão, em uma linha:** a V1 encolheu para 3 entregas que desligam algo (cerca de 11 a 16 semanas, e não 45 a 55); a Premiação não é tocada em nenhum ponto; a receita do dia 01 migra como está; a cobrança ao laboratório lê o banco oficial (legado); o banco legado não é desligado enquanto Contagem e Compras morarem nele.

---

## 1. Em uma página: o que é o sistema de operações e a lógica dele

**O que é.** É um único endereço, com um único login, em que cada pessoa da rede encontra o que precisa fazer nas unidades dela e resolve a tarefa ali mesmo, com o documento ao lado. Os papéis previstos estão na seção 2.1; só entram no sistema os que tiverem pessoa real nomeada.

**De onde ele parte.** Ele não parte dos sistemas que existem hoje, e sim dos **5 processos** da franquia, que viram **6 módulos de menu**:

| Processo | Módulo(s) de menu |
|---|---|
| 1. A unidade existir, abrir, continuar regular e, quando for o caso, ser transferida ou encerrada | Unidades; Documentos e qualidade |
| 2. Abastecer a unidade (laboratório, compras, estoque e contagem) | Compras e estoque |
| 3. Pagar o que foi comprado | Pagamentos |
| 4. Proteger a rede juridicamente | Jurídico |
| 5. Acompanhar e cobrar a rede (inclusive receber o que a rede deve à franqueadora) | Indicadores; Unidades (relacionamento e comunicados); Pagamentos › Recebimentos da rede (reservado) |

Os **7 sistemas atuais mais os cadastros auxiliares** servem como **lista de requisitos**: as 223 funções da matriz têm lugar definido no anexo, e nenhuma se perde, seja como tela, seja como regra preservada e documentada. Mas nenhum desses sistemas vira item de menu. Foi o que o dono disse: "não preciso de um sistema de nutracêuticos". O nutracêutico vira uma categoria de produto, a contagem mensal vira parte do Estoque, e o Estoque e o Laboratório ficam dentro de Compras e estoque. O Laboratório mantém as regras dele (lista completa em A.2).

**O problema que resolve.** Hoje os mesmos dados estão gravados em vários lugares, e as contagens não batem:
- 8 cadastros de unidade, com 51, 52, 53, 54 e 56 unidades; só 34 de 51 casam entre Compras e Pedidos;
- 7 tabelas de usuários e 7 históricos;
- 4 cadastros de responsável técnico (RT);
- 5 catálogos de produto;
- 3 contas a pagar;
- o sócio escrito como texto solto em 4 lugares.

Um mesmo sócio chega a ter 4 senhas. A tela única é consequência. O ganho real está em ter **um dono para cada dado**.

**A lógica em 4 regras.**
1. **Um dono por dado, definido por campo.** Só um lugar grava cada campo, e os outros só leem (matriz na seção 3.1). Quem não é dono mostra "Usado em" e nunca uma cópia.
2. **Juntar menu, cadastro e login, sem reescrever o que funciona.** As regras do Laboratório não mudam na virada: as 3 baixas, a planilha exigida só na 1ª parcela, a Injemed só com a nossa baixa, a **receita do dia 01 gerada como hoje**, o rastreio e as 12 regras adicionais listadas em A.2. Qualquer mudança de regra (por exemplo, assinatura da RT com trava) é feita depois e separada da troca de sistema.
3. **O desenho global é o mapa; a construção vai um passo por vez.** A V1 são só 3 entregas, cada uma desligando algo (seção 6.1). Uma virada de cada vez, numa janela objetiva do calendário (seção 6). Nenhum sistema em uso é alterado ou desligado antes de o novo estar aprovado e conferido.
4. **Permissão garantida pelo banco para quem entra pelo sistema.** A regra é pessoa × papel × módulo × unidade, com o teste "sócio A tenta ver a loja B" rodado antes de cada publicação. **Limite conhecido, registrado como risco aceito:** existem dois caminhos que entram direto no Postgres e passam por cima dessa regra: a Premiação (conexão direta por SUPABASE_DB_URL, sem RLS, no mesmo projeto) e as sessões do Claude (execute_sql com papel de dono). A mitigação está na seção 3.3. As exceções a "Operações pode tudo" e a "sócio vê o que Operações vê" **não estão decididas**: dependem da D8 e da D8-bis, e até lá vale a premissa.

**O que fica de fora.** A Premiação continua como sistema à parte, intacta, por decisão do dono: no sistema de operações ela é **só um link** "Abrir a Premiação". Nada é criado, lido ou desligado dentro dela (os prós e contras estão em 9.3). ERP, folha, agenda e prontuário continuam nos sistemas prontos (Omie, Bizneo/Onvio, ZurIA), só em consulta.

**O primeiro ganho chega sem migração** (Fase 0,5), depois de domínio, SMTP e a decisão do canal (D9):
- avisos de vencimento: 37 documentos vencidos e 90 que vencem em 60 dias;
- cobrança ao laboratório: 101 parcelas sem baixa, somando R$ 1.012.315,08 **segundo a cópia de 27/11**, a confirmar contra o banco legado, que é o oficial. Nas 2 primeiras semanas nada vai direto ao laboratório: sai uma lista para Operações revisar e enviar.

---

## 2. Mapa de módulos

O menu tem **6 módulos** (os 5 processos, na tabela da seção 1), mais o Início e o rodapé Administração. O link da Premiação abre à parte. Os nomes do menu estão na língua de quem usa; o nome técnico aparece entre parênteses só neste documento. **O que está marcado "V1" é construído agora; o resto é mapa.**

| Módulo (menu) | Para que serve | O que tem dentro | Quem usa | De quais sistemas atuais absorve funções |
|---|---|---|---|---|
| **Início** (tela do núcleo) — V1 | Ser a porta única de cada pessoa: "O que precisa de mim" | Abas "Aguardando você", "Acompanhando", "Com a unidade", "Com o laboratório", "Com o sócio" e "Vencendo esta semana". Versão "Minha unidade" para gestora e recepção. Itens iguais agrupados numa linha que expande (ex.: "63 divergências de PV"). Decisão no próprio item, com o documento ao lado e o botão "Próxima". **Premiação: só o link "Abrir a Premiação"**, sem linhas nem contadores. Quando não há nada: "Nada aguardando você" | Todos; cada pessoa vê só o seu papel e as suas unidades | Documentos: painel do responsável. Compras: "de acordo", aprovar e aprovar em lote (4 funções). Lê a fila de pendências |
| **Unidades** (Rede e Unidades) — mapa | Fazer a unidade nascer uma vez, acompanhar o ciclo de vida e o relacionamento com o franqueado | Ficha 360 ("Minhas lojas" para o sócio, "Minha carteira" para o consultor), com "atualizado até" em cada bloco. Para o sócio, a ficha tem blocos de Pedidos e rastreio, Contagem, Indicadores e Contratos das lojas dele, cada um com "Usado em". Ciclo de vida: contrato assinado → em implantação → pré-inauguração → ativa → em transferência → em encerramento → encerrada (mais teste). Implantação com portões "pronto para o 1º pedido" e "pronto para inaugurar". Encerramento e transferência com portão "pode encerrar". Provisionar e desprovisionar unidade nos sistemas vivos. Comunicados segmentados. Chamados com categoria, área dona e prazo. Registro de contato | Operações, diretoria (só leitura), sócio, gestora, consultor de campo (se existir) | Documentos: cadastrar, importar e encerrar unidade, telefone, avisos. Pedidos: cadastro da clínica, código de cliente Injemed. Compras: unidades e empresas com vigência (modelo adotado). Total 9 funções |
| **Compras e estoque** (Suprimentos) — V1: Laboratórios e Contagem do mês | Fechar o ciclo contagem → necessidade → pedido → nota → recebimento → estoque, com um catálogo e um cadastro de fornecedores únicos | **Laboratórios** (trilha com regras próprias): Pedidos (DH-AAAA-NNNN), Receitas do mês, Notas e pedido de venda, Rastreio, Planilha do laboratório, Injemed. Não passa por cotação nem aprovação do sócio. **Estoque e Contagem do mês** (ex-Nutra). **Reposição única**, dirigida pelo produto e pelo fornecedor do Catálogo: se o fornecedor é laboratório, a sugestão vai para Laboratórios › Receitas do mês; se não, para Compras gerais (mapa). **Compras gerais, Recebimentos e Notas de entrada**: só se houver volume medido (Fase 6 condicional). Telas de Catálogo e Fornecedores | Operações, gestora e recepção, sócio, RT, comprador central (se existir), robôs | Pedidos 27, Compras 25, Nutra 7, Cadastros auxiliares 1 = **60 funções** |
| **Documentos e qualidade** (Conformidade) — mapa | Responder "a unidade está apta a funcionar e a comprar hoje?" | Requisitos por unidade e por estado da unidade, configuráveis por UF e município (inclui certidões por CNPJ, AFE e licença do fornecedor). Vencimentos 60/30/7/0 dias. RT e prescritores. Termos unidade × laboratório × RT. POPs versionados, com ciência por pessoa. Capacitação registrada por pessoa e função, com evidência e validade. Equipamentos da unidade (série, manutenção preventiva, calibração). Inspeção externa e plano de ação. Visitas e não conformidades (fase posterior). Área de saúde só depois da D8-bis e da seção 3.3 | Gestora e recepção (enviam), RT (não vê valores), Operações (confere), sócio (vê as dele), consultor externo (nominal, com data de fim) | Documentos 11, POPs 11, Pedidos 5, Cadastros auxiliares 2 = **29 funções** |
| **Pagamentos** (financeiro operacional; não é ERP) — V1: só parcelas de laboratório | Mostrar e cobrar o que falta para cada parcela de laboratório estar quitada, por CNPJ | **V1: só parcelas de laboratório** (541), baixa pelas "confirmações exigidas" do fornecedor (3 baixas), "Planilha dispensada" como situação, comprovante com controle de duplicidade, cobrança em lote, troca de banco ou PIX confirmada por 2ª pessoa, visão do sócio "Contas da unidade". **Não é uma 4ª contas a pagar:** prestador PJ, fatura de cartão, aluguel, jurídico continuam na Omie e só aparecem aqui como leitura, quando houver integração (D24). Reembolso só se a Fase 6 entrar. Submenu **"Recebimentos da rede" reservado** (royalties, fundo de marketing, venda às unidades; nada é construído antes de volume medido) | Financeiro de cada CNPJ, Operações, sócio (consulta), contabilidade (leitura, se existir) | Pedidos 5, Compras 5, Reembolsos 2 = **12 funções** (as de Compras e Reembolsos como regra preservada até a Fase 6) |
| **Jurídico** (módulo novo) — mapa | Dar dono e prazo a contratos, casos, societário e marcas, para não perder janelas que não voltam | Contratos: franquia (vigência, renovação, COF, cláusulas-chave datadas, não concorrência pós-término), cessão de franquia ligada ao estado "em transferência", distrato com devolução de marca, locação (renovatória, reajuste, garantia locatícia com vencimento), RT, fornecedores, prestadores. Procurações com validade. Casos e notificações (prazo fatal, provisão). Societário. Marcas (INPI). Gatilhos: notificar por NC reincidente e por inadimplência acima de N dias | Jurídico interno e escritório externo (se existirem), diretoria, Operações, financeiro (cronograma e provisão, sem parecer) | Documentos societários, contrato com o RT, sócio por unidade, certificado digital, contratos de Compras = **5 funções** |
| **Indicadores** (só leitura) — V1: nada; mapa | Mostrar a saúde de cada unidade numa linha, com cada número rastreável até a origem | Painel mínimo da direção (5 números). Depois: painel da rede por unidade × mês, dicionário de indicadores (seção 3.4). Comercial lido da **ZurIA**, lotação lida da **Bizneo**, só em consulta; **nada lido da Premiação** | Diretoria, Operações, consultor, sócio (as lojas dele; orçamento e % da meta dependem da D8-bis) | Nenhuma função é movida: só lê |
| **Administração** (rodapé) — V1: mínimo | Tirar do código e da cabeça do dono a configuração, os acessos, as rotinas e os custos | Cadastros. Usuários e acessos (desligamento com lista por sistema antigo; revisão mensal; "Ver como" só leitura). Parâmetros e alçadas. Rotinas e integrações. Saúde e custos, com registro de incidentes. **Privacidade (LGPD), único lugar, operado pelo encarregado.** Pedidos de melhoria e problemas. Histórico geral. Lixeira de 90 dias só para rascunho e não aprovado | Operações (2 usuárias), 2º administrador, encarregado de dados | Pedidos 6, Documentos 10, POPs 2, Compras 6, Reembolsos 6, Nutra 3 = **33 funções** |
| **Premiação** (FORA, link) | Continua como sistema à parte, intacto | Item de menu "Premiação – abre em nova aba (login próprio)". Nada mais | Os mesmos de hoje | As **66 funções** ficam nela, sem mudança |

**Necessidades registradas, ainda sem módulo.** Só entram quando cumprirem o critério de entrada (seção 4):
- **Gente e DP**: movimentação, fechamento do DP (o treinamento regulatório foi para Documentos e qualidade);
- **Clientes e Comercial**: caso de cliente, cancelamento com motivo, NPS com método, campanhas;
- **Recebimentos da rede** (royalties, fundo de marketing, venda às unidades): lugar já reservado em Pagamentos e dono do dado definido (3.1), levantamento na Fase 0,5.

### 2.1 Papéis

Regra: **papel sem pessoa real nomeada não entra no sistema até existir.** A coluna "pessoa" é preenchida na tabela papel × pessoa × substituto, exigida antes da Fase 1 (D6).

| Papel | O que vê no menu | Entra na fase | Pessoa real confirmada? |
|---|---|---|---|
| Operações (2 usuárias) | Tudo | 1 | Sim |
| 2º administrador | Administração | 0 | Não (D6) |
| Encarregado de dados | Administração › Privacidade | 0 | Não (D6) |
| Diretoria | Início, Unidades e Indicadores (leitura) | depois de V1 | A confirmar |
| Sócio (19; 6 ativos) | Todos os módulos que tiver, filtrados pelas lojas dele; menu na ordem Início, Minhas lojas, Contas da unidade, demais. Nada escondido salvo as exceções da D8-bis | 2 (junto com a virada de Laboratórios) | Sim |
| Gestora | Início "Minha unidade", Compras e estoque (da unidade), Documentos da unidade | 2 / 3 | Sim |
| Recepção/auxiliar | Tarefas por link de uso único (D26) ou login | 3 | Sim |
| Colaborador (biomédica, técnica) | Ciência de POP e capacitação; reembolso se a Fase 6 entrar | 4 | Sim (sem login hoje) |
| RT (~43) | Receitas do mês, documentos da função | 2 (leitura) / quando a trava da RT entrar | Sim, sem login hoje |
| Prescritor | Sem login | — | — |
| Financeiro por CNPJ | Pagamentos do CNPJ | 2 | A confirmar com cada CNPJ |
| Comprador central | Compras gerais | 6 (condicional) | A confirmar |
| Solicitante (6 no Compras) | Compras gerais | 6 (condicional) | A confirmar |
| Contabilidade | Pagamentos (leitura por CNPJ) | depois de V1 | A confirmar |
| DP | Lotação (leitura), pendências de revogação | 2 | A confirmar |
| Jurídico interno | Jurídico | 5 | A confirmar |
| Escritório externo | Jurídico (nominal, por caso, com data de fim) | 5 | A confirmar |
| Consultor de campo | Minha carteira | depois de V1 | A confirmar |
| Consultor externo (tributário) | Documentos (5 itens, nominal) | 4 | Sim (já existe) |
| Marketing central | Comunicados, uso da marca | 4 | A confirmar |
| Laboratório (parte externa) | Sem login; recebe a cobrança | — | — |
| Robôs | Rotinas registradas | 0,5 / 2 | — |

**Desligamento automático.** Rotina diária: pessoa desligada na Bizneo gera a pendência "revogar acesso em 24 h" para Operações, que fecha sozinha se a pessoa não tiver login. O sócio que sai tem o acesso revogado no mesmo dia.

---

## 3. Núcleo comum (cadastros) e serviços comuns, com o dono de cada dado

### 3.1 Cadastros do núcleo: quem grava e quem lê (matriz por campo)

Para cada **campo**, só o dono grava. Sócio e Empresa ficam gravados por **Operações até a Fase 5 terminar**; só então passam ao Jurídico, numa única troca de dono registrada.

| Dado / campo | O que guarda | Quem GRAVA | Quem só lê |
|---|---|---|---|
| Unidade | **nucleo.unidade, com o MESMO uuid de public.unidades**, ligada por chave. public.unidades (tabela do Documentos em produção, 54 linhas, 16 logins por unidade) **não é alterada** até a virada de Documentos (Fase 4). Código, UF, município, região, marca de teste. Pode existir sem CNPJ. Tabela de equivalência com Premiação 56, Compras 51, Nutra 51, ZurIA 52, Bizneo e Onvio, a partir dos 71 apelidos | Operações | Todos |
| Estado da unidade e datas-alvo e real de inauguração | Ciclo de vida. Data de inauguração única (a "data de abertura" do cadastro de clínicas do legado vira a data real) | Unidades (Operações) | Todos. A Premiação pode ler só se o dono decidir (D11, direção permitida) |
| Imóvel/endereço com vigência | Endereço, habite-se, planta, IPTU, seguro, AVCB; ligado à unidade e ao contrato de locação. Os documentos do imóvel herdam o vínculo; troca de endereço muda alvará, AVCB e locação juntos | Operações (até a Fase 5) / Jurídico (com a locação) | Documentos e qualidade, Jurídico |
| Protocolo clínico da unidade (Antigo/Novo) | Usado pela receita do dia 01 | Documentos e qualidade com a RT (até a Fase 4, migrado como está do legado) | Laboratórios |
| Empresa.identificação | CNPJ com vigência por unidade (modelo do Compras), inscrições, certificado digital (47 validades hoje só no legado). Resolve 51 linhas para 49 CNPJs | Operações → Jurídico › Societário ao fim da Fase 5 | Todos; cada NF, título e contrato guarda o CNPJ da data |
| Empresa.bancário | Conta e PIX do CNPJ (modelo reb_empresa_pagto reaproveitado) | Financeiro, com confirmação de 2ª pessoa (regra das 2 pessoas, 3.2) | Pagamentos |
| Empresa.preparador e autorizador | Quem prepara e quem autoriza o pagamento por CNPJ | Dono (D21) | Pagamentos |
| Sócio | Pessoa com % de participação e vigência, no lugar do texto livre | Operações → Jurídico › Societário ao fim da Fase 5 | Permissões, Unidades, Pagamentos |
| Pessoa | Pessoa física separada de usuário. CPF num campo; CNPJ de quem recebe como PJ em outro, com vigência. Casamento só por documento ou CRBM, nunca por nome | Administração › Cadastros. Carga em 3 passos: exato automático; ~100 casos PJ confirmados por Operações; fila "pessoa não reconhecida" (inclui os 17 SEMCPF) | Todos |
| Lotação | Em que loja a pessoa estava em cada data | Núcleo, carregada **só da Bizneo** em leitura; o DP executa as mudanças na Bizneo | Permissões, Documentos e qualidade |
| Função técnica (RT titular e substituta, prescritor) | Conselho, número, UF, validade, comprovante, período da substituta. Gratificação do RT (clinicas.rts no legado) migra como dado de leitura; dono definitivo (DP na Bizneo ou Pagamentos PJ) é decisão pendente da Fase 4 | **Só Documentos e qualidade.** A Bizneo nunca sobrescreve | Compras e estoque, Unidades |
| Outras funções (gestora, consultor, diretora) | Papel com período | Administração › Usuários e acessos | Permissões |
| Contraparte, por tipo | Cadastro único. **Um gravador por tipo:** fornecedor e laboratório → Compras e estoque › Fornecedores (inclui a ficha de regras do laboratório: baixas exigidas, planilha, termo, código de cliente, carta de correção, substituições de produto); locador, escritório, parte contrária → Jurídico. Tira do código o CNPJ fixo da rotina da Omie | Conforme o tipo | Todos |
| AFE e licença do fornecedor | Documento de conformidade com validade | **Documentos e qualidade** (requisito do fornecedor) | Compras e estoque |
| Dados bancários e PIX da contraparte | Troca fica pendente até confirmação por 2ª pessoa por outro canal | Financeiro (confirma) | Pagamentos |
| Produto e preço com vigência | Catálogo único (une as listas de 9, 12, 13, 17 e 4 itens). Categoria. Registro Anvisa, "regularizado até", exige receita, lote e validade. De-para com códigos do laboratório, NF, Injemed e Omie (~30 itens, conferidos pelo dono), incluindo as substituições hoje fixas no código (minox-2 → minox-05, complexo → pillfood). Fornecedor padrão (dirige a Reposição) | Compras e estoque › Catálogo | Pagamentos, Indicadores |
| Obrigação financeira da unidade com a franqueadora (reservado) | Tipo, competência, CNPJ pagador, CNPJ recebedor, vencimento, situação lida da Omie | Pagamentos › Recebimentos da rede (quando existir) | Unidades (inadimplência), Jurídico (gatilho), Indicadores |
| Documento (acervo) | Arquivo guardado uma vez (sha256) e ligado a N registros. Tipo de documento em tabela: módulo dono, validade, antecedência, classe de sigilo e **"pode ir para IA" com padrão NÃO gravado no banco desde a Fase 0**. Versões encadeadas; o original aprovado ou assinado é imutável e nunca vai para a lixeira. Termo de mesclas é um tipo de documento com dono (Documentos e qualidade) | O módulo dono do tipo | Outros veem em "Usado em" |
| Observação interna | Os 722 itens com observação e os 1.934 registros de obs_historico migram como histórico do item | Quem grava o item | Mesmo acesso do item |
| Usuário, papel e acesso | Um login. Papel × módulo × unidade, com vigência e registro de quem concedeu | Administração › Usuários e acessos | Banco (permissões) |
| Auditoria | Trilha só de acréscimo: quem, em nome de quem, origem (tela, rotina, IA, sessão do Claude, acesso externo), antes, depois, justificativa. **Limite:** SQL direto feito por sessão do Claude ou pela Premiação não passa pela trilha; por isso as sessões do Claude usam papel só leitura (3.3) | Só o sistema | Administração › Histórico |

### 3.2 Serviços comuns e quando cada um nasce

Regra: **nenhum serviço é construído sem um primeiro consumidor na mesma fase.** Na V1 nascem só os marcados "V1".

| Serviço | O que faz | Nasce na fase / primeiro consumidor |
|---|---|---|
| Pendências — V1 | Formato único: tipo, unidade, prazo, valor, **dono obrigatório**, origem, link, ações permitidas. Escalona e delega na ausência. Na convivência, cada pendência tem uma única origem, e a baixa feita no legado fecha o item na execução seguinte | Fase 1 / Início e Laboratórios |
| Prazos e vencimentos — V1 | Toda data com efeito vira obrigação com dono e antecedência. Prazo sem dono não é gravado. Prazo fatal e data extraída de contrato só entram com confirmação da regra das 2 pessoas (abaixo) | Fase 0,5 (lendo public.itens) |
| Comunicação — V1 | Aviso na tela; e-mail **depende da D9** (padrão, se o dono não decidir: só tela, como no mestre). Frequência única: **resumo semanal por unidade** para documentos; **resumo diário só para Operações**. Nunca um e-mail por item; nenhum quando não há nada. Registra envio e leitura. O link exige login e nunca aprova sozinho | Fase 0,5, depois de domínio, SMTP e D9 |
| Aprovação e alçadas | Situações: rascunho, enviado, aguardando, aprovado, pedir correção, não aprovado, concluído. Segregação "ninguém aprova o que lançou" no banco. Mudar valor, favorecido ou PIX derruba a aprovação. Lote **depende da D7** (padrão: uma a uma, como no mestre) | Fase 2 (troca bancária) / Fase 6 |
| Integrações e rotinas — V1 | Lote com arquivo original e hash; receber → validar → prévia → aplicar; reimportar sem duplicar; correção manual nunca sobrescrita; "atualizado até" e alerta "sem dados há mais de 24 h". **Um só gravador por destino**. Ordem fixa no dia 01: fechar a rodada da contagem (prazo dia 30) → calcular saldo e consumo → gerar a sugestão de receita (a partir da Fase 3; antes disso, a receita roda às 06:05 como hoje) | Fase 0,5 (alertas) / Fase 2 |
| Leitura de documentos por IA | **Só NF e PV na Fase 2**, com piloto de 50 arquivos e medição do tempo de conferência por documento. XML primeiro. A IA nunca grava em dado mestre nem em prazo. Sem encarregado nomeado e sem registro de transferência internacional, nenhum documento de classe saúde, financeiro pessoal ou jurídico reservado vai para a IA | Fase 2 (piloto) |
| Calendário da rede — V1 | Dias úteis de segunda a sábado, feriados por município, dia 01, 5º dia útil. **Janela de virada** na seção 6 | Fase 1 (até lá, planilha de Operações) |
| Regra das 2 pessoas | Todo fluxo que exige "segunda pessoa" precisa de **pelo menos 3 nomes elegíveis** na tabela papel × pessoa × substituto. Se não houver, a segunda pessoa é o dono ou o financeiro do CNPJ | Fase 0,5 |
| Formulários e checklists | Versionados, com foto e hora do servidor; recebem as pesquisas hoje no Netlify Forms (pesquisa ZurIA) | Fase 4 |
| Acesso por link | Link de uso único por unidade e tarefa, registrando quem fez. **Exceção à premissa "login por e-mail e senha": depende da D26** (padrão: login da gestora) | Fase 3 |
| Casca e kit de telas — V1 | Seção 5 | Fase 1 (já existe em teste em Laboratórios) |
| Registro de módulos e manifesto | Só nascem **quando houver um segundo módulo novo de fato**. Até lá, o manifesto é uma seção de texto no arquivo de estado | Depois da V1 |
| Busca global | Unidade, CNPJ, pessoa, DH, contrato, chamado; respeita o sigilo | Fase 4 |
| Backup e continuidade — V1 | Backup Pro diário, mais dump e cópia semanal dos arquivos para fora, cifrados, com a chave fora do provedor e conferidos por hash. Teste de restauração trimestral **sempre num projeto à parte** (3.3). Roteiro "se cair" que uma pessoa siga sem o Claude | Fase 0 |

### 3.3 Segurança e projeto compartilhado com a Premiação

**Regra "projeto compartilhado com a Premiação".** A Premiação mora no mesmo projeto Supabase (xqxjmeioodmdhxhivyqu). Por isso:
- **restauração nunca é feita no projeto inteiro em produção.** Restaura-se sempre num projeto à parte e dali se copiam só os schemas do sistema de operações. Restaurar o projeto inteiro voltaria os dados da Premiação com mês aberto;
- **premiacao_copia_* e as rotinas premiacao-* (incluindo premiacao-copia-diaria, que guarda 7) ficam fora de qualquer limpeza, fechamento ou arquivo morto**, salvo autorização expressa do dono;
- toda mudança no nível do projeto (plano, compute, Auth, extensões, segredos) passa pelo checklist "efeito na Premiação", é avisada ao dono e é feita **fora dos 3 dias úteis antes e depois da aprovação e do pagamento da Premiação**.

**Dois caminhos que passam por cima da RLS (risco aceito pelo dono, porque o banco único é premissa).**
- A Premiação conecta direto (SUPABASE_DB_URL, postgres.js) sem RLS. Mitigação sem tocar nela: o **jurídico reservado** e a **área de saúde** ficam em schemas próprios com GRANT revogado de anon e authenticated, acessados só por funções SECURITY DEFINER auditadas. Um papel dedicado para a Premiação (grant só ao schema premiacao) é **mudança a propor ao dono numa janela entre competências, nunca sem autorização** (D28). **Enquanto esse papel não existir, a receita por paciente e o jurídico reservado não entram no sistema.**
- As sessões do Claude passam a usar um **papel somente leitura, sem acesso a saúde e jurídico reservado**. Qualquer escrita é feita por migração revisada, registrada no arquivo de estado.

**Outras regras que valem para tudo:**
- As funções do servidor usam o login da pessoa, nunca a service role, que fica só para rotinas registradas.
- Visões e indicadores respeitam a regra de unidade (security_invoker ou função que filtra).
- Segunda etapa de login obrigatória para Operações, Financeiro e administradores. Para o sócio, depende da D10.

### 3.4 Dicionário de indicadores (mapa)

Cada indicador com fórmula, fonte e dono: documentos vencidos por unidade; R$ em parcelas sem baixa; divergências NF/PV; pendências por dono e idade; último acesso (estes 5 formam o painel mínimo); valor do estoque e consumo calculado por produto e unidade (contagem anterior + entradas − contagem atual; Contagem); consumo × vendas (ZurIA, se houver contrato de leitura); inadimplência com a franqueadora (Recebimentos da rede); provisão por probabilidade (Jurídico); % de requisitos em dia (Documentos); prazo pedido → entrega (Laboratórios). Consultas públicas (situação do CNPJ, conselho CRBM/COREN, Anvisa "regularizado até", AFE) são rotinas de conferência que **só geram pendência e nunca gravam no dado mestre**.

---

## 4. Como entra um módulo novo (regras)

Um módulo novo é configuração e telas sobre o núcleo. Nunca é um banco, um site, um login ou um cadastro novo.

1. **Critério de entrada.** Ter dono do processo nomeado (pessoa real), volume medido e reaproveitar o núcleo. O volume é medido na fila **Administração › Pedidos de melhoria e problemas** (alimentada pelos chamados de categoria TI/sistema). Sem isso, a necessidade fica registrada e não é desenhada.
2. **Declaração do módulo** (seção do arquivo de estado até existir o registro de módulos): itens de menu (dentro dos 6 módulos; um novo só com decisão do dono); o que cada papel vê; ações de permissão e classes de sigilo; tipos de pendência e documento; prazos; blocos na ficha da unidade; indicadores; rotinas.
3. **Dados próprios** num schema próprio. Unidade, empresa, pessoa, contraparte, produto, documento e histórico vêm do núcleo. Proibido criar tabela própria desses dados (conferido na lista manual, abaixo).
4. **Telas** só com os padrões do kit (seção 5).
5. **Motores comuns.** Usa os de pendências, prazos, aprovação, comunicação, formulários e IA. Nunca cria os seus.
6. **Antes de liberar:**
   - entra desligado e é testado no projeto de teste;
   - **teste "sócio A × loja B"**: script SQL rodado pelo Claude antes de cada publicação, com o resultado colado no registro da publicação (é a única checagem automatizada no começo);
   - **lista manual de 10 itens** (abaixo), marcada por quem publica;
   - jornada de cada papel afetado, de ponta a ponta, com pessoas reais: Operações no notebook, 1 sócio no celular (aprovar sozinho em até 1 minuto), 1 gestora e 2 recepcionistas;
   - **pacote de treinamento por papel**: guia de 1 página, vídeo de até 3 minutos, plantão de Operações no 1º dia e "Como faço?" abrindo chamado;
   - só então é ligado por grupo.
7. **Lista de aceite.** Registra o que o módulo absorve e de onde; a fase diz que sistema antigo desliga.

**Lista manual de 10 itens antes de publicar:** (1) teste A × B colado; (2) nenhuma tabela própria de unidade, pessoa, fornecedor, produto, documento ou histórico; (3) tela conferida a 360 px no celular; (4) tela conferida a 1366 × 768 com 100% de zoom, sem rolagem interna; (5) R$ sempre com centavos pela função única; (6) termos conferidos contra o glossário; (7) nenhum sistema intocável alterado (Premiação, Bizneo, ZurIA, Omie); (8) nenhum segredo no código ou no commit; (9) restauração e plano de volta escritos; (10) arquivo de estado atualizado.

O Jurídico é a prova: nasce sem cadastro, login ou acervo próprios. O que o mercado oferece pronto (andamento processual, assinatura eletrônica, NPS, vigilância de marca) é comprado, e só o resultado entra.

---

## 5. Experiência igual: padrões de tela e navegação

A referência é o protótipo `sistemas/sistema-unico/levantamento-2026-11-27/prototipo.html`, mais a casca já em teste em Laboratórios (commit 7d78805). Ela segue a estrutura da Premiação /app/ (só como modelo visual): menu lateral navy, cabeçalho de 56 px, cartões, Nunito Sans em 4 tamanhos e 5 cores de situação.

- **Menu.** Início, 6 módulos e o rodapé Administração cabem a 1366 × 768 com 100% de zoom para Operações. No máximo 2 níveis; o 3º nível é **aba** gravada no endereço. Cada papel vê os módulos a que tem acesso. **Para o sócio, o menu é simplificado só na ordem e no destaque, sem esconder módulos** (exceções só pela D8-bis). Teste de aceite da jornada do sócio: achar o pedido DH-xxxx da loja dele e a contagem do mês em até 3 toques. Item de fase futura não aparece.
- **Celular.** Mesmo layout, responsivo. Barra inferior com no máximo 5 posições, "Aguardando você" fixa. A tabela vira cartão.
- **Cabeçalho.** Seletor de unidade que vale no site inteiro, com "Consolidado". "Mês" só nas telas mensais. Busca única. "Ver como" só leitura, com faixa fixa. Faixa de **aviso de manutenção ou instabilidade** na casca.
- **10 padrões de tela.** Lista, Ficha, Decisão com documento ao lado, Visualizador, Formulário, Relatório, Início do módulo, Importação com conferência, Confirmação curta, Estado vazio/erro. Mais "Campo lido do documento — confirmar" e "Abas do submódulo".
- **Regras visuais** (mestre §6.3). Sem rolagem interna (exceção: área do PDF). Fonte mínima de 12 px. Contraste AA. Uma única função de R$ com centavos. Sem emojis. Cor nunca é o único sinal. Conferidas na lista manual (seção 4).
- **Vocabulário único e simples para todos.** Um nome para cada coisa (mestre). O rótulo de cada situação **nomeia quem de fato age**, confirmado com o financeiro antes do glossário. Exemplos: "falta planilha" → "Aguardando o laboratório confirmar"; "falta Omie" → "Aguardando baixa na Omie: responsável <nome>" (o financeiro não tem acesso à Omie, então o nome é de quem baixa de fato). O sócio vê o campo-resumo "Pagamento"; Operações e Financeiro veem também "Situação". O glossário é aprovado antes da primeira tela que o sócio vê e conferido à mão na lista de 10 itens.

---

## 6. Ordem de construção

**Pontos de partida.**
- O módulo **Laboratórios já está construído e em teste** no banco único (casca, ficha do pedido, pagamentos e rastreio). Ainda não cria pedido.
- O **oficial ainda é o legado** (ckgsdvhkpnrrmctlqtma): 276 pedidos alterados depois da cópia; a tarefa "Sincronizar Portal Omie" do navegador do dono envia só ao legado; a carga no novo foi feita uma vez, em 27/11; as baixas manuais são feitas no legado.
- O projeto legado também hospeda, **em uso**, o Estoque Nutra (nut_*, 54 respostas, rodada de dezembro a partir de 01/12), o Compras (cmp_*), o Reembolsos (reb_*) e a tabela membros (21 logins), compartilhada por todos.
- **Nenhum sistema em uso é alterado ou desligado enquanto o novo é construído.** Cada sistema antigo só desliga depois de o novo estar aprovado e reconciliado, e fica 90 dias em somente leitura.

**Janela de virada (regra objetiva, substitui "primeira janela elegível").**
- Dias úteis **de 05 a 20 do mês**;
- fora dos **3 dias úteis antes e depois da aprovação e do pagamento da Premiação** (datas que Operações informa a cada mês);
- fora de 14/12 (virada da escala 5x2) e do recesso;
- uma virada por vez.
- **O mês aberto da Premiação não bloqueia** a virada de Laboratórios nem a da Contagem: a Premiação está fora e não é tocada. Ele só pesa nas mudanças de nível do projeto (3.3).
- A Contagem liga na janela e a **primeira rodada no sistema novo é a do dia 01 seguinte**; a rodada em curso termina no legado.
- **Próximas 3 janelas** (pagamento da Premiação no 5º dia útil; a data de aprovação, que Operações informa, pode encurtá-las): **12 a 20/01/2027**; **11 a 20/02/2027** (depois do Carnaval de 08 e 09/02); **10 a 20/03/2027**. Dezembro de 2026 não tem janela útil (5º dia útil em 05/12, 14/12 e recesso).

**Regras gerais.** "Nenhum módulo novo antes de desligar o primeiro sistema antigo." Uma fase que passar de 2× a estimativa volta ao dono. Uma fase só começa se as horas de Operações previstas couberem na agenda das 2 usuárias (planilha de custo, D5). As estimativas são recalibradas ao fim da Fase 1.

### 6.1 V1: 3 entregas, cada uma desligando algo

| Entrega | Fases | O que desliga | Estimativa |
|---|---|---|---|
| **1. Proteção e alertas** | 0 + 0,5 | Cobrança manual de Operações (a medir) e a dependência de uma conta pessoal | 4–6 semanas (0,5 começa quando domínio, SMTP e D9 estiverem prontos) |
| **2. Virada de Laboratórios** | 1 (mínima) + 2 | **Pedidos antigo** (só as coleções e funções do Pedidos no legado) e a tarefa Omie no navegador do dono | 5–7 semanas + janela (realista: 11 a 20/02/2027) |
| **3. Contagem do mês** | 3 | **Site do Estoque nutra** | 2 semanas + janela (realista: ligar de 10 a 20/03/2027; primeira rodada no novo em 01/04/2027) |

Total da V1: cerca de **11 a 16 semanas** de trabalho, mais as janelas. Tudo o mais (Fases 3,5 a 8) é **mapa**: está desenhado para não se perder, mas não é construído antes de a V1 terminar e de cada fase cumprir o critério de entrada.

| Fase | O que entra | Sistema antigo que desliga | Critério de pronto e portões | Linha de base → meta |
|---|---|---|---|---|
| **0 – Proteção e base** | Lista abaixo | Nenhum | Restauração completa num projeto à parte, registrada; rotação com chave dupla concluída; contas com 2 administradores | Planilha de custo total aprovada (D5) |
| **0,5 – Ganho rápido, sem migração** | Lista abaixo | Nenhum | Listas de cobrança revisadas por Operações por 2 semanas; e-mails registrados (se D9) | Vencidos 37 → 0 em 60 dias; sem baixa → metade em 90 dias (base conferida no legado); horas de cobrança manual (medir) |
| **1 – Núcleo mínimo** | Lista abaixo | Nenhum | Teste A × B; jornada de Operações aprovada | — |
| **2 – Virada de Laboratórios** | Lista abaixo | Coleções e funções do Pedidos no legado, em somente leitura por 90 dias | Portões abaixo | Divergências: 63 PV e 58 de 320 NFs → fila com dono |
| **3 – Contagem do mês** | Lista abaixo | Site do Estoque nutra | Jornada da recepção no celular (2 recepcionistas e 1 gestora); 50 de 51 unidades respondendo | Contagens em dobro 4 → 0 |

**Fase 0 – Proteção e base:**
- Contas em nome da Dr. Hair: organização no GitHub, Supabase, hospedagem, domínio com DNS da empresa, conta da API do Claude, cofre de senhas, 2º administrador. **Transferência de conta e domínio: um sistema por semana**, com o endereço antigo redirecionando por 90 dias e roteiro de volta escrito (links já enviados às unidades continuam funcionando).
- Termo de cessão dos direitos sobre o código.
- Dump do schema atual como linha de base, **depois de varredura de segredos** (gitleaks ou busca por x-cron, admin_key, CNPJ fixo, hash) e **só em repositório privado**.
- Segredos tirados do código e rotacionados com **chave dupla**: o servidor aceita a antiga e a nova por 14 dias; cada consumidor (tarefa Omie do navegador do dono, planilha de hora em hora, rastreio, receitas do dia 01, nut-rodada do dia 01, demais) é trocado e conferido pelo log; só então a antiga é retirada. Nenhuma rotação perto do dia 01. Só com autorização (D2).
- Supabase Pro (894 MB + ~207 MB passam de 1 GB): upgrade de compute **avisado ao dono e feito fora das datas de aprovação e pagamento da Premiação** (reinicia o banco que ela usa).
- Papel somente leitura para as sessões do Claude (3.3), com autorização (D2).
- Campo "pode ir para IA" com padrão NÃO no acervo do núcleo.
- Cópia externa cifrada dos arquivos.
- Hospedagem: padrão é a premissa (Netlify ligado ao repositório); Cloudflare só se o dono decidir (D4). Ensaio de troca em menos de 1 hora.
- SMTP próprio com SPF, DKIM e DMARC.
- Exportação das respostas do Netlify Forms (pesquisa ZurIA).
- Planilha de custo total e de horas de Operações (D5).
- LGPD documental: encarregado, registro das operações de tratamento, DPAs e base da transferência internacional (Anthropic).
- Arquivo de estado de 1 página (6.3).
- A rodada nutra de 01/12 roda no legado como está; o painel é conferido pela rodada (nut_painel_r), não pelo nut_painel_me fixo em nov-2026.

**Fase 0,5 – Ganho rápido, sem migração** (começa depois de domínio, SMTP e D9):
- Vencimentos lendo public.itens (37 vencidos, 90 em 60 dias), em **resumo semanal por unidade**; resumo diário só para Operações.
- As 47 validades de certificado entram no motor de prazos, confirmadas pela regra das 2 pessoas. As **datas das locações** entram como **planilha conferida por 2 pessoas** e são importadas depois (o arquivo de 151 MB não é lido por máquina nesta fase).
- **Cobrança ao laboratório lendo o LEGADO** (docs/parcelas do ckgsdvhkpnrrmctlqtma, o oficial), e não a v_parcela do pedidos_novo. Alternativa: sincronização pontual de parcelas e baixas, com conferência em 3 níveis (linhas, R$ por situação, hash) contra o legado no mesmo dia. Os R$ 661.463,51 de "falta planilha" (61 parcelas) e R$ 350.851,57 de "falta Omie" (40) da cópia de 27/11 são recalculados no legado antes de qualquer envio. **Nas 2 primeiras semanas nada vai direto ao laboratório:** sai uma lista para Operações revisar e mandar. Roda só depois do robô do dia.
- Alertas "Omie sem dados há mais de 24 h" e "ZurIA sem dados".
- Tabela "quem recebe qual aviso por unidade" aprovada pelo dono.
- Levantamento dos processos fora de sistema: volume real de compras gerais e de reembolsos (decide a Fase 6), volume jurídico, **contas a receber da franqueadora**, datas das próximas aberturas (D22), necessidade de formulário de cancelamento e distrato.
- Planilha-checklist de implantação ("pronto para o 1º pedido" e "pronto para inaugurar") e de encerramento/transferência ("pode encerrar"), versionadas, se houver inauguração ou saída antes da tela (3,5).

**Fase 1 – Núcleo mínimo (2–3 semanas).** Entra só:
- unidade (nucleo.unidade com o uuid de public.unidades e tabela de equivalência: CNPJ vigente → id externo → apelido exato → fila decidida por Operações) e definição oficial de unidade;
- empresa com vigência;
- pessoas com papel: sócio, RT, Operações, financeiro (sem carga dos ~697 colaboradores);
- login, permissões no banco, auditoria;
- a casca já existente, conferida contra este desenho.
- **Não entra:** implantação, chamados, inspeção, painel, Administração completa. **Não congela** a criação de unidade nos sistemas antigos: "Provisionar unidade" é uma lista de tarefas com dono (Documentos, Pedidos, Nutra, Premiação por Operações, ZurIA, Bizneo) e há conferência automática semanal de que a unidade nova existe em todos os lugares.
- **Login:** o login novo só é liberado a um papel quando substituir pelo menos um login antigo desse papel (para o sócio, junto com a virada de Laboratórios). A senha é mantida sempre: no primeiro login o sistema confere o hash antigo e regrava no algoritmo novo, sem reset em massa. Antes da Fase 1 sai a lista de quantos hashes não podem ser conferidos; para esses, troca assistida, com o dono ciente. "Desligar acesso" mostra uma lista com um item por sistema antigo, marcado por quem fez.

**Fase 2 – Virada de Laboratórios + Pagamentos › Parcelas.** Entra:
- criar pedido no novo;
- **receita do dia 01 migrada COMO ESTÁ** (gerada automaticamente às 06:05 para as unidades, com as mesmas regras de A.2);
- PV × sistema; parcelas como visão sobre pedidos_novo; regra das 3 baixas; "Planilha dispensada" como situação, nunca como baixa; cobrança em lote; troca bancária por 2ª pessoa;
- rotinas da planilha, Quality e Omie com um só destino, saindo do navegador do dono;
- leitura por IA só de NF e PV, em piloto de 50 arquivos;
- **no legado, ficam em somente leitura apenas as coleções e funções do Pedidos** (docs col=pedidos, omieNF, receitas, clinicas, prescritores; inj_*; automacoes; rastreio; omie-sync; importar-pv; anexar-*). **nut_*, cmp_*, reb_* e membros continuam gravando.** O projeto legado só é desligado (com dump final guardado fora) depois da Fase 3 e da virada ou do arquivamento do Compras (Fase 6).
- Login e painel da Contagem: **depende da D25** (padrão, se o dono não decidir: o painel da Contagem continua no legado com a senha do membros até a Fase 3, e o custo é uma senha a mais para sócios e gestoras por cerca de 6 semanas).

Portões da Fase 2:
- decisões sobre o número DH (43 divergentes, 0469–0472) e sobre a NF abaixo de R$ 500,00 (D13, D14);
- quem prepara e quem autoriza o pagamento por CNPJ (D21);
- as 12 regras do Laboratório de A.2 como testes de aceite (ex.: recalcular as 320 conferências e reproduzir as 58 divergentes);
- reconciliação em 3 níveis contra o legado: linhas, soma em R$ por situação (541 = 334 quitadas, R$ 2.277.952,95 + 70 a vencer + 61 + 40 + 20 vencidas + 10 + 6 canceladas, a reconferir no dia) e hash;
- cópia dos **1.344** arquivos do legado (e não só dos 1.152 referenciados);
- sincronização final dos 276 pedidos (e dos que mudarem até o dia);
- teste "Contagem e Compras continuam funcionando com o Pedidos congelado";
- restauração testada num projeto à parte;
- pacote de treinamento por papel.
- **Não é portão da Fase 2:** RT casado por CRBM em todas as unidades (hoje 5 CRBM e 4 CRT vencidas viram pendência com dono, não trava).

**Fase 3 – Contagem do mês (ex-Nutra).** Liga na janela de 05 a 20; a primeira rodada no novo é a do dia 01 seguinte. Entra:
- link de uso único por unidade e rodada (D26) ou login da gestora;
- campo **"quem contou" obrigatório**;
- "última resposta vale", guardando o histórico; quantidades inteiras;
- **"outros produtos"** em texto livre (até 30 por resposta) geram a fila "produto não reconhecido" para Operações ligar ao Catálogo ou criar item;
- as "sugestões" do nut_config viram chamado "Pergunta para a central";
- valor do estoque por unidade e rodada (preço da rodada);
- aviso ao sócio e à gestora 3 dias antes do prazo; painel sempre por rodada;
- regra contagem × movimentos: a contagem é a verdade; a diferença vira ajuste com motivo, e acima da tolerância vira pendência;
- o recebimento não mexe no saldo até o de-para ser aprovado;
- modo aviso "a receita passa do consumo calculado"; a receita só usa o saldo depois de a Contagem estar no novo;
- o job antigo desliga e o novo liga no mesmo ato; aviso à unidade 7 dias antes e na véspera; o link antigo redireciona por 90 dias.

### 6.2 Mapa (depois da V1; cada fase só com critério de entrada)

| Fase | O que entra | Sistema antigo que desliga | Portões |
|---|---|---|---|
| **3,5 – Unidades mínimo e painel** | Implantação mínima em tela (portões "pronto para o 1º pedido" e "pronto para inaugurar": alvará, licença sanitária, AVCB, CNES, RT habilitado e contrato com o RT, PGRSS e coleta, equipe contratada e treinada, POPs com ciência, ZurIA e Bizneo configurados, loja cadastrada na Premiação por Operações, kit recebido, contrato de franquia assinado e COF entregue 10 dias antes, Lei 13.966/2019); encerramento/transferência mínimo (distrato e COF de quem compra, troca de CNPJ com vigência, baixa e troca de RT, revogação de acessos, última contagem, títulos e parcelas abertos, termos com o laboratório, locação, guarda de documentos, "Desprovisionar unidade" inclusive tarefa manual na Premiação; portão "pode encerrar"); chamados com categoria, área dona (Compras, Laboratório, Documentos, Jurídico, TI/sistema, Pagamentos), prazo por categoria e perguntas frequentes; triagem de notificações (abaixo); painel da direção com os 5 números | As planilhas-checklist da 0,5 | Ter desligado o Pedidos antigo |
| **4 – Documentos e qualidade** | Documentos, POPs, RT e termos (os 40 do legado), CNES, IE, certidões por CNPJ, AFE e licença do fornecedor; requisitos por estado; capacitação registrada; comunicados segmentados por papel, UF e estado, com "li e entendi" cobrado em 3 dias e enquetes; os 258 avisos como histórico; consultor externo nominal; login individual no lugar do CNPJ do POPs e da chave admin; carga dos colaboradores em 3 passos; "unidade apta a comprar" em modo aviso; equipamentos (ou na Fase 7) | Sites de Documentos e de POPs; public.unidades passa a ser lida do núcleo | POP convertido em dado, conferido contra as 977 emissões; jurídico reservado em schema próprio (3.3) antes de a locação e o contrato social mudarem de dono |
| **5 – Jurídico V1** | Societário (passa a gravar sócio e empresa ao fim da fase); contratos de franquia, locação (com garantia locatícia), RT; cessão de franquia; procurações; casos e notificações com sigilo por caso; marcas por importação; gatilhos de notificação | Nenhum | Inventário com números feito antes; papel dedicado da Premiação ou decisão do dono para o jurídico reservado |
| **6 – Compras gerais, Recebimento, Nota de entrada, Reembolsos (CONDICIONAL)** | **Só começa se o levantamento da 0,5 mostrar volume real.** Compra por exceção (D20, com aceite dos 2 sócios entrevistados); recebimento único; nota de entrada com conferência NF × compra, retenções, destaque de IBS/CBS (2026 é ano de teste da reforma) e prazo de manifestação do destinatário como obrigação no motor de Prazos com dono no Financeiro; as 9 regras do Compras de A.6; envio de títulos à Omie conforme a D24; reembolso só se o dono reabrir (D27) | Site de Compras (ou arquivado, se não houver volume: as regras ficam documentadas como requisito, sem tela) | De-para das categorias com o plano de contas da Omie; formato da reforma validado com a contabilidade |
| **7 – Unidades completo, Indicadores, Qualidade de campo** | Implantação completa (obra, fotos, pós 90 dias); visitas, NC e plano de ação depois do piloto com 5 a 8 unidades no formulário do núcleo; painel da rede; dicionário de indicadores (3.4); comercial lido da ZurIA | Nenhum. **A Premiação não é tocada** | Painel só depois da reconciliação |
| **8 – Por decisão do dono** | Gente e DP, Clientes e Comercial, Recebimentos da rede (se não tiver entrado antes), conciliação OFX | — | Critério de entrada |

**Triagem de notificações (regra explícita).** O chamado "Recebi uma notificação" cai numa fila de triagem de Operações com prazo de 1 dia útil e é classificado em sanitária, trabalhista, consumidor/Procon, cível, fiscal ou locatícia. Inspeção e plano de ação ficam com Documentos e qualidade. Auto de infração, multa ou qualquer prazo de defesa abre caso no Jurídico, dono do prazo fatal (confirmado pela regra das 2 pessoas), ligado por "Usado em". A notificação ao franqueado por descumprimento (NC reincidente, inadimplência) nasce no Jurídico a partir de gatilhos de Qualidade e de Recebimentos.

Por que Laboratórios vem antes da Contagem: seção 9.1, item 3.

### 6.3 Governança enxuta (para uma pessoa não técnica com o Claude)

- **Arquivo de estado de 1 página no repositório** (proposta; criado só com o "sim" do dono): fase atual; o que está proibido agora (sistemas intocáveis: Premiação, Bizneo, ZurIA, Omie, e os sistemas em uso até a virada deles); próximas janelas; decisões tomadas com data. O CLAUDE.md manda ler esse arquivo antes de qualquer ação, e toda sessão termina atualizando-o. Este desenho e o mestre ficam como referência, não como leitura obrigatória de cada sessão.
- **Automação mínima:** só o teste A × B (script SQL). O resto é a lista manual de 10 itens (seção 4). Nada de CI que ninguém da empresa saiba manter.
- **Premiação, Documentos, POPs, Compras e Reembolsos não estão no git:** entram no repositório só quando forem trabalhados, depois da varredura de segredos.

---

## 7. O que fica fora / o que comprar pronto

| Fica fora do sistema | Onde fica ou o que comprar |
|---|---|
| Premiação como módulo | Sistema à parte, intacto (66 funções); aqui só o link |
| ERP: escrituração, SPED, NF de saída, boleto, CNAB, PIX automático, DRE, conciliação contábil, contas a pagar que não sejam parcela de laboratório | Omie e contabilidade. O sistema confere e cobra. Sem links para a Omie |
| Folha, ponto, admissão, férias, eSocial | Bizneo e Onvio/Zolt (só consulta; Onvio sempre em rascunho) |
| Agenda, vendas, prontuário, dado de paciente | ZurIA e sistema clínico. Paciente só por código, e nunca vai para a IA |
| Andamento processual e publicações; vigilância de marca no INPI | Comprar serviço pronto (tipo Escavador, Jusbrasil ou Projuris), na fase em que entrar |
| Assinatura eletrônica | Comprar (Clicksign, D4Sign ou similar). Contratos privados: MP 2.200-2/2001, art. 10, §2º; ICP-Brasil só onde o órgão exigir |
| Redação de contratos | Documento editável; o sistema guarda o resultado assinado |
| CRM de expansão, recrutamento, LMS/universidade, avaliação de desempenho | Ferramenta pronta. O sistema registra só a capacitação com evidência |
| NPS, e-mail marketing, WhatsApp em massa, monitor de reputação | O sistema só importa os resultados |
| Suíte de franquia "de 25 módulos" (tipo SULTS) | Não comprar como base. Checklist pronto só se o piloto de visitas mostrar que o formulário do núcleo não basta |
| Estoque por movimento diário, WMS, código de barras, MRP, previsão por IA | Contagem mensal + recebimento bastam |
| Portal de cotação; cartão corporativo | Fatura fica na Omie |
| Gestão de obra | Só marcos, fotos e laudo na implantação |
| BI pesado; chat de IA; agente que aprova ou dá baixa | Camada de indicadores no mesmo banco, com exportação para Excel |
| App nativo, tema escuro, aplicativo autenticador para o sócio | Site responsivo |
| Infraestrutura própria | Provedores prontos (Supabase Pro, Netlify e, se D4, Cloudflare, SMTP transacional, monitor, cofre, armazenamento externo), todos na planilha de custo (D5) |
| Netlify Forms e recursos presos à hospedagem em coisa nova | Proibido |
| Telas para o que nunca foi usado | Com decisão registrada: receitas Injemed por paciente (0 registros; estrutura preservada), login por CNPJ, token da unidade, exportação ao Pedidos antigo, reposição automática diária (29 execuções, 0 itens), dados de teste do Compras (3 solicitações, 7 cotações, 303 eventos), cópias bak_ e bkp_ (arquivo morto cifrado). **premiacao_copia_* fica fora: é da rotina ativa da Premiação** |
| Aprovação tácita em dinheiro; "ver como" que grava | Não construir |

---

## 8. Decisões que o dono precisa tomar

**Agora são só 6** (marcadas "AGORA"). As demais ficam junto da fase em que importam. Cada uma tem um **padrão**: é o que vale se o dono não decidir (premissa ou mestre).

| # | Quando | Decisão | Opções | Recomendação do conselho | Padrão se o dono não decidir |
|---|---|---|---|---|---|
| 1 | **AGORA** | Aprovar o desenho como mapa, a V1 de 3 entregas e os commits de casca (adfe529, 6c151c9, 7d78805) como base | aprovar / ajustar | Aprovar | Nada é construído |
| 2 | **AGORA** | Correções de segurança que tocam sistemas em uso | (a) todas já; (b) só as sem efeito para o usuário, com chave dupla; (c) nenhuma até a virada | **(b)**: fechar as tabelas de backup expostas **exceto premiacao_copia_***, funções abertas sem uso, papel só leitura do Claude, rotação com chave dupla de 14 dias | (c): nada que toque sistema em uso |
| 3 | **AGORA** | Contas e propriedade | manter conta pessoal / passar à Dr. Hair | Passar, um sistema por semana, com redirecionamento de 90 dias e termo de cessão | Fica como está |
| 5 | **AGORA** | Planilha de custo total e teto da IA | valores | 3 linhas: infraestrutura (Supabase Pro + projeto de teste, Netlify pago, Cloudflare se D4, SMTP, cofre, armazenamento, monitor); serviços comprados por fase (assinatura, andamento processual); IA com teto mensal (carga histórica de US$ 50–200 só com piloto). Mais horas de Operações por fase | Só o Supabase Pro (premissa) |
| 6 | **AGORA** | Tabela papel × pessoa real × substituto; encarregado de dados; 2º administrador | nomes | Indicar já | Papéis sem pessoa saem; segunda pessoa = dono ou financeiro do CNPJ; nada vai para a IA além de NF e PV |
| 9 | **AGORA** | Quem recebe cada aviso e o canal | só tela / e-mail / e-mail e WhatsApp | E-mail em resumo semanal por unidade (documentos) e diário só para Operações; WhatsApp depois | Só tela (mestre) |
| 4 | Antes de transferir a hospedagem | Hospedagem | Netlify (premissa) / Cloudflare principal + Netlify plano B | Cloudflare + Netlify plano B (a queda de 27/11 foi por crédito do Netlify) — **exceção à premissa** | Netlify (premissa), com crédito pago |
| 8 | Antes da Fase 1 | Exceções à premissa "Operações pode tudo" | sem exceção / com exceções | Pode tudo, menos aprovar ou pagar o que lançou, assinar pela RT e ver jurídico reservado | Premissa: pode tudo, com registro |
| 8-bis | Antes da Fase 1 | **Exceções à premissa "o sócio vê o que Operações vê, restrito às lojas dele"** | sem exceção / lista abaixo | (1) jurídico reservado: proteger estratégia de litígio que pode envolver o próprio sócio; (2) área de saúde: sigilo de paciente e LGPD (dado sensível); (3) orçamento e % da meta: são da franqueadora e podem criar disputa. Fora disso, o sócio vê todos os módulos filtrados pelas lojas dele | Premissa: sócio vê tudo das lojas dele; por isso jurídico reservado e saúde não entram até a decisão |
| 25 | Antes da Fase 2 | Login de Pedidos e Contagem (o mestre previa mudar os dois juntos) | (a) na Fase 2, o painel da Contagem (nut_painel_r, só leitura) também é lido no sistema novo com o login único; (b) migrar já na Fase 1 os 21 hashes do membros para o login único | (b) se os hashes forem conferíveis; senão (a) | Uma senha a mais por ~6 semanas |
| 7 | Antes da Fase 2 | Lote × "uma a uma" (mestre §6.2) | uma a uma / lote dentro da regra | Lote só para itens iguais e dentro da regra, com prévia | Uma a uma (mestre) |
| 10 | Antes da Fase 2 | Segunda etapa de login do sócio | passkey ou código por e-mail / nenhuma | Código por e-mail só ao aprovar acima do limite; passkey como exceção (D26) | Nenhuma além da senha |
| 13 | Antes da Fase 2 | Numeração DH | manter a do novo / a do antigo / renumerar | Decidir os 43 divergentes (0469–0472 são pedidos diferentes) | Mantém a do legado (oficial) |
| 14 | Antes da Fase 2 | NF abaixo de R$ 500,00 "não soma" | regra / remendo | Confirmar com o laboratório | Migra como está |
| 15 | Antes de mudar a regra da receita (depois da Fase 2) | Receita mensal por média | migrar como está / sugestão assinada pela RT com trava / receita por paciente | **Migrar como está na Fase 2.** Assinatura da RT com trava só depois do parecer da RT e do Jurídico, dos ~43 RTs com login e de 1 mês piloto em modo aviso | Como está |
| 21 | Antes da Fase 2 | Quem prepara e quem autoriza o pagamento em cada CNPJ | tabela | Preencher para as 51 empresas e 49 CNPJs | Como é feito hoje |
| 26 | Antes da Fase 3 | Exceções à premissa "login por e-mail e senha" (link de uso único, passkey) | aceitar / não | Aceitar o link de uso único para contagem, com quem fez gravado | Login da gestora |
| 11 | Quando o dono quiser | Premiação e o núcleo | (a) isolada; (b) **a Premiação lê o núcleo** (unidades, pessoas), direção permitida pela premissa; (c) mesmo login | (b), sem criar nada na Premiação além do que o dono autorizar. **Qualquer leitura no sentido inverso (o núcleo lendo a Premiação) é decisão separada, com a frase "isto altera a Premiação"** | (a) isolada |
| 12 | Antes da carga de pessoas (Fase 4) | Fonte de nome, cargo e unidade | Bizneo / outra | Bizneo, só em leitura | Bizneo |
| 16 | Antes da Fase 6 | Funções sem uso real (Compras 41, Reembolsos 8, mais as 5 sem tela) | migrar tudo / classificar | Classificar; regras preservadas como requisito; sem tela se não houver volume | Regras preservadas, sem tela |
| 17 | Fase 0,5 | Contas a receber da franqueadora | onde é feito hoje | Responder no levantamento; lugar já reservado | Fica onde está, com lugar reservado |
| 18 | Antes da Fase 3,5 | Dono da data de inauguração | núcleo / outro | Núcleo (Unidades) | Núcleo; a Premiação mantém o cadastro dela |
| 20 | Antes da Fase 6 | Alçadas de compra e aprovação por exceção | valores | Cotação: 1 até R$ 1.000,00, 2 até R$ 5.000,00, 3 acima. Aprovação por exceção só com aceite dos 2 sócios entrevistados (é mudança de regra: hoje o sócio aprova toda solicitação) | Sócio aprova toda solicitação (como hoje) |
| 22 | Fase 0,5 | Datas das próximas aberturas (7 ou mais) | datas | Informar; a planilha-checklist precisa estar pronta antes da primeira | Planilha-checklist |
| 23 | Já recomendada | Ordem Laboratórios × Contagem | — | Laboratórios primeiro (9.1, item 3) | Laboratórios primeiro |
| 24 | Antes da Fase 6 | Como o título vai para a Omie | (a) API, credencial por CNPJ no cofre, um só gravador; (b) arquivo de exportação conferido no fechamento por CNPJ | Decidir com a contabilidade; reaproveitar o modelo omie_cash/reb_empresa_pagto (51 empresas, omie_ativo=false) | Títulos fora da V1 |
| 27 | Antes da Fase 6 | **Reembolsos volta ao escopo?** (posto FORA pelo dono em 25/11) | sim / não | Só se o levantamento mostrar volume | Fora (decisão de 25/11) |
| 28 | Numa janela entre competências | Papel de banco dedicado para a Premiação (grant só ao schema premiacao) | propor / não | Propor; **isto altera a Premiação** | Não; jurídico reservado e receita por paciente não entram |

A D19 (dono do NPS "que entra no prêmio") **foi retirada**: é assunto da Premiação.

---

## 9. Divergências do conselho e como foram decididas

### 9.1 Grandes divergências

| # | Tema | Posições | Decisão e motivo | Posição vencida |
|---|---|---|---|---|
| 1 | Candidato base | A: Diretor, Operações, Compras, Designer. C: Sócio, RT, Financeiro, RH, Jurídico, Expansão, Qualidade, Comercial, Consultor, Arquiteto, Dados, IA, Segurança, Infra, Pensador, Diabo. B: Gerente | **C**, com o menu de A e as jornadas de B | A como base; B |
| 2 | Onde ficam os Indicadores | C: dentro de Unidades. A, Dados, Arquiteto, Comercial: módulo próprio | Módulo próprio de leitura | Indicadores dentro de Rede |
| 3 | Ordem Contagem × Laboratórios | A e Arquiteto: Contagem primeiro. Diabo: Laboratórios primeiro | **Laboratórios primeiro**: já está construído, destrava o desligamento do Pedidos no legado (o desvio cresce todo dia) e tira a Omie do navegador do dono. Por isso a Fase 1 foi reduzida a 2–3 semanas | Contagem primeiro |
| 4 | Data da virada do Nutra | A, B, C: até 01/01. Arquiteto, Diabo, Pensador: impossível | **Janela objetiva de 05 a 20** (seção 6); realista: ligar em março, primeira rodada no novo em 01/04/2027 | Data fixa 01/01; "primeira janela elegível" (revisão) |
| 5 | Tamanho do núcleo na Fase 1 | A e C: ~13 serviços. Diabo: só o que tem consumidor | Fase 1 mínima: unidade, empresa, pessoas com papel, login, permissões, auditoria, casca | Núcleo completo; Fase 1 de 6–8 semanas (revisão) |
| 6 | Título único | C, B, Financeiro, Diabo | Parcela de laboratório continua só em pedidos_novo. Pagamentos V1 só com parcelas de laboratório; título único e outras origens só na Fase 6 (condicional) e conforme a D24 | "Porta única de todo dinheiro que sai" (revisão) |
| 7 | Pessoas e Gente | B, RH, Diabo | Lotação no núcleo só da Bizneo; carga dos colaboradores na Fase 4 | Gente como menu; carga na Fase 1; lotação lida da Premiação (revisão) |
| 8 | Atendimento à Rede | B: módulo próprio | Chamados e comunicados em Unidades (Fase 3,5 e 4) | Atendimento como módulo |
| 9 | Vocabulário | B e Designer × mestre | Um vocabulário, rótulo nomeando quem age | Rótulo por papel |
| 10 | Numeração de pedido | C: única | DH só para laboratório; série própria para compras gerais | Numeração única |
| 11 | Onde fica a LGPD | A, C, B, Jurídico | Documental na Fase 0; **um único lugar: Administração › Privacidade, operada pelo encarregado**. O Jurídico só marca retenção jurídica por caso | LGPD dentro do Jurídico; LGPD em 3 lugares (revisão) |
| 12 | Implantação de unidade | A e C: Fase 6. Expansão e Diretor: já | Planilha-checklist na 0,5 se houver abertura antes; tela na 3,5; completa na 7 | Implantação em tela na Fase 1 (revisão) |
| 13 | Segunda etapa para o sócio | A e B: MFA. Sócio: nunca aplicativo | D10 | Aplicativo autenticador |
| 14 | Contenção de segurança | Segurança e B: tudo na Fase 0 | Só o sem efeito para o usuário, com chave dupla (D2) | Tudo na Fase 0 |
| 15 | Painel da direção | Diretor: antes | Painel de 5 números na 3,5, depois do primeiro desligamento | Painel na Fase 1 (revisão) |
| 16 | Barra inferior no celular | Designer × B e Sócio | Mantida, no máximo 5 posições | Retirar |
| 17 | Assinatura da receita: trava ou aviso | Compras: aviso. RT e Qualidade: trava dura | **Revisado:** a receita migra como está; a trava da RT é mudança de regra separada, depois da Fase 2, com piloto em modo aviso (D15) | Trava dura junto com a virada (revisão) |
| 18 | Premiação lê o núcleo | B: como se já fosse decidido | Decisão do dono (D11), só na direção "a Premiação lê o núcleo" | Texto de B |
| 19 | Comercial "ao centavo" com a Premiação | C e Comercial × Diabo | **Revisado: retirado.** Comercial vem da ZurIA; nada é conferido nem lido na Premiação | Conferência ao centavo com a Premiação (revisão) |
| 20 | Pedidos e Contagem mudam de login juntos (mestre) | Mestre: juntos. Desenho: Laboratórios na Fase 2, Contagem na 3 | **Mudança registrada:** os logins se separam por cerca de 6 semanas; custo de uma senha a mais para sócios e gestoras, contra a premissa "mesma senha". Mitigação na D25 | Mudança de login conjunta |

### 9.2 Como cada grupo de objeções foi resolvido

As 103 objeções estão em 42 grupos. **A** = aceita (31), **M** = mitigada (3), **D** = depende do dono (8). Os marcados "rev." foram alterados nesta revisão.

| Objeção | Resolução |
|---|---|
| Receita da franqueadora sem lugar (Diretor, Pensador, Consultor, Jurídico) | **D17**: levantamento na 0,5; rev.: lugar reservado em Pagamentos › Recebimentos da rede e dono do dado definido |
| Sem metas de ROI nem orçamento (Diretor, Diabo) | **A**: linha de base por fase; rev.: planilha de custo total e horas (D5) |
| Expansão desalinhada; implantação tardia; Provisionar unidade; inauguração com 2 donos (Diretor, Expansão) | **A**, rev.: planilha-checklist na 0,5; tela na 3,5; Provisionar como lista de tarefas com conferência semanal; **D18, D22** |
| Congelamento formal; conferir commits de casca (Diretor, Pensador, Diabo) | **D1** |
| Dono padrão por pendência; agrupamento (Operações, Designer) | **A** |
| Lote × uma a uma (Operações, Designer) | **D7** (padrão: uma a uma) |
| Segregação com 2 usuárias; Operações pode tudo; quem prepara e autoriza (Operações, Financeiro, Segurança) | **D8, D21**; rev.: regra das 2 pessoas com 3 nomes elegíveis |
| Sequência Estoque × Laboratórios; calendário impossível (Operações, Compras, Arquiteto, Pensador, Diabo) | **A**, rev.: janela objetiva com 3 datas publicadas |
| Fonte única da pendência e gravador único na convivência (Operações, Dados) | **A** |
| Menu do sócio, vocabulário, nunca ver outra loja (Sócio, Designer) | **A**, rev.: menu sem esconder (D8-bis); blocos na ficha; teste de 3 toques |
| Login de quem aprova (Sócio) | **D10** |
| Equipe sem e-mail; perfil Recepção; ciência sem login (Gerente, RH, Qualidade) | **A** (link de uso único depende da D26) |
| Minha unidade; virada sem surpresa; teste com recepção (Gerente) | **A**, rev.: pacote de treinamento por papel em cada virada |
| Ato privativo da RT travado no banco (RT, Qualidade) | **A** (quando a trava entrar, D15) |
| Parecer sobre a receita por média (RT, Jurídico) | **D15**, rev.: deixou de ser portão da Fase 2 |
| Habilitação como trava dura (RT) | **A**, rev.: adiada para depois da Fase 2 (9.1, item 17) |
| Dono único da função técnica (RT) | **A** |
| Área de saúde e LGPD (RT, Jurídico, IA, Segurança) | **M**, rev.: schema com GRANT revogado; não entra sem D8-bis e D28 |
| Título único; fonte única da parcela (Financeiro, Arquiteto, Diabo) | **A** |
| Critério numérico em toda virada com dinheiro (Financeiro, Dados) | **A**: 3 níveis, contra o legado |
| "Planilha dispensada" nunca é baixa; estorno no lugar de exclusão (Financeiro) | **A** |
| Rotina da Omie fora do navegador do dono (Financeiro) | **A**: Fase 2 |
| Recebimento só mexe no estoque depois do de-para (Compras) | **A** |
| Numeração DH preservada (Compras, Dados) | **A + D13** |
| Lotação; fonte de nome e cargo; dois donos de movimentação (RH) | **M**, rev.: lotação só da Bizneo; **D12** |
| Jurídico reservado; escopo do consultor (Jurídico) | **A**, rev.: schema próprio e D28 |
| Prazos decadenciais sem esperar o módulo (Jurídico) | **A**: Fase 0,5, locações por planilha conferida |
| Titularidade dos ativos digitais (Jurídico, Infra) | **D3** |
| Dono único do ciclo de qualidade (Qualidade, Consultor) | **A** |
| Notificação ou auto sanitário sem lugar (Qualidade, Consultor) | **A**, rev.: regra de triagem; tela na 3,5 |
| POP como dado antes de migrar (Qualidade) | **A** |
| Contrato de leitura da Premiação; faturamento líquido; NPS; alerta do ZurIA (Comercial, Arquiteto, Dados, Segurança, Diabo) | **D11**, rev.: comercial da ZurIA; D19 retirada |
| Avisos sem casa entre fases; consultor e carteira (Consultor) | **A** |
| Matriz de gravação (Arquiteto) | **A**, rev.: por campo |
| Mapa de navegação; teste com usuários (Designer) | **A** |
| Equivalência de unidades; 1.152 × 1.344 arquivos (Dados, Infra) | **A**, rev.: nucleo.unidade com o mesmo uuid, sem alterar public.unidades |
| Bloqueio da IA no servidor (IA) | **A**, rev.: só NF e PV com piloto |
| RLS de verdade; Premiação sem acesso amplo; backup cifrado (Segurança) | **A**, rev.: risco aceito dos 2 caminhos diretos, mitigação em 3.3 |
| Contenção imediata de segurança (Segurança) | **M + D2**, rev.: chave dupla |
| Contas, hospedagem, schema, restauração (Infra) | **A**, rev.: transferência semanal, varredura de segredos, restauração em projeto à parte; **D3, D4** |
| Critério de pronto por fase (Pensador) | **A**; **D16** |
| Núcleo sem corte; legado vivo; orçamento (Diabo) | **A**, rev.: V1 de 3 entregas; **D5** |

### 9.3 Premiação fora: prós × contras (debate pedido pelo dono)

A decisão é do dono e não se rediscute; o conselho registra o debate com honestidade.

| Contras de deixar fora | Prós de deixar fora |
|---|---|
| Segundo login para os 19 sócios (6 ativos) | Competência de outubro ainda aberta (100 pendências, 35 lojas sem aprovação): mexer agora arrisca o pagamento |
| 697 pessoas e 56 lojas em cadastro duplicado | A política da Premiação ainda vai ser criada; desenhar antes seria refazer |
| Aprovações do sócio em dois lugares | Risco zero no prêmio, que é dinheiro na folha de quase 700 pessoas |
| Inauguração e encerramento com dois donos (tarefa manual de provisionar e desprovisionar na Premiação) | O sistema de operações pode nascer sem depender do calendário da Premiação |
| Indicadores comerciais não podem usar o faturamento da Premiação: precisam vir da ZurIA, com risco de duas fórmulas | Separação clara de responsabilidade (prêmio × operação) |
| Mesmo projeto Supabase: restauração, plano e segredos precisam do checklist "efeito na Premiação" (3.3) | — |

**Alternativa recomendada:** D11 opção (b), a Premiação lê os cadastros do núcleo (unidades e pessoas), quando o dono quiser e numa janela entre competências, sem o núcleo ler nada dela. **Contra-argumento de quem defende a (c) (mesmo login):** é a única opção que acaba com a segunda senha do sócio e com as aprovações em dois lugares; o custo é alterar a Premiação, o que só cabe depois de a política estar escrita e de uma competência fechar sem pendências.

### 9.4 Registro desta revisão: o que mudou e o que não foi aplicado

**Mudanças em relação à versão anterior deste desenho (todas as 14 de gravidade alta aplicadas):** cobrança da 0,5 lê o legado, com 2 semanas de revisão por Operações; risco dos 2 caminhos diretos ao banco registrado e mitigado (3.3); janela de virada objetiva com 3 datas; V1 cortada em 3 entregas; Fase 1 mínima de 2–3 semanas; Premiação sem visões novas, sem desligamento de telas e sem D19; D8-bis criada; Fase 0 com chave dupla, transferência semanal, upgrade fora das datas da Premiação e varredura de segredos; receita do dia 01 migrada como está; legado com só o Pedidos congelado; separação de login Pedidos × Contagem registrada (9.1, item 20; D25); regra "projeto compartilhado com a Premiação"; Recebimentos da rede reservado; prós × contras da Premiação (9.3). Das médias e baixas, aplicadas: matriz por campo, pré-requisitos da 0,5, custo total, regra das 2 pessoas, Fase 6 condicional e D27, Pagamentos V1 só laboratório, nucleo.unidade, regras de login, IA em piloto, "depende da D#" e padrões, 12 regras do Laboratório, Reposição única e ordem do dia 01, detalhes da Contagem, 9 regras do Compras, conferência fiscal da nota de entrada, D24, triagem de notificações, peças de franquia no Jurídico, encerramento e "pronto para inaugurar", capacitação e treinamento por virada, imóvel e equipamentos, menu do sócio em blocos, papéis e desligamento pela Bizneo, comunicados e chamados, pedidos de melhoria e incidentes, campos sem dono, lixeira só para não aprovado, dicionário de indicadores e consultas públicas, contagens e nomes padronizados, arquivo de estado.

**Não aplicado ou aplicado de outro jeito, com o porquê:**
1. **LGPD com o Jurídico gravando** (sugestão de uma das críticas): não aplicado. A outra crítica e a posição já vencida em 9.1, item 11 apontam para um único lugar fora do Jurídico; ficou Administração › Privacidade, operada pelo encarregado, e o Jurídico só marca retenção jurídica por caso. Assim há um dono só.
2. **Encerramento/transferência mínimo e portão "pronto para inaugurar" na Fase 1** (em tela): aplicados como planilha-checklist na 0,5 e tela na 3,5, porque a outra crítica (gravidade alta) reduziu a Fase 1 ao mínimo e proibiu módulo novo antes do primeiro desligamento.
3. **Chamados com categoria e SLA "já nos chamados mínimos da Fase 1"**: os chamados saíram da Fase 1 (gravidade alta); a categoria, a área dona, o prazo e as perguntas frequentes entram quando os chamados forem construídos (3,5).
4. **Renomear Pagamentos para "Pagamentos e recebimentos"**: aplicado como submenu reservado "Recebimentos da rede", para manter o nome curto no menu.
5. **Gratificação do RT** (DP ou Pagamentos PJ): não decidida aqui; migra como dado de leitura e fica como pendência da Fase 4, porque Pagamentos V1 só trata parcelas de laboratório.
6. **"Senha mantida sempre" × "listar hashes não migráveis"**: as duas foram combinadas: rehash transparente para todos os conferíveis; troca assistida, com o dono ciente, só para os que não puderem ser conferidos.
7. **Equipamentos da unidade**: ficam no mapa (Fase 4 ou 7), não na V1.
8. **Consumo × vendas do ZurIA**: só se houver contrato de leitura com a ZurIA, que é somente consulta.

---

## Anexo: conferência das 223 funções da matriz

A fonte é `matriz.md`, com 223 funções: Premiação 66, Pedidos 46, Documentos 33, POPs 13, Cadastros auxiliares 6, Compras/Estoque 41, Reembolsos 8, Estoque Nutra 10 (7 sistemas + cadastros auxiliares). Cada função é **contada pelo módulo que a grava** (a coluna "onde aparece" pode ser outra). "Fase" é a deste desenho. Uma função "preservada como regra" não se perde: fica documentada como requisito e vira teste de aceite quando a tela existir.

### A.1 Premiação: 66 → continua na Premiação (fora), sem alteração

| Grupo de funções | Qtd. | Destino |
|---|---|---|
| Acesso: entrar, primeiro acesso, trocar senha, sair | 4 | Premiação. Mesmo login só com a D11(c) |
| Quadro e aprovação: quadro do mês, por sócio, lote/fila por loja, página da loja, aprovar números, apontar problema, aprovar em nome, aprovação automática, avisos ao sócio | 9 | Premiação. No Início, só o link "Abrir a Premiação" |
| Dados de vendas: dados do mês, gravar em lote, cancelamentos, arquivos do ZurIA, "vendeu em outra loja", ingestão ZurIA | 7 | Premiação. Indicadores não leem daqui |
| Pessoas: lista, ficha com memória de cálculo, corrigir e excluir lançamento, movimentar, incluir pessoa, conferência | 7 | Premiação |
| Pendências e correções | 10 | Premiação |
| Planos especiais: pedir, cancelar, decidir | 3 | Premiação |
| Mês, metas, NPS e orçamento | 10 | Premiação |
| Colaborador e saídas: meu prêmio, ciência, contestar, responder, recibos, relatórios, política | 7 | Premiação |
| Configuração e motor: regras, cadastro de lojas, usuários, códigos, resetar senha, ver como, histórico, carga Bizneo, motor | 9 | Premiação. O cadastro de lojas segue manual, com tarefa de provisionar por Operações |
| **Total** | **66** | |

### A.2 Pedidos: 46

| Grupo de funções | Qtd. | Destino | Fase |
|---|---|---|---|
| Pedidos: listar e filtrar, ficha, criar pedido interno, editar, cancelar, reabrir, itens e fonte | 7 | Compras e estoque › Laboratórios › Pedidos | 2 |
| Integrações do laboratório: planilha, etapa e previsão, NF da Omie, Portal Omie, rastreio Quality, "seguiu junto", rastreio completo | 8 | Laboratórios (dado) + Administração › Rotinas (execução, um só gravador) | 2 |
| Registrar recebimento na unidade | 1 | Laboratórios; Recebimentos únicos se a Fase 6 entrar | 2 / 6 |
| Anexar arquivos em lote (PV, receita, NF, boleto) | 1 | Laboratórios, no acervo do núcleo | 2 |
| NF e pedido de venda: NFs/DANFE/XML, conferência pedido × NF, anexar PV, divergências PV | 4 | Laboratórios › Notas e PV (divergências no Início) | 2 |
| Receitas: gerar no dia 01, ajustar, fluxo até o RT, pedido a partir da receita | 4 | Laboratórios › Receitas do mês, **migradas como estão** (D15) | 2 |
| Contrato Injemed e pedidos Injemed | 2 | Laboratórios › Injemed | 2 |
| Parcelas e boleto, comprovante, situação de pagamento, resumo segundo o laboratório, cobrar baixa | 5 | Pagamentos | 0,5 (cobrança lendo o legado) / 2 |
| Cadastro de RTs, prescritores, checklist de documentos, anexar termo, modelos Injemed | 5 | Documentos e qualidade (a pessoa fica no núcleo) | 1 (RT) / 4 |
| Cadastro da clínica; código de cliente e termo Injemed | 2 | Unidades › Ficha (o termo pertence a Documentos e qualidade) | 1 |
| Produtos e vigências; configurações; histórico; membros e papéis; criar e trocar senha; backup JSON semanal | 6 | Núcleo e Administração | 0 / 1 |
| Receitas Injemed por paciente (0 registros) | 1 | Não vira tela; estrutura preservada (não entra antes da D8-bis e da D28) | — |
| **Total** | **46** | | |

**Regras do Laboratório a preservar (testes de aceite da Fase 2).** Além das já citadas (3 baixas; planilha só na 1ª parcela; Injemed só com a nossa baixa; baixa sem comprovante só se a Omie já baixou; robôs 1 vez ao dia; não inventar datas; NF abaixo de R$ 500,00, conforme D14):
1. preço conferido com a tabela vigente na data de emissão da NF;
2. bonificação (CFOP 5910/6910) soma quantidade, não valor;
3. NF cancelada cancela só as parcelas sem pagamento;
4. ligação NF → pedido por carta de correção (2 casos hoje fixos no código, que vão para a ficha do laboratório), xPed, número ou nome do anexo;
5. prazo de 30 dias corridos serve só para marcar atraso;
6. retirada em Sorocaba conta como entregue;
7. Quality sem ano: o ano é deduzido pela emissão;
8. campo "crédito" do pedido de venda;
9. receita pela média de N meses;
10. arredondar para cima em múltiplos de 50;
11. trocar minox-2 por minox-05 e complexo por pillfood (vão para o de-para do Catálogo, nunca para o código);
12. protocolo Antigo/Novo da unidade e rascunho vazio para unidade sem pedido.

### A.3 Documentos: 33

| Grupo de funções | Qtd. | Destino | Fase |
|---|---|---|---|
| Entrar, primeiro acesso, trocar senha, sair, listar minhas unidades | 5 | Login único e seletor (núcleo) | 1 / 4 |
| Preencher item, anexar, baixar, enviar para análise | 4 | Documentos e qualidade › Por unidade | 4 |
| Matriz geral, conferir, editar pelo admin, observação interna, renomear arquivo, mover arquivo | 6 | Documentos e qualidade (Operações); observações migradas como histórico | 4 |
| Painel do consultor tributário | 1 | Documentos e qualidade (acesso externo nominal, mesmos 5 itens) | 4 |
| Ler avisos, escrever avisos | 2 | Unidades › Comunicados (258 avisos como histórico) | 4 |
| Telefone de contato | 1 | Unidades › Ficha | 1 |
| Cadastrar ou editar unidade, importar em lote, excluir unidade sem arquivos (vira "encerrar") | 3 | Unidades / Administração › Cadastros (nucleo.unidade; public.unidades intacta até a Fase 4) | 1 / 4 |
| Painel do responsável | 1 | Início / Minhas lojas | 1 |
| Prazo único; cadastrar, redefinir e excluir acesso; histórico da unidade | 5 | Administração | 1 / 4 |
| Documentos societários | 1 | Jurídico › Societário (grava ao fim da Fase 5); visível em Documentos | 4 / 5 |
| Entrar com CNPJ, gerar token, ligar/desligar login por CNPJ, exportar ao Pedidos antigo | 4 | Não migram, com decisão registrada | — |
| **Total** | **33** | | |

Regra preservada: "nenhum arquivo é excluído, nem pelo admin" vale para todo documento aprovado ou assinado; a lixeira de 90 dias vale só para rascunho e não aprovado.

### A.4 POPs: 13

| Grupo de funções | Qtd. | Destino | Fase |
|---|---|---|---|
| Consultar, emitir, emitir em lote, documentos regulatórios, POP específico, rascunho, painel geral, padronizar/aprovar/devolver, arquivar, emitir pela clínica | 10 | Documentos e qualidade › POPs | 4 |
| Dados da clínica (RT e gestora) | 1 | Função no núcleo, gravada por Documentos e qualidade | 1 / 4 |
| Entrar com CNPJ e e-mail | 1 | Substituída pelo login único individual | 4 |
| Zerar demonstração | 1 | Administração / projeto de teste | 0 |
| **Total** | **13** | | |

### A.5 Cadastros auxiliares: 6

| Função | Quem grava | Onde aparece | Contada em | Fase |
|---|---|---|---|---|
| Sócio por unidade | Operações até o fim da Fase 5; depois Jurídico › Societário | Unidades, Permissões, Pagamentos | Jurídico | 1 / 5 |
| Ficha do laboratório (regras de baixa) | Compras e estoque › Fornecedores | Laboratórios, Pagamentos | Compras e estoque | 1 |
| CNES | Documentos e qualidade | Unidades | Documentos e qualidade | 4 |
| Inscrição estadual | Documentos e qualidade (requisito); o dado fica na Empresa | Unidades | Documentos e qualidade | 4 |
| Contrato com o RT | Jurídico › Contratos | Documentos e qualidade (requisito) | Jurídico | 5 |
| Validade do certificado digital | Operações até o fim da Fase 5; depois Jurídico › Societário; prazo no motor | Prazos | Jurídico | 0,5 / 5 |
| **Total: 6** | | | | |

### A.6 Compras/Estoque: 41

| Grupo de funções | Qtd. | Destino | Fase |
|---|---|---|---|
| Solicitações: criar, enviar, cancelar, importar | 4 | Compras gerais (ou regra preservada) | 6 |
| Cotações: registrar com print, reabrir | 2 | Compras gerais (ou regra preservada) | 6 |
| "De acordo", aprovar, aprovar em lote | 3 | Início (lote conforme a D7) | 6 |
| Registrar compra, corrigir compra, pedido de catálogo | 3 | Compras gerais | 6 |
| Contratos e tabela de preços | 1 | Contrato no Jurídico; preço no Catálogo | 5 / 6 |
| Receber, avaliar, estornar recebimento | 3 | Recebimentos | 6 |
| NF: registrar, nota de prestador, conferir, vincular, aceitar, cancelar, corrigir | 7 | Notas de entrada (com retenções, IBS/CBS e manifestação) | 6 |
| Títulos: programar, pagar, atualizar, cancelar (estorno), fatura de cartão | 5 | Pagamentos (conforme D24; até lá, regra preservada) | 6 |
| Estoque: movimento, contagem, transferência, saldos | 4 | Estoque | 3 / 6 |
| Sugerir e gerar reposição | 2 | Reposição única (dirigida pelo Catálogo) | 3 / 6 |
| Cadastrar fornecedor; confirmar troca bancária | 2 | Núcleo › Contraparte (tipo fornecedor) | 1 / 2 |
| Reposição automática diária | 1 | Administração › Rotinas, desligada com decisão registrada | 6 |
| Pessoas e papéis | 1 | Núcleo › Usuários e acessos | 1 |
| Cadastro de unidades e empresas com vigência | 1 | Unidades (modelo de vigência adotado) | 1 |
| Limpar arquivos órfãos | 1 | Administração › Rotinas | 1 |
| Leitura de documentos por IA | 1 | Serviço do núcleo (piloto NF e PV) | 2 |
| **Total** | **41** | | |

**Regras do Compras a preservar (cmp_sc_guard, cmp_config; testes de aceite da Fase 6 ou requisito documentado se ela não entrar):**
1. categoria regulada (4 de saúde/Anvisa) proibida em loja online;
2. justificativa quando a cotação escolhida não é a mais barata;
3. print ou PDF obrigatório por cotação;
4. mínimo de cotações dispensado para fornecedor fixo;
5. tolerância de valor de 2%;
6. quem cotou não dá o "de acordo";
7. nota do fornecedor recalculada pelas avaliações de recebimento;
8. títulos bloqueados se "aguardando nota" ou "dados bancários pendentes";
9. lembrete de 48 h (hoje configurado e sem rotina), que passa a usar o serviço de Comunicação.

A aprovação por exceção muda a função "Aprovar solicitação (sócio)", que hoje aprova toda solicitação: é mudança de regra que depende da D20 e do aceite expresso dos 2 sócios entrevistados.

### A.7 Reembolsos: 8 (0 registros; fora do escopo desde 25/11 até a D27; as regras ficam preservadas)

| Grupo de funções | Qtd. | Destino | Fase |
|---|---|---|---|
| Bloquear edição conforme a situação; voltar ao financeiro se o PIX mudar | 2 | Pagamentos › Reembolsos (se D27) | 6 |
| Validar PIX; validar CPF/CNPJ | 2 | Núcleo › Pessoa | 6 |
| Quem aprova por unidade | 1 | Motor de aprovação (pela lotação na data) | 6 |
| Categorias; configuração de segregação e prazo | 2 | Administração › Parâmetros (de-para com o plano de contas da Omie: as 16 categorias, portão da Fase 6) | 6 |
| Empresas pagadoras e modo de pagamento (omie_cash) | 1 | Núcleo › Empresa.bancário (modelo reb_empresa_pagto) | 1 |
| **Total** | **8** | | |

### A.8 Estoque Nutra: 10

| Grupo de funções | Qtd. | Destino | Fase |
|---|---|---|---|
| Formulário de contagem | 1 | Estoque › Contagem do mês (link de uso único, D26, ou login da gestora; "quem contou" obrigatório; "outros produtos" em fila) | 3 |
| Painel por unidade e rodada, ver como, abrir, editar e fechar rodada, preço por rodada | 6 | Estoque › Contagem do mês (sempre por rodada; valor do estoque) | 3 (painel lido no novo já na Fase 2 se D25(a)) |
| Entrar no painel | 1 | Login único com rehash transparente (D25) | 1 / 3 |
| Virada automática no dia 1 | 1 | Administração › Rotinas, na ordem fixa do dia 01 | 3 |
| Preço atual por produto | 1 | Núcleo › Catálogo | 1 |
| **Total** | **10** | | |

### A.9 Resumo por destino (contado pelo módulo que grava)

| Destino | Premiação | Pedidos | Documentos | POPs | Cad. aux. | Compras | Reembolsos | Nutra | Total |
|---|---|---|---|---|---|---|---|---|---|
| Premiação (fora, intacta) | 66 | | | | | | | | 66 |
| Compras e estoque | | 27 | | | 1 | 25 | | 7 | 60 |
| Documentos e qualidade | | 5 | 11 | 11 | 2 | | | | 29 |
| Pagamentos | | 5 | | | | 5 | 2 | | 12 |
| Jurídico | | | 1 | | 3 | 1 | | | 5 |
| Unidades | | 2 | 6 | | | 1 | | | 9 |
| Início | | | 1 | | | 3 | | | 4 |
| Núcleo e Administração | | 6 | 10 | 2 | | 6 | 6 | 3 | 33 |
| Não migra como tela (decisão registrada) | | 1 | 4 | | | | | | 5 |
| **Total** | **66** | **46** | **33** | **13** | **6** | **41** | **8** | **10** | **223** |

Conferência: 66 + 60 + 29 + 12 + 5 + 9 + 4 + 33 + 5 = **223**. Nenhuma função ficou sem destino. Mudança em relação à versão anterior: a ficha do laboratório passou de Núcleo para Compras e estoque, porque é gravada por Compras › Fornecedores. Das 223, as de Compras gerais (Fase 6) e Reembolsos podem ficar como regra preservada, sem tela, se não houver volume (D16, D27).
