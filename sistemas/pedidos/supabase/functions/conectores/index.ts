// =====================================================================
// conectores — robôs do Sistema de Pedidos Dr. Hair (novo)
// Chamado 1x/dia pelo pg_cron (pedidos_novo.chamar_conector) com o cabeçalho x-cron.
// A chave fica no Vault; aqui só existe o SHA-256 dela.
// acao: "planilha" (planilha do Centro Paulista) | "rastreio" (Quality). simular: true = não grava.
// Regras iguais às do sistema atual (automacoes), com registro de execução e de alterações.
// =====================================================================
import postgres from "npm:postgres@3.4.4";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 3, idle_timeout: 20 });
const KEY_SHA = "b79b93b08c8e00aab9a63a64cbda336c1073a9021a20ef2c9cb59327ad132d71";
const PLANILHA_ID = "1W4mt2BAb2w4FEG2itmqasCys2azUwAiIozz9pu0klqU";

const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const addD = (s: string, n: number) => new Date(Date.parse(s + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const nrm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const limpa = (s: unknown) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return /^[-\s]*$/.test(t) ? "" : t; };
const pad = (n: number) => String(n).padStart(2, "0");

async function autorizado(req: Request) {
  const k = req.headers.get("x-cron") || "";
  const h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(k)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  return k.length > 0 && h === KEY_SHA;
}

// ---------- utilidades da planilha ----------
function csv(txt: string): string[][] {
  const out: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; continue; }
    if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && txt[i + 1] === "\n") i++; row.push(cur); out.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (cur.length || row.length) { row.push(cur); out.push(row); }
  return out;
}
function data(s: unknown): string | null {
  const t = String(s ?? "").trim();
  const m = t.match(/(\d{1,2})[\/.\-]+(\d{1,2})[\/.\-]+(\d{2,4})/);
  if (m) {
    let y = +m[3]; if (y < 100) y += 2000;
    const mo = +m[2], d = +m[1];
    if (y < 2024 || y > 2030 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const iso = `${y}-${pad(mo)}-${pad(d)}`;
    return new Date(iso + "T00:00:00Z").toISOString().slice(0, 10) === iso ? iso : null;
  }
  if (/^\d{5}(\.\d+)?$/.test(t)) {
    const iso = new Date(Date.UTC(1899, 11, 30) + Math.floor(+t) * 864e5).toISOString().slice(0, 10);
    return iso >= "2024-01-01" && iso < "2031-01-01" ? iso : null;
  }
  return null;
}
function nfs(s: unknown): string[] {
  const t = String(s ?? "").replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2");
  const out: string[] = [];
  for (let c of t.split(/\D+/)) {
    c = c.replace(/^0+/, "");
    if (c.length < 4) continue;
    if (c.length >= 10) {
      const k = c.length % 5 === 0 ? 5 : c.length % 6 === 0 ? 6 : 0;
      if (k) { for (let i = 0; i < c.length; i += k) out.push(c.slice(i, i + k)); continue; }
    }
    out.push(c);
  }
  return [...new Set(out)];
}
const ALIAS: Record<string, string[]> = {
  num: ["n pedido netsuite", "no pedido netsuite", "numero pedido netsuite", "pedido netsuite", "n pedido", "numero do pedido", "pedido", "netsuite"],
  clinica: ["clinica", "unidade"],
  forma: ["modalidade pagamento", "forma de pagamento", "forma pagamento"],
  dataPag: ["data pagto", "data pagamento", "data do pagamento"],
  obs: ["status ou observacao", "observacao", "observacoes"],
  previsao: ["previsao entrega para cliente", "previsao cliente"],
  obsLab: ["observacao angelica", "observacao laboratorio", "obs laboratorio"],
  statusLab: ["status", "etapa", "status laboratorio"],
  previsaoLab: ["previsao evetlana estimada", "previsao laboratorio", "previsao lab"],
  envio: ["data envio", "data de envio", "data saida"],
  nf: ["nota fiscal", "nf", "n nf"],
};

type Ctx = { simular: boolean; mudancas: string[]; erros: string[]; alertas: string[] };

async function comAuditoria<T>(por: string, fn: (tx: postgres.TransactionSql) => Promise<T>) {
  return await sql.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ email: por, role: "service_role" })}, true)`;
    return await fn(tx);
  }) as T;
}

// ---------- robô da planilha ----------
async function planilha(c: Ctx) {
  const POR = "robo-planilha-cp";
  const HOJE = hojeBR();
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/export?format=csv&gid=0`, { redirect: "follow" });
  const txt = await r.text();
  if (!r.ok || /^\s*</.test(txt)) throw new Error("Não consegui ler a planilha do laboratório (ela precisa estar compartilhada por link).");
  const linhas = csv(txt);
  let hi = -1; const col: Record<string, number> = {};
  for (let i = 0, vistos = 0; i < linhas.length && vistos < 15; i++) {
    const cab = linhas[i].map(nrm); if (!cab.some(Boolean)) continue; vistos++;
    if (!ALIAS.num.some((a) => cab.includes(a))) continue;
    hi = i; const usados = new Set<number>();
    for (const [k, als] of Object.entries(ALIAS)) {
      for (const a of als) { const j = cab.findIndex((h, ix) => h === a && !usados.has(ix)); if (j >= 0) { col[k] = j; usados.add(j); break; } }
    }
    break;
  }
  if (hi < 0) throw new Error("Não encontrei o cabeçalho da planilha (coluna do nº do pedido).");
  const peds = await sql`select p.id, regexp_replace(coalesce(p.num_lab,''),'\D','','g') num, p.num_interno, p.obs, p.expedido_em::text exp,
      p.previsao_envio::text prev, p.cancelado_em, u.nome un,
      (select e.etapa from pedidos_novo.etapa_lab e where e.pedido_id = p.id order by e.em desc, e.id desc limit 1) etapa,
      (select e.previsao::text from pedidos_novo.etapa_lab e where e.pedido_id = p.id order by e.em desc, e.id desc limit 1) etapa_prev
    from pedidos_novo.pedido p join pedidos_novo.unidade u on u.id = p.unidade_id where p.laboratorio_id = 'CP'`;
  const porNum = new Map<string, any>(); for (const p of peds) if (p.num) porNum.set(p.num, p);
  const vistos = new Set<string>(); let lidos = 0, aplicados = 0; const naoEnc: string[] = [];
  for (let i = hi + 1; i < linhas.length; i++) {
    const L = linhas[i]; const g = (k: string) => (col[k] === undefined ? "" : L[col[k]] ?? "");
    const num = g("num").replace(/\D/g, "").slice(0, 9);
    if (num.length < 5 || vistos.has(num)) continue;
    vistos.add(num); lidos++;
    const p = porNum.get(num);
    if (!p) { naoEnc.push(`${num} (${limpa(g("clinica")) || "?"})`); continue; }
    if (p.cancelado_em) continue;
    const mud: string[] = [];
    try {
      await comAuditoria(POR, async (tx) => {
        const etapa = limpa(g("statusLab")).toUpperCase(); const prevLab = data(g("previsaoLab"));
        const novaEtapa = etapa && etapa !== String(p.etapa || "").toUpperCase();
        const novaPrev = etapa && prevLab && prevLab !== p.etapa_prev;
        if (novaEtapa || novaPrev) {
          mud.push(novaEtapa ? `etapa: ${p.etapa || "—"} → ${etapa}` : `previsão do laboratório: ${p.etapa_prev || "—"} → ${prevLab}`);
          if (!c.simular) await tx`insert into pedidos_novo.etapa_lab (pedido_id, etapa, previsao, origem) values (${p.id}, ${etapa}, ${prevLab}, 'planilha')`;
        }
        const prev = data(g("previsao"));
        // previsão só é preenchida quando vazia: no sistema novo ela define o prazo/atraso do laboratório
        if (prev && !p.prev) { mud.push(`previsão: ${prev}`); if (!c.simular) await tx`update pedidos_novo.pedido set previsao_envio = ${prev} where id = ${p.id} and previsao_envio is null`; }
        const env = data(g("envio"));
        if (env && env <= HOJE && !p.exp) { mud.push(`saída do laboratório: ${env}`); if (!c.simular) await tx`update pedidos_novo.pedido set expedido_em = ${env} where id = ${p.id} and expedido_em is null`; }
        const obs = limpa(g("obs"));
        if (obs && !p.obs) { mud.push(`observação: ${obs}`); if (!c.simular) await tx`update pedidos_novo.pedido set obs = ${obs} where id = ${p.id} and obs is null`; }
        for (const n of nfs(g("nf"))) {
          const [ja] = await tx`select n.id, exists(select 1 from pedidos_novo.nota_pedido np where np.nota_id = n.id and np.pedido_id = ${p.id}) ligada
            from pedidos_novo.nota_fiscal n where n.laboratorio_id = 'CP' and n.numero = ${n}`;
          if (ja?.ligada) continue;
          mud.push(`NF ${n} ligada ao pedido`);
          if (c.simular) continue;
          const id = ja?.id ?? (await tx`insert into pedidos_novo.nota_fiscal (laboratorio_id, numero, origem) values ('CP', ${n}, 'planilha') returning id`)[0].id;
          await tx`insert into pedidos_novo.nota_pedido (nota_id, pedido_id) values (${id}, ${p.id}) on conflict do nothing`;
        }
        const dp = data(g("dataPag"));
        if (dp && dp <= HOJE) {
          const [pa] = await tx`select id, baixa_planilha_em::text b from pedidos_novo.parcela where pedido_id = ${p.id} and n = 1 and cancelada_motivo is null order by de limit 1`;
          if (pa && pa.b !== dp) { mud.push(`baixa na planilha (1ª parcela): ${pa.b || "—"} → ${dp}`); if (!c.simular) await tx`update pedidos_novo.parcela set baixa_planilha_em = ${dp} where id = ${pa.id}`; }
        }
      });
      if (mud.length) { aplicados++; c.mudancas.push(`${p.num_interno || num} (${p.un}): ${mud.join("; ")}`); }
    } catch (e) { c.erros.push(`${num}: ${(e as Error).message}`); }
  }
  if (naoEnc.length) c.alertas.push(`${naoEnc.length} pedido(s) da planilha não existem no sistema: ${naoEnc.slice(0, 30).join(", ")}${naoEnc.length > 30 ? "…" : ""}`);
  return { lidos, aplicados };
}

// ---------- robô do rastreio (Quality) ----------
const MES: Record<string, number> = { janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
function dataQuality(txt: string, base: string | null, hoje: string): string | null {
  const m = nrm(txt).match(/(\d{1,2}) de ([a-z]+)/); if (!m || !MES[m[2]]) return null;
  const d = +m[1], mo = MES[m[2]];
  const mk = (y: number) => `${y}-${pad(mo)}-${pad(d)}`;
  if (base) { let iso = mk(+base.slice(0, 4)); if (iso < addD(base, -5)) iso = mk(+base.slice(0, 4) + 1); return iso; }
  let iso = mk(+hoje.slice(0, 4)); if (iso > addD(hoje, 3)) iso = mk(+hoje.slice(0, 4) - 1); return iso;
}
async function consultaQuality(nf: string, cnpj: string, base: string | null, hoje: string) {
  const u = `https://sistema.qualityentregas.com.br/sistema/webService/rastreamentoPedido/track-delivery.php?rastreamento_nf=${encodeURIComponent(nf)}&rastreamento_cpfcnpj=${cnpj}`;
  const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(20000) });
  const html = await r.text();
  const ls = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, "\n").split("\n").map((x) => x.replace(/&nbsp;/g, " ").trim()).filter(Boolean);
  if (ls.some((x) => /n[aã]o encontrado/i.test(x))) return { achou: false } as const;
  const passo = (nome: string) => { const i = ls.findIndex((x) => nrm(x) === nome); return i >= 0 && ls[i + 1] ? dataQuality(ls[i + 1], base, hoje) : null; };
  const entrada = passo("entrada transportadora"), rota = passo("rota entrega"), entrega = passo("entrega destino");
  return { achou: !!(entrada || rota || entrega), entrada, rota, entrega } as const;
}
async function rastreio(c: Ctx) {
  const POR = "robo-rastreio-quality";
  const HOJE = hojeBR();
  const peds = await sql`select p.id, p.num_interno, p.enviado_em::text env, p.expedido_em::text exp, p.rastreio_situacao sit, u.nome un,
      (select regexp_replace(c.cnpj,'\D','','g') from pedidos_novo.unidade_cnpj c where c.unidade_id = p.unidade_id and (c.ate is null or c.ate >= ${HOJE}::date) order by c.de desc limit 1) cnpj,
      (select e.etapa from pedidos_novo.etapa_lab e where e.pedido_id = p.id order by e.em desc, e.id desc limit 1) etapa,
      (select json_agg(json_build_object('nf', n.numero, 'emissao', n.emissao)) from pedidos_novo.nota_pedido np join pedidos_novo.nota_fiscal n on n.id = np.nota_id
         where np.pedido_id = p.id and not n.cancelada) nfs
    from pedidos_novo.pedido p join pedidos_novo.unidade u on u.id = p.unidade_id
    where p.cancelado_em is null and p.recebido_em is null and not p.rascunho and p.laboratorio_id = 'CP'`;
  let lidos = 0, aplicados = 0;
  const fila = peds.filter((p) => (p.nfs && p.nfs.length) || /\bRETIRA(DA|DO)?\b/i.test(p.etapa || ""));
  const trabalha = async (p: any) => {
    lidos++;
    try {
      let sit: string; let det: Record<string, unknown> = {}; let expedido: string | null = null; let recebido: string | null = null;
      if (/\bRETIRA(DA|DO)?\b/i.test(p.etapa || "")) {
        sit = "✔ RETIRADO NO LABORATÓRIO (Sorocaba)"; recebido = p.exp || null;
      } else {
        if (!p.cnpj) { c.alertas.push(`${p.num_interno} (${p.un}): unidade sem CNPJ cadastrado — rastreio não consultado`); return; }
        const res: any[] = [];
        for (const x of p.nfs) {
          const q = await consultaQuality(x.nf, p.cnpj, x.emissao || p.env || null, HOJE);
          res.push({ nf: x.nf, confirmada: !!x.emissao, ...q });
          await new Promise((ok) => setTimeout(ok, 300));
        }
        const txt = (q: any) => !q.achou ? (q.confirmada ? "— NÃO RASTREADA (NF confirmada; outra transportadora, retirada ou junto com outro pedido)" : "✖ NÃO ENCONTRADA") : q.entrega ? "✔ ENTREGUE" : q.rota && q.rota < addD(HOJE, -3) ? "⚠ EM ROTA (sem baixa)" : "🚚 EM TRÂNSITO";
        sit = res.length === 1 ? txt(res[0]) : res.map((q) => `NF ${q.nf}: ${txt(q)}`).join(" / ");
        det = { nfs: res };
        const entradas = res.map((q) => q.entrada).filter(Boolean).sort();
        expedido = entradas[0] || null;
        if (res.length && res.every((q) => q.entrega)) recebido = res.map((q) => q.entrega).sort().pop() || null;
      }
      const mud: string[] = [];
      if (sit !== p.sit) mud.push(`rastreio: ${sit}`);
      if (expedido && !p.exp && expedido <= HOJE) mud.push(`saída (Quality): ${expedido}`); else expedido = null;
      if (recebido && recebido <= HOJE) mud.push(`entregue em ${recebido}`); else recebido = null;
      if (!c.simular) {
        await comAuditoria(POR, async (tx) => {
          await tx`update pedidos_novo.pedido set rastreio_situacao = ${sit}, rastreio_em = now(), rastreio_detalhe = ${tx.json(det as any)} where id = ${p.id}`;
          if (expedido) await tx`update pedidos_novo.pedido set expedido_em = ${expedido} where id = ${p.id} and expedido_em is null`;
          if (recebido) await tx`update pedidos_novo.pedido set recebido_em = ${recebido}, recebido_por = 'Rastreio automático (Quality)' where id = ${p.id} and recebido_em is null`;
        });
      }
      if (mud.length) { aplicados++; c.mudancas.push(`${p.num_interno} (${p.un}): ${mud.join("; ")}`); }
    } catch (e) { c.erros.push(`${p.num_interno}: ${(e as Error).message}`); }
  };
  const fila2 = [...fila];
  await Promise.all([0, 1, 2].map(async () => { while (fila2.length) await trabalha(fila2.shift()); }));
  return { lidos, aplicados };
}

// ---------- servidor ----------
Deno.serve(async (req) => {
  const resp = (s: number, d: unknown) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json; charset=utf-8" } });
  if (req.method !== "POST") return resp(405, { erro: "Use POST." });
  if (!(await autorizado(req))) return resp(401, { erro: "Não autorizado." });
  let b: any = {}; try { b = await req.json(); } catch { /* corpo vazio */ }
  const acao = String(b.acao || "");
  const robos: Record<string, (c: Ctx) => Promise<{ lidos: number; aplicados: number }>> = { planilha, rastreio };
  const f = robos[acao];
  if (!f) return resp(400, { erro: "Ação desconhecida." });
  const c: Ctx = { simular: b.simular === true, mudancas: [], erros: [], alertas: [] };
  const [ex] = c.simular ? [{ id: null }] : await sql`insert into pedidos_novo.execucao_conector (conector, laboratorio_id) values (${acao}, 'CP') returning id`;
  let res = { lidos: 0, aplicados: 0 }; let status = "ok"; let fatal: string | null = null;
  try { res = await f(c); if (c.erros.length) status = "parcial"; }
  catch (e) { status = "erro"; fatal = (e as Error).message; c.erros.unshift(fatal); }
  const resumo = { mudancas: c.mudancas.slice(0, 300), alertas: c.alertas.slice(0, 100), simulado: c.simular };
  if (ex.id) await sql`update pedidos_novo.execucao_conector set fim = now(), status = ${status}, lidos = ${res.lidos}, aplicados = ${res.aplicados},
      erros = ${sql.json(c.erros.slice(0, 100))}, resumo = ${sql.json(resumo)} where id = ${ex.id}`;
  return resp(fatal ? 500 : 200, { status, ...res, erros: c.erros.slice(0, 50), ...resumo });
});
