# SearchBar

[SearchBar.tsx](apps/web/src/features/search/components/SearchBar.tsx) — generic `<T>`, debounced (300ms), keyboard nav, click-outside close.

## Modes

**Simple** — input + button, navigates to `basePath?q=...` on submit:
```tsx
<SearchBar placeholder="Search..." basePath="/search" />
```

**Suggestions + direct nav** — dropdown as you type, click/Enter navigates to item's own page:
```tsx
<SearchBar<Post>
  useSuggestions={usePostSuggestions}
  renderSuggestion={(p) => ({ title: p.title, subtitle: p.excerpt, image: p.thumb })}
  onNavigateTo={(p) => `/posts/${p.id}`}
/>
```

**Suggestions + search term** — click/Enter fills the search term and navigates to `basePath`:
```tsx
<SearchBar<Post>
  useSuggestions={usePostSuggestions}
  renderSuggestion={(p) => ({ title: p.title })}
  onSuggestionSelect={(p) => p.title}
/>
```

**Reactive URL** — URL updates as you type (any mode):
```tsx
<SearchBar reactiveUrl={true} ... />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `placeholder` | `"Search..."` | |
| `queryParam` | `"q"` | URL param name |
| `basePath` | `"/search"` | Navigation base |
| `suggestionLimit` | `5` | Passed to `useSuggestions` |
| `useSuggestions` | — | `(q, limit) => { data?: T[], isLoading }` |
| `renderSuggestion` | — | Required with `useSuggestions`. Returns `{ title, subtitle?, image? }` |
| `onNavigateTo` | — | `(item) => path` — navigate directly to item |
| `onSuggestionSelect` | — | `(item) => string` — extract search term instead |
| `reactiveUrl` | `false` | Push URL on each debounced keystroke |

`onNavigateTo` and `onSuggestionSelect` are mutually exclusive.

## Keyboard

- `↓ / ↑` — move through suggestions
- `Enter` — activate selected suggestion or submit
- `Esc` — close dropdown

---

# PaginatedList

[PaginatedList.tsx](apps/web/src/components/ui/pagination/PaginatedList.tsx) — offset pagination with URL navigation. Generic `<T extends { id }>`.

```tsx
<PaginatedList<Post>
  url="/posts"
  page={page}
  limit={10}
  items={posts}
  totalItems={totalPosts}
  renderItem={(post) => <PostCard {...post} />}
  renderSkeleton={() => <PostCardSkeleton />}
  title="Posts"
  queryParams={{ category: "react" }}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `url` | — | Base path for navigation |
| `page` | — | Current page (1-indexed) |
| `limit` | — | Items per page |
| `items` | — | Current page items |
| `totalItems` | — | Total items across all pages |
| `renderItem` | — | `(item: T) => ReactNode` |
| `renderSkeleton` | — | `() => ReactNode` — shown while loading |
| `title` | — | Optional heading |
| `layout` | `"grid"` | `"grid"` (1/md-2/lg-3 cols) \| `"flex"` (col) \| `"custom"` |
| `gridClassName` | — | Override layout classes |
| `queryParams` | — | Extra URL params passed to OffsetPagination |
| `emptyMessage` | `"No results found."` | |

Shows loading state → skeleton grid → items → OffsetPagination controls.

---

# PaginatedListInline

[PaginatedListInline.tsx](apps/web/src/components/ui/pagination/PaginatedListInline.tsx) — offset pagination with callback. Generic `<T extends { id }>`. No URL changes.

```tsx
<PaginatedListInline<Post>
  page={page}
  limit={10}
  items={posts}
  totalItems={totalPosts}
  onPageChange={(newPage) => setPage(newPage)}
  renderItem={(post) => <PostCard {...post} />}
  renderSkeleton={() => <PostCardSkeleton />}
  title="Posts"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `page` | — | Current page (1-indexed) |
| `limit` | — | Items per page |
| `items` | — | Current page items |
| `totalItems` | — | Total items across all pages |
| `onPageChange` | — | `(page: number) => void` |
| `renderItem` | — | `(item: T) => ReactNode` |
| `renderSkeleton` | — | `() => ReactNode` — shown while loading |
| `title` | — | Optional heading |
| `layout` | `"grid"` | `"grid"` (1/md-2/lg-3 cols) \| `"flex"` (col) \| `"custom"` |
| `gridClassName` | — | Override layout classes |
| `emptyMessage` | `"No results found."` | |

Shows loading state → skeleton grid → items → PaginationControlsInline buttons.

---

# CursorList

[CursorList.tsx](apps/web/src/components/ui/pagination/CursorList.tsx) — cursor pagination with explicit "Load more" button. Generic `<T extends { id }>`.

```tsx
<CursorList<Post>
  items={posts}
  isLoading={loading}
  isFetchingNextPage={fetchingNext}
  hasNextPage={hasMore}
  onLoadMore={() => fetchMore()}
  renderItem={(post) => <PostCard {...post} />}
  renderSkeleton={() => <PostCardSkeleton />}
  title="Posts"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | All loaded items so far |
| `isLoading` | `false` | Initial load |
| `isFetchingNextPage` | `false` | Button loading state |
| `hasNextPage` | `false` | Show "Load more" button |
| `onLoadMore` | — | `() => void` |
| `renderItem` | — | `(item: T) => ReactNode` |
| `renderSkeleton` | — | `() => ReactNode` |
| `skeletonCount` | `3` | Num of skeletons while loading |
| `title` | — | Optional heading |
| `layout` | `"grid"` | `"grid"` (1/md-2/lg-3 cols) \| `"flex"` (col) \| `"custom"` |
| `gridClassName` | — | Override layout classes |
| `emptyMessage` | `"No results found."` | |

Shows loading state → skeleton grid → items → "Load more" button (disabled while fetching) or "You've reached the end."

---

# CursorInfiniteList

[CursorInfiniteList.tsx](apps/web/src/components/ui/pagination/CursorInfiniteList.tsx) — cursor pagination with auto-load on scroll. Generic `<T extends { id }>`. Uses IntersectionObserver.

```tsx
<CursorInfiniteList<Post>
  items={posts}
  isLoading={loading}
  isFetchingNextPage={fetchingNext}
  hasNextPage={hasMore}
  onLoadMore={() => fetchMore()}
  renderItem={(post) => <PostCard {...post} />}
  renderSkeleton={() => <PostCardSkeleton />}
  title="Posts"
/>
```

## Props

Same as CursorList. Difference: no "Load more" button. Instead uses a sentinel `<div>` (200px trigger margin, 0.1 threshold) to auto-load when user scrolls near the end.

---

# ConfirmModal

[ConfirmModal.tsx](apps/web/src/components/modal/ConfirmModal.tsx) — confirmation dialog with flexible buttons.

```tsx
<ConfirmModal
  message="Delete this post?"
  onConfirm={() => deletePost()}
  variant="destructive"
  buttonMessage="Delete"
  showCancelButton={true}
  cancelButtonMessage="Cancel"
  onCancel={() => setOpen(false)}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `message` | — | Dialog text |
| `onConfirm` | — | `() => void` — confirm button handler |
| `variant` | `"outline"` | Button variant (e.g., `"destructive"`, `"default"`) |
| `buttonMessage` | `"Yes"` | Confirm button text |
| `showButton` | `true` | Show confirm button |
| `showCancelButton` | `false` | Show cancel button |
| `cancelButtonMessage` | `"No"` | Cancel button text |
| `onCancel` | — | `() => void` — cancel handler (ignored if `showCancelButton: false`) |
| `onSuccess` | — | Currently unused |
| `onError` | — | Currently unused |

Renders message + buttons in flex layout (cancel left, confirm right).
