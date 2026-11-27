// pedidos-historico — devolve, só para leitura:
//  * o que o sistema antigo tinha sobre um pedido (dados sem lugar no sistema novo, links do Portal Omie,
//    conferência pedido × NF e o histórico de alterações de lá);
//  * os eventos do sistema novo (registro de alterações pedidos_novo.evento) do pedido, das parcelas,
//    pagamentos, itens, anexos e notas fiscais ligadas, já em texto, para a ficha mesclar com o histórico antigo.
// Mesmas regras de acesso da pedidos-api: login, troca de senha feita, autenticador para quem exige (admin/financeiro),
// escopo de unidades — tudo lido do núcleo (nucleo.acesso(email, 'laboratorios')) desde 27/11/2026.
// Resposta compatível com a versão anterior (dados, links, conf, historico); acrescenta "campos" e "novos".
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
const arr = (l: string[]) => "{" + l.join(",") + "}";

// ---------- eventos do sistema novo em texto ----------
const fmtR = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const R = (v: unknown) => fmtR.format(Number(v) || 0).replace(/\u00a0/g, " ");
const dt = (s: string) => { const p = s.slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
const FORMA: Record<string, string> = { cartao: "Cartão", pix: "PIX", boleto: "Boleto", outro: "Outra forma" };
type Rot = Record<string, [string, string?]>; // campo -> [rótulo, tipo: d=data r=R$ u=unidade f=forma l=ligado b=sim/não]
const ROT: Record<string, Rot> = {
  pedido: {
    num_lab: ["Nº no laboratório"], unidade_id: ["Unidade", "u"], enviado_em: ["Enviado ao laboratório", "d"],
    confirmado_lab_em: ["Confirmado pelo laboratório", "d"], previsao_envio: ["Previsão de saída", "d"], expedido_em: ["Saiu do laboratório", "d"],
    rastreio: ["Rastreio"], rastreio_situacao: ["Situação do rastreio"], recebido_em: ["Recebido na unidade", "d"], recebido_obs: ["Obs. do recebimento"],
    frete: ["Frete", "r"], cancelado_motivo: ["Cancelamento"], obs: ["Observação"], tipo: ["Tipo"],
  },
  parcela: {
    n: ["Nº da parcela"], de: ["Total de parcelas"], vencimento: ["Vencimento", "d"], valor: ["Valor", "r"], forma: ["Forma", "f"],
    baixa_planilha_em: ["Baixa na planilha", "d"], baixa_omie_em: ["Baixa na Omie", "d"], baixa_sistema_em: ["Baixa no sistema", "d"],
    baixa_sistema_obs: ["Obs. da baixa"], cancelada_motivo: ["Cancelamento"], boleto_arquivo_id: ["Boleto", "l"], nota_id: ["Nota fiscal", "l"],
    boleto_linha: ["Linha digitável"], boleto_numero: ["Nº do boleto"],
  },
  nota_fiscal: {
    numero: ["Número"], emissao: ["Emissão", "d"], total: ["Total", "r"], frete: ["Frete", "r"], cancelada: ["Cancelada", "b"],
    situacao_omie: ["Situação na Omie"], link: ["Link do Portal Omie", "l"], danfe_id: ["DANFE", "l"], xml_id: ["XML", "l"],
  },
};
function val(v: unknown, tipo: string | undefined, uns: Record<string, string>): string {
  if (v == null || v === "") return "—";
  if (tipo === "d") return /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? dt(String(v)) : String(v);
  if (tipo === "r") return R(v);
  if (tipo === "u") return uns[String(v)] || "outra unidade";
  if (tipo === "f") return FORMA[String(v)] || String(v);
  if (tipo === "l") return "ligado";
  if (tipo === "b") return v ? "sim" : "não";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 200 ? s.slice(0, 197) + "…" : s;
}
function difs(tab: string, a: any, d: any, uns: Record<string, string>): string[] {
  const rot = ROT[tab] || {};
  const out: string[] = [];
  for (const k of Object.keys(rot)) {
    const x = a?.[k] ?? null, y = d?.[k] ?? null;
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    const [r, t] = rot[k];
    if (t === "l") out.push(`${r}: ligação ${y ? (x ? "trocada" : "incluída") : "removida"}`);
    else out.push(`${r}: ${val(x, t, uns)} → ${val(y, t, uns)}`);
  }
  return out;
}

async function eventosNovos(pid: string) {
  const parcs = await sql`select id::text id, n, de from pedidos_novo.parcela where pedido_id = ${pid}`;
  const notas = await sql`select n.id::text id, n.numero from pedidos_novo.nota_pedido np join pedidos_novo.nota_fiscal n on n.id = np.nota_id where np.pedido_id = ${pid}`;
  const pids = parcs.map((x) => x.id), nids = notas.map((x) => x.id);
  const ev = await sql`select tabela, acao, antes, depois, por, em::text em from pedidos_novo.evento
    where por <> 'postgres' and (
      (tabela = 'pedido' and registro_id = ${pid})
      or (tabela = 'parcela' and registro_id = any(${arr(pids)}::text[]))
      or (tabela = 'nota_fiscal' and registro_id = any(${arr(nids)}::text[]))
      or (tabela in ('pedido_item', 'pedido_arquivo', 'nota_pedido') and coalesce(depois, antes)->>'pedido_id' = ${pid})
      or (tabela = 'pagamento_parcela' and coalesce(depois, antes)->>'parcela_id' = any(${arr(pids)}::text[]))
    ) order by em desc, id desc limit 300`;
  if (!ev.length) return [];
  const uns: Record<string, string> = {};
  for (const u of await sql`select id::text id, nome from nucleo.unidade`) uns[u.id] = u.nome;
  // registros antigos guardam o id da unidade de antes do núcleo (equivalência em nucleo.unidade_ref)
  for (const u of await sql`select r.ref id, u.nome from nucleo.unidade_ref r join nucleo.unidade u on u.id = r.unidade_id where r.sistema = 'pedidos_novo.unidade'`) uns[u.id] = u.nome;
  const prodIds = new Set<string>(), arqIds = new Set<string>();
  for (const e of ev) {
    const r = e.depois || e.antes || {};
    if (e.tabela === "pedido_item" && r.produto_id) prodIds.add(r.produto_id);
    if (e.tabela === "pedido_arquivo" && r.arquivo_id) arqIds.add(r.arquivo_id);
  }
  const prod: Record<string, string> = {}, arq: Record<string, string> = {};
  if (prodIds.size) for (const x of await sql`select id::text id, descricao from pedidos_novo.produto where id = any(${arr([...prodIds])}::uuid[])`) prod[x.id] = x.descricao;
  if (arqIds.size) for (const x of await sql`select id::text id, nome from pedidos_novo.arquivo where id = any(${arr([...arqIds])}::uuid[])`) arq[x.id] = x.nome;
  const parc: Record<string, string> = {}; for (const x of parcs) parc[x.id] = `Parcela ${x.n}/${x.de}`;
  const nota: Record<string, string> = {}; for (const x of notas) nota[x.id] = `NF ${x.numero}`;
  const out: { em: string; por: string; texto: string }[] = [];
  for (const e of ev) {
    const a = e.antes, d = e.depois, r = d || a || {};
    let t = "";
    if (e.tabela === "pedido") {
      if (e.acao === "insert") t = "Pedido criado";
      else { const l = difs("pedido", a, d, uns); if (l.length) t = l.join(" · "); }
    } else if (e.tabela === "parcela") {
      const q = parc[r.id] || "Parcela";
      if (e.acao === "insert") t = `${q} lançada: ${R(r.valor)}, vence ${val(r.vencimento, "d", uns)}`;
      else { const l = difs("parcela", a, d, uns); if (l.length) t = `${q}: ${l.join(" · ")}`; }
    } else if (e.tabela === "nota_fiscal") {
      const l = difs("nota_fiscal", a, d, uns); if (l.length) t = `${nota[r.id] || "Nota fiscal"}: ${l.join(" · ")}`;
    } else if (e.tabela === "pagamento_parcela") {
      t = `${parc[r.parcela_id] || "Parcela"}: pagamento ${e.acao === "delete" ? "removido" : "registrado"} (${R(r.valor)})`;
    } else if (e.tabela === "pedido_arquivo") {
      t = `Arquivo ${e.acao === "delete" ? "removido" : "anexado"}: ${arq[r.arquivo_id] || "arquivo"}`;
    } else if (e.tabela === "pedido_item") {
      const nm = prod[r.produto_id] || "produto";
      t = e.acao === "delete" ? `Item removido: ${nm}` : `Item ${e.acao === "insert" ? "incluído" : "alterado"}: ${nm} — ${Number(r.qtd).toLocaleString("pt-BR")} × ${R(r.preco_unit)}`;
    } else if (e.tabela === "nota_pedido") {
      t = `${nota[r.nota_id] || "Nota fiscal"} ${e.acao === "delete" ? "desligada do" : "ligada ao"} pedido`;
    }
    if (t) out.push({ em: e.em, por: e.por, texto: t });
  }
  return out;
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
    const [usu] = await sql`select nucleo.acesso(email, 'laboratorios') a from nucleo.usuario where email = ${u.email!.toLowerCase()} and ativo`;
    if (!usu || !usu.a?.ver) return resp(403, { erro: "Sem acesso." });
    if ((u.app_metadata as any)?.trocar_senha === true) return resp(403, { erro: "Antes de continuar, troque a senha temporária." });
    if (usu.a.mfa && jwtAal(token) !== "aal2") return resp(403, { erro: "Confirme o código do aplicativo autenticador." });
    const b = await req.json().catch(() => ({}));
    if (typeof b.pedido_id !== "string" || !UUID.test(b.pedido_id)) return resp(400, { erro: "Pedido inválido." });
    const un: string[] | null = usu.a.unidades === null ? null : (usu.a.unidades as string[]);
    const [p] = await sql`select legado_ref from pedidos_novo.pedido where id = ${b.pedido_id}
      and ${un === null ? sql`true` : sql`unidade_id = any(${arr(un)}::uuid[])`}`;
    if (!p) return resp(404, { erro: "Pedido não encontrado." });
    const novos = await eventosNovos(b.pedido_id);
    const ref = String(p.legado_ref || "");
    if (!ref.startsWith("cp:")) return resp(200, { tem: false, novos });
    const id = ref.slice(3);
    const [d] = await sql`select data, updated_at::text em from pedidos_novo.legado_doc where col = 'pedidos' and id = ${id}`;
    const logs = await sql`select created_at::text em, por, entry from pedidos_novo.legado_log where col = 'pedidos' and doc_id = ${id} order by id desc`;
    if (!d) return resp(200, { tem: false, novos });
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
      // os mesmos dados com nomes fixos, para a ficha decidir o que já existe no sistema novo
      campos: {
        sitPag: x.sitPag ?? null, dataPag: x.dataPag ?? null, dataPagLab: x.dataPagLab ?? null, forma: x.forma ?? null,
        prescritor: x.prescritor ?? null, crbm: x.crbm ?? null, dataReceita: x.dataReceita ?? null, pedidoVenda: x.pedidoVenda ?? null,
        pendPV: x.pendPV ?? null, quality: x.quality ?? null, obsLab: x.obsLab ?? null, foraPlanilha: x.foraPlanilha ? true : null,
      },
      links: (x.links || []).map((l: any) => ({ url: l.url, rotulo: l.rotulo || l.url })).filter((l: any) => /^https:\/\//.test(l.url || "")),
      conf,
      historico: logs.map((l) => ({ em: l.em, por: l.por, texto: linha(l.entry), auto: l.entry?.auto || null })),
      novos,
    });
  } catch (e) {
    console.error(e);
    return resp(500, { erro: "Erro inesperado ao ler o histórico." });
  }
});
