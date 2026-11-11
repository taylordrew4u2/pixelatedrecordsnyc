import assert from "node:assert/strict";
import test from "node:test";
import { legacySeedContent, seedContent } from "../src/lib/seed";
import {
  applyEditorialDefaults,
  businessStructuredData,
  serializeStructuredData,
} from "../src/lib/site-seo";

test("legacy published defaults gain local SEO without changing custom editor copy or uploads", () => {
  const content = structuredClone(legacySeedContent);
  content.pages[0].seoTitle = "Pixelated Records | Record Shop, Bar & Events";
  const bar = content.pages.find((page) => page.id === "bar")!;
  bar.seoTitle = "Taylor’s custom bar title";
  bar.seoDescription = "Owner-written description";
  bar.shareImage = "/api/media/custom-upload";
  content.bar.menuNotice = "Ask about our seasonal menu.";
  const updated = applyEditorialDefaults(content, legacySeedContent);
  assert.equal(
    updated.pages[0].seoTitle,
    "Pixelated Records | Record Store & Bar in Ridgewood, Queens",
  );
  assert.equal(updated.pages[0].shareImage, "/assets/storefront-blinds.webp");
  assert.deepEqual(
    updated.pages.find((page) => page.id === "bar"),
    bar,
  );
  assert.equal(updated.bar.menuNotice, content.bar.menuNotice);
  assert.equal(
    content.pages[0].shareImage,
    "/assets/storefront.webp",
    "does not mutate stored content",
  );
  assert.deepEqual(
    applyEditorialDefaults(updated, legacySeedContent),
    updated,
    "migration is idempotent",
  );
});

test("business schema uses the published address and enhanced photo, without unconfirmed details", () => {
  const data = businessStructuredData(seedContent, "https://example.com");
  assert.equal(data["@id"], "https://example.com/#business");
  assert.equal(data.image, "https://example.com/assets/storefront-blinds.webp");
  assert.deepEqual(data.address, {
    "@type": "PostalAddress",
    streetAddress: "792 Onderdonk Avenue",
    addressLocality: "Ridgewood",
    addressRegion: "NY",
    postalCode: "11385",
  });
  assert.ok(!("openingHoursSpecification" in data));
  assert.ok(!("geo" in data));
  assert.ok(!("telephone" in data));
  assert.equal(data.sameAs.length, 1);
});

test("only confirmed complete opening hours enter the business schema", () => {
  const content = structuredClone(seedContent);
  content.location.hours = [
    { day: 5, closed: false, open: "17:00", close: "02:00", note: "" },
    { day: 1, closed: true, open: "", close: "", note: "" },
    { day: 2, closed: false, open: "", close: "", note: "" },
  ];
  assert.ok(
    !(
      "openingHoursSpecification" in
      businessStructuredData(content, "https://example.com")
    ),
  );
  content.location.hoursConfirmed = true;
  const data = businessStructuredData(content, "https://example.com");
  assert.equal(data.openingHoursSpecification?.length, 2);
  assert.equal(
    data.openingHoursSpecification?.[0].dayOfWeek,
    "https://schema.org/Friday",
  );
  assert.equal(data.openingHoursSpecification?.[0].closes, "02:00");
});

test("editable text cannot break out of a structured-data script", () => {
  const value = { name: "</script><script>alert(1)</script>" };
  const serialized = serializeStructuredData(value);
  assert.ok(!serialized.includes("<"));
  assert.deepEqual(JSON.parse(serialized), value);
});
