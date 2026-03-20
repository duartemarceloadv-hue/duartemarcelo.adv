import { prisma } from "./prisma";
import type { EtapaFluxo } from "./fluxo-constants";

export { ETAPAS_FLUXO, ETAPAS_LABELS, ETAPAS_CORES } from "./fluxo-constants";
export type { EtapaFluxo } from "./fluxo-constants";

const TRANSICOES_VALIDAS: Record<string, string[]> = {
  cadastrado: ["pre_atendimento"],
  pre_atendimento: ["consultora"],
  consultora: ["contrato", "pre_atendimento"], // não fechou → pode voltar
  contrato: ["biomedica"],
  biomedica: ["em_tratamento"],
  em_tratamento: ["manutencao", "alta", "em_tratamento"], // retorno, manutenção ou alta
  manutencao: ["em_tratamento", "alta"],
  alta: ["pre_atendimento"], // reingresso
};

export function podeTransicionar(etapaAtual: string, etapaDestino: string): boolean {
  const validas = TRANSICOES_VALIDAS[etapaAtual];
  if (!validas) return false;
  return validas.includes(etapaDestino);
}

export async function transicionarPaciente(
  pacienteId: number,
  novaEtapa: EtapaFluxo,
  observacao?: string
): Promise<boolean> {
  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    select: { statusFluxo: true },
  });

  if (!paciente) return false;

  if (!podeTransicionar(paciente.statusFluxo, novaEtapa)) {
    return false;
  }

  await prisma.$transaction([
    prisma.paciente.update({
      where: { id: pacienteId },
      data: { statusFluxo: novaEtapa },
    }),
    prisma.historicoFluxo.create({
      data: {
        pacienteId,
        etapaAnterior: paciente.statusFluxo,
        etapaAtual: novaEtapa,
        observacao,
      },
    }),
  ]);

  return true;
}
