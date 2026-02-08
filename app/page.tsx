import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import FeaturedSection from "@/components/FeaturedSection";
import ProductGrid from "@/components/ProductGrid";
import AboutSection from "@/components/AboutSection";
import ContactForm from "@/components/ContactForm";

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

  const allProducts = products || [];
  const featuredProducts = allProducts.filter((p) => p.is_featured);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturedSection products={featuredProducts} />
        <ProductGrid products={allProducts} />
        <AboutSection />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
