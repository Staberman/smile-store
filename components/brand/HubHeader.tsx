/**
 * Visible page heading of a collection hub: the page's only H1 and the
 * catalog-generated intro under it (lib/hubs.ts).
 */
export default function HubHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="border-b border-white/6 bg-[#0a0a0a] px-6 py-10 text-[#f0ece4] md:px-12 md:py-14">
      <div className="mx-auto max-w-7xl">
        {eyebrow && (
          <p className="text-[9px] uppercase tracking-[0.5em] text-[#c9a96e]">{eyebrow}</p>
        )}
        <h1 className="font-display mt-3 text-[2.3rem] font-light italic leading-[1.05] md:text-[3.4rem]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-[1.9] text-[#8b8580] md:text-[15px]">
          {intro}
        </p>
      </div>
    </section>
  );
}
