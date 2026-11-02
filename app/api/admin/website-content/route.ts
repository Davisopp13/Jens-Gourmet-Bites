import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contentAdminAllowed, getContentState } from "@/lib/website-content-server";
import { websiteContentSchema } from "@/lib/website-content";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), revision: z.number().int().min(0), content: websiteContentSchema }).strict(),
  z.object({ action: z.enum(["publish", "restore"]), revision: z.number().int().min(0) }).strict(),
]);

async function authorize(request: Request) {
  if (request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Please save from the admin website." }, { status: 403, headers });
  }
  const { data: { user }, error } = await (await createClient()).auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers });
  if (!contentAdminAllowed(user)) return NextResponse.json({ error: "This account cannot edit website content." }, { status: 403, headers });
  return user;
}

function failure(error: unknown) {
  console.error("Website content operation failed", (error as { code?: string })?.code ?? "unknown");
  return NextResponse.json({ error: "Website content could not be loaded or saved. Please try again. If this continues, check the Website Content setup." }, { status: 503, headers });
}

export async function GET(request: Request) {
  const user = await authorize(request);
  if (user instanceof NextResponse) return user;
  try { return NextResponse.json(await getContentState(), { headers }); }
  catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  const user = await authorize(request);
  if (user instanceof NextResponse) return user;
  let body;
  try { body = inputSchema.parse(await request.json()); }
  catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? error.issues[0]?.message : "Invalid content request." }, { status: 400, headers });
  }
  try {
    const { data, error } = await createAdminClient().rpc("edit_website_content", {
      p_action: body.action, p_revision: body.revision, p_actor: user.id,
      p_content: body.action === "save" ? body.content : null,
    });
    if (error?.code === "PT409") return NextResponse.json({ error: "Someone saved a newer version. Reload the latest version before saving. Your edits are still here." }, { status: 409, headers });
    if (error?.code === "22023") return NextResponse.json({ error: "There is no saved draft or previous version for this action." }, { status: 400, headers });
    if (error) throw error;
    if (body.action === "publish") revalidatePath("/");
    return NextResponse.json(data, { headers });
  } catch (error) { return failure(error); }
}
