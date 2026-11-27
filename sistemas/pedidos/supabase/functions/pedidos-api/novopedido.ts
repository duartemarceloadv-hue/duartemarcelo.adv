// =====================================================================
// Laboratórios › Pedidos › Novo pedido (e "Criar pedido" a partir da receita do mês).
// Pedido nasce em RASCUNHO; "Confirmar envio" grava a data de envio (hoje), numera (gatilho do banco) e registra.
// Regras do sistema antigo (pedidos origem=receita/interno de 25–26/11/2026): unidade, laboratório e itens;
// prescritor = quem assinou a receita (RT do termo, decisão de 26/11/2026); sem forma de pagamento nem parcelas
// na criação (o antigo também não pedia: vêm depois do laboratório/Omie); previsão só a que o laboratório informar.
// Centro Paulista exige receita do mês ligada e já gerada (assinada pelo RT). A receita limita pelo saldo: só avisa.
// Ambiente de teste (parametro criar_pedido_teste): pedido marcado teste = true, numeração TST-AAAA-NNNN.
// =====================================================================
import type { Ctx, Dep } from "./index.ts";

export function acoesNovoPedido(D: Dep) {
  const { sql, Erro, uuid, txt, numero, escopo, hojeBanco, comAuditoria, plural, dt, R, r2 } = D;
  const arr = (l: string[]) => "{" + l.join(",") + "}";
  const filtro = (c: Ctx, col: string) => {
    const e = escopo(c);
    return e === null ? sql`true` : sql`${sql.unsafe(col)} = any(${arr(e)}::uuid[])`;
  };
  // no início quem pede é a central (decisão de 26/11/2026); a unidade passa a pedir na fase 2
  const PEDE = ["operacoes", "admin", "central"];
  const podeCriar = (c: Ctx) => c.gravar && c.papeis.some((p) => PEDE.includes(p));
  const exigeCriar = (c: Ctx) => {
    if (!c.gravar) throw new Erro(403, "Seu acesso é só de consulta; não é possível gravar.", "so_leitura");
    if (!podeCriar(c)) throw new Erro(403, "Nesta fase, quem cria pedido é a central (Operações).", "sem_acesso");
  };
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const nomeMes = (m: string) => MESES[+m.slice(5, 7) - 1] + "/" + m.slice(0, 4);
  const qtdTxt = (v: number) => Number(v).toLocaleString("pt-BR");

  async function modoTeste(): Promise<boolean> {
    const [p] = await sql`select valor from pedidos_novo.parametro where chave = 'criar_pedido_teste'`;
    return p ? p.valor !== false : true;
  }
  async function labsAtivos() {
    const l = await sql`select id, nome, ficha->>'modelo_receita' modelo, ficha->>'num_lab_nome' num_nome from pedidos_novo.laboratorio where ativo order by id = 'CP' desc, nome`;
    return l.map((x) => ({ id: x.id, nome: x.id === "CP" ? "Centro Paulista" : x.nome, exige_receita: x.modelo === "centro_paulista_media_mensal" }));
  }
  async function unidadeOk(c: Ctx, id: string) {
    const e = escopo(c);
    if (e !== null && !e.includes(id)) throw new Erro(403, "Você não tem acesso a essa unidade.");
    const [u] = await sql`select id, nome from nucleo.unidade where id = ${id} and ativo`;
    if (!u) throw new Erro(400, "Unidade não encontrada (ou inativa).");
    return u;
  }
  // receita do mês ligável: mesma unidade e laboratório, já gerada (assinada pelo RT) ou enviada ao RT
  async function receitaOk(tx: any, c: Ctx, id: string, unidade: string, lab: string) {
    if (!c.receitas) throw new Erro(403, "Seu acesso não inclui receitas.", "sem_acesso");
    const [r] = await tx`select r.id, r.unidade_id, r.laboratorio_id, r.status, to_char(r.mes, 'YYYY-MM') mes, p.nome prescritor
      from pedidos_novo.receita r left join nucleo.pessoa p on p.id = r.prescritor_id
      where r.id = ${id} and r.tipo = 'mensal' and ${filtro(c, "r.unidade_id")}`;
    if (!r) throw new Erro(404, "Receita não encontrada (ou fora das suas unidades).", "nao_encontrado");
    if (r.unidade_id !== unidade) throw new Erro(400, "A receita escolhida é de outra unidade.");
    if (r.laboratorio_id !== lab) throw new Erro(400, "A receita escolhida é de outro laboratório.");
    if (r.status === "cancelada") throw new Erro(409, "Esta receita está cancelada.");
    if (r.status === "rascunho") throw new Erro(409, "A receita ainda está em rascunho. Marque como gerada (assinada pelo RT do termo) antes de pedir.");
    return r;
  }
  // saldo da receita por produto (receita − o que outros pedidos não cancelados ligados a ela já pediram)
  async function saldo(tx: any, receita: string, excluir: string | null) {
    return await tx`select i.produto_id, pr.descricao, i.qtd::float8 receita,
        coalesce((select sum(pi.qtd) from pedidos_novo.pedido_receita x join pedidos_novo.pedido pe on pe.id = x.pedido_id
                   join pedidos_novo.pedido_item pi on pi.pedido_id = pe.id and pi.produto_id = i.produto_id
                  where x.receita_id = ${receita} and pe.cancelado_em is null and pe.id is distinct from ${excluir}::uuid), 0)::float8 usado
      from pedidos_novo.receita_item i join pedidos_novo.produto pr on pr.id = i.produto_id
      where i.receita_id = ${receita} and i.qtd > 0 order by pr.descricao`;
  }
  async function precos(tx: any, lab: string, data: string) {
    return await tx`select pr.id, pr.codigo, pr.descricao,
        (select pc.valor::float8 from pedidos_novo.preco pc where pc.produto_id = pr.id and pc.de <= ${data}::date order by pc.de desc limit 1) preco
      from pedidos_novo.produto pr where pr.laboratorio_id = ${lab} and pr.ativo order by pr.descricao`;
  }

  async function npOpcoes(c: Ctx) {
    const e = escopo(c);
    const unidades = await sql`select id, nome from nucleo.unidade where ativo and ${e === null ? sql`true` : sql`id = any(${arr(e)}::uuid[])`} order by nome`;
    return { hoje: await hojeBanco(), teste: await modoTeste(), unidades, laboratorios: await labsAtivos(), pode_criar: podeCriar(c), receitas: c.receitas };
  }
  async function npReceitas(c: Ctx, b: any) {
    if (!c.receitas) return { receitas: [] };
    const un = uuid(b.unidade_id, "unidade"), lab = String(b.laboratorio_id || "");
    const l = await sql`select r.id, to_char(r.mes, 'YYYY-MM') mes, r.status, p.nome prescritor,
        (select count(*) from pedidos_novo.receita_item i where i.receita_id = r.id and i.qtd > 0)::int produtos,
        (select count(*) from pedidos_novo.pedido_receita x join pedidos_novo.pedido pe on pe.id = x.pedido_id where x.receita_id = r.id and pe.cancelado_em is null)::int pedidos
      from pedidos_novo.receita r left join nucleo.pessoa p on p.id = r.prescritor_id
      where r.tipo = 'mensal' and r.unidade_id = ${un} and r.laboratorio_id = ${lab} and r.status <> 'cancelada' and ${filtro(c, "r.unidade_id")}
      order by r.mes desc limit 6`;
    return { receitas: l.map((r) => ({ ...r, nome: "Receita de " + nomeMes(r.mes) })) };
  }

  async function npCriar(c: Ctx, b: any) {
    exigeCriar(c);
    const un = uuid(b.unidade_id, "unidade");
    const lab = String(b.laboratorio_id || "");
    const labs = await labsAtivos();
    const L = labs.find((x) => x.id === lab);
    if (!L) throw new Erro(400, "Escolha o laboratório.");
    await unidadeOk(c, un);
    const rec = b.receita_id ? uuid(b.receita_id, "receita") : null;
    const teste = await modoTeste();
    const HOJE = await hojeBanco();
    return await comAuditoria(c, async (tx) => {
      let r: any = null;
      if (rec) r = await receitaOk(tx, c, rec, un, lab);
      const [p] = await tx`insert into pedidos_novo.pedido (laboratorio_id, unidade_id, rascunho, teste, origem, criado_por, frete)
        values (${lab}, ${un}, true, ${teste}, ${r ? "receita" : "digitado"}, ${c.email}, 0) returning id`;
      let n = 0;
      if (r) {
        await tx`insert into pedidos_novo.pedido_receita (pedido_id, receita_id) values (${p.id}, ${r.id})`;
        const pr = await precos(tx, lab, HOJE);
        for (const s of await saldo(tx, r.id, p.id)) {
          const q = r2(s.receita - s.usado);
          if (q <= 0) continue;
          const preco = pr.find((x: any) => x.id === s.produto_id)?.preco ?? 0;
          await tx`insert into pedidos_novo.pedido_item (pedido_id, produto_id, qtd, preco_unit) values (${p.id}, ${s.produto_id}, ${q}, ${preco})`;
          n++;
        }
      }
      return {
        ok: true, pedido_id: p.id,
        mensagem: r ? `Rascunho criado a partir da receita de ${nomeMes(r.mes)}: ${plural(n, "produto", "produtos")} pelo saldo da receita.` : "Rascunho criado. Inclua os produtos e confirme o envio.",
      };
    });
  }

  async function dadosRascunho(c: Ctx, id: string) {
    const [p] = await sql`select p.id, p.num_interno num, p.unidade_id, u.nome un, p.laboratorio_id lab, p.rascunho, p.teste, p.origem,
        p.frete::float8 frete, p.obs, p.cancelado_em, p.cancelado_motivo canc_mot, p.criado_por, p.criado_em::text criado_em
      from pedidos_novo.pedido p join nucleo.unidade u on u.id = p.unidade_id where p.id = ${id} and ${filtro(c, "p.unidade_id")}`;
    if (!p) throw new Erro(404, "Pedido não encontrado (ou fora das suas unidades).", "nao_encontrado");
    return p;
  }
  async function npRascunho(c: Ctx, b: any) {
    const id = uuid(b.pedido_id);
    const p = await dadosRascunho(c, id);
    if (!p.rascunho) return { enviado: true, pedido_id: id };
    const HOJE = await hojeBanco();
    const labs = await labsAtivos();
    const L = labs.find((x) => x.id === p.lab) || { id: p.lab, nome: p.lab, exige_receita: false };
    const itens = await sql`select i.produto_id, pr.descricao, i.qtd::float8 qtd, i.preco_unit::float8 preco, i.total::float8 total
      from pedidos_novo.pedido_item i join pedidos_novo.produto pr on pr.id = i.produto_id where i.pedido_id = ${id} order by pr.descricao`;
    const [rl] = await sql`select r.id, to_char(r.mes, 'YYYY-MM') mes, r.status, pe.nome prescritor
      from pedidos_novo.pedido_receita x join pedidos_novo.receita r on r.id = x.receita_id left join nucleo.pessoa pe on pe.id = r.prescritor_id
      where x.pedido_id = ${id} limit 1`;
    let rec: any = null;
    if (rl && c.receitas) {
      const s = await saldo(sql, rl.id, id);
      rec = { ...rl, nome: "Receita de " + nomeMes(rl.mes), saldo: s.map((x: any) => ({ produto_id: x.produto_id, descricao: x.descricao, receita: x.receita, usado: x.usado, saldo: r2(x.receita - x.usado) })) };
    }
    const produtos = await precos(sql, p.lab, HOJE);
    const falta: string[] = [];
    if (p.cancelado_em) falta.push("Rascunho cancelado: " + (p.canc_mot || ""));
    if (!itens.length) falta.push("Inclua ao menos um produto.");
    if (L.exige_receita && !rl) falta.push("O Centro Paulista exige a receita do mês: ligue a receita da unidade (já gerada, assinada pelo RT do termo).");
    if (rl && rl.status === "rascunho") falta.push("A receita ligada ainda está em rascunho: marque como gerada antes de enviar.");
    const semPreco = itens.filter((x) => !x.preco).map((x) => x.descricao);
    if (semPreco.length) falta.push("Sem preço na tabela vigente: " + semPreco.join(", ") + ". O total fica menor até o laboratório informar.");
    const exced = rec ? itens.map((i) => { const s = rec.saldo.find((x: any) => x.produto_id === i.produto_id); return { descricao: i.descricao, pedido: i.qtd, saldo: s ? s.saldo : 0 }; }).filter((x) => x.pedido > x.saldo + 0.001) : [];
    return {
      hoje: HOJE, teste: !!p.teste, pedido: { id, num: p.num, unidade_id: p.unidade_id, un: p.un, lab: p.lab, labNome: L.nome, exige_receita: L.exige_receita,
        frete: p.frete, obs: p.obs, cancelado: !!p.cancelado_em, cancMot: p.canc_mot, origem: p.origem, criado_por: p.criado_por, criado_em: p.criado_em },
      itens, receita: rec, produtos, falta, excedidos: exced, pode_gravar: podeCriar(c), ver_receitas: c.receitas,
      subtotal: r2(itens.reduce((t, x) => t + x.total, 0)),
    };
  }

  async function npSalvar(c: Ctx, b: any) {
    exigeCriar(c);
    const id = uuid(b.pedido_id);
    const lista = Array.isArray(b.itens) ? b.itens : [];
    if (lista.length > 50) throw new Erro(400, "No máximo 50 produtos por pedido.");
    const itens = lista.map((x: any, i: number) => {
      const pid = uuid(x.produto_id, "produto");
      const q = r2(numero(x.qtd));
      if (!isFinite(q) || q <= 0) throw new Erro(400, `Linha ${i + 1}: quantidade inválida.`);
      return { produto_id: pid, qtd: q };
    });
    if (new Set(itens.map((x: any) => x.produto_id)).size !== itens.length) throw new Erro(400, "O mesmo produto aparece duas vezes. Junte as quantidades numa linha só.");
    const frete = r2(numero(b.frete ?? 0));
    if (!isFinite(frete) || frete < 0) throw new Erro(400, "Frete inválido.");
    const obs = txt(b.obs, 1000);
    const just = txt(b.justificativa, 500);
    const HOJE = await hojeBanco();
    const novaUn = b.unidade_id ? uuid(b.unidade_id, "unidade") : null;
    if (novaUn) await unidadeOk(c, novaUn);
    const rec = b.receita_id ? uuid(b.receita_id, "receita") : null;
    return await comAuditoria(c, async (tx) => {
      const [p] = await tx`select id, laboratorio_id lab, unidade_id, rascunho, cancelado_em, frete::float8 frete, obs from pedidos_novo.pedido
        where id = ${id} and ${filtro(c, "unidade_id")} for update`;
      if (!p) throw new Erro(404, "Pedido não encontrado (ou fora das suas unidades).", "nao_encontrado");
      if (!p.rascunho) throw new Erro(409, "Este pedido já foi enviado; as correções são feitas na ficha do pedido, com justificativa.");
      if (p.cancelado_em) throw new Erro(409, "Este rascunho está cancelado.");
      const un = novaUn || p.unidade_id;
      let r: any = null;
      if (rec) r = await receitaOk(tx, c, rec, un, p.lab);
      if (itens.length) {
        const ok = await tx`select count(*)::int n from pedidos_novo.produto where id = any(${arr(itens.map((x: any) => x.produto_id))}::uuid[]) and laboratorio_id = ${p.lab} and ativo`;
        if (ok[0].n !== itens.length) throw new Erro(400, "Algum produto não é deste laboratório.");
      }
      const atuais = await tx`select produto_id, qtd::float8 qtd from pedidos_novo.pedido_item where pedido_id = ${id}`;
      const chave = (l: any[]) => l.map((x) => x.produto_id + ":" + r2(x.qtd)).sort().join("|");
      const mudouItens = chave(atuais) !== chave(itens);
      // correção manual do que veio da receita exige justificativa (como o ajuste da receita)
      if (r && mudouItens) {
        const s = await saldo(tx, r.id, id);
        const proposta = s.filter((x: any) => r2(x.receita - x.usado) > 0).map((x: any) => ({ produto_id: x.produto_id, qtd: r2(x.receita - x.usado) }));
        if (chave(proposta) !== chave(itens) && (!just || just.length < 5)) {
          throw new Erro(400, "Os itens ficaram diferentes do saldo da receita. Escreva a justificativa (pelo menos 5 letras).", "justificativa");
        }
      }
      const pr = await precos(tx, p.lab, HOJE);
      const upd: Record<string, unknown> = {};
      if (un !== p.unidade_id) upd.unidade_id = un;
      if (frete !== r2(p.frete)) upd.frete = frete;
      if ((obs || null) !== (p.obs || null)) upd.obs = obs;
      if (Object.keys(upd).length) await tx`update pedidos_novo.pedido set ${tx(upd)} where id = ${id}`;
      if (mudouItens) {
        await tx`delete from pedidos_novo.pedido_item where pedido_id = ${id}`;
        for (const x of itens) {
          const preco = pr.find((y: any) => y.id === x.produto_id)?.preco ?? 0;
          await tx`insert into pedidos_novo.pedido_item (pedido_id, produto_id, qtd, preco_unit) values (${id}, ${x.produto_id}, ${x.qtd}, ${preco})`;
        }
      }
      const [lig] = await tx`select receita_id from pedidos_novo.pedido_receita where pedido_id = ${id}`;
      if ((lig?.receita_id || null) !== (r?.id || null)) {
        await tx`delete from pedidos_novo.pedido_receita where pedido_id = ${id}`;
        if (r) await tx`insert into pedidos_novo.pedido_receita (pedido_id, receita_id) values (${id}, ${r.id})`;
        await tx`update pedidos_novo.pedido set origem = ${r ? "receita" : "digitado"} where id = ${id} and origem in ('receita', 'digitado')`;
      }
      const [t] = await tx`select coalesce(sum(total), 0)::float8 sub from pedidos_novo.pedido_item where pedido_id = ${id}`;
      return { ok: true, mensagem: `Rascunho salvo: ${plural(itens.length, "produto", "produtos")}, ${R(t.sub)}${frete ? " + frete " + R(frete) : ""}.` };
    }, just || undefined);
  }

  async function npEnviar(c: Ctx, b: any) {
    exigeCriar(c);
    const id = uuid(b.pedido_id);
    const HOJE = await hojeBanco();
    const labs = await labsAtivos();
    return await comAuditoria(c, async (tx) => {
      const [p] = await tx`select p.id, p.laboratorio_id lab, p.unidade_id, p.rascunho, p.cancelado_em, p.teste, u.ativo un_ativa
        from pedidos_novo.pedido p join nucleo.unidade u on u.id = p.unidade_id where p.id = ${id} and ${filtro(c, "p.unidade_id")} for update of p`;
      if (!p) throw new Erro(404, "Pedido não encontrado (ou fora das suas unidades).", "nao_encontrado");
      if (!p.rascunho) throw new Erro(409, "Este pedido já foi enviado.");
      if (p.cancelado_em) throw new Erro(409, "Este rascunho está cancelado.");
      if (!p.un_ativa) throw new Erro(409, "A unidade está inativa.");
      const L = labs.find((x) => x.id === p.lab);
      if (!L) throw new Erro(409, "O laboratório está inativo.");
      const itens = await tx`select i.produto_id, pr.descricao, i.qtd::float8 qtd from pedidos_novo.pedido_item i join pedidos_novo.produto pr on pr.id = i.produto_id where i.pedido_id = ${id}`;
      if (!itens.length) throw new Erro(409, "Inclua ao menos um produto antes de enviar.");
      const [lig] = await tx`select receita_id from pedidos_novo.pedido_receita where pedido_id = ${id}`;
      if (L.exige_receita && !lig) throw new Erro(409, "O Centro Paulista exige a receita do mês: ligue a receita da unidade antes de enviar.");
      if (lig) {
        const r = await receitaOk(tx, c, lig.receita_id, p.unidade_id, p.lab);
        const s = await saldo(tx, r.id, id);
        const exced = itens.map((i: any) => { const x = s.find((y: any) => y.produto_id === i.produto_id); return { descricao: i.descricao, pedido: i.qtd, saldo: x ? r2(x.receita - x.usado) : 0 }; })
          .filter((x: any) => x.pedido > x.saldo + 0.001);
        if (exced.length && b.ciente_saldo !== true) {
          throw new Erro(409, "Algum produto passa do saldo da receita. Por enquanto o sistema só avisa: confirme que está ciente para enviar.", "saldo", {
            excedidos: exced.map((x: any) => ({ ...x, texto: `${x.descricao}: pedido ${qtdTxt(x.pedido)}, saldo ${qtdTxt(x.saldo)}` })),
          });
        }
      }
      const [n] = await tx`update pedidos_novo.pedido set rascunho = false, enviado_em = ${HOJE} where id = ${id} returning num_interno`;
      return {
        ok: true, pedido_id: id, num: n.num_interno,
        mensagem: `Pedido ${n.num_interno} registrado como enviado em ${dt(HOJE)}.` + (p.teste ? " Ambiente de teste: nada foi enviado ao laboratório." : ""),
      };
    }, b.ciente_saldo === true ? "Enviado ciente de que passa do saldo da receita" : undefined);
  }

  return { np_opcoes: npOpcoes, np_receitas: npReceitas, np_criar: npCriar, np_rascunho: npRascunho, np_salvar: npSalvar, np_enviar: npEnviar };
}
