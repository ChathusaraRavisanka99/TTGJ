-- CreateIndex
CREATE INDEX "ChatMessage_threadId_createdAt_idx" ON "ChatMessage"("threadId", "createdAt");
