import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transicionarPaciente } from "@/lib/fluxo";
import { TEXTOS_PERGUNTAS_SESSAO } from "@/lib/texto-automatico";

// POST /api/sessoes — Registrar sessão (M5)
export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.pacienteId || !data.contratoId || !data.numSessao) {
    return NextResponse.json(
      { error: "pacienteId, contratoId e numSessao obrigatórios" },
      { status: 400 }
    );
  }

  // Gerar textos automáticos das perguntas recorrentes
  const perguntasComTexto = { ...(data.perguntasRecorrentes || {}) };
  for (const [key, texts] of Object.entries(TEXTOS_PERGUNTAS_SESSAO)) {
    const resposta = perguntasComTexto[key]?.resposta;
    if (resposta && texts[resposta as keyof typeof texts]) {
      perguntasComTexto[key] = {
        ...perguntasComTexto[key],
        textoAuto: texts[resposta as keyof typeof texts],
      };
    }
  }

  const sessao = await prisma.sessao.create({
    data: {
      pacienteId: data.pacienteId,
      biomedId: data.biomedId || 3, // default biomédica
      contratoId: data.contratoId,
      numSessao: parseInt(data.numSessao),
      totalSessoes: parseInt(data.totalSessoes || "12"),
      identidadeConfirmada: data.identidadeConfirmada || false,
      checklistPre: JSON.stringify(data.checklistPre || {}),
      perguntasRecorrentes: JSON.stringify(perguntasComTexto),
      checklistMescla: JSON.stringify(data.checklistMescla || {}),
      volumeTotal: data.volumeTotal ? parseFloat(data.volumeTotal) : null,
      checklistMateriais: data.checklistMateriais ? JSON.stringify(data.checklistMateriais) : null,
      checklistLED: data.checklistLED ? JSON.stringify(data.checklistLED) : null,
      tempoLED: data.tempoLED ? parseInt(data.tempoLED) : null,
      doseLED: data.doseLED ? parseFloat(data.doseLED) : null,
      intercorrenciasLED: data.intercorrenciasLED || null,
      dorPos: data.dorPos != null ? parseInt(data.dorPos) : null,
      checklistOrientacoesPo: data.checklistOrientacoesPo ? JSON.stringify(data.checklistOrientacoesPo) : null,
      checklistPos: data.checklistPos ? JSON.stringify(data.checklistPos) : null,
      prescricaoAdicional: data.prescricaoAdicional || null,
      observacoes: data.observacoes || null,
      isSessao5: data.numSessao === 5,
      extras5sessao: data.extras5sessao ? JSON.stringify(data.extras5sessao) : null,
      isUltimaSessao: data.isUltimaSessao || false,
      extrasUltima: data.extrasUltima ? JSON.stringify(data.extrasUltima) : null,
      prontuarioTexto: data.prontuarioTexto || null,
    },
  });

  // Transicionar para em_tratamento se primeira sessão
  if (data.numSessao === 1) {
    await transicionarPaciente(data.pacienteId, "em_tratamento", "1ª sessão realizada");
  }

  return NextResponse.json(sessao, { status: 201 });
}
