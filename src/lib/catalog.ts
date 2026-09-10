import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

type CatalogClient = Prisma.TransactionClient | typeof prisma;

export async function findOrCreateCustomer(companyId: string, name: string, db: CatalogClient = prisma): Promise<void> {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return;

  const existing = await db.customer.findFirst({
    where: { companyId, name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return;

  const customer = await db.customer.create({
    data: { companyId, name: trimmed },
  });
  await logAction("create", "customer", customer.id, `Cliente "${customer.name}" criado automaticamente na faturação`);
}

export async function ensureItemsInCatalog(
  companyId: string,
  items: { description: string; unitPrice: number }[],
  db: CatalogClient = prisma
): Promise<void> {
  const [products, services] = await Promise.all([
    db.product.findMany({ where: { companyId }, select: { id: true, name: true } }),
    db.service.findMany({ where: { companyId }, select: { id: true, name: true } }),
  ]);

  const known = new Set<string>();
  for (const p of products) known.add(p.name.trim().toLowerCase());
  for (const s of services) known.add(s.name.trim().toLowerCase());

  const pending = new Map<string, { name: string; price: number }>();
  for (const item of items) {
    const name = typeof item.description === "string" ? item.description.trim() : "";
    if (!name) continue;
    const key = name.toLowerCase();
    if (!known.has(key) && !pending.has(key)) {
      pending.set(key, { name, price: Number(item.unitPrice) || 0 });
    }
  }

  for (const { name, price } of pending.values()) {
    const product = await db.product.create({
      data: { companyId, name, price, stock: 0, minStock: 0 },
    });
    await logAction("create", "product", product.id, `Produto "${name}" criado automaticamente na faturação`);
  }
}