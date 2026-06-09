-- AlterTable
ALTER TABLE "users" ADD COLUMN     "expo_push_token" TEXT;

-- CreateTable
CREATE TABLE "push_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "push_campaigns_pkey" PRIMARY KEY ("id")
);
