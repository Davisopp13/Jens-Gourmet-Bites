import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  inquiryUser,
  inquiryFailure,
  privateHeaders,
  InquiryError,
} from "@/lib/inquiries/server";
import { sendPush } from "@/lib/inquiries/notifications";
export async function POST(request: Request) {
  try {
    const user = await inquiryUser(request);
    const { endpoint } = await request.json();
    if (typeof endpoint !== "string" || endpoint.length > 3000)
      throw new InquiryError("Invalid device.");
    const db = createAdminClient();
    const { data, error } = await db
      .from("inquiry_push_subscriptions")
      .select("id,endpoint,keys")
      .eq("endpoint", endpoint)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new InquiryError("Enable notifications on this device first.");
    try {
      await sendPush(data, {
        title: "Jen’s Gourmet Bites",
        body: "Notifications are working on this device.",
        url: "/admin/inquiries",
        tag: "inquiry-test",
      });
    } catch (e) {
      if ([404, 410].includes((e as { statusCode?: number }).statusCode ?? 0))
        await db.from("inquiry_push_subscriptions").delete().eq("id", data.id);
      throw new InquiryError(
        "The test notification could not be sent. Disable notifications on this device, then enable them again.",
        503,
      );
    }
    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch (e) {
    return inquiryFailure(e);
  }
}
