import type { Event, SiteContent } from "./types";
import { enhancedPhoto } from "./photo-assets";
import { defaultPageCopy } from "./page-copy";

// Retained so already-saved defaults can be upgraded without replacing custom SEO.
export function previousPageSeo(content: SiteContent) {
  const name = content.brand.name;
  const place = content.location.neighborhood;
  const address = content.location.address;
  return {
    home: {
      title: `${name} | Record Store & Bar in ${place}`,
      description: `Vinyl records, drinks, and upcoming events at ${name}. Visit us at ${address}, or inquire about booking the venue.`,
    },
    inside: {
      title: `Inside ${name} | Records, Bar & DJ Booth`,
      description: `Look around ${name} in ${place}. Explore the record bins, stop at the bar, and visit the DJ booth for events and venue booking.`,
    },
    booth: {
      title: `DJ Booth & Event Space in ${place} | ${name}`,
      description: `See what’s happening tonight and browse upcoming events at ${name} in ${place}. Get in touch to book the venue.`,
    },
    events: {
      title: `DJ Nights & Events in ${place} | ${name}`,
      description: `Find tonight’s lineup and upcoming events at ${name}, a record store, bar, and event space in ${place}.`,
    },
    calendar: {
      title: `Event Calendar | ${name}, ${place}`,
      description: `Browse the event calendar for ${name} in ${place}. See dates, show details, and event links. All times are local to New York.`,
    },
    bar: {
      title: `Bar in ${place} | ${name}`,
      description: `Stop for a drink at ${name}, the record store and bar at ${address}. Browse the bar menu and plan your visit.`,
    },
    "record-shop": {
      title: `Vinyl Records in ${place} | ${name}`,
      description: `Dig through the vinyl bins at ${name} in ${place}. Visit the record shop at ${address}.`,
    },
    about: {
      title: `About ${name} | Record Store, Bar & Event Space`,
      description: `${name} is a record store, bar, and event space in ${place}. Come for the records, a drink, or a night at the DJ booth.`,
    },
    records: {
      title: `Records & Merch | ${name}, ${place}`,
      description: `Visit ${name} in ${place} to shop vinyl in person. Our online record and merchandise shop is not open yet.`,
    },
    location: {
      title: `Visit ${name} | ${address.split(",")[0]}, ${place}`,
      description: `Find ${name} at ${address}. Get directions and check the latest opening-hours information before your visit.`,
    },
  };
}

export function defaultPageSeo(content: SiteContent) {
  const seo = previousPageSeo(content);
  const name = content.brand.name;
  const place = content.location.neighborhood;
  seo.home.description = `Visit ${name}, a vinyl record store, bar, and event space in ${place}. Browse records, explore the drinks menu, and find upcoming events.`;
  seo.bar.title = `Drinks Menu: Cocktails, Wine & Coffee | ${name}`;
  seo.bar.description = `Explore the drinks menu at ${name} in ${place}: specialty cocktails, wine by the glass, beer, zero-proof drinks, and coffee, with prices.`;
  seo.booth.description = `Find DJ nights and upcoming events at ${name} in ${place}. Browse event posters and contact us about booking the event space.`;
  seo.events.description = `What’s on tonight at ${name}? Browse upcoming DJ nights and events at the record store and bar in ${place}, with dates and event links.`;
  seo.calendar.description = `Plan your visit to ${name} in ${place}. View the event calendar, dates, show details, and ticket links. Times are local to New York.`;
  seo.about.description = `Get to know ${name}, the vinyl record store, bar, and event space on Onderdonk Avenue in ${place}. Records, cocktails, coffee, and DJ nights.`;
  return seo;
}

// Upgrade only untouched launch defaults, including existing published stores.
// Both public reads and the editor see the same values; custom copy is retained.
// This is a pure read migration, with no revision or storage writes.
export function applyEditorialDefaults(
  content: SiteContent,
  legacy: SiteContent,
): SiteContent {
  const next = structuredClone(content);
  const seo = defaultPageSeo(content);
  const previous = previousPageSeo(content);
  const copy = defaultPageCopy(content);
  for (const page of next.pages) {
    const original = legacy.pages.find((entry) => entry.id === page.id);
    const updated = seo[page.id as keyof typeof seo];
    if (!original || !updated) continue;
    if (
      page.seoTitle === original.seoTitle ||
      page.seoTitle === previous[page.id as keyof typeof previous]?.title ||
      (page.id === "home" &&
        page.seoTitle === "Pixelated Records | Record Shop, Bar & Events")
    )
      page.seoTitle = updated.title;
    if (
      page.seoDescription === original.seoDescription ||
      page.seoDescription ===
        previous[page.id as keyof typeof previous]?.description
    )
      page.seoDescription = updated.description;
    for (const field of [
      "title",
      "eyebrow",
      "description",
      "imageAlt",
    ] as const) {
      // A new image may need its own alt text even if the old text was retained.
      if (field === "imageAlt" && page.image !== original.image) continue;
      if (page[field] === original[field]) page[field] = copy[page.id][field];
    }
    page.shareImage = enhancedPhoto(page.shareImage)?.src || page.shareImage;
  }
  if (next.eventSettings.tonightEmpty === legacy.eventSettings.tonightEmpty)
    next.eventSettings.tonightEmpty =
      "No event is listed for tonight. Check Instagram for the latest updates.";
  if (next.eventSettings.upcomingEmpty === legacy.eventSettings.upcomingEmpty)
    next.eventSettings.upcomingEmpty =
      "Upcoming dates haven’t been posted yet.";
  if (next.bar.menuNotice === legacy.bar.menuNotice)
    next.bar.menuNotice =
      "The drinks menu isn’t online yet. Ask at the bar for the current selection and prices.";
  if (next.booking.description === legacy.booking.description)
    next.booking.description = `Planning an event in ${content.location.neighborhood}? Contact ${content.brand.name} about booking the venue.`;
  return next;
}

export function businessStructuredData(content: SiteContent, origin: string) {
  const location = content.location;
  const address = location.address.match(
    /^(.*),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/,
  );
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const hours = location.hoursConfirmed
    ? location.hours.flatMap((day) => {
        if (
          !days[day.day] ||
          (!day.closed &&
            (!/^\d{2}:\d{2}$/.test(day.open) ||
              !/^\d{2}:\d{2}$/.test(day.close)))
        )
          return [];
        return [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${days[day.day]}`,
            opens: day.closed ? "00:00" : day.open,
            closes: day.closed ? "00:00" : day.close,
          },
        ];
      })
    : [];
  const image =
    enhancedPhoto(content.scenes.exterior.image)?.src ||
    content.scenes.exterior.image;
  return {
    "@context": "https://schema.org",
    "@type": ["Store", "BarOrPub"],
    "@id": new URL("/#business", origin).href,
    name: content.brand.name,
    description: content.pages.find((page) => page.id === "about")?.description,
    url: new URL("/", origin).href,
    logo: new URL(content.brand.mark, origin).href,
    image: new URL(image || content.brand.mark, origin).href,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address[1],
          addressLocality: address[2],
          addressRegion: address[3],
          postalCode: address[4],
          addressCountry: "US",
        }
      : location.address,
    ...(location.phone ? { telephone: location.phone } : {}),
    ...(location.email ? { email: location.email } : {}),
    ...(location.latitude && location.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      : {}),
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
    ...(content.bar.categories.some(
      (category) =>
        category.visible && category.items.some((item) => item.available),
    )
      ? { hasMenu: new URL("/bar#drinks", origin).href }
      : {}),
    sameAs: [
      ...new Set(
        [
          location.instagram,
          ...location.socials.map((social) => social.url),
        ].filter(Boolean),
      ),
    ],
  };
}

export function eventStructuredData(
  event: Event,
  content: SiteContent,
  origin: string,
) {
  if (
    !event.published ||
    !event.title ||
    !event.slug ||
    !Number.isFinite(Date.parse(event.start))
  )
    return null;
  const business = businessStructuredData(content, origin);
  const url = new URL(`/events/${encodeURIComponent(event.slug)}`, origin).href;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${url}#event`,
    url,
    name: event.title,
    description: event.description,
    startDate: event.start,
    ...(Number.isFinite(Date.parse(event.end)) &&
    Date.parse(event.end) > Date.parse(event.start)
      ? { endDate: event.end }
      : {}),
    eventStatus: `https://schema.org/${event.status === "cancelled" ? "EventCancelled" : "EventScheduled"}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: content.brand.name,
      address: business.address,
    },
    ...(event.image
      ? {
          image: new URL(enhancedPhoto(event.image)?.src || event.image, origin)
            .href,
        }
      : {}),
  };
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
