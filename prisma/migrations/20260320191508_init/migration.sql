-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "crmCrbm" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "rg" TEXT,
    "cpf" TEXT NOT NULL,
    "dataNascimento" DATETIME NOT NULL,
    "celular" TEXT NOT NULL,
    "email" TEXT,
    "sexo" TEXT NOT NULL,
    "estadoCivil" TEXT,
    "ocupacao" TEXT,
    "endereco" TEXT,
    "indicacao" TEXT,
    "comoConheceu" TEXT,
    "contatoUrgNome" TEXT,
    "contatoUrgTel" TEXT,
    "contatoUrgParentesco" TEXT,
    "peso" REAL,
    "altura" REAL,
    "imc" REAL,
    "lgpdConsent" BOOLEAN NOT NULL DEFAULT false,
    "statusFluxo" TEXT NOT NULL DEFAULT 'cadastrado',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PreAtendimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "queixas" TEXT NOT NULL,
    "tempoQueixa" TEXT,
    "quedaVolume" TEXT NOT NULL,
    "afinamento" TEXT,
    "sinaisSintomas" TEXT NOT NULL,
    "oleosidade" TEXT,
    "condicoesCouro" TEXT NOT NULL,
    "tratAnteriores" TEXT NOT NULL,
    "histFamiliar" TEXT NOT NULL,
    "expectativas" TEXT NOT NULL,
    "higiene" TEXT NOT NULL,
    "cuidadosCapilares" TEXT,
    "condicoesSaude" TEXT NOT NULL,
    "infoSaudeExtra" TEXT,
    "medicamentos" TEXT NOT NULL,
    "alergias" TEXT NOT NULL,
    "habitos" TEXT NOT NULL,
    "reprodutivo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreAtendimento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Briefing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "preAtendimentoId" INTEGER NOT NULL,
    "resumo" TEXT NOT NULL,
    "perfilCompleto" TEXT NOT NULL,
    "gatilhos" TEXT NOT NULL,
    "objecoes" TEXT NOT NULL,
    "substancias" TEXT NOT NULL,
    "roteiro" TEXT NOT NULL,
    "trilhaProvavel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Briefing_preAtendimentoId_fkey" FOREIGN KEY ("preAtendimentoId") REFERENCES "PreAtendimento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tricoscopia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "consultaVendaId" INTEGER NOT NULL,
    "fotoUrl" TEXT,
    "iaAnalise" TEXT NOT NULL,
    "edicoes" TEXT,
    "classificacaoHN" TEXT,
    "classificacaoOlsen" TEXT,
    "diagnosticoProvavel" TEXT,
    "textoAnalise" TEXT,
    "dicaVenda" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tricoscopia_consultaVendaId_fkey" FOREIGN KEY ("consultaVendaId") REFERENCES "ConsultaVenda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsultaVenda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "consultorId" INTEGER NOT NULL,
    "briefingId" INTEGER NOT NULL,
    "identidadeConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "checklist8passos" TEXT NOT NULL,
    "avaliacaoRegeneracao" TEXT,
    "pacote" TEXT,
    "valor" REAL,
    "numSessoes" INTEGER,
    "objecoes" TEXT,
    "decisao" TEXT,
    "motivoNaoFechou" TEXT,
    "followupData" DATETIME,
    "observacoes" TEXT,
    "laudoGerado" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsultaVenda_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConsultaVenda_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConsultaVenda_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "consultaVendaId" INTEGER,
    "tipo" TEXT NOT NULL,
    "numContrato" TEXT,
    "pacote" TEXT,
    "valor" REAL NOT NULL,
    "desconto" REAL NOT NULL DEFAULT 0,
    "valorFinal" REAL NOT NULL,
    "numSessoes" INTEGER NOT NULL,
    "prazoMaxMeses" INTEGER,
    "formaPagamento" TEXT NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "valorParcela" REAL,
    "kitHomeCare" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "assinado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contrato_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contrato_consultaVendaId_fkey" FOREIGN KEY ("consultaVendaId") REFERENCES "ConsultaVenda" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contratoId" INTEGER NOT NULL,
    "parcela" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "dataVenc" DATETIME NOT NULL,
    "dataPago" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "formaPgto" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pagamento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnamneseBiomedica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "identidadeConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "queixasConfirmadas" TEXT,
    "saudeConfirmada" TEXT,
    "alergiasConfirmadas" TEXT,
    "medsConfirmados" TEXT,
    "tempoQuedaDetalhado" TEXT,
    "evolucao" TEXT,
    "doencasPele" TEXT,
    "cirurgiasAnteriores" TEXT,
    "internacoes" TEXT,
    "medsEspecificos" TEXT,
    "sono" TEXT,
    "alimentacao" TEXT,
    "atividadeFisica" TEXT,
    "aguaDia" TEXT,
    "classificacaoHN" TEXT,
    "classificacaoLudwig" TEXT,
    "classificacaoOlsen" TEXT,
    "classificacaoFitzpatrick" TEXT,
    "pullTest" TEXT,
    "pullTestTexto" TEXT,
    "cardTest" TEXT,
    "tugTest" TEXT,
    "washTest" TEXT,
    "tricoMiniaturizacao" TEXT,
    "tricoAnomalias" TEXT,
    "tricoOstios" TEXT,
    "tricoEpiderme" TEXT,
    "tricoAreasAfetadas" TEXT,
    "densidade" TEXT,
    "elasticidade" TEXT,
    "textura" TEXT,
    "porosidade" TEXT,
    "curvatura" TEXT,
    "diametro" TEXT,
    "tipoClassificacao" TEXT,
    "corNatural" TEXT,
    "escalaDorPre" INTEGER,
    "toleranciaDor" TEXT,
    "contraindicacoes" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnamneseBiomedica_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroFoto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "moduloOrigem" TEXT NOT NULL,
    "angulo" TEXT NOT NULL,
    "fotoUrl" TEXT NOT NULL,
    "conforme" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroFoto_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsentimentoFoto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "prontuario" BOOLEAN NOT NULL DEFAULT true,
    "cientifico" BOOLEAN NOT NULL DEFAULT false,
    "educacional" BOOLEAN NOT NULL DEFAULT false,
    "comercialAnon" BOOLEAN NOT NULL DEFAULT false,
    "comercialSemAnon" BOOLEAN NOT NULL DEFAULT false,
    "naoAutoriza" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsentimentoFoto_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanoTerapeutico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "diagnosticoPrincipal" TEXT NOT NULL,
    "diagnosticosSecundarios" TEXT,
    "trilha" TEXT NOT NULL,
    "mescla" TEXT NOT NULL,
    "numSessoes" INTEGER NOT NULL,
    "frequencia" TEXT NOT NULL,
    "intervalo" TEXT NOT NULL,
    "cronograma" TEXT,
    "expectativas" TEXT,
    "assinado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlanoTerapeutico_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TCLE" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "informadoProcedimento" BOOLEAN NOT NULL DEFAULT false,
    "informadoEfeitos" BOOLEAN NOT NULL DEFAULT false,
    "informadoContraind" BOOLEAN NOT NULL DEFAULT false,
    "declarouAlergias" BOOLEAN NOT NULL DEFAULT false,
    "autorizouFotos" BOOLEAN NOT NULL DEFAULT false,
    "recebeuHomeCare" BOOLEAN NOT NULL DEFAULT false,
    "assinado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TCLE_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "biomedId" INTEGER NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "numSessao" INTEGER NOT NULL,
    "totalSessoes" INTEGER NOT NULL,
    "identidadeConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "checklistPre" TEXT NOT NULL,
    "perguntasRecorrentes" TEXT NOT NULL,
    "checklistMescla" TEXT NOT NULL,
    "volumeTotal" REAL,
    "checklistMateriais" TEXT,
    "checklistLED" TEXT,
    "tempoLED" INTEGER,
    "doseLED" REAL,
    "intercorrenciasLED" TEXT,
    "dorPos" INTEGER,
    "checklistOrientacoesPo" TEXT,
    "checklistPos" TEXT,
    "prescricaoAdicional" TEXT,
    "observacoes" TEXT,
    "isSessao5" BOOLEAN NOT NULL DEFAULT false,
    "extras5sessao" TEXT,
    "isUltimaSessao" BOOLEAN NOT NULL DEFAULT false,
    "extrasUltima" TEXT,
    "prontuarioTexto" TEXT,
    "assinado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sessao_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sessao_biomedId_fkey" FOREIGN KEY ("biomedId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sessao_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExameLaboratorial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "dataExames" DATETIME,
    "hemograma" TEXT,
    "bioquimica" TEXT,
    "hormonios" TEXT,
    "vitaminas" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExameLaboratorial_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Manutencao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "novoContratoId" INTEGER NOT NULL,
    "regressao" TEXT,
    "homeCareEntre" TEXT,
    "mudancaSaude" TEXT,
    "expectativa" TEXT,
    "reavaliacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Manutencao_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Manutencao_novoContratoId_fkey" FOREIGN KEY ("novoContratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "resultadoGeral" TEXT NOT NULL,
    "evolucaoClinica" TEXT,
    "classificacaoFinal" TEXT,
    "encaminhamento" TEXT,
    "orientacoes" TEXT,
    "dataAlta" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricoFluxo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "etapaAnterior" TEXT NOT NULL,
    "etapaAtual" TEXT NOT NULL,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoricoFluxo_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cpf_key" ON "Paciente"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Briefing_preAtendimentoId_key" ON "Briefing"("preAtendimentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Tricoscopia_consultaVendaId_key" ON "Tricoscopia"("consultaVendaId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultaVenda_briefingId_key" ON "ConsultaVenda"("briefingId");

-- CreateIndex
CREATE UNIQUE INDEX "Manutencao_novoContratoId_key" ON "Manutencao"("novoContratoId");
