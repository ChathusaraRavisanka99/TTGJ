-- CreateTable
CREATE TABLE "SubcultureCollectionItem" (
    "id" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "gemstoneId" TEXT,
    "jewelryId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubcultureCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubcultureCollectionItem_collection_gemstoneId_key" ON "SubcultureCollectionItem"("collection", "gemstoneId");

-- CreateIndex
CREATE UNIQUE INDEX "SubcultureCollectionItem_collection_jewelryId_key" ON "SubcultureCollectionItem"("collection", "jewelryId");

-- CreateIndex
CREATE INDEX "SubcultureCollectionItem_gemstoneId_idx" ON "SubcultureCollectionItem"("gemstoneId");

-- CreateIndex
CREATE INDEX "SubcultureCollectionItem_jewelryId_idx" ON "SubcultureCollectionItem"("jewelryId");

-- CreateIndex
CREATE INDEX "SubcultureCollectionItem_collection_idx" ON "SubcultureCollectionItem"("collection");

-- AddForeignKey
ALTER TABLE "SubcultureCollectionItem" ADD CONSTRAINT "SubcultureCollectionItem_gemstoneId_fkey" FOREIGN KEY ("gemstoneId") REFERENCES "Gemstone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcultureCollectionItem" ADD CONSTRAINT "SubcultureCollectionItem_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "JewelryPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- RLS: matches every other table in this schema — see the migration
-- comment on "20260904143304_enable_row_level_security" for why. Zero
-- policies is intentional here too.
ALTER TABLE "SubcultureCollectionItem" ENABLE ROW LEVEL SECURITY;
