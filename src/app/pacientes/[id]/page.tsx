import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Users,
  FileText,
  Stethoscope,
  Syringe,
  RefreshCw,
  CheckCircle,
  GitBranch,
} from "lucide-react";
import { ETAPAS_LABELS, ETAPAS_CORES, type EtapaFluxo } from "@/lib/fluxo";

export const dynamic = "force-dynamic";

function calcularIdade(dataNasc: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNasc.getFullYear();
  const m = hoje.getMonth() - dataNasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) idade--;
  return idade;
}

export default async function FichaPaciente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paciente = await prisma.paciente.findUnique({
    where: { id: parseInt(id) },
    include: {
      preAtendimentos: { orderBy: { createdAt: "desc" }, take: 1 },
      consultasVenda: { orderBy: { createdAt: "desc" }, take: 1 },
      contratos: { orderBy: { createdAt: "desc" } },
      anamnesesBiomedica: { orderBy: { createdAt: "desc" }, take: 1 },
      sessoes: { orderBy: { numSessao: "asc" } },
      historicoFluxo: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!paciente) notFound();

  const etapa = paciente.statusFluxo as EtapaFluxo;
  const idade = calcularIdade(paciente.dataNascimento);

  const modulos = [
    {
      href: `/pacientes/${id}/pre-atendimento`,
      label: "M1 — Pré-atendimento",
      desc: "Paciente preenche queixas, saúde e hábitos",
      icon: ClipboardList,
      done: paciente.preAtendimentos.length > 0,
    },
    {
      href: `/pacientes/${id}/consultora`,
      label: "M2 — Consultora",
      desc: "Consulta de venda + tricoscopia IA",
      icon: Users,
      done: paciente.consultasVenda.length > 0,
    },
    {
      href: `/pacientes/${id}/contrato`,
      label: "M3 — Contrato",
      desc: "Contrato e forma de pagamento",
      icon: FileText,
      done: paciente.contratos.length > 0,
    },
    {
      href: `/pacientes/${id}/biomedica`,
      label: "M4 — Biomédica",
      desc: "Anamnese, exame clínico, trilha, TCLE",
      icon: Stethoscope,
      done: paciente.anamnesesBiomedica.length > 0,
    },
    {
      href: `/pacientes/${id}/sessoes`,
      label: "M5 — Sessões",
      desc: `${paciente.sessoes.length} sessão(ões) registrada(s)`,
      icon: Syringe,
      done: paciente.sessoes.length > 0,
    },
    {
      href: `/pacientes/${id}/manutencao`,
      label: "M6 — Manutenção",
      desc: "Novo contrato + novo ciclo",
      icon: RefreshCw,
      done: false,
    },
    {
      href: `/pacientes/${id}/alta`,
      label: "M7 — Alta",
      desc: "Relatório final e encerramento",
      icon: CheckCircle,
      done: etapa === "alta",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/pacientes" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{paciente.nome}</h1>
          <p className="text-sm text-gray-500">
            {idade} anos | CPF: {paciente.cpf} | {paciente.celular}
          </p>
        </div>
        <span
          className={`text-sm px-3 py-1.5 rounded-full font-medium ${ETAPAS_CORES[etapa]}`}
        >
          {ETAPAS_LABELS[etapa]}
        </span>
      </div>

      {/* Dados resumidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Dados do Paciente
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Sexo</span>
            <p className="font-medium">{paciente.sexo}</p>
          </div>
          <div>
            <span className="text-gray-500">Estado Civil</span>
            <p className="font-medium">{paciente.estadoCivil || "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">E-mail</span>
            <p className="font-medium truncate">{paciente.email || "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Ocupação</span>
            <p className="font-medium">{paciente.ocupacao || "—"}</p>
          </div>
          {paciente.peso && (
            <div>
              <span className="text-gray-500">Peso</span>
              <p className="font-medium">{paciente.peso} kg</p>
            </div>
          )}
          {paciente.altura && (
            <div>
              <span className="text-gray-500">Altura</span>
              <p className="font-medium">{paciente.altura} m</p>
            </div>
          )}
          {paciente.imc && (
            <div>
              <span className="text-gray-500">IMC</span>
              <p className="font-medium">{paciente.imc.toFixed(1)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Módulos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Módulos</h2>
          <Link
            href={`/pacientes/${id}/fluxo`}
            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
          >
            <GitBranch size={14} />
            Ver Fluxo
          </Link>
        </div>
        <div className="space-y-2">
          {modulos.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    m.done
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-50 text-gray-400"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
                {m.done && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Histórico do Fluxo */}
      {paciente.historicoFluxo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Histórico do Fluxo
          </h2>
          <div className="space-y-2">
            {paciente.historicoFluxo.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 text-sm text-gray-600"
              >
                <span className="text-xs text-gray-400 w-32">
                  {new Date(h.createdAt).toLocaleString("pt-BR")}
                </span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">
                  {ETAPAS_LABELS[h.etapaAtual as EtapaFluxo] || h.etapaAtual}
                </span>
                {h.observacao && (
                  <span className="text-gray-400">({h.observacao})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
