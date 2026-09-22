-- A ChatThread can now belong to an order (any order, not just one
-- created from an accepted quote/sourcing request), for the admin order
-- detail page's "message the customer" panel.
ALTER TABLE "ChatThread" ADD COLUMN "orderId" TEXT;
CREATE UNIQUE INDEX "ChatThread_orderId_key" ON "ChatThread"("orderId");
CREATE INDEX "ChatThread_orderId_idx" ON "ChatThread"("orderId");
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
