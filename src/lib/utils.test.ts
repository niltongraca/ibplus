import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cn,
  formatCurrency,
  parseDateOnly,
  parsePagination,
  buildSearch,
  parseBool,
} from "./utils";

describe("cn", () => {
  it("junta classes e ignora falsy", () => {
    assert.equal(cn("a", "b", false, undefined, null, "c"), "a b c");
  });

  it("devolve string vazia sem argumentos válidos", () => {
    assert.equal(cn(false, undefined), "");
  });
});

describe("formatCurrency", () => {
  it("usa AOA por omissão", () => {
    assert.equal(formatCurrency(10), formatCurrency(10, "AOA"));
  });

  it("faz fallback para AOA em moeda não suportada", () => {
    const aoa = formatCurrency(10, "AOA");
    const unknown = formatCurrency(10, "XYZ" as never);
    assert.equal(unknown, aoa);
  });
});

describe("parseDateOnly", () => {
  it("devolve o meio-dia local para YYYY-MM-DD", () => {
    const d = parseDateOnly("2026-01-15");
    assert.ok(d);
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 0);
    assert.equal(d.getDate(), 15);
    assert.equal(d.getHours(), 12);
  });

  it("ignora sufixo de hora no input date-only", () => {
    const d = parseDateOnly("2026-01-15T22:00:00");
    assert.ok(d);
    assert.equal(d.getDate(), 15);
  });

  it("devolve null para valores inválidos ou vazios", () => {
    assert.equal(parseDateOnly(""), null);
    assert.equal(parseDateOnly(null), null);
    assert.equal(parseDateOnly(undefined), null);
    assert.equal(parseDateOnly("15/01/2026"), null);
    assert.equal(parseDateOnly("banana"), null);
  });
});

describe("parsePagination", () => {
  it("usa default de 20 por página", () => {
    assert.deepEqual(parsePagination(new URLSearchParams()), { page: 1, limit: 20, skip: 0 });
  });

  it("lê page e limit e calcula skip", () => {
    const out = parsePagination(new URLSearchParams({ page: "3", limit: "10" }));
    assert.deepEqual(out, { page: 3, limit: 10, skip: 20 });
  });

  it("limita o limit a 100 e protege page < 1", () => {
    const max = parsePagination(new URLSearchParams({ page: "2", limit: "99999" }));
    assert.equal(max.limit, 100);
    const min = parsePagination(new URLSearchParams({ page: "-5", limit: "0" }));
    assert.equal(min.page, 1);
    assert.equal(min.limit, 1);
  });
});

describe("buildSearch", () => {
  it("devolve undefined para valor vazio", () => {
    assert.equal(buildSearch(["name"], ""), undefined);
    assert.equal(buildSearch(["name"], "   "), undefined);
    assert.equal(buildSearch(["name"], undefined), undefined);
  });

  it("constrói OR com contains case-insensitive por campo", () => {
    assert.deepEqual(buildSearch(["name", "email"], "ana"), {
      OR: [
        { name: { contains: "ana", mode: "insensitive" } },
        { email: { contains: "ana", mode: "insensitive" } },
      ],
    });
  });

  it("suporta campos de relação [rel, campo]", () => {
    assert.deepEqual(buildSearch([["customer", "name"]], "zeca"), {
      OR: [{ customer: { name: { contains: "zeca", mode: "insensitive" } } }],
    });
  });
});

describe("parseBool", () => {
  it("mapeia true/1 e false/0", () => {
    assert.equal(parseBool("true"), true);
    assert.equal(parseBool("1"), true);
    assert.equal(parseBool("false"), false);
    assert.equal(parseBool("0"), false);
  });

  it("devolve undefined para outros valores", () => {
    assert.equal(parseBool("x"), undefined);
    assert.equal(parseBool(""), undefined);
    assert.equal(parseBool(undefined), undefined);
  });
});