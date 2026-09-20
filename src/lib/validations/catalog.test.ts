import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkoutSchema,
  customerCreateSchema,
  opportunityCreateSchema,
  campaignCreateSchema,
} from "./catalog";

describe("checkoutSchema", () => {
  it("aceita um checkout válido", () => {
    assert.equal(
      checkoutSchema.safeParse({
        customerName: "Cliente da loja",
        paymentMethod: "cash",
        items: [{ productId: "prod1", quantity: 2 }],
      }).success,
      true
    );
  });

  it("rejeita carrinho vazio", () => {
    assert.equal(checkoutSchema.safeParse({ items: [] }).success, false);
  });

  it("rejeita item sem productId", () => {
    assert.equal(checkoutSchema.safeParse({ items: [{ quantity: 1 }] }).success, false);
  });

  it("rejeita quantidade inválida (zero/fraccionária)", () => {
    assert.equal(checkoutSchema.safeParse({ items: [{ productId: "p", quantity: 0 }] }).success, false);
    assert.equal(checkoutSchema.safeParse({ items: [{ productId: "p", quantity: 1.5 }] }).success, false);
  });

  it("rejeita método de pagamento desconhecido", () => {
    assert.equal(
      checkoutSchema.safeParse({ paymentMethod: "bitcoin", items: [{ productId: "p", quantity: 1 }] }).success,
      false
    );
  });

  it("aceita checkout sem paymentMethod", () => {
    assert.equal(checkoutSchema.safeParse({ items: [{ productId: "p", quantity: 1 }] }).success, true);
  });
});

describe("customerCreateSchema", () => {
  it("aceita cliente só com nome (email vazio)", () => {
    assert.equal(customerCreateSchema.safeParse({ name: "Ana", email: "" }).success, true);
  });

  it("aceita email nulo", () => {
    assert.equal(customerCreateSchema.safeParse({ name: "Ana", email: null }).success, true);
  });

  it("aceita email válido e tipo empresa", () => {
    assert.equal(customerCreateSchema.safeParse({ name: "Ana", email: "a@b.com", type: "empresa" }).success, true);
  });

  it("rejeita email inválido", () => {
    assert.equal(customerCreateSchema.safeParse({ name: "Ana", email: "x" }).success, false);
  });

  it("rejeita nome em falta", () => {
    assert.equal(customerCreateSchema.safeParse({}).success, false);
  });

  it("rejeita tipo fora do enum", () => {
    assert.equal(customerCreateSchema.safeParse({ name: "Ana", type: "cooperativa" }).success, false);
  });
});

describe("opportunityCreateSchema", () => {
  it("aceita oportunidade válida", () => {
    assert.equal(opportunityCreateSchema.safeParse({ title: "Venda A", customerId: "c1" }).success, true);
  });

  it("rejeita sem título", () => {
    assert.equal(opportunityCreateSchema.safeParse({ customerId: "c1" }).success, false);
  });

  it("rejeita sem cliente", () => {
    assert.equal(opportunityCreateSchema.safeParse({ title: "Venda A" }).success, false);
  });

  it("rejeita valor negativo", () => {
    assert.equal(opportunityCreateSchema.safeParse({ title: "Venda A", customerId: "c1", value: -5 }).success, false);
  });
});

describe("campaignCreateSchema", () => {
  it("aceita campanha válida com default type/status", () => {
    assert.equal(campaignCreateSchema.safeParse({ name: "Campanha" }).success, true);
  });

  it("rejeita status fora do enum", () => {
    assert.equal(campaignCreateSchema.safeParse({ name: "Campanha", status: "publicado" }).success, false);
  });

  it("aceita budget nulo", () => {
    assert.equal(campaignCreateSchema.safeParse({ name: "Campanha", budget: null }).success, true);
  });
});