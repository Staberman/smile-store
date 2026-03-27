import Image from "next/image";
import Link from "next/link";

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="fixed left-0 top-0 z-30 w-full border-b border-white/8 bg-black/88 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:py-6">
          <Link href="/" className="flex items-center" aria-label="Smile inicio">
            <Image
              src="/images/smile-logo.svg"
              alt="Smile"
              width={160}
              height={60}
              priority
              className="h-auto w-[100px] opacity-95 transition hover:opacity-100 md:w-[128px]"
            />
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/tienda"
              className="cursor-pointer rounded-full border border-white/25 bg-white/8 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-white backdrop-blur transition hover:border-white hover:bg-white hover:text-black"
            >
              Tienda
            </Link>

            <Link
              href="/#colecciones"
              className="cursor-pointer rounded-full border border-white/12 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Inicio
            </Link>
          </nav>
        </div>
      </header>

      <div className="pt-[72px] md:pt-[80px]">{children}</div>
    </>
  );
}
