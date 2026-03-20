import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarSenha, gerarToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, senha } = await request.json();

  if (!email || !senha) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios" },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  const senhaValida = await verificarSenha(senha, usuario.senha);
  if (!senhaValida) {
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  const token = gerarToken({
    userId: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    cargo: usuario.cargo,
  });

  const response = NextResponse.json({
    success: true,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
    },
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });

  return response;
}
