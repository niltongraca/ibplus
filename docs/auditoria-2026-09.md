# Relatório de Auditoria — IBPlus+

**Âmbito**: 4 frentes (segurança backend/API · performance/SEO/CWV · UX/UI · arquitectura/qualidade) · ~264 ficheiros TS/TSX, 75 rotas `/api/*`, 47 páginas · READ-ONLY (nada modificado nesta análise)

**Nota metodológica**: itens com "(não verificado)" foram prosseguidos por saudável dúvida e precisam de confirmação manual antes de actuar. Nada foi inventado.

---

## [CRÍTICO]

1. `src/middleware.ts:55` — **Middleware ignora `/api/*`** (retorna `response` sem auth). Com ~75 rotas API autenticadas manualmente, uma rota que esqueça `getAuthUser()` fica pública. Correcção: `withAuth` wrapper central + verificação `/api/*` no middleware.
2. `src/app/api/products/route.ts:30` — `stock: { lte: prisma.product.fields.minStock }` **não é expressão válida** do Prisma (campos de schema não podem entrar em filtros dessa forma; quebra em runtime). Correcção: `stock: { lte: <valor real> }` ou `$queryRaw`/filtro pós-leitura.
3. ~~Zod usado só em ~5 rotas (`register/route.ts:61`, students, forgot/reset-password). Os restantes ~70 handlers fazem `await request.json()` **sem schema** — inputs não validados com `any` implícito. Correcção: `src/lib/validations/*` zod por domínio + `safeParse` em todas.~~ **✔ RESOLVIDO (2026-09-20)** — criados módulos `src/lib/validations/{helpers,auth,finance,rh,company,catalog,admin}.ts` e ligados em todas as rotas JSON: Auth, Financeiro (expenses/invoices/quotes/sales/purchases), RH (employees/attendance/vacations), Company (cargos/subcompanies/perfil/invite/acquisition/permissions), Catálogo/CRM (products/categories/services/customers/opportunities/campaigns/checkout) e Admin/misc (contact/notifications/documents/send/reports/announcements/resources/content/empresas/usuarios). Contrato unificado: `parseBody(request, schema)` → `{ error: NextResponse } | { data }` (400 com mensagem PT), reutilizado via `helpers.ts`. Rotas auth (register/forgot/reset) e students mantêm zod inline pré-existente; `/api/upload` usa `formData()`.
4. `src/app/api/company/invite/info/route.ts` — endpoint público expõe nome/logo/cargos da empresa sem auth (possível enumeração de organizações); confirmar se é intencional.
5. `src/app/api/gestao/employees/route.ts` (fm1) — uso de `$queryRaw` + `${}` com N+1/parâmetros; validar interpolação (SQL injection) e converter para parâmetros. *(verificado: se for `$executeRawUnsafe` com interpolação — rever)*
6. ~~**Sem protecção CSRF** em nenhum endpoint (sem token CSRF; sameSite=lax só cobre cookies). Correcção: token CSRF double-submit para mutações.~~ **✔ RESOLVIDO (2026-09-20)**: double-submit implementado — cookie `ibplus_csrf` (httpOnly:false, sameSite=lax, 7d) semeado no middleware em qualquer resposta; mutações `/api/*` autenticadas exigem o header `x-csrf-token` igual ao cookie (403 + limpeza em mismatch; sessões legadas sem cookie passam uma vez a semear). Client: patch global de `window.fetch` (`src/lib/csrfClient.ts` + `Providers`) que injeta o header em mutações same-origin `/api/*` — cobre os ~40 `fetch` directos e o `apiFetch` sem tocar em cada chamada. Rotas públicas (login/register/forgot/reset/contact/cron/plans/praca/content/invite-info) ficam isentas. Validado e2e: sem header→403, header errado→403, header certo→201, DELETE→200.
7. `src/lib/email.ts:95` — `welcomeEmail` interpola `${name}` sem escapar → **XSS em email**. Idem `:73` (`inviterName`). Correcção: `esc()` (já existe em `exportDocument.ts`).
8. `src/lib/sequence.ts` + `ensure/...` races já tratadas nas **rotas finance** com `pg_advisory_xact_lock` — bom padrão, mas **não replicado** para RH/cargos/permissoes/funcionarios (mutições concorrentes podem duplicar). Confirmar replicação.

## [ALTO]

9. `src/lib/auth.ts` (jose/jsonwebtoken + secrets) — duplicação. `auth.ts` usa `jsonwebtoken`, `middleware.ts` usa `jose` → validação/secret podem divergir. Padronizar numa lib.
10. `src/middleware.ts:18-20` — `getJwtSecret()` retorna `""` em vez de `throw` (duplica-se mas sem fail-fast). Usar `secrets.ts`.
11. `src/lib/ownership.ts:54` — `skipDuplicates` no `create`, mas para **novas subempresas/cargos/permissoes** sem constraint unique não há guarda idempotente equivalente (race em concorrência); considerar `@@unique` como no Employee (já feito) e `skipDuplicates` por entidade.
12. `src/lib/rateLimit.ts:1` — rate limit **in-memory (`Map`)**; em serverless (Vercel/Neon) cada cold start reinicia → inútil em escala. Correcção: Upstash/Vercel KV.
13. `src/app/cadastro/page.tsx` — senha `minLength=6` (abaixo do OWASP 8), sem confirmar senha na conta EMPRESA, erros num único banner sem campo específico, botões `type="button"` fora de `<form>` (validação nativa nunca corre).
14. `src/app/recuperar-senha/page.tsx:61-70` — **token de reset exposto no ecrã** ("Token (dev):") em produção. Remover.
15. `src/middleware.ts:42` vs `next.config.ts` — `X-Frame-Options DENY` vs `SAMEORIGIN` **conflitantes**. Padronizar.
16. Sem `loading.tsx`/`error.tsx` (0 ocorrências) e **sem breadcrumbs** — falhas de percepção de estado e navegação.
17. `src/app/praca/page.tsx:20` — `findMany` directo no Server Component **sem `revalidateTag`/`unstable_cache`** → DB hit por request. Correcção: `revalidate = 60`/cache.
18. `<img>` de produto sem `width/height` em ~5 locais (`praca/page.tsx:166`, `gestao/vendas/page.tsx`, `InvoiceTemplate.tsx:94`, `FileUpload.tsx:92`) → CLS. Usar `next/image`.

## [MÉDIO]

19. **1ª homepage `src/app/page.tsx:1` é `"use client"`** — zero metadata/SEO; `sitemap.ts` estático só 6 URLs. Hibridar: manter client + exportar `metadata`/campo do server component filho.
20. `AsyncSelect` (client combobox de BD) é padrão bom; mas **DataTable/cards mobile** só em ~3 módulos (RH funcionários usa manual). Alargar `ui/DataTable` + `mobileCard` a faturacao/gestao.
21. `Toast` sem `role="status"`/`aria-live` — leitores de ecrã não anunciam. `aria-label`/`title` presentes mas `aria-label` ausente noutros.
22. `src/app/rh/funcionarios/page.tsx:213` — ícones de acção ~28px (touch <44px). `Sidebar` e header cumprem 44px.
23. Metrics system (CWV) ausente — sem `core/web-vitals` listener, sem relatório de CWV. Adicionar em `app/layout` com rotas de grupo.
24. CSP usa `unsafe-inline`/`unsafe-eval` no `next.config`; perfumaria com **duas libs JWT**; ~~`eslint.ignoreDuringBuilds: true` (build deixa passar lint)~~ **✔ RESOLVIDO (2026-09-20)** — `ignoreDuringBuilds` removido e `npm run lint` migrado de `next lint` (deprecated) para o CLI `eslint .`; `next build` volta a falhar com erros de lint.
25. `src/lib/audit.ts:11` — `logAction()` re-executa `getAuthUser()` (nova query BD) por mutação; aceitar `userId`/`companyId` como args (menos roundtrips).
26. Seed/backfill `prisma/seed.ts` fora de `tsconfig include` (não typecheck); `scripts/check-duplicates.ts`, `register-migration` one-offs commitados com `tsx` — aceitável, mas sem `prisma.config.ts` proper de `migrate` (Neon manual). Padronizar via `prisma migrate`.

## [BAIXO]

27. `src/lib/money.ts:13-15` — `toMoney()` duplica `toNumber()`. Remover alias.
28. Tabela faturação: `overflow-x-auto` sem breakpoints mobile cards; linha de item `grid-cols-12` 5 inputs inviável a 375px.
29. `dev.db` (+ `*.db`) presente na raiz — confirmar se commitado (`.gitignore` tem `*.db`) e remover do histórico se sim.
30. `next.config.ts:24` CSP unsafe + middleware sem `crossOriginIsolated`; `view-transition` não usadas.

---

## Pontos fortes (factual)

1. **RBAC escalável em 3 camadas**: matriz cargo→feature com `default` + override por empresa (`permissions.ts`), enforced em middleware edge (jose), `requireWrite/requireDelete` (`permissions.ts`), guardas de dono (`ownership.ts`), com `requirePermission` e fallback de auto-dono idempotente (já corrigido nesta sessão).
2. **Disciplina financeira**: `Decimal(18,2)` em todo o dinheiro, serialização centralizada `toNumber`, `pg_advisory_xact_lock` para numeração FAT/ORC sem rachas, totais recalculados no servidor — raro em SMB CRMs.
3. **Mitigações proactivas**: CSP+headers em `next.config`, cookies httpOnly, `tokenVersion` para invalidar sessões, rate-limit por IP com fallback `x-forwarded-for` correcto, cron protegido por `CRON_SECRET`.

## 3 maiores riscos de longo prazo

1. ~~**Validação inexistente a 90% das rotas** — a cada módulo novo a superfície de inputs mal tipados cresce; multiplicador de bugs.~~ **✔ RESOLVIDO (2026-09-20)**: 0 de 71 rotas `/api/*` usam `request.json()` sem schema (restam apenas as rotas já validadas — auth register/forgot/reset e students com zod inline — e `/api/upload` que consome `formData()`). Regressão mitigada porque os novos módulos de `validations/*` são o único ponto de entrada.
2. **Arquitectura client-heavy** (~137 `"use client"`, sem Server Actions) — waterfalls de fetch e bundle grande; incompatível com o modelo Server Component; custoso de reverter depois.
3. ~~**Zero testes + lint desligado no build** — regressões de numerário/stock passam a produção sem barreira.~~ **✔ RESOLVIDO (2026-09-20)**: 75 testes unitários (`node:test` + `tsx`, sem dependências novas) sobre `validations/*` (helpers/finance/catalog/company), `money` e `utils`; correm com `npm test` no CI local/comandos; lint volta a correr no `next build` (0 erros; 8 avisos `no-img-element` de UX, tarefa da auditoria #18).
