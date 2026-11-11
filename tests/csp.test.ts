import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";

test("each document receives a new nonce and cannot inherit one supplied by a visitor", () => {
  const request = () =>
    new NextRequest("https://example.com/admin", {
      headers: { "x-nonce": "untrusted" },
    });
  const first = proxy(request());
  const second = proxy(request());
  const policy = first.headers.get("Content-Security-Policy")!;
  const scriptPolicy = policy
    .split(";")
    .find((directive) => directive.includes("script-src"))!;
  assert.match(scriptPolicy, /'nonce-[A-Za-z0-9+/=]+'/);
  assert.ok(!scriptPolicy.includes("unsafe-inline"));
  assert.ok(!scriptPolicy.includes("untrusted"));
  assert.notEqual(policy, second.headers.get("Content-Security-Policy"));
  assert.equal(
    first.headers.get("x-middleware-request-content-security-policy"),
    policy,
  );
  const nonce = first.headers.get("x-middleware-request-x-nonce");
  assert.ok(nonce && policy.includes(`'nonce-${nonce}'`));
});
