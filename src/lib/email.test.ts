import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { upgradeApprovedEmail, upgradeRejectedEmail } from "./email";

describe("templates de e-mail de upgrade", () => {
  it("usa assuntos distintos para aprovação e rejeição", () => {
    assert.equal(upgradeApprovedEmail("Ana", "PREMIUM").subject, "Upgrade aprovado — IBPlus+");
    assert.equal(
      upgradeRejectedEmail("Ana", "PREMIUM").subject,
      "Sobre o seu pedido de upgrade — IBPlus+"
    );
  });

  it("mostra o nome amigável do plano aprovado", () => {
    const { html } = upgradeApprovedEmail("Ana", "PREMIUM");
    assert.match(html, /<strong>Premium<\/strong>/);
    assert.doesNotMatch(html, /<strong>PREMIUM<\/strong>/);
  });

  it("mostra o nome amigável do plano rejeitado", () => {
    const { html } = upgradeRejectedEmail("Ana", "BUSINESS");
    assert.match(html, /<strong>Business<\/strong>/);
    assert.doesNotMatch(html, /<strong>BUSINESS<\/strong>/);
  });

  it("aponta a aprovação para o painel e a rejeição para os planos", () => {
    assert.match(upgradeApprovedEmail("Ana", "PREMIUM").html, /\/gestao\/dashboard/);
    assert.match(upgradeRejectedEmail("Ana", "PREMIUM").html, /\/upgrade/);
  });

  it("faz escape do nome do destinatário", () => {
    const { html } = upgradeApprovedEmail("<script>alert(1)</script>", "FREE");
    assert.match(html, /Olá &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  });

  it("mantém o identificador do plano quando não há nome amigável", () => {
    const { html } = upgradeApprovedEmail("Ana", "CUSTOM");
    assert.match(html, /<strong>CUSTOM<\/strong>/);
  });
});
