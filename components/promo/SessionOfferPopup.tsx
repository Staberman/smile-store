"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "smile-session-offer-seen";

export default function SessionOfferPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;

    const timeout = window.setTimeout(() => {
      setOpen(true);
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    }, 700);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/70 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-offer-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-[34rem] overflow-hidden rounded-t-2xl border border-white/10 bg-[#080706] text-[#f0ece4] shadow-[0_30px_90px_rgba(0,0,0,0.75)] md:max-w-[58rem] md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-sm text-white/55 transition hover:border-white/25 hover:text-white"
          aria-label="Cerrar promocion"
        >
          X
        </button>

        <div className="border-b border-white/8 bg-white/[0.03] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">
          Smile tienda oficial
        </div>

        <div className="grid gap-0 md:grid-cols-[1.35fr_0.65fr]">
          <div className="px-6 pb-7 pt-8 md:px-10 md:py-7">
            <p className="text-[10px] uppercase tracking-[0.36em] text-[#6a6560]">
              Beneficio activo
            </p>
            <h2
              id="session-offer-title"
              className="font-display mt-3 text-[2.5rem] font-light italic leading-[1.02] md:text-[2.8rem]"
            >
              Lentes originales
              <br />
              y premium
            </h2>
            <p className="mt-4 max-w-[24rem] text-sm leading-[1.8] text-[#8b8580]">
              Encontrá el modelo ideal con beneficios claros y asesoramiento
              personalizado antes y después de tu compra.
            </p>

            <div className="mt-5 grid gap-2 text-[11px] uppercase tracking-[0.2em] text-[#c9a96e] md:grid-cols-3">
              <span>Hasta 6 cuotas sin interés</span>
              <span>Envío gratis a todo el país</span>
              <span>Garantía y asesoramiento</span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-full bg-[#c9a96e] px-6 text-[11px] font-medium uppercase tracking-[0.24em] text-[#0a0a0a] transition hover:bg-[#e2c989]"
              >
                Ver colección
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-[11px] uppercase tracking-[0.24em] text-[#6a6560] transition hover:border-white/25 hover:text-[#f0ece4]"
              >
                Seguir mirando
              </button>
            </div>
          </div>

          <div className="relative hidden min-h-full border-l border-white/8 bg-[#0e0d0b] md:block">
            <div className="absolute inset-6 rounded-full border border-[#c9a96e]/25" />
            <div className="flex h-full min-h-[21rem] flex-col items-center justify-center px-6 text-center">
              <p className="font-display text-[4.8rem] font-light leading-none text-[#c9a96e]">
                20%
              </p>
              <p className="mt-2 text-[1.25rem] font-semibold uppercase tracking-[0.14em] text-[#f0ece4]">
                OFF
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-[#8b8580]">
                efectivo / transferencia
              </p>
              <div className="mt-6 h-px w-20 bg-[#c9a96e]/35" />
              <p className="mt-6 max-w-[10rem] text-[11px] uppercase leading-[1.8] tracking-[0.2em] text-[#f0ece4]">
                6 cuotas sin interes
              </p>
            </div>
          </div>
        </div>

        <p className="border-t border-white/8 px-6 py-3 text-[10px] leading-[1.6] text-[#4a4540] md:px-8">
          Beneficios sujetos a condiciones vigentes al momento de compra.
        </p>
      </div>
    </div>
  );
}
