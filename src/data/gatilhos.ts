export type Gatilho = {
  id: number;
  emoji: string;
  nome: string;
  condicao: string;
  abordagem: string;
  dadoTecnico: string;
  fraseChave: string;
};

export const gatilhos: Gatilho[] = [
  {
    id: 1,
    emoji: "⚡",
    nome: "URGÊNCIA MÁXIMA",
    condicao: "Queda >1 ano + visível",
    abordagem: "Senso de urgência",
    dadoTecnico: "Miniaturização progressiva",
    fraseChave:
      "Cada mês sem tratar são folículos que podem se perder de forma irreversível.",
  },
  {
    id: 2,
    emoji: "⚡",
    nome: "URGÊNCIA MODERADA",
    condicao: "Queda 6m-1a",
    abordagem: "Urgência com esperança",
    dadoTecnico: "Fase inicial = melhor resposta",
    fraseChave: "Você está no momento ideal pra começar.",
  },
  {
    id: 3,
    emoji: "🔑",
    nome: "CALVÍCIE AVANÇADA",
    condicao: "Grau IV+",
    abordagem: "Realismo + possibilidades",
    dadoTecnico: "Estabilizar + recuperar parcial",
    fraseChave:
      "O objetivo é frear o processo e recuperar o máximo possível.",
  },
  {
    id: 4,
    emoji: "⚠️",
    nome: "FRUSTRAÇÃO",
    condicao: "Já tentou tratamentos",
    abordagem: "Validar + diferenciar",
    dadoTecnico: "6 substâncias direto no folículo vs tópico",
    fraseChave: "O que você já fez não é a mesma coisa.",
  },
  {
    id: 5,
    emoji: "💡",
    nome: "IMPACTO EMOCIONAL",
    condicao: "Jovem <30 anos",
    abordagem: "Empatia + casos similares",
    dadoTecnico: "Resposta melhor em jovens",
    fraseChave: "Na sua idade o folículo responde muito bem.",
  },
  {
    id: 6,
    emoji: "🔑",
    nome: "PORTA DE ENTRADA",
    condicao: "Caspa/coceira",
    abordagem: "Mostrar inflamação na tricoscopia",
    dadoTecnico: "Luteolina anti-inflamatória",
    fraseChave:
      "Essa caspa é sinal de inflamação que está prejudicando seus folículos.",
  },
  {
    id: 7,
    emoji: "✅",
    nome: "OPORTUNIDADE",
    condicao: "1º tratamento",
    abordagem: "Folículos mais responsivos",
    dadoTecnico: "Sem danos prévios",
    fraseChave:
      "Seus folículos nunca foram estimulados — a resposta tende a ser excelente.",
  },
  {
    id: 8,
    emoji: "⚠️",
    nome: "QUÍMICA",
    condicao: "Progressiva/alisamento",
    abordagem: "Cuidado extra",
    dadoTecnico: "Química danifica haste",
    fraseChave: "A intradermoterapia fortalece o fio de dentro pra fora.",
  },
  {
    id: 9,
    emoji: "🧬",
    nome: "GENÉTICA",
    condicao: "Histórico familiar",
    abordagem: "Ressignificar: tendência ≠ destino",
    dadoTecnico: "Dutasterida bloqueia 93% DHT",
    fraseChave: "Genética é tendência, não sentença.",
  },
  {
    id: 10,
    emoji: "💡",
    nome: "AFINAMENTO PRECOCE",
    condicao: "Afinamento sem queda",
    abordagem: "Atenção precoce",
    dadoTecnico: "Miniaturização pode ser revertida",
    fraseChave: "O afinamento é o primeiro sinal.",
  },
  {
    id: 11,
    emoji: "🔑",
    nome: "OLEOSIDADE",
    condicao: "Oleosidade excessiva",
    abordagem: "Mostrar obstrução",
    dadoTecnico: "Sebo obstrui folículo",
    fraseChave: "Essa oleosidade está sufocando os folículos.",
  },
  {
    id: 12,
    emoji: "⚠️",
    nome: "HÁBITOS AGRAVANTES",
    condicao: "Boné/água quente/lavagem 3x+",
    abordagem: "Orientar mudanças",
    dadoTecnico: "Hábitos agravam",
    fraseChave: "Alguns hábitos simples fazem grande diferença.",
  },
  {
    id: 13,
    emoji: "⚠️",
    nome: "TRICOTILOMANIA",
    condicao: "Arranca cabelo = Sim",
    abordagem: "Encaminhamento psicológico",
    dadoTecnico: "Capilar + psicológico",
    fraseChave: "Abordar com delicadeza",
  },
  {
    id: 14,
    emoji: "⚠️",
    nome: "FATOR DE RISCO",
    condicao: "Tabagismo/etilismo",
    abordagem: "Orientar redução",
    dadoTecnico: "Tabagismo reduz irrigação",
    fraseChave:
      "O cigarro reduz o fluxo de sangue pro couro cabeludo.",
  },
  {
    id: 15,
    emoji: "😰",
    nome: "ESTRESSE ALTO",
    condicao: "Estresse = Alto",
    abordagem: "Fator emocional",
    dadoTecnico: "Cortisol alto prolonga fase telógena",
    fraseChave: "O estresse é um dos maiores vilões do cabelo.",
  },
  {
    id: 16,
    emoji: "⚠️",
    nome: "CONDIÇÕES DE SAÚDE",
    condicao: "Tireoide/anemia/diabetes",
    abordagem: "Transmitir segurança técnica",
    dadoTecnico: "Biomédica avaliará tudo",
    fraseChave: "A biomédica vai fazer uma avaliação completa.",
  },
  {
    id: 17,
    emoji: "⚠️",
    nome: "REPRODUTIVO",
    condicao: "Planeja filhos = Sim",
    abordagem: "Informar adaptação",
    dadoTecnico: "Dutasterida→Cafeisilane",
    fraseChave:
      "O protocolo será adaptado com substâncias seguras.",
  },
  {
    id: 18,
    emoji: "🔑",
    nome: "SENSIBILIDADE",
    condicao: "Couro sensível",
    abordagem: "Cuidado na aplicação",
    dadoTecnico: "Agulha 30G ultrafina",
    fraseChave: "Usamos agulha ultrafina e anestésico tópico.",
  },
  {
    id: 19,
    emoji: "💡",
    nome: "QUEBRADIÇO",
    condicao: "Cabelo quebradiço",
    abordagem: "Nutrição do fio",
    dadoTecnico: "Complexo Vit fortalece queratinização",
    fraseChave:
      "O Complexo Vitamínico nutre e fortalece o fio de dentro pra fora.",
  },
];
