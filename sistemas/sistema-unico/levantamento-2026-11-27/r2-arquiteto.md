# Rodadas 2 e 3 — Arquiteto: crítica e revisão

Base: as 9 propostas r1-*.md, os inventários e as minhas consultas de 27/11 (banco único: 144 MB de banco e 853 MB de arquivos; `list_branches` vazio). Fiz só leituras.

## A. Crítica

### A1. Conflitos entre as propostas (precisam de decisão única)

| Tema | Posições | Risco se ficar sem decisão | Minha decisão |
|---|---|---|---|
| Nome do schema do núcleo | `nucleo` (arquiteto, RH); `core` (dados); `cadastro.fornecedor` (financeiro); tabela `auditoria` (segurança); `nucleo.evento` (arquiteto) | Dois cadastros nascem em paralelo, que é exatamente o problema de hoje: 8 cadastros de unidade (inv-documentos §D) | **`nucleo`**, em português como `pedidos_novo` e `premiacao`. Um nome por conceito: `nucleo.evento` = auditoria, `nucleo.usuario_papel` = acesso |
| Contas e acesso | `usuario` / `usuario_papel` (arquiteto); `conta` / `acesso` (RH); `pode(unidade, acao)` (segurança) | Duas funções de permissão divergentes e um vazamento entre lojas (pesquisa §7.15) | Tabela `nucleo.usuario_papel` e **uma** função `nucleo.pode(unidade, acao)`. `minhas_unidades()` passa a ser derivada dela |
| Primeira entrega | Núcleo e login primeiro (arquiteto, segurança); tela de pendências primeiro, lendo os módulos (operações, sócio); Contas a pagar em vista (financeiro) | Uma tela de pendências sem núcleo lê 3 schemas com 3 regras de acesso. O sócio veria o que não deve | O núcleo vem primeiro, mas **com a tela de pendências na mesma entrega**, alimentada só por Pedidos novo e Documentos (ver B) |
| Data da virada do Nutra | "Meio de dezembro" (diabo); "entre o fechamento de dezembro e 01/01 07:00" (dados e arquiteto); "depois de 01/12" (segurança, designer) | Em meados de dezembro a rodada está aberta: migrar com respostas chegando arrisca perder um envio. O formulário é anônimo, e não há como pedir que reenviem | **Nunca com rodada aberta.** A janela é do fechamento da rodada de dezembro até 01/01 às 10:00 UTC. Se a janela não couber (feriado), janeiro roda no legado e a virada passa para a janela seguinte |
| Ordem após o login | Pedidos e depois Documentos (designer, operações); Documentos/POPs em 2º, por risco (segurança); Nutra primeiro (dados) | Retrabalho de login e casca feito duas vezes | Documentos/POPs sobem: o risco deles é alto e o trabalho é pequeno (ver B) |
| Ficha de registro | Página própria, sem gaveta (designer); painel dentro da pendência, para resolver sem trocar de tela (operações) | Gaveta com rolagem interna, que a premissa proíbe (o Pedidos novo já tem `.f-corpo{overflow-y:auto}`, segundo o designer) | A pendência abre **uma página** com o documento ao lado e no máximo 2 decisões. Isso atende os dois |

### A2. Por proposta (só onde discordo)

**Designer**
- A regra "ficha nunca em gaveta, sem abas no topo" obriga a **refazer a tela do Pedidos novo**, que acabou de ficar pronta. Isso é retrabalho num módulo em uso e com 276 pedidos ainda por sincronizar (inv-pedidos §8).
- Proposta: aplicar o kit ao Pedidos quando houver a virada de login, numa entrega só, e não antes.
- O limite de 8 colunas é bom. O Quadro do mês da Premiação (12 colunas) fica como está até a Fase Premiação.

**Operações**
- O contador "Premiação outubro (100)" na tela inicial exige ler `premiacao` em tempo real. A Premiação reescreve as pendências a cada recálculo (`autoRecalc`, inv-premiacao §2), então uma cópia mostra números velhos e gera tela confusa.
- Proposta: até a Fase Premiação, mostrar só um link "Abrir a Premiação", sem número.
- A automação "cobrar o laboratório nas 101 parcelas" envia e-mail. Antes disso é preciso o "e-mail decidido e não implementado" (inv-pedidos §6) e um registro de envio. Sem isso não há como provar a cobrança.

**Sócio**
- Ele pede que o sócio veja só pendências, sem o "Por sócio" e sem totais da rede. Isso conflita com a premissa "sócio vê o que Operações vê".
- Registro o risco e proponho cumprir a premissa como **escopo** (os mesmos dados, só as lojas dele) e não como **tela**: a tela inicial dele é a de pendências.
- O "Por sócio" já é filtrado pelo escopo. Para um sócio, mostra só a linha dele.

**Financeiro**
- Fase 3: "Pedidos passa a gravar em `financeiro.titulo` e as 541 parcelas e 83 pagamentos são migrados". Discordo.
- A regra das 3 baixas está em `pedidos_novo.parcela` e `v_parcela` (0006 e 0007). Movê-la exigiria reescrever a fonte de 334 parcelas quitadas, somando R$ 2.277.952,95, que hoje conferem. O risco é uma parcela quitada voltar para "falta" (função perdida, dinheiro cobrado em dobro).
- Proposta: Pedidos continua dono das suas parcelas. `financeiro.v_conta_pagar` é uma **view de união** (Pedidos, Compras, Reembolsos), e só os módulos novos gravam `financeiro.titulo`.
- Concordo com "não reconstruir o Compras antes de entender por que não foi usado".

**RH**
- `pessoa_documento_fiscal` corrige um erro meu: eu tinha CPF/CNPJ na própria pessoa, e o PJ entra pelo CNPJ (189 casos). Adoto.
- Discordo de `nucleo.lotacao` alimentada por carga noturna da Premiação como base de aprovação de reembolso. Ela duplicaria `premiacao.lancamentos` e `movimentar`, e as duas divergiriam.
- Proposta: lotação vinda da Bizneo, só leitura. Quem aprova o reembolso sai do escopo do papel (`usuario_papel`), e não da lotação.

**Segurança**
- A tabela única `auditoria` "gravada por gatilho" não pode ter gatilho em `premiacao` (premissa) nem em `pedidos_novo.evento`, que já tem 9.744 registros.
- Proposta: `nucleo.evento` para os módulos novos, mais a view `nucleo.v_historico`, que une os históricos existentes sem copiá-los.
- A lixeira (`excluido_em`) em todas as tabelas obriga toda regra de acesso e toda lista a filtrar o excluído. Se uma esquecer, o registro apagado reaparece (tela confusa).
- Proposta: lixeira só onde há exclusão pela tela, com views `v_*_ativo`.
- MFA "recomendado" para o sócio está certo. Torná-lo obrigatório reduziria a adesão: só 6 de 19 usuários criaram senha (inv-premiacao §3).

**Dados**
- `core.pessoa` como "visão sobre o espelho da Bizneo" (`premiacao.bizneo_cadastro`) cria dependência de um schema intocável que tem RLS desligado e CPF (segurança §0). Se a Premiação mudar a carga, o núcleo quebra.
- Proposta: **cópia materializada** em `nucleo`, com data de consulta.
- Concordo com o arquivo morto `legado_ckg` (sem acesso anônimo), com a numeração DH e com o reconhecimento de unidade em três passos.
- Corrige um erro meu: **o backup do Pro não cobre o Storage**. Os buckets precisam de cópia semanal externa conferida por hash.

**Diabo**
- "Não fundir num único site" está certo, mas o único Netlify pode servir a casca e cada módulo como pasta com código próprio. O risco 14 (lentidão) se resolve carregando por módulo, sem vários sites, que trariam de volta vários logins.
- Concordo com o spend cap, o segundo humano e o desligamento do legado por schema e rotina.

## B. Revisão da minha proposta (até 800 palavras)

**Mantido**
- Um banco, um schema por módulo e o núcleo `nucleo`.
- Módulo não grava no núcleo nem em outro módulo, só por funções.
- `nucleo.unidade` usa o id de `public.unidades` (53 de 53 já ligados).
- A Premiação fica intocada até ser autorizada.

**Mudou**

1. **Pessoa** (do RH). Sai CPF/CNPJ da pessoa. Entram `nucleo.pessoa_documento_fiscal` (CPF e CNPJs com vigência) e `nucleo.profissional` com `habilitado_prescrever`. A carga é uma cópia materializada da Premiação e da Bizneo, só lida. Casamento por nome é só sugestão, nunca automático. Motivo: 189 PJ por CNPJ e 0 e-mails em 697 pessoas.

2. **Unidade** (de dados). `unidade_alias` passa a ter duas tabelas: `nucleo.unidade_apelido` (nome normalizado por sistema) e `nucleo.unidade_ref` (id externo por sistema). O reconhecimento segue CNPJ, depois ref, depois apelido; quando nada bate, vai para a fila "Unidade não reconhecida".

3. **Acesso**. Uma função, `nucleo.pode(unidade, acao)`, usada no RLS e nas edge functions. MFA obrigatório para Operações, financeiro e contabilidade. Sem MFA para o sócio.

4. **Schemas de apoio** (de dados e segurança):
   - `integracao`, com `lote`/`linha` e `rotina`/`execucao`, a generalização de `execucao_conector`.
   - `legado_ckg`, o arquivo morto do legado, só leitura.
   - `financeiro` só com `titulo` dos módulos novos e a view `v_conta_pagar`. As parcelas do Pedidos não migram.

5. **Auditoria**. `nucleo.evento` para o que é novo e `nucleo.v_historico`, que lê `pedidos_novo.evento`, `public.historico` e `cmp_eventos` arquivado. Gatilho só em schema novo.

6. **Backup** (correção). O backup diário do Pro cobre o banco. Os buckets ganham cópia semanal externa com hash. As `premiacao_copia_*` (62 MB) só saem da produção depois que a Premiação fechar outubro e com o "sim" do usuário.

7. **Nova ordem**, combinando operações, segurança e diabo:

| Fase | Entrega | Por quê |
|---|---|---|
| 0, até 30/11 | Plano Pro com spend cap, código de todas as funções no GitHub (cópia), projeto de teste, segundo humano com acesso de emergência | Nada em produção; Nutra em 01/12 e outubro aberto |
| 1 | `nucleo` carregado por cópia; casca; login único **e** "Minhas pendências" com Pedidos novo (parcelas, divergências) e Documentos (vencidos) | Primeira entrega com valor visível (37 vencidos, R$ 661.463,51 em "falta planilha") |
| 2 | Documentos/POPs com login individual (fim da chave compartilhada e do CNPJ sem senha) e rotina de vencimento | Maior risco de segurança, menor esforço |
| 3 | Pedidos completo (criar pedido, receitas, PV, RT no núcleo), numeração DH decidida, arquivos copiados com hash, antigo em leitura por 30 dias | Lista de aceite da matriz (inv-pedidos §3) 100% aprovada |
| 4 | Nutra na janela entre rodadas, com o hash da senha | Nunca com rodada aberta |
| 5 | Reembolsos novo no núcleo, gerando `financeiro.titulo`; Compras simplificado | 0 uso hoje, então constrói-se sem migrar |
| 6 | Legado desligado por schema e rotina, pausado 30 dias, com dump externo | Diabo, risco 5 |
| 7 | Premiação na casca e no login, entre competências e com autorização | Premissa |

8. **Telas**. A casca e o kit do designer: 4 tamanhos de fonte, 5 cores e nenhuma rolagem interna. Cada módulo carrega só o seu código. O filtro de unidade é global e fica em `nucleo.preferencia`. A competência só aparece onde o mês existe. O Pedidos recebe o kit só na Fase 3, para evitar refazer duas vezes.

9. **IA**. Só `ler-documento` no núcleo, registrando cada leitura em `integracao.ia_leitura`: hash, custo e quem confirmou. Nunca relê o mesmo hash e tem teto mensal.

**Riscos que continuam**
- Duas bases de login até a Fase 7, por causa da Premiação.
- A Omie depende do navegador do dono. Por isso o alerta "sem leitura há 2 dias".
- A janela do Nutra cai no Ano-Novo.
