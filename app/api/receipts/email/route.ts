import { NextResponse } from "next/server";
import { Resend } from "resend";
import { load } from "cheerio";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestReceipt } from "@/lib/receipts/server";
import { readLimited, MAX_BYTES, emailAddress, allowedReceiptSender, validateReceiptDownloadUrl, type IncomingFile } from "@/lib/receipts/validation";

export const runtime="nodejs";
export const maxDuration=60;
async function download(url:string,limit:number){
  validateReceiptDownloadUrl(url);
  return readLimited(await fetch(url,{redirect:"error",signal:AbortSignal.timeout(15000)}),limit);
}
export async function POST(request:Request){
  const key=process.env.RESEND_API_KEY;const secret=process.env.RESEND_RECEIPT_WEBHOOK_SECRET;
  const owner=process.env.RECEIPT_INBOX_OWNER_ID;const inbox=process.env.RECEIPT_INBOX_ADDRESS?.toLowerCase();
  if(!key||!secret||!owner||!inbox)return NextResponse.json({error:"Receipt inbox is not configured"},{status:503});
  const resend=new Resend(key);let event;
  try{
    const raw=(await readLimited(new Response(request.body),100000)).toString("utf8");
    event=resend.webhooks.verify({payload:raw,headers:{id:request.headers.get("svix-id")||"",timestamp:request.headers.get("svix-timestamp")||"",signature:request.headers.get("svix-signature")||""},webhookSecret:secret});
  }catch{return NextResponse.json({error:"Invalid webhook"},{status:400});}
  if(event.type!=="email.received")return NextResponse.json({ignored:true});
  try{
    const id=z.string().uuid().parse(event.data.email_id);
    const db=createAdminClient();
    const {data:prior,error:priorError}=await db.from("receipts").select("id").eq("owner_id",owner).eq("source_id",id).maybeSingle();
    if(priorError)throw priorError;if(prior)return NextResponse.json({received:true,duplicate:true});
    const {data:mail,error}=await resend.emails.receiving.get(id);
    if(error||!mail)throw new Error("Email unavailable");
    if(!mail.to.some(to=>emailAddress(to)===inbox))return NextResponse.json({ignored:true});
    const allowed=(process.env.RECEIPT_ALLOWED_SENDERS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
    const sender=emailAddress(mail.from);
    if(!allowed.length)return NextResponse.json({error:"Configure allowed receipt senders"},{status:503});
    if(!allowedReceiptSender(sender,allowed.join(",")))return NextResponse.json({ignored:true});
    const {count,error:countError}=await db.from("receipts").select("id",{count:"exact",head:true}).eq("owner_id",owner).eq("source","email").gte("created_at",new Date(Date.now()-86400000).toISOString());
    if(countError)throw countError;if((count??0)>=100)return NextResponse.json({error:"Daily receipt intake limit reached"},{status:429});
    const dom=load(mail.html || "");dom("script,style,head").remove();
    const text=(mail.text || dom.root().text()).slice(0,40000);
    const files:IncomingFile[]=[];
    if(mail.raw?.download_url)files.push({name:"original-email.eml",type:"message/rfc822",bytes:await download(mail.raw.download_url,MAX_BYTES*2)});
    else files.push({name:"email-content.txt",type:"text/plain",bytes:Buffer.from(JSON.stringify({from:mail.from,to:mail.to,subject:mail.subject,date:mail.created_at,message_id:mail.message_id,headers:mail.headers,text,html:mail.html},null,2))});
    const {data:attachments,error:attachmentError}=await resend.emails.receiving.attachments.list({emailId:id});
    if(attachmentError||!attachments)throw new Error("Attachments unavailable");
    const supported=attachments.data.filter(a=>["image/jpeg","image/png","image/webp","application/pdf"].includes(a.content_type));
    if(supported.length>5 || supported.reduce((sum,a)=>sum+a.size,0)>MAX_BYTES)throw new Error("Attachments exceed receipt limit");
    for(const attachment of supported)files.push({name:attachment.filename || "receipt",type:attachment.content_type,bytes:await download(attachment.download_url,MAX_BYTES)});
    const result=await ingestReceipt(owner,files,{source:"email",sourceId:id,subject:mail.subject,sender:mail.from,text});
    return NextResponse.json({received:true,duplicate:result.duplicate});
  }catch{console.error("Receipt email intake failed; provider should retry delivery.");return NextResponse.json({error:"Receipt intake failed; retry this event"},{status:500});}
}
