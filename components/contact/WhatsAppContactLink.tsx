"use client";

import type { AnchorHTMLAttributes } from "react";
import { WHATSAPP_URL } from "@/lib/store-facts";
import { useTrafficSource } from "@/lib/traffic-source-session";
import {
  contactMessage,
  SERVER_CONTACT_MESSAGE,
  whatsAppContactUrl,
  type ContactProduct,
} from "@/lib/whatsapp-contact.mjs";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** The product the chat is about; the generic store message without one. */
  product?: ContactProduct | null;
};

/**
 * A link that opens a chat with the store, with the message and its reference
 * code typed in. The server HTML carries the generic message with Ref D-WEB,
 * which works without JavaScript; once hydrated, the link names the session's
 * traffic source and the product. Clicks are recorded by WhatsAppClickTracker.
 */
export default function WhatsAppContactLink({
  product = null,
  target = "_blank",
  rel = "noopener noreferrer",
  children,
  ...anchorProps
}: Props) {
  const source = useTrafficSource();
  const message = source ? contactMessage({ source, product }) : SERVER_CONTACT_MESSAGE;

  return (
    <a {...anchorProps} href={whatsAppContactUrl(WHATSAPP_URL, message)} target={target} rel={rel}>
      {children}
    </a>
  );
}
