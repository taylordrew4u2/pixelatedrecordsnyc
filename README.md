# Pixelated Records

The website for Pixelated Records: a record shop, bar, and event space at 792 Onderdonk Avenue in Ridgewood, Queens.

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

Use Node.js 22 or newer.

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

The site runs at `http://localhost:3000`. Local drafts, publications, media, sessions, and login throttles are stored in the ignored `.data` directory and survive process restarts. This is suitable for local review, not Vercel production storage.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

The tests cover draft/public separation, authentication and origin checks, persistence, concurrent saves, restoration, private media, unsafe content rejection, login throttling, logout revocation, overnight/DST event rules, calendar dates, public-link visibility, draft-preview URLs, and editable public controls.

A production build can be reviewed locally with `CONTENT_STORAGE=local` while `VERCEL` is absent:

```bash
npm run build
npm start
```

## Production and the free-only requirement

The code is ready for Vercel’s Next.js runtime, but **Vercel Hobby is restricted to non-commercial personal use**. This venue website advertises a business, so a Hobby launch would not satisfy Vercel’s current rules. No paid plan, trial, upgrade, or substitute hosting service has been activated.

Production administration needs a durable backend. This repository includes a Supabase adapter, private-table/private-bucket migration, server-side password verification, and authenticated media delivery. A dedicated, authorized project and its credentials must be configured before production publishing works. The application explicitly refuses to use Vercel’s ephemeral filesystem for content storage.

See [the publishing setup](docs/PUBLISHING.md) and [verification status](docs/BUILD_STATUS.md) before launch. Set `SITE_URL` to the real canonical site origin in the production environment.

Primary references:

- [Vercel fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
- [Pixelated’s venue-owned page](https://linktr.ee/pixelatedrecordsnyc)

## Main files

- `src/components/PublicExperience.tsx` — public pages and interactive room.
- `src/components/admin/` — the owner’s Studio.
- `src/lib/seed.ts` — initial verified venue details and editable starter copy.
- `src/lib/events.ts` — shared event/date rules.
- `src/lib/server/` — content storage, authentication, validation, and uploads.
- `src/app/api/` — authenticated administration and published-content endpoints.
- `public/assets/` — optimized derivatives of the provided photographs and logos.
- `storage/pixelated.sql` — private Supabase production schema.
- `tests/` — meaningful behavior and rendering regressions.

The supplied original photographs and logo archives are not duplicated in the repository. Web derivatives retain the original artwork, signage, furniture, and room orientation.
