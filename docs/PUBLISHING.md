# Content, authentication, and publishing

## What works locally

The editor uses real draft/live content, atomic saves, a publishing revision, and recent restore points. Its local backend stores content, images, session records, and sign-in throttles in the ignored .data directory. Refreshing, signing out, restarting the local server, or opening another browser against that server does not erase saved content.

This is a local preview backend. A copy of .data on a development machine is not a production database, is not committed, and will not survive a serverless redeployment. Vercel filesystem storage is never enabled by this application.

For local development, use CONTENT_STORAGE=local. To run a production build locally for review, this same explicit setting opts into local persistence only when the VERCEL environment variable is absent.

## Private environment configuration

Configure these values in an ignored .env.local for local work and in the deployment platform's secret environment settings for production:

| Name                      | Purpose                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| ADMIN_PASSWORD_HASH       | scrypt password hash produced by the included script                                                          |
| SESSION_SECRET            | Independent, cryptographically random secret of at least 32 characters                                        |
| CONTENT_STORAGE           | local for local review; supabase for production                                                               |
| SUPABASE_URL              | Dedicated project's HTTPS API URL                                                                             |
| SUPABASE_SERVICE_ROLE_KEY | Server-only service-role JWT or secret API key                                                                |
| SUPABASE_STORAGE_BUCKET   | Optional; defaults to pixelated-private                                                                       |
| APP_ORIGIN                | Optional canonical origin for write-request origin checks; omit when using several preview deployment origins |
| PIXELATED_DATA_DIR        | Optional local-only data directory override, useful for isolated tests                                        |

Never prefix credentials with NEXT_PUBLIC_, include them in repository content, or paste them into the editor. The browser never receives the storage key or password hash.

Run **node scripts/hash-password.mjs** and type the password at the hidden prompt. Put only the resulting hash into ADMIN_PASSWORD_HASH. Generate SESSION_SECRET using a cryptographic random generator. Changing either secret invalidates existing sessions; changing the password requires a new hash and a deployment/server restart.

## Production storage setup

Production publishing is deliberately unavailable until storage is configured. Do not use an unrelated existing project or enable a paid plan.

Once the owner has chosen a dedicated, eligible Supabase project:

1. Review and run storage/pixelated.sql in that project. It creates three private tables, two restricted database functions, and a private WebP image bucket.
2. Confirm that pixelated-private is private and has no public read/write policies. If that bucket already exists, inspect it; the migration deliberately does not change an existing bucket.
3. Set the server environment variables above, choosing CONTENT_STORAGE=supabase.
4. Verify login, draft save, publish, logout, and the same content in a fresh browser after a deployment.
5. Confirm the plan, commercial eligibility, usage limits, and pause behavior with current official documentation before launch.

No Supabase project has been provisioned or configured by the included code. The adapter is implemented against the REST, RPC, and private Storage interfaces; a real project integration still needs verification once credentials are supplied.

Official documentation:

- https://supabase.com/docs/guides/api
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/uploads/standard-uploads

Do not change to another host or incur charges to resolve Vercel's commercial Hobby restriction without the owner's choice. Hosting eligibility is separate from the application's storage configuration.

## Publishing behavior

- **Save draft** validates and stores the draft. It does not change the live site.
- **Preview** must be rendered only after the server confirms an authenticated session.
- **Publish** copies the saved draft into the live version in one atomic operation.
- **Restore** copies a recent version into the draft. Publishing the restored draft is a separate action.
- Recent history keeps up to 15 previous draft snapshots, bounded by a storage-size budget. This is a practical undo history, not a permanent backup service.
- Every mutation carries the editor's revision. If another tab has saved first, the request returns a conflict instead of overwriting its work.
- An uploaded image is private until a live page, visible section, published event, available menu item, or other live content references it. Merely adding it to the asset library does not make it public.
- Unpublished events and hidden pages/sections are filtered from the public API. The admin API is never cached.
- Removing a media reference from published content revokes anonymous retrieval. Existing copies someone downloaded while an image was public cannot be recalled.

The application keeps uploaded originals out of the public folder. Uploaded JPEG, PNG, and WebP files up to 4 MB are decoded, orientation-corrected, resized to a maximum of 2560 pixels per side, and re-encoded as WebP without source metadata. SVG, animated, malformed, and oversized uploads are rejected. Old uploaded files are retained to support history restoration; future storage cleanup must consider draft, live, and retained history references.

## Sign-in protections

Sessions last 12 hours and use HttpOnly, SameSite=Strict cookies; production cookies are Secure. Logout deletes the server session as well as the browser cookie. Password changes invalidate old sessions.

Login attempts are persisted: 10 per client per 15-minute window and 100 per site per window. Local preview shares one client bucket. On Vercel, the trusted forwarded address is hashed before storage. No raw client address is retained. State-changing requests must carry an exact matching Origin; requests from another website are rejected.

## API summary

| Endpoint                | Access                  | Behavior                                                        |
| ----------------------- | ----------------------- | --------------------------------------------------------------- |
| GET /api/auth/session   | Public                  | Authentication and storage readiness; never secrets             |
| POST /api/auth/login    | Same origin             | Verifies password, consumes persisted throttle, creates session |
| POST /api/auth/logout   | Same origin             | Revokes current session                                         |
| GET /api/admin/content  | Admin                   | Draft, live version, revisions, restore labels                  |
| PUT /api/admin/content  | Admin + same origin     | Saves content and expectedRevision                              |
| POST /api/admin/publish | Admin + same origin     | Publishes expectedRevision                                      |
| POST /api/admin/restore | Admin + same origin     | Restores historyId and expectedRevision into draft              |
| POST /api/admin/media   | Admin + same origin     | Accepts multipart file; returns an asset object                 |
| GET /api/media/[id]     | Live reference or admin | Serves a validated uploaded image                               |
| GET /api/site           | Public                  | Returns the filtered live content only                          |

Errors are JSON objects containing error and code, with suitable HTTP status. Revision conflicts include the current revision when available. Rate limits include Retry-After. Storage failures never return a fake successful save.

Server-rendered public routes must be dynamic or otherwise revalidated on publication. Use getPublishedContent() from src/lib/server/content.ts. For an authenticated preview, first call isAuthenticated() from src/lib/server/auth.ts, then read getContentState().draft. Never pass private content to a client component or response before that server check.
