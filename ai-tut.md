# Adding a new CRUD resource with AI

Two sessions, always. Session 1 = schema planning. Session 2 = implementation. Never combine them or the AI loses context halfway through.

_The whole point is to prevent AI from hallucinating features that don't exist in the infra. The PROJECT-BRIEF locks in all decisions before any code gets written._

---

## A: Manual (conversation heavy)

_You write out everything yourself. More typing but full control over what goes into the prompt._

**Session 1** — new chat, attach `guide/AI-WORKFLOW.md` + `apps/api/prisma/schema.prisma`:

```
Read guide/AI-WORKFLOW.md and apps/api/prisma/schema.prisma.

I want to create a Blog CRUD resource with:
- Title, content, importance level enum (low/mid/high)
- Cover image
- Soft delete
- Likes, comments, views, save to collection
- Pagination
- Search
- Admin management

Follow Phase 1 (Planning Mode). Output PROJECT-BRIEF-Blog.md.
```

**Session 2** — new chat, attach `PROJECT-BRIEF-Blog.md` + `guide/how-to-add-new-resource.md`:

```
@PROJECT-BRIEF-Blog.md @guide/how-to-add-new-resource.md You are in Implementation Mode. Follow the guide parts in order.
All decisions are in the brief — no clarifying questions needed.
```

---

## B: Script (recommended)

_Handles the boilerplate of the prompt for you. Arrow-key CLI picks all the structural decisions (pagination, search, admin, etc.) so you only need to describe the actual fields._

Run `pnpm run crud` from root. CLI asks you to pick features via arrow keys (pagination type, search, file upload, admin, likes/views/comments/collections, frontend, etc.). No typing decisions, just selecting.

Generates two files:

- `PROMPT-Blog.txt` — pre-filled prompt for Session 1
- `PROJECT-BRIEF-Blog.md` — pre-filled brief (AI#1 fills in the schema section)

**Session 1** — new chat, attach `PROMPT-Blog.txt` + `apps/api/prisma/schema.prisma`, then just describe the fields:

```
@PROMPT-Blog.txt @apps/api/prisma/schema.prisma title, summary (tldr), content, BlogImportance enum (low/mid/high), optional cover image
```

AI proposes the Prisma model, you confirm, it outputs the final `PROJECT-BRIEF-Blog.md`. In agent mode it saves automatically — otherwise copy-paste it over the generated one.

**Session 2** — same as Method A:

```
@PROJECT-BRIEF-Blog.md @guide/how-to-add-new-resource.md You are in Implementation Mode. Follow the guide parts in order.
All decisions are in the brief — no clarifying questions needed.
```

_If the chat gets too long mid-implementation, start a new session and say "We completed up to Part X. Continue from Part X+1."_
