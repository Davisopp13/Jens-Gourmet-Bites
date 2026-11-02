import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RecipeFormData, RecipeIngredientFormData } from "@/lib/types";

// GET - Fetch all recipes with their ingredients
export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all recipes with products
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select(`
        *,
        product:products(*)
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching recipes:", error);
      return NextResponse.json(
        { error: "Failed to fetch recipes" },
        { status: 500 }
      );
    }

    // For each recipe, fetch its ingredients
    const recipesWithIngredients = await Promise.all(
      (recipes || []).map(async (recipe) => {
        const { data: recipeIngredients, error: riError } = await supabase
          .from("recipe_ingredients")
          .select(`
            *,
            ingredient:ingredients(*)
          `)
          .eq("recipe_id", recipe.id);

        if (riError) {
          console.error("Error fetching recipe ingredients:", riError);
          return { ...recipe, recipe_ingredients: [] };
        }

        return { ...recipe, recipe_ingredients: recipeIngredients };
      })
    );

    return NextResponse.json({ recipes: recipesWithIngredients });
  } catch (error) {
    console.error("Recipes GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new recipe with ingredients
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

    const body: RecipeFormData & {
      ingredients?: RecipeIngredientFormData[];
    } = await request.json();

    // Validate required fields
    if (!body.name || !body.product_id || !body.batch_size) {
      return NextResponse.json(
        {
          error: "Name, product_id, and batch_size are required",
        },
        { status: 400 }
      );
    }

    // Insert recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        product_id: body.product_id,
        name: body.name,
        batch_size: body.batch_size,
        instructions: body.instructions || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (recipeError) {
      console.error("Error creating recipe:", recipeError);
      return NextResponse.json(
        { error: "Failed to create recipe" },
        { status: 500 }
      );
    }

    // Insert recipe ingredients if provided
    if (body.ingredients && body.ingredients.length > 0) {
      const ingredientsToInsert = body.ingredients.map((ing) => ({
        recipe_id: recipe.id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes || null,
      }));

      const { error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredientsToInsert);

      if (ingredientsError) {
        console.error("Error adding recipe ingredients:", ingredientsError);
        // Continue even if ingredients fail - can add them later
      }
    }

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error("Recipes POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
