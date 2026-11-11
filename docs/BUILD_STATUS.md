# Build and verification status

## Pending mobile, SEO and badge update

The November 11 audit follow-up is implemented in source and is verified in deployment preview `6af4ab317e0efb465276f950` at https://6af4ab317e0efb465276f950--pixelatedrecordsnyc.netlify.app/. Production still runs `6af48b8e075ed0cb2606ec14`. Automatic approval review blocked production deployment because that command would re-send the existing admin password hash and session secret to Netlify. The production site, secrets, and stored content have not been changed by this update.

- Edited the storefront photo with clean paving and matching closed black blinds behind the glass; originals are retained.
- Removed forced vertical centering on the phone homepage; the full storefront follows the header and the entrance remains below it. Removed reserved badge spacing from footers.
- Added a nonce-based Content Security Policy. Next.js scripts receive a fresh nonce on every document; untrusted inline scripts, including the Netlify badge, are blocked. Public and admin pages use dynamic rendering. No paid plan or browser-only dismissal is involved.
- Added distinct local-search page titles/descriptions, canonical URLs, social metadata using the enhanced photos, and business JSON-LD on home/location. Unconfirmed hours, zero coordinates and empty contact fields are omitted.
- Upgraded only the untouched launch defaults when reading content, consistently in the editor and public pages. Custom SEO copy, images and notices remain intact. This does not overwrite storage or increment revisions.
- Made empty event/menu states explicit, with Instagram and visit links. Added responsive sources to the storefront and sky layer; the pannable interior retains full resolution.
- The preview check caught local-only development credentials being included by the Netlify adapter. They differ from production secrets. They have been moved to `.env.development.local`, and a deployment guard rejects runtime-readable env files containing admin credentials. The replacement preview is built without those credentials.
- All 55 tests, TypeScript, formatting and the production build pass. The full Netlify preview build/deploy completed with exit code 0. All ten public routes and `/admin` return 200; the private content API returns 401 anonymously. Document scripts carry matching request nonces, canonical URLs target the production site, and the home/location pages emit business structured data. Preview admin authentication is unconfigured, and no local environment file is bundled.

The actual browser verified the badge is absent on desktop and at 447px, with no badge iframe. On the 447px homepage the header ends and the full photo begins at y=72; the image is 333px tall and uses the 153,950-byte responsive asset. There is no horizontal page overflow. Home → Inside → Bar → menu dialog, and Back to room → Leave → Home work. Panning reached the right edge (385px), disabled the right arrow, and kept the Bar link reachable. The booth photo, Tonight notice, Instagram link and upcoming-events state remain readable. No physical touch device was tested.

## Live website

The website is public at https://pixelatedrecordsnyc.netlify.app. The owner approved public access and private admin credentials. The supplied venue photos and official logo remain in use. Records are on the left, the booth is ahead, and the bar is on the right. Booking uses the shared Google Form.

The November 11, 2026 update presents the storefront, interior, bar, booth and record shop as photographic POV scenes. Desktop views fill the viewport; phone layouts preserve photo proportions, place room links and action buttons below them, and allow vertical scrolling. The inside room now supports horizontal panning when the image is wider than the viewport. The bar menu opens in a native dialog rather than rendering an empty section beneath the photo. Headers and footers use slim opaque charcoal backgrounds. Scene controls use compact opaque backplates, and the entrance is an understated link below the full storefront photograph. The sky follows New York solar time, and the inside view has a visible Leave link to home. Public black surfaces and text share the editable brand value `#181614`. Hovering an action gently moves the view forward, except with reduced motion. Full-screen images now declare a full-viewport responsive size.

All five main room/storefront views use versioned AI-enhanced image assets with deeper blacks and clearer color. The latest storefront asset also has matching empty windows and aligned architectural edges. Their originals remain in the repository; `src/lib/photo-assets.ts` resolves existing content references to the enhanced files. Uploaded replacements remain owner-controlled. The image editor prompt requested color/detail correction, richer natural color, preserved composition and venue objects, and no haze, vignette or invented objects. Generated files were inspected before integration; these are enhanced depictions, not untouched originals. Additional detail photos remain unchanged. Scene label RGB samples in `src/lib/photo-colors.json` were updated to colors present in both enhanced image sizes.

## Deployment and credentials

Netlify Free is configured with persistent Netlify Blobs storage. No paid upgrade, trial, or automatic recharge was enabled. CLI production deployments use the full Next.js adapter lifecycle; do not upload the raw `.next` directory using `--no-build`.

Production admin credentials were successfully installed as **deploy-scoped, secret, Functions-only variables** using Netlify CLI `--secret-env`. They are masked by Netlify and are not included in the repository or public application. Site-level scope restrictions were unavailable on this Free plan. The deploy-specific secret route succeeded without broadening the credential scope. These two flags must be supplied on **every future production deploy**; see [PUBLISHING.md](PUBLISHING.md).

The site is deployed through the CLI. GitHub-triggered automatic deployments are not connected.

## Verification completed

The latest storefront/exit update is deployment `6af48b8e075ed0cb2606ec14` (November 11, 2026). The full production CLI lifecycle completed with exit code 0. “Come in” is now one editable, underlined link below the photograph, not over the door. The homepage fits the complete photograph on desktop and retains natural image proportions on phones. The sky follows New York solar altitude with day, sunrise/sunset and night layers; only the sky is replaced. Inside has an explicit Leave link to `/` above the photo on phones and in the upper-left on desktop.

All 49 tests, TypeScript, formatting, the production build and diff whitespace checks passed. Live desktop interaction and a 447px-wide browser pane both completed Home → Come in → Inside → Leave → Home. The mobile Leave target measured 89 × 44px. The right pan control reached the 385px image edge and disabled itself; the separate Bar link remained visible. No horizontal page overflow was measured at desktop or 447px. Resizing back to desktop restored the full photograph. The deployed mask matches the local asset byte-for-byte.

Live viewport screenshots verified 390 × 844 home and 320 × 568 inside. Controlled CSS-only preview captures verified the night sky at 1280 × 900 and sunset at 844 × 390; those previews did not change the production clock. The time-selection tests cover actual timestamps, seasons, time-zone equivalence and DST. Physical mobile touch hardware was not tested. Authentication and published content were not modified or re-tested in this update.

- [Live homepage, desktop](https://hcti.io/v1/image/01a1cb45-4d0f-7fb8-89c2-f6a561c60420.png)
- [Live homepage, phone](https://hcti.io/v1/image/01a1cb43-2502-78d8-98d7-a6bccc5a8eea.png)
- [Live inside with Leave, 320px](https://hcti.io/v1/image/01a1cb43-051f-7cb6-976a-b54d65fa21fb.png)
- [Controlled night preview](https://hcti.io/v1/image/01a1cb44-12b4-7205-8f12-3779af39dbf3.png)
- [Controlled sunset/landscape preview](https://hcti.io/v1/image/01a1cb43-ef38-751f-8d27-2a116b3527c8.png)

The preceding inside-room update is deployment `6af480e88aabdebe3a3c4990` (November 11, 2026). The production CLI completed successfully with exit code 0. The inside photo uses native horizontal touch/trackpad scrolling, mouse dragging, left/right buttons, and keyboard arrows/Home/End when the photo overflows. Phone room links remain outside the moving image, so Record shop, DJ booth and Bar are always reachable. Panning stops at both image edges; dragging does not activate scene links. The entrance and other room photos retain their previous layouts.

TypeScript, all 44 existing tests, formatting and the full production build passed. Live interaction checks in a 447px-wide browser pane verified the 444px pan range, right-button arrival at 444px with that button disabled, left-edge arrival with the left button disabled, a 285px drag without navigation, keyboard End reaching the right edge, and the fixed Bar link opening `/bar`. No horizontal page overflow was measured. Live touch-viewport captures at 320 × 568 and 390 × 844 show both pan arrows and the fixed room links; an 844 × 390 landscape capture shows the complete photo and room links. Real-device touch gestures were not directly exercised. An optional production admin-login recheck was blocked by automatic approval review because it could not confirm credential authorization; that check was not retried. This update changes no authentication code or credentials.

- [Swipeable inside view, 390px](https://hcti.io/v1/image/01a1cb19-f993-7675-837f-6ac2c11cf7b3.png)
- [Swipeable inside view, 320px](https://hcti.io/v1/image/01a1cb1a-3f3a-765d-b116-6232720577c6.png)
- [Inside, landscape](https://hcti.io/v1/image/01a1cb1a-1c20-748e-b389-5e672013f4d8.png)

The prior deployment warmup failure was traced to Netlify config constructing `DEPLOY_PRIME_URL` from the slash-containing local branch name; the Next.js adapter then fetched that malformed URL in `onSuccess`. Production config now explicitly sets this non-secret URL to the canonical site. This removes the unintended host request while retaining normal warmup and all security checks.

The preceding mobile and palette update was deployment `6af472b60ef1730a28c1a662` (November 11, 2026). Netlify independently confirmed `ready`, with publication at 13:52:19 UTC. The 92 × 44px entrance bubble has square corners, a stepped tail, and 17px condensed lettering. All public black surfaces, black text and room-control backgrounds now share `#181614`; the published brand color is revision 7. Photographs retain their natural tones.

The full production build, TypeScript checks, formatting checks and all 44 tests passed. Live desktop inspection measured `rgb(24, 22, 20)` on the page, header, footer, room controls and entrance text/border. No horizontal overflow or public Admin links appeared. The entrance opened `/inside`; the Bar link, menu dialog, and public navigation opened and closed successfully. Current-deployment anonymous admin access returned 401, and authenticated login/read/logout returned 200.

Live captures without injected styles verified the homepage and bar at 390 × 844, inside and booth at 320 × 568, inside in 844 × 390 landscape, and calendar at 320 × 568. Complete scene images and in-flow controls are visible, calendar controls wrap, and the footer stays below the content. Longer landscape and event pages scroll. The fixed Netlify badge remains enabled and may overlay content while scrolling; no badge modification or plan change was made.

The CLI reported the deployment live before automatic review blocked a subsequent connection to the unverified host `design`. That connection was not retried. The official Netlify connector and live site, rather than a clean CLI exit, establish deployment success.

Screenshot evidence:

- [Homepage, 390px](https://hcti.io/v1/image/01a1cae2-036c-7ca1-8740-5effc181537b.png)
- [Inside, 320px](https://hcti.io/v1/image/01a1cae1-dd74-7c10-83a0-03b1dbc01932.png)
- [Inside, landscape](https://hcti.io/v1/image/01a1cae2-2f2d-73b7-8a89-4945be52b250.png)
- [Bar, 390px](https://hcti.io/v1/image/01a1cae2-5d4f-7d57-83e6-b21f89e618c0.png)
- [Booth, 320px](https://hcti.io/v1/image/01a1cae2-7e80-7f05-878d-00c2d5842fb9.png)
- [Calendar, 320px](https://hcti.io/v1/image/01a1cae2-a5b5-757e-9511-fcd98eea59db.png)

The previous entrance-only update was deployment `6af46bf64ef69f682f9fa802`. It removed homepage window links and duplicate mobile room links.

The preceding broader readability update was deployment `6af46905d70da09ff8bef28f`. Its full build, Next.js adapter, and upload succeeded.

- At that earlier deployment, admin login and logout returned 200, anonymous admin content returned 401, and persisted draft/live revisions both remained 5. The served storefront WebP exactly matched the reviewed local asset.
- Desktop browser inspection confirmed the edited matching windows, level awning, cream entrance sign, and opaque header/footer. The page had no horizontal overflow and no public Admin links.
- Live mobile captures at 390 × 844 and 320 × 568 confirmed the complete storefront, readable entrance and room links, and footer clearance.
- Entry, interior navigation, booth Events link, and public menu were exercised in the live browser. The booth uses the same Events route and Google Form destination as the public menu.
- The mobile booth capture showed Tonight followed by the upcoming-events section. Published events remain empty; event ordering, poster rendering, and draft suppression were verified with isolated fixtures in tests. Live carousel gestures cannot be exercised without real events or a temporary private fixture.

Earlier production checks are retained below for context.

- TypeScript and the production build passed. All **44 tests** passed, including shared Booth/Events poster ordering and suppression of public admin links.
- The production Next.js build, Netlify adapter, server function bundling, and production deployment succeeded.
- All principal public pages, admin page, public content API, sitemap, robots file, and venue photos returned HTTP 200.
- Unauthenticated admin reads and writes returned 401; attempted source/environment file URLs returned 404.
- Live admin sign-in and authenticated content access succeeded.
- A temporary private draft was saved; authenticated preview displayed it while an anonymous preview request did not.
- A stale save returned 409. Restore returned the exact original draft. Publishing that original content succeeded. No test copy was published.
- Logout invalidated the old session cookie.
- A subsequent production redeploy preserved draft/live revision 3 and all three restore-history entries; sign-in still worked and the published palette remained unchanged.
- The POV update passed TypeScript, all 42 tests, formatting checks and the full production build. All 90 sampled RGB values were verified against the 30 original/small image files.
- The published bar and interior were visually checked on desktop; room navigation and the bar menu anchor worked. A 390px mobile capture confirmed the full-screen room and single navigation overlay. Mobile overlay spacing was increased to leave clearance above the platform badge.

## Platform presentation limitation

On the current production deployment, the Free-plan Netlify badge remains enabled. Although Netlify's published documentation says it can be switched off, the site's API returned 422: “Removing the Netlify badge is not available on this plan.” No upgrade was enabled. The pending update uses the nonce-based CSP behavior documented by Netlify at https://docs.netlify.com/manage/projects/powered-by-netlify-badge/ to prevent its script from running, rather than a visitor-only dismissal.

## Content still needed

Confirmed weekly hours, actual bar menu items/prices, and dated upcoming events have not been supplied. The site uses honest empty states rather than invented details. These can be entered in the Studio at `/admin`.

## Verification limits

Live content save/preview/publish/restore and sessions were exercised. Live media upload/privacy, simultaneous cloud-worker races, and a custom domain have not been tested. Local suites cover media privacy, malformed uploads, cross-process persistence, concurrency, session expiry/revocation, date boundaries, and isolated preview storage. Ordinary deploy previews must remain without production secrets.

Expired session records, revoked-session markers, throttle records, unused snapshots and media currently have no automated cleanup. Storage usage should be monitored; future cleanup must retain active content and restore points. The optional Supabase adapter remains unconfigured and was not tested against a live project.
