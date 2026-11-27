# Próximo passo: compressão dos arquivos do sistema de Documentos (27/11/2026)

Situação: Supabase grátis (1 GB). Bucket `documentos` = 853 MB (1.015 arquivos, 98% PDF escaneado).
O dono NÃO quer pagar o Pro agora (máximo US$ 25/mês). Decisão: comprimir os PDFs e guardar os originais no Google Drive da conta de Operações.

## Já feito
- Teste com 10 arquivos grandes (Ghostscript, /ebook, 150 dpi cor/cinza, 300 dpi P&B): 139 MB -> 57 MB (-59%), mesmo nº de páginas, texto nítido. Contratos longos comprimem pouco (fica o original quando não reduz).
- Função temporária `apoio-compressao-teste` (links de leitura) já DESATIVADA (responde 410).
- O Drive conectado era o da conta do DP; a pasta criada lá foi para a lixeira. O dono vai reconectar o Google Drive com a conta de Operações.

## Regras aprovadas pelo dono
- Por etapa e por loja (53 lojas; maiores: Moinhos 59 MB, Coronel Fabriciano 49 MB, Ipatinga 48 MB). Primeiro 1 loja, o dono confere no sistema, depois as demais.
- Antes de trocar qualquer arquivo de uma loja, enviar os originais dela para o Drive de Operações:
  pasta "Originais - Sistema de Documentos (cópia de segurança)" / <nome da loja> (mesmo caminho do bucket).
- O comprimido entra no MESMO caminho/nome (public.arquivos.path não muda). Só troca se ficar menor, com o mesmo nº de páginas e abrindo sem erro.
- As 108 cópias repetidas ficam (106 estão ligadas a cadastros diferentes em public.arquivos; sistema em uso).
- Relatório por loja: arquivo, antes, depois.
- Conferir antes: espaço livre do Drive de Operações (precisa ~1 GB).

## Depois
- Copiar os ~198 MB de anexos do Pedidos antigo (ckgsdvhkpnrrmctlqtma, somente leitura) para o projeto novo.
- Sistema novo comprime automaticamente todo arquivo enviado.
- Publicar no Netlify as telas Criar pedido e Notas e PV (commit 2f4ac7e, ainda não publicadas).

## Andamento
- Drive de Operações: pasta "Originais - Sistema de Documentos (cópia de segurança)" (id 1vF5qZct7hXC7km1SVAYXBRH4bz0FZEcF), uma subpasta por loja.
- Limite do conector do Drive: ~3 MB por envio. Originais de cada loja vão em 7-Zip dividido em partes de 3.000 KB (`7z a -mx=1 -v3000k`), conferidos por extração antes do envio.
- Função `apoio-compressao-teste` (token; hash no código) é ligada só durante a troca e desligada (410) ao fim de cada etapa. Scripts: `compressao-documentos/etapa.py` (baixa e comprime) e `trocar.py` (troca e confere o hash do que voltou).
- 27/11 Moinhos: 19 partes no Drive; 24 de 29 arquivos trocados, todos conferidos; 59,0 MB -> 7,3 MB. Bucket: 853 -> 801 MB. Aguardando o dono conferir Moinhos no sistema antes das demais lojas.
- Observação: a coluna public.arquivos.tamanho guarda o tamanho antigo (não alterada; sistema em uso).
- 27/11 demais 52 lojas: 257 partes no Drive (conferidas por quantidade e tamanho antes da troca); 736/736 arquivos trocados e conferidos por hash. Bucket `documentos`: 853 MB -> 368,8 MB; 1.015 arquivos; 0 cadastros apontando para arquivo inexistente. Função `apoio-compressao-teste` desligada (410). CONCLUÍDO.
- Próximo: copiar os ~198 MB de anexos do Pedidos antigo para o projeto novo (somente leitura no antigo) e fazer o sistema novo comprimir todo arquivo enviado.
- 27/11 CONFERÊNCIA DE CONTEÚDO (pedida pelo dono): todas as páginas dos 760 comprimidos comparadas com o original (imagem, tinta e texto, `conferir2.py`). 1 arquivo perdeu o conteúdo (IPTU Londrina, boleto gerado por sistema com fonte não embutida -> Ghostscript gerou página em branco). Por segurança, 33 suspeitos voltaram ao original (`originais-devolvidos.txt`, conferidos por hash). Final: 1.015 arquivos, 727 comprimidos + 288 originais, 409,0 MB, 0 divergências com o esperado. Função desligada.
- Lição: compressão de PDF precisa de conferência de conteúdo página a página ANTES de trocar; PDFs com fontes não embutidas (boletos, documentos gerados por sistema) devem ficar como estão.
