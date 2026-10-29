import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestReceipt, receiptFailure, receiptUser, ReceiptError } from "@/lib/receipts/server";
import { MAX_BYTES, readLimited } from "@/lib/receipts/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const user=await receiptUser(); const url=new URL(request.url);
    const page=Math.floor(Math.max(0,Math.min(10000,Number(url.searchParams.get("page"))||0)));
    const search=(url.searchParams.get("q") || "").slice(0,100).replace(/[\\%_]/g," ");
    const db=createAdminClient();
    let query=db.from("receipts").select("*",{count:"exact"}).eq("owner_id",user.id);
    if(search) query=query.ilike("search_text",`%${search}%`);
    const status=url.searchParams.get("status");if(status==="pending")query=query.eq("status","pending");
    const {data,error,count}=await query.order("created_at",{ascending:false}).range(page*20,page*20+19);
    if(error) throw error;
    return NextResponse.json({receipts:data,total:count,readerConfigured:!!process.env.OPENAI_API_KEY},{headers:{"Cache-Control":"private, no-store"}});
  } catch(error) {return receiptFailure(error);}
}
export async function POST(request: Request) {
  try {
    const user=await receiptUser(request);
    if(Number(request.headers.get("content-length")||0)>MAX_BYTES+200000)throw new ReceiptError("Receipts must be at most 3 MB combined.",413);
    const bytes=await readLimited(new Response(request.body),MAX_BYTES+200000);
    const form=await new Response(new Uint8Array(bytes),{headers:{"Content-Type":request.headers.get("content-type")||""}}).formData(); const files=form.getAll("files");
    if(!files.length || files.length>5 || files.some(f=>typeof f==="string"))throw new ReceiptError("Choose one to five receipt images or PDFs.");
    const incoming=[];let total=0;
    for(const file of files as File[]){total+=file.size;if(total>MAX_BYTES)throw new ReceiptError("Receipts must be at most 3 MB combined.",413);incoming.push({name:file.name,type:file.type,bytes:Buffer.from(await file.arrayBuffer())});}
    const result=await ingestReceipt(user.id,incoming,{source:"upload"});
    return NextResponse.json(result,{status:result.duplicate?200:201});
  } catch(error){return receiptFailure(error);}
}
