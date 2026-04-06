# AI Workflow: Two-Phase CRUD Implementation

This guide enables efficient handoff between two AI agents to implement CRUD resources without context loss or ambiguous assumptions.

## Quick Start (TL;DR)

### For Humans

Just ask your AI one of these:

**To start planning:**

- "Help me build a blog CRUD resource"
- "Design a new Orders feature for my app"
- "I want to create a Recipes resource"

**To start implementation:**

- Share this file + a `PROJECT-BRIEF-{{resource}}.md` file to an AI and say: "Implement this"

The AI will automatically detect which phase to enter and handle it.

### For AIs

When you receive a request in this workspace:

1. **Check if a `PROJECT-BRIEF-*.md` file is provided** → Enter **Implementation Mode** (Phase 2)
2. **If no brief, but request is about building a CRUD resource** → Enter **Planning Mode** (Phase 1)
3. **Read the relevant section below** and follow it exactly

---

## Overview

**Problem:** Long single-AI conversations lead to context loss, forgotten decisions, and AI assumptions about features.

**Solution:** Two dedicated phases with a standardized handoff document (Project Brief).

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│       AI#1: PLANNER      │         │      AI#2: IMPLEMENTER       │
│                          │         │                              │
│ • Design schema          │         │ • Create backend files       │
│ • Clarify features       │         │ • Write service/controller   │
│ • Confirm all decisions  │──────→  │ • Build frontend components │
│ • Output Project Brief   │ BRIEF   │ • Test endpoints            │
└─────────────────────────┘         └──────────────────────────────┘
         Phase 1                             Phase 2
```

---

## Phase 1: AI#1 Planning Mode

### Your Role

You are the **Planning AI**. Your job is to help the human clarify their vision and output a **Project Brief** that removes all ambiguity before implementation begins.

### Process

#### Step 1: Understand the Resource

Ask the human:

- **What is the resource?** (e.g., "Blog Posts", "Orders", "Recipes")
- **What is its purpose?** (1-2 sentences)
- **Who owns it?** (e.g., user-created, admin-managed, vendor-owned)
- **Example fields?** (title, description, price, status, etc.)

#### Step 2: Confirm Schema

Using their description, propose a Prisma schema:

```prisma
model {{resource}} {
  id        Int      @id @default(autoincrement())
  // ... fields they described ...
  creatorId Int
  creator   User @relation(fields: [creatorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deleted   Boolean  @default(false)
  deletedAt DateTime?
}
```

**Ask:** "Does this schema match your vision? Any fields missing, extra, or wrong type?"

#### Step 3: Run Feature Checklist

Go through the **pre-implementation clarification checklist** from [how-to-add-new-resource.md](./how-to-add-new-resource.md#pre-implementation-clarification-checklist). For each item:

1. Read the question clearly
2. Let the human answer yes/no
3. If they say yes to optional features, ask clarifying sub-questions
4. Document their answer

**Key sections:**

- Schema validation
- Backend features (admin, file upload, pagination, search, resource actions)
- Frontend features (implementation, pagination UI, profile integration, admin dashboard)

#### Step 4: Summarize Decisions

Read back what you will implement:

```
I will implement {{resource}} with:

BACKEND:
✓ Basic CRUD (create, read, update, delete)
✓ Offset pagination (findAll, findByUserId)
✗ Cursor pagination
✓ File upload (images only, 5MB max)
✓ Search
✗ Admin variant
✓ Resource actions: likes + views (not comments/collections)

FRONTEND:
✓ Offset pagination UI
✗ Infinite scroll
✓ Resource list on profile page
✓ Likes + views UI (no comments/collections)
✗ Admin dashboard
```

**Ask:** "Is this correct? Any changes before I create the Project Brief?"

#### Step 5: Output Project Brief

Once confirmed, create a `PROJECT-BRIEF-{{resource}}.md` file with the standardized template below. Give it to the human and say:

> **Ready for Implementation**
>
> I've created the Project Brief. Please review it and share it with AI#2. AI#2 will use this to implement the full CRUD without needing to re-clarify anything.

---

## Project Brief Template

Create this file: `PROJECT-BRIEF-{{resource}}.md` at the root of the project.

```markdown
# Project Brief — {{resource}}

## Resource Summary

**Name:** {{resource}} (singular)
**Plural:** {{resource}}s
**Route prefix:** /{{resource}}
**Owner model:** User (creatorId)
**Purpose:** {{1-2 sentence description}}

## Prisma Schema

\`\`\`prisma
model {{resource}} {
id Int @id @default(autoincrement())
// ... all fields exactly as agreed ...
creatorId Int
creator User @relation(fields: [creatorId], references: [id])
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
deleted Boolean @default(false)
deletedAt DateTime?
}
\`\`\`

## Backend Implementation Checklist

### Core

- [ ] Basic CRUD (create, read, update, delete)

### Pagination

- [ ] Offset pagination (findAll + findByUserId)
- [ ] Cursor pagination (findAll + findByUserId)
- [ ] Both offset and cursor

### File/Media Upload

- [ ] No upload
- [ ] Image upload (spec: {{format, max size, quality settings}})
- [ ] Video upload (refer to [how-to-do-file-upload.md](./how-to-do-file-upload.md))
- [ ] Other (specify): {{type}}

### Search

- [ ] No search
- [ ] Basic search (which field(s)? {{specify}})
- [ ] Search with autocomplete/suggest

### Admin

- [ ] No admin variant
- [ ] Admin variant (read/write/delete? {{specify}})

### Resource Actions

- [ ] Likes
- [ ] Views
- [ ] Comments
- [ ] Collections

## Frontend Implementation Checklist

- [ ] Frontend not needed (backend only)
- [ ] Frontend needed

### Pagination UI

- [ ] Offset pagination (load more button)
- [ ] Cursor pagination (infinite scroll)
- [ ] Both

### Resource Actions UI

- [ ] Likes UI
- [ ] Views UI
- [ ] Comments UI
- [ ] Collections UI

### Additional Pages

- [ ] Resource list on user profile page
- [ ] Admin dashboard page + data table

## Quality Gates

**Before AI#2 starts:** Human reviews and confirms this brief.

**During implementation:** AI#2 references this brief for every decision — no assumptions.

**After implementation:** Human tests endpoints and confirms feature completeness.

## Notes

{{Any clarifications or edge cases discovered during planning}}

- e.g., "no status enum on this resource"
- e.g., "file upload is optional (imagePath can be null)"
- e.g., "admin can publish/unpublish but not delete"
```

---

## Phase 2: AI#2 Implementation Mode

### Your Role

You are the **Implementation AI**. Your job is to read the Project Brief and mechanically follow [how-to-add-new-resource.md](./how-to-add-new-resource.md) to generate all backend and frontend code **without asking clarifying questions**.

### Process

#### Step 1: Load Context

- Read the `PROJECT-BRIEF-{{resource}}.md` file
- Reference [how-to-add-new-resource.md](./how-to-add-new-resource.md)
- Understand: All decisions are already made. Your job is execution.

#### Step 2: Validate Schema

1. Open `apps/api/prisma/schema.prisma`
2. Check if the `{{resource}}` model exists
3. If NOT: **STOP** and tell human "Please add the {{resource}} model to schema.prisma and run migration first"
4. If YES: Proceed

#### Step 3: Create CRUD Plan

Create `CRUD-PLAN-{{resource}}.md` at the project root with this structure:

```markdown
# CRUD Plan — {{resource}}

## Resource

- Model: {{resource}}
- Prisma table: {{resource}}
- Route prefix: /{{resource}}

## Backend Implementation

- [ ] Part 1: Basic backend files (service/controller/module/DTOs)
- [ ] Part 2: Service/controller templates
- [ ] Part 3: Create endpoint + logic
- [ ] Part 4: Read endpoints (findById, findAll, findByUserId, pagination variants)
- [ ] Part 5: Update endpoint + logic
- [ ] Part 6: Delete endpoint + soft delete logic
- [ ] Part 7: Admin stats (if admin requested)
- [ ] Part 8: Test all endpoints

## Frontend Implementation

- [ ] Part 9: API client / custom hooks
- [ ] Part 10: Create/edit forms
- [ ] Part 11: List components + pagination UI
- [ ] Part 12: Detail page
- [ ] Part 13: Resource action UI (likes, views, comments, collections)
- [ ] Part 14: User profile list integration (if requested)
- [ ] Part 15: Admin dashboard (if requested)

## Quality Checkpoints

- [ ] Schema migration complete
- [ ] All backend endpoints tested (curl/Postman)
- [ ] All frontend components render without error
- [ ] Pagination logic verified
- [ ] Search functionality verified (if requested)
- [ ] File upload tested (if requested)
- [ ] Resource actions tested (if requested)
```

#### Step 4: Execute Implementation

For each part in the guide:

1. **Check the checkbox** if it applies based on Project Brief
2. **Skip the section** if it doesn't apply (e.g., skip admin sections if admin not requested)
3. **Follow the template code exactly** — adapt `{{resource}}` names but keep structure
4. **Create/edit files** as instructed
5. **Test as you go** (run `pnpm run dev`, check for errors)

#### Step 5: Test Endpoints

After completing all parts, run the test suite from **Part 8** of the guide:

- POST (create)
- GET (read all, read one, read by user, pagination variants)
- PATCH (update)
- DELETE (soft delete, restore if admin)

#### Step 6: Verify Completeness

Check `CRUD-PLAN-{{resource}}.md`:

- Are all requested checkboxes in the Project Brief implemented?
- Run manual tests for pagination, search, file upload, resource actions
- Report any failures to human

#### Step 7: Handoff to Human

Create a summary:

```
Implementation Complete!

✓ Backend: 8 parts finished
✓ Frontend: 6 parts finished (if applicable)
✓ Tested: All endpoints working
✓ Ready for: Human review + integration testing

Test your endpoints:
- POST /{{resource}}
- GET /{{resource}}?offset=0&limit=10
- GET /{{resource}}/{{id}}
- PATCH /{{resource}}/{{id}}
- DELETE /{{resource}}/{{id}}
```

---

## Quality Gates

### Gate 1: Project Brief Review (Human)

- [ ] Human reviews Project Brief
- [ ] Human confirms all decisions
- [ ] Human approves handoff to AI#2

### Gate 2: Implementation Completion (AI#2)

- [ ] All backend files created
- [ ] All endpoints tested and working
- [ ] All frontend components render (if applicable)
- [ ] CRUD plan fully checked off

### Gate 3: Human Integration Testing (Human)

- [ ] Test all endpoints manually (Postman, curl, etc.)
- [ ] Test pagination (if applicable)
- [ ] Test file upload (if applicable)
- [ ] Test search (if applicable)
- [ ] Test resource actions (if applicable)
- [ ] Test admin dashboard (if applicable)
- [ ] Confirm feature completeness

### Gate 4: Merge & Deploy (Human)

- [ ] Code reviewed
- [ ] Database migrated
- [ ] Tests pass
- [ ] Ready for production

---

## Example Handoff Flow

### AI#1 Output (Project Brief for Blog)

```markdown
# Project Brief — BlogPost

## Resource Summary

Name: BlogPost
Purpose: User-created articles with drafting, publishing, and search.

## Backend

- [x] Basic CRUD
- [x] Offset pagination
- [ ] Cursor pagination
- [x] File upload (cover image, 5MB)
- [x] Search
- [x] Admin variant
- [x] Likes
- [ ] Views, Comments, Collections

## Frontend

- [x] Frontend needed
- [x] Offset pagination (load more)
- [ ] Cursor/infinite scroll
- [x] Likes UI
- [x] Profile page integration
- [x] Admin dashboard
```

### AI#2 Execution

1. Reads Project Brief
2. Creates schema (already done)
3. Follows guide Parts 1-8 (backend CRUD)
4. Skips cursor pagination, views, comments, collections
5. Implements admin variant (Part 7 admin steps)
6. Tests all endpoints
7. Follows guide Parts 9-15 (frontend)
8. Skips infinite scroll, views/comments/collections UI
9. Implements profile integration + admin dashboard
10. Hands back to human with summary

---

## Explicit Invocation (If You Want to Be Specific)

If the AI doesn't automatically detect the phase, explicitly invoke it:

### Phase 1: Planning Mode

```
You are in PLANNING MODE (Phase 1 of AI-WORKFLOW.md).

Help me design a {{resource}} CRUD resource. Use the "Phase 1: AI#1 Planning Mode" section to:
1. Ask me clarifying questions
2. Propose a Prisma schema
3. Run the feature checklist
4. Output PROJECT-BRIEF-{{resource}}.md

{{Your resource idea}}
```

### Phase 2: Implementation Mode

```
You are in IMPLEMENTATION MODE (Phase 2 of AI-WORKFLOW.md).

Here is the PROJECT-BRIEF-{{resource}}.md:

{{Paste entire file content}}

Use the "Phase 2: AI#2 Implementation Mode" section and guide/how-to-add-new-resource.md to:
1. Create all backend files
2. Generate DTOs, services, controllers
3. Test endpoints
4. Create frontend components (if applicable)
5. Output CRUD-PLAN-{{resource}}.md with everything checked off
```

---

## When to Use This Workflow

**Use when:**

- Implementing a new CRUD resource (Blog, Orders, Recipes, Events, etc.)
- Long implementation with 20+ decisions
- You want to prevent context loss across many steps
- You want AI to follow your vision exactly, not make assumptions

**Don't use when:**

- Making small changes to existing code
- Implementing single functions or components
- Quick debugging or refactoring
- Feature requests that are already scoped

---

## Tips for Success

1. **AI#1:** Ask clarifying questions even if you think you know the answer. Write everything down.
2. **AI#1:** Use the checklist — don't skip items or assume answers.
3. **AI#2:** Reference the Project Brief before every major decision. No assumptions.
4. **AI#2:** Test as you implement. Don't wait until the end.
5. **Human:** Review the Project Brief carefully before handing to AI#2.
6. **Human:** Test the final implementation thoroughly before merging.

---

## Next Steps

1. **For Blog test:** Start with AI#1 Planning Mode
2. **For Orders/Recipes:** After Blog succeeds, use same workflow
3. **Refine:** If anything goes wrong, update this guide with lessons learned

Good luck! 🚀
