-- Real, verified-purchase, admin-moderated product reviews.
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gemstoneId" TEXT,
    "jewelryId" TEXT,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_userId_gemstoneId_key" ON "Review"("userId", "gemstoneId");
CREATE UNIQUE INDEX "Review_userId_jewelryId_key" ON "Review"("userId", "jewelryId");
CREATE INDEX "Review_gemstoneId_status_idx" ON "Review"("gemstoneId", "status");
CREATE INDEX "Review_jewelryId_status_idx" ON "Review"("jewelryId", "status");
CREATE INDEX "Review_status_idx" ON "Review"("status");

ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_gemstoneId_fkey" FOREIGN KEY ("gemstoneId") REFERENCES "Gemstone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "JewelryPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;
