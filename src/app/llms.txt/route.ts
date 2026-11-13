import { formatInTimeZone } from "date-fns-tz";
import { getPublishedContent } from "@/lib/server/content";
import { VENUE_MAP } from "@/lib/site-seo";

export const dynamic = "force-dynamic";

// Plain-text facts for AI assistants and answer engines (llmstxt.org format).
export async function GET(request: Request) {
  const content = await getPublishedContent();
  const origin = process.env.SITE_URL || new URL(request.url).origin;
  const link = (path: string) => new URL(path, origin).href;
  const { brand, location, eventSettings } = content;
  const tz = eventSettings.timeZone;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pages = content.pages.filter((page) => page.visible);
  const about = pages.find((page) => page.id === "about");
  const now = Date.now();
  const upcoming = content.events
    .filter((event) => event.published && Date.parse(event.end || event.start) >= now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .slice(0, 12);
  const lines = [
    `# ${brand.name}`,
    "",
    `> Record store, bar and event space at ${location.address} (${location.neighborhood}).`,
    "",
    about?.description || "",
    "",
    "## Visit",
    `- Address: ${location.address}`,
    `- Neighborhood: ${location.neighborhood}`,
    `- Map: ${VENUE_MAP}`,
    ...(location.instagram ? [`- Instagram: ${location.instagram}`] : []),
    ...(location.hoursConfirmed
      ? location.hours.map((day) =>
          day.closed
            ? `- ${days[day.day]}: closed`
            : `- ${days[day.day]}: ${day.open}–${day.close}`,
        )
      : ["- Hours: check Instagram for current hours"]),
    "",
    "## Pages",
    ...pages.map(
      (page) =>
        `- [${page.title.replace(/\n/g, " ")}](${link(page.id === "home" ? "/" : `/${page.id}`)}): ${page.seoDescription || page.description}`,
    ),
    "",
    "## Upcoming events",
    ...(upcoming.length
      ? upcoming.map(
          (event) =>
            `- ${formatInTimeZone(new Date(event.start), tz, "EEE MMM d, h:mm a")}: [${event.title}](${link(`/events/${event.slug}`)})${event.price ? ` (${event.price})` : ""}`,
        )
      : ["- Nothing posted yet. See the calendar or Instagram."]),
    `- Full calendar: ${link("/calendar")}`,
    "",
  ];
  return new Response(
    lines
      .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
      .join("\n"),
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=600",
      },
    },
  );
}
