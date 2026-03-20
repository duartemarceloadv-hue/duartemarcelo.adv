import { BarChart3 } from "lucide-react";

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Módulo de relatórios em desenvolvimento</p>
        <p className="text-sm text-gray-400 mt-1">
          Atendimentos, receita, pagamentos pendentes por período. Exportar CSV.
        </p>
      </div>
    </div>
  );
}
