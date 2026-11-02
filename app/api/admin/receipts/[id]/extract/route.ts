import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findReceipt, receiptFailure, receiptUser, ReceiptError } from "@/lib/receipts/server";
import { extractReceipt } from "@/lib/receipts/extract";
import { ReceiptReaderError } from "@/lib/receipts/reader";
export const maxDuration=60;
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const user=await receiptUser(request);const receipt=await findReceipt((await params).id,user.id);
    if(!process.env.OPENAI_API_KEY)throw new ReceiptError("Automatic reading is not configured. You can still enter receipt details manually.",503);
    if(receipt.status!=="pending"||receipt.extraction_status==="processing"||receipt.extraction_attempts>=3)throw new ReceiptError("This receipt cannot be read again. Review or enter its details manually.",409);
    const db=createAdminClient();
    const {data:lock,error}=await db.from("receipts").update({extraction_status:"processing",extraction_attempts:receipt.extraction_attempts+1,version:receipt.version+1}).eq("id",receipt.id).eq("owner_id",user.id).eq("version",receipt.version).select().maybeSingle();
    if(error)throw error;if(!lock)throw new ReceiptError("Receipt changed. Reload first.",409);
    let update;
    try {const result=await extractReceipt(receipt);update={data:result.data,extraction_status:"ready",extraction_message:result.message};}
    catch (error) {update={extraction_status:"failed",extraction_message:error instanceof ReceiptReaderError?`${error.message} The original is saved.`:"Automatic reading failed. The original is saved; enter details manually or retry."};}
    const {data,error:saveError}=await db.from("receipts").update({...update,version:receipt.version+2}).eq("id",receipt.id).eq("owner_id",user.id).eq("version",receipt.version+1).select().maybeSingle();
    if(saveError)throw saveError;if(!data)throw new ReceiptError("Receipt was edited during reading. Reload to see the saved version.",409);
    return NextResponse.json({receipt:data});
  }catch(error){return receiptFailure(error);}
}
