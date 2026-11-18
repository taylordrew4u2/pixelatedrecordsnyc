import type { SiteContent } from "./types";

/** Typefaces the owner can pick in Studio. Each is bundled with the site. */
export const FONT_OPTIONS = {
  "dm-sans": {
    label: "DM Sans (clean)",
    stack: '"DM Sans", Arial, sans-serif',
  },
  inter: { label: "Inter (neutral)", stack: '"Inter", Arial, sans-serif' },
  "space-grotesk": {
    label: "Space Grotesk (techy)",
    stack: '"Space Grotesk", Arial, sans-serif',
  },
  "barlow-condensed": {
    label: "Barlow Condensed (tall, narrow)",
    stack: '"Barlow Condensed", "DM Sans", Arial, sans-serif',
  },
  oswald: {
    label: "Oswald (bold, narrow)",
    stack: '"Oswald", Arial, sans-serif',
  },
  "bebas-neue": {
    label: "Bebas Neue (poster capitals)",
    stack: '"Bebas Neue", "Oswald", Arial, sans-serif',
  },
  "archivo-black": {
    label: "Archivo Black (heavy)",
    stack: '"Archivo Black", Arial, sans-serif',
  },
  "playfair-display": {
    label: "Playfair Display (elegant serif)",
    stack: '"Playfair Display", Georgia, serif',
  },
  georgia: { label: "Georgia (classic serif)", stack: "Georgia, serif" },
  "space-mono": {
    label: "Space Mono (typewriter)",
    stack: '"Space Mono", "Courier New", monospace',
  },
} as const;
export type FontKey = keyof typeof FONT_OPTIONS;
export const FONT_KEYS = Object.keys(FONT_OPTIONS) as FontKey[];

/** Allowed ranges for Studio's size controls: [min, max, default]. */
export const SIZE_LIMITS = {
  panelWidth: [360, 1000, 600],
  boxPadding: [50, 200, 100],
  headingSize: [60, 160, 100],
  textSize: [80, 150, 100],
  buttonSize: [80, 160, 100],
  flyerWidth: [200, 520, 340],
  logoWidth: [120, 360, 230],
} as const;
export type SizeKey = keyof typeof SIZE_LIMITS;

/** The Pixelated Records look, used for anything the owner has not set. */
export const THEME_DEFAULTS = {
  accent: "#ff0a05",
  background: "#181614",
  surface: "#242424",
  foreground: "#f2ecdf",
  headingFont: "dm-sans" as FontKey,
  bodyFont: "dm-sans" as FontKey,
  labelFont: "barlow-condensed" as FontKey,
  buttonStyle: "square" as const,
};

// The owner replaced the blueprint lime with the logo's pixelated red. Saved
// content that still carries the old lime shows the red instead.
const LEGACY_LIME = /^#dcf55d$/i;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function contrastInk(hex: string) {
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

function hexToRgb(hex: string) {
  let value = hex.replace("#", "");
  if (value.length === 3)
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  return [0, 2, 4].map((o) => parseInt(value.slice(o, o + 2), 16)).join(" ");
}

function pick(value: string | undefined, fallback: string) {
  return value && HEX.test(value) ? value : fallback;
}

/** CSS variables for sizes the owner has set; unset sizes keep the design. */
function sizeVars(sizes: SiteContent["brand"]["sizes"]) {
  const vars: Record<string, string> = {};
  if (!sizes) return vars;
  const value = (key: SizeKey) => {
    const n = sizes[key];
    if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
    const [min, max] = SIZE_LIMITS[key];
    return Math.min(max, Math.max(min, n));
  };
  const px = (key: SizeKey, name: string) => {
    const n = value(key);
    if (n !== undefined) vars[name] = `${n}px`;
  };
  const scale = (key: SizeKey, name: string) => {
    const n = value(key);
    if (n !== undefined) vars[name] = String(n / 100);
  };
  px("panelWidth", "--op-panel-width");
  scale("boxPadding", "--op-pad-scale");
  scale("headingSize", "--op-heading-scale");
  scale("textSize", "--op-text-scale");
  scale("buttonSize", "--op-button-scale");
  px("flyerWidth", "--op-flyer-width");
  px("logoWidth", "--op-logo-width");
  return vars;
}

/** Resolves the brand settings into the colours and fonts the site uses. */
export function resolveTheme(brand: SiteContent["brand"]) {
  const accent =
    !brand.accent || LEGACY_LIME.test(brand.accent)
      ? THEME_DEFAULTS.accent
      : pick(brand.accent, THEME_DEFAULTS.accent);
  const background = pick(brand.background, THEME_DEFAULTS.background);
  const surface = pick(brand.surface, THEME_DEFAULTS.surface);
  const foreground = pick(brand.foreground, THEME_DEFAULTS.foreground);
  const accentText = pick(brand.accentText, contrastInk(accent));
  const font = (key: FontKey | undefined, fallback: FontKey) =>
    FONT_OPTIONS[key && key in FONT_OPTIONS ? key : fallback].stack;
  const legacyBody: FontKey = brand.font === "serif" ? "georgia" : "dm-sans";
  return {
    accent,
    accentText,
    background,
    surface,
    foreground,
    foregroundRgb: hexToRgb(foreground),
    headingFont: font(brand.headingFont, legacyBody),
    bodyFont: font(brand.bodyFont, legacyBody),
    labelFont: font(brand.labelFont, THEME_DEFAULTS.labelFont),
    sizes: sizeVars(brand.sizes),
    radius:
      brand.buttonStyle === "pill"
        ? "999px"
        : brand.buttonStyle === "rounded"
          ? "10px"
          : "0px",
  };
}
