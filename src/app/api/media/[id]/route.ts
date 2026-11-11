import { errorResponse } from "@/lib/server/http";
import { mediaResponse } from "@/lib/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    return await mediaResponse(request, (await context.params).id);
  } catch (error) {
    return errorResponse(error);
  }
}
