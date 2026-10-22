import StoreShell from "@/components/store/StoreShell";

// The guides share the store chrome, so their category navigation leads
// straight into the catalog.
export default function GuiasLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
