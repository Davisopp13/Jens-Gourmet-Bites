import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { getPublishedContent } from "@/lib/website-content-server";
import CatalogSite from "@/components/catalog/CatalogSite";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublishedContent();
  return {
    title: content.siteTitle,
    description: content.siteDescription,
    openGraph: { title: content.shareTitle, description: content.shareDescription, type: "website" },
    twitter: { card: "summary", title: content.shareTitle, description: content.shareDescription },
  };
}

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

  const content = await getPublishedContent();

  return <CatalogSite products={products || []} content={content} />;
}
