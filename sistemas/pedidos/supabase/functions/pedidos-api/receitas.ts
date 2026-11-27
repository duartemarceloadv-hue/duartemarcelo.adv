// =====================================================================
// Laboratórios › Receitas do mês e Termos.
// Regra do dia 01 migrada como está (pedidos_novo.gerar_receitas_mes); aqui só por BOTÃO, sem rotina agendada.
// Fluxo: rascunho → gerada → enviada ao RT (só marca; nada é enviado por e-mail).
// Prescritor = RT do termo da unidade com o laboratório (decisão de 26/11/2026).
// O financeiro não vê receitas (documento-mestre §7).
// =====================================================================
import type { Ctx, Dep } from "./index.ts";

export function acoesReceitas(D: Dep) {
  const { sql, Erro, uuid, txt, numero, escopo, hojeBanco, comAuditoria, plural, dt } = D;
  const arr = (l: string[]) => "{" + l.join(",") + "}";
  const ve = (c: Ctx) => { if (!c.receitas) throw new Erro(403, "Seu acesso não inclui receitas.", "sem_acesso"); };
  const grava = (c: Ctx) => { ve(c); if (!c.receitasGravar) throw new Erro(403, "Seu acesso às receitas é só de consulta.", "so_leitura"); };
  const filtro = (c: Ctx, col: string) => {
    const e = escopo(c);
    return e === null ? sql`true` : sql`${sql.unsafe(col)} = any(${arr(e)}::uuid[])`;
  };
  const mesOk = (v: unknown) => {
    const s = String(v || "");
    if (!/^\d{4}-\d{2}$/.test(s)) throw new Erro(400, "Mês inválido.");
    return s + "-01";
  };
  const STATUS: Record<string, string> = { rascunho: "Rascunho", gerada: "Gerada", enviada_rt: "Enviada ao RT", cancelada: "Cancelada" };
  // RT do termo vigente da unidade com o laboratório, na data
  const rtTermo = (tx: any, unidade: string, lab: string, data: string) =>
    tx`select t.rt_id, p.nome, t.de::text de from pedidos_novo.termo t join nucleo.pessoa p on p.id = t.rt_id
       where t.unidade_id = ${unidade} and t.laboratorio_id = ${lab} and t.de <= ${data}::date and (t.ate is null or t.ate >= ${data}::date)
       order by t.de desc limit 1`;

  async function recLista(c: Ctx, b: any) {
    ve(c);
    const HOJE = await hojeBanco();
    const mes = b.mes ? mesOk(b.mes) : HOJE.slice(0, 7) + "-01";
    const un = b.unidade_id ? uuid(b.unidade_id, "unidade") : null;
    const l = await sql`
      select r.id, r.unidade_id, u.nome unidade, to_char(r.mes, 'YYYY-MM') mes, r.status, r.emitida_em::text emitida_em, r.legado_ref is not null legado,
        p.nome prescritor, (r.legado->'assinante'->>'nome') assinante_antigo,
        (select pt.nome from pedidos_novo.termo t join nucleo.pessoa pt on pt.id = t.rt_id where t.unidade_id = r.unidade_id and t.laboratorio_id = r.laboratorio_id and t.ate is null order by t.de desc limit 1) rt_termo,
        (select count(*) from pedidos_novo.receita_item i where i.receita_id = r.id and i.qtd > 0)::int itens,
        (select coalesce(sum(i.qtd), 0)::float8 from pedidos_novo.receita_item i where i.receita_id = r.id) total,
        (select count(*) from pedidos_novo.receita_item i where i.receita_id = r.id and i.ajustado)::int ajustados,
        coalesce((r.calculo->>'semPedidos')::boolean, false) sem_pedidos
      from pedidos_novo.receita r join nucleo.unidade u on u.id = r.unidade_id left join nucleo.pessoa p on p.id = r.prescritor_id
      where r.tipo = 'mensal' and r.mes = ${mes}::date and ${filtro(c, "r.unidade_id")} and ${un ? sql`r.unidade_id = ${un}` : sql`true`}
      order by u.nome`;
    const meses = await sql`select distinct to_char(mes, 'YYYY-MM') m from pedidos_novo.receita where tipo = 'mensal' and ${filtro(c, "unidade_id")} order by 1 desc`;
    const cont: Record<string, number> = {};
    l.forEach((x) => (cont[x.status] = (cont[x.status] || 0) + 1));
    return { hoje: HOJE, mes: mes.slice(0, 7), meses: meses.map((x) => x.m), receitas: l, contagem: cont, pode_gravar: c.receitasGravar };
  }
  async function recReceita(c: Ctx, b: any) {
    ve(c);
    const id = uuid(b.receita_id, "receita");
    const [r] = await sql`select r.id, r.unidade_id, u.nome unidade, r.laboratorio_id lab, l.nome lab_nome, to_char(r.mes, 'YYYY-MM') mes, r.status, r.status_em,
        r.emitida_em::text emitida_em, r.prescritor_id, p.nome prescritor, r.calculo, r.legado, r.legado_ref, r.criado_em::text criado_em,
        (select protocolo from pedidos_novo.unidade_protocolo x where x.unidade_id = r.unidade_id) protocolo
      from pedidos_novo.receita r join nucleo.unidade u on u.id = r.unidade_id join pedidos_novo.laboratorio l on l.id = r.laboratorio_id
      left join nucleo.pessoa p on p.id = r.prescritor_id where r.id = ${id} and r.tipo = 'mensal' and ${filtro(c, "r.unidade_id")}`;
    if (!r) throw new Erro(404, "Receita não encontrada (ou fora das suas unidades).", "nao_encontrado");
    const itens = await sql`select i.produto_id, pr.codigo, pr.descricao, i.qtd::float8 qtd, i.qtd_calculada::float8 calc, i.media::float8 media, i.total_periodo::float8 total,
        i.ajustado, i.ajuste_justificativa, i.ajustado_por, i.ajustado_em::text ajustado_em
      from pedidos_novo.receita_item i join pedidos_novo.produto pr on pr.id = i.produto_id where i.receita_id = ${id}
      order by i.qtd = 0, pr.descricao`;
    const produtos = await sql`select id, codigo, descricao from pedidos_novo.produto where laboratorio_id = ${r.lab} and ativo order by descricao`;
    const HOJE = await hojeBanco();
    const [rt] = await rtTermo(sql, r.unidade_id, r.lab, HOJE);
    const ev = await sql`select tabela, acao, antes, depois, por, em::text em from pedidos_novo.evento
      where (tabela = 'receita' and registro_id = ${id}) or (tabela = 'receita_item' and coalesce(depois, antes)->>'receita_id' = ${id})
      order by em desc, id desc limit 200`;
    const nomeProd: Record<string, string> = {}; produtos.forEach((p) => (nomeProd[p.id] = p.descricao));
    const hist = ev.filter((e) => e.por !== "importacao-sistema-antigo").map((e) => {
      const a = e.antes || {}, d = e.depois || {};
      let t = "";
      if (e.tabela === "receita") {
        if (e.acao === "insert") t = "Receita criada em rascunho";
        else if (a.status !== d.status) t = "Situação: " + (STATUS[a.status] || a.status) + " → " + (STATUS[d.status] || d.status);
        else if (a.prescritor_id !== d.prescritor_id) t = "Prescritor definido";
        else if (JSON.stringify(a.calculo) !== JSON.stringify(d.calculo)) t = "Cálculo refeito (Gerar receitas do mês)";
      } else {
        const nm = nomeProd[d.produto_id || a.produto_id] || "produto";
        if (e.acao === "insert") t = `Item incluído: ${nm} — ${Number(d.qtd)}`;
        else if (e.acao === "delete") t = `Item removido: ${nm}`;
        else if (Number(a.qtd) !== Number(d.qtd)) t = `${nm}: ${Number(a.qtd)} → ${Number(d.qtd)}` + (d.ajuste_justificativa && d.ajustado ? ` (${d.ajuste_justificativa})` : "");
        else if (Number(a.qtd_calculada) !== Number(d.qtd_calculada)) t = `${nm}: calculado ${a.qtd_calculada ?? "—"} → ${d.qtd_calculada ?? "—"}`;
      }
      return t ? { em: e.em, por: e.por, texto: t } : null;
    }).filter(Boolean);
    return { hoje: HOJE, receita: r, itens, produtos, rt_termo: rt || null, historico: hist, pode_gravar: c.receitasGravar };
  }
  async function recGerar(c: Ctx, b: any) {
    grava(c);
    if (!c.todas) throw new Erro(403, "Gerar as receitas do mês é feito pela central (todas as unidades).");
    const mes = mesOk(b.mes);
    const simular = b.simular !== false;
    // Individual (uma unidade) ou em lote (várias); sem lista = todas as unidades ativas.
    const lista = Array.isArray(b.unidades) ? b.unidades : (b.unidade_id ? [b.unidade_id] : []);
    if (lista.length > 200) throw new Erro(400, "Unidades demais.");
    const uns: string[] | null = lista.length ? lista.map((x: any) => uuid(x, "unidade")) : null;
    if (simular) {
      const [x] = await sql`select pedidos_novo.gerar_receitas_mes(${mes}::date, true, ${uns}::uuid[]) r`;
      return x.r;
    }
    return await comAuditoria(c, async (tx) => {
      const [x] = await tx`select pedidos_novo.gerar_receitas_mes(${mes}::date, false, ${uns}::uuid[]) r`;
      const r = x.r;
      return { ...r, ok: true, mensagem: `Receitas de ${mes.slice(5, 7)}/${mes.slice(0, 4)}: ${plural(r.criadas, "criada", "criadas")} em rascunho, ${plural(r.atualizadas, "rascunho recalculado", "rascunhos recalculados")}, ${plural(r.ignoradas, "já gerada ou enviada (não mexida)", "já geradas ou enviadas (não mexidas)")}.` };
    });
  }
  async function recAjustar(c: Ctx, b: any) {
    grava(c);
    const id = uuid(b.receita_id, "receita");
    const j = txt(b.justificativa, 500);
    if (!j || j.length < 5) throw new Erro(400, "Escreva a justificativa do ajuste (pelo menos 5 letras).");
    const lista = Array.isArray(b.itens) ? b.itens : [];
    if (!lista.length || lista.length > 50) throw new Erro(400, "Informe as quantidades.");
    const itens = lista.map((x: any, i: number) => {
      const q = numero(x.qtd);
      if (!isFinite(q) || q < 0 || q > 1e6) throw new Erro(400, `Linha ${i + 1}: quantidade inválida.`);
      return { produto_id: uuid(x.produto_id, "produto"), qtd: q };
    });
    return await comAuditoria(c, async (tx) => {
      const [r] = await tx`select id, status, laboratorio_id from pedidos_novo.receita where id = ${id} and tipo = 'mensal' and ${filtro(c, "unidade_id")} for update`;
      if (!r) throw new Erro(404, "Receita não encontrada.");
      if (!["rascunho", "gerada"].includes(r.status)) throw new Erro(409, "Receita já enviada ao RT (ou cancelada): não pode ser ajustada.");
      const ok = await tx`select id from pedidos_novo.produto where id = any(${arr(itens.map((x: any) => x.produto_id))}::uuid[]) and laboratorio_id = ${r.laboratorio_id}`;
      if (ok.length !== new Set(itens.map((x: any) => x.produto_id)).size) throw new Erro(400, "Algum produto não é deste laboratório.");
      let n = 0;
      for (const x of itens) {
        const [a] = await tx`select qtd::float8 qtd from pedidos_novo.receita_item where receita_id = ${id} and produto_id = ${x.produto_id}`;
        if (a && a.qtd === x.qtd) continue;
        if (!a && x.qtd === 0) continue;
        await tx`insert into pedidos_novo.receita_item (receita_id, produto_id, qtd, ajustado, ajuste_justificativa, ajustado_por, ajustado_em)
          values (${id}, ${x.produto_id}, ${x.qtd}, true, ${j}, ${c.email}, now())
          on conflict (receita_id, produto_id) do update set qtd = excluded.qtd, ajustado = true, ajuste_justificativa = excluded.ajuste_justificativa,
            ajustado_por = excluded.ajustado_por, ajustado_em = excluded.ajustado_em`;
        n++;
      }
      if (!n) return { ok: true, mensagem: "Nada foi alterado." };
      return { ok: true, mensagem: `Quantidades ajustadas (${plural(n, "produto", "produtos")}).` };
    });
  }
  async function recStatus(c: Ctx, b: any) {
    grava(c);
    const id = uuid(b.receita_id, "receita");
    const para = String(b.para || "");
    if (!["gerada", "enviada_rt"].includes(para)) throw new Erro(400, "Situação inválida.");
    const HOJE = await hojeBanco();
    return await comAuditoria(c, async (tx) => {
      const [r] = await tx`select id, status, status_em, unidade_id, laboratorio_id, prescritor_id from pedidos_novo.receita
        where id = ${id} and tipo = 'mensal' and ${filtro(c, "unidade_id")} for update`;
      if (!r) throw new Erro(404, "Receita não encontrada.");
      if (para === "gerada") {
        if (r.status !== "rascunho") throw new Erro(409, "Só uma receita em rascunho pode ser marcada como gerada.");
        const [n] = await tx`select count(*)::int n from pedidos_novo.receita_item where receita_id = ${id} and qtd > 0`;
        if (!n.n) throw new Erro(409, "A receita não tem nenhum produto com quantidade.");
        let presc = r.prescritor_id;
        if (!presc) {
          const [rt] = await rtTermo(tx, r.unidade_id, r.laboratorio_id, HOJE);
          if (!rt) throw new Erro(409, "A unidade não tem termo vigente com o laboratório: não há RT para assinar. Cadastre o termo antes.", "sem_termo");
          presc = rt.rt_id;
        }
        await tx`update pedidos_novo.receita set status = 'gerada', prescritor_id = ${presc}, emitida_em = coalesce(emitida_em, ${HOJE}::date),
          status_em = status_em || jsonb_build_object('gerada', ${HOJE}::text) where id = ${id}`;
        return { ok: true, mensagem: "Receita marcada como gerada." };
      }
      if (r.status !== "gerada") throw new Erro(409, "Só uma receita gerada pode ser marcada como enviada ao RT.");
      await tx`update pedidos_novo.receita set status = 'enviada_rt', status_em = status_em || jsonb_build_object('enviada_rt', ${HOJE}::text) where id = ${id}`;
      return { ok: true, mensagem: `Marcada como enviada ao RT em ${dt(HOJE)}. Nenhum e-mail foi enviado pelo sistema.` };
    });
  }
  async function labTermos(c: Ctx, b: any) {
    ve(c);
    const l = await sql`select t.id, t.unidade_id, u.nome unidade, t.laboratorio_id lab, l.nome lab_nome, p.nome rt, t.rt_id,
        (select x.conselho || ' ' || x.registro from nucleo.profissional x where x.pessoa_id = p.id and x.registro is not null limit 1) registro,
        t.de::text de, t.ate::text ate, t.arquivo_nome, t.arquivo_local, t.obs
      from pedidos_novo.termo t join nucleo.unidade u on u.id = t.unidade_id join pedidos_novo.laboratorio l on l.id = t.laboratorio_id join nucleo.pessoa p on p.id = t.rt_id
      where ${filtro(c, "t.unidade_id")} order by u.nome, t.de desc`;
    const sem = await sql`select u.id, u.nome from nucleo.unidade u where u.ativo and ${filtro(c, "u.id")}
      and not exists (select 1 from pedidos_novo.termo t where t.unidade_id = u.id and t.ate is null) order by u.nome`;
    return { termos: l, sem_termo: sem };
  }
  return { receitas: recLista, receita: recReceita, gerar_receitas: recGerar, ajustar_receita: recAjustar, receita_status: recStatus, termos: labTermos } as
    Record<string, (c: Ctx, b: any) => Promise<unknown>>;
}
