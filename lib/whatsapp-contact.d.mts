import type { SourceCode } from "./traffic-source.mjs";

/** The product a chat is about: its display name and Tiendanube id reference. */
export type ContactProduct = { name: string; ref: string | null };

/** The reference used when the chat is not about one product. */
export declare const GENERIC_REF: "WEB";
/** The message in the server-rendered HTML: generic, with Ref D-WEB. */
export declare const SERVER_CONTACT_MESSAGE: string;

/** The reference for a product: its Tiendanube id as a string, or null. */
export function productRef(tiendanubeProductId: unknown): string | null;
/** The prefilled message, ending with "(Ref <SRC>-<productRef|WEB>)". */
export function contactMessage(options?: {
  source?: string | null;
  product?: ContactProduct | null;
}): string;
/** A wa.me chat link that opens with `message` typed in. */
export function whatsAppContactUrl(baseUrl: string, message: string): string;
/** The reference a contact link's message carries, or null. */
export function contactRefFromHref(
  href: string,
): { source: SourceCode; productRef: string | null } | null;
