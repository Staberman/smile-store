"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartSidebar({ open, onClose }: Props) {
  const { items, count, total, removeItem, updateQty, whatsappCheckout } = useCart();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-[201] flex h-full w-full max-w-md flex-col bg-[#0e0e0e] text-[#f0ece4]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#4a4540]">
                  Tu selección
                </p>
                <h2 className="font-display mt-1 text-xl font-light italic">
                  Carrito{" "}
                  {count > 0 && (
                    <span className="text-[#c9a96e]">({count})</span>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 transition hover:border-white/30 hover:bg-white/5"
                aria-label="Cerrar carrito"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4a4540" strokeWidth="1">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  <p className="text-sm text-[#4a4540]">Tu carrito está vacío.</p>
                  <button
                    onClick={onClose}
                    className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[#c9a96e] underline underline-offset-4 transition hover:opacity-70"
                  >
                    Seguir explorando
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}::${item.variant}`}
                      className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      {/* Image */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#181414]">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-[#f0ece4]">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-[#4a4540]">{item.subtitle}</p>
                          <p className="mt-0.5 text-[10px] text-[#6a6560]">{item.variant}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-[12px] text-[#c9a96e]">
                            {formatPrice(item.price * item.quantity)}
                          </p>

                          {/* Qty controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.productId, item.variant, item.quantity - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/12 text-xs transition hover:border-white/30"
                            >
                              −
                            </button>
                            <span className="w-4 text-center text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.productId, item.variant, item.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/12 text-xs transition hover:border-white/30"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeItem(item.productId, item.variant)}
                              className="ml-1 flex h-6 w-6 items-center justify-center text-[#4a4540] transition hover:text-white"
                              aria-label="Eliminar"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-white/8 px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-[#4a4540]">Total estimado</p>
                  <p className="font-display text-lg font-light text-[#c9a96e]">
                    {formatPrice(total)}
                  </p>
                </div>

                <button
                  onClick={whatsappCheckout}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:opacity-90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Consultar por WhatsApp
                </button>

                <p className="mt-3 text-center text-[10px] text-[#4a4540]">
                  Te contactaremos para coordinar tu compra
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
