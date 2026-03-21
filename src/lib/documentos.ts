// ============================================================
// DR HAIR — Sistema de Geração de Documentos Clínicos
// ============================================================

export type TipoDocumento =
  | "anamnese-tcle"
  | "consentimento-foto"
  | "plano-terapeutico"
  | "prontuario-sessao"
  | "orientacoes-homecare"
  | "relatorio-reavaliacao"
  | "relatorio-final";

// ---------- helpers ----------

function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return (
    dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function safeJSON(val: string | null | undefined): unknown {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function checkbox(checked: boolean | undefined | null): string {
  return checked ? "&#9746;" : "&#9744;";
}

function renderList(items: unknown): string {
  if (!items) return "—";
  if (Array.isArray(items)) return items.join(", ");
  if (typeof items === "string") return items;
  return JSON.stringify(items);
}

// ---------- base layout ----------

function baseLayout(titulo: string, conteudo: string, dataDoc?: Date | string): string {
  const agora = dataDoc ? formatDateTime(dataDoc) : formatDateTime(new Date());

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${titulo} — DR HAIR</title>
<style>
  /* Reset */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 11pt;
    color: #1a1a1a;
    line-height: 1.5;
    padding: 20mm 15mm;
  }

  .header {
    text-align: center;
    border-bottom: 2px solid #1a5276;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .header h1 {
    font-size: 22pt;
    color: #1a5276;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }
  .header .subtitle {
    font-size: 9pt;
    color: #555;
  }

  .doc-title {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    color: #1a5276;
    margin: 16px 0 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .section {
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 11pt;
    font-weight: bold;
    color: #1a5276;
    border-bottom: 1px solid #b0c4de;
    padding-bottom: 3px;
    margin-bottom: 8px;
  }

  table.data {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  table.data th, table.data td {
    border: 1px solid #ccc;
    padding: 5px 8px;
    text-align: left;
    font-size: 10pt;
  }
  table.data th {
    background: #eaf2f8;
    font-weight: 600;
    color: #1a5276;
    width: 30%;
  }

  .checklist-item {
    margin: 4px 0;
    font-size: 10pt;
  }

  .signatures {
    margin-top: 40px;
    page-break-inside: avoid;
  }
  .sig-row {
    display: flex;
    justify-content: space-between;
    gap: 40px;
    margin-top: 30px;
  }
  .sig-block {
    flex: 1;
    text-align: center;
  }
  .sig-line {
    border-top: 1px solid #333;
    padding-top: 4px;
    font-size: 9pt;
    color: #333;
  }

  .footer {
    margin-top: 30px;
    text-align: right;
    font-size: 9pt;
    color: #666;
  }

  @media print {
    body { padding: 15mm 12mm; }
    .header { page-break-after: avoid; }
    .signatures { page-break-inside: avoid; }
    @page { margin: 10mm; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>DR HAIR</h1>
    <div class="subtitle">Clínica de Terapia Capilar Avançada</div>
    <div class="subtitle">Rua Exemplo, 123 — Centro — São Paulo/SP — Tel: (11) 9999-0000</div>
  </div>

  <div class="doc-title">${titulo}</div>

  ${conteudo}

  <div class="footer">
    Documento gerado em ${agora}
  </div>
</body>
</html>`;
}

function pacienteSection(paciente: {
  nome?: string;
  cpf?: string;
  dataNascimento?: string | Date;
}): string {
  return `
  <div class="section">
    <div class="section-title">Dados do Paciente</div>
    <table class="data">
      <tr><th>Nome</th><td>${paciente.nome ?? "—"}</td></tr>
      <tr><th>CPF</th><td>${formatCPF(paciente.cpf ?? "")}</td></tr>
      <tr><th>Data de Nascimento</th><td>${formatDate(paciente.dataNascimento)}</td></tr>
    </table>
  </div>`;
}

function signaturas3(): string {
  return `
  <div class="signatures">
    <div class="sig-row">
      <div class="sig-block">
        <div class="sig-line">Paciente</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Biomédica</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Prescritora: Dra. Maria Eugênia R. Beirão — CRBM/5 9078</div>
      </div>
    </div>
  </div>`;
}

function signaturas2(label1 = "Paciente", label2 = "Biomédica"): string {
  return `
  <div class="signatures">
    <div class="sig-row">
      <div class="sig-block">
        <div class="sig-line">${label1}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">${label2}</div>
      </div>
    </div>
  </div>`;
}

function signaturas1(label = "Paciente"): string {
  return `
  <div class="signatures">
    <div class="sig-row">
      <div class="sig-block" style="max-width:50%;margin:0 auto;">
        <div class="sig-line">${label}</div>
      </div>
    </div>
  </div>`;
}

// ============================================================
// 1. ANAMNESE + TCLE
// ============================================================
export function gerarAnameseTCLE(dados: Record<string, unknown>): string {
  const pac = (dados.paciente ?? dados) as Record<string, unknown>;
  const anamnese = (dados.anamnese ?? {}) as Record<string, unknown>;
  const tcle = (dados.tcle ?? {}) as Record<string, unknown>;

  const queixas = safeJSON(anamnese.queixasConfirmadas as string);
  const saude = safeJSON(anamnese.saudeConfirmada as string);
  const alergias = safeJSON(anamnese.alergiasConfirmadas as string);
  const meds = safeJSON(anamnese.medsConfirmados as string);

  const conteudo = `
  ${pacienteSection(pac as { nome?: string; cpf?: string; dataNascimento?: string | Date })}

  <div class="section">
    <div class="section-title">1. Dados Confirmados (Pré-Atendimento M1)</div>
    <table class="data">
      <tr><th>Queixas Confirmadas</th><td>${renderList(queixas)}</td></tr>
      <tr><th>Condições de Saúde</th><td>${renderList(saude)}</td></tr>
      <tr><th>Alergias</th><td>${renderList(alergias)}</td></tr>
      <tr><th>Medicamentos em Uso</th><td>${renderList(meds)}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">2. Classificações</div>
    <table class="data">
      <tr><th>Hamilton-Norwood (HN)</th><td>${anamnese.classificacaoHN ?? "—"}</td></tr>
      <tr><th>Ludwig</th><td>${anamnese.classificacaoLudwig ?? "—"}</td></tr>
      <tr><th>Olsen</th><td>${anamnese.classificacaoOlsen ?? "—"}</td></tr>
      <tr><th>Fitzpatrick</th><td>${anamnese.classificacaoFitzpatrick ?? "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">3. Testes Clínicos</div>
    <table class="data">
      <tr><th>Pull Test</th><td>${anamnese.pullTest ?? "—"} ${anamnese.pullTestTexto ? "— " + anamnese.pullTestTexto : ""}</td></tr>
      <tr><th>Card Test</th><td>${anamnese.cardTest ?? "—"}</td></tr>
      <tr><th>Tug Test</th><td>${anamnese.tugTest ?? "—"}</td></tr>
      <tr><th>Wash Test</th><td>${anamnese.washTest ?? "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">4. Anamnese Complementar</div>
    <table class="data">
      <tr><th>Tempo de Queda Detalhado</th><td>${anamnese.tempoQuedaDetalhado ?? "—"}</td></tr>
      <tr><th>Evolução</th><td>${anamnese.evolucao ?? "—"}</td></tr>
      <tr><th>Doenças de Pele</th><td>${anamnese.doencasPele ?? "—"}</td></tr>
      <tr><th>Cirurgias Anteriores</th><td>${anamnese.cirurgiasAnteriores ?? "—"}</td></tr>
      <tr><th>Sono</th><td>${anamnese.sono ?? "—"}</td></tr>
      <tr><th>Alimentação</th><td>${anamnese.alimentacao ?? "—"}</td></tr>
      <tr><th>Atividade Física</th><td>${anamnese.atividadeFisica ?? "—"}</td></tr>
      <tr><th>Água/dia</th><td>${anamnese.aguaDia ?? "—"}</td></tr>
      <tr><th>Escala de Dor Pré</th><td>${anamnese.escalaDorPre ?? "—"}</td></tr>
      <tr><th>Tolerância à Dor</th><td>${anamnese.toleranciaDor ?? "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">5. Termo de Consentimento Livre e Esclarecido (TCLE)</div>
    <p class="checklist-item">${checkbox(tcle.informadoProcedimento as boolean)} Fui informado(a) sobre o procedimento, sua natureza, objetivos e técnica utilizada.</p>
    <p class="checklist-item">${checkbox(tcle.informadoEfeitos as boolean)} Fui informado(a) sobre os possíveis efeitos colaterais e complicações.</p>
    <p class="checklist-item">${checkbox(tcle.informadoContraind as boolean)} Fui informado(a) sobre as contraindicações ao procedimento.</p>
    <p class="checklist-item">${checkbox(tcle.declarouAlergias as boolean)} Declarei todas as minhas alergias conhecidas.</p>
    <p class="checklist-item">${checkbox(tcle.autorizouFotos as boolean)} Autorizo o registro fotográfico para acompanhamento clínico.</p>
    <p class="checklist-item">${checkbox(tcle.recebeuHomeCare as boolean)} Recebi orientações sobre o kit home care e cuidados pós-procedimento.</p>
    <br/>
    <p style="font-size:10pt;">Declaro que li, compreendi e concordo com todas as informações acima, autorizando a realização do procedimento de terapia capilar conforme descrito.</p>
  </div>

  ${signaturas3()}`;

  return baseLayout("Anamnese + TCLE", conteudo);
}

// ============================================================
// 2. CONSENTIMENTO FOTOGRÁFICO
// ============================================================
export function gerarConsentimentoFoto(dados: Record<string, unknown>): string {
  const pac = (dados.paciente ?? dados) as Record<string, unknown>;
  const cons = (dados.consentimento ?? {}) as Record<string, unknown>;

  const conteudo = `
  ${pacienteSection(pac as { nome?: string; cpf?: string; dataNascimento?: string | Date })}

  <div class="section">
    <div class="section-title">Termo de Consentimento para Uso de Imagem</div>
    <p style="margin-bottom:12px;font-size:10pt;">
      Eu, <strong>${pac.nome ?? "_______________"}</strong>, portador(a) do CPF nº <strong>${formatCPF((pac.cpf as string) ?? "")}</strong>,
      declaro que autorizo o uso das imagens fotográficas e/ou de vídeo captadas durante meu tratamento
      na clínica DR HAIR, conforme as finalidades abaixo assinaladas:
    </p>

    <p class="checklist-item">${checkbox(cons.prontuario as boolean)} <strong>Prontuário Médico</strong> — Uso exclusivo no meu prontuário clínico para acompanhamento do tratamento. <em>(Obrigatório)</em></p>
    <p class="checklist-item">${checkbox(cons.cientifico as boolean)} <strong>Fins Científicos</strong> — Uso em publicações, congressos e estudos científicos, sem identificação nominal.</p>
    <p class="checklist-item">${checkbox(cons.educacional as boolean)} <strong>Fins Educacionais</strong> — Uso em materiais de treinamento e capacitação profissional.</p>
    <p class="checklist-item">${checkbox(cons.comercialAnon as boolean)} <strong>Fins Comerciais (Anonimizado)</strong> — Uso em materiais de divulgação da clínica, sem identificação do paciente.</p>
    <p class="checklist-item">${checkbox(cons.comercialSemAnon as boolean)} <strong>Fins Comerciais (Com Identificação)</strong> — Uso em materiais de divulgação com nome e/ou rosto visíveis.</p>
    <p class="checklist-item">${checkbox(cons.naoAutoriza as boolean)} <strong>Não Autorizo</strong> — Não autorizo nenhum uso além do prontuário médico.</p>

    <br/>
    <p style="font-size:10pt;">Este consentimento pode ser revogado a qualquer momento mediante comunicação formal à clínica.</p>
  </div>

  ${signaturas2("Paciente", "Biomédica")}`;

  return baseLayout("Consentimento para Uso de Imagem", conteudo);
}

// ============================================================
// 3. PLANO TERAPÊUTICO
// ============================================================
export function gerarPlanoTerapeutico(dados: Record<string, unknown>): string {
  const pac = (dados.paciente ?? dados) as Record<string, unknown>;
  const plano = (dados.plano ?? {}) as Record<string, unknown>;
  const mescla = safeJSON(plano.mescla as string) as Array<Record<string, unknown>> | null;

  const conteudo = `
  ${pacienteSection(pac as { nome?: string; cpf?: string; dataNascimento?: string | Date })}

  <div class="section">
    <div class="section-title">1. Diagnóstico</div>
    <table class="data">
      <tr><th>Diagnóstico Principal</th><td>${plano.diagnosticoPrincipal ?? "—"}</td></tr>
      <tr><th>Diagnósticos Secundários</th><td>${plano.diagnosticosSecundarios ?? "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">2. Trilha Terapêutica</div>
    <table class="data">
      <tr><th>Trilha Selecionada</th><td>${plano.trilha ?? "—"}</td></tr>
      <tr><th>Nº de Sessões</th><td>${plano.numSessoes ?? "—"}</td></tr>
      <tr><th>Frequência</th><td>${plano.frequencia ?? "—"}</td></tr>
      <tr><th>Intervalo entre Sessões</th><td>${plano.intervalo ?? "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">3. Composição da Mescla</div>
    ${
      mescla && Array.isArray(mescla)
        ? `<table class="data">
      <tr><th>Substância</th><th>Concentração</th><th>Volume</th></tr>
      ${mescla
        .map(
          (s) =>
            `<tr><td>${s.nome ?? s.substancia ?? "—"}</td><td>${s.concentracao ?? "—"}</td><td>${s.volume ?? "—"}</td></tr>`
        )
        .join("")}
    </table>`
        : `<p>${renderList(mescla)}</p>`
    }
  </div>

  <div class="section">
    <div class="section-title">4. Cronograma</div>
    <p>${plano.cronograma ?? "A ser definido conforme evolução clínica."}</p>
  </div>

  <div class="section">
    <div class="section-title">5. Expectativas por Fase</div>
    <p>${plano.expectativas ?? "Orientações serão fornecidas a cada etapa do tratamento."}</p>
  </div>

  ${signaturas3()}`;

  return baseLayout("Plano Terapêutico", conteudo);
}

// ============================================================
// 4. PRONTUÁRIO DE SESSÃO
// ============================================================
export function gerarProntuarioSessao(dados: Record<string, unknown>): string {
  const pac = (dados.paciente ?? dados) as Record<string, unknown>;
  const sessao = (dados.sessao ?? {}) as Record<string, unknown>;

  const checklistPre = safeJSON(sessao.checklistPre as string) as
    | Record<string, unknown>[]
    | Record<string, unknown>
    | null;
  const perguntas = safeJSON(sessao.perguntasRecorrentes as string) as
    | Record<string, unknown>[]
    | Record<string, unknown>
    | null;
  const checklistMescla = safeJSON(sessao.checklistMescla as string) as
    | Record<string, unknown>[]
    | null;
  const checklistLED = safeJSON(sessao.checklistLED as string) as
    | Record<string, unknown>
    | null;
  const checklistPos = safeJSON(sessao.checklistPos as string) as
    | Record<string, unknown>[]
    | Record<string, unknown>
    | null;

  function renderChecklist(items: unknown): string {
    if (!items) return "<p>—</p>";
    if (Array.isArray(items)) {
      return items
        .map(
          (item) =>
            `<p class="checklist-item">${checkbox((item as Record<string, unknown>).marcado as boolean || (item as Record<string, unknown>).checked as boolean)} ${(item as Record<string, unknown>).label ?? (item as Record<string, unknown>).nome ?? (item as Record<string, unknown>).item ?? JSON.stringify(item)}</p>`
        )
        .join("");
    }
    if (typeof items === "object" && items !== null) {
      return Object.entries(items as Record<string, unknown>)
        .map(
          ([k, v]) =>
            `<p class="checklist-item">${checkbox(!!v)} ${k}</p>`
        )
        .join("");
    }
    return `<p>${String(items)}</p>`;
  }

  function renderPerguntas(items: unknown): string {
    if (!items) return "<p>—</p>";
    if (Array.isArray(items)) {
      return `<table class="data">
        <tr><th style="width:5%">#</th><th style="width:55%">Pergunta</th><th>Resposta</th></tr>
        ${items
          .map(
            (item, idx) =>
              `<tr><td>${idx + 1}</td><td>${(item as Record<string, unknown>).pergunta ?? (item as Record<string, unknown>).label ?? "—"}</td><td>${(item as Record<string, unknown>).resposta ?? (item as Record<string, unknown>).valor ?? "—"}</td></tr>`
          )
          .join("")}
      </table>`;
    }
    if (typeof items === "object" && items !== null) {
      return `<table class="data">
        <tr><th>Pergunta</th><th>Resposta</th></tr>
        ${Object.entries(items as Record<string, unknown>)
          .map(([k, v]) => `<tr><td>${k}</td><td>${String(v)}</td></tr>`)
          .join("")}
      </table>`;
    }
    return `<p>${String(items)}</p>`;
  }

  const conteudo = `
  ${pacienteSection(pac as { nome?: string; cpf?: string; dataNascimento?: string | Date })}

  <div class="section">
    <div class="section-title">Sessão ${sessao.numSessao ?? "—"} / ${sessao.totalSessoes ?? "—"}</div>
    <table class="data">
      <tr><th>Data</th><td>${formatDateTime(sessao.createdAt as string)}</td></tr>
      <tr><th>Identidade Confirmada</th><td>${sessao.identidadeConfirmada ? "Sim" : "Não"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">1. Checklist Pré-Procedimento</div>
    ${renderChecklist(checklistPre)}
  </div>

  <div class="section">
    <div class="section-title">2. Perguntas Recorrentes</div>
    ${renderPerguntas(perguntas)}
  </div>

  <div class="section">
    <div class="section-title">3. Checklist da Mescla</div>
    ${
      checklistMescla && Array.isArray(checklistMescla)
        ? `<table class="data">
      <tr><th>Substância</th><th>Marcado</th><th>Lote</th><th>Validade</th></tr>
      ${checklistMescla
        .map(
          (s) =>
            `<tr><td>${s.substancia ?? s.nome ?? "—"}</td><td>${s.marcado ? "Sim" : "Não"}</td><td>${s.lote ?? "—"}</td><td>${s.validade ?? "—"}</td></tr>`
        )
        .join("")}
    </table>
    <p><strong>Volume Total:</strong> ${sessao.volumeTotal ?? "—"} mL</p>`
        : renderChecklist(checklistMescla)
    }
  </div>

  <div class="section">
    <div class="section-title">4. LEDterapia</div>
    <table class="data">
      <tr><th>Tempo</th><td>${sessao.tempoLED ? sessao.tempoLED + " min" : "—"}</td></tr>
      <tr><th>Dose</th><td>${sessao.doseLED ? sessao.doseLED + " J/cm²" : "—"}</td></tr>
      <tr><th>Intercorrências</th><td>${sessao.intercorrenciasLED ?? "Nenhuma"}</td></tr>
    </table>
    ${checklistLED ? renderChecklist(checklistLED) : ""}
  </div>

  <div class="section">
    <div class="section-title">5. Escala de Dor Pós-Procedimento</div>
    <p><strong>Dor:</strong> ${sessao.dorPos ?? "—"} / 10</p>
  </div>

  <div class="section">
    <div class="section-title">6. Checklist Pós-Procedimento</div>
    ${renderChecklist(checklistPos)}
  </div>

  <div class="section">
    <div class="section-title">7. Observações</div>
    <p>${sessao.observacoes ?? "Sem observações adicionais."}</p>
  </div>

  ${signaturas2("Paciente", "Biomédica")}`;

  return baseLayout(`Prontuário de Sessão ${sessao.numSessao ?? ""}/${sessao.totalSessoes ?? ""}`, conteudo);
}

// ============================================================
// 5. ORIENTAÇÕES HOME CARE
// ============================================================
export function gerarOrientacoesHomeCare(dados: Record<string, unknown>): string {
  const pac = (dados.paciente ?? dados) as Record<string, unknown>;
  const contrato = (dados.contrato ?? {}) as Record<string, unknown>;
  const kitHomeCare = safeJSON(contrato.kitHomeCare as string) as Record<string, unknown> | null;

  const orientacoes = (dados.orientacoes ?? {}) as Record<string, unknown>;

  const conteudo = `
  ${pacienteSection(pac as { nome?: string; cpf?: string; dataNascimento?: string | Date })}

  <div class="section">
    <div class="section-title">1. Kit Home Care</div>
    ${
      kitHomeCare && typeof kitHomeCare === "object"
        ? `<table class="data">
      <tr><th>Tipo</th><td>${(kitHomeCare as Record<string, unknown>).tipo ?? "—"}</td></tr>
      <tr><th>Entrega</th><td>${(kitHomeCare as Record<string, unknown>).entrega ?? "—"}</td></tr>
    </table>`
        : `<p>${kitHomeCare ? renderList(kitHomeCare) : "Kit padrão DR HAIR"}</p>`
    }
    ${
      orientacoes.conteudoKit
        ? `<div style="margin-top:8px;"><strong>Conteúdo do Kit:</strong></div>
        <p>${renderList(orientacoes.conteudoKit)}</p>`
        : ""
    }
  </div>

  <div class="section">
    <div class="section-title">2. Instruções de Uso</div>
    ${
      orientacoes.instrucoes
        ? `<p>${renderList(orientacoes.instrucoes)}</p>`
        : `<ul style="padding-left:20px;font-size:10pt;">
      <li>Utilizar o shampoo antiqueda conforme orientação, massageando o couro cabeludo por 2-3 minutos.</li>
      <li>Aplicar o tônico capilar nas áreas indicadas, 1 vez ao dia, preferencialmente à noite.</li>
      <li>Utilizar o suplemento oral conforme posologia indicada.</li>
      <li>Não lavar os cabelos nas primeiras 24 horas após cada sessão.</li>
      <li>Evitar uso de chapéus, bonés ou gorros apertados nas primeiras 48 horas após o procedimento.</li>
    </ul>`
    }
  </div>

  <div class="section">
    <div class="section-title">3. Cuidados e Recomendações</div>
    ${
      orientacoes.cuidados
        ? `<p>${renderList(orientacoes.cuidados)}</p>`
        : `<ul style="padding-left:20px;font-size:10pt;">
      <li>Manter alimentação equilibrada e ingestão adequada de água (mínimo 2L/dia).</li>
      <li>Evitar tabagismo e consumo excessivo de álcool.</li>
      <li>Procurar manter rotina de sono regular (7-8 horas).</li>
      <li>Comunicar imediatamente qualquer reação adversa (coceira intensa, vermelhidão, inchaço).</li>
      <li>Comparecer às sessões nos intervalos programados para garantir a eficácia do tratamento.</li>
      <li>Evitar exposição solar intensa no couro cabeludo sem proteção.</li>
      <li>Não interromper o uso do kit home care sem orientação da equipe.</li>
    </ul>`
    }
  </div>

  <p style="margin-top:16px;font-size:10pt;">Declaro que recebi as orientações acima e me comprometo a segui-las durante todo o período de tratamento.</p>

  ${signaturas1("Paciente")}`;

  return baseLayout("Orientações de Home Care", conteudo);
}

// ============================================================
// 6. RELATÓRIO DE REAVALIAÇÃO (5ª sessão)
// ============================================================
export function gerarRelatorioReavaliacao(dados: Record<string, unknown>): string {
  const pac = (dados.paciente ?? dados) as Record<string, unknown>;
  const sessao = (dados.sessao ?? {}) as Record<string, unknown>;
  const extras = safeJSON(sessao.extras5sessao as string) as Record<string, unknown> | null;

  const conteudo = `
  ${pacienteSection(pac as { nome?: string; cpf?: string; dataNascimento?: string | Date })}

  <div class="section">
    <div class="section-title">Reavaliação — Sessão ${sessao.numSessao ?? 5} / ${sessao.totalSessoes ?? "—"}</div>
    <table class="data">
      <tr><th>Data da Reavaliação</th><td>${formatDateTime(sessao.createdAt as string)}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">1. Comparação Fotográfica</div>
    <table class="data">
      <tr>
        <th style="width:50%;text-align:center;">Antes (Início do Tratamento)</th>
        <th style="width:50%;text-align:center;">Atual (5ª Sessão)</th>
      </tr>
      <tr>
        <td style="text-align:center;height:120px;color:#999;">[Foto Inicial]</td>
        <td style="text-align:center;height:120px;color:#999;">[Foto Atual]</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">2. Comparação Tricoscópica</div>
    <table class="data">
      <tr>
        <th style="width:50%;text-align:center;">Tricoscopia Inicial</th>
        <th style="width:50%;text-align:center;">Tricoscopia Atual</th>
      </tr>
      <tr>
        <td style="text-align:center;height:100px;color:#999;">[Imagem Tricoscopia Inicial]</td>
        <td style="text-align:center;height:100px;color:#999;">[Imagem Tricoscopia Atual]</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">3. Avaliação de Densidade</div>
    <table class="data">
      <tr><th>Comparação de Densidade</th><td>${extras?.comparacao ?? extras?.densidade ?? "—"}</td></tr>
      <tr><th>Pull Test (Reavaliação)</th><td>${extras?.pullTest ?? "—"}</td></tr>
      <tr><th>Melhora Observada</th><td>${extras?.melhora ?? "A avaliar"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">4. Ajustes no Tratamento</div>
    <p>${extras?.ajuste ?? extras?.ajustes ?? "Sem ajustes necessários neste momento."}</p>
  </div>

  <div class="section">
    <div class="section-title">5. Observações</div>
    <p>${sessao.observacoes ?? "Sem observações adicionais."}</p>
  </div>

  ${signaturas2("Paciente", "Biomédica")}`;

  return baseLayout("Relatório de Reavaliação", conteudo);
}

// ============================================================
// 7. RELATÓRIO FINAL
// ============================================================
export function gerarRelatorioFinal(dados: Record<string, unknown>): string {
  const pac = (dados.paciente ?? dados) as Record<string, unknown>;
  const alta = (dados.alta ?? {}) as Record<string, unknown>;

  const conteudo = `
  ${pacienteSection(pac as { nome?: string; cpf?: string; dataNascimento?: string | Date })}

  <div class="section">
    <div class="section-title">1. Resultado Geral</div>
    <table class="data">
      <tr><th>Resultado</th><td style="font-size:13pt;font-weight:bold;color:${
        alta.resultadoGeral === "Excelente"
          ? "#27ae60"
          : alta.resultadoGeral === "Bom"
            ? "#2980b9"
            : alta.resultadoGeral === "Moderado"
              ? "#f39c12"
              : "#e74c3c"
      };">${alta.resultadoGeral ?? "—"}</td></tr>
      <tr><th>Data da Alta</th><td>${formatDate(alta.dataAlta as string)}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">2. Evolução Clínica</div>
    <p>${alta.evolucaoClinica ?? "—"}</p>
  </div>

  <div class="section">
    <div class="section-title">3. Classificação Final</div>
    <p>${alta.classificacaoFinal ?? "—"}</p>
  </div>

  <div class="section">
    <div class="section-title">4. Encaminhamentos</div>
    <p>${alta.encaminhamento ?? "Sem encaminhamentos."}</p>
  </div>

  <div class="section">
    <div class="section-title">5. Recomendações</div>
    <p>${alta.orientacoes ?? "Manter acompanhamento conforme orientações fornecidas durante o tratamento."}</p>
  </div>

  ${signaturas3()}`;

  return baseLayout("Relatório Final de Tratamento", conteudo);
}

// ============================================================
// DISPATCHER
// ============================================================
const geradores: Record<TipoDocumento, (dados: Record<string, unknown>) => string> = {
  "anamnese-tcle": gerarAnameseTCLE,
  "consentimento-foto": gerarConsentimentoFoto,
  "plano-terapeutico": gerarPlanoTerapeutico,
  "prontuario-sessao": gerarProntuarioSessao,
  "orientacoes-homecare": gerarOrientacoesHomeCare,
  "relatorio-reavaliacao": gerarRelatorioReavaliacao,
  "relatorio-final": gerarRelatorioFinal,
};

export function gerarDocumento(tipo: TipoDocumento, dados: Record<string, unknown>): string {
  const gerador = geradores[tipo];
  if (!gerador) {
    throw new Error(`Tipo de documento desconhecido: ${tipo}`);
  }
  return gerador(dados);
}
