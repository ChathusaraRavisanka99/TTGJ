-- Confirming an auction winner now creates a real Order (same pattern as
-- ensureOrderForQuote/ensureOrderForSourcing) instead of the old
-- Cart/CartItem path, with a 24-hour payment window that auto-releases
-- the item if the winner doesn't pay in time.
ALTER TYPE "AuctionStatus" ADD VALUE 'EXPIRED';

ALTER TABLE "Auction" ADD COLUMN "wonAt" TIMESTAMP(3);

ALTER TABLE "Order" ADD COLUMN "auctionId" TEXT;
CREATE UNIQUE INDEX "Order_auctionId_key" ON "Order"("auctionId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
