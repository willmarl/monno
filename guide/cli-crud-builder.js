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
    message: "Pagination for findAll?",
    choices: paginationChoices,
  });

  const paginationByUser = await select({
    message: "Pagination for findByUserId?",
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

  let paginationUI = null;
  if (frontend && pagination !== "none") {
    const paginationUIChoices = [];
    if (pagination === "offset" || pagination === "both") {
      paginationUIChoices.push({
        name: "Numbered page buttons (1, 2, 3...) [offset]",
        value: "numbered",
      });
      paginationUIChoices.push({
        name: "Load more button [cursor]",
        value: "loadMore",
      });
    }
    if (pagination === "cursor" || pagination === "both") {
      paginationUIChoices.push({
        name: "Infinite scroll [cursor]",
        value: "infinite",
      });
    }
    if (pagination === "both") {
      paginationUIChoices.push({
        name: "Load more + infinite scroll [offset + cursor]",
        value: "both",
      });
    }
    paginationUI = await select({
      message: "Frontend pagination UI style?",
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
    paginationByUser,
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
    paginationByUser: answers.paginationByUser,
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

  const promptPath = path.join(process.cwd(), `PROMPT-${resource}.txt`);
  const briefPath = path.join(process.cwd(), `PROJECT-BRIEF-${resource}.md`);

  fs.writeFileSync(promptPath, aiPrompt);
  fs.writeFileSync(briefPath, projectBrief);

  log.title("✨ Done!");
  log.success(`Saved PROMPT-${resource}.txt`);
  log.success(`Saved PROJECT-BRIEF-${resource}.md`);
  console.log();
  console.log(`Next steps:`);
  console.log();
  console.log(`  [Session 1 — Schema Planning]`);
  console.log(`  1. Start a NEW chat session with your AI`);
  console.log(
    `  2. Share: PROMPT-${resource}.txt + apps/api/prisma/schema.prisma`,
  );
  console.log(
    `  3. In the same message, describe the ${resource} fields freely:`,
  );
  console.log(
    `     e.g. "title, summary, content. importance enum (low/mid/high). cover image optional"`,
  );
  console.log(
    `  4. AI proposes schema → you confirm → AI outputs final PROJECT-BRIEF-${resource}.md`,
  );
  console.log(
    `  5. In agent mode the brief is auto-saved; otherwise manually update/replace the generated PROJECT-BRIEF-${resource}.md with the AI output`,
  );
  console.log();
  console.log(`  [Session 2 — Implementation]`);
  console.log(`  6. Start another NEW chat session with your AI`);
  console.log(
    `  7. Share: PROJECT-BRIEF-${resource}.md + guide/how-to-add-new-resource.md`,
  );
  console.log(
    `  8. Say: "You are in Implementation Mode. Follow the guide parts in order.`,
  );
  console.log(
    `          All decisions are in the brief — no clarifying questions needed."`,
  );
  console.log(
    `  9. If the chat gets too long mid-way, start a new session and add:`,
  );
  console.log(`     "We completed up to Part X. Continue from Part X+1."`);
  console.log();
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
- Pagination (findAll): ${config.pagination}
- Pagination (findByUserId): ${config.paginationByUser}
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
