import { describe, it, expect } from "vitest";
import { passwordResetEmail, orderConfirmationEmail, shipmentStatusEmail } from "@/lib/email-templates";

describe("passwordResetEmail", () => {
  it("includes the reset link in both the html and text bodies", () => {
    const email = passwordResetEmail({ resetUrl: "https://ratnavue.com/account/reset-password?token=abc123", expiresInMinutes: 60 });
    expect(email.html).toContain("https://ratnavue.com/account/reset-password?token=abc123");
    expect(email.text).toContain("https://ratnavue.com/account/reset-password?token=abc123");
    expect(email.text).toContain("60 minutes");
    expect(email.subject).toMatch(/reset/i);
  });
});

describe("orderConfirmationEmail", () => {
  const base = {
    orderNumber: "ORD-2026-0042",
    currency: "USD" as const,
    total: 220,
    items: [
      { label: "Blue Sapphire", quantity: 1, lineTotal: 200 },
      { label: "Setting Fee", quantity: 1, lineTotal: 20 },
    ],
    orderUrl: "https://ratnavue.com/account/orders/abc123",
  };

  it("includes the order number, every line item, and the total", () => {
    const email = orderConfirmationEmail(base);
    expect(email.subject).toContain("ORD-2026-0042");
    expect(email.html).toContain("Blue Sapphire");
    expect(email.html).toContain("Setting Fee");
    expect(email.html).toContain("$220");
    expect(email.text).toContain("Blue Sapphire");
    expect(email.text).toContain(base.orderUrl);
  });

  it("formats totals in LKR for a Sri Lanka order", () => {
    const email = orderConfirmationEmail({ ...base, currency: "LKR", total: 66000 });
    expect(email.html).toContain("Rs 66,000");
  });
});

describe("shipmentStatusEmail", () => {
  it("includes carrier and tracking details for a SHIPPED order", () => {
    const email = shipmentStatusEmail({
      orderNumber: "ORD-2026-0042", status: "SHIPPED", carrier: "DHL", trackingNumber: "1234567890",
      orderUrl: "https://ratnavue.com/account/orders/abc123",
    });
    expect(email.subject).toMatch(/shipped/i);
    expect(email.html).toContain("DHL");
    expect(email.html).toContain("1234567890");
  });

  it("omits tracking details entirely for a DELIVERED order", () => {
    const email = shipmentStatusEmail({ orderNumber: "ORD-2026-0042", status: "DELIVERED", orderUrl: "https://ratnavue.com/account/orders/abc123" });
    expect(email.subject).toMatch(/delivered/i);
    expect(email.html).not.toContain("Tracking number");
  });
});
