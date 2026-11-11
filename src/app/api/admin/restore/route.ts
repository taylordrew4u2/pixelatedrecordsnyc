import { requireAuthentication } from "@/lib/server/auth";
import { restoreDraft } from "@/lib/server/content";
import { ApiError } from "@/lib/server/errors";
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
    if (
      typeof body.historyId !== "string" ||
      !/^[0-9a-f-]{36}$/.test(body.historyId)
    )
      throw new ApiError(
        400,
        "Choose a recent version to restore.",
        "INVALID_HISTORY_ID",
      );
    return json(
      await restoreDraft(
        body.historyId,
        expectedRevision(body.expectedRevision),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
