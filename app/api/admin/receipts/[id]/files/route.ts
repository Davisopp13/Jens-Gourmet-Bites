import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findReceipt, receiptFailure, receiptUser, ReceiptError } from "@/lib/receipts/server";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{
  const user=await receiptUser();const receipt=await findReceipt((await params).id,user.id);const index=Number(new URL(request.url).searchParams.get("index"));
  if(!Number.isInteger(index)||index<0||!receipt.files[index])throw new ReceiptError("File not found",404);
  const file=receipt.files[index];if(!file.path.startsWith(`${user.id}/${receipt.id}/`))throw new ReceiptError("File not found",404);
  const {data,error}=await createAdminClient().storage.from("receipts").createSignedUrl(file.path,60,{download:file.name});
  if(error)throw error;
  return NextResponse.json({url:data.signedUrl},{headers:{"Cache-Control":"private, no-store"}});
}catch(error){return receiptFailure(error);}}
