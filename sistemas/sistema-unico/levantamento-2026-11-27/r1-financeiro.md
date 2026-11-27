# R1 – Financeiro e Compras (proposta)

Especialista: Financeiro e Compras. Fontes: inv-pedidos.md (IP), inv-compras-reembolsos-nutra.md (IC), inv-premiacao.md (IPr), pesquisa-mercado.md (PM), premissas.md (PR). Consultas SELECT feitas no banco único `xqxjmeioodmdhxhivyqu` em 27/11 (Q1, Q2, abaixo).

## 1. Diagnóstico em números

- **O único contas a pagar vivo é o de Pedidos novo.** Q1 (colunas): `pedidos_novo.parcela` já tem `baixa_omie_em`, `baixa_planilha_em`, `baixa_sistema_em/por/obs`, `boleto_linha`, `boleto_numero`, `nota_id`, `chave_omie`; `pagamento` + `pagamento_parcela` (N:N, valor por ligação) e `nota_fiscal` com `chave_acesso`, `xml_id`, `danfe_id`.
- Q2 (`v_parcela`, soma de `valor`): quitada 334 / R$ 2.277.952,95; a vencer 70 / R$ 198.761,29; **falta planilha 61 / R$ 661.463,51**; falta Omie 40 / R$ 350.851,57; vencida 20 / R$ 95.091,17; falta baixa no sistema 10 / R$ 44.300,32; cancelada 6 / R$ 19.559,00. O maior gargalo não é pagar: é a **baixa da planilha do laboratório** (R$ 661 mil parados por informação).
- Compras: fluxo completo construído, **0 compras, 0 notas, 0 títulos** em 1 mês; 3 SCs de teste (IC 1.1, risco 7).
- Reembolsos: modelo pronto (16 categorias, 51 empresas, validação PIX/CPF/CNPJ, trigger `reb_sol_guard_t`), **sem nenhuma função de gravação** e 0 registros (IC 2.1).
- Fornecedores: `cmp_fornecedores` 1, `lab` 2, `pedidos_novo.laboratorio` 2, CNPJ do lab fixo no código da `omie-sync` (IC 4).
- Omie: é o **Portal Omie do laboratório** (CP), alimentado por tarefa no navegador do dono que ainda envia só ao antigo (IP 1, 6). O `omie_cash` do Reembolso (51 empresas, `omie_ativo=false`, 0 credenciais) nunca foi ligado (IC 2.5).
- Orçamento da premiação: tela Orçamento existe (`orc_salvar`), perfil financeiro com **0 usuários**; Op lança; meta = 90% do orçamento; bloqueia após publicar a meta (IPr linhas 51, 79, 232).

## 2. Proposta: módulo Financeiro/Compras com uma "conta a pagar" única

### 2.1 Modelo (schema `financeiro` no banco único)
- **`titulo`** (a conta a pagar): `origem` (pedido_lab | compra | reembolso | avulso), `origem_id`, **empresa pagadora** (CNPJ vigente da unidade, regra "cada unidade paga o seu", IP 4), favorecido (fornecedor **ou** pessoa), documento (NF, recibo, fatura), situação, alçada aplicada.
- **`parcela`**: vencimento, valor, boleto (linha digitável **única**: evita boleto duplicado, PM 1.9), e as **exigências de baixa herdadas do favorecido**. A regra das 3 baixas vira configuração, não código: `fornecedor.ficha.baixas` (CP = omie + planilha, `planilha_so_primeira`; Injemed = só a nossa), exatamente como hoje em `laboratorio.ficha` (IP 4). Reembolso e compra = só a nossa baixa.
- **`pagamento`** + **`pagamento_parcela`** (N:N, como em Pedidos novo): um comprovante paga várias parcelas da mesma unidade; não paga a mais; "baixa sem comprovante" só se a Omie já baixou (PR).
- **`documento_fiscal`**: NF por `chave_acesso` única; **XML é a fonte** (DANFE é só visualização); itens; ligação N:N com pedido/compra (IP 4: uma NF vale para vários pedidos).
- **`alcada`**: regra por origem × faixa de valor × unidade → papel aprovador; estado **bloqueado até aprovar**, reprovação com motivo volta para "devolvido" (Omie Kanban, PM 1.1; SAP/TOTVS, PM 6 item 4). Segregação do Compras reaproveitada: quem pede/cota não aprova; quem aprova não paga (`segregacao_pagamento = true`, IC 2.1).
- Situação única do título: rascunho → aguardando aprovação → aprovado → programado → pago (todas as baixas exigidas) | reprovado | devolvido | cancelado. Toda correção com justificativa em `evento` imutável (modelo de Pedidos novo, 9.744 eventos).

### 2.2 Fornecedor e laboratório: um cadastro só
`cadastro.fornecedor` (no núcleo, não no módulo): CNPJ, razão, tipo (laboratório, serviço, produto), ficha (baixas, prazo de envio, planilha), dados bancários com **histórico e confirmação por outro canal** (`cmp_forn_guard`, antifraude, IC 1.2), documentos (AFE/licença) ligados ao sistema de Documentos. Carga: 2 laboratórios de `pedidos_novo.laboratorio` + 1 de `cmp_fornecedores`; tirar o CNPJ fixo do código da `omie`.

### 2.3 Omie (sem acesso do financeiro, sem links)
- A Omie é **entrada de dado**, nunca tela: NF, boleto, parcela e "baixa Omie" chegam pela função `omie` e ficam guardados no sistema (arquivos no bucket). Ação imediata: apontar a tarefa "Sincronizar Portal Omie" para a função `omie` do novo e aposentar a chave antiga (IP 8 item 6).
- **Risco a registrar**: depende do navegador e do login do dono. Se ele não abrir, "falta Omie" cresce (hoje 40 parcelas / R$ 350.851,57). Tela deve mostrar "última leitura da Omie: data/hora" e alertar após 2 dias sem leitura.
- Envio de reembolso/compra para uma Omie da Dr. Hair (`omie_cash`): **não construir agora**. Credenciais e categorias estão vazias; primeiro um relatório/lote exportável para a contabilidade.

### 2.4 Reembolsos (sócio → financeiro)
Reescrever no banco único aproveitando categorias, validações e trigger do `reb_*`, gerando `titulo` com origem reembolso: colaborador lança itens + comprovante → **sócio da unidade aprova** (dentro da alçada) → **financeiro confere** (glosa por item, complemento em 5 dias) → programa → paga por PIX com comprovante. Pessoa e PIX vêm do cadastro único de pessoas (Premiação tem 697, IC 4). Sócio aprova pela pendência no celular; aprovação em lote para o financeiro (PM 6 item 5).

### 2.5 Compras
Não migrar dados (só teste). Portar as **regras** (cotações mínimas por faixa R$ 1.000 / R$ 5.000, print obrigatório, justificativa se não for a mais barata, regulado não compra online, segregação; IC 1.3) e **simplificar**: a compra fechada gera `titulo`; recebimento e estoque ficam para a fase de Estoque (junto com Nutra). O motivo do não uso (0 compras) precisa ser entendido com Operações antes de reconstruir: provavelmente fluxo pesado demais para compras pequenas.

### 2.6 Conciliação
Fase 1 = conciliação interna: parcela × pagamento × comprovante × baixas exigidas (já existe em `v_parcela`). Fase posterior: importar extrato (OFX/CSV) por empresa e casar por valor+data. A leitura do comprovante pela API do Claude **sugere** valor, data e favorecido; humano confirma (PM anti-padrão 14).

### 2.7 Orçamento da premiação
Fica na Premiação (somente consulta para nós, PR). No Financeiro, só um cartão de leitura "Orçamento lançado por loja / meta publicada" e a criação do usuário financeiro real quando a Premiação permitir. O pagamento do prêmio (5º dia útil de M+2, valor bruto à contabilidade, IPr 252) **não** vira título: é folha.

## 3. Ordem de construção

| Fase | Entrega | Pré-requisito |
|---|---|---|
| 0 (até 01/12) | Nada no financeiro. Não mexer no Nutra nem na Premiação. Só redirecionar a tarefa Omie ao novo, com teste em paralelo | Pedidos novo estável |
| 1 | **Tela "Contas a pagar" lendo `pedidos_novo.v_parcela`** (vista, sem mudar tabelas): abas Vencendo, Falta planilha, Falta Omie, Falta baixa, Pagas; ação "Cobrar baixa do laboratório" em lote | núcleo de login/unidade |
| 2 | Cadastro único de fornecedor; laboratório passa a ser fornecedor (ficha preservada) | núcleo |
| 3 | `financeiro.titulo/parcela/pagamento`; Pedidos passa a gravar nele (migração das 541 parcelas e 83 pagamentos com conferência de totais acima) | fases 1–2, ambiente de teste |
| 4 | Alçadas configuráveis por Operações + **Reembolsos** | fase 3, cadastro de pessoas |
| 5 | NF por XML genérica (entrada de qualquer fornecedor), boleto com chave única, leitura assistida por Claude | fase 3 |
| 6 | Compras simplificado gerando título | fase 4 |
| 7 | Conciliação por extrato; Estoque (com Nutra) | fase 6 |

## 4. Temas comuns (breve)
1. Unificar núcleo (login, unidade, empresa, pessoa, fornecedor, eventos, arquivos) agora; módulos separados por schema.
2. Por fases (tabela acima); Financeiro só depois de Pedidos virar.
3. Fases 1 é só leitura; gravação nova só em ambiente de teste com conferência de totais em R$.
4. Empresa/CNPJ com vigência (`cmp_unidade_empresa` é o melhor modelo, IC 7); fornecedor como 2.2.
5. Papéis: financeiro (todas as unidades, paga), sócio (aprova só as suas lojas), colaborador (só os seus reembolsos), Operações (tudo, com registro). MFA para financeiro (já em Pedidos novo).
6. Contas a pagar segue o padrão lista com abas de visão salva + ficha com linha do tempo + pendência.
7. Git/Netlify/teste conforme PR; migração com relatório de totais antes e depois.
8. Claude: ler XML/boleto/comprovante e sugerir; nunca aprovar nem dar baixa.
9. **Crítica ao pedido**: (a) "conta a pagar única" feita de uma vez arrisca quebrar o Pedidos que hoje funciona — começar por vista de leitura; (b) a regra das 3 baixas é do laboratório CP, não deve ser imposta a reembolso e compra; (c) reconstruir Compras inteiro repete o fluxo que não foi usado — entender por quê antes; (d) o gargalo real é a planilha do laboratório (R$ 661.463,51), que pede cobrança ao laboratório, não mais telas.
