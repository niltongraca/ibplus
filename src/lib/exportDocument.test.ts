import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDocumentHtml } from "./exportDocument";
import { buildReportHtml } from "./reportDocument";

// Auditoria #24: os popups de exportação PDF herdam o CSP do opener e o
// `window.print()` inline tem de levar o nonce da request (via getCspNonce()).

const docData = {
  type: "FATURA" as const,
  typeLabel: "da Factura",
  number: "FAT/2026/1",
  customer: "Cliente X",
  date: "2026-09-21",
  secondaryDateLabel: "Vencimento",
  secondaryDate: null,
  status: "paid",
  items: [{ description: "Item", quantity: 2, unitPrice: 100, total: 200 }],
  total: 200,
};

describe("buildDocumentHtml — nonce CSP", () => {
  it("aplica o nonce ao script inline de impressão", () => {
    const html = buildDocumentHtml(docData, null, "nonce-abc-123");
    assert.match(html, /<script nonce="nonce-abc-123">/);
    assert.match(html, /window\.print\(\)/);
  });

  it("omite o nonce quando não é fornecido (retrocompatível)", () => {
    const html = buildDocumentHtml(docData, null);
    assert.match(html, /<script>/);
    assert.doesNotMatch(html, /nonce=/);
  });
});

describe("buildReportHtml — nonce CSP", () => {
  const reportOpts = {
    title: "Relatório de Gestão",
    company: null,
    sections: [{ heading: "Resumo", text: "ok" }],
  };

  it("aplica o nonce ao script inline de impressão", () => {
    const html = buildReportHtml(reportOpts, "nonce-xyz-789");
    assert.match(html, /<script nonce="nonce-xyz-789">/);
    assert.match(html, /window\.print\(\)/);
  });

  it("omite o nonce quando não é fornecido (retrocompatível)", () => {
    const html = buildReportHtml(reportOpts);
    assert.match(html, /<script>/);
    assert.doesNotMatch(html, /nonce=/);
  });
});
