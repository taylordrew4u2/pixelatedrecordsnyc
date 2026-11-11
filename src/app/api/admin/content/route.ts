import { requireAuthentication } from "@/lib/server/auth";
import { getContentState, saveDraft } from "@/lib/server/content";
import {
  assertSameOrigin,
  errorResponse,
  expectedRevision,
  json,
  readJson,
} from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireAuthentication(request);
    return json(await getContentState());
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    await requireAuthentication(request);
    const body = await readJson(request);
    return json(
      await saveDraft(body.content, expectedRevision(body.expectedRevision)),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
