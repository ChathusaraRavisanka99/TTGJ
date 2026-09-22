// 17track (17track.net) integration — a best-effort enhancement on top of
// the manual "admin enters a tracking number" flow (lib/orders.ts's
// markOrderShipped), not a replacement for it. With TRACK17_API_KEY unset
// this whole module no-ops (same graceful-degradation shape as
// lib/email.ts): shipment tracking keeps working exactly as if 17track
// didn't exist, an admin just has to mark DELIVERED by hand instead of
// their webhook doing it automatically.
//
// Carrier is deliberately omitted from the register call rather than
// mapped from a hardcoded numeric code table — 17track's register API
// supports auto-detecting the carrier from the tracking number's format
// when it's left out, which avoids this app needing to maintain (and get
// wrong) a carrier-name-to-17track-code mapping for the admin-typed
// carrier field.

const API_BASE = "https://api.17track.net/track/v2.2";

export interface Track17Result {
  ok: boolean;
  error?: string;
}

function getApiKey(): string | null {
  return process.env.TRACK17_API_KEY || null;
}

export interface WebhookEvent {
  trackingNumber: string;
  delivered: boolean;
}

/**
 * Best-effort parse of 17track's webhook push payload — event name at the
 * top level, or a nested track_info.latest_status.status, since which
 * shape actually arrives wasn't something I could confirm against a real
 * push in this environment (no live 17track account/public URL to test
 * against). Returns null for anything that doesn't look like a
 * recognizable event rather than throwing, so an unexpected payload shape
 * just gets ignored instead of erroring the webhook. Adjust this parsing
 * once a real push has been observed in production logs.
 */
export function parseTrack17Webhook(payload: unknown): WebhookEvent | null {
  if (typeof payload !== "object" || payload === null) return null;
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (typeof data !== "object" || data === null) return null;
  const trackingNumber = (data as Record<string, unknown>).number;
  if (typeof trackingNumber !== "string" || !trackingNumber) return null;

  const topLevelEvent = root.event;
  if (typeof topLevelEvent === "string" && /delivered/i.test(topLevelEvent)) {
    return { trackingNumber, delivered: true };
  }

  const trackInfo = (data as Record<string, unknown>).track_info;
  if (typeof trackInfo === "object" && trackInfo !== null) {
    const latestStatus = (trackInfo as Record<string, unknown>).latest_status;
    if (typeof latestStatus === "object" && latestStatus !== null) {
      const status = (latestStatus as Record<string, unknown>).status;
      if (typeof status === "string" && /delivered/i.test(status)) {
        return { trackingNumber, delivered: true };
      }
    }
  }

  return { trackingNumber, delivered: false };
}

/**
 * Registers a tracking number with 17track so their webhook
 * (app/api/17track/webhook/route.ts) can later push status updates for
 * it — most importantly, delivery. Never throws: called right after
 * markOrderShipped's own DB update, and a 17track outage or missing API
 * key should never fail marking an order shipped, only mean it falls back
 * to an admin marking DELIVERED by hand later, same as before this
 * integration existed.
 */
export async function registerTracking(trackingNumber: string): Promise<Track17Result> {
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: "17track isn't configured (TRACK17_API_KEY not set)." };

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "17token": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify([{ number: trackingNumber }]),
    });
    const body: unknown = await res.json().catch(() => null);
    const code = body && typeof body === "object" ? (body as { code?: unknown }).code : undefined;
    if (!res.ok || code !== 0) {
      return { ok: false, error: `17track register failed (${res.status}): ${JSON.stringify(body)}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not reach 17track." };
  }
}
