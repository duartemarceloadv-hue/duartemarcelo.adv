// =====================================================================
// Laboratórios › Notas e PV: fila das divergências pedido × nota fiscal (recalculadas pelo banco,
// pedidos_novo.recalcular_conferencia_nf) e das divergências com o pedido de venda do laboratório (PV,
// as 63 abertas no sistema antigo). Cada item tem dono e decisão: aceitar a diferença (com justificativa),
// marcar para cobrar o laboratório, ou corrigido (na NF o sistema recalcula e só aceita se a diferença sumiu).
// O financeiro não vê o PV (traz prescritor e CRBM; documento-mestre §7).
// =====================================================================
import type { Ctx, Dep } from "./index.ts";

export const NOTAS_DECIDE = ["operacoes", "admin", "central", "financeiro"];

// contadores do Início (só itens com dono: abertos e aguardando o laboratório)
export async function resumoNotas(sql: any, c: Ctx, escopoUn: string[] | null, un: string) {
  const arr = (l: string[]) => "{" + l.join(",") + "}";
  const l = await sql`select d.tipo, d.status, count(*)::int n,
      coalesce(sum(case when d.tipo = 'nf' then abs(coalesce((d.dados->>'totalNF')::numeric, 0) - coalesce((d.dados->'pedido'->>'total')::numeric, 0)) end), 0)::float8 v
    from pedidos_novo.divergencia d join pedidos_novo.pedido p on p.id = d.pedido_id
    where d.status in ('aberta', 'cobrar_lab')
      and ${escopoUn === null ? sql`true` : sql`p.unidade_id = any(${arr(escopoUn)}::uuid[])`}
      and ${un ? sql`p.unidade_id = ${un}` : sql`true`}
      and ${c.receitas ? sql`true` : sql`d.tipo = 'nf'`}
    group by 1, 2`;
  const g = (t: string, s: string) => l.find((x: any) => x.tipo === t && x.status === s) || { n: 0, v: 0 };
  const lab = l.filter((x: any) => x.status === "cobrar_lab");
  return {
    nfDiv: { n: g("nf", "aberta").n, v: Math.round(g("nf", "aberta").v * 100) / 100 },
    pvDiv: c.receitas ? { n: g("pv", "aberta").n, v: 0 } : null,
    labDiv: { n: lab.reduce((t: number, x: any) => t + x.n, 0), v: Math.round(lab.reduce((t: number, x: any) => t + x.v, 0) * 100) / 100 },
  };
}

export function acoesNotas(D: Dep) {
  const { sql, Erro, uuid, txt, escopo, hojeBanco, comAuditoria, plural, dt, R, r2 } = D;
  const arr = (l: string[]) => "{" + l.join(",") + "}";
  const filtro = (c: Ctx, col: string) => {
    const e = escopo(c);
    return e === null ? sql`true` : sql`${sql.unsafe(col)} = any(${arr(e)}::uuid[])`;
  };
  const podeDecidir = (c: Ctx) => c.gravar && c.papeis.some((p) => NOTAS_DECIDE.includes(p));
  const STATUS: Record<string, string> = {
    aberta: "Aberta", cobrar_lab: "Cobrar o laboratório", aceita: "Diferença aceita", corrigida: "Corrigida",
    resolvida: "Resolvida no recálculo", substituida: "Substituída por nova conferência",
  };
  const num = (s: string) => Number(String(s).replace(/[R$\s.]/g, "").replace(",", "."));
  // linha do PV no formato do antigo: "<campo>: sistema <a> · pedido de venda <b>"
  const RE_PV = /^(.+?): sistema (.*) · pedido de venda (.*)$/;
  function valorPv(itens: string[]): number | null {
    for (const t of itens) { const m = RE_PV.exec(t); if (m && m[1] === "Valor") { const a = num(m[2]), b = num(m[3]); if (isFinite(a) && isFinite(b)) return r2(Math.abs(b - a)); } }
    return null;
  }

  async function notasLista(c: Ctx, b: any) {
    const tipo = ["nf", "pv"].includes(b.tipo) ? b.tipo : "";
    if (tipo === "pv" && !c.receitas) throw new Erro(403, "Seu acesso não inclui o pedido de venda (tem dados de prescrição).", "sem_acesso");
    const st = String(b.status || "abertas");
    const fs: Record<string, string[]> = {
      abertas: ["aberta", "cobrar_lab"], aberta: ["aberta"], cobrar_lab: ["cobrar_lab"], fechadas: ["aceita", "corrigida", "resolvida", "substituida"],
      aceita: ["aceita"], corrigida: ["corrigida"], resolvida: ["resolvida", "substituida"], todas: Object.keys(STATUS),
    };
    const sts = fs[st] || fs.abertas;
    const un = b.unidade_id ? uuid(b.unidade_id, "unidade") : "";
    const lab = String(b.lab || "");
    const l = await sql`
      select d.id, d.tipo, d.status, d.dono, d.desde::text desde, d.origem, jsonb_array_length(d.itens)::int linhas, d.itens,
        d.dados->>'nfs' nfs, d.dados->>'arquivo' arquivo, (d.dados->>'totalNF')::float8 total_nf, (d.dados->'pedido'->>'total')::float8 total_ped,
        d.decidido_em::text decidido_em, p.id pedido_id, p.num_interno num, p.num_lab, p.laboratorio_id lab, u.nome un, p.unidade_id
      from pedidos_novo.divergencia d join pedidos_novo.pedido p on p.id = d.pedido_id join nucleo.unidade u on u.id = p.unidade_id
      where d.status = any(${arr(sts)}::text[]) and ${filtro(c, "p.unidade_id")}
        and ${un ? sql`p.unidade_id = ${un}` : sql`true`} and ${lab ? sql`p.laboratorio_id = ${lab}` : sql`true`}
        and ${tipo ? sql`d.tipo = ${tipo}` : (c.receitas ? sql`true` : sql`d.tipo = 'nf'`)}
      order by case d.status when 'aberta' then 0 when 'cobrar_lab' then 1 else 2 end, d.desde, p.num_interno, d.tipo`;
    const cont = await sql`select d.tipo, d.status, count(*)::int n from pedidos_novo.divergencia d join pedidos_novo.pedido p on p.id = d.pedido_id
      where ${filtro(c, "p.unidade_id")} and ${un ? sql`p.unidade_id = ${un}` : sql`true`} and ${c.receitas ? sql`true` : sql`d.tipo = 'nf'`} group by 1, 2`;
    const [ult] = await sql`select max(em)::text em from pedidos_novo.conferencia_nf`;
    const itens = l.map((x) => ({
      id: x.id, tipo: x.tipo, status: x.status, dono: x.dono, desde: x.desde, linhas: x.linhas, pedido_id: x.pedido_id, num: x.num,
      numLab: x.num_lab, lab: x.lab, un: x.un, unidade_id: x.unidade_id, nfs: x.tipo === "nf" ? x.nfs : null,
      dif: x.tipo === "nf" ? (x.total_nf != null && x.total_ped != null ? r2(Math.abs(x.total_nf - x.total_ped)) : null) : valorPv(x.itens || []),
      decidido_em: x.decidido_em,
    }));
    return { hoje: await hojeBanco(), itens, contagem: cont, recalculado_em: ult?.em || null, pode_decidir: podeDecidir(c), pode_recalcular: podeDecidir(c) && c.todas, ver_pv: c.receitas };
  }

  async function notasItem(c: Ctx, b: any) {
    const id = uuid(b.divergencia_id, "divergência");
    const [d] = await sql`select d.*, d.desde::text t_desde, d.decidido_em::text t_decidido_em, p.num_interno num, p.num_lab, p.laboratorio_id lab, p.unidade_id, u.nome un,
        p.enviado_em::text env, p.frete::float8 frete, vp.subtotal::float8 sub, vp.total::float8 total, vp.situacao, p.legado_ref, p.teste,
        (select l.nome from pedidos_novo.laboratorio l where l.id = p.laboratorio_id) lab_nome
      from pedidos_novo.divergencia d join pedidos_novo.pedido p on p.id = d.pedido_id join pedidos_novo.v_pedido vp on vp.id = p.id
      join nucleo.unidade u on u.id = p.unidade_id where d.id = ${id} and ${filtro(c, "p.unidade_id")}`;
    if (!d) throw new Erro(404, "Item não encontrado (ou fora das suas unidades).", "nao_encontrado");
    if (d.tipo === "pv" && !c.receitas) throw new Erro(403, "Seu acesso não inclui o pedido de venda (tem dados de prescrição).", "sem_acesso");
    const pedido = { id: d.pedido_id, num: d.num, numLab: d.num_lab, lab: d.lab, labNome: d.lab === "CP" ? "Centro Paulista" : d.lab_nome, un: d.un, unidade_id: d.unidade_id,
      env: d.env, frete: d.frete, sub: d.sub, total: d.total, situacao: d.situacao, teste: d.teste };
    const base = { id: d.id, tipo: d.tipo, status: d.status, statusNome: STATUS[d.status], dono: d.dono, desde: d.t_desde, origem: d.origem, itens: d.itens,
      justificativa: d.justificativa, decidido_por: d.decidido_por, decidido_em: d.t_decidido_em };
    const ev = await sql`select acao, antes, depois, por, justificativa, em::text em from pedidos_novo.evento where tabela = 'divergencia' and registro_id = ${id} order by id desc limit 50`;
    const hist = ev.map((e) => {
      const a = e.antes || {}, n = e.depois || {};
      let t = "";
      if (e.acao === "insert") t = n.origem === "sistema_antigo" ? "Trazida do sistema antigo (aberta lá)" : "Aberta pelo recálculo da conferência";
      else if (a.status !== n.status) t = `Situação: ${STATUS[a.status] || a.status} → ${STATUS[n.status] || n.status}`;
      else return null;
      return { em: e.em, por: e.por, texto: t, justificativa: e.justificativa || (a.status !== n.status ? n.justificativa : null) };
    }).filter(Boolean);
    // documentos: NFs do grupo (DANFE/XML) e pedido de venda anexado ao pedido
    const grupo: string[] = d.tipo === "nf" && Array.isArray(d.dados?.grupo) ? d.dados.grupo : [d.pedido_id];
    const outros = grupo.length > 1 ? await sql`select id, num_interno num from pedidos_novo.pedido where id = any(${arr(grupo)}::uuid[]) and id <> ${d.pedido_id} order by num_interno` : [];
    const nfs = await sql`select distinct n.id, n.numero, n.emissao::text emissao, n.total::float8 total, n.frete::float8 frete, n.cancelada,
        n.danfe_id, (select a.bucket = 'pedidos-novo' from pedidos_novo.arquivo a where a.id = n.danfe_id) d_abre,
        n.xml_id, (select a.bucket = 'pedidos-novo' from pedidos_novo.arquivo a where a.id = n.xml_id) x_abre
      from pedidos_novo.nota_pedido np join pedidos_novo.nota_fiscal n on n.id = np.nota_id where np.pedido_id = any(${arr(grupo)}::uuid[]) order by 3, 2`;
    const pvs = await sql`select a.id, a.nome, a.bucket = 'pedidos-novo' abre from pedidos_novo.pedido_arquivo pa join pedidos_novo.arquivo a on a.id = pa.arquivo_id
      where pa.pedido_id = ${d.pedido_id} and a.categoria = 'pedido_venda' order by a.enviado_em`;
    let comparacao: any = null, outras: string[] = [], agora: any = null;
    if (d.tipo === "nf") {
      const r = d.dados || {};
      const nomes = await sql`select codigo, descricao from pedidos_novo.produto where laboratorio_id = ${d.lab}`;
      const nm: Record<string, string> = {}; nomes.forEach((x) => (nm[x.codigo] = x.descricao));
      const cods = [...new Set([...Object.keys(r.itensPedido || {}), ...Object.keys(r.itensNF || {})])].sort((x, y) => (nm[x] || x).localeCompare(nm[y] || y, "pt-BR"));
      const precoNF: Record<string, any> = {};
      (r.difPreco || []).forEach((p: any) => (precoNF[p.id] = p));
      comparacao = {
        itens: cods.map((k) => {
          const a = +(r.itensPedido?.[k] || 0), v = +(r.venda?.[k] || 0), bo = +(r.bonif?.[k] || 0);
          return { produto: nm[k] || k, pedido: a, vendido: v, bonificado: bo, confere: r.itensDoPedido ? (Math.abs(a - v - bo) < 0.001 || Math.abs(a - v) < 0.001) : null };
        }),
        valores: [
          { campo: "Frete", pedido: r.pedido?.frete ?? null, nf: r.freteNF ?? null },
          { campo: "Valor do pedido", pedido: r.pedido?.total ?? null, nf: r.totalNF ?? null },
          ...(r.pedido?.valorAntigo != null ? [{ campo: "Valor informado no sistema antigo", pedido: r.pedido.valorAntigo, nf: r.totalNF ?? null }] : []),
          ...(r.cobrado ? [{ campo: "Cobrado pelo laboratório (Omie)", pedido: r.cobrado, nf: r.totalNF ?? null }] : []),
        ],
        precos: (r.difPreco || []).map((p: any) => ({ produto: nm[p.id] || p.id, nf: p.nf, emissao: p.emissao, unit: p.unit, tabela: p.tabela, vigDe: p.vigDe, qtd: p.qtd, dif: p.dif })),
        itensDoPedido: !!r.itensDoPedido, avisos: r.avisos || [],
      };
      const [cf] = await sql`select ok, resultado->'diverg' diverg, pedidos_novo.assinatura_div(resultado->'diverg') ass, em::text em from pedidos_novo.conferencia_nf where pedido_id = ${d.pedido_id}`;
      agora = cf ? { ok: cf.ok, em: cf.em, mesma: !cf.ok && cf.ass === d.assinatura, diverg: cf.diverg } : null;
    } else {
      // pedido de venda: cada linha "campo: sistema A · pedido de venda B"; compara B com o que o sistema tem hoje
      const its = await sql`select pr.codigo, i.qtd::float8 qtd from pedidos_novo.pedido_item i join pedidos_novo.produto pr on pr.id = i.produto_id where i.pedido_id = ${d.pedido_id}`;
      const [nc] = await sql`select coalesce(jsonb_object_agg(pedidos_novo.nome_conf(codigo), codigo), '{}') m from pedidos_novo.produto where laboratorio_id = ${d.lab}`;
      const porNome: Record<string, string> = nc.m || {};
      const linhas: any[] = [];
      for (const t of (d.itens || []) as string[]) {
        const m = RE_PV.exec(t);
        if (!m) { outras.push(t); continue; }
        const campo = m[1], antes = m[2], pv = m[3];
        let hoje: string | null = null, igual: boolean | null = null;
        if (campo === "Data do pedido") { hoje = d.env ? dt(d.env) : null; igual = hoje ? hoje === pv : null; }
        else if (campo === "Valor") { hoje = R(d.total); igual = Math.abs(d.total - num(pv)) <= 0.5; }
        else if (campo === "Frete") { hoje = R(d.frete); igual = Math.abs(d.frete - num(pv)) <= 0.5; }
        else if (porNome[campo]) { const q = its.filter((x) => x.codigo === porNome[campo]).reduce((s, x) => s + x.qtd, 0); hoje = q.toLocaleString("pt-BR"); igual = q === num(pv); }
        linhas.push({ campo, antes, pv, hoje, igual });
      }
      comparacao = { linhas, arquivo: d.dados?.arquivo || null };
    }
    return {
      hoje: await hojeBanco(), item: base, pedido, comparacao, outras, agora,
      grupo: outros.map((x) => ({ id: x.id, num: x.num })),
      documentos: { nfs: nfs.map((n) => ({ id: n.id, num: n.numero, emissao: n.emissao, total: n.total, frete: n.frete, canc: n.cancelada, danfe: n.danfe_id ? { id: n.danfe_id, abre: !!n.d_abre } : null, xml: n.xml_id ? { id: n.xml_id, abre: !!n.x_abre } : null })),
        pv: pvs.map((a) => ({ id: a.id, nome: a.nome, abre: a.abre })) },
      historico: hist, pode_decidir: podeDecidir(c), pode_reabrir: c.admin,
    };
  }

  async function notasDecidir(c: Ctx, b: any) {
    if (!c.gravar) throw new Erro(403, "Seu acesso é só de consulta; não é possível gravar.", "so_leitura");
    if (!podeDecidir(c)) throw new Erro(403, "Decidir divergências é feito pela central ou pelo financeiro.", "sem_acesso");
    const id = uuid(b.divergencia_id, "divergência");
    const dec = String(b.decisao || "");
    if (!["aceitar", "cobrar", "corrigido", "reabrir"].includes(dec)) throw new Erro(400, "Escolha a decisão.");
    const j = txt(b.justificativa, 500);
    if (!j || j.length < 5) throw new Erro(400, "Escreva a justificativa (pelo menos 5 letras).");
    if (dec === "reabrir" && !c.admin) throw new Erro(403, "Só o administrador reabre um item já decidido.");
    return await comAuditoria(c, async (tx) => {
      const [d] = await tx`select d.id, d.tipo, d.status, d.pedido_id, p.num_interno num from pedidos_novo.divergencia d join pedidos_novo.pedido p on p.id = d.pedido_id
        where d.id = ${id} and ${filtro(c, "p.unidade_id")} for update of d`;
      if (!d) throw new Erro(404, "Item não encontrado (ou fora das suas unidades).", "nao_encontrado");
      if (d.tipo === "pv" && !c.receitas) throw new Erro(403, "Seu acesso não inclui o pedido de venda.", "sem_acesso");
      const aberto = d.status === "aberta" || d.status === "cobrar_lab";
      if (dec === "reabrir") {
        if (aberto) throw new Erro(409, "Este item já está aberto.");
        if (!["aceita", "corrigida"].includes(d.status)) throw new Erro(409, "Só dá para reabrir um item aceito ou corrigido.");
      } else if (!aberto) throw new Erro(409, `Este item já foi decidido (${STATUS[d.status]}).`);
      if (dec === "cobrar" && d.status === "cobrar_lab") throw new Erro(409, "Este item já está marcado para cobrar o laboratório.");
      let aviso = "";
      if (dec === "corrigido" && d.tipo === "nf") {
        // confere de novo agora: só fecha como corrigido se a mesma diferença sumiu
        await tx`select pedidos_novo.recalcular_conferencia_nf(${arr([d.pedido_id])}::uuid[])`;
        const [n] = await tx`select status from pedidos_novo.divergencia where id = ${id}`;
        if (n.status === "aberta" || n.status === "cobrar_lab") {
          throw new Erro(409, "A conferência de agora ainda encontra as mesmas diferenças. Corrija o pedido (itens, frete, parcelas) ou a nota antes, ou escolha “Aceitar a diferença”.", "ainda_diverge");
        }
        if (n.status === "substituida") aviso = " A conferência ainda encontrou outra diferença: ela entrou na fila como item novo.";
      }
      const para = dec === "aceitar" ? "aceita" : dec === "cobrar" ? "cobrar_lab" : dec === "corrigido" ? "corrigida" : "aberta";
      const dono = para === "cobrar_lab" ? "laboratorio" : para === "aberta" ? "operacoes" : null;
      await tx`update pedidos_novo.divergencia set status = ${para}, dono = ${dono}, justificativa = ${j}, decidido_por = ${c.email}, decidido_em = now() where id = ${id}`;
      const o = { aceita: "Diferença aceita", cobrar_lab: "Marcado para cobrar o laboratório", corrigida: "Marcado como corrigido", aberta: "Item reaberto" }[para];
      return { ok: true, status: para, mensagem: `${o} — pedido ${d.num || ""}.${aviso}` };
    }, j);
  }

  async function notasRecalcular(c: Ctx) {
    if (!podeDecidir(c) || !c.todas) throw new Erro(403, "Recalcular a conferência de todos os pedidos é feito pela central.", "sem_acesso");
    return await comAuditoria(c, async (tx) => {
      const [r] = await tx`select pedidos_novo.recalcular_conferencia_nf(null) r`;
      const x = r.r;
      return { ok: true, ...x, mensagem: `Conferência refeita: ${plural(x.conferidos, "pedido com nota", "pedidos com nota")}, ${plural(x.divergentes, "com diferença", "com diferença")}; ${plural(x.novas, "item novo", "itens novos")} na fila, ${plural(x.fechadas, "fechado", "fechados")} porque passaram a bater.` };
    }, "Recálculo da conferência pedido × NF");
  }

  return { notas_lista: notasLista, notas_item: notasItem, notas_decidir: notasDecidir, notas_recalcular: notasRecalcular };
}
