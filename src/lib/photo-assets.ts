// Enhanced room images are versioned separately; the original uploads remain
// available to the editor and existing content records keep their references.
const roomPhotos = {
  "/assets/bar.webp": {
    src: "/assets/bar-rich.webp",
    small: "/assets/bar-rich-small.webp",
    width: 1448,
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
    src: "/assets/record-shop-rich.webp",
    small: "/assets/record-shop-rich-small.webp",
    width: 1672,
  },
  "/assets/storefront.webp": {
    src: "/assets/storefront-rich.webp",
    small: "/assets/storefront-rich-small.webp",
    width: 1452,
  },
};

export function enhancedPhoto(src: string) {
  return roomPhotos[src as keyof typeof roomPhotos];
}
