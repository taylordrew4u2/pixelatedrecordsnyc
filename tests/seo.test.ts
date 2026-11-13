import assert from "node:assert/strict";
import test from "node:test";
import { legacySeedContent, seedContent } from "../src/lib/seed";
import {
  applyEditorialDefaults,
  businessStructuredData,
  eventStructuredData,
  previousPageSeo,
  defaultPageSeo,
  serializeStructuredData,
} from "../src/lib/site-seo";

test("legacy published defaults gain local SEO without changing custom editor copy or uploads", () => {
  const content = structuredClone(legacySeedContent);
  content.pages[0].seoTitle = "Pixelated Records | Record Shop, Bar & Events";
  const bar = content.pages.find((page) => page.id === "bar")!;
  bar.seoTitle = "Taylor’s custom bar title";
  bar.seoDescription = "Owner-written description";
  bar.title = "Owner title";
  bar.eyebrow = "Owner eyebrow";
  bar.description = "Owner page copy";
  bar.imageAlt = "Owner photo description";
  bar.shareImage = "/api/media/custom-upload";
  content.bar.menuNotice = "Ask about our seasonal menu.";
  const updated = applyEditorialDefaults(content, legacySeedContent);
  assert.equal(
    updated.pages[0].seoTitle,
    "Pixelated Records | Record Store & Bar in Ridgewood, Queens",
  );
  assert.equal(updated.pages[0].shareImage, "/assets/storefront.webp");
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
  assert.equal(data.image, "https://example.com/assets/storefront.webp");
  assert.deepEqual(data.address, {
    "@type": "PostalAddress",
    streetAddress: "792 Onderdonk Avenue",
    addressLocality: "Ridgewood",
    addressRegion: "NY",
    postalCode: "11385",
    addressCountry: "US",
  });
  assert.ok(!("openingHoursSpecification" in data));
  // Coordinates and map come from the venue's verified Google Maps place.
  assert.deepEqual(data.geo, {
    "@type": "GeoCoordinates",
    latitude: 40.7023993,
    longitude: -73.9048206,
  });
  assert.match(data.hasMap, /place_id:ChIJp90R_w9dwokRE0mMtzH1X0M/);
  assert.ok(!("telephone" in data));
  assert.equal(data.sameAs.length, 1);
});

test("saved first-version metadata and launch copy are upgraded, while custom copy is preserved", () => {
  const content = structuredClone(legacySeedContent);
  const oldSeo = previousPageSeo(content);
  for (const page of content.pages) {
    const old = oldSeo[page.id as keyof typeof oldSeo];
    page.seoTitle = old.title;
    page.seoDescription = old.description;
  }
  const updated = applyEditorialDefaults(content, legacySeedContent);
  const bar = updated.pages.find((page) => page.id === "bar")!;
  assert.match(bar.description, /zero-proof drinks/);
  assert.equal(bar.seoTitle, defaultPageSeo(content).bar.title);
  assert.match(
    updated.pages.find((page) => page.id === "events")!.description,
    /DJ nights/,
  );
  assert.deepEqual(applyEditorialDefaults(updated, legacySeedContent), updated);
  content.bar.categories = [];
  assert.equal(
    applyEditorialDefaults(content, legacySeedContent).bar.categories.length,
    0,
    "cleared menus stay cleared",
  );
});

test("event schema describes only published dated events and keeps cancelled events accurate", () => {
  const event = {
    id: "test",
    title: "Test DJ night",
    slug: "test-dj-night",
    description: "An event description",
    image: "/assets/booth.webp",
    imageAlt: "DJ booth",
    start: "2026-11-19T21:00:00-05:00",
    end: "2026-11-20T01:00:00-05:00",
    doors: "",
    url: "",
    price: "",
    status: "scheduled" as const,
    published: true,
    featured: false,
  };
  const data = eventStructuredData(event, seedContent, "https://example.com")!;
  assert.equal(data.url, "https://example.com/events/test-dj-night");
  assert.equal(data.startDate, event.start);
  assert.equal(data.endDate, event.end);
  assert.equal(data.location.name, "Pixelated Records");
  assert.ok(!("offers" in data));
  assert.equal(
    eventStructuredData(
      { ...event, published: false },
      seedContent,
      "https://example.com",
    ),
    null,
  );
  assert.equal(
    eventStructuredData(
      { ...event, start: "" },
      seedContent,
      "https://example.com",
    ),
    null,
  );
  assert.equal(
    eventStructuredData(
      { ...event, status: "cancelled" },
      seedContent,
      "https://example.com",
    )!.eventStatus,
    "https://schema.org/EventCancelled",
  );
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
