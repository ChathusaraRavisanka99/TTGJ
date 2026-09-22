-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'SHIPPED';
ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "carrier" TEXT,
ADD COLUMN "trackingNumber" TEXT,
ADD COLUMN "trackingUrl" TEXT,
ADD COLUMN "shippedAt" TIMESTAMP(3),
ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_trackingNumber_idx" ON "Order"("trackingNumber");
