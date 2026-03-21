"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Camera } from "lucide-react";

const ANGULOS_FOTO = [
  "Frontal",
  "Topo",
  "Lateral D",
  "Lateral E",
  "Posterior",
  "Topo Posterior",
  "Close",
] as const;

type AnguloFoto = (typeof ANGULOS_FOTO)[number];

export default function ManutencaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Perguntas de manutenção
  const [regressao, setRegressao] = useState("");
  const [homeCare, setHomeCare] = useState("");
  const [homeCareMot, setHomeCareMot] = useState("");
  const [mudancaSaude, setMudancaSaude] = useState("");
  const [mudancaDetalhe, setMudancaDetalhe] = useState("");
  const [expectativa, setExpectativa] = useState("");

  // Reavaliação
  const [tricoObs, setTricoObs] = useState("");
  const [fotos, setFotos] = useState<Record<AnguloFoto, { file: File | null; preview: string }>>(
    () =>
      Object.fromEntries(ANGULOS_FOTO.map((a) => [a, { file: null, preview: "" }])) as Record<
        AnguloFoto,
        { file: File | null; preview: string }
      >
  );

  const [salvando, setSalvando] = useState(false);

  function handleFotoChange(angulo: AnguloFoto, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setFotos((prev) => ({ ...prev, [angulo]: { file, preview } }));
  }

  async function handleSubmit() {
    setSalvando(true);
    try {
      // Build foto URLs (in production these would be uploaded to storage first)
      const fotosPayload = ANGULOS_FOTO.filter((a) => fotos[a].file).map((a) => ({
        angulo: a,
        fotoUrl: fotos[a].preview, // placeholder — replace with real upload URL in production
      }));

      const body = {
        pacienteId: parseInt(id),
        regressao,
        homeCare,
        homeCareMot,
        mudancaSaude,
        mudancaDetalhe,
        expectativa,
        reavaliacao: {
          tricoscopiaObs: tricoObs,
          fotosCount: fotosPayload.length,
        },
        fotos: fotosPayload,
      };

      const res = await fetch("/api/manutencao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Erro ao salvar: " + (err.error || "Erro desconhecido"));
        return;
      }

      router.push(`/pacientes/${id}/contrato?tipo=manutencao`);
    } catch {
      alert("Erro de conexão ao salvar manutenção.");
    } finally {
      setSalvando(false);
    }
  }

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

      {/* Perguntas de Manutenção */}
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

      {/* Reavaliação */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Reavaliação</h2>
        <p className="text-sm text-gray-500">Nova baseline para o ciclo de manutenção</p>

        {/* Tricoscopia */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Observações da tricoscopia:</p>
          <textarea
            value={tricoObs}
            onChange={(e) => setTricoObs(e.target.value)}
            placeholder="Descreva as observações da nova tricoscopia..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Fotos por ângulo */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Camera size={16} className="text-teal-600" />
            Fotos de reavaliação (7 ângulos)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ANGULOS_FOTO.map((angulo) => (
              <div key={angulo} className="space-y-1">
                <p className="text-xs font-medium text-gray-600">{angulo}</p>
                {fotos[angulo].preview ? (
                  <div className="relative">
                    <img
                      src={fotos[angulo].preview}
                      alt={angulo}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white text-xs font-medium">Trocar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFotoChange(angulo, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-400 transition-colors">
                    <Upload size={16} className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Selecionar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFotoChange(angulo, e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botão de salvar */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={salvando}
          className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg font-medium text-center hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {salvando ? "Salvando..." : "Salvar e Criar Contrato Manutenção"}
        </button>
      </div>
      <div className="h-8" />
    </div>
  );
}
