import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicExperience } from "../src/components/PublicExperience";
import { seedContent } from "../src/lib/seed";
import type { Event, SiteContent } from "../src/lib/types";

const now = "2026-01-15T00:00:00Z"; // January 14, 7 PM in New York.
const fixture = () => structuredClone(seedContent);

function render(content: SiteContent, pageId = "home", preview = false) {
  return renderToStaticMarkup(
    React.createElement(PublicExperience, {
      content,
      pageId,
      preview,
      initialNow: now,
    }),
  );
}

test("homepage renders the time-driven sky and matching mobile photo in every phase", () => {
  for (const [initialNow, phase] of [
    ["2026-11-11T06:40:00-05:00", "sunrise"],
    ["2026-11-11T12:00:00-05:00", "day"],
    ["2026-11-11T16:45:00-05:00", "sunset"],
    ["2026-11-11T22:00:00-05:00", "night"],
  ]) {
    const html = renderToStaticMarkup(
      React.createElement(PublicExperience, {
        content: fixture(),
        pageId: "home",
        preview: false,
        initialNow,
      }),
    );
    assert.ok(html.includes(`data-sky-phase="${phase}"`));
    assert.match(
      html,
      /--sky-top:#[0-9a-f]{6};--sky-horizon-color:#[0-9a-f]{6}/,
    );
    assert.equal(
      (html.match(/srcSet="\/assets\/storefront-street-mobile-solid.webp"/g) || [])
        .length,
      1,
    );
    assert.match(html, /storefront-street-mobile-cut\.webp 1024w/);
    assert.match(html, /storefront-street-mobile-night\.webp 1024w/);
    assert.match(html, /class="door-bubble is-small"[^>]*>Come in</);
    if (phase === "night")
      assert.match(
        html,
        /--sky-daylight:0;--sky-top:#181614;--sky-horizon-color:#181614;--sky-stars:1/,
      );
  }
});

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function anchors(html: string) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({
    href: decode(match[1].match(/\bhref="([^"]*)"/)?.[1] || ""),
    attributes: match[1],
    inner: match[2],
  }));
}

function event(
  id: string,
  start: string,
  overrides: Partial<Event> = {},
): Event {
  return {
    id,
    title: id,
    slug: id,
    start,
    end: new Date(Date.parse(start) + 2 * 60 * 60 * 1000).toISOString(),
    description: `${id} description`,
    image: "",
    imageAlt: "",
    doors: "",
    url: "",
    price: "",
    published: true,
    featured: false,
    status: "scheduled",
    ...overrides,
  };
}

function cards(html: string) {
  return [
    ...html.matchAll(
      /<article\b[^>]*class="event-card[^>]*>[\s\S]*?<\/article>/g,
    ),
  ].map((match) => match[0]);
}

test("archived pages disappear from hardcoded scene, menu, and footer links", () => {
  for (const [pageId, archived] of [
    ["home", ["inside", "events", "bar", "location"]],
    ["booth", ["inside", "events", "location"]],
    ["record-shop", ["inside", "about", "records", "location"]],
  ] as const) {
    const content = fixture();
    // Match the public API shape: archived pages are absent from the payload.
    content.pages = content.pages.filter(
      (page) => !(archived as readonly string[]).includes(page.id),
    );
    const links = anchors(render(content, pageId)).map((anchor) => anchor.href);
    for (const id of archived) {
      assert.equal(
        links.some((href) => href.split(/[?#]/)[0] === `/${id}`),
        false,
        `${pageId} must not link to archived /${id}`,
      );
    }
    assert.equal(
      links.includes("/admin"),
      false,
      "admin is never advertised publicly",
    );
    assert.ok(
      links.includes(content.booking.url),
      "venue booking remains reachable",
    );
  }
});

test("missing and unpublished event destinations are suppressed while published events remain linked", () => {
  const content = fixture();
  content.events = [
    event("confirmed-show", "2026-01-14T21:00:00-05:00"),
    event("private-draft", "2026-01-15T21:00:00-05:00", { published: false }),
  ];
  const destinations = ["confirmed-show", "private-draft", "deleted-show"];
  content.footer.links = destinations.map((id) => ({
    id,
    label: id,
    url: `/events/${id}`,
  }));
  content.navigation.push(
    ...destinations.map((id) => ({
      id: `nav-${id}`,
      label: id,
      href: `/events/${id}`,
      visible: true,
    })),
  );
  const links = anchors(render(content)).map((anchor) => anchor.href);
  assert.ok(links.includes("/events/confirmed-show"));
  assert.ok(!links.includes("/events/private-draft"));
  assert.ok(!links.includes("/events/deleted-show"));
});

test("draft-preview links preserve existing queries and put preview before the fragment", () => {
  const content = fixture();
  content.footer.links = [
    { id: "plain-anchor", label: "Menu section", url: "/bar#drinks" },
    {
      id: "query-anchor",
      label: "Specials",
      url: "/bar?category=special#drinks",
    },
    {
      id: "replace-preview",
      label: "Existing preview query",
      url: "/bar?preview=0&category=special#drinks",
    },
  ];
  const links = anchors(render(content, "home", true)).map(
    (anchor) => anchor.href,
  );
  assert.ok(links.includes("/bar?preview=1#drinks"));
  assert.ok(links.includes("/bar?category=special&preview=1#drinks"));
  assert.ok(links.includes("/bar?preview=1&category=special#drinks"));
  for (const href of links.filter((href) => href.startsWith("/bar"))) {
    const url = new URL(href, "https://test.invalid");
    assert.equal(url.searchParams.get("preview"), "1");
    assert.equal(url.searchParams.getAll("preview").length, 1);
  }
  assert.ok(
    links.includes("/admin"),
    "admin links do not receive preview parameters",
  );
  assert.ok(!links.some((href) => href.includes("#drinks?preview")));
});

test("the editable entrance sits outside the photo with no window or door buttons", () => {
  const content = fixture();
  content.scenes.exterior.hotspots = [
    {
      id: "custom-entry",
      label: "Step into the listening room",
      href: "/inside",
      x: 40,
      y: 50,
      width: 20,
      height: 10,
      direction: "forward",
    },
    {
      id: "custom-records",
      label: "Browse the shelves",
      href: "/record-shop",
      x: 15,
      y: 45,
      width: 20,
      height: 10,
    },
  ];
  const html = render(content);
  const entrances = anchors(html).filter((anchor) =>
    /class="home-entry-link/.test(anchor.attributes),
  );
  assert.equal(entrances.length, 1);
  assert.equal(entrances[0].href, "/inside");
  assert.match(entrances[0].inner, /Step into the listening room/);
  assert.doesNotMatch(entrances[0].inner, /<svg\b|Click here to/);
  assert.doesNotMatch(html, /door-hotspot|Browse the shelves/);
  assert.match(html, /<\/section><nav class="home-entry"/);
});

test("inside has an explicit leave link to home, including draft preview", () => {
  for (const preview of [false, true]) {
    const leave = anchors(render(fixture(), "inside", preview)).find((anchor) =>
      /class="room-exit-link/.test(anchor.attributes),
    );
    assert.ok(leave);
    assert.equal(leave.href, preview ? "/?preview=1" : "/");
    assert.match(leave.inner, /Leave/);
  }
});

test("bar item photos render alongside readable menu text, while unavailable items stay hidden", () => {
  const content = fixture();
  content.bar.categories = [
    {
      id: "test-drinks",
      title: "Test drinks",
      description: "",
      visible: true,
      items: [
        {
          id: "soda",
          name: "Test soda",
          description: "A test menu description",
          price: "$5",
          available: true,
          image: "/api/media/test-soda.webp",
        },
        {
          id: "hidden-soda",
          name: "Unavailable test soda",
          description: "",
          price: "$6",
          available: false,
          image: "/api/media/hidden-soda.webp",
        },
      ],
    },
  ];
  const html = render(content, "bar");
  const article = html.match(
    /<article\b[^>]*class="drink-item"[^>]*>[\s\S]*?<\/article>/,
  )?.[0];
  assert.ok(article, "the available menu item renders as a menu entry");
  assert.match(article, /<img\b[^>]*src="\/api\/media\/test-soda\.webp"/);
  assert.match(article, /alt="Test soda"/);
  assert.match(article, /<h4>Test soda<\/h4>/);
  assert.match(article, /A test menu description/);
  assert.match(article, /\$5/);
  assert.doesNotMatch(html, /Unavailable test soda|hidden-soda\.webp/);
});

test("published event cards expose cancellation and sold-out status without hiding the event", () => {
  const content = fixture();
  content.events = [
    event("cancelled-show", "2026-01-14T20:00:00-05:00", {
      status: "cancelled",
    }),
    event("sold-out-show", "2026-01-14T21:00:00-05:00", { status: "sold-out" }),
    event("scheduled-show", "2026-01-14T22:00:00-05:00"),
  ];
  const rendered = cards(render(content, "events"));
  assert.equal(rendered.length, 3);
  const cancelled = rendered.find((card) =>
    card.includes('href="/events/cancelled-show"'),
  )!;
  const soldOut = rendered.find((card) =>
    card.includes('href="/events/sold-out-show"'),
  )!;
  const scheduled = rendered.find((card) =>
    card.includes('href="/events/scheduled-show"'),
  )!;
  assert.match(cancelled, /class="status-badge cancelled">Cancelled<\/span>/);
  assert.match(soldOut, /class="status-badge sold-out">Sold out<\/span>/);
  assert.doesNotMatch(scheduled, /class="status-badge/);
});

test("featuring a Tonight event changes card priority and displays a feature badge", () => {
  const content = fixture();
  content.events = [
    event("early-show", "2026-01-14T20:00:00-05:00"),
    event("later-show", "2026-01-14T22:00:00-05:00", { featured: true }),
  ];
  let rendered = cards(render(content, "events"));
  assert.equal(rendered.length, 2);
  assert.match(rendered[0], /href="\/events\/later-show"/);
  assert.match(rendered[0], /class="featured-badge">Featured<\/span>/);
  assert.doesNotMatch(rendered[1], /class="featured-badge"/);

  content.events[1].featured = false;
  rendered = cards(render(content, "events"));
  assert.match(rendered[0], /href="\/events\/early-show"/);
  assert.ok(rendered.every((card) => !card.includes('class="featured-badge"')));
});

test("featuring an upcoming event exposes its description and badge", () => {
  const content = fixture();
  content.events = [event("next-show", "2026-01-16T20:00:00-05:00")];
  let rendered = cards(render(content, "events"));
  assert.equal(rendered.length, 1);
  assert.doesNotMatch(
    rendered[0],
    /next-show description|class="featured-badge"/,
  );

  content.events[0].featured = true;
  rendered = cards(render(content, "events"));
  assert.match(rendered[0], /next-show description/);
  assert.match(rendered[0], /class="featured-badge">Featured<\/span>/);
});

test("the booth shares Tonight and the chronological poster rail with Events", () => {
  const content = fixture();
  content.events = [
    event("later-poster", "2026-01-18T21:00:00-05:00", {
      image: "/assets/poster-later.webp",
    }),
    event("tonight-poster", "2026-01-14T21:00:00-05:00", {
      image: "/assets/poster-tonight.webp",
    }),
    event("next-poster", "2026-01-16T21:00:00-05:00", {
      image: "/assets/poster-next.webp",
    }),
    event("draft-poster", "2026-01-15T21:00:00-05:00", { published: false }),
  ];
  const booth = render(content, "booth");
  const events = render(content, "events");
  assert.deepEqual(cards(booth), cards(events));
  assert.equal(cards(booth).length, 3);
  assert.ok(
    booth.indexOf("/events/next-poster") <
      booth.indexOf("/events/later-poster"),
  );
  assert.doesNotMatch(booth, /draft-poster/);
  assert.match(booth, /Upcoming events — scroll horizontally/);
  assert.match(booth, /Next upcoming events/);
  assert.match(booth, /poster-next.webp/);
  assert.equal((booth.match(/<h1\b/g) || []).length, 1);
});

test("custom public navigation cannot advertise the direct-only admin route", () => {
  const content = fixture();
  content.navigation.push({
    id: "admin-link",
    label: "Admin",
    href: "/admin?tab=events",
    visible: true,
  });
  content.footer.links.push({
    id: "admin-footer",
    label: "Admin",
    url: "/admin#content",
  });
  assert.ok(
    anchors(render(content)).every(
      (link) => link.href.split(/[?#]/)[0] !== "/admin",
    ),
  );
});

test("header links tonight's event flyer with local start time and an accurate live label", () => {
  const content = fixture();
  content.events = [event("tonight-flyer", "2026-01-14T21:00:00-05:00")];
  let header = anchors(render(content)).find((anchor) =>
    anchor.attributes.includes("header-now"),
  );
  assert.equal(header?.href, "/events/tonight-flyer");
  assert.match(header?.inner || "", /tonight-flyer/);
  assert.match(header?.inner || "", /9 PM/);
  assert.doesNotMatch(header?.inner || "", /Live now/);
  content.events[0] = event("live-flyer", "2026-01-14T18:00:00-05:00");
  header = anchors(render(content, "home", true)).find((anchor) =>
    anchor.attributes.includes("header-now"),
  );
  assert.equal(header?.href, "/events/live-flyer?preview=1");
  assert.match(header?.inner || "", /Live now/);
  assert.match(header?.inner || "", /6 PM/);
});

test("header falls back to the events page without inventing a live show", () => {
  const content = fixture();
  content.events = [];
  const header = anchors(render(content)).find((anchor) =>
    anchor.attributes.includes("header-now"),
  );
  assert.equal(header?.href, "/events");
  assert.match(header?.inner || "", /Good vibes happening now/i);
  assert.match(header?.inner || "", /7:00 PM/);
  assert.doesNotMatch(header?.inner || "", /Live now/);
});
