-- Terms & Conditions agreement audit trail, plus a customer-started
-- refund/return flow on an order (conversation happens in the order's
-- existing chat thread; this table tracks only the request itself).
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

CREATE TYPE "RefundReason" AS ENUM ('DAMAGED', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'WRONG_ITEM', 'OTHER');
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'REFUNDED', 'DENIED');
CREATE TYPE "RefundResolution" AS ENUM ('FULL', 'MINUS_SHIPPING', 'PARTIAL');

CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" "RefundReason" NOT NULL,
    "reasonNotes" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "resolution" "RefundResolution",
    "refundAmount" DOUBLE PRECISION,
    "restocked" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefundRequest_orderId_key" ON "RefundRequest"("orderId");
CREATE INDEX "RefundRequest_userId_idx" ON "RefundRequest"("userId");
CREATE INDEX "RefundRequest_status_idx" ON "RefundRequest"("status");

ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
