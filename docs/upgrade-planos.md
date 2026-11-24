# Upgrade de planos — fluxo completo

Este documento descreve como os planos, limites e upgrades funcionam no IBPlus+,
incluindo o pedido manual com comprovativo, a aprovação administrativa e a
reactivação opcional da cobrança com Stripe, para além da actualização da sessão.

## 1. Fonte única de verdade

Todo o nome, preço, funcionalidade e limite vive em `src/config/plans.ts`.

| Plano | Preço | Utilizadores | Produtos/Serviços | Clientes | Faturas |
|-------|-------|--------------|-------------------|----------|---------|
| FREE | Grátis | 1 | 10 | 50 | 20 |
| PREMIUM | 5.000 Kz/mês | 5 | -1 (ilimitado) | -1 | -1 |
| BUSINESS | 15.000 Kz/mês | -1 | -1 | -1 | -1 |

Regras importantes:

- `-1` em qualquer limite significa **ilimitado**.
- O FREE **nunca** é oferecido como downgrade: só `PREMIUM` e `BUSINESS` são
  aceites como plano de destino (ver `UPGRADE_PLAN_IDS` em
  `src/lib/validations/plans.ts`).
- `products` conta simultaneamente `Product` e `Service`.
- As regras puras (limites, mensagens, `isUpgrade`) estão em
  `src/config/planLimits.ts`; `src/lib/planLimits.ts` importa o Prisma, reexporta
  essas regras e acrescenta `checkPlanLimit()` e `getCompanyPlan()`.

### Plano efetivo da empresa

Quando o utilizador pertence a uma empresa, o plano efetivo é o `User.plan` do
**dono** (localizado via `Employee.isOwner`), com fallback para o `User.plan` do
próprio utilizador. Isto evita que um membro convidado tenha um plano diferente
do da organização.

## 2. Erros de limite e CTA global

`checkPlanLimit()` devolve `403` com:

```json
{
  "error": "Atingiu o limite de 10 produtos/serviços do plano Grátis...",
  "code": "PLAN_LIMIT_REACHED",
  "resource": "products",
  "limit": 10,
  "used": 10
}
```

O `apiFetch()` (`src/lib/api.ts`) detecta `PLAN_LIMIT_REACHED` e emite o evento
global `ibplus:plan-limit` com `{ message, resource }`. O componente `Toast`
ouve esse evento e oferece um atalho para `/upgrade`. Assim, qualquer formulário
que use `apiFetch` ganha o CTA sem tratamento adicional.

A auto-criação de clientes/produtos a partir de faturas e orçamentos também
respeita os limites: quando o limite foi atingido, o registo auxiliar é
simplesmente ignorado (sem quebrar a criação do documento).

## 3. Pedido e cobrança manual (modo ativo)

O gateway está desligado por omissão (`PAYMENT_PROVIDER="none"`). O upgrade faz-se
por **transferência bancária / Multicaixa** com referência e comprovativo,
seguido de aprovação administrativa.

### 3.1 Criar o pedido — `POST /api/upgrade/request`

1. Rate limit `strict` por IP.
2. Exige autenticação.
3. Um membro de empresa que não seja dono recebe `403`.
4. O plano de destino tem de ser um upgrade do plano atual (`isUpgrade`).
5. Não pode existir outro pedido `PENDING` para a mesma empresa (ou para o
   utilizador, em contas sem empresa) — devolve `409` com
   `code: "UPGRADE_REQUEST_PENDING"` e os campos `requestId` e `paymentRef` do
   pedido existente.
6. Gera o `id` com `randomUUID()` **antes** do `create`, para que a referência de
   pagamento (`IBP-XXXXXXXX`) seja estável e derivada do id.
7. Cria o `UpgradeRequest` com `status: PENDING`, `paymentMethod: "manual"`,
   `paymentRef` e `amount` (lido de `src/config/plans.ts`), e regista auditoria.

A página `/upgrade` mostra os planos, o formulário de contacto e, depois de
criado o pedido, as **instruções de pagamento**: referência do pedido, IBAN,
titular, entidade Multicaixa e o valor mensal — cada campo com botão de copiar.
Os dados vêm de variáveis `NEXT_PUBLIC_PAYMENT_*` (ver `.env.example`); se não
estiverem configurados, a UI avisa e oferece contacto com o suporte.

### 3.2 Retomar o pedido — `GET /api/upgrade/request`

Devolve `{ request }` com o pedido `PENDING` mais recente do utilizador/empresa
(ou `null`). O comprovativo nunca é devolvido: apenas `hasProof`. A UI mostra um
banner «Pedido pendente» e retoma as instruções sem obrigar a criar outro pedido.

### 3.3 Anexar comprovativo — `PATCH /api/upgrade/request/[id]`

- Rate limit `medium`; exige autenticação e que o pedido pertença ao
  utilizador/empresa (caso contrário `404`).
- Só aceita pedidos `PENDING` (`409` se já analisado).
- Aceita `paymentRef` (≤ 60 caracteres) e/ou `proofUrl`; pelo menos um é
  obrigatório.
- O comprovativo é uma imagem enviada por `POST /api/upload` (máx. 5MB,
  `.png/.jpg/.jpeg/.gif/.webp`). Sem `BLOB_READ_WRITE_TOKEN` o upload devolve uma
  data-URL guardada em BD; com token devolve uma URL do Vercel Blob.
- Marca `paymentMethod: "manual"` e `paymentStatus: PENDING` (em análise) e
  regista auditoria. A referência de pagamento original (`IBP-…`) mantém-se; a
  `paymentRef` enviada aqui serve para o comprovativo do banco.

### 3.4 Ver o comprovativo — `GET /api/admin/upgrade-requests/[id]/proof`

Apenas administradores. Redireciona para a URL externa (Blob) ou serve a
data-URL como bytes com `Content-Type` da imagem e `Cache-Control: private,
no-store`. A listagem administrativa devolve só `hasProof`, nunca o ficheiro —
evita transferir vários MB por página.

## 4. Aprovação / rejeição administrativa

Rota: `PATCH /api/admin/upgrade-requests/[id]` (apenas `role === "admin"`)

- Só aceita pedidos `PENDING`; caso contrário devolve `409`.
- **Aprovação**: `activateUpgrade()` atualiza o `User.plan` do dono, marca o
  pedido como `APPROVED` e o pagamento como `PAID` + `paymentMethod: "manual"` +
  `paidAt`, cria notificação interna, regista auditoria e envia o e-mail de
  aprovação.
- **Rejeição**: marca o pedido como `REJECTED`, cria notificação, auditoria e
  envia o e-mail de rejeição.

A página `/admin/pedidos` mostra valor, método, referência e badge de pagamento
(`NÃO PAGO`, `EM ANÁLISE`, `PAGO`, `FALHOU`) e abre o comprovativo num modal. O
administrador pode aprovar mesmo sem comprovativo (acordos comerciais ou
pagamentos confirmados por outra via).

Esta via funciona também como fallback quando o Stripe está ativo.

## 5. E-mails

Templates em `src/lib/email.ts`:

| Função | Assunto | Link |
|--------|---------|------|
| `upgradeApprovedEmail` | `Upgrade aprovado — IBPlus+` | `/gestao/dashboard` |
| `upgradeRejectedEmail` | `Sobre o seu pedido de upgrade — IBPlus+` | `/upgrade` |

O nome do destinatário é escapado (`esc`) e o nome do plano é amigável
(`PLANS[plan].name`).

`sendEmail()` **não lança**: sem SMTP configurado devolve
`{ success: false, error: "SMTP não configurado" }`. A decisão e a ativação já
ficaram registadas na base de dados — o e-mail é informativo. A resposta da rota
inclui `emailSent` para diagnóstico.

## 6. Atualização da sessão

A aprovação altera o `User.plan` na base de dados; `getAuthUser()` lê o plano a
cada chamada (não mexe em `tokenVersion`, pelo que o utilizador não é forçado a
fazer logout).

No cliente:

- `AuthContext` regista `refresh()` nos eventos `focus` e `visibilitychange`,
  com **throttle de 30 segundos**, para apanhar decisões tomadas noutro
  dispositivo.
- A página `/upgrade` chama `refresh()` ao montar, para refletir de imediato uma
  aprovação que ocorreu enquanto a página esteve aberta.

## 7. Reactivar a cobrança com Stripe

A cobrança online está **inactiva** por omissão. `activePaymentProvider()` em
`src/config/payments.ts` mapeia `PAYMENT_PROVIDER`: só o valor `"stripe"` activa
o gateway; qualquer outro valor (ou ausência) resulta em `"none"`.

`isCheckoutEnabled()` e `isWebhookEnabled()` (`src/lib/stripe.ts`) exigem
`PAYMENT_PROVIDER="stripe"` **e** as credenciais correspondentes. Assim, ter
chaves guardadas no ambiente não reactiva acidentalmente a cobrança — o modo
manual continua a ser o caminho por omissão.

Para reactivar:

```env
PAYMENT_PROVIDER="stripe"
NEXT_PUBLIC_APP_URL="https://app.exemplo.ao"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PREMIUM="price_..."
STRIPE_PRICE_BUSINESS="price_..."
```

- `GET /api/upgrade/checkout` passa a devolver `{ enabled: true }` e a página
  `/upgrade` mostra o botão «Pagar com cartão» ao lado de «Pagar por
  transferência».
- Sem estas variáveis, o checkout devolve `{ enabled: false }` / `503` e a UI
  mantém apenas a cobrança manual.
- Os preços devem ser **recorrentes** (`mode: "subscription"`). Os IDs
  `STRIPE_PRICE_*` são lidos por `stripePriceId()` em `src/lib/stripe.ts`. O
  cliente Stripe é `lazy` (`getStripe()`), pelo que a app arranca sem
  credenciais.

### Checkout

Rota: `POST /api/upgrade/checkout`

- Aplica as mesmas validações do pedido manual (autenticação, dono da empresa,
  `isUpgrade`, pedido pendente duplicado).
- Gera um `id` com `randomUUID()` **antes** de criar o `UpgradeRequest`, para
  poder associá-lo ao `client_reference_id` e ao metadata da sessão.
- Cria a sessão Stripe com:
  - `mode: "subscription"`;
  - `client_reference_id: id`;
  - `metadata.upgradeRequestId`, `metadata.toPlan`, `metadata.userId` e
    `metadata.companyId`;
  - `subscription_data.metadata` com `upgradeRequestId` e `toPlan`;
  - `success_url: /upgrade?checkout=success&request=<id>`;
  - `cancel_url: /upgrade?checkout=cancelled`.
- Só depois cria o `UpgradeRequest` com `paymentStatus: PENDING`,
  `paymentMethod: "stripe"`, `amount` (lido de `src/config/plans.ts`) e
  `stripeSessionId`, e regista auditoria.
- Devolve `{ url }` e o browser é redirecionado para o checkout hospedado.

### Webhook

Rota: `POST /api/upgrade/webhook` (`runtime = "nodejs"`)

- Verifica a assinatura com `constructEvent()` sobre o **corpo raw** (obtido com
  `request.text()`).
- Rejeita pedidos sem assinatura ou com assinatura inválida (`400`).
- Em `checkout.session.completed` com `payment_status === "paid"`, obtém o id do
  pedido via `client_reference_id` ou `metadata.upgradeRequestId` e chama
  `activateUpgrade()` com `{ method: "stripe", stripeSubscriptionId, paidAt }`.
- A activação marca `paymentStatus: PAID`, `paymentMethod: "stripe"`,
  `stripeSubscriptionId` e `paidAt`; o e-mail e a notificação são os mesmos da
  aprovação administrativa.

**Idempotência**: `activateUpgrade()` usa
`update({ where: { id, status: "PENDING" } })` e o webhook verifica
`status === "PENDING" && paymentStatus !== "PAID"`. Webhooks duplicados ou
pedidos já aprovados são ignorados com `200`, para o Stripe não reenviar.

> Registar o endpoint no Stripe com o evento `checkout.session.completed` e o
> segredo de webhook correspondente.

## 8. Modelo de dados

Migrations:

- `prisma/migrations/20261117100000_add_upgrade_payments` — pagamento Stripe.
- `prisma/migrations/20261117120000_add_upgrade_request_manual_payment` — dados
  da cobrança manual.

`UpgradeRequest` ganhou:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `paymentStatus` | `UpgradePaymentStatus` | `NONE`, `PENDING`, `PAID`, `FAILED` |
| `stripeSessionId` | `String?` (único) | Id da sessão de checkout |
| `stripeSubscriptionId` | `String?` | Id da subscrição Stripe |
| `paidAt` | `DateTime?` | Momento do pagamento |
| `paymentMethod` | `String?` | `manual` ou `stripe` |
| `paymentRef` | `String?` | Referência do pedido (`IBP-…`) ou do comprovativo |
| `paymentProofUrl` | `String?` | URL do Blob ou data-URL da imagem |
| `amount` | `Decimal?` | Valor mensal em Kz no momento do pedido |

`paymentProofUrl` nunca sai na listagem administrativa nem na rota de pedido do
utilizador: ambas devolvem apenas `hasProof`; o ficheiro é servido por
`GET /api/admin/upgrade-requests/[id]/proof`.

A aplicação é Postgres/Neon exclusiva; a antiga pasta `prisma/migrations-sqlite`
foi removida por estar órfã.

## 9. Testes e verificação

- `npm test` — 163 testes, incluindo 25 testes de integração das rotas de upgrade
  (`src/app/api/upgrade/routes.test.ts`) com mocks de módulo (`node:test`
  `mock.module`, que requer `--experimental-test-module-mocks` no script `test`),
  5 testes do módulo de pagamentos (`src/config/payments.test.ts`), 3 testes do
  mapeamento de datas de documentos (`src/lib/documentDates.test.ts`) e 4 testes
  de regressão do tratamento de erros na criação de faturas/orçamentos
  (`src/app/api/invoices/create-errors.test.ts`).
- `npm run lint` — 0 erros e 0 avisos, incluindo as regras
  `react-hooks/set-state-in-effect` e `react-hooks/immutability` do
  `eslint-plugin-react-hooks` 7 (Next 16) — os estados derivados e os efeitos
  foram refatorados em `useList`, `ThemeContext`, `AnimatedModal`, páginas de
  eventos/RH/perfil/cadastro e gestores de empresa/RH. O antigo aviso de
  `InvoiceTemplate.tsx` (`<img>`) foi removido com `SmartImage`.
- `npm run build` — compila e gera 149 páginas estáticas com sucesso (Next 16).

Para correr os testes localmente, o script `test` já inclui a flag de mocks:

```bash
npm test
```
