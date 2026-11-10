/** A virtual pageview: the argument `pageview()` from @vercel/analytics takes. */
export type VisitorEvent = { route: string; path: string };

/**
 * The pageview that records a visitor starting the purchase of a product:
 * /eventos/comprar/<slug>/<SRC>, with the session's traffic `source`.
 */
export function buyEvent(slug: string, source: string | null | undefined): VisitorEvent;
/**
 * The pageview that records opening a WhatsApp link from the page at
 * `pathname`: /eventos/whatsapp/<page>/<SRC>/<productRef|web> for a chat with
 * the store, /eventos/compartir/<page> for a share, and null for any other
 * link. `source` is the session's, used when the link carries no reference.
 */
export function whatsAppEvent(
  href: string,
  pathname: string,
  source?: string | null,
): VisitorEvent | null;
/** Whether a mouse event (`click` or `auxclick`) opens the link under it. */
export function opensLink(type: string, button: number): boolean;
