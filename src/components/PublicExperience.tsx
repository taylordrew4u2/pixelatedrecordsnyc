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
import { storefrontSky, storefrontSkyMask } from "@/lib/storefront-sky";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
  headerTonightEvent,
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
function SiteHeader({ content, now }: { content: SiteContent; now: Date }) {
  const tonight = headerTonightEvent(content, now);
  const headerEvent = tonight?.event;
  const eventStart = headerEvent
    ? eventTime(headerEvent.start, content.eventSettings.timeZone)
    : "";
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
        <A
          href={headerEvent ? `/events/${headerEvent.slug}` : "/events"}
          className={`header-now${tonight?.live ? " is-live" : ""}`}
          ariaLabel={
            headerEvent
              ? `${tonight?.live ? "Live now" : "Tonight"}: ${headerEvent.title}, ${eventStart}. View event flyer.`
              : "Good vibes happening now at Pixelated Records. See upcoming events."
          }
        >
          <span className="live-dot" aria-hidden="true" />
          {headerEvent ? (
            <>
              <span className="header-now-label">
                {tonight?.live ? "Live now" : "Tonight"}
              </span>
              <span className="header-now-title">{headerEvent.title}</span>
            </>
          ) : (
            <span className="header-now-title header-now-vibes">
              Good vibes happening now
            </span>
          )}
          {headerEvent && (
            <span className="header-now-start">
              {headerEvent.status === "sold-out" ? "Sold out · " : ""}
              {eventStart}
            </span>
          )}
          <ChevronRight size={16} aria-hidden="true" />
          <time dateTime={now.toISOString()} suppressHydrationWarning>
            {formatInTimeZone(now, content.eventSettings.timeZone, "h:mm a")}
          </time>
        </A>
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
          <h2>Look around</h2>
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
// Little notes or laughs that drift up out of the two front windows.
const FLOATERS = [
  { x: 19, delay: 0, drift: -6, note: "♪", laugh: "ha" },
  { x: 27, delay: 1.6, drift: 5, note: "♫", laugh: "ha-ha" },
  { x: 33, delay: 3.1, drift: -4, note: "♪", laugh: "ha" },
  { x: 66, delay: 0.8, drift: 6, note: "♫", laugh: "haha" },
  { x: 73, delay: 2.4, drift: -5, note: "♪", laugh: "ha" },
  { x: 80, delay: 3.8, drift: 4, note: "♬", laugh: "ha-ha" },
];
// How far the inside photo zooms in past the bare foreground floor.
const ROOM_ZOOM = 1.22;
const ROOM_ZOOM_PHONE = 1.1;
function Scene({
  content,
  scene,
  exterior = false,
  sky,
}: {
  content: SiteContent;
  scene: SceneType;
  exterior?: boolean;
  sky?: ReturnType<typeof storefrontSky>;
}) {
  const view = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const panPosition = useRef<number | null>(null);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(
    null,
  );
  const suppressClick = useRef(false);
  const [pan, setPan] = useState({ enabled: false, left: false, right: false });
  const syncPan = () => {
    const element = view.current;
    if (!element || exterior) return;
    const maximum = element.scrollWidth - element.clientWidth;
    if (maximum > 1) panPosition.current = element.scrollLeft / maximum;
    const next = {
      enabled: maximum > 1,
      left: element.scrollLeft > 1,
      right: element.scrollLeft < maximum - 1,
    };
    setPan((previous) =>
      previous.enabled === next.enabled &&
      previous.left === next.left &&
      previous.right === next.right
        ? previous
        : next,
    );
  };
  const look = (direction: number) => {
    const element = view.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * 0.7,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
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
      const mobile = width < 760;
      // Landscape phones: a thin strip, so show the floor-level rooms and labels.
      const short = !exterior && height < 500 && width > height;
      const street = image.currentSrc.includes(
        "/assets/storefront-street-mobile",
      );
      // Desktop storefront: always show the whole building, top to sidewalk.
      const whole = exterior && !street;
      const cover = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight,
      );
      // Fill the screen, but never crop more than ~6% of the storefront's
      // height; only ultra-wide screens show plain bands at the sides.
      const contain = Math.min(
        width / image.naturalWidth,
        height / image.naturalHeight,
      );
      // Inside: zoom past the empty foreground floor so the bins, booth,
      // mural and bar fill the frame and the room reads bigger.
      const scale = whole
        ? Math.min(cover, contain * 1.06)
        : exterior
          ? cover
          : short
            ? cover
            : cover * (mobile ? ROOM_ZOOM_PHONE : ROOM_ZOOM);
      const w = image.naturalWidth * scale,
        h = image.naturalHeight * scale;
      setGeometry({
        width: w,
        height: h,
        left: !exterior ? 0 : (width - w) / 2,
        top: exterior
          ? whole || width > height
            ? (height - h) / 2
            : 0
          : ((height - h) *
              (short ? 68 : mobile ? scene.mobileFocalY : scene.focalY)) /
            100,
      });
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (view.current) observer.observe(view.current);
    return () => observer.disconnect();
  }, [loaded, scene, exterior]);
  useEffect(() => {
    const element = view.current;
    if (!element || exterior) return;
    const maximum = element.scrollWidth - element.clientWidth;
    const focal = element.clientWidth < 760 ? scene.mobileFocalX : scene.focalX;
    element.scrollLeft = maximum * (panPosition.current ?? focal / 100);
    syncPan();
  }, [geometry, exterior, scene.focalX, scene.mobileFocalX]);
  const hotspots = scene.hotspots.filter((hotspot) =>
    destinationVisible(hotspot.href, content),
  );
  const door = scene.hotspots.find(
    (hotspot) => hotspot.href.split(/[?#]/)[0] === "/inside",
  );
  const effect = content.scenes.windowEffect || "none";
  const doorHref = door?.href || "/inside";
  const doorLabel =
    content.scenes.doorBubble?.text.trim() ||
    door?.label ||
    content.labels.enter;
  const doorSize = content.scenes.doorBubble?.size || "small";
  const enhanced = enhancedPhoto(scene.image);
  const photo = safeHref(enhanced?.src || scene.image, "");
  // The photo fills the available canvas. The interior stays full resolution
  // because visitors can pan across its much wider rendered image.
  const sourceSet =
    exterior && enhanced && enhanced.src !== enhanced.small
      ? `${enhanced.small} 960w, ${enhanced.src} ${enhanced.width}w`
      : undefined;
  const skyMask = exterior && sky ? storefrontSkyMask(scene.image) : undefined;
  // Use the expanded street photograph on phones, including landscape touch devices.
  const portrait = exterior && Boolean(skyMask);
  const PHONE = "(max-width: 760px), (hover: none) and (pointer: coarse)";
  // The sky layer keeps the full photo (its clouds); the storefront itself is
  // a cut-out with the sky removed, so the time-of-day sky shows cleanly.
  const skySource = portrait && (
    <source
      media={PHONE}
      srcSet="/assets/storefront-street-mobile-solid.webp"
      width={1024}
      height={1536}
    />
  );
  const mobileSource = portrait && (
    <source
      media={PHONE}
      srcSet="/assets/storefront-street-mobile-cut-small.webp 640w, /assets/storefront-street-mobile-cut.webp 1024w"
      sizes="100vw"
      width={1024}
      height={1536}
    />
  );
  return (
    <>
      <div
        className={`scene-viewport ${exterior ? "exterior-scene" : "interior-scene"}`}
        ref={view}
        role={exterior ? undefined : "region"}
        aria-label={exterior ? undefined : "Look around Pixelated Records"}
        aria-describedby={
          !exterior && pan.enabled ? "room-pan-hint" : undefined
        }
        tabIndex={!exterior && pan.enabled ? 0 : undefined}
        onScroll={exterior ? undefined : syncPan}
        onKeyDown={(event) => {
          if (exterior || event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            look(event.key === "ArrowLeft" ? -1 : 1);
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            event.currentTarget.scrollLeft =
              event.key === "Home" ? 0 : event.currentTarget.scrollWidth;
          }
        }}
        onPointerDown={(event) => {
          if (
            exterior ||
            !pan.enabled ||
            event.pointerType !== "mouse" ||
            event.button !== 0
          )
            return;
          suppressClick.current = false;
          drag.current = {
            x: event.clientX,
            scroll: event.currentTarget.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current) return;
          const offset = event.clientX - current.x;
          if (Math.abs(offset) > 5) {
            current.moved = true;
            suppressClick.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          if (current.moved) {
            event.preventDefault();
            event.currentTarget.scrollLeft = current.scroll - offset;
          }
        }}
        onPointerUp={(event) => {
          drag.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
          suppressClick.current = false;
        }}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {exterior && skyMask && sky && (
          <div
            className="storefront-fill"
            aria-hidden="true"
            style={
              {
                "--sky-top": sky.top,
                "--sky-horizon-color": sky.horizon,
              } as CSSProperties
            }
          ></div>
        )}
        <div
          className={`scene-plane${portrait ? " has-street-portrait" : ""}`}
          style={
            sky
              ? ({
                  ...geometry,
                  "--sky-daylight": sky.daylight,
                } as CSSProperties)
              : geometry
          }
        >
          {skyMask && sky && (
            <div
              className="storefront-sky"
              aria-hidden="true"
              data-sky-phase={sky.phase}
              style={
                {
                  "--sky-daylight": sky.daylight,
                  "--sky-top": sky.top,
                  "--sky-horizon-color": sky.horizon,
                  "--sky-stars": sky.stars,
                } as CSSProperties
              }
            >
              <picture>
                {skySource}
                <img
                  className="sky-day"
                  src={photo}
                  srcSet={sourceSet}
                  sizes="100vw"
                  alt=""
                />
              </picture>
              <div className="sky-stars" />
            </div>
          )}
          <picture className="scene-picture">
            {mobileSource}
            <img
              ref={img}
              src={photo}
              srcSet={sourceSet}
              sizes={exterior ? "100vw" : undefined}
              alt={scene.alt}
              className="scene-photo"
              style={
                skyMask
                  ? {
                      maskImage: `url("${skyMask}")`,
                      WebkitMaskImage: `url("${skyMask}")`,
                      maskSize: "100% 100%",
                      WebkitMaskSize: "100% 100%",
                      maskRepeat: "no-repeat",
                      WebkitMaskRepeat: "no-repeat",
                    }
                  : undefined
              }
              loading="eager"
              fetchPriority="high"
              draggable={exterior ? undefined : false}
              onLoad={() => setLoaded((value) => value + 1)}
            />
          </picture>
          {portrait && (
            <div className="street-extras">
              <img
                className="street-night"
                src="/assets/storefront-street-mobile-night-small.webp"
                srcSet="/assets/storefront-street-mobile-night-small.webp 640w, /assets/storefront-street-mobile-night.webp 1024w"
                sizes="100vw"
                alt=""
                aria-hidden="true"
              />
              <span className="street-window-glow is-left" aria-hidden="true" />
              <span className="street-window-glow is-right" aria-hidden="true" />
              {effect !== "none" && (
                <span
                  className={`street-floaters is-${effect}`}
                  aria-hidden="true"
                >
                  {FLOATERS.map((f, i) => (
                    <span
                      key={i}
                      style={
                        {
                          left: `${f.x}%`,
                          animationDelay: `${f.delay}s`,
                          "--drift": `${f.drift}px`,
                        } as CSSProperties
                      }
                    >
                      {effect === "music" ? f.note : f.laugh}
                    </span>
                  ))}
                </span>
              )}
              <A href={doorHref} className={`door-bubble is-${doorSize}`}>
                {doorLabel}
              </A>
            </div>
          )}
          {!exterior &&
            hotspots.map((hotspot) => (
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
                  {exterior ? (
                    <span>{hotspot.label || content.labels.enter}</span>
                  ) : (
                    <>
                      {hotspot.direction === "left" && <ArrowLeft size={17} />}
                      <span>{hotspot.label || "Explore"}</span>
                      {hotspot.direction === "right" ? (
                        <ArrowRight size={17} />
                      ) : hotspot.direction === "forward" ? (
                        <ArrowUpRight size={17} />
                      ) : null}
                    </>
                  )}
                </A>
              </div>
            ))}
        </div>
        <div className="scene-shade" aria-hidden="true" />
      </div>
      {!exterior && pan.enabled && (
        <div className="scene-pan-controls">
          <button
            type="button"
            aria-label="Look left"
            disabled={!pan.left}
            onClick={() => look(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span id="room-pan-hint">
            <span className="pan-touch">Swipe</span>
            <span className="pan-mouse">Drag</span> to look around
          </span>
          <button
            type="button"
            aria-label="Look right"
            disabled={!pan.right}
            onClick={() => look(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </>
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
  const entrance = content.scenes.exterior.hotspots.find(
    (hotspot) => hotspot.href.split(/[?#]/)[0] === "/inside",
  );
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <Scene
          content={content}
          scene={content.scenes.exterior}
          exterior
          sky={storefrontSky(now)}
        />
      </section>
      <section className="scene-caption pov-visually-hidden">
        <div>
          <Eyebrow>{page.eyebrow}</Eyebrow>
          <h1 id="home-title">{page.title}</h1>
        </div>
        <p>{page.description}</p>
      </section>
      <nav className="home-entry" aria-label="Enter the store">
        <A href={entrance?.href || "/inside"} className="home-entry-link">
          {entrance?.label || content.labels.enter}
        </A>
      </nav>
      <Sections sections={page.sections} content={content} />
    </>
  );
}
function Interior({ content, page }: { content: SiteContent; page: Page }) {
  return (
    <>
      <div className="room-intro pov-visually-hidden">
        <div>
          <Eyebrow>{page.eyebrow}</Eyebrow>
          <h1>{page.title}</h1>
        </div>
        <p>{page.description}</p>
      </div>
      <section className="interior-hero" aria-label="Explore Pixelated Records">
        <nav className="room-exit" aria-label="Leave the store">
          <A href="/" className="room-exit-link">
            <ArrowLeft size={16} /> Leave
          </A>
        </nav>
        <Scene content={content} scene={content.scenes.interior} />
      </section>
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
// The supplied bar photo has a gilded frame on the back wall. When that photo
// is in use, the frame itself becomes the drinks-menu button.
const FRAMED_BAR_IMAGE = "/assets/bar.webp";
function BarPage({ content, page }: { content: SiteContent; page: Page }) {
  const framed = page.image === FRAMED_BAR_IMAGE;
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
      <section className={`space-hero space-bar ${framed ? "is-framed" : ""}`}>
        {framed && (
          <button
            ref={menuTrigger}
            type="button"
            className="bar-frame-button"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="bar-menu-dialog"
            onClick={openMenu}
          >
            <span className="bar-frame-label">Bar Menu</span>
            <span className="bar-frame-hint">
              <BookOpen size={18} aria-hidden="true" />
              View drinks
            </span>
          </button>
        )}
        <div className="space-photo">
          <Photo src={page.image} alt={page.imageAlt} priority />
        </div>
        <div className="space-content">
          <BackToRoom content={content} />
          <h1>{page.eyebrow || page.title}</h1>
          <p>{page.description}</p>
          {!framed && (
            <div className="button-row">
              <button
                ref={menuTrigger}
                type="button"
                className="pov-link drinks-trigger"
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
                aria-controls="bar-menu-dialog"
                onClick={openMenu}
              >
                <BookOpen size={24} aria-hidden="true" />
                <span>View drinks menu</span>
                <ChevronRight size={24} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
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
            <h2 id="bar-menu-title">Drinks menu</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="Close bar menu"
              onClick={() => setMenuOpen(false)}
            >
              <X size={22} />
            </button>
          </div>
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
  // Phones: when the background photo is cropped, a horizontal drag slides
  // it sideways. Vertical scrolling, buttons and carousels keep working.
  const [panHint, setPanHint] = useState<"off" | "show" | "hide">("off");
  useEffect(() => {
    const root = frame.current;
    const main = root?.querySelector<HTMLElement>("main");
    const backdrop = root?.querySelector<HTMLElement>(".page-photo-backdrop");
    const img = backdrop?.querySelector<HTMLImageElement>("img");
    if (!root || !main || !backdrop || !img) return;
    const framed = root.classList.contains("bar-framed");
    let pan = 0.5;
    let overflow = 0;
    const apply = () => {
      if (framed)
        root.style.setProperty("--photo-pan-x", `${-pan * overflow}px`);
      else img.style.objectPosition = `${pan * 100}% 50%`;
    };
    const measure = () => {
      const box = backdrop.getBoundingClientRect();
      const ratio = img.naturalWidth / img.naturalHeight || 4 / 3;
      const drawn = Math.max(box.width, box.height * ratio);
      const was = overflow;
      overflow = Math.max(0, drawn - box.width);
      backdrop.classList.toggle("is-pannable", overflow > 8);
      if (framed && was === 0 && overflow > 0) {
        // start from wherever the frame-centred layout put the photo
        const left = img.getBoundingClientRect().left - box.left;
        pan = Math.min(1, Math.max(0, -left / overflow));
      }
      if (root.style.getPropertyValue("--photo-pan-x") || !framed) apply();
      setPanHint((hint) =>
        overflow > 8 &&
        hint === "off" &&
        window.matchMedia(
          "(max-width: 760px), (hover: none) and (pointer: coarse)",
        ).matches
          ? "show"
          : overflow <= 8
            ? "off"
            : hint,
      );
    };
    const skip = (target: EventTarget | null) => {
      let el = target instanceof Element ? target : null;
      while (el && el !== main) {
        if (el.matches("input, select, textarea, dialog, [data-no-pan]"))
          return true;
        const style = getComputedStyle(el);
        if (
          /(auto|scroll)/.test(style.overflowX) &&
          el.scrollWidth > el.clientWidth + 1
        )
          return true;
        el = el.parentElement;
      }
      return false;
    };
    let start: { x: number; y: number; pan: number; id: number } | null = null;
    let dragging = false;
    const down = (event: PointerEvent) => {
      if (overflow <= 8 || !event.isPrimary || skip(event.target)) return;
      start = { x: event.clientX, y: event.clientY, pan, id: event.pointerId };
      dragging = false;
    };
    const move = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx))
          return void (start = null);
        if (Math.abs(dx) < 8) return;
        dragging = true;
        setPanHint((hint) => (hint === "show" ? "hide" : hint));
      }
      pan = Math.min(1, Math.max(0, start.pan - dx / overflow));
      apply();
    };
    const up = () => {
      start = null;
    };
    const swallowClick = (event: MouseEvent) => {
      if (dragging) {
        event.preventDefault();
        event.stopPropagation();
        dragging = false;
      }
    };
    measure();
    img.addEventListener("load", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(backdrop);
    main.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    main.addEventListener("click", swallowClick, true);
    const timer = window.setTimeout(
      () => setPanHint((hint) => (hint === "show" ? "hide" : hint)),
      4000,
    );
    return () => {
      img.removeEventListener("load", measure);
      observer.disconnect();
      main.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      main.removeEventListener("click", swallowClick, true);
      window.clearTimeout(timer);
      root.style.removeProperty("--photo-pan-x");
      img.style.objectPosition = "";
      backdrop.classList.remove("is-pannable");
      setPanHint("off");
    };
  }, [pageId, eventId]);
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
  const immersive = ["home", "inside", "booth", "bar", "record-shop"].includes(
    pageId,
  );
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
      case "inside":
        body = <Interior content={content} page={page} />;
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
          className={`public-site photo-layout page-${pageId} ${immersive ? "is-immersive" : ""} ${preview ? "is-preview" : ""} ${pageId === "bar" && !event && page.image === FRAMED_BAR_IMAGE ? "bar-framed" : ""}`}
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
            {pageId !== "home" && pageId !== "inside" && (
              <div className="page-photo-backdrop" aria-hidden="true">
                <Photo src={sceneImage} alt="" priority />
              </div>
            )}
            <div className="page-scroll">{body}</div>
            {panHint !== "off" && (
              <p
                className={`pan-hint${panHint === "hide" ? " is-hidden" : ""}`}
                aria-hidden="true"
              >
                <ChevronLeft size={16} />
                <span className="pan-hint-mouse">Drag to look around</span>
                <span className="pan-hint-touch">Swipe</span>
                <ChevronRight size={16} />
              </p>
            )}
          </main>
          <Footer content={content} immersive />
        </div>
      </ContentContext.Provider>
    </PreviewContext.Provider>
  );
}
