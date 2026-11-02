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

// Pricing Tool Types
export type MeasurementUnit =
  | "cup"
  | "tbsp"
  | "tsp"
  | "oz"
  | "lb"
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "count";

export interface Ingredient {
  id: string;
  name: string;
  unit: MeasurementUnit;
  current_price_cents: number;
  package_quantity: number;
  supplier_name: string | null;
  supplier_url: string | null;
  last_scraped_at: string | null;
  notes: string | null;
  exact_product_name?: string | null;
  price_verified_at?: string | null;
  price_receipt_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  product_id: string;
  name: string;
  batch_size: number;
  instructions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit: MeasurementUnit;
  notes: string | null;
  created_at: string;
}

export interface PriceHistory {
  id: string;
  ingredient_id: string;
  price_cents: number;
  supplier_name: string | null;
  scraped_at: string;
}

// Extended types with joined data
export interface RecipeWithIngredients extends Recipe {
  product?: Product;
  recipe_ingredients?: (RecipeIngredient & {
    ingredient?: Ingredient;
  })[];
}

export interface RecipeCostSummary {
  recipe_id: string;
  recipe_name: string;
  product_name: string | null;
  batch_size: number;
  ingredient_count: number;
  total_cost_cents: number;
  cost_per_cookie_cents: number;
  current_selling_price_cents: number;
  profit_margin_percentage: number;
}

// Form data types
export type IngredientFormData = Omit<Ingredient, "id" | "created_at" | "updated_at">;
export type RecipeFormData = Omit<Recipe, "id" | "created_at" | "updated_at">;
export type RecipeIngredientFormData = Omit<RecipeIngredient, "id" | "created_at">;

// Pricing calculation types
export interface PricingCalculation {
  recipeName: string;
  batchSize: number;
  totalCostCents: number;
  costPerUnitCents: number;
  currentPriceCents: number;
  suggestedPriceCents: number;
  profitMarginPercentage: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: MeasurementUnit;
    costCents: number;
  }[];
}
