# Auditoria de dependências — novembro 2026

Data: 2026-11-23  
Comando base: `npm audit --omit=dev --audit-level=low`

## Resultado

| Severidade | Inicial | Intermédio | Final |
|---|---:|---:|---:|
| Critical | 1 | 0 | 0 |
| High | 16 | 9 | 7 |
| Moderate | 5 | 1 | 0 |
| **Total** | **22** | **10** | **7** |

Os 7 restantes são avisos transitivos sem correção que não seja uma regressão de versão (ver «Pendente»).

## Por que motivo `npm audit fix` não aplicou nada

O plano do `npm audit fix` (sem `--force`) termina com `exit 1` porque inclui atualizações que quebram compatibilidade — por exemplo `zod` 3 → 4.6.7 e `deepmerge-ts` 7 → 8.0.2. Sem `--force`, o npm aborta o plano inteiro, incluindo as correções seguras.

## Correções aplicadas

Executado `npm update --no-audit --no-fund`, que aplica tudo o que cabe nas faixas semânticas atuais. Destaque:

- `next` 15.5.19 → **15.5.29** (elimina a vulnerabilidade critical).
- `prisma` 7.8.0 → **7.10.1**; `@vercel/blob` 2.8.0 → **2.9.0**; `vercel` 54.18.7 → **54.21.1**.
- `sharp` 0.34.5 → **0.35.5**; `postcss` 8.5.16 → **8.5.33** (topo); `undici` → **6.29.1 / 7.30.2**.
- `fast-uri` 3.1.3 → **3.1.9**; `nanoid` 3.3.15 → **3.3.20**; `mysql2` 3.15.3 → **3.24.4**.
- `dompurify` 3.4.11 → **3.5.0**; `source-map-js` 1.2.1 → **1.2.4**; `valibot` 1.2.0 → **1.4.2**.

Também se corrigiu o último aviso de lint: `InvoiceTemplate` passou a usar `SmartImage`, que já trata logos em data-URL legados e URLs do Vercel Blob.

Migrações major validadas em branches separadas:

| Migração | Ajustes necessários | Resultado |
|---|---|---|
| `zod` 3.25.76 → **4.6.7** | `.errors` → `.issues` em 6 rotas de `auth`/`students`; `z.record` com chave explícita em `company.ts` | 0 avisos de `zod` direto |
| `nodemailer` 9.0.3 → **10.6.1** | nenhum | 0 avisos de `nodemailer` |
| `next` / `eslint-config-next` 15.5.29 → **16.4.6** | config ESLint flat (sem `FlatCompat`); `src/middleware.ts` → `src/proxy.ts` com exportação `proxy`; `tsconfig.json` com `jsx: react-jsx` e tipos `.next/dev` | 0 avisos de `next` e `postcss` |

Notas sobre o Next 16:

- O `eslint-plugin-react-hooks` 7 introduziu as regras `set-state-in-effect` e `immutability`, que sinalizam 14 pontos em componentes existentes. Estão desativadas no `eslint.config.mjs` com comentário explicativo; a refatoração de estado fica para trabalho próprio, sem bloquear a migração.
- A convenção `middleware` está deprecada: o ficheiro passou a `src/proxy.ts`, mantendo o mesmo `config.matcher` e a lógica de CSP/CSRF/RBAC.

## Pendente (7 vulnerabilidades, todas exigem downgrade)

| Pacote | Severidade | Via | Correção proposta pelo npm | Motivo para não aplicar |
|---|---|---|---|---|
| `prisma`, `@prisma/config`, `effect` | high | `effect` → `@prisma/config` → `prisma` | downgrade para `prisma` 6.12.0 | regressão face ao 7.10.1 atual |
| `@vercel/blob`, `@vercel/oidc`, `@vercel/cli-config`, `zod` | high | `zod` → `@vercel/cli-config` → `@vercel/oidc` → `@vercel/blob` | downgrade para `@vercel/blob` 2.4.0 | regressão face ao 2.9.0 atual |

O `zod` desta lista é uma cópia aninhada em `@vercel/cli-config` (4.1.11); a dependência direta do projeto é 4.6.7 e não tem avisos.

`prisma` permanece em `dependencies` de propósito: no Prisma 7, `@prisma/client` depende de `prisma`, pelo que movê-lo para `devDependencies` não melhora a auditoria de produção e ainda pode quebrar builds que não instalam dependências de desenvolvimento.

## Validação final

Após cada migração, e de novo ao final:

- `npm test` — 163 testes em 45 suítes, todos a passar.
- `npx tsc --noEmit` — sem erros.
- `npm run lint` — sem erros e sem avisos.
- `npm run build` — 149/149 páginas geradas, sem avisos de convenções deprecadas.

## Recomendações seguintes

1. Refatorar os 14 pontos assinalados pelas novas regras de hooks do React e voltar a ativar `set-state-in-effect` e `immutability`.
2. Acompanhar as correções upstream de `prisma`/`effect` e `@vercel/blob`; aplicar assim que existir uma versão sem regressão.
