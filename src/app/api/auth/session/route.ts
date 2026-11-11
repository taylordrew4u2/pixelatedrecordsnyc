import { isAuthenticated } from "@/lib/server/auth";
import { getBackendStatus } from "@/lib/server/config";
import { errorResponse, json } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    return json({
      authenticated: await isAuthenticated(request),
      ...getBackendStatus(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
