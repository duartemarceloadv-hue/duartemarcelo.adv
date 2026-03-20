"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ManutencaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [regressao, setRegressao] = useState("");
  const [homeCare, setHomeCare] = useState("");
  const [homeCareMot, setHomeCareMot] = useState("");
  const [mudancaSaude, setMudancaSaude] = useState("");
  const [mudancaDetalhe, setMudancaDetalhe] = useState("");
  const [expectativa, setExpectativa] = useState("");

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">M6 — Manutenção</h1>
          <p className="text-sm text-gray-500">Avaliação para novo ciclo</p>
        </div>
      </div>

      {/* Perguntas extras */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Perguntas de Manutenção</h2>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Percebeu regressão desde o fim do tratamento?</p>
          <div className="flex gap-2">
            {["Sim", "Não"].map((v) => (
              <button key={v} onClick={() => setRegressao(v)} className={`px-3 py-1.5 rounded-full text-sm border ${regressao === v ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>{v}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Manteve uso do home care entre os ciclos?</p>
          <div className="flex gap-2">
            {["Sim", "Parcial", "Não"].map((v) => (
              <button key={v} onClick={() => setHomeCare(v)} className={`px-3 py-1.5 rounded-full text-sm border ${homeCare === v ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>{v}</button>
            ))}
          </div>
          {(homeCare === "Parcial" || homeCare === "Não") && (
            <input placeholder="Motivo" value={homeCareMot} onChange={(e) => setHomeCareMot(e.target.value)} className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Mudança significativa de saúde desde o último ciclo?</p>
          <div className="flex gap-2">
            {["Sim", "Não"].map((v) => (
              <button key={v} onClick={() => setMudancaSaude(v)} className={`px-3 py-1.5 rounded-full text-sm border ${mudancaSaude === v ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>{v}</button>
            ))}
          </div>
          {mudancaSaude === "Sim" && (
            <input placeholder="Qual mudança?" value={mudancaDetalhe} onChange={(e) => setMudancaDetalhe(e.target.value)} className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Expectativa com a manutenção:</p>
          <div className="flex flex-wrap gap-2">
            {["Preservar resultado", "Melhorar ainda mais", "Prevenir queda futura"].map((v) => (
              <button key={v} onClick={() => setExpectativa(v)} className={`px-3 py-1.5 rounded-full text-sm border ${expectativa === v ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/pacientes/${id}/contrato`}
          className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg font-medium text-center hover:bg-teal-700 transition-colors"
        >
          Criar Novo Contrato (Manutenção)
        </Link>
      </div>
      <div className="h-8" />
    </div>
  );
}
