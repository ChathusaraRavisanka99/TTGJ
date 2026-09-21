-- AlterTable
ALTER TABLE "Gemstone" ADD COLUMN "market" TEXT NOT NULL DEFAULT 'intl';

-- AlterTable
ALTER TABLE "JewelryPiece" ADD COLUMN "market" TEXT NOT NULL DEFAULT 'intl';

-- CreateIndex
CREATE INDEX "Gemstone_market_idx" ON "Gemstone"("market");

-- CreateIndex
CREATE INDEX "JewelryPiece_market_idx" ON "JewelryPiece"("market");
