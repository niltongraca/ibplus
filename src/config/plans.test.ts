import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PLANS, PLAN_LIST } from "./plans";

describe("configuração de planos", () => {
  it("expõe os três planos pela ordem esperada", () => {
    assert.deepEqual(PLAN_LIST.map((p) => p.id), ["FREE", "PREMIUM", "BUSINESS"]);
  });

  it("mantém o plano gratuito a zero", () => {
    assert.equal(PLANS.FREE.price, 0);
    assert.equal(PLANS.FREE.priceLabel, "Grátis");
  });

  it("mantém o rótulo de preço alinhado com o valor numérico", () => {
    for (const plan of PLAN_LIST) {
      if (plan.price === 0) continue;
      const digits = plan.priceLabel.replace(/\D/g, "");
      assert.ok(
        digits.startsWith(String(plan.price)),
        `${plan.id}: priceLabel "${plan.priceLabel}" não corresponde a ${plan.price}`
      );
    }
  });

  it("define os quatro limites em todos os planos", () => {
    const keys = ["maxUsers", "maxProducts", "maxCustomers", "maxInvoices"] as const;
    for (const plan of PLAN_LIST) {
      for (const key of keys) {
        assert.equal(typeof plan[key], "number", `${plan.id}.${key} deve ser numérico`);
      }
    }
  });

  it("destaca apenas um plano", () => {
    assert.equal(PLAN_LIST.filter((p) => p.highlighted).length, 1);
  });
});
