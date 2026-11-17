import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PLANS, PLAN_LIST } from "./plans";
import {
  canCreate,
  getPlanLimit,
  isUnlimited,
  isUpgrade,
  planLimitMessage,
  type PlanLimitResource,
} from "./planLimits";

const resources: PlanLimitResource[] = ["users", "products", "customers", "invoices"];
const keys = {
  users: "maxUsers",
  products: "maxProducts",
  customers: "maxCustomers",
  invoices: "maxInvoices",
} as const;

describe("limites por plano (regras puras)", () => {
  it("devolve exactamente o limite configurado para cada plano e recurso", () => {
    for (const plan of PLAN_LIST) {
      for (const resource of resources) {
        assert.equal(
          getPlanLimit(plan.id, resource),
          plan[keys[resource]],
          `${plan.id}.${resource} divergiu de plans.ts`
        );
      }
    }
  });

  it("plano desconhecido cai no FREE em vez de permitir tudo", () => {
    for (const resource of resources) {
      assert.equal(getPlanLimit("INEZISTENTE", resource), PLANS.FREE[keys[resource]]);
    }
  });

  it("trata -1 como ilimitado e zero como limite real", () => {
    assert.equal(isUnlimited(-1), true);
    assert.equal(isUnlimited(0), false);
    assert.equal(isUnlimited(10), false);
  });

  it("permite criar enquanto não se atinge o limite", () => {
    assert.equal(canCreate(2, 0), true);
    assert.equal(canCreate(2, 1), true);
    assert.equal(canCreate(2, 2), false);
    assert.equal(canCreate(2, 3), false);
    assert.equal(canCreate(-1, 99999), true);
  });

  it("só considera upgrade uma subida de nível", () => {
    assert.equal(isUpgrade("FREE", "PREMIUM"), true);
    assert.equal(isUpgrade("PREMIUM", "BUSINESS"), true);
    assert.equal(isUpgrade("FREE", "BUSINESS"), true);
    assert.equal(isUpgrade("PREMIUM", "PREMIUM"), false);
    assert.equal(isUpgrade("BUSINESS", "PREMIUM"), false);
    assert.equal(isUpgrade("FREE", "???"), false);
  });

  it("a mensagem usa o nome do plano, o limite e o rótulo do recurso", () => {
    const message = planLimitMessage("PREMIUM", "customers", 500);
    assert.match(message, /PREMIUM|Premium/);
    assert.match(message, /500/);
    assert.match(message, /clientes/);
    assert.match(message, /upgrade/i);
  });

  it("a mensagem tem fallback para plano desconhecido", () => {
    assert.match(planLimitMessage("???", "users", 1), /actual/);
  });
});
