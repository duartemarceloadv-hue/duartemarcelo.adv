import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transicionarPaciente } from "@/lib/fluxo";

// POST /api/manutencao — Criar manutenção + contrato de manutenção
export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.pacienteId) {
    return NextResponse.json(
      { error: "pacienteId obrigatório" },
      { status: 400 }
    );
  }

  // 1. Criar contrato de manutenção
  const contrato = await prisma.contrato.create({
    data: {
      pacienteId: data.pacienteId,
      tipo: "Protocolo de Manutenção",
      numSessoes: data.numSessoes || 6,
      valor: data.valor || 0,
      desconto: 0,
      valorFinal: data.valor || 0,
      formaPagamento: "PIX",
      parcelas: 1,
    },
  });

  // 2. Criar registro de manutenção vinculado ao contrato
  const manutencao = await prisma.manutencao.create({
    data: {
      pacienteId: data.pacienteId,
      novoContratoId: contrato.id,
      regressao: data.regressao ? JSON.stringify(data.regressao) : null,
      homeCareEntre: data.homeCare
        ? JSON.stringify({ resposta: data.homeCare, motivo: data.homeCareMot || null })
        : null,
      mudancaSaude: data.mudancaSaude
        ? JSON.stringify({ resposta: data.mudancaSaude, detalhe: data.mudancaDetalhe || null })
        : null,
      expectativa: data.expectativa || null,
      reavaliacao: data.reavaliacao ? JSON.stringify(data.reavaliacao) : null,
    },
  });

  // 3. Salvar fotos de reavaliação se fornecidas
  if (data.fotos && Array.isArray(data.fotos) && data.fotos.length > 0) {
    const registrosFoto = data.fotos
      .filter((f: { angulo: string; fotoUrl: string }) => f.fotoUrl)
      .map((f: { angulo: string; fotoUrl: string }) => ({
        pacienteId: data.pacienteId,
        moduloOrigem: "M6",
        angulo: f.angulo,
        fotoUrl: f.fotoUrl,
        conforme: false,
      }));

    if (registrosFoto.length > 0) {
      await prisma.registroFoto.createMany({ data: registrosFoto });
    }
  }

  // 4. Transicionar paciente para manutenção
  await transicionarPaciente(data.pacienteId, "manutencao", "Manutenção iniciada");

  return NextResponse.json({ manutencao, contrato }, { status: 201 });
}
