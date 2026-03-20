export const ETAPAS_FLUXO = [
  "cadastrado",
  "pre_atendimento",
  "consultora",
  "contrato",
  "biomedica",
  "em_tratamento",
  "manutencao",
  "alta",
] as const;

export type EtapaFluxo = (typeof ETAPAS_FLUXO)[number];

export const ETAPAS_LABELS: Record<EtapaFluxo, string> = {
  cadastrado: "Cadastrado",
  pre_atendimento: "Pré-atendimento",
  consultora: "Consultora",
  contrato: "Contrato",
  biomedica: "Biomédica",
  em_tratamento: "Em Tratamento",
  manutencao: "Manutenção",
  alta: "Alta",
};

export const ETAPAS_CORES: Record<EtapaFluxo, string> = {
  cadastrado: "bg-gray-100 text-gray-700",
  pre_atendimento: "bg-blue-100 text-blue-700",
  consultora: "bg-purple-100 text-purple-700",
  contrato: "bg-yellow-100 text-yellow-700",
  biomedica: "bg-teal-100 text-teal-700",
  em_tratamento: "bg-green-100 text-green-700",
  manutencao: "bg-orange-100 text-orange-700",
  alta: "bg-emerald-100 text-emerald-700",
};
