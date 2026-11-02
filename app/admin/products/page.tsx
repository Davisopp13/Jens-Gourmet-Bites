import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductTable from "@/components/admin/ProductTable";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Fetch all products (including inactive)
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-primary">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your cookie products
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary w-full shrink-0 sm:w-auto">
          <Plus className="w-5 h-5 mr-1" />
          Add Product
        </Link>
      </div>

      {/* Responsive product list */}
      <ProductTable products={products || []} />
    </div>
  );
}
