"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ETAPAS_LABELS: Record<string, string> = {
  cadastrado: "Cadastrado",
  pre_atendimento: "Pré-atendimento",
  consultora: "Consultora",
  contrato: "Contrato",
  biomedica: "Biomédica",
  em_tratamento: "Em Tratamento",
  manutencao: "Manutenção",
  alta: "Alta",
};

const ETAPAS_CORES: Record<string, string> = {
  cadastrado: "bg-gray-200 text-gray-700",
  pre_atendimento: "bg-blue-200 text-blue-700",
  consultora: "bg-purple-200 text-purple-700",
  contrato: "bg-yellow-200 text-yellow-700",
  biomedica: "bg-teal-200 text-teal-700",
  em_tratamento: "bg-green-200 text-green-700",
  manutencao: "bg-orange-200 text-orange-700",
  alta: "bg-emerald-200 text-emerald-700",
};

const ETAPAS_ORDEM = ["cadastrado", "pre_atendimento", "consultora", "contrato", "biomedica", "em_tratamento", "manutencao", "alta"];

interface Paciente {
  nome: string;
  statusFluxo: string;
  historicoFluxo: { id: number; etapaAnterior: string; etapaAtual: string; createdAt: string; observacao?: string }[];
}

export default function FluxoPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [paciente, setPaciente] = useState<Paciente | null>(null);

  useEffect(() => {
    fetch(`/api/pacientes/${id}`).then((r) => r.json()).then(setPaciente);
  }, [id]);

  if (!paciente) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Fluxo — {paciente.nome}</h1>
      </div>

      {/* Fluxograma visual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col items-center gap-1">
          {ETAPAS_ORDEM.map((etapa, i) => {
            const isAtual = paciente.statusFluxo === etapa;
            const isPast = ETAPAS_ORDEM.indexOf(paciente.statusFluxo) > i;
            return (
              <div key={etapa} className="flex flex-col items-center">
                <div
                  className={`rounded-xl px-6 py-3 text-center min-w-[200px] border-2 transition-all ${
                    isAtual
                      ? `${ETAPAS_CORES[etapa]} border-current font-bold shadow-md scale-105`
                      : isPast
                      ? `${ETAPAS_CORES[etapa]} border-transparent opacity-70`
                      : "bg-gray-50 text-gray-400 border-gray-100"
                  }`}
                >
                  <p className="text-sm">{ETAPAS_LABELS[etapa]}</p>
                  {isAtual && <p className="text-xs mt-0.5">← Atual</p>}
                </div>
                {i < ETAPAS_ORDEM.length - 1 && (
                  <div className={`w-0.5 h-4 ${isPast || isAtual ? "bg-teal-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Histórico */}
      {paciente.historicoFluxo?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Histórico de Transições</h2>
          <div className="space-y-2">
            {paciente.historicoFluxo.map((h) => (
              <div key={h.id} className="flex items-center gap-3 text-sm">
                <span className="text-xs text-gray-400 w-36">
                  {new Date(h.createdAt).toLocaleString("pt-BR")}
                </span>
                <span className="text-gray-500">{ETAPAS_LABELS[h.etapaAnterior]}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium text-gray-900">{ETAPAS_LABELS[h.etapaAtual]}</span>
                {h.observacao && <span className="text-gray-400 text-xs">({h.observacao})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
