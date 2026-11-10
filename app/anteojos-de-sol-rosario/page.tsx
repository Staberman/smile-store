import LandingPage from "@/components/landings/LandingPage";
import StoreShell from "@/components/store/StoreShell";
import { landingMetadata, ROSARIO_LANDING } from "@/lib/landing-pages";

// Buying sunglasses from Rosario: prices and stock from the catalog, pickup
// and shipping from the shared store phrases (lib/landings/rosario.mjs).
export const metadata = landingMetadata(ROSARIO_LANDING);

export default function RosarioSunglassesPage() {
  return (
    <StoreShell>
      <LandingPage landing={ROSARIO_LANDING} />
    </StoreShell>
  );
}
