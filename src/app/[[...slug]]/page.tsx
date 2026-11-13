import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { headers } from "next/headers";
import { getContentState, getPublishedContent } from "@/lib/server/content";
import { isAuthenticated } from "@/lib/server/auth";
import { PublicExperience } from "@/components/PublicExperience";
import { sectionHref } from "@/lib/sections";
import type { SiteContent } from "@/lib/types";
import { enhancedPhoto } from "@/lib/photo-assets";
import {
  businessStructuredData,
  eventStructuredData,
  serializeStructuredData,
  websiteStructuredData,
} from "@/lib/site-seo";
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
  const title = event
    ? `${event.title} | ${content.brand.name}`
    : page?.seoTitle ||
      `${page?.title.replace(/\n/g, " ") || ""} | ${content.brand.name}`;
  const description = event
    ? `${event.title} at ${content.brand.name} in ${content.location.neighborhood}. ${event.description}`
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200)
    : page?.seoDescription || page?.description;
  const source = event?.image || page?.shareImage || content.brand.mark;
  const image = enhancedPhoto(source)?.src || source;
  const canonical = `/${route.slug?.map(encodeURIComponent).join("/") || ""}`;
  return {
    title,
    description,
    alternates: { canonical },
    icons: { icon: content.brand.favicon },
    robots: preview ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      siteName: content.brand.name,
      locale: "en_US",
      url: canonical,
      title,
      description,
      images: [
        {
          url: image,
          alt: event?.imageAlt || page?.imageAlt || content.brand.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
export default async function Route({ params, searchParams }: Props) {
  const [route, query] = await Promise.all([params, searchParams]);
  const preview = query.preview === "1" && (await isAuthenticated());
  const content = await resolveContent(preview);
  const id = route.slug?.[0] || "home";
  // One scrolling page: old standalone page URLs land on their section.
  if (route.slug?.length === 1) {
    const anchor = sectionHref(`/${id}`);
    if (anchor !== `/${id}`)
      permanentRedirect(
        preview ? anchor.replace("/#", "/?preview=1#") : anchor,
      );
  }
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
  const nonce = (await headers()).get("x-nonce") || undefined;
  const origin = process.env.SITE_URL || "http://localhost:3000";
  const eventData =
    !preview && event ? eventStructuredData(event, content, origin) : null;
  return (
    <>
      {!preview && (
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: serializeStructuredData(
              id === "home"
                ? [
                    businessStructuredData(content, origin),
                    websiteStructuredData(content, origin),
                  ]
                : businessStructuredData(content, origin),
            ),
          }}
        />
      )}
      {eventData && (
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: serializeStructuredData(eventData),
          }}
        />
      )}
      <PublicExperience
        content={content}
        pageId={id}
        eventId={event?.id}
        preview={preview}
        initialNow={new Date().toISOString()}
      />
    </>
  );
}
