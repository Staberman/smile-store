export declare const STORE_INTRO_MIN_WORDS: number;
export declare const STORE_INTRO_MAX_WORDS: number;
/** Sunglasses brands named before "y otras marcas". */
export declare const STORE_INTRO_SUNGLASSES_BRANDS: number;

/** The homepage intro under the H1, from the shared store phrases and these brands. */
export function storeIntro(brands?: {
  sunglassesBrands?: readonly string[];
  watchBrands?: readonly string[];
}): string;
