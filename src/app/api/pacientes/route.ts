import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pacientes — Lista pacientes com busca e filtro
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca") || "";
  const etapa = searchParams.get("etapa") || "";

  const where: Record<string, unknown> = {};

  if (busca) {
    where.OR = [
      { nome: { contains: busca } },
      { cpf: { contains: busca } },
      { celular: { contains: busca } },
    ];
  }

  if (etapa) {
    where.statusFluxo = etapa;
  }

  const pacientes = await prisma.paciente.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(pacientes);
}

// POST /api/pacientes — Criar paciente
export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.nome || !data.cpf || !data.dataNascimento || !data.celular || !data.sexo) {
    return NextResponse.json(
      { error: "Campos obrigatórios: nome, cpf, dataNascimento, celular, sexo" },
      { status: 400 }
    );
  }

  // Verificar CPF duplicado
  const existente = await prisma.paciente.findUnique({ where: { cpf: data.cpf } });
  if (existente) {
    return NextResponse.json(
      { error: "CPF já cadastrado" },
      { status: 409 }
    );
  }

  // Calcular IMC
  let imc: number | undefined;
  if (data.peso && data.altura) {
    imc = data.peso / (data.altura * data.altura);
  }

  const paciente = await prisma.paciente.create({
    data: {
      nome: data.nome,
      rg: data.rg || null,
      cpf: data.cpf,
      dataNascimento: new Date(data.dataNascimento),
      celular: data.celular,
      email: data.email || null,
      sexo: data.sexo,
      estadoCivil: data.estadoCivil || null,
      ocupacao: data.ocupacao || null,
      endereco: data.endereco || null,
      indicacao: data.indicacao || null,
      comoConheceu: data.comoConheceu || null,
      contatoUrgNome: data.contatoUrgNome || null,
      contatoUrgTel: data.contatoUrgTel || null,
      contatoUrgParentesco: data.contatoUrgParentesco || null,
      peso: data.peso ? parseFloat(data.peso) : null,
      altura: data.altura ? parseFloat(data.altura) : null,
      imc: imc || null,
      lgpdConsent: data.lgpdConsent || false,
    },
  });

  return NextResponse.json(paciente, { status: 201 });
}
