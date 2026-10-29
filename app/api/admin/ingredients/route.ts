import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IngredientFormData } from "@/lib/types";

// GET - Fetch all ingredients
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

    // Fetch all ingredients
    const { data: ingredients, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching ingredients:", error);
      return NextResponse.json(
        { error: "Failed to fetch ingredients" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ingredients });
  } catch (error) {
    console.error("Ingredients GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new ingredient
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

    const body: IngredientFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.unit || body.package_quantity === undefined) {
      return NextResponse.json(
        {
          error:
            "Name, unit, and package quantity are required",
        },
        { status: 400 }
      );
    }

    // Insert ingredient
    const { data: ingredient, error } = await supabase
      .from("ingredients")
      .insert({
        name: body.name,
        unit: body.unit,
        current_price_cents: body.current_price_cents || 0,
        package_quantity: body.package_quantity,
        supplier_name: body.supplier_name || null,
        supplier_url: body.supplier_url || null,
        last_scraped_at: body.last_scraped_at || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ingredient:", error);
      return NextResponse.json(
        { error: "Failed to create ingredient" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ingredient }, { status: 201 });
  } catch (error) {
    console.error("Ingredients POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
