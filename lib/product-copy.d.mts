/** One "Clave: valor" line of a product description, e.g. Género: Unisex. */
export type ProductSpec = {
  name: string;
  value: string;
};

export function decodeHtmlEntities(value: string): string;
export function descriptionLines(html: string | null | undefined): string[];
export function splitDescription(lines: readonly string[]): {
  paragraphs: string[];
  specs: ProductSpec[];
};
