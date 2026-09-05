-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('RETAIL', 'WHOLESALE');

-- CreateEnum
CREATE TYPE "WholesaleStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DiscountScope" AS ENUM ('SITE_WIDE', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "DiscountCode" DROP CONSTRAINT "DiscountCode_cartId_fkey";

-- DropIndex
DROP INDEX "DiscountCode_cartId_key";

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "discountCodeId" TEXT;

-- AlterTable
ALTER TABLE "DiscountCode" DROP COLUMN "cartId",
DROP COLUMN "usedAt",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "assignedUserId" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "maxUses" INTEGER,
ADD COLUMN     "scope" "DiscountScope" NOT NULL DEFAULT 'SITE_WIDE',
ADD COLUMN     "usesCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Gemstone" ADD COLUMN     "costPrice" DOUBLE PRECISION,
ADD COLUMN     "retailPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "JewelryPiece" ADD COLUMN     "costPrice" DOUBLE PRECISION,
ADD COLUMN     "retailPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "businessRegNo" TEXT,
ADD COLUMN     "customerType" "CustomerType" NOT NULL DEFAULT 'RETAIL',
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "lastBirthdayDiscountAt" TIMESTAMP(3),
ADD COLUMN     "wholesaleStatus" "WholesaleStatus";

-- CreateTable
CREATE TABLE "DiscountCodeRedemption" (
    "id" TEXT NOT NULL,
    "discountCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cartId" TEXT,
    "orderId" TEXT,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCodeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailCart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discountCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailCartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "gemstoneId" TEXT,
    "jewelryId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetailCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "birthdayDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "handlingFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "shipName" TEXT NOT NULL,
    "shipPhone" TEXT NOT NULL,
    "shipCountry" TEXT NOT NULL,
    "shipCity" TEXT NOT NULL,
    "shipAddressLine1" TEXT NOT NULL,
    "shipAddressLine2" TEXT,
    "shipPostalCode" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentGateway" TEXT NOT NULL DEFAULT 'payhere',
    "gatewayPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "discountCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "gemstoneId" TEXT,
    "jewelryId" TEXT,
    "label" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "countries" TEXT[],
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "ratePerOrderLKR" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "vatPercent" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "applyVatToInternational" BOOLEAN NOT NULL DEFAULT false,
    "gatewayCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 3.5,
    "handlingFeeMarginPercent" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "birthdayDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "usdToLkrRate" DOUBLE PRECISION NOT NULL DEFAULT 300,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscountCodeRedemption_discountCodeId_idx" ON "DiscountCodeRedemption"("discountCodeId");

-- CreateIndex
CREATE INDEX "DiscountCodeRedemption_userId_idx" ON "DiscountCodeRedemption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailCart_userId_key" ON "RetailCart"("userId");

-- CreateIndex
CREATE INDEX "RetailCart_discountCodeId_idx" ON "RetailCart"("discountCodeId");

-- CreateIndex
CREATE INDEX "RetailCartItem_cartId_idx" ON "RetailCartItem"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailCartItem_cartId_gemstoneId_key" ON "RetailCartItem"("cartId", "gemstoneId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailCartItem_cartId_jewelryId_key" ON "RetailCartItem"("cartId", "jewelryId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_discountCodeId_idx" ON "Order"("discountCodeId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Cart_discountCodeId_idx" ON "Cart"("discountCodeId");

-- CreateIndex
CREATE INDEX "DiscountCode_assignedUserId_idx" ON "DiscountCode"("assignedUserId");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeRedemption" ADD CONSTRAINT "DiscountCodeRedemption_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeRedemption" ADD CONSTRAINT "DiscountCodeRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailCart" ADD CONSTRAINT "RetailCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailCart" ADD CONSTRAINT "RetailCart_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailCartItem" ADD CONSTRAINT "RetailCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "RetailCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailCartItem" ADD CONSTRAINT "RetailCartItem_gemstoneId_fkey" FOREIGN KEY ("gemstoneId") REFERENCES "Gemstone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailCartItem" ADD CONSTRAINT "RetailCartItem_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "JewelryPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_gemstoneId_fkey" FOREIGN KEY ("gemstoneId") REFERENCES "Gemstone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "JewelryPiece"("id") ON DELETE SET NULL ON UPDATE CASCADE;

