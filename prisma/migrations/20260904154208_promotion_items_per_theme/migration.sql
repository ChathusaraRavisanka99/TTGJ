-- DropIndex
DROP INDEX "PromotionItem_gemstoneId_key";

-- DropIndex
DROP INDEX "PromotionItem_jewelryId_key";

-- AlterTable
ALTER TABLE "PromotionItem" ADD COLUMN     "theme" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PromotionItem_theme_idx" ON "PromotionItem"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionItem_theme_gemstoneId_key" ON "PromotionItem"("theme", "gemstoneId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionItem_theme_jewelryId_key" ON "PromotionItem"("theme", "jewelryId");

