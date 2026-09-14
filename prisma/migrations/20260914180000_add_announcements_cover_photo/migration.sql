-- AlterTable: User.coverPhoto
ALTER TABLE "User" ADD COLUMN "coverPhoto" TEXT;

-- AlterTable: Notification.requiresUpdate
ALTER TABLE "Notification" ADD COLUMN "requiresUpdate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "requiresUpdate" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);