import { getSupabaseConfig } from "./config";
import { ApiError } from "./errors";

export async function supabaseRequest(route: string, init: RequestInit = {}) {
  const { url, key } = getSupabaseConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  // Legacy service_role JWTs use both headers. New secret API keys use apikey.
  if (key.startsWith("eyJ")) headers.set("authorization", "Bearer " + key);
  let response: Response;
  try {
    response = await fetch(url + route, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ApiError(
      503,
      "The publishing service is unavailable. No success has been recorded; please retry.",
      "STORAGE_UNAVAILABLE",
    );
  }
  if (response.status === 409)
    throw new ApiError(
      409,
      "The content changed in another tab. Reload the latest version before saving.",
      "REVISION_CONFLICT",
    );
  if (!response.ok) {
    throw new ApiError(
      503,
      "The publishing service could not complete this request. Check its setup or usage limits.",
      "STORAGE_UNAVAILABLE",
    );
  }
  return response;
}

export async function supabaseRpc<T>(
  name: string,
  parameters: Record<string, unknown>,
): Promise<T> {
  const response = await supabaseRequest("/rest/v1/rpc/" + name, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(parameters),
  });
  return response.json() as Promise<T>;
}
