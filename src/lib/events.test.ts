import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateRegistrationToken,
  generateRegistrationCode,
  registrationPaymentReference,
  parseEventDateTime,
} from "./events";

describe("event helpers", () => {
  it("gera tokens opacos distintos", () => {
    const first = generateRegistrationToken();
    const second = generateRegistrationToken();
    assert.notEqual(first, second);
    assert.match(first, /^[A-Za-z0-9_-]+$/);
    assert.ok(first.length >= 32);
  });

  it("gera códigos de inscrição legíveis e uma referência truncada a 12 caracteres", () => {
    const code = generateRegistrationCode();
    assert.match(code, /^INS-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
    assert.equal(
      registrationPaymentReference(code),
      `EVT-${code.replace(/-/g, "").slice(0, 12)}`
    );
  });

  it("normaliza referências de pagamento vindas do browser", () => {
    assert.equal(registrationPaymentReference("ins-abcde-fghij"), "EVT-INSABCDEFGHI");
    assert.equal(registrationPaymentReference("INS ABCDE FGHIJ"), "EVT-INSABCDEFGHI");
  });

  it("interpreta datas locais no fuso da empresa", () => {
    const date = parseEventDateTime("2026-12-01T10:30", "Africa/Luanda");
    assert.ok(date);
    assert.equal(date.getUTCHours(), 9);
    assert.equal(date.getUTCMinutes(), 30);
    assert.equal(date.getUTCDate(), 1);
  });
});
