# Build and verification status

## Live website

The website is public at https://pixelatedrecordsnyc.netlify.app. The owner approved public access and private admin credentials. The supplied venue photos and official logo remain in use. Records are on the left, the booth is ahead, and the bar is on the right. Booking uses the shared Google Form.

The November 11, 2026 update presents the storefront, interior, bar, booth and record shop as full-viewport photographic POV scenes. Original photos keep their natural colors without CSS grading. Compact floating labels replace large rectangular controls and split photo/copy layouts. Each supplied photo has exact RGB samples recorded in `src/lib/photo-colors.json`; scene text and controls use those samples. Samples occur in both full and small photo assets. Uploaded replacements fall back to the owner’s configured palette. Mobile room navigation appears once in a compact overlay. Repeated destination rows remain removed, and the footer contains contact details.

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
- Desktop room, booth, menu and bar were visually checked in the browser. Room and booth were also captured at a 390px mobile viewport.

## Platform presentation limitation

The Free-plan Netlify badge remains enabled. Although Netlify's published documentation says it can be switched off, the site's API returned 422: “Removing the Netlify badge is not available on this plan.” No upgrade or CSS workaround was used. Mobile photo height and footer spacing were adjusted to leave more room around controls.

## Content still needed

Confirmed weekly hours, actual bar menu items/prices, and dated upcoming events have not been supplied. The site uses honest empty states rather than invented details. These can be entered in the Studio at `/admin`.

## Verification limits

Live content save/preview/publish/restore and sessions were exercised. Live media upload/privacy, simultaneous cloud-worker races, and a custom domain have not been tested. Local suites cover media privacy, malformed uploads, cross-process persistence, concurrency, session expiry/revocation, date boundaries, and isolated preview storage. Ordinary deploy previews must remain without production secrets.

Expired session records, revoked-session markers, throttle records, unused snapshots and media currently have no automated cleanup. Storage usage should be monitored; future cleanup must retain active content and restore points. The optional Supabase adapter remains unconfigured and was not tested against a live project.
