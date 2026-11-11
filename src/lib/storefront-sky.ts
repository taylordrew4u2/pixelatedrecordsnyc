import { getPosition } from "suncalc";

// New York City coordinates from NOAA's solar calculator (east-positive longitude).
// https://gml.noaa.gov/grad/solcalc/sunrise.html
const NEW_YORK = { latitude: 40.7167, longitude: -74.0167 };
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function storefrontSky(now: Date) {
  // Absolute instants + a fixed venue location avoid visitor time zones and DST
  // assumptions. SunCalc 2 returns refraction-corrected altitude in degrees.
  const { altitude, azimuth } = getPosition(
    now,
    NEW_YORK.latitude,
    NEW_YORK.longitude,
  );
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
    warmth: clamp(1 - Math.abs(altitude) / 6),
    stars: clamp((-altitude - 3) / 3),
  };
}

// This generated alpha mask is aligned only to the current storefront asset.
// A replacement uploaded in the editor must not inherit the old silhouette.
export function storefrontSkyMask(image: string) {
  return image === "/assets/storefront.webp" ||
    image === "/assets/storefront-clear.webp" ||
    image === "/assets/storefront-blinds.webp" ||
    image === "/assets/storefront-shades.webp"
    ? "/assets/storefront-sky-mask.webp"
    : undefined;
}
