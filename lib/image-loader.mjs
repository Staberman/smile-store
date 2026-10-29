// next/image loader (next.config.mjs, images.loaderFile). The site does not use
// Vercel's image optimization: its Hobby quota runs out, and every variant it
// has not cached then fails with 402. Image hosts that resize for free are
// asked for the size instead; everything else is served as it is. Plain
// JavaScript, deterministic and free of imports, so node:test checks the same
// URLs the browser requests. It never throws: an odd `src` comes back as given.

/**
 * Tiendanube's product image CDNs. Both serve every size of a product photo
 * by its file name suffix ("-480-0.webp"); the CloudFront one is the legacy
 * host and answers the same store paths with the same files.
 */
const TIENDANUBE_HOSTS = new Set(["dcdn-us.mitiendanube.com", "d1a9qnv764bsoo.cloudfront.net"]);

/** Widths Tiendanube serves as "-<width>-0", smallest first; larger requests get "-1024-1024". */
export const TIENDANUBE_WIDTHS = [50, 100, 240, 320, 480, 640];
const TIENDANUBE_LARGEST = "1024-1024";

/**
 * The size suffix at the end of a Tiendanube file name: "-640-0.webp",
 * "-1024-1024.png". Only the last one: names can repeat an older suffix
 * earlier ("…-640-0-7604c2…-1024-1024.webp"). Up to four digits each, so a
 * name ending in a long numeric id is not mistaken for one.
 */
const SIZE_SUFFIX = /-\d{1,4}-\d{1,4}(\.[a-z0-9]+)$/i;

const UNSPLASH_HOST = "images.unsplash.com";
const DEFAULT_QUALITY = 75;

/** The Tiendanube size for a requested width: the smallest one at least that wide. */
export function tiendanubeSize(width) {
  const size = TIENDANUBE_WIDTHS.find((candidate) => candidate >= width);
  return size === undefined ? TIENDANUBE_LARGEST : `${size}-0`;
}

function parseHttpUrl(src) {
  if (!/^https?:\/\//i.test(src)) return null;
  try {
    return new URL(src);
  } catch {
    return null;
  }
}

/** The URL next/image requests for `src` drawn `width` pixels wide. */
export default function imageLoader(props) {
  const { src, width, quality } = props ?? {};
  if (typeof src !== "string") return "";
  const url = parseHttpUrl(src);
  if (!url || !(width > 0)) return src;

  if (TIENDANUBE_HOSTS.has(url.hostname)) {
    if (!SIZE_SUFFIX.test(url.pathname)) return src;
    url.pathname = url.pathname.replace(SIZE_SUFFIX, `-${tiendanubeSize(width)}$1`);
    return url.toString();
  }

  if (url.hostname === UNSPLASH_HOST) {
    url.searchParams.set("w", String(Math.round(width)));
    url.searchParams.set("q", String(quality > 0 ? Math.round(quality) : DEFAULT_QUALITY));
    return url.toString();
  }

  return src;
}
