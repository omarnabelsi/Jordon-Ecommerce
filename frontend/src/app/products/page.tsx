import { Suspense } from "react";

import { ProductsCatalog } from "@/components/sections/products-catalog";

export default function ProductsPage() {
  return (
    <Suspense fallback={<section className="container-shell py-12 text-white/60">Loading products...</section>}>
      <ProductsCatalog />
    </Suspense>
  );
}
