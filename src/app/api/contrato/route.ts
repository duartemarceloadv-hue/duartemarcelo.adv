import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transicionarPaciente } from "@/lib/fluxo";

// POST /api/contrato — Criar contrato
export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.pacienteId || !data.valor || !data.numSessoes) {
    return NextResponse.json(
      { error: "pacienteId, valor e numSessoes obrigatórios" },
      { status: 400 }
    );
  }

  const desconto = data.desconto ? parseFloat(data.desconto) : 0;
  const valor = parseFloat(data.valor);
  const valorFinal = valor - desconto;
  const parcelas = data.parcelas ? parseInt(data.parcelas) : 1;

  const contrato = await prisma.contrato.create({
    data: {
      pacienteId: data.pacienteId,
      consultaVendaId: data.consultaVendaId || null,
      tipo: data.tipo || "Protocolo Terapêutico Capilar",
      numContrato: data.numContrato || null,
      pacote: data.pacote || null,
      valor,
      desconto,
      valorFinal,
      numSessoes: parseInt(data.numSessoes),
      prazoMaxMeses: data.prazoMaxMeses ? parseInt(data.prazoMaxMeses) : null,
      formaPagamento: data.formaPagamento || "PIX",
      parcelas,
      valorParcela: parcelas > 1 ? valorFinal / parcelas : null,
      kitHomeCare: data.kitHomeCare ? JSON.stringify(data.kitHomeCare) : null,
      assinado: data.assinado || false,
    },
  });

  // Criar parcelas de pagamento
  if (parcelas > 0) {
    const pagamentos = [];
    for (let i = 1; i <= parcelas; i++) {
      const dataVenc = new Date();
      dataVenc.setMonth(dataVenc.getMonth() + i - 1);
      pagamentos.push({
        contratoId: contrato.id,
        parcela: i,
        valor: valorFinal / parcelas,
        dataVenc,
        status: "pendente",
      });
    }
    await prisma.pagamento.createMany({ data: pagamentos });
  }

  // Transicionar paciente
  await transicionarPaciente(data.pacienteId, "contrato", "Contrato assinado");

  return NextResponse.json(contrato, { status: 201 });
}
