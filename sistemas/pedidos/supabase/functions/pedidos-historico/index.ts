// pedidos-historico — devolve, só para leitura, o que o sistema antigo tinha sobre um pedido:
// dados sem lugar no sistema novo, links do Portal Omie, conferência pedido × NF e o histórico de alterações.
// Mesmas regras de acesso da pedidos-api: login, troca de senha feita, autenticador para admin/financeiro, escopo de unidades.
import postgres from "npm:postgres@3.4.4";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2, idle_timeout: 20 });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
const ORIGENS = [/^https:\/\/pedidos-novo-drhair\.netlify\.app$/, /^https:\/\/[a-z0-9-]+--pedidos-novo-drhair\.netlify\.app$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const jwtAal = (t: string) => { try { const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); return String(JSON.parse(atob(p + "===".slice((p.length + 3) % 4))).aal || "aal1"); } catch { return "aal1"; } };
const txt = (v: unknown) => (v == null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
function linha(e: any): string {
  if (!e || typeof e !== "object") return txt(e);
  if (Array.isArray(e.campos) && e.campos.length) return e.campos.map((c: any) => `${c.c}: ${txt(c.de)} → ${txt(c.para)}`).join(" · ");
  return [e.status, e.obs].filter(Boolean).join(" — ") || txt(e);
}

Deno.serve(async (req) => {
  const origem = req.headers.get("Origin") || "";
  const cors: Record<string, string> = { Vary: "Origin" };
  if (ORIGENS.some((r) => r.test(origem))) Object.assign(cors, { "Access-Control-Allow-Origin": origem, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" });
  const resp = (s: number, d: unknown) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (origem && !cors["Access-Control-Allow-Origin"]) return resp(403, { erro: "Origem não autorizada." });
  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user?.email) return resp(401, { erro: "Sua sessão terminou. Entre de novo." });
    const u = data.user;
    const [usu] = await sql`select papel, unidades::text[] unidades from pedidos_novo.usuario where email = ${u.email!.toLowerCase()} and ativo`;
    if (!usu) return resp(403, { erro: "Sem acesso." });
    if ((u.app_metadata as any)?.trocar_senha === true) return resp(403, { erro: "Antes de continuar, troque a senha temporária." });
    if (["admin", "financeiro"].includes(usu.papel) && jwtAal(token) !== "aal2") return resp(403, { erro: "Confirme o código do aplicativo autenticador." });
    const b = await req.json().catch(() => ({}));
    if (typeof b.pedido_id !== "string" || !UUID.test(b.pedido_id)) return resp(400, { erro: "Pedido inválido." });
    const un: string[] = usu.unidades?.length ? usu.unidades : (["unidade", "socio"].includes(usu.papel) ? [] : null as any);
    const [p] = await sql`select legado_ref from pedidos_novo.pedido where id = ${b.pedido_id}
      and ${un === null ? sql`true` : sql`unidade_id = any(${"{" + un.join(",") + "}"}::uuid[])`}`;
    if (!p) return resp(404, { erro: "Pedido não encontrado." });
    const ref = String(p.legado_ref || "");
    if (!ref.startsWith("cp:")) return resp(200, { tem: false });
    const id = ref.slice(3);
    const [d] = await sql`select data, updated_at::text em from pedidos_novo.legado_doc where col = 'pedidos' and id = ${id}`;
    const logs = await sql`select created_at::text em, por, entry from pedidos_novo.legado_log where col = 'pedidos' and doc_id = ${id} order by id desc`;
    if (!d) return resp(200, { tem: false });
    const x = d.data || {};
    const conf = x.confNF ? { ok: !!x.confNF.ok, em: x.confNF.em, nfs: x.confNF.nfs, diverg: x.confNF.diverg || [], avisos: x.confNF.avisos || [], difPrecoTotal: x.confNF.difPrecoTotal || 0 } : null;
    return resp(200, {
      tem: true, id, atualizado: d.em,
      dados: {
        "Situação de pagamento (sistema antigo)": x.sitPag, "Data de pagamento": x.dataPag, "Data de pagamento (planilha do lab.)": x.dataPagLab,
        "Forma de pagamento": x.forma, "Prescritor": x.prescritor, "CRBM": x.crbm, "Data da receita": x.dataReceita,
        "Pedido de venda": x.pedidoVenda, "Pendência no pedido de venda": x.pendPV, "Rastreio (Quality)": x.quality,
        "Observação do laboratório": x.obsLab, "Fora da planilha do laboratório": x.foraPlanilha ? "sim" : null,
      },
      links: (x.links || []).map((l: any) => ({ url: l.url, rotulo: l.rotulo || l.url })).filter((l: any) => /^https:\/\//.test(l.url || "")),
      conf,
      historico: logs.map((l) => ({ em: l.em, por: l.por, texto: linha(l.entry), auto: l.entry?.auto || null })),
    });
  } catch (e) {
    console.error(e);
    return resp(500, { erro: "Erro inesperado ao ler o histórico." });
  }
});
