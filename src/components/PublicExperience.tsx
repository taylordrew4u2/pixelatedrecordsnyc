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
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
  Menu as MenuIcon,
  Disc3,
  MapPin,
  CalendarDays,
  Pause,
  Play,
  Wine,
  Clock,
  ExternalLink,
  Instagram,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import type {
  SiteContent,
  Page,
  Scene as SceneType,
  Event,
  Section,
} from "@/lib/types";
import {
  calendarCells,
  dateKey,
  eventDate,
  eventEnd,
  eventTime,
  publicEvents,
  tonightEvents,
  upcomingEvents,
} from "@/lib/events";
import { destinationVisible, safeHref } from "@/lib/links";

const PreviewContext = createContext(false);
const ContentContext = createContext<SiteContent | null>(null);
function A({
  href,
  children,
  className = "",
  ariaLabel,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}) {
  const preview = useContext(PreviewContext);
  const content = useContext(ContentContext);
  let target = safeHref(href);
  if (target.startsWith("/") && !target.startsWith("//")) {
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
  const isBuiltIn =
    /^\/assets\/[^/]+\.webp$/.test(src) && !src.includes("-small");
  return (
    <img
      className={className}
      src={safeHref(src, "")}
      srcSet={
        isBuiltIn
          ? `${src.replace(".webp", "-small.webp")} 960w, ${src} 1920w`
          : undefined
      }
      sizes="(max-width: 700px) 100vw, 75vw"
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
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
function SiteHeader({ content, now }: { content: SiteContent; now: Date }) {
  const [open, setOpen] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
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
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const links = content.navigation.filter(
    (item) => item.visible && destinationVisible(item.href, content),
  );
  return (
    <>
      <header className="site-header">
        <A
          href="/"
          className="brand-link"
          ariaLabel={`${content.brand.name} home`}
        >
          <img
            src={safeHref(content.brand.logoLight, "/assets/logo-light.png")}
            width="220"
            height="64"
            alt={content.brand.name}
          />
        </A>
        <div className="header-location">
          <span className="live-dot" />
          <span>{content.location.neighborhood}</span>
          <span className="header-time" suppressHydrationWarning>
            {formatInTimeZone(now, content.eventSettings.timeZone, "h:mm a")}
          </span>
        </div>
        <button
          ref={trigger}
          className="menu-trigger"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="main-menu"
        >
          <span>{content.labels.menu}</span>
          <MenuIcon size={23} strokeWidth={1.6} />
        </button>
      </header>
      <dialog
        id="main-menu"
        className="nav-dialog"
        ref={modal}
        onCancel={close}
        aria-label="Main navigation"
        onClick={(e) => {
          if (e.target === modal.current) close();
        }}
      >
        <div className="menu-top">
          <img
            src={safeHref(content.brand.logoDark, "/assets/logo-dark.png")}
            width="225"
            height="65"
            alt={content.brand.name}
          />
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close menu"
          >
            <X size={28} />
          </button>
        </div>
        <div className="menu-content">
          <nav aria-label="Main">
            {links.map((item, i) => (
              <A
                key={item.id}
                href={item.href}
                className="menu-link"
                onClick={close}
              >
                <span className="menu-number">0{i + 1}</span>
                <span>{item.label}</span>
                <ArrowUpRight />
              </A>
            ))}
          </nav>
          <aside className="menu-aside">
            <Photo
              src={content.scenes.exterior.image}
              alt={content.scenes.exterior.alt}
            />
            <p className="eyebrow">{content.brand.descriptor}</p>
            <p>{content.location.address}</p>
            <BookingButton content={content} />
          </aside>
        </div>
        <div className="menu-bottom">
          <span>{content.footer.tagline}</span>
          <A href="/inside" onClick={close}>
            {content.labels.enter} <ArrowRight size={16} />
          </A>
        </div>
      </dialog>
    </>
  );
}
function Scene({
  content,
  scene,
  exterior = false,
  paused,
}: {
  content: SiteContent;
  scene: SceneType;
  exterior?: boolean;
  paused: boolean;
}) {
  const view = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [geometry, setGeometry] = useState<CSSProperties>({
    width: "100%",
    height: "100%",
    left: 0,
    top: 0,
  });
  const [loaded, setLoaded] = useState(0);
  useEffect(() => {
    const fit = () => {
      const parent = view.current,
        image = img.current;
      if (!parent || !image?.naturalWidth) return;
      const width = parent.clientWidth,
        height = parent.clientHeight;
      const scale = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight,
      );
      const w = image.naturalWidth * scale,
        h = image.naturalHeight * scale;
      const mobile = width < 760;
      setGeometry({
        width: w,
        height: h,
        left:
          ((width - w) * (mobile ? scene.mobileFocalX : scene.focalX)) / 100,
        top:
          ((height - h) * (mobile ? scene.mobileFocalY : scene.focalY)) / 100,
      });
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (view.current) observer.observe(view.current);
    return () => observer.disconnect();
  }, [loaded, scene]);
  const hotspots = scene.hotspots.filter((hotspot) =>
    destinationVisible(hotspot.href, content),
  );
  return (
    <div
      className={`scene-viewport ${exterior ? "exterior-scene" : "interior-scene"}`}
      ref={view}
    >
      <div className="scene-plane" style={geometry}>
        <img
          ref={img}
          src={safeHref(scene.image, "")}
          alt={scene.alt}
          className="scene-photo"
          loading="eager"
          fetchPriority="high"
          onLoad={() => setLoaded((value) => value + 1)}
        />
        {exterior &&
          content.scenes.lights.enabled &&
          content.scenes.windows.map((mask, i) => (
            <div
              key={mask.id}
              aria-hidden="true"
              className="window-light"
              style={
                {
                  left: `${mask.x}%`,
                  top: `${mask.y}%`,
                  width: `${mask.width}%`,
                  height: `${mask.height}%`,
                  opacity: content.scenes.lights.intensity,
                  animationDelay: `${i * -2.7}s`,
                  animationPlayState: paused ? "paused" : "running",
                  "--light-1": content.scenes.lights.colors[0] || "#ef3550",
                  "--light-2": content.scenes.lights.colors[1] || "#e09638",
                  "--light-3": content.scenes.lights.colors[2] || "#9064d9",
                } as CSSProperties
              }
            />
          ))}
        {hotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            className={`scene-hotspot ${exterior ? "door-hotspot" : "room-hotspot"}`}
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.width}%`,
              height: `${hotspot.height}%`,
            }}
          >
            <A
              href={hotspot.href}
              className={`hotspot-link ${exterior ? "door-link" : ""}`}
            >
              {hotspot.direction === "left" && <ArrowLeft size={17} />}
              <span>
                {hotspot.label || (exterior ? content.labels.enter : "Explore")}
              </span>
              {hotspot.direction === "right" ? (
                <ArrowRight size={17} />
              ) : hotspot.direction === "forward" ? (
                <ArrowUpRight size={17} />
              ) : null}
            </A>
          </div>
        ))}
      </div>
      <div className="scene-shade" aria-hidden="true" />
    </div>
  );
}
function Home({
  content,
  page,
  now,
  paused,
  setPaused,
}: {
  content: SiteContent;
  page: Page;
  now: Date;
  paused: boolean;
  setPaused: (value: boolean) => void;
}) {
  const hr = Number(formatInTimeZone(now, content.eventSettings.timeZone, "H"));
  const light = content.scenes.lights;
  const phase =
    hr < light.dayStart || hr >= light.nightStart
      ? "night"
      : hr >= light.duskStart
        ? "dusk"
        : "day";
  return (
    <>
      <section
        className={`home-hero phase-${phase}`}
        aria-labelledby="home-title"
      >
        <Scene
          content={content}
          scene={content.scenes.exterior}
          exterior
          paused={paused}
        />
        <div className="hero-address">
          <MapPin size={14} />
          <A href="/location">{content.location.address}</A>
        </div>
        <div className="hero-copy">
          <Eyebrow>{page.eyebrow}</Eyebrow>
          <h1 id="home-title">{page.title}</h1>
          <p>{page.description}</p>
        </div>
        <div className="hero-corner">
          <span className="pixel-star" aria-hidden="true">
            ✳
          </span>
          <span>{content.brand.descriptor}</span>
        </div>
        <button
          className="motion-control"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
          <span>
            {paused ? content.labels.resumeMotion : content.labels.pauseMotion}
          </span>
        </button>
      </section>
      <div className="entry-strip">
        <span className="entry-message">{content.brand.descriptor}</span>
        <div>
          {[
            ["/record-shop", "Record shop"],
            ["/events", "Events"],
            ["/bar", "Bar"],
          ]
            .filter(([href]) => destinationVisible(href, content))
            .map(([href, label]) => (
              <A href={href} key={href}>
                {content.navigation.find((item) => item.href === href)?.label ||
                  label}
                <ArrowUpRight size={16} />
              </A>
            ))}
        </div>
        <A href="/location" className="strip-location">
          <MapPin size={14} />
          {content.location.neighborhood}
        </A>
      </div>
      <section className="home-explore section-wrap cream-section">
        <div className="section-heading">
          <div>
            <Eyebrow>
              {content.pages.find((p) => p.id === "inside")?.eyebrow}
            </Eyebrow>
            <h2>{content.pages.find((p) => p.id === "inside")?.title}</h2>
          </div>
          <p>{content.pages.find((p) => p.id === "inside")?.description}</p>
        </div>
        <div className="destination-grid">
          {[
            ["record-shop", "01", "records"],
            ["booth", "02", "events"],
            ["bar", "03", "drinks"],
          ].map(([id, number, kind]) => {
            const target = content.pages.find((p) => p.id === id && p.visible);
            if (!target) return null;
            return (
              <A
                key={id}
                href={`/${id}`}
                className={`destination-card destination-${kind}`}
              >
                <div className="destination-image">
                  <Photo src={target.image} alt={target.imageAlt} />
                  <span className="card-number">{number}</span>
                  <span className="circle-arrow">
                    <ArrowUpRight size={25} />
                  </span>
                </div>
                <div className="destination-text">
                  <span>{target.eyebrow}</span>
                  <h3>{target.title.replace(/\n/g, " ")}</h3>
                </div>
              </A>
            );
          })}
        </div>
      </section>
      <Sections sections={page.sections} content={content} />
    </>
  );
}
function Interior({
  content,
  page,
  paused,
}: {
  content: SiteContent;
  page: Page;
  paused: boolean;
}) {
  return (
    <>
      <section className="interior-hero">
        <Scene
          content={content}
          scene={content.scenes.interior}
          paused={paused}
        />
        <div className="room-heading">
          <Eyebrow>{page.eyebrow}</Eyebrow>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
        <div className="room-guide">
          <span>
            ← {content.pages.find((p) => p.id === "record-shop")?.eyebrow}
          </span>
          <span>↑ {content.pages.find((p) => p.id === "booth")?.eyebrow}</span>
          <span>{content.pages.find((p) => p.id === "bar")?.eyebrow} →</span>
        </div>
      </section>
      <nav className="room-mobile-links" aria-label="Explore the room">
        {content.scenes.interior.hotspots
          .filter((h) => destinationVisible(h.href, content))
          .map((h) => (
            <A key={h.id} href={h.href}>
              {h.direction === "left" ? (
                <ArrowLeft />
              ) : h.direction === "right" ? (
                <ArrowRight />
              ) : (
                <ArrowUpRight />
              )}
              {h.label}
            </A>
          ))}
      </nav>
      <Sections sections={page.sections} content={content} />
    </>
  );
}
function BackToRoom({ content }: { content: SiteContent }) {
  return (
    <A href="/inside" className="text-link back-link">
      <ArrowLeft size={16} />
      {content.labels.backToRoom}
    </A>
  );
}
function SpacePage({
  content,
  page,
  kind,
}: {
  content: SiteContent;
  page: Page;
  kind: "booth" | "record-shop";
}) {
  return (
    <>
      <section className={`space-hero space-${kind}`}>
        <Photo src={page.image} alt={page.imageAlt} priority />
        <div className="space-shade" />
        <div className="space-content">
          <BackToRoom content={content} />
          <Eyebrow>{page.eyebrow}</Eyebrow>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <div className="button-row">
            {kind === "booth" ? (
              <>
                <A href="/events" className="button primary">
                  {content.navigation.find((n) => n.href === "/events")
                    ?.label || "Events"}
                  <ArrowUpRight size={18} />
                </A>
                <BookingButton content={content} className="button outline" />
              </>
            ) : (
              <>
                <A href="/about" className="button primary">
                  {content.navigation.find((n) => n.href === "/about")?.label ||
                    "About Us"}
                  <ArrowUpRight size={18} />
                </A>
                <A href="/records" className="button outline">
                  {content.navigation.find((n) => n.href === "/records")
                    ?.label || "Records"}
                  <Disc3 size={18} />
                </A>
              </>
            )}
          </div>
        </div>
        <div className="space-stamp">
          <Disc3 size={50} strokeWidth={1} />
          <span>{content.brand.name}</span>
        </div>
      </section>
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
        <span className="event-date">
          <strong>{eventDate(event.start, zone, "dd")}</strong>
          <span>{eventDate(event.start, zone, "MMM")}</span>
        </span>
        {event.featured && <span className="featured-badge">Featured</span>}
        {event.status !== "scheduled" && (
          <span className={`status-badge ${event.status}`}>
            {event.status === "sold-out" ? "Sold out" : "Cancelled"}
          </span>
        )}
        <span className="circle-arrow">
          <ArrowUpRight size={22} />
        </span>
      </A>
      <div className="event-card-text">
        <p className="event-meta">
          {eventDate(event.start, zone, "EEE")}
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
}: {
  content: SiteContent;
  page: Page;
  now: Date;
}) {
  const tonight = tonightEvents(content, now).sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        Date.parse(a.start) - Date.parse(b.start),
    ),
    upcoming = upcomingEvents(content, now),
    rail = useRef<HTMLDivElement>(null);
  return (
    <>
      <section className="events-intro section-wrap">
        <div className="page-heading">
          <div>
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h1>{content.labels.tonight}</h1>
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
              <A href="/calendar" className="button outline">
                {content.labels.viewCalendar}
                <ArrowUpRight size={17} />
              </A>
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
                  onClick={() =>
                    rail.current?.scrollBy({ left: -340, behavior: "smooth" })
                  }
                >
                  <ChevronLeft />
                </button>
                <button
                  className="icon-button"
                  aria-label="Next upcoming events"
                  onClick={() =>
                    rail.current?.scrollBy({ left: 340, behavior: "smooth" })
                  }
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
      <Sections sections={page.sections} content={content} />
      <BookingSection content={content} />
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
                  <span>{eventDate(event.start, zone, "EEE")}</span>
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
  const categories = content.bar.categories.filter(
    (category) =>
      category.visible && category.items.some((item) => item.available),
  );
  return (
    <>
      <section className="split-hero cream-section">
        <div className="split-copy">
          <BackToRoom content={content} />
          <Eyebrow>{page.eyebrow}</Eyebrow>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <a href="#drinks" className="button dark-button">
            The menu
            <ArrowDown size={17} />
          </a>
        </div>
        <div className="split-image">
          <Photo src={page.image} alt={page.imageAlt} priority />
          <div className="image-stamp">
            <Wine strokeWidth={1} />
            <span>{content.brand.name}</span>
          </div>
        </div>
      </section>
      <section id="drinks" className="bar-menu section-wrap">
        <div className="section-heading">
          <div>
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h2>{content.bar.intro}</h2>
          </div>
          <span className="pixel-star" aria-hidden="true">
            ✳
          </span>
        </div>
        {categories.length ? (
          <>
            <nav className="category-nav" aria-label="Drink categories">
              {categories.map((category) => (
                <a key={category.id} href={`#category-${category.id}`}>
                  {category.title}
                </a>
              ))}
            </nav>
            <div className="menu-categories">
              {categories.map((category) => (
                <section
                  key={category.id}
                  id={`category-${category.id}`}
                  className="drink-category"
                >
                  <h3>{category.title}</h3>
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
            <Wine size={32} strokeWidth={1} />
            <p>{content.bar.menuNotice}</p>
          </div>
        )}
        {categories.length > 0 && content.bar.menuNotice && (
          <p className="menu-note">{content.bar.menuNotice}</p>
        )}
      </section>
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
          <A href="/inside" className="button dark-button">
            {content.labels.enter}
            <ArrowUpRight size={18} />
          </A>
        </div>
        <div className="about-image">
          <Photo src={page.image} alt={page.imageAlt} priority />
          <div className="about-caption">
            <span>{content.location.neighborhood}</span>
            <span>{content.brand.descriptor}</span>
          </div>
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
          <div className="record-orbit" aria-hidden="true">
            <Disc3 size={96} strokeWidth={0.75} />
          </div>
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
function Footer({ content }: { content: SiteContent }) {
  return (
    <footer className="site-footer section-wrap">
      <div className="footer-top">
        <div>
          <A href="/" className="footer-logo">
            <img
              src={safeHref(content.brand.logoLight, "/assets/logo-light.png")}
              alt={content.brand.name}
              width="270"
              height="79"
            />
          </A>
          <p>{content.footer.tagline}</p>
        </div>
        <nav aria-label="Footer">
          {content.navigation
            .filter((n) => n.visible && destinationVisible(n.href, content))
            .map((n) => (
              <A key={n.id} href={n.href}>
                {n.label}
              </A>
            ))}
        </nav>
        <div className="footer-address">
          <A href="/location">
            {content.location.address}
            <ArrowUpRight size={17} />
          </A>
          {content.location.socials.map((social) => (
            <A key={social.id} href={social.url}>
              {social.label}
              <ArrowUpRight size={14} />
            </A>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {content.brand.name}
        </span>
        <span>{content.footer.note}</span>
        <div>
          {content.footer.links.map((link) => (
            <A key={link.id} href={link.url}>
              {link.label}
            </A>
          ))}
          <A href="/admin">Admin</A>
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
  return luminance > 0.179 ? "#111111" : "#ffffff";
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
  const now = useClock(initialNow),
    [paused, setPaused] = useState(false),
    page = content.pages.find((p) => p.id === pageId)!;
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setPaused(
        media.matches || localStorage.getItem("pixelated-motion") === "paused",
      );
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const changePaused = (value: boolean) => {
    setPaused(value);
    localStorage.setItem("pixelated-motion", value ? "paused" : "playing");
  };
  const style = {
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
        : "Space Grotesk, sans-serif",
  } as CSSProperties;
  const event = eventId ? content.events.find((e) => e.id === eventId) : null;
  let body: ReactNode;
  if (event) body = <EventDetail content={content} event={event} now={now} />;
  else
    switch (pageId) {
      case "home":
        body = (
          <Home
            content={content}
            page={page}
            now={now}
            paused={paused}
            setPaused={changePaused}
          />
        );
        break;
      case "inside":
        body = <Interior content={content} page={page} paused={paused} />;
        break;
      case "booth":
      case "record-shop":
        body = <SpacePage content={content} page={page} kind={pageId} />;
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
          className={`public-site page-${pageId} ${preview ? "is-preview" : ""}`}
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
          <main id="main-content">{body}</main>
          <Footer content={content} />
        </div>
      </ContentContext.Provider>
    </PreviewContext.Provider>
  );
}
