-- A customer's saved-for-later items — toggled from a heart button on
-- every catalog card/product page, listed on /account/wishlist.
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gemstoneId" TEXT,
    "jewelryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");
CREATE INDEX "WishlistItem_gemstoneId_idx" ON "WishlistItem"("gemstoneId");
CREATE INDEX "WishlistItem_jewelryId_idx" ON "WishlistItem"("jewelryId");

ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_gemstoneId_fkey" FOREIGN KEY ("gemstoneId") REFERENCES "Gemstone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "JewelryPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;
