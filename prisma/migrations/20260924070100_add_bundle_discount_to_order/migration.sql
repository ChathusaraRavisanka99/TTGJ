-- Snapshot of how much a Bundle discount (if any) reduced this order's
-- subtotal — same convention as discountAmount/birthdayDiscountAmount.
ALTER TABLE "Order" ADD COLUMN "bundleDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
