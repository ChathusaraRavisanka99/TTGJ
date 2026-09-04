-- Prisma's own internal migrations-tracking table — not part of the app's
-- schema (no model in schema.prisma), but it lives in the public schema
-- too and is just as reachable through PostgREST as every table covered
-- by the previous migration, so it gets the same treatment for a clean
-- Supabase RLS lint pass. Split into its own migration (rather than
-- folded into the prior one) because it was applied by hand first —
-- editing an already-applied migration file would leave its recorded
-- checksum out of sync with its content.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
