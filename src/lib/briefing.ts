// Geração automática do Briefing (6 blocos) a partir do Pré-Atendimento (M1)

interface DadosM1 {
  nome: string;
  idade: number;
  sexo: string;
  peso?: number;
  altura?: number;
  imc?: number;
  queixas: string[];
  tempoQueixa?: string;
  quedaVolume: Record<string, string>;
  afinamento?: Record<string, string>;
  sinaisSintomas: Record<string, string>;
  oleosidade?: string;
  condicoesCouro: string[];
  tratAnteriores: Record<string, unknown>;
  histFamiliar: Record<string, string>;
  expectativas: Record<string, unknown>;
  higiene: Record<string, unknown>;
  condicoesSaude: string[];
  medicamentos: string[];
  alergias: string[];
  habitos: Record<string, string>;
  reprodutivo: Record<string, string>;
}

export interface BriefingGerado {
  resumo: ResumoRapido;
  perfilCompleto: Record<string, unknown>;
  gatilhosAtivados: number[];
  objecoesProvaveis: number[];
  trilhaProvavel: string;
  roteiro: string[];
}

interface ResumoRapido {
  bullets: string[];
  alertas: string[];
  trilhaProvavel: string;
}

export function gerarBriefing(dados: DadosM1): BriefingGerado {
  const resumo = gerarResumoRapido(dados);
  const gatilhosAtivados = detectarGatilhos(dados);
  const objecoesProvaveis = detectarObjecoes(dados);
  const trilhaProvavel = determinarTrilha(dados);
  const roteiro = gerarRoteiro(dados, gatilhosAtivados);

  return {
    resumo,
    perfilCompleto: dados as unknown as Record<string, unknown>,
    gatilhosAtivados,
    objecoesProvaveis,
    trilhaProvavel,
    roteiro,
  };
}

function gerarResumoRapido(dados: DadosM1): ResumoRapido {
  const bullets: string[] = [];
  const alertas: string[] = [];

  bullets.push(`${dados.nome}, ${dados.idade} anos, ${dados.sexo}`);
  bullets.push(`Queixas: ${dados.queixas.join(", ")}`);
  if (dados.tempoQueixa) bullets.push(`Tempo: ${dados.tempoQueixa}`);

  const tratou = dados.tratAnteriores as { tratamentos?: string[] };
  if (tratou?.tratamentos?.includes("Nenhum")) {
    bullets.push("Nunca tratou (1º tratamento)");
  } else {
    bullets.push("Já tratou anteriormente");
  }

  if (dados.histFamiliar?.historico && dados.histFamiliar.historico !== "Sem histórico") {
    bullets.push(`Genética: ${dados.histFamiliar.historico}`);
  }

  if (dados.imc && dados.imc > 30) {
    bullets.push(`IMC: ${dados.imc.toFixed(1)} (obesidade)`);
  }

  // Alertas
  if (dados.reprodutivo?.planejaFilhos === "Sim") {
    alertas.push("⚠️ Planeja filhos — Dutasterida CONTRAINDICADA");
  }
  if (dados.reprodutivo?.gestante === "Sim") {
    alertas.push("⚠️ GESTANTE — Procedimento CONTRAINDICADO");
  }
  if (dados.condicoesSaude.includes("Epilepsia")) {
    alertas.push("⚠️ Epilepsia — LEDterapia contraindicada");
  }
  if (dados.medicamentos.includes("Anticoagulantes")) {
    alertas.push("⚠️ Anticoagulantes — Avaliar com RT");
  }
  if (dados.medicamentos.includes("Isotretinoína (Roacutan)")) {
    alertas.push("⚠️ Roacutan — CONTRAINDICAÇÃO ABSOLUTA");
  }
  if (dados.alergias.includes("Anestésicos locais (lidocaína)")) {
    alertas.push("⚠️ Alergia a anestésicos — Adaptar protocolo");
  }

  const trilhaProvavel = determinarTrilha(dados);

  return { bullets, alertas, trilhaProvavel };
}

function detectarGatilhos(dados: DadosM1): number[] {
  const ativados: number[] = [];

  // 1. Urgência máxima
  if (
    dados.tempoQueixa &&
    (dados.tempoQueixa.includes("> 3 anos") || dados.tempoQueixa.includes("1-3 anos"))
  ) {
    ativados.push(1);
  }
  // 2. Urgência moderada
  if (dados.tempoQueixa === "6m-1 ano") ativados.push(2);

  // 3. Calvície avançada
  if (dados.queixas.includes("Calvície avançada")) ativados.push(3);

  // 4. Frustração
  const trat = dados.tratAnteriores as { tratamentos?: string[] };
  if (trat?.tratamentos && !trat.tratamentos.includes("Nenhum")) ativados.push(4);

  // 5. Impacto emocional
  if (dados.idade < 30) ativados.push(5);

  // 6. Porta de entrada (caspa/coceira)
  if (
    dados.condicoesCouro.includes("Caspa") ||
    dados.condicoesCouro.includes("Coceira")
  ) {
    ativados.push(6);
  }

  // 7. Oportunidade (1º tratamento)
  if (trat?.tratamentos?.includes("Nenhum")) ativados.push(7);

  // 8. Química
  if (dados.condicoesCouro.includes("Progressiva/alisamento") || dados.condicoesCouro.includes("Química")) {
    ativados.push(8);
  }

  // 9. Genética
  if (dados.histFamiliar?.historico && dados.histFamiliar.historico !== "Sem histórico") {
    ativados.push(9);
  }

  // 10. Afinamento precoce
  if (dados.queixas.includes("Afinamento dos fios")) ativados.push(10);

  // 11. Oleosidade
  if (dados.condicoesCouro.includes("Oleosidade") || dados.oleosidade === "Oleoso <24h") {
    ativados.push(11);
  }

  // 12. Hábitos agravantes
  const hig = dados.higiene as Record<string, string>;
  if (
    hig?.boné === "Sim" ||
    hig?.temperatura === "Quente" ||
    hig?.frequencia === "3x+/dia"
  ) {
    ativados.push(12);
  }

  // 13. Tricotilomania
  if (hig?.arrancaCabelo === "Sim") ativados.push(13);

  // 14. Fator de risco
  if (dados.habitos?.tabagismo === "Sim" || dados.habitos?.etilismo === "Sim") {
    ativados.push(14);
  }

  // 15. Estresse alto
  if (dados.habitos?.estresse === "Alto") ativados.push(15);

  // 16. Condições de saúde
  if (
    dados.condicoesSaude.some((c) =>
      ["Tireoide (hipo/hiper)", "Anemia", "Diabetes"].includes(c)
    )
  ) {
    ativados.push(16);
  }

  // 17. Reprodutivo
  if (dados.reprodutivo?.planejaFilhos === "Sim") ativados.push(17);

  // 18. Sensibilidade
  if (dados.condicoesCouro.includes("Sensibilidade")) ativados.push(18);

  // 19. Quebradiço
  if (dados.queixas.includes("Cabelo quebradiço")) ativados.push(19);

  return ativados;
}

function detectarObjecoes(dados: DadosM1): number[] {
  const provaveis: number[] = [];

  // Objeção 4 (já tentei) se já tratou
  const trat = dados.tratAnteriores as { tratamentos?: string[] };
  if (trat?.tratamentos && !trat.tratamentos.includes("Nenhum")) {
    provaveis.push(4);
  }

  // Objeção 6 (genética) se histórico familiar
  if (dados.histFamiliar?.historico && dados.histFamiliar.historico !== "Sem histórico") {
    provaveis.push(6);
  }

  // Objeção 11 (não tá ruim) se queixa é sutil
  if (dados.queixas.includes("Afinamento dos fios") && dados.queixas.length === 1) {
    provaveis.push(11);
  }

  // Objeção 10 (medo colateral) se muitas condições de saúde
  if (dados.condicoesSaude.length > 2) provaveis.push(10);

  return provaveis;
}

function determinarTrilha(dados: DadosM1): string {
  const queixas = dados.queixas;
  const genética = dados.histFamiliar?.historico !== "Sem histórico";
  const gestante = dados.reprodutivo?.gestante === "Sim" || dados.reprodutivo?.planejaFilhos === "Sim";

  // Seborreica
  if (
    queixas.includes("Caspa/descamação") &&
    queixas.includes("Oleosidade excessiva")
  ) {
    return "Alopecia Seborreica → Complexo Vit + Fator";
  }

  // AGA
  if (genética || queixas.includes("Entradas (recuo frontal)") || queixas.includes("Calvície avançada")) {
    if (gestante) {
      return `AGA ${dados.sexo === "Feminino" ? "Feminina" : "Masculina"} → Complexo Vit + Fator + Minoxidil + Cafeisilane C (⚠️ Dutasterida contraindicada)`;
    }
    return `AGA ${dados.sexo === "Feminino" ? "Feminina" : "Masculina"} → Complexo Vit + Fator + Minoxidil + Dutasterida`;
  }

  // Eflúvio
  if (queixas.includes("Queda de cabelo")) {
    return "Eflúvio Telógeno → Complexo Vit + Fator + Minoxidil (sem Dutasterida)";
  }

  return "Avaliação necessária — tricoscopia definirá trilha";
}

function gerarRoteiro(dados: DadosM1, gatilhos: number[]): string[] {
  const roteiro: string[] = [];
  roteiro.push("1. Acolher — cumprimentar pelo nome, escutar antes de falar");

  if (gatilhos.length > 0) {
    const principal = gatilhos[0];
    roteiro.push(`2. Gatilho principal (#${principal}) — usar como abertura`);
  }

  roteiro.push("3. Tricoscopia — direcionar com base nas queixas");
  roteiro.push("4. Apresentar achados — conectar ao que o paciente sente");
  roteiro.push("5. Protocolo — apresentar trilha personalizada");
  roteiro.push("6. Expectativas — alinhar realismo + otimismo");
  roteiro.push("7. Objeções previstas — antecipar e quebrar");
  roteiro.push("8. Fechamento — oferecer opções de pagamento");

  return roteiro;
}
