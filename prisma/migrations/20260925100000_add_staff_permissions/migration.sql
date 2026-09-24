-- AlterTable
ALTER TABLE "User" ADD COLUMN "staffPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Existing staff accounts were order-management only.
UPDATE "User" SET "staffPermissions" = ARRAY['orders']::TEXT[] WHERE "role" = 'STAFF';
