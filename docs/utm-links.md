# Links con origen (UTM) y código Ref de WhatsApp

Cada mensaje de WhatsApp que llega desde la web termina con un código, por
ejemplo `(Ref I-329817846)`:

- **La letra** dice de dónde vino la visita (tabla de abajo).
- **El número** es el ID del producto en Tiendanube: el mismo que aparece en
  la dirección del producto en el administrador (`/admin/products/329817846`).
- **WEB** en lugar del número: la consulta no fue sobre un producto puntual.

## Links para pegar

Usá estos links en vez de la dirección sola de la web, así la visita queda
marcada con su origen.

| Dónde va | Link | Código |
| --- | --- | --- |
| Bio de Instagram | `https://smiletiendaimp.com.ar/?utm_source=instagram&utm_medium=social&utm_campaign=bio` | I |
| Historias de Instagram | `https://smiletiendaimp.com.ar/?utm_source=instagram&utm_medium=social&utm_campaign=stories` | I |
| Botón "Sitio web" del Perfil de Empresa de Google | `https://smiletiendaimp.com.ar/?utm_source=gbp&utm_medium=organic&utm_campaign=gbp` | M |
| Estados y mensajes de WhatsApp | `https://smiletiendaimp.com.ar/?utm_source=whatsapp&utm_medium=social&utm_campaign=estados` | W |

Para un producto, sumá lo mismo al final de su link. Por ejemplo, en una
historia: `https://smiletiendaimp.com.ar/tienda/productos/<producto>?utm_source=instagram&utm_medium=social&utm_campaign=stories`.

## Qué significa cada letra

| Código | Origen |
| --- | --- |
| G | Búsqueda de Google |
| S | Google Shopping y resultados de producto de Google |
| M | Google Maps y Perfil de Empresa de Google |
| B | Bing y otros buscadores |
| A | Asistentes de IA (ChatGPT, Perplexity, Gemini, Copilot, Claude) |
| I | Instagram |
| F | Facebook |
| W | Links compartidos por WhatsApp |
| D | Entró directo, sin origen conocido |
| O | Otro sitio |

La web guarda solo esa letra mientras dura la visita. No usa cookies ni datos
del cliente.

## Cómo anotar la Ref en el pedido manual

1. Cuando cierres una venta por WhatsApp, buscá el `(Ref ...)` al final del primer mensaje del cliente.
2. Al cargar el pedido manual en Tiendanube, pegá el código (por ejemplo `I-329817846`) en la nota del pedido.
3. Si el cliente borró el código, escribí `SIN-REF`.
4. Una venta, una Ref: si el cliente consultó varias veces, usá la del primer mensaje.

## Para el reporte mensual

Los clics quedan en Vercel Web Analytics como páginas virtuales:

- `/eventos/whatsapp/<página>/<código>/<ID de producto o web>`: consultas por WhatsApp.
- `/eventos/comprar/<producto>/<código>`: clics en "Comprar ahora".

El formato completo está documentado en `lib/visitor-events.mjs`.
