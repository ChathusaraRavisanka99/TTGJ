-- CreateEnum
CREATE TYPE "PointsTransactionReason" AS ENUM ('EARNED_PURCHASE', 'REDEEMED_CHECKOUT', 'REFERRAL_BONUS_REFERRER', 'REFERRAL_BONUS_REFEREE', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED', 'REWARDED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referredByCode" TEXT,
ADD COLUMN "pointsBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "businessAccountId" TEXT,
ADD COLUMN "businessRole" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "pointsDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "businessAccountId" TEXT;

-- AlterTable
ALTER TABLE "RetailCart" ADD COLUMN "pointsToRedeem" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BusinessAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "PointsTransactionReason" NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "qualifyingOrderId" TEXT,
    "qualifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltySettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "pointsPerCurrencyUnit" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "pointsRedemptionValue" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "minRedeemPoints" INTEGER NOT NULL DEFAULT 500,
    "maxRedeemPercentOfOrder" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "referralMinOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "referralReferrerBonusPoints" INTEGER NOT NULL DEFAULT 500,
    "referralRefereeBonusPoints" INTEGER NOT NULL DEFAULT 250,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_businessAccountId_idx" ON "User"("businessAccountId");

-- CreateIndex
CREATE INDEX "Order_businessAccountId_idx" ON "Order"("businessAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessAccount_ownerId_key" ON "BusinessAccount"("ownerId");

-- CreateIndex
CREATE INDEX "PointsTransaction_userId_createdAt_idx" ON "PointsTransaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_refereeId_key" ON "Referral"("refereeId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessAccount" ADD CONSTRAINT "BusinessAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
