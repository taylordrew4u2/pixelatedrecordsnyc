// The public site is one scrolling page (#home, #records, #bar, #events,
// #calendar, #book, #about, #contact). Links to its old standalone pages
// jump to the matching section instead; event detail pages stay separate.
export const PAGE_SECTIONS: Record<string, string> = {
  inside: "home",
  "record-shop": "records",
  records: "records",
  bar: "bar",
  booth: "events",
  events: "events",
  calendar: "calendar",
  book: "book",
  about: "about",
  location: "contact",
  contact: "contact",
};
export function sectionHref(href: string) {
  const match = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!match) return href;
  const [, path, query = "", hash = ""] = match;
  const id = PAGE_SECTIONS[path.slice(1)];
  // A deeper anchor (such as #drinks, which opens the bar menu) is kept.
  return id ? `/${query}${hash || (id === "home" ? "" : `#${id}`)}` : href;
}
