"use client";

import { useSyncExternalStore } from "react";
import { TIENDANUBE_STORE_URL } from "@/lib/store-facts";
import {
  classifySource,
  TRAFFIC_SOURCE_STORAGE_KEY,
  type SourceCode,
} from "@/lib/traffic-source.mjs";

// The session's traffic source, classified once on the first page view and
// kept in sessionStorage: one letter, no cookie, nothing about the visitor.
// Client-side navigations keep the page loaded, so the code is also kept in
// memory; that covers the rest of the page load when storage is blocked.

let pageLoadSource: SourceCode | null = null;

// Besides the site's current host (www or not, production or preview), the
// Tiendanube storefront the checkout runs on is the store's own.
const TIENDANUBE_HOST = new URL(TIENDANUBE_STORE_URL).hostname;

function readStoredSource(): string | null {
  try {
    return window.sessionStorage.getItem(TRAFFIC_SOURCE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeSource(code: SourceCode): void {
  try {
    window.sessionStorage.setItem(TRAFFIC_SOURCE_STORAGE_KEY, code);
  } catch {
    // Storage blocked or full: the code stays in memory for this page load,
    // and a later full page load classifies its own visit.
  }
}

/**
 * The session's traffic source. Browser only: the first call of a session
 * classifies the visit and keeps the code; later calls return it.
 */
export function currentTrafficSource(): SourceCode {
  if (pageLoadSource) return pageLoadSource;
  const stored = readStoredSource();
  const code = classifySource({
    previous: stored,
    search: window.location.search,
    referrer: document.referrer,
    ownHosts: [window.location.hostname, TIENDANUBE_HOST],
  });
  if (stored !== code) storeSource(code);
  pageLoadSource = code;
  return code;
}

// The source never changes during a page load, so there is nothing to
// subscribe to.
const subscribeToNothing = () => () => {};
const unknownOnServer = () => null;

/**
 * The session's traffic source in a component: null on the server and while
 * hydrating, so the first client render matches the server HTML, then the
 * code (React re-renders once after hydration when they differ).
 */
export function useTrafficSource(): SourceCode | null {
  return useSyncExternalStore(subscribeToNothing, currentTrafficSource, unknownOnServer);
}
