# Storefront, readability, and events update

Prepared November 11, 2026.

## Requested behavior implemented

- The homepage source image has been edited: empty matching charcoal windows, matching center mullions, aligned top edges and sills, and a level awning.
- The original and intermediate source images remain available; `photo-assets.ts` resolves the existing storefront reference to versioned final WebP assets.
- The homepage has no window destination links or duplicate mobile room links. Mobile preserves the complete storefront. The audit update places it directly below the header without a forced vertical-centering gap.
- The entrance is one understated, underlined “Come in” link in a solid brand-black strip below the photograph. It keeps the editable entrance label and a minimum 44px tap target; nothing is positioned on the door or windows.
- The homepage sky changes with the sun’s altitude over New York City, refreshed every 30 seconds: original blue sky by day, warm sunrise/sunset, brand-black sky with subtle stars at night. The photograph itself is not dimmed.
- Inside has an explicit “Leave” link to home, separate from the pannable photo and reachable on desktop and phones.
- Window-light animation and its control have been removed. The rejected slogan has been removed from seed content, the appearance preview, and published site content.
- The interface uses one shared brand black, `#181614`, for backgrounds, black text, controls, and borders instead of competing near-black colors. The brand color remains editable in Studio.
- On phones, the inside photo can be swiped horizontally to reveal either edge, with mouse dragging, arrow buttons and keyboard alternatives. Room links stay outside the moving photo. Other scene photos retain their natural proportions; menus and longer pages can scroll.
- Header and footer use solid charcoal backgrounds. Photo labels and controls have opaque backplates, and photographs have no faded overlay.
- Public navigation and footer do not advertise Admin; direct `/admin` access remains authenticated.
- The booth includes Tonight followed by the same chronological poster carousel as Events. Posters preserve their complete artwork. Touch scrolling, keyboard arrows, and previous/next buttons are supported; there is no autoplay.

## Original brief audit

| Requirement                                        | Implementation / content status                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Records left, booth ahead, bar right               | Shared editable interior room hotspots; homepage uses a single entrance                          |
| Phone storefront preserves sign, entrance, windows | Full image fit and one entrance link below the photo                                             |
| Shared Events destination                          | Booth and menu link to `/events`; booth also embeds the same collection                          |
| Tonight, then upcoming posters                     | Same event selectors and cards on both pages; private fixtures verify ordering and hidden drafts |
| Calendar and event details                         | Existing shared collection and dated calendar retained                                           |
| Booking form                                       | Shared editable Google Form URL retained                                                         |
| Location, map, directions                          | Existing venue address and map retained; confirmed hours still needed                            |
| Solid readable navigation and footer               | Opaque surfaces on desktop and phones                                                            |
| Direct-only admin                                  | No public link; server authentication retained                                                   |
| No fictional business content                      | No live test events, invented hours, or prices added                                             |
| Free hosting and persistent content                | Existing Netlify site and storage namespace retained                                             |

## Validation

All 49 tests passed after the sky, entrance and exit update. The exterior check verifies one editable entrance outside the photograph, and an inside check verifies Leave returns to home. Sky tests cover dawn/day/dusk/night, seasonal changes, equivalent instants across time zones, DST, and uploaded-image fallback. Live visual verification and deployment confirmation are recorded in BUILD_STATUS.md.

## Content still needed

The published event collection is empty. The owner must supply or enter real dates and flyers before actual posters appear. Confirmed weekly hours and bar items/prices also remain unsupplied.

## Sky asset and calculation

`public/assets/storefront-sky-mask.webp` is an alpha mask generated with the built-in image editor from `storefront-clear.webp`, then converted to WebP (74,556 bytes). Only the mask’s alpha is used: the displayed storefront pixels still come from the existing photo. The original blue-sky texture is retained as the daytime background. Replacement uploads bypass this asset-specific mask.

Edit prompt: remove only the blue sky/clouds to true transparency; preserve full framing, neighboring buildings, pole, awning/lettering, matching empty windows, stickers, plants, furniture and pavement. Do not crop, change lighting or invent objects. The output is used as a precision mask over the original.

SunCalc 2.1.4 calculates apparent altitude in degrees at fixed New York City coordinates 40.7167, -74.0167, sourced from NOAA’s solar calculator (whose legacy longitude is west-positive). Absolute timestamps avoid visitor-time-zone and DST offsets. Layer opacity interpolates between civil night (-6°), the horizon and daytime (+6°); no weather service, location permission or paid API is involved.

- https://github.com/mourner/suncalc
- https://gml.noaa.gov/grad/solcalc/sunrise.html

## Patio and blind edit (published November 11, 2026)

The owner requested clean patio paving and glass windows backed by matching closed black blinds. Built-in Image Generator edited `storefront-clear.webp` with those two localized changes, preserving the storefront, furniture, railing, sign, door and framing. The result is saved as `public/assets/storefront-blinds.webp` (1452 × 1083) and `public/assets/storefront-blinds-small.webp` (960px wide). Original assets remain untouched. The aligned sky mask is retained. Both current and previous storefront references resolve to this version.

Prompt summary: remove dark ground stains while retaining paving texture and furniture shadows; add matching closed black horizontal Venetian blinds behind both glass panes, with subtle reflections and no visible interior; preserve all other objects, lettering, composition, exposure and sky. WebP conversion and responsive resizing use Sharp; the image edit itself uses the built-in image tool.

## Window treatment revision (awaiting production approval)

The owner rejected the horizontal Venetian blinds. A second built-in Image Generator edit replaces only the glass-pane treatment with understated matte-black roller shades and very faint reflections, removing the horizontal slats and prominent repeated tree reflections. The clean paving is retained. The prompt specified preserving the storefront, sign, sky, plants, door, furniture, railing and framing.

The 1452 × 1083 source was converted with Sharp to `public/assets/storefront-shades.webp` and the 960px responsive `public/assets/storefront-shades-small.webp`. Existing storefront, clear-window and Venetian-blind references resolve to this version; the aligned sky mask is retained. The earlier files remain available. Eight targeted SEO/sky tests, TypeScript and whitespace checks pass.

Automatic approval review blocked the new production deploy, interpreting the prior secret-transfer approval as limited to the preceding release. The photo-only preview `6af4b074caab019ed2abb552` reached ready; the homepage and both responsive assets returned 200, both assets matched local bytes, admin authentication remained unconfigured, and a desktop browser check showed the new shades. Its post-deploy warmup attempted a malformed branch-derived host and was blocked, without affecting the already-ready preview. The next preview uses a slash-free local branch and matching alias. The currently published photo remains unchanged.

The owner subsequently requested mobile readability and spacing fixes. These retain the full storefront and reveal its existing editable introduction on phones, with a legible 18px entrance beneath it. Shared phone labels/body copy use 16px text, footer/pan copy uses 14px, and sections use 28px vertical padding. Empty main-height spacers are removed from the interior/content pages. The mobile controls, footer and photo remain in document flow; no window/door buttons were added. Full regression tests (55) and TypeScript pass.

The combined final preview is https://mobile-window-review--pixelatedrecordsnyc.netlify.app/ (`6af4b4f8fdaeb08e2615c335`). Full build/deploy completed successfully. Browser verification confirmed compact mobile flow, 16–18px main text and controls, zero horizontal page overflow, readable stacked bar-menu content, and left-aligned event headings. The final production deployment remains blocked pending approval to reuse the existing admin secrets.
