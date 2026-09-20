import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { invoiceCreateSchema, expenseCreateSchema, saleCreateSchema } from "./finance";

const item = { description: "Consultoria", quantity: 2, unitPrice: 100 };

describe("invoiceCreateSchema", () => {
  it("aceita uma fatura válida com campos de cliente vazios (\"\"/null)", () => {
    const result = invoiceCreateSchema.safeParse({
      customer: "",
      customerEmail: "",
      customerPhone: null,
      customerNif: null,
      items: [item],
      paymentMethod: "cash",
    });
    assert.equal(result.success, true);
  });

  it("aceita email de cliente válido", () => {
    assert.equal(
      invoiceCreateSchema.safeParse({ customer: "Cliente A", customerEmail: "a@b.com", items: [item] }).success,
      true
    );
  });

  it("rejeita email de cliente inválido", () => {
    assert.equal(invoiceCreateSchema.safeParse({ customerEmail: "não-é-email", items: [item] }).success, false);
  });

  it("rejeita fatura sem items", () => {
    assert.equal(invoiceCreateSchema.safeParse({ items: [] }).success, false);
  });

  it("rejeita item sem descrição", () => {
    assert.equal(invoiceCreateSchema.safeParse({ items: [{ ...item, description: "  " }] }).success, false);
  });

  it("rejeita quantidade não inteira", () => {
    assert.equal(
      invoiceCreateSchema.safeParse({ items: [{ description: "x", quantity: 1.5, unitPrice: 10 }] }).success,
      false
    );
  });

  it("rejeita discountType fora do enum", () => {
    assert.equal(invoiceCreateSchema.safeParse({ items: [item], discountType: "percentagem" }).success, false);
  });

  it("parseia texto numérico para number via coerce", () => {
    const result = invoiceCreateSchema.safeParse({
      items: [{ description: "x", quantity: "2", unitPrice: "50.5" }],
      discountValue: "10",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.items[0].quantity, 2);
      assert.equal(result.data.items[0].unitPrice, 50.5);
      assert.equal(result.data.discountValue, 10);
    }
  });
});

describe("expenseCreateSchema", () => {
  it("aceita uma despesa válida", () => {
    assert.equal(expenseCreateSchema.safeParse({ description: "Internet", amount: 50 }).success, true);
  });

  it("rejeita valor negativo", () => {
    assert.equal(expenseCreateSchema.safeParse({ description: "x", amount: -1 }).success, false);
  });

  it("rejeita descrição em falta", () => {
    assert.equal(expenseCreateSchema.safeParse({ amount: 10 }).success, false);
  });

  it("aceita date vazio (null)", () => {
    assert.equal(expenseCreateSchema.safeParse({ description: "x", amount: 1, date: null }).success, true);
  });
});

describe("saleCreateSchema", () => {
  it("aceita venda com items válidos e cliente null", () => {
    assert.equal(
      saleCreateSchema.safeParse({
        customerId: null,
        paymentMethod: null,
        items: [{ productId: "abc", quantity: 1 }],
      }).success,
      true
    );
  });

  it("rejeita venda sem items", () => {
    assert.equal(saleCreateSchema.safeParse({ items: [] }).success, false);
  });

  it("rejeita item sem productId", () => {
    assert.equal(saleCreateSchema.safeParse({ items: [{ quantity: 1 }] }).success, false);
  });
});