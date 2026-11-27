# Matriz de funções: de onde vêm e para onde vão no sistema único

Fontes: inv-premiacao.md §2, inv-pedidos.md §3 (e §2 para integrações), inv-documentos.md A–D, inv-compras-reembolsos-nutra.md §1.2, 2.2, 3.2, r2-designer.md (menu) e r2-arquiteto.md (fases). Esta tabela traz só funções que já existem hoje. Ficam de fora as propostas novas, como o alerta de vencimento e as etapas do Reembolso que ainda não estão programadas.

| Sistema atual | Função | Quem usa | Onde fica no sistema único (item do menu › tela) | Fase | Observação |
|---|---|---|---|---|---|
| Premiação | Entrar (login com senha) | Todos | Login único | 7 | Bloqueio após 5 erros; sessão de 12 h hoje |
| Premiação | Primeiro acesso com código de 6 dígitos | Todos | Login único › Primeiro acesso | 7 | |
| Premiação | Trocar senha | Todos | Menu do usuário › Trocar senha | 7 | |
| Premiação | Sair | Todos | Menu do usuário › Sair | 7 | |
| Premiação | Quadro do mês (faltas para aprovar, indicadores, tabela de lojas) | Operações, Sócio | Premiação › Quadro do mês | 7 | Até a fase 7, só link sem contador |
| Premiação | Visão agrupada por sócio | Operações | Premiação › Quadro do mês › Por sócio | 7 | Sócio não vê esta aba |
| Premiação | Lote por assunto / fila por loja | Operações | Pendências | 7 | |
| Premiação | Página da loja (cabeçalho, equipe e prêmios) | Operações, Sócio | Premiação › Quadro do mês › Página da loja | 7 | |
| Premiação | Aprovar números da loja | Sócio | Pendências › Decisão | 7 | Botão "Aprovar" |
| Premiação | Apontar problema nos números da loja | Sócio | Pendências › Decisão | 7 | Vira "Pedir explicação" |
| Premiação | Aprovar em nome do sócio, com motivo | Operações | Pendências › Decisão | 7 | "Aprovar em nome de" |
| Premiação | Aprovação automática do mês quando nada impede | Sistema | Premiação › Quadro do mês | 7 | Gatilho no banco; não mexer |
| Premiação | Avisos ao sócio (aprovação caiu, pedido recusado) | Sócio | Pendências | 7 | |
| Premiação | Dados do mês da loja (números e grade das pessoas) | Operações grava; Sócio pede | Premiação › Quadro do mês › Página da loja | 7 | |
| Premiação | Gravar dados do mês em lote | Operações | Premiação › Importar dados e metas | 7 | |
| Premiação | Consultar cancelamentos do mês e comprovante | Operações, Sócio | Premiação › Quadro do mês › Página da loja | 7 | |
| Premiação | Importar cancelamentos do ZurIA | Operações | Premiação › Importar dados e metas | 7 | |
| Premiação | Consultar arquivos de origem do ZurIA | Operações, Sócio | Premiação › Quadro do mês › Página da loja | 7 | |
| Premiação | Aviso "vendeu em outra loja" | Operações, Sócio | Premiação › Quadro do mês › Página da loja | 7 | |
| Premiação | Receber relatórios do ZurIA (ingestão) | Claude | Configurações › Rotinas | 7 | Sem tela hoje; chave interna |
| Premiação | Lista de pessoas | Operações, Sócio | Premiação › Pessoas | 7 | |
| Premiação | Ficha da pessoa com memória de cálculo e régua | Operações, Sócio | Premiação › Pessoas › Ficha da pessoa | 7 | |
| Premiação | Corrigir lançamento da pessoa | Operações grava; Sócio pede | Premiação › Pessoas › Ficha da pessoa | 7 | Justificativa obrigatória |
| Premiação | Excluir lançamento da pessoa | Operações grava; Sócio pede | Premiação › Pessoas › Ficha da pessoa | 7 | |
| Premiação | Movimentar pessoa (transferência ou empréstimo) | Operações grava; Sócio pede | Premiação › Pessoas › Ficha da pessoa | 7 | |
| Premiação | Incluir pessoa no mês | Operações grava; Sócio pede | Premiação › Pessoas | 7 | |
| Premiação | Conferência sistema × planilha prêmio × planilha financeiro | Operações | Premiação › Conferência | 7 | |
| Premiação | Responder pendência (concordar ou explicar) | Sócio | Pendências › Decisão | 7 | |
| Premiação | Analisar e decidir pendência ("vale o sistema"/"vale a planilha") | Operações | Pendências › Decisão | 7 | |
| Premiação | Decidir pendências em lote | Operações | Pendências | 7 | |
| Premiação | Criar pendência manual | Operações | Pendências | 7 | |
| Premiação | Sugerir débito que explica divergência de à vista | Operações | Pendências › Decisão | 7 | |
| Premiação | Encerrar pendências vencidas (rotina das 3h10) | Sistema | Configurações › Rotinas | 7 | |
| Premiação | Pedir correção (alteração do sócio vira pedido) | Sócio | Pendências | 7 | |
| Premiação | Cancelar pedido de correção | Sócio | Pendências | 7 | |
| Premiação | Decidir pedidos de correção (até 300 por vez) | Operações | Pendências › Decisão | 7 | |
| Premiação | Decidir conflito de importação | Operações | Premiação › Conferência | 7 | Manter correção ou usar a fonte |
| Premiação | Pedir plano especial | Sócio | Premiação › Planos especiais | 7 | |
| Premiação | Cancelar plano especial | Sócio | Premiação › Planos especiais | 7 | |
| Premiação | Decidir plano especial | Operações | Pendências › Decisão | 7 | |
| Premiação | Abrir o mês | Operações | Premiação › Importar dados e metas | 7 | |
| Premiação | Definir forma da faixa do mês | Operações | Premiação › Importar dados e metas | 7 | |
| Premiação | Importar planilhas por fonte | Operações | Premiação › Importar dados e metas | 7 | |
| Premiação | Importar pessoas e lojas | Operações | Premiação › Importar dados e metas | 7 | |
| Premiação | Lançar NPS por loja | Operações | Premiação › Importar dados e metas | 7 | Replica para biomédicas e recepção |
| Premiação | Publicar metas (todas ou lojas escolhidas) | Operações | Premiação › Importar dados e metas | 7 | |
| Premiação | Reabrir metas | Operações | Premiação › Importar dados e metas | 7 | |
| Premiação | Aprovar o mês | Operações | Premiação › Quadro do mês | 7 | |
| Premiação | Reabrir o mês | Operações | Premiação › Quadro do mês | 7 | |
| Premiação | Orçamento das lojas (mês e 2 seguintes) | Financeiro, Operações | Premiação › Importar dados e metas | 7 | Menu não tem tela própria; link do Financeiro |
| Premiação | Meu prêmio (demonstrativo e régua) | Colaborador | Premiação › Meu prêmio | 7 | Item ausente no menu do designer |
| Premiação | Dar ciência do prêmio | Colaborador | Premiação › Meu prêmio | 7 | |
| Premiação | Contestar o prêmio | Colaborador | Premiação › Meu prêmio | 7 | |
| Premiação | Responder contestação | Operações | Pendências › Decisão | 7 | |
| Premiação | Recibos (CLT, PJ, estágio) | Operações, Sócio, Contabilidade | Premiação › Recibos | 7 | |
| Premiação | Relatórios em Excel | Operações, Sócio, Contabilidade | Premiação › Relatórios | 7 | |
| Premiação | Texto e versões da política | Todos | Premiação › Política | 7 | |
| Premiação | Regras e limites (parâmetros) | Operações | Configurações › Parâmetros | 7 | Gera subversão e recalcula meses abertos |
| Premiação | Cadastro de lojas | Operações | Unidades › Ficha da unidade | 7 | Unir ao cadastro do núcleo |
| Premiação | Cadastro de usuários | Operações | Configurações › Usuários e acessos | 7 | |
| Premiação | Gerar códigos de primeiro acesso (até 200) | Operações | Configurações › Usuários e acessos | 7 | |
| Premiação | Resetar senha de usuário | Operações | Configurações › Usuários e acessos | 7 | |
| Premiação | Ver como outro usuário (só leitura) | Operações | Configurações › Usuários e acessos | 7 | Faixa fixa de atenção |
| Premiação | Histórico de ações | Operações | Configurações › Histórico geral | 7 | |
| Premiação | Carga do cadastro da Bizneo | Claude | Cadastros › Pessoas | 7 | Núcleo lê cópia desde a fase 1 |
| Premiação | Motor de cálculo da política | Sistema | Premiação (sem tela) | 7 | Não mexer até autorização |
| Pedidos | Listar e filtrar pedidos | Central, Unidade | Pedidos › Pedidos | já existe | |
| Pedidos | Ficha do pedido (dados, itens, parcelas, anexos) | Central, Unidade | Pedidos › Pedidos › Ficha do pedido | já existe | |
| Pedidos | Criar pedido interno (DH-…) | Central | Pedidos › Pedidos › Novo pedido | 3 | Bloqueado no novo; numeração DH a decidir |
| Pedidos | Editar dados do pedido | Central | Pedidos › Pedidos › Ficha do pedido | já existe | |
| Pedidos | Cancelar pedido | Central | Pedidos › Pedidos › Ficha do pedido | já existe | Com motivo |
| Pedidos | Reabrir pedido | Central | Pedidos › Pedidos › Ficha do pedido | já existe | Só admin |
| Pedidos | Itens por produto e fonte dos itens | Central | Pedidos › Pedidos › Ficha do pedido | já existe | |
| Pedidos | Criar pedido pela planilha do laboratório | Sistema | Configurações › Rotinas | 3 | Novo só gera alerta; decidir |
| Pedidos | Atualizar pedido pela planilha do laboratório | Sistema | Configurações › Rotinas | já existe | Novo 1x/dia; antigo de hora em hora |
| Pedidos | Etapa e previsão do laboratório | Sistema | Pedidos › Pedidos › Ficha do pedido | já existe | |
| Pedidos | Criar pedido a partir da NF da Omie | Sistema | Pedidos › Notas fiscais | 3 | |
| Pedidos | Receber dados do Portal Omie | Sistema | Configurações › Rotinas | já existe | Trocar destino da tarefa do navegador |
| Pedidos | Rastreio Quality por NF | Central, Unidade | Pedidos › Pedidos › Ficha do pedido | já existe | Novo 1x/dia; antigo 2x/dia |
| Pedidos | NF que "seguiu junto" com outra | Sistema | Pedidos › Pedidos › Ficha do pedido | 3 | |
| Pedidos | Rastreio completo (reconsultar todos) | Central | Configurações › Rotinas | 3 | |
| Pedidos | Registrar recebimento na unidade | Central | Pedidos › Pedidos › Ficha do pedido | já existe | |
| Pedidos | Parcelas, boleto e linha digitável | Central | Pedidos › Pagamentos | já existe | |
| Pedidos | Anexar comprovante de pagamento | Central | Pedidos › Pagamentos | já existe | |
| Pedidos | Anexar arquivos em lote (PV, receita, NF, boleto) | Claude | Pedidos › Pedidos › Ficha do pedido | 3 | Novo só anexa comprovante |
| Pedidos | Situação de pagamento | Central | Pedidos › Pagamentos | já existe | Regra nova: 3 baixas por parcela |
| Pedidos | Resumo pago/aberto/vencido segundo o laboratório | Central | Pedidos › Pagamentos | 3 | |
| Pedidos | Cobrar baixa do laboratório | Central | Pedidos › Pagamentos | já existe | Só monta o texto |
| Pedidos | NFs do pedido, links do portal, DANFE e XML | Central, Unidade | Pedidos › Notas fiscais | já existe | |
| Pedidos | Conferência pedido × NF | Central | Pedidos › Notas fiscais | 3 | 58 divergentes; novo só lê resultado antigo |
| Pedidos | Anexar pedido de venda do laboratório | Central | Pedidos › Pedidos › Ficha do pedido | 3 | |
| Pedidos | Divergências pedido de venda × sistema | Central | Pendências | 3 | 63 abertas sem lugar |
| Pedidos | Gerar receita mensal por unidade (dia 01) | Sistema | Pedidos › Receitas do mês | 3 | |
| Pedidos | Ajustar receita | Central | Pedidos › Receitas do mês | 3 | |
| Pedidos | Fluxo da receita até envio ao RT | Central | Pedidos › Receitas do mês | 3 | Rascunho, Gerada, Enviada ao RT |
| Pedidos | Criar pedido a partir da receita | Central | Pedidos › Receitas do mês | 3 | |
| Pedidos | Cadastro da clínica (razão, CNPJ, sócio, protocolo) | Central | Unidades › Ficha da unidade | 3 | Base da unidade já no núcleo na fase 1 |
| Pedidos | Cadastro de RTs da unidade | Central | Cadastros › Responsáveis técnicos | 3 | |
| Pedidos | Checklist de documentos da unidade | Central | Documentos › Por unidade | 3 | 114 de 155 arquivos já estão lá |
| Pedidos | Anexar termo de responsabilidade do laboratório | Claude | Documentos › Por unidade | 3 | |
| Pedidos | Cadastro de prescritores | Central | Cadastros › Pessoas | 3 | Vira profissional habilitado a prescrever |
| Pedidos | Produtos e vigências de preço | Central | Cadastros › Produtos | já existe | |
| Pedidos | Configurações (etapas, formas, tipos de anexo, planilha) | Admin | Configurações › Parâmetros | 3 | Hoje parte fixa no código do novo |
| Pedidos | Contrato Injemed (pedido mãe) | Central | Pedidos › Pedidos | já existe | |
| Pedidos | Pedidos Injemed | Central | Pedidos › Pedidos | já existe | Só a nossa baixa |
| Pedidos | Modelos de documentos Injemed | Central | Documentos › Por unidade | 3 | Hoje só no arquivo legado |
| Pedidos | Código de cliente e termo das unidades Injemed | Central | Unidades › Ficha da unidade | 3 | |
| Pedidos | Receitas Injemed por paciente | Ninguém | Pedidos › Receitas do mês | 3 | Estrutura sem uso; avaliar se migra |
| Pedidos | Histórico de alterações | Todos | Pedidos › Pedidos › Ficha do pedido | já existe | |
| Pedidos | Cadastro de membros, papéis e unidades | Admin | Configurações › Usuários e acessos | 1 | 21 no antigo, 2 no novo |
| Pedidos | Criar ou trocar senha de membro | Admin | Configurações › Usuários e acessos | 1 | |
| Pedidos | Backup JSON semanal | Sistema | Configurações › Rotinas | 3 | Substituir por backup Pro e cópia de arquivos |
| Documentos | Entrar (login por e-mail e senha) | Unidade | Login único | 2 | |
| Documentos | Primeiro acesso (criar senha) | Unidade | Login único › Primeiro acesso | 2 | |
| Documentos | Trocar senha | Unidade | Menu do usuário › Trocar senha | 2 | |
| Documentos | Sair | Unidade | Menu do usuário › Sair | 2 | |
| Documentos | Listar minhas unidades | Unidade | Cabeçalho › Seletor de unidade | 2 | |
| Documentos | Entrar com CNPJ (login antigo) | Unidade | Não migra | 2 | Já desligado |
| Documentos | Preencher item do checklist (status, datas, validade) | Unidade | Documentos › Por unidade | 2 | |
| Documentos | Anexar arquivo ao item | Unidade, Operações | Documentos › Por unidade | 2 | Até 25 MB |
| Documentos | Baixar arquivo | Unidade, Operações | Documentos › Por unidade › Visualizador | 2 | |
| Documentos | Enviar para análise | Unidade | Documentos › Por unidade | 2 | |
| Documentos | Ler avisos de Operações | Unidade | Documentos › Avisos | 2 | |
| Documentos | Telefone de contato da unidade | Unidade, Operações | Unidades › Ficha da unidade | 2 | |
| Documentos | Painel do responsável (todas as minhas unidades) | Unidade | Minhas lojas | 2 | |
| Documentos | Matriz geral unidade × item | Operações | Documentos › Por unidade | 2 | |
| Documentos | Conferir item (aprovar, recusar, incompleto) | Operações | Documentos › Conferência | 2 | |
| Documentos | Editar item pelo admin | Operações | Documentos › Por unidade | 2 | |
| Documentos | Observação interna com histórico | Operações | Documentos › Por unidade | 2 | |
| Documentos | Renomear arquivo | Operações | Documentos › Por unidade › Visualizador | 2 | |
| Documentos | Mover arquivo (inclusive para outra unidade) | Operações | Documentos › Por unidade › Visualizador | 2 | |
| Documentos | Cadastrar ou editar unidade | Operações | Unidades › Ficha da unidade | 1 | Vira cadastro mestre do núcleo |
| Documentos | Importar unidades em lote | Operações | Unidades | 1 | |
| Documentos | Excluir unidade sem arquivos | Operações | Unidades › Ficha da unidade | 1 | |
| Documentos | Gerar novo token da unidade | Operações | Não migra | 2 | Some com login individual |
| Documentos | Prazo único de envio | Operações | Configurações › Parâmetros | 2 | |
| Documentos | Cadastrar acesso (e-mail e unidades) | Operações | Configurações › Usuários e acessos | 2 | |
| Documentos | Redefinir senha de acesso | Operações | Configurações › Usuários e acessos | 2 | |
| Documentos | Excluir acesso | Operações | Configurações › Usuários e acessos | 2 | |
| Documentos | Ligar ou desligar login por CNPJ | Operações | Não migra | 2 | |
| Documentos | Histórico da unidade | Operações | Configurações › Histórico geral | 2 | |
| Documentos | Escrever avisos para a unidade | Operações | Documentos › Avisos | 2 | |
| Documentos | Painel do consultor tributário (só leitura) | Consultor externo | Documentos › Por unidade | 2 | Papel próprio, 5 itens visíveis |
| Documentos | Exportar documentos por CNPJ ao Pedidos antigo | Sistema | Não migra | 3 | Ficha da unidade lê direto |
| Documentos | Documentos societários (contrato social, cartão CNPJ) | Operações | Documentos › Por unidade | 2 | Itens internos; unidade só vê |
| POPs | Entrar com CNPJ e e-mail | Clínica | Login único | 2 | Hoje sem senha |
| POPs | Dados da clínica (RT e gestora) | Clínica, Operações | Cadastros › Responsáveis técnicos | 2 | Unir aos RTs do Pedidos na fase 3 |
| POPs | Consultar POP | Clínica | POPs › Biblioteca | 2 | |
| POPs | Emitir POP (PDF ou DOCX) | Clínica | POPs › Biblioteca | 2 | |
| POPs | Emitir POPs em lote (até 80) | Clínica | POPs › Biblioteca | 2 | |
| POPs | Ver documentos regulatórios da unidade | Clínica | Documentos › Por unidade | 2 | Mesmo dado, sem cópia |
| POPs | Criar POP específico por formulário | RT da clínica | POPs › POPs específicos | 2 | |
| POPs | Enviar rascunho de POP específico (arquivo) | RT da clínica | POPs › POPs específicos | 2 | |
| POPs | Painel geral (emissões, acessos, logins) | Operações | POPs › Emissões | 2 | |
| POPs | Padronizar, aprovar ou devolver POP específico | Operações | POPs › POPs específicos | 2 | |
| POPs | Arquivar POP específico | Operações | POPs › POPs específicos | 2 | |
| POPs | Emitir POP pela clínica | Operações | POPs › Emissões | 2 | |
| POPs | Zerar demonstração | Admin | Configurações › Parâmetros | 2 | Só unidade de teste |
| Cadastros auxiliares | Sócio por unidade | Operações | Cadastros › Sócios | 1 | Hoje texto solto em 4 lugares |
| Cadastros auxiliares | Ficha do laboratório (regras de baixa) | Operações | Cadastros › Fornecedores e laboratórios | já existe | |
| Cadastros auxiliares | CNES da unidade | Operações | Documentos › Por unidade | 2 | No catálogo, nunca usado |
| Cadastros auxiliares | Inscrição estadual | Operações | Documentos › Por unidade | 3 | Só no checklist legado, vazio |
| Cadastros auxiliares | Contrato com o RT | Operações | Documentos › Por unidade | 3 | Só no checklist legado |
| Cadastros auxiliares | Validade do certificado digital | Operações | Cadastros › Empresas | 3 | 47 validades só no checklist legado |
| Compras/Estoque | Criar solicitação de compra | Solicitante | Compras e estoque › Solicitações | 5 | Piloto; 3 solicitações de teste |
| Compras/Estoque | Enviar solicitação | Solicitante | Compras e estoque › Solicitações | 5 | |
| Compras/Estoque | Cancelar solicitação | Solicitante, Compras | Compras e estoque › Solicitações | 5 | |
| Compras/Estoque | Importar solicitação de documento | Solicitante, Compras | Compras e estoque › Solicitações | 5 | |
| Compras/Estoque | Registrar cotação com print ou PDF | Compras | Compras e estoque › Cotações | 5 | Mínimo de cotações por faixa |
| Compras/Estoque | Reabrir cotação | Compras | Compras e estoque › Cotações | 5 | |
| Compras/Estoque | Dar "de acordo" na cotação escolhida | Solicitante, Gestor | Pendências › Decisão | 5 | |
| Compras/Estoque | Aprovar solicitação | Sócio | Pendências › Decisão | 5 | Segregação de funções |
| Compras/Estoque | Aprovar solicitações em lote | Sócio | Pendências | 5 | |
| Compras/Estoque | Registrar compra | Compras | Compras e estoque › Compras | 5 | |
| Compras/Estoque | Corrigir ou atualizar compra | Compras | Compras e estoque › Compras | 5 | |
| Compras/Estoque | Pedido de catálogo | Compras | Compras e estoque › Compras | 5 | |
| Compras/Estoque | Contratos e tabela de preços | Compras, Admin | Compras e estoque › Compras | 5 | |
| Compras/Estoque | Cadastrar fornecedor | Compras, Financeiro | Cadastros › Fornecedores e laboratórios | 5 | |
| Compras/Estoque | Confirmar troca de dados bancários do fornecedor | Financeiro | Pendências › Decisão | 5 | Antifraude |
| Compras/Estoque | Receber pedido | Unidade, Gestor | Compras e estoque › Recebimentos | 5 | |
| Compras/Estoque | Avaliar recebimento (prazo e qualidade) | Unidade, Gestor | Compras e estoque › Recebimentos | 5 | |
| Compras/Estoque | Estornar recebimento | Compras | Compras e estoque › Recebimentos | 5 | |
| Compras/Estoque | Registrar nota fiscal | Compras, Financeiro | Compras e estoque › Notas e contas a pagar | 5 | |
| Compras/Estoque | Registrar nota de prestador | Compras, Financeiro | Compras e estoque › Notas e contas a pagar | 5 | |
| Compras/Estoque | Conferir NF × compra | Compras, Financeiro | Compras e estoque › Notas e contas a pagar | 5 | |
| Compras/Estoque | Vincular NF à compra | Compras | Compras e estoque › Notas e contas a pagar | 5 | |
| Compras/Estoque | Aceitar NF | Compras, Financeiro | Compras e estoque › Notas e contas a pagar | 5 | |
| Compras/Estoque | Cancelar NF | Compras, Financeiro | Compras e estoque › Notas e contas a pagar | 5 | |
| Compras/Estoque | Corrigir NF | Compras, Financeiro | Compras e estoque › Notas e contas a pagar | 5 | |
| Compras/Estoque | Programar título a pagar | Financeiro | Financeiro › Contas a pagar | 5 | |
| Compras/Estoque | Pagar título | Financeiro | Financeiro › Contas a pagar | 5 | Pago à mão, sem banco |
| Compras/Estoque | Atualizar título | Financeiro | Financeiro › Contas a pagar | 5 | |
| Compras/Estoque | Cancelar título | Financeiro | Financeiro › Contas a pagar | 5 | |
| Compras/Estoque | Pagar fatura de cartão | Financeiro | Financeiro › Contas a pagar | 5 | |
| Compras/Estoque | Lançar movimento de estoque | Unidade, Compras | Compras e estoque › Estoque | 5 | |
| Compras/Estoque | Contagem de estoque | Unidade, Compras | Compras e estoque › Estoque | 5 | |
| Compras/Estoque | Transferir estoque entre unidades | Unidade, Compras | Compras e estoque › Estoque | 5 | |
| Compras/Estoque | Consultar saldos | Unidade, Compras | Compras e estoque › Estoque | 5 | |
| Compras/Estoque | Sugerir reposição | Compras | Compras e estoque › Solicitações | 5 | |
| Compras/Estoque | Gerar solicitações de reposição | Compras | Compras e estoque › Solicitações | 5 | |
| Compras/Estoque | Reposição automática diária | Sistema | Configurações › Rotinas | 5 | Roda sem gerar nada |
| Compras/Estoque | Cadastro de pessoas e papéis | Admin | Configurações › Usuários e acessos | 5 | Vira usuário e papel do núcleo |
| Compras/Estoque | Cadastro de unidades e empresas com vigência | Admin | Cadastros › Empresas | 1 | Melhor modelo de CNPJ com vigência |
| Compras/Estoque | Limpar arquivos órfãos (rotina diária) | Sistema | Configurações › Rotinas | 5 | |
| Compras/Estoque | Leitura de documentos por IA | Compras, Financeiro | Visualizador (campos "lido do documento") | 5 | Vai para o núcleo; pode servir PV antes |
| Reembolsos | Validar e normalizar chave PIX | Colaborador | Cadastros › Pessoas | 5 | Só esqueleto, nunca usado |
| Reembolsos | Validar CPF e CNPJ | Colaborador | Cadastros › Pessoas | 5 | |
| Reembolsos | Bloquear edição conforme a situação | Sistema | Reembolsos › Solicitações | 5 | |
| Reembolsos | Definir quem aprova por unidade | Sistema | Pendências › Decisão | 5 | Vem do papel, não da lotação |
| Reembolsos | Voltar ao financeiro se a chave PIX mudar | Sistema | Reembolsos › Pagamentos | 5 | Gatilho existente |
| Reembolsos | Categorias de reembolso | Financeiro, Admin | Configurações › Parâmetros | 5 | 0 categorias Omie mapeadas |
| Reembolsos | Empresas pagadoras e modo de pagamento | Financeiro, Admin | Cadastros › Empresas | 5 | Omie desligado nas 51 |
| Reembolsos | Configuração (segregação, prazo de complemento) | Financeiro, Admin | Configurações › Alçadas | 5 | |
| Estoque Nutra | Formulário público de contagem mensal | Equipe da clínica (sem login) | Compras e estoque › Contagem mensal | 4 | Nunca com rodada aberta |
| Estoque Nutra | Entrar no painel | Sócio, Gestor, Admin | Login único | 4 | Migrar hash da senha |
| Estoque Nutra | Painel de respostas por unidade e rodada | Sócio, Gestor, Admin | Compras e estoque › Contagem mensal | 4 | Filtro fixo em novembro no painel antigo |
| Estoque Nutra | Ver painel como outro usuário | Admin | Compras e estoque › Contagem mensal | 4 | |
| Estoque Nutra | Abrir rodada | Admin | Compras e estoque › Contagem mensal | 4 | |
| Estoque Nutra | Editar rodada | Admin | Compras e estoque › Contagem mensal | 4 | |
| Estoque Nutra | Fechar ou mudar situação da rodada | Admin | Compras e estoque › Contagem mensal | 4 | |
| Estoque Nutra | Virada automática da rodada no dia 1 | Sistema | Configurações › Rotinas | 4 | Primeira execução em 01/12 |
| Estoque Nutra | Preço atual por produto | Admin | Cadastros › Produtos | 4 | |
| Estoque Nutra | Preço por rodada | Admin | Compras e estoque › Contagem mensal | 4 | |

Contagem de funções por sistema: Premiação 66 · Pedidos 46 · Documentos 33 · POPs 13 · Cadastros auxiliares 6 · Compras/Estoque 41 · Reembolsos 8 · Estoque Nutra 10 · Total 223
