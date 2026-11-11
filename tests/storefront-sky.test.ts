import assert from "node:assert/strict";
import test from "node:test";
import { storefrontSky, storefrontSkyMask } from "../src/lib/storefront-sky";

test("New York sky follows sunrise, day, sunset and night", () => {
  for (const [instant, phase] of [
    ["2026-11-11T05:00:00Z", "night"],
    ["2026-11-11T11:30:00Z", "sunrise"],
    ["2026-11-11T17:00:00Z", "day"],
    ["2026-11-11T21:45:00Z", "sunset"],
  ]) {
    const sky = storefrontSky(new Date(instant));
    assert.equal(sky.phase, phase);
    for (const opacity of [sky.daylight, sky.stars])
      assert.ok(opacity >= 0 && opacity <= 1);
    if (phase === "night") assert.equal(sky.daylight, 0);
    if (phase === "day") assert.equal(sky.daylight, 1);
  }
});

test("daylight changes color before sunset instead of retaining a fixed blue photo", () => {
  const noon = storefrontSky(new Date("2026-11-11T12:00:00-05:00"));
  const afternoon = storefrontSky(new Date("2026-11-11T14:30:00-05:00"));
  const sunset = storefrontSky(new Date("2026-11-11T16:45:00-05:00"));
  const night = storefrontSky(new Date("2026-11-11T22:00:00-05:00"));
  assert.equal(noon.phase, "day");
  assert.equal(afternoon.phase, "day");
  assert.notEqual(noon.top, afternoon.top);
  assert.notEqual(afternoon.horizon, sunset.horizon);
  assert.equal(night.top, "#181614");
  assert.equal(night.horizon, "#181614");
  assert.equal(night.daylight, 0);
  assert.equal(night.stars, 1);
});

test("sunset follows the season instead of a fixed clock-hour cutoff", () => {
  assert.equal(
    storefrontSky(new Date("2026-06-20T20:00:00-04:00")).phase,
    "sunset",
  );
  assert.equal(
    storefrontSky(new Date("2026-12-20T19:00:00-05:00")).phase,
    "night",
  );
});

test("visitor time zone and New York's DST change do not shift the sky", () => {
  assert.deepEqual(
    storefrontSky(new Date("2026-11-11T12:00:00-05:00")),
    storefrontSky(new Date("2026-11-12T02:00:00+09:00")),
  );
  for (const instant of ["2026-03-08T06:59:00Z", "2026-03-08T07:01:00Z"])
    assert.equal(storefrontSky(new Date(instant)).phase, "night");
});

test("replacement photos never receive the original storefront's sky mask", () => {
  assert.ok(storefrontSkyMask("/assets/storefront.webp"));
  assert.equal(storefrontSkyMask("/uploads/new-storefront.webp"), undefined);
  assert.equal(storefrontSkyMask("/assets/interior.webp"), undefined);
});
