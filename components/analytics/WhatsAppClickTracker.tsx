"use client";

import { useEffect } from "react";
import { pageview } from "@vercel/analytics";
import { opensLink, whatsAppEvent } from "@/lib/visitor-events.mjs";

// Records each WhatsApp link a visitor opens, wherever the link is rendered
// (floating button, contact page, product share link), with one delegated
// listener instead of a handler per link. It is the only place these clicks
// are recorded, so a link must not record its own.
export default function WhatsAppClickTracker() {
  useEffect(() => {
    const handleOpen = (event: MouseEvent) => {
      if (!opensLink(event.type, event.button)) return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(link instanceof HTMLAnchorElement)) return;

      const visit = whatsAppEvent(link.href, window.location.pathname);
      if (!visit) return;
      try {
        pageview(visit);
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
