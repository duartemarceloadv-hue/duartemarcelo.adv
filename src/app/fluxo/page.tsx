import { GitBranch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ETAPAS_FLUXO, ETAPAS_LABELS, ETAPAS_CORES } from "@/lib/fluxo";

export const dynamic = "force-dynamic";

export default async function FluxoGeralPage() {
  const contagemPorEtapa = await Promise.all(
    ETAPAS_FLUXO.map(async (etapa) => ({
      etapa,
      label: ETAPAS_LABELS[etapa],
      cor: ETAPAS_CORES[etapa],
      count: await prisma.paciente.count({ where: { statusFluxo: etapa } }),
    }))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fluxo Geral</h1>

      {/* Fluxograma visual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col items-center gap-2">
          {contagemPorEtapa.map((item, i) => (
            <div key={item.etapa} className="flex flex-col items-center">
              <div
                className={`${item.cor} rounded-xl px-6 py-4 text-center min-w-[200px] shadow-sm`}
              >
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-sm font-medium">{item.label}</p>
              </div>
              {i < contagemPorEtapa.length - 1 && (
                <div className="w-0.5 h-6 bg-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <GitBranch size={32} className="text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          Fluxograma interativo com React Flow em desenvolvimento
        </p>
      </div>
    </div>
  );
}
