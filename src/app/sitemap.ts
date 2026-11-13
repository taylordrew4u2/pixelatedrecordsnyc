import type { MetadataRoute } from "next";
import { getPublishedContent } from "@/lib/server/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.SITE_URL) return [];
  const content = await getPublishedContent();
  return [
    {
      url: new URL("/", process.env.SITE_URL).toString(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    ...content.events
      .filter((event) => event.published)
      .map((event) => ({
        url: new URL(`/events/${event.slug}`, process.env.SITE_URL).toString(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
  ];
}
