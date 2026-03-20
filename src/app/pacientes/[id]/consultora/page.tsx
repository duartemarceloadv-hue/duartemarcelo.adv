"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Eye, Sparkles } from "lucide-react";

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

  // Checklist 8 passos
  const [identidade, setIdentidade] = useState(false);
  const [passoObs, setPassoObs] = useState<Record<number, string>>({});

  // Tricoscopia
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
    // Buscar paciente + pré-atendimento com briefing
    const res = await fetch(`/api/pacientes/${id}`);
    const data = await res.json();
    setPaciente(data);

    if (data.preAtendimentos?.[0]) {
      const preId = data.preAtendimentos[0].id;
      // Buscar briefing
      const briefRes = await fetch(`/api/pre-atendimento/${preId}/briefing`);
      if (briefRes.ok) {
        const briefData = await briefRes.json();
        setBriefing(briefData);
        setBriefingId(briefData.id);
      }
    }
  }

  const HN_OPCOES = ["I", "II", "IIa", "III", "IIIa", "IIIv", "IV", "IVa", "V", "Va", "VI", "VII"];
  const OLSEN_OPCOES = ["Leve", "Moderada", "Severa"];
  const DIAG_OPCOES = ["AGA", "Eflúvio Telógeno", "Alopecia Seborreica", "Alopecia Areata", "Mista"];
  const PACOTE_OPCOES = ["Protocolo Inicial 10s", "Intensivo 12s", "Básico 8s", "Manutenção 6s", "Personalizado"];
  const OBJECAO_OPCOES = ["Preço", "Vou pensar", "Cônjuge", "Já tentei", "Shampoo resolve", "Genética", "Sem tempo", "Resultado antes", "Mais barato", "Colateral", "Não tá ruim", "Sem cartão"];

  function toggleArr(arr: string[], setArr: (v: string[]) => void, val: string) {
    if (arr.includes(val)) setArr(arr.filter((v) => v !== val));
    else setArr([...arr, val]);
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
      checklist8passos: passoObs,
      tricoscopia: {
        classificacaoHN,
        classificacaoOlsen,
        diagnosticoProvavel: diagnostico.join(", "),
        iaAnalise: {},
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

      {/* Briefing */}
      {briefing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => setBriefingAberto(!briefingAberto)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Briefing Automático</h2>
            </div>
            {briefingAberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {briefingAberto && (
            <div className="px-4 pb-4 space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumo Rápido</h3>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(briefing.resumo ? JSON.parse(briefing.resumo as string) : {}, null, 2)}
                </pre>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Trilha Provável</h3>
                <p className="text-sm text-gray-700 font-medium">{briefing.trilhaProvavel as string}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Gatilhos Ativados</h3>
                <pre className="text-xs text-gray-600">
                  {briefing.gatilhos as string}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmação de identidade */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={identidade}
            onChange={(e) => setIdentidade(e.target.checked)}
            className="h-4 w-4 text-teal-600 rounded"
          />
          <span className="text-sm font-medium text-gray-900">
            Identidade confirmada por verbalização do paciente (POP-ASS-001)
          </span>
        </label>
      </div>

      {/* Tricoscopia */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900">Tricoscopia + Classificação</h2>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Hamilton-Norwood (masculino):</p>
          <div className="flex flex-wrap gap-2">
            {HN_OPCOES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setClassificacaoHN(classificacaoHN === g ? "" : g)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  classificacaoHN === g
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Olsen (feminino):</p>
          <div className="flex gap-2">
            {OLSEN_OPCOES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setClassificacaoOlsen(classificacaoOlsen === g ? "" : g)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  classificacaoOlsen === g
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Diagnóstico provável:</p>
          <div className="flex flex-wrap gap-2">
            {DIAG_OPCOES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleArr(diagnostico, setDiagnostico, d)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  diagnostico.includes(d)
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Avaliação + Pacote */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Avaliação e Pacote</h2>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Regeneração:</p>
          <div className="flex gap-2">
            {["Regeneração possível", "Só manutenção", "Parcial"].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvaliacao(avaliacao === a ? "" : a)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  avaliacao === a
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Pacote:</p>
          <div className="flex flex-wrap gap-2">
            {PACOTE_OPCOES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPacote(pacote === p ? "" : p)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  pacote === p
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor R$</label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nº sessões</label>
            <input
              type="number"
              value={numSessoes}
              onChange={(e) => setNumSessoes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Objeções */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Objeções Levantadas</h2>
        <div className="flex flex-wrap gap-2">
          {OBJECAO_OPCOES.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => toggleArr(objecoes, setObjecoes, o)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                objecoes.includes(o)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Decisão */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Decisão</h2>
        <div className="flex gap-2">
          {["Comprou", "Vai pensar", "Não fechou"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDecisao(decisao === d ? "" : d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                decisao === d
                  ? d === "Comprou"
                    ? "bg-green-600 text-white border-green-600"
                    : d === "Vai pensar"
                    ? "bg-yellow-500 text-white border-yellow-500"
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
              <input
                value={motivoNao}
                onChange={(e) => setMotivoNao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data follow-up</label>
              <input
                type="date"
                value={followupData}
                onChange={(e) => setFollowupData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações gerais</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
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
