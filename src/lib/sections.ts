// The public site is one scrolling page. Links to its old standalone pages
// jump to the matching section instead; event detail pages stay separate.
export const PAGE_SECTIONS: Record<string, string> = {
  about: "about",
  bar: "bar",
  booth: "events",
  events: "events",
  calendar: "calendar",
  "record-shop": "records",
  records: "records",
  location: "location",
};
export function sectionHref(href: string) {
  const match = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!match) return href;
  const [, path, query = "", hash = ""] = match;
  if (path === "/inside") return `/${query}${hash}`;
  const id = PAGE_SECTIONS[path.slice(1)];
  // A deeper anchor (such as #drinks, which opens the bar menu) is kept.
  return id ? `/${query}${hash || `#${id}`}` : href;
}
