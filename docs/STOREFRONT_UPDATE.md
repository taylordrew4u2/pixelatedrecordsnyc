# Storefront, readability, and events update

Prepared November 11, 2026.

## Requested behavior implemented

- The homepage source image has been edited: empty matching charcoal windows, matching center mullions, aligned top edges and sills, and a level awning.
- The original and intermediate source images remain available; `photo-assets.ts` resolves the existing storefront reference to versioned final WebP assets.
- Desktop window links use the existing interior destinations. Mobile preserves the full storefront and shows one set of room links below the entrance.
- The entrance reads “Click here to” / the editable entry label on an opaque cream sign.
- Window-light animation and its control have been removed. The rejected slogan has been removed from seed content, the appearance preview, and published site content.
- Header and footer use solid charcoal backgrounds. Photo labels and controls have opaque backplates, and photographs have no faded overlay.
- Public navigation and footer do not advertise Admin; direct `/admin` access remains authenticated.
- The booth includes Tonight followed by the same chronological poster carousel as Events. Posters preserve their complete artwork. Touch scrolling, keyboard arrows, and previous/next buttons are supported; there is no autoplay.

## Original brief audit

| Requirement | Implementation / content status |
| --- | --- |
| Records left, booth ahead, bar right | Shared editable room hotspots and storefront navigation |
| Phone storefront preserves sign, entrance, windows | Full image fit and separated mobile controls |
| Shared Events destination | Booth and menu link to `/events`; booth also embeds the same collection |
| Tonight, then upcoming posters | Same event selectors and cards on both pages; private fixtures verify ordering and hidden drafts |
| Calendar and event details | Existing shared collection and dated calendar retained |
| Booking form | Shared editable Google Form URL retained |
| Location, map, directions | Existing venue address and map retained; confirmed hours still needed |
| Solid readable navigation and footer | Opaque surfaces on desktop and phones |
| Direct-only admin | No public link; server authentication retained |
| No fictional business content | No live test events, invented hours, or prices added |
| Free hosting and persistent content | Existing Netlify site and storage namespace retained |

## Validation

Production build and TypeScript passed. All 44 tests passed. Live visual verification and deployment confirmation are recorded in BUILD_STATUS.md when complete.

## Content still needed

The published event collection is empty. The owner must supply or enter real dates and flyers before actual posters appear. Confirmed weekly hours and bar items/prices also remain unsupplied.
