import { ProductDetailClient } from "@/components/product/product-detail-client";

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}
