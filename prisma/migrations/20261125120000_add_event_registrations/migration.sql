-- Inscrições públicas em eventos (link opaco + comprovativo + aprovação manual).

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "registrationToken" TEXT;

-- Eventos já publicados também recebem um link opaco; novos eventos geram o
-- token na aplicação. md5(random()) evita depender de extensões do Postgres.
UPDATE "Event"
SET "registrationToken" = 'reg-' || md5("id" || random()::text)
WHERE "registrationToken" IS NULL;

CREATE UNIQUE INDEX "Event_registrationToken_key" ON "Event"("registrationToken");

-- AlterTable
ALTER TABLE "EventTicket" ADD COLUMN "registrationId" TEXT;

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "holderEmail" TEXT NOT NULL,
    "holderPhone" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paymentRef" TEXT NOT NULL,
    "proofUrl" TEXT NOT NULL,
    "proofMime" TEXT NOT NULL,
    "proofName" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistrationItem" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistrationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_code_key" ON "EventRegistration"("code");
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");
CREATE INDEX "EventRegistration_eventId_createdAt_idx" ON "EventRegistration"("eventId", "createdAt");
CREATE INDEX "EventRegistrationItem_registrationId_idx" ON "EventRegistrationItem"("registrationId");
CREATE INDEX "EventRegistrationItem_ticketTypeId_idx" ON "EventRegistrationItem"("ticketTypeId");
CREATE INDEX "EventTicket_registrationId_idx" ON "EventTicket"("registrationId");

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistrationItem" ADD CONSTRAINT "EventRegistrationItem_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistrationItem" ADD CONSTRAINT "EventRegistrationItem_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "EventTicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
