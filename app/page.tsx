import { createClient } from "@/lib/supabase/server";
import CatalogSite from "@/components/catalog/CatalogSite";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
  }

  return <CatalogSite products={products || []} />;
}
