import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { requireFeature } from "@/lib/permissions";
import { jsonToCsv } from "@/lib/csv";
import { toNumber } from "@/lib/money";
import { logAction } from "@/lib/audit";

/** Exporta apenas inscrições confirmadas (PAGA), prontas para conciliação. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireFeature(user, "eventos");
    if (denied) return denied;

    const event = await prisma.event.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, title: true },
    });
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: event.id, status: "PAGA" },
      orderBy: { createdAt: "desc" },
      select: {
        code: true,
        holderName: true,
        holderEmail: true,
        holderPhone: true,
        status: true,
        paymentRef: true,
        amount: true,
        createdAt: true,
        reviewedAt: true,
        items: {
          select: {
            quantity: true,
            ticketType: { select: { name: true } },
          },
        },
      },
    });

    const rows = registrations.map((r) => ({
      code: r.code,
      reference: r.paymentRef,
      name: r.holderName,
      email: r.holderEmail,
      phone: r.holderPhone,
      tickets: r.items.map((item) => `${item.quantity} × ${item.ticketType.name}`).join(" | "),
      amount: toNumber(r.amount).toFixed(2),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? "",
    }));

    const csv =
      "\uFEFF" +
      jsonToCsv(rows, {
        code: "Código",
        reference: "Referência",
        name: "Nome",
        email: "Email",
        phone: "Telefone",
        tickets: "Bilhetes",
        amount: "Total (Kz)",
        status: "Estado",
        createdAt: "Inscrição em",
        reviewedAt: "Validada em",
      });

    await logAction(
      "export",
      "event_registration",
      event.id,
      `${rows.length} inscrição(ões) paga(s) exportada(s) — ${event.title}`,
      user
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inscricoes-${event.id}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao exportar inscrições." }, { status: 500 });
  }
}
