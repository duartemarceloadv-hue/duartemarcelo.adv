// =====================================================================
// Cadastros do NÚCLEO (schema nucleo): Unidades, Pessoas e Pendências de cadastro.
// Só Operações/administrador sem restrição de unidade (nucleo.acesso → cadastros).
// Toda gravação passa pelo gatilho nucleo.audita com o e-mail de quem fez e a JUSTIFICATIVA obrigatória.
// Casamento de pessoas: só por documento ou registro no conselho; nome parecido = pendência decidida aqui.
// =====================================================================
import type { Ctx, Dep } from "./index.ts";

export function acoesCadastros(D: Dep) {
  const { sql, Erro, uuid, txt, dataValida, comAuditoria } = D;
  const arr = (l: string[]) => "{" + l.join(",") + "}";
  const exige = (c: Ctx) => { if (!c.cadastros) throw new Erro(403, "Cadastros é só para Operações e administradores.", "sem_acesso"); };
  const just = (v: unknown) => {
    const j = txt(v, 500);
    if (!j || j.length < 5) throw new Erro(400, "Escreva a justificativa da alteração (pelo menos 5 letras).");
    return j;
  };
  const cnpjOk = (v: unknown) => {
    const s = String(v || "").replace(/\D/g, "");
    if (!/^\d{14}$/.test(s)) throw new Erro(400, "CNPJ inválido: informe os 14 números.");
    return s;
  };
  const cpfMasc = (n: string) => "***." + n.slice(3, 6) + "." + n.slice(6, 9) + "-**";
  const ROT_TAB: Record<string, string> = {
    unidade: "Dados da unidade", unidade_empresa: "CNPJ (vínculo)", empresa: "Empresa", unidade_apelido: "Apelido", unidade_rt: "RT",
    socio_unidade: "Sócio", pessoa: "Pessoa", profissional: "Registro profissional", pessoa_documento_fiscal: "Documento fiscal",
    prescritor_unidade: "Prescritor na unidade", pendencia_cadastro: "Pendência de cadastro", pessoa_origem: "Origem do cadastro", unidade_ref: "Equivalência de id",
  };
  const IGN = new Set(["id", "criado_em", "atualizado_em", "nome_norm"]);
  function textoEvento(e: any): string {
    const rot = ROT_TAB[e.tabela] || e.tabela;
    if (e.acao === "insert") return rot + " incluído";
    if (e.acao === "delete") return rot + " removido";
    const a = e.antes || {}, d = e.depois || {};
    const m = Object.keys(d).filter((k) => !IGN.has(k) && JSON.stringify(a[k] ?? null) !== JSON.stringify(d[k] ?? null))
      .map((k) => `${k}: ${a[k] ?? "—"} → ${d[k] ?? "—"}`);
    return rot + (m.length ? ": " + m.join(" · ") : " alterado");
  }
  async function historico(ids: string[]) {
    if (!ids.length) return [];
    const ev = await sql`select tabela, acao, antes, depois, por, origem, justificativa, em::text em from nucleo.evento
      where registro_id = any(${arr(ids)}::text[]) or coalesce(depois, antes)->>'unidade_id' = any(${arr(ids)}::text[])
         or coalesce(depois, antes)->>'pessoa_id' = any(${arr(ids)}::text[])
      order by em desc, id desc limit 200`;
    return ev.map((e) => ({ em: e.em, por: e.origem === "carga" ? "carga inicial" : e.por, texto: textoEvento(e), justificativa: e.origem === "carga" ? null : e.justificativa }));
  }
  const regTxt = (r: any) => r?.registro ? `${r.conselho} ${r.registro}${r.uf ? "-" + r.uf : ""}` : null;

  // ---------- Unidades ----------
  async function cadUnidades(c: Ctx, b: any) {
    exige(c);
    const l = await sql`
      select u.id, u.nome, u.cidade, u.uf, u.ativo,
        (select e.cnpj from nucleo.unidade_empresa ue join nucleo.empresa e on e.id = ue.empresa_id where ue.unidade_id = u.id and ue.ate is null limit 1) cnpj,
        (select string_agg(p.nome, ' / ' order by r.tipo nulls last, r.de) from nucleo.unidade_rt r join nucleo.pessoa p on p.id = r.pessoa_id
          where r.unidade_id = u.id and r.ate is null and r.tipo = 'titular') rt,
        (select count(*) from nucleo.unidade_rt r where r.unidade_id = u.id and r.ate is null)::int n_rt,
        (select string_agg(distinct p.nome, ', ') from nucleo.socio_unidade s join nucleo.pessoa p on p.id = s.pessoa_id where s.unidade_id = u.id and s.ate is null) socios,
        (select max(t.de)::text from pedidos_novo.termo t where t.unidade_id = u.id and t.ate is null) termo,
        (select count(*) from nucleo.pendencia_cadastro pc where pc.status = 'aberta' and (pc.unidade_id = u.id
           or pc.pessoa_a in (select pessoa_id from nucleo.unidade_rt where unidade_id = u.id union select pessoa_id from nucleo.socio_unidade where unidade_id = u.id)))::int pend
      from nucleo.unidade u order by u.nome`;
    return { unidades: l };
  }
  async function cadUnidade(c: Ctx, b: any) {
    exige(c);
    const id = uuid(b.unidade_id, "unidade");
    const [u] = await sql`select id, nome, cidade, uf, ativo, abertura::text abertura, obs, doc_unidade_id from nucleo.unidade where id = ${id}`;
    if (!u) throw new Erro(404, "Unidade não encontrada.", "nao_encontrado");
    const cnpjs = await sql`select ue.id, e.id empresa_id, e.cnpj, e.razao_social, ue.de::text de, ue.ate::text ate, ue.obs
      from nucleo.unidade_empresa ue join nucleo.empresa e on e.id = ue.empresa_id where ue.unidade_id = ${id} order by ue.ate is null desc, ue.de desc nulls last`;
    const socios = await sql`select s.id, s.pessoa_id, p.nome, s.de::text de, s.ate::text ate, s.fonte from nucleo.socio_unidade s join nucleo.pessoa p on p.id = s.pessoa_id
      where s.unidade_id = ${id} order by s.ate is null desc, p.nome`;
    const rts = await sql`select r.id, r.pessoa_id, p.nome, r.tipo, r.de::text de, r.ate::text ate, r.vinculo, r.cargo, r.fonte,
        (select json_build_object('conselho', x.conselho, 'registro', x.registro, 'uf', x.uf) from nucleo.profissional x where x.pessoa_id = p.id and x.registro is not null limit 1) reg
      from nucleo.unidade_rt r join nucleo.pessoa p on p.id = r.pessoa_id where r.unidade_id = ${id}
      order by r.ate is null desc, r.tipo = 'titular' desc nulls last, r.de desc`;
    const termos = await sql`select t.id, t.laboratorio_id lab, l.nome lab_nome, p.nome rt, t.rt_id, t.de::text de, t.ate::text ate, t.arquivo_nome, t.arquivo_local, t.obs
      from pedidos_novo.termo t join pedidos_novo.laboratorio l on l.id = t.laboratorio_id join nucleo.pessoa p on p.id = t.rt_id where t.unidade_id = ${id} order by t.de desc`;
    const apelidos = await sql`select id, nome, sistema from nucleo.unidade_apelido where unidade_id = ${id} order by sistema, nome`;
    const [prot] = await sql`select protocolo from pedidos_novo.unidade_protocolo where unidade_id = ${id}`;
    const pend = await sql`select id, tipo, descricao from nucleo.pendencia_cadastro where status = 'aberta' and unidade_id = ${id}`;
    const ids = [id, ...cnpjs.map((x) => x.id), ...socios.map((x) => x.id), ...rts.map((x) => x.id), ...apelidos.map((x) => x.id)];
    return {
      unidade: { ...u, protocolo: prot?.protocolo || null },
      cnpjs, socios, rts: rts.map((r) => ({ ...r, registro: regTxt(r.reg) })), termos, apelidos, pendencias: pend,
      historico: await historico(ids),
    };
  }
  async function cadSalvarUnidade(c: Ctx, b: any) {
    exige(c);
    const id = uuid(b.unidade_id, "unidade");
    const j = just(b.justificativa);
    const d = b.dados && typeof b.dados === "object" ? b.dados : {};
    const op = String(b.op || "");
    return await comAuditoria(c, async (tx) => {
      const [u] = await tx`select id, nome from nucleo.unidade where id = ${id} for update`;
      if (!u) throw new Erro(404, "Unidade não encontrada.", "nao_encontrado");
      if (op === "dados") {
        const nome = txt(d.nome, 80);
        if (!nome) throw new Erro(400, "Informe o nome da unidade.");
        const uf = txt(d.uf, 2)?.toUpperCase() || null;
        if (uf && !/^[A-Z]{2}$/.test(uf)) throw new Erro(400, "UF inválida (2 letras).");
        const abertura = d.abertura ? dataValida(d.abertura, "data de abertura") : null;
        try {
          await tx`update nucleo.unidade set nome = ${nome}, cidade = ${txt(d.cidade, 80)}, uf = ${uf}, ativo = ${d.ativo !== false}, abertura = ${abertura}, obs = ${txt(d.obs, 500)} where id = ${id}`;
        } catch (e: any) { if (e?.code === "23505") throw new Erro(409, "Já existe outra unidade com esse nome."); throw e; }
        return { ok: true, mensagem: "Dados da unidade salvos." };
      }
      if (op === "cnpj") {
        const cnpj = cnpjOk(d.cnpj);
        const razao = txt(d.razao_social, 160);
        if (!razao) throw new Erro(400, "Informe a razão social.");
        const de = dataValida(d.de, "data de início do CNPJ");
        const [atual] = await tx`select ue.id, ue.de::text de, e.cnpj from nucleo.unidade_empresa ue join nucleo.empresa e on e.id = ue.empresa_id where ue.unidade_id = ${id} and ue.ate is null for update`;
        if (atual && atual.cnpj === cnpj) throw new Erro(409, "Este já é o CNPJ vigente da unidade.");
        if (atual && atual.de && de <= atual.de) throw new Erro(400, "O novo CNPJ precisa começar depois do início do CNPJ atual.");
        const [emp] = await tx`insert into nucleo.empresa (razao_social, cnpj) values (${razao}, ${cnpj})
          on conflict (cnpj) do update set razao_social = excluded.razao_social returning id`;
        if (atual) await tx`update nucleo.unidade_empresa set ate = (${de}::date - 1) where id = ${atual.id}`;
        await tx`insert into nucleo.unidade_empresa (unidade_id, empresa_id, de) values (${id}, ${emp.id}, ${de})`;
        return { ok: true, mensagem: "Novo CNPJ registrado; o anterior ficou no histórico." };
      }
      if (op === "apelido_incluir") {
        const nome = txt(d.nome, 80);
        if (!nome) throw new Erro(400, "Informe o apelido.");
        try { await tx`insert into nucleo.unidade_apelido (unidade_id, nome, sistema) values (${id}, ${nome}, ${txt(d.sistema, 40) || "manual"})`; }
        catch (e: any) { if (e?.code === "23505") throw new Erro(409, "Esse apelido já existe nesta unidade."); throw e; }
        return { ok: true, mensagem: "Apelido incluído." };
      }
      if (op === "apelido_remover") {
        const aid = uuid(d.id, "apelido");
        const r = await tx`delete from nucleo.unidade_apelido where id = ${aid} and unidade_id = ${id}`;
        if (!r.count) throw new Erro(404, "Apelido não encontrado.");
        return { ok: true, mensagem: "Apelido removido (fica no histórico)." };
      }
      if (op === "rt_incluir" || op === "socio_incluir") {
        const pid = uuid(d.pessoa_id, "pessoa");
        const [p] = await tx`select id from nucleo.pessoa where id = ${pid} and juntada_em is null`;
        if (!p) throw new Erro(404, "Pessoa não encontrada.");
        const de = dataValida(d.de, "data de início");
        if (op === "rt_incluir") {
          const tipo = ["titular", "substituta"].includes(d.tipo) ? d.tipo : null;
          if (!tipo) throw new Erro(400, "Escolha titular ou substituta.");
          if (tipo === "titular") {
            const [t] = await tx`select 1 from nucleo.unidade_rt where unidade_id = ${id} and ate is null and tipo = 'titular'`;
            if (t) throw new Erro(409, "A unidade já tem RT titular vigente. Encerre a atual antes de incluir outra.");
          }
          await tx`insert into nucleo.unidade_rt (unidade_id, pessoa_id, tipo, de, fonte) values (${id}, ${pid}, ${tipo}, ${de}, 'tela')`;
          return { ok: true, mensagem: "RT incluída." };
        }
        await tx`insert into nucleo.socio_unidade (unidade_id, pessoa_id, de, fonte) values (${id}, ${pid}, ${de}, 'tela')`;
        return { ok: true, mensagem: "Sócio incluído." };
      }
      if (op === "rt_encerrar" || op === "socio_encerrar") {
        const rid = uuid(d.id, "registro");
        const ate = dataValida(d.ate, "data de fim");
        const tab = op === "rt_encerrar" ? sql`nucleo.unidade_rt` : sql`nucleo.socio_unidade`;
        const [x] = await tx`select id, de::text de, ate from ${tab} where id = ${rid} and unidade_id = ${id} for update`;
        if (!x) throw new Erro(404, "Registro não encontrado.");
        if (x.ate) throw new Erro(409, "Já está encerrado.");
        if (x.de && ate < x.de) throw new Erro(400, "O fim não pode ser antes do início.");
        await tx`update ${tab} set ate = ${ate} where id = ${rid}`;
        return { ok: true, mensagem: op === "rt_encerrar" ? "RT encerrada." : "Sócio encerrado." };
      }
      if (op === "rt_tipo") {
        const rid = uuid(d.id, "registro");
        const tipo = ["titular", "substituta"].includes(d.tipo) ? d.tipo : null;
        if (!tipo) throw new Erro(400, "Escolha titular ou substituta.");
        if (tipo === "titular") {
          const [t] = await tx`select 1 from nucleo.unidade_rt where unidade_id = ${id} and ate is null and tipo = 'titular' and id <> ${rid}`;
          if (t) throw new Erro(409, "A unidade já tem RT titular vigente.");
        }
        const r = await tx`update nucleo.unidade_rt set tipo = ${tipo} where id = ${rid} and unidade_id = ${id} and ate is null`;
        if (!r.count) throw new Erro(404, "RT vigente não encontrada.");
        return { ok: true, mensagem: "Tipo da RT atualizado." };
      }
      throw new Erro(400, "Alteração desconhecida.");
    }, j);
  }

  // ---------- Pessoas ----------
  async function cadPessoas(c: Ctx, b: any) {
    exige(c);
    const l = await sql`
      select p.id, p.nome, p.ativo, p.juntada_em,
        (select json_agg(json_build_object('conselho', x.conselho, 'registro', x.registro, 'uf', x.uf, 'presc', x.habilitado_prescrever))
           from nucleo.profissional x where x.pessoa_id = p.id) prof,
        (select json_agg(distinct u.nome) from nucleo.unidade_rt r join nucleo.unidade u on u.id = r.unidade_id where r.pessoa_id = p.id and r.ate is null) rt,
        (select count(*) from nucleo.unidade_rt r where r.pessoa_id = p.id and r.ate is not null)::int rt_enc,
        (select json_agg(distinct u.nome) from nucleo.socio_unidade s join nucleo.unidade u on u.id = s.unidade_id where s.pessoa_id = p.id and s.ate is null) socio,
        (select json_agg(distinct u.nome) from nucleo.prescritor_unidade x join nucleo.unidade u on u.id = x.unidade_id where x.pessoa_id = p.id) presc_un,
        (select count(*) from nucleo.pendencia_cadastro pc where pc.status = 'aberta' and (pc.pessoa_a = p.id or pc.pessoa_b = p.id))::int pend
      from nucleo.pessoa p order by p.juntada_em is not null, p.nome, p.id`;
    return {
      pessoas: l.map((p) => {
        const reg = (p.prof || []).filter((x: any) => x.registro).map((x: any) => regTxt(x));
        const papeis: string[] = [];
        if (p.rt?.length) papeis.push("RT");
        if ((p.prof || []).some((x: any) => x.presc)) papeis.push("Prescritor");
        if (p.socio?.length) papeis.push("Sócio");
        if (!papeis.length && p.rt_enc) papeis.push("RT (encerrada)");
        return { id: p.id, nome: p.nome, ativo: p.ativo, juntada: !!p.juntada_em, registros: reg, papeis,
                 unidades: [...new Set([...(p.rt || []), ...(p.socio || []), ...(p.presc_un || [])])].sort(), pend: p.pend };
      }),
    };
  }
  async function cadPessoa(c: Ctx, b: any) {
    exige(c);
    const id = uuid(b.pessoa_id, "pessoa");
    const [p] = await sql`select p.id, p.nome, p.outros_nomes, p.ativo, p.obs, p.juntada_em, j.nome juntada_nome
      from nucleo.pessoa p left join nucleo.pessoa j on j.id = p.juntada_em where p.id = ${id}`;
    if (!p) throw new Erro(404, "Pessoa não encontrada.", "nao_encontrado");
    const docs = await sql`select id, tipo, numero, de::text de, ate::text ate from nucleo.pessoa_documento_fiscal where pessoa_id = ${id} order by tipo, de`;
    const prof = await sql`select id, conselho, registro, uf, registro_original, habilitado_prescrever, ativo from nucleo.profissional where pessoa_id = ${id} order by registro is null`;
    const rts = await sql`select r.id, r.unidade_id, u.nome unidade, r.tipo, r.de::text de, r.ate::text ate, r.vinculo, r.cargo from nucleo.unidade_rt r join nucleo.unidade u on u.id = r.unidade_id
      where r.pessoa_id = ${id} order by r.ate is null desc, r.de desc`;
    const socios = await sql`select s.id, s.unidade_id, u.nome unidade, s.de::text de, s.ate::text ate from nucleo.socio_unidade s join nucleo.unidade u on u.id = s.unidade_id where s.pessoa_id = ${id} order by u.nome`;
    const presc = await sql`select x.unidade_id, u.nome unidade, x.fonte from nucleo.prescritor_unidade x join nucleo.unidade u on u.id = x.unidade_id where x.pessoa_id = ${id} order by u.nome`;
    const termos = await sql`select t.unidade_id, u.nome unidade, l.nome lab, t.de::text de, t.ate::text ate from pedidos_novo.termo t join nucleo.unidade u on u.id = t.unidade_id
      join pedidos_novo.laboratorio l on l.id = t.laboratorio_id where t.rt_id = ${id} order by t.de desc`;
    const [rec] = await sql`select count(*)::int n from pedidos_novo.receita where prescritor_id = ${id}`;
    const origens = await sql`select sistema, ref, nome_fonte from nucleo.pessoa_origem where pessoa_id = ${id} order by sistema, ref`;
    const pend = await sql`select id, tipo, descricao from nucleo.pendencia_cadastro where status = 'aberta' and (pessoa_a = ${id} or pessoa_b = ${id})`;
    return {
      pessoa: p,
      documentos: docs.map((d) => ({ ...d, numero: d.tipo === "CPF" ? cpfMasc(d.numero) : d.numero.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") })),
      profissional: prof, rts, socios, prescritor_em: presc, termos, receitas: rec.n, origens, pendencias: pend,
      historico: await historico([id, ...prof.map((x) => x.id), ...docs.map((x) => x.id), ...rts.map((x) => x.id), ...socios.map((x) => x.id)]),
    };
  }
  async function cadSalvarPessoa(c: Ctx, b: any) {
    exige(c);
    const id = uuid(b.pessoa_id, "pessoa");
    const j = just(b.justificativa);
    const d = b.dados && typeof b.dados === "object" ? b.dados : {};
    const op = String(b.op || "");
    return await comAuditoria(c, async (tx) => {
      const [p] = await tx`select id, juntada_em from nucleo.pessoa where id = ${id} for update`;
      if (!p) throw new Erro(404, "Pessoa não encontrada.", "nao_encontrado");
      if (p.juntada_em) throw new Erro(409, "Este cadastro foi juntado a outro; altere o cadastro que ficou.");
      if (op === "dados") {
        const nome = txt(d.nome, 120);
        if (!nome) throw new Erro(400, "Informe o nome.");
        await tx`update nucleo.pessoa set nome = ${nome}, ativo = ${d.ativo !== false}, obs = ${txt(d.obs, 500)} where id = ${id}`;
        return { ok: true, mensagem: "Dados da pessoa salvos." };
      }
      if (op === "registro") {
        const conselho = ["CRBM", "CRM", "CRF", "COREN", "outro"].includes(d.conselho) ? d.conselho : null;
        const registro = String(d.registro || "").replace(/\D/g, "").replace(/^0+/, "") || null;
        if (!conselho || !registro) throw new Erro(400, "Informe o conselho e o número do registro.");
        const uf = txt(d.uf, 2)?.toUpperCase() || null;
        if (uf && !/^[A-Z]{2}$/.test(uf)) throw new Erro(400, "UF inválida (2 letras).");
        const [outro] = await tx`select p.nome from nucleo.profissional x join nucleo.pessoa p on p.id = x.pessoa_id
          where x.conselho = ${conselho} and x.registro = ${registro} and (x.uf is null or ${uf}::text is null or x.uf = ${uf}) and x.pessoa_id <> ${id} limit 1`;
        if (outro) throw new Erro(409, `Esse registro já está no cadastro de ${outro.nome}. Se for a mesma pessoa, use Pendências de cadastro para juntar.`);
        const pid = d.id ? uuid(d.id, "registro") : null;
        const presc = d.habilitado_prescrever === true;
        if (pid) {
          const r = await tx`update nucleo.profissional set conselho = ${conselho}, registro = ${registro}, uf = ${uf}, habilitado_prescrever = ${presc} where id = ${pid} and pessoa_id = ${id}`;
          if (!r.count) throw new Erro(404, "Registro não encontrado.");
        } else {
          await tx`insert into nucleo.profissional (pessoa_id, conselho, registro, uf, habilitado_prescrever) values (${id}, ${conselho}, ${registro}, ${uf}, ${presc})`;
        }
        return { ok: true, mensagem: "Registro profissional salvo." };
      }
      if (op === "documento_incluir") {
        const tipo = d.tipo === "CPF" || d.tipo === "CNPJ" ? d.tipo : null;
        const numero = String(d.numero || "").replace(/\D/g, "");
        if (!tipo || (tipo === "CPF" ? numero.length !== 11 : numero.length !== 14)) throw new Erro(400, "Documento inválido (CPF com 11 números, CNPJ com 14).");
        const de = d.de ? dataValida(d.de, "data de início") : null;
        const [dono] = await tx`select p.nome from nucleo.pessoa_documento_fiscal x join nucleo.pessoa p on p.id = x.pessoa_id where x.tipo = ${tipo} and x.numero = ${numero} and x.pessoa_id <> ${id} limit 1`;
        if (dono) throw new Erro(409, `Esse ${tipo} já está no cadastro de ${dono.nome}. Se for a mesma pessoa, junte os cadastros.`);
        try { await tx`insert into nucleo.pessoa_documento_fiscal (pessoa_id, tipo, numero, de) values (${id}, ${tipo}, ${numero}, ${de})`; }
        catch (e: any) { if (e?.code === "23505") throw new Erro(409, "Esse documento já está nesta pessoa."); throw e; }
        return { ok: true, mensagem: "Documento incluído." };
      }
      throw new Erro(400, "Alteração desconhecida.");
    }, j);
  }

  // ---------- Pendências de cadastro ----------
  async function resumoPessoa(tx: any, id: string | null) {
    if (!id) return null;
    const [p] = await tx`select p.id, p.nome, p.outros_nomes, p.ativo, p.juntada_em,
        (select json_agg(json_build_object('conselho', x.conselho, 'registro', x.registro, 'uf', x.uf, 'original', x.registro_original))
           from nucleo.profissional x where x.pessoa_id = p.id) prof,
        (select json_agg(json_build_object('u', u.nome, 'de', r.de, 'ate', r.ate, 'tipo', r.tipo) order by r.de) from nucleo.unidade_rt r join nucleo.unidade u on u.id = r.unidade_id where r.pessoa_id = p.id) rt,
        (select json_agg(u.nome order by u.nome) from nucleo.socio_unidade s join nucleo.unidade u on u.id = s.unidade_id where s.pessoa_id = p.id) socio,
        (select json_agg(u.nome order by u.nome) from nucleo.prescritor_unidade x join nucleo.unidade u on u.id = x.unidade_id where x.pessoa_id = p.id) presc,
        (select json_agg(o.sistema order by o.sistema) from nucleo.pessoa_origem o where o.pessoa_id = p.id) origens,
        (select count(*) from pedidos_novo.termo t where t.rt_id = p.id)::int termos,
        (select count(*) from pedidos_novo.receita r where r.prescritor_id = p.id)::int receitas
      from nucleo.pessoa p where p.id = ${id}`;
    if (!p) return null;
    return { ...p, registros: (p.prof || []).filter((x: any) => x.registro).map((x: any) => regTxt(x) + (x.original && x.original !== regTxt(x) ? ` (escrito “${x.original}”)` : "")) };
  }
  async function cadPendencias(c: Ctx, b: any) {
    exige(c);
    const st = b.status === "decididas" ? sql`status <> 'aberta'` : sql`status = 'aberta'`;
    const l = await sql`select pc.id, pc.tipo, pc.descricao, pc.pessoa_a, pc.pessoa_b, pc.unidade_id, u.nome unidade, pc.dados, pc.status, pc.justificativa,
        pc.decidido_por, pc.decidido_em::text decidido_em, pc.criado_em::text criado_em
      from nucleo.pendencia_cadastro pc left join nucleo.unidade u on u.id = pc.unidade_id where ${st}
      order by pc.tipo <> 'possivel_duplicada', pc.descricao`;
    const out = [];
    for (const x of l) out.push({ ...x, a: await resumoPessoa(sql, x.pessoa_a), b: await resumoPessoa(sql, x.pessoa_b) });
    const [n] = await sql`select count(*) filter (where status = 'aberta')::int abertas, count(*) filter (where status <> 'aberta')::int decididas from nucleo.pendencia_cadastro`;
    return { pendencias: out, contagem: n };
  }
  // junta "sai" em "fica": tudo que apontava para "sai" passa a apontar para "fica"; "sai" fica inativa, apontando para "fica"
  async function juntar(tx: any, fica: string, sai: string) {
    await tx`update nucleo.profissional set pessoa_id = ${fica} where pessoa_id = ${sai}`;
    // registro sem número que sobrou ao lado de um registro com número: remove o sem número
    await tx`update nucleo.profissional x set habilitado_prescrever = true where pessoa_id = ${fica} and registro is not null
      and exists (select 1 from nucleo.profissional y where y.pessoa_id = ${fica} and y.habilitado_prescrever)`;
    await tx`delete from nucleo.profissional x where x.pessoa_id = ${fica} and x.registro is null
      and (exists (select 1 from nucleo.profissional y where y.pessoa_id = ${fica} and y.registro is not null)
           or x.id <> (select min(y.id::text)::uuid from nucleo.profissional y where y.pessoa_id = ${fica} and y.registro is null))`;
    await tx`update nucleo.unidade_rt set pessoa_id = ${fica} where pessoa_id = ${sai}`;
    await tx`update nucleo.socio_unidade set pessoa_id = ${fica} where pessoa_id = ${sai}`;
    await tx`delete from nucleo.pessoa_documento_fiscal d where d.pessoa_id = ${sai}
      and exists (select 1 from nucleo.pessoa_documento_fiscal e where e.pessoa_id = ${fica} and e.tipo = d.tipo and e.numero = d.numero)`;
    await tx`update nucleo.pessoa_documento_fiscal set pessoa_id = ${fica} where pessoa_id = ${sai}`;
    await tx`insert into nucleo.prescritor_unidade (pessoa_id, unidade_id, fonte) select ${fica}, unidade_id, fonte from nucleo.prescritor_unidade where pessoa_id = ${sai} on conflict do nothing`;
    await tx`delete from nucleo.prescritor_unidade where pessoa_id = ${sai}`;
    await tx`update nucleo.pessoa_origem set pessoa_id = ${fica} where pessoa_id = ${sai}`;
    await tx`update nucleo.usuario set pessoa_id = ${fica} where pessoa_id = ${sai}`;
    await tx`update pedidos_novo.receita set prescritor_id = ${fica} where prescritor_id = ${sai}`;
    await tx`update pedidos_novo.termo set rt_id = ${fica} where rt_id = ${sai}`;
    await tx`update nucleo.pessoa f set outros_nomes = (select coalesce(array_agg(distinct x), '{}') from unnest(f.outros_nomes || s.outros_nomes || array[s.nome]) x
               where nucleo.chave_nome(x) <> nucleo.chave_nome(f.nome)),
             ativo = f.ativo or s.ativo
      from nucleo.pessoa s where f.id = ${fica} and s.id = ${sai}`;
    await tx`update nucleo.pessoa set ativo = false, juntada_em = ${fica} where id = ${sai}`;
    // outras pendências que citavam "sai" passam para "fica"; as que viram repetidas ou da pessoa com ela mesma são encerradas
    const outras = await tx`select id, pessoa_a, pessoa_b from nucleo.pendencia_cadastro where status = 'aberta' and (pessoa_a = ${sai} or pessoa_b = ${sai})`;
    for (const o of outras) {
      const a = o.pessoa_a === sai ? fica : o.pessoa_a, bb = o.pessoa_b === sai ? fica : o.pessoa_b;
      const [rep] = a && bb ? await tx`select 1 from nucleo.pendencia_cadastro where id <> ${o.id} and tipo = 'possivel_duplicada'
        and ((pessoa_a = ${a} and pessoa_b = ${bb}) or (pessoa_a = ${bb} and pessoa_b = ${a}))` : [];
      if (a === bb || rep) {
        await tx`update nucleo.pendencia_cadastro set status = 'resolvida', decidido_em = now(), decidido_por = ${"(junção)"},
                 justificativa = 'Encerrada automaticamente: as pessoas já foram juntadas em outra decisão' where id = ${o.id}`;
      } else {
        await tx`update nucleo.pendencia_cadastro set pessoa_a = ${a}, pessoa_b = ${bb} where id = ${o.id}`;
      }
    }
  }
  async function cadDecidirPendencia(c: Ctx, b: any) {
    exige(c);
    const id = uuid(b.pendencia_id, "pendência");
    const j = just(b.justificativa);
    const dec = String(b.decisao || "");
    return await comAuditoria(c, async (tx) => {
      const [p] = await tx`select * from nucleo.pendencia_cadastro where id = ${id} for update`;
      if (!p) throw new Erro(404, "Pendência não encontrada.");
      if (p.status !== "aberta") throw new Erro(409, "Esta pendência já foi decidida.");
      let status = "";
      if (dec === "juntar") {
        if (p.tipo !== "possivel_duplicada" || !p.pessoa_a || !p.pessoa_b) throw new Erro(400, "Só dá para juntar uma possível duplicada.");
        const fica = b.fica === "b" ? p.pessoa_b : p.pessoa_a, sai = fica === p.pessoa_a ? p.pessoa_b : p.pessoa_a;
        const vivos = await tx`select id from nucleo.pessoa where id in (${fica}, ${sai}) and juntada_em is null`;
        if (vivos.length !== 2) throw new Erro(409, "Uma das pessoas já foi juntada a outra.");
        const regs = await tx`select pessoa_id, conselho, registro from nucleo.profissional where pessoa_id in (${fica}, ${sai}) and registro is not null`;
        const ra = regs.filter((x) => x.pessoa_id === fica), rb = regs.filter((x) => x.pessoa_id === sai);
        if (ra.length && rb.length && !ra.some((x) => rb.some((y) => y.conselho === x.conselho && y.registro === x.registro)) && b.confirmar_registros !== true) {
          throw new Erro(409, "As duas pessoas têm registros diferentes no conselho (" + ra.map((x) => x.conselho + " " + x.registro).join(", ") + " × " +
            rb.map((x) => x.conselho + " " + x.registro).join(", ") + "). Confirme que é a mesma pessoa (um dos registros está errado).", "registros_diferentes");
        }
        await juntar(tx, fica, sai);
        status = "juntadas";
      } else if (dec === "separadas") {
        if (p.tipo !== "possivel_duplicada") throw new Erro(400, "Decisão inválida para este tipo de pendência.");
        status = "mantidas_separadas";
      } else if (dec === "resolvida" || dec === "descartada") {
        status = dec;
      } else throw new Erro(400, "Escolha a decisão.");
      await tx`update nucleo.pendencia_cadastro set status = ${status}, justificativa = ${j}, decidido_por = ${c.email}, decidido_em = now() where id = ${id}`;
      return { ok: true, mensagem: status === "juntadas" ? "Cadastros juntados." : status === "mantidas_separadas" ? "Mantidas separadas." : "Pendência encerrada." };
    }, j);
  }
  async function cadBuscarPessoa(c: Ctx, b: any) {
    exige(c);
    const q = String(b.busca || "").trim();
    if (q.length < 2) return { pessoas: [] };
    const l = await sql`select p.id, p.nome, (select string_agg(x.conselho || ' ' || x.registro, ', ') from nucleo.profissional x where x.pessoa_id = p.id and x.registro is not null) reg
      from nucleo.pessoa p where p.juntada_em is null and (nucleo.norm(p.nome) like ${"%" + q.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9]+/g, " ").trim() + "%"}
        or exists (select 1 from nucleo.profissional x where x.pessoa_id = p.id and x.registro = ${q.replace(/\D/g, "").replace(/^0+/, "") || "-"}))
      order by p.nome limit 20`;
    return { pessoas: l };
  }

  return {
    cad_unidades: cadUnidades, cad_unidade: cadUnidade, cad_salvar_unidade: cadSalvarUnidade,
    cad_pessoas: cadPessoas, cad_pessoa: cadPessoa, cad_salvar_pessoa: cadSalvarPessoa, cad_buscar_pessoa: cadBuscarPessoa,
    cad_pendencias: cadPendencias, cad_decidir_pendencia: cadDecidirPendencia,
  } as Record<string, (c: Ctx, b: any) => Promise<unknown>>;
}
