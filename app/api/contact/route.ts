import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowedAdminIds } from "@/lib/inquiries/types";
import { contactSchema } from "@/lib/inquiries/validation";
import { deliverNotifications } from "@/lib/inquiries/notifications";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  let input;
  try {
    input = contactSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Please provide a valid name, email, and message." },
      { status: 400 },
    );
  }
  const { submission_id, ...fields } = input;
  const normalized = {
    name: fields.name,
    email: fields.email,
    phone: fields.phone || null,
    message: fields.message,
    preferred_format: fields.preferred_format || null,
  };
  try {
    const { data: id, error } = await createAdminClient().rpc(
      "create_inquiry",
      {
        p_submission_id: submission_id || randomUUID(),
        p_fingerprint: createHash("sha256")
          .update(JSON.stringify(normalized))
          .digest("hex"),
        p_name: normalized.name,
        p_email: normalized.email,
        p_phone: normalized.phone,
        p_message: normalized.message,
        p_format: normalized.preferred_format,
        p_admin_ids: allowedAdminIds(),
      },
    );
    if (error?.code === "PT409")
      return NextResponse.json(
        { error: "This submission changed. Please start a new message." },
        { status: 409 },
      );
    if (error || !id) throw error;
    // A saved inquiry is the success condition. Both channels have independent, durable results.
    try {
      await deliverNotifications(id);
    } catch (e) {
      console.error(
        "Inquiry notifications pending",
        (e as { code?: string })?.code ?? "unknown",
      );
    }
    return NextResponse.json({ success: true, inquiry_id: id });
  } catch (e) {
    console.error(
      "Inquiry save failed",
      (e as { code?: string })?.code ?? "unknown",
    );
    return NextResponse.json(
      {
        error:
          "We could not save your inquiry. Please try again, or email jensgourmetbites@gmail.com.",
      },
      { status: 503 },
    );
  }
}
