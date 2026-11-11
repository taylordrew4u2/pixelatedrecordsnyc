import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContentState, getPublishedContent } from "@/lib/server/content";
import { isAuthenticated } from "@/lib/server/auth";
import { PublicExperience } from "@/components/PublicExperience";
import type { SiteContent } from "@/lib/types";
export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
async function resolveContent(preview: boolean): Promise<SiteContent> {
  return preview && (await isAuthenticated())
    ? (await getContentState()).draft
    : getPublishedContent();
}
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [route, query] = await Promise.all([params, searchParams]);
  const preview = query.preview === "1";
  const content = await resolveContent(preview);
  const page = content.pages.find(
    (page) => page.id === (route.slug?.[0] || "home"),
  );
  const event =
    route.slug?.[0] === "events" && route.slug[1]
      ? content.events.find(
          (event) =>
            event.slug === route.slug![1] && (preview || event.published),
        )
      : undefined;
  return {
    title: event
      ? `${event.title} | ${content.brand.name}`
      : page?.seoTitle ||
        `${page?.title.replace(/\n/g, " ") || ""} | ${content.brand.name}`,
    description:
      event?.description || page?.seoDescription || page?.description,
    icons: { icon: content.brand.favicon },
    robots: preview ? { index: false, follow: false } : undefined,
    openGraph: {
      title: event?.title || page?.title.replace(/\n/g, " "),
      description: event?.description || page?.seoDescription,
      images: [event?.image || page?.shareImage || content.brand.mark],
    },
  };
}
export default async function Route({ params, searchParams }: Props) {
  const [route, query] = await Promise.all([params, searchParams]);
  const preview = query.preview === "1" && (await isAuthenticated());
  const content = await resolveContent(preview);
  const id = route.slug?.[0] || "home";
  const page = content.pages.find(
    (page) => page.id === id && (preview || page.visible),
  );
  if (
    !page ||
    (route.slug &&
      route.slug.length > 1 &&
      (id !== "events" || route.slug.length > 2))
  )
    notFound();
  const event =
    id === "events" && route.slug?.[1]
      ? content.events.find(
          (event) =>
            event.slug === route.slug![1] && (preview || event.published),
        )
      : undefined;
  if (id === "events" && route.slug?.[1] && !event) notFound();
  return (
    <PublicExperience
      content={content}
      pageId={id}
      eventId={event?.id}
      preview={preview}
      initialNow={new Date().toISOString()}
    />
  );
}
