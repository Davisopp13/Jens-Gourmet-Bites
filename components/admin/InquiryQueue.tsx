"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PushSettings from "./PushSettings";
import {
  statusLabels,
  type Inquiry,
  type InquiryDetail,
} from "@/lib/inquiries/types";
const date = (v: string) =>
  new Date(v).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
const format = (v: string | null) =>
  ({ frozen: "Frozen dough", baked: "Fresh baked", either: "Either is fine" })[
    v || "either"
  ] || v;
async function api(path: string, method = "GET", body?: unknown) {
  const r = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Please try again.");
  return data;
}
export default function InquiryQueue({ id }: { id?: string }) {
  const [filter, setFilter] = useState("open");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [more, setMore] = useState(false);
  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const refresh = useCallback(async () => {
    try {
      if (id) setDetail(await api(`/api/admin/inquiries/${id}`));
      else {
        const result = await api(
          `/api/admin/inquiries?filter=${filter}&offset=${page * 50}`,
        );
        setRows(result.inquiries);
        setMore(result.hasMore);
      }
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id, filter, page]);
  useEffect(() => {
    setLoading(true);
    void refresh();
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    const timer = setInterval(onVisible, 30000);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);
  async function edit(body: unknown, retry = false) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(
        `/api/admin/inquiries/${id}${retry ? "/retry" : ""}`,
        retry ? "POST" : "PATCH",
        body,
      );
      if (!retry) setNote("");
      await refresh();
      window.dispatchEvent(new Event("inquiries-updated"));
      setNotice(
        retry
          ? "Notification attempts finished. Check the results below."
          : "Saved.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">
            {id ? "Inquiry" : "Inquiries"}
          </h1>
          <p className="mt-1 text-sm">
            {id
              ? "Contact details, private notes, and follow-up."
              : "Your website inquiries, ready for a personal reply."}
          </p>
        </div>
        <button className="btn-secondary min-h-11" onClick={() => refresh()}>
          Refresh
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {error}
        </p>
      )}
      <p role="status" className="text-sm">
        {loading ? "Loading…" : notice}
      </p>
      {!id ? (
        <>
          <PushSettings />
          <div className="flex flex-wrap gap-2" aria-label="Inquiry filters">
            {[
              ["open", "Open"],
              ["new", "New"],
              ["in_progress", "In progress"],
              ["done", "Done"],
              ["history", "History"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={filter === value}
                className={`${filter === value ? "btn-primary" : "btn-secondary"} min-h-11`}
                onClick={() => {
                  setFilter(value);
                  setPage(0);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {!loading && rows.length === 0 && !error && (
            <p className="rounded-xl border border-primary-200 p-6">
              {filter === "history"
                ? "Older submissions will appear here. Move one to New when it needs follow-up."
                : "No inquiries in this view yet."}
            </p>
          )}
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/inquiries/${row.id}`}
                  className="block rounded-xl border border-primary-200 bg-white p-4 hover:border-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h2 className="break-words font-semibold">{row.name}</h2>
                    <span className="rounded-full bg-cream px-3 py-1 text-sm">
                      {statusLabels[row.status || "history"]}
                    </span>
                  </div>
                  <p className="mt-1 break-all text-sm">{row.email}</p>
                  <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words">
                    {row.message}
                  </p>
                  <p className="mt-3 text-sm text-primary-700">
                    {date(row.created_at)} ET · {format(row.preferred_format)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            {page > 0 && (
              <button
                className="btn-secondary min-h-11"
                onClick={() => setPage((p) => p - 1)}
              >
                Previous page
              </button>
            )}
            {more && (
              <button
                className="btn-secondary min-h-11"
                onClick={() => setPage((p) => p + 1)}
              >
                Next page
              </button>
            )}
          </div>
        </>
      ) : (
        detail && (
          <>
            <Link
              href="/admin/inquiries"
              className="inline-flex min-h-11 items-center underline"
            >
              ← All inquiries
            </Link>
            <section className="rounded-xl border border-primary-200 bg-white p-4 sm:p-6">
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="break-words font-display text-2xl">
                  {detail.inquiry.name}
                </h2>
                <span>{statusLabels[detail.inquiry.status || "history"]}</span>
              </div>
              <p className="mt-2 text-sm">
                {date(detail.inquiry.created_at)} ET ·{" "}
                {format(detail.inquiry.preferred_format)}
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                <a
                  className="inline-flex min-h-11 items-center break-all underline"
                  href={`mailto:${detail.inquiry.email}`}
                >
                  Email {detail.inquiry.email}
                </a>
                {detail.inquiry.phone && (
                  <a
                    className="inline-flex min-h-11 items-center underline"
                    href={`tel:${detail.inquiry.phone.replace(/[^+0-9]/g, "")}`}
                  >
                    Call {detail.inquiry.phone}
                  </a>
                )}
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words">
                {detail.inquiry.message}
              </p>
              <div
                className="mt-6 flex flex-wrap gap-2"
                aria-label="Change inquiry status"
              >
                {(["new", "in_progress", "done"] as const).map((status) => (
                  <button
                    disabled={busy || status === detail.inquiry.status}
                    className="btn-secondary min-h-11 disabled:opacity-50"
                    key={status}
                    onClick={() =>
                      edit({
                        action: "status",
                        status,
                        version: detail.inquiry.version,
                      })
                    }
                  >
                    {status === "new"
                      ? detail.inquiry.status === null
                        ? "Move to New"
                        : detail.inquiry.status === "done"
                          ? "Reopen"
                          : "Mark New"
                      : `Mark ${statusLabels[status]}`}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-display text-xl">Notifications</h2>
              <p className="mt-1 text-sm">
                Accepted means the provider accepted the notification; it does
                not confirm it was read.
              </p>
              {detail.notifications.length === 0 ? (
                <p className="mt-2 text-sm">
                  Historical inquiry — no notifications were created.
                </p>
              ) : (
                <>
                  <ul className="mt-3 space-y-2">
                    {detail.notifications.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-lg border border-primary-200 p-3 text-sm"
                      >
                        <strong>
                          {n.channel === "email"
                            ? "Email to Jen"
                            : "Admin device push"}
                        </strong>
                        : {n.state} · {n.attempts} attempt
                        {n.attempts === 1 ? "" : "s"}
                        {n.last_error && (
                          <span className="block">
                            {(
                              {
                                email_not_configured:
                                  "Email setup is incomplete.",
                                push_not_configured:
                                  "Push setup is incomplete.",
                                device_unavailable:
                                  "Device is no longer subscribed.",
                                device_expired:
                                  "Device subscription expired. Enable notifications again on that device.",
                                email_provider_rejected:
                                  "Email provider rejected the request.",
                                delivery_failed:
                                  "Delivery failed. Please try again.",
                              } as Record<string, string>
                            )[n.last_error] || "Delivery needs attention."}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {detail.notifications.some((n) => n.state !== "accepted") && (
                    <button
                      className="btn-primary mt-3 min-h-11"
                      disabled={busy}
                      onClick={() => edit(undefined, true)}
                    >
                      Retry notification
                    </button>
                  )}
                  {!detail.notifications.some((n) => n.channel === "push") && (
                    <p className="mt-2 text-sm">
                      No admin devices were subscribed when this inquiry
                      arrived.
                    </p>
                  )}
                </>
              )}
            </section>
            <section>
              <h2 className="font-display text-xl">Private notes & activity</h2>
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void edit({
                    action: "note",
                    note,
                    version: detail.inquiry.version,
                  });
                }}
              >
                <label htmlFor="inquiry-note" className="block text-sm">
                  Add a private note
                </label>
                <textarea
                  id="inquiry-note"
                  required
                  maxLength={5000}
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field w-full"
                />
                <button
                  className="btn-primary min-h-11"
                  disabled={busy || !note.trim()}
                >
                  Save note
                </button>
              </form>
              <ol className="mt-5 space-y-3">
                {detail.activity.map((a) => (
                  <li key={a.id} className="rounded-lg bg-cream p-3">
                    <p className="text-sm break-words">
                      {a.actor_label} · {date(a.created_at)} ET ·{" "}
                      {a.kind === "note" ? "Private note" : "Status change"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words">
                      {a.kind === "status"
                        ? a.body
                            .split(" → ")
                            .map(
                              (s) =>
                                statusLabels[s as keyof typeof statusLabels] ||
                                s,
                            )
                            .join(" → ")
                        : a.body}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )
      )}
    </div>
  );
}
