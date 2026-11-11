import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

test("deploy guard rejects bundled test credentials without printing their values", () => {
  const directory = mkdtempSync(join(tmpdir(), "pixelated-deploy-"));
  const script = resolve("scripts/check-deploy-env.mjs");
  const run = () =>
    spawnSync(process.execPath, [script], { cwd: directory, encoding: "utf8" });
  try {
    writeFileSync(
      join(directory, ".env.development.local"),
      "ADMIN_PASSWORD_HASH=development-only-value\n",
    );
    assert.equal(run().status, 0);
    writeFileSync(
      join(directory, ".env.local"),
      "SESSION_SECRET=must-never-appear-in-output\n",
    );
    const denied = run();
    assert.equal(denied.status, 1);
    assert.match(denied.stderr, /\.env.local/);
    assert.ok(!denied.stderr.includes("must-never-appear-in-output"));
    writeFileSync(
      join(directory, ".env.local"),
      "SITE_URL=https://example.com\n",
    );
    assert.equal(run().status, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
