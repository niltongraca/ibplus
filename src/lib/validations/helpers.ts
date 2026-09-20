import { NextResponse } from "next/server";
import { z } from "zod";

// Resultado bifurcado: ou os dados validados, ou uma resposta 400 pronta a devolver.
// Uso típico numa rota:
//   const parsed = await parseBody(request, loginSchema);
//   if ("error" in parsed) return parsed.error;
//   const { email } = parsed.data;
export type ParseResult<T> = { data: T } | { error: NextResponse };

export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<ParseResult<z.infer<T>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 }) };
  }
  return validateSchema(schema, body);
}

export function validateSchema<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): ParseResult<z.infer<T>> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "Dados inválidos.";
    const field =
      first && first.path.length ? first.path.join(".") : undefined;
    const payload: Record<string, unknown> = { error: message };
    if (field) payload.field = field;
    return { error: NextResponse.json(payload, { status: 400 }) };
  }
  return { data: parsed.data };
}