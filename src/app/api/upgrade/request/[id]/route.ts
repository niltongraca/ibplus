import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { parseBody } from "@/lib/validations/helpers";
import { upgradeProofSchema } from "@/lib/validations/plans";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Anexa o comprovativo / referência da transferência a um pedido pendente.
 * Só o responsável da empresa (ou o próprio, sem empresa) pode actualizar.
 */
export async function PATCH(request: Request, { params }: Context) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`upgrade-proof:${ip}`, "medium");
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter!);

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  if (user.companyId && !user.isOwner) {
    return NextResponse.json(
      { error: "Apenas o responsável da empresa pode actualizar o pedido." },
      { status: 403 }
    );
  }

  const parsed = await parseBody(request, upgradeProofSchema);
  if ("error" in parsed) return parsed.error;
  const { paymentRef, proofUrl } = parsed.data;

  if (!paymentRef && !proofUrl) {
    return NextResponse.json(
      { error: "Anexe o comprovativo ou indique a referência da transferência." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const pending = await prisma.upgradeRequest.findUnique({
    where: { id },
    select: { id: true, userId: true, companyId: true, status: true, toPlan: true },
  });
  if (!pending) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const owns = pending.companyId
    ? pending.companyId === user.companyId
    : pending.userId === user.id;
  if (!owns) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  if (pending.status !== "PENDING") {
    return NextResponse.json({ error: "Este pedido já foi analisado." }, { status: 409 });
  }

  const updated = await prisma.upgradeRequest.update({
    where: { id },
    data: {
      ...(paymentRef ? { paymentRef } : {}),
      ...(proofUrl ? { paymentProofUrl: proofUrl } : {}),
      paymentMethod: "manual",
      paymentStatus: "PENDING",
    },
    select: {
      id: true,
      paymentStatus: true,
      paymentRef: true,
      paymentProofUrl: true,
    },
  });

  const { paymentProofUrl, ...rest } = updated;
  await logAction(
    "update",
    "upgrade_request",
    id,
    `Comprovativo de pagamento anexado (${pending.toPlan})`,
    user
  );

  return NextResponse.json({ request: { ...rest, hasProof: Boolean(paymentProofUrl) } });
}
