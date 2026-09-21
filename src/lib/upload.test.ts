import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveUpload, isDataUrl, buildInlineDataUrl, UPLOAD_MAX_SIZE } from "./upload";

describe("resolveUpload", () => {
  it("aceita png/jpg/jpeg/gif/webp com tipo correspondente", () => {
    for (const [name, type] of [
      ["logo.png", "image/png"],
      ["foto.jpg", "image/jpeg"],
      ["foto.jpeg", "image/jpeg"],
      ["anim.gif", "image/gif"],
      ["img.webp", "image/webp"],
    ] as const) {
      const r = resolveUpload({ name, size: 1024, type });
      assert.equal(r.ok, true);
      if (r.ok) {
        assert.equal(r.mime, type);
        assert.ok(r.ext);
      }
    }
  });

  it("sem tipo MIME no request, usa o tipo da extensão", () => {
    const r = resolveUpload({ name: "logo.png", size: 1024, type: "" });
    assert.deepEqual(r, { ok: true, mime: "image/png", ext: ".png" });
  });

  it("rejeita extensão desconhecida e ficheiro sem extensão", () => {
    const unknown = resolveUpload({ name: "doc.pdf", size: 1024, type: "application/pdf" });
    assert.deepEqual(unknown, { ok: false, error: "Tipo de ficheiro não permitido." });
    const noExt = resolveUpload({ name: "logo", size: 1024, type: "image/png" });
    assert.deepEqual(noExt, { ok: false, error: "Tipo de ficheiro não permitido." });
  });

  it("rejeita tipo MIME em conflito com a extensão", () => {
    const r = resolveUpload({ name: "foto.png", size: 1024, type: "image/jpeg" });
    assert.deepEqual(r, { ok: false, error: "Tipo de ficheiro inválido." });
  });

  it("rejeita ficheiros acima de 5MB", () => {
    const r = resolveUpload({ name: "big.png", size: UPLOAD_MAX_SIZE + 1, type: "image/png" });
    assert.deepEqual(r, { ok: false, error: "Ficheiro demasiado grande (máx. 5MB)." });
  });

  it("rejeita ficheiro vazio ou sem nome", () => {
    const empty = resolveUpload({ name: "vazio.png", size: 0, type: "image/png" });
    assert.deepEqual(empty, { ok: false, error: "Ficheiro vazio." });
    const noName = resolveUpload({ name: "", size: 10, type: "image/png" });
    assert.deepEqual(noName, { ok: false, error: "Nenhum ficheiro enviado." });
  });
});

describe("isDataUrl / buildInlineDataUrl", () => {
  it("reconhece data-URLs e não-URLs", () => {
    assert.equal(isDataUrl("data:image/png;base64,AAA="), true);
    assert.equal(isDataUrl("https://x.public.blob.vercel-storage.com/img.png"), false);
    assert.equal(isDataUrl(""), false);
  });

  it("constrói data-URL com base64 válido", () => {
    const url = buildInlineDataUrl("image/png", new Uint8Array([1, 2, 3]));
    assert.equal(url, "data:image/png;base64,AQID");
  });
});