import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarDocumento, type TipoDocumento } from "@/lib/documentos";

const TIPOS_VALIDOS: TipoDocumento[] = [
  "anamnese-tcle",
  "consentimento-foto",
  "plano-terapeutico",
  "prontuario-sessao",
  "orientacoes-homecare",
  "relatorio-reavaliacao",
  "relatorio-final",
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tipo = searchParams.get("tipo") as TipoDocumento | null;
  const pacienteId = searchParams.get("pacienteId");
  const sessaoId = searchParams.get("sessaoId");

  // --- validação ---
  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return Response.json(
      {
        error: `Tipo inválido. Valores aceitos: ${TIPOS_VALIDOS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (!pacienteId || isNaN(Number(pacienteId))) {
    return Response.json(
      { error: "pacienteId é obrigatório e deve ser numérico." },
      { status: 400 }
    );
  }

  const pid = Number(pacienteId);

  // --- buscar paciente ---
  const paciente = await prisma.paciente.findUnique({ where: { id: pid } });
  if (!paciente) {
    return Response.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dados: Record<string, any> = { paciente };

  try {
    switch (tipo) {
      // ----- 1. ANAMNESE + TCLE -----
      case "anamnese-tcle": {
        const anamnese = await prisma.anamneseBiomedica.findFirst({
          where: { pacienteId: pid },
          orderBy: { createdAt: "desc" },
        });
        if (!anamnese) {
          return Response.json(
            { error: "Anamnese biomédica não encontrada para este paciente." },
            { status: 404 }
          );
        }
        const tcle = await prisma.tCLE.findFirst({
          where: { pacienteId: pid },
          orderBy: { createdAt: "desc" },
        });
        dados = { paciente, anamnese, tcle: tcle ?? {} };
        break;
      }

      // ----- 2. CONSENTIMENTO FOTO -----
      case "consentimento-foto": {
        const consentimento = await prisma.consentimentoFoto.findFirst({
          where: { pacienteId: pid },
          orderBy: { createdAt: "desc" },
        });
        if (!consentimento) {
          return Response.json(
            { error: "Consentimento fotográfico não encontrado para este paciente." },
            { status: 404 }
          );
        }
        dados = { paciente, consentimento };
        break;
      }

      // ----- 3. PLANO TERAPÊUTICO -----
      case "plano-terapeutico": {
        const plano = await prisma.planoTerapeutico.findFirst({
          where: { pacienteId: pid },
          orderBy: { createdAt: "desc" },
        });
        if (!plano) {
          return Response.json(
            { error: "Plano terapêutico não encontrado para este paciente." },
            { status: 404 }
          );
        }
        dados = { paciente, plano };
        break;
      }

      // ----- 4. PRONTUÁRIO DE SESSÃO -----
      case "prontuario-sessao": {
        let sessao;
        if (sessaoId && !isNaN(Number(sessaoId))) {
          sessao = await prisma.sessao.findUnique({
            where: { id: Number(sessaoId) },
          });
          if (sessao && sessao.pacienteId !== pid) {
            return Response.json(
              { error: "Sessão não pertence ao paciente informado." },
              { status: 400 }
            );
          }
        } else {
          sessao = await prisma.sessao.findFirst({
            where: { pacienteId: pid },
            orderBy: { createdAt: "desc" },
          });
        }
        if (!sessao) {
          return Response.json(
            { error: "Sessão não encontrada." },
            { status: 404 }
          );
        }
        dados = { paciente, sessao };
        break;
      }

      // ----- 5. ORIENTAÇÕES HOME CARE -----
      case "orientacoes-homecare": {
        const contrato = await prisma.contrato.findFirst({
          where: { pacienteId: pid, status: "ativo" },
          orderBy: { createdAt: "desc" },
        });
        dados = { paciente, contrato: contrato ?? {}, orientacoes: {} };
        break;
      }

      // ----- 6. RELATÓRIO DE REAVALIAÇÃO -----
      case "relatorio-reavaliacao": {
        let sessao;
        if (sessaoId && !isNaN(Number(sessaoId))) {
          sessao = await prisma.sessao.findUnique({
            where: { id: Number(sessaoId) },
          });
          if (sessao && sessao.pacienteId !== pid) {
            return Response.json(
              { error: "Sessão não pertence ao paciente informado." },
              { status: 400 }
            );
          }
        } else {
          sessao = await prisma.sessao.findFirst({
            where: { pacienteId: pid, isSessao5: true },
            orderBy: { createdAt: "desc" },
          });
        }
        if (!sessao) {
          return Response.json(
            { error: "Sessão de reavaliação (5ª sessão) não encontrada." },
            { status: 404 }
          );
        }
        dados = { paciente, sessao };
        break;
      }

      // ----- 7. RELATÓRIO FINAL -----
      case "relatorio-final": {
        const alta = await prisma.alta.findFirst({
          where: { pacienteId: pid },
          orderBy: { createdAt: "desc" },
        });
        if (!alta) {
          return Response.json(
            { error: "Registro de alta não encontrado para este paciente." },
            { status: 404 }
          );
        }
        dados = { paciente, alta };
        break;
      }
    }

    const html = gerarDocumento(tipo, dados);

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno ao gerar documento.";
    return Response.json({ error: message }, { status: 500 });
  }
}
