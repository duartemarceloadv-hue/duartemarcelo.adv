"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, User } from "lucide-react";
import { ETAPAS_LABELS, ETAPAS_CORES, type EtapaFluxo } from "@/lib/fluxo-constants";

interface Paciente {
  id: number;
  nome: string;
  cpf: string;
  celular: string;
  dataNascimento: string;
  sexo: string;
  statusFluxo: string;
  createdAt: string;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPacientes();
  }, [busca]);

  async function fetchPacientes() {
    setLoading(true);
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    const res = await fetch(`/api/pacientes?${params}`);
    const data = await res.json();
    setPacientes(data);
    setLoading(false);
  }

  function calcularIdade(dataNasc: string): number {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
        <Link
          href="/pacientes/novo"
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <Plus size={16} />
          Novo Paciente
        </Link>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou celular..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
        />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : pacientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum paciente encontrado
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pacientes.map((p) => (
              <Link
                key={p.id}
                href={`/pacientes/${p.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
                  <User size={18} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.nome}
                  </p>
                  <p className="text-xs text-gray-500">
                    CPF: {p.cpf} | {calcularIdade(p.dataNascimento)} anos |{" "}
                    {p.celular}
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    ETAPAS_CORES[p.statusFluxo as EtapaFluxo] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ETAPAS_LABELS[p.statusFluxo as EtapaFluxo] || p.statusFluxo}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
