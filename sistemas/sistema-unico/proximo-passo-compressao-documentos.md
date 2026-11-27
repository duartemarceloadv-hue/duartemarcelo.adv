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
