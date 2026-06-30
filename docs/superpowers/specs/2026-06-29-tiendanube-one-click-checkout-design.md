# Checkout Tiendanube de un clic

## Objetivo

El boton `Comprar ahora` de Smile debe llevar al comprador al checkout de
Tiendanube con el producto y la variante seleccionada, sin mostrar carrito,
ficha nativa ni formulario previo.

## Restricciones confirmadas

- La API publica no ofrece un endpoint para crear un carrito anonimo.
- Draft Orders exige nombre, apellido y e-mail antes de generar el checkout,
  por lo que no cumple la experiencia solicitada.
- Nube SDK permite agregar una variante mediante `cart:add`, pero solo dentro
  del runtime del storefront o checkout de Tiendanube.
- App Proxy permite ingresar a una ruta bajo el dominio de Tiendanube y
  delegar su contenido a un backend externo. Su activacion requiere soporte de
  Tiendanube.

## Arquitectura

1. Smile genera un enlace de compra con `product_id`, `variant_id`, cantidad y
   una firma de corta duracion.
2. El enlace abre `/apps/smile-comprar` en
   `smiletienda.mitiendanube.com`.
3. App Proxy valida la firma y entrega una pantalla de transicion minima,
   accesible y con identidad Smile.
4. La aplicacion Nube SDK lee los IDs validados y envia `cart:add`.
5. Al recibir `cart:add:success`, navega a la ruta de checkout de la tienda.
6. Ante `cart:add:fail`, muestra un mensaje claro y permite volver a la ficha
   de Smile.

## Experiencia

- Un clic en `Comprar ahora`.
- Unicamente se muestra una transicion breve: `Preparando tu compra...`.
- El siguiente paso visible es el checkout de Tiendanube.
- Datos personales, entrega y pago se completan una sola vez en el checkout.
- No existe carrito visible ni contacto previo.

## Seguridad

- Solo se aceptan productos y variantes presentes y disponibles en el
  catalogo local.
- La cantidad inicial queda limitada a `1`.
- Los parametros incluyen expiracion y firma HMAC.
- El secreto de firma y el token de Tiendanube permanecen en Vercel.
- La redireccion solo admite rutas internas de
  `smiletienda.mitiendanube.com`.
- Se limita la frecuencia de intentos para evitar abuso.

## Componentes

- Boton Smile: construye la solicitud de compra para la variante seleccionada.
- Route Handler Next.js: valida stock y emite el enlace firmado.
- App Proxy: recibe y valida la solicitud dentro del dominio Tiendanube.
- Aplicacion Nube SDK: agrega la variante y navega al checkout.
- Pantalla de error: vuelve a Smile sin exponer detalles internos.

## Validacion

La implementacion se considera lista solo si pasan:

- Compra de producto con una unica variante.
- Compra de producto con multiples variantes.
- Variante sin stock bloqueada.
- Firma invalida o vencida rechazada.
- `cart:add:fail` con recuperacion visible.
- Navegacion movil y escritorio desde Smile hasta el checkout.
- Confirmacion visual de que producto, variante y precio coinciden.

## Dependencia externa

Antes del lanzamiento, Tiendanube debe habilitar App Proxy para la aplicacion
`Smile Stock Sync` (`35403`) con el prefijo `smile-comprar` y la URL base que
se despliegue en Vercel. Hasta recibir esa habilitacion no se reemplaza el
checkout de produccion por este flujo.
