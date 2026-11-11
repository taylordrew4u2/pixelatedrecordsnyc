import type { SiteContent } from "./types";
import { enhancedPhoto } from "./photo-assets";

export function defaultPageSeo(content: SiteContent) {
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

// Upgrade only untouched launch defaults, including existing published stores.
// Both public reads and the editor see the same values; custom copy is retained.
// This is a pure read migration, with no revision or storage writes.
export function applyEditorialDefaults(
  content: SiteContent,
  legacy: SiteContent,
): SiteContent {
  const next = structuredClone(content);
  const seo = defaultPageSeo(content);
  for (const page of next.pages) {
    const original = legacy.pages.find((entry) => entry.id === page.id);
    const updated = seo[page.id as keyof typeof seo];
    if (!original || !updated) continue;
    if (
      page.seoTitle === original.seoTitle ||
      (page.id === "home" &&
        page.seoTitle === "Pixelated Records | Record Shop, Bar & Events")
    )
      page.seoTitle = updated.title;
    if (page.seoDescription === original.seoDescription)
      page.seoDescription = updated.description;
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
    url: new URL("/", origin).href,
    image: new URL(image || content.brand.mark, origin).href,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address[1],
          addressLocality: address[2],
          addressRegion: address[3],
          postalCode: address[4],
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

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
