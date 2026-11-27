# Inventário — Sistemas de DOCUMENTOS da Dr. Hair

Levantado em 27/11/2026, **somente leitura** (SELECT nos bancos, leitura do código das edge functions, leitura de metadados no Netlify). Nada foi alterado.
Bancos: **NOVO** = Supabase `xqxjmeioodmdhxhivyqu` · **LEGADO** = Supabase `ckgsdvhkpnrrmctlqtma`.
Os sites `*.netlify.app` estão bloqueados por aqui (proxy 403). As telas abaixo foram deduzidas das ações que as funções aceitam.
Não há dados pessoais neste documento. Pessoas, e-mails e CNPJs aparecem só como contagens. Para comparar entre bancos usei hash md5 truncado.

---

## Visão geral em 6 linhas

| Sistema | Site | Banco / tabelas | Funções | Situação |
|---|---|---|---|---|
| A. Documentação dos imóveis (regulatórios + societários) | `drhair-documentacao-imoveis` | NOVO `public`: unidades, itens, arquivos, historico, obs_historico, avisos, acessos, sessoes, config | api (v20), painel, arquivos, obs, avisos, contato, revisao, consultor, exportar-docs | Ativo e é o principal: 53 unidades, 1.013 arquivos (~894 MB) |
| B. Societários | não tem site próprio | **Dentro do A** (itens `contrato_social` e `cartao_cnpj`). Há uma **cópia antiga** no LEGADO (`docs` col=`clinicas`, campo `docs`) | (LEGADO) docs-regulatorios faz a ponte; ler-documento tem IA | Parte do A. O legado é o resquício do checklist do sistema de pedidos |
| C. POPs | `pops-drhair` | NOVO `public.pop_*` (+ lê unidades/itens/arquivos do A) | pops (v12) | Ativo: 977 emissões em 28 clínicas |
| D. Cadastros auxiliares (RT, conselho, Lab, certificado, sócio, CNES, alvará) | espalhados | NOVO e LEGADO (ver seção D) | — | Duplicados em 3 a 5 lugares |
| E. Pesquisa Zuria | `pesquisa-zuria-drhair` | **sem banco Supabase** (usa Netlify Forms) | nenhuma | Site estático de 2 páginas, publicado em 27/11/2026 |

---

## A) Documentação dos imóveis / documentos regulatórios das unidades

**Onde está:** site Netlify `drhair-documentacao-imoveis`. Banco NOVO, schema `public`. Bucket de armazenamento `documentos`.

### Catálogo de documentos (fixo no código da função `api`; não existe tabela de categorias)
- **Itens que a unidade preenche (29):** contrato (de locação), seguro_imovel, alvara_func, inscricao_municipal, licenca_sanitaria, **cnes**, avcb, iptu, termo_mesclas, crt (certidão de responsabilidade técnica), carteira_crbm (carteira do RT), pgr, pcmso, pgrss, coleta_residuos, licenca_ambiental, dedetizacao, caixa_dagua, equipamentos, manut_equip, pmoc, limpeza, planta, habite_se, viabilidade, certidao_imovel, outros, pendencias, providencias.
- **Itens "internos" (só Operações anexa):** `cartao_cnpj` e `contrato_social`. São os documentos societários (ver B).
- **Status do item:** pendente / enviado / protocolo / nao_possui / nao_se_aplica.
- **Revisão:** "" / aprovado / recusado. "Incompleto" é gravado como recusado com o prefixo "INCOMPLETO:".
- **Campos do item:** nº e data do protocolo, emissão, validade, justificativa, texto livre, observação de revisão, observação interna.

### Matriz de funcionalidades

| Módulo | Tela (deduzida) | Função / ação | Quem usa | Tabelas | Origem do dado | Automação |
|---|---|---|---|---|---|---|
| Login | Entrar / Primeiro acesso / Trocar senha / Sair | api: `acesso_login`, `acesso_primeiro`, `acesso_trocar_senha`, `acesso_sair`, `acesso_minhas` | Responsável da unidade (franqueado, gestor) | acessos, sessoes, unidades | Operações cadastra o e-mail e as unidades; a pessoa cria a própria senha | Bloqueio de 15 min após 5 erros; sessão vale 30 dias |
| Login antigo por CNPJ | Entrar com CNPJ | api: `pub_cnpj` | Unidade | unidades.token | Link/token por unidade | **Desligado** (`config.cnpj_ativo = nao`) |
| Portal da unidade | Checklist da unidade | api: `portal_get`, `portal_save_item`, `portal_upload_url`, `portal_confirm_upload`, `portal_download`, `portal_submit` ("Enviar para análise") | Unidade | itens, arquivos, historico, storage `documentos` | Upload manual (até 25 MB por arquivo) | Ao anexar, o item vira "enviado" e a recusa é limpa. Toda ação gera histórico. **A unidade não consegue excluir arquivo** |
| Portal da unidade | Avisos de Operações | avisos (token) | Unidade | avisos | Operações escreve | — |
| Portal da unidade | Telefone de contato | contato (token) | Unidade | unidades.telefone, historico | Unidade digita | — |
| Painel do responsável | Resumo de todas as minhas unidades | painel | Quem tem várias unidades (média de 4,3 por login) | acessos, unidades, itens, arquivos | Leitura | Somente leitura, sem a observação interna |
| Admin (Operações) | Lista geral / matriz unidade × item | api: `admin_list`; arquivos | Departamento de Operações | unidades, itens, arquivos | — | — |
| Admin | Conferência (aprovar / recusar / incompleto) | api `admin_review`; revisao | Operações | itens, historico | — | Histórico automático |
| Admin | Editar item, observação interna | `admin_save_item`, `admin_save_obs` | Operações | itens; obs_historico | — | **Gatilho `trg_itens_obs`** grava cada observação em obs_historico (1.934 registros) |
| Admin | Gestão de arquivos | `admin_upload_url/confirm`, `admin_rename_file`, `admin_move_file` (também para outra unidade), `admin_download` | Operações | arquivos, itens | Upload manual | Ao mover, os status de origem e destino são ajustados. **Excluir arquivo está bloqueado também para o admin** |
| Admin | Cadastro de unidades | `admin_save_unit`, `admin_bulk` (importação em lote), `admin_delete_unit` (só sem arquivos), `admin_new_token`, `admin_set_prazo` (prazo único para todas) | Operações | unidades | Digitado ou colado | — |
| Admin | Acessos (logins) | `admin_acessos_list/save/resetar/senha/delete`, `admin_config_cnpj` | Operações | acessos, sessoes, config | — | — |
| Admin | Histórico da unidade | `admin_historico`; obs | Operações | historico (6.993), obs_historico | — | — |
| Admin | Avisos para a unidade | avisos (chave admin) `save/delete/list` | Operações | avisos (258 em 49 unidades) | — | Histórico |
| Admin | Telefones | contato (chave admin) | Operações | unidades | — | — |
| Consultor externo | Painel do advogado tributário | consultor | Consultor externo (somente leitura) | unidades, itens, arquivos | — | Vê só contrato_social, alvara_func, inscricao_municipal, licenca_sanitaria e contrato (locação) |
| Integração | Exportação por CNPJ para o sistema de pedidos | exportar-docs (chave `x-link`) | Função `docs-regulatorios` do LEGADO | unidades, itens, arquivos | — | Links temporários de 1 h |
| Integração | Documentos da unidade dentro do POPs | pops `clinica_regdocs` | Sistema C | itens, arquivos | — | Ver C |

### Perfis de acesso
1. **Responsável da unidade:** login por e-mail e senha (tabela `acessos`), com uma lista de unidades por pessoa. Hoje são 20 logins, todos ativos. 13 já criaram senha e 13 já entraram. Há 33 sessões válidas. As 53 unidades têm pelo menos um login.
2. **Operações (admin):** **uma única chave compartilhada** (`config.admin_key`). Não há login individual, e todo registro sai como autor "Operações".
3. **Consultor externo:** chave própria, gravada como hash **dentro do código** da função `consultor`.
4. **Máquina a máquina:** a chave `x-link` está **escrita no código**, tanto em `exportar-docs` (NOVO) quanto em `docs-regulatorios` (LEGADO).
5. Há ainda uma `config.codigo_acesso`, que parece ser um resquício do acesso antigo, e colunas antigas de senha na própria `unidades` (senha_hash, tentativas), sem uso.

### Números
- 54 unidades (1 de teste); as 53 reais têm CNPJ, todos distintos. 23 clicaram em "enviar para análise".
- 871 itens: enviado 647, nao_possui 116, pendente 87, protocolo 21. Revisão: aprovado 448, recusado 219, sem revisão 204.
- 363 itens com validade: **37 já vencidas** (dedetização 8, carteira CRBM 5, AVCB 4, viabilidade 4, CRT 4…) e **90 vencem nos próximos 60 dias**.
- 1.013 arquivos registrados e 1.015 objetos no bucket `documentos` (~894 MB). Os maiores volumes são contrato de locação (151 MB), AVCB (115 MB) e contrato social (75 MB).
- Histórico de 06/10/2026 a 26/11/2026: 4.101 ações de Operações e 2.891 de unidades.

### Rotinas e IA
- **Não há nenhuma rotina agendada (cron) de documentos** em nenhum dos dois bancos. Os crons do NOVO são de premiação, pedidos e nutra.
- **Não há alerta de vencimento.** A validade é gravada, mas ninguém é avisado.
- **Não há IA** no sistema A: a leitura de documentos é 100% manual, feita na conferência por Operações.

### Problemas conhecidos (A)
- A chave de admin é única e compartilhada, sem trilha de quem fez o quê (o autor é sempre "Operações").
- Segredos estão escritos no código (chave x-link e hash do consultor). Trocar a chave exige republicar a função.
- O catálogo de itens está fixo no código, sem tabela. Criar um documento novo exige deploy. `cnes` e `manut_equip` estão no catálogo mas **não têm nenhum registro**.
- Não existe exclusão de arquivo (de propósito), então versões antigas e erradas se acumulam. Há 2 objetos no bucket sem registro (órfãos).
- O prazo (`admin_set_prazo`) é um só para todas as unidades.
- RLS está ligado e não há nenhuma policy em `public`. Tudo passa pelas funções com service role. Isso é seguro, mas impede acesso direto.
- As tabelas `bak_20261105_*` (backup manual de 05/11) continuam no schema `public`.
- Há 722 itens com observação interna em texto livre, sem estrutura.

---

## B) Documentos societários (contrato social, cartão CNPJ, certificados)

**Conclusão: os societários fazem PARTE DO SISTEMA A.** Não são um sistema separado.
- No sistema A existem os itens `contrato_social` (53 itens, 61 arquivos, 75 MB) e `cartao_cnpj` (53 itens, 55 arquivos, 10 MB), todos com status "enviado". São "internos": só Operações anexa. A unidade vê, mas não edita.
- O consultor tributário vê o contrato social. O POPs vê o cartão CNPJ e **não** vê o contrato social.

**Resquício no LEGADO (`ckgsdvhkpnrrmctlqtma`):** a tabela `public.docs`, coleção `clinicas` (53 registros, um por unidade), tem um campo `docs` com um checklist próprio de 13 tipos e 317 entradas (186 "OK"; 118 com anexo no bucket `anexos`):

| Tipo (legado) | Entradas | Com anexo | Observação |
|---|---|---|---|
| contrato-social-ultima-alteracao | 53 | 41 | Duplica o A |
| cartao-cnpj | 49 | 40 | Duplica o A |
| **certificado-digital** | 49 | 0 | **Só existe aqui**: validade de 47 certificados, sem arquivo |
| **termo-de-responsabilidade-no-laboratorio-centro-paulista** | 40 | 36 | **Só existe aqui** (termo do Lab Paulista) |
| alvará, AVCB, CCM, IE, VISA, locação, contrato com RT, certidão de RT, registro do RT no conselho | 14 cada | 0 a 1 | Esqueleto quase vazio; o A já cobre (exceto **inscrição estadual** e **contrato com o RT**, que o A não tem) |

- Esse checklist pertence ao **sistema de pedidos/laboratório antigo** (`pedidos-drhair`). A última alteração foi em 21/11/2026.
- **`docs-regulatorios`** (LEGADO): a pessoa logada no sistema de pedidos (tabela `membros`) abre o cadastro da unidade, e a função procura o CNPJ e chama `exportar-docs` do NOVO. Assim, **os documentos do A aparecem dentro do sistema de pedidos**, sem cópia.
- **`ler-documento`** (LEGADO, IA): lê PDF ou imagem com a API da Anthropic (Claude, chave `ANTHROPIC_API_KEY`) e extrai campos para o **Sistema de Compras**. Há três tipos: *fornecedor* (cartão CNPJ e contrato social **do fornecedor**: CNPJ, razão, IE/IM, regime, banco/PIX, sócios, AFE, licença), *pedido/NF* e *contrato de preços*. Só funciona para quem tem perfil em `cmp_perfis` (6 pessoas). **Ela não lê documentos das unidades Dr. Hair.**
- **`anexo-leitura`** (LEGADO): **desativada** (responde 410).
- `cmp_empresas` (LEGADO, 51 empresas, 49 CNPJs distintos) tem a coluna `certificado_validade`, **vazia** em todas. Ou seja, a validade do certificado digital está viva no checklist legado e não no cadastro de empresas.

---

## C) POPs (procedimentos operacionais padrão)

**Onde está:** site Netlify `pops-drhair`. Banco NOVO, tabelas `public.pop_*`. Função `pops` (v12). Bucket `pops-especificos`.
**Os documentos dos POPs não são guardados no banco:** são gerados no navegador (PDF ou DOCX) a partir de modelos do próprio site. O banco guarda só a configuração da clínica, os registros de emissão e acesso e os POPs específicos.

### Matriz de funcionalidades

| Módulo | Tela (deduzida) | Função / ação | Quem usa | Tabelas | Origem do dado | Automação |
|---|---|---|---|---|---|---|
| Login | Entrar com CNPJ + e-mail | pops `pub_cnpj` | Clínica (RT, gestora, recepção) | unidades.token, pop_logins (117 logins, 39 unidades, 42 e-mails) | O CNPJ é digitado; **o e-mail é qualquer um, sem senha** | Sessão de 12 h |
| Dados da clínica | RT (nome, conselho, nº, UF) e gestora | `clinica_cfg` / `admin_cfg` | Clínica e Operações | pop_unidade_cfg (33), pop_cfg_hist (38) | Digitado | Histórico "antes/depois" automático |
| Biblioteca de POPs | Consultar e emitir POP | `clinica_acesso`, `clinica_emitir`, `clinica_emitir_lote` (até 80 por vez) | Clínica | pop_acessos (236), pop_emissoes (977: 779 PDF, 198 DOCX; 28 unidades; 26 documentos distintos) | Modelos versionados no site; versão 1.0 vigente desde 03/11/2026 (pop_versoes) | Registra quem emitiu, a data e a próxima revisão |
| Documentos regulatórios | Ver documentos da unidade | `clinica_regdocs`, `clinica_regdoc_url` | Clínica | itens/arquivos **do sistema A** | Sistema A | Mostra só 11 itens (cartão CNPJ, alvará, licença sanitária, AVCB, CRT, termo de mesclas, coleta, PGRSS, dedetização, caixa d'água, limpeza) e **só se o item está enviado ou em protocolo e não foi recusado** |
| POPs específicos | Criar POP próprio (formulário) ou enviar rascunho (arquivo) | `clinica_esp_*` | RT da clínica | pop_especificos (0), pop_esp_hist (0), bucket pops-especificos | Formulário ou upload (20 MB) | Fluxo: rascunho → aguardando padronização → em análise → devolvido ou vigente → substituído/arquivado. A próxima revisão fica automaticamente em +1 ano |
| Admin | Painel geral (unidades × emissões × acessos × logins × alterações) | `admin_painel` | Operações | todas as pop_* | — | — |
| Admin | Padronizar, aprovar, devolver, arquivar POP específico | `admin_esp_*` | Operações | pop_especificos | — | — |
| Admin | Emitir pela clínica | `admin_emitir`, `admin_emitir_lote` | Operações | pop_emissoes (60 pelo admin) | — | — |
| Admin | Zerar demonstração | `admin_zerar_demo` | Só o administrador | pop_* da unidade de teste | — | — |

### Perfis
- **Clínica:** CNPJ + e-mail declarado (sem senha).
- **Administrador:** usa a mesma `config.admin_key` do sistema A.
- **Operacional:** `config.pops_leitura_key`. Pode fazer tudo, exceto zerar a demonstração e arquivar.

### Rotinas e IA
Não há cron nem IA.

### Problemas conhecidos (C)
- **O login é fraco:** basta saber o CNPJ (que é público) para entrar, e o e-mail não é verificado. O sistema A já desligou o login por CNPJ (`cnpj_ativo = nao`), mas o POPs continua usando o mesmo token por unidade.
- São **dois logins diferentes para as mesmas pessoas:** só 9 dos 42 e-mails do POPs também estão em `acessos` do A.
- O RT é cadastrado aqui de novo (ver D). 21 das 53 unidades ainda não preencheram o RT, e 26 nunca emitiram um POP.
- Há 3 arquivos órfãos no bucket `pops-especificos` (a tabela está com 0 linhas, provavelmente sobra de teste).
- A coluna `equipamento_led` de `pop_unidade_cfg` não é usada (0 preenchidas).

---

## D) Cadastros auxiliares, explicados em linguagem simples

| Cadastro | O que é | Onde vive hoje (contagem) | Duplicação |
|---|---|---|---|
| **Unidades / clínicas** | A lista das clínicas da rede | NOVO `public.unidades` (54); NOVO `premiacao.unidades` (56); NOVO `pedidos_novo.unidade` (53) + `unidade_cnpj` (53) + `unidade_alias` (71 apelidos dos sistemas compras, documentos, pedidos e premiação); NOVO `nutra.unidades` (51); LEGADO `docs/clinicas` (53), `cmp_unidades` (51), `cmp_empresas` (51), `inj_unidades` (4) | **8 cadastros.** Os 53 CNPJs do A batem 100% com o legado `clinicas`, com premiação e com pedidos_novo. `cmp_empresas` tem 49 deles |
| **Empresa (razão social / CNPJ / regime / banco)** | Os dados da pessoa jurídica de cada unidade | A `unidades` (razão + CNPJ); LEGADO `cmp_empresas` (+ regime, banco, quem prepara/autoriza, validade do certificado); `pedidos_novo.unidade_cnpj` (com vigência de/até, que prevê troca de CNPJ); premiação | 4 lugares |
| **Sócio** | O dono ou franqueado da unidade | LEGADO `clinicas.socio` (53); `nut_socios` (51 vínculos, 12 sócios distintos); `nutra.socios`; `premiacao.unidades.socio` | 4 lugares, sem tabela de pessoas |
| **RT (responsável técnico) e conselho** | O profissional de saúde (biomédico/enfermeiro) que responde tecnicamente pela clínica, com registro no conselho (CRBM, COREN) | NOVO `pop_unidade_cfg` (33: nome, conselho, nº, UF; conselhos COREN e CRBM); LEGADO `clinicas.rt` / `rts[]` (51, com início, vínculo, gratificação, conselho, CRBM) / `rtsEnc` (RTs encerrados, 36); `docs/prescritores` (48, 43 com CRBM); `pedido.crbm`; `pedidos_novo.pessoa` / `termo.rt_id` (0, estrutura nova vazia) | **4 lugares e nenhum ligado ao outro.** No A, a carteira CRBM e a CRT são só arquivos (66 + 46), sem o número |
| **Lab Paulista** | O laboratório (farmácia de manipulação de Sorocaba, "Centro Paulista") que fornece fórmulas. Cada clínica precisa de um **termo de responsabilidade** assinado pelo RT para comprar | LEGADO `lab` (2: Centro Paulista e Injemed, com "ficha" de regras); `pedidos_novo.laboratorio` (2); termo no checklist legado (40, 36 com anexo); `clinicas.crbmTermo` (34) / `rtTermo` (36); Injemed: `inj_unidades.termo` (4) | O termo **não existe no sistema A** |
| **CNES** | O cadastro nacional do estabelecimento de saúde (Ministério da Saúde) | Só como item `cnes` no catálogo do A | **0 registros, nunca usado** |
| **Alvará, licença sanitária (VISA), AVCB, inscrição municipal (CCM)** | As licenças da prefeitura, da vigilância sanitária e dos bombeiros | A (alvará 41, VISA 40, AVCB 42, insc. municipal 3); legado (esqueleto de 14 cada, vazio) | O A é a fonte; o legado é sobra |
| **Inscrição estadual** | O registro na Fazenda estadual | Só no legado (14 entradas, vazias) | Falta no A |
| **Certificado digital** | O e-CNPJ, usado para nota fiscal e prefeitura; vence todo ano | Só a validade no legado `clinicas.docs` (47); `cmp_empresas.certificado_validade` está vazio | Precisa de um dono único e de alerta |
| **Prescritores** | Os profissionais que assinam receitas de manipulação | LEGADO `docs/prescritores` (48) | Sobrepõe-se ao RT |
| **Logins / pessoas** | Quem acessa cada sistema | A `acessos` (20); POPs `pop_logins` (42 e-mails); LEGADO `membros` (21) e `cmp_perfis` (6); `nutra.membros` (21); `premiacao.usuarios` (30); `pedidos_novo.usuario` (2) | Comparando por hash: 18 dos 20 logins do A também estão em `membros`; 17 estão em premiação; 9 estão no POPs. **Há cerca de 55 e-mails distintos só entre A, POPs, membros e cmp_perfis** |

---

## E) `pesquisa-zuria-drhair`

- Site Netlify estático (plano Pro), publicado por upload direto em **27/11/2026 às 02:39** (hoje). Tem 2 páginas: `index.html` e `resultados.html`. Não tem funções nem edge functions. **Netlify Forms está habilitado.**
- **Não tem banco Supabase:** não existe tabela "pesquisa", "survey" ou "nps" em nenhum dos dois bancos. A leitura dos formulários pela API do Netlify deu 404 e o site está bloqueado por aqui, então **não consegui ver o conteúdo**.
- Pelo nome e pelo contexto, deve ser uma pesquisa sobre o **Zuria** (o sistema de vendas e atendimento das clínicas, de onde a premiação importa vendas: `premiacao.zuria_*`, `zuria_import`), com respostas guardadas no Netlify Forms e uma página de resultados. **É dedução, não confirmei.** Não faz parte do domínio de documentos.

---

## Uso de armazenamento

| Banco | Bucket | Objetos | Tamanho |
|---|---|---|---|
| NOVO | documentos (sistema A) | 1.015 | ~894 MB |
| NOVO | pops-especificos | 3 | ~46 KB (órfãos) |
| LEGADO | anexos (pedidos + checklist das clínicas) | 1.320 | ~198 MB |
| LEGADO | backups | 12 | ~22 MB |
| LEGADO | injemed | 24 | ~9,7 MB |

## Rotinas (cron)
- **NOVO:** premiacao-encerrar-vencidas (diária, 03:10), premiacao-copia-diaria (06:30), pedidos-novo-planilha (10:00), pedidos-novo-rastreio (10:20), nutra-rodada-dia-01 (mensal). **Nenhuma é de documentos ou POPs.**
- **LEGADO:** rastreio-manha e rastreio-tarde, backup-semanal (domingo), planilha-horaria, receitas-dia-01, compras-reposicao-diaria, compras-limpar-orfaos (chama a função com a chave publicável no comando), nut-rodada-dia-01. **Nenhuma é de documentos.**

## Dados que se repetem (resumo para o desenho)
- **Unidades:** 53 reais, em 8 cadastros. O elo comum é o **CNPJ** (100% de coincidência em A, legado/clinicas, premiação e pedidos_novo). `pedidos_novo.unidade.doc_unidade_id` já aponta para `public.unidades` do A (53 de 53 ligados): **esse é o embrião do cadastro mestre.**
- **CNPJ / razão social:** em 4 cadastros.
- **Sócios:** em 4 cadastros, como texto solto.
- **RT:** em 4 cadastros e nenhum ligado ao outro.
- **Logins:** 7 tabelas de usuários com regras diferentes (senha própria, chave compartilhada, CNPJ + e-mail, Supabase Auth). As mesmas pessoas se repetem.
- **Documentos:** contrato social e cartão CNPJ existem em dobro (A com 116 arquivos; legado com 81 anexos).

## Problemas transversais
1. Não há alerta de vencimento: 37 documentos vencidos e 90 vencendo em 60 dias, sem aviso a ninguém.
2. As chaves são compartilhadas ou estão escritas no código (admin, operacional, consultor, x-link), sem identidade individual.
3. O login do POPs usa só o CNPJ.
4. O catálogo de documentos está fixo no código; termo do laboratório, certificado digital, inscrição estadual e contrato com o RT ficam fora do A.
5. O RT está espalhado e sem ligação com a carteira e a CRT anexadas no A.
6. Há backups e tabelas legadas no schema de produção (`bak_*`, `premiacao_copia_*`).
