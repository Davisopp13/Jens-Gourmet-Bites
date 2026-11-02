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

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

  const productImage = (product: Product) => (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 lg:h-12 lg:w-12">
      {product.image_url ? (
        <Image
          src={product.image_url}
          alt={product.name}
          width={64}
          height={64}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl" aria-hidden="true">
          🍪
        </div>
      )}
    </div>
  );

  const statusControl = (product: Product, field: "is_active" | "is_featured") => {
    const active = field === "is_active";
    const selected = product[field];
    const Icon = active ? (selected ? Eye : EyeOff) : Star;

    return (
      <button
        type="button"
        onClick={() => handleToggle(product.id, field, selected)}
        disabled={updating === product.id}
        aria-label={`${active ? "Active status" : "Featured status"} for ${product.name}`}
        aria-pressed={selected}
        aria-busy={updating === product.id}
        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium disabled:opacity-50 ${focusRing} ${
          selected
            ? active
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {updating === product.id ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <Icon
            className={`h-3.5 w-3.5 shrink-0 ${!active && selected ? "fill-current" : ""}`}
            aria-hidden="true"
          />
        )}
        {active ? (selected ? "Active" : "Hidden") : selected ? "Featured" : "Regular"}
      </button>
    );
  };

  const productActions = (product: Product, mobile = false) => (
    <div className={mobile ? "grid grid-cols-2 gap-3 border-t border-gray-200 pt-3" : "flex items-center justify-end gap-2"}>
      <Link
        href={`/admin/products/${product.id}/edit`}
        aria-label={`Edit ${product.name}`}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg p-2 text-sm font-medium text-primary hover:bg-primary-50 hover:text-primary-700 ${focusRing} ${mobile ? "border border-gray-200" : ""}`}
      >
        <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" />
        {mobile && "Edit"}
      </Link>
      <button
        type="button"
        onClick={() => handleDelete(product.id, product.name)}
        disabled={deleting === product.id}
        aria-label={`Delete ${product.name}`}
        aria-busy={deleting === product.id}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg p-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-800 disabled:opacity-50 ${focusRing} ${mobile ? "border border-gray-200" : ""}`}
      >
        {deleting === product.id ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        {mobile && "Delete"}
      </button>
    </div>
  );

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
    <>
      <ul aria-label="Products" className="min-w-0 space-y-4 lg:hidden">
        {products.map((product) => (
          <li key={product.id} className="min-w-0 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start gap-3">
              {productImage(product)}
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-gray-900 [overflow-wrap:anywhere]">{product.name}</h2>
                <p className="mt-1 text-sm text-gray-500">Batch of {product.batch_size}</p>
              </div>
            </div>
            <dl className="grid min-w-0 grid-cols-2 gap-3 text-sm">
              <div className="min-w-0">
                <dt className="text-gray-500">Price</dt>
                <dd className="mt-1 font-medium text-gray-900 [overflow-wrap:anywhere]">{formatPrice(product.price_cents)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-gray-500">Display order</dt>
                <dd className="mt-1 text-gray-900 [overflow-wrap:anywhere]">{product.sort_order}</dd>
              </div>
              <div>
                <dt className="mb-1 text-gray-500">Status</dt>
                <dd>{statusControl(product, "is_active")}</dd>
              </div>
              <div>
                <dt className="mb-1 text-gray-500">Featured</dt>
                <dd>{statusControl(product, "is_featured")}</dd>
              </div>
            </dl>
            {productActions(product, true)}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Product", "Price", "Status", "Featured", "Order", "Actions"].map((label) => (
                  <th key={label} scope="col" className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 ${label === "Actions" ? "text-right" : "text-left"}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      {productImage(product)}
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">Batch of {product.batch_size}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{formatPrice(product.price_cents)}</td>
                  <td className="whitespace-nowrap px-6 py-4">{statusControl(product, "is_active")}</td>
                  <td className="whitespace-nowrap px-6 py-4">{statusControl(product, "is_featured")}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.sort_order}</td>
                  <td className="whitespace-nowrap px-6 py-4">{productActions(product)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
