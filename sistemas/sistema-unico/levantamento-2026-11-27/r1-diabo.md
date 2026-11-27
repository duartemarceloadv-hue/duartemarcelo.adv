# R1 — Advogado do Diabo: o que pode dar errado e o que eu exijo

Fontes: premissas.md, inv-pedidos.md (§1–9), inv-premiacao.md (§1, §4, §7), inv-compras-reembolsos-nutra.md (§3, §5, §6), inv-documentos.md, pesquisa-mercado.md (§7). Consulta própria (SELECT, 27/11, banco único `xqxjmeioodmdhxhivyqu`): banco 144 MB, arquivos 853 MB, 4 schemas `premiacao_copia_*` ocupando 62 MB.

Prob. = probabilidade (A alta, M média, B baixa) se nada for feito.

## 1. Vale unificar? Minha posição

Vale unificar **login, cadastro de unidade/CNPJ e casca visual**. Isso ataca problemas medidos: 5 bases de login para as mesmas pessoas (inv-pedidos §7), ~55 e-mails distintos (inv-documentos), só 34 de 51 unidades do Compras batem com as clínicas (inv-compras §4).
**Não vale** unificar agora o motor da Premiação, nem migrar Compras/Reembolsos, que têm 0 compras e 0 solicitações (inv-compras §1.1, §2.1): reescrever o que ninguém usa é custo sem retorno. Também não vale fundir "código" num único site/função gigante: unificar é um login e um cadastro, não um monólito.

## 2. Riscos

| # | Risco | Prob. | Consequência | Proteção que exijo |
|---|---|---|---|---|
| 1 | **Perder função ao desligar o Pedidos antigo.** O novo não cria pedido, não tem receitas do dia 01, prescritores (48), RTs/termos, pedido de venda (63 `pendPV` abertas), conferência pedido×NF recalculada (58 divergentes), pedido nascido da NF Omie, rastreio "seguiu junto"/completo, backup (inv-pedidos §3 e §8) | A | Central volta ao antigo ou faz à mão; receita de 01/12 não sai | Matriz de funcionalidades do §3 vira **lista de aceite**: cada linha "não/parcial" com teste aprovado pelo usuário antes do desligamento. Receitas de 01/12 **continuam no antigo** (`receitas-dia-01`). |
| 2 | **Receitas de 01/12 geradas em dois lugares ou em nenhum** | M | Unidade sem receita ou receita duplicada para o RT | Uma rotina só por vez; registrar quem é o "dono" de cada rotina em tabela de virada; desligar uma só depois que a outra rodou e foi conferida. |
| 3 | **Quebrar a Premiação com outubro aberto** (100 pendências, 35 lojas sem aprovação, inv-premiacao §7.2). Ela não tem git, não tem RLS, e o motor está duplicado em `premiacao` e `premiacao-deb` (§1, §7.1); usa 41 gatilhos e `trg_auto_aprovar` | M | Aprovação cai (`fn_aviso_aprovacao_caiu`), sócio recebe aviso falso, valor de prêmio muda depois de aprovado | **Congelamento total** da Premiação até outubro E novembro fecharem. Nenhuma migração no schema `premiacao`, nenhum novo gatilho em tabelas compartilhadas, nenhum deploy das 5 funções. Antes de qualquer coisa: copiar o código das 5 funções para o GitHub (só leitura, sem republicar). |
| 4 | **Mexer no banco único afeta a Premiação sem tocar nela**: migração de outro módulo que trava tabela, esgota conexões ou estoura o plano | M | Premiação fora do ar no meio do fechamento | Migrações só em ambiente de teste primeiro; nunca em horário de uso; teste de fumaça da Premiação (login, abrir loja, impedimentos) após cada publicação. |
| 5 | **Derrubar o Nutra ao desligar o legado.** Nutra, Compras e as 8 rotinas vivem no `ckgsdvhkpnrrmctlqtma`; `nut-rodada-dia-01` roda pela 1ª vez em 01/12; `nut_painel_me` tem `nov-2026` fixo (inv-compras §6.1) | A se desligar o projeto inteiro; M em 01/12 | Clínicas sem formulário; painel mostrando novembro | **Não fazer a virada do Nutra antes de 01/12.** Deixar a rodada de dezembro rodar no legado, conferir em 01/12. Virar Nutra num mês calmo (meio de dezembro), com os 21 usuários e hashes de senha testados. Desligar o legado **por schema/rotina**, nunca o projeto inteiro de uma vez; pausar antes de apagar (30 dias pausado). |
| 6 | **Anexos quebram**: 1.152 arquivos do novo apontam para buckets do antigo (inv-pedidos §1) | A se desligar antes de copiar | Comprovantes, NFs e boletos somem da ficha | Cópia dos 1.344 arquivos com contagem e checksum batendo 100% antes do desligamento; relatório de diferenças assinado. |
| 7 | **Custo do Supabase Pro e limite.** Hoje 853 MB de 1 GB; com +~230 MB do legado passa de 1 GB (consulta + inv-documentos) | A (certo) | Upload bloqueado em Documentos/Pedidos | Aceito o Pro (premissa), mas exijo: limite de gasto ligado (spend cap), alerta de uso, política de guarda das cópias (`premiacao_copia_*` 62 MB, `bkp_*`, `bak_20261105_*`) e orçamento mensal escrito. |
| 8 | **Banco único = ponto único de falha.** Um erro de RLS, uma migração ruim ou um vazamento de chave afeta 6 sistemas | M | Tudo para junto; vazamento de dados de uma loja para o sócio de outra (pesquisa §7.15) | Backup diário com recuperação **testada** (restaurar em projeto de teste e conferir contagens) antes da virada; PITR se o custo permitir; schemas separados com papéis separados; chaves por função no Vault (o antigo tem chave fixa no código, inv-pedidos §9). |
| 9 | **Big bang** (tudo num dia ou num login novo para todos de uma vez) | M | 18 contas de unidade sem acesso no mesmo dia; suporte impossível para uma pessoa | Por fases, um módulo por vez, com o antigo em leitura por 30 dias após cada virada. Ordem: casca+login (fora da Premiação) → Pedidos (após itens do risco 1) → Nutra → Documentos/POPs → Premiação por último, só entre competências e com autorização expressa (inv-premiacao §7). |
| 10 | **Números DH trocados**: 43 pedidos com DH diferente; DH-2026-0469 a 0472 designam pedidos diferentes nos dois sistemas (inv-pedidos §9) | A | Unidade e laboratório discutem pedidos errados; pagamento no pedido errado | Decidir qual numeração vale **antes** da virada; tabela de equivalência antigo↔novo visível na ficha; renumerar só com registro; aviso às unidades. |
| 11 | **Omie depende do navegador do dono** (tarefa "Sincronizar Portal Omie", inv-pedidos §1 e §6) | A | Se o computador estiver desligado/sessão do portal cair, a 2ª das 3 baixas não chega e parcelas ficam "falta Omie" (hoje 40) | Alerta "Omie sem dados há X dias" na tela; trocar o destino para o novo só uma vez e retirar a chave antiga; procedimento escrito de "o que fazer se não sincronizar". Não prometer automação que não existe. |
| 12 | **Dependência de uma pessoa só / de Claude.** Usuário não técnico; Premiação, Documentos, POPs, Compras sem git; tela do Pedidos antigo publicada à mão sem fonte (inv-pedidos §9) | A | Ninguém sabe voltar atrás; uma sessão de Claude apaga ou sobrescreve sem histórico | Tudo no GitHub antes de qualquer mudança; cada publicação com link de teste e botão de "voltar versão" no Netlify; um documento "como operar" por módulo (rotinas, chaves, quem chamar); acesso de emergência para um segundo humano (contador de TI ou freelancer) com as credenciais guardadas fora do Claude. |
| 13 | **Custo da API do Claude sem controle** (leitura de NF, CNPJ, contrato, PV) | M | Conta inesperada; reprocessar o mesmo PDF várias vezes | Chave dedicada com limite mensal no console; registro de cada chamada (módulo, documento, custo); não reler documento já lido (hash do arquivo); IA só sugere, humano confirma (pesquisa §7.14). Sem IA em cálculo de prêmio nem em baixa de pagamento. |
| 14 | **Sistema grande e lento**: casca única carregando todos os módulos; a Premiação já tem ~60 ações numa função de 1.390 linhas e 24 tamanhos de letra (inv-premiacao §1, §5) | M | Tela lenta no celular das unidades; quebra de uma tela derruba as outras | Cada módulo carrega só o seu código; meta de tempo (ex.: lista abre em até 2 s com 500 pedidos) medida antes de publicar; funções separadas por módulo. |
| 15 | **Logins migrados com papel errado** (21 membros, 4 sem Auth; 17 dos 19 da Premiação também no Documentos) | M | Sócio vê loja de outro (pior erro, pesquisa §7.15) | Teste "ver como" com cada perfil real antes de liberar; relatório pessoa×unidades revisado pelo usuário; RLS no banco, não só no código. |
| 16 | **Robôs com outra frequência** (planilha de hora em hora → 1x/dia; rastreio 2x → 1x) | M | Central acha que o sistema "parou de atualizar" | Decisão explícita registrada antes da virada, e data da última leitura visível em cada tela. |

## 3. Quando NÃO vale unificar

- Quando o módulo está em fechamento ou em rodada (Premiação até fechar out/nov; Nutra perto do dia 01).
- Quando ninguém usa o sistema (Compras, Reembolsos): desenhar no núcleo novo, sem migrar o piloto.
- Quando a unificação exige reescrever regra que funciona (motor da Premiação, 41 gatilhos): integrar pelo login e cadastro, não reescrever.
- Quando o custo de um erro compartilhado supera o ganho (ex.: colocar arquivos pesados no mesmo bucket sem guarda).

## 4. Crítica ao pedido do usuário

- "Nenhuma funcionalidade pode ser perdida" + "um sistema só" + "tudo testado" sem prazo é bom, mas leva ao big bang se tentar entregar tudo junto. Alternativa: aceitar funções "no antigo por enquanto", com data.
- "Banco legado desligado com tudo trazido" choca com Nutra e Compras morando lá: desligar por partes.
- Ter Claude como único construtor e operador é o maior risco isolado (risco 12).
- Layout da Premiação como referência, mas ela tem problemas de tela medidos (rolagem interna em 5 áreas, contraste reprovado, inv-premiacao §7.6): copiar a estrutura, não os defeitos.

## 5. Condições para eu aceitar (resumo)

1. Premiação congelada até out/nov fecharem; código dela no GitHub sem republicar.
2. Nada no legado desligado antes de 01/12 conferido; Nutra vira depois, separado.
3. Lista de aceite da matriz do Pedidos 100% verde e arquivos com checksum batendo antes de desligar o antigo.
4. Numeração DH decidida antes da virada.
5. Backup restaurado com sucesso em teste; spend cap no Supabase e na API.
6. Fases com antigo em leitura por 30 dias; plano de volta escrito para cada fase.
7. Segundo humano com acesso de emergência e manual de operação.
