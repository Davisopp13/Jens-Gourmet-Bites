import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, preferred_format } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
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
      console.error("Database error:", dbError);
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
        await resend.emails.send({
          from: "Jen's Gourmet Bites <onboarding@resend.dev>",
          to: process.env.CONTACT_EMAIL || "jensgourmetbites@gmail.com",
          replyTo: email,
          subject: `New Order Inquiry from ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B4513; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">
                New Order Inquiry
              </h2>

              <div style="margin: 20px 0;">
                <p><strong style="color: #8B4513;">Name:</strong> ${name}</p>
                <p><strong style="color: #8B4513;">Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong style="color: #8B4513;">Phone:</strong> ${phone || "Not provided"}</p>
                <p><strong style="color: #8B4513;">Preferred Format:</strong> ${formatDisplay}</p>
              </div>

              <div style="background: #FFF8F0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong style="color: #8B4513;">Message:</strong></p>
                <p style="white-space: pre-wrap; margin: 10px 0 0 0;">${message}</p>
              </div>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This message was sent from the Jen's Gourmet Bites website contact form.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Email error:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form. Please try again." },
      { status: 500 }
    );
  }
}
