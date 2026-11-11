import type { MetadataRoute } from "next";
import { getPublishedContent } from "@/lib/server/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.SITE_URL) return [];
  const content = await getPublishedContent();
  return [
    ...content.pages.map((page) => ({
      url: new URL(
        page.id === "home" ? "/" : `/${page.id}`,
        process.env.SITE_URL,
      ).toString(),
      changeFrequency: "weekly" as const,
      priority: page.id === "home" ? 1 : 0.7,
    })),
    ...content.events
      .filter((event) => event.published)
      .map((event) => ({
        url: new URL(`/events/${event.slug}`, process.env.SITE_URL).toString(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
  ];
}
