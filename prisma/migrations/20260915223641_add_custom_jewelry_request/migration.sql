-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN "referenceImages" JSONB;
