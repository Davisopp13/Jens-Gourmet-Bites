import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  inquiryUser,
  inquiryFailure,
  privateHeaders,
  InquiryError,
} from "@/lib/inquiries/server";
import { subscriptionSchema } from "@/lib/inquiries/validation";
export async function GET() {
  try {
    await inquiryUser();
    return NextResponse.json(
      { publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null },
      { headers: privateHeaders },
    );
  } catch (e) {
    return inquiryFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    const user = await inquiryUser(request);
    const sub = subscriptionSchema.parse(await request.json());
    const db = createAdminClient();
    const { data: existing, error: findError } = await db
      .from("inquiry_push_subscriptions")
      .select("id,user_id")
      .eq("endpoint", sub.endpoint)
      .maybeSingle();
    if (findError) throw findError;
    if (existing && existing.user_id !== user.id)
      throw new InquiryError(
        "Disable notifications for the previous account on this device first.",
        409,
      );
    if (!existing) {
      const { count, error } = await db
        .from("inquiry_push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (error) throw error;
      if ((count ?? 0) >= 10)
        throw new InquiryError(
          "The device limit has been reached. Disable an older device first.",
        );
    }
    const { error } = await db
      .from("inquiry_push_subscriptions")
      .upsert({ user_id: user.id, ...sub }, { onConflict: "endpoint" });
    if (error) throw error;
    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch (e) {
    return inquiryFailure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await inquiryUser(request);
    const { endpoint } = await request.json();
    if (typeof endpoint !== "string" || endpoint.length > 3000)
      throw new InquiryError("Invalid device.");
    const { error } = await createAdminClient()
      .from("inquiry_push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch (e) {
    return inquiryFailure(e);
  }
}
