# Security vulnerabilities

Findings from a static security audit of the monorepo (API + web). Not a live pen test — no exploit payloads were run against the running stack.

Prioritize **Critical** then **High**. Track remediation via [futureToDo.md](./futureToDo.md).

---

## Critical

### 1. JWT identity not bound to session user — **FIXED**

- **Where:** `apps/api/src/modules/auth/strategies/access.strategy.ts` (`validate`)
- **Issue:** Session is checked for existence / `isValid` / expiry / ACTIVE status, but `payload.sub` is never compared to `session.userId`. `req.user` is the JWT payload (including `role`).
- **Impact:** A valid `sessionId` cookie paired with another user’s valid access JWT authenticates as that JWT’s subject (including ADMIN) for the access-token lifetime.
- **Fix applied:** Require `payload.sub === session.userId`. `req.user` is built from `session.user` (`sub` + `role`). Refresh-by-session also checks JWT `sub` vs session owner. Covered by auth integration test (mismatched cookies → 401).

### 2. OAuth email auto-link → account takeover — **FIXED**

- **Where:** `apps/api/src/modules/auth/oauth/oauth.service.ts` — Strategy 2 (`upsertOauthUser`)
- **Issue:** If an OAuth email matches an existing user row, the provider is linked and email is marked verified — no check that the existing account already verified that email.
- **Impact:** Attacker registers with victim’s email (unverified, allowed). Victim later signs in with Google/GitHub → lands in the attacker’s account (password still attacker-controlled).
- **Fix applied:** Auto-link only when `isEmailVerified === true`. Unverified holder: strip email (same claim rule as email verification) and create a new OAuth user. OAuth email sync refuses another user’s verified email. Unit tests in `oauth.service.spec.ts`.

### 3. Bull Board mounted with no auth — **FIXED**

- **Where:** `apps/api/src/main.ts`; `apps/api/src/modules/queue/bull-board.setup.ts`
- **Issue:** `app.use('/admin/queues', …)` is Express middleware outside Nest guards.
- **Impact:** Anyone who can reach the API can view/manage job queues (emails, payloads, retries).
- **Fix applied:** `createBullBoardAdminMiddleware` requires accessToken + sessionId (same binding rules as JWT strategy) and `role === ADMIN`. Set `BULL_BOARD_ENABLED=false` to disable the mount entirely.

### 4. Empty JWT secret fallback — **FIXED**

- **Where:** `access.strategy.ts`, `refresh.strategy.ts` — `secretOrKey: process.env.* || ''`
- **Issue:** Missing secrets become empty string.
- **Impact:** Misconfigured deploys accept tokens signed with an empty secret.
- **Fix applied:** `requireJwtSecrets()` throws on missing/empty secrets at boot (`main.ts`) and in strategy constructors. Unit tests in `jwt-secrets.spec.ts`.

---

## High

### 5. Draft (and non-published) articles exposed publicly — **DEFERRED**

- **Where:** `apps/api/src/modules/articles/articles.service.ts` — `findById`, `findAll`, `searchAll`
- **Issue:** Public reads filter `deleted: false` only, not `status: PUBLISHED`. Full `content` is selected.
- **Fix:** Default public queries to `status: 'PUBLISHED'`. Allow drafts only for creator/admin.
- **Deferred:** Articles (and posts) are boilerplate placeholders and the primary AI CRUD reference (`guide/guidev2`, `docs/ai-tut.md`). Not treated as a product content surface — teach status filtering in the guide when scaffolding a real resource instead of hardening the sample.

### 6. Local file serve path check is prefix-unsafe — **FIXED**

- **Where:** `apps/api/src/modules/files/files.controller.ts` — `serveFile`
- **Issue:** Uses `normalizedPath.startsWith(path.normalize(uploadPath))`. Paths like `/uploads_evil/...` can pass a check meant for `/uploads`.
- **Fix applied:** Shared `resolveWithinRoot()` (`path.resolve` + separator prefix). Used by file serve and local `deleteFile`.

### 7. User-controlled `avatarPath` → delete path escape — **FIXED**

- **Where:** `UpdateProfileDto.avatarPath`; `users.service.ts` `updateProfile`; `local-storage.backend.ts` `deleteFile`
- **Issue:** Clients can set `avatarPath` without upload. On next avatar upload, `deleteFile` joins that value under the upload root with no traversal check.
- **Fix applied:** Client JSON can no longer set `avatarPath` (undecorated / stripped; forbidNonWhitelisted → 400). Avatar URLs only set from `processFile`. `deleteFile` refuses paths outside the upload root.

### 8. OAuth missing CSRF `state` (and PKCE) — **FIXED**

- **Where:** `oauth.service.ts` / `oauth.controller.ts`
- **Issue:** No `state` (or PKCE) on authorize/callback.
- **Impact:** Login CSRF — attacker can bind victim’s browser session to attacker’s OAuth account.
- **Fix applied:** Authorize sets httpOnly `oauth_state` + `oauth_pkce` cookies and sends `state` + S256 `code_challenge`. Callback requires matching `state` and sends `code_verifier` on token exchange (Google + GitHub). Unit tests in `oauth-csrf.spec.ts`.

### 9. Production cookies `SameSite=None` without CSRF tokens — **FIXED**

- **Where:** `apps/api/src/config/cookie.config.ts`; web `kyClient.ts` (`credentials: "include"`)
- **Issue:** Prod cookies were `SameSite=None; Secure`. CORS limits XHR origins, but cookie-authenticated cross-site form/simple requests can still send cookies. No CSRF token / double-submit.
- **Fix applied:** Default `SameSite=Lax` (web + API on same apex are same-site; classic cross-site POST CSRF no longer sends cookies). Override with `COOKIE_SAMESITE=none` only for true cross-domain deploys; then `CsrfGuard` requires `X-Requested-With: XMLHttpRequest` on mutations (web `kyClient` always sends it). Stripe/OAuth callbacks exempt. Tests in `cookie.config.spec.ts` + `csrf.guard.spec.ts`.

### 10. Secrets / tokens logged — **FIXED**

- **Where:** `main.ts` (logged `DATABASE_URL` at startup); `password-reset.service.ts`; `email-verification.service.ts`; verify-email controller
- **Issue:** Connection strings and full reset/verify URLs (with tokens) hit logs.
- **Fix applied:** Startup logs only whether a DB URL is set (not the value). Reset/verify never log tokens or full URLs; non-prod may log recipient email only. Verify-email endpoint no longer logs the token.

### 11. Logout can invalidate another user’s session — **FIXED**

- **Where:** `auth.controller.ts` `logout` — enabled by finding #1
- **Issue:** Invalidates `sessionId` from the cookie with no ownership check vs `req.user.sub`.
- **Fix applied:** `invalidateSession(sessionId, userId)` uses `updateMany` with `{ id, userId }` so logout cannot mark another user’s session invalid. Access strategy binding (#1) still rejects mismatched cookies before logout runs. Integration test covers ownership on logout.

---

## Medium

### 12. Authorization role from JWT, not DB — **FIXED**

- **Where:** `RolesGuard`; payload built in auth/OAuth
- **Issue:** `@Roles('ADMIN')` uses `req.user.role` from token — demotions leave elevated access until access token expires.
- **Fix applied:** Already resolved with JWT↔session binding (#1): `AccessTokenStrategy.validate` returns `role` from `session.user` (DB), not JWT claims. `RolesGuard` therefore sees the live role on every authenticated request. Bull Board middleware also checks `session.user.role`.

### 13. `UserAwareThrottlerGuard` never sees `req.user` — **FIXED**

- **Where:** `throttle-user.guard.ts`; global guard order in `main.ts`
- **Issue:** Global throttle runs before route JWT guards → always IP-based. Documented per-user limits don’t apply.
- **Fix applied:** Guard verifies the access JWT (cookie or Bearer) with `ACCESS_TOKEN_SECRET` and tracks `user-{sub}` when valid; otherwise IP. Production enables Express `trust proxy` (override via `TRUST_PROXY`) so guest keys use the real client IP. Unit tests in `throttle-tracker.spec.ts`.

### 14. No Multer size limits at parser layer — **FIXED**

- **Where:** Controllers using `FileInterceptor` without `limits`
- **Issue:** Large bodies can be buffered before `FileProcessingService` `maxSize` checks → memory DoS.
- **Fix applied:** Shared `avatarMulterOptions` / `mediaMulterOptions` from `multer-limits.ts` (aligned with `FILE_PRESETS`) passed to all `FileInterceptor` / `FilesInterceptor` upload routes (users, articles, admin users/articles).

### 15. MIME type trusted from client — **FIXED**

- **Where:** `file-processing.service.ts`; raw processors
- **Issue:** Allowlist uses `file.mimetype`; videos/docs stored raw after allowlist.
- **Fix applied:** `sniff-mime.ts` detects type from magic bytes (images, PDF, MP4/WebM, XLS/XLSX, CSV text heuristic). `processFile` allowlists the sniffed MIME and overwrites `file.mimetype`; raw saves use server MIME extensions. Unit tests in `sniff-mime.spec.ts`.

### 16. Soft-deleted posts still updatable by creator — **FIXED**

- **Where:** `CreatorGuard` (no `deleted` check); `posts.service.ts` / `articles.service.ts` `update`
- **Issue:** Creator could PATCH soft-deleted content; guard only checked ownership.
- **Fix applied:** `CreatorGuard` rejects non-DELETE methods when `deleted === true` (DELETE still reaches the service for 410). `posts.service.update` / `articles.service.update` also reject deleted rows. Unit + posts integration coverage.

### 17. Public collections by ID (privacy) — fixed

- **Where:** `collections.controller.ts` / `collections.service.ts`
- **Issue:** Any collection ID was readable.
- **Fix (2026-07-21):** `Visibility` on Collection (default `PRIVATE`); non-owner private reads return 404; lists filter by viewer.

### 18. Frontend CSRF / upload / ownership gaps — **FIXED**

- **Where:** `apps/web` — cookie auth without CSRF; client-only upload MIME/size; wrong `isOwner` on liked/collection UIs; edit pages enforce ownership only in client
- **Issue:** Liked lists and collection items passed profile/collection ownership into `Post`/`Article` (wrong edit/like UX). Edit routes only checked ownership after client fetch. Client upload checks were easy to confuse with real enforcement.
- **Fix applied:** `Post`/`Article` derive ownership from session + `creator.id`. Collection items no longer inherit collection-owner flags. Edit post/article RSC pages fetch the resource and redirect non-owners to `/unauthorized`. Client upload presets documented as UX-only (API enforces). CSRF header already on `kyClient` via #9 (`X-Requested-With`).

---

## Low / Info

| # | Issue | Notes |
|---|--------|--------|
| 19 | Swagger at `/docs` unauthenticated — **FIXED** | Off in production unless `ENABLE_SWAGGER=true`; on in dev unless `ENABLE_SWAGGER=false` |
| 20 | Password-reset request body not a validated DTO — **FIXED** | `RequestPasswordResetDto` with `@IsEmail()` + `@MaxLength(256)` on `POST /auth/request-password-reset` |
| 21 | Test endpoints gated but still registered — **FIXED** | Routes only mounted when `ENABLE_TEST_ENDPOINTS=true`; `TestEndpointsGuard` as backup |
| 22 | Geolocation uses client-influenced IP (`x-forwarded-for`) | Trust proxy only from known hops |
| 23 | No security headers on Next (`CSP`, frame denial, etc.) | Add in `next.config.ts` or reverse proxy |
| 24 | Reset/verify tokens in URL query strings | Strip after read; short TTL / single-use |
| 25 | Public `/test` UI playground — **FIXED** | RSC `notFound()` in production unless `ENABLE_TEST_UI=true`; on in dev unless `false` |
| 26 | PostHog identifies with email / OAuth IDs | Minimize PII; consent |

**Not found / in decent shape:** Admin Nest routes use `JwtAccessGuard` + `@Roles('ADMIN')`; Stripe webhook signature verification present; ValidationPipe whitelist + forbidNonWhitelisted; Pino redacts cookies/auth headers; no `dangerouslySetInnerHTML` (XSS via HTML sinks); tokens not in `localStorage`; soft-delete filters on most public reads; no user-input `$queryRaw` injection found; OAuth/Stripe redirects use fixed `FRONTEND_URL` (no open redirect observed).

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 7 |
| Medium | 7 |
| Low / Info | 8 |

Suggested fix order: **#1 → #2 → #3 → #4 → #5 → #6/#7 → #8/#9 → remainder**.
