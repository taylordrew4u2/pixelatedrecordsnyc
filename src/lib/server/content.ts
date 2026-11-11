import { randomUUID } from "node:crypto";
import { cache } from "react";
import type { ContentState, SiteContent } from "@/lib/types";
import { seedContent } from "@/lib/seed";
import { getStorageMode } from "./config";
import { ApiError, storageUnavailable } from "./errors";
import { readLocalJson, withLocalLock, writeLocalJson } from "./local";
import { supabaseRequest, supabaseRpc } from "./supabase";
import { publicContent, validateContent } from "./validation";
import { getNetlifyAdapter } from "./netlify";

type Snapshot = { id: string; at: string; label: string; content: SiteContent };
export type StoredContentState = Omit<ContentState, "history"> & {
  schemaVersion: 1;
  history: Snapshot[];
};

function initialState(): StoredContentState {
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

function assertStoredState(value: unknown): StoredContentState {
  const candidate = value as StoredContentState;
  if (
    !candidate ||
    candidate.schemaVersion !== 1 ||
    !Number.isSafeInteger(candidate.revision) ||
    candidate.revision < 0 ||
    !Number.isSafeInteger(candidate.publishedRevision) ||
    !Array.isArray(candidate.history)
  ) {
    throw new ApiError(
      503,
      "The content store needs attention. Existing content has not been overwritten.",
      "INVALID_STORAGE",
    );
  }
  try {
    validateContent(candidate.draft);
    validateContent(candidate.published);
  } catch {
    throw new ApiError(
      503,
      "The saved content could not be read safely. Existing content has not been overwritten.",
      "INVALID_STORAGE",
    );
  }
  return candidate;
}

async function readStoredState(
  allowUnconfigured = false,
): Promise<StoredContentState> {
  const mode = getStorageMode();
  if (mode === "unconfigured") {
    if (allowUnconfigured) return initialState();
    return storageUnavailable();
  }
  if (mode === "local") {
    const stored = await readLocalJson<StoredContentState>("content.json");
    return stored ? assertStoredState(stored) : initialState();
  }
  if (mode === "netlify") {
    const stored = await getNetlifyAdapter().readContent();
    return stored ? assertStoredState(stored) : initialState();
  }
  const response = await supabaseRequest(
    "/rest/v1/pixelated_content?id=eq.main&select=document",
  );
  const rows = (await response.json()) as { document: StoredContentState }[];
  return rows[0] ? assertStoredState(rows[0].document) : initialState();
}

function toContentState(state: StoredContentState): ContentState {
  return {
    draft: structuredClone(state.draft),
    published: structuredClone(state.published),
    revision: state.revision,
    publishedRevision: state.publishedRevision,
    updatedAt: state.updatedAt,
    publishedAt: state.publishedAt,
    history: state.history.map(({ id, at, label }) => ({ id, at, label })),
  };
}

// Server-only private state: callers must authenticate before rendering or returning it.
export async function getContentState(): Promise<ContentState> {
  return toContentState(await readStoredState());
}

// React memoizes only within a server render/request, not across publications.
// Metadata and page rendering therefore share a read without a stale global cache.
export const getPublishedContent = cache(async (): Promise<SiteContent> => {
  if (getStorageMode() === "netlify") {
    return (
      (await getNetlifyAdapter().readPublished()) || publicContent(seedContent)
    );
  }
  return publicContent((await readStoredState(true)).published);
});

function saveSnapshot(state: StoredContentState, label: string) {
  state.history.unshift({
    id: randomUUID(),
    at: new Date().toISOString(),
    label,
    content: structuredClone(state.draft),
  });
  state.history = state.history.slice(0, 15);
  while (
    state.history.length > 2 &&
    Buffer.byteLength(JSON.stringify(state)) > 6_000_000
  )
    state.history.pop();
}

async function mutateContent(
  expected: number,
  mutation: (state: StoredContentState) => void,
): Promise<ContentState> {
  const mode = getStorageMode();
  if (mode === "unconfigured") return storageUnavailable();
  if (mode === "netlify") {
    return toContentState(
      await getNetlifyAdapter().mutateContent(expected, initialState, mutation),
    );
  }
  async function prepare() {
    const state = await readStoredState();
    if (state.revision !== expected)
      throw new ApiError(
        409,
        "The content changed in another tab. Reload the latest version before saving.",
        "REVISION_CONFLICT",
        { revision: state.revision },
      );
    mutation(state);
    state.revision = expected + 1;
    state.updatedAt = new Date().toISOString();
    return state;
  }
  if (mode === "local") {
    return withLocalLock(async () => {
      const state = await prepare();
      await writeLocalJson("content.json", state);
      return toContentState(state);
    });
  }
  const state = await prepare();
  const committed = await supabaseRpc<StoredContentState>(
    "pixelated_commit_content",
    {
      p_expected_revision: expected,
      p_document: state,
    },
  );
  return toContentState(assertStoredState(committed));
}

export async function saveDraft(
  content: unknown,
  expected: number,
): Promise<ContentState> {
  const valid = validateContent(content);
  return mutateContent(expected, (state) => {
    saveSnapshot(state, "Before draft save");
    state.draft = valid;
  });
}

export async function publishDraft(expected: number): Promise<ContentState> {
  return mutateContent(expected, (state) => {
    validateContent(state.draft);
    saveSnapshot(state, "Before publish");
    state.published = structuredClone(state.draft);
    state.publishedRevision = expected + 1;
    state.publishedAt = new Date().toISOString();
  });
}

export async function restoreDraft(
  historyId: string,
  expected: number,
): Promise<ContentState> {
  return mutateContent(expected, (state) => {
    const snapshot = state.history.find((entry) => entry.id === historyId);
    if (!snapshot)
      throw new ApiError(
        404,
        "That saved version is no longer in the recent history.",
        "HISTORY_NOT_FOUND",
      );
    const restored = validateContent(snapshot.content);
    saveSnapshot(state, "Before restore");
    state.draft = restored;
  });
}
