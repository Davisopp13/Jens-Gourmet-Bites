import { z } from "zod";

// One definition supplies the editor, request validation, and character limits.
export const CONTENT_FIELDS = [
  { key: "homeEyebrow", label: "Small heading above the headline", group: "Home", max: 60 },
  { key: "homeHeading", label: "Homepage headline", group: "Home", max: 100 },
  { key: "homeIntro", label: "Homepage introduction", group: "Home", max: 600, multiline: true },
  { key: "browseButton", label: "Browse button wording", group: "Home", max: 45 },
  { key: "orderButton", label: "Order button wording", group: "Home", max: 45 },
  { key: "noteTitle", label: "Jen’s note heading", group: "Home", max: 60 },
  { key: "noteMessage", label: "Jen’s message", group: "Home", max: 900, multiline: true },
  { key: "noteFooter", label: "Small line under Jen’s note", group: "Home", max: 300, multiline: true, optional: true },
  { key: "orderInstructions", label: "Ordering instructions", group: "Ordering", max: 600, multiline: true, optional: true },
  { key: "fulfillmentInfo", label: "Pickup and delivery information", group: "Ordering", max: 400, multiline: true, optional: true },
  { key: "responseTime", label: "Expected response time", group: "Ordering", max: 200 },
  { key: "confirmationHeading", label: "Order confirmation heading", group: "Ordering", max: 100 },
  { key: "confirmationMessage", label: "Order confirmation message", group: "Ordering", max: 400, multiline: true },
  { key: "publicEmail", label: "Public contact email", group: "Contact & footer", max: 254 },
  { key: "serviceArea", label: "Service area", group: "Contact & footer", max: 160 },
  { key: "footerDescription", label: "Short business description", group: "Contact & footer", max: 300, multiline: true },
  { key: "siteTitle", label: "Search result title", group: "Search & sharing", max: 70 },
  { key: "siteDescription", label: "Search result description", group: "Search & sharing", max: 180, multiline: true },
  { key: "shareTitle", label: "Link sharing title", group: "Search & sharing", max: 100 },
  { key: "shareDescription", label: "Link sharing description", group: "Search & sharing", max: 250, multiline: true },
] as const;

export type ContentKey = (typeof CONTENT_FIELDS)[number]["key"];
export type WebsiteContent = Record<ContentKey, string>;

export const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  homeEyebrow: "Recipe No. 1",
  homeHeading: "Cookies, from scratch.",
  homeIntro: "Gourmet cookies made fresh in Johns Creek, Georgia. Choose from our selection of artisan cookies, available as fresh-baked treats or convenient frozen dough.",
  browseButton: "Flip through the recipes",
  orderButton: "Place an order",
  noteTitle: "a note from Jen",
  noteMessage: "What started as a passion for baking in my Johns Creek kitchen has grown into a labor of love that I'm thrilled to share with you. Each cookie is made from scratch using family recipes and the finest ingredients, because you deserve nothing less than the best.",
  noteFooter: "Proudly serving Metro Atlanta. Local pickup available, and we can arrange delivery for larger orders.",
  orderInstructions: "",
  fulfillmentInfo: "",
  responseTime: "Jen will get back to you within 24 hours.",
  confirmationHeading: "Your card is in the oven!",
  confirmationMessage: "Thank you for your order.",
  publicEmail: "jensgourmetbites@gmail.com",
  serviceArea: "Johns Creek, GA · Serving Metro Atlanta",
  footerDescription: "Handcrafted gourmet cookies made with love. Available as fresh-baked or frozen dough.",
  siteTitle: "Jen's Gourmet Bites | Artisan Cookies in Johns Creek, GA",
  siteDescription: "Handcrafted gourmet cookies made with love in Johns Creek, GA. Available as fresh-baked or frozen dough. Serving Metro Atlanta.",
  shareTitle: "Jen's Gourmet Bites | Artisan Cookies",
  shareDescription: "Handcrafted gourmet cookies made with love. Available as fresh-baked or frozen dough.",
};

export const websiteContentSchema = z.object(Object.fromEntries(CONTENT_FIELDS.map(field => {
  let rule = z.string().trim().max(field.max, `${field.label}: use ${field.max} characters or fewer.`);
  if (!("optional" in field && field.optional)) rule = rule.min(1, `${field.label} is required.`);
  if (field.key === "publicEmail") rule = rule.email("Enter a valid public contact email.");
  return [field.key, rule];
})) as Record<ContentKey, z.ZodString>).strict();

export function contentNote(content: WebsiteContent) {
  return { title: content.noteTitle, quote: content.noteMessage, footer: content.noteFooter };
}

export interface ContentState {
  published: WebsiteContent;
  draft: WebsiteContent | null;
  previous: WebsiteContent | null;
  revision: number;
  publishedAt: string;
  draftSavedAt: string | null;
  previousPublishedAt: string | null;
}
