# IBPlus+

Plataforma SaaS de gestão empresarial — Finance, CRM, Store, RH, Marketing, IA e mais — adaptada a empreendedores, empresas, ONG, associações, educação e cooperativas em Angola.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS 4**
- **Prisma 7 + Neon** (PostgreSQL serverless)
- **Zod** (validação de todas as rotas `/api/*`)
- **jose** (JWT HS256 — única lib de tokens; middleware edge e APIs Node partilham a mesma chave)
- **Pagamentos** — cobrança manual em Kz por omissão (transferência/Multicaixa + comprovativo e aprovação administrativa); Stripe reativável por configuração
- Testes com **Node test runner** (`node:test`) + `tsx`

## Começar

```bash
npm install
npx prisma generate         # gera o client Prisma a partir do schema
npx prisma migrate deploy   # aplica as migrations versionadas
npm run dev                 # http://localhost:3000
```

### Variáveis de ambiente (`.env`)

Crie `.env` na raiz com as variáveis abaixo. O repositório ignora `.env*` (incluindo `.env.example`), pelo que o ficheiro não é versionado.

**Obrigatórias**

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | URL do Postgres (Neon), ligação *pooled* usada pela aplicação |
| `DIRECT_URL` | Ligação directa (pooler/sessão), usada pelo Prisma CLI nas migrações |
| `JWT_SECRET` | Segredo HS256. Gerar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ENCRYPTION_KEY` | Chave de cifragem aes-256-cbc (string longa e aleatória, >32 caracteres) |

**Pagamentos — cobrança manual (modo ativo)**

| Variável | Descrição |
| --- | --- |
| `PAYMENT_PROVIDER` | `none` (omissão) mantém o Stripe inativo; `stripe` reativa o checkout online |
| `NEXT_PUBLIC_PAYMENT_BANK` | Banco mostrado em `/upgrade` |
| `NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME` | Titular da conta |
| `NEXT_PUBLIC_PAYMENT_IBAN` | IBAN para transferência |
| `NEXT_PUBLIC_PAYMENT_MULTICAIXA_ENTITY` | Entidade Multicaixa |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Contacto de suporte (também usado quando faltam dados de pagamento) |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação (links de e-mail e redirect do checkout) |

Se não houver IBAN nem entidade Multicaixa configurados, a página `/upgrade` avisa e oferece contacto com o suporte. O pedido manual continua a poder ser criado. Ver [`docs/upgrade-planos.md`](docs/upgrade-planos.md).

**Stripe (opcional — exige `PAYMENT_PROVIDER="stripe"`)**

| Variável | Descrição |
| --- | --- |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe |
| `STRIPE_WEBHOOK_SECRET` | Segredo do endpoint `checkout.session.completed` |
| `STRIPE_PRICE_PREMIUM` | ID do preço recorrente PREMIUM |
| `STRIPE_PRICE_BUSINESS` | ID do preço recorrente BUSINESS |

**Operacionais e integrações (opcionais)**

| Variável | Descrição |
| --- | --- |
| `SEED_ADMIN_PASSWORD` | Password do admin criado pelo seed |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` / `SMTP_PORT` / `SMTP_SECURE` | Email transaccional (nodemailer). Sem SMTP, `sendEmail()` devolve `{ success: false, error: "SMTP não configurado" }` sem lançar |
| `BLOB_READ_WRITE_TOKEN` | Uploads no Vercel Blob. Sem token, imagens ficam como data-URL em BD |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Rate limit persistente (Vercel KV / Upstash). Alternativa: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Sem estas, degrada para memória (dev/local) |
| `CRON_SECRET` | Protege os endpoints `cron` (server-to-server) |
| `NEXT_PUBLIC_SITE_URL` | URL usada no sitemap e `robots.txt` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Código de verificação do Google Search Console |
| `NEXT_PUBLIC_BOTPRESS_SCRIPT_URL` | Webchat Botpress |

### Base de dados

```bash
npx prisma migrate deploy   # aplica as migrations versionadas (recomendado)
npx prisma db seed          # admin + dados de demonstração (tsx prisma/seed.ts)
```

`npx prisma db push` deve ser usado apenas em ambientes descartáveis; em produção, usar `migrate deploy`.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build de produção — corre ESLint e falha com erros de lint |
| `npm start` | Serve o build |
| `npm run lint` / `lint:fix` | ESLint CLI em todo o projecto (ignora `.next/`) |
| `npm test` / `test:watch` | Testes unitários (`node:test` + `tsx`, com mocks de módulos) |
| `npm run normalize:invoices` | Normaliza transações de faturas |
| `npm run backfill:blob` | Migra imagens legadas em data-URL para o Blob |

## Arquitectura relevante

- **Validação** — todas as rotas JSON passam por `parseBody(request, schema)` (`src/lib/validations/helpers.ts`) com schemas Zod por domínio em `src/lib/validations/*`. Contrato: `{ error: NextResponse } | { data }` (400 PT).
- **Segurança de API** — `src/middleware.ts` faz o gate fail-closed de `/api/*` (JWT obrigatório fora da allowlist pública) e **CSRF double-submit**: cookie `ibplus_csrf` + header `x-csrf-token` exigido em mutações. O client injeta o header automaticamente via patch global de `window.fetch` (`src/lib/csrfClient.ts`) — código novo não precisa de se lembrar do header.
- **Rate limit** — `checkRateLimit(key, tier)` (`src/lib/rateLimit.ts`) é async e usa **Upstash/Vercel KV** quando configurado (janela INCR+EXPIRE), com fallback gracioso para memória. Tiers: `strict` (5/60s), `medium` (10/60s), `relaxed` (30/60s).
- **RBAC** — matriz cargo→feature em `src/config/permissions.ts`, enforced no middleware edge + `requireWrite/requireDelete` no servidor. Rotas protegidas por tipo de organização em `src/config/rbacRoutes.ts`.
- **Planos e limites** — nomes, preços, funcionalidades e limites vivem em `src/config/plans.ts`; regras puras em `src/config/planLimits.ts` e verificação em `src/lib/planLimits.ts`. `-1` = ilimitado. O plano efetivo da empresa é o `User.plan` do dono. Limites atingidos devolvem `403` com `code: "PLAN_LIMIT_REACHED"`; `apiFetch()` emite `ibplus:plan-limit` e o `Toast` oferece atalho para `/upgrade`.
- **Pagamentos** — `src/config/payments.ts` escolhe o provider e gera a referência `IBP-XXXXXXXX`; `src/lib/upgradeActivation.ts` é partilhado pela aprovação administrativa e pelo webhook Stripe (idempotente).
- **Numerário e documentos** — `Decimal(18,2)` em todo o dinheiro, serialização centralizada (`src/lib/money.ts`), numeração FAT/ORC com `pg_advisory_xact_lock` e exportação PDF com nonce CSP por request.
- **Upload** — `POST /api/upload` aceita imagens `.png/.jpg/.jpeg/.gif/.webp` até 5MB; comprovativos de upgrade nunca são devolvidos nas listagens, apenas `hasProof`.

## Testes

```bash
npm test
```

Estado atual: **45 suítes / 163 testes**, 0 falhas. Cobrem schemas de validação, utilitários puros (`money`, `utils`, `documentDates`, `exportDocument`), CSRF, rate limit (memória + KV com fetch mockado), planos/limites, pagamentos, upload e erros de criação de faturas.

Validação de release: `npx tsc --noEmit` limpo, `npm run lint` sem erros (1 aviso pré-existente) e `npm run build` a gerar 150/150 páginas.

## Documentação

- **Auditoria técnica** (itens por prioridade e estado): [`docs/auditoria-2026-09.md`](docs/auditoria-2026-09.md)
- **Planos e upgrades** (cobrança manual, aprovação administrativa e reativação do Stripe): [`docs/upgrade-planos.md`](docs/upgrade-planos.md)

---

Licença: proprietária — © IBPlus+. Não redistribuir.
