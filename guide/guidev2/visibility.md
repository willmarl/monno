# Visibility (private / public)

> **SKIP this entire file if `CONFIG.visibility` / `VISIBILITY` is `none`.**
> This is a **feature gate**, not a media path letter. Do not invent `d.md` / path D.

Reference: `Post` (default PUBLIC) and `Collection` (default PRIVATE). Product rules live in `FLOWS.md`.

---

## What this is (and is not)

| Visibility | Polymorphic addons (likes / comments / collections) |
| ---------- | --------------------------------------------------- |
| Column on **this** resource model | Shared tables keyed by `ResourceType` |
| Reuse `Visibility` enum + `src/common/visibility/visibility.ts` | Add to `LIKEABLE_*` / `COMMENTABLE_*` / etc. |
| **Do not** add `PRIVATEABLE_RESOURCES` | Allowlists in `resource.types.ts` |

CONFIG values:

| `visibility`       | Model default |
| ------------------ | ------------- |
| `defaultPublic`    | `PUBLIC`      |
| `defaultPrivate`   | `PRIVATE`     |

---

## Backend

### 1 — Schema

Reuse the existing enum (do not create a second one):

```prisma
enum Visibility {
  PUBLIC
  PRIVATE
}
```

On `{{resource}}`:

```prisma
visibility Visibility @default(PUBLIC) // or PRIVATE per CONFIG
@@index([visibility])
```

### 2 — DTOs

`Create{{resource}}Dto` / `Update{{resource}}Dto`: optional `@IsEnum(Visibility) visibility?`.

Omit → Prisma default applies.

### 3 — Helpers (reuse — do not copy-paste new ones)

`apps/api/src/common/visibility/visibility.ts`:

- `publicVisibilityWhere()` — feeds / global search
- `visibilityWhereForViewer(ownerId, viewerId)` — by-user lists for one owner
- `visibilityWhereForContentViewer(viewerId)` — mixed-creator lists (liked-by-user)
- `canViewPrivateContent(creatorId, viewerId)` — findById / mutations

### 4 — Service rules

1. Include `visibility: true` in default select.
2. **Global search / home feeds:** `...publicVisibilityWhere()`.
3. **findByUserId:** `...visibilityWhereForViewer(userId, viewerId)`.
4. **findById:** if `PRIVATE` and `!canViewPrivateContent(creator.id, viewerId)` → `NotFoundException` (same as soft-delete — not 403).
5. Pass `viewerId` from `JwtAccessOptionalGuard` (`req.user?.sub`).
6. **Liked-by-user** (if likes enabled): filter posts with `visibilityWhereForContentViewer(viewerId)` so a later-privatized like disappears for non-creators.

### 5 — Collections (only if this resource is collectable)

- Owner **may** add their **own** private items to their collections.
- Adding someone else’s private item → treat as not found.
- Public collection viewers who can’t see a private item: **skip** the slot (YouTube playlist style). UI: null on 404, not “Loading forever”.

---

## Frontend (skip if `FRONTEND=no`)

### 1 — Types / Zod

`visibility: "PUBLIC" | "PRIVATE"` on the resource type; create schema default from CONFIG; update schema optional.

### 2 — Forms

Public/Private `<Select>` on create + edit (Controller + shadcn Select). Defaults: PUBLIC or PRIVATE per CONFIG.

### 3 — Cards / detail

- Private badge when `visibility === "PRIVATE"` (owner still sees their items).
- Detail `generateMetadata`: forward `Cookie` header from `cookies()` — `credentials: "include"` alone does **not** auth server fetches. On non-OK, return fallback title (no throw).
- Detail 404 copy: “private, deleted, or does not exist.”
- **Add to collection:** show for public items; for private, only when `isOwner` (post creator).

### 4 — Lists that embed items

Collection (or similar) item rows: on fetch `isError` / 404 → render `null`, not a stuck loading state.

---

## Manual QA

- [ ] Non-owner / guest: private by-id → not found
- [ ] Owner: private by-id → OK + badge
- [ ] Home/search: no others’ private items
- [ ] Own profile: owner sees private; other viewers do not
- [ ] Privatize after like: drops from liker’s liked list
- [ ] Owner can add own private item to collection; other viewers skip it

<!-- NEXT: 6.md -->
