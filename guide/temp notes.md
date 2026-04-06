notes for me whilst i write this. ignore me

## Why CLI Script Instead of Original AI-WORKFLOW Plan

**Original Plan:** Human describes resource → AI#1 asks clarifying questions → AI#1 outputs PROJECT-BRIEF

**Problem Discovered:** AI hallucinated features during planning phase:

- Invented "ban users from blogging" (role-based bans have no logic in schema, only dummy status fields)
- Suggested "fuzzy/partial match search" (infrastructure only supports basic search)
- Proposed "exact match only" search (not a real option in implementation)
- Asked about features that don't exist in the stack

**Root Cause:** AI-WORKFLOW was too open-ended. It asked AI to "run the feature checklist" and ask clarifying questions, but:

1. AI doesn't know which features are actually implemented
2. AI invents options that sound reasonable but don't match your architecture
3. This forced 10+ messages back-and-forth to correct AI's assumptions
4. By then, context was already muddled

**Solution: CLI Script**

- Human fills out a checklist (similar to Vite/create-react-app scaffolding)
- Only presents **real options that exist in your infrastructure**
- Script validates choices against schema.prisma patterns
- Outputs a **pre-formatted prompt + pre-filled PROJECT-BRIEF**
- Human copy-pastes to AI#1 (no clarification needed, already decided)
- AI#1 validates for 2min, outputs final brief
- AI#2 implements

**Benefit:** Deterministic input → no hallucination → no back-and-forth

---

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
