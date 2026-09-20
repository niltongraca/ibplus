import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { parseBody, validateSchema } from "./helpers";

const sampleSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  age: z.coerce.number().int().positive().optional(),
});

function sampleRequest(body: string): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("validateSchema", () => {
  it("devolve os dados quando o corpo é válido", () => {
    const result = validateSchema(sampleSchema, { name: "Ana" });
    assert.ok("data" in result);
    if ("data" in result) {
      assert.deepEqual(result.data, { name: "Ana" });
    }
  });

  it("devolve erro com mensagem PT e status 400 quando há violação", async () => {
    const result = validateSchema(sampleSchema, { name: "" });
    assert.ok("error" in result);
    if ("error" in result) {
      assert.equal(result.error.status, 400);
      const body = await result.error.json() as { error: string };
      assert.ok(body.error.includes("obrigatório"));
    }
  });

  it("inclui o campo no payload quando o erro tem path", async () => {
    const result = validateSchema(sampleSchema, { name: "Ana", age: -1 });
    assert.ok("error" in result);
    if ("error" in result) {
      const body = await result.error.json() as { error: string; field?: string };
      assert.equal(body.field, "age");
      assert.ok(body.error.length > 0);
    }
  });

  it("ignora campos extra (strip por omissão)", () => {
    const result = validateSchema(sampleSchema, { name: "Ana", hack: true });
    if ("data" in result) {
      assert.deepEqual(result.data, { name: "Ana" });
      assert.ok(!("hack" in result.data));
    }
  });
});

describe("parseBody", () => {
  it("parseia JSON válido e valida com o schema", async () => {
    const result = await parseBody(sampleRequest(JSON.stringify({ name: "Pedro" })), sampleSchema);
    assert.ok("data" in result);
    if ("data" in result) assert.equal(result.data.name, "Pedro");
  });

  it("devolve 400 com mensagem de JSON inválido quando o corpo não é JSON", async () => {
    const result = await parseBody(sampleRequest("{não é json"), sampleSchema);
    assert.ok("error" in result);
    if ("error" in result) {
      assert.equal(result.error.status, 400);
      const body = await result.error.json() as { error: string };
      assert.ok(body.error.includes("JSON"));
    }
  });

  it("devolve 400 quando o JSON é válido mas não passa no schema", async () => {
    const result = await parseBody(sampleRequest(JSON.stringify({})), sampleSchema);
    assert.ok("error" in result);
    if ("error" in result) {
      assert.equal(result.error.status, 400);
      const body = await result.error.json() as { error: string; field?: string };
      assert.equal(body.field, "name");
    }
  });
});