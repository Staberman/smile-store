"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TiendaCatalog from "./TiendaCatalog";
import { DEFAULT_STORE_VIEW } from "./storeView";

function TiendaCatalogFromUrl() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? DEFAULT_STORE_VIEW;

  // The first client render replaces the server-rendered fallback, so skip
  // the card entrance animation there; later view changes animate as usual.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  return <TiendaCatalog view={view} animateEntrance={hasMounted} />;
}

export default function TiendaClient() {
  return (
    // useSearchParams opts out of static rendering up to this boundary; the
    // fallback keeps the default catalog in the static HTML for crawlers.
    <Suspense
      fallback={<TiendaCatalog view={DEFAULT_STORE_VIEW} animateEntrance={false} />}
    >
      <TiendaCatalogFromUrl />
    </Suspense>
  );
}
