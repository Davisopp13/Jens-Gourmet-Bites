import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RecipeFormData, RecipeIngredientFormData } from "@/lib/types";

// GET - Fetch a single recipe with ingredients
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch recipe with product
    const { data: recipe, error } = await supabase
      .from("recipes")
      .select(`
        *,
        product:products(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching recipe:", error);
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Fetch recipe ingredients
    const { data: recipeIngredients, error: riError } = await supabase
      .from("recipe_ingredients")
      .select(`
        *,
        ingredient:ingredients(*)
      `)
      .eq("recipe_id", recipe.id);

    if (riError) {
      console.error("Error fetching recipe ingredients:", riError);
    }

    return NextResponse.json({
      recipe: { ...recipe, recipe_ingredients: recipeIngredients || [] },
    });
  } catch (error) {
    console.error("Recipe GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a recipe
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: Partial<RecipeFormData> & {
      ingredients?: RecipeIngredientFormData[];
    } = await request.json();

    // Update recipe
    const { data: recipe, error } = await supabase
      .from("recipes")
      .update({
        ...(body.name && { name: body.name }),
        ...(body.product_id && { product_id: body.product_id }),
        ...(body.batch_size && { batch_size: body.batch_size }),
        ...(body.instructions !== undefined && {
          instructions: body.instructions || null,
        }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating recipe:", error);
      return NextResponse.json(
        { error: "Failed to update recipe" },
        { status: 500 }
      );
    }

    // If ingredients are provided, replace all recipe ingredients
    if (body.ingredients) {
      // Delete existing ingredients
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);

      // Insert new ingredients
      if (body.ingredients.length > 0) {
        const ingredientsToInsert = body.ingredients.map((ing) => ({
          recipe_id: id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || null,
        }));

        const { error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .insert(ingredientsToInsert);

        if (ingredientsError) {
          console.error("Error updating recipe ingredients:", ingredientsError);
        }
      }
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Recipe PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a recipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete recipe (recipe_ingredients will cascade delete)
    const { error } = await supabase.from("recipes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting recipe:", error);
      return NextResponse.json(
        { error: "Failed to delete recipe" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recipe DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
