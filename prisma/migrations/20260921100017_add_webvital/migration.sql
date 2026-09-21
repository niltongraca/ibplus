-- CreateTable
CREATE TABLE "WebVital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "delta" DOUBLE PRECISION,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebVital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebVital_name_idx" ON "WebVital"("name");

-- CreateIndex
CREATE INDEX "WebVital_createdAt_idx" ON "WebVital"("createdAt");