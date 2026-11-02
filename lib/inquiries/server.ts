import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminAllowed } from "./types";
export const privateHeaders = { "Cache-Control": "private, no-store" };
export class InquiryError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function inquiryUser(request?: Request) {
  if (
    request &&
    request.method !== "GET" &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    throw new InquiryError("Please use the admin website.", 403);
  const {
    data: { user },
    error,
  } = await (await createClient()).auth.getUser();
  if (error || !user) throw new InquiryError("Please sign in again.", 401);
  if (!adminAllowed(user))
    throw new InquiryError("This account cannot access inquiries.", 403);
  return user;
}
export function inquiryFailure(error: unknown) {
  if (error instanceof InquiryError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers: privateHeaders },
    );
  if (error instanceof ZodError || error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Please check the submitted values." },
      { status: 400, headers: privateHeaders },
    );
  const code = (error as { code?: string })?.code;
  if (code === "PT409")
    return NextResponse.json(
      {
        error:
          "This inquiry changed. Refresh before saving; your note is still here.",
      },
      { status: 409, headers: privateHeaders },
    );
  console.error("Inquiry operation failed", code ?? "unknown");
  return NextResponse.json(
    { error: "Inquiries could not be loaded or saved. Please try again." },
    { status: 503, headers: privateHeaders },
  );
}
export async function getInquiry(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id))
    throw new InquiryError("Inquiry not found.", 404);
  const db = createAdminClient();
  const { data, error } = await db
    .from("contact_submissions")
    .select(
      "id,name,email,phone,message,preferred_format,status,version,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new InquiryError("Inquiry not found.", 404);
  return data;
}
