# Profile scoped search

> **SKIP this entire file if `PROFILE=no` / `profileIntegration=false`.**
> Not a media path letter. Bundled with profile integration — no separate CLI toggle.

When a resource appears on the user profile, **by-user lists must be searchable** (and liked-by-user lists if LIKES). Global `/search` alone is not enough — owners need to find their own private items from the profile.

Reference: posts / articles / collections profile sections + `ProfileListSearch.tsx`.

---

## Backend (offset `findByUserId`)

### 1 — Accept search DTO on by-user routes

Controller: use `{{resource}}SearchDto` (same as global search) instead of bare `PaginationDto` on:

- `GET /{{resource}}s/users/:userId`

Service: merge `buildSearchWhere` onto the existing where (keep soft-delete, ACTIVE creator, and visibility helpers if VISIBILITY≠none):

```ts
async findByUserId(
  userId: number,
  searchDto: {{resource}}SearchDto,
  viewerId?: number,
) {
  const searchWhere = buildSearchWhere({
    query: searchDto.query ?? '',
    fields: searchDto.getSearchFields(),
    options: searchDto.getSearchOptions(),
  });
  const where = {
    creatorId: userId,
    deleted: false,
    creator: { status: 'ACTIVE' as const },
    // if VISIBILITY≠none:
    // ...visibilityWhereForViewer(userId, viewerId),
    ...searchWhere,
  };
  // offsetPaginate with searchDto.limit / offset / getOrderBy()
}
```

Empty `query` → `buildSearchWhere` returns `{}` (list unchanged).

### 2 — Liked-by-user (only if LIKES=yes)

Do **not** paginate likes then filter text (sparse pages). Prefer:

1. Collect liked resource ids for that user
2. `offsetPaginate` on the resource model with `id: { in: likedIds }` + `buildSearchWhere`
3. If VISIBILITY≠none, `AND: [visibilityWhereForContentViewer(viewerId), searchWhere]` so OR clauses do not clobber each other

Controller: `GET /{{resource}}s/users/:userId/liked` also takes `{{resource}}SearchDto`.

---

## Frontend

### 1 — API + hooks

`fetch{{resource}}ByUserId` / `use{{resource}}ByUserId` (and liked variants if LIKES) accept optional `query` and pass `searchParams.query`. Include `query` in the React Query key; reset page to 1 when query changes.

### 2 — Profile list UI

Reuse shared `ProfileListSearch` (debounced local state — **not** URL `q`):

`web/src/components/pages/userProfile/ProfileListSearch.tsx`

Wire it above `PaginatedListInline` in `Users{{resource}}List` (and liked list if present). Empty message should differ when `query` is set.

See updated template in `18.md` profile section.

---

## Manual QA

- [ ] Profile search finds the user’s own items (including PRIVATE if VISIBILITY≠none and viewer is owner)
- [ ] Other viewers searching that profile still only see PUBLIC (visibility rules unchanged)
- [ ] Clear query restores full list; pagination resets on new query
- [ ] If likes: liked list search only matches among liked resources

<!-- NEXT: 19.md if ADMIN (then 19{L}.md); else 20.md if SEARCH else 21.md -->
