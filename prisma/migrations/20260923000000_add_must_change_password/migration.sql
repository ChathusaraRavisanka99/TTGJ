-- Flags an account that needs to change a predefined password an admin
-- set for it directly (see createWholesaleAccount) — a nudge, not an
-- access gate.
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
