import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayhereNotification, PAYHERE_STATUS } from "@/lib/payhere";
import { finalizePaidOrder } from "@/lib/orders";
import { createNotification } from "@/lib/notifications";

// PayHere's server-to-server payment notification — see
// https://support.payhere.lk/api-&-mobile-sdk/checkout-api. Not a
// Server Action: this is a plain POST from PayHere's own servers, not
// the customer's browser, form-encoded, with no session. PayHere retries
// this notification on a non-200 response, so the handler is written to
// be safely re-runnable: it re-checks order.status === "PAID" first and
// short-circuits before touching anything else, which is also why the
// order-status flip is its own small transaction rather than one giant
// one wrapping every side effect below — a retry after a partial success
// (e.g. the order was marked PAID but the process died before clearing
// the cart) re-enters here and, because status is already PAID, skips
// straight past re-running the parts that already succeeded... except it
// currently doesn't distinguish which side effects ran. Acceptable for
// this business's scale (see the same reasoning already used for
// invoice-numbering's lack of a dedicated sequence table); a stricter
// version would track each side effect's completion separately.
export async function POST(req: Request) {
  const form = await req.formData();
  const merchantId = String(form.get("merchant_id") ?? "");
  const orderId = String(form.get("order_id") ?? "");
  const payhereAmount = String(form.get("payhere_amount") ?? "");
  const payhereCurrency = String(form.get("payhere_currency") ?? "");
  const statusCode = String(form.get("status_code") ?? "");
  const md5sig = String(form.get("md5sig") ?? "");
  const paymentId = String(form.get("payment_id") ?? "");

  let valid: boolean;
  try {
    valid = verifyPayhereNotification({ merchantId, orderId, payhereAmount, payhereCurrency, statusCode, md5sig });
  } catch (error) {
    console.error("PayHere notify: verification failed to run", error);
    return new NextResponse("Server not configured", { status: 500 });
  }
  if (!valid) {
    console.error(`PayHere notify: invalid signature for order ${orderId}`);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { orderNumber: orderId } });
  if (!order) {
    console.error(`PayHere notify: unknown order ${orderId}`);
    return new NextResponse("Order not found", { status: 404 });
  }

  // Idempotent — never double-process a payment already marked PAID
  // (double-increment a discount code's usesCount, double-stamp the
  // birthday discount, or re-clear an already-fresh cart).
  if (order.status === "PAID") {
    return new NextResponse("OK", { status: 200 });
  }

  if (Number(statusCode) !== PAYHERE_STATUS.SUCCESS) {
    // Guarded the same way the PAID branch above is — a retried notification
    // for an order already marked failed shouldn't re-fire the customer
    // notification a second time.
    if (order.status !== "PAYMENT_FAILED") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAYMENT_FAILED" } });
      await createNotification({
        userId: order.userId,
        type: "STATUS_CHANGE",
        message: `Order ${order.orderNumber} couldn't be charged. No further action was taken — your items are still in your cart.`,
        requestType: "order",
        requestId: order.id,
      });
    }
    return new NextResponse("OK", { status: 200 });
  }

  // Defense in depth on top of the signature check above: the signature is
  // itself computed over (orderId, amount, currency, statusCode), so a
  // forged amount can't produce a valid signature without the merchant
  // secret — but cross-checking against the order's own stored total costs
  // nothing and catches any scenario where a validly-signed notification
  // still doesn't match what this order was actually invoiced for. Scoped
  // to just this success path (not the failed-status branch above) so a
  // declined-payment notification with an unusual amount format still gets
  // recorded — this check only ever gates the "mark as PAID" action.
  // Currency compared case-insensitively; amount with a small epsilon for
  // floating-point formatting differences.
  const notifiedAmount = Number(payhereAmount);
  const amountMismatch = !Number.isFinite(notifiedAmount) || Math.abs(notifiedAmount - order.total) > 0.01;
  const currencyMismatch = payhereCurrency.toUpperCase() !== order.currency.toUpperCase();
  if (amountMismatch || currencyMismatch) {
    console.error(
      `PayHere notify: amount/currency mismatch for order ${orderId} — notified ${payhereAmount} ${payhereCurrency}, expected ${order.total} ${order.currency}`,
    );
    return new NextResponse("Amount/currency mismatch", { status: 400 });
  }

  // Items -> SOLD, discount redemption, birthday stamp and cart clearing all
  // live in lib/orders.ts, shared with an admin confirming a bank transfer.
  await finalizePaidOrder(order.id, { gatewayPaymentId: paymentId });

  return new NextResponse("OK", { status: 200 });
}
