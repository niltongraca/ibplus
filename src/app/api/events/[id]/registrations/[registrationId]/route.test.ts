import { describe, it, before, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

const state: any = {};

function resetState() {
  state.user = { id: "admin-1", companyId: "company-1" };
  state.event = { id: "event-1", title: "Workshop IBPlus+", startDate: new Date("2026-12-01T09:00:00Z") };
  state.registration = {
    id: "reg-1",
    eventId: "event-1",
    code: "INS-ABCDE-FGHJK",
    holderName: "Ana Silva",
    holderEmail: "ana@example.com",
    holderPhone: "+244 923 000 000",
    paymentRef: "EVT-ABCDEFGHIJ",
    amount: 200,
    proofUrl: "https://blob.example/proof",
    notes: null,
    status: "PENDENTE",
    items: [{ ticketTypeId: "type-1", quantity: 2, unitPrice: 100, ticketType: { name: "Geral" } }],
  };
  state.types = [{ id: "type-1", name: "Geral", price: 100, quantity: 3, active: true }];
  state.reserved = new Map<string, number>(); // reservas de outras inscrições
  state.ownReserved = 0; // reserva da inscrição em análise
  state.tickets = [];
  state.deletedProofs = [];
  state.emails = [];
  state.audits = [];
}

resetState();

const prismaMock: any = {
  event: { findFirst: async () => state.event },
  eventRegistration: {
    findFirst: async () => state.registration,
    update: async ({ data }: any) => {
      Object.assign(state.registration, data);
      return state.registration;
    },
  },
  eventTicketType: {
    findMany: async ({ where }: any) =>
      state.types.filter((t: any) => where.id.in.includes(t.id) && t.active),
  },
  eventTicket: {
    createManyAndReturn: async ({ data }: any) => {
      const created = data.map((ticket: any, index: number) => ({ id: `ticket-${index}`, ...ticket }));
      state.tickets.push(...created);
      return created;
    },
  },
  $transaction: async (callback: any) => callback(prismaMock),
};

let ticketCounter = 0;
mock.module("@/lib/prisma", { namedExports: { prisma: prismaMock } });
mock.module("@/lib/auth", { namedExports: { getAuthUser: async () => state.user } });
mock.module("@/lib/permissions", { namedExports: { requireWrite: async () => null } });
mock.module("@/lib/audit", {
  namedExports: { logAction: async (...args: any[]) => void state.audits.push(args) },
});
mock.module("@/lib/events", {
  namedExports: { generateTicketCode: () => `IB-T${++ticketCounter}-${ticketCounter}` },
});
mock.module("@/lib/eventRegistrations", {
  namedExports: {
    getReservedByTicketType: async (_eventId: string, ids: string[], options: any = {}) => {
      const map = new Map(state.reserved);
      if (!options.excludeRegistrationId) {
        for (const id of ids) map.set(id, (map.get(id) ?? 0) + state.ownReserved);
      }
      return map;
    },
    remainingTickets: (quantity: number, reserved: number) =>
      quantity <= 0 ? null : Math.max(0, quantity - reserved),
    deleteRegistrationProof: async (url: string) => void state.deletedProofs.push(url),
  },
});
mock.module("@/lib/email", {
  namedExports: {
    sendEmail: async (...args: any[]) => {
      state.emails.push(args);
      return { success: true };
    },
    eventRegistrationApprovedEmail: () => ({ subject: "confirmada", html: "confirmada" }),
    eventRegistrationRejectedEmail: () => ({ subject: "rejeitada", html: "rejeitada" }),
  },
});

let decide: typeof import("@/app/api/events/[id]/registrations/[registrationId]/route").PATCH;

before(async () => {
  ({ PATCH: decide } = await import(
    "@/app/api/events/[id]/registrations/[registrationId]/route"
  ));
});

beforeEach(() => {
  resetState();
  ticketCounter = 0;
});

function decisionRequest(body: unknown): Request {
  return new Request("https://ibplus.co.ao/api/events/event-1/registrations/reg-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = { params: Promise.resolve({ id: "event-1", registrationId: "reg-1" }) };

describe("PATCH decisão administrativa", () => {
  it("aprova, emite um bilhete por quantidade e revalida o stock sem contar a própria reserva", async () => {
    state.ownReserved = 3; // a reserva desta inscrição não conta contra si própria
    const response = await decide(decisionRequest({ action: "APROVAR" }), params);
    assert.equal(response.status, 200);
    const body: any = await response.json();
    assert.equal(body.registration.status, "PAGA");
    assert.equal(body.registration.ticketsCreated, 2);
    assert.equal(state.tickets.length, 2);
    assert.equal(state.registration.status, "PAGA");
    assert.equal(state.emails.length, 1);
    assert.equal(state.audits.length, 1);
  });

  it("bloqueia a aprovação se não houver stock para outra inscrição", async () => {
    state.types[0].quantity = 1;
    state.reserved.set("type-1", 1);
    const response = await decide(decisionRequest({ action: "APROVAR" }), params);
    assert.equal(response.status, 409);
    assert.equal(state.tickets.length, 0);
    assert.equal(state.registration.status, "PENDENTE");
  });

  it("exige motivo para rejeitar e apaga o comprovativo quando rejeita", async () => {
    assert.equal((await decide(decisionRequest({ action: "REJEITAR" }), params)).status, 400);
    const response = await decide(
      decisionRequest({ action: "REJEITAR", reason: "Comprovativo ilegível." }),
      params
    );
    assert.equal(response.status, 200);
    assert.equal(state.registration.status, "REJEITADA");
    assert.deepEqual(state.deletedProofs, ["https://blob.example/proof"]);
    assert.equal(state.tickets.length, 0);
  });

  it("não permite decidir duas vezes", async () => {
    state.registration.status = "PAGA";
    const response = await decide(decisionRequest({ action: "APROVAR" }), params);
    assert.equal(response.status, 409);
  });
});
