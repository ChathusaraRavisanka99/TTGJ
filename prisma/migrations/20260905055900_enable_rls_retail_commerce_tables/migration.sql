-- Closes the same PostgREST/anon-key gap 20260904143304_enable_row_level_security
-- already closed for every table that existed at that time — see that
-- migration's comment for the full rationale (Prisma connects as the
-- `postgres` role, which owns these tables and bypasses RLS regardless;
-- no policies are added on purpose).
ALTER TABLE "RetailCart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RetailCartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShippingZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommerceSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DiscountCodeRedemption" ENABLE ROW LEVEL SECURITY;
