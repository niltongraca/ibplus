import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { documentDatePayload } from "./documentDates";

describe("documentDatePayload", () => {
  it("envia a data de fatura em dueDate", () => {
    assert.deepEqual(documentDatePayload("invoice", "2026-12-31"), { dueDate: "2026-12-31" });
  });

  it("envia a data de orçamento em validUntil", () => {
    assert.deepEqual(documentDatePayload("quote", "2026-12-31"), { validUntil: "2026-12-31" });
  });

  it("preserva null quando não há data", () => {
    assert.deepEqual(documentDatePayload("invoice", null), { dueDate: null });
    assert.deepEqual(documentDatePayload("quote", null), { validUntil: null });
  });
});
