-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN "generalUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChatThread_generalUserId_key" ON "ChatThread"("generalUserId");

-- CreateIndex
CREATE INDEX "ChatThread_generalUserId_idx" ON "ChatThread"("generalUserId");

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_generalUserId_fkey" FOREIGN KEY ("generalUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
