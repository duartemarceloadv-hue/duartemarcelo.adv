import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transicionarPaciente } from "@/lib/fluxo";

// POST /api/consultora — Salvar consulta de venda
export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.pacienteId || !data.briefingId) {
    return NextResponse.json(
      { error: "pacienteId e briefingId obrigatórios" },
      { status: 400 }
    );
  }

  const consultaVenda = await prisma.consultaVenda.create({
    data: {
      pacienteId: data.pacienteId,
      consultorId: data.consultorId || 2, // default consultora
      briefingId: data.briefingId,
      identidadeConfirmada: data.identidadeConfirmada || false,
      checklist8passos: JSON.stringify(data.checklist8passos || {}),
      avaliacaoRegeneracao: data.avaliacaoRegeneracao || null,
      pacote: data.pacote || null,
      valor: data.valor ? parseFloat(data.valor) : null,
      numSessoes: data.numSessoes ? parseInt(data.numSessoes) : null,
      objecoes: data.objecoes ? JSON.stringify(data.objecoes) : null,
      decisao: data.decisao || null,
      motivoNaoFechou: data.motivoNaoFechou || null,
      followupData: data.followupData ? new Date(data.followupData) : null,
      observacoes: data.observacoes || null,
      laudoGerado: data.laudoGerado ? JSON.stringify(data.laudoGerado) : null,
    },
  });

  // Se tem tricoscopia
  if (data.tricoscopia) {
    await prisma.tricoscopia.create({
      data: {
        consultaVendaId: consultaVenda.id,
        fotoUrl: data.tricoscopia.fotoUrl || null,
        iaAnalise: JSON.stringify(data.tricoscopia.iaAnalise || {}),
        edicoes: data.tricoscopia.edicoes ? JSON.stringify(data.tricoscopia.edicoes) : null,
        classificacaoHN: data.tricoscopia.classificacaoHN || null,
        classificacaoOlsen: data.tricoscopia.classificacaoOlsen || null,
        diagnosticoProvavel: data.tricoscopia.diagnosticoProvavel || null,
        textoAnalise: data.tricoscopia.textoAnalise || null,
        dicaVenda: data.tricoscopia.dicaVenda || null,
      },
    });
  }

  // Transicionar paciente
  await transicionarPaciente(data.pacienteId, "consultora", "Consulta de venda realizada");

  return NextResponse.json(consultaVenda, { status: 201 });
}
