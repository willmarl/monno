#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

const log = {
  title: (msg) =>
    console.log(`\n${COLORS.bright}${COLORS.blue}${msg}${COLORS.reset}\n`),
  success: (msg) => console.log(`${COLORS.green}✓ ${msg}${COLORS.reset}`),
  section: (msg) => console.log(`\n${COLORS.bright}${msg}${COLORS.reset}`),
  info: (msg) => console.log(`${COLORS.cyan}ℹ ${msg}${COLORS.reset}`),
  dim: (msg) => console.log(`${COLORS.dim}${msg}${COLORS.reset}`),
  warn: (msg) =>
    console.log(`${COLORS.bright}${COLORS.yellow}${msg}${COLORS.reset}`),
};

/** Console-only helpers — never use these inside writeFileSync / generated file content. */
const c = {
  bold: (s) => `${COLORS.bright}${s}${COLORS.reset}`,
  dim: (s) => `${COLORS.dim}${s}${COLORS.reset}`,
  cyan: (s) => `${COLORS.cyan}${s}${COLORS.reset}`,
  green: (s) => `${COLORS.green}${s}${COLORS.reset}`,
  yellow: (s) => `${COLORS.yellow}${s}${COLORS.reset}`,
  magenta: (s) => `${COLORS.magenta}${s}${COLORS.reset}`,
  blue: (s) => `${COLORS.blue}${s}${COLORS.reset}`,
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
      { name: "None", value: "none" },
      { name: "Simple single file upload", value: "simple" },
      { name: "Complex multi-file upload", value: "complex" },
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

  // Schema property (not a polymorphic addon) — column + query rules on the resource
  const visibility = await select({
    message: "Private/public visibility on this resource?",
    choices: [
      { name: "No (always effectively public)", value: "none" },
      {
        name: "Yes — default PUBLIC (e.g. posts)",
        value: "defaultPublic",
      },
      {
        name: "Yes — default PRIVATE (e.g. collections)",
        value: "defaultPrivate",
      },
    ],
  });

  const resourceActions = await checkbox({
    message: "Resource actions (uses your existing polymorphic models):",
    choices: [
      { name: "Likes", value: "likes", checked: true },
      { name: "Views (counter + view history)", value: "views", checked: true },
      { name: "Comments", value: "comments", checked: true },
      {
        name: "Collections (save to user collection)",
        value: "collections",
        checked: true,
      },
      {
        name: "Reports (users can report this content)",
        value: "reports",
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
    visibility,
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
    visibility: answers.visibility,
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
  const systemPromptPath = path.join(
    process.cwd(),
    `SYSTEM-PROMPT-${resource}.txt`,
  );

  fs.writeFileSync(promptPath, aiPrompt);
  fs.writeFileSync(briefPath, projectBrief);
  fs.writeFileSync(progressPath, progressFile);
  fs.writeFileSync(systemPromptPath, systemPrompt);

  // Persist config for validator
  const configPath = path.join(process.cwd(), `CONFIG-${resource}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  log.title("✨ Done!");
  log.success(`Saved PROMPT-${resource}.txt`);
  log.success(`Saved PROJECT-BRIEF-${resource}.md`);
  log.success(`Saved PROGRESS-${resource}.md`);
  log.success(`Saved SYSTEM-PROMPT-${resource}.txt`);
  log.success(`Saved CONFIG-${resource}.json`);
  printNextSteps(resource, config);
}

/** Map CONFIG.fileUpload → guidev2 path letter (a/b/c). */
function resolvePathLetter(fileUpload) {
  if (fileUpload === "simple") return "b";
  if (fileUpload === "complex") return "c";
  return "a"; // none
}

function visibilityLabel(visibility) {
  if (visibility === "defaultPublic") return "yes (default PUBLIC)";
  if (visibility === "defaultPrivate") return "yes (default PRIVATE)";
  return "none";
}

function visibilityPrismaDefault(visibility) {
  if (visibility === "defaultPrivate") return "PRIVATE";
  if (visibility === "defaultPublic") return "PUBLIC";
  return null;
}

function printNextSteps(resource, config) {
  const pathLetter = resolvePathLetter(config.fileUpload);
  const pathMeaning =
    pathLetter === "a"
      ? "none (no upload)"
      : pathLetter === "b"
        ? "simple (single file)"
        : "complex (Media model)";
  const R = resource;
  const r = resource.toLowerCase();

  // Paste lines: plain text, no ANSI, no box borders, no leading indent — easy drag-select.
  const pasteSession2 = [
    `@PROJECT-BRIEF-${R}.md @PROGRESS-${R}.md @guide/guidev2/ROUTER.md @CONFIG-${R}.json`,
    ``,
    `You are in Implementation Mode.`,
    `PATH_LETTER=${pathLetter} (fileUpload=${config.fileUpload}). Lock this letter.`,
    `VISIBILITY=${config.visibility}. Follow guide/guidev2/ROUTER.md → NEXT links only. Never open sibling a/b/c files.`,
    `Use PROGRESS-${R}.md to skip gated features. Update PROGRESS checkboxes as you go.`,
    `Start from 0_preamble.md then 1.md → 1${pathLetter}.md.`,
  ];
  const pasteCheckpoint = [
    `@PROJECT-BRIEF-${R}.md @PROGRESS-${R}.md @guide/guidev2/ROUTER.md @CONFIG-${R}.json`,
    `Checkpoint resume. PATH_LETTER=${pathLetter}. We completed through guide/guidev2/<FILE>.md (Part X, Step Y).`,
    `Continue from the NEXT footer of that file. Do not reopen finished chapters. Update PROGRESS as you go.`,
  ];

  const printPaste = (label, lines) => {
    console.log(`  ${c.dim(`--- copy below (${label}) ---`)}`);
    for (const line of lines) {
      console.log(line);
    }
    console.log(`  ${c.dim("--- copy above ---")}`);
  };

  const step = (n, text) =>
    console.log(`  ${c.cyan(String(n) + ".")} ${text}`);
  const sub = (text) => console.log(`     ${c.dim(text)}`);
  const session = (label) => {
    console.log();
    console.log(
      `  ${COLORS.bright}${COLORS.blue}${label}${COLORS.reset}`,
    );
    console.log(`  ${c.dim("─".repeat(Math.min(label.length + 2, 48)))}`);
  };

  console.log();
  log.section("Next steps");
  console.log();
  console.log(
    `  ${COLORS.bright}${COLORS.magenta}PATH_LETTER=${pathLetter}${COLORS.reset}  ${c.dim("←")} fileUpload ${c.yellow(`"${config.fileUpload}"`)} = ${pathMeaning}`,
  );
  sub(`Only open guide/guidev2 files ending in ${pathLetter} (or shared files with no letter).`);

  session("[Session 1 — Schema Planning]");
  step(1, `Start a ${c.bold("NEW")} chat session with your AI`);
  step(
    2,
    `Share: ${c.cyan(`PROMPT-${R}.txt`)} + ${c.cyan(`PROGRESS-${R}.md`)} + ${c.cyan("apps/api/prisma/schema.prisma")}`,
  );
  step(3, `In the same message, describe the ${R} fields freely:`);
  sub(
    `e.g. "title, body, rating enum 1-5, soft delete. reuse Like/Comment. media optional"`,
  );
  step(4, `AI proposes schema → verifies PROGRESS matches → brainstorm`);
  step(5, `AI edits ${c.cyan("apps/api/prisma/schema.prisma")}`);
  step(6, `AI outputs final ${c.cyan(`PROJECT-BRIEF-${R}.md`)}`);
  step(7, `Run migration ${c.bold("(required)")}:`);
  console.log(`     ${c.green("cd apps/api")}`);
  console.log(
    `     ${c.green(`pnpm prisma migrate dev --name "add ${r}"`)}`,
  );
  sub("Do NOT skip — Prisma types are required for implementation");

  session("[Session 2 — Implementation]");
  step(
    8,
    `New chat with your AI. Use ${c.cyan(`SYSTEM-PROMPT-${R}.txt`)} as system / custom instructions if your tool supports it (otherwise paste it at the top of the first message).`,
  );
  step(
    9,
    `Enable auto-approve / auto-apply edits if your tool has that option.`,
  );
  step(
    10,
    `${COLORS.bright}${COLORS.yellow}Paste this as your first message${COLORS.reset} (select between the markers):`,
  );
  printPaste("Session 2 first message", pasteSession2);
  console.log();
  step(
    11,
    `${COLORS.bright}${COLORS.yellow}CHECKPOINT${COLORS.reset} when context fills — do NOT keep going:`,
  );
  sub(
    `AI says: Checkpoint: completed through guide/guidev2/<file>.md (Part X, Step Y). PATH_LETTER=${pathLetter}.`,
  );
  sub(
    `You: NEW chat (same SYSTEM-PROMPT if supported), then paste:`,
  );
  printPaste("checkpoint resume", pasteCheckpoint);
  console.log();
  step(
    12,
    `After Session 2: ${c.green(`pnpm run validate-resource ${r}`)}`,
  );

  session("[Session 3 — Integration Tests] (optional)");
  step(13, `Optional: note weird business logic in ${c.cyan("FLOWS.md")}`);
  step(14, `Start another NEW chat`);
  step(
    15,
    `Ask your AI to write integration tests for ${c.cyan(r)} (or use /write-tests ${r} if that skill exists)`,
  );
  step(16, `Approve the test plan (descriptions only)`);
  step(
    17,
    `AI writes ${c.cyan(`src/modules/${r}/${r}.controller.integration.spec.ts`)}`,
  );
  console.log();
  console.log(`  ${c.bold("Run tests:")}`);
  console.log(`    ${c.green("pnpm db:test:up")}        ${c.dim("# first time only")}`);
  console.log(`    ${c.green("cd apps/api && pnpm test:integration")}`);
  console.log();
}

function generateSystemPrompt(resource, config) {
  const pathLetter = resolvePathLetter(config.fileUpload);
  const pathMeaning =
    pathLetter === "a"
      ? "none"
      : pathLetter === "b"
        ? "simple"
        : "complex";

  return `You are in IMPLEMENTATION MODE for the ${resource} CRUD resource.

Your role: Follow guide/guidev2/ROUTER.md (choose-your-own-adventure map) and implement only the features listed in PROGRESS-${resource}.md.

**Locked path (from CONFIG):**
- fileUpload=${config.fileUpload} → PATH_LETTER=${pathLetter} (${pathMeaning})
- visibility=${config.visibility} (${visibilityLabel(config.visibility)}) — feature gate, NOT a path letter
- Only open guide/guidev2/*${pathLetter}.md companions and shared chapters (no letter).
- Never open sibling path letters (if ${pathLetter}, do not open the other two).

**Core Instructions:**
1. Read PROJECT-BRIEF-${resource}.md first — all decisions are already made
2. Read PROGRESS-${resource}.md second — checklist for what to implement
3. Read CONFIG-${resource}.json if shared — confirms fileUpload/admin/search/visibility gates
4. Read guide/guidev2/ROUTER.md — then follow NEXT links only, one file (or shared+letter pair) at a time
5. Do NOT ask clarifying questions about features — they're already decided in the brief

**Progress Tracking (CRITICAL):**
After completing each step:
- Update PROGRESS-${resource}.md: \`[ ]\` → \`[✓]\`
- State: "✓ Completed: guide/guidev2/<file>.md — Part X, Step Y"

**CHECKPOINT RULE (when context gets long — mandatory):**
Do NOT continue in a bloated chat. Explicitly output:
  Checkpoint: completed through guide/guidev2/<file>.md (Part X, Step Y). PATH_LETTER=${pathLetter}. Continue from NEXT.
Human will start a NEW session. They will tell you the last completed file — resume from that file's NEXT footer. Do not reopen finished chapters.

**Skip Sections:**
Only implement sections in PROGRESS-${resource}.md. Examples:
- No "Admin Functionality" → skip ALL admin steps (including 3-admin-create.md / 22-admin-create.md)
- No search → skip 9.md and 20.md
- visibility=none → skip visibility.md
- PROFILE=no → skip profile section in 18.md and skip profile-search.md
- Pagination offset only → skip ALL cursor steps

**File Management:**
- Do NOT create files beyond what the guide specifies
- Update PROGRESS-${resource}.md as you go
- Do NOT modify PROMPT-${resource}.txt or PROJECT-BRIEF-${resource}.md

**Testing:**
After Part 8 (backend): stop and tell the human to run \`pnpm run ai-api-test\` (API must be up via \`pnpm dev\`). They paste the prompt into this chat. You then curl smoke-test the new endpoints with the provided admin token/session, fix failures, and wait for human OK before frontend parts.
Do NOT invent auth tokens. Do NOT skip the ai-api-test gate.
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
- Visibility (private/public): ${visibilityLabel(config.visibility)}
- Resource actions: ${actions}
- Frontend: ${config.frontend ? "yes" : "no"}${paginationUI}
- Profile page integration: ${config.profileIntegration ? "yes (includes scoped search on by-user lists — see profile-search.md)" : "no"}

**Infrastructure reminder:** Polymorphic Like, Comment, Collection, ViewHistory, Report models exist (via ResourceType enum). Views = \`viewCount\` on model + \`ViewHistory\` upsert on authenticated record. Reports = opt-in via \`REPORTABLE_RESOURCES\` (content only; admin queue). Soft delete = deleted/deletedAt fields. Visibility = existing \`Visibility\` enum + column on the resource (NOT a polymorphic addon — do NOT add PRIVATEABLE_RESOURCES). Do NOT invent separate ${resource}Like, ${resource}Comment, ${resource}Report tables.

**Your task:**
1. Read schema.prisma (I'll attach it) to confirm existing patterns
2. Ask me ONLY about the ${resource} schema fields (what data it stores, any enum, any status)
3. Propose the minimal ${resource} Prisma model
4. Brainstorm with me about the schema until we're both happy with the changes
5. Edit apps/api/prisma/schema.prisma with the final ${resource} model and any enum additions
6. Output PROJECT-BRIEF-${resource}.md with all decisions filled in

Start by asking me to describe the ${resource} fields.`;
}

function generateProgressFile(resource, config) {
  const resourceLower = resource.toLowerCase();
  const pathLetter = resolvePathLetter(config.fileUpload);

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

    if (config.fileUpload === "simple") {
      steps += `
  - [ ] Add single file upload handling (FileInterceptor + FileProcessingService)`;
    }
    if (config.fileUpload === "complex") {
      steps += `
  - [ ] Create endpoint is text-only — media handled via sub-routes (see Part 6)`;
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
    if (config.fileUpload === "simple") {
      steps += `
  - [ ] Add file replacement handling (delete old file + upload new)`;
    }
    if (config.fileUpload === "complex") {
      steps += `
  - [ ] Update endpoint is text-only — media managed via sub-routes (see Part 6)`;
    }

    steps += `
- [ ] **Delete (Soft Delete):**
  - [ ] Add service method
  - [ ] Add controller endpoint
  - [ ] Add restore service method
  - [ ] Add restore controller endpoint`;

    if (config.visibility !== "none") {
      const visDefault = visibilityPrismaDefault(config.visibility);
      steps += `

### Part 4b: Visibility (private/public)
- [ ] Confirm \`Visibility\` enum exists in schema (reuse — do not invent a new enum)
- [ ] Add \`visibility Visibility @default(${visDefault})\` + index on model
- [ ] Create/Update DTOs: optional visibility
- [ ] Follow guide/guidev2/visibility.md (reuse \`src/common/visibility/visibility.ts\`)
- [ ] Public search/feeds: PUBLIC only; by-user: viewer-aware; findById: private→404 for non-owners
- [ ] If collectable: owner may add own private items; viewers skip inaccessible items`;
    }

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
    if (config.fileUpload === "simple") {
      steps += `

### Part 6: File Upload (simple — single file)
- [ ] Add preset to file-upload-presets.ts
- [ ] Add FileProcessingModule to module.ts
- [ ] Add FileProcessingService to service constructor
- [ ] Add FileInterceptor to create/update endpoints
- [ ] Handle file deletion on update (delete old before saving new)
- [ ] Handle file deletion on soft delete`;
    }
    if (config.fileUpload === "complex") {
      steps += `

### Part 6: File Upload (complex — multi-file via MediaService)
- [ ] Add MediaModule to module.ts
- [ ] Add MediaService to service constructor
- [ ] Add media sub-routes to controller (POST/PATCH/DELETE /:id/media/...)
- [ ] Add reorder-media.dto.ts
- [ ] Add service delegation methods (addMediaBatch, replaceMedia, removeMedia, setPrimary, reorderMedia)
- [ ] If admin: add same media sub-routes + audit logging to admin controller/service
- [ ] Test media endpoints (add, replace, delete, reorder, set primary)`;
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
  - [ ] Add {{RESOURCE_UPPER}} to VIEWABLE_RESOURCES + view-handler config
  - [ ] Ensure viewCount on model + shared selects
  - [ ] Wire findHistory hydrate for {{RESOURCE_UPPER}} (ViewsService)
  - [ ] Wire admin fetchViewHistory hydrate for {{RESOURCE_UPPER}}
  - [ ] Smoke-test POST /views + GET /views/history`;
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
      if (config.resourceActions.includes("reports")) {
        steps += `
- [ ] **Reports:**
  - [ ] Add {{RESOURCE_UPPER}} to REPORTABLE_RESOURCES
  - [ ] Wire ReportsService.resolveTarget for {{RESOURCE_UPPER}}
  - [ ] Optional: admin reports Open link for {{RESOURCE_UPPER}}
  - [ ] Smoke-test POST /reports + GET /admin/reports`;
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
    if (config.fileUpload === "simple") {
      steps += `
- [ ] Test single file upload on create and update`;
    }
    if (config.fileUpload === "complex") {
      steps += `
- [ ] Test media sub-endpoints (add, replace, delete, reorder, set primary)`;
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
    if (config.visibility !== "none") {
      frontendChecklist += `
- [ ] Include \`visibility: "PUBLIC" | "PRIVATE"\` on types`;
    }

    frontendChecklist += `

### Part 11: Create Form
- [ ] Step 1: Create Zod schema for create form
- [ ] Step 2: Create form component`;
    if (config.fileUpload === "simple") {
      frontendChecklist += `
- [ ] Step 3: Add single file input + pass file to useCreate hook`;
    }
    if (config.fileUpload === "complex") {
      frontendChecklist += `
- [ ] Step 3: Add MediaManager + media-utils (UnifiedMediaItem state, validateQueuedFiles, applyCreateMediaChanges)`;
    }
    if (config.visibility !== "none") {
      frontendChecklist += `
- [ ] Add visibility Public/Private select (default ${visibilityPrismaDefault(config.visibility)})`;
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
    if (config.fileUpload === "simple") {
      frontendChecklist += `
- [ ] Step 4: Add file replace input + pass file to useUpdate hook`;
    }
    if (config.fileUpload === "complex") {
      frontendChecklist += `
- [ ] Step 4: Add MediaManager + media-utils (toUnified, createMediaHandlers, applyMediaChanges)
- [ ] Step 4b: Create InlineEdit variant with isAlwaysOpen prop (used in modals)`;
    }
    if (config.visibility !== "none") {
      frontendChecklist += `
- [ ] Prefill + allow changing visibility on edit`;
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

    if (config.resourceActions.length > 0) {
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
  - [ ] Record view on detail load
  - [ ] Add {{RESOURCE_UPPER}} tab on /history
  - [ ] Add {{RESOURCE_UPPER}} tab on /admin/users/[id]/history`;
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
      if (config.resourceActions.includes("reports")) {
        frontendChecklist += `
- [ ] **Reports:**
  - [ ] Add {{RESOURCE_UPPER}} to web REPORTABLE_RESOURCES
  - [ ] Add ReportButton on card/detail (hidden for owner)
  - [ ] Optional: admin reports deep-link for {{RESOURCE_UPPER}}`;
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
- [ ] **Scoped search (required with profile):** follow \`guide/guidev2/profile-search.md\`
  - [ ] \`findByUserId\` accepts search DTO (\`query\` + buildSearchWhere)
  - [ ] API/hooks pass optional \`query\`; React Query key includes query
  - [ ] \`ProfileListSearch\` on Users{{resource}}List (debounced, local state)
  - [ ] If likes: same for liked-by-user list
- [ ] Step 6: Test profile integration + profile search`;
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
    if (config.fileUpload === "simple") {
      frontendChecklist += `
- [ ] Test single file upload/replace in create and edit forms`;
    }
    if (config.fileUpload === "complex") {
      frontendChecklist += `
- [ ] Test media add, remove, undo-remove, reorder, set-primary in edit forms
- [ ] Test MediaGallery display (thumbnail strip, click to expand, arrow navigation)`;
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
- **File Upload:** ${config.fileUpload} → **PATH_LETTER=${pathLetter}** (only open guidev2 \`*${pathLetter}.md\` companions + shared chapters)
- **Admin:** ${config.admin}
- **Visibility:** ${visibilityLabel(config.visibility)}${config.visibility !== "none" ? " → follow \`visibility.md\` (not a path letter)" : ""}
- **Resource Actions:** ${config.resourceActions.length > 0 ? config.resourceActions.join(", ") : "none"}
- **Frontend:** ${config.frontend ? "yes" : "no"}${config.frontend && config.paginationUI.length > 0 ? ` (UI: ${config.paginationUI.join(", ")})` : ""}
- **Profile Integration:** ${config.profileIntegration ? "yes → also open profile-search.md after 18.md" : "no"}

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

**Goal:** Follow guide/guidev2/ROUTER.md (path letter a/b/c + NEXT links) and implement all selected features

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
  const visDefault = visibilityPrismaDefault(config.visibility);
  const visibilityField =
    visDefault != null
      ? `
  visibility Visibility @default(${visDefault})

  @@index([visibility])`
      : "";

  let brief = `# Project Brief — ${resource}

## Resource Summary

**Name:** ${resource} (singular)
**Plural:** ${resourcePlural}
**Route prefix:** /${resourceLower}
**Owner model:** User (creatorId)
**Purpose:** (to be filled in by AI#1 after schema discussion)

## Prisma Schema Changes

\`\`\`prisma
${
  visDefault != null
    ? `// Reuse existing Visibility enum (do NOT create a second enum):
// enum Visibility { PUBLIC PRIVATE }

`
    : ""
}// Add to ResourceType enum:
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
  likeCount Int      @default(0)${visibilityField}
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
- [${config.fileUpload === "simple" ? "x" : " "}] Simple single file upload
- [${config.fileUpload === "complex" ? "x" : " "}] Complex multi-file upload (separate guide)

### Search
- [${config.search === "none" ? "x" : " "}] No search
- [${config.search === "basic" ? "x" : " "}] Basic search
- [${config.searchSuggest ? "x" : " "}] Search suggest/autocomplete

### Admin
- [${config.admin === "none" ? "x" : " "}] No admin
- [${config.admin === "read" ? "x" : " "}] Admin read-only
- [${config.admin === "write" ? "x" : " "}] Admin write (edit/delete/restore)

### Visibility (schema property — not a polymorphic addon)
- [${config.visibility === "none" ? "x" : " "}] No visibility field
- [${config.visibility === "defaultPublic" ? "x" : " "}] Yes — default PUBLIC
- [${config.visibility === "defaultPrivate" ? "x" : " "}] Yes — default PRIVATE

### Resource Actions (Polymorphic Models)
- [${config.resourceActions.includes("likes") ? "x" : " "}] Likes (use existing Like model + add ${resourceUpper} to ResourceType)
- [${config.resourceActions.includes("views") ? "x" : " "}] Views (viewCount counter + view history hydrate/UI tabs)
- [${config.resourceActions.includes("comments") ? "x" : " "}] Comments (use existing Comment model + add ${resourceUpper} to ResourceType)
- [${config.resourceActions.includes("collections") ? "x" : " "}] Collections (use existing Collection/CollectionItem models + add ${resourceUpper} to ResourceType)
- [${config.resourceActions.includes("reports") ? "x" : " "}] Reports (REPORTABLE_RESOURCES + ReportButton; admin queue already exists)

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
- [${config.resourceActions.includes("views") ? "x" : " "}] Views UI (counter + /history + admin user history tabs)
- [${config.resourceActions.includes("comments") ? "x" : " "}] Comments UI
- [${config.resourceActions.includes("collections") ? "x" : " "}] Collections UI (save to collection)
- [${config.resourceActions.includes("reports") ? "x" : " "}] Reports UI (ReportButton on card/detail)
${
  config.visibility !== "none"
    ? `
### Visibility UI
- [x] Create/edit Public/Private select
- [x] Private badge on cards; 404 copy on detail for inaccessible
`
    : ""
}
### Additional Pages
- [${config.profileIntegration ? "x" : " "}] Resource list on user profile page
- [${config.profileIntegration ? "x" : " "}] Scoped search on profile by-user list (\`profile-search.md\`)
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
- **Views**: Counter on ${resource} model + polymorphic \`ViewHistory\` (see views subsections in \`10.md\` / \`21.md\` for history hydrate + UI tabs)
- **Reports**: Existing \`Report\` model + \`REPORTABLE_RESOURCES\` allowlist (see reports subsections in \`10.md\` / \`21.md\`)

Just add \`${resourceUpper}\` to the ResourceType enum.
${
  config.visibility !== "none"
    ? `
## Visibility (not a polymorphic addon)

Reuse \`Visibility\` enum + \`apps/api/src/common/visibility/visibility.ts\` helpers.
Follow \`guide/guidev2/visibility.md\`. Do **not** add a \`PRIVATEABLE_RESOURCES\` list.
`
    : ""
}
## Notes

- Schema details to be confirmed by AI#1
- Uses existing polymorphic patterns (no new models for interactions)
- Soft delete pattern follows existing convention
${
  config.visibility !== "none"
    ? `- Visibility default: ${visibilityPrismaDefault(config.visibility)}
`
    : ""
}`;

  return brief;
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
