export type PageId =
  | "home"
  | "inside"
  | "booth"
  | "events"
  | "calendar"
  | "bar"
  | "record-shop"
  | "about"
  | "records"
  | "location"
  | string;
export type Asset = {
  id: string;
  src: string;
  label: string;
  alt: string;
  width?: number;
  height?: number;
  mime?: string;
};
export type NavItem = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
};
export type Section = {
  id: string;
  type: "text" | "image" | "gallery" | "callout";
  title: string;
  body: string;
  image: string;
  images: string[];
  linkLabel: string;
  href: string;
  visible: boolean;
};
export type Page = {
  id: PageId;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  imageAlt: string;
  visible: boolean;
  seoTitle: string;
  seoDescription: string;
  shareImage: string;
  sections: Section[];
};
export type Hotspot = {
  id: string;
  label: string;
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction?: "left" | "right" | "forward";
};
export type WindowMask = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type Scene = {
  image: string;
  alt: string;
  focalX: number;
  focalY: number;
  mobileFocalX: number;
  mobileFocalY: number;
  hotspots: Hotspot[];
};
export type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  imageAlt: string;
  start: string;
  end: string;
  doors: string;
  url: string;
  price: string;
  status: "scheduled" | "sold-out" | "cancelled";
  published: boolean;
  featured: boolean;
};
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  available: boolean;
  image: string;
};
export type MenuCategory = {
  id: string;
  title: string;
  description: string;
  visible: boolean;
  items: MenuItem[];
};
export type Hours = {
  day: number;
  closed: boolean;
  open: string;
  close: string;
  note: string;
};
export type SpecialHours = {
  id: string;
  date: string;
  closed: boolean;
  open: string;
  close: string;
  note: string;
};
export type SiteContent = {
  schemaVersion: 1;
  brand: {
    name: string;
    tagline: string;
    descriptor: string;
    logoLight: string;
    logoDark: string;
    mark: string;
    favicon: string;
    accent: string;
    background: string;
    foreground: string;
    font: "sans" | "serif";
    buttonStyle: "square" | "rounded" | "pill";
  };
  navigation: NavItem[];
  assets: Asset[];
  pages: Page[];
  scenes: {
    exterior: Scene;
    interior: Scene;
    windows: WindowMask[];
    lights: {
      enabled: boolean;
      intensity: number;
      colors: string[];
      dayStart: number;
      duskStart: number;
      nightStart: number;
    };
  };
  labels: {
    menu: string;
    enter: string;
    book: string;
    backToRoom: string;
    viewCalendar: string;
    upcoming: string;
    tonight: string;
    directions: string;
    recordComingSoon: string;
    pauseMotion: string;
    resumeMotion: string;
  };
  events: Event[];
  eventSettings: {
    timeZone: string;
    nightCutoff: number;
    tonightEmpty: string;
    upcomingEmpty: string;
  };
  bar: { intro: string; menuNotice: string; categories: MenuCategory[] };
  location: {
    address: string;
    neighborhood: string;
    mapQuery: string;
    mapEmbedUrl: string;
    directionsUrl: string;
    latitude: number;
    longitude: number;
    hoursConfirmed: boolean;
    hours: Hours[];
    specialHours: SpecialHours[];
    hoursNote: string;
    email: string;
    phone: string;
    instagram: string;
    socials: { id: string; label: string; url: string }[];
  };
  booking: { url: string; description: string };
  footer: {
    tagline: string;
    note: string;
    links: { id: string; label: string; url: string }[];
  };
};
export type ContentState = {
  draft: SiteContent;
  published: SiteContent;
  revision: number;
  publishedRevision: number;
  updatedAt: string;
  publishedAt: string;
  history: { id: string; at: string; label: string }[];
};
