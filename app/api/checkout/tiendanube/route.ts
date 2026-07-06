import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/catalog";

export const runtime = "nodejs";

const TIENDANUBE_STORE = "https://smiletienda.mitiendanube.com";

function readFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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

  if (!slug) {
    return NextResponse.json({ error: "slug is required." }, { status: 400 });
  }

  const product = getProductBySlug(slug);
  if (!product || product.tiendanubeProductId === null) {
    return NextResponse.json({ error: "Product not available." }, { status: 404 });
  }

  const purchaseUrl = new URL("/comprar/", TIENDANUBE_STORE);
  purchaseUrl.searchParams.set("add_to_cart", String(product.tiendanubeProductId));
  purchaseUrl.searchParams.set("quantity", "1");
  purchaseUrl.searchParams.set("go_to_checkout", "1");

  return NextResponse.redirect(purchaseUrl.toString(), { status: 303 });
}
