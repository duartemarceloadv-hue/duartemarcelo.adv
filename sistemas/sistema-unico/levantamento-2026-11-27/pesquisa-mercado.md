# Pesquisa de mercado: sistema único de operações da Dr. Hair

**Data de acesso de todas as fontes:** 2026-11-27
**Escopo:** premiação e comissões, pedidos a laboratórios de manipulação (NF, boletos, parcelas, rastreio), documentos regulatórios e societários, POPs, reembolsos (sócio aprova e depois o financeiro paga), compras e estoque, levantamento de estoque de nutracêuticos.
**Perfis de usuário:** Operações (gestora central), sócios e franqueados leigos (veem só as próprias lojas e aprovam), financeiro, gerentes de unidade.

---

## 0. Método e limitações (leia antes)

- **Como foi feito:** buscas na web (cerca de 45 consultas) em centrais de ajuda, documentação oficial (Odoo, SAP Help, TOTVS TDN, Carbon, Polaris, Atlassian, Trailhead/Spiff), lojas de aplicativos, páginas de produto e sites de avaliação (Capterra, B2B Stack, Reclame Aqui, G2).
- **Limitação principal:** a rede desta sessão **bloqueou a leitura direta das páginas** (WebFetch falhou com "host não permitido" em ajuda.omie.com.br, carbondesignsystem.com, polaris-react.shopify.com e atlassian.design). Por isso, o conteúdo abaixo vem dos **trechos indexados pelo buscador**, não da leitura integral das telas. Vídeos de demonstração não foram assistidos. Para ler as páginas inteiras, esses domínios precisam ser liberados nas configurações de rede da sessão.
- **Nível de evidência:** cada referência indica **[Doc]** (documentação ou ajuda oficial), **[Mkt]** (material de marketing do fornecedor), **[Aval]** (avaliação de usuário) ou **[Inf]** (inferência minha a partir de padrões gerais, ainda não confirmada na fonte).
- **Lacunas reais:** não encontrei documentação pública útil de Feegow e Clinicorp sobre comissões, multiunidade ou estoque. A Clinicorp só aparece em FAQs do Reclame Aqui. Uso o **Clínica nas Nuvens**, o **Codental** e o **iClinic** (que publicam ajuda no Intercom) como substitutos do segmento clínico. "Linkeding" e "Franquia Online" não retornaram resultados identificáveis. Sobre Bizneo, a busca não trouxe nada de bônus ou despesas.

---

## 1. ERPs

### 1.1 Omie
- **Faz bem [Doc]:**
  - Aprovação de pagamentos configurada **por usuário, via Grupo de Acesso**.
  - Quem não tem permissão lança a conta a pagar, mas ela fica **bloqueada**, e o usuário só pode "Enviar para Aprovação". O status passa a "Em Aprovação".
  - Aprovação **individual ou em lote**, pela lista de Contas a Pagar ou por um **Kanban de Pagamentos**. Um pagamento reprovado **volta para a coluna Pendentes**.
  - A remessa bancária só aceita títulos aprovados.
  - Aplicativo móvel para aprovar **pedidos de compra e contas a pagar**, com a empresa escolhida no login.
  - Notificação de pedido de compra pendente de aprovação, configurável por usuário.
  - Controle de **lote e validade** na entrada da NF-e e consumo automático na saída.
  - Contas a pagar geradas a partir da nota de entrada.
- **Faz mal [Aval]:** lentidão em algumas telas, filtros confusos ("não é tão intuitiva") e pouca personalização. Reembolso de despesas não é nativo: a Omie depende da integração com **VExpenses**, que traz os comprovantes e o histórico de aprovação para o contas a pagar [Mkt].
- **Serve para a Dr. Hair:**
  - O estado **"bloqueado até aprovação"** aplicado a reembolsos e pedidos acima da alçada.
  - A **reprovação que devolve o item para Pendentes com motivo**.
  - A aprovação em lote para o financeiro.
  - Lote e validade para os nutracêuticos.
  - Reembolso como **conta a pagar com comprovante e histórico anexos**.
- **Fontes:**
  - https://ajuda.omie.com.br/pt-BR/articles/9232213-gerenciando-a-aprovacao-ou-reprovacao-de-pagamentos
  - https://ajuda.omie.com.br/pt-BR/articles/5985837-configurando-a-aprovacao-de-pagamentos
  - https://ajuda.omie.com.br/pt-BR/articles/5985815-solicitacao-aprovacao-de-pagamento
  - https://ajuda.omie.com.br/pt-BR/articles/6720199-app-omie-aprovando-pedidos-de-compras-e-contas-a-pagar
  - https://ajuda.omie.com.br/pt-BR/articles/9790517-configurando-a-notificacao-do-pedido-de-compra-pendente-de-aprovacao
  - https://ajuda.omie.com.br/pt-BR/articles/11963101-ativando-o-controle-de-lote-e-validade-no-produto
  - https://ajuda.omie.com.br/pt-BR/collections/89844-compras-e-estoque
  - https://www.omie.com.br/blog/integracao-vexpenses-como-funciona-no-sistema-omie/
  - https://www.b2bstack.com.br/product/omie/avaliacoes
  - https://www.capterra.com/p/191350/Omie-ERP/reviews/

### 1.2 Conta Azul
- **Faz bem [Mkt/Doc]:**
  - Com o certificado digital configurado, importa da **SEFAZ** as notas emitidas contra o CNPJ, e da prefeitura as notas de serviço tomado. Cada nota já vira **compra, entrada de estoque e conta a pagar** (caminho: Compras, "Gerar compra pela nota", "Importar automaticamente").
  - Alertas de vencimento e controle de juros, multa e desconto.
  - **Conta Azul IA:** lê um boleto, uma NF ou um extrato e **sugere o lançamento para o usuário confirmar**.
- **Faz mal [Aval]:**
  - No Reclame Aqui: falhas em integrações, lentidão, limitações no cadastro de formas de pagamento, problemas de cobrança e licença.
  - Na B2B Stack: "ferramenta apenas para fluxo de caixa", "não funciona sozinho".
  - Não encontrei documentação de **alçada ou aprovação multiempresa**.
- **Serve para a Dr. Hair:** o padrão **"documento entra, sistema sugere, humano confirma"**, que se aplica à NF e ao boleto do laboratório. A importação automática pela SEFAZ elimina a digitação da NF de compra. Atenção: a Conta Azul não serve de modelo para a governança multiunidade.
- **Fontes:**
  - https://contaazul.com/funcionalidades/gestao-de-compras-e-fornecedores/
  - https://contaazul.com/tutoriais/como-fazer-gestao-de-compras-na-conta-azul
  - https://www.reclameaqui.com.br/empresa/contaazul/lista-reclamacoes/
  - https://www.b2bstack.com.br/product/conta-azul/avaliacoes

### 1.3 Bling
- **Faz bem [Doc/Mkt]:**
  - Importa as notas recebidas para a aba "Notas de compra" e permite **manifestação em lote**.
  - O relatório de estoque abaixo do mínimo pode **considerar o saldo de pedidos de compra em aberto**, o que evita comprar duas vezes.
  - Mostra os SKUs agrupados ou por empresa ou depósito.
- **Faz mal [Doc]:** a mesma conta só gerencia **filiais da mesma raiz de CNPJ**. Outra raiz exige outra conta. Esse modelo é **incompatível com uma rede de franquias**, em que cada unidade tem CNPJ próprio.
- **Serve para a Dr. Hair:**
  - O "estoque mínimo que já desconta pedidos em trânsito" no levantamento de nutracêuticos.
  - Visão agrupada da rede **e** individual por unidade.
  - Fica como alerta: a entidade "unidade" precisa ser independente do CNPJ e de qualquer conta.
- **Fontes:**
  - https://ajuda.bling.com.br/hc/pt-br/articles/360035597634-Como-cadastrar-filial-no-Bling
  - https://blog.bling.com.br/erp-multiempresa/
  - https://blog.bling.com.br/?p=11145
  - https://blog.bling.com.br/?p=3652

### 1.4 Tiny / Olist ERP
- **Faz bem [Mkt]:** é forte em e-commerce (pedidos, estoque, NF-e, integrações com marketplaces) e tem financeiro com contas a pagar e receber e conciliação.
- **Faz mal [Aval/Mkt]:** foco no varejo online, recursos que variam por plano e avaliações mistas (problemas de integração). Não encontrei documentação de multiempresa nem de pedido de compra.
- **Serve para a Dr. Hair:** pouco, porque o domínio é outro. Fica só a referência de **depósito padrão por canal**, que equivale a **estoque por unidade**.
- **Fontes:**
  - https://apps.shopify.com/tiny-erp
  - https://reportei.com/olist-erp/
  - https://olist.com/blog/pt/olist/olist-news/integracao-olist-e-tiny-2

### 1.5 TOTVS (Protheus, Datasul, RM)
- **Faz bem [Doc]:**
  - **Alçadas por valor:** o aprovador só vê o documento se o valor couber no limite dele (parâmetro MV_NFLIMAL).
  - Distingue o aprovador que **"dá visto"** (não consome saldo) do aprovador "de verdade" (consome saldo).
  - Liberação de documentos na rotina MATA094.
  - Aplicativos móveis dedicados:
    - **Meu Protheus:** aprova solicitações e pedidos de compra, contratos e medições, **em várias filiais**, com notificação push.
    - **Minhas Pendências de Aprovação** (Datasul): lista, ordenação, **aprovação e reprovação em lote** e **histórico**.
    - **Minhas Aprovações** (RM): visão única das pendências e das aprovações feitas em Compras, Contratos e RH.
  - Escalonamento para o superior quando o prazo vence.
  - Central de Compras que decide qual filial compra e qual recebe.
- **Faz mal [Inf]:** configuração pesada por parâmetros técnicos e um aplicativo diferente para cada linha de produto. A experiência fica fragmentada.
- **Serve para a Dr. Hair:**
  - **Uma única "Minhas Pendências"** que reúne todos os módulos (reembolso, pedido, documento, premiação) em vez de um aplicativo por módulo.
  - Alçada por valor.
  - Papel de "visto", em que a Operações toma ciência sem bloquear o fluxo.
  - Histórico de decisões.
- **Fontes:**
  - https://tdn.totvs.com/download/attachments/185758340/COM_BT_Criacao_do_parametro_MV_NFLIMAL_TRQCVR_BRA_.pdf?api=v2
  - https://tdn.totvs.com.br/download/attachments/550307175/Al%C3%A7adas%20Entidade%20Cont%C3%A1bil.pdf?api=v2
  - https://tdn.totvs.com.br/download/attachments/607604309/Webinar%20-%20APP%20Minhas%20Pendencias%20de%20Aprovacao%2023062021.pdf?api=v2
  - https://apps.apple.com/br/app/id1296255962 (Meu Protheus)
  - https://apps.apple.com/br/app/id1545370455 (Minhas Pendências de Aprovação)
  - https://apps.apple.com/br/app/id1487136790 (Minhas Aprovações)
  - https://tdn.totvs.com.br/download/attachments/152110545/LOJA_FRT_BT_Central_de_Compras_002205.pdf?api=v2

### 1.6 Sankhya
- **Faz bem [Doc/Mkt]:** **liberação de limites por alçada** baseada em "eventos de liberação" (desconto, limite de crédito). O documento fica parado na tela de liberação até o aprovador agir. O app **Sankhya OK** aprova com notificação push. Há uma rotina de aprovação de pedido de compra.
- **Faz mal [Aval]:** interface "poderia ser mais intuitiva para usuários menos experientes" e queixas de queda de conexão. Implantação historicamente pesada; a própria Sankhya reconhece isso em material de marketing.
- **Serve para a Dr. Hair:** modelar a aprovação como **"evento de exceção"**, que só aparece quando alguma regra é violada (valor acima do teto, fornecedor fora da lista, item fora do catálogo), em vez de aprovar tudo.
- **Fontes:**
  - https://apps.apple.com/us/app/id1265245741
  - https://sankhya.com.br/arquivos/book-melhorespraticas-propostacomercial-v2.pdf
  - https://www.b2bstack.com.br/product/sankhya-erp/avaliacoes
  - https://www.capterra.com/p/190258/ERP-Sankhya/

### 1.7 Odoo
- **Faz bem [Doc]:**
  - **Seletor de empresa no topo, à direita, com caixas de seleção:** é possível marcar várias empresas ao mesmo tempo e ver os dados consolidados. A empresa destacada é o contexto ativo.
  - **Chatter:** cada registro tem uma linha do tempo de mensagens, notas internas e **alterações de campos rastreadas**.
  - **Atividades:** tarefas com prazo presas a um registro, com semáforo verde (futura), laranja (vence hoje) e vermelho (atrasada).
  - **App Approvals:** categorias de aprovação, aprovadores marcados como obrigatórios e regras por valor.
  - **Inventário físico em duas etapas:** registrar a "quantidade contada" e só depois "Aplicar", com motivo, gerando um movimento de ajuste no histórico. A documentação alerta que movimentações entre a contagem e a aplicação geram divergência.
- **Faz mal [Doc/Inf]:**
  - Multiempresa exige plano Custom.
  - O banco pode recarregar a cada caixa marcada.
  - Rastrear todos os campos depende de módulo de terceiros (OCA tracking_manager).
  - Densidade e jargão contábil assustam o usuário leigo.
- **Serve para a Dr. Hair:**
  - **Seletor de unidades com seleção múltipla** e opção "Todas as minhas unidades".
  - **Linha do tempo por registro** (pedido, reembolso, documento) com comentários e alterações de campo.
  - Semáforo de prazos.
  - **Contagem de nutracêuticos em duas fases (contar, revisar, aplicar)**, que é exatamente o fluxo de levantamento de estoque.
- **Fontes:**
  - https://www.odoo.com/documentation/19.0/applications/general/companies/multi_company.html
  - https://www.odoo.com/documentation/saas-17.4/applications/general/companies.html
  - https://www.odoo.com/documentation/18.0/applications/productivity/discuss/chatter.html
  - https://www.odoo.com/documentation/19.0/applications/essentials/activities.html
  - https://www.odoo.com/documentation/18.0/applications/hr/approvals.html
  - https://www.odoo.com/documentation/15.0/applications/inventory_and_mrp/inventory/management/inventory_adjustments/count_products.html
  - https://github.com/OCA/server-tools/blob/16.0/tracking_manager

### 1.8 SAP Business One
- **Faz bem [Doc]:**
  - O procedimento de aprovação se monta com **etapas** (lista de aprovadores do mesmo nível, reutilizável) e **modelos** (quem origina, quais documentos, quais etapas, quais condições, por exemplo pedido de compra acima de EUR 1.000).
  - A ordem das etapas define a sequência de níveis.
  - **Uma única reprovação reprova o pedido.**
  - O documento fica bloqueado até ser aprovado.
  - Envia notificação por e-mail.
  - O suprimento segue a cadeia pedido de compra, recebimento, nota de entrada e conta a pagar.
- **Faz mal [Doc]:**
  - Depois de ativada, a aprovação não pode ser desligada globalmente, só modelo a modelo.
  - Não se deve colocar o mesmo usuário em duas etapas.
  - A configuração é técnica.
- **Serve para a Dr. Hair:** a separação entre **"regra" e "quem aprova"**, em que o modelo de alçada é configurável pela Operações sem programador. A regra "uma reprovação encerra" é adequada para reembolsos. A cadeia de documentos se aplica ao pedido ao laboratório: pedido, NF, recebimento e parcelas.
- **Fontes:**
  - https://help.sap.com/saphelp_sbo92/helpdata/en/45/06dab4d8696c30e10000000a114a6b/content.htm
  - https://learning.sap.com/courses/implementing-sap-business-one/implementing-the-approval-processes-in-sap-business-one
  - https://learning.sap.com/courses/managing-logistics-in-sap-business-one-br/compra-de-itens-1

### 1.9 Padrões fiscais e financeiros brasileiros (vários fornecedores)
- **Manifestação do destinatário e distribuição de DF-e [Doc]:** o ERP gera a "Ciência da Operação" automaticamente e baixa o XML. Um alerta contábil: sem regras de exceção, uma nota desconhecida pode chegar ao contas a pagar e ao estoque antes que alguém perceba.
- **DDA [Doc/Mkt]:** o boleto chega por DDA só para conferência. A recomendação é usar a **linha digitável ou o código de barras como chave única** para evitar título duplicado e **casar o boleto com o XML da NF** antes de liberar o pagamento.
- **Serve para a Dr. Hair:** no pedido ao laboratório, casar **pedido, NF (XML), boletos (parcelas) e recebimento**, sinalizando divergência de valor e boleto repetido.
- **Fontes:**
  - https://documentacao.senior.com.br/documentoseletronicos/5.8.16/documentos-eletronicos/nfe/baixa-automatica-nf-e.htm
  - https://documentacao.senior.com.br/goup/5.10.4/integracoes/edocs/manifestacao-destinatario-unificada.htm
  - https://nfe.io/blog/gestao-empresarial/api-dda-o-que-e-como-funciona-e-como-integrar-ao-erp/
  - https://contadores.cnt.br/projetos/43/noticias/tecnicas/2026/08/05/manifestacao-do-destinatario-da-nf-e-como-controle-contra-fraudes-documentos-indevidos-e-inconsistencias-fiscais.html

---

## 2. Clínicas e gestão de redes de franquia

### 2.1 Feegow
- **Faz bem [Mkt]:** é referência em redes grandes (Amor Saúde), com mais de 70 mil profissionais e mais de 9 mil unidades. Cobre do prontuário ao backoffice, com agendas por profissional e unidade e indicadores financeiros por unidade. Foi comprada pela Doctoralia.
- **Faz mal / lacuna:** **não há documentação pública indexada** de repasse, estoque ou visão de franqueadora. Não foi possível avaliar as telas.
- **Serve para a Dr. Hair:** a Feegow é provavelmente a **fonte dos dados de produção** (atendimentos e procedimentos) que alimentam a premiação. O sistema da Dr. Hair deve **integrar** com ela, não competir. [Inf]
- **Fontes:**
  - https://medicinasa.com.br/feegow-clinic-gestao-integrada/
  - https://startups.com.br/negocios/doctoralia-compra-brasileira-feegow-e-mira-gestao-para-clinicas/

### 2.2 Clinicorp
- **Faz bem [Mkt]:** gestão de estoque e financeiro, **previsão de comissão** no aplicativo e a fintech Clinipay, que repassa valores entre profissionais e organiza comissões.
- **Faz mal / lacuna:** a ajuda pública indexada está no Reclame Aqui (FAQ de usuários e permissões) e não descreve multiclínica.
- **Serve para a Dr. Hair:** a **"previsão de comissão"** visível para o profissional durante o mês.
- **Fontes:**
  - https://apps.apple.com/BR/app/id1213414194
  - https://www.reclameaqui.com.br/empresa/clinicorp/faq/usurios-e-permisses-como-configurar-na-minha-clnica_--6rPzre1aSz2k0I/

### 2.3 iClinic, Clínica nas Nuvens, Codental (substitutos documentados do segmento)
- **Faz bem [Doc]:**
  - **iClinic:** "Regras de Repasse" nas configurações da clínica, que definem quanto cada profissional recebe por atendimento.
  - **Clínica nas Nuvens:** regras gerais de comissão mais **regras por exceção** por profissional. Tem "tipos de repasse" que dividem um atendimento entre vários profissionais, um passo de definir "quando e como" a comissão é paga e uma **troca entre clínicas que depende de permissão**, com permissões independentes por clínica.
  - **Codental:** regras combinando convênio, especialidade e tipo. Tem uma lista de profissionais com valor pendente e um botão "Visualizar detalhes" para o extrato.
- **Faz mal [Aval]:** iClinic tem queixas de instabilidade e bloqueio por pendência financeira (Reclame Aqui). O foco é o consultório, sem visão de rede.
- **Serve para a Dr. Hair:**
  - Modelo **regra geral + exceção** para a premiação.
  - Lista "a pagar por pessoa", com um clique para abrir o extrato.
  - **Permissão por unidade**, em que o sócio vê só as próprias lojas.
- **Fontes:**
  - https://intercom.help/iclinic-bc30384852a6/pt-BR/articles/5188465-configuracoes-da-clinica
  - https://intercom.help/clinicanasnuvens/pt-BR/articles/15809041-introducao-ao-modulo-de-comissoes
  - https://intercom.help/clinicanasnuvens/pt-BR/articles/8439694-regras-de-comissao-por-excecao
  - https://intercom.help/clinicanasnuvens/pt-BR/articles/8439696-o-que-sao-tipos-de-repasses
  - https://intercom.help/clinicanasnuvens/pt-BR/articles/7216936-alternando-entre-clinicas
  - https://intercom.help/codental/pt-BR/articles/11888559-como-o-codental-calcula-a-comissao-dos-profissionais
  - https://intercom.help/codental/pt-BR/articles/11889605-como-pagar-a-comissao-dos-dentistas-no-codental

### 2.4 SULTS (gestão de redes de franquia)
- **Faz bem [Mkt/imprensa]:**
  - Tem mais de 25 módulos: Expansão (CRM), Implantação de Unidades, **Checklist** (o mais usado, com campos personalizados e **plano de ação**), **Chamados** (canal central com o franqueado, com métricas de tempo de resolução e satisfação), Comunicados, Universidade Corporativa, Disco Virtual, Compras, NPS e Analytics.
  - Caso Milky Moo: 900 lojas e 96% de satisfação nos chamados.
- **Faz mal [Inf/Mkt]:** é uma suíte larga e genérica. O módulo de Compras parece ser só cadastro de fornecedores e produtos, sem cadeia NF, boleto e parcela. Não há evidência de premiação nem de documentos regulatórios com vencimento. Quase todo o material é marketing.
- **Serve para a Dr. Hair:**
  - **Chamados como canal único** entre a unidade e a central, no lugar do WhatsApp.
  - **Checklist com plano de ação**, que se aplica a POPs e auditorias.
  - Repositório de documentos e comunicados.
  - O estudo também confirma que **não existe produto pronto que cubra a cadeia financeira e fiscal de compras**, que é o diferencial a construir.
- **Fontes:**
  - https://www.sults.com.br/sults/downloads/artigos/franquia/plataforma/o-sistema-de-gestao-para-franquias-mais-completo-do-mundo.pdf
  - https://mercadoeconsumo.com.br/31/08/2023/noticias/os-7-melhores-softwares-de-gestao-para-redes-de-franquias-e-filiais/
  - https://www.portaldofranchising.com.br/noticias/milky-moo-expansao-franquias-sults/
  - https://www.sults.com.br/sults/downloads/artigos/franquia/plataforma/como-escolher-o-melhor-sistema-de-gestao-para-franquia.pdf

### 2.5 Checklist Fácil
- **Faz bem [Mkt/Doc]:**
  - Tem um aplicativo separado só para **Plano de Ação**, que trata as pendências e não conformidades das auditorias.
  - O plano de ação nasce **no momento em que a não conformidade é encontrada**.
  - É usado por redes e franquias, com dados em tempo real.
  - Boas práticas do setor: **foto obrigatória em item não conforme**, plano enviado ao franqueado logo após a inspeção, **responsável e prazo** definidos e follow-up.
- **Faz mal [Inf]:** a ferramenta é especializada. Acaba sendo mais um sistema e mais um login para o franqueado.
- **Serve para a Dr. Hair:** no POP e na auditoria de unidade, cada não conformidade gera uma **tarefa com dono, prazo e evidência (foto)** que entra na central de pendências do gerente.
- **Fontes:**
  - https://apps.apple.com/app/id1398498927
  - https://www.checklistfacil.com/en/sectors/health-beauty-and-well-being
  - https://blog.juriscorrespondente.com.br/auditoria-conformidade-operacional-rede-franquias/amp/
  - https://blog.juriscorrespondente.com.br/verificacao-conformidade-documentos-lojas-franqueadas/

### 2.6 Documentos regulatórios (contexto)
- **O que se sabe [Doc/gov]:**
  - A licença sanitária é emitida pela vigilância municipal ou estadual e o AVCB pelo Corpo de Bombeiros.
  - Os prazos **variam por estado e município**. No Rio, por exemplo, a LSF e a LSAR precisam ser revalidadas todo ano até 30 de abril.
  - Cada estado tem um sistema próprio (Visa Digital em MG, Sivisa no RS).
  - A auditoria não substitui a responsabilidade de manter as licenças em dia.
- **Mercado:** não achei produto de franquia com controle de vencimento de alvarás. Fóruns contábeis mostram que o controle é feito em planilha.
- **Serve para a Dr. Hair:** é uma lacuna de mercado. Proposta:
  - Uma **matriz unidade × tipo de documento** com validade, órgão emissor, anexo e semáforo (válido, vence em 60 ou 30 dias, vencido).
  - O vencimento gera uma pendência automática.
- **Fontes:**
  - https://www.projuris.com.br/blog/controle-de-licencas/
  - https://carioca.rio/servicos/acesso-a-vigilancia-sanitaria/
  - https://www.contabeis.com.br/forum/Legaliza%C3%A7%C3%A3o%20de%20Empresas/415115/como-voces-controlam-vencimento-de-alvara-avcb-de-varios-clientes-ao-mesmo-tempo/

### 2.7 Laboratórios de manipulação (lado do fornecedor)
- **O que se sabe:** o fluxo típico é receita, análise farmacêutica, orçamento, aprovação, manipulação, envio e entrega. O prazo de envio costuma ser de 1 a 4 dias úteis após o pagamento. **As reclamações mais frequentes no Reclame Aqui são falta de código de rastreio e de retorno sobre o status.**
- **Serve para a Dr. Hair:** a linha do tempo do pedido ao laboratório deve ter **status explícitos** (enviado, confirmado, em manipulação, faturado, despachado com rastreio, recebido e conferido) e alerta de **pedido parado** há N dias sem mudar de status.
- **Fontes:**
  - https://www.drogal.com.br/institucional/manipulacao
  - https://www.reclameaqui.com.br/pineda-laboratorio/comunicacao-inefetiva-e-atrasos-na-entrega_jH8eLFrXTvz3Tpan/
  - https://www.reclameaqui.com.br/a-formula/falta-de-comunicacao-com-a-farmacia-de-manipulacao-apos-a-compra_SU0ZuDfy1UfBK2tN/

---

## 3. RH e incentivos

### 3.1 CaptivateIQ
- **Faz bem [Mkt/blog]:**
  - O vendedor vê na página inicial as revisões de pagamento e as contestações abertas.
  - É possível exigir **1 ou 2 aprovações gerenciais** em cada pagamento, com revisor manual ou automático pela hierarquia.
  - O vendedor pode **revisar o próprio extrato antes** da aprovação do gestor.
  - Tem prazos, faixa (banner) de "ação necessária" no extrato e lembrete no login.
  - O fluxo de **contestação (inquiry)** tem aprovação própria.
  - Tudo fica num **log de auditoria**.
- **Faz mal [Aval]:** usuários no G2 dizem que faltam recursos para remuneração personalizada e para tratar contestações. A configuração exige um administrador de remuneração dedicado.
- **Serve para a Dr. Hair:** o fluxo **calcular, colaborador confere, gerente ou sócio aprova, financeiro paga**. Um **botão "contestar" ligado a cada linha da premiação** substitui a discussão por WhatsApp.
- **Fontes:**
  - https://captivateiq.com/rep-experience
  - https://captivateiq.com/blog/more-money-more-approvals
  - https://www.captivateiq.com/blog/managing-pay-inquiries-all-from-one-place
  - https://www.captivateiq.com/blog/improved-payout-statement-experience
  - https://www.g2.com/products/CaptivateIQ/reviews

### 3.2 Spiff (Salesforce)
- **Faz bem [Doc/Trailhead]:**
  - O extrato do vendedor é **somente leitura**, com métricas e regras visíveis, atualização diária e recálculo manual pelo administrador.
  - **Tracing:** mostra *como* cada valor foi calculado.
  - **Commission Estimator:** simula a comissão enquanto o negócio está em andamento.
  - Regras **"ghost"** (só o administrador vê, servem para testar) e **"what-if"** (vendedor e administrador veem).
  - **Planos ocultos** permitem testar regras antes de publicá-las.
  - Extratos **congelados** ao fechar o período.
- **Faz mal [Inf]:** depende do ecossistema Salesforce e é feito para vendas SaaS, não para clínicas.
- **Serve para a Dr. Hair:**
  - **Rastreabilidade do cálculo:** cada valor da premiação abre a fórmula e os atendimentos de origem.
  - **Fechamento que congela o período.**
  - **Simular uma nova regra antes de publicá-la** para a rede.
- **Fontes:**
  - https://trailhead.salesforce.com/content/learn/modules/salesforce-spiff-statement-design/navigate-statements
  - https://trailhead.salesforce.com/content/learn/modules/commission-management-with-salesforce-spiff/explore-features-for-sales-teams
  - https://trailhead.salesforce.com/content/learn/modules/salesforce-spiff-basics/learn-how-salesforce-spiff-impacts-uers

### 3.3 Sólides
- **Faz bem [Mkt]:** o aplicativo do colaborador cuida de ponto e férias, e o **gestor aprova ou ajusta o ponto pelo celular**. A tela inicial reúne ações ("Solicitar férias", "Acompanhar solicitações"). Há um assistente de IA (Lumen) que encaminha o pedido a agentes especializados.
- **Faz mal [Mkt]:** o aplicativo é cobrado à parte em alguns planos. Não há documentação clara de como o gestor aprova férias.
- **Serve para a Dr. Hair:** a **tela inicial orientada a ações** ("o que eu preciso fazer"), feita para o leigo e para o celular.
- **Fontes:**
  - https://solides.com.br/produtos/app-colaborador-solides/
  - https://solides.com.br/gestao-integrada/
  - https://solides.com.br/planos-e-precos/

### 3.4 Gupy (Admissão)
- **Faz bem [Mkt]:**
  - Na admissão, o candidato envia os documentos.
  - Um **documento reprovado volta ao remetente com aviso** (SMS e WhatsApp).
  - O sistema manda **lembrete automático até tudo ser enviado**.
  - A validação automática usa IA e especialistas, com prazo de revisão de até 120 minutos.
  - Os dados são conferidos no eSocial.
- **Faz mal [Inf]:** é específico de RH e não há autonomia de configuração aparente.
- **Serve para a Dr. Hair:** o mesmo ciclo para documentos societários e regulatórios das unidades:
  - **pedir, enviar, validar ou reprovar com motivo, cobrar automaticamente**;
  - **notificação por WhatsApp** para o franqueado leigo.
- **Fontes:**
  - https://gupy.io/software-de-admissao-digital
  - https://www.gupy.io/blog/validacao-automatica-documentos
  - https://gupy.io/precos

### 3.5 Bizneo HR
- **Faz bem [Aval/Mkt]:** centraliza férias, ausências e aprovação de horas, e tem metas e objetivos.
- **Faz mal [Aval]:** objetivos e resultados-chave considerados "básicos". A política de bônus variável era "em desenvolvimento" segundo resposta do fornecedor de 2019, sem confirmação de lançamento. Não achei módulo de despesas.
- **Serve para a Dr. Hair:** pouco. É mais uma referência de **calendário compartilhado da equipe** por unidade.
- **Fontes:**
  - https://www.capterra.com/p/184073/bizneo/reviews/
  - https://www.b2bstack.com.br/product/bizneo-hr/funcionalidades

---

## 4. Padrões de design de sistemas de gestão

### 4.1 Carbon (IBM): tabelas densas
- **[Doc]** Quatro alturas de linha: compact 24px, short 32px, default 48px e tall 64px. O cabeçalho acompanha a altura da linha.
- **[Doc]** "Tall" serve só para conteúdo em duas linhas. A barra de ferramentas e a **barra de ações em lote** (que aparece ao selecionar linhas) seguem o tamanho da linha.
- **[Doc]** Na versão 9, short e default eram preferências do usuário (menu de configurações da tabela).
- **Serve para a Dr. Hair:**
  - **Densidade configurável:** compacta para a Operações e o financeiro, confortável para o sócio.
  - **Barra de ações em lote** contextual.
- **Fontes:**
  - https://carbondesignsystem.com/components/data-table/usage/
  - https://carbondesignsystem.com/components/data-table/style
  - https://v9.carbondesignsystem.com/components/data-table/usage

### 4.2 Shopify Polaris: index table e visões salvas
- **[Doc]**
  - A index table lista objetos do mesmo tipo para **examinar, agir em lote ou abrir o detalhe**.
  - As ações em lote seguem a fórmula **verbo + substantivo** ("Aprovar reembolsos").
  - Em telas menores que 490px, as ações em lote podem ser escondidas.
  - Os **Index filters** combinam busca, filtros, ordenação e **visões salvas em abas**.
  - Nas versões novas, **o estado fica na URL**: escolher uma visão restaura a consulta e mudar um filtro tira o usuário da visão salva.
  - A visão salva deve ter um ID estável.
- **Serve para a Dr. Hair:**
  - Abas de visões salvas por módulo, por exemplo em Pedidos: "Aguardando NF", "Boletos vencendo", "Sem rastreio", "Recebidos".
  - **Filtros na URL**, que permitem compartilhar o link e manter o filtro global da unidade.
- **Fontes:**
  - https://polaris-react.shopify.com/components/tables/index-table
  - https://polaris-react.shopify.com/components/selection-and-input/index-filters
  - https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react/index-filters
  - https://shopify.dev/docs/api/app-home/patterns/templates/resource-index

### 4.3 Atlassian: lozenge e status
- **[Doc]** O "lozenge" é a etiqueta de status para reconhecimento rápido, com categorias semânticas: neutro, sucesso, atenção, perigo e informação ou em andamento. Atenção: a Atlassian anunciou a **descontinuação** do componente atual em favor de um novo.
- **Serve para a Dr. Hair:** **um vocabulário fixo de cinco cores semânticas para todos os módulos**. Não inventar cor por módulo.
- **Fontes:**
  - https://atlassian.design/components/lozenge
  - https://developer.atlassian.com/platform/forge/ui-kit/components/lozenge/

### 4.4 Fluent 2 (Microsoft)
- **[Doc]** Tamanhos Standard (toque) e Compact (denso) e espaçamento em unidades de 4px. Não existe um grid que sirva para todos os casos.
- **Serve para a Dr. Hair:** a régua de 4px e os dois modos de densidade. Prever o toque, porque o gerente usa celular ou tablet na unidade.
- **Fontes:**
  - https://fluent2.microsoft.design/layout
  - https://learn.microsoft.com/en-us/windows/apps/design/style/spacing
  - https://learn.microsoft.com/en-us/fluent-ui/web-components/components/data-grid

### 4.5 Nielsen Norman Group: tabelas
- **[Doc]** Tabelas são compactas para dados com muitas variáveis. **Cards obrigam a reorientar o olhar a cada leitura e tornam a comparação lenta.** Uma tabela filtrada precisa de **indicação visual clara de que há filtro ativo**.
- **Serve para a Dr. Hair:**
  - Tabela para Operações e financeiro.
  - Cards só para os resumos do sócio leigo.
  - **Faixa "Filtrando: 3 unidades · Nov/2026 · limpar" sempre visível.**
- **Fonte:** https://nngroup.com/articles/data-tables

### 4.6 Central de pendências (inbox)
- **[Doc]** **Linear Priority inbox (set/2026):** uma visão "Prioridade" curada por padrão, com filtros personalizáveis e a caixa completa preservada.
- **[Doc]** **GitHub:** a triagem segue "quem eu estou bloqueando?", com filtros salvos em ordem de prioridade.
- **[Doc]** TOTVS "Minhas Pendências" e Omie Kanban (seção 1).
- **Serve para a Dr. Hair:**
  - A tela inicial de cada perfil é **"Minhas pendências"**, que reúne todos os módulos e é ordenada por prazo e por quem está bloqueado.
  - Exemplos: o sócio vê "3 reembolsos e 1 premiação aguardam você"; o financeiro vê "5 pagamentos aprovados para pagar".
- **Fontes:**
  - https://linear.app/changelog/2026-09-03-priority-inbox
  - https://docs.github.com/en/subscriptions-and-notifications/tutorials/customizing-a-workflow-for-triaging-your-notifications

### 4.7 Aprovação em um clique, delegação e auditoria
- **[Mkt/blog]** Aprovar ou reprovar **por link seguro no e-mail, sem login**, com o contexto completo da solicitação dentro da mensagem. O guia da Peakflo limita esse uso a **itens rotineiros, de valor baixo ou médio e dentro da política**. Exceções vão para a tela.
- **[Mkt/blog]** Configurar SPF, DKIM e DMARC no domínio de envio para impedir e-mails falsos de aprovação.
- **[Mkt/blog]** A **delegação deve ser verificada no momento da decisão**, não presumida pelo roteamento original.
- **[Mkt/blog]** Escalonar para um substituto ou superior quando o prazo vence.
- **[Mkt/blog]** O log de auditoria deve ser **imutável e com data e hora** (ações, comentários e versões).
- **Serve para a Dr. Hair:**
  - O sócio leigo recebe "Aprovar / Reprovar" pelo WhatsApp ou e-mail para reembolsos pequenos.
  - Valores maiores ou fora da política abrem a tela com o comprovante.
  - Cada decisão é gravada com quem, quando, de onde e qual motivo.
- **Fontes:**
  - https://peakflo.co/blog/email-mobile-expense-approval-adoption
  - https://www.sirion.ai/library/contract-insights/contract-management-mobile-approval-features/
  - https://www.zoho.com/creator/decode/how-to-create-an-approval-workflow

### 4.8 Menu lateral por módulo e seletor de unidade
- **[Doc]** O seletor de empresa fica no topo, à direita, com seleção múltipla (Odoo). A troca de empresa fica no menu de perfil (QuickBooks, Pipedrive). A troca entre clínicas depende de permissão (Clínica nas Nuvens). No celular, a empresa é escolhida no login (Omie).
- **[Doc/secundário]** Uma barra lateral à esquerda libera largura para os dados, mas filtros colocados abaixo da dobra são ignorados (DataCamp).
- **Serve para a Dr. Hair:**
  - **Menu lateral com módulos** (Pendências, Premiação, Pedidos, Compras e estoque, Reembolsos, Documentos, POPs).
  - **Seletor de unidade no topo**, persistente entre módulos, com seleção múltipla e "Todas".
  - O sócio com uma unidade só não vê o seletor.
- **Fontes:**
  - https://www.odoo.com/documentation/19.0/applications/general/companies/multi_company.html
  - https://quickbooks.intuit.com/learn-support/pt-global/help-article/permissoes/alterne-entre-arquivos-de-empresas-quickbooks/L2c4KxPSa_ROW_pt-BR
  - https://intercom.help/clinicanasnuvens/pt-BR/articles/7216936-alternando-entre-clinicas
  - https://www.datacamp.com/tutorial/dashboard-design-tutorial

---

## 5. Padrão consolidado vs. moda

| Tema | Padrão consolidado (adotar) | Moda ou hype (usar com cautela) |
|---|---|---|
| Navegação | Menu lateral por módulo, seletor de unidade ou empresa global, migalhas de navegação | Navegação só por comando ou chat ("pergunte à IA") |
| Listas | Tabela densa com filtros, ordenação, ações em lote, visões salvas e estado na URL | Cards e "bento grids" para dados que precisam ser comparados |
| Aprovação | Alçada por valor ou regra, estado bloqueado, reprovação com motivo, lote, app ou link no celular, escalonamento | Aprovação 100% automática "por IA" sem humano |
| Auditoria | Linha do tempo por registro com mudança de campo, data e hora e autor imutáveis | "Blockchain" para auditoria |
| Fiscal BR | Importação de XML pela SEFAZ e DF-e, manifestação, casamento NF × boleto × pedido, chave única de boleto | OCR genérico como fonte da verdade sem conferência |
| Comissão | Regra geral + exceção, extrato somente leitura, rastreio do cálculo, fechamento que congela, contestação por linha | Gamificação pesada (rankings públicos, badges) |
| Estoque | Mínimo, máximo e ponto de pedido; contagem em duas fases (contar e depois aplicar com motivo); lote e validade | Previsão de demanda por IA com menos de 12 meses de histórico |
| Status | Vocabulário de cinco cores semânticas fixas | Paletas por módulo e ícones decorativos |
| Pendências | Inbox única ordenada por prazo e bloqueio | Feed social ou "timeline" estilo rede social |
| IA | Sugerir o lançamento (Conta Azul IA) para o humano confirmar | Assistentes conversacionais como interface principal (Lumen e similares ainda estão em fase inicial) |

---

## 6. Padrões recomendados para a Dr. Hair (15)

1. **Seletor global de unidade no topo**, persistente entre módulos, com seleção múltipla e "Todas as minhas unidades". Quem tem uma unidade só não vê o seletor. A permissão é **por unidade** (a lista do sócio vem do vínculo societário). *(Odoo, Clínica nas Nuvens)*
2. **"Minhas pendências" como tela inicial de todos os perfis**, reunindo todos os módulos, ordenada por prazo e por "quem está esperando por mim", com contagem por módulo no menu lateral. *(TOTVS Minhas Pendências, Linear, GitHub)*
3. **Uma única máquina de estados de aprovação** reaproveitada em reembolso, pedido, premiação e documento: rascunho, enviado, aguardando sócio, aprovado, aguardando financeiro, pago ou concluído, reprovado (sempre com motivo) e devolvido. *(Omie, SAP B1)*
4. **Alçadas configuráveis pela Operações sem programador**, com regra por valor, tipo e unidade, papel de "visto" (ciência sem bloqueio) e escalonamento quando o prazo vence. *(SAP B1 etapas e modelos, TOTVS MV_NFLIMAL, Sankhya)*
5. **Aprovação em um toque por WhatsApp ou e-mail com link seguro** só para itens dentro da política e abaixo do teto. Exceções abrem a tela com o comprovante. Ao lado, aprovação em lote para o financeiro. *(Peakflo, Omie Kanban)*
6. **Linha do tempo imutável em cada registro** (quem, quando, o que mudou de valor A para B, comentário, anexo), visível para todos os perfis com acesso ao registro. *(Odoo Chatter, CaptivateIQ audit log)*
7. **Pedido ao laboratório como cadeia de documentos ligados:** pedido, confirmação, NF (XML importado da SEFAZ por manifestação), boletos ou parcelas (linha digitável como chave única), rastreio e recebimento conferido. O sistema sinaliza automaticamente divergências: valor da NF diferente do pedido, soma das parcelas diferente da NF, boleto duplicado, pedido parado. *(Conta Azul, SAP B1, Senior/NFe.io)*
8. **Status explícito e alerta de pedido parado** para o laboratório, porque falta de rastreio e de retorno é a queixa mais comum do setor. *(Reclame Aqui)*
9. **Premiação no modelo "regra geral + exceção"** com extrato somente leitura por colaborador, **rastreio do cálculo** (cada valor abre os atendimentos de origem), **simulação de regra antes de publicar** e **fechamento que congela o mês**. *(Clínica nas Nuvens, Spiff)*
10. **Ciclo da premiação:** cálculo, colaborador confere, gerente ou sócio aprova, financeiro paga, com **contestação por linha** e prazo. *(CaptivateIQ)*
11. **Documentos regulatórios como matriz unidade × tipo** com validade, órgão emissor, anexo e semáforo (válido, 60 dias, 30 dias, vencido). O vencimento gera pendência automática e cobrança com lembrete até o reenvio. Um documento reprovado volta com motivo. *(lacuna de mercado; ciclo inspirado na Gupy)*
12. **Contagem de nutracêuticos em duas fases:** a unidade conta (inclusive pelo celular), a central revisa as diferenças e aplica com motivo. Lote e validade obrigatórios, e o estoque mínimo considera pedidos em trânsito. *(Odoo Physical Inventory, Omie lote e validade, Bling)*
13. **Listas em tabela densa com visões salvas em abas, filtros na URL e faixa "Filtrando: …" sempre visível.** Densidade compacta para Operações e financeiro, confortável para o sócio. Ações em lote no formato verbo + substantivo. *(Polaris, Carbon, NN/g)*
14. **Vocabulário único de status em cinco cores semânticas** (neutro, informação, sucesso, atenção, perigo) com texto, nunca só cor. *(Atlassian lozenge, Forge)*
15. **POPs e auditorias com plano de ação:** cada não conformidade vira uma tarefa com dono, prazo e foto obrigatória, que entra na central de pendências do gerente. POPs versionados, com "li e entendi" registrado. *(Checklist Fácil, SULTS Checklist)*

---

## 7. Anti-padrões a evitar

1. **Amarrar a "unidade" à conta ou ao CNPJ do ERP** (limitação do Bling). Uma unidade pode trocar de CNPJ, de sócio ou ter dois CNPJs. A entidade "unidade" precisa ser própria.
2. **Um aplicativo ou tela de aprovação por módulo** (fragmentação da TOTVS). O sócio leigo não deve ter que caçar em cinco lugares.
3. **Aprovação de tudo:** gera fadiga e aprovação no automático. Aprovar só a exceção (lógica de "evento de liberação" da Sankhya).
4. **Reprovar sem motivo obrigatório** ou reprovação que some. A reprovação devolve o item ao solicitante com o texto.
5. **Aprovação por link sem limite de valor e sem autenticação do domínio** (risco de fraude). Também não presumir a delegação: verificar no momento da decisão.
6. **Importação automática de NF sem regra de exceção.** Uma nota desconhecida vira conta a pagar e estoque sem que ninguém veja.
7. **Premiação como número final sem memória de cálculo.** Isso alimenta disputa por WhatsApp. Também não recalcular um mês já fechado sem registrar ajuste.
8. **Cards no lugar de tabela** para Operações e financeiro (comparação lenta, NN/g). E filtro ativo invisível.
9. **Jargão contábil ou de ERP na interface do sócio** ("título", "baixa", "centro de custo", "STATUSNOTA"). Usar linguagem de negócio ("pagar", "pago", "aguardando você").
10. **Cor como único sinal de status**, ou paleta diferente por módulo.
11. **Configuração por parâmetro técnico** (estilo MV_xxx) acessível só a consultor. A Operações precisa mudar alçadas e regras sozinha, com histórico.
12. **Controle de documentos e alvarás em planilha paralela** (prática atual do mercado). Se não estiver no sistema com vencimento, vai vencer.
13. **Comprar uma suíte de franquia "de 25 módulos" esperando que cubra compras fiscais e financeiras.** O SULTS e similares cobrem comunicação, checklist e chamados, não a cadeia NF, boleto e parcela.
14. **IA como interface principal ou como decisora final** em 2026. Usar a IA para sugerir (ler boleto, preencher pedido) com confirmação humana.
15. **Permissões por tela em vez de por unidade e papel.** O vazamento de dados de uma loja para o sócio de outra é o pior erro possível num sistema multifranqueado (LGPD e confiança da rede).

---

## 8. Próximos passos sugeridos para fechar as lacunas

- Liberar na rede da sessão: ajuda.omie.com.br, carbondesignsystem.com, polaris-react.shopify.com, atlassian.design, odoo.com e ajuda.bling.com.br, para ler as páginas inteiras e capturar as telas.
- Pedir demonstração gravada (sem criar conta) à Feegow e à Clinicorp, focando em repasse, estoque e visão de rede. É o principal buraco desta pesquisa.
- Levantar com a gestora de Operações quais laboratórios atendem a rede e se algum envia XML ou rastreio por API ou e-mail estruturado. Isso define o grau de automação possível no módulo de pedidos.
