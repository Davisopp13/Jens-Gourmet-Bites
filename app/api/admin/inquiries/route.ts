import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  inquiryUser,
  inquiryFailure,
  privateHeaders,
  InquiryError,
} from "@/lib/inquiries/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await inquiryUser();
    const db = createAdminClient();
    const params = new URL(request.url).searchParams;
    const { count, error: countError } = await db
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    if (countError) throw countError;
    if (params.get("countOnly") === "1")
      return NextResponse.json(
        { newCount: count ?? 0 },
        { headers: privateHeaders },
      );
    const filter = params.get("filter") || "open";
    if (!["open", "new", "in_progress", "done", "history"].includes(filter))
      throw new InquiryError("Unknown filter.");
    const offset = Number(params.get("offset") || 0);
    if (!Number.isSafeInteger(offset) || offset < 0)
      throw new InquiryError("Invalid page.");
    let query = db
      .from("contact_submissions")
      .select(
        "id,name,email,phone,message,preferred_format,status,version,created_at,updated_at",
      );
    if (filter === "history") query = query.is("status", null);
    else if (filter === "open")
      query = query.in("status", ["new", "in_progress"]);
    else query = query.eq("status", filter);
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 49);
    if (error) throw error;
    return NextResponse.json(
      { inquiries: data, newCount: count ?? 0, hasMore: data.length === 50 },
      { headers: privateHeaders },
    );
  } catch (e) {
    return inquiryFailure(e);
  }
}
