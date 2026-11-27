// =====================================================================
// omie — recebe os dados do Portal Omie (Centro Paulista) no Sistema de Pedidos (novo).
// Quem chama: a tarefa "Sincronizar Portal Omie" (navegador do dono, já logado no portal), cabeçalho x-omie.
// Mesmo formato de corpo do sistema atual (omie-sync): { docs[], mapa{}, anexar[], conf[], lote }.
// Grava: nota_fiscal (+ link, chave, situação), ligação NF↔pedido, parcelas do laboratório (baixa na Omie,
// boleto), arquivos (DANFE/XML/boleto) e itens da NF. Tudo no registro de alterações (por = "integracao-omie").
// Nada é apagado: NF cancelada marca a nota e cancela só parcelas sem pagamento.
// =====================================================================
import postgres from "npm:postgres@3.4.4";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 3, idle_timeout: 20 });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
// [0] chave nova; [1] chave antiga — aceita só até a tarefa agendada ser atualizada na virada.
const KEY_SHAS = ["46f731075340507a557da021cecd4cf5e45bf3147424f78b84e67708be6b5328", "7bccff82191dbe1d503bbc0f1aa36df70f245d8eac5ba2205db056ffb8246bb5"];
const POR = "integracao-omie";
const LAB = "CP";
const BUCKET = "pedidos-novo";
const CC: Record<string, string> = { "70511": "125076", "67890": "120414" }; // cartas de correção (nº do pedido corrigido)
const SIT: Record<string, string> = { "1": "aberto", "2": "pago", "3": "atrasado", "4": "cancelado", "5": "sem cobrança" };
const PROD: [RegExp, string][] = [[/bFGF|IGF|VEGF|Copper/i, "fator"], [/Dutasterida/i, "dutasterida"], [/Minoxidil\s*2\s*%/i, "minox-2"], [/Minoxidil\s*0,5/i, "minox-05"], [/Pill\s*Food/i, "pillfood"], [/Complexo\s*Vitam/i, "complexo"], [/Lidoca/i, "lidocaina"], [/Luteolina/i, "luteolina"], [/Cafeisilane/i, "cafeisilane"], [/Cloreto/i, "cloreto"], [/Cafe[ií]na/i, "cafeina"], [/Tacrolimus/i, "tacrolimus"], [/Triancinolona/i, "triancinolona"]];
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-omie, content-type, apikey", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const dig = (s: unknown) => String(s ?? "").replace(/\D/g, "");
const nfNum = (s: unknown) => String(+dig(s) || "");
const nrm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const r2 = (v: number) => Math.round(v * 100) / 100;
function dia(s: unknown): string | null {
  const t = String(s ?? "").trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}
async function autorizado(req: Request) {
  const k = req.headers.get("x-omie") || "";
  const h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(k)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  return k.length > 0 && KEY_SHAS.includes(h);
}
const tag = (s: string, t: string) => { const m = s.match(new RegExp("<" + t + ">([\\s\\S]*?)</" + t + ">")); return m ? m[1] : null; };
function lerXML(x: string) {
  const itens = [...x.matchAll(/<det [^>]*>([\s\S]*?)<\/det>/g)].map((m) => { const pr = tag(m[1], "prod") || ""; return { desc: tag(pr, "xProd") || "", cfop: tag(pr, "CFOP"), qtd: +(tag(pr, "qCom") || 0), unit: +(tag(pr, "vUnCom") || 0), total: +(tag(pr, "vProd") || 0) }; });
  const tot = tag(x, "ICMSTot") || "";
  return { nf: nfNum(tag(x, "nNF")), emissao: dia(tag(x, "dhEmi") || tag(x, "dEmi")), itens, frete: +(tag(tot, "vFrete") || 0), total: +(tag(tot, "vNF") || 0), pedido: dig(tag(x, "xPed")) || null };
}
function b64bytes(s: string) { const bin = atob(s.replace(/^data:[^,]*,/, "")); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
const hexHash = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("");

type R = { recebidos: number; notas: number; ligadas: string[]; criados: string[]; semPedido: string[]; canceladas: string[]; parcelas: number; baixas: number; novas: string[]; anexados: string[]; erros: string[] };

let SIMULAR = false;
class Desfaz extends Error {}
async function tx<T>(fn: (t: postgres.TransactionSql) => Promise<T>) {
  try {
    return await sql.begin(async (t) => {
      await t`select set_config('request.jwt.claims', ${JSON.stringify({ email: POR, role: "service_role" })}, true)`;
      const r = await fn(t);
      if (SIMULAR) throw new Desfaz();
      return r;
    }) as T;
  } catch (e) { if (e instanceof Desfaz) return undefined as T; throw e; }
}
async function pedidoPorNum(t: postgres.TransactionSql, num: string) {
  const [p] = await t`select id, num_interno from pedidos_novo.pedido where laboratorio_id = ${LAB} and regexp_replace(coalesce(num_lab,''),'\D','','g') = ${num}`;
  return p || null;
}
async function unidadePorRazao(t: postgres.TransactionSql, razao: string | null) {
  if (!razao) return null;
  const alvo = nrm(razao);
  const l = await t`select unidade_id, razao_social from pedidos_novo.unidade_cnpj where ate is null or ate >= current_date`;
  const u = l.find((x) => nrm(x.razao_social) === alvo);
  return u?.unidade_id || null;
}
async function upsertNota(t: postgres.TransactionSql, nf: string, d: Record<string, unknown>) {
  const [n] = await t`insert into pedidos_novo.nota_fiscal (laboratorio_id, numero, origem) values (${LAB}, ${nf}, 'omie')
    on conflict (laboratorio_id, numero) do update set numero = excluded.numero returning id`;
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) if (v !== undefined && v !== null) set[k] = v;
  if (Object.keys(set).length) await t`update pedidos_novo.nota_fiscal set ${t(set)} where id = ${n.id}`;
  return n.id as string;
}
async function ligar(t: postgres.TransactionSql, notaId: string, pedidoId: string) {
  const r = await t`insert into pedidos_novo.nota_pedido (nota_id, pedido_id) values (${notaId}, ${pedidoId}) on conflict do nothing returning nota_id`;
  return r.length > 0;
}
async function renumera(t: postgres.TransactionSql, pedidoId: string) {
  // ativas: 1..A de A pela ordem de vencimento; canceladas ficam com 101.. de 100+C (não colidem)
  const l = await t`select id, cancelada_motivo is not null canc from pedidos_novo.parcela where pedido_id = ${pedidoId} order by vencimento, id`;
  const at = l.filter((x) => !x.canc), ca = l.filter((x) => x.canc);
  await t`update pedidos_novo.parcela set n = n + 1000 where pedido_id = ${pedidoId}`;
  for (let i = 0; i < at.length; i++) await t`update pedidos_novo.parcela set n = ${i + 1}, de = ${at.length} where id = ${at[i].id}`;
  for (let i = 0; i < ca.length; i++) await t`update pedidos_novo.parcela set n = ${101 + i}, de = ${100 + ca.length} where id = ${ca[i].id}`;
}
async function processaNF(d: any, mapa: Record<string, string>, res: R) {
  const nf = nfNum(d.data.numero_nota); if (!nf) return;
  const status = SIT[String(d.data.status_nota)] || String(d.data.status_nota || "");
  const cancelada = status === "cancelado";
  const emissao = dia(d.data.data_emissao);
  const link = d.link_view ? `https://portal.omie.com.br/view/${d.link_view}` : null;
  const dest = d.data.destinatario?.razao_social || null;
  const parcelas = (d.data.parcelas || []).map((p: any) => ({
    venc: dia(p.vencimento || p.data_vencimento), valor: +(p.valor?.titulo ?? 0), pagoEm: dia(p.data_pagamento), sit: SIT[String(p.situacao)] || String(p.situacao || ""),
    tipo: String(p.type || ""), num: +(p.parcela?.numero || 0), de: +(p.parcela?.total || 0), linha: p.codigo_barras || p.data?.codigo_barras || null, nBoleto: p.numero_boleto ? String(p.numero_boleto) : null,
  }));
  await tx(async (t) => {
    const notaId = await upsertNota(t, nf, { emissao, total: d.data.valor_total ?? null, cancelada, link, chave_acesso: d.data.chave_acesso || null, situacao_omie: status, destinatario: dest, omie_em: new Date().toISOString() });
    res.notas++;
    // pedido da NF: carta de correção > mapa manual > já ligada > nº do pedido
    let ped: any = null;
    const ligadas = await t`select p.id, p.num_interno from pedidos_novo.nota_pedido np join pedidos_novo.pedido p on p.id = np.pedido_id where np.nota_id = ${notaId}`;
    const alvo = CC[nf] || (mapa[nf] ? dig(mapa[nf]) : null);
    if (alvo) ped = await pedidoPorNum(t, alvo);
    if (!ped && ligadas.length) ped = ligadas[0];
    if (!ped && alvo && !cancelada && emissao && emissao >= "2026-09-01") {
      const un = await unidadePorRazao(t, dest);
      if (un) {
        [ped] = await t`insert into pedidos_novo.pedido (laboratorio_id, unidade_id, num_lab, rascunho, origem, obs, criado_por)
          values (${LAB}, ${un}, ${alvo}, false, 'omie', ${`Criado a partir da NF ${nf} do Portal Omie (emitida em ${emissao}). Conferir datas e itens.`}, ${POR}) returning id, num_interno`;
        res.criados.push(`${alvo} (NF ${nf}, ${dest})`);
      }
    }
    if (!ped) { res.semPedido.push(`NF ${nf} (${dest || "?"}${cancelada ? ", cancelada" : ""}, R$ ${d.data.valor_total ?? "?"})`); return; }
    if (!cancelada && (await ligar(t, notaId, ped.id))) res.ligadas.push(`NF ${nf} → ${ped.num_interno}`);
    if (cancelada) {
      res.canceladas.push(`NF ${nf} (${ped.num_interno})`);
      await t`update pedidos_novo.parcela pa set cancelada_motivo = ${`NF ${nf} cancelada na Omie`}
        where pa.nota_id = ${notaId} and pa.cancelada_motivo is null
          and not exists (select 1 from pedidos_novo.pagamento_parcela pp where pp.parcela_id = pa.id)`;
      return;
    }
    let mexeu = false;
    for (const q of parcelas) {
      if (!q.venc || !(q.valor > 0)) continue;
      const chave = `NF${nf}:${q.num}/${q.de}`;
      let [pa] = await t`select id, vencimento::text venc, valor::float8 valor, baixa_omie_em::text b, cancelada_motivo from pedidos_novo.parcela where pedido_id = ${ped.id} and chave_omie = ${chave}`;
      if (!pa) [pa] = await t`select id, vencimento::text venc, valor::float8 valor, baixa_omie_em::text b, cancelada_motivo from pedidos_novo.parcela
          where pedido_id = ${ped.id} and chave_omie is null and cancelada_motivo is null and vencimento = ${q.venc} and abs(valor - ${q.valor}) < 0.02 order by n limit 1`;
      if (q.sit === "cancelado") {
        if (pa && !pa.cancelada_motivo) { await t`update pedidos_novo.parcela pa set cancelada_motivo = 'Cancelada na Omie' where pa.id = ${pa.id} and not exists (select 1 from pedidos_novo.pagamento_parcela pp where pp.parcela_id = pa.id)`; mexeu = true; }
        continue;
      }
      const dados: Record<string, unknown> = { nota_id: notaId, chave_omie: chave, vencimento: q.venc, valor: q.valor };
      if (q.tipo === "boleto") dados.forma = "boleto";
      if (q.linha) dados.boleto_linha = q.linha;
      if (q.nBoleto) dados.boleto_numero = q.nBoleto;
      if (q.pagoEm && q.pagoEm !== pa?.b) { dados.baixa_omie_em = q.pagoEm; res.baixas++; }
      if (pa) {
        if (pa.cancelada_motivo) continue;
        await t`update pedidos_novo.parcela set ${t(dados)} where id = ${pa.id}`;
      } else {
        await t`insert into pedidos_novo.parcela ${t({ ...dados, pedido_id: ped.id, n: 900 + (q.num || 1), de: 999, forma: dados.forma || "outro", origem: "omie" })}`;
        res.novas.push(`${ped.num_interno} NF ${nf} ${q.num}/${q.de} venc ${q.venc} R$ ${q.valor}`);
        mexeu = true;
      }
      res.parcelas++;
    }
    if (mexeu) await renumera(t, ped.id);
  });
}

async function anexa(f: any, res: R) {
  const nf = nfNum(f.nf);
  const bytes = b64bytes(String(f.b64 || ""));
  if (!nf || !bytes.length) { res.erros.push(`anexo NF ${f.nf}: arquivo vazio`); return; }
  const nome = String(f.nome || `NF ${nf}`).replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 200);
  const ehXml = /xml/i.test(f.tipo || "") || /\.xml$/i.test(nome);
  const tipo = ehXml ? "application/xml" : (f.tipo || "application/pdf");
  const xml = ehXml ? lerXML(new TextDecoder().decode(bytes)) : null;
  const cat = ehXml ? "xml_nf" : (f.cat === "Boleto" || /boleto/i.test(nome) ? "boleto" : "nota_fiscal");
  const sha = await hexHash(bytes);
  await tx(async (t) => {
    const notaId = await upsertNota(t, nf, { emissao: xml?.emissao || null, total: xml?.total || null, frete: xml ? xml.frete : null });
    let ped: any = null;
    const alvo = CC[nf] || xml?.pedido || (f.ped ? dig(f.ped) : null);
    if (alvo) ped = await pedidoPorNum(t, alvo);
    if (!ped) [ped] = await t`select p.id, p.num_interno from pedidos_novo.nota_pedido np join pedidos_novo.pedido p on p.id = np.pedido_id where np.nota_id = ${notaId} limit 1`;
    if (!ped) { res.erros.push(`anexo NF ${nf}: pedido não identificado${alvo ? ` (${alvo} não existe no sistema)` : ""}`); return; }
    if (await ligar(t, notaId, ped.id)) res.ligadas.push(`NF ${nf} → ${ped.num_interno}`);
    let [arq] = await t`select id from pedidos_novo.arquivo where sha256 = ${sha} limit 1`;
    if (!arq) {
      const path = `omie/${nf}/${crypto.randomUUID()}${ehXml ? ".xml" : ".pdf"}`;
      const up = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: tipo, upsert: false });
      if (up.error) throw new Error("não consegui guardar o arquivo: " + up.error.message);
      [arq] = await t`insert into pedidos_novo.arquivo (bucket, path, nome, tipo, tamanho, sha256, categoria, enviado_por)
        values (${BUCKET}, ${path}, ${nome}, ${tipo}, ${bytes.length}, ${sha}, ${cat}, ${POR}) returning id`;
      res.anexados.push(`${ped.num_interno}: ${nome}`);
    }
    await t`insert into pedidos_novo.pedido_arquivo (pedido_id, arquivo_id) values (${ped.id}, ${arq.id}) on conflict do nothing`;
    if (cat === "xml_nf") await t`update pedidos_novo.nota_fiscal set xml_id = ${arq.id} where id = ${notaId}`;
    if (cat === "nota_fiscal") await t`update pedidos_novo.nota_fiscal set danfe_id = ${arq.id} where id = ${notaId}`;
    if (xml?.itens.length) await gravaItens(t, notaId, xml.itens);
  });
}
async function gravaItens(t: postgres.TransactionSql, notaId: string, itens: any[]) {
  const prods = await t`select id, codigo from pedidos_novo.produto where laboratorio_id = ${LAB}`;
  const porCod = new Map(prods.map((p) => [p.codigo, p.id]));
  await t`delete from pedidos_novo.nota_item where nota_id = ${notaId}`;
  for (const i of itens) {
    const cod = PROD.find(([re]) => re.test(i.desc || ""))?.[1];
    await t`insert into pedidos_novo.nota_item ${t({ nota_id: notaId, produto_id: cod ? porCod.get(cod) || null : null, descricao: String(i.desc || "").slice(0, 300), cfop: i.cfop || null, qtd: +i.qtd || 0, preco_unit: +(i.unit ?? i.vu) || null, total: +(i.total ?? 0) || null })}`;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ erro: "Use POST." }, 405);
  if (!(await autorizado(req))) return J({ erro: "não autorizado" }, 403);
  const b = await req.json().catch(() => ({}));
  SIMULAR = b.simular === true;
  if (SIMULAR && Array.isArray(b.anexar) && b.anexar.length) return J({ erro: "simulação não aceita anexos" }, 400);
  const docs = (b.docs || []).filter((d: any) => d?.type === "nfe" && d?.data?.numero_nota);
  const res: R = { recebidos: docs.length, notas: 0, ligadas: [], criados: [], semPedido: [], canceladas: [], parcelas: 0, baixas: 0, novas: [], anexados: [], erros: [] };
  const [ex] = SIMULAR ? [{ id: null }] : await sql`insert into pedidos_novo.execucao_conector (conector, laboratorio_id) values ('omie', ${LAB}) returning id`;
  const mapa: Record<string, string> = {};
  for (const [k, v] of Object.entries(b.mapa || {})) mapa[nfNum(k)] = String(v);
  for (const d of docs) { try { await processaNF(d, mapa, res); } catch (e) { res.erros.push(`NF ${d.data.numero_nota}: ${(e as Error).message}`); } }
  for (const f of (Array.isArray(b.anexar) ? b.anexar : [])) { try { await anexa(f, res); } catch (e) { res.erros.push(`anexo NF ${f.nf}: ${(e as Error).message}`); } }
  for (const c of (Array.isArray(b.conf) ? b.conf : [])) {
    try {
      const nf = nfNum(c.nf); if (!nf || !Array.isArray(c.itens)) continue;
      await tx(async (t) => {
        const notaId = await upsertNota(t, nf, { emissao: dia(c.emissao), total: c.total ?? null, frete: c.frete ?? null, cancelada: c.cancelada === true ? true : null });
        await gravaItens(t, notaId, c.itens);
        if (c.ped) { const p = await pedidoPorNum(t, dig(c.ped)); if (p && !c.cancelada && (await ligar(t, notaId, p.id))) res.ligadas.push(`NF ${nf} → ${p.num_interno}`); }
      });
    } catch (e) { res.erros.push(`conferência NF ${c.nf}: ${(e as Error).message}`); }
  }
  const status = res.erros.length ? (res.notas || res.anexados.length ? "parcial" : "erro") : "ok";
  const resumo = { lote: b.lote || null, ligadas: res.ligadas.slice(0, 200), criados: res.criados, semPedido: res.semPedido.slice(0, 200), canceladas: res.canceladas, anexados: res.anexados.slice(0, 200), baixas: res.baixas, parcelas: res.parcelas, novas: res.novas.slice(0, 200) };
  if (ex.id) await sql`update pedidos_novo.execucao_conector set fim = now(), status = ${status}, lidos = ${res.recebidos + (b.anexar?.length || 0) + (b.conf?.length || 0)},
    aplicados = ${res.parcelas + res.anexados.length + res.ligadas.length}, erros = ${sql.json(res.erros.slice(0, 100))}, resumo = ${sql.json(resumo)} where id = ${ex.id}`;
  return J({ ...res, simulado: SIMULAR });
});
