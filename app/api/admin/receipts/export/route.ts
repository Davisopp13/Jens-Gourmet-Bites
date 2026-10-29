import { createAdminClient } from "@/lib/supabase/admin";
import { receiptFailure, receiptUser } from "@/lib/receipts/server";
import { csvCell } from "@/lib/receipts/validation";
import type { ReceiptRecord } from "@/lib/receipts/types";
export const dynamic="force-dynamic";
export async function GET(){try{
  const user=await receiptUser();const db=createAdminClient();const records:ReceiptRecord[]=[];
  for(let start=0;;start+=500){const {data,error}=await db.from("receipts").select("*").eq("owner_id",user.id).order("created_at").order("id").range(start,start+499);if(error)throw error;records.push(...data);if(data.length<500)break;}
  const rows=[["Receipt ID","Purchase date","Store","Location","Source","Status","Total USD","Tax USD","Notes"]];
  for(const r of records)rows.push([r.id,r.data.purchased_on,r.data.store,r.data.location,r.source,r.status,(r.data.total_cents/100).toFixed(2),(r.data.tax_cents/100).toFixed(2),r.data.notes]);
  return new Response(rows.map(row=>row.map(csvCell).join(",")).join("\r\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=receipt-archive.csv","Cache-Control":"private, no-store"}});
}catch(error){return receiptFailure(error);}}
