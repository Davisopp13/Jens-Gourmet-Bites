"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Product, ProductFormData } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import ImageUploader from "./ImageUploader";

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
}

const defaultFormData: ProductFormData = {
  name: "",
  description: "",
  price_cents: 2000,
  batch_size: 12,
  has_pecan_option: false,
  available_frozen: true,
  available_baked: true,
  is_featured: false,
  is_active: true,
  image_url: null,
  sort_order: 0,
};

export default function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<ProductFormData>(
    product
      ? {
          name: product.name,
          description: product.description,
          price_cents: product.price_cents,
          batch_size: product.batch_size,
          has_pecan_option: product.has_pecan_option,
          available_frozen: product.available_frozen,
          available_baked: product.available_baked,
          is_featured: product.is_featured,
          is_active: product.is_active,
          image_url: product.image_url,
          sort_order: product.sort_order,
        }
      : defaultFormData
  );

  // Convert cents to dollars for display
  const [priceDisplay, setPriceDisplay] = useState(
    (formData.price_cents / 100).toFixed(2)
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "price") {
      setPriceDisplay(value);
      // Convert dollars to cents
      const cents = Math.round(parseFloat(value || "0") * 100);
      setFormData((prev) => ({ ...prev, price_cents: cents }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUploaded = (url: string | null) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "create") {
        const { error } = await supabase.from("products").insert([formData]);
        if (error) throw error;
      } else if (product) {
        const { error } = await supabase
          .from("products")
          .update(formData)
          .eq("id", product.id);
        if (error) throw error;
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      console.error("Error saving product:", err);
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Back Link */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-gray-600 hover:text-primary text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-primary">
          {mode === "create" ? "Add New Product" : `Edit ${product?.name}`}
        </h1>
        <p className="text-gray-600 mt-1">
          {mode === "create"
            ? "Create a new cookie product"
            : "Update product details"}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="font-medium text-gray-900 border-b pb-2">
              Basic Information
            </h2>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Signature Cookie"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="input-field resize-none"
                placeholder="Describe your cookie..."
              />
            </div>

            {/* Price and Batch Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  value={priceDisplay}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="22.00"
                />
              </div>

              <div>
                <label
                  htmlFor="batch_size"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Batch Size
                </label>
                <input
                  type="number"
                  id="batch_size"
                  name="batch_size"
                  min="1"
                  value={formData.batch_size}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sort_order"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Display Order
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                min="0"
                value={formData.sort_order}
                onChange={handleChange}
                className="input-field w-24"
              />
              <p className="text-sm text-gray-500 mt-1">
                Lower numbers appear first
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="font-medium text-gray-900 border-b pb-2">
              Product Options
            </h2>

            <div className="space-y-4">
              {/* Availability */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="available_frozen"
                    checked={formData.available_frozen}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">
                    Available as Frozen Dough
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="available_baked"
                    checked={formData.available_baked}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">
                    Available as Fresh Baked
                  </span>
                </label>
              </div>

              {/* Pecan Option */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_pecan_option"
                  checked={formData.has_pecan_option}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="text-sm text-gray-700">
                  Pecan option available
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <ImageUploader
              currentImageUrl={formData.image_url}
              onImageUploaded={handleImageUploaded}
            />
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="font-medium text-gray-900 border-b pb-2">Status</h2>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className="text-sm text-gray-700">
                Active (visible on site)
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className="text-sm text-gray-700">
                Featured (Cookies of the Month)
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {mode === "create" ? "Create Product" : "Save Changes"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
