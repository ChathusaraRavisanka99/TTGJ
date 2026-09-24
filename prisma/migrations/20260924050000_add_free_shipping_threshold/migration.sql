-- Opt-in free-shipping threshold, per store currency. Null disables it,
-- keeping every existing order's shipping math unchanged.
ALTER TABLE "CommerceSettings" ADD COLUMN "freeShippingThresholdUsd" DOUBLE PRECISION;
ALTER TABLE "CommerceSettings" ADD COLUMN "freeShippingThresholdLkr" DOUBLE PRECISION;
