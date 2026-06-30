import { NextRequest, NextResponse } from "next/server";
import { createDraftCheckout } from "@/lib/checkout/draft-checkout.mjs";
import { createPurchaseIntent } from "@/lib/checkout/purchase-intent.mjs";
import { getProductBySlug } from "@/lib/catalog";

export const runtime = "nodejs";

const PURCHASE_INTENT_TTL_SECONDS = 300;

function readFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function serverError(message: string, status = 500) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Unsupported form payload." },
      { status: 415 },
    );
  }

  const slug = readFormString(formData, "slug");
  const variantId = readFormString(formData, "variantId");

  if (!slug || !variantId) {
    return badRequest("slug and variantId are required.");
  }

  const product = getProductBySlug(slug);
  if (!product || product.tiendanubeProductId === null) {
    return NextResponse.json({ error: "Product not available." }, { status: 404 });
  }

  const variant = product.variants.find(
    (candidate) => candidate.id !== null && String(candidate.id) === variantId,
  );

  if (!variant || variant.id === null) {
    return NextResponse.json({ error: "Variant not available." }, { status: 404 });
  }

  if (!variant.available || variant.stock <= 0) {
    return NextResponse.json({ error: "Variant is out of stock." }, { status: 409 });
  }

  const numericVariantId = Number(variant.id);
  if (!Number.isInteger(numericVariantId) || numericVariantId <= 0) {
    return badRequest("Variant identifier is invalid.");
  }

  if (process.env.TIENDANUBE_CHECKOUT_MODE !== "proxy") {
    const accessToken = process.env.TIENDANUBE_ACCESS_TOKEN;
    const storeId = process.env.TIENDANUBE_STORE_ID;
    if (!accessToken || !storeId) {
      return serverError("Missing Tiendanube checkout configuration.");
    }

    try {
      const checkoutUrl = await createDraftCheckout({
        accessToken,
        storeId,
        variantId: numericVariantId,
      });
      return NextResponse.redirect(checkoutUrl, { status: 303 });
    } catch {
      return serverError("Unable to create Tiendanube checkout.", 502);
    }
  }

  const secret = process.env.PURCHASE_INTENT_SECRET;
  if (!secret) {
    return serverError("Missing purchase intent secret.");
  }

  const intent = createPurchaseIntent(
    {
      productId: product.tiendanubeProductId,
      variantId: numericVariantId,
      returnPath: `/tienda/productos/${product.slug}`,
      exp: Math.floor(Date.now() / 1000) + PURCHASE_INTENT_TTL_SECONDS,
    },
    secret,
  );

  return NextResponse.redirect(
    `https://smiletienda.mitiendanube.com/apps/smile-comprar/start?intent=${encodeURIComponent(intent)}`,
    { status: 303 },
  );
}
