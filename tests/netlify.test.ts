import test from "node:test";
import assert from "node:assert/strict";
import {
  NetlifyBlobAdapter,
  netlifyStoreName,
  type BlobStore,
} from "../src/lib/server/netlify";
import type { StoredContentState } from "../src/lib/server/content";
import { ApiError } from "../src/lib/server/errors";
import { seedContent } from "../src/lib/seed";

type Metadata = Record<string, unknown>;
type StoredBlob = { data: unknown; etag: string; metadata: Metadata };
type Conditions = {
  metadata?: Metadata;
  onlyIfMatch?: string;
  onlyIfNew?: boolean;
};
type Write = {
  key: string;
  value: unknown;
  options: Conditions;
  modified: boolean;
};

/**
 * Models provider atomicity, not a database/transaction: writes compare the
 * current ETag at commit time and atomically replace value + metadata. A failed
 * precondition resolves with modified:false, as the Netlify SDK does.
 */
class MemoryBlobs implements BlobStore {
  entries = new Map<string, StoredBlob>();
  writes: Write[] = [];
  reads: { key: string; operation: string; consistency: unknown }[] = [];
  private sequence = 0;
  private gate: {
    remaining: number;
    release: () => void;
    promise: Promise<void>;
  } | null = null;
  failWrite: ((key: string) => boolean) | null = null;
  failRead: ((key: string) => boolean) | null = null;

  /** Capture the same pre-write snapshot in two independently running workers. */
  synchronizeNextContentReads(count: number) {
    let release!: () => void;
    const promise = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.gate = { remaining: count, release, promise };
  }

  private noteRead(
    key: string,
    operation: string,
    options: { consistency?: unknown },
  ) {
    this.reads.push({ key, operation, consistency: options.consistency });
    assert.equal(
      options.consistency,
      "strong",
      `${operation}(${key}) must bypass eventual caches`,
    );
    if (this.failRead?.(key)) throw new Error("Simulated provider read outage");
  }

  async getWithMetadata(
    key: string,
    options: { type: "json"; consistency: "strong" },
  ) {
    this.noteRead(key, "getWithMetadata", options);
    const entry = this.entries.get(key);
    const snapshot = entry ? structuredClone(entry) : null;
    if (key === "content" && this.gate) {
      const gate = this.gate;
      gate.remaining -= 1;
      if (gate.remaining === 0) {
        this.gate = null;
        gate.release();
      }
      await gate.promise;
    }
    return snapshot;
  }

  async getMetadata(key: string, options: { consistency: "strong" }) {
    this.noteRead(key, "getMetadata", options);
    const entry = this.entries.get(key);
    return entry
      ? { etag: entry.etag, metadata: structuredClone(entry.metadata) }
      : null;
  }

  async setJSON(key: string, value: unknown, options: Conditions = {}) {
    return this.commit(key, value, options);
  }

  private commit(key: string, value: unknown, options: Conditions) {
    if (this.failWrite?.(key))
      throw new Error("Simulated provider quota or write outage");
    const old = this.entries.get(key);
    const modified =
      !(options.onlyIfNew && old) &&
      !(
        options.onlyIfMatch !== undefined &&
        (!old || old.etag !== options.onlyIfMatch)
      );
    this.writes.push({
      key,
      value: structuredClone(value),
      options: structuredClone(options),
      modified,
    });
    if (!modified) return { modified: false };
    const etag = `"provider-etag-${++this.sequence}"`;
    this.entries.set(key, {
      data: structuredClone(value),
      etag,
      metadata: structuredClone(options.metadata || {}),
    });
    return { modified: true, etag };
  }

  async get(
    key: string,
    options: { type: "arrayBuffer"; consistency: "strong" },
  ) {
    this.noteRead(key, "get", options);
    const entry = this.entries.get(key);
    return entry ? (structuredClone(entry.data) as ArrayBuffer) : null;
  }

  async set(key: string, data: ArrayBuffer, options: { onlyIfNew: true }) {
    return this.commit(key, data, options);
  }

  async list({ prefix }: { prefix: string }) {
    return {
      blobs: [...this.entries.keys()]
        .filter((key) => key.startsWith(prefix))
        .map((key) => ({ key })),
    };
  }
}

function initial(): StoredContentState {
  return {
    schemaVersion: 1,
    draft: structuredClone(seedContent),
    published: structuredClone(seedContent),
    revision: 0,
    publishedRevision: 0,
    updatedAt: "",
    publishedAt: "",
    history: [],
  };
}

function code(status: number) {
  return (error: unknown) =>
    error instanceof ApiError && error.status === status;
}

function oneWinner(results: PromiseSettledResult<StoredContentState>[]) {
  const winners = results.filter((result) => result.status === "fulfilled");
  const losers = results.filter(
    (result) => result.status === "rejected",
  ) as PromiseRejectedResult[];
  assert.equal(winners.length, 1);
  assert.equal(losers.length, 1);
  assert.ok(
    code(409)(losers[0].reason),
    "a failed provider precondition becomes an edit conflict",
  );
  return (winners[0] as PromiseFulfilledResult<StoredContentState>).value;
}

function publish(state: StoredContentState) {
  state.published = structuredClone(state.draft);
  state.publishedRevision = state.revision + 1;
  state.publishedAt = new Date().toISOString();
}

test(
  "Netlify first-save race uses atomic create and preserves exactly one editor",
  { timeout: 5_000 },
  async () => {
    const store = new MemoryBlobs();
    const a = new NetlifyBlobAdapter(store),
      b = new NetlifyBlobAdapter(store);
    store.synchronizeNextContentReads(2);
    const winner = oneWinner(
      await Promise.allSettled([
        a.mutateContent(0, initial, (state) => {
          state.draft.brand.tagline = "First worker draft";
        }),
        b.mutateContent(0, initial, (state) => {
          state.draft.brand.tagline = "Second worker draft";
        }),
      ]),
    );
    const saved = await a.readContent();
    assert.equal(saved?.revision, 1);
    assert.equal(saved?.draft.brand.tagline, winner.draft.brand.tagline);
    assert.equal(saved?.published.brand.tagline, seedContent.brand.tagline);
    const contentWrites = store.writes.filter(
      (write) => write.key === "content",
    );
    assert.equal(contentWrites.length, 2);
    assert.ok(contentWrites.every((write) => write.options.onlyIfNew === true));
    assert.equal(contentWrites.filter((write) => write.modified).length, 1);
  },
);

test(
  "Netlify same-ETag edits cannot overwrite a newer draft or increment twice",
  { timeout: 5_000 },
  async () => {
    const store = new MemoryBlobs();
    const a = new NetlifyBlobAdapter(store),
      b = new NetlifyBlobAdapter(store);
    await a.mutateContent(0, initial, (state) => {
      state.draft.brand.tagline = "Original draft";
    });
    const originalETag = store.entries.get("content")!.etag;
    store.synchronizeNextContentReads(2);
    const winner = oneWinner(
      await Promise.allSettled([
        a.mutateContent(1, initial, (state) => {
          state.draft.brand.tagline = "Editor A";
        }),
        b.mutateContent(1, initial, (state) => {
          state.draft.brand.tagline = "Editor B";
        }),
      ]),
    );
    const saved = await b.readContent();
    assert.equal(saved?.revision, 2);
    assert.equal(saved?.draft.brand.tagline, winner.draft.brand.tagline);
    const competing = store.writes.filter(
      (write) =>
        write.key === "content" && write.options.onlyIfMatch === originalETag,
    );
    assert.equal(competing.length, 2);
    assert.equal(competing.filter((write) => write.modified).length, 1);
    await assert.rejects(
      () => a.mutateContent(1, initial, () => {}),
      code(409),
    );
  },
);

test(
  "racing publication keeps the public snapshot tied to the winning atomic envelope",
  { timeout: 5_000 },
  async () => {
    const store = new MemoryBlobs();
    const a = new NetlifyBlobAdapter(store),
      b = new NetlifyBlobAdapter(store);
    await a.mutateContent(0, initial, (state) => {
      state.draft.brand.tagline = "Unpublished original";
    });
    store.synchronizeNextContentReads(2);
    const winner = oneWinner(
      await Promise.allSettled([
        a.mutateContent(1, initial, (state) => {
          state.draft.brand.tagline = "Publication A";
          publish(state);
        }),
        b.mutateContent(1, initial, (state) => {
          state.draft.brand.tagline = "Publication B";
          publish(state);
        }),
      ]),
    );
    assert.equal(
      (await b.readPublished())?.brand.tagline,
      winner.published.brand.tagline,
    );
    assert.equal((await a.readContent())?.publishedRevision, 2);
    const pointer = store.entries.get("content")!.metadata.publicKey;
    assert.equal(typeof pointer, "string");
    assert.ok(
      store.entries.has(pointer as string),
      "the committed pointer references an existing immutable snapshot",
    );
    const publicWrites = store.writes.filter((write) =>
      write.key.startsWith("published/"),
    );
    assert.ok(publicWrites.length >= 2);
    assert.ok(
      publicWrites.every((write) => write.options.onlyIfNew === true),
      "a late worker cannot overwrite a public snapshot",
    );
  },
);

test("failed snapshot or envelope writes leave the previous publication and revision intact", async () => {
  const store = new MemoryBlobs();
  const adapter = new NetlifyBlobAdapter(store);
  await adapter.mutateContent(0, initial, (state) => {
    state.draft.brand.tagline = "Stable public";
    publish(state);
  });
  const original = structuredClone(store.entries.get("content"));

  for (const fail of [
    (key: string) => key.startsWith("published/"),
    (key: string) => key === "content",
  ]) {
    store.failWrite = fail;
    await assert.rejects(() =>
      adapter.mutateContent(1, initial, (state) => {
        state.draft.brand.tagline = "Must not become public";
        publish(state);
      }),
    );
    store.failWrite = null;
    assert.deepEqual(store.entries.get("content"), original);
    assert.equal(
      (await adapter.readPublished())?.brand.tagline,
      "Stable public",
    );
    assert.equal((await adapter.readContent())?.revision, 1);
  }
});

test("missing and corrupt storage stay distinct; provider failures never reinitialize state", async () => {
  const store = new MemoryBlobs();
  const adapter = new NetlifyBlobAdapter(store);
  assert.equal(await adapter.readContent(), null);
  await adapter.mutateContent(0, initial, () => {});
  const record = store.entries.get("content")!;
  record.etag = "";
  await assert.rejects(
    () => adapter.mutateContent(1, initial, () => {}),
    code(503),
  );
  record.etag = '"valid-provider-etag"';
  record.data = { invalid: "not a content envelope" };
  await assert.rejects(() => adapter.readContent(), code(503));
  store.failRead = (key) => key === "content";
  const before = store.writes.length;
  await assert.rejects(() => adapter.mutateContent(0, initial, () => {}));
  assert.equal(
    store.writes.length,
    before,
    "read failure must not produce a seed write",
  );
});

test("sessions are immutable and logout revocation is immediate across independent workers", async () => {
  const store = new MemoryBlobs();
  const a = new NetlifyBlobAdapter(store),
    b = new NetlifyBlobAdapter(store);
  const first = "a".repeat(64),
    second = "b".repeat(64);
  const expiresAt = Date.now() + 60 * 60 * 1_000;
  const record = { expiresAt, version: "test-password-version" };
  await a.createSession(first, record);
  await b.createSession(second, record);
  assert.equal(await b.sessionIsActive(first, expiresAt, record.version), true);
  assert.equal(
    await a.sessionIsActive(first, expiresAt, "changed-password-version"),
    false,
  );
  await a.revokeSession(first, expiresAt);
  assert.equal(
    await b.sessionIsActive(first, expiresAt, record.version),
    false,
  );
  assert.equal(
    await b.sessionIsActive(second, expiresAt, record.version),
    true,
  );
  await b.revokeSession(first, expiresAt);
  assert.equal(
    await a.sessionIsActive(first, expiresAt, record.version),
    false,
  );
  assert.ok(
    store.writes.every((write) => write.options.onlyIfNew === true),
    "session and revocation records must not be mutable shared lists",
  );
});

test("expired, absent, or unreadable sessions never authenticate", async (t) => {
  const timestamp = Date.UTC(2030, 0, 1, 12, 0);
  let clock = timestamp;
  t.mock.method(Date, "now", () => clock);
  const store = new MemoryBlobs();
  const adapter = new NetlifyBlobAdapter(store);
  const key = "c".repeat(64),
    expiresAt = timestamp + 60_000,
    version = "test-version";
  assert.equal(await adapter.sessionIsActive(key, expiresAt, version), false);
  await adapter.createSession(key, { expiresAt, version });
  assert.equal(await adapter.sessionIsActive(key, expiresAt, version), true);
  clock = expiresAt;
  assert.equal(await adapter.sessionIsActive(key, expiresAt, version), false);
  clock = timestamp;
  store.failRead = () => true;
  const result = await Promise.allSettled([
    adapter.sessionIsActive(key, expiresAt, version),
  ]);
  assert.ok(
    result[0].status === "rejected" || result[0].value === false,
    "provider outages must fail closed",
  );
});

test(
  "the final throttle slot is claimed by at most one concurrent request",
  { timeout: 5_000 },
  async () => {
    const store = new MemoryBlobs();
    const a = new NetlifyBlobAdapter(store),
      b = new NetlifyBlobAdapter(store);
    const now = Date.UTC(2030, 0, 1, 12, 1),
      limit = 5,
      window = 900;
    for (let i = 0; i < limit - 1; i++) {
      assert.equal(
        (await a.takeLoginAttempt("test-client", limit, window, now)).allowed,
        true,
      );
    }
    const attempts = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        (i % 2 ? a : b).takeLoginAttempt("test-client", limit, window, now),
      ),
    );
    assert.equal(attempts.filter((attempt) => attempt.allowed).length, 1);
    assert.ok(
      attempts.every(
        (attempt) => attempt.retryAfter > 0 && attempt.retryAfter <= window,
      ),
    );
    assert.ok(store.writes.every((write) => write.options.onlyIfNew === true));
    assert.ok(
      store.writes.length < 20 * (limit + 3),
      "slot contention must use bounded work",
    );
  },
);

test("throttle windows roll over without reusing old slots and provider errors never grant an attempt", async () => {
  const store = new MemoryBlobs();
  const adapter = new NetlifyBlobAdapter(store);
  const now = Date.UTC(2030, 0, 1, 12, 14, 59);
  assert.equal(
    (await adapter.takeLoginAttempt("test-global", 1, 900, now)).allowed,
    true,
  );
  const exhausted = await adapter.takeLoginAttempt("test-global", 1, 900, now);
  assert.equal(exhausted.allowed, false);
  assert.equal(exhausted.retryAfter, 1);
  assert.equal(
    (await adapter.takeLoginAttempt("test-global", 1, 900, now + 1_000))
      .allowed,
    true,
  );
  store.failWrite = () => true;
  const result = await Promise.allSettled([
    adapter.takeLoginAttempt("new-client", 1, 900, now + 1_000),
  ]);
  assert.ok(
    result[0].status === "rejected" || result[0].value.allowed === false,
  );
});

test("production survives redeploys while every preview deploy receives a separate namespace", async () => {
  const context = (id: string, kind = "production") => ({
    site: { id: "test-site-id" },
    deploy: { id, context: kind },
  });
  const production = netlifyStoreName(context("production-deploy-a"));
  assert.equal(production, netlifyStoreName(context("production-deploy-b")));
  const previewA = netlifyStoreName(context("preview-a", "deploy-preview"));
  const previewB = netlifyStoreName(context("preview-b", "deploy-preview"));
  assert.notEqual(previewA, production);
  assert.notEqual(previewA, previewB);
  assert.equal(
    previewA,
    netlifyStoreName(context("preview-a", "deploy-preview")),
  );
  for (const missing of [
    {},
    { site: { id: "test-site-id" } },
    { site: { id: "test-site-id" }, deploy: { context: "production" } },
  ]) {
    assert.throws(() => netlifyStoreName(missing), code(503));
  }
  const stores = new Map([
    [production, new MemoryBlobs()],
    [previewA, new MemoryBlobs()],
  ]);
  const live = new NetlifyBlobAdapter(stores.get(production)!);
  const preview = new NetlifyBlobAdapter(stores.get(previewA)!);
  await live.mutateContent(0, initial, (state) => {
    state.draft.brand.tagline = "Production publication";
    publish(state);
  });
  await preview.mutateContent(0, initial, (state) => {
    state.draft.brand.tagline = "Preview publication";
    publish(state);
  });
  const redeployed = new NetlifyBlobAdapter(
    stores.get(netlifyStoreName(context("production-deploy-b")))!,
  );
  assert.equal(
    (await redeployed.readPublished())?.brand.tagline,
    "Production publication",
  );
  assert.equal(
    (await preview.readPublished())?.brand.tagline,
    "Preview publication",
  );
});
