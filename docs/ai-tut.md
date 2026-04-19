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

Generates three files:

- `PROMPT-Blog.txt` — pre-filled prompt for Session 1
- `PROJECT-BRIEF-Blog.md` — pre-filled brief (AI#1 fills in the schema section)
- `PROGRESS-Blog.md` — adaptive checklist matching your feature selections (updated & verified during Session 1)

**Session 1** — new chat, attach `PROMPT-Blog.txt` + `PROGRESS-Blog.md` + `apps/api/prisma/schema.prisma`, then just describe the fields:

```
@PROMPT-Blog.txt @PROGRESS-Blog.md @apps/api/prisma/schema.prisma title, summary (tldr), content, BlogImportance enum (low/mid/high), optional cover image
```

AI proposes the Prisma model, you confirm, and **verifies PROGRESS-Blog.md matches your selections**, then outputs the final `PROJECT-BRIEF-Blog.md`. In agent mode it saves automatically — otherwise copy-paste it over the generated one.

**Key:** The progress file becomes your roadmap for Session 2 — AI#2 uses it to skip unnecessary sections.

**Session 2** — new chat, attach all three files:

```
@PROJECT-BRIEF-Blog.md @PROGRESS-Blog.md @guide/how-to-add-new-resource.md You are in Implementation Mode.

All decisions are in the brief. Use PROGRESS-Blog.md to skip unnecessary sections (e.g., if no admin requested, skip admin steps). Follow the guide parts in order for selected features only.
```

_If the chat gets too long mid-implementation, start a new session and say "We completed up to Part X. Continue from Part X+1." Update PROGRESS-Blog.md to mark completed parts._

---

## Session 3 — Write integration tests

After the backend code from Session 2 is working, use the `/write-tests` slash command to generate integration tests.

**Before running it** — if the new resource has any non-obvious business logic (state transitions, cross-resource effects, ownership rules that differ from the standard pattern), add it to `FLOWS.md` at the repo root. The agent reads this file for context. Write it while the decision is still fresh.

**Run the command** in a new chat:

```
/write-tests <module-name>
```

Example: `/write-tests articles`

**What the agent does:**

1. Reads the controller, service, all DTOs, Prisma schema, and `FLOWS.md`
2. Surfaces non-obvious flows as plain-English questions — you confirm before any code is written
3. Shows a plain-English list of every test case planned — you approve the plan
4. Writes the test file at `src/modules/<name>/<name>.controller.integration.spec.ts`

**What you review** — you don't need to read the assertion code. Just the test descriptions (step 3 above) to confirm the scenarios are correct and nothing's missing.

**To run the tests:**

```bash
pnpm db:test:up        # start test DB (first time only, or after restart)
cd apps/api
pnpm test:integration  # runs all integration specs against the test DB
```
