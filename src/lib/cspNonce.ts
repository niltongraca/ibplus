/**
 * Lê o nonce do CSP exposto no <html data-nonce="..."> (definido no root
 * layout a partir do header `x-nonce` do middleware — auditoria #24).
 * Necessário nos popups de exportação PDF: herdam o CSP do opener e os
 * scripts inline (window.print) têm de levar o mesmo nonce.
 */
export function getCspNonce(): string {
  if (typeof document === "undefined") return "";
  return document.documentElement.getAttribute("data-nonce") ?? "";
}