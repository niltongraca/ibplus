import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toNumber } from "./money";

describe("toNumber", () => {
  it("devolve o número tal como está quando é finito", () => {
    assert.equal(toNumber(12.5), 12.5);
    assert.equal(toNumber(0), 0);
  });

  it("converte strings numéricas", () => {
    assert.equal(toNumber("12.5"), 12.5);
    assert.equal(toNumber("0"), 0);
  });

  it("devolve 0 para null/undefined", () => {
    assert.equal(toNumber(null), 0);
    assert.equal(toNumber(undefined), 0);
  });

  it("devolve 0 para strings e números inválidos", () => {
    assert.equal(toNumber("abc"), 0);
    assert.equal(toNumber(Infinity), 0);
    assert.equal(toNumber(NaN), 0);
  });

  it("usa toNumber() em objetos do tipo Decimal do Prisma", () => {
    const decimal = { toNumber: () => 42.75 } as { toNumber: () => number };
    assert.equal(toNumber(decimal), 42.75);
  });

  it("devolve 0 para objetos sem toNumber", () => {
    assert.equal(toNumber({ a: 1 }), 0);
  });
});