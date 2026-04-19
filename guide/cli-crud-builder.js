#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  title: (msg) =>
    console.log(`\n${COLORS.bright}${COLORS.blue}${msg}${COLORS.reset}\n`),
  success: (msg) => console.log(`${COLORS.green}✓ ${msg}${COLORS.reset}`),
  section: (msg) => console.log(`\n${COLORS.bright}${msg}${COLORS.reset}`),
  info: (msg) => console.log(`${COLORS.cyan}ℹ ${msg}${COLORS.reset}`),
};

async function main() {
  const { input, select, confirm, checkbox } =
    await import("@inquirer/prompts");

  log.title("🚀 CRUD Resource Builder");
  log.info(
    "This will help you scaffold a CRUD resource with the right features for your infrastructure.",
  );

  const paginationChoices = [
    { name: "None (primitive findAll)", value: "none" },
    { name: "Offset pagination only", value: "offset" },
    { name: "Cursor pagination only", value: "cursor" },
    { name: "Both offset and cursor", value: "both" },
  ];

  const rawName = await input({
    message: 'Resource name? (singular, e.g., "blog", "Order", "recipe")',
    validate: (v) => {
      if (!v.trim()) return "Resource name cannot be empty";
      if (/\s/.test(v.trim())) return "No spaces allowed";
      return true;
    },
  });
  const resourceName =
    rawName.trim().charAt(0).toUpperCase() + rawName.trim().slice(1);

  const pagination = await select({
    message: "Pagination strategy for findAll and findByUserId?",
    choices: paginationChoices,
  });

  const search = await select({
    message: "Search?",
    choices: [
      { name: "No search", value: "none" },
      { name: "Basic search (keyword match)", value: "basic" },
    ],
  });

  let searchSuggest = false;
  if (search !== "none") {
    searchSuggest = await select({
      message: "Add search suggest/autocomplete endpoint?",
      choices: [
        { name: "No", value: false },
        { name: "Yes", value: true },
      ],
    });
  }

  const fileUpload = await select({
    message: "File/media upload?",
    choices: [
      { name: "No upload", value: "none" },
      { name: "Image only (cover, avatar, etc.)", value: "image" },
      { name: "Complex media (refer to guide)", value: "complex" },
    ],
  });

  const admin = await select({
    message: "Admin functionality?",
    choices: [
      { name: "No admin", value: "none" },
      { name: "Admin read-only (view all, include deleted)", value: "read" },
      { name: "Admin write (read + edit/delete/restore)", value: "write" },
    ],
  });

  const resourceActions = await checkbox({
    message: "Resource actions (uses your existing polymorphic models):",
    choices: [
      { name: "Likes", value: "likes", checked: true },
      { name: "Views (counter on model)", value: "views", checked: true },
      { name: "Comments", value: "comments", checked: true },
      {
        name: "Collections (save to user collection)",
        value: "collections",
        checked: true,
      },
    ],
  });

  const frontend = await select({
    message: "Implement frontend components?",
    choices: [
      { name: "Yes", value: true },
      { name: "No (backend only)", value: false },
    ],
  });

  let paginationUI = [];
  if (frontend && pagination !== "none") {
    const paginationUIChoices = [];
    if (pagination === "offset" || pagination === "both") {
      paginationUIChoices.push({
        name: "Numbered page buttons (1, 2, 3...) [offset]",
        value: "numbered",
        checked: true,
      });
    }
    if (pagination === "cursor" || pagination === "both") {
      paginationUIChoices.push({
        name: "Load more button [cursor]",
        value: "loadMore",
        checked: true,
      });
    }
    if (pagination === "cursor" || pagination === "both") {
      paginationUIChoices.push({
        name: "Infinite scroll [cursor]",
        value: "infinite",
        checked: true,
      });
    }
    paginationUI = await checkbox({
      message: "Frontend pagination UI style? (select all that apply)",
      choices: paginationUIChoices,
    });
  }

  let profileIntegration = false;
  if (frontend) {
    profileIntegration = await select({
      message: "Show resource list on user profile page?",
      choices: [
        { name: "No", value: false },
        { name: "Yes", value: true },
      ],
    });
  }

  const answers = {
    resourceName,
    pagination,
    search,
    searchSuggest,
    fileUpload,
    admin,
    resourceActions,
    frontend,
    paginationUI,
    profileIntegration,
  };

  // Generate output
  const resource = answers.resourceName;

  log.section("📋 Generated Configuration");

  const config = {
    resource,
    pagination: answers.pagination,
    search: answers.search,
    searchSuggest: answers.searchSuggest,
    fileUpload: answers.fileUpload,
    admin: answers.admin,
    resourceActions: answers.resourceActions,
    frontend: answers.frontend,
    paginationUI: answers.paginationUI,
    profileIntegration: answers.profileIntegration,
  };

  // Generate files
  const aiPrompt = generateAI1Prompt(resource, config);
  const projectBrief = generateProjectBrief(resource, config);
  const progressFile = generateProgressFile(resource, config);
  const systemPrompt = generateSystemPrompt(resource, config);

  const promptPath = path.join(process.cwd(), `PROMPT-${resource}.txt`);
  const briefPath = path.join(process.cwd(), `PROJECT-BRIEF-${resource}.md`);
  const progressPath = path.join(process.cwd(), `PROGRESS-${resource}.md`);
  const systemPromptPath = path.join(process.cwd(), `SYSTEM-PROMPT-${resource}.txt`);

  fs.writeFileSync(promptPath, aiPrompt);
  fs.writeFileSync(briefPath, projectBrief);
  fs.writeFileSync(progressPath, progressFile);
  fs.writeFileSync(systemPromptPath, systemPrompt);

  log.title("✨ Done!");
  log.success(`Saved PROMPT-${resource}.txt`);
  log.success(`Saved PROJECT-BRIEF-${resource}.md`);
  log.success(`Saved PROGRESS-${resource}.md`);
  log.success(`Saved SYSTEM-PROMPT-${resource}.txt`);
  console.log();
  console.log(`Next steps:`);
  console.log();
  console.log(`  [Session 1 — Schema Planning]`);
  console.log(`  1. Start a NEW chat session with your AI`);
  console.log(
    `  2. Share: PROMPT-${resource}.txt + PROGRESS-${resource}.md + apps/api/prisma/schema.prisma`,
  );
  console.log(
    `  3. In the same message, describe the ${resource} fields freely:`,
  );
  console.log(
    `     e.g. "i want to add recipe with fields like name, and array of incredients and array of steps. also add enum of difficulty (easy, medium, hard). make image required"`,
  );
  console.log(
    `  4. AI proposes schema → verifies PROGRESS-${resource}.md matches selections → you confirm`,
  );
  console.log(
    `  5. AI outputs final PROJECT-BRIEF-${resource}.md. In agent mode it auto-saves; otherwise copy-paste it.`,
  );
  console.log();
  console.log(`  [Session 2 — Implementation]`);
  console.log(`  6. Use Claude Code with the system prompt (CRITICAL):`);
  console.log(`     \`\`\`bash`);
  console.log(
    `     claude-code --system-prompt SYSTEM-PROMPT-${resource}.txt`,
  );
  console.log(`     \`\`\``);
  console.log();
  console.log(`  7. In the Claude Code chat, share:`);
  console.log(
    `     @PROJECT-BRIEF-${resource}.md @PROGRESS-${resource}.md @guide/how-to-add-new-resource.md`,
  );
  console.log();
  console.log(`  8. Then say: "Start implementation. Follow the guide and PROGRESS checklist."`);
  console.log();
  console.log(
    `     The system prompt will automatically remind AI to update PROGRESS as it completes each step.`,
  );
  console.log();
  console.log(`  9. If context fills up mid-implementation:`);
  console.log(
    `     - AI will say "Checkpoint: We completed up to Part X, Step Y"`,
  );
  console.log(`     - Start a NEW session with SAME --system-prompt command`);
  console.log(`     - Say: "We completed up to Part X, Step Y. Continue from Part X, Step Y+1."`);
  console.log();
  console.log(`  [Session 3 — Write Integration Tests]`);
  console.log(
    `  10. Optional: Add non-obvious business logic to FLOWS.md at repo root`,
  );
  console.log(
    `      (only if your ${resource} has state transitions, cross-resource effects, or special ownership rules)`,
  );
  console.log(`  11. Start another NEW chat session with your AI`);
  console.log(`  12. Use the skill: /write-tests ${resource.toLowerCase()}`);
  console.log(
    `      (this is a Claude Code slash command, not a pnpm command)`,
  );
  console.log(
    `  13. Review the test plan the AI shows you (descriptions only)`,
  );
  console.log(
    `  14. AI generates: src/modules/${resource.toLowerCase()}/${resource.toLowerCase()}.controller.integration.spec.ts`,
  );
  console.log();
  console.log(`  To run the tests:`);
  console.log(`    pnpm db:test:up        # start test DB (first time only)`);
  console.log(`    cd apps/api`);
  console.log(`    pnpm test:integration  # run all integration tests`);
  console.log();
}

function generateSystemPrompt(resource) {
  return `You are in IMPLEMENTATION MODE for the ${resource} CRUD resource.

Your role: Follow guide/how-to-add-new-resource.md and implement only the features and steps listed in PROGRESS-${resource}.md.

**Core Instructions:**
1. Read PROJECT-BRIEF-${resource}.md first — all decisions are already made
2. Read PROGRESS-${resource}.md second — this is your checklist for what to actually implement
3. Reference guide/how-to-add-new-resource.md for detailed implementation steps
4. Do NOT ask clarifying questions about features — they're already decided in the brief

**Progress Tracking (CRITICAL):**
After completing each step in the guide:
- [ ] Update PROGRESS-${resource}.md: Change the completed step from \`[ ]\` to \`[✓]\`
- [ ] Note the current Part and Step number in your response
- [ ] Example: "✓ Completed: Part 4, Step 3 - Create controller endpoint"

**When context gets long (mid-implementation):**
Explicitly state: "Checkpoint: We completed up to Part X, Step Y. Continue from Part X, Step Y+1."

**Skip Sections:**
Only implement the sections that appear in PROGRESS-${resource}.md. For example:
- If PROGRESS shows no "Admin Functionality" section → skip ALL admin-related steps
- If PROGRESS shows no "Search Functionality" section → skip ALL search-related steps
- If pagination is "offset only" → skip ALL cursor pagination steps

**File Management:**
- Do NOT create new files beyond what the guide specifies
- Update PROGRESS-${resource}.md with checkbox marks as you go
- Do NOT modify PROMPT-${resource}.txt or PROJECT-BRIEF-${resource}.md

**Testing:**
- Run curl/Postman tests as specified in the guide
- Report test results to the human
- Wait for human confirmation before moving to next major section

Let the human test endpoints themselves — you generate the endpoints and list them.
`;
}

function generateAI1Prompt(resource, config) {
  const actions =
    config.resourceActions.length > 0
      ? config.resourceActions.join(", ")
      : "none";
  const paginationUI = config.paginationUI
    ? ` (UI: ${config.paginationUI})`
    : "";
  return `You are in PLANNING MODE (Phase 1 of guide/AI-WORKFLOW.md).

I want to create a **${resource}** CRUD resource. The feature decisions are already made below — do NOT ask about them. Your only job is to propose a Prisma schema based on what I describe next.

**Pre-decided features (do not ask about these):**
- Pagination (findAll and findByUserId): ${config.pagination}
- Search: ${config.search}${config.searchSuggest ? " + autocomplete suggest" : ""}
- File upload: ${config.fileUpload}
- Admin: ${config.admin}
- Resource actions: ${actions}
- Frontend: ${config.frontend ? "yes" : "no"}${paginationUI}
- Profile page integration: ${config.profileIntegration ? "yes" : "no"}

**Infrastructure reminder:** Polymorphic Like, Comment, Collection models exist (via ResourceType enum). Views = counter on model. Soft delete = deleted/deletedAt fields. Do NOT invent separate ${resource}Like, ${resource}Comment tables.

**Your task:**
1. Read schema.prisma (I'll attach it) to confirm existing patterns
2. Ask me ONLY about the ${resource} schema fields (what data it stores, any enum, any status)
3. Propose the minimal ${resource} Prisma model
4. Output PROJECT-BRIEF-${resource}.md with all decisions filled in

Start by asking me to describe the ${resource} fields.`;
}

function generateProgressFile(resource, config) {
  const resourceLower = resource.toLowerCase();

  // Detailed step mapping for each part
  const buildDetailedSteps = () => {
    let steps = "";

    // Part 1: Basic backend files
    steps += `
## BACKEND IMPLEMENTATION

### Part 1: Basic Backend Files
- [ ] Step 1: Create service.ts file
- [ ] Step 2: Create controller.ts file
- [ ] Step 3: Create module.ts file
- [ ] Step 4: Create DTOs folder and files`;

    // Part 2: DTO validations
    steps += `

### Part 2: DTO Validations & Structure
- [ ] Step 1: Create CreateDto with validators
- [ ] Step 2: Create UpdateDto with validators
- [ ] Step 3: Create response DTOs
- [ ] Step 4: Add PrismaService to module`;

    // Part 3: Register module
    steps += `

### Part 3: Register Module
- [ ] Step 1: Add {{resource}}Module to app.module.ts
- [ ] Step 2: Add {{resource}}Service provider`;

    // Part 4: CRUD Operations
    steps += `

### Part 4: CRUD Operations`;

    steps += `
- [ ] **Create:**
  - [ ] Create service method
  - [ ] Create controller endpoint
  - [ ] Test with curl/Postman`;

    if (config.fileUpload !== "none") {
      steps += `
  - [ ] Add file upload handling`;
    }

    steps += `
- [ ] **Read (findById):**
  - [ ] Add service method
  - [ ] Add controller endpoint`;

    if (config.pagination !== "none") {
      steps += `
- [ ] **List (findAll):**
  - [ ] Add base service method`;
      if (config.pagination === "offset" || config.pagination === "both") {
        steps += `
  - [ ] Add offset pagination service method
  - [ ] Add offset pagination controller endpoint`;
      }
      if (config.pagination === "cursor" || config.pagination === "both") {
        steps += `
  - [ ] Add cursor pagination service method
  - [ ] Add cursor pagination controller endpoint`;
      }
      steps += `
- [ ] **List by User (findByUserId):**
  - [ ] Add base service method`;
      if (config.pagination === "offset" || config.pagination === "both") {
        steps += `
  - [ ] Add offset pagination for user service method
  - [ ] Add offset pagination for user controller endpoint`;
      }
      if (config.pagination === "cursor" || config.pagination === "both") {
        steps += `
  - [ ] Add cursor pagination for user service method
  - [ ] Add cursor pagination for user controller endpoint`;
      }
    } else {
      steps += `
- [ ] **List (primitive findAll):**
  - [ ] Add simple service method
  - [ ] Add simple controller endpoint
- [ ] **List by User (primitive findByUserId):**
  - [ ] Add simple service method
  - [ ] Add simple controller endpoint`;
    }

    steps += `
- [ ] **Update:**
  - [ ] Add service method
  - [ ] Add controller endpoint`;
    if (config.fileUpload !== "none") {
      steps += `
  - [ ] Add file upload handling`;
    }

    steps += `
- [ ] **Delete (Soft Delete):**
  - [ ] Add service method
  - [ ] Add controller endpoint
  - [ ] Add restore service method
  - [ ] Add restore controller endpoint`;

    // Part 5: Search
    if (config.search !== "none") {
      steps += `

### Part 5: Search Functionality
- [ ] Create search DTO with filters`;
      if (config.pagination === "offset" || config.pagination === "both") {
        steps += `
- [ ] **Offset Pagination Search:**
  - [ ] Add search service method
  - [ ] Add search controller endpoint`;
      }
      if (config.pagination === "cursor" || config.pagination === "both") {
        steps += `
- [ ] **Cursor Pagination Search:**
  - [ ] Add cursor search service method
  - [ ] Add cursor search controller endpoint`;
      }
      if (config.searchSuggest) {
        steps += `
- [ ] **Search Suggest/Autocomplete:**
  - [ ] Add suggest service method
  - [ ] Add suggest controller endpoint`;
      }
    }

    // Part 6: File Upload
    if (config.fileUpload !== "none") {
      steps += `

### Part 6: File Upload
- [ ] Set up file storage configuration
- [ ] Add upload validation
- [ ] Handle file deletion on update
- [ ] Handle file deletion on soft delete`;
    }

    // Part 7: Admin Functionality
    if (config.admin !== "none") {
      steps += `

### Part 7: Admin Functionality`;
      if (config.admin === "read" || config.admin === "write") {
        steps += `
- [ ] Create admin service file
- [ ] Add admin read methods
- [ ] Add admin controller endpoints`;
      }
      if (config.admin === "write") {
        steps += `
- [ ] Add admin edit/update methods
- [ ] Add admin delete methods
- [ ] Add admin restore methods`;
      }
      steps += `
- [ ] Add admin stats/analytics methods`;
    }

    // Part 8: Resource Actions
    if (config.resourceActions.length > 0) {
      steps += `

### Part 8: Resource Actions`;
      if (config.resourceActions.includes("likes")) {
        steps += `
- [ ] **Likes:**
  - [ ] Add {{RESOURCE_UPPER}} to ResourceType enum
  - [ ] Implement toggleLike service method
  - [ ] Add toggleLike controller endpoint
  - [ ] Update likeCount on model`;
      }
      if (config.resourceActions.includes("views")) {
        steps += `
- [ ] **Views:**
  - [ ] Implement recordView service method
  - [ ] Add recordView controller endpoint
  - [ ] Update viewCount on model`;
      }
      if (config.resourceActions.includes("comments")) {
        steps += `
- [ ] **Comments:**
  - [ ] Add {{RESOURCE_UPPER}} to ResourceType enum
  - [ ] Implement getComments service method
  - [ ] Add getComments controller endpoint
  - [ ] Implement createComment logic`;
      }
      if (config.resourceActions.includes("collections")) {
        steps += `
- [ ] **Collections:**
  - [ ] Add {{RESOURCE_UPPER}} to ResourceType enum
  - [ ] Implement toggleCollection service method
  - [ ] Add toggleCollection controller endpoint`;
      }
    }

    // Part 9: Testing
    steps += `

### Part 9: Manual Testing
- [ ] Test create endpoint
- [ ] Test read endpoints
- [ ] Test list/pagination endpoints`;
    if (config.pagination !== "none") {
      steps += `
- [ ] Verify pagination works correctly`;
    }
    if (config.search !== "none") {
      steps += `
- [ ] Test search functionality`;
    }
    if (config.fileUpload !== "none") {
      steps += `
- [ ] Test file upload`;
    }
    if (config.admin !== "none") {
      steps += `
- [ ] Test admin endpoints`;
    }
    if (config.resourceActions.length > 0) {
      steps += `
- [ ] Test resource actions`;
    }
    steps += `
- [ ] Test update endpoint
- [ ] Test delete/restore endpoints`;

    return steps;
  };

  const backendChecklist = buildDetailedSteps();

  // Frontend
  let frontendChecklist = "";
  if (config.frontend) {
    frontendChecklist = `

## FRONTEND IMPLEMENTATION

### Part 10: API Client & Types
- [ ] Step 1: Create types file for {{resource}}
- [ ] Step 2: Create API client file with fetch methods
- [ ] Step 3: Create custom hooks (useCreate, useUpdate, useFetch, useLists, etc.)
- [ ] Step 4: Add error handling and loading states`;

    frontendChecklist += `

### Part 11: Create Form
- [ ] Step 1: Create Zod schema for create form
- [ ] Step 2: Create form component`;
    if (config.fileUpload !== "none") {
      frontendChecklist += `
- [ ] Step 3: Add file upload handling`;
    }
    frontendChecklist += `
- [ ] Step 4: Create inline create form variant
- [ ] Step 5: Create modal create form variant
- [ ] Step 6: Add form validation and error messages
- [ ] Step 7: Test form submission`;

    frontendChecklist += `

### Part 12: Update/Edit Form
- [ ] Step 1: Create Zod schema for update form
- [ ] Step 2: Create form component
- [ ] Step 3: Populate form with existing data`;
    if (config.fileUpload !== "none") {
      frontendChecklist += `
- [ ] Step 4: Add file upload/replace handling`;
    }
    frontendChecklist += `
- [ ] Step 5: Create inline edit form variant
- [ ] Step 6: Create modal edit form variant
- [ ] Step 7: Add form validation and error messages
- [ ] Step 8: Test form submission and updates`;

    if (config.pagination !== "none") {
      frontendChecklist += `

### Part 13: List & Pagination`;
      if (config.paginationUI.includes("numbered")) {
        frontendChecklist += `
- [ ] **Numbered Page Buttons:**
  - [ ] Create pagination component
  - [ ] Add page selector UI
  - [ ] Implement page change handler`;
      }
      if (config.paginationUI.includes("loadMore")) {
        frontendChecklist += `
- [ ] **Load More Button:**
  - [ ] Create load more component
  - [ ] Implement infinite scroll trigger
  - [ ] Handle loading/error states`;
      }
      if (config.paginationUI.includes("infinite")) {
        frontendChecklist += `
- [ ] **Infinite Scroll:**
  - [ ] Create intersection observer hook
  - [ ] Implement auto-load on scroll
  - [ ] Handle loading/error states`;
      }
      frontendChecklist += `
- [ ] Step X: Create list/grid component
- [ ] Step X: Display items with proper styling
- [ ] Step X: Add loading and error states`;
    }

    frontendChecklist += `

### Part 14: Detail Page
- [ ] Step 1: Create detail/show page component
- [ ] Step 2: Fetch and display resource data
- [ ] Step 3: Add edit button
- [ ] Step 4: Add delete button with confirmation
- [ ] Step 5: Handle loading and error states
- [ ] Step 6: Test page navigation`;

    if (hasResourceActions) {
      frontendChecklist += `

### Part 15: Resource Actions UI`;
      if (config.resourceActions.includes("likes")) {
        frontendChecklist += `
- [ ] **Likes:**
  - [ ] Create like button component
  - [ ] Add toggle handler
  - [ ] Show like count
  - [ ] Add loading state`;
      }
      if (config.resourceActions.includes("views")) {
        frontendChecklist += `
- [ ] **Views:**
  - [ ] Display view counter
  - [ ] Record view on load`;
      }
      if (config.resourceActions.includes("comments")) {
        frontendChecklist += `
- [ ] **Comments:**
  - [ ] Create comments list component
  - [ ] Create comment form component
  - [ ] Implement add comment handler
  - [ ] Add comment count display`;
      }
      if (config.resourceActions.includes("collections")) {
        frontendChecklist += `
- [ ] **Collections:**
  - [ ] Create save to collection component
  - [ ] Add collection picker modal/dropdown
  - [ ] Implement toggle handler
  - [ ] Show save status`;
      }
    }

    if (config.profileIntegration) {
      frontendChecklist += `

### Part 16: Profile Page Integration
- [ ] Step 1: Find/create user profile page
- [ ] Step 2: Add {{resource}} list section
- [ ] Step 3: Use list component from Part 13
- [ ] Step 4: Filter to show only user's {{resource}}s
- [ ] Step 5: Add quick create/edit buttons
- [ ] Step 6: Test profile integration`;
    }

    if (config.admin !== "none") {
      frontendChecklist += `

### Part 17: Admin Dashboard
- [ ] Step 1: Create admin {{resource}} page
- [ ] Step 2: Create data table component
- [ ] Step 3: Add table columns for key fields`;
      if (config.search !== "none") {
        frontendChecklist += `
- [ ] Step 4: Add search/filter functionality`;
      }
      frontendChecklist += `
- [ ] Step 5: Add inline edit capabilities
- [ ] Step 6: Add delete button with confirmation`;
      if (config.admin === "write") {
        frontendChecklist += `
- [ ] Step 7: Add restore deleted items option`;
      }
      frontendChecklist += `
- [ ] Step 8: Add pagination to table
- [ ] Step 9: Add to admin sidebar navigation
- [ ] Step 10: Test admin functionality`;
    }

    frontendChecklist += `

### Part 18: Frontend Testing & Polish
- [ ] Test all forms (create, update)
- [ ] Test list/pagination UI`;
    if (config.paginationUI.length > 0) {
      frontendChecklist += `
- [ ] Verify pagination works (${config.paginationUI.join(", ")})`;
    }
    if (config.search !== "none") {
      frontendChecklist += `
- [ ] Test search functionality`;
    }
    if (config.fileUpload !== "none") {
      frontendChecklist += `
- [ ] Test file upload`;
    }
    if (config.resourceActions.length > 0) {
      frontendChecklist += `
- [ ] Test resource actions (${config.resourceActions.join(", ")})`;
    }
    if (config.profileIntegration) {
      frontendChecklist += `
- [ ] Test profile page integration`;
    }
    if (config.admin !== "none") {
      frontendChecklist += `
- [ ] Test admin dashboard`;
    }
    frontendChecklist += `
- [ ] Check responsive design
- [ ] Verify error handling
- [ ] Test edge cases`;
  }

  return `# Implementation Progress — ${resource}

## Feature Summary

**Resource:** ${resource}
**Created:** ${new Date().toISOString().split("T")[0]}

### Selected Features
- **Pagination:** ${config.pagination}
- **Search:** ${config.search}${config.searchSuggest ? " + autocomplete" : ""}
- **File Upload:** ${config.fileUpload}
- **Admin:** ${config.admin}
- **Resource Actions:** ${config.resourceActions.length > 0 ? config.resourceActions.join(", ") : "none"}
- **Frontend:** ${config.frontend ? "yes" : "no"}${config.frontend && config.paginationUI.length > 0 ? ` (UI: ${config.paginationUI.join(", ")})` : ""}
- **Profile Integration:** ${config.profileIntegration ? "yes" : "no"}

---

## Phase 1: Planning (Session 1)

**Goal:** Validate schema and finalize all feature decisions

### Planning Checklist
- [ ] AI confirms resource purpose (1-2 sentence description)
- [ ] AI proposes Prisma schema based on field description
- [ ] Human confirms schema is correct
- [ ] AI outputs final PROJECT-BRIEF-${resource}.md
- [ ] **AI reviews PROGRESS-${resource}.md and confirms selections match brief**
- [ ] Human approves to proceed to Session 2

**Notes (fill in during Session 1):**
\`\`\`
[Resource purpose will be determined here]

[Any schema customizations or notes from discussion]
\`\`\`

---

## Phase 2: Implementation (Session 2)

**Goal:** Follow guide/how-to-add-new-resource.md and implement all selected features

${backendChecklist}${frontendChecklist}

---

## Phase 3: Testing

- [ ] Test all backend endpoints manually
- [ ] Verify pagination works correctly
- [ ] Test file upload (if selected)
- [ ] Test search functionality (if selected)
- [ ] Test resource actions (if selected)
- [ ] Test admin functionality (if selected)
- [ ] Test frontend components render without error
- [ ] Create integration tests (use \`/write-tests ${resourceLower}\` skill)

---

## Current Status

**Phase:** 1 (Planning)
**Last Updated:** ${new Date().toISOString().split("T")[0]}
**Completed Steps:** 0/23

---

## How to Use This File

1. **Session 1:** Share this with the planning AI. Have them verify the feature selections match their schema proposal.
2. **Session 2:** Share this with the implementation AI. They reference it to skip unnecessary sections.
3. **As you work:** Check off parts as they're completed. Update "Last Updated" and "Completed Steps".
4. **If session gets long:** Note which part you're on. Next session, say "We completed up to Part X. Continue from Part X+1."

---

## Decision Log

_Any non-obvious choices or edge cases discovered during planning/implementation_

- (none yet)
`;
}

function generateProjectBrief(resource, config) {
  const resourceLower = resource.toLowerCase();
  const resourcePlural = resource + "s";
  const resourceUpper = resource.toUpperCase();

  let brief = `# Project Brief — ${resource}

## Resource Summary

**Name:** ${resource} (singular)
**Plural:** ${resourcePlural}
**Route prefix:** /${resourceLower}
**Owner model:** User (creatorId)
**Purpose:** (to be filled in by AI#1 after schema discussion)

## Prisma Schema Changes

\`\`\`prisma
// Add to ResourceType enum:
enum ResourceType {
  POST
  COMMENT
  ARTICLE
  ${resourceUpper} // ADD THIS
}

// New model:
model ${resource} {
  id        Int      @id @default(autoincrement())
  // ... fields to be confirmed ...
  creatorId Int
  creator   User @relation(fields: [creatorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deleted   Boolean  @default(false)
  deletedAt DateTime?
  viewCount Int      @default(0)
  likeCount Int      @default(0)
}
\`\`\`

## Backend Implementation Checklist

### Core
- [ ] Basic CRUD (create, read, update, delete)

### Pagination
- [ ] Offset pagination (findAll)
- [ ] Cursor pagination (findAll)
- [ ] Offset pagination (findByUserId)
- [ ] Cursor pagination (findByUserId)

### File/Media Upload
- [${config.fileUpload === "none" ? "x" : " "}] No upload
- [${config.fileUpload === "image" ? "x" : " "}] Image upload
- [${config.fileUpload === "complex" ? "x" : " "}] Complex media (separate guide)

### Search
- [${config.search === "none" ? "x" : " "}] No search
- [${config.search === "basic" ? "x" : " "}] Basic search
- [${config.searchSuggest ? "x" : " "}] Search suggest/autocomplete

### Admin
- [${config.admin === "none" ? "x" : " "}] No admin
- [${config.admin === "read" ? "x" : " "}] Admin read-only
- [${config.admin === "write" ? "x" : " "}] Admin write (edit/delete/restore)

### Resource Actions (Polymorphic Models)
- [${config.resourceActions.includes("likes") ? "x" : " "}] Likes (use existing Like model + add ${resourceUpper} to ResourceType)
- [${config.resourceActions.includes("views") ? "x" : " "}] Views (use viewCount counter on ${resource} model)
- [${config.resourceActions.includes("comments") ? "x" : " "}] Comments (use existing Comment model + add ${resourceUpper} to ResourceType)
- [${config.resourceActions.includes("collections") ? "x" : " "}] Collections (use existing Collection/CollectionItem models + add ${resourceUpper} to ResourceType)

## Frontend Implementation Checklist

- [${config.frontend ? "x" : " "}] Frontend needed
- [${!config.frontend ? "x" : " "}] Backend only

${
  config.frontend
    ? `
### Pagination UI
- [${config.paginationUI === "loadMore" || config.paginationUI === "both" ? "x" : " "}] Load more button
- [${config.paginationUI === "infinite" || config.paginationUI === "both" ? "x" : " "}] Infinite scroll

### Resource Actions UI
- [${config.resourceActions.includes("likes") ? "x" : " "}] Likes UI
- [${config.resourceActions.includes("views") ? "x" : " "}] Views UI (counter display)
- [${config.resourceActions.includes("comments") ? "x" : " "}] Comments UI
- [${config.resourceActions.includes("collections") ? "x" : " "}] Collections UI (save to collection)

### Additional Pages
- [${config.profileIntegration ? "x" : " "}] Resource list on user profile page
- [ ] Admin dashboard page + data table
`
    : ""
}

## Polymorphic Model Implementation

⚠️ **Do NOT create separate ${resource}Like, ${resource}Comment, ${resource}Collection tables.**

Your existing infrastructure handles all resource actions:
- **Likes**: Existing \`Like\` model (polymorphic via ResourceType)
- **Comments**: Existing \`Comment\` model (polymorphic via ResourceType)
- **Collections**: Existing \`Collection\` + \`CollectionItem\` models (polymorphic via ResourceType)
- **Views**: Counter on ${resource} model (like Post, Article, etc.)

Just add \`${resourceUpper}\` to the ResourceType enum.

## Notes

- Schema details to be confirmed by AI#1
- Uses existing polymorphic patterns (no new models for interactions)
- Soft delete pattern follows existing convention
`;

  return brief;
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
