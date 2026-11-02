import { redirect } from "next/navigation";
import { inquiryUser, InquiryError } from "@/lib/inquiries/server";
import InquiryQueue from "@/components/admin/InquiryQueue";
export const dynamic = "force-dynamic";
export default async function InquiriesPage() {
  try {
    await inquiryUser();
  } catch (e) {
    if (e instanceof InquiryError && e.status === 401)
      redirect("/admin/login?next=/admin/inquiries");
    return <p>This account cannot access inquiries.</p>;
  }
  return <InquiryQueue />;
}
