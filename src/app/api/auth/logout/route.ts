import { endSession } from "@/lib/server/auth";
import { assertSameOrigin, errorResponse, json } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    return json({ authenticated: false }, 200, {
      "set-cookie": await endSession(request),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
