import { getPublishedContent } from "@/lib/server/content";
import { errorResponse, json } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return json(await getPublishedContent());
  } catch (error) {
    return errorResponse(error);
  }
}
