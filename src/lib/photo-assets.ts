// Enhanced room images are versioned separately; the original uploads remain
// available to the editor and existing content records keep their references.
const roomPhotos = {
  "/assets/bar.webp": {
    src: "/assets/bar-supplied.jpg",
    small: "/assets/bar-supplied-small.jpg",
    width: 1800,
  },
  "/assets/interior.webp": {
    src: "/assets/interior-rich.webp",
    small: "/assets/interior-rich-small.webp",
    width: 1448,
  },
  "/assets/dj-booth.webp": {
    src: "/assets/dj-booth-rich.webp",
    small: "/assets/dj-booth-rich-small.webp",
    width: 1448,
  },
  "/assets/record-shop.webp": {
    src: "/assets/records-supplied.jpg",
    small: "/assets/records-supplied-small.jpg",
    width: 2400,
  },
  "/assets/shop-window.webp": {
    src: "/assets/lounge-supplied.png",
    small: "/assets/lounge-supplied-small.jpg",
    width: 1448,
  },
  "/assets/storefront.webp": {
    src: "/assets/storefront-shades-original.png",
    small: "/assets/storefront-shades-original-small.jpg",
    width: 1452,
  },
  "/assets/storefront-clear.webp": {
    src: "/assets/storefront-shades-original.png",
    small: "/assets/storefront-shades-original-small.jpg",
    width: 1452,
  },
  "/assets/storefront-blinds.webp": {
    src: "/assets/storefront-shades-original.png",
    small: "/assets/storefront-shades-original-small.jpg",
    width: 1452,
  },
  "/assets/storefront-shades.webp": {
    src: "/assets/storefront-shades-original.png",
    small: "/assets/storefront-shades-original-small.jpg",
    width: 1452,
  },
};

export function enhancedPhoto(src: string) {
  return roomPhotos[src as keyof typeof roomPhotos];
}
