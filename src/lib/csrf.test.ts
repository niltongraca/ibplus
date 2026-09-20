import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateCsrf, CSRF_COOKIE, CSRF_HEADER } from "./csrf";

describe("evaluateCsrf (double-submit)", () => {
  it("devolve 'seed' quando não há cookie (sessão legada/primeira visita)", () => {
    assert.equal(evaluateCsrf(undefined, undefined), "seed");
    assert.equal(evaluateCsrf("", undefined), "seed");
    assert.equal(evaluateCsrf(undefined, "abc"), "seed");
  });

  it("devolve 'ok' quando o header é igual ao cookie", () => {
    assert.equal(evaluateCsrf("token-123", "token-123"), "ok");
  });

  it("devolve 'reject' quando o header falta", () => {
    assert.equal(evaluateCsrf("token-123", undefined), "reject");
    assert.equal(evaluateCsrf("token-123", null), "reject");
    assert.equal(evaluateCsrf("token-123", ""), "reject");
  });

  it("devolve 'reject' quando o header não confere", () => {
    assert.equal(evaluateCsrf("token-123", "outro"), "reject");
    assert.equal(evaluateCsrf("token-123", "token-123 "), "reject");
  });
});

describe("constantes de CSRF", () => {
  it("nomes de cookie e header estáveis e distintos", () => {
    assert.equal(CSRF_COOKIE, "ibplus_csrf");
    assert.equal(CSRF_HEADER, "x-csrf-token");
    assert.notEqual(CSRF_COOKIE, CSRF_HEADER);
  });
});