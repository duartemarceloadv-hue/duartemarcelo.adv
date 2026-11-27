# R2 – DP/RH: crítica e revisão

Somente leitura. Evidência nova (SELECT em `xqxjmeioodmdhxhivyqu`, 27/11):

| Consulta | Resultado |
|---|---|
| Nomes (sem acento/caixa) repetidos em `premiacao.pessoas` | **109** |
| Nomes que aparecem com CPF **e** com CNPJ | **101** |
| Dessas 101: linha CNPJ | 101, todas ativas e ligadas à Bizneo, 100 com lançamentos |
| Dessas 101: linha CPF | 94 inativas e 5 ativas sem Bizneo e sem lançamento; 2 ativas com Bizneo e sem lançamento |
| Pessoas sem `bizneo_id` | 209 (só 1 é PJ) |
| `bizneo_cadastro` colunas | bizneo_id, doc, status, contratos. **Sem nome, cargo, unidade e e-mail** |
| `usuarios` com perfil colaborador | 2 (de teste; 0 reais, inv-premiacao §3) |

Conclusão: a própria Premiação já tem cerca de 100 PJ em duas linhas, uma antiga pelo CPF e uma atual pelo CNPJ. Quem copiar as 697 linhas como 697 pessoas cria cerca de 100 duplicadas logo no primeiro dia. A linha CPF antiga tem valor: é ela que liga a pessoa PJ ao registro no conselho (RT/prescritor).

## A. Crítica por proposta

**Arquiteto**
- `nucleo.pessoa` tem o campo "CPF ou CNPJ". Isso põe dois dados no mesmo campo (premissa) e repete a separação acima.
- A carga é uma "cópia de leitura de `premiacao.pessoas` (697) **e** dos prescritores (48)". Sem casamento prévio, a carga gera cerca de 100 duplicadas PJ, mais até 41 prescritores em dobro.
- Falta vínculo/lotação com vigência. Transferência e empréstimo (`vinculos` com 41 linhas; 94 lançamentos da mesma pessoa em mais de uma loja no mesmo mês) não têm onde morar. O sócio da loja antiga perde o histórico, ou passa a ver o período na loja nova.
- Acertos: `profissional` e `unidade_rt` separados da pessoa, com vigência. É o mesmo desenho do meu `papel_tecnico` e `rt_unidade`. `usuario` → `pessoa_id` também é correto.
- Problema no login: "valida a senha antiga no primeiro acesso" só serve para os 19 usuários. Os cerca de 400 colaboradores não têm senha nem e-mail (0 de 697).

**Dados**
- "`core.pessoa` nasce como visão sobre o espelho Bizneo" não funciona: `bizneo_cadastro` não tem nome, cargo nem unidade, e 209 pessoas estão fora da Bizneo.
- A chave "CPF/CNPJ do PJ" tem o mesmo defeito da proposta do Arquiteto.
- Acerto que adoto: reconhecimento só por documento ou id externo, fila de "não reconhecida" e **nunca aproximar nome**. Isso vale também para os 41 de 48 prescritores.

**Segurança**
- Concordo com a máscara de CPF, com o log de exportação e com o financeiro sem acesso ao resultado da premiação.
- Faltam três pontos:
  1. A contabilidade vê salário e CPF de todas as unidades. Ela deve ver só as empresas/CNPJs que atende.
  2. Gestor "vê a premiação da equipe". Na Premiação de hoje o perfil `unidade` é sócio ou gestor (inv-premiacao §3); separar os dois papéis não pode abrir prêmio individual a um gestor que é colega da equipe.
  3. O primeiro acesso "sem prova de identidade" (código que não vai por e-mail) é o bloqueio real do login de colaborador. Ele precisa de canal verificado.

**Financeiro**
- "Pessoa e PIX vêm do cadastro único (Premiação tem 697)": a Premiação não tem PIX nem e-mail. O PIX nasce vazio e vem da própria pessoa, com a confirmação antifraude.
- Quem aprova o reembolso de uma pessoa em várias lojas? Proposta: a unidade da despesa, desde que a pessoa tenha lotação vigente nela na data.
- Reembolso de PJ: o favorecido é a pessoa ou a empresa dela? É preciso registrar qual documento recebe.
- Concordo: prêmio é folha e não vira título.

**Operações**
- "Pessoa a partir de `premiacao.pessoas`; RT/prescritor a partir do antigo" são duas fontes sem casamento, e o risco é duplicar.
- "Mudar o RT num lugar só" só vale se o RT for papel da pessoa, e não um cadastro à parte.

**Sócio**
- O código de 6 dígitos serve para ele, mas para o colaborador o código precisa ir a um contato verificado.
- O pedido "nada de outra loja" atinge a ficha de quem foi transferido: o sócio vê só os períodos na loja dele.

**Designer**
- O menu Cadastros com "Pessoas · Sócios · Responsáveis técnicos" parece três cadastros. A proposta é uma lista de Pessoas com filtro por papel, e a ficha com abas.
- "Colaborador vê Meu prêmio e Meus reembolsos": correto, mas só depois que o login dele existir.

**Diabo**
- O risco 15 (papel errado na migração) é real. Acrescento o risco 17: **pessoa duplicada na carga** (os cerca de 100 PJ), com reembolso ou RT ligado à linha errada.
- Concordo: Reembolsos nasce no núcleo, sem migrar dados.

**Conflito central do cadastro de pessoa**
- Arquiteto e Dados usam uma linha por documento, com CPF ou CNPJ como chave.
- Eu uso uma linha por pessoa física com id interno, e os documentos fiscais à parte.
- Os números (101 nomes com as duas formas) favorecem a segunda opção. Ela acomoda a Premiação sem tocá-la: o lançamento continua pelo CNPJ e o núcleo resolve CNPJ → pessoa.

## B. Revisão (o que mudou e por quê)

1. **Chave**: `pessoa.id` interno. CPF é um campo à parte. Os CNPJs de recebimento ficam em `pessoa_documento_fiscal` com vigência. *Mudou para* deixar explícito que as duas linhas da Premiação (CPF antigo e CNPJ atual) viram **uma** pessoa, porque a evidência acima mostra cerca de 100 casos.
2. **Carga em três passos, com o Dados**:
   1. Automático: CNPJ ou CPF exato, e `bizneo_id`.
   2. Sugestão para Operações confirmar: o mesmo nome com CPF e CNPJ (101 casos) e os prescritores (41 de 48 por nome).
   3. O restante vai para a fila "Pessoa não reconhecida".
   Nunca juntar por nome sem confirmação.
3. **Origem dos dados**: a Bizneo é dona do vínculo (regime, admissão, saída, status). O nome, o cargo e a unidade vêm hoje dos lançamentos da Premiação. *Mudou porque* o espelho não tem esses campos. É uma visão de leitura, e a diferença entre as fontes vira relatório.
4. **Lotação com vigência**: mantida, e é o que falta nas outras propostas. Transferência e empréstimo fecham uma linha e abrem outra. A permissão do sócio sobre a ficha segue os períodos.
5. **RT/prescritor**: adoto os nomes do Arquiteto (`profissional`, `unidade_rt`) para não haver dois modelos. O conselho fica ligado à pessoa, nunca ao CNPJ.
6. **PIX**: nasce vazio e é preenchido pela pessoa, com confirmação. Na pessoa PJ, o favorecido é um dos seus documentos fiscais vigentes.
7. **Login do colaborador**: sai do primeiro lote. A ordem é Operações, sócios e gestores, depois os RTs (cerca de 48) e só então os colaboradores. Para os colaboradores há duas saídas: código enviado a e-mail ou telefone confirmado pela Bizneo/DP, ou entrega presencial pela gestora com registro. *Mudou porque* não existe e-mail de colaborador em nenhuma base.
8. **Acesso por empresa**: a contabilidade passa a ter escopo por CNPJ, e o gestor não vê prêmio individual sem autorização de Operações.
9. **Mantido**: a Premiação fica intocada, só lida, e entra por último, entre competências.
