import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pacientes/[id] — Buscar paciente completo
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const paciente = await prisma.paciente.findUnique({
    where: { id: parseInt(id) },
    include: {
      preAtendimentos: { orderBy: { createdAt: "desc" }, take: 1 },
      consultasVenda: { orderBy: { createdAt: "desc" }, take: 1 },
      contratos: { orderBy: { createdAt: "desc" } },
      anamnesesBiomedica: { orderBy: { createdAt: "desc" }, take: 1 },
      sessoes: { orderBy: { numSessao: "asc" } },
      registrosFoto: { orderBy: { createdAt: "desc" } },
      historicoFluxo: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!paciente) {
    return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(paciente);
}

// PUT /api/pacientes/[id] — Atualizar paciente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  const paciente = await prisma.paciente.update({
    where: { id: parseInt(id) },
    data,
  });

  return NextResponse.json(paciente);
}
