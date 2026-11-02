import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  inquiryUser,
  inquiryFailure,
  privateHeaders,
  getInquiry,
} from "@/lib/inquiries/server";
import { editSchema } from "@/lib/inquiries/validation";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    await inquiryUser();
    const { id } = await context.params;
    const inquiry = await getInquiry(id);
    const db = createAdminClient();
    const [{ data: activity, error: a }, { data: notifications, error: n }] =
      await Promise.all([
        db
          .from("inquiry_activity")
          .select("id,kind,actor_label,body,created_at")
          .eq("inquiry_id", id)
          .order("created_at")
          .order("id"),
        db
          .from("inquiry_notifications")
          .select("id,channel,state,attempts,last_error")
          .eq("inquiry_id", id)
          .order("created_at"),
      ]);
    if (a || n) throw a || n;
    return NextResponse.json(
      { inquiry, activity, notifications },
      { headers: privateHeaders },
    );
  } catch (e) {
    return inquiryFailure(e);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const user = await inquiryUser(request);
    const { id } = await context.params;
    await getInquiry(id);
    const body = editSchema.parse(await request.json());
    const { error } = await createAdminClient().rpc("edit_inquiry", {
      p_id: id,
      p_version: body.version,
      p_actor: user.id,
      p_actor_label: user.email || "Admin",
      p_status: body.action === "status" ? body.status : null,
      p_note: body.action === "note" ? body.note : null,
    });
    if (error) throw error;
    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch (e) {
    return inquiryFailure(e);
  }
}
