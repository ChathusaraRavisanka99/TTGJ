/*
  Warnings:

  - You are about to drop the column `certLab` on the `Gemstone` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gemstone" DROP COLUMN "certLab",
ADD COLUMN     "certLabId" TEXT;

-- CreateTable
CREATE TABLE "CertificationLab" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "verifyUrlTemplate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CertificationLab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificationLab_name_key" ON "CertificationLab"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CertificationLab_slug_key" ON "CertificationLab"("slug");

-- AddForeignKey
ALTER TABLE "Gemstone" ADD CONSTRAINT "Gemstone_certLabId_fkey" FOREIGN KEY ("certLabId") REFERENCES "CertificationLab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
