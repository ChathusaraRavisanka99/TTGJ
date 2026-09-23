-- Lets an admin record a sale that happened outside the system (in-person,
-- cash or bank transfer) as an already-paid Order, instead of it going
-- untracked or being force-fit through the online checkout flow.
ALTER TYPE "PaymentMethod" ADD VALUE 'CASH';

ALTER TABLE "Order" ADD COLUMN "manualSale" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "manualPaymentReference" TEXT;
ALTER TABLE "Order" ADD COLUMN "manualReceiptUrl" TEXT;
