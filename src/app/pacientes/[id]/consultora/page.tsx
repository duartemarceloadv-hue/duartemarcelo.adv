"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Eye, Sparkles, Upload, Loader2, AlertTriangle } from "lucide-react";

const PASSOS_8 = [
  { num: 1, titulo: "Acolhimento", desc: "Cumprimentar pelo nome, escutar antes de falar" },
  { num: 2, titulo: "Entendimento da Queixa", desc: "Explorar queixas e condições do M1" },
  { num: 3, titulo: "Tricoscopia", desc: "Examinar couro e mostrar achados ao paciente" },
  { num: 4, titulo: "Apresentação dos Achados", desc: "Conectar achados ao que o paciente sente" },
  { num: 5, titulo: "Apresentação do Protocolo", desc: "Trilha personalizada com 6 substâncias" },
  { num: 6, titulo: "Expectativas e Prazos", desc: "Realismo + otimismo, metas por sessão" },
  { num: 7, titulo: "Manejo de Objeções", desc: "Antecipar e quebrar objeções previstas" },
  { num: 8, titulo: "Fechamento", desc: "Oferecer opções de pagamento, decidir" },
];

const HN_OPCOES = ["I", "II", "IIa", "III", "IIIa", "IIIv", "IV", "IVa", "V", "Va", "VI", "VII"];
const OLSEN_OPCOES = ["Leve", "Moderada", "Severa"];
const DIAG_OPCOES = ["AGA", "Eflúvio Telógeno", "Alopecia Seborreica", "Alopecia Areata", "Mista"];
const PACOTE_OPCOES = ["Protocolo Inicial 10s", "Intensivo 12s", "Básico 8s", "Manutenção 6s", "Personalizado"];
const OBJECAO_OPCOES = ["Preço", "Vou pensar", "Cônjuge", "Já tentei", "Shampoo resolve", "Genética", "Sem tempo", "Resultado antes", "Mais barato", "Colateral", "Não tá ruim", "Sem cartão"];

// 11 campos da IA tricoscopia
const IA_CAMPOS = [
  { key: "miniaturizacao", label: "Miniaturização", opts: ["Leve", "Moderada", "Severa", "Ausente"] },
  { key: "inflamacao", label: "Inflamação", opts: ["Presente", "Ausente", "Leve"] },
  { key: "densidade", label: "Densidade", opts: ["Normal", "Reduzida", "Muito reduzida"] },
  { key: "oleosidade", label: "Oleosidade", opts: ["Normal", "Aumentada", "Excessiva"] },
  { key: "caspa", label: "Caspa/Descamação", opts: ["Presente", "Ausente"] },
  { key: "calibre", label: "Calibre dos fios", opts: ["Normal", "Fino", "Misto", "Muito fino"] },
  { key: "pontosAmarelos", label: "Pontos amarelos", opts: ["Presente", "Ausente"] },
  { key: "vasos", label: "Vasos/Vascularização", opts: ["Normal", "Alterada"] },
  { key: "condicaoFoliculo", label: "Condição do folículo", opts: ["Saudável", "Comprometido", "Atrófico"] },
  { key: "cicatrizacao", label: "Cicatrização", opts: ["Normal", "Fibrose", "Ausente"] },
  { key: "diagnosticoIA", label: "Diagnóstico sugerido", opts: ["AGA", "Eflúvio Telógeno", "Alopecia Seborreica", "Alopecia Areata", "Mista", "Inconclusivo"] },
];

export default function ConsultoraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Record<string, unknown> | null>(null);
  const [briefingId, setBriefingId] = useState<number | null>(null);
  const [briefingAberto, setBriefingAberto] = useState(false);
  const [paciente, setPaciente] = useState<Record<string, unknown> | null>(null);
  const [preAtendimento, setPreAtendimento] = useState<Record<string, unknown> | null>(null);

  // Checklist 8 passos
  const [identidade, setIdentidade] = useState(false);
  const [passosCheck, setPassosCheck] = useState<boolean[]>(new Array(8).fill(false));
  const [passoObs, setPassoObs] = useState<Record<number, string>>({});
  const [secaoAberta, setSecaoAberta] = useState<string>("briefing");

  // Tricoscopia IA
  const [fotoUrl, setFotoUrl] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaResultado, setIaResultado] = useState<Record<string, string>>({});
  const [classificacaoHN, setClassificacaoHN] = useState("");
  const [classificacaoOlsen, setClassificacaoOlsen] = useState("");
  const [diagnostico, setDiagnostico] = useState<string[]>([]);

  // Avaliação
  const [avaliacao, setAvaliacao] = useState("");
  const [pacote, setPacote] = useState("");
  const [valor, setValor] = useState("");
  const [numSessoes, setNumSessoes] = useState("");

  // Objeções
  const [objecoes, setObjecoes] = useState<string[]>([]);

  // Decisão
  const [decisao, setDecisao] = useState("");
  const [motivoNao, setMotivoNao] = useState("");
  const [followupData, setFollowupData] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    const res = await fetch(`/api/pacientes/${id}`);
    const data = await res.json();
    setPaciente(data);

    if (data.preAtendimentos?.[0]) {
      const pre = data.preAtendimentos[0];
      setPreAtendimento(pre);
      const preId = pre.id;
      const briefRes = await fetch(`/api/pre-atendimento/${preId}/briefing`);
      if (briefRes.ok) {
        const briefData = await briefRes.json();
        setBriefing(briefData);
        setBriefingId(briefData.id);
      }
    }
  }

  function toggleArr(arr: string[], setArr: (v: string[]) => void, val: string) {
    if (arr.includes(val)) setArr(arr.filter((v) => v !== val));
    else setArr([...arr, val]);
  }

  // Dicas contextuais baseadas no M1
  function getDicaPasso(passo: number): string | null {
    if (!preAtendimento) return null;
    const dados = preAtendimento.dados as Record<string, unknown> | undefined;
    if (!dados) return null;

    switch (passo) {
      case 2: {
        const queixas = (dados.queixas as string[]) || [];
        const condicoes = (dados.condicoesCouro as string[]) || [];
        if (queixas.length > 0 || condicoes.length > 0) {
          return `Queixas: ${queixas.join(", ")}${condicoes.length > 0 ? ` | Condições: ${condicoes.join(", ")}` : ""}`;
        }
        return null;
      }
      case 3: {
        const condicoes = (dados.condicoesCouro as string[]) || [];
        if (condicoes.includes("Caspa") || condicoes.includes("Coceira")) {
          return "Dica: Mostrar inflamação na tricoscopia — caspa/coceira indica processo inflamatório ativo";
        }
        if (condicoes.includes("Oleosidade")) {
          return "Dica: Destacar obstrução folicular por oleosidade na tricoscopia";
        }
        return null;
      }
      case 5: {
        const reprod = dados.reprodutivo as Record<string, string> | undefined;
        if (reprod?.planejaFilhos === "Sim") {
          return "⚠️ Planeja filhos — apresentar protocolo SEM Dutasterida (usar Cafeisilane C)";
        }
        return null;
      }
      case 7: {
        const objecoesProvaveis = briefing?.objecoesProvaveis;
        if (Array.isArray(objecoesProvaveis) && objecoesProvaveis.length > 0) {
          return `Objeções prováveis detectadas do perfil do paciente`;
        }
        return null;
      }
      default:
        return null;
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Simular upload — em produção seria para storage
    const url = URL.createObjectURL(file);
    setFotoUrl(url);
  }

  async function analisarIA() {
    if (!fotoUrl) return;
    setIaLoading(true);
    // Simular resposta IA (em produção = Claude API)
    await new Promise((r) => setTimeout(r, 1500));
    setIaResultado({
      miniaturizacao: "Moderada",
      inflamacao: "Leve",
      densidade: "Reduzida",
      oleosidade: "Aumentada",
      caspa: "Presente",
      calibre: "Fino",
      pontosAmarelos: "Ausente",
      vasos: "Normal",
      condicaoFoliculo: "Comprometido",
      cicatrizacao: "Normal",
      diagnosticoIA: "AGA",
    });
    setIaLoading(false);
  }

  async function handleSubmit() {
    if (!briefingId) {
      alert("Pré-atendimento não encontrado. Complete o M1 primeiro.");
      return;
    }
    setLoading(true);

    const payload = {
      pacienteId: parseInt(id),
      briefingId,
      identidadeConfirmada: identidade,
      checklist8passos: { checks: passosCheck, obs: passoObs },
      tricoscopia: {
        fotoUrl: fotoUrl || null,
        iaAnalise: iaResultado,
        classificacaoHN,
        classificacaoOlsen,
        diagnosticoProvavel: diagnostico.join(", "),
        edicoes: iaResultado,
      },
      avaliacaoRegeneracao: avaliacao,
      pacote,
      valor: valor ? parseFloat(valor) : null,
      numSessoes: numSessoes ? parseInt(numSessoes) : null,
      objecoes,
      decisao,
      motivoNaoFechou: motivoNao,
      followupData: followupData || null,
      observacoes,
    };

    const res = await fetch("/api/consultora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      if (decisao === "Comprou") {
        router.push(`/pacientes/${id}/contrato`);
      } else {
        router.push(`/pacientes/${id}`);
      }
    } else {
      alert("Erro ao salvar consulta");
    }
    setLoading(false);
  }

  function Sec({ sid, titulo, children, badge }: { sid: string; titulo: string; children: React.ReactNode; badge?: string }) {
    const open = secaoAberta === sid;
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button type="button" onClick={() => setSecaoAberta(open ? "" : sid)} className="w-full flex items-center justify-between p-4 text-left">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
            {badge && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">{badge}</span>}
          </div>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
      </div>
    );
  }

  // Objeções prováveis do briefing
  const objecoesProvaveis = (briefing?.objecoesProvaveis as number[]) || [];
  const OBJECAO_MAP: Record<number, string> = { 4: "Já tentei", 6: "Genética", 10: "Colateral", 11: "Não tá ruim" };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">M2 — Consultora</h1>
          <p className="text-sm text-gray-500">Consulta de venda + tricoscopia</p>
        </div>
      </div>

      {/* Card paciente */}
      {paciente && (
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-4">
          <p className="font-semibold text-teal-900">{paciente.nome as string}</p>
          <p className="text-sm text-teal-700">
            CPF: {paciente.cpf as string} | {paciente.celular as string}
          </p>
        </div>
      )}

      {/* Briefing Automático */}
      {briefing && (
        <Sec sid="briefing" titulo="Briefing Automático" badge="IA">
          <div className="space-y-3">
            <div className="bg-purple-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-purple-800 mb-2">Resumo Rápido</h3>
              {(() => {
                try {
                  const resumo = typeof briefing.resumo === "string" ? JSON.parse(briefing.resumo as string) : briefing.resumo;
                  return (
                    <div className="space-y-1">
                      {resumo?.bullets?.map((b: string, i: number) => (
                        <p key={i} className="text-sm text-purple-700">• {b}</p>
                      ))}
                      {resumo?.alertas?.map((a: string, i: number) => (
                        <p key={i} className="text-sm text-red-600 font-medium">{a}</p>
                      ))}
                    </div>
                  );
                } catch {
                  return <p className="text-xs text-gray-500">Briefing disponível</p>;
                }
              })()}
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Trilha Provável</h3>
              <p className="text-sm text-teal-700 font-medium">{briefing.trilhaProvavel as string}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Gatilhos Ativados</h3>
              <p className="text-xs text-gray-600">{briefing.gatilhos as string}</p>
            </div>
            {objecoesProvaveis.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-orange-800 mb-1">Objeções Prováveis</h3>
                <div className="flex flex-wrap gap-1">
                  {objecoesProvaveis.map((oid) => (
                    <span key={oid} className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs rounded-full">
                      🎯 {OBJECAO_MAP[oid] || `#${oid}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Sec>
      )}

      {/* Confirmação de identidade */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={identidade} onChange={(e) => setIdentidade(e.target.checked)} className="h-4 w-4 text-teal-600 rounded" />
          <span className="text-sm font-medium text-gray-900">
            Identidade confirmada por verbalização do paciente (POP-ASS-001)
          </span>
        </label>
      </div>

      {/* Checklist 8 Passos */}
      <Sec sid="passos" titulo="Checklist 8 Passos da Venda" badge="8/8">
        {PASSOS_8.map((p) => {
          const dica = getDicaPasso(p.num);
          return (
            <div key={p.num} className="space-y-2">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={passosCheck[p.num - 1] || false}
                  onChange={(e) => { const n = [...passosCheck]; n[p.num - 1] = e.target.checked; setPassosCheck(n); }}
                  className="h-4 w-4 text-teal-600 rounded mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Passo {p.num}: {p.titulo}
                  </span>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </div>
              </label>
              {dica && (
                <div className="ml-7 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                  <AlertTriangle size={12} className="inline mr-1" />
                  {dica}
                </div>
              )}
              <textarea
                placeholder="Observação deste passo..."
                value={passoObs[p.num] || ""}
                onChange={(e) => setPassoObs({ ...passoObs, [p.num]: e.target.value })}
                rows={1}
                className="ml-7 w-[calc(100%-1.75rem)] px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
          );
        })}
        <p className="text-xs text-gray-500 mt-2">Progresso: {passosCheck.filter(Boolean).length}/8 passos</p>
      </Sec>

      {/* Tricoscopia + IA */}
      <Sec sid="tricoscopia" titulo="Tricoscopia + IA" badge="Claude">
        {/* Upload foto */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Foto da tricoscopia:</p>
            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-400 transition-colors">
              <Upload size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">{fotoUrl ? "Foto carregada ✓" : "Selecionar foto da tricoscopia"}</span>
              <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
            </label>
          </div>

          {fotoUrl && (
            <button
              onClick={analisarIA}
              disabled={iaLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {iaLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {iaLoading ? "Analisando..." : "Analisar com IA (Claude)"}
            </button>
          )}

          {/* 11 campos da IA — editáveis */}
          {Object.keys(iaResultado).length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-purple-800">Resultado IA (editável)</h3>
              {IA_CAMPOS.map((campo) => (
                <div key={campo.key}>
                  <p className="text-xs font-medium text-gray-600 mb-1">{campo.label}:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {campo.opts.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setIaResultado({ ...iaResultado, [campo.key]: opt })}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                          iaResultado[campo.key] === opt
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Classificações manuais */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Classificação Clínica</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Hamilton-Norwood (masculino):</p>
              <div className="flex flex-wrap gap-1.5">
                {HN_OPCOES.map((g) => (
                  <button key={g} type="button" onClick={() => setClassificacaoHN(classificacaoHN === g ? "" : g)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${classificacaoHN === g ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Olsen (feminino):</p>
              <div className="flex gap-1.5">
                {OLSEN_OPCOES.map((g) => (
                  <button key={g} type="button" onClick={() => setClassificacaoOlsen(classificacaoOlsen === g ? "" : g)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${classificacaoOlsen === g ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Diagnóstico provável:</p>
              <div className="flex flex-wrap gap-1.5">
                {DIAG_OPCOES.map((d) => (
                  <button key={d} type="button" onClick={() => toggleArr(diagnostico, setDiagnostico, d)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${diagnostico.includes(d) ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Sec>

      {/* Avaliação + Pacote */}
      <Sec sid="avaliacao" titulo="Avaliação e Pacote">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Regeneração:</p>
          <div className="flex gap-2">
            {["Regeneração possível", "Só manutenção", "Parcial"].map((a) => (
              <button key={a} type="button" onClick={() => setAvaliacao(avaliacao === a ? "" : a)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${avaliacao === a ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Pacote:</p>
          <div className="flex flex-wrap gap-2">
            {PACOTE_OPCOES.map((p) => (
              <button key={p} type="button" onClick={() => setPacote(pacote === p ? "" : p)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${pacote === p ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor R$</label>
            <input type="number" value={valor} onChange={(e) => setValor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nº sessões</label>
            <input type="number" value={numSessoes} onChange={(e) => setNumSessoes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </Sec>

      {/* Objeções */}
      <Sec sid="objecoes" titulo="Objeções Levantadas">
        <div className="flex flex-wrap gap-2">
          {OBJECAO_OPCOES.map((o) => {
            const isProvavel = objecoesProvaveis.some((oid) => OBJECAO_MAP[oid] === o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggleArr(objecoes, setObjecoes, o)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  objecoes.includes(o)
                    ? "bg-orange-500 text-white border-orange-500"
                    : isProvavel
                    ? "bg-orange-50 text-orange-700 border-orange-300 ring-1 ring-orange-300"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {isProvavel && "🎯 "}{o}
              </button>
            );
          })}
        </div>
        {objecoesProvaveis.length > 0 && (
          <p className="text-xs text-orange-600">🎯 = objeção provável baseada no perfil do M1</p>
        )}
      </Sec>

      {/* Decisão */}
      <Sec sid="decisao" titulo="Decisão">
        <div className="flex gap-2">
          {["Comprou", "Vai pensar", "Não fechou"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDecisao(decisao === d ? "" : d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                decisao === d
                  ? d === "Comprou" ? "bg-green-600 text-white border-green-600"
                    : d === "Vai pensar" ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-red-500 text-white border-red-500"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {(decisao === "Vai pensar" || decisao === "Não fechou") && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <input value={motivoNao} onChange={(e) => setMotivoNao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data follow-up</label>
              <input type="date" value={followupData} onChange={(e) => setFollowupData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        )}
      </Sec>

      {/* Observações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações gerais</label>
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar Consulta de Venda"}
      </button>

      <div className="h-8" />
    </div>
  );
}
