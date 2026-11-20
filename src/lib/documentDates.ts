/**
 * A API usa nomes diferentes para o campo de data conforme o documento:
 * faturas têm `dueDate` (vencimento) e orçamentos têm `validUntil` (validade).
 * Manter o mapeamento num só lugar evita enviar a data num campo que a API ignora.
 */
export function documentDatePayload(
  mode: "invoice" | "quote",
  value: string | null
): { dueDate: string | null } | { validUntil: string | null } {
  return mode === "invoice" ? { dueDate: value } : { validUntil: value };
}
