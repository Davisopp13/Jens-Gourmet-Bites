import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recipeCost } from "@/lib/pricing";
import type { RecipeWithIngredients } from "@/lib/types";
import { receiptFailure, receiptUser, ReceiptError } from "@/lib/receipts/server";
export const dynamic="force-dynamic";
async function calculate(ids?:string[],margin=40){
  const db=await createClient();let query=db.from("recipes").select("*,product:products(*),recipe_ingredients(*,ingredient:ingredients(*))");if(ids?.length)query=query.in("id",ids);
  const {data,error}=await query;if(error)throw error;
  return (data as RecipeWithIngredients[]).map(recipe=>{let cost;try{cost=recipeCost(recipe);}catch(e){throw new ReceiptError(`${recipe.name}: ${e instanceof Error?e.message:"Check recipe costs"}`,422);}
    const pack=recipe.product?.batch_size;if(!pack||pack<=0)throw new ReceiptError("Product selling pack size is missing",422);
    const packCost=cost.total/recipe.batch_size*pack;const price=recipe.product?.price_cents||0;
    return {recipe_id:recipe.id,recipeName:recipe.name,batchSize:recipe.batch_size,totalCostCents:Math.round(cost.total),costPerUnitCents:Math.round(cost.total/recipe.batch_size),sellingPackSize:pack,packIngredientCostCents:Math.round(packCost),currentPriceCents:price,suggestedPriceCents:Math.ceil(packCost/(1-margin/100)),profitMarginPercentage:price>0?(price-packCost)/price*100:0,ingredients:cost.lines.map(l=>({...l,costCents:Math.round(l.costCents)})),costScope:"ingredients_only"};});
}
export async function POST(request:Request){try{await receiptUser(request);const body=z.object({recipe_ids:z.array(z.string().uuid()).max(100).optional(),target_profit_margin:z.number().min(0).max(99.9).default(40)}).parse(await request.json());return NextResponse.json({calculations:await calculate(body.recipe_ids,body.target_profit_margin),target_profit_margin:body.target_profit_margin});}catch(error){return receiptFailure(error);}}
export async function GET(){try{await receiptUser();const results=await calculate();return NextResponse.json({summary:results.map(r=>({recipe_id:r.recipe_id,recipe_name:r.recipeName,batch_size:r.batchSize,ingredient_count:r.ingredients.length,total_cost_cents:r.totalCostCents,cost_per_cookie_cents:r.costPerUnitCents,current_selling_price_cents:r.currentPriceCents,profit_margin_percentage:r.profitMarginPercentage,cost_scope:r.costScope}))});}catch(error){return receiptFailure(error);}}
