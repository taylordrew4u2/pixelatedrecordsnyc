import test from "node:test";
import assert from "node:assert/strict";
import { seedContent } from "../src/lib/seed";
import { validateContent } from "../src/lib/server/validation";
import { FONT_OPTIONS, resolveTheme, THEME_DEFAULTS } from "../src/lib/theme";

test("default theme keeps the Pixelated Records look", () => {
  const theme = resolveTheme(seedContent.brand);
  assert.equal(theme.accent, "#ff0a05");
  assert.equal(theme.accentText, "#181614");
  assert.equal(theme.background, THEME_DEFAULTS.background);
  assert.equal(theme.surface, THEME_DEFAULTS.surface);
  assert.equal(theme.headingFont, FONT_OPTIONS["dm-sans"].stack);
  assert.equal(theme.labelFont, FONT_OPTIONS["barlow-condensed"].stack);
  assert.equal(theme.radius, "0px");
  assert.deepEqual(theme.sizes, {});
});

test("legacy lime accent still shows the red", () => {
  const theme = resolveTheme({ ...seedContent.brand, accent: "#dcf55d" });
  assert.equal(theme.accent, "#ff0a05");
});

test("owner colors, fonts, corners and sizes reach the theme", () => {
  const theme = resolveTheme({
    ...seedContent.brand,
    accent: "#ffc400",
    accentText: "#000000",
    surface: "#101010",
    headingFont: "bebas-neue",
    bodyFont: "inter",
    labelFont: "space-mono",
    buttonStyle: "pill",
    sizes: { panelWidth: 800, textSize: 120, logoWidth: 9999 },
  });
  assert.equal(theme.accent, "#ffc400");
  assert.equal(theme.accentText, "#000000");
  assert.equal(theme.surface, "#101010");
  assert.equal(theme.headingFont, FONT_OPTIONS["bebas-neue"].stack);
  assert.equal(theme.radius, "999px");
  assert.equal(theme.sizes["--op-panel-width"], "800px");
  assert.equal(theme.sizes["--op-text-scale"], "1.2");
  // Out-of-range values are clamped to the allowed maximum.
  assert.equal(theme.sizes["--op-logo-width"], "360px");
});

test("validation accepts the new appearance fields and rejects bad ones", () => {
  const good = structuredClone(seedContent);
  Object.assign(good.brand, {
    surface: "#222222",
    accentText: "#ffffff",
    headingFont: "playfair-display",
    sizes: { panelWidth: 700, buttonSize: 120 },
  });
  assert.doesNotThrow(() => validateContent(good));

  const badFont = structuredClone(seedContent);
  Object.assign(badFont.brand, { headingFont: "comic-sans" });
  assert.throws(() => validateContent(badFont));

  const badSize = structuredClone(seedContent);
  Object.assign(badSize.brand, { sizes: { panelWidth: 5 } });
  assert.throws(() => validateContent(badSize));

  const unknownSize = structuredClone(seedContent);
  Object.assign(unknownSize.brand, { sizes: { pageHeight: 500 } });
  assert.throws(() => validateContent(unknownSize));
});

test("the fixed Studio password hash verifies the owner's chosen word", async () => {
  const { scryptSync, timingSafeEqual } = await import("node:crypto");
  const { adminPasswordHash } = await import("../src/lib/server/config");
  const previous = {
    env: process.env.NODE_ENV,
    hash: process.env.ADMIN_PASSWORD_HASH,
  };
  // Outside automated tests the environment variable is ignored.
  Object.assign(process.env, {
    NODE_ENV: "production",
    ADMIN_PASSWORD_HASH: "scrypt:" + "0".repeat(32) + ":" + "0".repeat(128),
  });
  try {
    const [, salt, expected] = adminPasswordHash().split(":");
    const verify = (word: string) =>
      timingSafeEqual(
        scryptSync(word, Buffer.from(salt, "hex"), 64),
        Buffer.from(expected, "hex"),
      );
    assert.equal(verify("weed"), true);
    assert.equal(verify("Weed"), false);
  } finally {
    Object.assign(process.env, { NODE_ENV: previous.env });
    if (previous.hash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = previous.hash;
  }
});
