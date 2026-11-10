// Visitor actions recorded as Vercel Web Analytics pageviews. Custom events
// cannot be viewed on the Hobby plan, so each action is a virtual pageview
// under /eventos, a prefix no real route uses, read back with
// `vercel metrics vercel.analytics_pageview.count --group-by request_path`.
// Plain JavaScript so node:test checks the same paths the site sends.
//
// Path format (SRC is the session's one-letter traffic source, see
// lib/traffic-source.mjs; productRef is a Tiendanube product id):
//
//   /eventos/comprar/<slug>/<SRC>
//   /eventos/whatsapp/<page>/<SRC>/<productRef|web>
//   /eventos/compartir/<page>
//
// <page> is the page the click happened on, as 1 to 4 lower-case segments
// ("home" for the homepage, "_otro" when unsafe). The contact's SRC and
// productRef are the "(Ref SRC-productRef)" code its message carries
// (lib/whatsapp-contact.mjs), so the event matches what the owner reads.
//
// Older paths, recorded before this format shipped (November 2026), stop at
// <slug> and <page>. Each is a prefix of the path the same click records now,
// so prefix filters keep matching both. To tell them apart, read from the end: in a current path the
// last (comprar) or second-to-last (whatsapp) segment is a single upper-case
// letter, which no slug or page segment can be. The routes are unchanged, so
// route-level totals continue across the change.

import { DIRECT_SOURCE, isSourceCode } from "./traffic-source.mjs";
import { contactRefFromHref } from "./whatsapp-contact.mjs";

const EVENTS_PREFIX = "/eventos";
const BUY_ROUTE = `${EVENTS_PREFIX}/comprar/[slug]`;
const WHATSAPP_ROUTE = `${EVENTS_PREFIX}/whatsapp`;
const SHARE_ROUTE = `${EVENTS_PREFIX}/compartir`;
// The last segment of a contact that is not about one product.
const GENERIC_REF_SEGMENT = "web";

// The site builds its contact links with components/contact/WhatsAppContactLink
// (WHATSAPP_URL from lib/store-facts.ts plus the prefilled message) and its
// share link in app/tienda/productos/[slug]/ProductDetailClient.tsx; a change
// to either format changes what is recorded here.
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

// A source code, or D when the source is unknown.
function sourceSegment(source) {
  return isSourceCode(source) ? source : DIRECT_SOURCE;
}

/**
 * The pageview that records a visitor starting the purchase of a product,
 * with the session's traffic `source`.
 */
export function buyEvent(slug, source) {
  const segment = isSafeSegment(slug) ? slug : OTHER_SEGMENT;
  return {
    route: BUY_ROUTE,
    path: `${EVENTS_PREFIX}/comprar/${segment}/${sourceSegment(source)}`,
  };
}

// The source and product segments of a contact: the reference its message
// ends with, or the session's `source` and "web" when it carries none.
function contactSegments(href, source) {
  const ref = contactRefFromHref(href);
  if (!ref) return [sourceSegment(source), GENERIC_REF_SEGMENT];
  return [ref.source, ref.productRef ?? GENERIC_REF_SEGMENT];
}

/**
 * The pageview that records opening a WhatsApp link from the page at
 * `pathname`: under /eventos/whatsapp for a chat with the store, under
 * /eventos/compartir for a share, and null for any other link. A chat also
 * records its traffic source and product reference (see the format above);
 * `source` is the session's, used when the link's message carries no
 * reference. The phone number and the message text never reach the event.
 */
export function whatsAppEvent(href, pathname, source) {
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
  const segments = pageSegments(pathname);
  if (route === WHATSAPP_ROUTE) segments.push(...contactSegments(href, source));
  return { route, path: `${route}/${segments.join("/")}` };
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
