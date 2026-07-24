## Monno V2

> **Execution order & status:** see [progress.md](./progress.md) (phased tracker). This file is the idea backlog; `progress.md` is what to do next and what’s done.

**Auth & User Management**

- ~~Login with username or email (currently just username)~~ — done (see progress)
- ~~Email notifications for account status changes (banned, restored, deleted, etc)~~ — done 2026-07-22
- ~~Make inputting password required to delete account~~ — done
- ~~Make roles (mod) and status (banned, suspended) functional instead of being a placeholder~~ — status done; mod deferred until Reports
- ~~User preferences model (or `UserInfo` / key-value on user) synced across devices — not localStorage-only~~ — done 2026-07-22 (`UserPreferences` + theme sync; layout/resume/onboarding/snoozes API-ready)
  - Theme (light/dark) preference
  - View/layout prefs (e.g. grid vs card on list pages)
  - Last tab, page, or route context to resume where you left off
  - Onboarding / tutorial completed (or dismissed)
  - “Remind me later” snoozes (feature prompts, banners, etc.)

**Admin Dashboard**

- ~~Custom domain/company email sending from admin panel~~ — done 2026-07-23 (from/support via Setting; one-way compose to selected users or all; Resend DNS still external)
  - Later: two-way mail via Google Workspace / Zoho (inbound replies → support tickets)
- ~~Mass delete operations (findMany, deleteMany)~~ — done 2026-07-23 (admin bulk soft-delete via `updateMany`; not hard delete)
- ~~Special admin buttons on public pages to remove content (comments, posts, etc) without entering dashboard~~ — done 2026-07-22
- ~~Active now: track guests too (anonymous client id + Redis TTL heartbeat; show users/guests split or combined). Logged-in already uses session `lastUsedAt`~~ — done 2026-07-23

**Main Resources/Modules**

- ~~View history feature (view history of posts, articles, etc)~~ — done 2026-07-22 (upsert + `/history` soft-delete)
- Search and likes for collections — done 2026-07-22 (public search + COLLECTION likes)
- ~~Profile / scoped search: query filter on posts-by-user, articles-by-user, liked-by-user, collections-by-user~~ (done 2026-07-22)
- ~~Private/public visibility toggle for posts, collections, likes~~ (done 2026-07-21)
  - Owner may add private posts to own collections; viewers skip unavailable items; private/deleted detail → 404 copy
- ~~Report feature (post, user, comment, etc)~~ — done 2026-07-22 (content + user profile reports; admin queue; MOD later)

**Sub Resources/Modules**

- ~~Comments on comments~~ — done 2026-07-22 (Reply UI; nested via COMMENTABLE; YouTube-style rails + replies toggle)
  - Later: move `Comment` from `components/ui` → `features/comments`; split thread chrome vs body (not urgent)
- ~~Reactions system (emoji reacts on posts/comments) **alongside** binary likes — Discord-style~~ — done 2026-07-22
  - Keep existing like/unlike; fixed emoji allowlist; optional later: reaction notifications

**Worker (BullMQ)**

- ~~Notification system (email/push and UI component)~~ — done 2026-07-22 (in-app bell + email on comment/like; prefs; no push/websocket yet)
  - Trigger on likes, views, comments, etc
  - Expand settings to toggle which notifications to receive

**3rd Party**

- ~~Stripe admin dashboard for admin actions (refund, view invoice, cancel payment, etc)~~ — done 2026-07-23 (refunds, cancel at period end / immediate, invoice list/send/void)

**Testing**

- Integration tests (e.g., "can't delete another person's post") with vitest + supertest

**Security**

- Fix remaining High/Medium findings in [vulnerabilities.md](./vulnerabilities.md) (soft-delete update #16, frontend ownership #18, …). Through #15 MIME magic done; see [progress.md](./progress.md).

**Code quality / architecture**

- Improve remaining patterns in [code-quality.md](./code-quality.md) (next: single Prisma schema, server-read / hydrate Query, `packages/shared`, then god-service splits). `likedByMe` is fixed; dual pagination and the articles DRY pilot are intentionally deferred for the reference resources.

**Deploy / Infra**

- ~~Dockerize the full stack so deploy is mostly env + `compose up` (no manual app setup each time)~~ — done: local stack, per-app images, manual GHCR publish, and pull-only VM compose/update script. Host nginx/certbot still terminate TLS.
  - One Dockerfile per app → separate images: api, web, worker (not one fat “whole stack” image)
  - Compose wires them with postgres + redis; prod pulls images built/pushed from the main PC instead of building on the low-spec VM
  - Scale workers independently (compose `replicas` / multiple worker containers) for heavy jobs later — AI, account export/import, etc. — without scaling api/web the same way
  - Optional later: split workers by queue (email vs media vs long-running) so one slow job type doesn’t starve others

**Public site files**

- ~~`robots.txt` — crawl rules for search engines (allow/disallow admin, auth, API paths; link sitemap)~~ — done 2026-07-23 (`apps/web/src/app/robots.ts`)
- ~~`llms.txt` — LLM-oriented site summary (convention is `llms.txt` at root, not `llm.txt`; optional `llms-full.txt` for longer docs)~~ — done 2026-07-23 (`/llms.txt`, `/llms-full.txt`)
- ~~`/.well-known/security.txt` — security contact + disclosure policy (RFC 9116; useful in prod)~~ — done 2026-07-23
- ~~`sitemap.xml` — not `.txt`, but usually paired with `robots.txt` for SEO~~ — done 2026-07-23 (`apps/web/src/app/sitemap.ts`)
- Optional: `humans.txt` — credits / “who built this” (low priority, mostly vanity)

**Guides**

- ~~Instructions for AI on how to make new email job~~ — done 2026-07-23 (`docs/email-job.md`)
