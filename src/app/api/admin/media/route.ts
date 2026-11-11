import { requireAuthentication } from "@/lib/server/auth";
import { assertSameOrigin, errorResponse, json } from "@/lib/server/http";
import { uploadMedia } from "@/lib/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireAuthentication(request);
    return json({ asset: await uploadMedia(request) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
