import { redirect } from "next/navigation";
import { inquiryUser, InquiryError } from "@/lib/inquiries/server";
import InquiryQueue from "@/components/admin/InquiryQueue";
export const dynamic = "force-dynamic";
export default async function InquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return <p>Inquiry not found.</p>;
  try {
    await inquiryUser();
  } catch (e) {
    if (e instanceof InquiryError && e.status === 401)
      redirect(`/admin/login?next=/admin/inquiries/${id}`);
    return <p>This account cannot access inquiries.</p>;
  }
  return <InquiryQueue id={id} />;
}
