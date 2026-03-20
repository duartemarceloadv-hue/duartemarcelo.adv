export type ContraindicacaoAbsoluta = {
  condicao: string;
  motivo: string;
  oque_fazer: string;
};

export type CondicaoAtencao = {
  condicao: string;
  impacto: string;
  acao: string;
};

export const contraindicacoesAbsolutas: ContraindicacaoAbsoluta[] = [
  {
    condicao: "Gestação",
    motivo:
      "Dutasterida e Minoxidil são teratogênicos — risco de malformação fetal.",
    oque_fazer:
      "Não realizar o procedimento. Orientar retorno após gestação e amamentação.",
  },
  {
    condicao: "Amamentação",
    motivo:
      "Substâncias podem ser excretadas no leite materno e afetar o lactente.",
    oque_fazer:
      "Aguardar término da amamentação para iniciar o protocolo.",
  },
  {
    condicao: "Isotretinoína em uso",
    motivo:
      "Pele extremamente fragilizada, risco elevado de cicatrização anormal e queloides.",
    oque_fazer:
      "Aguardar no mínimo 6 meses após a suspensão da isotretinoína.",
  },
  {
    condicao: "Infecção ativa no couro cabeludo",
    motivo:
      "Risco de disseminação da infecção e piora do quadro com microagulhamento.",
    oque_fazer:
      "Tratar a infecção primeiro. Encaminhar ao dermatologista se necessário.",
  },
  {
    condicao: "Coagulopatia grave / Uso de anticoagulantes",
    motivo:
      "Risco de sangramento excessivo durante a aplicação com microagulha.",
    oque_fazer:
      "Solicitar avaliação hematológica e liberação médica antes de prosseguir.",
  },
  {
    condicao: "Alergia a anestésicos locais",
    motivo:
      "O protocolo utiliza anestésico tópico antes da aplicação — risco de reação alérgica grave.",
    oque_fazer:
      "Verificar alternativas de anestesia com a biomédica. Não aplicar sem avaliação prévia.",
  },
  {
    condicao: "Câncer ativo",
    motivo:
      "Fatores de crescimento podem estimular proliferação celular em neoplasias ativas.",
    oque_fazer:
      "Não realizar o procedimento. Aguardar liberação do oncologista.",
  },
  {
    condicao: "Epilepsia não controlada (LED)",
    motivo:
      "O uso de LED/laser de baixa intensidade pode desencadear crises convulsivas em epilepsia fotossensível.",
    oque_fazer:
      "Excluir LED do protocolo ou aguardar controle adequado com neurologista.",
  },
];

export const condicoesAtencao: CondicaoAtencao[] = [
  {
    condicao: "Diabetes",
    impacto:
      "Cicatrização mais lenta, maior risco de infecção pós-procedimento.",
    acao: "Verificar controle glicêmico. Prosseguir com cuidado redobrado na assepsia.",
  },
  {
    condicao: "Hipertensão",
    impacto:
      "Minoxidil é vasodilatador — pode potencializar efeitos hipotensivos.",
    acao: "Avaliar medicação anti-hipertensiva em uso. Monitorar PA antes da sessão.",
  },
  {
    condicao: "Distúrbio de tireoide",
    impacto:
      "Hipotireoidismo e hipertireoidismo causam eflúvio telógeno independente da AGA.",
    acao: "Solicitar TSH e T4 livre. Encaminhar ao endocrinologista se descompensado.",
  },
  {
    condicao: "Anemia / Ferritina baixa",
    impacto:
      "Ferritina abaixo de 30 ng/mL compromete o crescimento capilar e a resposta ao tratamento.",
    acao: "Solicitar hemograma e ferritina. Suplementação de ferro pode ser necessária.",
  },
  {
    condicao: "Síndrome dos Ovários Policísticos (SOP)",
    impacto:
      "Hiperandrogenismo agrava a alopecia androgenética feminina.",
    acao: "Verificar acompanhamento ginecológico/endócrino. Ajustar protocolo conforme perfil hormonal.",
  },
  {
    condicao: "Tendência a queloides",
    impacto:
      "Microagulhamento pode desencadear formação de queloides em pacientes predispostos.",
    acao: "Avaliar histórico de cicatrização. Considerar profundidade menor de agulha.",
  },
  {
    condicao: "Depressão / Ansiedade",
    impacto:
      "Impacto emocional da queda capilar pode agravar o quadro psicológico. Cortisol elevado piora o eflúvio.",
    acao: "Abordar com empatia. Verificar acompanhamento psicológico/psiquiátrico.",
  },
  {
    condicao: "Tabagismo",
    impacto:
      "Reduz a microcirculação no couro cabeludo, diminuindo a resposta ao tratamento.",
    acao: "Orientar cessação ou redução. Informar impacto nos resultados.",
  },
  {
    condicao: "Etilismo",
    impacto:
      "Pode comprometer absorção de nutrientes essenciais para o folículo e afetar o fígado.",
    acao: "Orientar redução do consumo. Avaliar função hepática se necessário.",
  },
  {
    condicao: "Planejamento reprodutivo",
    impacto:
      "Dutasterida é contraindicada para homens que planejam ter filhos — risco de impacto na fertilidade.",
    acao: "Substituir Dutasterida por Cafeisilane C® 3%. Informar o paciente sobre a adaptação.",
  },
];
