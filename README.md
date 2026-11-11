# Pixelated Records

The website for Pixelated Records: a record shop, bar, and event space at 792 Onderdonk Avenue in Ridgewood, Queens. Venue details are based on [Pixelated's own page](https://linktr.ee/pixelatedrecordsnyc).

Built with Next.js, React, and TypeScript. The public experience uses the venue’s supplied photographs and official logos. The owner’s Studio at `/admin` controls content, photographs, events, menus, navigation, hours, scene hotspots, and appearance.

## The experience

- **Storefront:** the actual front of Pixelated, with gentle colored window lighting and day/dusk/night treatment based on New York time. The door’s **Come in** button enters the room.
- **Inside:** records on the **left**, DJ booth **ahead**, bar on the **right**. Mobile has clear destination buttons alongside the photographic experience.
- **Booth and events:** Events opens **What’s happening tonight**, followed by a horizontally scrollable list of upcoming events. A shared event source powers Tonight, the upcoming list, the calendar, and event detail URLs. Overnight shows remain visible across midnight, with daylight saving behavior covered by tests.
- **Calendar:** month navigation on desktop and a readable agenda on mobile, with direct event links and cancellation/sold-out notices.
- **Bar:** editable, accessible text menus with optional item photographs.
- **Records:** the shop leads to About Us and a coming-soon online shop. Commerce is intentionally deferred.
- **Location:** address, weekly/special hours, a map, and prefilled directions. Unknown hours are clearly marked as unconfirmed.
- **Booking:** every venue-booking button uses the shared setting, initially `https://forms.gle/zDBZYAVFogu758nf8`.
- **Navigation:** a labeled hamburger menu on every page, direct routes, keyboard support, a skip link, and reduced-motion support.

## Owner’s Studio

Open `/admin` to sign in. The password is verified on the server; no actual password is committed to this repository.

The Studio includes friendly forms for pages and sections, navigation, event scheduling in venue time, menu categories and items, contact information, hours, logos, colors, photographs, window masks, and room hotspots. Photographic overlays can be dragged/resized, and phone focal points can be adjusted independently.

**Save draft** preserves edits privately. **Preview** opens an authenticated draft preview. **Publish** makes the saved version public. The Studio also includes undo, recent version restoration, media replacement, and conflict detection when another tab has saved a newer version.

There are no sample event dates, invented menu prices, or fabricated business hours in the published seed content. Add confirmed information in the Studio before launch.

## Local development

Use Node.js 22, as specified in `.nvmrc`.

```bash
npm ci
cp .env.example .env.local
npm run hash-password
```

Place the generated hash in `ADMIN_PASSWORD_HASH` in `.env.local`. Generate a random session secret and put it in `SESSION_SECRET`:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Then start the site:

```bash
npm run dev
```

The site runs at `http://localhost:3000`. Local drafts, publications, media, sessions, and login throttles are stored in the ignored `.data` directory and survive process restarts. This local store is for development and review. Netlify production uses durable storage instead of the deployed filesystem.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

The tests cover draft/public separation, authentication and origin checks, persistence, concurrent saves, restoration, private media, unsafe content rejection, login throttling, logout revocation, overnight/DST event rules, calendar dates, public-link visibility, draft-preview URLs, and editable public controls.

A production build can be reviewed on your own machine with `CONTENT_STORAGE=local`, without deployment-platform environment variables:

```bash
npm run build
npm start
```

## Production: Netlify Free

The owner has approved **Netlify Free** for this website. The production design uses Netlify’s Next.js runtime and Netlify Blobs for content, private uploads, sessions, and sign-in throttles. A separate Supabase project is not required for this setup; its adapter remains an optional alternative.

`netlify.toml` builds from the repository root with `npm run build` and publishes `.next`. `.nvmrc` selects Node 22. Netlify supplies its current OpenNext adapter automatically; do not change the application to a static export or add an SPA catch-all redirect. See Netlify’s [Next.js support](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) and [build settings](https://docs.netlify.com/snippets/frameworks/nextjs-config-values/).

Configure `CONTENT_STORAGE=netlify` and private runtime environment variables for the password hash, session secret, and matching canonical HTTPS origins for `APP_ORIGIN` and `SITE_URL`. Production and deployment-preview data use separate stores. Withhold production authentication secrets from ordinary previews; explicitly configured preview editing uses its own isolated store. Follow [the publishing setup](docs/PUBLISHING.md) for the exact values and isolation rules.

Netlify’s current Free plan has a hard monthly credit allowance. Exhausting it pauses the team’s projects until the allowance refreshes; Free has no automatic recharge. Keep the project on Free, without paid add-ons or upgrades. This is a usage-limited service, not a promise of unlimited availability. See [Netlify’s Free plan limits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) and [pause behavior](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/).

Configuration in this repository is not evidence of a live deployment. Account connection, live storage, production sign-in, and browser behavior must be verified separately. See [the current verification status](docs/BUILD_STATUS.md) for actual results.

## Main files

- `src/components/PublicExperience.tsx` — public pages and interactive room.
- `src/components/admin/` — the owner’s Studio.
- `src/lib/seed.ts` — initial verified venue details and editable starter copy.
- `src/lib/events.ts` — shared event/date rules.
- `src/lib/server/` — content storage, authentication, validation, and uploads.
- `src/app/api/` — authenticated administration and published-content endpoints.
- `public/assets/` — optimized derivatives of the provided photographs and logos.
- `netlify.toml` and `.nvmrc` — Netlify build configuration and Node version.
- `storage/pixelated.sql` — schema for the optional Supabase adapter.
- `tests/` — meaningful behavior and rendering regressions.

The supplied original photographs and logo archives are not duplicated in the repository. Web derivatives retain the original artwork, signage, furniture, and room orientation.
