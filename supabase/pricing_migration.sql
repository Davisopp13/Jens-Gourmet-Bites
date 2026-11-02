-- ==============================================
-- Jen's Gourmet Bites - Pricing Tool Database Schema
-- ==============================================
-- Run this SQL in your Supabase SQL Editor after running the main migration

-- ==============================================
-- INGREDIENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL CHECK (unit IN ('cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'count')),
  current_price_cents INTEGER NOT NULL DEFAULT 0,
  package_quantity DECIMAL(10,2) NOT NULL DEFAULT 1, -- e.g., 2 for "2 lb bag", 16 for "16 oz package"
  supplier_name TEXT,
  supplier_url TEXT,
  last_scraped_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apply updated_at trigger to ingredients
DROP TRIGGER IF EXISTS update_ingredients_updated_at ON ingredients;
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

-- ==============================================
-- RECIPES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  batch_size INTEGER NOT NULL DEFAULT 12, -- number of cookies per batch
  instructions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id) -- one recipe per product
);

-- Apply updated_at trigger to recipes
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for product lookups
CREATE INDEX IF NOT EXISTS idx_recipes_product_id ON recipes(product_id);

-- ==============================================
-- RECIPE_INGREDIENTS TABLE (Junction Table)
-- ==============================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL, -- how much of the ingredient (e.g., 2.5)
  unit TEXT NOT NULL CHECK (unit IN ('cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'count')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, ingredient_id) -- prevent duplicate ingredients in same recipe
);

-- Create indexes for faster joins
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- ==============================================
-- PRICE_HISTORY TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  supplier_name TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for historical queries
CREATE INDEX IF NOT EXISTS idx_price_history_ingredient_id ON price_history(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_price_history_scraped_at ON price_history(scraped_at DESC);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all pricing tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Ingredients Policies
DROP POLICY IF EXISTS "Authenticated users can view ingredients" ON ingredients;
CREATE POLICY "Authenticated users can view ingredients"
  ON ingredients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert ingredients" ON ingredients;
CREATE POLICY "Authenticated users can insert ingredients"
  ON ingredients FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update ingredients" ON ingredients;
CREATE POLICY "Authenticated users can update ingredients"
  ON ingredients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete ingredients" ON ingredients;
CREATE POLICY "Authenticated users can delete ingredients"
  ON ingredients FOR DELETE
  TO authenticated
  USING (true);

-- Recipes Policies
DROP POLICY IF EXISTS "Authenticated users can view recipes" ON recipes;
CREATE POLICY "Authenticated users can view recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert recipes" ON recipes;
CREATE POLICY "Authenticated users can insert recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update recipes" ON recipes;
CREATE POLICY "Authenticated users can update recipes"
  ON recipes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete recipes" ON recipes;
CREATE POLICY "Authenticated users can delete recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (true);

-- Recipe Ingredients Policies
DROP POLICY IF EXISTS "Authenticated users can view recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Authenticated users can view recipe_ingredients"
  ON recipe_ingredients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Authenticated users can insert recipe_ingredients"
  ON recipe_ingredients FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Authenticated users can update recipe_ingredients"
  ON recipe_ingredients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Authenticated users can delete recipe_ingredients"
  ON recipe_ingredients FOR DELETE
  TO authenticated
  USING (true);

-- Price History Policies
DROP POLICY IF EXISTS "Authenticated users can view price_history" ON price_history;
CREATE POLICY "Authenticated users can view price_history"
  ON price_history FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert price_history" ON price_history;
CREATE POLICY "Authenticated users can insert price_history"
  ON price_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==============================================
-- SEED DATA - Common Baking Ingredients
-- ==============================================
-- Sample ingredients to get started
-- Your mom can customize these based on actual recipes

INSERT INTO ingredients (name, unit, package_quantity, current_price_cents, supplier_name, notes) VALUES
('All-Purpose Flour', 'lb', 5, 350, 'Generic', '5 lb bag'),
('Granulated Sugar', 'lb', 4, 280, 'Generic', '4 lb bag'),
('Brown Sugar', 'lb', 2, 320, 'Generic', '2 lb bag'),
('Butter (unsalted)', 'lb', 1, 550, 'Generic', '1 lb (4 sticks)'),
('Large Eggs', 'count', 12, 450, 'Generic', '1 dozen'),
('Vanilla Extract', 'oz', 2, 800, 'Generic', '2 oz bottle'),
('Baking Soda', 'oz', 16, 120, 'Generic', '1 lb box'),
('Salt', 'oz', 26, 99, 'Generic', '26 oz container'),
('Semi-Sweet Chocolate Chips', 'oz', 12, 400, 'Generic', '12 oz bag'),
('Rolled Oats', 'lb', 2.5, 450, 'Generic', '42 oz canister'),
('Raisins', 'oz', 15, 350, 'Generic', '15 oz box'),
('Ground Cinnamon', 'oz', 2.37, 450, 'Generic', '2.37 oz jar'),
('Ground Nutmeg', 'oz', 1.1, 550, 'Generic', '1.1 oz jar'),
('Pecans (chopped)', 'oz', 6, 650, 'Generic', '6 oz bag'),
('Peppermint Extract', 'oz', 1, 450, 'Generic', '1 oz bottle'),
('Dark Chocolate Chips', 'oz', 10, 480, 'Generic', '10 oz bag')
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- HELPFUL VIEWS (Optional)
-- ==============================================

-- View to see recipe costs at a glance
CREATE OR REPLACE VIEW recipe_cost_summary AS
SELECT
  r.id AS recipe_id,
  r.name AS recipe_name,
  p.name AS product_name,
  r.batch_size,
  COUNT(ri.id) AS ingredient_count,
  COALESCE(SUM(
    (ri.quantity / i.package_quantity) * i.current_price_cents
  ), 0) AS total_cost_cents,
  COALESCE(SUM(
    (ri.quantity / i.package_quantity) * i.current_price_cents
  ), 0) / r.batch_size AS cost_per_cookie_cents,
  p.price_cents AS current_selling_price_cents,
  CASE
    WHEN p.price_cents > 0 THEN
      ((p.price_cents - (COALESCE(SUM((ri.quantity / i.package_quantity) * i.current_price_cents), 0) / r.batch_size)) * 100.0 / p.price_cents)
    ELSE 0
  END AS profit_margin_percentage
FROM recipes r
LEFT JOIN products p ON r.product_id = p.id
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
GROUP BY r.id, r.name, p.name, r.batch_size, p.price_cents;
