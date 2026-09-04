-- Enable Row Level Security on every table in the public schema.
--
-- Supabase auto-exposes every public-schema table through PostgREST (its
-- REST API, reachable with the project's anon/public key) and the
-- Supabase client SDKs. Without RLS, that API has no restriction on who
-- can read or write a table's rows, independent of anything this app's
-- own Server Actions enforce.
--
-- This app never queries Postgres through PostgREST or a Supabase
-- client — every read/write goes through Prisma via Server Actions,
-- gated by requireAdmin/requireUser (see lib/rbac.ts). Supabase itself
-- is used only for Storage uploads (lib/supabase.ts, service-role key).
-- Prisma connects as the `postgres` role, which owns every one of these
-- tables and therefore bypasses RLS entirely (Postgres table owners
-- always bypass RLS unless FORCE ROW LEVEL SECURITY is set, which none
-- of these tables have) — so enabling RLS with no policies closes the
-- PostgREST/anon-key path completely while leaving the app itself
-- completely unaffected. No policies are added on purpose: the intent
-- is "nothing but this app's own Prisma connection can touch these
-- tables," not "let the anon key see some rows."
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Mineral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cut" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClarityGrade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Treatment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Origin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CertificationLab" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Gemstone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JewelryPiece" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JewelryGemstoneLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuoteRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SourcingRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DiscountCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageVisibility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Auction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuctionBid" ENABLE ROW LEVEL SECURITY;
