import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getManualPaymentDetails, hasManualPaymentDetails } from "@/config/payments";
import { getReservedByTicketType, remainingTickets } from "@/lib/eventRegistrations";
import { toNumber } from "@/lib/money";

export const dynamic = "force-dynamic";

/** Dados públicos de um evento, desde que publicado e com o link activo. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || token.length < 16 || token.length > 200) {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { registrationToken: token },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        venue: true,
        address: true,
        province: true,
        municipality: true,
        startDate: true,
        endDate: true,
        coverImage: true,
        published: true,
        status: true,
        company: {
          select: { name: true, email: true, phone: true, whatsappNumber: true },
        },
        ticketTypes: {
          where: { active: true },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            kind: true,
            description: true,
            price: true,
            quantity: true,
          },
        },
      },
    });

    if (!event || !event.published || event.status !== "PUBLICADO") {
      return NextResponse.json({ error: "Este link não está disponível." }, { status: 404 });
    }

    const reserved = await getReservedByTicketType(
      event.id,
      event.ticketTypes.map((t) => t.id)
    );
    const payment = getManualPaymentDetails();

    return NextResponse.json(
      {
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          venue: event.venue,
          address: event.address,
          province: event.province,
          municipality: event.municipality,
          startDate: event.startDate,
          endDate: event.endDate,
          coverImage: event.coverImage,
          organizerName: event.company.name,
        },
        ticketTypes: event.ticketTypes.map((t) => ({
          id: t.id,
          name: t.name,
          kind: t.kind,
          description: t.description,
          price: toNumber(t.price),
          unlimited: t.quantity <= 0,
          remaining: remainingTickets(t.quantity, reserved.get(t.id) ?? 0),
        })),
        payment: {
          ...payment,
          configured: hasManualPaymentDetails(payment),
        },
        contact: {
          email: event.company.email,
          phone: event.company.phone || event.company.whatsappNumber,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Erro ao carregar o evento." }, { status: 500 });
  }
}
