// =====================================================
// JNE OMS Reseller API client
// Requires env vars:
//   JNE_CLIENT_ID      — reseller client id (from oms.jne.co.id)
//   JNE_CLIENT_SECRET  — reseller client secret
// If not set, isJneConfigured() returns false and the
// caller should fall back to plain-text tracking display.
// =====================================================

export type JneScanEvent = {
  timestamp: string;
  location: string;
  status: string;
  description: string;
};

export type JneTrackingResult = {
  success: boolean;
  trackingNumber: string;
  finalStatus: string | null;
  estimatedDelivery: string | null;
  events: JneScanEvent[];
};

const JNE_API_BASE = "https://api.jne.co.id";
const TOKEN_CACHE_KEY = "jne_oms_token";

let tokenCache: { token: string; expiresAt: number } | null = null;

export function isJneConfigured(): boolean {
  return Boolean(
    process.env.JNE_CLIENT_ID && process.env.JNE_CLIENT_SECRET,
  );
}

async function getJneToken(): Promise<string | null> {
  if (!isJneConfigured()) return null;

  // Reuse cached token if still valid (refresh 60s before expiry)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const clientId = process.env.JNE_CLIENT_ID!;
  const clientSecret = process.env.JNE_CLIENT_SECRET!;

  try {
    const res = await fetch(
      `${JNE_API_BASE}/v2/auth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[JNE] token request failed:", res.status, text);
      return null;
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return tokenCache.token;
  } catch (err) {
    console.error("[JNE] token fetch error:", err);
    return null;
  }
}

/**
 * Fetch JNE shipment tracking for a given reseller/waybill number.
 * Returns a structured list of scan events, oldest → newest.
 * Returns null if JNE is not configured or the API call fails.
 */
export async function trackJneShipment(
  trackingNumber: string,
): Promise<JneTrackingResult | null> {
  if (!isJneConfigured()) return null;

  const token = await getJneToken();
  if (!token) return null;

  try {
    // JNE OMS v2 track endpoint
    // POST https://api.jne.co.id/v2/track
    // body: { shipment_codes: ["JNE..."] }
    const res = await fetch(`${JNE_API_BASE}/v2/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_codes: [trackingNumber] }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[JNE] track failed:", res.status, text);
      return null;
    }

    const data = (await res.json()) as {
      data?: Array<{
        shipment_code: string;
        status?: string;
        estimated_delivery_date?: string;
        tracking_events?: Array<{
          timestamp: string;
          location: string;
          status: string;
          description?: string;
        }>;
      }>;
    };

    const shipment = data.data?.[0];
    if (!shipment) return null;

    const rawEvents = shipment.tracking_events ?? [];
    // JNE returns newest first — reverse to oldest first
    const events: JneScanEvent[] = rawEvents
      .map((e) => ({
        timestamp: e.timestamp,
        location: e.location,
        status: e.status,
        description: e.description || e.status,
      }))
      .reverse();

    return {
      success: true,
      trackingNumber,
      finalStatus: shipment.status ?? null,
      estimatedDelivery: shipment.estimated_delivery_date ?? null,
      events,
    };
  } catch (err) {
    console.error("[JNE] track error:", err);
    return null;
  }
}
