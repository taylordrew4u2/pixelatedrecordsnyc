import path from "node:path";

export type StorageMode = "local" | "supabase" | "unconfigured";

export function getStorageMode(): StorageMode {
  const requested = process.env.CONTENT_STORAGE;
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
  // Vercel filesystem writes cannot be used as durable publishing storage.
  if (process.env.VERCEL) return "unconfigured";
  if (requested === "local") return "local";
  if (requested && requested !== "local") return "unconfigured";
  return process.env.NODE_ENV === "production" ? "unconfigured" : "local";
}

export function getDataDirectory() {
  // This is runtime-created local state, not an asset directory to trace into a
  // deployment bundle. Vercel never enables the local storage adapter.
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

export function authIsConfigured() {
  return (
    /^scrypt:[a-f0-9]{32,128}:[a-f0-9]{128}$/i.test(
      process.env.ADMIN_PASSWORD_HASH || "",
    ) && (process.env.SESSION_SECRET || "").length >= 32
  );
}

export function getBackendStatus() {
  const storage = getStorageMode();
  return {
    configured: authIsConfigured(),
    storage,
    persistent: storage === "supabase",
    writable: storage !== "unconfigured",
    localPreview: storage === "local",
  };
}
