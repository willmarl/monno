# Progress tracker (V2)

**Purpose:** Single source of truth for what’s done / in progress / left. Humans and AI agents should update this file when work lands.

**Related:** [futureToDo.md](./futureToDo.md) (idea backlog) · [vulnerabilities.md](./vulnerabilities.md) · [code-quality.md](./code-quality.md)

---

## How to work (read this)

**Do tasks one at a time inside a phase — not a whole phase as one mega-change.**

| Approach | Verdict |
|----------|---------|
| Entire phase in one PR/chat | Bad — huge diffs, hard to review/revert, mixes concerns |
| One task (or one tightly coupled pair) per PR/chat | Good |
| Finish a phase’s critical path before jumping ahead | Good — later phases depend on earlier foundations |
| Cheap parallel items anytime | OK — e.g. `robots.txt`, small High security fixes, a single integration test |

**Rules for AI agents**

1. Before starting: set the task to `in_progress`, note the date, and skim this file + linked docs.
2. Prefer the **next unchecked task in the lowest unfinished phase** unless the user picks something else.
3. One task per session when possible. If blocked, mark `blocked` + reason; don’t silently skip to Phase 4+.
4. When done: check the box, set status `done`, add a one-line note (PR/commit or “what changed”). Mark related items in `vulnerabilities.md` / `code-quality.md` if those docs track the same work.
5. After a security or auth task: add/extend an integration test if it locks the behavior.
6. Don’t mark a parent phase “done” until its required tasks are done (optional/defer items can stay open).

**Status legend:** `todo` · `in_progress` · `done` · `blocked` · `deferred`

---

## Phase 0 — Safety

| Status | Task | Notes |
|--------|------|-------|
| done | [x] JWT identity bound to session user (`payload.sub === session.userId`; prefer role from DB/session) | vulns #1 — 2026-07-20: access strategy binds + returns DB role; refresh-by-session checks sub |
| done | [x] OAuth email auto-link only if existing email verified (or explicit link flow) | vulns #2 — 2026-07-20: verified → link; unverified → strip + new OAuth user |
| done | [x] Protect Bull Board (`/admin/queues`) | vulns #3 — 2026-07-20: ADMIN cookie/Bearer middleware; `BULL_BOARD_ENABLED=false` to disable |
| done | [x] Fail fast if JWT secrets missing/empty | vulns #4 — 2026-07-20: `requireJwtSecrets()` at boot + strategies |
| deferred | [ ] Public articles: default `PUBLISHED` only | vulns #5 — articles are AI CRUD reference (guidev2), not a product surface; discarded 2026-07-20 |
| done | [x] File serve + `avatarPath` / delete path confinement | vulns #6–7 — 2026-07-20: `resolveWithinRoot`; avatarPath not client-writable |
| done | [x] Stop logging `DATABASE_URL` / reset & verify tokens | vulns #10 — 2026-07-20: no DB URL/token URLs in logs |
| done | [x] Email rate limiting (forgot password, verify email, etc.) | 2026-07-20: existing `@Throttle` + per-email `EMAIL_SEND_COOLDOWN_MS` (default 60s) |

*Optional in this phase (cheap Highs): OAuth `state`/PKCE (#8), CSRF / SameSite plan (#9) — can follow immediately after criticals.*

---

## Phase 1 — Foundation (stop the clone tax)

| Status | Task | Notes |
|--------|------|-------|
| done | [x] Batch `likedByMe` (`enhanceWithLikes` N+1 → one `findMany`) | code-quality — 2026-07-20: single `findMany` + Set lookup |
| deferred | [ ] Collapse dual pagination (keep offset for admin, cursor for feeds; delete dead aliases/`findAll`) | intentional: posts/articles are boilerplate showing both styles as code reference; deleted on real projects — 2026-07-20 |
| deferred | [ ] Articles DRY pilot: admin = domain service + audit; one form/schema on web | articles/posts are placeholders + guide reference — improve via guidev2, not product refactors |
| done | [x] Update CRUD guide / form variants (no media, simple, complex) + admin create | already done in guidev2 — 2026-07-20: a/b/c media paths (none/simple/complex); admin create in `3-admin-create.md` + `22-admin-create.md` (ADMIN gate) |
| done | [x] Single Prisma schema for api + worker | code-quality #7 — 2026-07-20: api schema canonical; `db:sync-schema` stamps worker copy (+ `--check` drift guard); worker migrations deleted, worker only generates |
| done | [x] Dockerize full stack (per-app images + compose; registry pull for prod) | Deploy — 2026-07-21: local stack + manual GHCR publish scripts + pull-only VM compose/update script; VM never builds |

---

## Phase 2 — Auth / account hardening

| Status | Task | Notes |
|--------|------|-------|
| done | [x] Login with username **or** email | 2026-07-21: `findByLoginAuth`; `@` → email (ci); wire field still `username`; web label updated |
| done | [x] Password required to delete account | 2026-07-21: `DeleteAccountDto.password`; sessions invalidated on soft-delete; settings modal asks for password |
| done | [x] Enforce account status (banned / suspended) for real | 2026-07-21: shared `evaluateAccountAccess`; OAuth gated; `statusExpireAt` auto-restore; admin kill sessions on restrict |
| deferred | [ ] Mod role scopes (define powers first; often after Reports) | no Report feature yet — defer to Phase 3 with Reports |

---

## Phase 3 — Content model

| Status | Task | Notes |
|--------|------|-------|
| done | [x] Private/public visibility (posts, collections, likes) | 2026-07-21: `Visibility` on Post/Collection; defaults PUBLIC/PRIVATE; API viewer filters + private→404; owner may add private posts to own collections (viewers skip unavailable items); web selects + private badge |
| todo | [ ] Search + likes for collections | after visibility |
| todo | [ ] Profile / scoped search (posts, articles, liked, collections by user) | polish — query within by-user / liked lists; reuse search DTOs + visibility |
| todo | [ ] View history | |
| todo | [ ] Report feature (post, user, comment, …) | unlocks mod + admin public remove |
| todo | [ ] Admin remove-content buttons on public pages | after reports / mod model |

---

## Phase 4 — Engagement / worker

| Status | Task | Notes |
|--------|------|-------|
| todo | [ ] User preferences model (theme, layout, resume, onboarding, snoozes) | not localStorage-only |
| todo | [ ] Notification system (worker + UI + preference toggles) | |
| todo | [ ] Email on account status changes | reuses notification/email path |
| todo | [ ] Comments on comments | |
| todo | [ ] Reactions (replace binary likes) | **last** in this phase — migration |

---

## Phase 5 — Admin / polish / SEO

| Status | Task | Notes |
|--------|------|-------|
| todo | [ ] Mass delete (findMany / deleteMany) | |
| todo | [ ] Active now: guests (anonymous id + Redis TTL) | |
| todo | [ ] Custom domain/company email from admin | |
| todo | [ ] Stripe admin actions (refund, invoice, cancel, …) | |
| todo | [ ] Guide: how to make a new email job | |
| todo | [ ] `robots.txt` + `sitemap.xml` | |
| todo | [ ] `llms.txt` (optional `llms-full.txt`) | |
| todo | [ ] `/.well-known/security.txt` | |
| deferred | [ ] `humans.txt` | vanity |

---

## Ongoing (not a phase gate)

Do these **alongside** feature work, not as a final dump.

| Status | Task | Notes |
|--------|------|-------|
| todo | [ ] Integration tests for each behavior you lock (IDOR, soft-delete, visibility, auth) | don’t save for “the end” |
| todo | [ ] Remaining High/Medium vulns (CSRF, OAuth state, role-from-DB, Multer limits, …) | after Phase 0 criticals |
| todo | [ ] Remaining code-quality (server-read / hydrate Query, `packages/shared`, god-service splits, soft-delete `$transaction`) | after Phase 1 pilots |

---

## Changelog (newest first)

_Add a line when you complete a task._

| Date | Task | Note |
|------|------|------|
| 2026-07-21 | Phase 2 — Password delete + status enforcement | Password required for self-delete; OAuth/JWT/refresh honor status + expiry; mod scopes deferred to Reports |
| 2026-07-21 | Phase 2 — Login username or email | `findByLoginAuth`; email case-insensitive; LoginForm label + schema |
| 2026-07-21 | Phase 1 — Pull-only VM deployment | Manual local build/push to GHCR; immutable tags; `docker-compose.prod.yml` + `deploy-images-vm.sh` |
| 2026-07-20 | Phase 1 — Dockerize full stack | Per-app Dockerfiles + `docker-compose.stack.yml`; `stack:*` scripts; migrate one-shot; web `API_INTERNAL_URL` for SSR |
| 2026-07-20 | Phase 1 — Single Prisma schema | api canonical + synced worker copy (`db:sync-schema` / `--check`); worker migrations removed, api owns migrate |
| 2026-07-20 | Phase 1 — CRUD guide / form variants + admin create | Already shipped in guidev2 (a/b/c media paths + `3-/22-admin-create.md`); marked done, tracker was stale |
| 2026-07-20 | Phase 1 — Dual pagination (deferred) | Intentional boilerplate: both styles kept as code reference; resource deleted on real projects |
| 2026-07-20 | Phase 1 — Batch `likedByMe` | `enhanceWithLikes` now one `findMany` + Set; was N+1 per list item |
| 2026-07-20 | Phase 0 — Email send rate limiting | Confirmed existing `@Throttle`; added per-email cooldown (`EMAIL_SEND_COOLDOWN_MS`) |
| 2026-07-20 | Phase 0 — Stop logging secrets/tokens | No DATABASE_URL or reset/verify token URLs in logs |
| 2026-07-20 | Phase 0 — File path confinement | `resolveWithinRoot` for serve/delete; client cannot set `avatarPath` |
| 2026-07-20 | Phase 0 — Article PUBLISHED (deferred) | Discarded: articles are guide/reference boilerplate, not product content |
| 2026-07-20 | Phase 0 — JWT secret fail-fast | `requireJwtSecrets()` at boot + strategies; no empty-string fallback |
| 2026-07-20 | Phase 0 — Bull Board auth | ADMIN session/Bearer middleware on `/admin/queues`; optional disable via env |
| 2026-07-20 | Phase 0 — OAuth email auto-link | Verified-only merge; unverified email stripped + new OAuth user; unit tests |
| 2026-07-20 | Phase 0 — JWT↔session binding | Access strategy requires `sub === session.userId`, `req.user` from DB; refresh-by-session checks sub; integration test for mismatched cookies |
| — | — | Tracker created; nothing completed yet |
