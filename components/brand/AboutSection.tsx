// Who Smile is, as a closing section styled like FaqSection. The homepage
// passes the paragraph built by lib/store-intro.mjs, so brands and store terms
// come from the catalog and lib/store-copy.mjs, never from this file.
export default function AboutSection({ intro }: { intro: string }) {
  return (
    <section
      id="sobre-smile"
      className="border-t border-white/6 bg-[#0a0a0a] px-6 py-12 text-[#f0ece4] md:px-12 md:py-16"
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-[9px] uppercase tracking-[0.4em] text-[#4a4540]">
          Sobre Smile
        </p>
        <h2 className="font-display mt-2 text-xl font-light italic text-[#f0ece4] md:text-2xl">
          Quiénes somos
        </h2>
        <p className="mt-4 text-[13px] leading-[1.8] text-[#8b8580]">{intro}</p>
      </div>
    </section>
  );
}
