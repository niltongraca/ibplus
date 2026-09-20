import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, buildSearch, parseBool } from "@/lib/utils";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { serviceCreateSchema } from "@/lib/validations/catalog";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireFeature(user, "servicos"); if (denied) return denied;

    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url.searchParams);
    const all = url.searchParams.get("all") === "true";
    const searchAny = url.searchParams.get("search");
    const active = parseBool(url.searchParams.get("active"));
    const where = {
      companyId: user.companyId,
      ...(searchAny ? { name: { contains: searchAny, mode: "insensitive" as const } } : {}),
      ...(active !== undefined ? { active } : {}),
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(all ? {} : { skip, take: limit }),
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
    services: services.map((s) => ({ ...s, price: toNumber(s.price) })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar serviços." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
  const denied = await requireWrite(user, "servicos"); if (denied) return denied;

  try {
    const parsed = await parseBody(request, serviceCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const nameTrimmed = body.name;
    const priceNum = body.price;

    const service = await prisma.service.create({
      data: {
        name: nameTrimmed,
        description: body.description || null,
        price: priceNum,
        duration: body.duration || null,
        companyId: user.companyId,
      },
    });

    await logAction("create", "service", service.id, `Serviço "${service.name}" criado`);
    return NextResponse.json({ service: { ...service, price: toNumber(service.price) } }, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar serviço:", err);
    return NextResponse.json({ error: "Erro ao criar serviço." }, { status: 500 });
  }
}
