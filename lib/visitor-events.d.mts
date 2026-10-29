/** A virtual pageview: the argument `pageview()` from @vercel/analytics takes. */
export type VisitorEvent = { route: string; path: string };

/** The pageview that records a visitor starting the purchase of a product. */
export function buyEvent(slug: string): VisitorEvent;
/**
 * The pageview that records opening a WhatsApp link from the page at
 * `pathname`: under /eventos/whatsapp for a chat with the store, under
 * /eventos/compartir for a share, and null for any other link.
 */
export function whatsAppEvent(href: string, pathname: string): VisitorEvent | null;
/** Whether a mouse event (`click` or `auxclick`) opens the link under it. */
export function opensLink(type: string, button: number): boolean;
