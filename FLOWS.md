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
- "Active now" on the admin dashboard = distinct users with a valid session touched within the configured window (default 5 min); guests are not included. `lastUsedAt` is updated on token refresh and throttled (~30s) on authenticated API requests.

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

---

_Add new entries here when you make a product decision that isn't obvious from reading the code._
