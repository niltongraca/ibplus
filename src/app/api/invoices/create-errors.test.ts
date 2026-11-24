import { describe, it, before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

// Regressão: um erro de BD/catálogo não pode ser devolvido ao cliente como se
// fosse um erro de validação (400), nem expor a mensagem interna.
const state: any = {};

function resetState() {
  state.user = { id: "u1", companyId: "c1", email: "ana@exemplo.com", name: "Ana", role: "user" };
  state.failWith = null as string | null;
  state.lastInvoiceData = null as any;
  state.lastQuoteData = null as any;
}

resetState();

const txMock: any = {
  invoice: { create: async ({ data }: any) => { state.lastInvoiceData = data; return { id: "inv1", number: "FT-1", ...data, items: [] }; } },
  quote: { create: async ({ data }: any) => { state.lastQuoteData = data; return { id: "qt1", number: "OR-1", ...data, items: [] }; } },
};

const prismaMock: any = {
  $transaction: async (fn: (tx: any) => Promise<any>) => {
    if (state.failWith) throw new Error(state.failWith);
    return fn(txMock);
  },
};

mock.module("@/lib/prisma", { namedExports: { prisma: prismaMock } });
mock.module("@/lib/auth", { namedExports: { getAuthUser: async () => state.user } });
mock.module("@/lib/permissions", {
  namedExports: {
    requireFeature: async () => null,
    requireWrite: async () => null,
  },
});
mock.module("@/lib/planLimits", {
  namedExports: {
    checkPlanLimit: async () => null,
    getCompanyPlan: async () => "FREE",
    getPlanLimit: () => -1,
  },
});
mock.module("@/lib/catalog", {
  namedExports: {
    findOrCreateCustomer: async () => {},
    ensureItemsInCatalog: async () => {},
  },
});
mock.module("@/lib/sequence", {
  namedExports: {
    nextInvoiceNumber: async () => "FT-1",
    nextQuoteNumber: async () => "OR-1",
  },
});
mock.module("@/lib/finance", {
  namedExports: { recordInvoicePayment: async () => {} },
});

let createInvoice: typeof import("@/app/api/invoices/route").POST;
let createQuote: typeof import("@/app/api/quotes/route").POST;
const originalConsoleError = console.error;

before(async () => {
  // Os testes de erro esperam logs; não poluir a saída do runner.
  console.error = () => {};
  ({ POST: createInvoice } = await import("@/app/api/invoices/route"));
  ({ POST: createQuote } = await import("@/app/api/quotes/route"));
});

after(() => {
  console.error = originalConsoleError;
});

function request(body: unknown): Request {
  return new Request("http://localhost/api/doc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  customer: "Cliente A",
  customerEmail: "cliente@exemplo.com",
  items: [{ description: "Consultoria", quantity: 2, unitPrice: 100 }],
};

describe("criação de documentos — tratamento de erros", () => {
  beforeEach(() => resetState());

  it("devolve 500 sem expor o erro interno quando a BD falha ao criar fatura", async () => {
    state.failWith = "ERRO_INTERNO_BD_NAO_EXPOR";
    const res = await createInvoice(request(validBody));
    const body = await res.json();

    assert.equal(res.status, 500);
    assert.equal(body.error, "Não foi possível criar a fatura. Tente novamente.");
    assert.equal(JSON.stringify(body).includes("ERRO_INTERNO_BD_NAO_EXPOR"), false);
  });

  it("devolve 500 sem expor o erro interno quando a BD falha ao criar orçamento", async () => {
    state.failWith = "ERRO_INTERNO_BD_NAO_EXPOR";
    const res = await createQuote(request(validBody));
    const body = await res.json();

    assert.equal(res.status, 500);
    assert.equal(body.error, "Não foi possível criar o orçamento. Tente novamente.");
    assert.equal(JSON.stringify(body).includes("ERRO_INTERNO_BD_NAO_EXPOR"), false);
  });

  it("continua a devolver 400 com mensagem útil para dados inválidos", async () => {
    const invalid = { items: [] };

    const invoiceRes = await createInvoice(request(invalid));
    assert.equal(invoiceRes.status, 400);
    assert.match((await invoiceRes.json()).error, /pelo menos um item/);

    const quoteRes = await createQuote(request(invalid));
    assert.equal(quoteRes.status, 400);
    assert.match((await quoteRes.json()).error, /pelo menos um item/);
  });

  it("cria o documento com sucesso quando não há erro de BD", async () => {
    const res = await createInvoice(request(validBody));
    assert.equal(res.status, 201);
    assert.equal((await res.json()).invoice.number, "FT-1");
  });

  // `kind` serve apenas para decidir se o item vai para Produto ou Serviço no
  // catálogo. O Prisma não tem esse campo em InvoiceItem/QuoteItem e rejeita a
  // escrita se ele chegar ao `create`.
  const bodyWithKind = {
    ...validBody,
    items: [{ description: "Consultoria", quantity: 2, unitPrice: 100, kind: "service" }],
  };

  it("não envia o campo kind ao Prisma ao criar fatura", async () => {
    const res = await createInvoice(request(bodyWithKind));
    assert.equal(res.status, 201);
    const item = state.lastInvoiceData.items.create[0];
    assert.equal("kind" in item, false);
  });

  it("não envia o campo kind ao Prisma ao criar orçamento", async () => {
    const res = await createQuote(request(bodyWithKind));
    assert.equal(res.status, 201);
    const item = state.lastQuoteData.items.create[0];
    assert.equal("kind" in item, false);
  });
});
