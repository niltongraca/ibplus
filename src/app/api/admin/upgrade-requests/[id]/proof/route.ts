import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Serve o comprovativo de pagamento de um pedido (apenas administradores).
 * Pode ser uma URL do Vercel Blob ou uma data-URL de imagem guardada em BD.
 */
export async function GET(_request: Request, { params }: Context) {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const found = await prisma.upgradeRequest.findUnique({
    where: { id },
    select: { paymentProofUrl: true },
  });
  if (!found?.paymentProofUrl) {
    return NextResponse.json({ error: "Comprovativo não encontrado." }, { status: 404 });
  }

  const url = found.paymentProofUrl;

  // URL externa (Vercel Blob): redirecciona para não expor o ficheiro na API.
  if (/^https:\/\//i.test(url)) {
    return NextResponse.redirect(url);
  }

  // Data-URL de imagem guardada em BD.
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(url);
  if (!match) {
    return NextResponse.json({ error: "Comprovativo inválido." }, { status: 422 });
  }

  const bytes = Buffer.from(match[2], "base64");
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": match[1],
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
