import type { Page, SiteContent } from "./types";

type PageCopy = Pick<Page, "title" | "eyebrow" | "description" | "imageAlt">;

export function defaultPageCopy(
  content: SiteContent,
): Record<string, PageCopy> {
  const name = content.brand.name;
  const place = content.location.neighborhood;
  return {
    home: {
      title: name,
      eyebrow: place.toUpperCase(),
      description: `Vinyl records, a bar, and an event space in ${place}. Come browse the bins, meet at the bar, or catch a DJ set.`,
      imageAlt: `${name} storefront on Onderdonk Avenue in Ridgewood, Queens.`,
    },
    inside: {
      title: `Inside ${name}`,
      eyebrow: "LOOK AROUND",
      description:
        "Browse vinyl to the left, find events at the DJ booth ahead, or explore the drinks menu at the bar to the right.",
      imageAlt: `Inside ${name}, with vinyl records, the DJ booth, and the bar.`,
    },
    booth: {
      title: "DJ booth &\nevent space",
      eyebrow: "DJ BOOTH & EVENTS",
      description: `Find DJ nights and upcoming events at ${name} in ${place}, or get in touch about booking the space.`,
      imageAlt: `The DJ booth and event space at ${name} in Ridgewood.`,
    },
    events: {
      title: "What’s happening\ntonight",
      eyebrow: "EVENTS IN RIDGEWOOD",
      description: `See what’s on tonight and browse upcoming DJ nights and events at ${name}, the record store and bar on Onderdonk Avenue.`,
      imageAlt: `The event space at ${name} in Ridgewood, Queens.`,
    },
    calendar: {
      title: "The event\ncalendar",
      eyebrow: "PLAN YOUR NEXT VISIT",
      description: `Upcoming dates, event details, and ticket links for ${name} in ${place}. All times are local to New York.`,
      imageAlt: `Events at ${name} in Ridgewood, Queens.`,
    },
    bar: {
      title: "The bar &\ndrinks menu",
      eyebrow: "THE BAR",
      description: `Cocktails, wine, beer, zero-proof drinks, and coffee at ${name} in ${place}. Open the menu for the full selection and prices.`,
      imageAlt: `The bar inside ${name}, a record store and bar in Ridgewood, Queens.`,
    },
    "record-shop": {
      title: "Dig through\nthe records",
      eyebrow: "THE RECORD SHOP",
      description: `Browse vinyl records in person at ${name} in ${place}. Explore the bins, then stop by the bar or see what’s on at the DJ booth.`,
      imageAlt: `Vinyl records on display at ${name} in Ridgewood, Queens.`,
    },
    about: {
      title: "Record store. Bar.\nEvent space.",
      eyebrow: `ABOUT ${name.toUpperCase()}`,
      description: `${name} brings vinyl records, drinks, and events together at ${content.location.address}. Browse the record bins, order a cocktail or coffee, and check the calendar for the next DJ night or event.`,
      imageAlt: `The lounge inside ${name} in Ridgewood, Queens.`,
    },
    records: {
      title: "Shop records\nin person",
      eyebrow: "VINYL & MERCH",
      description: `Visit ${name} in ${place} to browse vinyl in person. The online record and merchandise shop is not open yet.`,
      imageAlt: `Vinyl records at ${name} in Ridgewood.`,
    },
    location: {
      title: "Find us in\nRidgewood",
      eyebrow: "LOCATION & HOURS",
      description: `${name} is at ${content.location.address}. Get directions to the record store, bar, and event space, and check opening-hours updates before visiting.`,
      imageAlt: `${name} on Onderdonk Avenue in Ridgewood, Queens.`,
    },
  };
}
