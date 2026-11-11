import type { SiteContent } from "./types";
export function safeHref(value: string, fallback = "#"): string {
  if (!value) return fallback;
  if (/^\/(?!\/)/.test(value) || /^#[a-zA-Z0-9_-]*$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (["https:", "http:", "mailto:", "tel:"].includes(url.protocol))
      return value;
  } catch {}
  return fallback;
}
export function destinationVisible(href: string, content: SiteContent) {
  if (!href.startsWith("/") || href.startsWith("//")) return true;
  const segments = href.split(/[?#]/)[0].split("/").filter(Boolean);
  const key = segments[0] || "home";
  if (key === "admin") return true;
  if (
    key === "events" &&
    segments[1] &&
    !content.events.some(
      (event) => event.slug === segments[1] && event.published,
    )
  )
    return false;
  const target = content.pages.find((page) => page.id === key);
  return target ? target.visible : false;
}
