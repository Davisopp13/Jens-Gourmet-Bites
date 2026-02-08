"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Star, Eye, EyeOff, Loader2 } from "lucide-react";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();
  const supabase = createClient();
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleToggle = async (
    id: string,
    field: "is_active" | "is_featured",
    currentValue: boolean
  ) => {
    setUpdating(id);
    try {
      await supabase
        .from("products")
        .update({ [field]: !currentValue })
        .eq("id", id);
      router.refresh();
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      await supabase.from("products").delete().eq("id", id);
      router.refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <span className="text-6xl mb-4 block">🍪</span>
        <p className="text-gray-600 mb-4">No products yet</p>
        <Link href="/admin/products/new" className="btn-primary">
          Add Your First Product
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Featured
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                {/* Product Info */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🍪
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Batch of {product.batch_size}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatPrice(product.price_cents)}
                  </div>
                </td>

                {/* Active Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() =>
                      handleToggle(product.id, "is_active", product.is_active)
                    }
                    disabled={updating === product.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {updating === product.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : product.is_active ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                    {product.is_active ? "Active" : "Hidden"}
                  </button>
                </td>

                {/* Featured Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() =>
                      handleToggle(product.id, "is_featured", product.is_featured)
                    }
                    disabled={updating === product.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_featured
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {updating === product.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Star
                        className={`w-3 h-3 ${
                          product.is_featured ? "fill-current" : ""
                        }`}
                      />
                    )}
                    {product.is_featured ? "Featured" : "Regular"}
                  </button>
                </td>

                {/* Sort Order */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.sort_order}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-primary hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={deleting === product.id}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
