export type GrauEscala = {
  grau: string;
  descricao: string;
};

export type TipoFitzpatrick = {
  tipo: string;
  descricao: string;
  caracteristicas: string;
};

export const hamiltonNorwood: GrauEscala[] = [
  {
    grau: "I",
    descricao: "Sem recessão significativa da linha frontal.",
  },
  {
    grau: "II",
    descricao:
      "Recessão leve nas entradas (têmporas), simétrica. Considerado padrão adulto normal.",
  },
  {
    grau: "IIa",
    descricao:
      "Recessão da linha frontal anterior como um todo, sem recessão temporal isolada.",
  },
  {
    grau: "III",
    descricao:
      "Recessão profunda nas têmporas, simétrica. Primeira fase considerada calvície.",
  },
  {
    grau: "IIIa",
    descricao:
      "Recessão da linha frontal posterior ao plano coronal, sem perda temporal significativa.",
  },
  {
    grau: "IIIv (vertex)",
    descricao:
      "Perda predominante na região do vértex (coroa), com ou sem recessão frontal.",
  },
  {
    grau: "IV",
    descricao:
      "Recessão frontotemporal acentuada + rarefação no vértex. Faixa de cabelo separa as duas áreas.",
  },
  {
    grau: "IVa",
    descricao:
      "Recessão frontal difusa sem ilha de cabelo no vértex. Padrão anterior predominante.",
  },
  {
    grau: "V",
    descricao:
      "Áreas frontal e do vértex maiores, faixa de separação mais estreita e rarefeita.",
  },
  {
    grau: "Va",
    descricao:
      "Perda em faixa contínua frontoparietal, sem separação entre fronte e vértex.",
  },
  {
    grau: "VI",
    descricao:
      "Ponte de cabelo entre fronte e vértex desapareceu. Restam cabelos laterais e posteriores.",
  },
  {
    grau: "VII",
    descricao:
      "Forma mais avançada. Resta apenas uma faixa estreita de cabelos nas laterais e região occipital.",
  },
];

export const ludwig: GrauEscala[] = [
  {
    grau: "I",
    descricao:
      "Rarefação leve na região central do couro cabeludo. Linha frontal preservada.",
  },
  {
    grau: "II",
    descricao:
      "Rarefação moderada na região central com alargamento visível da risca.",
  },
  {
    grau: "III",
    descricao:
      "Rarefação difusa intensa na região central, com couro cabeludo visível. Linha frontal geralmente preservada.",
  },
];

export const olsen: GrauEscala[] = [
  {
    grau: "Leve",
    descricao:
      "Alargamento discreto da risca central (padrão árvore de natal). Rarefação sutil na região frontoparietal.",
  },
  {
    grau: "Moderada",
    descricao:
      "Alargamento evidente da risca central com rarefação visível. Padrão triangular mais definido.",
  },
  {
    grau: "Severa",
    descricao:
      "Rarefação acentuada na região central e frontoparietal. Couro cabeludo amplamente visível.",
  },
];

export const fitzpatrick: TipoFitzpatrick[] = [
  {
    tipo: "I",
    descricao: "Pele muito clara",
    caracteristicas:
      "Sempre queima, nunca bronzeia. Sardas frequentes. Cabelos ruivos ou loiros claros.",
  },
  {
    tipo: "II",
    descricao: "Pele clara",
    caracteristicas:
      "Queima facilmente, bronzeia minimamente. Cabelos loiros a castanhos claros.",
  },
  {
    tipo: "III",
    descricao: "Pele morena clara",
    caracteristicas:
      "Queima moderadamente, bronzeia gradualmente. Cabelos castanhos.",
  },
  {
    tipo: "IV",
    descricao: "Pele morena moderada",
    caracteristicas:
      "Queima pouco, bronzeia com facilidade. Cabelos castanhos escuros.",
  },
  {
    tipo: "V",
    descricao: "Pele morena escura",
    caracteristicas:
      "Raramente queima, bronzeia intensamente. Cabelos escuros a pretos.",
  },
  {
    tipo: "VI",
    descricao: "Pele negra",
    caracteristicas:
      "Nunca queima, pele profundamente pigmentada. Cabelos pretos.",
  },
];
