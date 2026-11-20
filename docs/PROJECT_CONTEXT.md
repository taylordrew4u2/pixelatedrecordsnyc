# Pixelated Records: current project brief

Reconciled November 12, 2026 from the owner's shared **Branch · Write Website Prompt** conversation, from the initial brief through the latest three supplied room photos. Later corrections take precedence over earlier concepts. This document records requirements and evidence, not a claim that every feature is currently deployed.

## Project and priorities

- Repository: `taylordrew4u2/pixelatedrecordsnyc`.
- Live site: https://pixelatedrecordsnyc.netlify.app/.
- Highest priorities: exceptional aesthetics and effortless navigation, especially on phones. The experience is a photographic POV visit to the real record store, bar, and event space.
- Preserve the venue's actual layout, architecture, signage, artwork, furniture, and official logos. Do not mirror the room or invent venue information.
- Correct orientation: records LEFT, DJ booth AHEAD, bar RIGHT. The initial spoken directions were corrected.
- Netlify Free replaced the original Vercel target with owner approval. No paid services, trials, add-ons, or automatic overages. Online records/merchandise commerce remains deferred.

## Current direction (November 13, 2026, owner blueprint) — supersedes everything below

The owner supplied a three-part blueprint (Website Specification, Visual Website Blueprint, Mobile Website Blueprint). Build to it:

- **One page, eight anchors in this order:** `#home` (exterior), `#records`, `#bar`, `#events`, `#calendar`, `#book`, `#about`, `#contact`. Fixed navigation: Records · Bar · Events · Calendar · Book an Event · About · Contact (active section highlighted). Phones: compact header with MENU opening a full-screen list that closes on selection. Old page URLs redirect to their section (`src/lib/sections.ts`); event pages stay.
- **Full-screen photo sections** with a dark text panel and red actions, as in the wireframes. Photo files are never edited; CSS `object-fit: cover` only chooses the visible area. No filters, effects or decorations.
- **Bar:** "Full bar. Happy hour from 3 to 9." with specials $5 margaritas, $7 well drinks, $7 shot and beer (admin: Bar menu → Happy hour). View full menu opens a full-screen overlay.
- **Events** ends in a full-width red "Explore upcoming events" bar linking to `#calendar`.
- **Calendar:** horizontal flyer lineup of upcoming published events, soonest first, uncropped 4:5 frames, swipe plus prev/next arrows; flyers open their event page (owner's choice). Empty state links to Instagram.
- **Book an Event:** main-floor photo; the button opens the existing Google Form (owner's choice, Settings → booking URL). Copy lives on the `book` page.
- **Accent:** pixelated logo red `#ff0a05` (owner, November 18, 2026; replaces the blueprint lime `#dcf55d`, which saved content now maps to red).
- **Header logo:** only the PIXELATED wordmark (`public/assets/logo-pixelated.png`, cropped from `logo-light.png`), without the small red RECORDS banner, at 190px desktop / 150px phone (owner, November 18, 2026). Footer and other uses keep the full logo.
- November 18, 2026 design pass (owner approved "all"): small red "Records · Bar · Events ↓" cue at the foot of the storefront; Records gets a "Visit the shop" action to Contact; happy-hour specials are outlined labels, not button-like boxes; Calendar hides its arrows when everything fits, shows "Event details" as an outlined button and adds an Instagram card when fewer than four events are listed; Contact has an Instagram button beside Get directions; section kickers removed for consistency; UI labels use Barlow Condensed (two typefaces: DM Sans + Barlow Condensed); footer links are 16px with 44px targets. Real weekly hours are still needed from the owner (admin: Location → hours).
- November 18, 2026 desktop pass (owner approved): from 961px the header is 76px with a 230px wordmark, 17px nav links and "Book an Event" as an outlined red button; section actions sit inside the dark panel at 56px/20px (Events keeps its full-width bar); happy-hour labels 16px; Calendar flyers 300–380px and centred when they all fit; Contact is an even, top-aligned split with a 420px-min map; footer text 14px. From 1600px panels widen to 680px. Phone layout unchanged.
- November 18, 2026 (owner: "make sure in admin they're able to customize everything — colors, fonts, everything" and "sizes of boxes and containers"): Studio → Appearance now drives the one-page design. Colors: accent, button text (automatic contrast unless set), text, header/menus/text boxes, Calendar/Contact background. Fonts: separate heading, body and button/label fonts from ten bundled typefaces (`src/lib/theme.ts`). Corners: square, soft or pill for buttons and boxes (edge-to-edge phone bars stay square). Sizes: text box width, inside spacing, heading, text and button size, flyer width, logo width, each with limits and a reset; unset values keep the designed defaults. A "Reset look" button restores the Pixelated defaults without touching logos or text. Text boxes now use the brand black `#181614` from the Appearance setting.
- November 18, 2026 (owner): Studio offers a guided tour once after sign-in ("Want a quick tour?"), restartable from "Guided tour" at the bottom of the Studio menu. Twelve steps open each Studio area in turn with plain how-to bullets and a light joke (`src/components/admin/SetupGuide.tsx`). It is optional and never blocks editing.
- November 18, 2026 (owner, explicit): the Studio password is fixed in code as the word "weed" (`adminPasswordHash()` in `src/lib/server/config.ts`); the `ADMIN_PASSWORD_HASH` environment variable is ignored outside automated tests. This supersedes the earlier "private hashed password" requirement. `SESSION_SECRET` still comes from the hosting environment. The owner was warned that anyone who guesses the word can edit the site; the sign-in throttle and version history remain.
- November 19, 2026 polish pass (owner: "polish"): event pages and their booking strip now match the one-page design (theme fonts, colours, sizes, 44px targets, full width); buttons, arrows and flyers get short hover/press feedback, off under reduced motion; desktop Calendar cards line up under the heading at 320–430px; tablets cap flyers at 46vw; the desktop Contact map fills the section height; footer text is 14px everywhere.
- November 20, 2026 device pass (owner: "everything perfect, down to what pictures are used where and the view on all devices"): on portrait phones and upright tablets the Records section shows the real portrait photo of the vinyl bins (`record-bins`) instead of a narrow middle strip of the wide shop photo, which hid the records (`portraitPhoto()` in `src/lib/photo-assets.ts`; owner uploads are never swapped). Each section photo has its own crop centre so the subject stays in view. Calendar and Contact supporting copy matches the section text size. Upright tablets get larger headings, text and padding. Phones held sideways get a compact text box on the left so most of the photo shows, and the storefront crop keeps the awning in view. Event pages show the flyer at its own shape with no grey filler bars.
- November 20, 2026 (owner: "keep polishing, check desktop live too"): from 961px to 1200px (small laptops, tablets held sideways) the header wordmark is 170px with tighter link spacing, so the logo no longer crowds the links. Calendar flyers sit on a true black mat.
- Vertical scroll snap was removed on November 18, 2026 (owner: the page was "glitching and snapping" in some browsers). Sections still fill the screen; anchors land below the fixed header (58px phones, 76px from 961px). Smooth scrolling is off under reduced motion.

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

- November 12, 2026 (owner): desktop must show the entire storefront. `storefront-wide.webp` (2672×1432) is the real photo, untouched in the centre, with neighbouring buildings extended on both sides by AI outpainting (Canva) and softened toward the edges; the storefront sits exactly centred. Street View (Sept 2024) shows a tall tan ornate brick apartment building with a corner Deli & Grill on one side and brick buildings on the other; the extended sides are approximate, and an invented "790" door number was removed. `storefront-wide-sky-mask.webp` keeps the live sky across the full width. The page scales it to fill the screen, cropping at most ~6% of the height; ultra-wide screens show plain bands at the sides.
- November 12, 2026 (owner): colours must be bold and consistent across the whole site and every photo. One red (logo red `#FF0A05`), one yellow (`#FFC400`), one cream (`#F2ECDF`), one black (`#181614`). Saturated reds and bright yellows in photos are shifted to those exact hues at full saturation (shading kept); brick, wood, gold frames and burgundy wallpaper are left alone. CSS and per-photo accent colours use the same values.
- November 12, 2026 (owner): when no event is on tonight, the header says "Good vibes happening now" (linking to Events) instead of "See tonight's events".

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

- November 12, 2026 (owner): Inside on phones was hard to read. It now has a solid bottom dock with three identical room buttons (Record shop, DJ booth, Bar), a small "Swipe to look around" pill with arrows just above it, and a rounded Leave button at the top left. Landscape phones use the one-row header and a compact dock.
- November 12, 2026 (owner): 40 events from the owner's 50 flyers were added through the admin content API as published, editable events with their flyer images (past events from July 25 to November 11, plus the flyered upcoming dates November 12, 13, 14 and 28). Weekly flyers without a date (Open Decks, Soultek Sundays, undated Bad Decisions), the hiring post and duplicate flyers were skipped. Where a flyer printed no end time, the end was set to two hours after the start; these are editable in admin.

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
