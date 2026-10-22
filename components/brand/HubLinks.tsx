import Link from "next/link";

export type HubLink = { label: string; href: string };

/**
 * Plain links to related hubs (the Ray-Ban models on the Ray-Ban hub, the
 * hombre / mujer sections on Relojes…), so crawlers and visitors reach them.
 * Renders nothing without links.
 */
export default function HubLinks({
  eyebrow,
  title,
  links,
}: {
  eyebrow?: string;
  title: string;
  links: HubLink[];
}) {
  if (links.length === 0) return null;

  return (
    <section className="border-b border-white/6 bg-[#0a0a0a] px-6 py-10 text-[#f0ece4] md:px-12">
      <div className="mx-auto max-w-7xl">
        {eyebrow && (
          <p className="text-[9px] uppercase tracking-[0.44em] text-[#c9a96e]">{eyebrow}</p>
        )}
        <h2 className="font-display mt-2 text-xl font-light italic md:text-2xl">{title}</h2>
        <ul className="mt-5 flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                prefetch={false}
                className="inline-flex min-h-11 items-center rounded-full border border-white/12 px-5 text-[10px] uppercase tracking-[0.22em] text-[#b8b0a4] transition hover:border-[#c9a96e] hover:text-[#f0ece4]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
