# Auditoria de dependências — novembro 2026

Data: 2026-11-23  
Comando base: `npm audit --omit=dev --audit-level=low`

## Resultado

| Severidade | Inicial | Final |
|---|---:|---:|
| Critical | 1 | 0 |
| High | 16 | 9 |
| Moderate | 5 | 1 |
| **Total** | **22** | **10** |

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

## Pendente (10 vulnerabilidades, todas exigem mudança major)

| Pacote | Severidade | Correção proposta pelo npm | Motivo para não aplicar agora |
|---|---|---|---|
| `next` | moderate | 16.4.6 | major do framework; afeta rotas, build e middleware |
| `postcss` (aninhado no `next`) | high | via `next` 16.4.6 | dependente da migração do Next |
| `zod` | high | 4.6.7 | major; exige revisão de `src/lib/validations/*` e dos testes |
| `nodemailer` | high | 10.6.1 | major; exige revisão do envio de e-mail e tipos |
| `prisma`, `@prisma/config`, `effect` | high | downgrade para `prisma` 6.12.0 | regressão face ao 7.10.1 atual |
| `@vercel/blob`, `@vercel/oidc`, `@vercel/cli-config` | high | downgrade para `@vercel/blob` 2.4.0 | regressão face ao 2.9.0 atual |

## Validação após as alterações

- `npm test` — 163 testes em 45 suítes, todos a passar.
- `npx tsc --noEmit` — sem erros.
- `npm run lint` — sem erros e sem avisos.
- `npm run build` — 150/150 páginas geradas.

## Recomendações seguintes

1. Migrar `zod` para v4 num trabalho isolado, com revisão dos schemas e mensagens de erro em PT.
2. Avaliar `nodemailer` v10 e `next` v16 em branches separadas, com validação completa.
3. Considerar mover `prisma` de `dependencies` para `devDependencies`: hoje arrasta `@prisma/*` e `effect` para a auditoria de produção. O `prisma generate` já faz parte do script `build`, pelo que a mudança só é segura em ambientes que instalam dependências de desenvolvimento antes do build (ex.: Vercel).
