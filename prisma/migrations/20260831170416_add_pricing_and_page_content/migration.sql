-- AlterTable
ALTER TABLE "Gemstone" ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "showPrice" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "JewelryPiece" ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "showPrice" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PageContent" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageContent_page_key" ON "PageContent"("page");
