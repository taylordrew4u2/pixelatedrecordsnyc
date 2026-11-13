import type { SiteContent } from "@/lib/types";
import { ApiError } from "./errors";

type Rule = (value: unknown, path: string) => void;
function invalid(path: string, message: string): never {
  throw new ApiError(400, path + ": " + message, "VALIDATION_ERROR");
}
const string =
  (maximum = 5_000, pattern?: RegExp): Rule =>
  (value, path) => {
    if (
      typeof value !== "string" ||
      value.length > maximum ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
    )
      invalid(path, "enter valid text (maximum " + maximum + " characters).");
    if (pattern && !pattern.test(value))
      invalid(path, "use the expected format.");
  };
const number =
  (minimum: number, maximum: number, integer = false): Rule =>
  (value, path) => {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < minimum ||
      value > maximum ||
      (integer && !Number.isInteger(value))
    )
      invalid(path, "enter a number from " + minimum + " to " + maximum + ".");
  };
const boolean: Rule = (value, path) => {
  if (typeof value !== "boolean") invalid(path, "choose yes or no.");
};
const oneOf =
  (...values: unknown[]): Rule =>
  (value, path) => {
    if (!values.includes(value))
      invalid(path, "choose one of the supported options.");
  };
const optional =
  (rule: Rule): Rule =>
  (value, path) => {
    if (value !== undefined) rule(value, path);
  };
const object =
  (fields: Record<string, Rule>): Rule =>
  (value, path) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      invalid(path, "expected a group of fields.");
    const source = value as Record<string, unknown>;
    for (const key of Object.keys(source))
      if (!Object.hasOwn(fields, key))
        invalid(path + "." + key, "this field is not supported.");
    for (const [key, rule] of Object.entries(fields))
      rule(source[key], path ? path + "." + key : key);
  };
const array =
  (rule: Rule, maximum = 100): Rule =>
  (value, path) => {
    if (!Array.isArray(value) || value.length > maximum)
      invalid(path, "expected at most " + maximum + " items.");
    const ids = new Set<string>();
    value.forEach((item, index) => {
      rule(item, path + "[" + index + "]");
      if (item && typeof item === "object" && typeof item.id === "string") {
        if (ids.has(item.id)) invalid(path, "each item needs a unique ID.");
        ids.add(item.id);
      }
    });
  };
const id = string(100, /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/);
const color = string(9, /^#(?:[a-f0-9]{3}|[a-f0-9]{6}|[a-f0-9]{8})$/i);
const text = string();
const title = string(250);
const clock = string(5, /^(?:[01]\d|2[0-3]):[0-5]\d$|^$/);

export function isSafeUrl(value: string, image = false): boolean {
  if (value === "") return true;
  if (/[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (!image && /^#[A-Za-z0-9_-]+$/.test(value)) return true;
  try {
    const parsed = new URL(value);
    if (parsed.username || parsed.password) return false;
    if (parsed.protocol === "https:") return Boolean(parsed.hostname);
    if (!image && parsed.protocol === "mailto:")
      return (
        /^[^<>"\s@]+@[^<>"\s@]+\.[^<>"\s@]+$/.test(parsed.pathname) &&
        !parsed.search &&
        !parsed.hash
      );
    if (!image && parsed.protocol === "tel:")
      return (
        /^\+?[0-9().-]+$/.test(parsed.pathname) &&
        !parsed.search &&
        !parsed.hash
      );
  } catch {
    return false;
  }
  return false;
}
const url =
  (image = false): Rule =>
  (value, path) => {
    string(2_000)(value, path);
    if (!isSafeUrl(value as string, image))
      invalid(
        path,
        "use an https URL, a site path, or a supported contact link.",
      );
  };
const dateOnly: Rule = (value, path) => {
  string(10, /^\d{4}-\d{2}-\d{2}$/)(value, path);
  const parsed = new Date(value as string);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    invalid(path, "enter a real date.");
};
const dateTime: Rule = (value, path) => {
  string(40)(value, path);
  if (value === "") return;
  if (
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(
      value as string,
    ) ||
    !Number.isFinite(Date.parse(value as string))
  )
    invalid(path, "enter a date and time including its timezone.");
  dateOnly((value as string).slice(0, 10), path);
};
const percent = number(0, 100);
const region = {
  id,
  x: percent,
  y: percent,
  width: number(0.1, 100),
  height: number(0.1, 100),
};
const scene = object({
  image: url(true),
  alt: text,
  focalX: percent,
  focalY: percent,
  mobileFocalX: percent,
  mobileFocalY: percent,
  hotspots: array(
    object({
      ...region,
      label: title,
      href: url(),
      direction: optional(oneOf("left", "right", "forward")),
    }),
    30,
  ),
});
const section = object({
  id,
  type: oneOf("text", "image", "gallery", "callout"),
  title,
  body: string(20_000),
  image: url(true),
  images: array(url(true), 30),
  linkLabel: title,
  href: url(),
  visible: boolean,
});
const schema = object({
  schemaVersion: oneOf(1),
  brand: object({
    name: title,
    tagline: title,
    descriptor: title,
    logoLight: url(true),
    logoDark: url(true),
    mark: url(true),
    favicon: url(true),
    accent: color,
    background: color,
    foreground: color,
    font: oneOf("sans", "serif"),
    buttonStyle: oneOf("square", "rounded", "pill"),
  }),
  navigation: array(
    object({ id, label: title, href: url(), visible: boolean }),
    30,
  ),
  assets: array(
    object({
      id,
      src: url(true),
      label: title,
      alt: text,
      width: optional(number(1, 50_000, true)),
      height: optional(number(1, 50_000, true)),
      mime: optional(string(100)),
    }),
    1_000,
  ),
  pages: array(
    object({
      id,
      title,
      eyebrow: title,
      description: string(20_000),
      image: url(true),
      imageAlt: text,
      visible: boolean,
      seoTitle: title,
      seoDescription: string(1_000),
      shareImage: url(true),
      sections: array(section, 80),
    }),
    60,
  ),
  scenes: object({
    exterior: scene,
    interior: scene,
    windows: array(object(region), 30),
    lights: object({
      enabled: boolean,
      intensity: number(0, 1),
      colors: array(color, 8),
      dayStart: number(0, 23, true),
      duskStart: number(0, 23, true),
      nightStart: number(0, 23, true),
    }),
    windowEffect: optional(oneOf("none", "music", "laughter")),
    doorBubble: optional(
      object({
        text: string(40),
        size: oneOf("small", "medium", "large"),
      }),
    ),
  }),
  labels: object({
    menu: title,
    enter: title,
    book: title,
    backToRoom: title,
    viewCalendar: title,
    upcoming: title,
    tonight: title,
    directions: title,
    recordComingSoon: title,
    pauseMotion: title,
    resumeMotion: title,
  }),
  events: array(
    object({
      id,
      title,
      slug: string(120, /^[a-z0-9][a-z0-9-]{0,119}$|^$/),
      description: string(20_000),
      image: url(true),
      imageAlt: text,
      start: dateTime,
      end: dateTime,
      doors: dateTime,
      url: url(),
      price: title,
      status: oneOf("scheduled", "sold-out", "cancelled"),
      published: boolean,
      featured: boolean,
    }),
    1_000,
  ),
  eventSettings: object({
    timeZone: string(100),
    nightCutoff: number(0, 12, true),
    tonightEmpty: text,
    upcomingEmpty: text,
  }),
  bar: object({
    intro: text,
    menuNotice: text,
    happyHour: optional(object({ text: title, specials: array(title, 6) })),
    categories: array(
      object({
        id,
        title,
        description: text,
        visible: boolean,
        items: array(
          object({
            id,
            name: title,
            description: text,
            price: title,
            available: boolean,
            image: url(true),
          }),
          150,
        ),
      }),
      40,
    ),
  }),
  location: object({
    address: title,
    neighborhood: title,
    mapQuery: title,
    mapEmbedUrl: url(),
    directionsUrl: url(),
    latitude: number(-90, 90),
    longitude: number(-180, 180),
    hoursConfirmed: boolean,
    hours: array(
      object({
        day: number(0, 6, true),
        closed: boolean,
        open: clock,
        close: clock,
        note: title,
      }),
      7,
    ),
    specialHours: array(
      object({
        id,
        date: dateOnly,
        closed: boolean,
        open: clock,
        close: clock,
        note: title,
      }),
      365,
    ),
    hoursNote: text,
    email: string(254),
    phone: string(50),
    instagram: url(),
    socials: array(object({ id, label: title, url: url() }), 30),
  }),
  booking: object({ url: url(), description: text }),
  footer: object({
    tagline: text,
    note: text,
    links: array(object({ id, label: title, url: url() }), 30),
  }),
});

export function validateContent(value: unknown): SiteContent {
  schema(value, "");
  const content = value as SiteContent;
  if (JSON.stringify(content).length > 800_000)
    invalid(
      "Content",
      "the site content is too large. Archive older events or unused sections.",
    );
  if (!content.brand.name.trim())
    invalid("brand.name", "a site name is required.");
  if (!content.pages.some((page) => page.id === "home" && page.visible))
    invalid("pages", "keep the home page present and visible.");
  const reservedPageIds = new Set([
    "admin",
    "api",
    "assets",
    "_next",
    "_not-found",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
  ]);
  for (const page of content.pages) {
    if (reservedPageIds.has(page.id.toLowerCase()))
      invalid(
        "pages." + page.id,
        "this address is reserved for the website system. Choose a different page ID.",
      );
  }
  if (
    content.location.email &&
    !/^[^\s<>@"']+@[^\s<>@"']+\.[^\s<>@"']+$/.test(content.location.email)
  )
    invalid("location.email", "enter a valid email address.");
  if (
    content.location.phone &&
    !/^\+?[\d()\s.-]{5,50}$/.test(content.location.phone)
  )
    invalid("location.phone", "enter a valid phone number.");
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: content.eventSettings.timeZone,
    }).format();
  } catch {
    invalid("eventSettings.timeZone", "enter a valid IANA timezone.");
  }
  const lights = content.scenes.lights;
  if (!(
    lights.dayStart < lights.duskStart && lights.duskStart < lights.nightStart
  ))
    invalid(
      "scenes.lights",
      "day must begin before dusk, and dusk before night.",
    );
  if (lights.enabled && !lights.colors.length)
    invalid("scenes.lights.colors", "choose at least one light color.");
  const eventSlugs = new Set<string>();
  for (const [index, event] of content.events.entries()) {
    const label = "events[" + index + "]";
    if (
      event.published &&
      (!event.title.trim() || !event.slug || !event.start || !event.end)
    )
      invalid(
        label,
        "published events need a title, URL slug, start time, and end time.",
      );
    if (
      event.start &&
      event.end &&
      Date.parse(event.end) <= Date.parse(event.start)
    )
      invalid(label + ".end", "the end must be after the start.");
    if (
      event.doors &&
      event.start &&
      Date.parse(event.doors) > Date.parse(event.start)
    )
      invalid(label + ".doors", "doors must open by the start time.");
    if (event.slug) {
      if (eventSlugs.has(event.slug))
        invalid(label + ".slug", "each event needs a unique URL slug.");
      eventSlugs.add(event.slug);
    }
  }
  const weekdays = new Set(content.location.hours.map((entry) => entry.day));
  if (weekdays.size !== content.location.hours.length)
    invalid("location.hours", "enter each weekday only once.");
  if (content.location.hoursConfirmed && weekdays.size !== 7)
    invalid("location.hours", "confirmed hours must include all seven days.");
  const specialDates = new Set(
    content.location.specialHours.map((entry) => entry.date),
  );
  if (specialDates.size !== content.location.specialHours.length)
    invalid("location.specialHours", "enter each special date only once.");
  for (const entry of [
    ...content.location.hours,
    ...content.location.specialHours,
  ]) {
    if (
      !entry.closed &&
      (!entry.open || !entry.close) &&
      content.location.hoursConfirmed
    )
      invalid("location.hours", "open days need opening and closing times.");
  }
  return structuredClone(content);
}

export function publicContent(content: SiteContent): SiteContent {
  const result = structuredClone(content);
  result.events = result.events.filter((event) => event.published);
  result.pages = result.pages
    .filter((page) => page.visible)
    .map((page) => ({
      ...page,
      sections: page.sections.filter((section) => section.visible),
    }));
  result.navigation = result.navigation.filter((item) => item.visible);
  result.bar.categories = result.bar.categories
    .filter((category) => category.visible)
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.available),
    }));
  const used = new Set<string>();
  function collect(value: unknown): void {
    if (typeof value === "string") used.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object")
      Object.entries(value).forEach(([key, entry]) => {
        if (key !== "assets") collect(entry);
      });
  }
  collect(result);
  result.assets = result.assets.filter((asset) => used.has(asset.src));
  return result;
}

export function publishedMediaIds(content: SiteContent): Set<string> {
  const ids = new Set<string>();
  function collect(value: unknown): void {
    if (typeof value === "string") {
      const match = /^\/api\/media\/([a-f0-9-]{36})$/.exec(value);
      if (match) ids.add(match[1]);
    } else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object")
      Object.entries(value).forEach(([key, entry]) => {
        if (key !== "assets") collect(entry);
      });
  }
  collect(publicContent(content));
  return ids;
}
