"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import type { SearchRow } from "@/lib/search-row";
import SearchOverlay, { type CloseReason } from "./SearchOverlay";
import { warmSearchData } from "./search-data";

type SiteSearch = {
  isOpen: boolean;
  /** Opens the overlay; focus returns to `trigger` when it closes. */
  open: (trigger: HTMLElement | null) => void;
  /** Starts loading the search data ahead of an opening. */
  warm: () => void;
};

const SiteSearchContext = createContext<SiteSearch | null>(null);

/** The site search, for the header buttons that open it; null outside the provider. */
export function useSiteSearch(): SiteSearch | null {
  return useContext(SiteSearchContext);
}

/**
 * Site-wide search overlay, mounted once in the root layout so the header of
 * every page (components/store/StoreShell.tsx, components/layout/Header.tsx)
 * can open it with a SearchButton. `featured` is built on the server
 * (lib/search-featured.ts), so the featured products need no request.
 */
export default function SiteSearchProvider({
  featured,
  children,
}: {
  featured: SearchRow[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = useCallback((trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
    warmSearchData();
    // Rendered and focused within the tap itself: phones only show the
    // keyboard for a field focused while handling the user's gesture.
    flushSync(() => setIsOpen(true));
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const close = useCallback((reason: CloseReason) => {
    setIsOpen(false);
    // Drop the history entry the opening added, so Back leaves the page as usual.
    if (reason === "dismiss" && window.history.state?.siteSearch === true) {
      window.history.back();
    }
    if (reason !== "navigate") triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const navigate = useCallback(
    (href: string) => {
      // Replacing the overlay's history entry: Back from the product page
      // returns to the page the search was opened on.
      const replace = window.history.state?.siteSearch === true;
      close("navigate");
      if (replace) router.replace(href);
      else router.push(href);
    },
    [close, router],
  );

  const value = useMemo(() => ({ isOpen, open, warm: warmSearchData }), [isOpen, open]);

  return (
    <SiteSearchContext.Provider value={value}>
      {children}
      <SearchOverlay
        open={isOpen}
        featured={featured}
        inputRef={inputRef}
        onClose={close}
        onNavigate={navigate}
      />
    </SiteSearchContext.Provider>
  );
}
