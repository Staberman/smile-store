# Storefront Client Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar navegacion comercial, stock estricto, precios informativos, logos, encuadre visual y checkout nativo sin perder la estetica Smile.

**Architecture:** La cabecera enviara filtros por query string a una unica vista de tienda. Las reglas comerciales puras viviran en `lib/storefront.ts`, la interfaz consumira esas reglas y los datos seguiran llegando del catalogo sincronizado. Los rankings de ventas se generaran durante la sincronizacion y quedaran como datos estaticos seguros para render.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS 4, Framer Motion, Tiendanube API y NubeSDK.

## Global Constraints

- Mantener la paleta negra, marfil y dorada existente.
- Conservar el popup movil actual.
- No mostrar productos ni variantes sin stock.
- No cargar logos desde terceros en tiempo de ejecucion.
- No reintroducir carrito visible ni formulario previo al checkout.
- Calcular transferencia con 20% de descuento y cuotas en 6 pagos.

---

### Task 1: Reglas comerciales probadas

**Files:**
- Create: `lib/storefront.ts`
- Create: `scripts/tiendanube/storefront-rules.test.mjs`
- Modify: `lib/catalog.ts`

**Interfaces:**
- Produces: `getAvailableVariants(product)`, `getDisplayPrice(product, variant?)`,
  `getTransferPrice(price)`, `getInstallmentPrice(price)`,
  `isOffer(product)` y `filterStorefrontProducts(products, view)`.

- [ ] **Step 1:** Crear pruebas que exijan variantes con `available=true`,
  `stock>0`, precio de transferencia `price * 0.8`, seis cuotas y filtros
  separados para lentes, relojes y ofertas.
- [ ] **Step 2:** Ejecutar `node --test scripts/tiendanube/storefront-rules.test.mjs`.
  Debe fallar porque `lib/storefront.ts` no existe.
- [ ] **Step 3:** Implementar funciones puras con redondeo a pesos enteros:
  `Math.round(price * 0.8)` y `Math.round(price / 6)`.
- [ ] **Step 4:** Ejecutar la prueba y esperar todos los casos en `PASS`.
- [ ] **Step 5:** Commit `feat: add storefront merchandising rules`.

### Task 2: Navegacion y catalogo comprable

**Files:**
- Create: `components/store/StoreCategoryNav.tsx`
- Modify: `app/tienda/layout.tsx`
- Modify: `app/tienda/TiendaClient.tsx`
- Modify: `components/brand/ProductGrid.tsx`
- Modify: `app/tienda/productos/[slug]/ProductDetailClient.tsx`
- Modify: `scripts/tiendanube/storefront-quality.test.mjs`

**Interfaces:**
- Consumes: reglas de `lib/storefront.ts`.
- Produces: query `view=lentes|ray-ban|ferrari|premium|relojes|best-sellers|offers`.

- [ ] **Step 1:** Extender la prueba de calidad para exigir los siete accesos,
  query estable y ausencia de texto `sin stock` dentro de opciones.
- [ ] **Step 2:** Ejecutar `npm run test:catalog` y confirmar el fallo nuevo.
- [ ] **Step 3:** Implementar cabecera de dos niveles con grupos `Lentes` y
  `Relojes`; usar `overflow-x-auto`, `scroll-snap-type` y enlaces reales.
- [ ] **Step 4:** Filtrar la tienda por `view`, conservar buscador/orden y
  renderizar selectores solo cuando existan dos o mas variantes disponibles.
- [ ] **Step 5:** Repetir la misma regla en ficha de producto y ejecutar
  `npm run test:catalog` hasta obtener cero fallos.
- [ ] **Step 6:** Commit `feat: add stock-aware storefront navigation`.

### Task 3: Popup, imagenes y precios

**Files:**
- Create: `components/product/ProductMedia.tsx`
- Modify: `components/promo/SessionOfferPopup.tsx`
- Modify: `components/brand/ProductGrid.tsx`
- Modify: `components/brand/BrandCarousel.tsx`
- Modify: `app/tienda/productos/[slug]/ProductDetailClient.tsx`
- Modify: `scripts/tiendanube/storefront-quality.test.mjs`

**Interfaces:**
- Consumes: `getDisplayPrice`, `getTransferPrice`, `getInstallmentPrice`.
- Produces: `ProductMedia` con `kind="eyewear" | "watch"` y marco circular.

- [ ] **Step 1:** Agregar aserciones para popup movil sin cambios, ancho
  desktop mayor, tres precios comerciales y enlaces de carrusel por slug.
- [ ] **Step 2:** Ejecutar `npm run test:catalog` y confirmar el fallo.
- [ ] **Step 3:** Cambiar el popup desktop a `max-w-[58rem]`, grilla horizontal
  y altura de contenido acotada; mantener intactas las clases base movil.
- [ ] **Step 4:** Implementar `ProductMedia`: lentes con `object-cover` y
  escala controlada; relojes con `object-contain` y padding interno.
- [ ] **Step 5:** Mostrar precio vigente, `20% OFF transferencia` y
  `6 cuotas de` tanto en tarjeta como ficha.
- [ ] **Step 6:** Asegurar que cada `Ver detalle` use el `slug` de su propio
  slide y ejecutar pruebas.
- [ ] **Step 7:** Commit `feat: polish product merchandising`.

### Task 4: Logos locales y marcas comprables

**Files:**
- Create: `components/brand/BrandLogoStrip.tsx`
- Create: `lib/brand-directory.ts`
- Create: `public/images/brands/*`
- Modify: `app/tienda/TiendaClient.tsx`
- Modify: `scripts/tiendanube/storefront-quality.test.mjs`

**Interfaces:**
- Produces: `BRAND_DIRECTORY` con nombre canonico, aliases, logo y destino.
- Consumes: `allProducts` para ocultar marcas sin stock.

- [ ] **Step 1:** Crear prueba que verifique logos locales, destino interno y
  deduplicacion de aliases como `Ray ban`, `Ray Ban`, `Rayban` y `RAY BAN`.
- [ ] **Step 2:** Ejecutar la prueba y confirmar el fallo.
- [ ] **Step 3:** Descargar o recrear desde fuentes oficiales los wordmarks
  necesarios y guardarlos localmente con fondo transparente.
- [ ] **Step 4:** Implementar grilla desktop y fila movil deslizable con
  `alt`, foco visible y enlaces internos.
- [ ] **Step 5:** Ejecutar `npm run test:catalog`.
- [ ] **Step 6:** Commit `feat: add browsable brand logo directory`.

### Task 5: Mas vendidos y checkout definitivo

**Files:**
- Create: `data/tiendanube-sales-ranking.json`
- Create: `scripts/tiendanube/sync-sales-ranking.mjs`
- Create: `scripts/tiendanube/sales-ranking.test.mjs`
- Modify: `package.json`
- Modify: `app/tienda/TiendaClient.tsx`
- Modify: `app/api/checkout/tiendanube/route.ts`
- Modify: `scripts/tiendanube/checkout-routes.test.mjs`

**Interfaces:**
- Produces: ranking por `product_id` de pedidos no cancelados de 90 dias.
- Consumes: `TIENDANUBE_ACCESS_TOKEN`, `TIENDANUBE_STORE_ID` y App Proxy.

- [ ] **Step 1:** Probar agregacion por cantidad, exclusion de cancelados,
  ventana de 90 dias y desempate estable.
- [ ] **Step 2:** Ejecutar la prueba y confirmar el fallo.
- [ ] **Step 3:** Implementar sincronizacion paginada de pedidos sin guardar
  datos personales; persistir solo `productId`, `units` y `updatedAt`.
- [ ] **Step 4:** Conectar `best-sellers` al ranking y usar ofertas automaticas
  para `offers`.
- [ ] **Step 5:** Verificar App Proxy real y configurar
  `TIENDANUBE_CHECKOUT_MODE=proxy` solo si el E2E llega al checkout correcto.
- [ ] **Step 6:** Ejecutar `npm run test:catalog`, `npm run test:nube-sdk` y
  `npm run build`.
- [ ] **Step 7:** Probar 390, 768, 1440 y 1920 px, corregir solapamientos y
  confirmar que el email tecnico no aparece.
- [ ] **Step 8:** Commit `feat: complete storefront client feedback`.

