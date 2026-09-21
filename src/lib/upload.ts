/**
 * Validação e transformação de uploads de imagem (auditoria #18 — follow-up:
 * migração de data-URLs base64 para Vercel Blob).
 * Módulo puro (sem dependências de runtime) para poder ser testado.
 */

export const UPLOAD_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_EXTENSIONS: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export type ResolveUploadResult =
  | { ok: true; mime: string; ext: string }
  | { ok: false; error: string };

/** Valida nome, tamanho, extensão e tipo MIME de um ficheiro enviado. */
export function resolveUpload(file: {
  name: string;
  size: number;
  type: string;
}): ResolveUploadResult {
  if (!file.name) return { ok: false, error: "Nenhum ficheiro enviado." };
  if (file.size === 0) return { ok: false, error: "Ficheiro vazio." };
  if (file.size > UPLOAD_MAX_SIZE) {
    return { ok: false, error: "Ficheiro demasiado grande (máx. 5MB)." };
  }

  const extMatch = file.name.match(/\.([A-Za-z0-9]+)$/);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
  const allowedType = ALLOWED_EXTENSIONS[ext];

  if (!allowedType) {
    return { ok: false, error: "Tipo de ficheiro não permitido." };
  }
  if (file.type && file.type !== allowedType) {
    return { ok: false, error: "Tipo de ficheiro inválido." };
  }

  return { ok: true, mime: file.type || allowedType, ext };
}

/** Distingue data-URLs legados (base64 em BD) dos URLs de Blob/Http. */
export function isDataUrl(value: string): boolean {
  return value.startsWith("data:");
}

/** Constrói um data-URL — formato legado usado quando não há token de Blob. */
export function buildInlineDataUrl(mime: string, buffer: Uint8Array): string {
  return `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;
}