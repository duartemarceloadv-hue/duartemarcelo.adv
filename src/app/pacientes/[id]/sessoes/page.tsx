"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, CheckCircle, Clock } from "lucide-react";

interface Sessao {
  id: number;
  numSessao: number;
  totalSessoes: number;
  createdAt: string;
  assinado?: boolean;
  dorPos?: number | null;
}

interface Contrato {
  id: number;
  numSessoes: number;
}

interface PacienteData {
  nome: string;
  sessoes: Sessao[];
  contratos: Contrato[];
}

export default function SessoesListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [paciente, setPaciente] = useState<PacienteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/pacientes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPaciente(data);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-gray-500">
        Paciente não encontrado.
      </div>
    );
  }

  const ultimoContrato = paciente.contratos?.[0];
  const totalContrato = ultimoContrato?.numSessoes || 12;
  const sessoesRealizadas = paciente.sessoes.length;
  const podeCriarNova = sessoesRealizadas < totalContrato;
  const proximaSessao = sessoesRealizadas + 1;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">M5 — Sessões</h1>
          <p className="text-sm text-gray-500">
            {paciente.nome} — {sessoesRealizadas}/{totalContrato} sessões
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso do tratamento</span>
          <span className="text-sm text-gray-500">
            {sessoesRealizadas}/{totalContrato}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-teal-600 h-3 rounded-full transition-all"
            style={{ width: `${Math.min((sessoesRealizadas / totalContrato) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Sessions list */}
      <div className="space-y-2">
        {paciente.sessoes.map((sessao) => (
          <Link
            key={sessao.id}
            href={`/pacientes/${id}/sessoes/${sessao.numSessao}`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm">
              {sessao.numSessao}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Sessão {sessao.numSessao} de {sessao.totalSessoes || totalContrato}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(sessao.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {sessao.assinado ? (
              <CheckCircle size={18} className="text-green-500" />
            ) : (
              <Clock size={18} className="text-yellow-500" />
            )}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {sessoesRealizadas === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">Nenhuma sessão registrada ainda.</p>
        </div>
      )}

      {/* Create new session button */}
      {podeCriarNova && ultimoContrato && (
        <Link
          href={`/pacientes/${id}/sessoes/${proximaSessao}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
        >
          <Plus size={18} />
          Iniciar Sessão {proximaSessao}
        </Link>
      )}

      {!ultimoContrato && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm text-yellow-800">
          Nenhum contrato encontrado. É necessário registrar um contrato antes de iniciar as sessões.
        </div>
      )}

      {!podeCriarNova && sessoesRealizadas > 0 && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-sm text-green-800">
          Todas as {totalContrato} sessões do contrato foram realizadas.
          Encaminhe o paciente para Manutenção (M6) ou Alta (M7).
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
