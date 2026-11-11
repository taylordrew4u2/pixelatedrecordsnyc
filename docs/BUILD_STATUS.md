# Build and verification status

## Live website

The website is public at https://pixelatedrecordsnyc.netlify.app. The owner approved public access and private admin credentials. The supplied venue photos and official logo remain in use. Records are on the left, the booth is ahead, and the bar is on the right. Booking uses the shared Google Form.

The November 11, 2026 update presents the storefront, interior, bar, booth and record shop as full-viewport photographic POV scenes. The bar menu opens in a native dialog rather than rendering an empty section beneath the photo. Room footers are small transparent links over the scene, and scene actions use unboxed labels. Hovering an action gently moves the view forward, except with reduced or paused motion. Full-screen images now declare a full-viewport responsive size.

The bar and interior use versioned AI-enhanced image assets with deeper blacks and clearer color. Their originals remain in the repository; `src/lib/photo-assets.ts` resolves existing content references to the enhanced files. Uploaded replacements remain owner-controlled. The image editor prompt requested color/detail correction, richer natural color, preserved composition and venue objects, and no haze, vignette or invented objects. Generated files were inspected before integration; these are enhanced depictions, not untouched originals. Other supplied photos remain unchanged. Scene label RGB samples in `src/lib/photo-colors.json` were updated to colors present in both enhanced image sizes.


## Deployment and credentials

Netlify Free is configured with persistent Netlify Blobs storage. No paid upgrade, trial, or automatic recharge was enabled. CLI production deployments use the full Next.js adapter lifecycle; do not upload the raw `.next` directory using `--no-build`.

Production admin credentials were successfully installed as **deploy-scoped, secret, Functions-only variables** using Netlify CLI `--secret-env`. They are masked by Netlify and are not included in the repository or public application. Site-level scope restrictions were unavailable on this Free plan. The deploy-specific secret route succeeded without broadening the credential scope. These two flags must be supplied on **every future production deploy**; see [PUBLISHING.md](PUBLISHING.md).

The site is deployed through the CLI. GitHub-triggered automatic deployments are not connected.

## Verification completed

- TypeScript passed and all **42 tests** passed after the redesign.
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

The Free-plan Netlify badge remains enabled. Although Netlify's published documentation says it can be switched off, the site's API returned 422: “Removing the Netlify badge is not available on this plan.” No upgrade or CSS workaround was used. Mobile photo height and footer spacing were adjusted to leave more room around controls.

## Content still needed

Confirmed weekly hours, actual bar menu items/prices, and dated upcoming events have not been supplied. The site uses honest empty states rather than invented details. These can be entered in the Studio at `/admin`.

## Verification limits

Live content save/preview/publish/restore and sessions were exercised. Live media upload/privacy, simultaneous cloud-worker races, and a custom domain have not been tested. Local suites cover media privacy, malformed uploads, cross-process persistence, concurrency, session expiry/revocation, date boundaries, and isolated preview storage. Ordinary deploy previews must remain without production secrets.

Expired session records, revoked-session markers, throttle records, unused snapshots and media currently have no automated cleanup. Storage usage should be monitored; future cleanup must retain active content and restore points. The optional Supabase adapter remains unconfigured and was not tested against a live project.
