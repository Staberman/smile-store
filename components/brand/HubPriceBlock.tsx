import type { HubPriceBlock as HubPriceBlockData } from "@/lib/collection-hubs.mjs";

/**
 * Price summary under a hub's heading: the range of the products in stock,
 * computed at build time (lib/collection-hubs.mjs, hubPriceBlock).
 */
export default function HubPriceBlock({ block }: { block: HubPriceBlockData }) {
  return (
    <section className="border-b border-white/6 bg-[#0a0a0a] px-6 py-8 text-[#f0ece4] md:px-12">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-[10px] uppercase tracking-[0.28em] text-[#c9a96e]">{block.heading}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {block.facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-[10px] uppercase tracking-[0.28em] text-[#6a6560]">{fact.label}</dt>
              <dd className="mt-2 text-sm leading-[1.7] text-[#f0ece4]">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
