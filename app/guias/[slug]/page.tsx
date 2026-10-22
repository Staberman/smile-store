import { notFound } from "next/navigation";
import GuideArticle from "@/components/guides/GuideArticle";
import JsonLd from "@/components/seo/JsonLd";
import { getGuide, guideMetadata, guideSchema, GUIDES } from "@/lib/guide-pages";

// One static page per guide in lib/guides; any other slug is a 404.
export const dynamicParams = false;

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

function guideOrNotFound(slug: string) {
  const guide = getGuide(slug);
  if (!guide) notFound();
  return guide;
}

export function generateMetadata({ params }: Props) {
  return guideMetadata(guideOrNotFound(params.slug));
}

export default function GuidePage({ params }: Props) {
  const guide = guideOrNotFound(params.slug);

  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={guideSchema(guide)} />
      <GuideArticle guide={guide} />
    </main>
  );
}
