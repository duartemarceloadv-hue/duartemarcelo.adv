export type TrilhaTratamento = {
  id: number;
  nome: string;
  indicacao: string;
  substancias: number[];
  observacoes: string;
};

export type Substituicao = {
  situacao: string;
  substanciaRetirada: string;
  substituta: string;
};

export const trilhasTratamento: TrilhaTratamento[] = [
  {
    id: 1,
    nome: "AGA Masculina",
    indicacao:
      "Alopecia androgenética masculina (Hamilton-Norwood II a VII).",
    substancias: [1, 4, 3, 2],
    observacoes:
      "Protocolo completo com as 4 substâncias-base. Dutasterida é peça-chave para bloqueio do DHT. Avaliar substituição se paciente planeja filhos.",
  },
  {
    id: 2,
    nome: "AGA Feminina",
    indicacao:
      "Alopecia androgenética feminina (Ludwig I-III / Olsen).",
    substancias: [1, 4, 3, 2],
    observacoes:
      "Dutasterida somente se elegível (sem gestação, sem amamentação, sem planejamento reprodutivo). Caso contrário, substituir por Cafeisilane C® 3%.",
  },
  {
    id: 3,
    nome: "Eflúvio Telógeno",
    indicacao:
      "Queda difusa por estresse, pós-parto, pós-cirúrgico, deficiências nutricionais.",
    substancias: [1, 4, 3],
    observacoes:
      "SEM Dutasterida — o eflúvio telógeno não é mediado por DHT. Foco em nutrição folicular, fator de crescimento e vasodilatação.",
  },
  {
    id: 4,
    nome: "Alopecia Seborreica",
    indicacao:
      "Queda capilar associada a dermatite seborreica, caspa intensa, inflamação do couro cabeludo.",
    substancias: [1, 4],
    observacoes:
      "Protocolo reduzido focado em nutrição e regeneração. Tratar a causa inflamatória em paralelo. Considerar adição de Luteolina para ação anti-inflamatória.",
  },
  {
    id: 5,
    nome: "Personalizado",
    indicacao:
      "Casos que não se encaixam nas trilhas padrão ou que requerem adaptação específica pela biomédica.",
    substancias: [],
    observacoes:
      "Seleção manual das substâncias conforme avaliação clínica e tricoscópica individualizada.",
  },
];

export const substituicoes: Substituicao[] = [
  {
    situacao: "Planejamento reprodutivo (masculino ou feminino)",
    substanciaRetirada: "Dutasterida 0,1%",
    substituta: "Cafeisilane C® 3%",
  },
  {
    situacao: "Gestação ou amamentação",
    substanciaRetirada: "Dutasterida 0,1%",
    substituta: "Cafeisilane C® 3%",
  },
  {
    situacao: "Gestação ou amamentação",
    substanciaRetirada: "Minoxidil Sulfato 0,5%",
    substituta: "Luteolina Injetável",
  },
  {
    situacao: "Couro cabeludo inflamado",
    substanciaRetirada: "Minoxidil Sulfato 0,5%",
    substituta: "Luteolina Injetável",
  },
  {
    situacao: "Cardiopatia grave",
    substanciaRetirada: "Minoxidil Sulfato 0,5%",
    substituta: "Luteolina Injetável",
  },
];
