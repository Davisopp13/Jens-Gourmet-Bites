export interface Product {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  batch_size: number;
  has_pecan_option: boolean;
  available_frozen: boolean;
  available_baked: boolean;
  is_featured: boolean;
  is_active: boolean;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferred_format: "frozen" | "baked" | "either" | null;
  created_at: string;
}

export type ProductFormData = Omit<Product, "id" | "created_at" | "updated_at">;

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferred_format: "frozen" | "baked" | "either";
}
