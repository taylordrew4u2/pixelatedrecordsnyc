import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { getStore } from "@netlify/blobs";
import { getContext } from "@netlify/functions";
import type { SiteContent } from "@/lib/types";
import type { StoredContentState } from "./content";
import { ApiError } from "./errors";
import { publicContent, validateContent } from "./validation";

type ConditionalWrite =
  | { onlyIfNew: true; onlyIfMatch?: never }
  | { onlyIfMatch: string; onlyIfNew?: never };
type Metadata = Record<string, unknown>;
type Entry = { data: unknown; etag?: string; metadata: Metadata };
type WriteResult = { modified: boolean; etag?: string };
export interface BlobStore {
  getWithMetadata(
    key: string,
    options: { type: "json"; consistency: "strong" },
  ): Promise<Entry | null>;
  getMetadata(
    key: string,
    options: { consistency: "strong" },
  ): Promise<{ etag?: string; metadata: Metadata } | null>;
  setJSON(
    key: string,
    value: unknown,
    options: ConditionalWrite & { metadata?: Metadata },
  ): Promise<WriteResult>;
  get(
    key: string,
    options: { type: "arrayBuffer"; consistency: "strong" },
  ): Promise<ArrayBuffer | null>;
  set(
    key: string,
    value: ArrayBuffer,
    options: { onlyIfNew: true },
  ): Promise<WriteResult>;
  list(options: { prefix: string }): Promise<{ blobs: { key: string }[] }>;
}
type RuntimeContext = {
  site?: { id?: string };
  deploy?: { context?: string; id?: string };
};
type SessionRecord = { expiresAt: number; version: string };
const strong = { consistency: "strong" } as const;
const readJson = { ...strong, type: "json" } as const;
const contentKey = "content";

function unavailable(): never {
  throw new ApiError(
    503,
    "The publishing service is unavailable. Please retry; no successful save has been confirmed.",
    "STORAGE_UNAVAILABLE",
  );
}
function conflict(revision?: number): never {
  throw new ApiError(
    409,
    "The content changed in another tab. Reload the latest version before saving.",
    "REVISION_CONFLICT",
    revision === undefined ? undefined : { revision },
  );
}
function checkedState(value: unknown): StoredContentState {
  const state = value as StoredContentState;
  if (
    !state ||
    state.schemaVersion !== 1 ||
    !Number.isSafeInteger(state.revision) ||
    state.revision < 0 ||
    !Number.isSafeInteger(state.publishedRevision) ||
    !Array.isArray(state.history)
  )
    unavailable();
  try {
    validateContent(state.draft);
    validateContent(state.published);
  } catch {
    unavailable();
  }
  return state;
}
function sessionPrefix(hash: string, expiresAt: number) {
  if (
    !/^[a-f0-9]{64}$/.test(hash) ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= 0
  )
    unavailable();
  return "auth/" + Math.floor(expiresAt / 86_400_000) + "/" + hash;
}

export function netlifyStoreName(context: RuntimeContext): string {
  const { id, context: deployContext } = context.deploy || {};
  if (!context.site?.id || !id || !deployContext) {
    throw new ApiError(
      503,
      "The Netlify request context is unavailable. Publishing is disabled.",
      "NETLIFY_CONTEXT_UNAVAILABLE",
    );
  }
  if (deployContext === "production") return "pixelated-production-v1";
  return (
    "pixelated-preview-" +
    createHash("sha256").update(id).digest("hex").slice(0, 24)
  );
}

export function trustedNetlifyClientIp(): string | null {
  try {
    const context = getContext();
    return typeof context.ip === "string" && isIP(context.ip)
      ? context.ip
      : null;
  } catch {
    return null;
  }
}

// Called inside request handling, never at module evaluation. The platform supplies
// credentials; callers cannot select a store or pass a storage token via HTTP.
export function getNetlifyAdapter(): NetlifyBlobAdapter {
  try {
    const name = netlifyStoreName(getContext());
    const store = getStore({
      name,
      consistency: "strong",
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(8_000)])
            : AbortSignal.timeout(8_000),
        }),
    });
    return new NetlifyBlobAdapter(store);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return unavailable();
  }
}

export class NetlifyBlobAdapter {
  constructor(private readonly store: BlobStore) {}

  private async operation<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      return unavailable();
    }
  }

  async readContent(): Promise<StoredContentState | null> {
    return this.operation(async () => {
      const entry = await this.store.getWithMetadata(contentKey, readJson);
      return entry ? checkedState(entry.data) : null;
    });
  }

  async readPublished(): Promise<SiteContent | null> {
    return this.operation(async () => {
      // Strong metadata reads avoid transferring draft/history to every visitor.
      // The snapshot pointer is committed atomically with the content envelope.
      const head = await this.store.getMetadata(contentKey, strong);
      if (!head) return null;
      const key = head.metadata.publicKey;
      if (typeof key !== "string" || !/^published\/[a-f0-9]{64}$/.test(key))
        unavailable();
      const entry = await this.store.getWithMetadata(key, readJson);
      if (!entry) unavailable();
      return publicContent(validateContent(entry.data));
    });
  }

  async mutateContent(
    expected: number,
    initial: () => StoredContentState,
    mutation: (state: StoredContentState) => void,
  ): Promise<StoredContentState> {
    return this.operation(async () => {
      const entry = await this.store.getWithMetadata(contentKey, readJson);
      if (entry && !entry.etag) unavailable();
      const state = structuredClone(
        entry ? checkedState(entry.data) : checkedState(initial()),
      );
      if (state.revision !== expected) conflict(state.revision);
      mutation(state);
      state.revision = expected + 1;
      state.updatedAt = new Date().toISOString();
      checkedState(state);
      const visible = publicContent(state.published);
      const snapshot =
        "published/" +
        createHash("sha256").update(JSON.stringify(visible)).digest("hex");
      // Writing an immutable snapshot first is safe if CAS fails: it remains
      // unreferenced and cannot be fetched through any public arbitrary-key route.
      await this.store.setJSON(snapshot, visible, { onlyIfNew: true });
      const result = await this.store.setJSON(contentKey, state, {
        ...(entry
          ? { onlyIfMatch: entry.etag! }
          : { onlyIfNew: true as const }),
        metadata: { publicKey: snapshot },
      });
      if (!result.modified) conflict();
      return state;
    });
  }

  async createSession(hash: string, record: SessionRecord): Promise<void> {
    return this.operation(async () => {
      const result = await this.store.setJSON(
        sessionPrefix(hash, record.expiresAt) + "/session",
        record,
        { onlyIfNew: true },
      );
      if (!result.modified) unavailable();
    });
  }

  async sessionIsActive(
    hash: string,
    expiresAt: number,
    version: string,
  ): Promise<boolean> {
    if (expiresAt <= Date.now()) return false;
    return this.operation(async () => {
      const prefix = sessionPrefix(hash, expiresAt);
      const revoked = await this.store.getMetadata(prefix + "/revoked", strong);
      if (revoked) return false;
      const entry = await this.store.getWithMetadata(
        prefix + "/session",
        readJson,
      );
      const record = entry?.data as SessionRecord | undefined;
      return Boolean(
        record &&
        record.expiresAt === expiresAt &&
        record.expiresAt > Date.now() &&
        record.version === version,
      );
    });
  }

  async revokeSession(hash: string, expiresAt: number): Promise<void> {
    return this.operation(async () => {
      // Immutable tombstones cannot be lost through a concurrent session-list save.
      // Never delete a current tombstone; readers check it with strong consistency.
      await this.store.setJSON(
        sessionPrefix(hash, expiresAt) + "/revoked",
        { expiresAt },
        { onlyIfNew: true },
      );
    });
  }

  async takeLoginAttempt(
    key: string,
    limit: number,
    windowSeconds: number,
    now = Date.now(),
  ): Promise<{ allowed: boolean; retryAfter: number }> {
    if (
      !/^[A-Za-z0-9-]{1,128}$/.test(key) ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(windowSeconds) ||
      windowSeconds < 60 ||
      windowSeconds > 3_600 ||
      !Number.isSafeInteger(now)
    )
      unavailable();
    return this.operation(async () => {
      const milliseconds = windowSeconds * 1_000;
      const window = Math.floor(now / milliseconds);
      const resetAt = (window + 1) * milliseconds;
      const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1_000));
      const prefix =
        "attempts/" +
        window +
        "/" +
        createHash("sha256").update(key).digest("hex") +
        "/";
      if (await this.store.getMetadata(prefix + "exhausted", strong))
        return { allowed: false, retryAfter };

      // Listing only skips known occupied slots; it is never evidence to admit
      // a request. Every admitted attempt must win an atomic create-only write.
      const listed = await this.store.list({ prefix });
      const occupied = new Set(listed.blobs.map((blob) => blob.key));
      const deadline = Date.now() + 12_000;
      for (let slot = 0; slot < limit; slot += 1) {
        const slotKey = prefix + "slot-" + slot;
        if (occupied.has(slotKey)) continue;
        if (Date.now() > deadline) unavailable();
        const claim = await this.store.setJSON(
          slotKey,
          { resetAt },
          { onlyIfNew: true },
        );
        if (claim.modified) return { allowed: true, retryAfter };
      }
      // All slots are occupied. The immutable marker short-circuits later attempts.
      await this.store.setJSON(
        prefix + "exhausted",
        { resetAt },
        { onlyIfNew: true },
      );
      return { allowed: false, retryAfter };
    });
  }

  async saveMedia(id: string, bytes: ArrayBuffer): Promise<void> {
    if (!/^[0-9a-f-]{36}$/.test(id)) unavailable();
    return this.operation(async () => {
      const result = await this.store.set("media/" + id + ".webp", bytes, {
        onlyIfNew: true,
      });
      if (!result.modified) unavailable();
    });
  }

  async readMedia(id: string): Promise<ArrayBuffer | null> {
    if (!/^[0-9a-f-]{36}$/.test(id)) unavailable();
    return this.operation(() =>
      this.store.get("media/" + id + ".webp", {
        ...strong,
        type: "arrayBuffer",
      }),
    );
  }
}
