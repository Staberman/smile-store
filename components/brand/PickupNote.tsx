import { STORE_LOCATION, STORE_PICKUP_PHRASE } from "@/lib/store-facts";

/** Pickup line for product pages, under the trust highlights. */
export default function PickupNote() {
  return (
    <p className="mx-auto mt-6 max-w-7xl border-t border-white/6 pt-5 text-sm leading-[1.7] text-[#6a6560]">
      <span className="mr-3 text-[10px] uppercase tracking-[0.28em] text-[#c9a96e]">
        Retiro en {STORE_LOCATION.locality}
      </span>
      Envíos a todo el país o {STORE_PICKUP_PHRASE}.
    </p>
  );
}
