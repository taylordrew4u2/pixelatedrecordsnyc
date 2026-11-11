# Build and verification status

## Implemented

The public website, editable owner’s Studio, local persistent backend, and Supabase production adapter are implemented. The supplied venue photographs and official logos are used. Room directions are records left, DJ booth ahead, and bar right. Every booking action uses the shared Google Form URL.

## Verified in this workspace

- TypeScript checking passes.
- Automated behavior and render-level tests pass.
- The optimized Next.js production build completes without framework warnings.
- The backend suite exercises actual route handlers, file persistence across a second Node process, private drafts and media, publication, restoration, session revocation, rate limiting, validation, and optimistic concurrency.
- Date tests exercise New York midnight boundaries, both DST transitions, a nonexistent 2 a.m. cutoff, ongoing overnight events, and leap-year calendars.
- Render tests exercise archived links, private/missing event destinations, query/fragment preservation in previews, editable hotspot labels, menu photographs, event status, and featured-event behavior.

## Not yet verified

- Visual browser rendering, touch interactions, and end-to-end browser administration. The workspace’s local Chromium launch required socket permissions that were blocked; elevated execution was rejected by policy. The connected browser was unavailable, the cloud browser could not reach localhost, and its security policy disallowed local-file URLs. These are environment limitations, not passing browser results.
- The Supabase migration and production adapter against a live dedicated project. No existing unrelated project was modified.
- A live deployment, custom domain, or production admin login.

## Before launch

1. Resolve the conflict between commercial use and Vercel’s free Hobby plan. The owner must choose an eligible commercial Vercel plan or authorize a different host that permits free commercial use.
2. Configure an authorized persistent storage project and private deployment secrets; run the included migration.
3. Add confirmed weekly hours, the actual bar menu, and dated upcoming events in the Studio.
4. Complete desktop/mobile browser review and a live save → preview → publish → restore check in the selected environment.

No paid services, paid trials, or automatic overages were enabled during this build.
