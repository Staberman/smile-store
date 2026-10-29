// Visitor actions recorded as Vercel Web Analytics pageviews. Custom events
// cannot be viewed on the Hobby plan, so each action is a virtual pageview
// under /eventos, a prefix no real route uses, read back with
// `vercel metrics vercel.analytics_pageview.count --group-by request_path`.
// Plain JavaScript so node:test checks the same paths the site sends.

const EVENTS_PREFIX = "/eventos";
const BUY_ROUTE = `${EVENTS_PREFIX}/comprar/[slug]`;
const WHATSAPP_ROUTE = `${EVENTS_PREFIX}/whatsapp`;
const SHARE_ROUTE = `${EVENTS_PREFIX}/compartir`;

// The site builds its WhatsApp links as WHATSAPP_URL (lib/store-facts.ts) for
// contact and as the share link in
// app/tienda/productos/[slug]/ProductDetailClient.tsx; a change to either
// format changes what is recorded here.
const WHATSAPP_LINK_PREFIX = "https://wa.me/";
// wa.me/<number> opens a chat with the store; wa.me/ without a number lets the
// visitor pick a chat to share the page with.
const CONTACT_TARGET = /^\d+(?:[?#]|$)/;
const SHARE_TARGET = /^(?:[?#]|$)/;

// The homepage path has no segment of its own.
const HOME_SEGMENT = "home";
// Stands in for a page path or slug the event cannot repeat. The leading
// underscore keeps it apart from every real route segment and product slug.
const OTHER_SEGMENT = "_otro";

// The shape of the site's route segments and product slugs. Anything else
// (upper case, encoded characters, text typed into the address bar) is never
// copied into an event path.
const SAFE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SEGMENT_LENGTH = 80;
// The deepest real page is /tienda/marcas/premium/<brand>.
const MAX_SEGMENTS = 4;

function isSafeSegment(segment) {
  return (
    typeof segment === "string" &&
    segment.length <= MAX_SEGMENT_LENGTH &&
    SAFE_SEGMENT.test(segment)
  );
}

// The page a click happened on, as event path segments: no query string or
// fragment, no empty segments (so trailing and repeated slashes collapse), and
// a single OTHER_SEGMENT when the path is too deep or not route-like.
function pageSegments(pathname) {
  if (typeof pathname !== "string") return [OTHER_SEGMENT];
  const segments = pathname.split(/[?#]/, 1)[0].split("/").filter(Boolean);
  if (segments.length === 0) return [HOME_SEGMENT];
  if (segments.length > MAX_SEGMENTS || !segments.every(isSafeSegment)) {
    return [OTHER_SEGMENT];
  }
  return segments;
}

/** The pageview that records a visitor starting the purchase of a product. */
export function buyEvent(slug) {
  const segment = isSafeSegment(slug) ? slug : OTHER_SEGMENT;
  return { route: BUY_ROUTE, path: `${EVENTS_PREFIX}/comprar/${segment}` };
}

/**
 * The pageview that records opening a WhatsApp link from the page at
 * `pathname`: under /eventos/whatsapp for a chat with the store, under
 * /eventos/compartir for a share, and null for any other link. Only the page
 * is kept: the link's phone number and message never reach the event.
 */
export function whatsAppEvent(href, pathname) {
  if (typeof href !== "string" || !href.startsWith(WHATSAPP_LINK_PREFIX)) {
    return null;
  }
  const target = href.slice(WHATSAPP_LINK_PREFIX.length);
  const route = CONTACT_TARGET.test(target)
    ? WHATSAPP_ROUTE
    : SHARE_TARGET.test(target)
      ? SHARE_ROUTE
      : null;
  if (!route) return null;
  return { route, path: `${route}/${pageSegments(pathname).join("/")}` };
}

/**
 * Whether a mouse event opens the link under it: a primary click (plain, with
 * ctrl/cmd or shift, or Enter on a focused link) or a middle click. Browsers
 * fire `click` for the first and `auxclick` for the second, never both, so one
 * opening counts once. A right click only opens the context menu.
 */
export function opensLink(type, button) {
  return (type === "click" && button === 0) || (type === "auxclick" && button === 1);
}
