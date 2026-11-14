"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Archive,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  History,
  ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Music2,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Undo2,
  Upload,
  Wine,
  X,
  AlertCircle,
} from "lucide-react";
import type { Asset, ContentState, SiteContent } from "@/lib/types";
import {
  AppearanceEditor,
  BarEditor,
  EventsEditor,
  LocationEditor,
  PagesEditor,
  SettingsEditor,
} from "./Editors";
import SceneEditor from "./SceneEditor";
import {
  Empty,
  Field,
  ImageField,
  MediaContext,
  Modal,
  Panel,
  TextArea,
} from "./Controls";

type Session = {
  authenticated: boolean;
  configured: boolean;
  storage: string;
  persistent: boolean;
  writable?: boolean;
};
type Notice = { tone: "success" | "error" | "info"; text: string };
type Tab =
  | "dashboard"
  | "pages"
  | "photos"
  | "events"
  | "bar"
  | "about"
  | "records"
  | "location"
  | "appearance"
  | "settings";
const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pages", label: "Page sections", icon: LayoutTemplate },
  { id: "photos", label: "Top photo", icon: ImageIcon },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "bar", label: "Bar menu", icon: Wine },
  { id: "about", label: "About", icon: FileText },
  { id: "records", label: "Records", icon: Music2 },
  { id: "location", label: "Contact & hours", icon: MapPin },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "settings", label: "Settings", icon: Settings },
];
const headings: Record<Tab, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Make yourself at home.",
    subtitle: "Your space, your story, your next great night.",
  },
  pages: {
    title: "Tell your story.",
    subtitle: "Every section of your one-page website, top to bottom.",
  },
  photos: {
    title: "Set the scene.",
    subtitle: "Real photographs. Clear directions. A little atmosphere.",
  },
  events: {
    title: "Put it on the calendar.",
    subtitle: "Tonight, next week, and everything worth coming back for.",
  },
  bar: {
    title: "What are we drinking?",
    subtitle: "Keep the menu fresh and every price easy to find.",
  },
  about: {
    title: "A little about the place.",
    subtitle: "Let people know what makes Pixelated Records yours.",
  },
  records: {
    title: "For the record.",
    subtitle: "The Records section: your curated used vinyl.",
  },
  location: {
    title: "We’ll meet you here.",
    subtitle:
      "Opening hours, directions, and the details that get people through the door.",
  },
  appearance: {
    title: "Make it look like you.",
    subtitle:
      "A consistent identity, from the storefront to the smallest screen.",
  },
  settings: {
    title: "The little details.",
    subtitle: "Booking, shared labels, footer links, and site preferences.",
  },
};

class RequestError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({
    error: "The server returned an unreadable response. Please try again.",
  }));
  if (!response.ok)
    throw new RequestError(
      body.error || "The request could not be completed.",
      response.status,
      body.code,
    );
  return body as T;
}
async function prepareImageUpload(file: File): Promise<File> {
  const limit = 4_000_000;
  if (file.size > 25 * 1024 * 1024)
    throw new Error(
      "Choose an original photo smaller than 25 MB. Large photos within that limit are optimized automatically.",
    );
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Please choose a JPEG, PNG, or WebP image.");
  if (file.size <= limit) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "This image could not be opened. Try another JPEG, PNG, or WebP photo.",
    );
  }
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error(
        "Your browser could not prepare the photo. Please try again in an updated browser.",
      );
    for (const maximum of [2400, 2000, 1600]) {
      const scale = Math.min(
        1,
        maximum / Math.max(bitmap.width, bitmap.height),
      );
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.88, 0.78, 0.68]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", quality),
        );
        if (blob && blob.size <= limit) {
          const name =
            file.name.replace(/\.(jpe?g|png|webp)$/i, "") +
            "." +
            (blob.type === "image/webp" ? "webp" : "png");
          return new File([blob], name, {
            type: blob.type,
            lastModified: file.lastModified,
          });
        }
      }
    }
    throw new Error(
      "This photo could not be reduced enough for upload. Please choose another image.",
    );
  } finally {
    bitmap.close();
  }
}
function localDate(value: string) {
  if (!value) return "Not yet";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
function validateContent(content: SiteContent): string | null {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: content.eventSettings.timeZone,
    }).format();
  } catch {
    return "Enter a valid venue time zone, such as America/New_York.";
  }
  if (!content.brand.name.trim())
    return "Enter the venue name in Appearance before saving.";
  const lights = content.scenes.lights;
  if (!(
    lights.dayStart < lights.duskStart && lights.duskStart < lights.nightStart
  ))
    return "In Photos & scene, set the start of day before dusk, and dusk before night.";
  if (lights.colors.length > 8) return "Use up to eight window-light colors.";
  const ids = new Set<string>();
  for (const event of content.events) {
    if (event.slug && ids.has(event.slug))
      return `Two events use the same page address, “${event.slug}”. Give each event a unique address.`;
    ids.add(event.slug);
    if (
      event.published &&
      (!event.title.trim() || !event.slug || !event.start || !event.end)
    )
      return `“${event.title || "Untitled event"}” needs a title, unique page address, start, and end before it can be marked for publication.`;
    if (
      [event.start, event.end, event.doors].some(
        (value) =>
          value &&
          (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
            !Number.isFinite(Date.parse(value))),
      )
    )
      return `Choose a valid date and local time for “${event.title || "Untitled event"}”. Times skipped by daylight saving are not available.`;
    if (
      event.start &&
      event.end &&
      Date.parse(event.end) <= Date.parse(event.start)
    )
      return `The end of “${event.title || "Untitled event"}” must be after its start. Use the next date for overnight events.`;
    if (
      event.doors &&
      event.start &&
      Date.parse(event.doors) > Date.parse(event.start)
    )
      return `Doors for “${event.title || "Untitled event"}” must open at or before its start.`;
  }
  const specialDates = new Set<string>();
  for (const entry of content.location.specialHours) {
    if (!entry.date)
      return "Choose a date for every special-hours entry in Location & hours.";
    if (specialDates.has(entry.date))
      return `There are two special-hours entries for ${entry.date}. Keep one schedule for each date.`;
    specialDates.add(entry.date);
  }
  if (
    content.location.hoursConfirmed &&
    [...content.location.hours, ...content.location.specialHours].some(
      (entry) => !entry.closed && (!entry.open || !entry.close),
    )
  )
    return "Add an opening and closing time to each open day before confirming your opening hours.";
  for (const value of [
    content.brand.accent,
    content.brand.background,
    content.brand.foreground,
    ...content.scenes.lights.colors,
  ])
    if (!/^#[0-9a-f]{6}$/i.test(value))
      return "Use a complete six-digit color, such as #d83227, in Appearance and scene lighting.";
  return null;
}

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null),
    [state, setState] = useState<ContentState | null>(null),
    [working, setWorking] = useState<SiteContent | null>(null);
  const [booting, setBooting] = useState(true),
    [password, setPassword] = useState(""),
    [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard"),
    [mobileNav, setMobileNav] = useState(false),
    [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null),
    [conflict, setConflict] = useState(false),
    [showHistory, setShowHistory] = useState(false);
  const [picker, setPicker] = useState<{
      select?: (src: string) => void;
    } | null>(null),
    [mediaQuery, setMediaQuery] = useState(""),
    [mediaDetail, setMediaDetail] = useState<string | null>(null),
    [uploading, setUploading] = useState(false),
    [mediaError, setMediaError] = useState(""),
    [uploadStage, setUploadStage] = useState("");
  const undo = useRef<SiteContent[]>([]),
    returnFocus = useRef<HTMLElement | null>(null),
    pending = useRef<{ working: SiteContent; state: ContentState } | null>(
      null,
    );
  const uploadInput = useRef<HTMLInputElement>(null),
    replaceInput = useRef<HTMLInputElement>(null);
  const dirty = useMemo(
    () =>
      !!working &&
      !!state &&
      JSON.stringify(working) !== JSON.stringify(state.draft),
    [working, state],
  );
  const writable = session?.writable !== false;
  const update = useCallback(
    (mutate: (draft: SiteContent) => void) =>
      setWorking((previous) => {
        if (!previous) return previous;
        undo.current.push(previous);
        if (undo.current.length > 40) undo.current.shift();
        const next = structuredClone(previous);
        mutate(next);
        return next;
      }),
    [],
  );
  const adopt = (next: ContentState) => {
    setState(next);
    setWorking(structuredClone(next.draft));
    undo.current = [];
    setConflict(false);
  };
  const loadSession = async () => {
    const nextSession = await request<Session>("/api/auth/session");
    setSession(nextSession);
    if (nextSession.authenticated) {
      const nextState = await request<ContentState>("/api/admin/content");
      adopt(nextState);
    }
    return nextSession;
  };
  useEffect(() => {
    loadSession()
      .catch((e) =>
        setNotice({
          tone: "error",
          text:
            e.message || "We could not connect. Reload the page to try again.",
        }),
      )
      .finally(() => setBooting(false));
  }, []); // One session check on entry.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    if (!notice || notice.tone === "error") return;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice]);
  function reportError(error: unknown) {
    const err = error as RequestError;
    setNotice({
      tone: "error",
      text:
        err.message ||
        "Something went wrong. Your changes have not been published.",
    });
    if (err.status === 409) setConflict(true);
    if (err.status === 401) {
      if (working && state) pending.current = { working, state };
      setSession((s) => (s ? { ...s, authenticated: false } : s));
      setPassword("");
    }
  }
  async function login(event: FormEvent) {
    event.preventDefault();
    setLoggingIn(true);
    setNotice(null);
    try {
      await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      const [nextSession, nextState] = await Promise.all([
        request<Session>("/api/auth/session"),
        request<ContentState>("/api/admin/content"),
      ]);
      setSession(nextSession);
      if (pending.current) {
        const prior = pending.current;
        pending.current = null;
        if (nextState.revision === prior.state.revision) {
          setState(nextState);
          setWorking(prior.working);
          setNotice({
            tone: "info",
            text: "Welcome back. Your unsaved changes are still here.",
          });
        } else {
          setState(prior.state);
          setWorking(prior.working);
          setConflict(true);
          setNotice({
            tone: "error",
            text: "A newer draft was saved while you were signed out. Your unsaved changes are preserved here; reload the latest draft before continuing.",
          });
        }
      } else adopt(nextState);
    } catch (e) {
      reportError(e);
    } finally {
      setLoggingIn(false);
    }
  }
  async function logout() {
    if (
      dirty &&
      !confirm("You have unsaved changes. Sign out and discard them?")
    )
      return;
    setBusy("logout");
    try {
      await request("/api/auth/logout", { method: "POST" });
      setSession((s) => (s ? { ...s, authenticated: false } : s));
      setState(null);
      setWorking(null);
      undo.current = [];
      setPassword("");
      setNotice(null);
    } catch (e) {
      reportError(e);
    } finally {
      setBusy("");
    }
  }
  async function saveCurrent(): Promise<ContentState> {
    if (!working || !state) throw new Error("The draft is not loaded.");
    const validation = validateContent(working);
    if (validation) throw new Error(validation);
    const next = await request<ContentState>("/api/admin/content", {
      method: "PUT",
      body: JSON.stringify({
        content: working,
        expectedRevision: state.revision,
      }),
    });
    adopt(next);
    return next;
  }
  async function save() {
    setBusy("save");
    setNotice(null);
    try {
      await saveCurrent();
      setNotice({
        tone: "success",
        text: "Draft saved. Your live website has not changed yet.",
      });
    } catch (e) {
      reportError(e);
    } finally {
      setBusy("");
    }
  }
  async function publish() {
    if (!state) return;
    if (
      !confirm(
        "Publish these changes to the website? Visitors will see the new version.",
      )
    )
      return;
    setBusy("publish");
    setNotice(null);
    try {
      const saved = dirty ? await saveCurrent() : state;
      const next = await request<ContentState>("/api/admin/publish", {
        method: "POST",
        body: JSON.stringify({ expectedRevision: saved.revision }),
      });
      adopt(next);
      setNotice({
        tone: "success",
        text: "Published. Your website is showing this version now.",
      });
    } catch (e) {
      reportError(e);
    } finally {
      setBusy("");
    }
  }
  async function preview() {
    const target = window.open("about:blank", "_blank");
    setBusy("preview");
    try {
      if (dirty) await saveCurrent();
      if (target) target.location.href = "/?preview=1";
      else window.location.assign("/?preview=1");
    } catch (e) {
      target?.close();
      reportError(e);
    } finally {
      setBusy("");
    }
  }
  async function reload() {
    if (
      dirty &&
      !confirm("Reload the saved draft and discard your unsaved changes?")
    )
      return;
    setBusy("reload");
    try {
      adopt(await request<ContentState>("/api/admin/content"));
      setNotice({ tone: "info", text: "The latest saved draft is loaded." });
    } catch (e) {
      reportError(e);
    } finally {
      setBusy("");
    }
  }
  async function restore(id: string) {
    if (!state) return;
    if (
      !confirm(
        "Restore this version into your draft? Current unsaved changes will be replaced. Your live site changes only when you publish.",
      )
    )
      return;
    setBusy("restore");
    try {
      const next = await request<ContentState>("/api/admin/restore", {
        method: "POST",
        body: JSON.stringify({
          historyId: id,
          expectedRevision: state.revision,
        }),
      });
      adopt(next);
      setShowHistory(false);
      setNotice({
        tone: "success",
        text: "Version restored to your draft. Preview it, then publish when ready.",
      });
    } catch (e) {
      reportError(e);
    } finally {
      setBusy("");
    }
  }
  function openPicker(select?: (src: string) => void) {
    returnFocus.current = document.activeElement as HTMLElement;
    setMediaQuery("");
    setMediaError("");
    setMediaDetail(null);
    setPicker({ select });
  }
  function closePicker() {
    setPicker(null);
    setMediaDetail(null);
    queueMicrotask(() => returnFocus.current?.focus());
  }
  async function upload(files: FileList | null, replacing?: Asset) {
    if (!files?.length) return;
    setUploading(true);
    setMediaError("");
    try {
      const added: Asset[] = [];
      for (const file of Array.from(files)) {
        setUploadStage(
          file.size > 4_000_000
            ? `Preparing ${file.name}…`
            : `Uploading ${file.name}…`,
        );
        const prepared = await prepareImageUpload(file);
        setUploadStage(`Uploading ${file.name}…`);
        const body = new FormData();
        body.append("file", prepared);
        const { asset } = await request<{ asset: Asset }>("/api/admin/media", {
          method: "POST",
          body,
        });
        added.push(asset);
        if (replacing) {
          update((d) => {
            const swapped = JSON.parse(JSON.stringify(d), (key, value) =>
              value === replacing.src ? asset.src : value,
            ) as SiteContent;
            swapped.assets = swapped.assets.filter(
              (a) => a.id !== replacing.id && a.id !== asset.id,
            );
            swapped.assets.push({
              ...asset,
              label: replacing.label,
              alt: replacing.alt,
            });
            Object.assign(d, swapped);
          });
          setMediaDetail(asset.id);
        } else
          update((d) => {
            if (!d.assets.some((a) => a.id === asset.id)) d.assets.push(asset);
          });
      }
      if (picker?.select && added.length === 1 && !replacing) {
        picker.select(added[0].src);
        closePicker();
      }
      setNotice({
        tone: "success",
        text: replacing
          ? "Image replaced everywhere in this draft. Save and publish to update the site."
          : `${added.length === 1 ? "Image" : "Images"} uploaded. Save your draft to keep the library changes.`,
      });
    } catch (e) {
      setMediaError((e as Error).message || "The image could not be uploaded.");
      reportError(e);
    } finally {
      setUploading(false);
      setUploadStage("");
      if (uploadInput.current) uploadInput.current.value = "";
      if (replaceInput.current) replaceInput.current.value = "";
    }
  }

  if (booting)
    return (
      <div className="admin-app ad-loading">
        <span className="ad-studio-wordmark">
          PIXELATED <b>STUDIO</b>
        </span>
        <Loader2 className="ad-spin" size={24} />
        <p>Opening your studio…</p>
      </div>
    );
  if (!session?.authenticated || !working || !state)
    return (
      <div className="admin-app ad-login-page">
        <a href="/" className="ad-login-home">
          <ArrowUpRight size={17} /> Back to the website
        </a>
        <div className="ad-login-art">
          <div className="ad-login-disc" aria-hidden="true">
            <span>
              <img src="/assets/mark.png" alt="" />
            </span>
          </div>
          <span className="ad-eyebrow">PIXELATED RECORDS / OWNER’S STUDIO</span>
          <h1>
            Behind
            <br />
            the scenes.
          </h1>
          <p>
            A place for the next event, a new photo,
            <br />
            and everything that makes this place yours.
          </p>
        </div>
        <div className="ad-login-form-wrap">
          <div className="ad-login-form">
            <span className="ad-pill">
              <ShieldCheck size={14} />
              PRIVATE ACCESS
            </span>
            <h2>Welcome back.</h2>
            <p>Sign in to manage your website.</p>
            {notice && (
              <div className={`ad-notice ${notice.tone}`} role="alert">
                {notice.text}
              </div>
            )}
            {session && !session.configured ? (
              <div className="ad-notice info">
                Admin sign-in is not configured yet. Finish the private server
                setup before using the studio.
              </div>
            ) : (
              <form onSubmit={login}>
                <label htmlFor="admin-password">Admin password</label>
                <input
                  id="admin-password"
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  placeholder="Enter your password"
                />
                <button
                  type="submit"
                  className="ad-button ad-button-red ad-login-submit"
                  disabled={loggingIn || !password}
                >
                  {loggingIn ? (
                    <Loader2 className="ad-spin" size={18} />
                  ) : (
                    <>
                      Open the studio <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
            <small>Your edits stay private until you publish.</small>
            {!session && (
              <button
                type="button"
                className="ad-text-button"
                onClick={() => window.location.reload()}
              >
                Retry connection
              </button>
            )}
          </div>
          <div className="ad-login-footer">RECORDS · DRINKS · GOOD COMPANY</div>
        </div>
      </div>
    );

  const currentHeading = headings[tab];
  const publishedCount = working.events.filter(
    (e) => e.published && e.status !== "cancelled",
  ).length;
  const media = working.assets.filter((a) =>
    `${a.label} ${a.alt}`.toLowerCase().includes(mediaQuery.toLowerCase()),
  );
  const detail = working.assets.find((a) => a.id === mediaDetail);
  const inUse = (asset: Asset) =>
    JSON.stringify({ ...working, assets: [] }).includes(asset.src);
  return (
    <MediaContext.Provider
      value={{
        assets: working.assets,
        openPicker: (select) => openPicker(select),
      }}
    >
      <div className="admin-app ad-shell">
        <aside className={`ad-sidebar ${mobileNav ? "is-open" : ""}`}>
          <div className="ad-sidebar-brand">
            <a href="/" aria-label="Pixelated Records website">
              <span>
                <img
                  className="ad-brand-logo"
                  src={working.brand.logoLight || "/assets/logo-light.png"}
                  alt="Pixelated Records"
                />
                <b>OWNER’S STUDIO</b>
              </span>
            </a>
            <button
              type="button"
              className="ad-icon-button ad-mobile-close"
              aria-label="Close admin menu"
              onClick={() => setMobileNav(false)}
            >
              <X size={20} />
            </button>
          </div>
          <span className="ad-nav-label">YOUR WEBSITE</span>
          <nav aria-label="Admin sections">
            {tabs.map((item) => (
              <button
                type="button"
                className={tab === item.id ? "active" : ""}
                key={item.id}
                aria-current={tab === item.id ? "page" : undefined}
                onClick={() => {
                  setTab(item.id);
                  setMobileNav(false);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {tab === item.id && <span className="ad-nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="ad-sidebar-bottom">
            <div className="ad-storage-state">
              <span
                className={
                  session.persistent ? "ad-status-dot" : "ad-status-dot local"
                }
              />
              <span>
                {session.persistent
                  ? "Persistent storage connected"
                  : "Local studio preview"}
                <small>
                  {session.persistent
                    ? "Changes are stored safely"
                    : "Configure durable hosting before launch"}
                </small>
              </span>
            </div>
            <a href="/" target="_blank" rel="noreferrer">
              <ArrowUpRight size={17} />
              View live website
            </a>
            <button type="button" onClick={logout} disabled={!!busy}>
              <LogOut size={17} />
              Sign out
            </button>
          </div>
        </aside>
        {mobileNav && (
          <button
            type="button"
            className="ad-sidebar-scrim"
            aria-label="Close admin menu"
            onClick={() => setMobileNav(false)}
          />
        )}
        <div className="ad-work-area">
          <header className="ad-topbar">
            <div className="ad-topbar-left">
              <button
                type="button"
                className="ad-icon-button ad-mobile-menu"
                aria-label="Open admin menu"
                onClick={() => setMobileNav(true)}
              >
                <Menu size={21} />
              </button>
              <span className="ad-topbar-section">
                {tabs.find((t) => t.id === tab)?.label}
              </span>
              <span className={`ad-save-status ${dirty ? "unsaved" : ""}`}>
                <span />
                {dirty ? "Unsaved changes" : "Draft saved"}
              </span>
            </div>
            <div className="ad-toolbar">
              <button
                type="button"
                className="ad-icon-button"
                aria-label="Undo last edit"
                title="Undo last edit"
                disabled={!undo.current.length || !!busy}
                onClick={() => {
                  const previous = undo.current.pop();
                  if (previous) setWorking(previous);
                }}
              >
                <Undo2 size={17} />
              </button>
              <button
                type="button"
                className="ad-icon-button"
                aria-label="Version history"
                title="Version history"
                onClick={() => setShowHistory(true)}
                disabled={!!busy}
              >
                <History size={18} />
              </button>
              <button
                type="button"
                className="ad-button ad-preview-button"
                onClick={preview}
                disabled={!!busy || !writable}
              >
                <Eye size={16} />
                <span>Preview</span>
              </button>
              <button
                type="button"
                className="ad-button"
                onClick={save}
                disabled={!dirty || !!busy || !writable || conflict}
              >
                {busy === "save" ? (
                  <Loader2 size={16} className="ad-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>Save draft</span>
              </button>
              <button
                type="button"
                className="ad-button ad-button-red"
                onClick={publish}
                disabled={!!busy || !writable || conflict}
              >
                {busy === "publish" ? (
                  <Loader2 size={16} className="ad-spin" />
                ) : (
                  <ArrowUpRight size={16} />
                )}
                <span>Publish</span>
              </button>
            </div>
          </header>
          <main className="ad-main" id="admin-main">
            <div className="ad-page-intro">
              <span className="ad-eyebrow">
                PIXELATED RECORDS /{" "}
                {tab === "dashboard"
                  ? "STUDIO"
                  : tabs.find((t) => t.id === tab)?.label.toUpperCase()}
              </span>
              <h1>{currentHeading.title}</h1>
              <p>{currentHeading.subtitle}</p>
            </div>
            {notice && (
              <div
                className={`ad-notice ${notice.tone}`}
                role={notice.tone === "error" ? "alert" : "status"}
              >
                {notice.tone === "error" ? (
                  <AlertCircle size={19} />
                ) : notice.tone === "success" ? (
                  <CheckCircle2 size={19} />
                ) : (
                  <Clock3 size={19} />
                )}
                <span>{notice.text}</span>
                <button
                  type="button"
                  className="ad-icon-button"
                  aria-label="Dismiss message"
                  onClick={() => setNotice(null)}
                >
                  <X size={17} />
                </button>
              </div>
            )}
            {conflict && (
              <div className="ad-notice error">
                <AlertCircle size={20} />
                <span>
                  A newer draft exists. Reload it before saving so another
                  editor’s changes are not overwritten.
                </span>
                <button
                  type="button"
                  className="ad-button"
                  onClick={reload}
                  disabled={!!busy}
                >
                  <RefreshCw size={16} />
                  Reload latest
                </button>
              </div>
            )}
            {!writable && (
              <div className="ad-notice error">
                <ShieldCheck size={20} />
                <span>
                  This setup is read-only. Connect writable storage before
                  making changes.
                </span>
              </div>
            )}
            <fieldset
              className="ad-edit-fieldset"
              disabled={!!busy || !writable}
            >
              {tab === "dashboard" && (
                <>
                  <div className="ad-dashboard-hero">
                    <div>
                      <span className="ad-eyebrow">
                        YOUR NEXT UPDATE STARTS HERE
                      </span>
                      <h2>
                        Keep the good
                        <br />
                        nights coming.
                      </h2>
                      <p>
                        Add an event, update the drinks, or let a new photograph
                        do the talking.
                      </p>
                      <button
                        type="button"
                        className="ad-button ad-button-red"
                        onClick={() => setTab("events")}
                      >
                        <Plus size={17} />
                        Manage events
                      </button>
                    </div>
                    <div className="ad-hero-record" aria-hidden="true">
                      <span>
                        <img
                          src={
                            working.brand.logoLight || "/assets/logo-light.png"
                          }
                          alt=""
                        />
                      </span>
                    </div>
                  </div>
                  <div className="ad-stat-grid">
                    <button type="button" onClick={() => setTab("events")}>
                      <CalendarDays size={21} />
                      <strong>{publishedCount}</strong>
                      <span>Events ready for the site</span>
                      <ArrowUpRight size={16} />
                    </button>
                    <button type="button" onClick={() => setTab("bar")}>
                      <Wine size={21} />
                      <strong>
                        {working.bar.categories.reduce(
                          (n, c) => n + c.items.length,
                          0,
                        )}
                      </strong>
                      <span>Items on your bar menu</span>
                      <ArrowUpRight size={16} />
                    </button>
                    <button type="button" onClick={() => openPicker()}>
                      <ImageIcon size={21} />
                      <strong>{working.assets.length}</strong>
                      <span>Images in your library</span>
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="ad-two-col ad-align-start">
                    <Panel title="A few quick moves">
                      <div className="ad-quick-links">
                        {(
                          [
                            {
                              tab: "events",
                              label: "Add or update an event",
                              icon: CalendarDays,
                            },
                            {
                              tab: "bar",
                              label: "Edit the bar menu",
                              icon: Wine,
                            },
                            {
                              tab: "location",
                              label: "Update opening hours",
                              icon: Clock3,
                            },
                            {
                              tab: "photos",
                              label: "Replace a photograph",
                              icon: ImageIcon,
                            },
                          ] as const
                        ).map((item) => (
                          <button
                            type="button"
                            key={item.tab}
                            onClick={() => setTab(item.tab)}
                          >
                            <item.icon size={19} />
                            <span>{item.label}</span>
                            <ArrowRight size={17} />
                          </button>
                        ))}
                      </div>
                    </Panel>
                    <Panel title="Draft & live website">
                      <div className="ad-version-row">
                        <span>Draft last saved</span>
                        <strong>{localDate(state.updatedAt)}</strong>
                      </div>
                      <div className="ad-version-row">
                        <span>Last published</span>
                        <strong>{localDate(state.publishedAt)}</strong>
                      </div>
                      <div className="ad-version-row">
                        <span>Your current changes</span>
                        <strong>
                          {dirty
                            ? "Not saved yet"
                            : state.revision !== state.publishedRevision
                              ? "Saved, not published"
                              : "Up to date"}
                        </strong>
                      </div>
                      <p className="ad-help">
                        Save draft keeps changes private. Preview lets you check
                        them. Publish updates the website for everyone.
                      </p>
                      <button
                        type="button"
                        className="ad-button"
                        onClick={preview}
                      >
                        <Eye size={16} />
                        Preview your draft
                      </button>
                    </Panel>
                  </div>
                  {(!working.location.hoursConfirmed ||
                    !working.events.length ||
                    !session.persistent) && (
                    <Panel title="Before you open the doors">
                      <div className="ad-checklist">
                        {!working.location.hoursConfirmed && (
                          <button
                            type="button"
                            onClick={() => setTab("location")}
                          >
                            <span className="ad-check-circle" />
                            <span>
                              <strong>Confirm the opening hours</strong>
                              <small>
                                Make sure visitors know when to stop by.
                              </small>
                            </span>
                            <ArrowRight size={17} />
                          </button>
                        )}
                        {!working.events.length && (
                          <button
                            type="button"
                            onClick={() => setTab("events")}
                          >
                            <span className="ad-check-circle" />
                            <span>
                              <strong>Add the first confirmed event</strong>
                              <small>
                                Only real published events will appear publicly.
                              </small>
                            </span>
                            <ArrowRight size={17} />
                          </button>
                        )}
                        {!session.persistent && (
                          <div>
                            <span className="ad-check-circle" />
                            <span>
                              <strong>Finish production storage setup</strong>
                              <small>
                                This local preview saves on this server. Connect
                                durable storage before deploying.
                              </small>
                            </span>
                          </div>
                        )}
                      </div>
                    </Panel>
                  )}
                </>
              )}
              {tab === "pages" && (
                <PagesEditor content={working} update={update} />
              )}
              {tab === "photos" && (
                <>
                  <SceneEditor content={working} update={update} />
                  <Panel
                    title="Your image library"
                    description="Upload new photographs, update descriptions, or replace an image everywhere it appears."
                    actions={
                      <button
                        type="button"
                        className="ad-button"
                        onClick={() => openPicker()}
                      >
                        <ImageIcon size={16} />
                        Open library
                      </button>
                    }
                  >
                    <div className="ad-library-strip">
                      {working.assets.slice(0, 8).map((asset) => (
                        <button
                          type="button"
                          key={asset.id}
                          onClick={() => {
                            openPicker();
                            setMediaDetail(asset.id);
                          }}
                        >
                          <img src={asset.src} alt={asset.alt || asset.label} />
                        </button>
                      ))}
                    </div>
                    <p className="ad-help">
                      {working.assets.length} images · JPEG, PNG, or WebP
                      originals up to 25 MB · large photos are optimized
                      automatically
                    </p>
                  </Panel>
                </>
              )}
              {tab === "events" && (
                <EventsEditor content={working} update={update} />
              )}
              {tab === "bar" && <BarEditor content={working} update={update} />}
              {tab === "about" && (
                <PagesEditor
                  content={working}
                  update={update}
                  onlyPage="about"
                />
              )}
              {tab === "records" && (
                <PagesEditor
                  content={working}
                  update={update}
                  onlyPage="records"
                />
              )}
              {tab === "location" && (
                <LocationEditor content={working} update={update} />
              )}
              {tab === "appearance" && (
                <AppearanceEditor content={working} update={update} />
              )}
              {tab === "settings" && (
                <SettingsEditor content={working} update={update} />
              )}
            </fieldset>
            <footer className="ad-main-footer">
              <span>Made for the people behind the place.</span>
              <button
                type="button"
                className="ad-text-button"
                onClick={reload}
                disabled={!!busy}
              >
                <RefreshCw size={13} /> Reload saved draft
              </button>
            </footer>
          </main>
        </div>
        {showHistory && (
          <Modal
            title="Version history"
            description="Restore a saved version to your draft, review it, then publish when ready."
            onClose={() => setShowHistory(false)}
          >
            {state.history.length ? (
              <div className="ad-history-list">
                {state.history.map((version) => (
                  <div key={version.id}>
                    <span>
                      <strong>{version.label || "Saved version"}</strong>
                      <small>{localDate(version.at)}</small>
                    </span>
                    <button
                      type="button"
                      className="ad-button"
                      disabled={!!busy || !writable}
                      onClick={() => restore(version.id)}
                    >
                      {busy === "restore" ? (
                        <Loader2 className="ad-spin" size={16} />
                      ) : (
                        <History size={16} />
                      )}
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="Your history starts with a save"
                description="Previous versions will appear here as you save and publish changes."
              />
            )}
          </Modal>
        )}
        {picker && (
          <Modal
            title={
              detail
                ? "Image details"
                : picker.select
                  ? "Choose an image"
                  : "Your image library"
            }
            description="Use your JPEG, PNG, or WebP originals (up to 25 MB). Large images are resized automatically without changing their content or proportions."
            onClose={closePicker}
            wide
          >
            <input
              type="file"
              ref={uploadInput}
              className="ad-sr-only"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => upload(e.target.files)}
            />
            <input
              type="file"
              ref={replaceInput}
              className="ad-sr-only"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => detail && upload(e.target.files, detail)}
            />
            {uploading && (
              <div className="ad-notice info" role="status">
                <Loader2 size={18} className="ad-spin" />
                <span>{uploadStage || "Preparing your image…"}</span>
              </div>
            )}
            {mediaError && (
              <div className="ad-notice error" role="alert">
                <AlertCircle size={18} />
                <span>{mediaError}</span>
              </div>
            )}
            <div className="ad-media-toolbar">
              {detail ? (
                <button
                  type="button"
                  className="ad-button"
                  onClick={() => setMediaDetail(null)}
                >
                  ← All images
                </button>
              ) : (
                <Field
                  label="Search images"
                  value={mediaQuery}
                  onChange={setMediaQuery}
                  placeholder="Photo or logo name"
                />
              )}
              <button
                type="button"
                className="ad-button ad-button-red"
                disabled={uploading || !writable}
                onClick={() => uploadInput.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="ad-spin" size={16} />
                ) : (
                  <Upload size={16} />
                )}
                Upload images
              </button>
            </div>
            {detail ? (
              <div className="ad-two-col ad-align-start">
                <div className="ad-media-detail-image">
                  <img src={detail.src} alt={detail.alt || detail.label} />
                </div>
                <div>
                  <Field
                    label="Image name in the library"
                    value={detail.label}
                    onChange={(v) =>
                      update((d) => {
                        const a = d.assets.find((a) => a.id === detail.id);
                        if (a) a.label = v;
                      })
                    }
                  />
                  <TextArea
                    label="Image description"
                    value={detail.alt}
                    onChange={(v) =>
                      update((d) => {
                        const a = d.assets.find((a) => a.id === detail.id);
                        if (a) a.alt = v;
                      })
                    }
                    help="Describe the visible image for people using a screen reader."
                  />
                  <p className="ad-help">
                    {detail.width && detail.height
                      ? `${detail.width} × ${detail.height} pixels · `
                      : ""}
                    {inUse(detail)
                      ? "Used on the website"
                      : "Not currently used on a page"}
                  </p>
                  <div className="ad-stacked">
                    {picker.select && (
                      <button
                        type="button"
                        className="ad-button ad-button-red"
                        onClick={() => {
                          picker.select?.(detail.src);
                          closePicker();
                        }}
                      >
                        Use this image <Check size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="ad-button"
                      disabled={uploading || !writable}
                      onClick={() => {
                        if (
                          confirm(
                            "Replace this image everywhere it is used in the draft?",
                          )
                        )
                          replaceInput.current?.click();
                      }}
                    >
                      <Upload size={16} />
                      Replace everywhere
                    </button>
                    <button
                      type="button"
                      className="ad-text-button ad-danger-text"
                      disabled={inUse(detail) || uploading || !writable}
                      onClick={() => {
                        if (
                          confirm("Remove this unused image from the library?")
                        ) {
                          update((d) => {
                            d.assets = d.assets.filter(
                              (a) => a.id !== detail.id,
                            );
                          });
                          setMediaDetail(null);
                        }
                      }}
                    >
                      Remove from library
                    </button>
                  </div>
                </div>
              </div>
            ) : media.length ? (
              <div className="ad-media-grid">
                {media.map((asset) => (
                  <div className="ad-media-card" key={asset.id}>
                    <button
                      type="button"
                      className="ad-media-select"
                      onClick={() => {
                        if (picker.select) {
                          picker.select(asset.src);
                          closePicker();
                        } else setMediaDetail(asset.id);
                      }}
                    >
                      <img
                        src={asset.src}
                        alt={asset.alt || asset.label}
                        loading="lazy"
                      />
                      <strong>{asset.label || "Untitled image"}</strong>
                    </button>
                    <button
                      type="button"
                      className="ad-text-button"
                      onClick={() => setMediaDetail(asset.id)}
                    >
                      Edit details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="No images found"
                description="Try another search or upload a photograph."
              />
            )}
          </Modal>
        )}
      </div>
    </MediaContext.Provider>
  );
}
