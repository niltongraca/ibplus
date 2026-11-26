import { describe, it, before, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

const state: any = {};

function resetState() {
  state.event = {
    id: "event-1",
    title: "Workshop IBPlus+",
    startDate: new Date("2026-12-01T09:00:00Z"),
    published: true,
    status: "PUBLICADO",
    company: { email: "organizador@exemplo.com" },
  };
  state.types = [{ id: "type-1", name: "Geral", price: 100, quantity: 2, active: true }];
  state.reserved = new Map<string, number>();
  state.created = [];
  state.stored = [];
  state.deletedProofs = [];
  state.emails = [];
  state.allow = true;
}

resetState();

const prismaMock: any = {
  event: { findUnique: async () => state.event },
  eventTicketType: {
    findMany: async ({ where }: any) =>
      state.types.filter((t: any) => where.id.in.includes(t.id) && t.active),
  },
  eventRegistration: {
    create: async ({ data }: any) => {
      const record = {
        id: "reg-1",
        code: "INS-ABCDE-FGHJK",
        createdAt: new Date("2026-11-25T12:00:00Z"),
        ...data,
        amount: data.amount,
        items: data.items.create.map((item: any) => ({
          quantity: item.quantity,
          ticketType: { name: state.types.find((t: any) => t.id === item.ticketTypeId)?.name },
        })),
      };
      state.created.push(record);
      return record;
    },
  },
  $transaction: async (callback: any) => callback(prismaMock),
};

mock.module("@/lib/prisma", { namedExports: { prisma: prismaMock } });
mock.module("@/lib/rateLimit", {
  namedExports: {
    getClientIp: () => "127.0.0.1",
    checkRateLimit: async () => ({ allowed: state.allow, retryAfter: 30 }),
    rateLimitResponse: () => new Response("too many", { status: 429 }),
  },
});
mock.module("@/lib/events", {
  namedExports: {
    generateRegistrationCode: () => "INS-ABCDE-FGHJK",
    registrationPaymentReference: (code: string) => `EVT-${code.slice(4, 16)}`,
  },
});
mock.module("@/lib/eventRegistrations", {
  namedExports: {
    getReservedByTicketType: async () => state.reserved,
    remainingTickets: (quantity: number, reserved: number) =>
      quantity <= 0 ? null : Math.max(0, quantity - reserved),
    storeRegistrationProof: async (buffer: Buffer, name: string, mime: string) => {
      state.stored.push({ size: buffer.length, name, mime });
      return { url: "https://blob.example/proof", storage: "blob" as const };
    },
    deleteRegistrationProof: async (url: string) => void state.deletedProofs.push(url),
  },
});
mock.module("@/lib/upload", {
  namedExports: {
    resolveProofUpload: (file: { name: string; size: number; type: string }) =>
      /\.(png|jpe?g|gif|webp|pdf)$/i.test(file.name)
        ? { ok: true as const, mime: file.type || "image/png", ext: file.name.slice(-4) }
        : { ok: false as const, error: "Tipo de ficheiro não permitido." },
    isPdfBuffer: (buffer: Uint8Array) =>
      new TextDecoder().decode(buffer.slice(0, 5)) === "%PDF-",
  },
});
mock.module("@/lib/email", {
  namedExports: {
    sendEmail: async (...args: any[]) => {
      state.emails.push(args);
      return { success: true };
    },
    eventRegistrationSubmittedEmail: () => ({ subject: "recebida", html: "recebida" }),
    eventRegistrationOrganizerNotice: () => ({ subject: "pendente", html: "pendente" }),
  },
});

let postRegistration: typeof import("@/app/api/public/events/[token]/registrations/route").POST;

before(async () => {
  ({ POST: postRegistration } = await import(
    "@/app/api/public/events/[token]/registrations/route"
  ));
});

beforeEach(resetState);

function formRequest(reference?: string, quantity = 1): Request {
  const form = new FormData();
  if (reference) form.set("reference", reference);
  form.set("holderName", "Ana Silva");
  form.set("holderEmail", "ana@example.com");
  form.set("holderPhone", "+244 923 000 000");
  form.set("consent", "true");
  form.set("items", JSON.stringify([{ ticketTypeId: "type-1", quantity }]));
  form.set("proof", new File([new Uint8Array([137, 80, 78, 71])], "comprovativo.png", { type: "image/png" }));
  return new Request("https://ibplus.co.ao/api/public/events/token-opaco-1234567890/registrations", {
    method: "POST",
    headers: { origin: "https://ibplus.co.ao" },
    body: form,
  });
}

const params = { params: Promise.resolve({ token: "token-opaco-1234567890" }) };

describe("POST inscrição pública", () => {
  it("guarda a referência gerada no browser, cria a inscrição pendente e notifica", async () => {
    const response = await postRegistration(formRequest("INS-ABCDE-FGHJK"), params);
    assert.equal(response.status, 201);
    const body: any = await response.json();
    assert.equal(body.registration.status, "PENDENTE");
    assert.equal(body.registration.reference, "INS-ABCDE-FGHJK");
    assert.equal(state.created.length, 1);
    assert.equal(state.created[0].proofUrl, "https://blob.example/proof");
    assert.equal(state.emails.length, 2);
  });

  it("usa referência derivada do código quando o browser não envia uma", async () => {
    const response = await postRegistration(formRequest(), params);
    assert.equal(response.status, 201);
    const body: any = await response.json();
    assert.equal(body.registration.reference, "EVT-ABCDE-FGHJK");
  });

  it("rejeita quantidade superior ao stock e apaga o comprovativo", async () => {
    state.reserved.set("type-1", 1);
    const response = await postRegistration(formRequest(undefined, 2), params);
    assert.equal(response.status, 409);
    assert.equal(state.created.length, 0);
    assert.deepEqual(state.deletedProofs, ["https://blob.example/proof"]);
  });

  it("exige origem válida e não excede o rate limit", async () => {
    const badOrigin = new Request("https://ibplus.co.ao/api/public/events/token-opaco-1234567890/registrations", {
      method: "POST",
      headers: { origin: "https://atacante.example" },
      body: await formRequest().formData(),
    });
    assert.equal((await postRegistration(badOrigin, params)).status, 403);

    state.allow = false;
    assert.equal((await postRegistration(formRequest(), params)).status, 429);
  });
});
