-- AlterTable
ALTER TABLE "Gemstone" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "JewelryPiece" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Gemstone_isFeatured_idx" ON "Gemstone"("isFeatured");

-- CreateIndex
CREATE INDEX "JewelryPiece_isFeatured_idx" ON "JewelryPiece"("isFeatured");
