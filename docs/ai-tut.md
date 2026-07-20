# Adding a new CRUD resource with AI

Two sessions minimum. Session 1 = schema planning, Session 2 = implementation. Never combine them or the AI loses context halfway through and starts hallucinating features that don't exist.

---

## TL;DR — Time Breakdown

| Step | What                              | Time   |
| ---- | --------------------------------- | ------ |
| 0    | New branch                        | 0 min  |
| 1    | Setup with `pnpm run crud`        | 1 min  |
| 2    | Schema brainstorm + migrate       | 3 min  |
| 3    | Implementation (Haiku, ~7% limit) | ~9 min |
| 4    | Validate files created            | 1 min  |
| 5    | Test endpoints                    | 5 min  |
| 6    | Frontend QA                       | 5 min  |
| 7    | Integration tests                 | 10 min |

**Total:** ~34 minutes (mostly AI generation; you're just sitting there hitting approve on stuff and manually testing)

---

## STEP 0: New Branch First

Always work on a feature branch, not main.

AI commits are unpredictable. Sometimes it commits every 2 seconds, sometimes randomly, sometimes not at all. You don't want that interrupting your workflow.

```bash
git checkout -b feat/add-resource-name
```

---

## STEP 1: `pnpm run crud`

This CLI interviews you about your resource (pagination type, search, file upload, admin, resource actions, frontend, etc.) and generates:

- `PROMPT-{resource}.txt` — Pre-filled prompt for Session 1 planning
- `PROJECT-BRIEF-{resource}.md` — Brief template (AI fills in schema + decisions)
- `PROGRESS-{resource}.md` — Adaptive checklist based on what you picked
- `SYSTEM-PROMPT-{resource}.txt` — System prompt for Session 2 implementation
- `CONFIG-{resource}.json` — Your decisions stored as JSON

Run from root:

```bash
pnpm run crud
```

Answer the arrow-key questions about features. Don't describe the schema yet — that's coming in Step 2. **The script will give you detailed next steps to follow.**

---

## STEP 2: Session 1 — Schema Brainstorm

Start a new chat with your AI. Attach:

- `PROMPT-{resource}.txt`
- `PROGRESS-{resource}.md`
- `apps/api/prisma/schema.prisma`

Just describe what you want:

```
@PROMPT-{resource}.txt @PROGRESS-{resource}.md @apps/api/prisma/schema.prisma

I want {resource} to have: title, description, status enum (draft/published), soft delete, cover image, likes + comments
```

**AI will:**

1. Propose a Prisma schema (reusing your existing Like/Comment/Collection models, not inventing new tables)
2. Verify PROGRESS-{resource}.md matches what you actually want
3. Output final `PROJECT-BRIEF-{resource}.md`

**Heads up:** 20% chance the AI forgets to actually edit `schema.prisma`. If it just proposed the schema without editing the file, tell it to do make changes to schema.

Once approved, migrate then generate:

```bash
cd apps/api
pnpm prisma migrate dev --name "add {resource}"
pnpm prisma generate
```

---

## STEP 3: Session 2 — Implementation (~9 min)

New chat with any AI. Use `SYSTEM-PROMPT-{resource}.txt` as system/custom instructions if supported; otherwise paste it at the top of the first message. Enable auto-approve edits if available.

Attach / @-mention:

- `PROJECT-BRIEF-{resource}.md`
- `PROGRESS-{resource}.md`
- `guide/guidev2/ROUTER.md`
- `CONFIG-{resource}.json`

Prefer the **exact paste block** printed by `pnpm run crud` (includes locked `PATH_LETTER`). If you lost it, use:

```
@PROJECT-BRIEF-{resource}.md @PROGRESS-{resource}.md @guide/guidev2/ROUTER.md @CONFIG-{resource}.json

You are in Implementation Mode. Lock PATH_LETTER from CONFIG.fileUpload (none→a, simple→b, complex→c).
Follow ROUTER.md NEXT links only — never open sibling a/b/c files. Use PROGRESS to skip gated features. Start.
```

**Why a cheap/fast model:** The guide is mostly instructions. Save stronger models for hard debugging.

**If the chat gets long:** Do not keep going. Start a new session with the same system prompt. Paste the CLI **checkpoint continue** block (or say: "Checkpoint resume. PATH_LETTER=X. We completed through guide/guidev2/Y.md. Continue from its NEXT footer."). Update PROGRESS-{resource}.md to mark what's done.

---

## STEP 4: Validate Files Got Created

Quick sanity check:

```bash
pnpm run validate-resource {resource}
```

Example: `pnpm run validate-resource foo`

**If something's missing** (e.g., `AdminEditFooForm.tsx`): The script outputs a prompt. Share that with the AI in a new message. It'll make the missing file.

---

## STEP 5: Test Endpoints

```bash
pnpm run ai-api-test
```

Script outputs a prompt explaining all the endpoints and how to test them (curl/Postman examples). Use it to manually verify your backend works before moving to frontend.

---

## STEP 6: Actually Use It

Start the dev server and manually test:

```bash
pnpm dev
```

Navigate to your new resource and test:

- Create/edit/delete flows
- Pagination (if you picked it)
- Search (if you picked it)
- File upload (if you picked it)
- Likes/comments/collections (if you picked them)
- Admin dashboard (if you picked it)

**AI forgets dumb stuff:**

- Page auth checks (forgot to add `requireAuth`?)
- Navigation links (sidebar/navbar missing the new resource?)
- Styling/responsiveness (form looks like garbage)
- Error/loading states (form just hangs on submit)

Fix these manually or ask the AI to fix them in a new message.

---

## STEP 7: Session 3 — Integration Tests

Once backend works + frontend looks okay, write integration tests.

**Before you do:** If your resource has weird business logic (state transitions, cross-resource effects, custom ownership rules), add it to `FLOWS.md` at repo root. Write it while it's fresh in your head.

New chat, use `/write-tests` skill:

```
/write-tests {resource-module-name}
```

Example: `/write-tests articles`

**Agent will:**

1. Read your controller, service, DTOs, schema, and FLOWS.md
2. Ask plain-English questions about non-obvious flows — you confirm before code is written
3. Show you the test plan (just descriptions) — you approve the scenarios
4. Generate the test file at `src/modules/{name}/{name}.controller.integration.spec.ts`

Run tests:

```bash
pnpm db:test:up        # start test DB (first time only)
cd apps/api
pnpm test:integration  # run all integration tests
```

---

## Commentary

**LLM REALLY STRUGGLES WITH FRONTEND**

- Gets routing wrong: `\(default\)/blog/page.tsx` instead of `(default)/blog/page.tsx`
- Makes client component/logic in `page.tsx` (page.tsx should be slim just pointing towards a client component)
- Sometimes stop mid way making frontend, like will make types folder, api.ts, hooks.ts then just wait for human to give tell it to continue

**Workaround:** After backend is done, git commit it. Then retry frontend generation 2-3 times. Gamble again.

**OVERALL THIS THING WORKS LIKE 10% OF THE TIME**

but hey better than doing it urself. and im not gonna use sonnet or opus and burn through my precious tokens. need to save those tokens for more import things like asking it how to grep

**GUIDE (guidev2)**

Implementation guide is path-based under `guide/guidev2/` — start at `ROUTER.md`. Media variants are exclusive files (`a`/`b`/`c`). Missing-file safety net: [validate-resource](../guide/validate-resource.js).

After Session 2, the CLI prints a **copy-paste first message** with `PATH_LETTER` locked from `CONFIG`. Use the checkpoint continue block when context fills.
