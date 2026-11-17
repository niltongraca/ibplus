# Upgrade de planos — fluxo completo

Este documento descreve como os planos, limites e upgrades funcionam no IBPlus+,
incluindo o pedido manual, a aprovação administrativa, a cobrança com Stripe e a
actualização da sessão.

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

## 3. Pedido manual (sem pagamento)

Rota: `POST /api/upgrade/request`

1. Rate limit `strict` por IP.
2. Exige autenticação.
3. Um membro de empresa que não seja dono recebe `403`.
4. O plano de destino tem de ser um upgrade do plano atual (`isUpgrade`).
5. Não pode existir outro pedido `PENDING` para a mesma empresa (ou para o
   utilizador, em contas sem empresa) — devolve `409` com
   `code: "UPGRADE_REQUEST_PENDING"`.
6. Cria o `UpgradeRequest` com `status: PENDING` e regista auditoria.

A página `/upgrade` apresenta os planos e este formulário. Sem Stripe
configurado, este é o único caminho disponível, com botão «Enviar pedido» e
fallback `mailto:` para contacto.

## 4. Aprovação / rejeição administrativa

Rota: `PATCH /api/admin/upgrade-requests/[id]` (apenas `role === "admin"`)

- Só aceita pedidos `PENDING`; caso contrário devolve `409`.
- **Aprovação**: `activateUpgrade()` atualiza o `User.plan` do dono, marca o
  pedido como `APPROVED`, cria notificação interna, regista auditoria e envia o
  e-mail de aprovação.
- **Rejeição**: marca o pedido como `REJECTED`, cria notificação, auditoria e
  envia o e-mail de rejeição.

Esta via continua disponível mesmo com Stripe ativo — funciona como fallback
para acordos comerciais, testes ou quando o pagamento online falha.

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

## 7. Cobrança real com Stripe

### Configuração

Ver `.env.example`. É necessário:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PREMIUM="price_..."
STRIPE_PRICE_BUSINESS="price_..."
```

Sem estas variáveis o checkout é desativado: `GET /api/upgrade/checkout`
devolve `{ enabled: false }`, o botão «Pagar com cartão» é escondido e o fluxo
continua apenas com aprovação manual.

Os preços devem ser **recorrentes** (`mode: "subscription"`). Os IDs
`STRIPE_PRICE_*` são lidos por `stripePriceId()` em `src/lib/stripe.ts`. O
cliente Stripe é `lazy` (`getStripe()`), pelo que a app arranca sem credenciais.

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
- Só depois cria o `UpgradeRequest` com `paymentStatus: PENDING` e
  `stripeSessionId`, e regista auditoria.
- Devolve `{ url }` e o browser é redirecionado para o checkout hospedado.

A página `/upgrade` mostra avisos de sucesso/cancelamento através dos parâmetros
de query.

### Webhook

Rota: `POST /api/upgrade/webhook` (`runtime = "nodejs"`)

- Verifica a assinatura com `constructEvent()` sobre o **corpo raw** (obtido com
  `request.text()`).
- Rejeita pedidos sem assinatura ou com assinatura inválida (`400`).
- Em `checkout.session.completed` com `payment_status === "paid"`, obtém o id do
  pedido via `client_reference_id` ou `metadata.upgradeRequestId` e chama
  `activateUpgrade()` com `paymentStatus: PAID`, `stripeSubscriptionId` e
  `paidAt`.
- O e-mail e a notificação são os mesmos da aprovação administrativa.

**Idempotência**: `activateUpgrade()` usa
`update({ where: { id, status: "PENDING" } })` e o webhook verifica
`status === "PENDING" && paymentStatus !== "PAID"`. Webhooks duplicados ou
pedidos já aprovados são ignorados com `200`, para o Stripe não reenviar.

> Registar o endpoint no Stripe com o evento `checkout.session.completed` e o
> segredo de webhook correspondente.

## 8. Modelo de dados

Migration: `prisma/migrations/20261117100000_add_upgrade_payments`

`UpgradeRequest` ganhou:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `paymentStatus` | `UpgradePaymentStatus` | `NONE`, `PENDING`, `PAID`, `FAILED` |
| `stripeSessionId` | `String?` (único) | Id da sessão de checkout |
| `stripeSubscriptionId` | `String?` | Id da subscrição Stripe |
| `paidAt` | `DateTime?` | Momento do pagamento |

A aplicação é Postgres/Neon exclusiva; a antiga pasta `prisma/migrations-sqlite`
foi removida por estar órfã.

## 9. Testes e verificação

- `npm test` — 142 testes, incluindo 16 testes de integração das rotas de upgrade
  (`src/app/api/upgrade/routes.test.ts`) com mocks de módulo (`node:test`
  `mock.module`, que requer `--experimental-test-module-mocks` no script `test`).
- `npm run lint` — 0 erros; 1 warning pré-existente em `InvoiceTemplate.tsx`
  (`<img>` em vez de `next/image`).
- `npm run build` — compila e gera as páginas estáticas com sucesso.

Para correr os testes localmente, o script `test` já inclui a flag de mocks:

```bash
npm test
```
