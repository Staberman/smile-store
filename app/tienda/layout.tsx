import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
import StoreCategoryNav from "@/components/store/StoreCategoryNav";

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="fixed left-0 top-0 z-30 w-full border-b border-white/8 bg-black/88 backdrop-blur-md">
        <div className="mx-auto max-w-[92rem] px-4 md:px-6">
          <div className="flex min-h-[72px] items-center justify-between gap-5 md:min-h-[82px]">
            <Link href="/" className="flex shrink-0 items-center" aria-label="Smile inicio">
              <Image
                src="/images/smile-logo.svg"
                alt="Smile"
                width={160}
                height={60}
                priority
                className="h-auto w-[96px] opacity-95 transition hover:opacity-100 md:w-[118px]"
              />
            </Link>

            <div className="hidden min-w-0 flex-1 md:block">
              <Suspense>
                <StoreCategoryNav />
              </Suspense>
            </div>

            <nav className="flex shrink-0 items-center gap-2">
            <Link
              href="/tienda"
              className="flex min-h-11 cursor-pointer items-center rounded-full border border-white/25 bg-white/8 px-4 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur transition hover:border-white hover:bg-white hover:text-black"
            >
              Tienda
            </Link>

            <Link
              href="/#colecciones"
              className="hidden min-h-11 cursor-pointer items-center rounded-full border border-white/12 px-4 text-[10px] uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white sm:flex"
            >
              Inicio
            </Link>
            </nav>
          </div>

          <div className="border-t border-white/6 md:hidden">
            <Suspense>
              <StoreCategoryNav />
            </Suspense>
          </div>
        </div>
      </header>

      <div className="pt-[117px] md:pt-[82px]">{children}</div>
      <Footer />
    </>
  );
}
