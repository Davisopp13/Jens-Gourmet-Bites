import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { findReceipt, receiptFailure, receiptUser, ReceiptError } from "@/lib/receipts/server";
import { validateReview } from "@/lib/receipts/types";
export const dynamic="force-dynamic";
export async function GET(_: Request,{params}:{params:Promise<{id:string}>}){try{const user=await receiptUser();return NextResponse.json({receipt:await findReceipt((await params).id,user.id)},{headers:{"Cache-Control":"private, no-store"}});}catch(error){return receiptFailure(error);}}
export async function PATCH(request: Request,{params}:{params:Promise<{id:string}>}){
  try{
    const user=await receiptUser(request);await findReceipt((await params).id,user.id);
    const body=z.object({version:z.number().int().positive(),apply:z.boolean(),data:z.unknown()}).parse(await request.json());
    let reviewed;try{reviewed=validateReview(body.data,body.apply);}catch(error){if(error instanceof z.ZodError)throw error;throw new ReceiptError(error instanceof Error?error.message:"Check receipt details");}
    const {data,error}=await createAdminClient().rpc("review_receipt",{p_id:(await params).id,p_owner:user.id,p_version:body.version,p_data:reviewed,p_apply:body.apply});
    if(error)throw new ReceiptError(error.message,error.code==="40001"?409:400);
    return NextResponse.json({receipt:data});
  }catch(error){return receiptFailure(error);}
}
