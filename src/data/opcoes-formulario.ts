export type OpcaoFormulario = {
  valor: string;
  label: string;
};

// ─── QUEIXAS PRINCIPAIS ─────────────────────────────────────────────────────
export const queixasPrincipais: OpcaoFormulario[] = [
  { valor: "queda_cabelo", label: "Queda de cabelo" },
  { valor: "afinamento_fios", label: "Afinamento dos fios" },
  { valor: "rarefacao", label: "Rarefação (falhas visíveis)" },
  { valor: "entradas", label: "Entradas (recessão temporal)" },
  { valor: "coroa", label: "Coroa (vértex) rarefeita" },
  { valor: "caspa", label: "Caspa / descamação" },
  { valor: "coceira", label: "Coceira no couro cabeludo" },
  { valor: "oleosidade", label: "Oleosidade excessiva" },
  { valor: "cabelo_quebradico", label: "Cabelo quebradiço" },
  { valor: "cabelo_seco", label: "Cabelo seco / sem brilho" },
  { valor: "crescimento_lento", label: "Crescimento lento" },
  { valor: "outro", label: "Outro" },
];

// ─── CONDIÇÕES DO COURO CABELUDO ────────────────────────────────────────────
export const condicoesCouro: OpcaoFormulario[] = [
  { valor: "normal", label: "Normal" },
  { valor: "oleoso", label: "Oleoso" },
  { valor: "seco", label: "Seco" },
  { valor: "caspa_seca", label: "Caspa seca" },
  { valor: "caspa_oleosa", label: "Caspa oleosa" },
  { valor: "dermatite", label: "Dermatite seborreica" },
  { valor: "coceira", label: "Coceira frequente" },
  { valor: "vermelhidao", label: "Vermelhidão" },
  { valor: "sensibilidade", label: "Sensibilidade / dor ao toque" },
  { valor: "foliculite", label: "Foliculite" },
  { valor: "outro", label: "Outro" },
];

// ─── TRATAMENTOS ANTERIORES ─────────────────────────────────────────────────
export const tratamentosAnteriores: OpcaoFormulario[] = [
  { valor: "nenhum", label: "Nenhum (1º tratamento)" },
  { valor: "minoxidil_topico", label: "Minoxidil tópico" },
  { valor: "finasterida_oral", label: "Finasterida oral" },
  { valor: "dutasterida_oral", label: "Dutasterida oral" },
  { valor: "shampoo_antiqueda", label: "Shampoo antiqueda" },
  { valor: "vitaminas_oral", label: "Vitaminas / suplementos orais" },
  { valor: "laser_led", label: "Laser / LED capilar" },
  { valor: "prp", label: "PRP (Plasma Rico em Plaquetas)" },
  { valor: "intradermoterapia", label: "Intradermoterapia / mesoterapia" },
  { valor: "microagulhamento", label: "Microagulhamento" },
  { valor: "transplante", label: "Transplante capilar" },
  { valor: "tonico_capilar", label: "Tônico capilar manipulado" },
  { valor: "outro", label: "Outro" },
];

// ─── CONDIÇÕES DE SAÚDE ─────────────────────────────────────────────────────
export const condicoesSaude: OpcaoFormulario[] = [
  { valor: "nenhuma", label: "Nenhuma" },
  { valor: "diabetes", label: "Diabetes" },
  { valor: "hipertensao", label: "Hipertensão" },
  { valor: "hipotireoidismo", label: "Hipotireoidismo" },
  { valor: "hipertireoidismo", label: "Hipertireoidismo" },
  { valor: "anemia", label: "Anemia" },
  { valor: "ferritina_baixa", label: "Ferritina baixa" },
  { valor: "sop", label: "Síndrome dos Ovários Policísticos (SOP)" },
  { valor: "depressao", label: "Depressão" },
  { valor: "ansiedade", label: "Ansiedade" },
  { valor: "lupus", label: "Lúpus" },
  { valor: "psoríase", label: "Psoríase" },
  { valor: "cancer", label: "Câncer (ativo ou em remissão)" },
  { valor: "epilepsia", label: "Epilepsia" },
  { valor: "cardiopatia", label: "Cardiopatia" },
  { valor: "coagulopatia", label: "Coagulopatia / distúrbio de coagulação" },
  { valor: "outro", label: "Outro" },
];

// ─── MEDICAMENTOS EM USO ────────────────────────────────────────────────────
export const medicamentos: OpcaoFormulario[] = [
  { valor: "nenhum", label: "Nenhum" },
  { valor: "finasterida", label: "Finasterida" },
  { valor: "dutasterida", label: "Dutasterida" },
  { valor: "minoxidil", label: "Minoxidil" },
  { valor: "isotretinoina", label: "Isotretinoína (Roacutan)" },
  { valor: "anticoagulante", label: "Anticoagulante" },
  { valor: "antidepressivo", label: "Antidepressivo" },
  { valor: "ansiolitico", label: "Ansiolítico" },
  { valor: "anticoncepcional", label: "Anticoncepcional" },
  { valor: "hormonio_tireoide", label: "Hormônio tireoidiano" },
  { valor: "corticoide", label: "Corticoide" },
  { valor: "quimioterapico", label: "Quimioterápico" },
  { valor: "anti_hipertensivo", label: "Anti-hipertensivo" },
  { valor: "hipoglicemiante", label: "Hipoglicemiante / insulina" },
  { valor: "suplemento", label: "Suplemento vitamínico" },
  { valor: "outro", label: "Outro" },
];

// ─── ALERGIAS ───────────────────────────────────────────────────────────────
export const alergias: OpcaoFormulario[] = [
  { valor: "nenhuma", label: "Nenhuma" },
  { valor: "anestesicos", label: "Anestésicos locais (lidocaína)" },
  { valor: "latex", label: "Látex" },
  { valor: "metais", label: "Metais (níquel, cromo)" },
  { valor: "medicamentos", label: "Medicamentos (especificar)" },
  { valor: "cosmeticos", label: "Cosméticos / produtos capilares" },
  { valor: "outro", label: "Outro" },
];

// ─── TEMPO DE QUEDA ─────────────────────────────────────────────────────────
export const temposQueda: OpcaoFormulario[] = [
  { valor: "menos_6m", label: "Menos de 6 meses" },
  { valor: "6m_1a", label: "6 meses a 1 ano" },
  { valor: "1a_3a", label: "1 a 3 anos" },
  { valor: "3a_5a", label: "3 a 5 anos" },
  { valor: "mais_5a", label: "Mais de 5 anos" },
  { valor: "nao_sabe", label: "Não sabe informar" },
];

// ─── HISTÓRICO FAMILIAR ─────────────────────────────────────────────────────
export const historicoFamiliar: OpcaoFormulario[] = [
  { valor: "pai", label: "Pai" },
  { valor: "mae", label: "Mãe" },
  { valor: "avo_paterno", label: "Avô paterno" },
  { valor: "avo_materno", label: "Avô materno" },
  { valor: "avos_ambos", label: "Avós (ambos os lados)" },
  { valor: "tios", label: "Tios" },
  { valor: "irmaos", label: "Irmãos" },
  { valor: "nenhum", label: "Nenhum histórico familiar" },
  { valor: "nao_sabe", label: "Não sabe informar" },
];

// ─── NÍVEL DE ESTRESSE ──────────────────────────────────────────────────────
export const niveisEstresse: OpcaoFormulario[] = [
  { valor: "baixo", label: "Baixo" },
  { valor: "moderado", label: "Moderado" },
  { valor: "alto", label: "Alto" },
  { valor: "muito_alto", label: "Muito alto" },
];

// ─── QUALIDADE DO SONO ──────────────────────────────────────────────────────
export const qualidadesSono: OpcaoFormulario[] = [
  { valor: "boa", label: "Boa (7-9h, sem interrupções)" },
  { valor: "regular", label: "Regular (dificuldade para dormir ou sono leve)" },
  { valor: "ruim", label: "Ruim (insônia ou sono muito fragmentado)" },
];

// ─── HÁBITOS ────────────────────────────────────────────────────────────────
export const habitos: OpcaoFormulario[] = [
  { valor: "bone_chapeu", label: "Uso frequente de boné/chapéu" },
  { valor: "agua_quente", label: "Lavagem com água muito quente" },
  { valor: "lavagem_excessiva", label: "Lavagem 3x ou mais por dia" },
  { valor: "secador_quente", label: "Uso frequente de secador quente" },
  { valor: "progressiva", label: "Progressiva / alisamento químico" },
  { valor: "tintura", label: "Tintura / coloração frequente" },
  { valor: "puxar_prender", label: "Prender o cabelo com força (tração)" },
  { valor: "arrancar_fios", label: "Arrancar fios (tricotilomania)" },
  { valor: "tabagismo", label: "Tabagismo" },
  { valor: "etilismo", label: "Consumo frequente de álcool" },
  { valor: "nenhum", label: "Nenhum hábito agravante" },
];

// ─── SEXO BIOLÓGICO ─────────────────────────────────────────────────────────
export const sexoBiologico: OpcaoFormulario[] = [
  { valor: "masculino", label: "Masculino" },
  { valor: "feminino", label: "Feminino" },
];

// ─── PLANEJAMENTO REPRODUTIVO ───────────────────────────────────────────────
export const planejamentoReprodutivo: OpcaoFormulario[] = [
  { valor: "sim", label: "Sim, planejo ter filhos" },
  { valor: "nao", label: "Não planejo ter filhos" },
  { valor: "ja_tenho", label: "Já tenho filhos, não planejo mais" },
  { valor: "nao_definido", label: "Ainda não decidi" },
];

// ─── FORMAS DE PAGAMENTO ────────────────────────────────────────────────────
export const formasPagamento: OpcaoFormulario[] = [
  { valor: "pix", label: "PIX" },
  { valor: "cartao_credito", label: "Cartão de crédito" },
  { valor: "cartao_debito", label: "Cartão de débito" },
  { valor: "boleto", label: "Boleto bancário" },
  { valor: "sorocred", label: "Sorocred" },
  { valor: "crediario", label: "Crediário próprio" },
  { valor: "recorrencia", label: "Recorrência no cartão" },
];

// ─── COMO CONHECEU A CLÍNICA ────────────────────────────────────────────────
export const comoConheceu: OpcaoFormulario[] = [
  { valor: "instagram", label: "Instagram" },
  { valor: "facebook", label: "Facebook" },
  { valor: "google", label: "Google" },
  { valor: "tiktok", label: "TikTok" },
  { valor: "indicacao", label: "Indicação de amigo/familiar" },
  { valor: "indicacao_profissional", label: "Indicação de profissional de saúde" },
  { valor: "passou_frente", label: "Passou em frente à clínica" },
  { valor: "outro", label: "Outro" },
];
