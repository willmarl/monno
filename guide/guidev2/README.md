# guidev2 — path-based CRUD implementation guide

Session 2 entry: **[ROUTER.md](./ROUTER.md)**

## Why this exists

The old monolith (`../how-to-add-new-resource.md`) put all three upload styles in one context window. Models blended them. Here, media paths are exclusive files:

| Letter | `fileUpload` | Example files        |
| ------ | ------------ | -------------------- |
| a      | none         | `2a.md`, `3a.md`, …  |
| b      | simple       | `2b.md`, `3b.md`, …  |
| c      | complex      | `2c.md`, `3c.md`, …  |

Shared chapters (`4.md`, `6.md`, …) have no letter. Feature gates (admin/search/likes/…) are skip rules in ROUTER + file headers.

**Admin dashboard create:** `3-admin-create.md` (backend) + `22-admin-create.md` (frontend) when `ADMIN=yes`.

## For humans

1. Run `pnpm run crud` as usual.
2. Session 2: attach `PROJECT-BRIEF-*`, `PROGRESS-*`, and **`guide/guidev2/ROUTER.md`** (not the monolith).
3. Let the AI resolve letter `a`/`b`/`c` and follow `<!-- NEXT: … -->` footers.

## For AIs

See ROUTER.md. One letter only. Never open sibling path files or the monolith.
