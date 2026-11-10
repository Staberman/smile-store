"use client";

import { useEffect } from "react";
import { pageview } from "@vercel/analytics";
import { currentTrafficSource } from "@/lib/traffic-source-session";
import { opensLink, whatsAppEvent } from "@/lib/visitor-events.mjs";

// Records each WhatsApp link a visitor opens, wherever the link is rendered
// (floating button, contact page, product page links), with one delegated
// listener instead of a handler per link. It is the only place these clicks
// are recorded, so a link must not record its own.
export default function WhatsAppClickTracker() {
  useEffect(() => {
    // Rendered on every page, so the first page view of a session classifies
    // its traffic source here, while location.search and document.referrer
    // still describe the landing.
    currentTrafficSource();

    const handleOpen = (event: MouseEvent) => {
      if (!opensLink(event.type, event.button)) return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(link instanceof HTMLAnchorElement)) return;

      try {
        const visit = whatsAppEvent(link.href, window.location.pathname, currentTrafficSource());
        if (visit) pageview(visit);
      } catch {
        // Analytics is best effort: the link still opens.
      }
    };

    // Capture phase, so a link's own handler cannot stop the click from being
    // seen. The analytics script posts with a keepalive fetch, which outlives
    // the page when the link opens in the same tab.
    document.addEventListener("click", handleOpen, true);
    document.addEventListener("auxclick", handleOpen, true);
    return () => {
      document.removeEventListener("click", handleOpen, true);
      document.removeEventListener("auxclick", handleOpen, true);
    };
  }, []);

  return null;
}
