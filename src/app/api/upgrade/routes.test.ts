import { describe, it, before, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

// --- Estado partilhado dos fakes -------------------------------------------
const state: any = {};

function resetState() {
  state.user = { id: "u1", email: "ana@exemplo.com", name: "Ana", role: "user", companyId: null, isOwner: true };
  state.existing = null;
  state.byId = new Map<string, any>();
  state.owner = null;
  state.companyPlan = "FREE";
  state.planUpdates = [];
  state.audits = [];
  state.notifications = [];
  state.emails = [];
  state.emailSuccess = true;
  state.checkoutEnabled = true;
  state.webhookEnabled = true;
  state.priceIds = { PREMIUM: "price_premium", BUSINESS: "price_business" };
  state.checkoutArgs = [];
  state.webhookEvent = null;
}

resetState();

const prismaMock: any = {
  upgradeRequest: {
    findFirst: async () => state.existing,
    findUnique: async ({ where }: any) => state.byId.get(where.id) ?? null,
    create: async ({ data }: any) => {
      const record = {
        status: "PENDING",
        reviewedAt: null,
        reviewedBy: null,
        paymentStatus: "NONE",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      state.byId.set(record.id, record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const record = state.byId.get(where.id);
      if (!record || (where.status && record.status !== where.status)) {
        const err: any = new Error("Registo não encontrado");
        err.code = "P2025";
        throw err;
      }
      Object.assign(record, data);
      return record;
    },
    findMany: async () => [],
    count: async () => 0,
  },
  user: {
    update: async ({ where, data }: any) => {
      state.planUpdates.push({ id: where.id, plan: data.plan });
      return { id: where.id, ...data };
    },
  },
  employee: { findFirst: async () => state.owner },
  notification: { create: async ({ data }: any) => void state.notifications.push(data) },
  auditLog: { create: async ({ data }: any) => void state.audits.push(data) },
  $transaction: async (ops: any[]) => Promise.all(ops),
};

const stripeMock: any = {
  checkout: {
    sessions: {
      create: async (opts: any) => {
        state.checkoutArgs.push(opts);
        return { id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1" };
      },
    },
  },
  webhooks: {
    constructEvent: (_payload: string, signature: string) => {
      if (signature !== "valid") throw new Error("bad signature");
      return state.webhookEvent;
    },
  },
};

mock.module("@/lib/prisma", { namedExports: { prisma: prismaMock } });
mock.module("@/lib/auth", { namedExports: { getAuthUser: async () => state.user } });
mock.module("@/lib/audit", { namedExports: { logAction: async (...args: any[]) => void state.audits.push(args) } });
mock.module("@/lib/notifications", { namedExports: { createNotification: async (...args: any[]) => void state.notifications.push(args) } });
mock.module("@/lib/email", {
  namedExports: {
    sendEmail: async (...args: any[]) => {
      state.emails.push(args);
      return { success: state.emailSuccess };
    },
    upgradeApprovedEmail: (name: string, plan: string) => ({ subject: "aprovado", html: `${name} ${plan}` }),
    upgradeRejectedEmail: (name: string, plan: string) => ({ subject: "rejeitado", html: `${name} ${plan}` }),
  },
});
mock.module("@/lib/rateLimit", {
  namedExports: {
    getClientIp: () => "127.0.0.1",
    checkRateLimit: async () => ({ allowed: true }),
    rateLimitResponse: () => new Response("too many", { status: 429 }),
  },
});
mock.module("@/lib/planLimits", {
  namedExports: { getCompanyPlan: async () => state.companyPlan },
});
mock.module("@/lib/stripe", {
  namedExports: {
    getStripe: () => stripeMock,
    isCheckoutEnabled: () => state.checkoutEnabled,
    isWebhookEnabled: () => state.webhookEnabled,
    stripePriceId: (plan: string) => state.priceIds[plan] ?? null,
  },
});

let requestUpgrade: typeof import("@/app/api/upgrade/request/route").POST;
let getUpgradeRequest: typeof import("@/app/api/upgrade/request/route").GET;
let updateUpgradeProof: typeof import("@/app/api/upgrade/request/[id]/route").PATCH;
let getProof: typeof import("@/app/api/admin/upgrade-requests/[id]/proof/route").GET;
let reviewUpgrade: typeof import("@/app/api/admin/upgrade-requests/[id]/route").PATCH;
let checkout: typeof import("@/app/api/upgrade/checkout/route");
let stripeWebhook: typeof import("@/app/api/upgrade/webhook/route").POST;

// Importações dinâmicas depois de registar os mocks (evita top-level await em CJS).
before(async () => {
  ({ POST: requestUpgrade, GET: getUpgradeRequest } = await import("@/app/api/upgrade/request/route"));
  ({ PATCH: updateUpgradeProof } = await import("@/app/api/upgrade/request/[id]/route"));
  ({ GET: getProof } = await import("@/app/api/admin/upgrade-requests/[id]/proof/route"));
  ({ PATCH: reviewUpgrade } = await import("@/app/api/admin/upgrade-requests/[id]/route"));
  checkout = await import("@/app/api/upgrade/checkout/route");
  ({ POST: stripeWebhook } = await import("@/app/api/upgrade/webhook/route"));
});

function jsonRequest(url: string, body: unknown, method = "POST"): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const upgradeBody = { toPlan: "PREMIUM", phone: "912345678", note: null };
const pendingRequest = () => ({
  id: "req1",
  userId: "u1",
  companyId: null,
  fromPlan: "FREE",
  toPlan: "PREMIUM",
  status: "PENDING",
  paymentStatus: "NONE",
  user: { name: "Ana", email: "ana@exemplo.com" },
});

describe("rotas de upgrade", () => {
  beforeEach(() => resetState());

  describe("POST /api/upgrade/request", () => {
    it("exige autenticação", async () => {
      state.user = null;
      const res = await requestUpgrade(jsonRequest("http://localhost/api/upgrade/request", upgradeBody));
      assert.equal(res.status, 401);
    });

    it("impede que um funcionário peça upgrade em nome da empresa", async () => {
      state.user = { ...state.user, companyId: "c1", isOwner: false };
      const res = await requestUpgrade(jsonRequest("http://localhost/api/upgrade/request", upgradeBody));
      assert.equal(res.status, 403);
    });

    it("rejeita um pedido que não é upgrade", async () => {
      state.companyPlan = "BUSINESS";
      const res = await requestUpgrade(jsonRequest("http://localhost/api/upgrade/request", upgradeBody));
      assert.equal(res.status, 400);
    });

    it("bloqueia pedido duplicado pendente", async () => {
      state.existing = { id: "old", toPlan: "PREMIUM" };
      const res = await requestUpgrade(jsonRequest("http://localhost/api/upgrade/request", upgradeBody));
      assert.equal(res.status, 409);
      assert.equal((await res.json()).code, "UPGRADE_REQUEST_PENDING");
    });

    it("cria o pedido e regista auditoria", async () => {
      const res = await requestUpgrade(jsonRequest("http://localhost/api/upgrade/request", upgradeBody));
      assert.equal(res.status, 201);
      const { request } = await res.json();
      assert.equal(request.toPlan, "PREMIUM");
      assert.equal(request.paymentMethod, "manual");
      assert.match(request.paymentRef, /^IBP-[A-Z0-9]{8}$/);
      assert.equal(request.amount, 5000);
      assert.equal(state.audits.length, 1);
    });
  });

  describe("GET /api/upgrade/request", () => {
    it("devolve null sem pedido pendente", async () => {
      const res = await getUpgradeRequest();
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { request: null });
    });

    it("devolve o pedido pendente sem expor o comprovativo", async () => {
      state.existing = {
        id: "req1",
        toPlan: "PREMIUM",
        paymentStatus: "PENDING",
        paymentRef: "IBP-REQ1",
        paymentProofUrl: "data:image/png;base64,AAAA",
        createdAt: new Date(),
      };
      const res = await getUpgradeRequest();
      const { request } = await res.json();
      assert.equal(request.id, "req1");
      assert.equal(request.hasProof, true);
      assert.equal(request.paymentProofUrl, undefined);
    });
  });

  describe("PATCH /api/upgrade/request/[id]", () => {
    const params = { params: Promise.resolve({ id: "req1" }) };
    const proofRequest = (body: unknown) =>
      jsonRequest("http://localhost/api/upgrade/request/req1", body, "PATCH");

    beforeEach(() => {
      state.byId.set("req1", pendingRequest());
    });

    it("exige pelo menos a referência ou o comprovativo", async () => {
      const res = await updateUpgradeProof(proofRequest({}), params);
      assert.equal(res.status, 400);
    });

    it("recusa pedidos de outro utilizador", async () => {
      state.byId.set("req1", { ...pendingRequest(), userId: "outro" });
      const res = await updateUpgradeProof(proofRequest({ paymentRef: "TRX1" }), params);
      assert.equal(res.status, 404);
    });

    it("recusa pedidos já analisados", async () => {
      state.byId.set("req1", { ...pendingRequest(), status: "APPROVED" });
      const res = await updateUpgradeProof(proofRequest({ paymentRef: "TRX1" }), params);
      assert.equal(res.status, 409);
    });

    it("anexa referência e comprovativo e marca pagamento pendente", async () => {
      const res = await updateUpgradeProof(
        proofRequest({ paymentRef: "TRX1", proofUrl: "data:image/png;base64,AAAA" }),
        params
      );
      assert.equal(res.status, 200);
      const { request } = await res.json();
      assert.equal(request.paymentStatus, "PENDING");
      assert.equal(request.paymentRef, "TRX1");
      assert.equal(request.hasProof, true);
      assert.equal(state.audits.length, 1);
    });
  });

  describe("GET /api/admin/upgrade-requests/[id]/proof", () => {
    const params = { params: Promise.resolve({ id: "req1" }) };

    it("exige administrador", async () => {
      const res = await getProof(new Request("http://localhost/proof"), params);
      assert.equal(res.status, 403);
    });

    it("devolve 404 sem comprovativo", async () => {
      state.user = { ...state.user, role: "admin" };
      state.byId.set("req1", pendingRequest());
      const res = await getProof(new Request("http://localhost/proof"), params);
      assert.equal(res.status, 404);
    });

    it("serve a data-URL como imagem", async () => {
      state.user = { ...state.user, role: "admin" };
      state.byId.set("req1", {
        ...pendingRequest(),
        paymentProofUrl: "data:image/png;base64,QUJD",
      });
      const res = await getProof(new Request("http://localhost/proof"), params);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("content-type"), "image/png");
      assert.equal(await res.text(), "ABC");
    });
  });

  describe("PATCH /api/admin/upgrade-requests/[id]", () => {
    const params = { params: Promise.resolve({ id: "req1" }) };
    const reviewRequest = (status: string) =>
      jsonRequest("http://localhost/api/admin/upgrade-requests/req1", { status });

    beforeEach(() => {
      state.user = { ...state.user, role: "admin" };
      state.byId.set("req1", pendingRequest());
    });

    it("exige administrador", async () => {
      state.user = { ...state.user, role: "user" };
      const res = await reviewUpgrade(reviewRequest("APPROVED"), params);
      assert.equal(res.status, 403);
    });

    it("devolve 404 para pedido inexistente", async () => {
      state.byId.clear();
      const res = await reviewUpgrade(reviewRequest("APPROVED"), params);
      assert.equal(res.status, 404);
    });

    it("aprova e actualiza o plano do dono da empresa", async () => {
      state.byId.set("req1", { ...pendingRequest(), companyId: "c1" });
      state.owner = { userId: "owner1" };
      const res = await reviewUpgrade(reviewRequest("APPROVED"), params);
      assert.equal(res.status, 200);
      assert.equal((await res.json()).emailSent, true);
      assert.deepEqual(state.planUpdates, [{ id: "owner1", plan: "PREMIUM" }]);
      assert.equal(state.byId.get("req1").status, "APPROVED");
      assert.equal(state.byId.get("req1").paymentStatus, "PAID");
      assert.equal(state.byId.get("req1").paymentMethod, "manual");
      assert.equal(state.emails[0][1], "aprovado");
    });

    it("rejeita e envia o e-mail de rejeição", async () => {
      const res = await reviewUpgrade(reviewRequest("REJECTED"), params);
      assert.equal(res.status, 200);
      assert.equal(state.byId.get("req1").status, "REJECTED");
      assert.equal(state.emails[0][1], "rejeitado");
      assert.deepEqual(state.planUpdates, []);
    });
  });

  describe("checkout Stripe", () => {
    it("GET indica indisponível sem configuração", async () => {
      state.checkoutEnabled = false;
      const res = await checkout.GET();
      assert.deepEqual(await res.json(), { enabled: false });
    });

    it("devolve 503 quando o Stripe não está configurado", async () => {
      state.checkoutEnabled = false;
      const res = await checkout.POST(jsonRequest("http://localhost/api/upgrade/checkout", upgradeBody));
      assert.equal(res.status, 503);
      assert.equal((await res.json()).code, "STRIPE_NOT_CONFIGURED");
    });

    it("cria sessão e pedido com pagamento pendente", async () => {
      const res = await checkout.POST(jsonRequest("http://localhost/api/upgrade/checkout", upgradeBody));
      assert.equal(res.status, 200);
      assert.equal((await res.json()).url, "https://checkout.stripe.com/c/pay/cs_test_1");
      assert.equal(state.checkoutArgs[0].mode, "subscription");
      const ref = state.checkoutArgs[0].client_reference_id;
      assert.ok(ref);
      assert.equal(state.checkoutArgs[0].metadata.upgradeRequestId, ref);
      const created = [...state.byId.values()][0] as any;
      assert.equal(created.id, ref);
      assert.equal(created.paymentStatus, "PENDING");
      assert.equal(created.paymentMethod, "stripe");
      assert.equal(created.amount, 5000);
      assert.equal(created.stripeSessionId, "cs_test_1");
    });
  });

  describe("webhook Stripe", () => {
    const webhookRequest = (signature: string) =>
      new Request("http://localhost/api/upgrade/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: "{}",
      });

    beforeEach(() => {
      state.byId.set("req1", pendingRequest());
      state.webhookEvent = {
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: "req1",
            payment_status: "paid",
            subscription: "sub_1",
          },
        },
      };
    });

    it("rejeita pedido sem assinatura", async () => {
      const res = await stripeWebhook(new Request("http://localhost/api/upgrade/webhook", { method: "POST" }));
      assert.equal(res.status, 400);
    });

    it("rejeita assinatura inválida", async () => {
      const res = await stripeWebhook(webhookRequest("invalid"));
      assert.equal(res.status, 400);
    });

    it("activa o plano e marca o pedido como pago", async () => {
      const res = await stripeWebhook(webhookRequest("valid"));
      assert.equal(res.status, 200);
      assert.deepEqual(state.planUpdates, [{ id: "u1", plan: "PREMIUM" }]);
      assert.equal(state.byId.get("req1").status, "APPROVED");
      assert.equal(state.byId.get("req1").paymentStatus, "PAID");
      assert.equal(state.byId.get("req1").paymentMethod, "stripe");
      assert.equal(state.byId.get("req1").stripeSubscriptionId, "sub_1");
      assert.equal(state.emails[0][1], "aprovado");
    });

    it("ignora webhook duplicado (idempotência)", async () => {
      state.byId.set("req1", { ...pendingRequest(), status: "APPROVED", paymentStatus: "PAID" });
      const res = await stripeWebhook(webhookRequest("valid"));
      assert.equal(res.status, 200);
      assert.deepEqual(state.planUpdates, []);
    });
  });
});
