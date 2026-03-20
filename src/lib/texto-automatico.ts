// Gera textos clínicos automáticos baseados nas respostas do paciente

export function gerarTextoSimNao(
  pergunta: string,
  resposta: "Sim" | "Não",
  textoSim: string,
  textoNao: string,
  detalhe?: string
): string {
  let texto = resposta === "Sim" ? textoSim : textoNao;
  if (detalhe) texto += ` ${detalhe}`;
  return texto;
}

export function gerarTextoMultiplo(
  resposta: string,
  mapa: Record<string, string>
): string {
  return mapa[resposta] || "";
}

// === TEXTOS PRÉ-ATENDIMENTO (M1) ===

export const TEXTOS_QUEDA_VOLUME = {
  quedaAcentuada: {
    Sim: (tempo?: string) =>
      `Paciente relata queda acentuada${tempo ? ` há ${tempo}` : ""}.`,
    Não: "Paciente nega queda acentuada.",
  },
  melhora_piora: {
    Sim: "Paciente relata flutuações na queda.",
    Não: "Paciente nega flutuações.",
    "Não notei": "Paciente não notou padrão de flutuação.",
  },
  fiosNovos: {
    Sim: "Paciente percebe nascimento de novos fios.",
    Não: "Paciente nega percepção de novos fios.",
  },
  perdaVolume: {
    Sim: "Paciente relata perda de volume capilar.",
    Não: "Paciente nega perda de volume.",
  },
  peloOutrasAreas: {
    Sim: "Paciente relata perda de pelos em outras áreas.",
    Não: "Paciente nega perda de pelos em outras áreas.",
    "Não notei": "Paciente não notou perda de pelos em outras áreas.",
  },
};

export const TEXTOS_SINAIS_SINTOMAS = {
  coceira: {
    Sim: "Paciente relata coceira no couro cabeludo.",
    Não: "Paciente nega coceira no couro cabeludo.",
  },
  dor: {
    Sim: "Paciente relata dor no couro cabeludo.",
    Não: "Paciente nega dor no couro cabeludo.",
  },
  ardencia: {
    Sim: "Paciente relata ardência ou queimação.",
    Não: "Paciente nega ardência ou queimação.",
  },
  sensibilidade: {
    Sim: "Paciente relata sensibilidade alterada.",
    Não: "Paciente nega sensibilidade alterada.",
  },
  caspa: {
    Sim: "Paciente relata caspa ou descamação.",
    Não: "Paciente nega caspa ou descamação.",
  },
  feridas: {
    Sim: "Paciente relata presença de feridas ou crostas.",
    Não: "Paciente nega presença de feridas ou crostas.",
  },
  vermelhidao: {
    Sim: "Paciente relata vermelhidão no couro cabeludo.",
    Não: "Paciente nega vermelhidão no couro cabeludo.",
  },
};

export const TEXTOS_OLEOSIDADE: Record<string, string> = {
  "Oleoso <24h":
    "Couro cabeludo oleoso (sebo retorna em menos de 24h).",
  "Oleoso >48h":
    "Couro cabeludo com oleosidade moderada.",
  Seco: "Couro cabeludo seco.",
  Normal: "Oleosidade do couro cabeludo dentro da normalidade.",
};

export const TEXTOS_AFINAMENTO = {
  Sim: (tempo?: string) =>
    `Paciente relata percepção de afinamento dos fios${tempo ? ` há ${tempo}` : ""}.`,
  Não: "Paciente nega percepção de afinamento dos fios.",
};

// === TEXTOS SESSÃO (M5) ===

export const TEXTOS_PERGUNTAS_SESSAO = {
  1: {
    pergunta: "Sentiu dor ou desconforto desde a última sessão?",
    Sim: "Paciente relata dor ou desconforto desde a última sessão.",
    Não: "Paciente nega dor ou desconforto desde a última sessão.",
  },
  2: {
    pergunta: "Vermelhidão, coceira ou irritação no couro?",
    Sim: "Paciente relata reação no couro cabeludo (vermelhidão/coceira/irritação) desde a última sessão.",
    Não: "Paciente nega reações adversas no couro cabeludo.",
  },
  3: {
    pergunta: "Está usando kit home care conforme orientado?",
    Sim: "Paciente relata aderência ao protocolo domiciliar conforme orientado.",
    Não: "Paciente relata não utilização do home care. Orientações reforçadas e registrada a importância da aderência.",
    Parcial:
      "Paciente relata aderência parcial ao protocolo domiciliar. Orientações reforçadas.",
  },
  4: {
    pergunta: "Houve alteração nos medicamentos em uso?",
    Sim: "Paciente relata alteração nos medicamentos em uso desde a última sessão.",
    Não: "Paciente nega alteração nos medicamentos em uso.",
  },
  5: {
    pergunta: "Percebeu queda de cabelo diferente do habitual?",
    Sim: "Paciente relata queda capilar acima do habitual desde a última sessão.",
    Não: "Paciente nega queda capilar anormal desde a última sessão.",
  },
  6: {
    pergunta: "Houve alguma mudança no estado de saúde geral?",
    Sim: "Paciente relata alteração no estado de saúde geral.",
    Não: "Paciente nega alterações no estado de saúde geral.",
  },
  7: {
    pergunta: "Houve exposição solar intensa no couro cabeludo?",
    Sim: "Paciente relata exposição solar intensa no couro cabeludo desde a última sessão.",
    Não: "Paciente nega exposição solar intensa no couro cabeludo.",
  },
  8: {
    pergunta:
      "Realizou procedimento químico capilar desde a última sessão?",
    Sim: "Paciente relata procedimento químico capilar desde a última sessão.",
    Não: "Paciente nega procedimentos químicos capilares.",
  },
  9: {
    pergunta: "Está ingerindo água adequadamente (mín. 2L/dia)?",
    Sim: "Paciente relata hidratação adequada (mínimo 2L/dia).",
    Não: "Paciente relata hidratação inadequada. Orientações reforçadas.",
  },
  10: {
    pergunta: "Está satisfeito(a) com a evolução até o momento?",
    Sim: "Paciente relata satisfação com a evolução do tratamento.",
    Não: "Paciente relata insatisfação com a evolução. Realinhamento de expectativas e reavaliação do protocolo indicados.",
    Parcial: "Paciente relata satisfação parcial. Expectativas alinhadas.",
  },
};

// === TEXTOS TESTES CLÍNICOS (M4) ===

export const TEXTOS_TESTES = {
  pullTest: {
    "Positivo (>6 fios)":
      "Pull test positivo (>6 fios), indicativo de eflúvio ativo.",
    Negativo: "Pull test negativo, dentro da normalidade.",
  },
  cardTest: {
    Positivo: "Card test positivo, evidenciando variação de calibre (miniaturização).",
    Negativo: "Card test negativo.",
  },
  tugTest: {
    Positivo: "Tug test positivo, indicando fragilidade da haste capilar.",
    Negativo: "Tug test negativo, resistência da haste dentro da normalidade.",
  },
};

// === TEXTOS 5ª SESSÃO ===

export const TEXTOS_5A_SESSAO = {
  comparacaoFoto: {
    Sim: "Comparação fotográfica da 1ª à 5ª sessão evidencia melhora clínica visível.",
    Parcial:
      "Melhora parcial. Protocolo mantido/ajustado.",
    Não: "Sem melhora significativa. Reavaliação do protocolo indicada.",
  },
  pullTestComparativo: {
    Positivo: "Pull test positivo. Queda persiste.",
    Negativo: "Pull test negativo. Normalização.",
  },
  densidadeComparativa: {
    Melhorou: "Densidade capilar apresentou melhora em comparação ao início do tratamento.",
    Estável: "Densidade capilar manteve-se estável.",
    Piorou: "Densidade capilar apresentou piora. Reavaliação indicada.",
  },
};

// === TEXTOS ÚLTIMA SESSÃO ===

export const TEXTOS_ULTIMA_SESSAO = {
  resultadoGeral: {
    Excelente:
      "Resultado geral do tratamento classificado como excelente.",
    Bom: "Resultado geral do tratamento classificado como bom.",
    Moderado:
      "Resultado geral do tratamento classificado como moderado.",
    Insuficiente:
      "Resultado geral do tratamento classificado como insuficiente. Reavaliação do protocolo indicada.",
  },
  interesseManutencao: {
    Sim: "Paciente demonstra interesse em manutenção. Encaminhado para novo contrato (M6).",
    Não: "Paciente opta por não dar continuidade. Orientações pós fornecidas.",
    Indeciso: "Paciente indeciso quanto à manutenção. Follow-up agendado.",
  },
};
