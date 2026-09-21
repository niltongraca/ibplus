import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, buildSearch } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logAction } from "@/lib/audit";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { customerCreateSchema } from "@/lib/validations/catalog";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "clientes"); if (denied) return denied;

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const all = url.searchParams.get("all") === "true";
  const search = buildSearch(["name", "email", "phone", "nif"], url.searchParams.get("search"));
  const type = url.searchParams.get("type") ?? undefined;
  const where = {
    companyId: user.companyId,
    ...(search ?? {}),
    ...(type ? { type } : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { sales: true } } },
      orderBy: { name: "asc" },
      ...(all ? {} : { skip, take: limit }),
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "clientes"); if (denied) return denied;

  try {
    const parsed = await parseBody(request, customerCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const name = body.name;
    const email = body.email || "";

    const type = body.type ?? "particular";

    const customer = await prisma.customer.create({
      data: {
        name,
        companyId: user.companyId,
        email: email || null,
        phone: body.phone || null,
        nif: body.nif || null,
        address: body.address || null,
        type,
        notes: body.notes || null,
      },
    });
    await logAction("create", "customer", customer.id, `Cliente "${customer.name}" criado`, user);
    await createNotification(user.companyId, "customer", `Novo cliente: ${customer.name}`, undefined, "/gestao/clientes");
    return NextResponse.json({ customer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 400 });
  }
}
