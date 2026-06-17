import Storefront from "@/components/Storefront";

export default async function StorePage({ params }) {
  const { storeSlug } = await params;
  return <Storefront slug={storeSlug} />;
}
