import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IngredientFormData } from "@/lib/types";

// GET - Fetch a single ingredient
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

    // Fetch ingredient
    const { data: ingredient, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching ingredient:", error);
      return NextResponse.json(
        { error: "Ingredient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ingredient });
  } catch (error) {
    console.error("Ingredient GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update an ingredient
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

    const body: Partial<IngredientFormData> = await request.json();

    // Update ingredient
    const { data: ingredient, error } = await supabase
      .from("ingredients")
      .update({
        ...((body.current_price_cents !== undefined || body.package_quantity !== undefined || body.unit !== undefined || body.name !== undefined) && {
          price_verified_at: null,
          price_receipt_id: null,
          exact_product_name: null,
        }),
        ...(body.name && { name: body.name }),
        ...(body.unit && { unit: body.unit }),
        ...(body.current_price_cents !== undefined && {
          current_price_cents: body.current_price_cents,
        }),
        ...(body.package_quantity !== undefined && {
          package_quantity: body.package_quantity,
        }),
        ...(body.supplier_name !== undefined && {
          supplier_name: body.supplier_name || null,
        }),
        ...(body.supplier_url !== undefined && {
          supplier_url: body.supplier_url || null,
        }),
        ...(body.last_scraped_at !== undefined && {
          last_scraped_at: body.last_scraped_at || null,
        }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating ingredient:", error);
      return NextResponse.json(
        { error: "Failed to update ingredient" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ingredient });
  } catch (error) {
    console.error("Ingredient PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an ingredient
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

    // Delete ingredient
    const { error } = await supabase.from("ingredients").delete().eq("id", id);

    if (error) {
      console.error("Error deleting ingredient:", error);
      return NextResponse.json(
        { error: "Failed to delete ingredient" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ingredient DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
