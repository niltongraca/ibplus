/**
 * Backfill: migra imagens legadas (data-URLs base64 em BD) para o Vercel Blob.
 * Auditória #18 — follow-up. Requer BLOB_READ_WRITE_TOKEN na env.
 *
 * Uso: npm run backfill:blob
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";
import { put } from "@vercel/blob";

neonConfig.webSocketConstructor = WebSocket as any;

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!TOKEN) {
  console.error(
    "BLOB_READ_WRITE_TOKEN em falta. Cria um token em Vercel > Storage > Blob > Tokens e define-o na env."
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const EXT_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

// Modelo → campos de imagem que podem conter data-URLs legados.
const FIELD_CONFIGS = [
  { model: "user", fields: ["avatar", "coverPhoto"] },
  { model: "profile", fields: ["logo"] },
  { model: "company", fields: ["logo"] },
  { model: "product", fields: ["image"] },
  { model: "content", fields: ["thumbnail"] },
] as const;

function parseDataUrl(value: string): { mime: string; base64: string } {
  const comma = value.indexOf(",");
  if (comma === -1) throw new Error("data-URL inválido (sem vírgula)");
  const header = value.slice(0, comma);
  const match = header.match(/^data:([^;]+);base64$/);
  if (!match) throw new Error("data-URL inválido (esperado data:<mime>;base64)");
  return { mime: match[1], base64: value.slice(comma + 1) };
}

async function main() {
  let migrated = 0;
  let failed = 0;

  for (const { model, fields } of FIELD_CONFIGS) {
    const db = (prisma as any)[model];
    if (!db) continue;

    for (const field of fields) {
      const rows = await db.findMany({
        where: { [field]: { startsWith: "data:" } },
        select: { id: true, [field]: true },
      });

      for (const row of rows) {
        const value: string = row[field];
        try {
          const { mime, base64 } = parseDataUrl(value);
          const buffer = Buffer.from(base64, "base64");
          const ext = EXT_BY_MIME[mime] || ".png";
          const blob = await put(`uploads/backfill/${model}-${field}-${row.id}${ext}`, buffer, {
            access: "public",
            contentType: mime,
            token: TOKEN,
            addRandomSuffix: true,
          });
          await db.update({ where: { id: row.id }, data: { [field]: blob.url } });
          migrated++;
          console.log(`+ ${model}.${field} ${row.id} → ${blob.url}`);
        } catch (e) {
          failed++;
          console.error(`✖ ${model}.${field} ${row.id}: ${e instanceof Error ? e.message : e}`);
        }
      }
    }
  }

  console.log(`\nResumo: ${migrated} imagens migradas, ${failed} falhas.`);
  if (failed) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });