import path from "node:path";

export type StorageMode = "local" | "supabase" | "netlify" | "unconfigured";

export function getStorageMode(): StorageMode {
  const requested = process.env.CONTENT_STORAGE;
  if (requested === "netlify") return "netlify";
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (requested === "supabase" || url || key) {
    if (!url || !key) return "unconfigured";
    try {
      const parsed = new URL(url);
      if (parsed.username || parsed.password || parsed.search || parsed.hash)
        return "unconfigured";
      if (
        parsed.protocol !== "https:" &&
        !(
          process.env.NODE_ENV !== "production" &&
          parsed.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(parsed.hostname)
        )
      )
        return "unconfigured";
      if (parsed.pathname !== "/" && parsed.pathname !== "")
        return "unconfigured";
    } catch {
      return "unconfigured";
    }
    return "supabase";
  }
  // Hosted function filesystems cannot provide durable publishing storage.
  // SITE_ID is a documented Netlify runtime variable; NETLIFY alone is not.
  if (process.env.VERCEL || process.env.NETLIFY || process.env.SITE_ID)
    return "unconfigured";
  if (requested === "local") return "local";
  if (requested && requested !== "local") return "unconfigured";
  return process.env.NODE_ENV === "production" ? "unconfigured" : "local";
}

export function getDataDirectory() {
  // This is runtime-created local state, not an asset directory to trace into a
  // deployment bundle. Hosted runtimes never enable the local storage adapter.
  return path.resolve(
    /* turbopackIgnore: true */ process.env.PIXELATED_DATA_DIR ||
      path.join(process.cwd(), ".data"),
  );
}

export function getSupabaseConfig() {
  if (getStorageMode() !== "supabase")
    throw new Error("Supabase is not configured.");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "pixelated-private";
  if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(bucket))
    throw new Error("Invalid private media bucket name.");
  return {
    url: process.env.SUPABASE_URL!.replace(/\/$/, ""),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    bucket,
  };
}

// Owner decision (November 18, 2026): the Studio password is fixed in code as
// "weed" so nobody has to manage hosting settings. This is the scrypt hash of
// that word. It is deliberately simple and is not a secret: anyone who reads
// this file or guesses the word can edit the website. The sign-in throttle and
// version history remain the safety net. To use a private password again,
// return process.env.ADMIN_PASSWORD_HASH here.
const FIXED_ADMIN_PASSWORD_HASH =
  "scrypt:706978656c617465647265636f726473:05dac7a68ffd9a96d6126115c139fc29130225efa20505a92f4014c0dcc1523eec1d82712639c179186f852a83b6fd21093ac2087cd027900bddde9f8f68b296";

export function adminPasswordHash() {
  // Automated tests supply their own throwaway hash.
  if (process.env.NODE_ENV === "test" && process.env.ADMIN_PASSWORD_HASH)
    return process.env.ADMIN_PASSWORD_HASH;
  return FIXED_ADMIN_PASSWORD_HASH;
}

export function authIsConfigured() {
  return (
    /^scrypt:[a-f0-9]{32,128}:[a-f0-9]{128}$/i.test(adminPasswordHash()) &&
    (process.env.SESSION_SECRET || "").length >= 32
  );
}

export function getBackendStatus() {
  const storage = getStorageMode();
  return {
    configured: authIsConfigured(),
    storage,
    persistent: storage === "supabase" || storage === "netlify",
    writable: storage !== "unconfigured",
    localPreview: storage === "local",
  };
}
