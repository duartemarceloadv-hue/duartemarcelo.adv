# Debate do sistema único Dr. Hair — instruções comuns

Pasta: /tmp/claude-0/-home-user-duartemarcelo-adv/8761351e-6ddc-5430-a18a-8c3293ae9bf0/scratchpad/desenho/
Leia ANTES: premissas.md (decisões do usuário — não rediscutir, só registrar risco), inv-premiacao.md, inv-pedidos.md, inv-documentos.md, inv-compras-reembolsos-nutra.md (inventário real dos sistemas) e pesquisa-mercado.md (referências de mercado).

REGRA ABSOLUTA: somente leitura. Não altere, crie, publique nem apague nada em nenhum sistema, banco, site ou repositório. Pode consultar o banco Supabase com SELECT (ToolSearch "select:mcp__Supabase__execute_sql") se precisar de evidência.

Toda afirmação precisa de evidência: cite o arquivo do inventário/pesquisa (e seção) ou a consulta feita. Seja concreto (tabelas, telas, números), sem generalidades. Português. Máximo ~1.200 palavras.

Temas obrigatórios (responda os que tocam a sua especialidade, e todos de forma breve):
1. Vale unificar? O que unificar agora (núcleo, login, layout) e o que manter separado por enquanto.
2. De uma vez ou por fases; qual módulo vai primeiro; ordem completa.
3. Como não interferir em sistemas em uso (Premiação em implantação, outubro aberto; Nutra com rodada de dezembro em 01/12; Pedidos antigo ainda em uso).
4. Cadastro único (unidade, empresa/CNPJ, sócio, pessoa, fornecedor, prescritor/RT, documento) e de onde vem cada dado.
5. Perfis de acesso por papel e unidade.
6. Padrão de tela para todos os módulos (lista, ficha, pendência, aprovação, documento, relatório).
7. Infraestrutura: repositório, ambientes de teste, publicação, backup, como voltar atrás.
8. Onde a API do Claude entra e onde não deve entrar.
9. Análise crítica do próprio pedido do usuário: o que nele pode piorar o resultado, e a alternativa.
