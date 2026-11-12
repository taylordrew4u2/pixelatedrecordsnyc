import { getPosition } from "suncalc";

// Pixelated Records, 792 Onderdonk Avenue, Ridgewood.
// Venue's Google Maps place: ChIJp90R_w9dwokRE0mMtzH1X0M.
const VENUE = { latitude: 40.7023993, longitude: -73.9048206 };
const clamp = (value: number) => Math.max(0, Math.min(1, value));

type SkyColor = readonly [number, string, string];
const skyColors = (morning: boolean): readonly SkyColor[] => [
  [-12, "#181614", "#181614"],
  [-6, "#292638", "#514457"],
  [0, morning ? "#7a8da9" : "#6b638b", morning ? "#edbf92" : "#df986c"],
  [6, morning ? "#659acb" : "#6788af", morning ? "#c0d8e6" : "#e4bd9c"],
  [20, morning ? "#3d91d9" : "#4788c1", morning ? "#abd1ed" : "#b3c9de"],
  [45, "#287ed0", "#8ac5ef"],
  [90, "#246ec0", "#a3d8f4"],
];

function mixColor(from: string, to: string, progress: number) {
  return `#${[1, 3, 5]
    .map((offset) => {
      const a = parseInt(from.slice(offset, offset + 2), 16);
      const b = parseInt(to.slice(offset, offset + 2), 16);
      return Math.round(a + (b - a) * progress)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

export function storefrontSky(now: Date) {
  // Absolute instants + a fixed venue location avoid visitor time zones and DST
  // assumptions. SunCalc 2 returns refraction-corrected altitude in degrees.
  const { altitude, azimuth } = getPosition(
    now,
    VENUE.latitude,
    VENUE.longitude,
  );
  const colors = skyColors(azimuth < 180);
  const upper = Math.max(
    1,
    colors.findIndex(([angle]) => altitude <= angle),
  );
  const lower = colors[upper - 1];
  const higher = colors[upper];
  const progress = clamp((altitude - lower[0]) / (higher[0] - lower[0]));
  return {
    phase:
      altitude <= -6
        ? "night"
        : altitude >= 6
          ? "day"
          : azimuth < 180
            ? "sunrise"
            : "sunset",
    daylight: clamp((altitude + 6) / 12),
    top: mixColor(lower[1], higher[1], progress),
    horizon: mixColor(lower[2], higher[2], progress),
    stars: clamp((-altitude - 3) / 9),
  };
}

// This generated alpha mask is aligned only to the current storefront asset.
// A replacement uploaded in the editor must not inherit the old silhouette.
export function storefrontSkyMask(image: string) {
  return image === "/assets/storefront.webp" ||
    image === "/assets/storefront-clear.webp" ||
    image === "/assets/storefront-blinds.webp" ||
    image === "/assets/storefront-shades.webp"
    ? "/assets/storefront-wide-sky-mask.webp"
    : undefined;
}
