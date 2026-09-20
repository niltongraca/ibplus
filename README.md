# IBPlus+

Plataforma SaaS de gestão empresarial — Finance, CRM, Store, RH, Marketing, IA e mais — adaptada a empreendedores, empresas, ONG, associações, educação e cooperativas em Angola.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS 4**
- **Prisma 7 + Neon** (PostgreSQL serverless)
- **Zod** (validação de todas as rotas `/api/*`)
- **jose** (JWT HS256 — única lib de tokens; middleware edge e APIs Node partilham a mesma chave)
- Validação de testes com **Node test runner** (`node:test`) + `tsx`

## Começar

```bash
npm install
npx prisma generate        # gera o client Prisma a partir do schema
npm run dev                # http://localhost:3000
```

### Variáveis de ambiente (`.env`)

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | URL do Postgres (Neon) |
| `DIRECT_URL` | ✅ | Ligação directa (pooler/sessão) |
| `JWT_SECRET` | ✅ | Segredo HS256. Gerar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ENCRYPTION_KEY` | ✅ | Chave de cifragem (dados sensíveis) |
| `SEED_ADMIN_PASSWORD` | — | Password do admin criado pelo seed |
| `SMTP_HOST/USER/PASS/FROM/PORT/SECURE` | — | Email transaccional (nodemailer) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | — | **Rate limit persistente** (Vercel KV / Upstash). Sem estas variáveis o rate limit degrada para memória (dev/local). Alternativa: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` |
| `CRON_SECRET` | — | Protege endpoints `cron` (server-to-server) |

### Base de dados

```bash
npx prisma db push          # aplica o schema a um ambiente novo
npx prisma db seed          # admin + dados de demonstração (tsx prisma/seed.ts)
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build de produção — **corre ESLint e falha com erros de lint** |
| `npm start` | Serve o build |
| `npm run lint` / `lint:fix` | ESLint CLI em todo o projecto (ignora `.next/`) |
| `npm test` / `test:watch` | Testes unitários (`node:test` + `tsx`, sem dependências extra) |

## Arquitectura relevante

- **Validação** — todas as rotas JSON passam por `parseBody(request, schema)` (`src/lib/validations/helpers.ts`) com schemas Zod por domínio em `src/lib/validations/*`. Contrato: `{ error: NextResponse } | { data }` (400 PT).
- **Segurança de API** — `src/middleware.ts` faz o gate fail-closed de `/api/*` (JWT obrigatório fora da allowlist pública) e **CSRF double-submit**: cookie `ibplus_csrf` + header `x-csrf-token` exigido em mutações. O client injeta o header automaticamente via patch global de `window.fetch` (`src/lib/csrfClient.ts`) — código novo não precisa de se lembrar do header.
- **Rate limit** — `checkRateLimit(key, tier)` (`src/lib/rateLimit.ts`) é async e usa **Upstash/Vercel KV** quando configurado (janela INCR+EXPIRE), com fallback gracioso para memória. Tiers: `strict` (5/60s), `medium` (10/60s), `relaxed` (30/60s).
- **RBAC** — matriz cargo→feature em `src/config/permissions.ts`, enforced no middleware edge + `requireWrite/requireDelete` no servidor.
- **Numerário** — `Decimal(18,2)` em todo o dinheiro, serialização centralizada (`src/lib/money.ts`), numeração FAT/ORC com `pg_advisory_xact_lock`.

## Testes

```bash
npm test
```

Cobertura actual: schemas de validação (finance/catalog/company/auth helpers), utilitários puros (`money`, `utils`), CSRF (`evaluateCsrf`) e rate limit (memória + KV persistente com fetch mockado).

## Documentação

- **Auditoria técnica** (itens por prioridade e estado): [`docs/auditoria-2026-09.md`](docs/auditoria-2026-09.md)

---

Licença: proprietária — © IBPlus+. Não redistribuir.