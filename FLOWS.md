# FLOWS.md

Business logic decisions and non-obvious flows. Written when decisions are made, not retroactively.

AI agents should read this file before writing tests for any module.

---

## Auth & Registration

- Email is optional at registration — users can sign up with username + password only
- Login accepts **username or email** in the same field (`username` on the wire). Values containing `@` are looked up as email (case-insensitive); otherwise exact username. Invalid credentials always return the same 401 message.
- Unverified email gets silently stripped from the original holder when a different user verifies ownership of that same email
- OAuth login proves email ownership the same way: auto-link a provider only if an existing account already has that email **verified**; if the holder is unverified, strip the email and create a new OAuth user (do not merge into the unverified account)
- Forgot password works even if the requesting user's email is unverified
- A user whose email was stripped can still use their account normally — they just have no email attached
- Self-delete (`DELETE /users/me`) requires the current password; soft-deletes the account and invalidates all sessions
- Non-ACTIVE accounts (SUSPENDED / BANNED / DELETED) cannot log in, complete OAuth session creation, refresh tokens, or use JWT-guarded routes. Temporary SUSPENDED/BANNED with past `statusExpireAt` auto-restore to ACTIVE on next auth check. Admin status changes away from ACTIVE invalidate sessions immediately.

## Sessions

- The access token cookie must always be accompanied by a valid `sessionId` cookie — the strategy validates both
- Access JWT `sub` must equal `session.userId`; `req.user.sub` / `req.user.role` come from the session’s user row (not stale JWT claims)
- Refresh-by-session also requires the refresh JWT `sub` to match `session.userId`
- Revoking a session (`DELETE /sessions/:id`) sets `isValid=false` in DB; subsequent requests with that session's cookies return 401
- Users can only revoke their own sessions (403 if attempting another user's session)
- "Active now" on the admin dashboard = distinct users with a valid session touched within the configured window (default 5 min) **plus** guests with a Redis presence key. `lastUsedAt` is updated on token refresh and throttled (~30s) on authenticated API requests. Guests: `anonId` cookie + `POST /presence/heartbeat` (~45s client interval) sets `{REDIS_NAMESPACE}:presence:guest:{uuid}` with TTL = `ACTIVE_NOW_WINDOW_MS`. Logged-in heartbeats skip Redis (no double-count). Stats: `presence.activeNow` / `users` / `guests`.


## Content (Posts, Comments, Collections)

- Soft-delete sets `deleted=true` + `deletedAt` timestamp; the record stays in DB for potential admin recovery
- Soft-deleted resources return 404 to public requests (not 410) — 410 is reserved for actions on already-deleted resources (e.g. deleting a comment that is already deleted)
- Comments can be made on posts owned by the commenter (self-commenting is allowed)
- Visibility: `PUBLIC` | `PRIVATE`. Posts default `PUBLIC`; collections default `PRIVATE`. Likes inherit the resource’s visibility (no column on Like).
- Private content is visible only to the creator (and admins where applicable). Non-owners get **404** (same as soft-delete), including by-id fetches — closes collection IDOR.
- Public search/feeds list `PUBLIC` only. Profile lists are viewer-aware (owner sees own private items).
- Collections support public search (`GET /collections`, suggest) and likes (`ResourceType.COLLECTION` + `likeCount`). Search never returns others’ private collections.
- Profile lists (posts / articles / liked / collections by user) accept the same `query` (+ optional searchFields/sort) as global search, scoped to that user with existing visibility rules. Liked lists search among liked resources (not sparse like-pagination).
- Liked-by-user lists only include posts the **viewer** can access: if a liked post later becomes private, it disappears for everyone except the post creator (same idea as skipping private items in a public collection).
- Private posts may be added to the owner’s collections (private or public). Viewers who can’t see a private item skip it (YouTube playlist style); owners still see their private items in the list.

## View history

- Authenticated `POST /views` upserts one `ViewHistory` row per `(userId, resourceType, resourceId)` and bumps `viewedAt` (YouTube-style). Guests only bump denormalized `viewCount`.
- History upsert runs even when the view-count spam/rate window skips incrementing `viewCount`. Re-viewing a soft-deleted history row restores it (`deleted=false`, `deletedAt=null`).
- History list/mutate APIs (`GET /views/history`, `DELETE /views/history/:id`, `POST /views/history/clear`) require auth and only operate on the caller’s rows (owner-only).
- Remove-one and clear-all are **soft-delete only** so admins can still audit rows in DB. Soft-deleted rows are omitted from the user’s history list.
- History list hydrates posts/articles and omits deleted or inaccessible resources (e.g. another user’s private post that was public when viewed).
- Admin audit: `GET /admin/users/:id/view-history` (users table → View history) includes soft-deleted history rows and does not apply visibility filters; UI at `/admin/users/[id]/history`.

## Reports

- Reportable types live in `REPORTABLE_RESOURCES`: posts, articles, comments, collections (opt-in per CRUD resource via CLI/guide), and **users** (profile flag on `/user/[username]` for e.g. bad avatars).
- Auth required (`POST /reports`). Cannot report yourself / your own content (403). Duplicate open/`REVIEWING` → 409. Private content you cannot see → 404.
- Reasons: `SPAM | HARASSMENT | HATE | NSFW | MISINFORMATION | COPYRIGHT | OTHER`. Optional details.
- Admin-only queue: `GET/PATCH /admin/reports` (+ UI `/admin/reports`). Statuses: `OPEN | REVIEWING | RESOLVED | DISMISSED`. Resolving/dismissing sets `resolverId` + `resolvedAt`. USER reports include `targetUsername` for profile links.
- MOD does not access the queue yet (mod scopes deferred).

## Admin remove on public pages

- When `user.role === ADMIN`, public cards/detail (posts, articles, comments, collections) show an **Admin remove** control (`AdminRemoveButton`).
- Soft-deletes via existing `/admin/{resource}/:id` DELETE (audit-logged). Does not require opening the admin dashboard. MOD not included yet.
- Owner edit/delete controls stay separate; admin remove works on others’ content too.

## Admin mass delete (bulk soft-delete)

- Admin tables (posts, articles, comments, collections) support multi-select + toolbar soft-delete / restore.
- API: `POST /admin/{resource}/bulk-delete` and `POST /admin/{resource}/bulk-restore` with `{ ids: number[] }` (max 100, unique).
- Uses Prisma `updateMany` (`deleted` / `deletedAt`) — **not** hard `deleteMany`. Idempotent: already-deleted / already-active rows are skipped; response `{ affected, skipped }`.
- One audit log summary per bulk action (`POSTS_BULK_DELETED`, etc.); ids live in `changes`.
- Users / media / reports are out of scope for this slice (user cascade + email; media is hard-delete).

## Company email branding (admin)

- Admins set from name / from email / support email at `GET|PATCH /admin/settings/email` (UI: `/admin/settings/email`).
- Stored in `Setting` keys `EMAIL_FROM_*`; resolve order **DB → env (`RESEND_FROM_*`) → fallback**.
- `RESEND_API_KEY` stays in env only (never admin UI). Domain SPF/DKIM verification remains in the Resend dashboard.
- Enqueued jobs include `fromName`/`fromEmail`; worker uses those (env fallback). Template footers read support via in-memory branding cache.
- `POST /admin/settings/email/test` queues a test mail to the current admin’s email.
- **Compose (one-way outbound):** `POST /admin/settings/email/compose` — custom message to selected users (`userIds[]`, one queued email per recipient, not CC; cap 100; recipient suggest via admin user search, any status) or broadcast to all ACTIVE users with email (`confirmBroadcast: true`, cap 2000). Body is plain text (HTML-escaped). Footer states replies are not accepted. No inbound mail / ticket thread yet — Workspace/Zoho two-way mail is future work.

## Admin Stripe actions

- **Refunds:** `POST /admin/stripe/products/:id/refund` and `POST /admin/stripe/credit-purchases/:id/refund` create a full Stripe refund, then apply local state immediately. Product uses checkout session id on `ProductPurchase.stripeId`; credits resolve payment intent via the customer’s checkout sessions + stored line-item id. `charge.refunded` webhook apply helpers are **idempotent**.
- **Cancel subscription:** `POST /admin/stripe/subscriptions/:id/cancel` with `{ mode: "period_end" | "immediate" }`. Period-end sets Stripe `cancel_at_period_end` + local `nextTier=FREE`. Immediate calls `subscriptions.cancel` + local `CANCELED`/`FREE`. Resolves `sub_` id even if renewals previously overwrote `Subscription.stripeId` with an invoice id (and heals it).
- **Invoices:** `GET /admin/stripe/subscriptions/:id/invoices` lists recent Stripe invoices; `POST /admin/stripe/invoices/:invoiceId/send` (draft only); `POST /admin/stripe/invoices/:invoiceId/void` (open only). Hosted URL / PDF opened from admin UI.
- Renewal webhook (`invoice.payment_succeeded`) updates period/tier only — it must **not** overwrite `Subscription.stripeId`.
- Local testing: `stripe listen --forward-to localhost:3001/stripe/webhook` (API port, not web `:3000`); put CLI `whsec_` in `STRIPE_WEBHOOK_SECRET`.
- **Branded app emails (Resend):** on successful checkout (`product` / `credits` / `subscription`) and on applied refunds, the API enqueues `stripe-purchase-receipt` / `stripe-purchase-refund` to the user's `User.email`. This is independent of Stripe Dashboard customer emails (which are unreliable in test mode). Skip if the user has no email on file.
- **Admin dashboard:** `GET /admin/stripe/dashboard` returns live `balance.retrieve()` (available/pending) plus recent product/credit/subscription rows from the app DB. UI widgets on `/admin` when `NEXT_PUBLIC_STRIPE_ENABLED=true`.

## User preferences

- One `UserPreferences` row per user (`GET/PATCH /users/me/preferences`, auth). Auto-created with defaults on first GET/PATCH.
- Fields: `theme` (`LIGHT | DARK | SYSTEM`, default `SYSTEM`); JSON bags `layout`, `resume`, `onboarding`, `snoozes` (each default `{}`). PATCH shallow-merges JSON bags.
- Notification toggles (defaults on): `notifyInAppComments`, `notifyInAppLikes`, `notifyEmailComments`, `notifyEmailLikes`.
- Theme UI: logged-in users sync via `ThemeToggle` + `PreferencesThemeSync` (server wins on load). Guests keep `next-themes` localStorage only.
- Layout / resume / onboarding / snoozes are API-ready for later consumers (no UI yet).

## Notifications

- `Notification` rows for recipients; types `COMMENT` | `LIKE`. Emitted from comment create and new likes (not unlikes); skipped when actor is owner.
- Opt-in allowlist: `NOTIFIABLE_RESOURCES` + `NOTIFIABLE_RESOURCE_CONFIG` (same DX as likes/reports). Types not on the list never notify.
- Respect prefs: in-app row only if corresponding `notifyInApp*` is on; email via `enqueueEmail` only if `notifyEmail*` is on and recipient has verified email.
- Links for comment targets resolve up to parent post/article/collection for click-through.
- APIs (auth, owner-only): `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/read` (`ids` or `all`).
- UI: header bell (poll unread ~60s + fetch on open), `/notifications` page, Settings → Notifications toggles.
- No websockets/push in this slice.

## Account status emails

- Admin status changes enqueue `account-status-changed` via BullMQ (`AccountStatusEmailService`).
- Triggers: `AdminUserService.update` when `status` changes; soft-delete; restore.
- Sends if the user has an email on file (verification not required — account lockouts must still notify). Skips when no email.
- Auto-expiry restore on login (`evaluateAccountAccess` → ACTIVE) does **not** send email (silent unlock).
- Not an in-app bell item: suspended/banned users cannot use the app; email is the channel.

## Comments on comments

- `COMMENT` is already on `COMMENTABLE_RESOURCES` — replies are `POST /comments` with `resourceType: COMMENT`, `resourceId: parentCommentId`.
- No schema change (polymorphic Comment already nests). Notifications go to the parent comment author via existing `createIfAllowed`.
- UI: YouTube-style **3-layer cap** (`MAX_NEST_DEPTH = 2`, 0-indexed). Reply under a max-depth comment attaches as a **sibling** of that comment (same parent), not a deeper nest.
- Indent applies to content only; the ⋮ menu stays on the far right of the row.
- Nested reply lists are **oldest-first** (`createdAt asc`); top-level post/article comments stay newest-first.
- Indent stops at layer 3 so threads do not smush; nested lists load on demand.
- Top-level lists on post/article stay `resourceType: POST|ARTICLE` only; replies live under each parent.

## Reactions (emoji)

- Coexists with binary likes — separate `Reaction` table and `POST /reactions/toggle`; likes unchanged.
- One row per `(userId, resourceType, resourceId, emoji)`; toggle add/remove that emoji only.
- Any emoji grapheme / ZWJ sequence allowed (`isValidReactionEmoji`); reject empty/whitespace/non-emoji/oversized (max 32 chars).
- UI: SmilePlus = quick favorites strip; Smile = full Frimousse picker (native system emojis, shadcn-styled).
- `REACTABLE_RESOURCES` currently matches likeable: POST, COMMENT, ARTICLE, COLLECTION.
- List/detail attach aggregated `reactions: { emoji, count, reactedByMe }[]` via `enhanceWithEngagement` (likes + reactions).
- No reaction notifications in the first slice (likes still notify).

---

_Add new entries here when you make a product decision that isn't obvious from reading the code._
