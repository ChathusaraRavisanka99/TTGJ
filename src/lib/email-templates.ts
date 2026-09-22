import { formatPrice } from "@/lib/utils";

// Hand-rolled HTML (no email templating library, matching this codebase's
// general preference for inline SVG/CSS over dependencies elsewhere) —
// deliberately plain: a centered block, system-font stack (custom
// @font-face is unreliable across email clients), and the site's
// charcoal/gold palette approximated with inline styles only, since email
// clients strip <style> blocks and don't support most modern CSS.
function emailLayout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f7f5f1;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e0d8;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b8925a;font-family:Arial,sans-serif;">Ratnavue</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px;color:#2b2b28;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function passwordResetEmail(input: { resetUrl: string; expiresInMinutes: number }): EmailContent {
  const subject = "Reset your Ratnavue password";
  const html = emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:normal;color:#2b2b28;">Reset your password</h1>
    <p style="margin:0 0 20px;">We received a request to reset your Ratnavue account password. Click below to choose a new one — this link expires in ${input.expiresInMinutes} minutes.</p>
    <p style="margin:0 0 24px;">
      <a href="${input.resetUrl}" style="display:inline-block;background-color:#2b2b28;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;">Reset Password</a>
    </p>
    <p style="margin:0;font-size:13px;color:#6b6b66;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
  `);
  const text = `Reset your Ratnavue password\n\nWe received a request to reset your account password. Open this link to choose a new one (expires in ${input.expiresInMinutes} minutes):\n${input.resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  return { subject, html, text };
}

export function orderConfirmationEmail(input: {
  orderNumber: string;
  currency: "USD" | "LKR";
  total: number;
  items: { label: string; quantity: number; lineTotal: number }[];
  orderUrl: string;
}): EmailContent {
  const subject = `Order confirmed — ${input.orderNumber}`;
  const rows = input.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #ece7dd;">${item.label} × ${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #ece7dd;text-align:right;">${formatPrice(item.lineTotal, input.currency)}</td></tr>`,
    )
    .join("");
  const html = emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:normal;color:#2b2b28;">Payment received</h1>
    <p style="margin:0 0 20px;">Thank you — we've received payment for order <strong>${input.orderNumber}</strong> and we're preparing it for delivery.</p>
    <table role="presentation" width="100%" style="font-size:14px;margin:0 0 16px;">
      ${rows}
      <tr><td style="padding:12px 0 0;font-weight:bold;">Total</td><td style="padding:12px 0 0;text-align:right;font-weight:bold;">${formatPrice(input.total, input.currency)}</td></tr>
    </table>
    <p style="margin:0 0 24px;">
      <a href="${input.orderUrl}" style="display:inline-block;background-color:#2b2b28;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;">View Order</a>
    </p>
  `);
  const itemLines = input.items.map((item) => `- ${item.label} × ${item.quantity}: ${formatPrice(item.lineTotal, input.currency)}`).join("\n");
  const text = `Payment received for order ${input.orderNumber}\n\n${itemLines}\n\nTotal: ${formatPrice(input.total, input.currency)}\n\nView your order: ${input.orderUrl}`;
  return { subject, html, text };
}

// Not wired up yet — the phase that adds shipment tracking (carrier/
// tracking-number fields on Order) is what actually calls this; written
// now alongside the other templates since they share the same layout
// helper and review is easier done together.
export function shipmentStatusEmail(input: { orderNumber: string; status: "SHIPPED" | "DELIVERED"; carrier?: string; trackingNumber?: string; orderUrl: string }): EmailContent {
  const isShipped = input.status === "SHIPPED";
  const subject = isShipped ? `Your order ${input.orderNumber} has shipped` : `Your order ${input.orderNumber} was delivered`;
  const trackingLine =
    isShipped && input.carrier && input.trackingNumber
      ? `<p style="margin:0 0 20px;">Carrier: <strong>${input.carrier}</strong><br/>Tracking number: <strong>${input.trackingNumber}</strong></p>`
      : "";
  const html = emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:normal;color:#2b2b28;">${isShipped ? "Your order is on its way" : "Your order was delivered"}</h1>
    <p style="margin:0 0 16px;">Order <strong>${input.orderNumber}</strong> ${isShipped ? "has shipped." : "has been marked delivered."}</p>
    ${trackingLine}
    <p style="margin:0 0 24px;">
      <a href="${input.orderUrl}" style="display:inline-block;background-color:#2b2b28;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;">View Order</a>
    </p>
  `);
  const text = `${isShipped ? "Your order has shipped" : "Your order was delivered"} — ${input.orderNumber}${
    isShipped && input.carrier && input.trackingNumber ? `\nCarrier: ${input.carrier}\nTracking number: ${input.trackingNumber}` : ""
  }\n\nView your order: ${input.orderUrl}`;
  return { subject, html, text };
}
