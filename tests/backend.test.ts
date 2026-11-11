import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { seedContent } from "../src/lib/seed";
import {
  getContentState,
  getPublishedContent,
  publishDraft,
  restoreDraft,
  saveDraft,
} from "../src/lib/server/content";
import {
  authenticatePassword,
  endSession,
  isAuthenticated,
} from "../src/lib/server/auth";
import { validateContent } from "../src/lib/server/validation";
import { getBackendStatus } from "../src/lib/server/config";
import { ApiError } from "../src/lib/server/errors";
import {
  GET as privateGet,
  PUT as privatePut,
} from "../src/app/api/admin/content/route";
import { POST as login } from "../src/app/api/auth/login/route";
import { POST as publish } from "../src/app/api/admin/publish/route";
import { POST as upload } from "../src/app/api/admin/media/route";
import { GET as media } from "../src/app/api/media/[id]/route";

const origin = "http://localhost:3000";
const keys = [
  "CONTENT_STORAGE",
  "PIXELATED_DATA_DIR",
  "ADMIN_PASSWORD_HASH",
  "SESSION_SECRET",
  "NODE_ENV",
  "VERCEL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_ORIGIN",
];
function hash(password: string) {
  const salt = randomBytes(16);
  return (
    "scrypt:" +
    salt.toString("hex") +
    ":" +
    scryptSync(password, salt, 64).toString("hex")
  );
}
async function environment(
  run: (password: string, directory: string) => Promise<void>,
) {
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  const directory = await mkdtemp(path.join(tmpdir(), "pixelated-backend-"));
  const password = randomBytes(20).toString("base64url");
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, {
    NODE_ENV: "test",
    CONTENT_STORAGE: "local",
    PIXELATED_DATA_DIR: directory,
    ADMIN_PASSWORD_HASH: hash(password),
    SESSION_SECRET: randomBytes(48).toString("hex"),
  });
  try {
    await run(password, directory);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(directory, { recursive: true, force: true });
  }
}
function request(
  route: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
  requestOrigin = origin,
) {
  return new Request(origin + route, {
    method,
    headers: {
      ...(method === "GET"
        ? {}
        : { "content-type": "application/json", origin: requestOrigin }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function signIn(password: string) {
  const response = await login(
    request("/api/auth/login", "POST", { password }),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") || "", /HttpOnly/);
  assert.match(response.headers.get("set-cookie") || "", /SameSite=Strict/);
  return response.headers.get("set-cookie")!.split(";")[0];
}
const status = (expected: number) => (error: unknown) =>
  error instanceof ApiError && error.status === expected;

test("private APIs reject unauthenticated/cross-origin writes; draft, publish, and disk persistence are real", async () => {
  await environment(async (password, directory) => {
    assert.equal((await privateGet(request("/api/admin/content"))).status, 401);
    assert.equal(
      (
        await privatePut(
          request("/api/admin/content", "PUT", {
            content: seedContent,
            expectedRevision: 0,
          }),
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await login(
          request(
            "/api/auth/login",
            "POST",
            { password },
            undefined,
            "https://another-site.example",
          ),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await login(
          request("/api/auth/login", "POST", { password: "incorrect" }),
        )
      ).status,
      401,
    );
    const cookie = await signIn(password);
    assert.equal(
      await isAuthenticated(
        request("/api/auth/session", "GET", undefined, cookie),
      ),
      true,
    );
    assert.equal(
      await isAuthenticated(
        request("/api/auth/session", "GET", undefined, cookie + "x"),
      ),
      false,
    );
    const changed = structuredClone(seedContent);
    changed.brand.tagline = "An intentionally unpublished draft";
    const saved = await privatePut(
      request(
        "/api/admin/content",
        "PUT",
        { content: changed, expectedRevision: 0 },
        cookie,
      ),
    );
    assert.equal(saved.status, 200);
    assert.equal((await saved.json()).revision, 1);
    assert.equal(
      (await getPublishedContent()).brand.tagline,
      seedContent.brand.tagline,
    );
    assert.equal(
      (
        await privatePut(
          request(
            "/api/admin/content",
            "PUT",
            { content: changed, expectedRevision: 0 },
            cookie,
          ),
        )
      ).status,
      409,
    );
    const published = await publish(
      request("/api/admin/publish", "POST", { expectedRevision: 1 }, cookie),
    );
    assert.equal(published.status, 200);
    const live = await getPublishedContent();
    assert.equal(live.brand.tagline, changed.brand.tagline);
    assert.equal(
      JSON.parse(await readFile(path.join(directory, "content.json"), "utf8"))
        .publishedRevision,
      2,
    );
    const restarted = execFileSync(
      process.execPath,
      [
        "--require",
        "tsx/cjs",
        "-e",
        "require('./src/lib/server/content.ts').getPublishedContent().then(c=>process.stdout.write(c.brand.tagline))",
      ],
      { cwd: process.cwd(), env: process.env, encoding: "utf8" },
    );
    assert.equal(
      restarted,
      changed.brand.tagline,
      "a separate server process reads the published content",
    );
    assert.match(published.headers.get("cache-control") || "", /no-store/);
  });
});

test("concurrent saves cannot silently overwrite each other", async () => {
  await environment(async () => {
    const a = structuredClone(seedContent),
      b = structuredClone(seedContent);
    a.brand.tagline = "First editor";
    b.brand.tagline = "Second editor";
    const results = await Promise.allSettled([
      saveDraft(a, 0),
      saveDraft(b, 0),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    const rejected = results.find(
      (result) => result.status === "rejected",
    ) as PromiseRejectedResult;
    assert.equal((rejected.reason as ApiError).status, 409);
    assert.equal((await getContentState()).revision, 1);
  });
});

test("restoring a version changes only the draft and keeps a newer live version intact", async () => {
  await environment(async () => {
    const a = structuredClone(seedContent);
    a.brand.tagline = "Published A";
    await saveDraft(a, 0);
    await publishDraft(1);
    const b = structuredClone(a);
    b.brand.tagline = "Published B";
    const savedB = await saveDraft(b, 2);
    const versionA = savedB.history[0].id;
    await publishDraft(3);
    const restored = await restoreDraft(versionA, 4);
    assert.equal(restored.draft.brand.tagline, "Published A");
    assert.equal((await getPublishedContent()).brand.tagline, "Published B");
    assert.equal(restored.revision, 5);
  });
});

test("published output omits private events, hidden content, and unused media metadata", async () => {
  await environment(async () => {
    const content = structuredClone(seedContent);
    content.events.push({
      id: "private",
      title: "Private title",
      slug: "private-event",
      description: "Private notes",
      image: "/api/media/12345678-1234-4234-8234-123456789abc",
      imageAlt: "Private image",
      start: "",
      end: "",
      doors: "",
      url: "",
      price: "",
      status: "scheduled",
      published: false,
      featured: false,
    });
    content.assets.push({
      id: "private-asset",
      src: content.events[0].image,
      alt: "Private asset",
      label: "Private filename",
    });
    content.pages.push({
      ...content.pages[0],
      id: "hidden-page",
      title: "Hidden title",
      visible: false,
    });
    await saveDraft(content, 0);
    await publishDraft(1);
    const json = JSON.stringify(await getPublishedContent());
    assert.ok(!json.includes("Private title"));
    assert.ok(!json.includes("Private filename"));
    assert.ok(!json.includes("Hidden title"));
    assert.equal(
      (await getContentState()).draft.events[0].title,
      "Private title",
    );
  });
});

test("validation rejects unsafe URLs, invalid event ranges, unsupported fields, and malformed schema", () => {
  validateContent(structuredClone(seedContent));
  const link = structuredClone(seedContent);
  link.booking.url = "javascript:alert(1)";
  assert.throws(() => validateContent(link), status(400));
  const image = structuredClone(seedContent);
  image.scenes.exterior.image = "data:image/svg+xml,<svg/>";
  assert.throws(() => validateContent(image), status(400));
  const extra = {
    ...structuredClone(seedContent),
    serverSecret: "not a content field",
  };
  assert.throws(() => validateContent(extra), status(400));
  const event = structuredClone(seedContent);
  event.events.push({
    id: "event",
    title: "Event",
    slug: "event",
    description: "",
    image: "",
    imageAlt: "",
    start: "2026-11-10T22:00:00-05:00",
    end: "2026-11-10T20:00:00-05:00",
    doors: "",
    url: "",
    price: "",
    status: "scheduled",
    published: true,
    featured: false,
  });
  assert.throws(() => validateContent(event), status(400));
  event.events[0].start = "2026-02-30T20:00:00Z";
  event.events[0].end = "2026-03-04T20:00:00Z";
  assert.throws(() => validateContent(event), status(400));
  assert.throws(
    () => validateContent({ brand: { name: "Only one field" } }),
    status(400),
  );
});

test("page edits preserve a visible homepage and cannot claim administrative or system routes", () => {
  const hiddenHome = structuredClone(seedContent);
  hiddenHome.pages.find((page) => page.id === "home")!.visible = false;
  assert.throws(() => validateContent(hiddenHome), status(400));
  const deletedHome = structuredClone(seedContent);
  deletedHome.pages = deletedHome.pages.filter((page) => page.id !== "home");
  assert.throws(() => validateContent(deletedHome), status(400));
  for (const id of [
    "admin",
    "Admin",
    "api",
    "_next",
    "_not-found",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
  ]) {
    const collision = structuredClone(seedContent);
    collision.pages.push({ ...collision.pages[0], id });
    assert.throws(
      () => validateContent(collision),
      status(400),
      id + " must remain reserved",
    );
  }
  const normalPage = structuredClone(seedContent);
  normalPage.pages.push({ ...normalPage.pages[0], id: "listening-parties" });
  validateContent(normalPage);
});

test("login throttles survive another server process; logout and credential rotation invalidate sessions", async () => {
  await environment(async (password) => {
    const cookie = await signIn(password);
    const authenticatedRequest = request(
      "/api/auth/session",
      "GET",
      undefined,
      cookie,
    );
    assert.equal(await isAuthenticated(authenticatedRequest), true);
    await endSession(authenticatedRequest);
    assert.equal(
      await isAuthenticated(authenticatedRequest),
      false,
      "replaying a signed-out cookie is rejected",
    );
    const second = await signIn(password);
    process.env.ADMIN_PASSWORD_HASH = hash(randomBytes(20).toString("hex"));
    assert.equal(
      await isAuthenticated(
        request("/api/auth/session", "GET", undefined, second),
      ),
      false,
    );
    // Two successful logins already consumed two attempts.
    for (let i = 0; i < 8; i++) {
      await assert.rejects(
        () =>
          authenticatePassword(request("/api/auth/login", "POST"), "incorrect"),
        status(401),
      );
    }
    const restarted = execFileSync(
      process.execPath,
      [
        "--require",
        "tsx/cjs",
        "-e",
        "require('./src/lib/server/auth.ts').authenticatePassword(new Request('http://localhost:3000/api/auth/login'),'incorrect').catch(e=>process.stdout.write(String(e.status)))",
      ],
      { cwd: process.cwd(), env: process.env, encoding: "utf8" },
    );
    assert.equal(restarted, "429");
  });
});

test("images remain private until actually referenced by live content; unsafe uploads are rejected", async () => {
  await environment(async (password) => {
    const cookie = await signIn(password);
    const pixels = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 4,
        background: { r: 120, g: 25, b: 50, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    function uploadRequest(
      bytes: Uint8Array,
      name: string,
      type: string,
      session?: string,
    ) {
      const form = new FormData();
      form.append("file", new File([new Uint8Array(bytes)], name, { type }));
      return new Request(origin + "/api/admin/media", {
        method: "POST",
        headers: { origin, ...(session ? { cookie: session } : {}) },
        body: form,
      });
    }
    assert.equal(
      (await upload(uploadRequest(pixels, "photo.png", "image/png"))).status,
      401,
    );
    const uploaded = await upload(
      uploadRequest(pixels, "photo.png", "image/png", cookie),
    );
    assert.equal(uploaded.status, 201);
    const { asset } = await uploaded.json();
    assert.equal(asset.mime, "image/webp");
    assert.equal(
      (
        await media(request(asset.src), {
          params: Promise.resolve({ id: asset.id }),
        })
      ).status,
      404,
    );
    const privateImage = await media(
      request(asset.src, "GET", undefined, cookie),
      { params: Promise.resolve({ id: asset.id }) },
    );
    assert.equal(privateImage.status, 200);
    assert.equal(
      (await sharp(Buffer.from(await privateImage.arrayBuffer())).metadata())
        .format,
      "webp",
    );
    const content = structuredClone(seedContent);
    content.assets.push(asset);
    await saveDraft(content, 0);
    await publishDraft(1);
    assert.equal(
      (
        await media(request(asset.src), {
          params: Promise.resolve({ id: asset.id }),
        })
      ).status,
      404,
      "asset library entries alone do not publish an upload",
    );
    content.pages.find((page) => page.id === "about")!.image = asset.src;
    await saveDraft(content, 2);
    await publishDraft(3);
    assert.equal(
      (
        await media(request(asset.src), {
          params: Promise.resolve({ id: asset.id }),
        })
      ).status,
      200,
    );
    content.pages.find((page) => page.id === "about")!.visible = false;
    await saveDraft(content, 4);
    await publishDraft(5);
    assert.equal(
      (
        await media(request(asset.src), {
          params: Promise.resolve({ id: asset.id }),
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await upload(
          uploadRequest(
            new TextEncoder().encode("<svg><script>alert(1)</script></svg>"),
            "disguised.png",
            "image/png",
            cookie,
          ),
        )
      ).status,
      415,
    );
    assert.equal(
      (
        await media(request("/api/media/invalid"), {
          params: Promise.resolve({ id: "../content.json" }),
        })
      ).status,
      404,
    );
  });
});

test("unconfigured Vercel production refuses writes and never selects ephemeral local storage", async () => {
  await environment(async (password) => {
    Object.assign(process.env, {
      NODE_ENV: "production",
      VERCEL: "1",
      CONTENT_STORAGE: "local",
    });
    assert.equal(getBackendStatus().storage, "unconfigured");
    assert.equal(getBackendStatus().writable, false);
    await assert.rejects(() => saveDraft(seedContent, 0), status(503));
    assert.equal(
      (await login(request("/api/auth/login", "POST", { password }))).status,
      503,
    );
    assert.equal(
      (await getPublishedContent()).brand.name,
      seedContent.brand.name,
    );
    delete process.env.VERCEL;
    const localProductionCookie = await authenticatePassword(
      request("/api/auth/login", "POST"),
      password,
    );
    assert.match(localProductionCookie, /; Secure/);
  });
});
