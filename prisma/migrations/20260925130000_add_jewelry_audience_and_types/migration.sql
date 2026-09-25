-- AlterEnum
ALTER TYPE "PieceType" ADD VALUE 'ANKLET';
ALTER TYPE "PieceType" ADD VALUE 'JEWELRY_SET';
ALTER TYPE "PieceType" ADD VALUE 'CUFFLINKS';

-- CreateEnum
CREATE TYPE "JewelryAudience" AS ENUM ('WOMEN', 'MEN', 'COUPLE', 'UNISEX');

-- AlterTable
ALTER TABLE "JewelryPiece" ADD COLUMN "audience" "JewelryAudience" NOT NULL DEFAULT 'UNISEX';

-- CreateIndex
CREATE INDEX "JewelryPiece_audience_idx" ON "JewelryPiece"("audience");
