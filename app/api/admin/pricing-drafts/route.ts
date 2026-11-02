import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { receiptFailure, receiptUser, ReceiptError } from "@/lib/receipts/server";
import { calculateOrder } from "@/lib/pricing";
export const dynamic="force-dynamic";
const num=z.number().finite().min(0).max(1000000);
const schema=z.object({recipe_id:z.string().uuid(),values:z.object({packs:num.int().min(1),packSize:num.int().min(1),packaging:num,minutes:num,hourly:num,overhead:num,waste:num,margin:num.max(99.9),selling:num}),costs_confirmed:z.literal(true)});
export async function GET(){try{const user=await receiptUser();const {data,error}=await createAdminClient().from("pricing_drafts").select("*").eq("owner_id",user.id).order("created_at",{ascending:false}).limit(100);if(error)throw error;return NextResponse.json({drafts:data},{headers:{"Cache-Control":"private, no-store"}});}catch(error){return receiptFailure(error);}}
export async function POST(request:Request){try{
  const user=await receiptUser(request);const body=schema.parse(await request.json());const db=createAdminClient();
  const {data:recipe,error}=await db.from("recipes").select("*, product:products(*), recipe_ingredients(*,ingredient:ingredients(*))").eq("id",body.recipe_id).single();if(error)throw error;
  let calculation;try{calculation=calculateOrder(recipe,[],body.values);}catch(error){throw new ReceiptError(error instanceof Error?error.message:"Check pricing inputs");}
  const {data,error:saveError}=await db.from("pricing_drafts").insert({owner_id:user.id,name:recipe.name,snapshot:{recipe,values:body.values,calculation,costs_confirmed:true}}).select().single();if(saveError)throw saveError;return NextResponse.json({draft:data},{status:201});
}catch(error){return receiptFailure(error);}}
