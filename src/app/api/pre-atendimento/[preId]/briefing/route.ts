import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ preId: string }> }
) {
  const { preId } = await params;
  const briefing = await prisma.briefing.findUnique({
    where: { preAtendimentoId: parseInt(preId) },
  });

  if (!briefing) {
    return NextResponse.json({ error: "Briefing não encontrado" }, { status: 404 });
  }

  return NextResponse.json(briefing);
}
