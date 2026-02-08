-- ==============================================
-- Jen's Gourmet Bites - Supabase Database Setup
-- ==============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- PRODUCTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL DEFAULT 0,
  batch_size INTEGER NOT NULL DEFAULT 12,
  has_pecan_option BOOLEAN NOT NULL DEFAULT false,
  available_frozen BOOLEAN NOT NULL DEFAULT true,
  available_baked BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_active_sorted ON products(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured, is_active);

-- ==============================================
-- CONTACT SUBMISSIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  preferred_format TEXT CHECK (preferred_format IN ('frozen', 'baked', 'either')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Products Policies
-- Public can read active products
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Authenticated users (admin) can view all products
DROP POLICY IF EXISTS "Authenticated users can view all products" ON products;
CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users (admin) can insert products
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users (admin) can update products
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users (admin) can delete products
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;
CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Contact Submissions Policies
-- Anyone can submit contact form
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view submissions
DROP POLICY IF EXISTS "Authenticated users can view submissions" ON contact_submissions;
CREATE POLICY "Authenticated users can view submissions"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (true);

-- ==============================================
-- SEED DATA - Initial Cookie Products
-- ==============================================
-- Only run this once! Comment out after first run.

INSERT INTO products (name, description, price_cents, batch_size, has_pecan_option, available_frozen, available_baked, is_featured, is_active, sort_order) VALUES
('Signature Cookie', 'Our famous signature cookie with a perfect balance of butter, brown sugar, and premium ingredients. A family favorite that melts in your mouth.', 2200, 16, true, true, true, true, true, 1),
('Spiced Oatmeal Raisin', 'Classic oatmeal raisin cookies with warm cinnamon and nutmeg spices. Plump raisins and hearty oats make these a comforting treat.', 2200, 16, true, true, true, true, true, 2),
('Classic Chocolate Chip', 'Traditional chocolate chip cookies loaded with premium chocolate chips. A timeless classic baked to golden perfection.', 1800, 16, false, true, true, false, true, 3),
('Peppermint Chocolate', 'Seasonal favorite featuring cool peppermint and rich dark chocolate. Perfect for the holidays or any time you crave something special.', 2000, 16, false, true, true, true, true, 4),
('Gourmet Holiday Cookie', 'A special holiday blend featuring festive flavors and premium ingredients. Makes the perfect gift or centerpiece for holiday gatherings.', 2200, 16, false, true, true, true, true, 5)
ON CONFLICT DO NOTHING;

-- ==============================================
-- STORAGE BUCKET SETUP
-- ==============================================
-- Note: Run these commands separately in the SQL editor or use the Supabase Dashboard

-- Create the storage bucket (if it doesn't exist)
-- Go to Storage > Create new bucket
-- Name: product-images
-- Public bucket: YES

-- Storage Policies (run in SQL editor):
/*
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Allow public read access for product images
CREATE POLICY "Public read access for product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
*/
