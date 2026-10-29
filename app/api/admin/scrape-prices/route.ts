import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapePrice } from "@/lib/price-scraper";

/**
 * POST - Scrape prices for one or more ingredients
 * Body: { ingredient_ids?: string[] } - if empty, scrapes all ingredients with supplier_url
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ingredient_ids } = body;

    // Fetch ingredients to scrape
    let query = supabase
      .from("ingredients")
      .select("*")
      .not("supplier_url", "is", null);

    if (ingredient_ids && ingredient_ids.length > 0) {
      query = query.in("id", ingredient_ids);
    }

    const { data: ingredients, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching ingredients:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch ingredients" },
        { status: 500 }
      );
    }

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({
        message: "No ingredients found with supplier URLs",
        results: [],
      });
    }

    // Scrape prices for each ingredient
    const results = await Promise.all(
      ingredients.map(async (ingredient) => {
        try {
          if (ingredient.price_receipt_id) {
            return { ingredient_id: ingredient.id, ingredient_name: ingredient.name, success: false, error: "Receipt-verified costs must be reviewed manually; supplier refresh cannot replace them." };
          }
          if (!ingredient.supplier_url) {
            return {
              ingredient_id: ingredient.id,
              ingredient_name: ingredient.name,
              success: false,
              error: "No supplier URL",
            };
          }

          const scrapedData = await scrapePrice(ingredient.supplier_url);

          if (!scrapedData) {
            return {
              ingredient_id: ingredient.id,
              ingredient_name: ingredient.name,
              success: false,
              error: "Failed to scrape price",
            };
          }

          // Update ingredient with new price
          const { error: updateError } = await supabase
            .from("ingredients")
            .update({
              current_price_cents: scrapedData.price_cents,
              supplier_name: scrapedData.supplier_name,
              last_scraped_at: new Date().toISOString(),
            })
            .eq("id", ingredient.id);

          if (updateError) {
            console.error("Error updating ingredient:", updateError);
            return {
              ingredient_id: ingredient.id,
              ingredient_name: ingredient.name,
              success: false,
              error: "Failed to update ingredient",
            };
          }

          // Add to price history
          await supabase.from("price_history").insert({
            ingredient_id: ingredient.id,
            price_cents: scrapedData.price_cents,
            supplier_name: scrapedData.supplier_name,
            scraped_at: new Date().toISOString(),
          });

          return {
            ingredient_id: ingredient.id,
            ingredient_name: ingredient.name,
            success: true,
            old_price_cents: ingredient.current_price_cents,
            new_price_cents: scrapedData.price_cents,
            supplier_name: scrapedData.supplier_name,
          };
        } catch (error) {
          console.error(
            `Error scraping price for ${ingredient.name}:`,
            error
          );
          return {
            ingredient_id: ingredient.id,
            ingredient_name: ingredient.name,
            success: false,
            error: "Unexpected error during scraping",
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      message: `Successfully scraped ${successCount} of ${results.length} ingredients`,
      results,
    });
  } catch (error) {
    console.error("Scrape prices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
