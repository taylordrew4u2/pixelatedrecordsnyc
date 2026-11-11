import { ApiError } from "./errors";

export function json(
  data: unknown,
  status = 200,
  extraHeaders: HeadersInit = {},
) {
  const headers = new Headers(extraHeaders);
  headers.set("cache-control", "no-store, max-age=0");
  headers.set("pragma", "no-cache");
  headers.set("x-content-type-options", "nosniff");
  return Response.json(data, { status, headers });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return json(
      { error: error.message, code: error.code, ...error.details },
      error.status,
      error.status === 429 && error.details?.retryAfter
        ? { "retry-after": String(error.details.retryAfter) }
        : {},
    );
  }
  // Do not reflect provider responses, file paths, or credentials to the browser.
  console.error(
    "Pixelated backend request failed:",
    error instanceof Error ? error.name : "unknown error",
  );
  return json(
    {
      error: "The request could not be completed. Please try again.",
      code: "INTERNAL_ERROR",
    },
    500,
  );
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(expected).origin;
  } catch {
    throw new ApiError(
      503,
      "The site origin is not configured correctly.",
      "ORIGIN_CONFIGURATION",
    );
  }
  if (!origin || origin !== expectedOrigin)
    throw new ApiError(
      403,
      "This request must come from this website.",
      "INVALID_ORIGIN",
    );
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none")
    throw new ApiError(
      403,
      "This request must come from this website.",
      "INVALID_ORIGIN",
    );
}

export async function readBody(
  request: Request,
  limit: number,
): Promise<Uint8Array> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit)
    throw new ApiError(413, "This request is too large.", "PAYLOAD_TOO_LARGE");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.length;
      if (total > limit) {
        await reader.cancel();
        throw new ApiError(
          413,
          "This request is too large.",
          "PAYLOAD_TOO_LARGE",
        );
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export async function readJson(
  request: Request,
  limit = 900_000,
): Promise<Record<string, unknown>> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new ApiError(415, "Use a JSON request.", "INVALID_CONTENT_TYPE");
  }
  try {
    const value: unknown = JSON.parse(
      new TextDecoder().decode(await readBody(request, limit)),
    );
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Invalid object");
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      400,
      "The request contains invalid JSON.",
      "INVALID_JSON",
    );
  }
}

export function expectedRevision(value: unknown) {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new ApiError(
      400,
      "A valid content revision is required.",
      "INVALID_REVISION",
    );
  return value as number;
}
