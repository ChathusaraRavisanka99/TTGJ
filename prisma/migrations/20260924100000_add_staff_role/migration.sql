-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STAFF';
ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_REVERSED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "staffMarketScope" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentReversedAt" TIMESTAMP(3),
ADD COLUMN "paymentReversedById" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentReversedById_fkey" FOREIGN KEY ("paymentReversedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
