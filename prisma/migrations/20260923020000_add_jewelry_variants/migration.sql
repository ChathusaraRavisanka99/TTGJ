-- Opt-in style/size variants for a jewelry piece (e.g. "Size 7", "18-inch
-- chain"), each with its own stock and an optional price override. A piece
-- with no rows here behaves exactly as before this migration.
CREATE TABLE "JewelryVariant" (
    "id" TEXT NOT NULL,
    "jewelryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "retailPrice" DOUBLE PRECISION,
    "lkrRetailPrice" DOUBLE PRECISION,
    "costPrice" DOUBLE PRECISION,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'AVAILABLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JewelryVariant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JewelryVariant_jewelryId_idx" ON "JewelryVariant"("jewelryId");
CREATE INDEX "JewelryVariant_stockStatus_idx" ON "JewelryVariant"("stockStatus");
ALTER TABLE "JewelryVariant" ADD CONSTRAINT "JewelryVariant_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "JewelryPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Which variant a cart line/order line is for, when the piece has any.
ALTER TABLE "RetailCartItem" ADD COLUMN "jewelryVariantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "jewelryVariantId" TEXT;

ALTER TABLE "RetailCartItem" ADD CONSTRAINT "RetailCartItem_jewelryVariantId_fkey" FOREIGN KEY ("jewelryVariantId") REFERENCES "JewelryVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_jewelryVariantId_fkey" FOREIGN KEY ("jewelryVariantId") REFERENCES "JewelryVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Replaces the old (cartId, jewelryId) uniqueness: two different variants
-- of the same piece must be addable to the same cart side by side. See the
-- schema comment on RetailCartItem for why a plain non-varianted line
-- (jewelryVariantId NULL) isn't deduped by this constraint alone.
DROP INDEX "RetailCartItem_cartId_jewelryId_key";
CREATE UNIQUE INDEX "RetailCartItem_cartId_jewelryId_jewelryVariantId_key" ON "RetailCartItem"("cartId", "jewelryId", "jewelryVariantId");
