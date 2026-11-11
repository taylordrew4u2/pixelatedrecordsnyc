import {
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { authIsConfigured, getStorageMode } from "./config";
import { ApiError, storageUnavailable } from "./errors";
import { readLocalJson, withLocalLock, writeLocalJson } from "./local";
import { supabaseRequest, supabaseRpc } from "./supabase";

const COOKIE = "pixelated_admin";
const SESSION_SECONDS = 12 * 60 * 60;
const ATTEMPT_WINDOW_SECONDS = 15 * 60;
type Session = { id: string; exp: number; version: string };
type SessionRecord = { expiresAt: number; version: string };
type Attempt = { count: number; resetAt: number };

function passwordVersion() {
  return createHash("sha256")
    .update(process.env.ADMIN_PASSWORD_HASH || "")
    .digest("hex")
    .slice(0, 24);
}
function sessionHash(id: string) {
  return createHash("sha256").update(id).digest("hex");
}
function signature(payload: string) {
  return createHmac("sha256", process.env.SESSION_SECRET!)
    .update(payload)
    .digest("base64url");
}
function equal(a: string, b: string) {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function readCookie(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(COOKIE + "="))
    ?.slice(COOKIE.length + 1);
}

function decodeCookie(value?: string): Session | null {
  if (!value || value.length > 1_024 || !authIsConfigured()) return null;
  const [payload, mac, extra] = value.split(".");
  if (extra || !payload || !mac || !equal(mac, signature(payload))) return null;
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Session;
    if (
      !/^[A-Za-z0-9_-]{43}$/.test(session.id) ||
      !Number.isSafeInteger(session.exp) ||
      session.exp <= Math.floor(Date.now() / 1_000) ||
      session.exp > Math.floor(Date.now() / 1_000) + SESSION_SECONDS + 30 ||
      session.version !== passwordVersion()
    )
      return null;
    return session;
  } catch {
    return null;
  }
}

async function storeSession(session: Session) {
  const mode = getStorageMode();
  if (mode === "unconfigured") return storageUnavailable();
  const key = sessionHash(session.id);
  if (mode === "local") {
    await withLocalLock(async () => {
      const sessions =
        (await readLocalJson<Record<string, SessionRecord>>("sessions.json")) ||
        {};
      for (const [id, record] of Object.entries(sessions))
        if (record.expiresAt < Date.now()) delete sessions[id];
      sessions[key] = {
        expiresAt: session.exp * 1_000,
        version: session.version,
      };
      await writeLocalJson("sessions.json", sessions);
    });
  } else {
    await supabaseRequest("/rest/v1/pixelated_sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key_hash: key,
        expires_at: new Date(session.exp * 1_000).toISOString(),
        password_version: session.version,
      }),
    });
  }
}

async function validStoredSession(session: Session) {
  const mode = getStorageMode();
  if (mode === "unconfigured") return false;
  const key = sessionHash(session.id);
  if (mode === "local") {
    const record = (
      await readLocalJson<Record<string, SessionRecord>>("sessions.json")
    )?.[key];
    return Boolean(
      record &&
      record.expiresAt > Date.now() &&
      record.version === session.version,
    );
  }
  const response = await supabaseRequest(
    "/rest/v1/pixelated_sessions?key_hash=eq." +
      key +
      "&select=expires_at,password_version",
  );
  const records = (await response.json()) as {
    expires_at: string;
    password_version: string;
  }[];
  return Boolean(
    records[0] &&
    Date.parse(records[0].expires_at) > Date.now() &&
    records[0].password_version === session.version,
  );
}

export async function isAuthenticated(request?: Request): Promise<boolean> {
  let value: string | undefined;
  if (request) value = readCookie(request);
  else {
    const { cookies } = await import("next/headers");
    value = (await cookies()).get(COOKIE)?.value;
  }
  const session = decodeCookie(value);
  return session ? validStoredSession(session) : false;
}

export async function requireAuthentication(request: Request) {
  if (!(await isAuthenticated(request)))
    throw new ApiError(401, "Sign in to manage the website.", "AUTH_REQUIRED");
}

export async function verifyPassword(password: string) {
  if (!authIsConfigured()) return false;
  const [, salt, expected] = process.env.ADMIN_PASSWORD_HASH!.split(":");
  const actual = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      Buffer.from(salt, "hex"),
      64,
      { maxmem: 64 * 1024 * 1024 },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
  });
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}

async function takeAttempt(
  key: string,
  limit: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const mode = getStorageMode();
  if (mode === "unconfigured") return storageUnavailable();
  if (mode === "supabase") {
    return supabaseRpc("pixelated_take_login_attempt", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: ATTEMPT_WINDOW_SECONDS,
    });
  }
  return withLocalLock(async () => {
    const attempts =
      (await readLocalJson<Record<string, Attempt>>("login-attempts.json")) ||
      {};
    const now = Date.now();
    for (const [id, entry] of Object.entries(attempts))
      if (entry.resetAt <= now) delete attempts[id];
    const entry = attempts[key] || {
      count: 0,
      resetAt: now + ATTEMPT_WINDOW_SECONDS * 1_000,
    };
    entry.count += 1;
    attempts[key] = entry;
    await writeLocalJson("login-attempts.json", attempts);
    return {
      allowed: entry.count <= limit,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
    };
  });
}

export async function authenticatePassword(
  request: Request,
  password: unknown,
) {
  if (!authIsConfigured())
    throw new ApiError(
      503,
      "Admin sign-in has not been configured yet.",
      "AUTH_UNCONFIGURED",
    );
  if (
    typeof password !== "string" ||
    !password.length ||
    password.length > 1_024
  )
    throw new ApiError(400, "Enter your admin password.", "INVALID_PASSWORD");
  // Forwarded headers are only trusted on Vercel. A global cap also bounds attacks
  // if a deployment proxy supplies unstable client addresses.
  const address = process.env.VERCEL
    ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
    : "local";
  const key = createHmac("sha256", process.env.SESSION_SECRET!)
    .update("login:" + address)
    .digest("hex");
  const global = await takeAttempt("all-logins", 100);
  if (!global.allowed) {
    throw new ApiError(
      429,
      "Too many sign-in attempts. Please wait before trying again.",
      "LOGIN_THROTTLED",
      { retryAfter: global.retryAfter },
    );
  }
  const client = await takeAttempt(key, 10);
  if (!client.allowed) {
    throw new ApiError(
      429,
      "Too many sign-in attempts. Please wait before trying again.",
      "LOGIN_THROTTLED",
      { retryAfter: client.retryAfter },
    );
  }
  if (!(await verifyPassword(password)))
    throw new ApiError(
      401,
      "That password did not match.",
      "INVALID_CREDENTIALS",
    );
  const session: Session = {
    id: randomBytes(32).toString("base64url"),
    exp: Math.floor(Date.now() / 1_000) + SESSION_SECONDS,
    version: passwordVersion(),
  };
  await storeSession(session);
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return cookieHeader(payload + "." + signature(payload), SESSION_SECONDS);
}

function cookieHeader(value: string, maxAge: number) {
  return (
    COOKIE +
    "=" +
    value +
    "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" +
    maxAge +
    (process.env.NODE_ENV === "production" ? "; Secure" : "")
  );
}

export async function endSession(request: Request) {
  const session = decodeCookie(readCookie(request));
  if (session) {
    const mode = getStorageMode();
    const key = sessionHash(session.id);
    if (mode === "local") {
      await withLocalLock(async () => {
        const sessions =
          (await readLocalJson<Record<string, SessionRecord>>(
            "sessions.json",
          )) || {};
        delete sessions[key];
        await writeLocalJson("sessions.json", sessions);
      });
    } else if (mode === "supabase") {
      await supabaseRequest("/rest/v1/pixelated_sessions?key_hash=eq." + key, {
        method: "DELETE",
      });
    }
  }
  return cookieHeader("", 0);
}
