"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import photoColors from "@/lib/photo-colors.json";
import { enhancedPhoto } from "@/lib/photo-assets";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowDown,
  X,
  Menu as MenuIcon,
  Disc3,
  BookOpen,
  MapPin,
  CalendarDays,
  Clock,
  ExternalLink,
  Instagram,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import type { SiteContent, Page, Event, Section } from "@/lib/types";
import {
  calendarCells,
  dateKey,
  eventDate,
  eventEnd,
  eventTime,
  publicEvents,
  tonightEvents,
  headerTonightEvent,
  upcomingEvents,
} from "@/lib/events";
import { destinationVisible, safeHref } from "@/lib/links";
import { sectionHref } from "@/lib/sections";

const PreviewContext = createContext(false);
const ContentContext = createContext<SiteContent | null>(null);
const OnePageContext = createContext(false);
function A({
  href,
  children,
  className = "",
  ariaLabel,
  ariaCurrent,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaCurrent?: "location";
  onClick?: () => void;
}) {
  const preview = useContext(PreviewContext);
  const content = useContext(ContentContext);
  const original = safeHref(href);
  // Hidden pages stay hidden after their links are mapped to sections.
  if (
    content &&
    !preview &&
    original.startsWith("/") &&
    !original.startsWith("//") &&
    !destinationVisible(original, content)
  )
    return null;
  let target = sectionHref(original);
  if (target.startsWith("/") && !target.startsWith("//")) {
    if (!preview && target.split(/[?#]/)[0] === "/admin") return null;
    if (content && !preview && !destinationVisible(target, content))
      return null;
    if (preview && !target.startsWith("/admin")) {
      const url = new URL(target, "https://pixelated.invalid");
      url.searchParams.set("preview", "1");
      target = url.pathname + url.search + url.hash;
    }
    return (
      <Link
        href={target}
        className={className}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  const external = /^https?:/.test(target);
  return (
    <a
      href={target}
      className={className}
      aria-label={ariaLabel}
      onClick={onClick}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="eyebrow">
      <span className="small-square" />
      {children}
    </p>
  );
}
function Photo({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) return null;
  const enhanced = enhancedPhoto(src);
  const isBuiltIn =
    /^\/assets\/[^/]+\.webp$/.test(src) && !src.includes("-small");
  return (
    <img
      className={`venue-photo ${className}`}
      src={safeHref(enhanced?.src || src, "")}
      srcSet={
        enhanced
          ? enhanced.src === enhanced.small
            ? undefined
            : `${enhanced.small} 960w, ${enhanced.src} ${enhanced.width}w`
          : isBuiltIn
            ? `${src.replace(".webp", "-small.webp")} 960w, ${src} 1920w`
            : undefined
      }
      sizes={priority ? "100vw" : "(max-width: 700px) 100vw, 75vw"}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
function BookingButton({
  content,
  className = "button primary",
}: {
  content: SiteContent;
  className?: string;
}) {
  return (
    <A href={content.booking.url} className={className}>
      {content.labels.book}
      <ArrowUpRight size={18} />
    </A>
  );
}
function useClock(initialNow: string) {
  const [now, setNow] = useState(new Date(initialNow));
  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = setInterval(refresh, 30_000);
    // Mobile browsers suspend timers in background tabs and the app switcher.
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return now;
}
function SiteHeader({ content }: { content: SiteContent; now?: Date }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const modal = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const links = ONE_PAGE_SECTIONS.filter((section) =>
    sectionVisible(content, section.page),
  );
  useEffect(() => {
    if (open) {
      modal.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      modal.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  // Mark the section currently in view as the active navigation item.
  useEffect(() => {
    const targets = ["home", ...ONE_PAGE_SECTIONS.map((section) => section.id)]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const item = (section: (typeof links)[number], onClick?: () => void) => (
    <A
      key={section.id}
      href={`/#${section.id}`}
      className={`op-nav-link${active === section.id ? " is-active" : ""}`}
      ariaCurrent={active === section.id ? "location" : undefined}
      onClick={onClick}
    >
      {section.label}
    </A>
  );
  return (
    <>
      <header className="site-header op-header">
        <A
          href="/#home"
          className="brand-link"
          ariaLabel={`${content.brand.name}, back to the top`}
        >
          <img
            src={safeHref(content.brand.logoLight, "/assets/logo-light.png")}
            width="220"
            height="64"
            alt={content.brand.name}
          />
        </A>
        <nav className="op-nav" aria-label="Sections">
          {links.map((section) => item(section))}
        </nav>
        <button
          ref={trigger}
          className="menu-trigger op-menu-trigger"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="main-menu"
        >
          {content.labels.menu}
        </button>
      </header>
      <dialog
        id="main-menu"
        className="nav-dialog op-menu"
        ref={modal}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        aria-label="Sections"
      >
        <div className="op-menu-top">
          <span className="op-menu-brand">{content.brand.name}</span>
          <button className="op-close" onClick={close}>
            Close <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Sections menu">
          {links.map((section) => item(section, () => setOpen(false)))}
        </nav>
      </dialog>
    </>
  );
}
// The blueprint's fixed section order and navigation labels.
export const ONE_PAGE_SECTIONS = [
  { id: "records", label: "Records", page: "records" },
  { id: "bar", label: "Bar", page: "bar" },
  { id: "events", label: "Events", page: "events" },
  { id: "calendar", label: "Calendar", page: "calendar" },
  { id: "book", label: "Book an Event", page: "book" },
  { id: "about", label: "About", page: "about" },
  { id: "contact", label: "Contact", page: "location" },
] as const;
function sectionVisible(content: SiteContent, page: string) {
  return content.pages.some((entry) => entry.id === page && entry.visible);
}
// Full-bleed photograph behind a section. The file itself is never altered.
function SectionPhoto({
  page,
  priority = false,
}: {
  page: Page;
  priority?: boolean;
}) {
  if (!page.image) return null;
  return (
    <Photo
      src={page.image}
      alt={page.imageAlt}
      className="op-bg"
      priority={priority}
    />
  );
}
function PhotoSection({
  id,
  page,
  children,
  after,
}: {
  id: string;
  page: Page;
  children?: ReactNode;
  after?: ReactNode;
}) {
  return (
    <section
      id={id}
      className="op-section op-photo"
      aria-labelledby={`${id}-title`}
    >
      <SectionPhoto page={page} />
      <div className="op-panel">
        <h2 id={`${id}-title`}>{page.title}</h2>
        {page.description && <p>{page.description}</p>}
        {children}
      </div>
      {after}
    </section>
  );
}
function FlyerLineup({ content, now }: { content: SiteContent; now: Date }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const zone = content.eventSettings.timeZone;
  const events = publicEvents(content).filter(
    (event) => event.status !== "cancelled" && eventEnd(event) > now.getTime(),
  );
  const measure = () => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [events.length]);
  const step = (direction: number) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>(".op-flyer");
    if (!el || !card) return;
    el.scrollBy({
      left: direction * (card.offsetWidth + 24),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  if (!events.length)
    return (
      <div className="op-empty">
        <p>{content.eventSettings.upcomingEmpty}</p>
        {content.location.instagram && (
          <A href={content.location.instagram} className="op-cta">
            Latest on Instagram
          </A>
        )}
      </div>
    );
  return (
    <div className="op-lineup">
      <button
        type="button"
        className="op-arrow op-prev"
        aria-label="Previous flyers"
        aria-controls="flyer-track"
        disabled={edges.start}
        onClick={() => step(-1)}
      >
        <ChevronLeft size={24} aria-hidden="true" />
      </button>
      <div
        id="flyer-track"
        ref={track}
        className="op-track"
        role="list"
        aria-label="Upcoming events, soonest first"
        onScroll={measure}
      >
        {events.map((event) => (
          <article key={event.id} className="op-flyer" role="listitem">
            <A href={`/events/${event.slug}`} className="op-flyer-link">
              <span className="op-flyer-art">
                {event.image ? (
                  <Photo
                    src={event.image}
                    alt={event.imageAlt || event.title}
                  />
                ) : (
                  <span className="op-flyer-blank">{event.title}</span>
                )}
              </span>
              <span className="op-flyer-date">
                {eventDate(event.start, zone, "EEE / MMM d")}
                {eventTime(event.start, zone) &&
                  ` · ${eventTime(event.start, zone)}`}
              </span>
              <span className="op-flyer-title">{event.title}</span>
              <span className="op-flyer-more">Event details</span>
            </A>
          </article>
        ))}
      </div>
      <button
        type="button"
        className="op-arrow op-next"
        aria-label="Next flyers"
        aria-controls="flyer-track"
        disabled={edges.end}
        onClick={() => step(1)}
      >
        <ChevronRight size={24} aria-hidden="true" />
      </button>
    </div>
  );
}
function ContactSection({
  content,
  page,
}: {
  content: SiteContent;
  page: Page;
}) {
  const location = content.location;
  const destination =
    location.latitude !== 0 || location.longitude !== 0
      ? `${location.latitude},${location.longitude}`
      : location.mapQuery || `${content.brand.name}, ${location.address}`;
  const directions =
    location.directionsUrl ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const embed =
    location.mapEmbedUrl ||
    `https://maps.google.com/maps?q=${encodeURIComponent(destination)}&z=16&output=embed`;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <section
      id="contact"
      className="op-section op-contact"
      aria-labelledby="contact-title"
    >
      <div className="op-contact-details">
        <h2 id="contact-title">{page.title}</h2>
        {page.description && <p>{page.description}</p>}
        <dl>
          <div>
            <dt>Address</dt>
            <dd>{location.address}</dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>
              {location.hoursConfirmed ? (
                <ul className="op-hours">
                  {[1, 2, 3, 4, 5, 6, 0].map((index) => {
                    const hours = location.hours.find((h) => h.day === index);
                    return hours ? (
                      <li key={index}>
                        <span>{days[index]}</span>
                        <span>
                          {hours.closed
                            ? "Closed"
                            : `${displayHour(hours.open)} – ${displayHour(hours.close)}`}
                        </span>
                      </li>
                    ) : null;
                  })}
                </ul>
              ) : (
                location.hoursNote
              )}
            </dd>
          </div>
          <div>
            <dt>Get in touch</dt>
            <dd className="op-touch">
              {location.email && (
                <A href={`mailto:${location.email}`}>{location.email}</A>
              )}
              {location.phone && (
                <A href={`tel:${location.phone.replace(/[^+\d]/g, "")}`}>
                  {location.phone}
                </A>
              )}
              {location.instagram && <A href={location.instagram}>Instagram</A>}
            </dd>
          </div>
        </dl>
        <A href={directions} className="op-cta">
          Get directions
        </A>
      </div>
      <div className="op-map">
        <iframe
          src={safeHref(embed, "")}
          title={`Map showing ${content.brand.name} at ${location.address}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
function Home({
  content,
  page,
  now,
}: {
  content: SiteContent;
  page: Page;
  now: Date;
}) {
  const find = (id: string) =>
    content.pages.find((entry) => entry.id === id && entry.visible);
  const records = find("records"),
    events = find("events"),
    calendar = find("calendar"),
    book = find("book"),
    about = find("about"),
    contact = find("location"),
    bar = find("bar");
  const exterior = {
    ...page,
    image: content.scenes.exterior.image,
    imageAlt: content.scenes.exterior.alt,
  };
  const first = ONE_PAGE_SECTIONS.find((section) =>
    sectionVisible(content, section.page),
  );
  return (
    <OnePageContext.Provider value={true}>
      <section
        id="home"
        className="op-section op-photo op-landing"
        aria-labelledby="home-title"
      >
        <SectionPhoto page={exterior} priority />
        <div className="op-wordmark">
          <h1 id="home-title">{page.title}</h1>
        </div>
        {first && (
          <A href={`/#${first.id}`} className="op-cta op-scroll-cue">
            Scroll to {first.label}
            <ChevronDown size={20} aria-hidden="true" />
          </A>
        )}
      </section>
      {records && <PhotoSection id="records" page={records} />}
      {bar && <BarPage content={content} page={bar} />}
      {events && (
        <PhotoSection
          id="events"
          page={events}
          after={
            calendar && (
              <A href="/#calendar" className="op-calendar-bar">
                Explore upcoming events
                <ArrowDown size={26} aria-hidden="true" />
              </A>
            )
          }
        />
      )}
      {calendar && (
        <section
          id="calendar"
          className="op-section op-calendar"
          aria-labelledby="calendar-title"
        >
          <div className="op-calendar-head">
            <p className="op-kicker">{calendar.eyebrow}</p>
            <h2 id="calendar-title">{calendar.title}</h2>
            {calendar.description && <p>{calendar.description}</p>}
          </div>
          <FlyerLineup content={content} now={now} />
        </section>
      )}
      {book && (
        <PhotoSection
          id="book"
          page={book}
          after={
            <span className="op-actions">
              <BookingButton content={content} className="op-cta" />
            </span>
          }
        />
      )}
      {about && <PhotoSection id="about" page={about} />}
      {contact && <ContactSection content={content} page={contact} />}
    </OnePageContext.Provider>
  );
}
function BackToRoom(_: { content: SiteContent }) {
  return null;
}
function SpacePage({
  content,
  page,
  kind,
  now,
}: {
  content: SiteContent;
  page: Page;
  kind: "booth" | "record-shop";
  now: Date;
}) {
  return (
    <>
      <section className={`space-hero space-${kind}`}>
        <div className="space-photo">
          <Photo src={page.image} alt={page.imageAlt} priority />
        </div>
        <div className="space-content">
          <BackToRoom content={content} />
          <h1>{page.eyebrow || page.title}</h1>
          <p>{page.description}</p>
          <div className="button-row">
            {kind === "booth" ? (
              <>
                <A href="/events" className="pov-link">
                  {content.navigation.find((n) => n.href === "/events")
                    ?.label || "Events"}
                  <ArrowUpRight size={18} />
                </A>
                <BookingButton content={content} className="pov-link" />
              </>
            ) : (
              <>
                <A href="/about" className="pov-link">
                  {content.navigation.find((n) => n.href === "/about")?.label ||
                    "About Us"}
                  <ArrowUpRight size={18} />
                </A>
                <A href="/records" className="pov-link">
                  {content.navigation.find((n) => n.href === "/records")
                    ?.label || "Records"}
                  <Disc3 size={18} />
                </A>
              </>
            )}
          </div>
        </div>
      </section>
      {kind === "booth" && destinationVisible("/events", content) && (
        <div className="booth-events">
          <EventsPage
            content={content}
            page={content.pages.find((entry) => entry.id === "events") || page}
            now={now}
            embedded
          />
        </div>
      )}
      <Sections sections={page.sections} content={content} />
    </>
  );
}
function EventCard({
  event,
  content,
  featured = false,
}: {
  event: Event;
  content: SiteContent;
  featured?: boolean;
}) {
  const zone = content.eventSettings.timeZone;
  return (
    <article className={`event-card ${featured ? "featured-event" : ""}`}>
      <A href={`/events/${event.slug}`} className="event-image">
        <Photo
          src={
            event.image ||
            content.pages.find((p) => p.id === "booth")?.image ||
            ""
          }
          alt={event.imageAlt || event.title}
        />
      </A>
      <div className="event-card-text">
        <div className="event-flags">
          {event.featured && <span className="featured-badge">Featured</span>}
          {event.status !== "scheduled" && (
            <span className={`status-badge ${event.status}`}>
              {event.status === "sold-out" ? "Sold out" : "Cancelled"}
            </span>
          )}
        </div>
        <p className="event-meta">
          {eventDate(event.start, zone, "EEE, MMM d")}
          <span>·</span>
          {eventTime(event.start, zone)}
          {event.price && (
            <>
              <span>·</span>
              {event.price}
            </>
          )}
        </p>
        <h3>
          <A href={`/events/${event.slug}`}>{event.title}</A>
        </h3>
        {featured && event.description && <p>{event.description}</p>}
      </div>
    </article>
  );
}
function EventsPage({
  content,
  page,
  now,
  embedded = false,
}: {
  content: SiteContent;
  page: Page;
  now: Date;
  embedded?: boolean;
}) {
  const tonight = tonightEvents(content, now).sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        Date.parse(a.start) - Date.parse(b.start),
    ),
    upcoming = upcomingEvents(content, now),
    rail = useRef<HTMLDivElement>(null);
  const Heading = embedded ? "h2" : "h1";
  const scrollPosters = (direction: number) => {
    const list = rail.current;
    if (!list) return;
    const card = list.querySelector<HTMLElement>(".event-card");
    const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 24;
    list.scrollBy({
      left: direction * ((card?.offsetWidth || 300) + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  return (
    <>
      <section className="events-intro section-wrap">
        <div className="page-heading">
          <div>
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <Heading>{content.labels.tonight}</Heading>
          </div>
          <p>{page.description}</p>
        </div>
        {tonight.length ? (
          <div
            className={`tonight-grid ${tonight.length === 1 ? "single-tonight" : ""}`}
          >
            {tonight.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                content={content}
                featured
              />
            ))}
          </div>
        ) : (
          <div className="tonight-empty">
            <div className="tonight-empty-image">
              <Photo src={page.image} alt={page.imageAlt} />
              <span className="record-glyph" aria-hidden="true">
                <Disc3 size={64} strokeWidth={1} />
              </span>
            </div>
            <div className="tonight-empty-copy">
              <span className="eyebrow">
                <span className="live-dot" />
                {eventDate(
                  now.toISOString(),
                  content.eventSettings.timeZone,
                  "EEEE, MMMM d",
                )}
              </span>
              <h2>{content.eventSettings.tonightEmpty}</h2>
              {content.location.instagram && (
                <A
                  href={content.location.instagram}
                  className="text-link empty-state-link"
                >
                  Latest on Instagram <ArrowUpRight size={17} />
                </A>
              )}
            </div>
          </div>
        )}
      </section>
      <section className="upcoming-section cream-section section-wrap">
        <div className="section-heading">
          <div>
            <Eyebrow>{content.brand.name}</Eyebrow>
            <h2>{content.labels.upcoming}</h2>
          </div>
          <div className="rail-controls">
            <A href="/calendar" className="text-link">
              {content.labels.viewCalendar}
              <ArrowUpRight size={17} />
            </A>
            {upcoming.length > 0 && (
              <>
                <button
                  className="icon-button"
                  aria-label="Previous upcoming events"
                  onClick={() => scrollPosters(-1)}
                >
                  <ChevronLeft />
                </button>
                <button
                  className="icon-button"
                  aria-label="Next upcoming events"
                  onClick={() => scrollPosters(1)}
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>
        </div>
        {upcoming.length ? (
          <div
            ref={rail}
            className="events-rail"
            tabIndex={0}
            aria-label="Upcoming events — scroll horizontally"
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                scrollPosters(event.key === "ArrowLeft" ? -1 : 1);
              }
            }}
          >
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                content={content}
                featured={event.featured}
              />
            ))}
          </div>
        ) : (
          <div className="upcoming-empty">
            <CalendarDays size={28} strokeWidth={1.2} />
            <p>{content.eventSettings.upcomingEmpty}</p>
          </div>
        )}
      </section>
      {!embedded && <Sections sections={page.sections} content={content} />}
      {!embedded && <BookingSection content={content} />}
    </>
  );
}
function CalendarPage({
  content,
  page,
  now,
}: {
  content: SiteContent;
  page: Page;
  now: Date;
}) {
  const zone = content.eventSettings.timeZone,
    today = dateKey(now, zone),
    todayYear = Number(today.slice(0, 4)),
    todayMonth = Number(today.slice(5, 7)) - 1;
  const [view, setView] = useState({ year: todayYear, month: todayMonth }),
    [selected, setSelected] = useState<string | null>(null);
  const events = publicEvents(content),
    cells = calendarCells(view.year, view.month),
    monthKey = `${view.year}-${String(view.month + 1).padStart(2, "0")}`;
  const monthEvents = events.filter((event) =>
    dateKey(event.start, zone).startsWith(monthKey),
  );
  const visible = selected
    ? monthEvents.filter((event) => dateKey(event.start, zone) === selected)
    : monthEvents;
  const move = (delta: number) => {
    const date = new Date(Date.UTC(view.year, view.month + delta, 1));
    setView({ year: date.getUTCFullYear(), month: date.getUTCMonth() });
    setSelected(null);
  };
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(view.year, view.month, 1)));
  return (
    <>
      <section className="calendar-page section-wrap cream-section">
        <div className="page-heading">
          <div>
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h1>{page.title}</h1>
          </div>
          <p>{page.description}</p>
        </div>
        <div className="calendar-toolbar">
          <h2 aria-live="polite">{monthLabel}</h2>
          <div>
            <button
              className="text-button"
              onClick={() => {
                setView({ year: todayYear, month: todayMonth });
                setSelected(null);
              }}
            >
              Today
            </button>
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </button>
            <button
              className="icon-button"
              aria-label="Next month"
              onClick={() => move(1)}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
        <div
          className="calendar-grid"
          role="group"
          aria-label={`${monthLabel} events`}
        >
          <div className="calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-days">
            {cells.map((key, i) => (
              <div
                key={key || `empty-${i}`}
                className={`calendar-day ${key === today ? "is-today" : ""} ${key === selected ? "is-selected" : ""} ${!key ? "is-blank" : ""}`}
              >
                {key && (
                  <>
                    <button
                      className="day-number"
                      onClick={() => setSelected(selected === key ? null : key)}
                      aria-label={`${key}, ${events.filter((e) => dateKey(e.start, zone) === key).length} events`}
                      aria-pressed={selected === key}
                    >
                      {Number(key.slice(8))}
                    </button>
                    {events
                      .filter((event) => dateKey(event.start, zone) === key)
                      .map((event) => (
                        <A
                          key={event.id}
                          href={`/events/${event.slug}`}
                          className={`calendar-event ${event.status === "cancelled" ? "is-cancelled" : ""}`}
                        >
                          <span>{eventTime(event.start, zone)}</span>
                          {event.title}
                          {event.status !== "scheduled" && (
                            <small>
                              {event.status === "cancelled"
                                ? "Cancelled"
                                : "Sold out"}
                            </small>
                          )}
                        </A>
                      ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="agenda-heading">
          <h3>
            {selected
              ? eventDate(`${selected}T12:00:00Z`, zone, "MMMM d")
              : "This month"}
          </h3>
          {selected && (
            <button className="text-button" onClick={() => setSelected(null)}>
              Show whole month <X size={15} />
            </button>
          )}
        </div>
        <div className="calendar-agenda">
          {visible.length ? (
            visible.map((event) => (
              <A
                key={event.id}
                href={`/events/${event.slug}`}
                className="agenda-event"
              >
                <div className="agenda-date">
                  <strong>{eventDate(event.start, zone, "dd")}</strong>
                  <span>{eventDate(event.start, zone, "EEE, MMM d")}</span>
                </div>
                <div>
                  <p>
                    {eventTime(event.start, zone)}
                    {event.price ? ` · ${event.price}` : ""}
                  </p>
                  <h3>{event.title}</h3>
                  {event.status !== "scheduled" && (
                    <span className="agenda-status">
                      {event.status === "sold-out" ? "Sold out" : "Cancelled"}
                    </span>
                  )}
                </div>
                <ArrowUpRight size={23} />
              </A>
            ))
          ) : (
            <div className="upcoming-empty">
              <CalendarDays size={30} strokeWidth={1.2} />
              <p>{content.eventSettings.upcomingEmpty}</p>
            </div>
          )}
        </div>
        <p className="calendar-timezone">
          <Clock size={14} /> {zone.replace(/_/g, " ")} · Events continue into
          the next day when listed.
        </p>
      </section>
      <Sections sections={page.sections} content={content} />
      <BookingSection content={content} />
    </>
  );
}
function EventDetail({
  content,
  event,
  now,
}: {
  content: SiteContent;
  event: Event;
  now: Date;
}) {
  const zone = content.eventSettings.timeZone,
    ended = eventEnd(event) < now.getTime();
  return (
    <>
      <section className="event-detail section-wrap">
        <A href="/events" className="text-link back-link">
          <ArrowLeft size={16} />
          Events
        </A>
        <div className="event-detail-grid">
          <div className="event-poster">
            <Photo
              src={
                event.image ||
                content.pages.find((p) => p.id === "booth")?.image ||
                ""
              }
              alt={event.imageAlt || event.title}
              priority
            />
          </div>
          <div>
            <Eyebrow>
              {eventDate(event.start, zone, "EEEE, MMMM d, yyyy")}
            </Eyebrow>
            <h1>{event.title}</h1>
            <div className="event-facts">
              <p>
                <Clock size={18} />
                {eventTime(event.start, zone)}
                {event.end ? ` – ${eventTime(event.end, zone)}` : ""}
              </p>
              {event.doors && <p>Doors {eventTime(event.doors, zone)}</p>}
              {event.price && <p>{event.price}</p>}
              <p>
                <MapPin size={18} />
                {content.location.address}
              </p>
            </div>
            {(event.status !== "scheduled" || ended) && (
              <p className="event-notice">
                {event.status === "cancelled"
                  ? "This event has been cancelled."
                  : event.status === "sold-out"
                    ? "This event is sold out."
                    : "This event has ended."}
              </p>
            )}
            <div className="prose">
              <p>{event.description}</p>
            </div>
            <div className="button-row">
              {event.url && event.status === "scheduled" && !ended && (
                <A href={event.url} className="button primary">
                  Event details & tickets
                  <ArrowUpRight size={18} />
                </A>
              )}
              <A href="/location" className="button outline">
                {content.labels.directions}
                <MapPin size={17} />
              </A>
            </div>
            <p className="muted small">All times are local to New York.</p>
          </div>
        </div>
      </section>
      <BookingSection content={content} />
    </>
  );
}
function BarPage({ content, page }: { content: SiteContent; page: Page }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuDialog = useRef<HTMLDialogElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const openLinkedMenu = () => {
      if (window.location.hash === "#drinks") setMenuOpen(true);
    };
    openLinkedMenu();
    window.addEventListener("hashchange", openLinkedMenu);
    return () => window.removeEventListener("hashchange", openLinkedMenu);
  }, []);
  useEffect(() => {
    const dialog = menuDialog.current;
    if (!dialog) return;
    if (menuOpen) {
      dialog.showModal();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
        dialog.close();
        menuTrigger.current?.focus();
      };
    }
  }, [menuOpen]);
  const categories = content.bar.categories.filter(
    (category) =>
      category.visible && category.items.some((item) => item.available),
  );
  const happyHour = content.bar.happyHour;
  const specials = (happyHour?.specials || []).filter(Boolean);
  const openMenu = () => {
    setMenuOpen(true);
    // One short, optional pulse; unsupported browsers still open the menu.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      try {
        navigator.vibrate?.(12);
      } catch {
        /* Haptics never block navigation. */
      }
    }
  };
  return (
    <>
      <section
        id="bar"
        className="op-section op-photo"
        aria-labelledby="bar-title"
      >
        <SectionPhoto page={page} />
        <div className="op-panel">
          <h2 id="bar-title">{page.title}</h2>
          {page.description && <p>{page.description}</p>}
          {specials.length > 0 && (
            <ul className="op-specials" aria-label="Happy hour specials">
              {specials.map((special, i) => (
                <li key={i}>{special}</li>
              ))}
            </ul>
          )}
        </div>
        <span className="op-actions">
          <button
            ref={menuTrigger}
            type="button"
            className="op-cta drinks-trigger"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="bar-menu-dialog"
            onClick={openMenu}
          >
            View full menu
          </button>
        </span>
      </section>
      <dialog
        id="bar-menu-dialog"
        ref={menuDialog}
        className="bar-menu-dialog"
        aria-labelledby="bar-menu-title"
        onCancel={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === menuDialog.current) setMenuOpen(false);
        }}
      >
        <section id="drinks" className="bar-menu">
          <div className="bar-menu-top">
            <span className="op-menu-brand">{content.brand.name}</span>
            <button
              type="button"
              className="op-close"
              onClick={() => setMenuOpen(false)}
            >
              Close <X size={18} aria-hidden="true" />
            </button>
          </div>
          <h2 id="bar-menu-title">Full menu</h2>
          {happyHour?.text && (
            <p className="op-kicker">Happy hour / {happyHour.text}</p>
          )}
          {specials.length > 0 && (
            <ul className="op-specials" aria-label="Happy hour specials">
              {specials.map((special, i) => (
                <li key={i}>{special}</li>
              ))}
            </ul>
          )}
          <p className="bar-menu-intro">{content.bar.intro}</p>
          {categories.length ? (
            <>
              <label className="menu-category-picker">
                <span>Jump to</span>
                <select
                  defaultValue=""
                  onChange={(event) => {
                    const section = document.getElementById(
                      `category-${event.target.value}`,
                    );
                    section?.scrollIntoView({ block: "start" });
                    section?.focus({ preventScroll: true });
                  }}
                >
                  <option value="" disabled>
                    Choose a drink category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="menu-categories">
                {categories.map((category) => (
                  <section
                    key={category.id}
                    id={`category-${category.id}`}
                    className="drink-category"
                    tabIndex={-1}
                    aria-labelledby={`category-title-${category.id}`}
                  >
                    <h3 id={`category-title-${category.id}`}>
                      {category.title}
                    </h3>
                    {category.description && (
                      <p className="category-description">
                        {category.description}
                      </p>
                    )}
                    <div>
                      {category.items
                        .filter((item) => item.available)
                        .map((item) => (
                          <article key={item.id} className="drink-item">
                            {item.image && (
                              <Photo src={item.image} alt={item.name} />
                            )}
                            <div>
                              <h4>{item.name}</h4>
                              {item.description && <p>{item.description}</p>}
                            </div>
                            <span>{item.price}</span>
                          </article>
                        ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <div className="menu-empty">
              <p>{content.bar.menuNotice}</p>
              <A href="/location" className="text-link empty-state-link">
                Plan your visit <ArrowUpRight size={17} />
              </A>
            </div>
          )}
          {categories.length > 0 && content.bar.menuNotice && (
            <p className="menu-note">{content.bar.menuNotice}</p>
          )}
        </section>
      </dialog>
      <Sections sections={page.sections} content={content} />
    </>
  );
}
function AboutPage({ content, page }: { content: SiteContent; page: Page }) {
  return (
    <>
      <section className="about-page cream-section section-wrap">
        <div className="about-copy">
          <Eyebrow>{page.eyebrow}</Eyebrow>
          <h1>{page.title}</h1>
          <div className="prose">
            <p>{page.description}</p>
          </div>
        </div>
        <div className="about-image">
          <Photo src={page.image} alt={page.imageAlt} priority />
        </div>
      </section>
      <Sections sections={page.sections} content={content} />
      <BookingSection content={content} />
    </>
  );
}
function RecordsPage({ content, page }: { content: SiteContent; page: Page }) {
  return (
    <>
      <section className="records-page section-wrap">
        <div className="records-copy">
          <Eyebrow>{page.eyebrow}</Eyebrow>
          <h1>{page.title}</h1>
          <span className="coming-soon">
            <span className="live-dot" />
            {content.labels.recordComingSoon}
          </span>
          <p>{page.description}</p>
          <A href="/location" className="button primary">
            {content.labels.directions}
            <ArrowUpRight size={18} />
          </A>
        </div>
        <div className="records-image">
          <Photo src={page.image} alt={page.imageAlt} priority />
        </div>
      </section>
      <Sections sections={page.sections} content={content} />
    </>
  );
}
function displayHour(time: string) {
  if (!/^\d\d:\d\d$/.test(time)) return time;
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}${hours >= 12 ? "pm" : "am"}`;
}
function LocationPage({
  content,
  page,
  now,
}: {
  content: SiteContent;
  page: Page;
  now: Date;
}) {
  const location = content.location,
    day =
      Number(formatInTimeZone(now, content.eventSettings.timeZone, "i")) % 7;
  const destination =
    location.latitude !== 0 || location.longitude !== 0
      ? `${location.latitude},${location.longitude}`
      : location.mapQuery || `${content.brand.name}, ${location.address}`;
  const direction =
    location.directionsUrl ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const embed =
    location.mapEmbedUrl ||
    `https://maps.google.com/maps?q=${encodeURIComponent(destination)}&z=16&output=embed`;
  const futureExceptions = location.specialHours
    .filter((item) => item.date >= dateKey(now, content.eventSettings.timeZone))
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <section className="location-page cream-section section-wrap">
        <div className="page-heading">
          <div>
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h1>{page.title}</h1>
          </div>
          <p>{page.description}</p>
        </div>
        <div className="location-grid">
          <div className="location-details">
            <div className="location-address">
              <MapPin size={25} strokeWidth={1.5} />
              <h2>{location.address}</h2>
            </div>
            <A href={direction} className="button dark-button">
              {content.labels.directions}
              <ArrowUpRight size={18} />
            </A>
            <div className="hours-block">
              <h3>Opening hours</h3>
              {location.hoursConfirmed ? (
                <dl className="hours-list">
                  {[1, 2, 3, 4, 5, 6, 0].map((index) => {
                    const hours = location.hours.find((h) => h.day === index);
                    return hours ? (
                      <div
                        key={index}
                        className={day === index ? "today-hours" : ""}
                      >
                        <dt>
                          {
                            [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                            ][index]
                          }
                          {day === index && <span>Today</span>}
                        </dt>
                        <dd>
                          {hours.closed
                            ? "Closed"
                            : hours.open && hours.close
                              ? `${displayHour(hours.open)} – ${displayHour(hours.close)}`
                              : "Hours to be announced"}
                          {hours.note && <small>{hours.note}</small>}
                        </dd>
                      </div>
                    ) : null;
                  })}
                </dl>
              ) : (
                <p className="hours-note">{location.hoursNote}</p>
              )}
              {location.hoursConfirmed && location.hoursNote && (
                <p className="hours-note">{location.hoursNote}</p>
              )}
              {futureExceptions.length > 0 && (
                <div className="special-hours">
                  <h4>Special hours</h4>
                  {futureExceptions.map((item) => (
                    <p key={item.id}>
                      <strong>{item.date}</strong> ·{" "}
                      {item.closed
                        ? "Closed"
                        : `${displayHour(item.open)} – ${displayHour(item.close)}`}
                      {item.note && ` — ${item.note}`}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="contact-links">
              {location.instagram && (
                <A href={location.instagram}>
                  <Instagram size={18} />
                  Instagram
                  <ArrowUpRight size={15} />
                </A>
              )}
              {location.email && (
                <A href={`mailto:${location.email}`}>
                  {location.email}
                  <ArrowUpRight size={15} />
                </A>
              )}
              {location.phone && (
                <A href={`tel:${location.phone.replace(/[^+\d]/g, "")}`}>
                  {location.phone}
                </A>
              )}
            </div>
          </div>
          <div className="map-wrap">
            <A
              href={direction}
              className="map-link"
              ariaLabel={`Get directions to ${location.address}`}
            >
              <iframe
                src={safeHref(embed, "")}
                title={`${content.brand.name} location map`}
                loading="lazy"
                tabIndex={-1}
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="map-caption">
                <span>
                  <MapPin size={16} />
                  {content.brand.name}
                </span>
                <span>
                  {content.labels.directions}
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </A>
            <p className="map-fallback">
              <A href={direction}>
                Open map & directions <ExternalLink size={13} />
              </A>
            </p>
          </div>
        </div>
      </section>
      <Sections sections={page.sections} content={content} />
    </>
  );
}
function Sections({
  sections,
  content,
}: {
  sections: Section[];
  content: SiteContent;
}) {
  const getAlt = (src: string) =>
    content.assets.find((asset) => asset.src === src)?.alt || "";
  return (
    <>
      {sections
        .filter((section) => section.visible)
        .map((section) => (
          <section
            key={section.id}
            className={`custom-section custom-${section.type} section-wrap`}
          >
            <div>
              {section.title && <h2>{section.title}</h2>}
              {section.body && (
                <div className="prose">
                  <p>{section.body}</p>
                </div>
              )}
              {section.href &&
                section.linkLabel &&
                destinationVisible(section.href, content) && (
                  <A className="button outline" href={section.href}>
                    {section.linkLabel}
                    <ArrowUpRight size={17} />
                  </A>
                )}
            </div>
            {(section.type === "image" || section.type === "callout") &&
              section.image && (
                <Photo src={section.image} alt={getAlt(section.image)} />
              )}{" "}
            {section.type === "gallery" && (
              <div className="custom-gallery">
                {section.images.filter(Boolean).map((src, i) => (
                  <Photo key={`${src}-${i}`} src={src} alt={getAlt(src)} />
                ))}
              </div>
            )}
          </section>
        ))}
    </>
  );
}
function CustomPage({ content, page }: { content: SiteContent; page: Page }) {
  return (
    <>
      <section className="custom-page-intro section-wrap cream-section">
        <Eyebrow>{page.eyebrow}</Eyebrow>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        {page.image && <Photo src={page.image} alt={page.imageAlt} priority />}
      </section>
      <Sections sections={page.sections} content={content} />
    </>
  );
}
function BookingSection({ content }: { content: SiteContent }) {
  if (useContext(OnePageContext)) return null;
  return (
    <section className="booking-section section-wrap">
      <div className="booking-disc" aria-hidden="true">
        <Disc3 size={76} strokeWidth={0.7} />
      </div>
      <div>
        <Eyebrow>{content.labels.book}</Eyebrow>
        <h2>{content.booking.description}</h2>
      </div>
      <BookingButton content={content} />
    </section>
  );
}
function Footer({
  content,
  immersive = false,
}: {
  content: SiteContent;
  immersive?: boolean;
}) {
  return (
    <footer className="venue-footer">
      <div className="venue-footer-main">
        <div className="venue-footer-links">
          <A href="/location" ariaLabel={content.location.address}>
            {immersive ? "Visit" : content.location.address}
            <ArrowUpRight size={17} />
          </A>
        </div>
      </div>
      <div className="venue-footer-meta">
        <span>
          © {new Date().getFullYear()} {content.brand.name}
        </span>
        <div>
          {content.location.socials.map((social) => (
            <A key={social.id} href={social.url}>
              {social.label}
              <ArrowUpRight size={12} />
            </A>
          ))}
          {content.footer.links.map((link) => (
            <A key={link.id} href={link.url}>
              {link.label}
            </A>
          ))}
        </div>
      </div>
    </footer>
  );
}

function contrastInk(hex: string) {
  let value = hex.replace("#", "").slice(0, 6);
  if (value.length === 3)
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  const channels = [0, 2, 4]
    .map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.179 ? "#181614" : "#ffffff";
}

export function PublicExperience({
  content,
  pageId,
  eventId,
  preview,
  initialNow,
}: {
  content: SiteContent;
  pageId: string;
  eventId?: string;
  preview: boolean;
  initialNow: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroll = frame.current?.querySelector<HTMLElement>(".page-scroll");
    if (scroll) scroll.scrollTop = 0;
  }, [pageId, eventId]);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const header = element.querySelector<HTMLElement>(".site-header");
    const footer = element.querySelector<HTMLElement>(".venue-footer");
    const banner = element.querySelector<HTMLElement>(".preview-banner");
    const measure = () => {
      element.style.setProperty(
        "--site-header-height",
        `${header?.offsetHeight || 0}px`,
      );
      element.style.setProperty(
        "--site-footer-height",
        `${footer?.offsetHeight || 0}px`,
      );
      element.style.setProperty(
        "--preview-height",
        `${banner?.offsetHeight || 0}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const part of [header, footer, banner])
      if (part) observer.observe(part);
    return () => observer.disconnect();
  }, [preview]);
  const now = useClock(initialNow),
    [paused, setPaused] = useState(false),
    page = content.pages.find((p) => p.id === pageId)!;
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPaused(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const sceneImage =
    pageId === "home"
      ? content.scenes.exterior.image
      : pageId === "inside"
        ? content.scenes.interior.image
        : page.image ||
          content.pages.find((entry) => entry.id === "booth")?.image ||
          content.scenes.interior.image;
  const sampled = photoColors[sceneImage as keyof typeof photoColors];
  const style = {
    "--photo-paper": sampled?.paper || content.brand.foreground,
    "--ink": content.brand.background,
    "--photo-ink": content.brand.background,
    "--photo-accent": sampled?.accent || content.brand.accent,
    "--accent-ink": contrastInk(content.brand.accent),
    "--accent": content.brand.accent,
    "--bg": content.brand.background,
    "--fg": content.brand.foreground,
    "--button-radius":
      content.brand.buttonStyle === "pill"
        ? "999px"
        : content.brand.buttonStyle === "rounded"
          ? "12px"
          : "0px",
    "--heading-font":
      content.brand.font === "serif"
        ? "Georgia, serif"
        : "Barlow Condensed, sans-serif",
  } as CSSProperties;
  const event = eventId ? content.events.find((e) => e.id === eventId) : null;
  let body: ReactNode;
  if (event) body = <EventDetail content={content} event={event} now={now} />;
  else
    switch (pageId) {
      case "home":
        body = <Home content={content} page={page} now={now} />;
        break;
      case "booth":
      case "record-shop":
        body = (
          <SpacePage content={content} page={page} kind={pageId} now={now} />
        );
        break;
      case "events":
        body = <EventsPage content={content} page={page} now={now} />;
        break;
      case "calendar":
        body = <CalendarPage content={content} page={page} now={now} />;
        break;
      case "bar":
        body = <BarPage content={content} page={page} />;
        break;
      case "about":
        body = <AboutPage content={content} page={page} />;
        break;
      case "records":
        body = <RecordsPage content={content} page={page} />;
        break;
      case "location":
        body = <LocationPage content={content} page={page} now={now} />;
        break;
      default:
        body = <CustomPage content={content} page={page} />;
    }
  return (
    <PreviewContext.Provider value={preview}>
      <ContentContext.Provider value={content}>
        <div
          ref={frame}
          className={`public-site stacked-layout page-${pageId}${preview ? " is-preview" : ""}`}
          style={style}
          data-motion={paused ? "paused" : "playing"}
        >
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          {preview && (
            <div className="preview-banner">
              <span>Draft preview · only visible to you</span>
              <A href="/admin">
                Return to admin <ArrowUpRight size={13} />
              </A>
            </div>
          )}
          <SiteHeader content={content} now={now} />
          <main id="main-content">
            <div className="page-scroll">{body}</div>
          </main>
          <Footer content={content} />
        </div>
      </ContentContext.Provider>
    </PreviewContext.Provider>
  );
}
