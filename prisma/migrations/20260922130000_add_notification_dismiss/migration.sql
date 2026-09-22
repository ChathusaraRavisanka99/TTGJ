-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "dismissedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Notification_userId_dismissedAt_idx" ON "Notification"("userId", "dismissedAt");
