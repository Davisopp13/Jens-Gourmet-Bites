"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { X, Loader2, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateImagePath } from "@/lib/utils";

interface ImageUploaderProps {
  currentImageUrl: string | null;
  onImageUploaded: (url: string | null) => void;
}

export default function ImageUploader({
  currentImageUrl,
  onImageUploaded,
}: ImageUploaderProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const [error, setError] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Generate unique path
      const filePath = generateImagePath(file.name);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(data.path);

      onImageUploaded(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
      setPreview(currentImageUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageUploaded(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Product Image
      </label>

      {preview ? (
        <div className="relative w-full max-w-xs aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={preview}
            alt="Product preview"
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-xs aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-50/50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload</span>
              <span className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP (max 5MB)
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
