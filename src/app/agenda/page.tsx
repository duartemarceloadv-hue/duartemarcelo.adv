import { CalendarDays } from "lucide-react";

export default function AgendaPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <CalendarDays size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Módulo de agenda em desenvolvimento</p>
        <p className="text-sm text-gray-400 mt-1">
          Calendário semanal/diário com agendamentos
        </p>
      </div>
    </div>
  );
}
