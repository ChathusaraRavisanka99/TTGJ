-- Per-item weight-based shipping tiers, replacing the destination-based
-- ShippingZone rate for whichever item is assigned one; quoteShipping is
-- the alternative when even a weight tier doesn't fit (shipping arranged
-- separately after purchase).
CREATE TABLE "ShippingWeightTier" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ratePerOrderLKR" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingWeightTier_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Gemstone" ADD COLUMN "shippingWeightTierId" TEXT;
ALTER TABLE "Gemstone" ADD COLUMN "quoteShipping" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Gemstone_shippingWeightTierId_idx" ON "Gemstone"("shippingWeightTierId");
ALTER TABLE "Gemstone" ADD CONSTRAINT "Gemstone_shippingWeightTierId_fkey" FOREIGN KEY ("shippingWeightTierId") REFERENCES "ShippingWeightTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JewelryPiece" ADD COLUMN "shippingWeightTierId" TEXT;
ALTER TABLE "JewelryPiece" ADD COLUMN "quoteShipping" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "JewelryPiece_shippingWeightTierId_idx" ON "JewelryPiece"("shippingWeightTierId");
ALTER TABLE "JewelryPiece" ADD CONSTRAINT "JewelryPiece_shippingWeightTierId_fkey" FOREIGN KEY ("shippingWeightTierId") REFERENCES "ShippingWeightTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" ADD COLUMN "shippingToBeArranged" BOOLEAN NOT NULL DEFAULT false;
