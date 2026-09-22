import { Resend } from "resend";

// A thin dispatch layer alongside (not replacing) the in-app Notification
// row lib/notifications.ts already writes for every customer-facing event
// — this is the new, separate channel for the handful of things that
// genuinely need to reach someone who isn't currently logged in and
// checking the bell: order confirmation and password reset.
//
// Deliberately never throws. Every call site treats email as a best-effort
// side channel, same as createNotification already is: a misconfigured or
// down email provider should never block registration, checkout, or a
// password-reset request from otherwise succeeding. Returns a result
// instead so a caller that specifically needs to know (password reset,
// which has nothing else to fall back on) can react — see
// lib/password-reset.ts's dev-mode console fallback.
export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

let client: Resend | null | undefined;

function getClient(): Resend | null {
  if (client !== undefined) return client;
  const apiKey = process.env.RESEND_API_KEY;
  client = apiKey ? new Resend(apiKey) : null;
  return client;
}

export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<SendEmailResult> {
  const resend = getClient();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) {
    return { ok: false, error: "Email isn't configured (RESEND_API_KEY/EMAIL_FROM not set)." };
  }

  try {
    const result = await resend.emails.send({ from, to: input.to, subject: input.subject, html: input.html, text: input.text });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not send the email." };
  }
}
