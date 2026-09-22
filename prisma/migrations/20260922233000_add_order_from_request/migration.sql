-- Order can now originate from an accepted quote/sourcing request, not just
-- checkout. quoteRequestId/sourcingRequestId are mutually exclusive with
-- each other and with a normal checkout-placed order (both null for those).
-- needsShippingDetails covers the gap between order creation and the
-- customer filling in a shipping address (quote/sourcing never collects one
-- up front the way checkout does).
ALTER TABLE "Order" ADD COLUMN "quoteRequestId" TEXT;
ALTER TABLE "Order" ADD COLUMN "sourcingRequestId" TEXT;
ALTER TABLE "Order" ADD COLUMN "needsShippingDetails" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Order_quoteRequestId_key" ON "Order"("quoteRequestId");
CREATE UNIQUE INDEX "Order_sourcingRequestId_key" ON "Order"("sourcingRequestId");

ALTER TABLE "Order" ADD CONSTRAINT "Order_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_sourcingRequestId_fkey" FOREIGN KEY ("sourcingRequestId") REFERENCES "SourcingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
