"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

const SUBSTANCIAS = [
  { id: 1, nome: "Complexo Vitamínico Capilar", volume: "2ml" },
  { id: 2, nome: "Dutasterida 0,1%", volume: "1ml" },
  { id: 3, nome: "Minoxidil Sulfato 0,5%", volume: "2ml" },
  { id: 4, nome: "Fator de Crescimento Capilar", volume: "2ml" },
  { id: 5, nome: "Cafeisilane C® 3%", volume: "2ml" },
  { id: 6, nome: "Luteolina Injetável", volume: "2ml" },
];

const PERGUNTAS = [
  { id: 1, texto: "Sentiu dor ou desconforto desde a última sessão?", opts: ["Sim", "Não"] },
  { id: 2, texto: "Vermelhidão, coceira ou irritação no couro?", opts: ["Sim", "Não"] },
  { id: 3, texto: "Está usando kit home care conforme orientado?", opts: ["Sim", "Parcial", "Não"] },
  { id: 4, texto: "Houve alteração nos medicamentos em uso?", opts: ["Sim", "Não"] },
  { id: 5, texto: "Percebeu queda de cabelo diferente do habitual?", opts: ["Sim", "Não"] },
  { id: 6, texto: "Houve alguma mudança no estado de saúde geral?", opts: ["Sim", "Não"] },
  { id: 7, texto: "Houve exposição solar intensa no couro cabeludo?", opts: ["Sim", "Não"] },
  { id: 8, texto: "Realizou procedimento químico capilar desde a última sessão?", opts: ["Sim", "Não"] },
  { id: 9, texto: "Está ingerindo água adequadamente (mín. 2L/dia)?", opts: ["Sim", "Não"] },
  { id: 10, texto: "Está satisfeito(a) com a evolução até o momento?", opts: ["Sim", "Parcial", "Não"] },
];

const CHECKLIST_PRE = [
  "Indicação/trilha confirmada",
  "Contraindicações verificadas (anamnese verbal)",
  "Intervalo desde última sessão verificado (mín. 12 dias)",
  "Integridade, lote e validade dos ativos conferidos",
  "Pool principal preparado",
  "Luteolina em seringa apartada (se aplicável)",
  "EPIs vestidos (luvas, máscara, touca, jaleco)",
  "Assepsia da área realizada",
];

const CHECKLIST_LED = [
  "Equipamento verificado e funcional",
  "Equipamento limpo com álcool 70%",
  "Contraindicações LED verificadas",
  "Óculos de proteção fornecidos (paciente + profissional)",
  "Parâmetros configurados",
  "Paciente monitorado durante sessão",
  "Registro realizado",
];

const ORIENT_POS = [
  "Evitar lavar cabelo por 5-8 horas",
  "Evitar exposição solar direta 24-48h",
  "Evitar exercícios intensos 24h",
  "Não usar bonés/acessórios apertados 24h",
  "Não aplicar produtos tópicos 24h",
  "Retomar home care no dia seguinte",
  "Próxima sessão em 12-19 dias",
];

const CHECKLIST_POS = [
  "Área de procedimento inspecionada",
  "Orientações pós entregues ao paciente",
  "Próxima sessão agendada",
];

export default function SessaoPage({ params }: { params: Promise<{ id: string; numSessao: string }> }) {
  const { id, numSessao } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [secao, setSecao] = useState("identidade");

  // Patient data
  const [contratoId, setContratoId] = useState<number | null>(null);
  const [totalSessoes, setTotalSessoes] = useState(12);

  const [identidade, setIdentidade] = useState(false);
  const [checkPre, setCheckPre] = useState<boolean[]>(new Array(8).fill(false));
  const [respostas, setRespostas] = useState<Record<number, { resposta: string; obs: string }>>({});
  const [mescla, setMescla] = useState<Record<number, { checked: boolean; lote: string; validade: string }>>({});
  const [volumeTotal, setVolumeTotal] = useState("");
  const [checkLed, setCheckLed] = useState<boolean[]>(new Array(7).fill(false));
  const [tempoLed, setTempoLed] = useState("");
  const [doseLed, setDoseLed] = useState("");
  const [intercLed, setIntercLed] = useState("");
  const [dorPos, setDorPos] = useState<number | null>(null);
  const [checkOrient, setCheckOrient] = useState<boolean[]>(new Array(7).fill(false));
  const [checkPos, setCheckPos] = useState<boolean[]>(new Array(3).fill(false));
  const [prescricao, setPrescricao] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/pacientes/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.contratos?.[0]) {
          setContratoId(data.contratos[0].id);
          setTotalSessoes(data.contratos[0].numSessoes || 12);
        }
      }
    }
    fetchData();
  }, [id]);

  function Sec({ sid, titulo, children }: { sid: string; titulo: string; children: React.ReactNode }) {
    const open = secao === sid;
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button type="button" onClick={() => setSecao(open ? "" : sid)} className="w-full flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
      </div>
    );
  }

  async function handleSubmit() {
    if (!contratoId) {
      alert("Contrato não encontrado. Registre um contrato primeiro.");
      return;
    }
    setLoading(true);
    const numSessaoInt = parseInt(numSessao);
    const res = await fetch("/api/sessoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pacienteId: parseInt(id),
        contratoId,
        numSessao: numSessaoInt,
        totalSessoes,
        identidadeConfirmada: identidade,
        checklistPre: checkPre,
        perguntasRecorrentes: respostas,
        checklistMescla: mescla,
        volumeTotal: volumeTotal ? parseFloat(volumeTotal) : null,
        checklistLED: checkLed,
        tempoLED: tempoLed ? parseInt(tempoLed) : null,
        doseLED: doseLed ? parseFloat(doseLed) : null,
        intercorrenciasLED: intercLed,
        dorPos,
        checklistOrientacoesPo: checkOrient,
        checklistPos: checkPos,
        prescricaoAdicional: prescricao,
        observacoes: obs,
        isUltimaSessao: numSessaoInt === totalSessoes,
      }),
    });
    if (res.ok) router.push(`/pacientes/${id}/sessoes`);
    else alert("Erro ao salvar sessão");
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}/sessoes`} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessão {numSessao} de {totalSessoes}</h1>
          <p className="text-sm text-gray-500">Prontuário da sessão</p>
        </div>
      </div>

      {/* Identidade */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={identidade} onChange={e => setIdentidade(e.target.checked)} className="h-4 w-4 text-teal-600 rounded" />
          <span className="text-sm font-medium text-gray-900">Identidade confirmada por verbalização do paciente (POP-ASS-001)</span>
        </label>
      </div>

      {/* Checklist pré-procedimento */}
      <Sec sid="pre" titulo="Checklist Pré-Procedimento (8 itens)">
        {CHECKLIST_PRE.map((item, i) => (
          <label key={i} className="flex items-center gap-3">
            <input type="checkbox" checked={checkPre[i]} onChange={e => { const n = [...checkPre]; n[i] = e.target.checked; setCheckPre(n); }} className="h-4 w-4 text-teal-600 rounded" />
            <span className="text-sm text-gray-700">{item}</span>
          </label>
        ))}
        <p className="text-xs text-gray-500">Checklist: {checkPre.filter(Boolean).length}/8 itens</p>
      </Sec>

      {/* Perguntas recorrentes */}
      <Sec sid="perguntas" titulo="Perguntas Recorrentes (10)">
        {PERGUNTAS.map((p) => (
          <div key={p.id} className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{p.id}. {p.texto}</p>
            <div className="flex gap-2">
              {p.opts.map(o => (
                <button key={o} type="button" onClick={() => setRespostas({ ...respostas, [p.id]: { ...(respostas[p.id] || { obs: "" }), resposta: o } })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${respostas[p.id]?.resposta === o ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                >{o}</button>
              ))}
            </div>
            <textarea placeholder="Observação (opcional)" value={respostas[p.id]?.obs || ""} rows={1}
              onChange={e => setRespostas({ ...respostas, [p.id]: { ...(respostas[p.id] || { resposta: "" }), obs: e.target.value } })}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
          </div>
        ))}
      </Sec>

      {/* Mescla */}
      <Sec sid="mescla" titulo="Checklist Mescla (6 substâncias)">
        {SUBSTANCIAS.map((s) => (
          <div key={s.id} className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={mescla[s.id]?.checked || false}
                onChange={e => setMescla({ ...mescla, [s.id]: { ...(mescla[s.id] || { lote: "", validade: "" }), checked: e.target.checked } })}
                className="h-4 w-4 text-teal-600 rounded" />
              <span className="text-sm font-medium text-gray-700">{s.nome} ({s.volume})</span>
            </label>
            {mescla[s.id]?.checked && (
              <div className="grid grid-cols-2 gap-2 ml-6">
                <input placeholder="Lote" value={mescla[s.id]?.lote || ""}
                  onChange={e => setMescla({ ...mescla, [s.id]: { ...(mescla[s.id] || { checked: true, validade: "" }), lote: e.target.value } })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                <input placeholder="Validade" value={mescla[s.id]?.validade || ""}
                  onChange={e => setMescla({ ...mescla, [s.id]: { ...(mescla[s.id] || { checked: true, lote: "" }), validade: e.target.value } })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
              </div>
            )}
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Volume total (mL)</label>
          <input type="number" value={volumeTotal} onChange={e => setVolumeTotal(e.target.value)} step="0.1" placeholder="Ex: 5.0"
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
        </div>
      </Sec>

      {/* LEDterapia */}
      <Sec sid="led" titulo="LEDterapia">
        {CHECKLIST_LED.map((item, i) => (
          <label key={i} className="flex items-center gap-3">
            <input type="checkbox" checked={checkLed[i]} onChange={e => { const n = [...checkLed]; n[i] = e.target.checked; setCheckLed(n); }} className="h-4 w-4 text-teal-600 rounded" />
            <span className="text-sm text-gray-700">{item}</span>
          </label>
        ))}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tempo:</p>
          <div className="flex gap-2">{["20", "25", "30"].map(t => (
            <button key={t} type="button" onClick={() => setTempoLed(tempoLed === t ? "" : t)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${tempoLed === t ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}>{t} min</button>
          ))}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Dose:</p>
          <div className="flex gap-2">{["3", "4", "5", "6"].map(d => (
            <button key={d} type="button" onClick={() => setDoseLed(doseLed === d ? "" : d)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${doseLed === d ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}>{d} J/cm²</button>
          ))}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Intercorrências:</p>
          <div className="flex flex-wrap gap-2">{["Nenhuma", "Calor excessivo", "Desconforto", "Outra"].map(v => (
            <button key={v} type="button" onClick={() => setIntercLed(intercLed === v ? "" : v)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${intercLed === v ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}>{v}</button>
          ))}</div>
        </div>
      </Sec>

      {/* Dor pós */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Escala de dor pós-procedimento (0-10):</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, i) => i).map(i => {
            const cor = i <= 2 ? "bg-green-500" : i <= 4 ? "bg-yellow-400" : i <= 6 ? "bg-orange-500" : "bg-red-500";
            return (
              <button key={i} type="button" onClick={() => setDorPos(dorPos === i ? null : i)}
                className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors ${dorPos === i ? `${cor} text-white border-transparent` : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
              >{i}</button>
            );
          })}
        </div>
      </div>

      {/* Orientações pós */}
      <Sec sid="orient" titulo="Orientações Pós-Procedimento">
        {ORIENT_POS.map((item, i) => (
          <label key={i} className="flex items-center gap-3">
            <input type="checkbox" checked={checkOrient[i]} onChange={e => { const n = [...checkOrient]; n[i] = e.target.checked; setCheckOrient(n); }} className="h-4 w-4 text-teal-600 rounded" />
            <span className="text-sm text-gray-700">{item}</span>
          </label>
        ))}
      </Sec>

      {/* Checklist pós-procedimento */}
      <Sec sid="pos" titulo="Checklist Pós-Procedimento">
        {CHECKLIST_POS.map((item, i) => (
          <label key={i} className="flex items-center gap-3">
            <input type="checkbox" checked={checkPos[i]} onChange={e => { const n = [...checkPos]; n[i] = e.target.checked; setCheckPos(n); }} className="h-4 w-4 text-teal-600 rounded" />
            <span className="text-sm text-gray-700">{item}</span>
          </label>
        ))}
      </Sec>

      {/* Extras */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prescrição adicional (opcional)</label>
          <textarea value={prescricao} onChange={e => setPrescricao(e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Prescrição adicional..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Observações da sessão..." />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading} className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
        {loading ? "Salvando..." : `Salvar Sessão ${numSessao}`}
      </button>
      <div className="h-8" />
    </div>
  );
}
