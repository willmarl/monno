# ROUTER — Implementation Adventure Map

**You are the Implementation AI.** Do not invent features. Do not read files that are not on your path.

This file is the **only** entry point for Session 2. Resolve your route once, write it down, then follow `NEXT` links. Never open sibling `a`/`b`/`c` files for a different media path.

---

## Step 0 — Load decisions (required)

Read these first (and nothing else yet):

1. `PROJECT-BRIEF-{{resource}}.md`
2. `PROGRESS-{{resource}}.md` (or `CONFIG-{{resource}}.json` if present)
3. Confirm schema exists in `apps/api/prisma/schema.prisma` (migrated + generated)

If schema is missing → **STOP**. Tell the human to migrate first.

---

## Step 1 — Resolve media letter

From CONFIG / PROGRESS / brief `fileUpload`:

| `fileUpload` | Letter | Meaning                                      |
| ------------ | ------ | -------------------------------------------- |
| `none`       | **a**  | No upload                                    |
| `simple`     | **b**  | Single file field (`imagePath` / `filePath`) |
| `complex`    | **c**  | Multi-file via `Media` model + sub-routes    |

**Lock your letter now.** Example: `MY_PATH = b`

You will only open files ending in your letter (or shared files with no letter).

---

## Step 2 — Resolve feature gates

Copy this checklist into your working notes (true/false from brief):

```
PATH_LETTER: a | b | c
ADMIN: yes | no
SEARCH: none | basic | suggest
PAGINATION: none | offset | cursor | both
FRONTEND: yes | no
PAGINATION_UI: numbered | cursor | both | none
PROFILE: yes | no
VISIBILITY: none | defaultPublic | defaultPrivate
LIKES: yes | no
VIEWS: yes | no
COMMENTS: yes | no
COLLECTIONS: yes | no
```

**Note:** `VISIBILITY` is a schema/feature gate (column + helpers), **not** a media path letter. Do not invent path `d` / `D`.

---

## Step 3 — Hard rules

1. **One letter only.** If `PATH_LETTER=b`, never open `*a.md` or `*c.md`.
2. **Do not open `_source/`** if it exists — archived originals.
3. After finishing a file, follow its `<!-- NEXT: ... -->` footer (or the table below if footer missing).
4. Update `PROGRESS-{{resource}}.md` checkboxes as you complete each part.
5. Skip any step labelled admin/search/likes/visibility/etc. when that gate is false — even if the file is on your list.

---

## Step 4 — Your reading order

Replace `{L}` with your letter (`a`, `b`, or `c`).

### Backend (always)

| Order | File                         | Gate / notes                                      |
| ----- | ---------------------------- | ------------------------------------------------- |
| 0     | `0_preamble.md`              | Schema adapt rules only; skip planning checklists |
| 1     | `1.md` then `1{L}.md`        | Admin file creates: only if ADMIN                 |
| 2     | `2{L}.md`                    | Exclusive templates for your media path           |
| 3     | `3.md` then `3{L}.md`        | Basic create + path upload delta                  |
| 4     | `4.md`                       | Skip offset and/or cursor sections per PAGINATION |
| 5     | `5.md` then `5{L}.md`        | Basic update + path upload delta                  |
| 5v    | `visibility.md`              | **SKIP entire file** if VISIBILITY=none           |
| 6     | `6.md`                       | Skip admin steps if !ADMIN                        |
| 7     | `7.md`                       | **SKIP entire file** if !ADMIN                    |
| 7b    | `3-admin-create.md`          | **SKIP** if !ADMIN — `POST /admin/{{resource}}`   |
| 8     | `8.md` then `8c.md` if L=c   | `8c.md` only for complex media test endpoints     |
| 9     | `9.md`                       | **SKIP entire file** if SEARCH=none               |
| 10    | `10.md`                      | Only subsections for enabled resource actions (views→history; reports→REPORTABLE_RESOURCES; notifications→NOTIFIABLE_RESOURCES) |
| 11    | `11.md`                      | Always (swagger)                                  |

If `FRONTEND=no` → stop after Part 11. Hand off to human for endpoint testing.

### Frontend (only if FRONTEND=yes)

| Order | File                         | Gate / notes                                      |
| ----- | ---------------------------- | ------------------------------------------------- |
| 12    | `12.md`                      | Admin folders only if ADMIN                       |
| 13    | `13.md` then `13{L}.md`      | Types/api/hooks base + path upload deltas         |
| 14    | `14.md` then `14{L}.md`      | Create forms                                      |
| 15    | `15.md` then `15{L}.md`      | Edit forms; admin steps only if ADMIN; visibility select if VISIBILITY≠none |
| 16    | `16{L}.md`                   | Card/component (path-exclusive); private badge if VISIBILITY≠none |
| 17    | `17.md`                      | List/pagination UI per PAGINATION_UI              |
| 18    | `18.md`                      | Pages; profile section only if PROFILE            |
| 18b   | `profile-search.md`          | **SKIP** if !PROFILE — by-user / liked scoped `query` |
| 19    | `19.md` then `19{L}.md`      | **SKIP** if !ADMIN; columns media fork in `19{L}` |
| 22    | `22-admin-create.md`         | **SKIP** if !ADMIN — dashboard create button/form |
| 20    | `20.md`                      | **SKIP entire file** if SEARCH=none               |
| 21    | `21.md`                      | Only subsections for enabled resource actions (views→history tabs; reports→ReportButton; notifications→href) |

---

## Step 5 — Start

1. Write your resolved checklist into the chat (one short block).
2. Open `0_preamble.md`.
3. Then open `1.md` → `1{L}.md` → continue via NEXT.

**Do not** preload later chapters. One file (or shared+letter pair) at a time.
