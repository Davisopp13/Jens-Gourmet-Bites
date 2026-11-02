import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const notificationFailure = () => NextResponse.json(
  { error: "We couldn't notify Jen about your inquiry. Please email jensgourmetbites@gmail.com directly." },
  { status: 503 }
);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]!));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, preferred_format } = body;

    // Validate required fields
    if (
      typeof name !== "string" || !name.trim() || name.length > 200 ||
      typeof email !== "string" || !email.trim() || email.length > 254 ||
      typeof message !== "string" || !message.trim() || message.length > 10000 ||
      (phone != null && (typeof phone !== "string" || phone.length > 100)) ||
      (preferred_format != null && !["frozen", "baked", "either", ""].includes(preferred_format))
    ) {
      return NextResponse.json(
        { error: "Please provide a valid name, email, and message" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("Contact notification is not configured");
      return notificationFailure();
    }

    // Save to database
    const supabase = createAdminClient();
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        name,
        email,
        phone: phone || null,
        message,
        preferred_format: preferred_format || null,
      });

    if (dbError) {
      console.error("Contact persistence failed:", dbError.code);
      // Continue to send email even if DB fails
    }

    // Format the preferred format for display
    const formatMap: Record<string, string> = {
      frozen: "Frozen Dough",
      baked: "Fresh Baked",
      either: "Either is fine",
    };
    const formatDisplay = preferred_format ? formatMap[preferred_format] || "Not specified" : "Not specified";

    // Send email notification
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
          from: process.env.CONTACT_FROM_EMAIL || "Jen's Gourmet Bites <orders@jensgourmetbites.com>",
          to: process.env.CONTACT_EMAIL || "jensgourmetbites@gmail.com",
          replyTo: email,
          subject: `New Order Inquiry from ${name}`,
          text: `New Order Inquiry\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nPreferred format: ${formatDisplay}\n\n${message}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #146C68; border-bottom: 2px solid #146C68; padding-bottom: 10px;">
                New Order Inquiry
              </h2>

              <div style="margin: 20px 0;">
                <p><strong style="color: #146C68;">Name:</strong> ${escapeHtml(name)}</p>
                <p><strong style="color: #146C68;">Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
                <p><strong style="color: #146C68;">Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
                <p><strong style="color: #146C68;">Preferred Format:</strong> ${formatDisplay}</p>
              </div>

              <div style="background: #FFF7ED; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong style="color: #146C68;">Message:</strong></p>
                <p style="white-space: pre-wrap; margin: 10px 0 0 0;">${escapeHtml(message)}</p>
              </div>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This message was sent from the Jen's Gourmet Bites website contact form.
              </p>
            </div>
          `,
        });
        if (error || !data?.id) {
          console.error("Contact email rejected:", error?.name || "missing_email_id");
          return notificationFailure();
        }
      } catch (emailError) {
        console.error("Contact email request failed:", emailError instanceof Error ? emailError.name : "unknown");
        return notificationFailure();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Failed to submit contact form. Please try again." },
      { status: 500 }
    );
  }
}
