// Where a visit came from, as one letter. The site classifies the source once,
// on the first page view of a session (lib/traffic-source-session.ts), and the
// letter travels in the WhatsApp contact message and the /eventos pageviews so
// a sale closed over WhatsApp can be traced back to a channel.
// Plain JavaScript so node:test checks the same rules the browser runs.

/** Every source code, with what it stands for. */
export const SOURCE_CODES = Object.freeze({
  G: "Google search",
  S: "Google Shopping and product results (srsltid)",
  M: "Google Maps and Business Profile",
  B: "Bing and other search engines",
  A: "AI assistants",
  I: "Instagram",
  F: "Facebook",
  W: "Links shared over WhatsApp",
  D: "Direct, no referrer, or unknown",
  O: "Other",
});

/** The code for a visit whose source is unknown. */
export const DIRECT_SOURCE = "D";

/** The sessionStorage key that holds the session's code: one letter, nothing else. */
export const TRAFFIC_SOURCE_STORAGE_KEY = "smile:traffic-source";

const CODES = new Set(Object.keys(SOURCE_CODES));

export function isSourceCode(value) {
  return typeof value === "string" && CODES.has(value);
}

// Referrer hosts, matched on the host or any subdomain of it. Order matters:
// gemini.google.com and maps.google.* are checked before Google search.
const AI_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "perplexity.ai",
  "gemini.google.com",
  "copilot.microsoft.com",
  "claude.ai",
];
const OTHER_SEARCH_HOSTS = [
  "bing.com",
  "duckduckgo.com",
  "yahoo.com",
  "ecosia.org",
  "search.brave.com",
  "yandex.com",
  "yandex.ru",
  "baidu.com",
];
const INSTAGRAM_HOSTS = ["instagram.com"];
const FACEBOOK_HOSTS = ["facebook.com"];
const WHATSAPP_HOSTS = ["whatsapp.com"];
// google.com, google.com.ar, google.co.uk, google.es...
const GOOGLE_HOST = /(?:^|\.)google\.(?:com?\.)?[a-z]{2,3}$/;
const GOOGLE_MAPS_HOST = /(?:^|\.)maps\.google\.(?:com?\.)?[a-z]{2,3}$/;
// The Google app on Android sends android-app://com.google.android.googlequicksearchbox/.
const GOOGLE_ANDROID_APP = "com.google.android.googlequicksearchbox";

// utm_source values that name a source instead of a host.
const SOURCE_NAMES = new Map([
  ["google", "G"],
  ["bing", "B"],
  ["yahoo", "B"],
  ["duckduckgo", "B"],
  ["ecosia", "B"],
  ["brave", "B"],
  ["yandex", "B"],
  ["baidu", "B"],
  ["chatgpt", "A"],
  ["openai", "A"],
  ["perplexity", "A"],
  ["gemini", "A"],
  ["copilot", "A"],
  ["claude", "A"],
  ["instagram", "I"],
  ["ig", "I"],
  ["facebook", "F"],
  ["fb", "F"],
  ["whatsapp", "W"],
  ["wa", "W"],
]);

// Lower case, without a leading "www.".
function normalizeHost(host) {
  return host.trim().toLowerCase().replace(/^www\./, "");
}

function matchesHost(host, domains) {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

// The code for a referrer or utm_source host, or null for a host no rule names.
function hostCode(host) {
  if (matchesHost(host, AI_HOSTS)) return "A";
  if (GOOGLE_MAPS_HOST.test(host)) return "M";
  if (GOOGLE_HOST.test(host) || host === GOOGLE_ANDROID_APP) return "G";
  if (matchesHost(host, OTHER_SEARCH_HOSTS)) return "B";
  if (matchesHost(host, INSTAGRAM_HOSTS)) return "I";
  if (matchesHost(host, FACEBOOK_HOSTS)) return "F";
  if (matchesHost(host, WHATSAPP_HOSTS)) return "W";
  return null;
}

function param(params, name) {
  return (params.get(name) ?? "").trim().toLowerCase();
}

// The code the UTM parameters name, or null when the URL has none.
function utmCode(params) {
  const source = param(params, "utm_source");
  const medium = param(params, "utm_medium");
  const campaign = param(params, "utm_campaign");
  // The Business Profile link is tagged utm_medium=organic, so it is checked first.
  if (source === "gbp" || campaign === "gbp") return "M";
  if (!source && !medium) return null;
  if (medium === "shopping") return "S";
  if (!source) return "O";
  return SOURCE_NAMES.get(source) ?? hostCode(normalizeHost(source)) ?? "O";
}

function referrerHost(referrer) {
  try {
    return normalizeHost(new URL(referrer).hostname);
  } catch {
    return null;
  }
}

/**
 * Classifies a visit, in this order:
 * 1. `previous`, the code already kept for the session, when valid: a session
 *    is classified once, and nothing later (an own-domain referrer included)
 *    replaces it.
 * 2. The UTM parameters of `search` (location.search), when present.
 * 3. `srsltid`, which Google adds to Shopping and organic product results: S.
 * 4. The `referrer` host (document.referrer). No referrer is direct (D); a
 *    host in `ownHosts` (or a subdomain of one) carries no source of its own
 *    and also counts as D; a host no rule names is other (O).
 */
export function classifySource({ search = "", referrer = "", ownHosts = [], previous = null } = {}) {
  if (isSourceCode(previous)) return previous;

  const params = new URLSearchParams(typeof search === "string" ? search : "");
  const tagged = utmCode(params);
  if (tagged) return tagged;
  if (params.has("srsltid")) return "S";

  if (typeof referrer !== "string" || referrer.trim() === "") return DIRECT_SOURCE;
  const host = referrerHost(referrer);
  if (!host) return "O";
  const own = ownHosts.filter((value) => typeof value === "string" && value).map(normalizeHost);
  if (matchesHost(host, own)) return DIRECT_SOURCE;
  return hostCode(host) ?? "O";
}
