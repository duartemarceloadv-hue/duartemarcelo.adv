export type Substancia = {
  id: number;
  nome: string;
  concentracao: string;
  volume: string;
  composicao: string;
  oQueFaz: string;
  contraindicacoes: string[];
  substituto: string | null;
};

export const substancias: Substancia[] = [
  {
    id: 1,
    nome: "Complexo Vitamínico Capilar",
    concentracao: "—",
    volume: "2ml",
    composicao:
      "L-Arginina + Biotina + Cobre + Cromo + Dex-Pantenol + Vitamina B2 + Vitamina B6",
    oQueFaz:
      "Nutre o folículo capilar, fortalece a queratinização e melhora a saúde do fio de dentro pra fora.",
    contraindicacoes: [],
    substituto: null,
  },
  {
    id: 2,
    nome: "Dutasterida",
    concentracao: "0,1%",
    volume: "1ml",
    composicao:
      "Inibidor da 5-alfa-redutase (tipos 1 e 2), bloqueia 93% do DHT responsável pela miniaturização folicular.",
    oQueFaz:
      "Bloqueia a conversão de testosterona em DHT, impedindo a miniaturização progressiva dos folículos.",
    contraindicacoes: ["Gestação", "Planejamento reprodutivo"],
    substituto: "Cafeisilane C® 3%",
  },
  {
    id: 3,
    nome: "Minoxidil Sulfato",
    concentracao: "0,5%",
    volume: "2ml",
    composicao:
      "Vasodilatador que prolonga a fase anágena (fase de crescimento) do ciclo capilar.",
    oQueFaz:
      "Aumenta o fluxo sanguíneo no couro cabeludo e prolonga a fase de crescimento do fio.",
    contraindicacoes: [
      "Gestação",
      "Couro cabeludo inflamado",
      "Cardiopatia grave",
    ],
    substituto: "Luteolina",
  },
  {
    id: 4,
    nome: "Fator de Crescimento Capilar",
    concentracao: "—",
    volume: "2ml",
    composicao: "bFGF + IGF + VEGF + Copper Peptide",
    oQueFaz:
      "Estimula a proliferação celular, a angiogênese e a regeneração do folículo capilar.",
    contraindicacoes: ["Melanoma ou neoplasia ativa"],
    substituto: null,
  },
  {
    id: 5,
    nome: "Cafeisilane C®",
    concentracao: "3%",
    volume: "2ml",
    composicao: "Cafeína + ácido algínico + silanol",
    oQueFaz:
      "Anti-inflamatório e reestruturante capilar. Substituto da Dutasterida para pacientes com contraindicação.",
    contraindicacoes: [],
    substituto: null,
  },
  {
    id: 6,
    nome: "Luteolina Injetável",
    concentracao: "—",
    volume: "2ml",
    composicao: "Flavonoide anti-inflamatório e antioxidante",
    oQueFaz:
      "Reduz inflamação no couro cabeludo e protege contra estresse oxidativo. Substituto do Minoxidil. NOTA: aplicar em seringa SEPARADA.",
    contraindicacoes: [],
    substituto: null,
  },
];
