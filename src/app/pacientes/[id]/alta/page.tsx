"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AltaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [evolucao, setEvolucao] = useState("");
  const [classificacao, setClassificacao] = useState("");
  const [encaminhamento, setEncaminhamento] = useState("");
  const [orientacoes, setOrientacoes] = useState("");

  async function handleSubmit() {
    if (!resultado) { alert("Selecione o resultado geral"); return; }
    setLoading(true);

    const res = await fetch("/api/alta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pacienteId: parseInt(id),
        resultadoGeral: resultado,
        evolucaoClinica: evolucao,
        classificacaoFinal: classificacao,
        encaminhamento,
        orientacoes,
      }),
    });

    if (res.ok) router.push(`/pacientes/${id}`);
    else alert("Erro ao registrar alta");
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">M7 — Alta / Encerramento</h1>
          <p className="text-sm text-gray-500">Relatório final</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Resultado geral do tratamento:</p>
          <div className="flex gap-2">
            {["Excelente", "Bom", "Moderado", "Insuficiente"].map((r) => (
              <button key={r} onClick={() => setResultado(r)} className={`px-3 py-1.5 rounded-full text-sm border ${resultado === r ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>{r}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evolução clínica</label>
          <textarea value={evolucao} onChange={(e) => setEvolucao(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Classificação final</label>
          <input value={classificacao} onChange={(e) => setClassificacao(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Hamilton III → Hamilton II" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Encaminhamento (se houver)</label>
          <input value={encaminhamento} onChange={(e) => setEncaminhamento(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Orientações pós-tratamento</label>
          <textarea value={orientacoes} onChange={(e) => setOrientacoes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Registrar Alta"}
      </button>
      <div className="h-8" />
    </div>
  );
}
