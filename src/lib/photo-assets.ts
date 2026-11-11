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
};

export function enhancedPhoto(src: string) {
  return roomPhotos[src as keyof typeof roomPhotos];
}
