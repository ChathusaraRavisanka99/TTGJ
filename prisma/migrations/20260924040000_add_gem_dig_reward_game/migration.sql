-- One-time post-purchase "dig for a gem" reward game (see lib/gem-dig.ts):
-- a random 1-5% of the order's own profit margin, converted to points.
ALTER TYPE "PointsTransactionReason" ADD VALUE 'GEM_DIG_BONUS';

ALTER TABLE "Order" ADD COLUMN "gemDigPlayedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "gemDigPointsAwarded" INTEGER;
