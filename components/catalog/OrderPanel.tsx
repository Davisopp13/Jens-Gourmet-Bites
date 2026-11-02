"use client";

import { useRef, useState } from "react";
import { Send, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { ContactFormData, Product } from "@/lib/types";
import { DEFAULT_WEBSITE_CONTENT, type WebsiteContent } from "@/lib/website-content";

interface OrderPanelProps {
  content?: WebsiteContent;
  preview?: boolean;
  previewSuccess?: boolean;
  picked: Product[];
  onRemove: (id: string) => void;
  onBrowse: () => void;
}

const fieldClass =
  "w-full min-h-[48px] rounded-lg border-2 border-cat-ink bg-white px-3.5 py-2.5 text-cat-ink placeholder:text-[#7A6558] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-cat-sage";

const labelClass = "mb-1 block px-1 text-sm font-semibold";

export default function OrderPanel({
  content = DEFAULT_WEBSITE_CONTENT,
  preview = false,
  previewSuccess = false,
  picked,
  onRemove,
  onBrowse,
}: OrderPanelProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
    preferred_format: "either",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const submission = useRef<{ payload: string; id: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const cookieLine = picked.length
      ? `Cookies on my order card: ${picked.map((p) => p.name).join(", ")}.`
      : "";
    const message = [cookieLine, formData.message.trim()]
      .filter(Boolean)
      .join("\n\n");

    const payload = JSON.stringify({ ...formData, message });
    if (!submission.current || submission.current.payload !== payload) {
      submission.current = { payload, id: crypto.randomUUID() };
    }
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          message,
          submission_id: submission.current.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong");
      }

      submission.current = null;
      setStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        preferred_format: "either",
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit",
      );
    }
  };

  const headline =
    picked.length === 0
      ? "Nothing on the card yet"
      : `${picked.length} on the card, ready to bake`;

  return (
    <div className="max-w-[640px]">
      <div className="inline-block px-2 font-cat-hand text-3xl font-bold text-cat-rust">
        Recipe No. 3 · your order card
      </div>

      {(content.orderInstructions || content.fulfillmentInfo) && status !== "success" && !previewSuccess && (
        <div className="mt-3 space-y-2 px-2 text-base leading-relaxed">
          {content.orderInstructions && <p>{content.orderInstructions}</p>}
          {content.fulfillmentInfo && <p>{content.fulfillmentInfo}</p>}
        </div>
      )}

      {status === "success" || previewSuccess ? (
        <div className="mt-4 p-2" role="status">
          <CheckCircle
            className="mb-3 h-12 w-12 text-cat-sage"
            aria-hidden="true"
          />
          <h2 className="font-cat-display text-4xl font-normal">
            {content.confirmationHeading}
          </h2>
          <p className="mt-2 text-lg leading-relaxed">
            {content.confirmationMessage} {content.responseTime}
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 min-h-[44px] cursor-pointer text-cat-rust underline"
          >
            Send another order
          </button>
        </div>
      ) : (
        <>
          <h2 className="my-2 inline-block px-2 font-cat-display text-4xl font-normal md:text-[44px]">
            {headline}
          </h2>

          <div className="bg-cat-paper px-2 py-1.5" aria-hidden="true">
            <div className="mb-1.5 text-[15px]">Oven warming up…</div>
            <div className="h-3.5 overflow-hidden rounded-full border-2 border-cat-ink bg-[#F6E3B6]">
              <div className="cat-bakefill" />
            </div>
          </div>

          {picked.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2 px-2 py-1">
              {picked.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-1 rounded-full border-2 border-cat-ink bg-cat-butter py-0.5 pl-3 pr-1 text-sm font-semibold"
                >
                  {p.name}
                  <button
                    type="button"
                    onClick={() => onRemove(p.id)}
                    aria-label={`Remove ${p.name}`}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-cat-paper"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {picked.length === 0 && (
            <p className="mt-3 inline-block px-2">
              Pick some cookies first, or just tell Jen what you&apos;re craving
              below.{" "}
              <button
                onClick={onBrowse}
                className="min-h-[44px] cursor-pointer text-cat-rust underline"
              >
                Browse the cookies
              </button>
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {status === "error" && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border-2 border-cat-stamp bg-white p-3"
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-cat-stamp"
                  aria-hidden="true"
                />
                <p className="text-sm text-cat-stamp">{errorMessage}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Name <span className="text-cat-stamp">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email <span className="text-cat-stamp">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label htmlFor="preferred_format" className={labelClass}>
                  Preferred format
                </label>
                <select
                  id="preferred_format"
                  name="preferred_format"
                  value={formData.preferred_format}
                  onChange={handleChange}
                  className={fieldClass}
                >
                  <option value="either">Either is fine</option>
                  <option value="frozen">Frozen dough</option>
                  <option value="baked">Fresh baked</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className={labelClass}>
                Notes for Jen{" "}
                {picked.length === 0 && (
                  <span className="text-cat-stamp">*</span>
                )}
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required={picked.length === 0}
                value={formData.message}
                onChange={handleChange}
                className={`${fieldClass} resize-none`}
                placeholder="Quantity, pickup or delivery, special requests…"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="cat-btn cat-oven inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg bg-cat-sage px-7 py-3.5 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? (
                <>
                  <Loader2
                    className="mr-2 h-5 w-5 animate-spin"
                    aria-hidden="true"
                  />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" aria-hidden="true" />
                  Send it to Jen
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
