import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transicionarPaciente } from "@/lib/fluxo";

export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.pacienteId || !data.resultadoGeral) {
    return NextResponse.json(
      { error: "pacienteId e resultadoGeral obrigatórios" },
      { status: 400 }
    );
  }

  const alta = await prisma.alta.create({
    data: {
      pacienteId: data.pacienteId,
      resultadoGeral: data.resultadoGeral,
      evolucaoClinica: data.evolucaoClinica || null,
      classificacaoFinal: data.classificacaoFinal || null,
      encaminhamento: data.encaminhamento || null,
      orientacoes: data.orientacoes || null,
    },
  });

  await transicionarPaciente(data.pacienteId, "alta", "Alta realizada");

  return NextResponse.json(alta, { status: 201 });
}
