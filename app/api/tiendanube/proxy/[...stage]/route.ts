import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { verifyPurchaseIntent } from "@/lib/checkout/purchase-intent.mjs";

export const runtime = "nodejs";

const EXPECTED_STORE_ID = "3759046";
const SMILE_ORIGIN = "https://smiletienda.mitiendanube.com";

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Embed": "true",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isValidHexSignature(value: string) {
  return /^[0-9a-fA-F]{64}$/.test(value);
}

function verifyProxyRequest(request: NextRequest) {
  const secret = process.env.TIENDANUBE_APP_SECRET;
  const storeId = request.headers.get("x-store-id");
  const customerId = request.headers.get("x-customer-id") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const signature = request.headers.get("x-linkedstore-hmac-sha256");

  if (!secret || storeId !== EXPECTED_STORE_ID || !signature || !isValidHexSignature(signature)) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${storeId}${customerId}${requestId}`)
    .digest();
  const received = Buffer.from(signature, "hex");

  return (
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  );
}

function getStage(params: { stage?: string[] }) {
  return params.stage?.[0] ?? "";
}

function getValidatedIntent(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get("intent");
  const secret = process.env.PURCHASE_INTENT_SECRET;

  if (!intent || !secret) {
    return null;
  }

  try {
    return verifyPurchaseIntent(intent, secret);
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { stage?: string[] } },
) {
  if (!verifyProxyRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const stage = getStage(params);

  if (stage === "start") {
    return htmlResponse("<main><p>Preparando tu compra...</p></main>");
  }

  const intentPayload = getValidatedIntent(request);
  if (!intentPayload) {
    return htmlResponse("<main><p>No pudimos preparar tu compra</p></main>", 400);
  }

  const returnUrl = `${SMILE_ORIGIN}${intentPayload.returnPath}`;

  if (stage === "checkout") {
    return htmlResponse(`<!doctype html>
<html lang="es">
  <body>
    <form id="smile-checkout" method="post" action="/comprar/">
      <input type="hidden" name="go_to_checkout" value="1">
    </form>
    <script>
      document.getElementById("smile-checkout").submit();
    </script>
    <noscript>
      <button form="smile-checkout" type="submit">Continuar al checkout</button>
    </noscript>
  </body>
</html>`);
  }

  if (stage === "error") {
    return htmlResponse(`<!doctype html>
<html lang="es">
  <body>
    <main>
      <p>No pudimos preparar tu compra</p>
      <p><a href="${escapeHtml(returnUrl)}">Volver a Smile</a></p>
    </main>
  </body>
</html>`);
  }

  return new Response("Not found", { status: 404 });
}
