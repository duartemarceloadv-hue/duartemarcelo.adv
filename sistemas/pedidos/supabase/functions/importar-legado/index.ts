// importar-legado — recebe lotes do sistema antigo e grava no arquivo somente leitura (pedidos_novo.legado_*).
// Chamado pelo próprio banco antigo (pg_net) durante a migração, com o cabeçalho x-omie (mesma chave da integração).
// Grava por "upsert": rodar de novo atualiza (útil na sincronização final da virada).
import postgres from "npm:postgres@3.4.4";
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2, idle_timeout: 20 });
const KEY_SHAS = ["46f731075340507a557da021cecd4cf5e45bf3147424f78b84e67708be6b5328"];
async function ok(req: Request) {
  const k = req.headers.get("x-omie") || "";
  const h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(k)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  return k.length > 0 && KEY_SHAS.includes(h);
}
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method !== "POST") return J({ erro: "Use POST." }, 405);
  if (!(await ok(req))) return J({ erro: "não autorizado" }, 403);
  const b = await req.json().catch(() => ({}));
  const l = Array.isArray(b.linhas) ? b.linhas : [];
  let n = 0;
  if (b.tipo === "doc") {
    for (const x of l) { await sql`insert into pedidos_novo.legado_doc (col, id, data, updated_at, updated_by) values (${x.col}, ${x.id}, ${sql.json(x.data)}, ${x.updated_at}, ${x.updated_by})
      on conflict (col, id) do update set data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by, copiado_em = now()`; n++; }
  } else if (b.tipo === "log") {
    for (const x of l) { await sql`insert into pedidos_novo.legado_log (id, col, doc_id, entry, ts, por, created_at) values (${x.id}, ${x.col}, ${x.doc_id}, ${sql.json(x.entry)}, ${x.ts}, ${x.por}, ${x.created_at})
      on conflict (id) do nothing`; n++; }
  } else if (b.tipo === "tabela") {
    for (const x of l) { await sql`insert into pedidos_novo.legado_tabela (tabela, chave, linha) values (${b.tabela}, ${String(x.chave)}, ${sql.json(x.linha)})
      on conflict (tabela, chave) do update set linha = excluded.linha, copiado_em = now()`; n++; }
  } else return J({ erro: "tipo inválido" }, 400);
  return J({ ok: true, gravados: n });
});
