## Monno V2

> **Execution order & status:** see [progress.md](./progress.md) (phased tracker). This file is the idea backlog; `progress.md` is what to do next and what’s done.

**Auth & User Management**

- Login with username or email (currently just username)
- Email notifications for account status changes (banned, restored, deleted, etc)
- Make roles (mod) and status (banned, suspended) functional instead of being a placeholder
- Email rate limiting / request tracking (prevent spam on forgot password, verify email, etc) to run up resend API cost — **done:** IP `@Throttle` + per-email `EMAIL_SEND_COOLDOWN_MS` (see progress)
- Make inputting password required to delete account
- User preferences model (or `UserInfo` / key-value on user) synced across devices — not localStorage-only
  - Theme (light/dark) preference
  - View/layout prefs (e.g. grid vs card on list pages)
  - Last tab, page, or route context to resume where you left off
  - Onboarding / tutorial completed (or dismissed)
  - “Remind me later” snoozes (feature prompts, banners, etc.)

**Admin Dashboard**

- Custom domain/company email sending from admin panel
- Mass delete operations (findMany, deleteMany)
- Special admin buttons on public pages to remove content (comments, posts, etc) without entering dashboard
- Active now: track guests too (anonymous client id + Redis TTL heartbeat; show users/guests split or combined). Logged-in already uses session `lastUsedAt`

**Main Resources/Modules**

- View history feature (view history of posts, articles, etc)
- Search and likes for collections
- Private/public visibility toggle for posts, collections, likes
  - Ensure private content isn't included in collections
  - Render as "private/deleted" if changed from public to private
- Report feature (post, user, comment, etc)

**Sub Resources/Modules**

- Comments on comments
- Reactions system (like, dislike, react emoji) instead of just binary likes
  - Update posts and comments to support reactions

**Worker (BullMQ)**

- Notification system (email/push and UI component)
  - Trigger on likes, views, comments, etc
  - Expand settings to toggle which notifications to receive

**3rd Party**

- Stripe admin dashboard for admin actions (refund, view invoice, cancel payment, etc)

**Testing**

- Integration tests (e.g., "can't delete another person's post") with vitest + supertest

**Security**

- Fix vulnerabilities listed in [vulnerabilities.md](./vulnerabilities.md) (Critical first: JWT↔session binding, OAuth email auto-link takeover, unauthenticated Bull Board, empty JWT secret fallback; then High/Medium)

**Code quality / architecture**

- Improve patterns listed in [code-quality.md](./code-quality.md) (priority: batch `likedByMe` N+1, collapse dual pagination, DRY admin↔user via articles pilot, server-read / hydrate Query, `packages/shared` + single Prisma schema, then god-service splits)

**Deploy / Infra**

- Dockerize the full stack so deploy is mostly env + `compose up` (no manual app setup each time)
  - One Dockerfile per app → separate images: api, web, worker (not one fat “whole stack” image)
  - Compose wires them with postgres + redis; prod should pull prebuilt images from a registry (CI builds/pushes), not build from Git on the server
  - Scale workers independently (compose `replicas` / multiple worker containers) for heavy jobs later — AI, account export/import, etc. — without scaling api/web the same way
  - Optional later: split workers by queue (email vs media vs long-running) so one slow job type doesn’t starve others

**Public site files**

- `robots.txt` — crawl rules for search engines (allow/disallow admin, auth, API paths; link sitemap)
- `llms.txt` — LLM-oriented site summary (convention is `llms.txt` at root, not `llm.txt`; optional `llms-full.txt` for longer docs)
- `/.well-known/security.txt` — security contact + disclosure policy (RFC 9116; useful in prod)
- `sitemap.xml` — not `.txt`, but usually paired with `robots.txt` for SEO
- Optional: `humans.txt` — credits / “who built this” (low priority, mostly vanity)

**Template**

- ~~make variant of create and edit forms with no media, simple file upload, complex multimedia. Will help AI for code reference~~ — done in guidev2 (a/b/c media paths)
- ~~add admin create to guide~~ — done in guidev2 (`3-admin-create.md` + `22-admin-create.md`)

**Guides**

- Instructions for AI on how to make new email job
