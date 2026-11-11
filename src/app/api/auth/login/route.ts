import { authenticatePassword } from "@/lib/server/auth";
import {
  assertSameOrigin,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJson(request, 4_096);
    const cookie = await authenticatePassword(request, body.password);
    return json({ authenticated: true }, 200, { "set-cookie": cookie });
  } catch (error) {
    return errorResponse(error);
  }
}
