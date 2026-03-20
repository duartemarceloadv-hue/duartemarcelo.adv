import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transicionarPaciente } from "@/lib/fluxo";

// POST /api/biomedica — Salvar anamnese biomédica (M4)
export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.pacienteId) {
    return NextResponse.json({ error: "pacienteId obrigatório" }, { status: 400 });
  }

  const anamnese = await prisma.anamneseBiomedica.create({
    data: {
      pacienteId: data.pacienteId,
      identidadeConfirmada: data.identidadeConfirmada || false,
      queixasConfirmadas: data.queixasConfirmadas ? JSON.stringify(data.queixasConfirmadas) : null,
      saudeConfirmada: data.saudeConfirmada ? JSON.stringify(data.saudeConfirmada) : null,
      alergiasConfirmadas: data.alergiasConfirmadas ? JSON.stringify(data.alergiasConfirmadas) : null,
      medsConfirmados: data.medsConfirmados ? JSON.stringify(data.medsConfirmados) : null,
      tempoQuedaDetalhado: data.tempoQuedaDetalhado || null,
      evolucao: data.evolucao || null,
      doencasPele: data.doencasPele || null,
      cirurgiasAnteriores: data.cirurgiasAnteriores || null,
      internacoes: data.internacoes || null,
      medsEspecificos: data.medsEspecificos ? JSON.stringify(data.medsEspecificos) : null,
      sono: data.sono || null,
      alimentacao: data.alimentacao || null,
      atividadeFisica: data.atividadeFisica || null,
      aguaDia: data.aguaDia || null,
      classificacaoHN: data.classificacaoHN || null,
      classificacaoLudwig: data.classificacaoLudwig || null,
      classificacaoOlsen: data.classificacaoOlsen || null,
      classificacaoFitzpatrick: data.classificacaoFitzpatrick || null,
      pullTest: data.pullTest || null,
      pullTestTexto: data.pullTestTexto || null,
      cardTest: data.cardTest || null,
      tugTest: data.tugTest || null,
      washTest: data.washTest || null,
      tricoMiniaturizacao: data.tricoMiniaturizacao ? JSON.stringify(data.tricoMiniaturizacao) : null,
      tricoAnomalias: data.tricoAnomalias || null,
      tricoOstios: data.tricoOstios ? JSON.stringify(data.tricoOstios) : null,
      tricoEpiderme: data.tricoEpiderme ? JSON.stringify(data.tricoEpiderme) : null,
      tricoAreasAfetadas: data.tricoAreasAfetadas ? JSON.stringify(data.tricoAreasAfetadas) : null,
      densidade: data.densidade || null,
      elasticidade: data.elasticidade || null,
      textura: data.textura || null,
      porosidade: data.porosidade || null,
      curvatura: data.curvatura || null,
      diametro: data.diametro || null,
      tipoClassificacao: data.tipoClassificacao || null,
      corNatural: data.corNatural || null,
      escalaDorPre: data.escalaDorPre != null ? parseInt(data.escalaDorPre) : null,
      toleranciaDor: data.toleranciaDor || null,
      contraindicacoes: data.contraindicacoes ? JSON.stringify(data.contraindicacoes) : null,
      observacoes: data.observacoes || null,
    },
  });

  // Salvar TCLE se fornecido
  if (data.tcle) {
    await prisma.tCLE.create({
      data: {
        pacienteId: data.pacienteId,
        informadoProcedimento: data.tcle.informadoProcedimento || false,
        informadoEfeitos: data.tcle.informadoEfeitos || false,
        informadoContraind: data.tcle.informadoContraind || false,
        declarouAlergias: data.tcle.declarouAlergias || false,
        autorizouFotos: data.tcle.autorizouFotos || false,
        recebeuHomeCare: data.tcle.recebeuHomeCare || false,
        assinado: data.tcle.assinado || false,
      },
    });
  }

  // Salvar plano terapêutico se fornecido
  if (data.planoTerapeutico) {
    await prisma.planoTerapeutico.create({
      data: {
        pacienteId: data.pacienteId,
        diagnosticoPrincipal: data.planoTerapeutico.diagnosticoPrincipal || "",
        diagnosticosSecundarios: data.planoTerapeutico.diagnosticosSecundarios || null,
        trilha: data.planoTerapeutico.trilha || "",
        mescla: JSON.stringify(data.planoTerapeutico.mescla || []),
        numSessoes: parseInt(data.planoTerapeutico.numSessoes || "12"),
        frequencia: data.planoTerapeutico.frequencia || "Quinzenal",
        intervalo: data.planoTerapeutico.intervalo || "12-19 dias",
        cronograma: data.planoTerapeutico.cronograma || null,
        expectativas: data.planoTerapeutico.expectativas || null,
        assinado: data.planoTerapeutico.assinado || false,
      },
    });
  }

  // Consentimento fotográfico
  if (data.consentimentoFoto) {
    await prisma.consentimentoFoto.create({
      data: {
        pacienteId: data.pacienteId,
        prontuario: true,
        cientifico: data.consentimentoFoto.cientifico || false,
        educacional: data.consentimentoFoto.educacional || false,
        comercialAnon: data.consentimentoFoto.comercialAnon || false,
        comercialSemAnon: data.consentimentoFoto.comercialSemAnon || false,
        naoAutoriza: data.consentimentoFoto.naoAutoriza || false,
      },
    });
  }

  // Transicionar paciente
  await transicionarPaciente(data.pacienteId, "biomedica", "Avaliação biomédica completa");

  return NextResponse.json(anamnese, { status: 201 });
}
