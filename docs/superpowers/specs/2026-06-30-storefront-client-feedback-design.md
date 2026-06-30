# Ajustes comerciales y de navegacion de Smile

## Objetivo

Aplicar las devoluciones del cliente sin cambiar la identidad visual de Smile:
separar claramente lentes y relojes, facilitar el acceso a colecciones,
mostrar solo opciones comprables y reforzar precio, financiacion y confianza.

## Navegacion

- La cabecera de tienda tendra una fila comercial visible con: `Lentes`,
  `Ray-Ban`, `Scuderia Ferrari`, `Marcas premium`, `Relojes`,
  `Mas vendidos` y `Ofertas`.
- `Lentes` y `Relojes` seran los dos grupos principales y quedaran visualmente
  separados.
- En escritorio la fila ocupara el espacio central de la cabecera.
- En movil la fila sera horizontal, deslizable y con indicador de foco activo.
- La seleccion navegara a una vista filtrada de `/tienda`; no se duplicaran
  paginas ni catalogos.

## Catalogo y datos

- Solo se mostraran productos con al menos una variante publicada, con precio
  y stock mayor que cero.
- Los selectores incluiran exclusivamente variantes comprables.
- `Ofertas` se calculara con productos cuyo `promotionalPrice` sea menor que
  `price`.
- `Mas vendidos` se calculara automaticamente desde pedidos reales de
  Tiendanube. La primera version usara una ventana movil de 90 dias y omitira
  pedidos cancelados.
- Categorias, precios, promociones y stock seguiran sincronizados desde
  Tiendanube; la navegacion comercial sera curada para permanecer estable.

## Presentacion comercial

- El popup conservara exactamente el beneficio de `20% OFF` y las `6 cuotas`.
- En movil el popup no cambiara.
- En escritorio sera mas ancho y bajo, con una composicion horizontal que
  reduzca el vacio vertical.
- Las tarjetas mostraran el precio vigente, `20% OFF por transferencia` y el
  valor de cada una de las seis cuotas.
- Las imagenes conservaran el marco circular, con encuadre uniforme. Los
  relojes usaran mas aire alrededor del producto y los lentes ocuparan un
  porcentaje consistente del circulo.
- Cada slide del carrusel enlazara al producto que muestra.

## Marcas

- Se agregara una franja de marcas con logos locales y enlaces navegables.
- Solo se incluiran marcas con productos comprables.
- En escritorio se usara una grilla sobria; en movil, una fila deslizable.
- Los archivos se guardaran dentro de `public/images/brands` para evitar
  dependencias de terceros en tiempo de ejecucion.

## Checkout

- El flujo definitivo seguira siendo el App Proxy con NubeSDK ya implementado:
  un clic, producto unico y checkout nativo.
- El fallback de Draft Orders no se considera experiencia definitiva porque
  Tiendanube exige un email y lo muestra en checkout.
- El cambio a modo `proxy` solo se publicara despues de una prueba real que
  confirme producto, variante, precio y checkout sin email tecnico.

## Validacion

- Pruebas de catalogo para filtros, stock, ofertas, precios derivados y enlaces.
- Pruebas de integracion del checkout nativo.
- Revision visual en 390 px, 768 px, 1440 px y 1920 px.
- Prueba manual de todos los accesos de la cabecera, carrusel, logos y compra.

