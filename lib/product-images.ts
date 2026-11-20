import type { SupabaseClient } from "@supabase/supabase-js";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function imageUploadError(error: unknown): string {
  const detail = error && typeof error === "object"
    ? error as { message?: string; statusCode?: string | number; status?: number }
    : {};
  const message = detail.message || "";
  const status = Number(detail.statusCode || detail.status);
  if (/bucket.*not found/i.test(message)) {
    return "Image storage is not configured. Ask the site administrator to check the product-images bucket.";
  }
  if (status === 401 || /jwt|token.*expired|not authenticated/i.test(message)) {
    return "Your session has expired. Sign in again, then retry the upload.";
  }
  if (status === 403 || /row.level security|unauthorized|permission denied/i.test(message)) {
    return "Image storage denied the upload. Sign in again; if it still fails, ask the site administrator to check upload permissions.";
  }
  if (status === 413 || /exceeded.*size|too large/i.test(message)) {
    return "The image exceeds the storage size limit. Choose a smaller image (up to 5 MB).";
  }
  if (/mime|content.type/i.test(message)) {
    return "Image storage rejected this file type. Choose a JPG, PNG, or WebP image.";
  }
  if (/fetch|network|load failed|abort|timeout/i.test(message)) {
    return "Could not reach image storage. Check your connection and try again.";
  }
  // Keep useful storage diagnostics instead of replacing every failure with the
  // same generic message. Storage errors contain no credentials or file contents.
  return message ? `Upload failed: ${message}` : "Image upload failed. Please try again.";
}

export async function uploadProductImage(client: SupabaseClient, file: File): Promise<string> {
  const type = file.type.toLowerCase() || ({
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  } as Record<string, string>)[file.name.split(".").pop()?.toLowerCase() || ""];
  if (!extensions[type]) {
    throw new Error("Choose a JPG, PNG, or WebP image. For an HEIC photo, export it as JPG first.");
  }
  if (!file.size) throw new Error("This image is empty. Select the photo again.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");

  let bytes: ArrayBuffer;
  try {
    // Materialize the iOS Photos/iCloud file before handing it to the network.
    // An ArrayBuffer also avoids the SDK's File/FormData upload path.
    bytes = await file.arrayBuffer();
    if (bytes.byteLength !== file.size) throw new Error("Incomplete image");
  } catch {
    throw new Error("Could not read this photo. Open it in Photos to download it, then select it again.");
  }

  // iOS can convert a selected photo to JPEG while retaining its old filename.
  // Match the stored extension and Content-Type to the file's actual MIME type.
  const path = `${crypto.randomUUID()}.${extensions[type]}`;
  const bucket = client.storage.from("product-images");
  const { data, error } = await bucket.upload(path, bytes, {
    contentType: type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return bucket.getPublicUrl(data.path).data.publicUrl;
}
