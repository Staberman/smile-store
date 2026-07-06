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

  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Redirigiendo...</title></head>
<body>
  <form id="f" method="post" action="${TIENDANUBE_STORE}/comprar/">
    <input type="hidden" name="add_to_cart" value="${product.tiendanubeProductId}">
    <input type="hidden" name="quantity" value="1">
    <input type="hidden" name="go_to_checkout" value="1">
  </form>
  <script>document.getElementById("f").submit()</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
