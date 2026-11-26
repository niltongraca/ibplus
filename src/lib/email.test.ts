import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  upgradeApprovedEmail,
  upgradeRejectedEmail,
  eventRegistrationSubmittedEmail,
  eventRegistrationApprovedEmail,
  eventRegistrationRejectedEmail,
  eventRegistrationOrganizerNotice,
} from "./email";

const registration = {
  name: "Ana <script>alert(1)</script>",
  eventTitle: "Workshop & Palestra",
  eventDate: "01/12/2026",
  reference: "EVT-ABCDEFGHIJ",
  amount: "12 500 Kz",
  tickets: "2 × Geral",
};

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
    assert.match(upgradeApprovedEmail("Ana", "PREMIUM").html, /gestao\/dashboard/);
    assert.match(upgradeRejectedEmail("Ana", "PREMIUM").html, /planos/);
  });
});

describe("templates de e-mail de inscrição em evento", () => {
  it("usa assuntos distintos para submissão, aprovação e rejeição", () => {
    const subjects = [
      eventRegistrationSubmittedEmail(registration).subject,
      eventRegistrationApprovedEmail(registration).subject,
      eventRegistrationRejectedEmail(registration).subject,
    ];
    assert.equal(new Set(subjects).size, 3);
  });

  it("mostra referência, bilhetes e total escapados", () => {
    const { html } = eventRegistrationApprovedEmail(registration);
    assert.match(html, /EVT-ABCDEFGHIJ/);
    assert.match(html, /12 500 Kz/);
    assert.match(html, /2 × Geral/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
  });

  it("inclui o motivo da rejeição escapado", () => {
    const { html } = eventRegistrationRejectedEmail(registration, "Comprovativo <ilegível>");
    assert.match(html, /&lt;ilegível&gt;/);
    assert.doesNotMatch(html, /<ilegível>/);
  });

  it("aviso ao organizador identifica a inscrição pendente", () => {
    const notice = eventRegistrationOrganizerNotice(
      registration,
      "http://localhost:3000/eventos/event-1"
    );
    assert.match(notice.subject, /nova inscrição/i);
    assert.match(notice.html, /EVT-ABCDEFGHIJ/);
    assert.match(notice.html, /pendente/i);
    assert.match(notice.html, /eventos\/event-1/);
  });
});
