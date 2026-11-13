// Every photo is shown exactly as supplied: no retouching, colour changes,
// stitching or AI extension. Earlier edited variants that saved content may
// still reference resolve back to the untouched original. `small` is only a
// downscaled copy of the same original for phones.
const original = (name: string, width = 1920) => ({
  src: `/assets/${name}.webp`,
  small: `/assets/${name}-small.webp`,
  width,
});
const storefront = original("storefront");
const roomPhotos = {
  "/assets/bar.webp": original("bar"),
  "/assets/bar-rich.webp": original("bar"),
  "/assets/interior.webp": original("interior"),
  "/assets/interior-rich.webp": original("interior"),
  "/assets/dj-booth.webp": original("dj-booth"),
  "/assets/dj-booth-rich.webp": original("dj-booth"),
  "/assets/record-shop.webp": original("record-shop"),
  "/assets/record-shop-rich.webp": original("record-shop"),
  "/assets/record-bins.webp": original("record-bins", 1080),
  "/assets/sticker-door.webp": original("sticker-door"),
  "/assets/shop-window.webp": original("shop-window"),
  "/assets/bar-room-wide.webp": original("shop-window"),
  "/assets/storefront.webp": storefront,
  "/assets/storefront-real.webp": storefront,
  "/assets/storefront-rich.webp": storefront,
  "/assets/storefront-clear.webp": storefront,
  "/assets/storefront-blinds.webp": storefront,
  "/assets/storefront-shades.webp": storefront,
  "/assets/storefront-shades-original.png": storefront,
};

export function enhancedPhoto(src: string) {
  return roomPhotos[src as keyof typeof roomPhotos];
}
