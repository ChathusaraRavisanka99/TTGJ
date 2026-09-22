-- DropIndex
DROP INDEX "Gemstone_market_idx";

-- DropIndex
DROP INDEX "JewelryPiece_market_idx";

-- CreateIndex
CREATE INDEX "Gemstone_market_isPublished_idx" ON "Gemstone"("market", "isPublished");

-- CreateIndex
CREATE INDEX "JewelryPiece_market_isPublished_idx" ON "JewelryPiece"("market", "isPublished");

-- CreateIndex
CREATE INDEX "Order_market_idx" ON "Order"("market");

-- CreateIndex
CREATE INDEX "Order_status_paidAt_idx" ON "Order"("status", "paidAt");
