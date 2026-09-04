-- CreateTable
CREATE TABLE "ChatThread" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT,
    "sourcingRequestId" TEXT,
    "lastReadByCustomerAt" TIMESTAMP(3),
    "lastReadByAdminAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "UserRole" NOT NULL,
    "body" TEXT,
    "taggedGemstoneId" TEXT,
    "taggedJewelryId" TEXT,
    "taggedCartSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatThread_quoteRequestId_key" ON "ChatThread"("quoteRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatThread_sourcingRequestId_key" ON "ChatThread"("sourcingRequestId");

-- CreateIndex
CREATE INDEX "ChatThread_quoteRequestId_idx" ON "ChatThread"("quoteRequestId");

-- CreateIndex
CREATE INDEX "ChatThread_sourcingRequestId_idx" ON "ChatThread"("sourcingRequestId");

-- CreateIndex
CREATE INDEX "ChatMessage_threadId_idx" ON "ChatMessage"("threadId");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_sourcingRequestId_fkey" FOREIGN KEY ("sourcingRequestId") REFERENCES "SourcingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_taggedGemstoneId_fkey" FOREIGN KEY ("taggedGemstoneId") REFERENCES "Gemstone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_taggedJewelryId_fkey" FOREIGN KEY ("taggedJewelryId") REFERENCES "JewelryPiece"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- RLS: matches every other table in this schema — see the migration
-- comment on "20260904143304_enable_row_level_security" for why. Zero
-- policies is intentional here too.
ALTER TABLE "ChatThread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
