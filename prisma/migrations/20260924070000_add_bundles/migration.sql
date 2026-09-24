-- Admin-curated bundles: 2+ existing catalog items sold together at a
-- combined price, applied as an automatic checkout discount once every
-- item in the set is in the same cart (see lib/checkout.ts).
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "market" TEXT NOT NULL DEFAULT 'intl',
    "price" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "gemstoneId" TEXT,
    "jewelryId" TEXT,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Bundle_market_active_idx" ON "Bundle"("market", "active");

CREATE INDEX "BundleItem_bundleId_idx" ON "BundleItem"("bundleId");
CREATE INDEX "BundleItem_gemstoneId_idx" ON "BundleItem"("gemstoneId");
CREATE INDEX "BundleItem_jewelryId_idx" ON "BundleItem"("jewelryId");

ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_gemstoneId_fkey" FOREIGN KEY ("gemstoneId") REFERENCES "Gemstone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "JewelryPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;
