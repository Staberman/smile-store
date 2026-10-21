import StoreShell from "@/components/store/StoreShell";

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreShell>{children}</StoreShell>;
}
