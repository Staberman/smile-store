import { NextRequest, NextResponse } from "next/server";
import { createDraftCheckout } from "@/lib/checkout/draft-checkout";
import { checkRateLimit, GLOBAL_KEY } from "@/lib/checkout/rate-limit";

export const runtime = "nodejs";

const ALLOWED_ORIGIN_HOSTS = [
  "smiletiendaimp.com.ar",
  "www.smiletiendaimp.com.ar",
  "localhost:3000",
  "127.0.0.1:3000",
];

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  // Origin check: if the browser sent an Origin, its host must match the
  // request host or be an explicitly allowed storefront host.
  const origin = request.headers.get("origin");
  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    const requestHost = request.headers.get("host");
    const allowed =
      originHost !== null &&
      (originHost === requestHost || ALLOWED_ORIGIN_HOSTS.includes(originHost));
    if (!allowed) {
      return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
    }
  }

  // Rate limit: per-IP first layer plus a global ceiling for this instance.
  const ip = getClientIp(request);
  const perKey = checkRateLimit(ip);
  const global = checkRateLimit(GLOBAL_KEY);
  if (!perKey.ok || !global.ok) {
    const retryAfterSec = Math.max(perKey.retryAfterSec, global.retryAfterSec);
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un momento." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { variantId } = body as Record<string, unknown>;

  if (!Number.isInteger(variantId) || (variantId as number) <= 0) {
    return NextResponse.json({ error: "variantId is required" }, { status: 400 });
  }

  const accessToken = process.env.TIENDANUBE_ACCESS_TOKEN;
  const storeId = process.env.TIENDANUBE_STORE_ID;

  if (!accessToken || !storeId) {
    return NextResponse.json(
      { error: "Missing Tiendanube credentials" },
      { status: 500 },
    );
  }

  try {
    const checkoutUrl = await createDraftCheckout({
      accessToken,
      storeId,
      variantId: variantId as number,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    // Log detail server-side only; never echo the upstream body or token.
    const message = err instanceof Error ? err.message : "checkout_failed";
    console.error("[checkout/create] draft order failed:", message);
    return NextResponse.json(
      { error: "No se pudo iniciar el checkout. Intentá de nuevo." },
      { status: 502 },
    );
  }
}
