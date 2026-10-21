"use client";

import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/product/FavoriteButton";
import {
  formatArs,
  snapshotPrice,
  useFavorites,
  type ProductSnapshot,
} from "@/lib/browser-lists";

const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23181410'/%3E%3Ctext x='300' y='300' text-anchor='middle' fill='%23c9a96e' font-family='Arial' font-size='44'%3ESMILE%3C/text%3E%3C/svg%3E";

export default function FavoritosClient() {
  const { items, count, mounted } = useFavorites();

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 pb-24 pt-28 text-[#f0ece4] md:px-12 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#4a4540]">
            Tu selección
          </p>
          <h1 className="font-display mt-2 text-[2.4rem] font-light italic md:text-[3rem]">
            Favoritos
          </h1>
          {mounted && count > 0 && (
            <p className="mt-2 text-sm text-[#8b8580]">
              {count} {count === 1 ? "pieza guardada" : "piezas guardadas"}
            </p>
          )}
        </header>

        {/* Stable placeholder until localStorage is read on the client. */}
        {!mounted ? (
          <div className="py-24 text-center text-sm text-[#4a4540]">
            Cargando tus favoritos…
          </div>
        ) : count === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <FavoriteCard key={item.slug} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c9a96e"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-light italic text-[#f0ece4]">
        Todavía no guardaste favoritos
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[#8b8580]">
        Tocá el corazón en cualquier producto para guardarlo acá y encontrarlo
        más rápido.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-full bg-[#c9a96e] px-7 text-[11px] uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#e2c989]"
      >
        Explorar la tienda
      </Link>
    </div>
  );
}

function FavoriteCard({ item }: { item: ProductSnapshot }) {
  const price = snapshotPrice(item);

  return (
    <div className="group relative overflow-hidden rounded-[1.4rem] border border-white/8 bg-white/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a96e]/45">
      <FavoriteButton
        item={item}
        size={17}
        className="absolute right-3 top-3 z-10 h-9 w-9"
      />

      <Link href={item.href} className="block">
        <div className="relative flex h-52 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.12),rgba(18,16,16,0)_62%)]">
          <div className="relative h-36 w-36 overflow-hidden rounded-full border border-[#c9a96e]/20 bg-[#e9e6df]">
            <Image
              src={item.image || IMAGE_FALLBACK}
              alt={item.name}
              fill
              sizes="144px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ filter: "brightness(0.96) contrast(1.03)" }}
            />
          </div>
        </div>
      </Link>

      <div className="p-5">
        <p className="text-[9px] uppercase tracking-[0.28em] text-[#8b8580]">
          {item.brand}
        </p>
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight text-[#f0ece4]">
          {item.name}
        </h3>
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="text-[13px]" style={{ color: "#c9a96e" }}>
            {formatArs(price)}
          </p>
          <Link
            href={item.href}
            className="inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-[10px] uppercase tracking-[0.18em] transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
            style={{ borderColor: "#2a2520", color: "#6a6560" }}
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
