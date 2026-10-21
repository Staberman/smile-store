"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * MINIMAL per-product snapshot persisted to localStorage the moment a user
 * favorites or views a product. This is deliberately tiny: favorites and
 * recently-viewed render straight from these snapshots, so the full ~1MB
 * catalog is NEVER imported into a client bundle for these features.
 */
export type ProductSnapshot = {
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  price: number | null;
  promotionalPrice: number | null;
  href: string;
};

export const FAVORITES_KEY = "smile:favorites";
export const RECENTLY_VIEWED_KEY = "smile:recently-viewed";
const RECENTLY_VIEWED_CAP = 8;

/**
 * Local ARS formatter. Intentionally NOT imported from `@/lib/catalog`, whose
 * module also imports the full catalog JSON — importing anything from it into a
 * standalone client component would risk bundling the ~1MB catalog. Favorites &
 * recently-viewed render only from snapshots, so they format prices here.
 */
export function formatArs(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Consultar";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Snapshot display price mirrors the storefront rule: promo overrides base. */
export function snapshotPrice(item: ProductSnapshot): number | null {
  return item.promotionalPrice ?? item.price;
}

function isSnapshot(value: unknown): value is ProductSnapshot {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.slug === "string" && typeof item.href === "string";
}

/** Keep only the 7 snapshot fields — never spread a full product object in. */
function normalize(item: ProductSnapshot): ProductSnapshot {
  return {
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    image: item.image ?? null,
    price: item.price ?? null,
    promotionalPrice: item.promotionalPrice ?? null,
    href: item.href,
  };
}

function readList(key: string): ProductSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSnapshot).map(normalize) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, items: ProductSnapshot[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Quota exceeded / private mode / disabled storage — fail silently.
  }
}

/** Subscribe to cross-tab changes for a single key; re-reads on match. */
function useStorageSync(key: string, apply: (items: ProductSnapshot[]) => void): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    apply(readList(key));
    setMounted(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) apply(readList(key));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // apply is stable (setState updater); key is constant per hook instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return mounted;
}

export function useFavorites() {
  const [items, setItems] = useState<ProductSnapshot[]>([]);
  const mounted = useStorageSync(FAVORITES_KEY, setItems);

  const isFavorite = useCallback(
    (slug: string) => items.some((item) => item.slug === slug),
    [items],
  );

  const toggle = useCallback((item: ProductSnapshot) => {
    setItems((prev) => {
      const exists = prev.some((entry) => entry.slug === item.slug);
      const next = exists
        ? prev.filter((entry) => entry.slug !== item.slug)
        : [normalize(item), ...prev];
      writeList(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((prev) => {
      const next = prev.filter((entry) => entry.slug !== slug);
      writeList(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  return { items, isFavorite, toggle, remove, count: items.length, mounted };
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<ProductSnapshot[]>([]);
  const mounted = useStorageSync(RECENTLY_VIEWED_KEY, setItems);

  const record = useCallback((item: ProductSnapshot) => {
    setItems((prev) => {
      const deduped = prev.filter((entry) => entry.slug !== item.slug);
      const next = [normalize(item), ...deduped].slice(0, RECENTLY_VIEWED_CAP);
      writeList(RECENTLY_VIEWED_KEY, next);
      return next;
    });
  }, []);

  return { items, record, mounted };
}
