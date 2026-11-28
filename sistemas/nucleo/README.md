# Núcleo do sistema de operações Dr. Hair (schema `nucleo`)

Cadastro comum a todos os módulos: unidades e empresas, pessoas com função, logins e papéis, auditoria.
Documento-mestre §4 e §7; desenho global de 27/11/2026 (`sistema-unico/conselho-global-2026-11-27/desenho-global.md`, §3.1 e Fase 1).
Banco único `xqxjmeioodmdhxhivyqu`. Nada de `public`, `premiacao*` ou `nutra` foi alterado; `public.unidades` só foi lida.

## Situação (27/11/2026)

| Passo | Arquivo | Aplicado? |
|---|---|---|
| 1. Núcleo: estrutura + carga | `migrations/0001_nucleo.sql` | **sim** (migration `nucleo_0001_uuid_public_unidades`; uma 1ª aplicação, `nucleo_0001`, usava os ids do Laboratórios e foi desfeita com `drop schema nucleo` antes de qualquer uso, para seguir o desenho global: id = uuid de `public.unidades`) |
| 2. Laboratórios passa a usar o núcleo | `../pedidos/supabase/migrations/0012_usa_nucleo.sql` | **sim** (`pedidos_novo_0012_usa_nucleo`) |
| 3. Receitas do mês e termos | `../pedidos/supabase/migrations/0013_receitas_e_termos.sql` | **sim** (`pedidos_novo_0013_receitas_e_termos`) |
| 4. Funções `pedidos-api` (v7) e `pedidos-historico` (v3) | `../pedidos/supabase/functions/` | **publicadas** |
| 5. Telas (`web/`) | `../pedidos/web/` | **não publicadas** (o dono publica no Netlify `pedidos-novo-drhair`) |
| 7. Preparação da troca | `../pedidos/supabase/migrations/0017_troca_preparada.sql`; `pedidos-historico` v6 (CORS Cloudflare) | **sim** (28/11/2026; só funções e tabela vazia; retrato antes/depois idêntico: `conferencia/retrato-antes-0017-2026-11-28.json`, `retrato-depois-0017-2026-11-28.json`) |
| 6. Criar pedido e Notas e PV | `../pedidos/supabase/migrations/0015_criar_pedido.sql`, `0016_notas_e_pv.sql`; `pedidos-api` v9, `pedidos-historico` v5 | **sim** (27/11/2026; retrato antes/depois idêntico: `conferencia/retrato-antes-0015-2026-11-27.json`, `retrato-depois-0016-2026-11-27.json`) |

Se for preciso refazer do zero num banco de teste, a ordem é 1 → 2 → 3 → 4 → 5. A conferência é `conferencia/retrato.sql`
antes do passo 2 e depois do passo 3 (contagens e somas em R$ iguais; só `pessoa` e `evento` mudam, ver `retrato-depois-…json`).

## Tabelas

| Tabela | O que guarda |
|---|---|
| `unidade` | id = **o mesmo uuid de `public.unidades`** (53/53); nome, cidade, UF, ativo, abertura (do cadastro de clínicas do antigo) |
| `unidade_ref` | equivalência de ids de outros sistemas → unidade. Hoje: `pedidos_novo.unidade` (id antigo do Laboratórios, 53) |
| `unidade_apelido` | nomes da unidade nos outros sistemas/planilhas (71, os mesmos ids do Laboratórios) |
| `empresa` | razão social e CNPJ (único) — 53 |
| `unidade_empresa` | CNPJ da unidade com vigência (de/até). 4 sem data de início: o `2000-01-01` do Laboratórios era marcador e virou nulo |
| `pessoa` | pessoa física, id interno. `outros_nomes` = grafias vistas nas fontes. `juntada_em` = cadastro juntado a outro por decisão de Operações |
| `pessoa_origem` | de qual registro de qual sistema a pessoa veio (reimportar não duplica) |
| `pessoa_documento_fiscal` | CPF/CNPJ com vigência (CPF sempre mascarado na tela). **Vazia**: nenhuma fonte tinha CPF/CNPJ de pessoa |
| `profissional` | conselho, registro (só dígitos), UF, como estava escrito na fonte, `habilitado_prescrever` |
| `prescritor_unidade` | onde o prescritor atua (lista do sistema antigo) |
| `unidade_rt` | RT da unidade: titular/substituta, de/até, vínculo, cargo |
| `socio_unidade` | sócio × unidade com vigência |
| `usuario`, `usuario_papel` | login (e-mail) e papel × módulo (`todos` ou nome do módulo) × unidade (nula = todas; obrigatória para unidade/sócio/diretora/gestora) |
| `pendencia_cadastro` | o que Operações precisa decidir (possível duplicada, sócio que é empresa, datas inconsistentes, unidade não reconhecida) |
| `evento` | auditoria do núcleo: quem (e-mail do JWT), origem (tela/carga), antes, depois, **justificativa**; não pode ser alterada nem apagada |

Funções: `nucleo.acesso(email, modulo)` (papéis, unidades, ver/gravar/admin/mfa/cadastros), `nucleo.pode(unidade, acao)` e
`nucleo.minhas_unidades(modulo)` — SECURITY DEFINER, `search_path` vazio, lendo o e-mail do JWT. Ações: `<modulo>.ver|gravar|admin`, `cadastros.ver|editar`.
RLS ligado em todas as tabelas e nenhuma concedida a `anon`/`authenticated`: o acesso é pelas edge functions (chave de serviço),
que aplicam `nucleo.acesso`.

## Regras da carga (nada inventado)

- **Pessoas só com função** (RT, prescritor, sócio); os ~697 colaboradores da Premiação **não** foram carregados (desenho global, Fase 1).
- **Casamento só por registro no conselho** (conselho + número; UF igual ou ausente de um lado). Nunca por nome.
  Fontes, nesta ordem: 48 prescritores; RTs vigentes (`clinicas.rts`) e encerradas (`rtsEnc`); RT do termo (`rtTermo`/`crbmTermo`);
  RT das unidades Injemed (`inj_unidades`); sócios (`clinicas.socio`).
- O registro é lido como estiver escrito ("CRBM-1 37175", "61585-SP", "COREN-RS 602340", "04867 CRBM-7"): número = maior grupo de dígitos, sem zeros
  à esquerda; UF só quando escrita; conselho CRBM quando não escrito. O texto original fica em `profissional.registro_original`.
- **Sócio**: o antigo só tem o primeiro nome. Um cadastro por unidade; nomes iguais viram possível duplicada (Operações junta).
  "Crescimentum" é empresa sem CNPJ na fonte → pendência `socio_empresa`.
- **Titular/substituta**: titular = a única RT vigente da unidade, ou a 1ª citada no campo "RT" do antigo; as demais vigentes = substituta.
  RT encerrada fica com tipo "não informado".
- RT encerrada com fim antes do início (1 caso) não entrou: virou pendência `datas_inconsistentes`.
- Possíveis duplicadas: mesma chave de nome (sem acento, Z=S, letras dobradas…), um nome contido no outro, ou igual a uma grafia guardada.

## Contagens (27/11/2026)

| | |
|---|---|
| Unidades | 53 (53 com o uuid de `public.unidades`) |
| Empresas / vínculos de CNPJ | 53 / 53 |
| Pessoas | 135 = 83 RT/prescritores + 52 cadastros de sócio |
| Profissionais | 83 (56 com registro no conselho; 56 habilitados a prescrever) |
| RTs | 43 vigentes (41 titulares, 2 substitutas) + 17 encerradas |
| Sócios | 52 vínculos |
| Documentos fiscais | 0 (nenhum na fonte) |
| Usuários / papéis | 2 / 2 (os 2 administradores do Laboratórios, papel `admin`, módulo `laboratorios`) |
| Pendências de cadastro | 59: 57 possíveis duplicadas, 1 sócio-empresa, 1 data inconsistente |

## Telas (dentro do site do Laboratórios, menu "Cadastros", só Operações/administrador sem restrição de unidade)

- **Unidades**: lista (CNPJ vigente, RT titular, sócio, termo, pendências) e ficha (CNPJ vigente e histórico, sócios, RT titular/substituta,
  termos com laboratórios, apelidos, histórico). Editar dados, novo CNPJ (fecha o anterior), incluir/encerrar sócio e RT, trocar titular/substituta,
  incluir/remover apelido — **sempre com justificativa**, que fica em `nucleo.evento`.
- **Pessoas**: lista com filtro por função e ficha (documentos fiscais com CPF mascarado, registro profissional, onde atua, origem do cadastro, histórico).
- **Pendências de cadastro**: as duas pessoas lado a lado (registros, onde atua, de onde vieram); juntar (escolhendo qual fica), manter separadas,
  marcar resolvida ou descartar, com justificativa. Juntar pessoas com registros diferentes no conselho exige confirmação explícita.

## O que ficou de fora (e por quê)

- **Colaboradores, lotação, Bizneo, Premiação**: fora da Fase 1 (desenho global). A Premiação não é lida.
- **CPF/CNPJ de pessoas**: não existe em nenhuma fonte usada; nada foi importado.
- **Logins do sistema antigo** (`membros`, 21): não viraram usuários — ganhariam acesso sem decisão do dono. Só os 2 do Laboratórios.
- **Conferência "ver como" e MFA por e-mail** do documento-mestre §7: o Laboratórios continua com o app autenticador (comportamento de hoje).
- **A junção de pessoas** foi testada na tela (dados fictícios) e o SQL de cada passo foi revisado, mas não foi executada no banco real:
  a tentativa de testá-la com reversão ficou parada esperando uma permissão que ninguém pôde dar. Na primeira junção real, conferir a pessoa que ficou.
