notes for me whilst i write this. ignore me

## Structural / Navigation

- [ ] Add a "checklist block" at the very top that AI must fill out before any steps (pagination type, search, file upload, image processing, enum/status)
- [ ] Add a `<!-- SKIP IF: no file upload -->` / `<!-- SKIP IF: no enum -->` style comment marker at the start of every optional section
- [ ] Add a short "what this part covers" summary at the top of each Part so AI can plan ahead

## Preamble Rules — Repeat Inline

- [ ] Repeat the _"don't add creator/author/timestamps to DTO"_ rule inline in Step 3 (DTO section) — not just preamble
- [ ] Repeat the _"skip image/imagePath unless schema has it"_ rule inline wherever file upload code appears
- [ ] Repeat the _"ask for clarification before guessing"_ rule at Step 3 (DTO) and wherever enum logic appears

## Make Optional Things Explicit

- [ ] Tag every enum-related code block with `<!-- OPTIONAL: only if schema has a status enum -->`
- [ ] Tag every image/file upload block with `<!-- OPTIONAL: only if schema has media field -->`
- [ ] Tag cursor pagination sections with `<!-- OPTIONAL: only if human requested cursor pagination -->`
- [ ] Tag soft delete (`deleted`, `deletedAt`) logic with `<!-- OPTIONAL: only if schema has soft delete fields -->`

## Cross-file References

- [ ] Inline a summary of the key rules from `how-to-do-file-upload.md` directly in the guide (or at minimum a TL;DR), don't rely on LLM fetching it
- [ ] Same for any other referenced external files

## Anti-hallucination Guards

- [ ] Add explicit `<!-- AI: do NOT include X unless Y -->` notes near commonly over-included patterns (e.g. raw findAll without pagination, unnecessary relations in select)
- [ ] Add a "stop and confirm" marker before any section that has significant optional branching

## End of Guide

- [ ] Add a final checklist the AI should self-verify before saying it's done (all files created, module registered in app.module, DTOs match schema, no skipped required steps)

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination.

> ⚠️ SKIP THIS STEP unless human explicitly requested cursor pagination AND admin.

> ⚠️ SKIP THIS PART unless human explicitly requested likes.

- ⚠️ SKIP unless human requested search
- ⚠️ SKIP unless human requested admin

# if no pagination just pure find all

api.ts

```ts
export const fetchArticles = () => fetcher<ArticlesList[]>("/articles");
```

hooks.ts

```ts
import { fetchArticles } from "./api";

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchArticles,
  });
}
```

usage in component

```ts
return (
    <div>
      {posts?.map((post) => (
        <div onClick={() => handleClick(post.id)}>
          <BlogCard key={post.id} post={post} />
        </div>
      ))}
    </div>
  )
```
