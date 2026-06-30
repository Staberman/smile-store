# Tiendanube One-Click Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que `Comprar ahora` agregue la variante seleccionada y abra el checkout real de Tiendanube con un clic, sin formulario previo, ficha nativa ni carrito visible.

**Architecture:** Smile emite un intento de compra HMAC de cinco minutos y redirige al App Proxy de Tiendanube. Una app Nube SDK resuelve el intento, limpia articulos residuales con `cart:remove`, ejecuta `cart:add` y, al confirmar que la variante elegida es el unico articulo, navega a una segunda etapa del proxy que autoenvia el formulario nativo `go_to_checkout` dentro del mismo dominio y sesion.

**Tech Stack:** Next.js 14 App Router, React 18, Node `crypto`, Nube SDK, TypeScript, tsup, Vercel, Node Test Runner.

## Global Constraints

- Un clic en `Comprar ahora`.
- No mostrar formulario previo, carrito ni ficha nativa de Tiendanube.
- Datos personales, entrega y pago se completan una sola vez en el checkout.
- Solo se aceptan productos y variantes presentes y disponibles en el catalogo local.
- La cantidad inicial queda limitada a `1`.
- El checkout debe contener solo la variante elegida, incluso si la sesion
  Tiendanube conservaba un carrito anterior.
- Los parametros incluyen expiracion y firma HMAC.
- El secreto de firma y el token de Tiendanube permanecen en Vercel.
- El `client_secret` expuesto anteriormente debe rotarse antes de habilitar el
  App Proxy.
- La redireccion solo admite rutas internas de `smiletienda.mitiendanube.com`.
- No reemplazar el checkout de produccion hasta aprobar el recorrido E2E completo.

---

## File Map

- `lib/checkout/purchase-intent.mjs`: firma, verifica y decodifica intentos.
- `lib/checkout/purchase-intent.d.ts`: contrato TypeScript del modulo anterior.
- `scripts/tiendanube/purchase-intent.test.mjs`: pruebas criptograficas y de expiracion.
- `app/api/checkout/tiendanube/route.ts`: valida producto/variante y crea la redireccion inicial.
- `app/api/checkout/tiendanube/resolve/route.ts`: entrega IDs validados al worker Nube SDK con CORS restringido.
- `app/api/tiendanube/proxy/[...stage]/route.ts`: valida App Proxy y sirve las etapas `start`, `checkout` y `error`.
- `integrations/tiendanube-checkout/src/main.ts`: orquestador Nube SDK.
- `integrations/tiendanube-checkout/src/flow.mjs`: logica pura y testeable del worker.
- `integrations/tiendanube-checkout/src/flow.d.ts`: tipos de la logica pura.
- `integrations/tiendanube-checkout/src/flow.test.mjs`: pruebas de eventos y navegacion.
- `public/tiendanube-checkout/main.min.js`: bundle generado que carga Tiendanube.
- `components/checkout/TiendanubeCheckoutForm.tsx`: activa el nuevo endpoint solo despues del E2E.
- `scripts/tiendanube/storefront-quality.test.mjs`: regresion sobre el formulario final.
- `package.json`: scripts y dependencias de compilacion del worker.

---

### Task 1: Activar las capacidades externas sin afectar produccion

**Files:**
- Modify: Partner Portal application `Smile Stock Sync` (`35403`)
- External request: `socios@tiendanube.com`

**Interfaces:**
- Consumes: App ID `35403`, dominio interno `smiletienda.mitiendanube.com`.
- Produces: App Proxy con prefijo `smile-comprar` y scope `write_scripts`.

- [ ] **Step 1: Activar el permiso Scripts**

En Tiendanube Partners abrir:

```text
Aplicaciones > Smile Stock Sync > Configuracion > Editar datos
Permisos > Scripts > Edit Scripts
```

Guardar, reinstalar la aplicacion y comprobar que el token renovado incluya:

```text
read_products,write_products,write_scripts
```

Mantener `read_draft_orders,write_draft_orders` solo hasta terminar la
transicion; retirarlos al cerrar el proyecto porque el flujo final no los usa.

- [ ] **Step 2: Rotar y renovar los secretos**

Regenerar el `client_secret` de la aplicacion desde Partners. Si el panel no
ofrece esa accion, solicitar la rotacion a `socios@tiendanube.com` y no
habilitar el flujo productivo hasta recibir el secreto nuevo. Reinstalar la
aplicacion para emitir un access token con los scopes actualizados.

Guardar el access token renovado sin imprimirlo:

```bash
gh secret set TIENDANUBE_ACCESS_TOKEN --repo Vekto-dev/smile-store
printf '%s' "$TIENDANUBE_ACCESS_TOKEN" \
  | npx vercel env add TIENDANUBE_ACCESS_TOKEN production --force
printf '%s' "$TIENDANUBE_APP_SECRET" \
  | npx vercel env add TIENDANUBE_APP_SECRET production --force
openssl rand -hex 32 \
  | npx vercel env add PURCHASE_INTENT_SECRET production --force
```

Expected: las tres variables figuran como `Encrypted / Production`.

- [ ] **Step 3: Solicitar App Proxy**

Enviar desde `smiletiendaimportados@gmail.com` a `socios@tiendanube.com`:

```text
Asunto: Activacion de App Proxy para aplicacion 35403

Hola equipo,

Necesitamos habilitar un App Proxy para nuestra aplicacion privada
"Smile Stock Sync" (App ID 35403), instalada en la tienda 3759046.

Prefix: smile-comprar
Base URL: https://www.smiletiendaimp.com.ar/api/tiendanube/proxy

El proxy se usara exclusivamente para iniciar el carrito mediante Nube SDK y
redirigir al checkout nativo de Tiendanube. La compra, el envio y el pago se
completan íntegramente en el checkout de Tiendanube.

Gracias.
```

Expected: soporte confirma el prefix y Base URL. No continuar con Task 6 hasta
esa confirmacion.

---

### Task 2: Crear intentos de compra firmados

**Files:**
- Create: `lib/checkout/purchase-intent.mjs`
- Create: `lib/checkout/purchase-intent.d.ts`
- Create: `scripts/tiendanube/purchase-intent.test.mjs`

**Interfaces:**
- Produces: `createPurchaseIntent(payload, secret)` y `verifyPurchaseIntent(token, secret, now?)`.
- Token payload: `{ productId: number, variantId: number, returnPath: string, exp: number }`.

- [ ] **Step 1: Escribir pruebas fallidas**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  createPurchaseIntent,
  verifyPurchaseIntent,
} from "../../lib/checkout/purchase-intent.mjs";

const secret = "test-secret-with-at-least-32-characters";
const payload = {
  productId: 299935919,
  variantId: 1338048150,
  returnPath: "/tienda/productos/hexagonal-classic-3548-dorado-verde-3lb4e",
  exp: 2_000,
};

test("round trips a signed purchase intent", () => {
  const token = createPurchaseIntent(payload, secret);
  assert.deepEqual(verifyPurchaseIntent(token, secret, 1_999), payload);
});

test("rejects tampered, expired, and external return paths", () => {
  const token = createPurchaseIntent(payload, secret);
  assert.throws(() => verifyPurchaseIntent(`${token}x`, secret, 1_999));
  assert.throws(() => verifyPurchaseIntent(token, secret, 2_001), /expired/i);
  assert.throws(() =>
    createPurchaseIntent({ ...payload, returnPath: "https://evil.test" }, secret),
  );
});
```

- [ ] **Step 2: Verificar RED**

Run:

```bash
node --test scripts/tiendanube/purchase-intent.test.mjs
```

Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar firma y verificacion**

Usar `base64url(JSON) + "." + HMAC-SHA256`, `timingSafeEqual`, enteros
positivos y `returnPath` iniciado en `/tienda/`. Rechazar secretos menores a
32 caracteres y tokens mayores a 2 KB.

La declaracion publica debe ser:

```ts
export type PurchaseIntent = {
  productId: number;
  variantId: number;
  returnPath: string;
  exp: number;
};

export function createPurchaseIntent(
  payload: PurchaseIntent,
  secret: string,
): string;

export function verifyPurchaseIntent(
  token: string,
  secret: string,
  now?: number,
): PurchaseIntent;
```

- [ ] **Step 4: Verificar GREEN**

```bash
node --test scripts/tiendanube/purchase-intent.test.mjs
npm run test:catalog
```

Expected: todas las pruebas pasan.

- [ ] **Step 5: Commit**

```bash
git add lib/checkout scripts/tiendanube/purchase-intent.test.mjs
git commit -m "feat: sign Tiendanube purchase intents"
```

---

### Task 3: Crear los endpoints Smile y App Proxy

**Files:**
- Create: `app/api/checkout/tiendanube/route.ts`
- Create: `app/api/checkout/tiendanube/resolve/route.ts`
- Create: `app/api/tiendanube/proxy/[...stage]/route.ts`
- Create: `scripts/tiendanube/checkout-routes.test.mjs`

**Interfaces:**
- Consumes: `createPurchaseIntent`, `verifyPurchaseIntent`, `getProductBySlug`.
- Produces: redireccion inicial, resolver CORS y HTML embebible para el proxy.

- [ ] **Step 1: Escribir pruebas de contrato fallidas**

Las pruebas deben leer las rutas y exigir:

```js
assert.match(entrySource, /status:\s*303/);
assert.match(entrySource, /smiletienda\.mitiendanube\.com\/apps\/smile-comprar\/start/);
assert.match(resolveSource, /Access-Control-Allow-Origin/);
assert.match(resolveSource, /https:\/\/smiletienda\.mitiendanube\.com/);
assert.match(proxySource, /x-linkedstore-hmac-sha256/i);
assert.match(proxySource, /X-Embed/);
assert.match(proxySource, /name="go_to_checkout"/);
assert.match(proxySource, /action="\/comprar\/"/);
```

- [ ] **Step 2: Verificar RED**

```bash
node --test scripts/tiendanube/checkout-routes.test.mjs
```

Expected: FAIL porque las rutas no existen.

- [ ] **Step 3: Implementar entrada de compra**

`POST /api/checkout/tiendanube` acepta solo:

```ts
type CheckoutRequest = {
  slug: string;
  variantId: string;
};
```

Debe encontrar el producto por slug, comprobar que `tiendanubeProductId` y
`variant.id` existan, y exigir `available && stock > 0`. El token dura 300
segundos. Responder:

```ts
return NextResponse.redirect(
  `https://smiletienda.mitiendanube.com/apps/smile-comprar/start?intent=${encodeURIComponent(intent)}`,
  { status: 303 },
);
```

Nunca aceptar precio, product ID ni URL de retorno enviados por el navegador.

- [ ] **Step 4: Implementar resolver CORS**

`GET /api/checkout/tiendanube/resolve?intent=...` verifica el token y responde:

```json
{
  "productId": 299935919,
  "variantId": 1338048150,
  "quantity": 1
}
```

Headers:

```text
Access-Control-Allow-Origin: https://smiletienda.mitiendanube.com
Vary: Origin
Cache-Control: no-store
```

Rechazar cualquier otro `Origin` con `403`.

- [ ] **Step 5: Implementar App Proxy**

Validar `X-Linkedstore-HMAC-SHA256` como HMAC SHA-256 de:

```text
X-Store-Id + X-Customer-Id + X-Request-Id
```

con `TIENDANUBE_APP_SECRET`, usando `timingSafeEqual`. Exigir store
`3759046`. Todas las respuestas HTML exitosas incluyen:

```text
Content-Type: text/html; charset=utf-8
X-Embed: true
Cache-Control: no-store
```

Etapas:

- `start`: `Preparando tu compra...`, sin scripts propios.
- `checkout`: verificar intent y devolver:

```html
<form id="smile-checkout" method="post" action="/comprar/">
  <input type="hidden" name="go_to_checkout" value="1">
</form>
<script>
  document.getElementById("smile-checkout").submit();
</script>
<noscript>
  <button form="smile-checkout" type="submit">Continuar al checkout</button>
</noscript>
```

- `error`: mensaje `No pudimos preparar tu compra` y enlace absoluto al
  `returnPath` validado de Smile.

- [ ] **Step 6: Verificar**

```bash
node --test scripts/tiendanube/checkout-routes.test.mjs
npm run test:catalog
npm run build
```

Expected: exit `0`.

- [ ] **Step 7: Commit**

```bash
git add app/api scripts/tiendanube/checkout-routes.test.mjs
git commit -m "feat: add secure Tiendanube checkout bridge"
```

---

### Task 4: Crear la aplicacion Nube SDK

**Files:**
- Create: `integrations/tiendanube-checkout/src/main.ts`
- Create: `integrations/tiendanube-checkout/src/flow.mjs`
- Create: `integrations/tiendanube-checkout/src/flow.d.ts`
- Create: `integrations/tiendanube-checkout/src/flow.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `state.location.url`, `state.location.queries.intent`, `cart:add`.
- Produces: navegacion a etapas `checkout` o `error`.

- [ ] **Step 1: Escribir pruebas del flujo**

Cubrir:

```js
test("resolves intent, registers listeners, then sends cart:add");
test("clears existing cart items before sending cart:add");
test("navigates to checkout only after matching cart:add:success");
test("fails when the resulting cart is not exactly the selected variant");
test("navigates to error after cart:add:fail");
test("navigates to error after cart:remove:fail");
test("does nothing outside /apps/smile-comprar/start");
test("does not send cart:add twice for the same intent");
```

Usar un fake con arreglos `sentEvents`, `listeners` y `navigations`; no simular
la implementacion interna del SDK.

- [ ] **Step 2: Verificar RED**

```bash
node --test integrations/tiendanube-checkout/src/flow.test.mjs
```

Expected: FAIL con modulo faltante.

- [ ] **Step 3: Implementar flujo puro**

Contrato:

```ts
export type CheckoutBridge = {
  resolveIntent(intent: string): Promise<{
    productId: number;
    variantId: number;
    quantity: 1;
  }>;
  clearCart(): Promise<void>;
  on(
    event: "cart:add:success" | "cart:add:fail",
    handler: (items: Array<{
      product_id: number;
      variant_id: number;
      quantity: number;
    }>) => void,
  ): void;
  sendAdd(item: {
    product_id: number;
    variant_id: number;
    quantity: 1;
  }): void;
  navigate(path: string): void;
};

export function startCheckoutFlow(
  location: { url: string; queries: Record<string, string> },
  bridge: CheckoutBridge,
): Promise<void>;
```

Registrar listeners antes de `sendAdd`. Añadir `intent` a ambas rutas de
navegacion. Ejecutar `clearCart()` antes de `sendAdd` y considerar exitoso
solo un estado con exactamente una unidad de la variante resuelta. Usar un
`Set` en memoria para evitar doble envio.

- [ ] **Step 4: Implementar `App(nube)`**

`main.ts` adapta Nube SDK:

```ts
export function App(nube: NubeSDK) {
  const browser = nube.getBrowserAPIs();
  const location = nube.getState().location;

  void startCheckoutFlow(location, {
    resolveIntent: async (intent) => {
      const response = await fetch(
        `https://www.smiletiendaimp.com.ar/api/checkout/tiendanube/resolve?intent=${encodeURIComponent(intent)}`,
      );
      if (!response.ok) throw new Error("intent_resolution_failed");
      return response.json();
    },
    clearCart: async () => {
      const items = nube.getState().cart.items;
      if (items.length === 0) return;

      await removeAllCartItems(nube, items);
    },
    on: (event, handler) =>
      nube.on(event, ({ cart }) => handler(cart.items)),
    sendAdd: (item) =>
      nube.send("cart:add", () => ({ cart: { items: [item] } })),
    navigate: (path) => browser.navigate(path),
  });
}
```

Ante error de red, navegar a `error`.

`removeAllCartItems` debe registrar `cart:remove:success` y
`cart:remove:fail` antes de enviar `cart:remove`, resolver solo cuando
`cart.items` quede vacio, retirar ambos listeners al terminar y aplicar un
timeout de ocho segundos.

- [ ] **Step 5: Configurar bundle**

Agregar:

```json
{
  "scripts": {
    "build:nube-sdk": "tsup integrations/tiendanube-checkout/src/main.ts --format esm --minify --out-dir public/tiendanube-checkout --out-extension .js=.min.js",
    "prebuild": "npm run build:nube-sdk"
  },
  "devDependencies": {
    "@tiendanube/nube-sdk-types": "0.79.0",
    "tsup": "8.5.1"
  }
}
```

Registrar esas versiones exactas en `package-lock.json`.

- [ ] **Step 6: Verificar**

```bash
npm install
node --test integrations/tiendanube-checkout/src/flow.test.mjs
npm run build:nube-sdk
test -s public/tiendanube-checkout/main.min.js
npm run build
```

Expected: todos exit `0`; bundle no vacio.

- [ ] **Step 7: Commit**

```bash
git add integrations public/tiendanube-checkout package.json package-lock.json
git commit -m "feat: add Nube SDK checkout worker"
```

---

### Task 5: Desplegar infraestructura y registrar el script

**Files:**
- No source changes unless deployment reveals a verified defect.

**Interfaces:**
- Consumes: App Proxy confirmed, worker bundle and Vercel endpoints.
- Produces: bridge testable through a direct signed purchase request.

- [ ] **Step 1: Ejecutar verificaciones completas**

```bash
npm ci
npm run test:catalog
node --test integrations/tiendanube-checkout/src/flow.test.mjs
npm run build
```

Expected: cero fallos.

- [ ] **Step 2: Subir rama y desplegar sin cambiar el boton**

```bash
git push origin codex/tiendanube-catalog-migration
npx vercel --prod --yes
```

Expected: deployment `Ready`; el formulario de produccion todavia conserva su
comportamiento anterior.

- [ ] **Step 3: Crear el script en Partners**

En `Aplicaciones > Smile Stock Sync > Scripts > Crear`:

```text
Name: Smile One-Click Checkout
Source URL: https://www.smiletiendaimp.com.ar/tiendanube-checkout/main.min.js
Location: Store
Event: onload
Uses Nube SDK: enabled
Auto-install: enabled para la tienda 3759046
```

Si `Auto-install` no esta disponible, asociar el script a la tienda mediante
el endpoint oficial `POST /v1/3759046/scripts`.

- [ ] **Step 4: Probar el puente sin exponerlo**

Crear un formulario temporal local que haga POST a:

```text
https://www.smiletiendaimp.com.ar/api/checkout/tiendanube
slug=hexagonal-classic-3548-dorado-verde-3lb4e
variantId=1338048150
```

En Chromium y Safari verificar:

1. aparece brevemente `Preparando tu compra...`;
2. no aparece carrito ni ficha nativa;
3. el checkout contiene exactamente una unidad;
4. producto, variante y precio coinciden;
5. URL final pertenece a `smiletienda.mitiendanube.com/checkout/`.

Repetir la prueba despues de dejar previamente otro producto en el carrito
nativo; el checkout final debe seguir conteniendo solo la variante elegida.

Si cualquier punto falla, no ejecutar Task 6.

---

### Task 6: Activar el boton y verificar produccion

**Files:**
- Modify: `components/checkout/TiendanubeCheckoutForm.tsx`
- Modify: `scripts/tiendanube/storefront-quality.test.mjs`

**Interfaces:**
- Consumes: bridge E2E aprobado.
- Produces: formulario final de compra de un clic.

- [ ] **Step 1: Escribir regresion fallida**

Exigir:

```js
assert.match(source, /action="\/api\/checkout\/tiendanube"/);
assert.match(source, /name="slug"/);
assert.match(source, /name="variantId"/);
assert.doesNotMatch(source, /mitiendanube\.com\/comprar/);
assert.doesNotMatch(source, /go_to_checkout/);
```

- [ ] **Step 2: Verificar RED**

```bash
node --test --test-name-pattern="checkout" \
  scripts/tiendanube/storefront-quality.test.mjs
```

Expected: FAIL porque el formulario aun apunta a `/comprar/`.

- [ ] **Step 3: Cambiar el formulario**

Usar:

```tsx
<form method="post" action="/api/checkout/tiendanube" className={className}>
  <input type="hidden" name="slug" value={product.slug} />
  <input type="hidden" name="variantId" value={variant?.id ?? ""} />
  <button type="submit" disabled={!canBuy} className={BASE_BUTTON_CLASSES}>
    {canBuy ? label : "Sin stock"}
  </button>
</form>
```

Eliminar `options`, `add_to_cart`, `quantity`, `go_to_checkout` y el action
externo.

- [ ] **Step 4: Verificar local**

```bash
npm run test:catalog
node --test integrations/tiendanube-checkout/src/flow.test.mjs
npm run build
```

Expected: cero fallos.

- [ ] **Step 5: Commit, push y despliegue**

```bash
git add components/checkout/TiendanubeCheckoutForm.tsx \
  scripts/tiendanube/storefront-quality.test.mjs
git commit -m "fix: send purchases through Tiendanube checkout bridge"
git push origin codex/tiendanube-catalog-migration
```

Crear PR, esperar Vercel Preview `SUCCESS`, integrar a `main` y esperar Vercel
Production `SUCCESS`.

- [ ] **Step 6: Verificacion final en produccion**

Probar como cliente:

- un producto simple;
- un producto con multiples variantes;
- mobile 390x844;
- desktop 1440x900;
- variante sin stock;
- sesion con un articulo anterior;
- back desde checkout;
- intento firmado vencido.

Confirmar que ninguna compra de prueba se complete y limpiar carritos/drafts
temporales.

Si el smoke test de produccion falla, restaurar inmediatamente el deployment
anterior desde Vercel y no retirar el permiso temporal de Draft Orders hasta
documentar la causa.

- [ ] **Step 7: Retirar permisos no usados**

Si el flujo final no usa Draft Orders, quitar `View Manual Orders` y
`Edit Manual Orders`, reinstalar la app y renovar secretos una ultima vez.
