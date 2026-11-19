import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  activePaymentProvider,
  getManualPaymentDetails,
  hasManualPaymentDetails,
  paymentReference,
  planAmount,
} from "@/config/payments";

describe("config de pagamentos", () => {
  it("só activa o Stripe com PAYMENT_PROVIDER=stripe", () => {
    assert.equal(activePaymentProvider(undefined), "none");
    assert.equal(activePaymentProvider(""), "none");
    assert.equal(activePaymentProvider("none"), "none");
    assert.equal(activePaymentProvider("manual"), "none");
    assert.equal(activePaymentProvider(" Stripe "), "stripe");
    assert.equal(activePaymentProvider("STRIPE"), "stripe");
  });

  it("deriva uma referência legível e estável do id", () => {
    assert.equal(paymentReference("clx9f0a2b0000abcd"), "IBP-CLX9F0A2");
    assert.equal(paymentReference("550e8400-e29b-41d4"), "IBP-550E8400");
    assert.match(paymentReference(""), /^IBP-00000000$/);
  });

  it("usa o preço da config de planos como valor a cobrar", () => {
    assert.equal(planAmount("FREE"), 0);
    assert.equal(planAmount("PREMIUM"), 5000);
    assert.equal(planAmount("BUSINESS"), 15000);
  });

  it("considera configurado quando há IBAN ou entidade Multicaixa", () => {
    const base = {
      bankName: "",
      accountName: "",
      iban: "",
      multicaixaEntity: "",
      supportPhone: "",
    };
    assert.equal(hasManualPaymentDetails(base), false);
    assert.equal(hasManualPaymentDetails({ ...base, iban: "AO00 0000" }), true);
    assert.equal(hasManualPaymentDetails({ ...base, multicaixaEntity: "12345" }), true);
  });

  it("lê os dados públicos das variáveis NEXT_PUBLIC_*", () => {
    const previous = process.env.NEXT_PUBLIC_PAYMENT_IBAN;
    process.env.NEXT_PUBLIC_PAYMENT_IBAN = " AO06 0000 0000 0000 0000 0 ";
    try {
      assert.equal(getManualPaymentDetails().iban, "AO06 0000 0000 0000 0000 0");
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_PAYMENT_IBAN;
      else process.env.NEXT_PUBLIC_PAYMENT_IBAN = previous;
    }
  });
});
