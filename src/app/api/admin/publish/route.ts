import { requireAuthentication } from "@/lib/server/auth";
import { publishDraft } from "@/lib/server/content";
import {
  assertSameOrigin,
  errorResponse,
  expectedRevision,
  json,
  readJson,
} from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireAuthentication(request);
    const body = await readJson(request, 4_096);
    return json(await publishDraft(expectedRevision(body.expectedRevision)));
  } catch (error) {
    return errorResponse(error);
  }
}
