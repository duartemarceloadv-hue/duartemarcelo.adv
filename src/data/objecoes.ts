export type Objecao = {
  id: number;
  emoji: string;
  frasePaciente: string;
  objecaoReal: string;
  tecnica: string;
  script: string;
  fraseFechamento: string;
};

export const objecoes: Objecao[] = [
  {
    id: 1,
    emoji: "💰",
    frasePaciente: "Tá muito caro",
    objecaoReal: "Percepção de custo vs valor",
    tecnica: "Investimento vs custo",
    script:
      "Eu entendo. Deixa eu te perguntar: quanto você já gastou com shampoos, vitaminas, produtos que não trouxeram resultado? O protocolo DR HAIR usa 6 substâncias de alta performance aplicadas direto no folículo com microagulha — é um tratamento médico, não cosmético. E a gente facilita o pagamento pra caber no seu orçamento.",
    fraseFechamento:
      "Vamos encontrar a melhor forma de pagamento pra você começar hoje?",
  },
  {
    id: 2,
    emoji: "🤔",
    frasePaciente: "Vou pensar",
    objecaoReal: "Objeção não revelada",
    tecnica: "Descobrir objeção real",
    script:
      "Claro, é uma decisão importante. Mas me ajuda a entender: é o investimento, o tempo, ou você tem alguma dúvida sobre o tratamento? Porque às vezes a gente sai pra pensar e acaba adiando algo que podia começar a resolver agora.",
    fraseFechamento:
      "Me ajuda a entender: é o investimento, o tempo ou alguma dúvida específica?",
  },
  {
    id: 3,
    emoji: "👫",
    frasePaciente: "Preciso falar com meu(a) cônjuge",
    objecaoReal: "Decisão compartilhada / insegurança",
    tecnica: "Envolver na decisão",
    script:
      "Faz todo sentido conversar. Posso te enviar um resumo completo com tudo que conversamos — fotos da tricoscopia, o protocolo indicado, valores e condições — pra você mostrar em casa. Assim a conversa fica mais fácil e objetiva.",
    fraseFechamento:
      "Posso te mandar o resumo por WhatsApp pra facilitar a conversa?",
  },
  {
    id: 4,
    emoji: "😤",
    frasePaciente: "Já tentei e não funcionou",
    objecaoReal: "Frustração com tentativas anteriores",
    tecnica: "Validar + diferenciar",
    script:
      "Eu entendo sua frustração — e é exatamente por isso que você precisa conhecer o que a gente faz. O protocolo DR HAIR usa 6 substâncias aplicadas via microagulha direto no folículo capilar. É completamente diferente de shampoo, tônico ou vitamina oral. A ação é local, concentrada e com substâncias que shampoo nenhum consegue entregar.",
    fraseFechamento:
      "O que você já fez não é a mesma coisa. Quer ver na prática a diferença?",
  },
  {
    id: 5,
    emoji: "🧴",
    frasePaciente: "Shampoo resolve",
    objecaoReal: "Desconhecimento sobre tratamento capilar",
    tecnica: "Educação via tricoscopia",
    script:
      "Shampoo atua na superfície — ele limpa, mas não trata o folículo. Olha aqui na tricoscopia: a miniaturização está acontecendo por dentro. O protocolo DR HAIR entrega substâncias diretamente na raiz do fio, onde o problema realmente está. É a diferença entre lavar por fora e tratar por dentro.",
    fraseFechamento:
      "Shampoo cuida da superfície. O protocolo trata o folículo. Faz sentido?",
  },
  {
    id: 6,
    emoji: "🧬",
    frasePaciente: "É genética, não tem jeito",
    objecaoReal: "Crença de que é irreversível",
    tecnica: "Ressignificar genética",
    script:
      "A genética define a tendência, não o destino. Hoje a gente consegue bloquear 93% do DHT — o hormônio que miniaturiza o folículo — com a Dutasterida. A ciência evoluiu muito. Ter predisposição genética não significa que você precisa aceitar a calvície de braços cruzados.",
    fraseFechamento:
      "Genética é tendência, não sentença. A ciência já tem resposta pra isso.",
  },
  {
    id: 7,
    emoji: "⏰",
    frasePaciente: "Não tenho tempo",
    objecaoReal: "Priorização / rotina",
    tecnica: "Conveniência",
    script:
      "Cada sessão dura de 45 a 60 minutos, a cada 15 dias. É menos tempo do que uma ida ao barbeiro. E o resultado vale cada minuto investido. A gente organiza a agenda pra encaixar no melhor horário pra você.",
    fraseFechamento:
      "São 45 minutos a cada 15 dias. Qual horário funciona melhor pra você?",
  },
  {
    id: 8,
    emoji: "📸",
    frasePaciente: "Quero ver resultado antes",
    objecaoReal: "Insegurança sobre eficácia",
    tecnica: "Transparência + prova social",
    script:
      "Totalmente justo. A gente documenta tudo com fotos da tricoscopia antes, durante e depois. Na 5ª sessão fazemos uma reavaliação completa pra você ver a evolução. Além disso, posso te mostrar resultados de pacientes com um quadro parecido com o seu.",
    fraseFechamento:
      "Posso te mostrar resultados de casos similares ao seu. Quer ver?",
  },
  {
    id: 9,
    emoji: "💲",
    frasePaciente: "Vi mais barato em outro lugar",
    objecaoReal: "Comparação de preço sem comparar qualidade",
    tecnica: "Comparação técnica",
    script:
      "Eu entendo a comparação. Mas é importante olhar o que está incluído. Nosso protocolo usa 6 substâncias de alta qualidade — Dutasterida, Minoxidil Sulfato, Fator de Crescimento, Complexo Vitamínico, Cafeisilane e Luteolina. Muitas clínicas usam 2 ou 3. Além disso, a aplicação é feita por biomédica especializada com acompanhamento individualizado.",
    fraseFechamento:
      "O barato pode sair caro quando o protocolo é incompleto. Faz sentido?",
  },
  {
    id: 10,
    emoji: "💊",
    frasePaciente: "Tenho medo de efeito colateral",
    objecaoReal: "Medo de reações adversas",
    tecnica: "Segurança do protocolo",
    script:
      "É uma preocupação válida. A grande vantagem da intradermoterapia é que as substâncias são aplicadas em doses mínimas, direto no local. Isso reduz drasticamente o risco de efeitos sistêmicos. Não é um medicamento oral que circula pelo corpo todo — é uma ação local e controlada.",
    fraseFechamento:
      "A aplicação é local, com doses mínimas. Muito mais seguro que medicação oral.",
  },
  {
    id: 11,
    emoji: "🤷",
    frasePaciente: "Meu cabelo nem tá tão ruim assim",
    objecaoReal: "Minimização do problema / negação",
    tecnica: "Prevenção + tricoscopia",
    script:
      "Visualmente pode parecer ok, mas olha o que a tricoscopia mostra: já existe miniaturização acontecendo. O melhor momento pra tratar é exatamente agora, antes que fique visível. Quando a queda fica evidente, o folículo já sofreu bastante dano. Prevenir é muito mais eficaz do que tentar reverter.",
    fraseFechamento:
      "O melhor momento pra tratar é antes de ficar visível. E esse momento é agora.",
  },
  {
    id: 12,
    emoji: "💳",
    frasePaciente: "Não tenho cartão de crédito",
    objecaoReal: "Limitação no meio de pagamento",
    tecnica: "Opções de pagamento",
    script:
      "Sem problema! A gente trabalha com várias formas de pagamento: PIX, boleto bancário, Sorocred, crediário próprio e recorrência no cartão de débito. Vamos encontrar a melhor opção pra você.",
    fraseFechamento:
      "Temos PIX, boleto, Sorocred, crediário e recorrência. Qual funciona melhor pra você?",
  },
  {
    id: 13,
    emoji: "❓",
    frasePaciente: "Outro",
    objecaoReal: "Campo livre",
    tecnica: "Escuta ativa",
    script:
      "Conte-me mais sobre sua preocupação. Quero entender exatamente o que está te impedindo de começar pra gente resolver juntos.",
    fraseFechamento:
      "Me conta o que te preocupa pra gente resolver juntos.",
  },
];
