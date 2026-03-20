import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarBriefing } from "@/lib/briefing";
import { transicionarPaciente } from "@/lib/fluxo";

// POST /api/pre-atendimento — Salvar pré-atendimento + gerar briefing
export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.pacienteId) {
    return NextResponse.json({ error: "pacienteId obrigatório" }, { status: 400 });
  }

  // Buscar dados do paciente para o briefing
  const paciente = await prisma.paciente.findUnique({
    where: { id: data.pacienteId },
  });

  if (!paciente) {
    return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
  }

  // Criar pré-atendimento
  const preAtendimento = await prisma.preAtendimento.create({
    data: {
      pacienteId: data.pacienteId,
      queixas: JSON.stringify(data.queixas || []),
      tempoQueixa: data.tempoQueixa || null,
      quedaVolume: JSON.stringify(data.quedaVolume || {}),
      afinamento: data.afinamento ? JSON.stringify(data.afinamento) : null,
      sinaisSintomas: JSON.stringify(data.sinaisSintomas || {}),
      oleosidade: data.oleosidade || null,
      condicoesCouro: JSON.stringify(data.condicoesCouro || []),
      tratAnteriores: JSON.stringify(data.tratAnteriores || {}),
      histFamiliar: JSON.stringify(data.histFamiliar || {}),
      expectativas: JSON.stringify(data.expectativas || {}),
      higiene: JSON.stringify(data.higiene || {}),
      cuidadosCapilares: data.cuidadosCapilares ? JSON.stringify(data.cuidadosCapilares) : null,
      condicoesSaude: JSON.stringify(data.condicoesSaude || []),
      infoSaudeExtra: data.infoSaudeExtra ? JSON.stringify(data.infoSaudeExtra) : null,
      medicamentos: JSON.stringify(data.medicamentos || []),
      alergias: JSON.stringify(data.alergias || []),
      habitos: JSON.stringify(data.habitos || {}),
      reprodutivo: JSON.stringify(data.reprodutivo || {}),
    },
  });

  // Calcular idade
  const hoje = new Date();
  const nasc = paciente.dataNascimento;
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;

  // Gerar briefing automático
  const dadosBriefing = {
    nome: paciente.nome,
    idade,
    sexo: paciente.sexo,
    peso: paciente.peso || undefined,
    altura: paciente.altura || undefined,
    imc: paciente.imc || undefined,
    queixas: data.queixas || [],
    tempoQueixa: data.tempoQueixa,
    quedaVolume: data.quedaVolume || {},
    afinamento: data.afinamento,
    sinaisSintomas: data.sinaisSintomas || {},
    oleosidade: data.oleosidade,
    condicoesCouro: data.condicoesCouro || [],
    tratAnteriores: data.tratAnteriores || {},
    histFamiliar: data.histFamiliar || {},
    expectativas: data.expectativas || {},
    higiene: data.higiene || {},
    condicoesSaude: data.condicoesSaude || [],
    medicamentos: data.medicamentos || [],
    alergias: data.alergias || [],
    habitos: data.habitos || {},
    reprodutivo: data.reprodutivo || {},
  };

  const briefingGerado = gerarBriefing(dadosBriefing);

  const briefing = await prisma.briefing.create({
    data: {
      preAtendimentoId: preAtendimento.id,
      resumo: JSON.stringify(briefingGerado.resumo),
      perfilCompleto: JSON.stringify(briefingGerado.perfilCompleto),
      gatilhos: JSON.stringify(briefingGerado.gatilhosAtivados),
      objecoes: JSON.stringify(briefingGerado.objecoesProvaveis),
      substancias: JSON.stringify({}),
      roteiro: JSON.stringify(briefingGerado.roteiro),
      trilhaProvavel: briefingGerado.trilhaProvavel,
    },
  });

  // Atualizar LGPD consent se enviado
  if (data.lgpdConsent) {
    await prisma.paciente.update({
      where: { id: data.pacienteId },
      data: { lgpdConsent: true },
    });
  }

  // Transicionar paciente para pré-atendimento
  await transicionarPaciente(data.pacienteId, "pre_atendimento", "Pré-atendimento preenchido");

  return NextResponse.json(
    { preAtendimento, briefing },
    { status: 201 }
  );
}
