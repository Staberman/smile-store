import type { Metadata } from "next";
import ProbadorAR from "./ProbadorAR";

export const metadata: Metadata = {
  title: "Probador AR — Prototipo",
  description:
    "Prototipo de probador virtual: probate anteojos Ray-Ban en tiempo real con la cámara de tu dispositivo.",
  robots: { index: false, follow: false },
};

export default function ProbarARPage() {
  return <ProbadorAR />;
}
