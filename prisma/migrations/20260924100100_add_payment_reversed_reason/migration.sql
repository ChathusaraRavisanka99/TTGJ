-- The required message a staff/admin gives when reverting a PAID order
-- back to unpaid — see Order.paymentReversedReason's own schema comment.
ALTER TABLE "Order" ADD COLUMN "paymentReversedReason" TEXT;
