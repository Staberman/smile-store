// Landing pages for search intents the hubs and guides do not answer on their
// own: buying sunglasses in Rosario (/anteojos-de-sol-rosario) and the summer
// season (/anteojos-de-sol-verano). Each module builds its page as data from
// the catalog; lib/landing-pages.ts wires them to the app. Their sections use
// the guides' block format, so guideText() and guideLinks() read them too.
import { guideLinks, guideText } from "../guides/guides.mjs";
import { rosarioLanding } from "./rosario.mjs";
import { summerLanding } from "./verano.mjs";

export { ROSARIO_DATES, rosarioLanding } from "./rosario.mjs";
export {
  giftBands,
  isOnSale,
  LANDING_GRID_LIMIT,
  landingLinks,
  LANDING_PATHS,
  saleProducts,
  statesUvProtection,
  summerSeason,
} from "./shared.mjs";
export { MIN_BEST_SELLERS, SUMMER_DATES, summerLanding } from "./verano.mjs";

/** Both landing pages, Rosario first. */
export function buildLandings(context) {
  return [rosarioLanding(context), summerLanding(context)];
}

/** Visible text without link markup: H1, lead, sections and FAQ. */
export function landingText(landing) {
  return guideText(landing);
}

/** Internal hrefs the page body links to (inline links and link lists). */
export function landingHrefs(landing) {
  return guideLinks(landing);
}
