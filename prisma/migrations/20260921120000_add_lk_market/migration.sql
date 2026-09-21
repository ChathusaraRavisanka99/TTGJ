-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYHERE_CARD', 'WIRE_TRANSFER', 'COD');

-- AlterTable
ALTER TABLE "Gemstone" ADD COLUMN "lkrRetailPrice" DOUBLE PRECISION,
ADD COLUMN "lkrPrice" DOUBLE PRECISION,
ADD COLUMN "isFeaturedLk" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "JewelryPiece" ADD COLUMN "lkrRetailPrice" DOUBLE PRECISION,
ADD COLUMN "lkrPrice" DOUBLE PRECISION,
ADD COLUMN "isFeaturedLk" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DiscountCode" ADD COLUMN "amountOffLkr" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PromotionItem" ADD COLUMN "market" TEXT NOT NULL DEFAULT 'intl';

-- AlterTable
ALTER TABLE "RetailCart" ADD COLUMN "market" TEXT NOT NULL DEFAULT 'intl';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "market" TEXT NOT NULL DEFAULT 'intl',
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYHERE_CARD';

-- DropIndex
DROP INDEX "PromotionItem_theme_gemstoneId_key";

-- DropIndex
DROP INDEX "PromotionItem_theme_jewelryId_key";

-- DropIndex
DROP INDEX "RetailCart_userId_key";

-- CreateIndex
CREATE INDEX "Gemstone_isFeaturedLk_idx" ON "Gemstone"("isFeaturedLk");

-- CreateIndex
CREATE INDEX "JewelryPiece_isFeaturedLk_idx" ON "JewelryPiece"("isFeaturedLk");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionItem_theme_gemstoneId_market_key" ON "PromotionItem"("theme", "gemstoneId", "market");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionItem_theme_jewelryId_market_key" ON "PromotionItem"("theme", "jewelryId", "market");

-- CreateIndex
CREATE UNIQUE INDEX "RetailCart_userId_market_key" ON "RetailCart"("userId", "market");
