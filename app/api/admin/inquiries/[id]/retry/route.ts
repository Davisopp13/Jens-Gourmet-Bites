import { NextResponse } from "next/server";
import {
  inquiryUser,
  inquiryFailure,
  privateHeaders,
  getInquiry,
} from "@/lib/inquiries/server";
import { deliverNotifications } from "@/lib/inquiries/notifications";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await inquiryUser(request);
    const { id } = await params;
    await getInquiry(id);
    await deliverNotifications(id);
    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch (e) {
    return inquiryFailure(e);
  }
}
