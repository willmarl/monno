# guidev2 — path-based CRUD implementation guide

Session 2 entry: **[ROUTER.md](./ROUTER.md)**

## Why this exists

A single mega-guide put all three upload styles in one context window and models blended them. Here, media paths are exclusive files:

| Letter | `fileUpload` | Example files        |
| ------ | ------------ | -------------------- |
| a      | none         | `2a.md`, `3a.md`, …  |
| b      | simple       | `2b.md`, `3b.md`, …  |
| c      | complex      | `2c.md`, `3c.md`, …  |

Shared chapters (`4.md`, `6.md`, …) have no letter. Feature gates (admin/search/likes/…) are skip rules in ROUTER + file headers.

**Admin dashboard create:** `3-admin-create.md` (backend) + `22-admin-create.md` (frontend) when `ADMIN=yes`.

## For humans

1. Run `pnpm run crud` as usual — CLI prints `PATH_LETTER` and a **copy-paste Session 2 block**.
2. Session 2: paste that block (brief + progress + ROUTER + CONFIG). Do not hand-write a weaker prompt.
3. When context fills: new chat + the CLI **checkpoint continue** block (same PATH_LETTER, last completed file).

## For AIs

See ROUTER.md. One letter only. Never open sibling path files. Follow `<!-- NEXT: … -->` footers.
