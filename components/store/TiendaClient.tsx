"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ProductSummary } from "@/lib/product-summary";
import TiendaCatalog from "./TiendaCatalog";
import { DEFAULT_STORE_VIEW } from "./storeView";

type CatalogData = {
  products: ProductSummary[];
  bestSellerSlugs: string[];
};

function TiendaCatalogFromUrl(props: CatalogData) {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? DEFAULT_STORE_VIEW;

  // The first client render replaces the server-rendered fallback, so skip
  // the card entrance animation there; later view changes animate as usual.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  return <TiendaCatalog view={view} animateEntrance={hasMounted} {...props} />;
}

export default function TiendaClient(props: CatalogData) {
  return (
    // useSearchParams opts out of static rendering up to this boundary; the
    // fallback keeps the default catalog in the static HTML for crawlers.
    <Suspense
      fallback={
        <TiendaCatalog view={DEFAULT_STORE_VIEW} animateEntrance={false} {...props} />
      }
    >
      <TiendaCatalogFromUrl {...props} />
    </Suspense>
  );
}
