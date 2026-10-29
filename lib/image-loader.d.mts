/** What next/image passes to a custom loader. */
export type ImageLoaderProps = { src: string; width: number; quality?: number };

/** Widths Tiendanube serves as "-<width>-0"; larger requests get "-1024-1024". */
export declare const TIENDANUBE_WIDTHS: readonly number[];
/** The Tiendanube size suffix for a requested width ("480-0", "1024-1024"). */
export function tiendanubeSize(width: number): string;
/** The URL next/image requests: resized on Tiendanube and Unsplash, else `src` unchanged. */
export default function imageLoader(props: ImageLoaderProps): string;
