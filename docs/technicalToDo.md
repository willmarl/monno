# Technical backlog

Engineering follow-ups after Phases 0–5 and the security audit. Product feature ideas that shipped live in [progress.md](./progress.md); architecture detail lives in [code-quality.md](./code-quality.md).

**How to use:** pick one item per session. Prefer tests that lock security behavior, then high-leverage architecture.

---

## Testing

- [ ] Grow API integration tests for locked behaviors (IDOR, soft-delete PATCH, ownership, visibility, auth session binding)
- [ ] Cover thin spots: admin, articles/media, Stripe, OAuth (see code-quality test-gap notes)
- [ ] Optional Playwright smoke: login → reset password → logout; private post 404 for non-owner

---

## Architecture / code quality

Ordered roughly by impact (aligns with [code-quality.md](./code-quality.md)):

1. [ ] **Server-read + hydrate Query** — fetch list/detail on the server (or `prefetchQuery` + `HydrationBoundary`); keep Query for mutations / infinite scroll / session
2. [ ] **Shrink `'use client'` page shells** — server page = layout + data + chrome; client only for interactive islands
3. [ ] **One session source of truth** — pass `getServerUser` / hydrate `['session']`; stop double-gating with discarded `requireAuth` + client refetch
4. [ ] **`packages/shared`** — Zod (or OpenAPI) shared between Nest DTOs and web schemas
5. [ ] **Soft-delete / like `$transaction`** — cascade delete and like count ±1 atomic; shared `{ deleted, deletedAt }` helper
6. [ ] **God-service splits** — e.g. `UsersService` → lifecycle vs query vs profile when next touching those paths
7. [ ] **Shared email/Resend helper** for api + worker (Prisma schema sync already done)
8. [ ] **Global `PrismaModule`** + extract search DTO bool/field helpers; stop liked-list pagination forks
9. [ ] **Admin ↔ public DRY** — only when building a *real* resource (posts/articles stay reference clones by design)

**Intentionally deferred (reference boilerplate):** dual offset+cursor pagination on posts/articles; full articles admin DRY pilot.

---

## Product / polish leftovers

- [ ] Mod role scopes (powers after Reports — still deferred in progress)
- [ ] Analytics cookie / consent banner if required in your region (PostHog PII already minimized)
- [ ] Notification expansions: websocket or push; optional reaction notifications
- [ ] Two-way support email (Workspace / Zoho inbound → tickets)
- [ ] Wire remaining `UserPreferences` (layout, resume, onboarding, snoozes — theme already live)
- [ ] Split worker queues (email vs media vs long jobs) when load warrants it
- [ ] Move `Comment` UI into `features/comments` (split thread chrome vs body)
- [ ] `humans.txt` (vanity)

---

## Deploy / ops

- [ ] Publish/push local `main` when ready (often many commits ahead of origin)
- [ ] Prod smoke checklist: TLS/nginx, `TRUST_PROXY`, Swagger off, env templates, image pull deploy
- [ ] Optional: worker `replicas` for heavy jobs without scaling api/web the same way

---

## Related docs

| Doc | Role |
|-----|------|
| [progress.md](./progress.md) | Phased status + changelog (source of truth for what’s done) |
| [code-quality.md](./code-quality.md) | Architecture findings and suggested fix order |
| [vulnerabilities.md](./vulnerabilities.md) | Security audit (Critical→Low mostly fixed) |
| [tests.md](./tests.md) | How to run tests / coverage notes |
| [docker-deploy.md](./docker-deploy.md) | Image publish + VM pull deploy |
