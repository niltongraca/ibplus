import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  publicRegistrationSchema,
  registrationDecisionSchema,
  registrationReferenceSchema,
} from "./events";

const validRegistration = {
  holderName: "Ana Silva",
  holderEmail: "ana@example.com",
  holderPhone: "+244 923 000 000",
  consent: true,
  items: [{ ticketTypeId: "type-1", quantity: 2 }],
};

describe("validação de inscrição pública", () => {
  it("aceita uma submissão válida com referência opcional", () => {
    assert.equal(publicRegistrationSchema.safeParse(validRegistration).success, true);
    assert.equal(
      publicRegistrationSchema.safeParse({
        ...validRegistration,
        reference: "INS-ABCDE-FGHJK",
      }).success,
      true
    );
  });

  it("rejeita consentimento falso, contactos inválidos e tipos repetidos", () => {
    assert.equal(
      publicRegistrationSchema.safeParse({ ...validRegistration, consent: false }).success,
      false
    );
    assert.equal(
      publicRegistrationSchema.safeParse({ ...validRegistration, holderEmail: "x" }).success,
      false
    );
    assert.equal(
      publicRegistrationSchema.safeParse({ ...validRegistration, holderPhone: "abc" }).success,
      false
    );
    assert.equal(
      publicRegistrationSchema.safeParse({
        ...validRegistration,
        items: [
          { ticketTypeId: "type-1", quantity: 1 },
          { ticketTypeId: "type-1", quantity: 2 },
        ],
      }).success,
      false
    );
  });

  it("valida o formato da referência de pagamento gerada no browser", () => {
    assert.equal(registrationReferenceSchema.safeParse("INS-ABCDE-FGHJK").success, true);
    assert.equal(registrationReferenceSchema.safeParse("EVT-ABCDEFGHIJ").success, false);
  });
});

describe("validação da decisão administrativa", () => {
  it("exige motivo para rejeitar", () => {
    assert.equal(registrationDecisionSchema.safeParse({ action: "REJEITAR" }).success, false);
    assert.equal(
      registrationDecisionSchema.safeParse({ action: "REJEITAR", reason: "Comprovativo ilegível." }).success,
      true
    );
    assert.equal(registrationDecisionSchema.safeParse({ action: "APROVAR" }).success, true);
    assert.equal(registrationDecisionSchema.safeParse({ action: "CANCELAR" }).success, true);
  });
});
