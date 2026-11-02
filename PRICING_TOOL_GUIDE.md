# Pricing Tool Guide for Jen's Gourmet Bites

## Overview

The Pricing Tool helps you make data-driven pricing decisions by tracking ingredient costs, calculating recipe costs, and suggesting prices based on your desired profit margin.

## Getting Started

### 1. Setup Database

First, run the pricing database migration in your Supabase dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** → **New Query**
4. Copy and paste the contents of `supabase/pricing_migration.sql`
5. Click **Run**

This will create the necessary tables and seed them with common baking ingredients.

### 2. Access the Pricing Tool

1. Log into your admin panel
2. Click **Pricing** in the navigation menu
3. You'll see four tabs:
   - **Overview**: Cost summary for all recipes
   - **Ingredients**: Manage ingredient inventory and prices
   - **Recipes**: Build recipes with ingredient lists
   - **Price Calculator**: Calculate suggested pricing

---

## Using the Pricing Tool

### Managing Ingredients

**Ingredients** are the raw materials you use to make cookies (flour, sugar, butter, etc.).

#### Adding an Ingredient

1. Go to the **Ingredients** tab
2. Click **Add Ingredient**
3. Fill in the form:
   - **Name**: What is the ingredient? (e.g., "All-Purpose Flour")
   - **Package Size**: How much comes in one package? (e.g., 5 for a 5 lb bag)
   - **Unit**: What unit is it measured in? (lb, cup, oz, etc.)
   - **Current Price**: How much does the package cost? (e.g., $3.50)
   - **Supplier Name**: Optional - where do you buy it? (e.g., "Walmart")
   - **Supplier URL**: Optional - link to the product page (for price scraping)
   - **Notes**: Optional - any additional info

4. Click **Add Ingredient**

#### Editing Prices

You can update prices in two ways:

**Manual Update:**
1. Click the **Edit** (pencil) icon next to an ingredient
2. Update the price
3. Click **Update Ingredient**

**Automatic Price Scraping:**
1. Add a supplier URL when creating/editing an ingredient (Walmart, Target, or Amazon)
2. Click the **Refresh** icon next to the ingredient to scrape the current price
3. Or click **Update All Prices** to scrape all ingredients with URLs

> **Note**: Web scraping can be unreliable and may not work for all websites. Manual updates are more reliable.

---

### Building Recipes

**Recipes** define what ingredients go into each cookie product and in what quantities.

#### Creating a Recipe

1. Go to the **Recipes** tab
2. Click **Add Recipe**
3. Fill in the basic info:
   - **Recipe Name**: Name of the recipe (e.g., "Signature Cookie Recipe")
   - **Product**: Which cookie product is this for?
   - **Batch Size**: How many cookies does this recipe make? (e.g., 16)
   - **Recipe Notes**: Optional instructions or notes

4. Add ingredients by clicking **Add Ingredient**:
   - **Select ingredient**: Choose from your ingredient list
   - **Quantity**: How much do you use? (e.g., 2.5)
   - **Unit**: What unit? (cup, tbsp, oz, etc.)
   - **Notes**: Optional (e.g., "sifted", "melted")

5. Click **Create Recipe**

#### Example Recipe

**Chocolate Chip Cookie Recipe**
- Batch Size: 16 cookies
- Ingredients:
  - 2.5 cups All-Purpose Flour
  - 1 cup Granulated Sugar
  - 0.5 cup Brown Sugar
  - 1 cup Butter (2 sticks = 0.5 lb)
  - 2 count Large Eggs
  - 1 tsp Vanilla Extract
  - 1 tsp Baking Soda
  - 0.5 tsp Salt
  - 2 cups Semi-Sweet Chocolate Chips

---

### Understanding the Overview

The **Overview** tab shows you the cost breakdown for all your recipes at a glance.

#### What You'll See

- **Product**: Which cookie product
- **Batch Size**: How many cookies the recipe makes
- **Batch Cost**: Total cost of all ingredients for one batch
- **Cost/Cookie**: How much it costs to make one cookie
- **Current Price**: What you're currently charging per cookie
- **Profit Margin**: Your current profit margin percentage

#### Profit Margin Color Guide

- 🟢 **Green (50%+)**: Excellent margin, sustainable pricing
- 🟡 **Yellow (30-50%)**: Good margin, competitive pricing
- 🔴 **Red (<30%)**: Low margin, consider price increase

---

### Using the Price Calculator

The **Price Calculator** helps you determine the optimal price for your cookies based on ingredient costs and desired profit margin.

#### How to Calculate Pricing

1. Go to the **Price Calculator** tab
2. Select a recipe from the dropdown
3. Adjust the **Target Profit Margin** slider (typically 40-60%)
4. Click **Calculate Pricing**

#### Understanding the Results

**Suggested Price Per Cookie**: This is what you should charge to achieve your target profit margin.

**Breakdown Shows:**
- **Total Cost**: Cost of all ingredients in the batch
- **Cost Per Cookie**: Ingredient cost for one cookie
- **Profit Per Cookie**: How much you make per cookie at the suggested price
- **Cost Breakdown by Ingredient**: See which ingredients cost the most

**Comparison Section:**
- Shows your current price vs. suggested price
- Gives recommendations on whether to raise or lower prices

#### Important Notes

⚠️ **The calculator only accounts for ingredient costs.** It does NOT include:
- Labor/time
- Utilities (electricity, gas)
- Packaging
- Overhead (rent, equipment)
- Marketing

💡 **Typical Profit Margins:**
- 50-60% is excellent for homemade baked goods
- This margin helps cover labor, utilities, and other overhead
- Don't go below 40% unless you have a specific reason

---

## Example Workflow

### Setting Up a New Product

Let's say you want to price your "Signature Cookie" product:

**Step 1: Add Ingredients (if not already added)**
- All-Purpose Flour: 5 lb bag for $3.50
- Brown Sugar: 2 lb bag for $3.20
- Butter: 1 lb (4 sticks) for $5.50
- Eggs: 12 count for $4.50
- (etc.)

**Step 2: Create Recipe**
- Recipe Name: "Signature Cookie Recipe"
- Product: Signature Cookie
- Batch Size: 16 cookies
- Add all ingredients with quantities

**Step 3: Check Overview**
- Go to Overview tab
- See your current cost per cookie
- Note your current profit margin

**Step 4: Calculate Optimal Price**
- Go to Price Calculator
- Select "Signature Cookie Recipe"
- Set target margin to 50%
- Click Calculate
- Review suggested price

**Step 5: Update Product Price (if needed)**
- Go to Products tab
- Edit your Signature Cookie product
- Update the price based on the suggestion
- Save changes

---

## Best Practices

### 1. Update Ingredient Prices Regularly
- Check prices monthly or when you restock
- Use the price scraping feature for items you buy online
- Keep notes about seasonal price variations

### 2. Review Your Margins Quarterly
- Look at the Overview tab regularly
- Adjust prices if margins are too low
- Consider bulk buying for expensive ingredients

### 3. Factor in Hidden Costs
- The calculator shows ingredient costs only
- Add 20-30% on top for labor and overhead
- This is why 50-60% margin on ingredients is ideal

### 4. Test New Recipes
- Start with estimated quantities
- Make a test batch and adjust recipe as needed
- Update ingredient quantities based on what you actually used

### 5. Track Price History
- The system automatically saves price history
- This helps you see trends over time
- Useful for planning when to buy in bulk

---

## Troubleshooting

### "Price scraping failed"
- The supplier website may have changed their layout
- Try manually updating the price instead
- Or copy/paste the supplier URL into a browser to verify it works

### "No recipes available"
- You need to create recipes first
- Make sure you've linked recipes to your products

### "Cost calculation seems wrong"
- Double-check your ingredient quantities
- Verify that package sizes are correct (e.g., 5 lb bag, not 5 oz)
- Make sure units match (don't mix cups with ounces)

### "I don't see my product in the recipe dropdown"
- Each product can only have one recipe
- If a product already has a recipe, edit the existing one instead

---

## Tips for Success

1. **Start Simple**: Begin with 2-3 key ingredients, then add more detail over time

2. **Be Accurate**: Measure your ingredients carefully when creating recipes

3. **Update Regularly**: Set a monthly reminder to update prices

4. **Don't Underprice**: Remember that 50%+ margin on ingredients is normal and healthy

5. **Track What Works**: Use the Overview tab to see which products are most profitable

6. **Seasonal Adjustments**: Some ingredients (butter, eggs) vary by season - factor this in

---

## Questions?

If you need help with the Pricing Tool, reach out to Davis! 😊
