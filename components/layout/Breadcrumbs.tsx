import Link from "next/link";
import type { Crumb } from "@/lib/collections";

/**
 * Visible breadcrumb trail. The last crumb is the current page and is not a
 * link. Build `trail` from lib/collections so it matches the page's
 * BreadcrumbList JSON-LD.
 */
export default function Breadcrumbs({
  trail,
  className = "border-b border-white/6 px-6 py-5 md:px-12",
  currentColor = "#6a6560",
}: {
  trail: Crumb[];
  className?: string;
  currentColor?: string;
}) {
  const parents = trail.slice(0, -1);
  const current = trail[trail.length - 1];

  return (
    <nav aria-label="Migas de pan" className={className}>
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1 text-[9px] uppercase tracking-[0.3em] text-[#4a4540]">
        {parents.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-2">
            <Link href={crumb.href} className="transition hover:text-[#f0ece4]">
              {crumb.name}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
        ))}
        {current && (
          <li>
            <span style={{ color: currentColor }} aria-current="page">
              {current.name}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}
