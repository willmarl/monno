# Code quality & architecture

Findings from a static architecture review of `apps/web`, `apps/api`, and `apps/worker`. Not about security — see [vulnerabilities.md](./vulnerabilities.md) for that. Track remediation via [futureToDo.md](./futureToDo.md).

**Verdict:** The modularity attempt mostly worked (feature folders, shared search kit, media layer, polymorphic likes/comments). The main drag is **template cloning** (admin × public × offset × cursor) plus treating Next App Router as a **shell around a client SPA**. Future-proofing is threatened less by bad Nest boundaries than by multiplication every time the CRUD guide scaffolds a resource.

---

## What’s working (keep)

| Area | Why it works |
|------|----------------|
| Feature folders (`api` / `hooks` / `schemas` / `types`) | Clear domain boundaries for client API + Query |
| Shared search kit | `SearchBar` + configs + thin wrappers — real DRY |
| Shared media | `MediaManager` / media-utils used by user + admin article forms |
| Polymorphic sub-resources | Likes, comments, collections, views with config maps |
| Nest module shape | Controllers mostly thin; Prisma `select` for public payloads |
| Worker job dispatcher | Small handler map — easy to grow |
| Explicit ValidationPipe | whitelist + forbidNonWhitelisted + transform |

---

## High impact

### 1. App Router is ceremonial — data is still a client SPA

- **Where:** `apps/web` — thin `page.tsx` files call `requireAuth` / `getServerUser`, then render `'use client'` trees under `components/pages/*`
- **Scale:** ~half of `src` TS/TSX uses `'use client'`. Almost no `page.tsx` is client; sprawl is one level down so the whole route becomes a client tree.
- **Issue:** Lists/details always refetch with TanStack Query + `ky`. No RSC content load, no `prefetchQuery` / `HydrationBoundary`. Detail pages often set `document.title` in `useEffect` even when `generateMetadata` exists.
- **What good looks like:** Server-read, client-mutate. Fetch public/list/detail on the server (or prefetch + hydrate Query). Keep Query for mutations, infinite scroll, live session. Prefer `generateMetadata` over client `document.title`.

### 2. `'use client'` at the page-composition layer

- **Issue:** The habit isn’t “mark every `page.tsx` client.” It’s mark the **page shell** client (`DefaultPostPage`, admin list pages, etc.), so Server Components never compose layout + initial data. Interactive islands (forms, tables, search) *should* be client.
- **What good looks like:** Server page = layout + initial data + static chrome. Leaf interactive islands only. Don’t mark the whole page module client unless most of it is interactive.

### 3. Dual auth path — server helpers often wasted

- **Where:** `features/auth/server.ts` vs `useSessionUser` (~20+ call sites)
- **Issue:** `requireAuth()` then discard user; client re-checks with Query. Edit flows double-gate (server auth + client ownership effects). Inconsistent gates (e.g. some purchase routes require auth, siblings don’t).
- **What good looks like:** One source of truth per request. Pass server user into client leaves, or hydrate `['session']` once. Prefer server redirects for auth/ownership; client checks for UX after hydration.

### 4. Admin ↔ user CRUD is copy-paste, not composition

**Web:** Near-duplicate create/edit forms, schemas, and types (articles especially — admin has its own `features/admin/articles/*` while posts admin lives inside public `features/posts`). Collections/posts follow the same twin pattern.

**API:** Admin posts/articles/collections/comments reimplement find/search/update/soft-delete/restore with near-identical Prisma + `adminService.log`. Admin users correctly delegate cascade delete to `UsersService` — that pattern should be the default.

- **What good looks like:** One form parameterized by `api` / mutation / schema (or thin admin wrappers). Share Zod where validation is identical; extend types (`AdminArticle = Article & { deleted… }`). Admin Nest layer = domain service + audit, with admin-only filters as parameters — not a second CRUD implementation.

### 5. No shared contract with the API package

- **Issue:** Workspace is only `apps/*` — no `packages/`. Nest class-validator DTOs and web Zod/interfaces are hand-duplicated (same min/max constraints). Drift is inevitable.
- **What good looks like:** Shared Zod (or OpenAPI-generated) types package consumed by Nest and Next. At minimum, codegen from OpenAPI.

### 6. Dual offset + cursor pagination everywhere — **INTENTIONAL (deferred)**

- **Where:** Posts, articles, and most list surfaces (`/`, `/cursor`, `/search`, `/search/cursor`, liked, by-user, …)
- **Issue:** Posts even alias `GET /` and `GET /search` to the same path. Articles keep unused `findAll` / `findAllCursor` after routing list → `searchAll`. Liked-by-user paths reimplement pagination outside shared paginators.
- **Decision (2026-07-20):** Deliberate — posts/articles are boilerplate resources kept as code reference for both pagination styles, and get deleted on real projects. On a real resource: offset for admin tables, cursor for infinite feeds — pick per client need. The CRUD guide should teach picking one, not generating both.

### 7. Worker ↔ API: Prisma (and email) duplicated

- **Issue:** `apps/api/prisma/schema.prisma` and `apps/worker/prisma/schema.prisma` are byte-identical; separate migrations/generate. Email service forked with a comment claiming shared use that isn’t true for the worker copy.
- **Risk:** One side drifts after a hurried migration.
- **What good looks like:** Single schema source (generate both clients from one path). Shared email/Resend helper.

### 8. `enhanceWithLikes` N+1 — **FIXED**

- **Where:** `apps/api/src/common/likes/enhance-with-likes.ts`
- **Issue:** Per-item `like.findUnique` for `likedByMe` on list pages (limit=20 → 20 extra queries). Denormalized `likeCount` is the right read model; `likedByMe` undoes the win.
- **Fix applied (2026-07-20):** One `findMany` with `resourceId: { in: ids }`, mapped in memory via a `Set`. Unit tests updated to assert a single batched query.

---

## Medium impact

### 9. Feature folders are modular in intent, leaky in practice

- **Good:** Domain `api` / hooks / schemas; shared search used well.
- **Leaky:** Parallel UI in `components/pages/` (~87 page TSX files) — unclear ownership (“is ArticleDetail a feature or a page?”). Cross-feature smells (e.g. default Footer → admin support modal). God-ish UI: `Comment.tsx`, `SearchBar.tsx`, large admin `columns.tsx`. Naming noise: `hooks.ts` vs `hook.ts`.
- **What good looks like:** Colocate page compositions under `features/<x>/pages/` *or* keep `components/pages` as pure wiring. Move “Contact support” to a public support feature. Split display vs edit for cards.

### 10. List / table / pagination proliferation

- Solid abstractions exist (`DataTable`, `usePaginatedSearch`, `OffsetPagination`) but still ~11 near-identical admin DataTables, ~12 `columns.tsx`, ~14 SearchBars, dual pagination UI under `components/ui` and `features/search`.
- **What good looks like:** Generic `AdminResourceTable({ columns, hook, url })`. Public `ResourceList` with `mode: 'offset' | 'cursor' | 'infinite'`. Generate SearchBar from config + suggestion hook.

### 11. Forms: inconsistent RHF style; media is relatively good

- Auth forms use shadcn `Form` / `FormField`. Most CRUD forms use raw `register` / `Controller` + manual error `<p>`. Create vs edit duplicate JSX.
- **Keep:** MediaManager as the single upload surface.
- **What good looks like:** One form style (prefer the Form kit). Shared field blocks for title/content/status.

### 12. Server HTTP only for auth

- `features/auth/server.ts` is the only serious cookie-forwarding fetch. Metadata often uses raw `fetch` without cookies. No `'use server'` actions (mutations are all client Query — fine if intentional).
- **What good looks like:** Small server `apiFetch` that always forwards cookies; use for RSC loads and metadata.

### 13. God / overloaded API services

| File | Approx lines | Mixed concerns |
|------|-------------:|----------------|
| `users.service.ts` | ~687 | Cascade delete/restore, CRUD, dual search, profile/avatar, password, email |
| `oauth.service.ts` | ~600 | Multi-provider OAuth (expected large) |
| `articles.service.ts` | ~552 | CRUD, dual search, liked lists, media, collections |
| `posts.service.ts` | ~490 | Same family + dead commented code |
| `admin-*.service.ts` | ~430–450 | Full CRUD twins + media + search |

Natural splits when touching next: `UserLifecycleService`, `*QueryService`, thinner write/media services.

### 14. Soft-delete cascade / like toggle without transactions

- `softDeleteUserWithCascade` and like count ±1 are sequential updates without `$transaction`. Partial failure → inconsistent state.
- Soft-delete `{ deleted, deletedAt }` hand-written everywhere instead of one helper.

### 15. Shared API utils applied inconsistently

- Wins: `common/pagination`, `common/search`, `MediaService`.
- Gaps: ~10 search DTOs each redefine bool transforms / field lists (~1.9k lines); liked lists bypass shared paginators; `DEFAULT_*_SELECT` duplicated admin/public; `PrismaService` copy-pasted into every module (no global `PrismaModule`); sessions controller talks to Prisma directly.

---

## Low impact

- React 19 patterns mostly unused (`useOptimistic`, `use()`, Suspense for details) — `useMemo`/`useCallback` rare (~11), which is fine; don’t add them for habit
- Context is light (`ModalProvider`, sidebar) — not overused
- Dead/demo: `app/(default)/test/page.tsx`
- Duplicate PostHog provider nesting in `providers.tsx`
- `AllExceptionsFilter` registered twice in `main.ts`
- Soft-delete already-deleted: inconsistent return vs `AlreadyDeletedException` across paths
- Admin audit leftover: `adminId: 0, // Will be set by controller` in places
- Test gaps: little admin / articles / media / stripe / oauth coverage (core auth/posts look deliberate)

---

## Suggested fix order

1. Batch `likedByMe` (quick win, real perf)
2. Collapse dual pagination once frontend choice is clear; delete dead `findAll` / search aliases; update CRUD guide
3. Pilot **articles** as the DRY vertical: one form/schema, admin = service + audit, shared types
4. Server-read (or hydrate Query) for article/post detail + list; shrink client page shells to islands
5. `packages/shared` — Zod/OpenAPI + single Prisma schema for api/worker
6. Extract search DTO helpers + soft-delete helper; global `PrismaModule`
7. Transactional user cascade / like toggle when next touching those paths
8. Split `UsersService` when adding lifecycle features from `futureToDo.md`

---

## Honest summary of “modular / future-proof”

| Intent | Outcome |
|--------|---------|
| Feature modules | Succeeded for API/hooks/schemas; undermined by `components/pages` twin and admin forks |
| Shared search | Succeeded |
| Shared media | Succeeded |
| Shared admin tables | Half-done (`usePaginatedSearch` yes; still N cloned DataTables) |
| App Router / RSC | Mostly ceremonial; data layer is SPA + Query |
| DRY admin vs user | Failed for articles/collections/posts forms & services |
| Shared types with API | Not started |
| Dual pagination | Scaffold hangover; doubles every new resource |

This looks like an era when **“use client + React Query for everything”** was the safe default, with modular folders bolted on. The skeleton is worth keeping; the win is moving reads to the server (or hydrating Query), collapsing admin/user twins, picking one pagination style per surface, and tightening the CRUD guide so AI stops cloning.
