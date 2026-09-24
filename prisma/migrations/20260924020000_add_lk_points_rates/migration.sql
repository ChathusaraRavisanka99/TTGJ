-- The Sri Lanka store's own native rewards-points rates, independent of
-- the international (USD) rates and not converted through the
-- fluctuating usdToLkrRate — see the schema comment on LoyaltySettings.
ALTER TABLE "LoyaltySettings" ADD COLUMN "pointsPerCurrencyUnitLkr" DOUBLE PRECISION NOT NULL DEFAULT 0.01;
ALTER TABLE "LoyaltySettings" ADD COLUMN "pointsRedemptionValueLkr" DOUBLE PRECISION NOT NULL DEFAULT 1;
