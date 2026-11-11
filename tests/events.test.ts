import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarCells,
  dateKey,
  eventDate,
  eventEnd,
  eventTime,
  nightWindow,
  publicEvents,
  shiftDay,
  tonightEvents,
  upcomingEvents,
} from "../src/lib/events";
import { seedContent } from "../src/lib/seed";
import type { Event, SiteContent } from "../src/lib/types";

const zone = "America/New_York";

function event(
  id: string,
  start: string,
  end: string,
  overrides: Partial<Event> = {},
): Event {
  return {
    id,
    slug: id,
    title: id,
    start,
    end,
    description: "",
    image: "",
    imageAlt: "",
    doors: "",
    url: "",
    price: "",
    status: "scheduled",
    published: true,
    featured: false,
    ...overrides,
  };
}

function content(events: Event[], nightCutoff = 5): SiteContent {
  return {
    ...seedContent,
    events,
    eventSettings: {
      ...seedContent.eventSettings,
      timeZone: zone,
      nightCutoff,
    },
  };
}

const ids = (events: Event[]) => events.map(({ id }) => id);

test("dates and display times use New York rather than the UTC calendar date", () => {
  const instant = "2026-01-15T02:00:00Z";
  assert.equal(dateKey(instant), "2026-01-14");
  assert.equal(eventTime(instant, zone), "9 PM");
  assert.equal(eventDate(instant, zone), "Wed, Jan 14");
  assert.equal(eventTime("2026-01-15T02:30:00Z", zone), "9:30 PM");
  assert.equal(eventTime("", zone), "");
  assert.equal(eventDate("not-a-date", zone), "");
});

test("midnight belongs to the preceding night until the configured cutoff", () => {
  const beforeMidnight = nightWindow(new Date("2026-11-10T04:59:00Z"), zone, 5);
  const midnight = nightWindow(new Date("2026-11-10T05:00:00Z"), zone, 5);
  const beforeCutoff = nightWindow(new Date("2026-11-10T09:59:59Z"), zone, 5);
  const atCutoff = nightWindow(new Date("2026-11-10T10:00:00Z"), zone, 5);
  for (const window of [beforeMidnight, midnight, beforeCutoff]) {
    assert.equal(window.key, "2026-11-09");
    assert.equal(window.start.toISOString(), "2026-11-09T10:00:00.000Z");
    assert.equal(window.end.toISOString(), "2026-11-10T10:00:00.000Z");
  }
  assert.equal(atCutoff.key, "2026-11-10");
  assert.equal(atCutoff.start.toISOString(), "2026-11-10T10:00:00.000Z");
});

test("a midnight cutoff rolls the window at New York midnight", () => {
  assert.equal(
    nightWindow(new Date("2026-07-15T03:59:59Z"), zone, 0).key,
    "2026-07-14",
  );
  const midnight = nightWindow(new Date("2026-07-15T04:00:00Z"), zone, 0);
  assert.equal(midnight.key, "2026-07-15");
  assert.equal(midnight.start.toISOString(), "2026-07-15T04:00:00.000Z");
});

test("spring-forward night uses real local boundaries and lasts 23 elapsed hours", () => {
  const window = nightWindow(new Date("2026-03-08T06:30:00Z"), zone, 5);
  assert.equal(window.key, "2026-03-07");
  assert.equal(window.start.toISOString(), "2026-03-07T10:00:00.000Z");
  assert.equal(window.end.toISOString(), "2026-03-08T09:00:00.000Z");
  assert.equal(
    window.end.getTime() - window.start.getTime(),
    23 * 60 * 60 * 1000,
  );

  const party = event(
    "spring-party",
    "2026-03-07T23:00:00-05:00",
    "2026-03-08T04:00:00-04:00",
  );
  assert.deepEqual(
    ids(tonightEvents(content([party]), new Date("2026-03-08T07:30:00Z"))),
    ["spring-party"],
  );
  assert.deepEqual(
    tonightEvents(content([party]), new Date("2026-03-08T08:00:00Z")),
    [],
  );
});

test("fall-back night lasts 25 elapsed hours and retains events through both 1:30 AMs", () => {
  const party = event(
    "fall-party",
    "2026-10-31T23:00:00-04:00",
    "2026-11-01T03:00:00-05:00",
  );
  for (const instant of ["2026-11-01T05:30:00Z", "2026-11-01T06:30:00Z"]) {
    const window = nightWindow(new Date(instant), zone, 5);
    assert.equal(window.key, "2026-10-31");
    assert.equal(window.start.toISOString(), "2026-10-31T09:00:00.000Z");
    assert.equal(window.end.toISOString(), "2026-11-01T10:00:00.000Z");
    assert.equal(
      window.end.getTime() - window.start.getTime(),
      25 * 60 * 60 * 1000,
    );
    assert.deepEqual(ids(tonightEvents(content([party]), new Date(instant))), [
      "fall-party",
    ]);
  }
});

test("a nonexistent 2 AM spring cutoff advances to 3 AM instead of ending the night early", () => {
  const now = new Date("2026-03-08T06:30:00Z"); // 1:30 AM EST, before the skipped 2 AM hour.
  const window = nightWindow(now, zone, 2);
  assert.equal(window.key, "2026-03-07");
  assert.equal(window.end.toISOString(), "2026-03-08T07:00:00.000Z");
  assert.ok(window.end.getTime() > now.getTime());
  const party = event(
    "spring-cutoff",
    "2026-03-07T23:00:00-05:00",
    "2026-03-08T04:00:00-04:00",
  );
  assert.deepEqual(ids(tonightEvents(content([party], 2), now)), [
    "spring-cutoff",
  ]);
  const afterJump = nightWindow(new Date("2026-03-08T07:00:00Z"), zone, 2);
  assert.equal(afterJump.key, "2026-03-08");
  assert.equal(afterJump.start.toISOString(), "2026-03-08T07:00:00.000Z");
});

test("Tonight includes multiple ongoing and later events from the same night", () => {
  const data = content([
    event("later", "2026-01-15T02:00:00-05:00", "2026-01-15T04:00:00-05:00"),
    event("ongoing", "2026-01-14T23:00:00-05:00", "2026-01-15T03:00:00-05:00"),
    event("ended", "2026-01-14T21:00:00-05:00", "2026-01-15T00:30:00-05:00"),
    event("ends-now", "2026-01-14T22:00:00-05:00", "2026-01-15T01:00:00-05:00"),
  ]);
  assert.deepEqual(ids(tonightEvents(data, new Date("2026-01-15T06:00:00Z"))), [
    "ongoing",
    "later",
  ]);
});

test("upcoming excludes Tonight and past events while including the next night", () => {
  const data = content([
    event(
      "next-night",
      "2026-01-15T21:00:00-05:00",
      "2026-01-15T23:00:00-05:00",
    ),
    event("tonight", "2026-01-14T23:00:00-05:00", "2026-01-15T03:00:00-05:00"),
    event("past", "2026-01-13T21:00:00-05:00", "2026-01-13T23:00:00-05:00"),
    event(
      "at-cutoff",
      "2026-01-15T05:00:00-05:00",
      "2026-01-15T06:00:00-05:00",
    ),
  ]);
  assert.deepEqual(
    ids(upcomingEvents(data, new Date("2026-01-15T06:00:00Z"))),
    ["at-cutoff", "next-night"],
  );
  assert.deepEqual(ids(tonightEvents(data, new Date("2026-01-15T10:00:00Z"))), [
    "at-cutoff",
    "next-night",
  ]);
});

test("an overnight event remains visible while running even when it crosses the cutoff", () => {
  const party = event(
    "extended-party",
    "2026-01-14T23:00:00-05:00",
    "2026-01-15T06:00:00-05:00",
  );
  assert.deepEqual(
    ids(tonightEvents(content([party]), new Date("2026-01-15T10:30:00Z"))),
    ["extended-party"],
  );
  assert.deepEqual(
    upcomingEvents(content([party]), new Date("2026-01-15T10:30:00Z")),
    [],
  );
});

test("public listings exclude drafts and invalid starts without mutating the source order", () => {
  const events = [
    event("late", "2026-01-16T21:00:00-05:00", "2026-01-16T23:00:00-05:00"),
    event("draft", "2026-01-15T21:00:00-05:00", "2026-01-15T23:00:00-05:00", {
      published: false,
    }),
    event("invalid", "not-a-date", ""),
    event("early", "2026-01-14T21:00:00-05:00", "2026-01-14T23:00:00-05:00"),
  ];
  const before = ids(events);
  assert.deepEqual(ids(publicEvents(content(events))), ["early", "late"]);
  assert.deepEqual(ids(events), before);
});

test("published cancelled and sold-out events retain their status for visitor notices", () => {
  const data = content([
    event(
      "cancelled-tonight",
      "2026-01-14T23:00:00-05:00",
      "2026-01-15T03:00:00-05:00",
      { status: "cancelled" },
    ),
    event(
      "sold-out-tonight",
      "2026-01-15T02:00:00-05:00",
      "2026-01-15T04:00:00-05:00",
      { status: "sold-out" },
    ),
    event(
      "cancelled-future",
      "2026-01-16T21:00:00-05:00",
      "2026-01-16T23:00:00-05:00",
      { status: "cancelled" },
    ),
  ]);
  const now = new Date("2026-01-15T06:00:00Z");
  assert.deepEqual(
    tonightEvents(data, now).map(({ status }) => status),
    ["cancelled", "sold-out"],
  );
  assert.deepEqual(ids(upcomingEvents(data, now)), ["cancelled-future"]);
  assert.equal(upcomingEvents(data, now)[0].status, "cancelled");
});

test("missing end times use four elapsed hours, including across daylight saving changes", () => {
  const party = event("no-end", "2026-03-08T00:00:00-05:00", "");
  assert.equal(
    new Date(eventEnd(party)).toISOString(),
    "2026-03-08T09:00:00.000Z",
  );
  assert.deepEqual(
    ids(tonightEvents(content([party]), new Date("2026-03-08T08:59:59Z"))),
    ["no-end"],
  );
  assert.deepEqual(
    tonightEvents(content([party]), new Date("2026-03-08T09:00:00Z")),
    [],
  );
});

test("day shifting crosses year boundaries and leap days without timezone drift", () => {
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDay("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDay("2024-02-28", 1), "2024-02-29");
  assert.equal(shiftDay("2024-02-29", 1), "2024-03-01");
  assert.equal(shiftDay("2026-03-07", 1), "2026-03-08");
});

test("February calendar includes leap day and aligns dates to Sunday-first weeks", () => {
  const cells = calendarCells(2024, 1);
  assert.equal(cells.length, 35);
  assert.deepEqual(cells.slice(0, 5), [null, null, null, null, "2024-02-01"]);
  assert.equal(cells.filter(Boolean).length, 29);
  assert.equal(cells[32], "2024-02-29");
  assert.deepEqual(cells.slice(-2), [null, null]);
});

test("calendar applies Gregorian century leap rules and pads complete weeks", () => {
  assert.equal(calendarCells(2000, 1).filter(Boolean).length, 29);
  assert.equal(calendarCells(2100, 1).filter(Boolean).length, 28);
  const sixWeeks = calendarCells(2026, 7);
  assert.equal(sixWeeks.length, 42);
  assert.equal(sixWeeks[6], "2026-08-01");
  assert.equal(sixWeeks[36], "2026-08-31");
  assert.equal(sixWeeks.length % 7, 0);
});
