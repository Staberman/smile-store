/** One letter naming where a visit came from (see SOURCE_CODES). */
export type SourceCode = "G" | "S" | "M" | "B" | "A" | "I" | "F" | "W" | "D" | "O";

/** Every source code, with what it stands for. */
export declare const SOURCE_CODES: Readonly<Record<SourceCode, string>>;
/** The code for a visit whose source is unknown. */
export declare const DIRECT_SOURCE: "D";
/** The sessionStorage key that holds the session's code. */
export declare const TRAFFIC_SOURCE_STORAGE_KEY: string;

export function isSourceCode(value: unknown): value is SourceCode;

export type TrafficVisit = {
  /** location.search of the page. */
  search?: string;
  /** document.referrer. */
  referrer?: string;
  /** The site's own hosts: a referrer on one of them names no source. */
  ownHosts?: readonly string[];
  /** The code already kept for the session, if any. */
  previous?: string | null;
};

/**
 * Classifies a visit: the session's previous code, then UTM parameters, then
 * srsltid, then the referrer host.
 */
export function classifySource(visit?: TrafficVisit): SourceCode;
