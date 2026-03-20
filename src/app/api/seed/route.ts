import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/auth";

// GET /api/seed — Cria dados iniciais (executar apenas uma vez)
export async function GET() {
  // Verificar se já existe usuário
  const existente = await prisma.usuario.findFirst();
  if (existente) {
    return NextResponse.json({ message: "Seed já executado" });
  }

  const senhaHash = await hashSenha("123456");

  await prisma.usuario.createMany({
    data: [
      { nome: "Admin DR HAIR", email: "admin@drhair.com", senha: senhaHash, cargo: "admin" },
      { nome: "Consultora Silva", email: "consultora@drhair.com", senha: senhaHash, cargo: "consultora" },
      { nome: "Dra. Maria Eugênia R. Beirão", email: "biomedica@drhair.com", senha: senhaHash, cargo: "biomedica", crmCrbm: "CRBM/5 9078" },
      { nome: "Recepcionista Santos", email: "recepcao@drhair.com", senha: senhaHash, cargo: "recepcionista" },
    ],
  });

  return NextResponse.json({ message: "Seed executado com sucesso! Usuários criados." });
}
