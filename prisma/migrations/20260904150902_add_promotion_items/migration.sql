-- CreateTable
CREATE TABLE "PromotionItem" (
    "id" TEXT NOT NULL,
    "gemstoneId" TEXT,
    "jewelryId" TEXT,
    "promoPrice" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromotionItem_gemstoneId_key" ON "PromotionItem"("gemstoneId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionItem_jewelryId_key" ON "PromotionItem"("jewelryId");

-- CreateIndex
CREATE INDEX "PromotionItem_gemstoneId_idx" ON "PromotionItem"("gemstoneId");

-- CreateIndex
CREATE INDEX "PromotionItem_jewelryId_idx" ON "PromotionItem"("jewelryId");

-- AddForeignKey
ALTER TABLE "PromotionItem" ADD CONSTRAINT "PromotionItem_gemstoneId_fkey" FOREIGN KEY ("gemstoneId") REFERENCES "Gemstone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionItem" ADD CONSTRAINT "PromotionItem_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "JewelryPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- RLS: matches every other table in this schema — see the migration
-- comment on "20260904143304_enable_row_level_security" for why. Zero
-- policies is intentional here too.
ALTER TABLE "PromotionItem" ENABLE ROW LEVEL SECURITY;
