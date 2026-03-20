import { prisma } from "@/lib/prisma";
import { ETAPAS_FLUXO, ETAPAS_LABELS, ETAPAS_CORES } from "@/lib/fluxo";
import Link from "next/link";
import { Users, CalendarDays, FileText, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const totalPacientes = await prisma.paciente.count();
  const pacientesAtivos = await prisma.paciente.count({
    where: { statusFluxo: { not: "alta" } },
  });

  const contagemPorEtapa = await Promise.all(
    ETAPAS_FLUXO.map(async (etapa) => ({
      etapa,
      label: ETAPAS_LABELS[etapa],
      cor: ETAPAS_CORES[etapa],
      count: await prisma.paciente.count({ where: { statusFluxo: etapa } }),
    }))
  );

  const sessoesHoje = await prisma.sessao.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Pacientes"
          value={totalPacientes}
          icon={<Users size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <DashboardCard
          title="Pacientes Ativos"
          value={pacientesAtivos}
          icon={<TrendingUp size={20} />}
          color="bg-green-50 text-green-600"
        />
        <DashboardCard
          title="Sessões Hoje"
          value={sessoesHoje}
          icon={<FileText size={20} />}
          color="bg-purple-50 text-purple-600"
        />
        <DashboardCard
          title="Agenda"
          value="—"
          icon={<CalendarDays size={20} />}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Pacientes por etapa do fluxo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pacientes por Etapa do Fluxo
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {contagemPorEtapa.map(({ etapa, label, cor, count }) => (
            <Link
              key={etapa}
              href={`/pacientes?etapa=${etapa}`}
              className={`${cor} rounded-lg p-4 text-center hover:opacity-80 transition-opacity`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm mt-1">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pacientes/novo"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            + Novo Paciente
          </Link>
          <Link
            href="/pacientes"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Ver Pacientes
          </Link>
          <Link
            href="/fluxo"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Ver Fluxo
          </Link>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
