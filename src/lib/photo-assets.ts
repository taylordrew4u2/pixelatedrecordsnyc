// The storefront is the real photograph, widened on desktop with AI-extended
// neighbouring buildings (softened toward the edges) so the whole storefront
// fits wide screens. Photographic edits on the real part only:
// shades lowered behind the glass, wet sidewalk patches cleaned, colour graded.
// Every photo below also has its near-black tones unified to the brand black
// (#181614) so blacks read as one solid colour across the site.
// Enhanced room images are versioned separately; the original uploads remain
// available to the editor and existing content records keep their references.
const roomPhotos = {
  "/assets/bar.webp": {
    src: "/assets/bar-solid.webp",
    small: "/assets/bar-solid-small.webp",
    width: 1800,
  },
  "/assets/bar-rich.webp": {
    src: "/assets/bar-rich-solid.webp",
    small: "/assets/bar-rich-solid-small.webp",
    width: 1448,
  },
  // Two photos of the bar stitched into one wider view (wallpaper is plum).
  "/assets/bar-room-wide.webp": {
    src: "/assets/bar-room-wide.webp",
    small: "/assets/bar-room-wide-small.webp",
    width: 1968,
  },
  "/assets/interior.webp": {
    src: "/assets/interior-solid.webp",
    small: "/assets/interior-solid-small.webp",
    width: 1448,
  },
  "/assets/interior-rich.webp": {
    src: "/assets/interior-solid.webp",
    small: "/assets/interior-solid-small.webp",
    width: 1448,
  },
  "/assets/dj-booth.webp": {
    src: "/assets/dj-booth-solid.webp",
    small: "/assets/dj-booth-solid-small.webp",
    width: 1448,
  },
  "/assets/dj-booth-rich.webp": {
    src: "/assets/dj-booth-solid.webp",
    small: "/assets/dj-booth-solid-small.webp",
    width: 1448,
  },
  "/assets/record-shop.webp": {
    src: "/assets/records-solid.webp",
    small: "/assets/records-solid-small.webp",
    width: 2400,
  },
  "/assets/record-shop-rich.webp": {
    src: "/assets/record-shop-rich-solid.webp",
    small: "/assets/record-shop-rich-solid-small.webp",
    width: 1672,
  },
  "/assets/record-bins.webp": {
    src: "/assets/record-bins-solid.webp",
    small: "/assets/record-bins-solid-small.webp",
    width: 1080,
  },
  "/assets/sticker-door.webp": {
    src: "/assets/sticker-door-solid.webp",
    small: "/assets/sticker-door-solid-small.webp",
    width: 1920,
  },
  "/assets/shop-window.webp": {
    src: "/assets/lounge-solid.webp",
    small: "/assets/lounge-solid-small.webp",
    width: 1448,
  },
  "/assets/lounge-supplied.png": {
    src: "/assets/lounge-solid.webp",
    small: "/assets/lounge-solid-small.webp",
    width: 1448,
  },
  "/assets/storefront.webp": {
    src: "/assets/storefront-wide.webp",
    small: "/assets/storefront-wide-small.webp",
    width: 2672,
  },
  "/assets/storefront-clear.webp": {
    src: "/assets/storefront-wide.webp",
    small: "/assets/storefront-wide-small.webp",
    width: 2672,
  },
  "/assets/storefront-blinds.webp": {
    src: "/assets/storefront-wide.webp",
    small: "/assets/storefront-wide-small.webp",
    width: 2672,
  },
  "/assets/storefront-shades.webp": {
    src: "/assets/storefront-wide.webp",
    small: "/assets/storefront-wide-small.webp",
    width: 2672,
  },
  "/assets/storefront-shades-original.png": {
    src: "/assets/storefront-wide.webp",
    small: "/assets/storefront-wide-small.webp",
    width: 2672,
  },
};

export function enhancedPhoto(src: string) {
  return roomPhotos[src as keyof typeof roomPhotos];
}
