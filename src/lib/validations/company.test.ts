import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cargoCreateSchema,
  subCompanyCreateSchema,
  companyAcquisitionSchema,
  companyPermissionsSchema,
} from "./company";

describe("cargoCreateSchema", () => {
  it("aceita cargo válido", () => {
    assert.equal(cargoCreateSchema.safeParse({ name: "Gestor" }).success, true);
  });

  it("rejeita nome em branco", () => {
    assert.equal(cargoCreateSchema.safeParse({ name: "   " }).success, false);
  });

  it("rejeita nível fora do enum", () => {
    assert.equal(cargoCreateSchema.safeParse({ name: "x", level: "dono" }).success, false);
  });

  it("aceita descrição null", () => {
    assert.equal(cargoCreateSchema.safeParse({ name: "x", description: null }).success, true);
  });
});

describe("subCompanyCreateSchema", () => {
  it("aceita subempresa válida", () => {
    assert.equal(subCompanyCreateSchema.safeParse({ name: "Filial" }).success, true);
  });

  it("rejeita tipo fora do enum", () => {
    assert.equal(subCompanyCreateSchema.safeParse({ name: "x", type: "HOLDING" }).success, false);
  });
});

describe("companyAcquisitionSchema", () => {
  it("aceita ação redeem com código", () => {
    assert.equal(companyAcquisitionSchema.safeParse({ action: "redeem", code: "abc" }).success, true);
  });

  it("aceita ação generate sem código", () => {
    assert.equal(companyAcquisitionSchema.safeParse({ action: "generate" }).success, true);
  });

  it("rejeita ação desconhecida", () => {
    assert.equal(companyAcquisitionSchema.safeParse({ action: "comprar" }).success, false);
  });
});

describe("companyPermissionsSchema", () => {
  it("aceita matriz de permissões válida", () => {
    assert.equal(
      companyPermissionsSchema.safeParse({
        matrix: { manager: { faturacao: true, clientes: false } },
      }).success,
      true
    );
  });

  it("rejeita matriz sem objeto", () => {
    assert.equal(companyPermissionsSchema.safeParse({ matrix: "não" }).success, false);
  });

  it("rejeita valores não booleanos nas features", () => {
    assert.equal(
      companyPermissionsSchema.safeParse({ matrix: { manager: { faturacao: "sim" } } }).success,
      false
    );
  });
});