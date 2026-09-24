-- Flags an order for admin review when its points redemption covers more
-- than its actual profit margin — a paper-trail flag, not a checkout
-- blocker (same pattern as shippingToBeArranged).
ALTER TABLE "Order" ADD COLUMN "needsPointsApproval" BOOLEAN NOT NULL DEFAULT false;
