"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ContactProduct } from "@/lib/whatsapp-contact.mjs";

// The product the current page is about, for contact links rendered outside
// the page (the floating WhatsApp button lives in the root layout). The
// product page announces it while mounted; every other page has none.

let pageProduct: ContactProduct | null = null;
const listeners = new Set<() => void>();

function publish(product: ContactProduct | null): void {
  pageProduct = product;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const currentProduct = () => pageProduct;
const noProductOnServer = () => null;

/** The product the current page is about, or null (always null on the server). */
export function usePageContactProduct(): ContactProduct | null {
  return useSyncExternalStore(subscribe, currentProduct, noProductOnServer);
}

/**
 * Announces `product` as the current page's product while the calling
 * component is mounted. Pass a memoized object: a new one re-announces it.
 */
export function useAnnouncePageContactProduct(product: ContactProduct | null): void {
  useEffect(() => {
    if (!product) return;
    publish(product);
    return () => {
      // The next product page may already have announced its own.
      if (pageProduct === product) publish(null);
    };
  }, [product]);
}
