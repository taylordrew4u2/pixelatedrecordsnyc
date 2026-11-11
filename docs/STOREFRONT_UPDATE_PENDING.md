# Storefront window navigation — pending publication

Prepared November 10, 2026 (New York time).

## Requested behavior

- Hide the objects and reflections in the storefront windows with opaque dark glass panels.
- Place the existing interior destination links in those panes: Record shop and DJ booth on the left, Bar on the right.
- Give the front door a clear two-line invitation: “Click here to” / the editable existing entry label (“Come in”).
- Preserve the current full-screen photo, subtle light animation, reduced-motion setting, destination visibility rules, and editable hotspot destinations.
- On portrait screens, the photo crops the windows; show the same destination links once beneath the door, with the window links hidden to avoid duplicates.

## Implementation

Changes are limited to src/components/PublicExperience.tsx and src/app/pov-theme.css.
The glass is a CSS layer over the existing image; the source photo has not changed.
Window positions still come from the editable scene masks. A 6% lower edge allowance covers the full glass below the former light mask.

## Validation and limitation

- Source and CSS reviewed against existing Scene, Home, link visibility, and theme code.
- Static HTML/CSS previews use the actual three application stylesheets and the current storefront image.
- Desktop preview (1440 × 900): https://hcti.io/v1/image/01a1c895-88d0-753a-954d-f18725252442.png
- Earlier portrait layout preview (390 × 844): https://hcti.io/v1/image/01a1c894-84db-7d08-a6e1-5e80e2465306.png
- These are design previews, not screenshots of a published change.
- Compilation, TypeScript, interactive browser checks, and production deployment remain pending because the execution environment is unavailable and the connected Desktop Commander devices are offline.
- main and the live Netlify deployment are unchanged.

## Resume

1. Check out this branch, install dependencies if necessary, and read AGENTS.md.
2. Run the formatter, TypeScript/build checks, and relevant existing public UI tests.
3. Verify all window links, the entry sign, visibility settings, reduced-motion behavior, and portrait navigation.
4. Merge the verified change and deploy the existing Netlify site 667e255c-e67d-4691-b0c4-66cc71a5f2f1 with the complete Next.js adapter build.
5. Preserve existing deploy-scoped, Functions-only masked admin secrets and the existing Netlify Blobs namespace. Do not change credentials, pricing plan, or badge settings.
6. Verify the published page before reporting it live.
