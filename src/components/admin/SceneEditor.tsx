"use client";

import type { SiteContent } from "@/lib/types";
import { Field, ImageField, Panel } from "./Controls";

type Update = (mutate: (draft: SiteContent) => void) => void;

// The site is one scrolling page of untouched photographs, so the only
// scene setting left is the storefront photo at the top of the page.
// Each section's own photo is edited with its page.
export default function SceneEditor({
  content,
  update,
}: {
  content: SiteContent;
  update: Update;
}) {
  const scene = content.scenes.exterior;
  return (
    <Panel
      title="Top-of-page photo"
      description="The first photo visitors see. It is shown whole, exactly as uploaded: no cropping, filters or anything on top of it."
    >
      <ImageField
        label="Storefront photograph"
        value={scene.image}
        onChange={(v) =>
          update((d) => {
            d.scenes.exterior.image = v;
            const home = d.pages.find((p) => p.id === "home");
            if (home) home.image = v;
          })
        }
      />
      <Field
        label="Describe this photograph"
        value={scene.alt}
        onChange={(v) =>
          update((d) => {
            d.scenes.exterior.alt = v;
            const home = d.pages.find((p) => p.id === "home");
            if (home) home.imageAlt = v;
          })
        }
        help="Read aloud to visitors who cannot see the image, and used by search engines."
      />
    </Panel>
  );
}
