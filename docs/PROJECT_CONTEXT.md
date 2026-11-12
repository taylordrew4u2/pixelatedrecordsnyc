# Pixelated Records: current project brief

Reconciled November 12, 2026 from the owner's shared **Branch · Write Website Prompt** conversation, from the initial brief through the latest three supplied room photos. Later corrections take precedence over earlier concepts. This document records requirements and evidence, not a claim that every feature is currently deployed.

## Project and priorities

- Repository: `taylordrew4u2/pixelatedrecordsnyc`.
- Live site: https://pixelatedrecordsnyc.netlify.app/.
- Highest priorities: exceptional aesthetics and effortless navigation, especially on phones. The experience is a photographic POV visit to the real record store, bar, and event space.
- Preserve the venue's actual layout, architecture, signage, artwork, furniture, and official logos. Do not mirror the room or invent venue information.
- Correct orientation: records LEFT, DJ booth AHEAD, bar RIGHT. The initial spoken directions were corrected.
- Netlify Free replaced the original Vercel target with owner approval. No paid services, trials, add-ons, or automatic overages. Online records/merchandise commerce remains deferred.

## Latest visual decisions

- Every page should use the photograph as the background in the space between the header and footer. Preserve the full-screen photo layout introduced late in the conversation; do not revert to the earlier split-panel design.
- Use the expanded street-view storefront on mobile, including touch-device landscape: more sky, sidewalk, curb, and street. Do not revert to the close-up desktop crop on phones.
- Preserve high-quality source images and responsive delivery. The owner's latest request explicitly rejected a soft/low-resolution storefront. A larger file or upscaled dimensions alone do not establish additional real detail.
- The expanded street surroundings are an approximation: the earlier chat found the venue's Maps listing but could not inspect Street View through Google's verification challenge. Do not describe those generated surroundings as fully verified.
- Keep the cleaned patio, level awning, matching window geometry, and smooth black shades. Striped blinds were rejected after the earlier approval.
- Remove window navigation buttons. Use one small, readable "Come in" action away from the door; the later off-door correction supersedes both the original on-door button and the intermediate speech bubble. Avoid duplicate links and oversized entrance signs.
- Use solid, slim header/footer backgrounds and readable text with sufficient contrast/backplates. Avoid chunky boxes, faded photo overlays, tiny mobile text, clipped controls, and large empty gaps.
- All interface blacks match the editable `#181614` brand value. Other text/accent colors should be cohesive with the photographs; the owner requested exact photo-color matching. Preserve natural photo contrast.
- Keep the Netlify badge absent without enabling a paid plan. Existing nonce-based CSP must remain intact.
- The sky changes with Ridgewood/New York's actual daylight, sunrise/sunset, and night. Keep the expanded mobile sky mask aligned with the mobile photograph. Gentle window lighting is decorative; respect reduced motion and never autoplay audio.

- November 12, 2026 (owner): the desktop storefront is the real photograph (`storefront-real.webp`, 1920px) with photographic edits only: roller shades lowered behind the glass, wet sidewalk splotches cleaned, colour graded. It replaces the AI-edited 1452px image, which looked stretched and artificial on large screens. A matching `storefront-real-sky-mask.webp` keeps the live New York sky. Phones keep the expanded street image.
- November 12, 2026 (owner): every black must read as one solid colour in every photo. All site photos are served as `*-solid.webp` versions whose near-neutral dark tones (and blue-tinted reflections on black surfaces) are unified to the brand black `#181614`, keeping only fine texture. Saturated colours are untouched. Originals remain in `public/assets/`.

## Navigation and interactions

- Immediately accessible logo-to-home and hamburger menu labeled Menu on every page.
- Menu destinations: Bar, Events, Calendar, About Us, Records, Location. Direct URLs, refresh, Browser Back, and back-to-room links must work.
- Interior supports horizontal panning/swiping, mouse dragging, arrow buttons, and keyboard navigation when needed. Keep the Bar link reachable even when the bar is outside the photo crop. Include an explicit Leave action returning home.
- Mobile drinks action must be large and obvious: the implemented target is a full-width, 72px-tall button with a menu icon, label, and pressed feedback. Optional brief vibration only where supported; do not promise physical haptics on all browsers.
- Superseded November 12, 2026 (owner request): on the default bar photograph, the gilded picture frame in the middle of the back wall is itself the drinks button, labeled "Bar Menu". The photo and button share one cover-sized stage that keeps the frame centered in view on portrait phones, landscape phones, and desktop; the Back link and page title move below the frame on portrait screens. If the owner replaces the bar photo in admin, the full-width bottom button returns automatically because the frame position only matches the supplied photo.
- Bar menu opens as readable HTML in a dialog. No pinch-to-zoom requirement.
- Keep controls comfortably tappable, keyboard accessible, and readable; use clear focus, Escape-to-close, and focus return for dialogs. Avoid whole-page horizontal overflow.

- November 12, 2026 (owner): the header was cluttered. It is now one calm row: logo, a single-line link "● TONIGHT · <event or See tonight's events> ›" with the live New York time in muted text, and Menu. No boxed panel or divider. On phones the tonight line sits on a second row under the logo and Menu.
- November 12, 2026 (owner): every background photo that is cropped on a phone can be slid side to side with a horizontal drag (Bar, DJ booth, Record shop, Events, Calendar, About, Location; Inside already pans). Vertical scrolling, taps and horizontal carousels are unaffected. On the Bar page the "Bar Menu" frame button slides with the photo. A short "Drag to look around" hint shows on first view and fades after 4 seconds or the first drag.

## Events, booking, and location

- Booth shows Events and Book the venue, plus the requested horizontal poster-style upcoming-events carousel. Do not omit the booth carousel merely because the separate Events page has one.
- Both Events links lead to the same page: "What's happening tonight" first, upcoming flyers directly below, soonest first. Essential titles/dates/times are text outside the flyers.
- Carousel supports touch, keyboard, and visible previous/next controls, without autoplay or hijacking vertical scrolling.
- Header shows local current time, tonight's event name and start time, and a clickable route to the event/flyer or Events page. "Live now" applies only during an actual published event. Do not invent an event when the collection is empty.
- Use one event collection across header, booth, tonight, upcoming, Calendar, and event details. Respect America/New_York, explicit end times, ongoing events after midnight, multiple events, cancellation, sold-out status, and private drafts.
- Calendar is a separate menu destination with month navigation, Today, event details, and a readable mobile agenda.
- Every booking button uses one editable setting, initially https://forms.gle/zDBZYAVFogu758nf8. No pretend booking confirmations.
- Location includes the confirmed venue address, hours when supplied, special hours/closures, accurate map/directions, and contact/social links. Directions should open with the destination filled in; retain a readable address/link if the map fails.
- Record shop offers About Us and Records. Records remains an editable coming-soon page with a physical-shop/location link. Do not add inventory, checkout, or payments without a new request.

## Supplied content and assets

The original `WEBSITE PICS.zip` supplied 15 venue photos. Original primary assignments were storefront `IMG_2450.jpg`, interior `IMG_1251.jpeg`, booth `IMG_1234.jpeg`, bar `IMG_1254.jpeg`, record shop `IMG_7288.jpg`, and door detail `IMG_1286.jpeg`. Later approved edits and replacements supersede the corresponding defaults; retain originals.

`LOGO.zip` supplied the official white and black transparent wordmarks and compact P mark. Preserve their artwork, colors, and proportions. Pixelated Comedy branding belongs only with relevant comedy content.

| Latest supplied/recovered asset | Use | Workspace original |
| --- | --- | --- |
| `06_Bar(1).jpg` | Bar photograph | `images/bar.jpg` |
| `Polished record lounge with disco ball.png` | Lounge/About photograph | `images/lounge.png` |
| `04_Record_Display_2x.jpg` | Record-display/shop photograph | `images/records.jpg` |
| Approved smooth-shade storefront | Desktop storefront | `images/storefront.png` |
| Approved expanded street storefront | Mobile storefront | `images/storefront-mobile.png` |

Five full-size files in `public/assets/` (`bar-supplied.jpg`, `records-supplied.jpg`, `lounge-supplied.png`, `storefront-shades-original.png`, `storefront-street-mobile-original.png`) were once committed truncated at ~768 KB. The owner re-supplied intact originals on November 12, 2026, and the site serves them at full resolution again. Before committing image assets, confirm each file decodes completely.

Versioned web assets are in `public/assets/`; mappings are in `src/lib/photo-assets.ts`. Keep custom owner-uploaded replacements owner-controlled.

The owner supplied **Pixelated Records Menu - as of 10.26.2026.pdf** later in the chat. The preceding assistant reported publishing its prices, ingredients, and extras. `src/lib/drink-menu.ts` contains the dated transcription and editable defaults. Therefore older notes saying the drinks menu has not been supplied are obsolete. Preserve subsequent admin edits instead of overwriting them with seed data. Confirmed weekly hours and dated events remain unresolved in the reviewed conversation; check current published content before calling them missing.

## Administration and persistence

- `/admin` is reached by typing its URL; no public Admin button or navigation entry.
- Everything routinely editable through simple phone/desktop controls: pages, navigation, copy, SEO/sharing, media/logos, scene targets and masks, appearance, events/flyers, menu/prices, About, Records, location/hours, social links, and booking destination.
- Keep private draft, Preview, Publish, save/publish status, unsaved-change warnings, undo/restore, archive, and image upload/replacement. Routine editing must not require code, JSON, or GitHub.
- Server-side authentication, protected sessions, write authorization, throttling, durable Netlify Blobs persistence, revision conflict handling, and private draft/media behavior remain required. Edits must survive refresh, logout, deployments, and other devices.
- Keep existing credentials private. Do not copy the shared chat's password, token, or other secret values into documentation or source control.

## Publishing authorization and current evidence

- The owner explicitly approved reusing the **existing admin password hash and session secret in Netlify for this and future updates to this same site**. Do not request that same permission again solely because a new update is being published.
- That authorization does not mean the values are available in a new workspace. Existing production secrets are deploy-scoped, masked, and Functions-only; ordinary project settings do not contain them. See `PUBLISHING.md`. Preserve the credentials; do not rotate them or deploy without them as a workaround.
- Netlify is deployed through the CLI; a GitHub commit or PR is not evidence of live publication. The chat reports a connection timeout during the live-header upload, followed by unfinished storefront-quality and room-photo work.
- The recovered photo changes are in draft PR #1, branch `finish-supplied-photos`, commit `7e5dc6c4e3e31d6e16912386947ebf384e83d08b`. The production build, typecheck, and tests passed in GitHub Actions run `43284742774`. This verifies that source revision, not a production deployment or physical touch-device behavior.
- The source already contains the full-screen photo layout, expanded mobile source selection, large drinks action, and event-header logic. Preserve them while finishing the photo work. Check the live site separately before claiming those features are all live.
- Next steps are safe deployment with the existing credentials, then rendered desktop/mobile checks of the complete requested experience. Do not reduce the remaining scope to photos alone.

## Deployment update (November 12, 2026)

- Standing owner instruction: always merge finished work to `main` and deploy it to production.
- With owner approval, a new admin password and session secret replaced the old deploy-scoped values. `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` are now stored as secret, Functions-only, production-context Netlify environment variables, so production deploys no longer need `--secret-env` flags. The password itself was given to the owner directly and is not recorded here.
- Netlify uploaded/API builds did not apply the Next.js adapter automatically (deploy `6af61bddb43ea669e0549fe8` had no functions and returned 404 everywhere for a few minutes). `netlify.toml` now declares `@netlify/plugin-nextjs` (pinned in devDependencies). Production deploy `6af6339cb231d596057894f3` restored the site; all public routes return 200, anonymous admin content returns 401, and admin login/read/logout return 200.

## SEO and completion

Improve public copy and metadata throughout: distinct useful page titles/descriptions, canonicals, social images, sitemap, and appropriate business/event structured data using confirmed facts. Target the venue's record store, bar, vinyl, events, and venue-booking relevance in Ridgewood, Queens without keyword stuffing or fabricated search-volume claims. Paid VibeSEO research was unavailable; it is not a prerequisite for ordinary copy/metadata improvements.

Build/tests are only part of verification. Before calling the update complete, check desktop, narrow portrait phones, landscape, entry/Leave, pan edges/Bar access, drinks dialog, header event links, booth carousel, Calendar, booking, directions, reduced motion, and admin persistence/privacy. Report exactly what was tested and what remains blocked.
