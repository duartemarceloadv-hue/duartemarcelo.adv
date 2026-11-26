// =====================================================================
// pedidos-api — API do Sistema de Pedidos Dr. Hair (novo), ambiente de teste
// verify_jwt = true: só entra quem tem sessão do Supabase Auth.
// Lê e grava somente na área pedidos_novo (ligação direta ao banco) e no
// bucket privado 'pedidos-novo' (chave de serviço, nunca exposta ao navegador).
// Todas as gravações passam pelos gatilhos de auditoria (pedidos_novo.evento),
// com "por" = e-mail de quem fez (request.jwt.claims da transação).
// =====================================================================
import postgres from "npm:postgres@3.4.4";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 3, idle_timeout: 20 });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const BUCKET = "pedidos-novo";
const MAX_ARQ = 10 * 1024 * 1024;
const ORIGENS = [
  /^https:\/\/pedidos-novo-drhair\.netlify\.app$/,
  /^https:\/\/[a-z0-9-]+--pedidos-novo-drhair\.netlify\.app$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];
const PAPEIS_MFA = ["admin", "financeiro"];
const PAPEIS_ESCRITA = ["admin", "central", "financeiro", "unidade", "socio"];

class Erro extends Error {
  constructor(public status: number, msg: string, public codigo = "erro", public extra: Record<string, unknown> = {}) {
    super(msg);
  }
}

// ---------- utilidades ----------
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fmtR = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const R = (v: number) => fmtR.format(v || 0).replace(/\u00a0/g, " ");
const dt = (s?: string | null) => {
  if (!s) return "—";
  const p = s.slice(0, 10).split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
};
const ms = (s: string) => {
  const p = s.split("-");
  return Date.UTC(+p[0], +p[1] - 1, +p[2]);
};
const dias = (a: string, b: string) => Math.round((ms(b) - ms(a)) / 864e5);
const addD = (s: string, n: number) => new Date(ms(s) + n * 864e5).toISOString().slice(0, 10);
const plural = (n: number, a: string, b: string) => n + " " + (n === 1 ? a : b);
const r2 = (v: number) => Math.round(v * 100) / 100;
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
function dataValida(s: unknown, campo: string): string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Erro(400, `Informe ${campo} no formato dia/mês/ano.`);
  const d = new Date(s + "T00:00:00Z");
  if (isNaN(+d) || d.toISOString().slice(0, 10) !== s) throw new Erro(400, `A ${campo} informada não existe.`);
  if (s < "2020-01-01") throw new Erro(400, `A ${campo} está muito antiga. Confira o ano.`);
  return s;
}
function uuid(v: unknown, campo = "pedido"): string {
  if (typeof v !== "string" || !UUID.test(v)) throw new Erro(400, `Identificação de ${campo} inválida.`);
  return v.toLowerCase();
}
const arr = (l: string[]) => "{" + l.join(",") + "}";

const SIT_P: Record<string, string> = {
  enviado_ao_laboratorio: "E", no_laboratorio: "L", a_caminho: "C", recebido: "R", cancelado: "X", rascunho: "D",
};
const SIT_PC: Record<string, string> = {
  vencida: "V", a_vencer: "A", paga_aguardando_baixa: "P", baixada_sem_comprovante: "B", quitada: "Q", cancelada: "X",
};
const FORMAS = ["cartao", "pix", "boleto", "outro"];
const FORMA_NOME: Record<string, string> = { cartao: "cartão", pix: "PIX", boleto: "boleto", outro: "outra forma" };
const CAT: Record<string, string> = {
  receita: "Receita", termo: "Termo", comprovante: "Comprovante de pagamento", nota_fiscal: "Nota fiscal (PDF)",
  xml_nf: "Nota fiscal (XML)", boleto: "Boleto", pedido_venda: "Pedido de venda do laboratório", espelho: "Espelho do pedido", outro: "Outro",
};
function origemParcela(o: string): string {
  if (/injemed/i.test(o)) return "migrado do sistema antigo (espelho da Injemed)";
  if (/omie/i.test(o)) return "migrado do sistema antigo (parcelas da Omie)";
  if (/m[aã]o/i.test(o)) return "migrado do sistema antigo (lançada à mão lá)";
  if (/^migra/i.test(o)) return "migrado do sistema antigo";
  return "lançada no sistema novo";
}

// ---------- sessão / acesso ----------
type Ctx = {
  uid: string; email: string; nome: string; papel: string; unidades: string[]; aal: string;
  trocar: boolean; precisaMfa: boolean; temFator: boolean;
};
function payloadJwt(t: string): Record<string, unknown> {
  try {
    const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(p + "===".slice((p.length + 3) % 4)));
  } catch {
    return {};
  }
}
async function sessao(req: Request): Promise<Ctx> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new Erro(401, "Entre com seu e-mail e senha.", "sem_sessao");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.email) throw new Erro(401, "Sua sessão terminou. Entre de novo.", "sem_sessao");
  const u = data.user;
  const email = u.email!.toLowerCase();
  const [usu] = await sql`select nome, papel, unidades::text[] unidades from pedidos_novo.usuario where email = ${email} and ativo`;
  if (!usu) throw new Erro(403, "Este e-mail não tem acesso ao Sistema de Pedidos. Peça liberação ao administrador.", "sem_acesso");
  const jwt = payloadJwt(token);
  return {
    uid: u.id, email, nome: usu.nome, papel: usu.papel, unidades: usu.unidades || [],
    aal: String(jwt.aal || "aal1"),
    trocar: (u.app_metadata as Record<string, unknown>)?.trocar_senha === true,
    precisaMfa: PAPEIS_MFA.includes(usu.papel),
    temFator: (u.factors || []).some((f) => f.status === "verified"),
  };
}
function exigeLiberado(c: Ctx) {
  if (c.trocar) throw new Erro(403, "Antes de continuar, troque a senha temporária.", "trocar_senha");
  if (c.precisaMfa && c.aal !== "aal2") throw new Erro(403, "Confirme o código do aplicativo autenticador para continuar.", "mfa");
}
function exigeEscrita(c: Ctx) {
  if (!PAPEIS_ESCRITA.includes(c.papel)) throw new Erro(403, "Seu acesso é só de consulta; não é possível gravar.", "so_leitura");
}
// null = vê todas as unidades; lista = só essas (lista vazia = nenhuma)
function escopo(c: Ctx): string[] | null {
  if (c.unidades.length) return c.unidades;
  if (c.papel === "unidade" || c.papel === "socio") return [];
  return null;
}
const filtroUn = (c: Ctx, col: string) => {
  const e = escopo(c);
  return e === null ? sql`true` : sql`${sql.unsafe(col)} = any(${arr(e)}::uuid[])`;
};
async function comAuditoria<T>(c: Ctx, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return await sql.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ email: c.email, sub: c.uid, role: "authenticated" })}, true)`;
    return await fn(tx);
  }) as T;
}

// ---------- carga e cálculo (mesmas regras do modelo aprovado) ----------
type Parc = Record<string, any>;
type Ped = Record<string, any>;
async function hojeBanco(): Promise<string> {
  const [h] = await sql`select pedidos_novo.hoje()::text h`;
  return h.h;
}
async function labs() {
  const l = await sql`select id, nome, prazo_envio_dias prazo, ficha->>'num_lab_nome' num_nome, ficha->>'condicao_padrao' cond from pedidos_novo.laboratorio`;
  const o: Record<string, any> = {};
  for (const x of l) o[x.id] = { id: x.id, nome: x.id === "CP" ? "Centro Paulista" : x.nome, nomeLongo: x.nome, prazo: x.prazo, numNome: x.num_nome || "Nº no laboratório", cond: x.cond || "—" };
  return o;
}
async function carregar(c: Ctx, pedidoId?: string) {
  const HOJE = await hojeBanco();
  const h7 = addD(HOJE, 7);
  const LABS = await labs();
  const fp = pedidoId ? sql`p.id = ${pedidoId}` : sql`true`;
  const peds = await sql`
    select p.id, p.num_interno num, p.num_lab, p.laboratorio_id lab, p.unidade_id, u.nome un,
      p.enviado_em::text env, p.previsao_envio::text prev, p.confirmado_lab_em::text conf, p.expedido_em::text exp,
      p.rastreio rast, p.recebido_em::text rec, p.recebido_por, p.recebido_obs rec_obs, p.frete::float8 frete,
      p.subtotal::float8 sub, p.total::float8 total, p.situacao, p.dias_atraso::int atraso, p.cancelado_motivo canc_mot,
      p.obs, p.legado_ref leg, p.tipo, p.origem, e.etapa, e.previsao::text etapa_prev
    from pedidos_novo.v_pedido p
    join pedidos_novo.unidade u on u.id = p.unidade_id
    left join lateral (select etapa, previsao from pedidos_novo.etapa_lab x where x.pedido_id = p.id order by em desc, id desc limit 1) e on true
    where ${filtroUn(c, "p.unidade_id")} and ${fp}`;
  const parcs = await sql`
    select v.id, v.pedido_id, v.n, v.de, v.vencimento::text venc, v.valor::float8 valor, v.forma,
      v.baixa_planilha_em::text b_plan, v.baixa_omie_em::text b_omie, v.situacao, v.pago_por_nos::float8 pago,
      pg.pago_em, v.origem, v.cancelada_motivo canc_mot
    from pedidos_novo.v_parcela v
    join pedidos_novo.pedido p on p.id = v.pedido_id
    left join lateral (select min(g.pago_em)::text pago_em from pedidos_novo.pagamento_parcela pp
                       join pedidos_novo.pagamento g on g.id = pp.pagamento_id where pp.parcela_id = v.id) pg on true
    where ${filtroUn(c, "p.unidade_id")} and ${fp}
    order by v.vencimento, v.n`;
  const porId: Record<string, Ped> = {};
  const PED: Ped[] = peds.map((a) => {
    const lab = LABS[a.lab];
    const o: Ped = {
      id: a.id, num: a.num || "(rascunho)", numLab: a.num_lab, lab: a.lab, labNome: lab?.nome || a.lab, unidade_id: a.unidade_id, un: a.un,
      env: a.env, prev: a.prev, conf: a.conf, exp: a.exp, rast: a.rast, rec: a.rec, recPor: a.recebido_por, recObs: a.rec_obs,
      frete: a.frete, sub: a.sub, total: a.total, sit: SIT_P[a.situacao] || "E", atraso: a.atraso || 0, cancMot: a.canc_mot,
      obs: a.obs, leg: a.leg, tipo: a.tipo === "normal" ? null : a.tipo, origem: a.origem, etapa: a.etapa, etapaPrev: a.etapa_prev, parc: [] as Parc[],
    };
    porId[o.id] = o;
    return o;
  });
  const PARC: Parc[] = [];
  for (const a of parcs) {
    const p = porId[a.pedido_id];
    if (!p) continue;
    const o: Parc = {
      id: a.id, pedido_id: a.pedido_id, n: a.n, de: a.de, venc: a.venc, valor: a.valor, forma: a.forma, bPlan: a.b_plan, bOmie: a.b_omie,
      sit: SIT_PC[a.situacao] || "A", pago: a.pago, pagoEm: a.pago_em, orig: origemParcela(a.origem), cancMot: a.canc_mot,
    };
    o.prox7 = o.sit === "A" && o.venc <= h7;
    o.livre = o.sit === "X" || p.sit === "X" ? 0 : Math.max(0, r2(o.valor - o.pago));
    p.parc.push(o);
    PARC.push(o);
  }
  for (const p of PED) {
    const lab = LABS[p.lab];
    p.prazo = p.prev || (p.env ? addD(p.env, lab?.prazo ?? 30) : null);
    p.diasCaminho = p.sit === "C" && p.exp ? dias(p.exp, HOJE) : 0;
    p.labDizEnviou = !!(p.sit === "E" && p.etapa && /^(ENVIADO|RETIRA)/i.test(p.etapa));
    p.acoes = acoesDo(p);
    p.urg = p.acoes.length ? p.acoes[0].peso : 0;
  }
  return { HOJE, h7, LABS, PED, PARC };
}
function acoesDo(p: Ped) {
  const a: { peso: number; cor: string; txt: string }[] = [];
  if (p.sit === "X") return a;
  const cnt = (s: string) => {
    const l = p.parc.filter((x: Parc) => x.sit === s);
    return { n: l.length, v: l.reduce((t: number, x: Parc) => t + x.valor, 0) };
  };
  const v = cnt("V");
  if (v.n) a.push({ peso: 100, cor: "--red", txt: "Pagar " + plural(v.n, "parcela vencida", "parcelas vencidas") + " — " + R(v.v) });
  if (p.atraso > 0) a.push({ peso: 60 + Math.min(p.atraso, 39), cor: "--red", txt: "Cobrar laboratório — " + plural(p.atraso, "dia", "dias") + " além do prazo" });
  const a7 = p.parc.filter((x: Parc) => x.prox7);
  if (a7.length) a.push({ peso: 58, cor: "--blue", txt: "Pagar até " + dt(a7[0].venc) + " — " + R(a7.reduce((t: number, x: Parc) => t + x.valor, 0)) });
  if (p.diasCaminho > 7) a.push({ peso: 50, cor: "--amber", txt: "Confirmar recebimento — a caminho há " + p.diasCaminho + " dias" });
  if (p.labDizEnviou) a.push({ peso: 45, cor: "--amber", txt: "Confirmar recebimento — o laboratório marcou “" + p.etapa.toLowerCase() + "”, mas não temos a data de envio" });
  const pb = cnt("P");
  if (pb.n) a.push({ peso: 35, cor: "--amber", txt: "Cobrar baixa do laboratório — " + plural(pb.n, "parcela paga", "parcelas pagas") + " sem baixa" });
  const b = cnt("B");
  if (b.n) a.push({ peso: 30, cor: "--amber", txt: "Anexar comprovante — " + plural(b.n, "parcela baixada", "parcelas baixadas") + " sem comprovante nosso" });
  if (p.sub === 0) a.push({ peso: 25, cor: "--gray", txt: "Completar itens — pedido sem itens cadastrados" });
  a.sort((x, y) => y.peso - x.peso);
  return a;
}
const FILTRO: Record<string, (p: Ped) => boolean> = {
  atraso: (p) => p.atraso > 0 && p.sit !== "R" && p.sit !== "X",
  caminho: (p) => p.diasCaminho > 7,
  semitens: (p) => p.sub === 0 && p.sit !== "X",
  labEnviou: (p) => p.labDizEnviou,
};

// ---------- ações de leitura ----------
async function aInicio(c: Ctx) {
  const { HOJE, h7, PED, PARC } = await carregar(c);
  const soma = (l: any[], f: (x: any) => number) => r2(l.reduce((t, x) => t + f(x), 0));
  const pc = (f: (x: Parc) => boolean) => { const l = PARC.filter(f); return { n: l.length, v: soma(l, (x) => x.valor) }; };
  const pd = (f: (x: Ped) => boolean) => { const l = PED.filter(f); return { n: l.length, v: soma(l, (x) => x.total) }; };
  const ab = PED.filter((p) => p.sit !== "R" && p.sit !== "X");
  return {
    hoje: HOJE, h7,
    cartoes: {
      B: pc((x) => x.sit === "B"), P: pc((x) => x.sit === "P"), V: pc((x) => x.sit === "V"), A7: pc((x) => x.prox7),
      atraso: pd(FILTRO.atraso), caminho: pd(FILTRO.caminho), semitens: pd(FILTRO.semitens), labEnviou: pd(FILTRO.labEnviou),
    },
    onde: {
      E: ab.filter((p) => p.sit === "E").length, L: ab.filter((p) => p.sit === "L").length, C: ab.filter((p) => p.sit === "C").length,
      abertos: ab.length, atrasados: ab.filter((p) => p.atraso > 0).length,
      recebidos: PED.filter((p) => p.sit === "R").length, cancelados: PED.filter((p) => p.sit === "X").length,
    },
  };
}
const linhaPedido = (p: Ped) => ({
  id: p.id, num: p.num, numLab: p.numLab, lab: p.lab, labNome: p.labNome, un: p.un, env: p.env, sit: p.sit,
  sub: p.sub, total: p.total, atraso: p.atraso, acoes: p.acoes,
});
async function aPedidos(c: Ctx, b: any) {
  const { HOJE, PED } = await carregar(c);
  const busca = String(b.busca || "").trim().toLowerCase().slice(0, 80);
  const sit = String(b.sit || ""), lab = String(b.lab || ""), esp = String(b.especial || "");
  if (esp && !FILTRO[esp]) throw new Erro(400, "Filtro desconhecido.");
  const l = PED.filter((p) => {
    if (esp && !FILTRO[esp](p)) return false;
    if (sit && p.sit !== sit) return false;
    if (lab && p.lab !== lab) return false;
    if (b.so_acao && !p.acoes.length) return false;
    if (busca && (p.num + " " + (p.numLab || "") + " " + p.un).toLowerCase().indexOf(busca) < 0) return false;
    return true;
  }).sort((x, y) => y.urg - x.urg || y.atraso - x.atraso || ((y.env || "") > (x.env || "") ? 1 : -1));
  const ini = Math.max(0, Math.floor(+b.inicio || 0));
  const lim = Math.min(200, Math.max(1, Math.floor(+b.limite || 60)));
  return {
    hoje: HOJE, qtd: l.length, total: r2(l.reduce((t, p) => t + p.total, 0)),
    itens: l.slice(ini, ini + lim).map(linhaPedido),
  };
}
async function aPedido(c: Ctx, b: any) {
  const id = uuid(b.pedido_id);
  const { HOJE, LABS, PED } = await carregar(c, id);
  const p = PED[0];
  if (!p) throw new Erro(404, "Pedido não encontrado (ou fora das suas unidades).", "nao_encontrado");
  const itens = await sql`select pr.descricao prod, i.qtd::float8 qtd, i.preco_unit::float8 preco, i.total::float8 total
    from pedidos_novo.pedido_item i join pedidos_novo.produto pr on pr.id = i.produto_id where i.pedido_id = ${id} order by pr.descricao`;
  const nf = await sql`select n.numero num, n.emissao::text emis, n.total::float8 total, n.frete::float8 frete, n.cancelada canc
    from pedidos_novo.nota_pedido np join pedidos_novo.nota_fiscal n on n.id = np.nota_id where np.pedido_id = ${id} order by n.emissao, n.numero`;
  const arq = await sql`select a.id, a.nome, a.categoria, a.substituido_por is not null subst, a.bucket = ${BUCKET} abre, a.enviado_em::text enviado_em, a.enviado_por
    from pedidos_novo.pedido_arquivo pa join pedidos_novo.arquivo a on a.id = pa.arquivo_id where pa.pedido_id = ${id} order by a.enviado_em, a.nome`;
  const pags = await sql`select pp.parcela_id, g.pago_em::text pago_em, pp.valor::float8 valor, g.forma, a.nome arquivo, a.id arquivo_id, a.bucket = ${BUCKET} abre, g.registrado_por
    from pedidos_novo.pagamento_parcela pp join pedidos_novo.pagamento g on g.id = pp.pagamento_id
    join pedidos_novo.arquivo a on a.id = g.comprovante_id
    join pedidos_novo.parcela pa on pa.id = pp.parcela_id where pa.pedido_id = ${id} order by g.pago_em`;
  for (const x of p.parc) x.pagamentos = pags.filter((g) => g.parcela_id === x.id);
  p.itens = itens; p.nf = nf;
  p.arq = arq.map((a) => ({ id: a.id, nome: a.nome, cat: CAT[a.categoria] || a.categoria, subst: a.subst, abre: a.abre, em: a.enviado_em, por: a.enviado_por }));
  p.obsLonga = p.obs;
  return { hoje: HOJE, lab: LABS[p.lab], pedido: p, pode_gravar: PAPEIS_ESCRITA.includes(c.papel) };
}
async function aPagamentos(c: Ctx, b: any) {
  const { HOJE, h7, PED, PARC } = await carregar(c);
  const un = b.unidade_id ? uuid(b.unidade_id, "unidade") : "";
  const porId: Record<string, Ped> = {};
  PED.forEach((p) => (porId[p.id] = p));
  const uns: Record<string, string> = {};
  PARC.forEach((x) => (uns[porId[x.pedido_id].unidade_id] = porId[x.pedido_id].un));
  const lista = PARC.filter((x) => !un || porId[x.pedido_id].unidade_id === un).map((x) => {
    const p = porId[x.pedido_id];
    return { id: x.id, pedido_id: p.id, num: p.num, un: p.un, unidade_id: p.unidade_id, n: x.n, de: x.de, venc: x.venc, valor: x.valor, forma: x.forma, sit: x.sit, prox7: x.prox7, livre: x.livre };
  });
  return {
    hoje: HOJE, h7,
    unidades: Object.entries(uns).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    parcelas: lista, pode_gravar: PAPEIS_ESCRITA.includes(c.papel),
  };
}

// ---------- ações que gravam ----------
async function aConfirmarRecebimento(c: Ctx, b: any) {
  exigeEscrita(c);
  const id = uuid(b.pedido_id);
  const data = dataValida(b.data, "data de recebimento");
  const obs = b.obs == null ? null : String(b.obs).trim().slice(0, 500) || null;
  const HOJE = await hojeBanco();
  if (data > HOJE) throw new Erro(400, "A data de recebimento não pode ser no futuro.");
  return await comAuditoria(c, async (tx) => {
    const [p] = await tx`select id, unidade_id, rascunho, cancelado_em, recebido_em::text rec, enviado_em::text env, num_interno
      from pedidos_novo.pedido p where id = ${id} and ${filtroUn(c, "p.unidade_id")} for update`;
    if (!p) throw new Erro(404, "Pedido não encontrado (ou fora das suas unidades).", "nao_encontrado");
    if (p.cancelado_em) throw new Erro(409, "Este pedido está cancelado; não dá para confirmar o recebimento.");
    if (p.rascunho) throw new Erro(409, "Este pedido ainda é rascunho; não foi enviado ao laboratório.");
    if (p.rec) throw new Erro(409, `O recebimento deste pedido já foi confirmado em ${dt(p.rec)}.`);
    if (p.env && data < p.env) throw new Erro(400, `A data de recebimento é anterior ao envio do pedido (${dt(p.env)}).`);
    await tx`update pedidos_novo.pedido set recebido_em = ${data}, recebido_por = ${c.email}, recebido_obs = ${obs} where id = ${id}`;
    return { ok: true, mensagem: `Recebimento do pedido ${p.num_interno || ""} confirmado em ${dt(data)}.` };
  });
}

function detectaTipo(bytes: Uint8Array, nome: string): { mime: string; ext: string } | null {
  const ext = (nome.split(".").pop() || "").toLowerCase();
  const ini = new TextDecoder().decode(bytes.slice(0, 64)).replace(/^\uFEFF/, "").trimStart();
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return ext === "pdf" ? { mime: "application/pdf", ext } : null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return ext === "png" ? { mime: "image/png", ext } : null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ext === "jpg" || ext === "jpeg" ? { mime: "image/jpeg", ext: "jpg" } : null;
  if (ini.startsWith("<")) return ext === "xml" ? { mime: "application/xml", ext } : null;
  return null;
}
function b64bytes(s: string): Uint8Array {
  const limpo = s.replace(/^data:[^,]*,/, "").replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(limpo)) throw new Erro(400, "O arquivo chegou corrompido. Tente anexar de novo.");
  const bin = atob(limpo);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
async function aAnexarComprovante(c: Ctx, b: any) {
  exigeEscrita(c);
  const ids: string[] = Array.isArray(b.parcela_ids) ? [...new Set(b.parcela_ids.map((x: unknown) => uuid(x, "parcela")))] as string[] : [];
  if (!ids.length) throw new Erro(400, "Escolha ao menos uma parcela.");
  if (ids.length > 50) throw new Erro(400, "Escolha no máximo 50 parcelas por comprovante.");
  const valor = r2(Number(b.valor));
  if (!isFinite(valor) || valor <= 0) throw new Erro(400, "Informe o valor pago (maior que zero).");
  const pagoEm = dataValida(b.pago_em, "data do pagamento");
  const HOJE = await hojeBanco();
  if (pagoEm > HOJE) throw new Erro(400, "A data do pagamento não pode ser no futuro.");
  const forma = String(b.forma || "");
  if (!FORMAS.includes(forma)) throw new Erro(400, "Escolha a forma de pagamento (PIX, boleto, cartão ou outra).");
  const obs = b.obs == null ? null : String(b.obs).trim().slice(0, 500) || null;
  const a = b.arquivo || {};
  const nome = String(a.nome || "").replace(/[\\/\u0000-\u001f]/g, "_").trim().slice(0, 200);
  if (!nome || typeof a.base64 !== "string") throw new Erro(400, "Anexe o arquivo do comprovante.");
  const bytes = b64bytes(a.base64);
  if (!bytes.length) throw new Erro(400, "O arquivo está vazio.");
  if (bytes.length > MAX_ARQ) throw new Erro(400, "O arquivo passa de 10 MB. Envie uma versão menor (ex.: PDF ou foto reduzida).");
  const tipo = detectaTipo(bytes, nome);
  if (!tipo) throw new Erro(400, "Tipo de arquivo não aceito. Envie PDF, JPG, PNG ou XML (e confira se a extensão do nome bate com o conteúdo).");
  const sha = hex(await crypto.subtle.digest("SHA-256", bytes));

  // conferência prévia (sem travar) para não subir arquivo à toa
  const confere = async (tx: postgres.Sql | postgres.TransactionSql, travar: boolean) => {
    const l = await tx`select pa.id, pa.n, pa.de, pa.vencimento::text venc, pa.valor::float8 valor, pa.cancelada_motivo, pe.id pedido_id,
        pe.unidade_id, pe.cancelado_em, pe.num_interno,
        coalesce((select sum(pp.valor) from pedidos_novo.pagamento_parcela pp where pp.parcela_id = pa.id), 0)::float8 pago
      from pedidos_novo.parcela pa join pedidos_novo.pedido pe on pe.id = pa.pedido_id
      where pa.id = any(${arr(ids)}::uuid[]) and ${filtroUn(c, "pe.unidade_id")}
      order by pa.vencimento, pe.num_interno, pa.n ${travar ? sql`for update of pa` : sql``}`;
    if (l.length !== ids.length) throw new Erro(404, "Alguma parcela escolhida não foi encontrada (ou é de unidade fora do seu acesso).", "nao_encontrado");
    if (new Set(l.map((x) => x.unidade_id)).size > 1) throw new Erro(400, "As parcelas são de unidades diferentes. Cada unidade (CNPJ) paga o seu: envie um comprovante por unidade.");
    for (const x of l) {
      if (x.cancelada_motivo) throw new Erro(409, `A parcela ${x.n}/${x.de} do pedido ${x.num_interno} está cancelada.`);
      if (x.cancelado_em) throw new Erro(409, `O pedido ${x.num_interno} está cancelado.`);
    }
    const livre = r2(l.reduce((t, x) => t + Math.max(0, x.valor - x.pago), 0));
    if (livre <= 0) throw new Erro(409, "Estas parcelas já estão totalmente pagas.");
    if (valor > livre + 0.005) throw new Erro(400, `O valor informado (${R(valor)}) é maior do que falta pagar nas parcelas escolhidas (${R(livre)}).`);
    return l;
  };
  await confere(sql, false);
  const rep = await sql`select a.nome, a.enviado_em::text em, a.enviado_por,
      (select string_agg(distinct pe.num_interno, ', ') from pedidos_novo.pedido_arquivo x join pedidos_novo.pedido pe on pe.id = x.pedido_id where x.arquivo_id = a.id) pedidos
    from pedidos_novo.arquivo a where a.sha256 = ${sha} limit 5`;
  if (rep.length && b.confirmar_repetido !== true) {
    throw new Erro(409, "Este mesmo arquivo já foi enviado antes. Confira para não registrar o mesmo pagamento duas vezes.", "repetido", {
      repetidos: rep.map((x) => ({ nome: x.nome, em: x.em, por: x.enviado_por, pedidos: x.pedidos })),
    });
  }
  const agora = new Date();
  const path = `comprovantes/${agora.getUTCFullYear()}/${String(agora.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${tipo.ext}`;
  const up = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: tipo.mime, upsert: false });
  if (up.error) {
    console.error("upload", up.error);
    throw new Erro(502, "Não foi possível guardar o arquivo agora. Tente de novo em instantes.");
  }
  try {
    return await comAuditoria(c, async (tx) => {
      const l = await confere(tx, true);
      const [arq] = await tx`insert into pedidos_novo.arquivo (bucket, path, nome, tipo, tamanho, sha256, categoria, enviado_por)
        values (${BUCKET}, ${path}, ${nome}, ${tipo.mime}, ${bytes.length}, ${sha}, 'comprovante', ${c.email}) returning id`;
      const [pag] = await tx`insert into pedidos_novo.pagamento (unidade_id, pago_em, valor, forma, comprovante_id, obs, registrado_por)
        values (${l[0].unidade_id}, ${pagoEm}, ${valor}, ${forma}, ${arq.id}, ${obs}, ${c.email}) returning id`;
      let resta = valor;
      const dist: { parcela: string; pedido: string; valor: number }[] = [];
      for (const x of l) {
        const livre = r2(Math.max(0, x.valor - x.pago));
        const v = r2(Math.min(livre, resta));
        if (v <= 0) continue;
        await tx`insert into pedidos_novo.pagamento_parcela (pagamento_id, parcela_id, valor) values (${pag.id}, ${x.id}, ${v})`;
        dist.push({ parcela: `${x.n}/${x.de}`, pedido: x.num_interno, valor: v });
        resta = r2(resta - v);
      }
      for (const pid of [...new Set(l.map((x) => x.pedido_id))]) {
        await tx`insert into pedidos_novo.pedido_arquivo (pedido_id, arquivo_id) values (${pid}, ${arq.id}) on conflict do nothing`;
      }
      return {
        ok: true, pagamento_id: pag.id, arquivo_id: arq.id, distribuicao: dist, repetido: rep.length > 0,
        mensagem: `Comprovante de ${R(valor)} registrado em ${plural(dist.length, "parcela", "parcelas")}.`,
      };
    });
  } catch (e) {
    await admin.storage.from(BUCKET).remove([path]).catch(() => {});
    throw e;
  }
}

async function aCobrancaBaixa(c: Ctx, b: any) {
  const pid = b.pedido_id ? uuid(b.pedido_id) : null;
  const un = b.unidade_id ? uuid(b.unidade_id, "unidade") : null;
  if (!pid && !un) throw new Erro(400, "Escolha um pedido ou uma unidade para gerar a cobrança.");
  const l = await sql`
    select v.id, v.n, v.de, v.vencimento::text venc, v.valor::float8 valor, v.baixa_planilha_em, v.baixa_omie_em,
      pe.num_interno num, pe.num_lab, pe.laboratorio_id lab, la.nome lab_nome, la.ficha->>'num_lab_nome' num_nome, u.nome un,
      (select c.cnpj from pedidos_novo.unidade_cnpj c where c.unidade_id = u.id and (c.ate is null or c.ate >= pedidos_novo.hoje()) order by c.de desc limit 1) cnpj,
      (select json_agg(json_build_object('em', g.pago_em, 'valor', pp.valor, 'forma', g.forma) order by g.pago_em)
         from pedidos_novo.pagamento_parcela pp join pedidos_novo.pagamento g on g.id = pp.pagamento_id where pp.parcela_id = v.id) pags
    from pedidos_novo.v_parcela v
    join pedidos_novo.pedido pe on pe.id = v.pedido_id
    join pedidos_novo.laboratorio la on la.id = pe.laboratorio_id
    join pedidos_novo.unidade u on u.id = pe.unidade_id
    where v.situacao = 'paga_aguardando_baixa' and ${filtroUn(c, "pe.unidade_id")}
      and ${pid ? sql`pe.id = ${pid}` : sql`true`} and ${un ? sql`pe.unidade_id = ${un}` : sql`true`}
    order by la.nome, u.nome, pe.num_interno, v.n`;
  if (!l.length) return { textos: [], mensagem: "Não há parcelas pagas aguardando baixa do laboratório nesta seleção." };
  const fmtCnpj = (s: string | null) => s ? s.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : null;
  const porLab: Record<string, any[]> = {};
  l.forEach((x) => (porLab[x.lab] ||= []).push(x));
  const textos = Object.values(porLab).map((g) => {
    const lab = g[0];
    const total = r2(g.reduce((t, x) => t + x.valor, 0));
    const linhas = g.map((x) => {
      const falta = [!x.baixa_planilha_em ? "planilha" : null, !x.baixa_omie_em ? "Omie" : null].filter(Boolean).join(" e ");
      const pg = (x.pags || []).map((p: any) => `pago em ${dt(p.em)} por ${FORMA_NOME[p.forma] || p.forma} (${R(+p.valor)})`).join("; ");
      return `• ${lab.num_nome || "Pedido"} ${x.num_lab || "—"} (nosso ${x.num}) — ${x.un}${x.cnpj ? " (CNPJ " + fmtCnpj(x.cnpj) + ")" : ""}\n` +
        `  Parcela ${x.n}/${x.de}, vencimento ${dt(x.venc)}, valor ${R(x.valor)} — ${pg}. Falta a baixa na ${falta}.`;
    });
    const texto = `Olá, equipe ${lab.lab_nome}!\n\n` +
      `Pedimos, por favor, a baixa ${g.length === 1 ? "do pagamento abaixo, que já foi feito" : "dos pagamentos abaixo, que já foram feitos"} pela Dr. Hair e ainda ${g.length === 1 ? "aparece" : "aparecem"} em aberto do lado de vocês:\n\n` +
      linhas.join("\n\n") +
      `\n\nTotal: ${R(total)} (${plural(g.length, "parcela", "parcelas")}).\n\n` +
      `Temos os comprovantes; se precisarem, enviamos de novo.\n\nObrigado!\n${c.nome} — Dr. Hair`;
    return { lab: lab.lab_nome, qtd: g.length, total, texto };
  });
  return { textos };
}

async function aAbrirArquivo(c: Ctx, b: any) {
  const id = uuid(b.arquivo_id, "arquivo");
  const [a] = await sql`select a.bucket, a.path, a.nome from pedidos_novo.arquivo a
    where a.id = ${id} and exists (select 1 from pedidos_novo.pedido_arquivo x join pedidos_novo.pedido pe on pe.id = x.pedido_id
                                   where x.arquivo_id = a.id and ${filtroUn(c, "pe.unidade_id")})`;
  if (!a) throw new Erro(404, "Arquivo não encontrado.", "nao_encontrado");
  if (a.bucket !== BUCKET) throw new Erro(409, "Este arquivo veio do sistema antigo e ainda não foi copiado para o sistema novo. Por enquanto, abra-o no sistema atual.");
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(a.path, 300, { download: a.nome });
  if (error) throw new Erro(502, "Não foi possível abrir o arquivo agora.");
  return { url: data.signedUrl };
}

async function aTrocarSenha(c: Ctx, b: any) {
  if (!c.trocar) exigeLiberado(c);
  const nova = String(b.nova || "");
  if (nova.length < 10) throw new Erro(400, "A nova senha precisa ter pelo menos 10 caracteres.");
  if (!/[A-Za-z]/.test(nova) || !/\d/.test(nova)) throw new Erro(400, "Use letras e números na nova senha.");
  if (nova.toLowerCase().includes(c.email.split("@")[0])) throw new Erro(400, "A senha não pode conter o seu e-mail.");
  const { error } = await admin.auth.admin.updateUserById(c.uid, { password: nova, app_metadata: { trocar_senha: false } });
  if (error) {
    console.error("senha", error.message);
    throw new Erro(400, /same|different/i.test(error.message) ? "A nova senha precisa ser diferente da temporária." : "Não foi possível trocar a senha. Tente outra senha.");
  }
  return { ok: true, mensagem: "Senha trocada." };
}

// ---------- servidor ----------
Deno.serve(async (req) => {
  const origem = req.headers.get("Origin") || "";
  const cors: Record<string, string> = { Vary: "Origin" };
  if (ORIGENS.some((r) => r.test(origem))) {
    cors["Access-Control-Allow-Origin"] = origem;
    cors["Access-Control-Allow-Headers"] = "authorization, apikey, content-type, x-client-info";
    cors["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    cors["Access-Control-Max-Age"] = "600";
  }
  const resp = (s: number, d: unknown) =>
    new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (origem && !cors["Access-Control-Allow-Origin"]) return resp(403, { erro: "Origem não autorizada." });
  if (req.method !== "POST") return resp(405, { erro: "Use POST." });
  try {
    if (+(req.headers.get("content-length") || 0) > 15 * 1024 * 1024) throw new Erro(413, "O envio passa do limite (arquivo de até 10 MB).");
    let b: any;
    try { b = await req.json(); } catch { throw new Erro(400, "Pedido inválido."); }
    const acao = String(b?.acao || "");
    const c = await sessao(req);
    if (acao === "sessao") {
      return resp(200, { email: c.email, nome: c.nome, papel: c.papel, trocar_senha: c.trocar, precisa_mfa: c.precisaMfa, aal: c.aal, tem_fator: c.temFator, pode_gravar: PAPEIS_ESCRITA.includes(c.papel) });
    }
    if (acao === "trocar_senha") return resp(200, await aTrocarSenha(c, b));
    exigeLiberado(c);
    const acoes: Record<string, (c: Ctx, b: any) => Promise<unknown>> = {
      inicio: aInicio, pedidos: aPedidos, pedido: aPedido, pagamentos: aPagamentos,
      confirmar_recebimento: aConfirmarRecebimento, anexar_comprovante: aAnexarComprovante,
      cobranca_baixa: aCobrancaBaixa, abrir_arquivo: aAbrirArquivo,
    };
    const f = acoes[acao];
    if (!f) throw new Erro(400, "Ação desconhecida.");
    return resp(200, await f(c, b));
  } catch (e) {
    if (e instanceof Erro) return resp(e.status, { erro: e.message, codigo: e.codigo, ...e.extra });
    console.error(e);
    return resp(500, { erro: "Erro inesperado no servidor. Tente de novo; se continuar, avise o suporte." });
  }
});
