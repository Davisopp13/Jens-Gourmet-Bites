export type InquiryStatus = "new" | "in_progress" | "done";
export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferred_format: string | null;
  status: InquiryStatus | null;
  version: number;
  created_at: string;
  updated_at: string;
}
export interface Activity {
  id: string;
  kind: "status" | "note";
  actor_label: string;
  body: string;
  created_at: string;
}
export interface Notification {
  id: string;
  channel: "email" | "push";
  state: "pending" | "accepted" | "failed";
  attempts: number;
  last_error: string | null;
}
export interface InquiryDetail {
  inquiry: Inquiry;
  activity: Activity[];
  notifications: Notification[];
}
export const statusLabels = {
  new: "New",
  in_progress: "In progress",
  done: "Done",
  history: "History",
};
export function allowedAdminIds() {
  return (
    process.env.INQUIRY_ADMIN_USER_IDS ??
    process.env.RECEIPT_ADMIN_USER_IDS ??
    ""
  )
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s));
}
export function adminAllowed(user: { id: string; is_anonymous?: boolean }) {
  return !user.is_anonymous && allowedAdminIds().includes(user.id);
}
export function safeInquiryReturn(value: string | null) {
  return value && /^\/admin\/inquiries(?:\/[0-9a-f-]{36})?$/.test(value)
    ? value
    : "/admin/products";
}
