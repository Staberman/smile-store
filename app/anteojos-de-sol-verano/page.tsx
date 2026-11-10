import LandingPage from "@/components/landings/LandingPage";
import StoreShell from "@/components/store/StoreShell";
import { landingMetadata, SUMMER_LANDING } from "@/lib/landing-pages";

// Sunglasses for the coming summer, at a URL without the year: the season
// label follows the build date (lib/landings/verano.mjs).
export const metadata = landingMetadata(SUMMER_LANDING);

export default function SummerSunglassesPage() {
  return (
    <StoreShell>
      <LandingPage landing={SUMMER_LANDING} />
    </StoreShell>
  );
}
