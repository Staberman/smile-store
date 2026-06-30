import { NextRequest, NextResponse } from "next/server";
import { verifyPurchaseIntent } from "@/lib/checkout/purchase-intent.mjs";

export const runtime = "nodejs";

const ALLOWED_ORIGIN = "https://smiletienda.mitiendanube.com";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== ALLOWED_ORIGIN) {
    return new NextResponse("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const secret = process.env.PURCHASE_INTENT_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing purchase intent secret." },
      { status: 500, headers: corsHeaders() },
    );
  }

  const intent = request.nextUrl.searchParams.get("intent");

  if (!intent) {
    return NextResponse.json(
      { error: "Invalid purchase intent." },
      { status: 400, headers: corsHeaders() },
    );
  }

  try {
    const payload = verifyPurchaseIntent(intent, secret);
    return NextResponse.json(
      {
        productId: payload.productId,
        variantId: payload.variantId,
        quantity: 1,
      },
      { headers: corsHeaders() },
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid purchase intent." },
      { status: 400, headers: corsHeaders() },
    );
  }
}
