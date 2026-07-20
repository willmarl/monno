#!/usr/bin/env node

/**
 * CRUD Resource Validator
 *
 * Usage: node guide/validate-resource.js blog
 *        pnpm run validate-resource blog
 *
 * Reads CONFIG-{{resource}}.json and validates that all expected files exist
 * based on the selected features (pagination, admin, search, etc).
 */

const fs = require("fs");
const path = require("path");

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};

const log = {
  success: (msg) => console.log(`${COLORS.green}✅ ${msg}${COLORS.reset}`),
  error: (msg) => console.log(`${COLORS.red}❌ ${msg}${COLORS.reset}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}`),
  section: (msg) => console.log(`\n${COLORS.bright}[${msg}]${COLORS.reset}`),
  info: (msg) => console.log(`${COLORS.cyan}ℹ  ${msg}${COLORS.reset}`),
};

function categorizeErrors(failedChecks, R, rs) {
  const categories = {
    backend: [],
    content: [],
    frontend: [],
  };

  failedChecks.forEach(({ filePath, description }) => {
    if (filePath.includes("apps/api")) {
      categories.backend.push({ filePath, description });
    } else if (
      filePath.includes("schema.prisma") ||
      filePath.includes("app.module") ||
      filePath.includes("admin.module")
    ) {
      categories.content.push({ filePath, description });
    } else if (filePath.includes("apps/web")) {
      categories.frontend.push({ filePath, description });
    }
  });

  return categories;
}

function generateAIPrompt(resource, R, rs, errorsByType, config) {
  console.log(
    `\n${COLORS.bright}📋 AI Prompt to Fix These Errors:${COLORS.reset}\n`,
  );
  console.log(
    `${COLORS.cyan}Copy this and paste it into your AI chat to help fix the issues:${COLORS.reset}\n`,
  );

  const prompt = buildPrompt(resource, R, rs, errorsByType, config);
  console.log(prompt);
  console.log(
    `\n${COLORS.cyan}Reference: @guide/guidev2/ROUTER.md (then only your path letter files)${COLORS.reset}\n`,
  );
}

function buildPrompt(resource, R, rs, errorsByType, config) {
  let prompt = `I'm implementing the ${R} resource with the following configuration:\n`;
  prompt += `- Pagination: ${config.pagination}\n`;
  prompt += `- Search: ${config.search}\n`;
  prompt += `- Admin: ${config.admin}\n`;
  prompt += `- File Upload: ${config.fileUpload}\n`;
  prompt += `- Frontend: ${config.frontend}\n`;
  prompt += `- Profile Integration: ${config.profileIntegration}\n\n`;

  prompt += `The validator found the following missing files/components that need to be created:\n\n`;

  if (errorsByType.backend.length > 0) {
    prompt += `**Backend files:**\n`;
    errorsByType.backend.forEach(({ filePath, description }) => {
      prompt += `- [ ] ${filePath} (${description})\n`;
    });
    prompt += `\n`;
  }

  if (errorsByType.content.length > 0) {
    prompt += `**Schema/Module updates:**\n`;
    errorsByType.content.forEach(({ filePath, description }) => {
      prompt += `- [ ] ${filePath} - ${description}\n`;
    });
    prompt += `\n`;
  }

  if (errorsByType.frontend.length > 0) {
    prompt += `**Frontend components/pages:**\n`;
    errorsByType.frontend.forEach(({ filePath, description }) => {
      prompt += `- [ ] ${filePath} (${description})\n`;
    });
    prompt += `\n`;
  }

  prompt += `Please refer to @guide/guidev2/ROUTER.md — resolve fileUpload to path letter a/b/c, then open only matching guidev2 chapters for `;
  prompt += `the exact structure and patterns needed for each of these files. Never open sibling path letters or how-to-add-new-resource.md.`;

  return prompt;
}

function main() {
  const resourceArg = process.argv[2];
  if (!resourceArg) {
    console.error("Usage: node guide/validate-resource.js <resource>");
    console.error("Example: node guide/validate-resource.js blog");
    process.exit(1);
  }

  // Capitalize resource name the same way cli-crud-builder.js does
  const resource =
    resourceArg.trim().charAt(0).toUpperCase() + resourceArg.trim().slice(1);
  const configPath = path.join(process.cwd(), `CONFIG-${resource}.json`);

  // Load config
  let config;
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(raw);
  } catch (err) {
    console.error(
      `${COLORS.red}Error: CONFIG-${resource}.json not found${COLORS.reset}`,
    );
    console.error(
      `${COLORS.yellow}Did you run: pnpm run crud ${resourceArg}?${COLORS.reset}\n`,
    );
    process.exit(1);
  }

  // Naming helpers
  const R = config.resource; // "Blog"
  const r = R.toLowerCase(); // "blog"
  const rs = r + "s"; // "blogs"
  const RU = R.toUpperCase(); // "BLOG"

  console.log(`\n${COLORS.bright}Validating ${R} resource...${COLORS.reset}`);
  log.info(
    `Config: pagination=${config.pagination} | search=${config.search} | admin=${config.admin} | frontend=${config.frontend} | profile=${config.profileIntegration}`,
  );

  let errors = 0;
  const checks = [];

  // Helper to check file exists (with optional route group fallback)
  const checkFile = (filePath, description, alternativePath) => {
    const fullPath = path.join(process.cwd(), filePath);
    let exists = fs.existsSync(fullPath);
    let displayPath = filePath;

    // Try alternative path if primary doesn't exist
    if (!exists && alternativePath) {
      const altFullPath = path.join(process.cwd(), alternativePath);
      if (fs.existsSync(altFullPath)) {
        exists = true;
        displayPath = alternativePath;
      }
    }

    checks.push({ exists, filePath: displayPath, description });
    return exists;
  };

  // Helper to check content in file (supports alternative content to search for)
  const checkContent = (filePath, content, description, alternativeContent) => {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const fileContent = fs.readFileSync(fullPath, "utf-8");
      let exists = fileContent.includes(content);
      let displayContent = content;

      // Try alternative content if primary doesn't exist
      if (!exists && alternativeContent) {
        if (fileContent.includes(alternativeContent)) {
          exists = true;
          displayContent = alternativeContent;
        }
      }

      checks.push({
        exists,
        filePath: `${filePath} (contains "${displayContent}")`,
        description,
      });
      return exists;
    } catch (err) {
      checks.push({
        exists: false,
        filePath,
        description: `${description} (file not found)`,
      });
      return false;
    }
  };

  // ==================== BACKEND ====================
  log.section("BACKEND");

  // Always required
  checkFile(`apps/api/src/modules/${rs}/${rs}.service.ts`, `${R} Service`);
  checkFile(
    `apps/api/src/modules/${rs}/${rs}.controller.ts`,
    `${R} Controller`,
  );
  checkFile(`apps/api/src/modules/${rs}/${rs}.module.ts`, `${R} Module`);
  checkFile(
    `apps/api/src/modules/${rs}/dto/create-${r}.dto.ts`,
    `Create ${R} DTO`,
  );
  checkFile(
    `apps/api/src/modules/${rs}/dto/update-${r}.dto.ts`,
    `Update ${R} DTO`,
  );

  // Conditional: search
  if (config.search !== "none") {
    checkFile(
      `apps/api/src/modules/${rs}/dto/search-${r}.dto.ts`,
      `Search ${R} DTO`,
    );
  }

  // Conditional: admin
  // Admin files can use either singular (admin-article) or plural (admin-blogs) naming
  if (config.admin !== "none") {
    checkFile(
      `apps/api/src/modules/admin/${rs}/admin-${rs}.service.ts`,
      `Admin ${R} Service`,
      `apps/api/src/modules/admin/${rs}/admin-${r}.service.ts`,
    );
    checkFile(
      `apps/api/src/modules/admin/${rs}/admin-${rs}.controller.ts`,
      `Admin ${R} Controller`,
      `apps/api/src/modules/admin/${rs}/admin-${r}.controller.ts`,
    );
  }

  // Content checks
  log.section("CONTENT");
  checkContent(
    `apps/api/prisma/schema.prisma`,
    RU,
    `ResourceType enum contains ${RU}`,
  );
  // Modules use plural form (e.g., BlogsModule)
  const RS = rs.charAt(0).toUpperCase() + rs.slice(1); // "Blogs"
  checkContent(
    `apps/api/src/app.module.ts`,
    `${RS}Module`,
    `app.module.ts imports ${RS}Module`,
  );
  if (config.admin !== "none") {
    // Admin services can use either singular (AdminArticleService) or plural (AdminBlogsService) naming
    checkContent(
      `apps/api/src/modules/admin/admin.module.ts`,
      `Admin${RS}Service`,
      `admin.module.ts registers Admin${RS}Service`,
      `Admin${R}Service`,
    );
  }

  // ==================== FRONTEND ====================
  if (config.frontend) {
    log.section("FRONTEND");

    // Always required (if frontend)
    checkFile(`apps/web/src/features/${rs}/api.ts`, `${R} API client`);
    checkFile(`apps/web/src/features/${rs}/hooks.ts`, `${R} Hooks`);
    checkFile(`apps/web/src/features/${rs}/types/${r}.ts`, `${R} Types`);
    checkFile(
      `apps/web/src/features/${rs}/schemas/create${R}.schema.ts`,
      `Create ${R} Schema`,
    );
    checkFile(
      `apps/web/src/features/${rs}/schemas/update${R}.schema.ts`,
      `Update ${R} Schema`,
    );
    checkFile(
      `apps/web/src/features/${rs}/components/Create${R}Form.tsx`,
      `Create ${R} Form`,
    );
    checkFile(
      `apps/web/src/features/${rs}/components/Edit${R}Form.tsx`,
      `Edit ${R} Form`,
    );

    // Optional: modals for create/edit (check if they exist)
    checkFile(
      `apps/web/src/features/${rs}/components/modal/Create${R}Modal.tsx`,
      `Create ${R} Modal (optional)`,
    );
    checkFile(
      `apps/web/src/features/${rs}/components/modal/Edit${R}Modal.tsx`,
      `Edit ${R} Modal (optional)`,
    );

    checkFile(
      `apps/web/src/app/${r}/page.tsx`,
      `${R} List Page`,
      `apps/web/src/app/(default)/${r}/page.tsx`,
    );
    checkFile(
      `apps/web/src/app/${r}/[id]/page.tsx`,
      `${R} Detail Page`,
      `apps/web/src/app/(default)/${r}/[id]/page.tsx`,
    );
    checkFile(
      `apps/web/src/app/${r}/create/page.tsx`,
      `${R} Create Page`,
      `apps/web/src/app/(default)/${r}/create/page.tsx`,
    );

    // Conditional: admin edit form (CRITICAL for future-proofing)
    // Admin forms can be in either admin features folder or regular features folder
    if (config.admin === "write") {
      checkFile(
        `apps/web/src/features/admin/${rs}/components/AdminEdit${R}Form.tsx`,
        `Admin Edit ${R} Form (admin-only fields)`,
        `apps/web/src/features/${rs}/components/AdminEdit${R}Form.tsx`,
      );

      // Optional: admin edit modal (check if it exists)
      checkFile(
        `apps/web/src/features/admin/${rs}/components/modal/AdminEdit${R}Modal.tsx`,
        `Admin Edit ${R} Modal (optional)`,
      );
    }

    // Conditional: admin dashboard page
    if (config.admin !== "none") {
      checkFile(
        `apps/web/src/app/admin/${rs}/page.tsx`,
        `${R} Admin Dashboard`,
        `apps/web/src/app/(admin)/admin/${rs}/page.tsx`,
      );
    }

    // Conditional: profile integration
    if (config.profileIntegration) {
      checkFile(
        `apps/web/src/components/pages/userProfile/Users${R}sList.tsx`,
        `Users ${R}s List (profile integration)`,
      );
    }
  }

  // ==================== REPORT ====================
  console.log(`\n${"─".repeat(50)}`);

  // Print all checks in order
  checks.forEach(({ exists, filePath, description }) => {
    if (exists) {
      log.success(filePath);
    } else {
      log.error(filePath);
      errors++;
    }
  });

  console.log(`${"─".repeat(50)}\n`);

  if (errors === 0) {
    console.log(
      `${COLORS.green}${COLORS.bright}✅ All checks passed!${COLORS.reset}\n`,
    );
    process.exit(0);
  } else {
    console.log(
      `${COLORS.red}${COLORS.bright}❌ ${errors} error${errors === 1 ? "" : "s"} found${COLORS.reset}\n`,
    );

    // Check for specific patterns
    const failedChecks = checks.filter((c) => !c.exists);
    const errorsByType = categorizeErrors(failedChecks, R, rs);

    const missingAdminEdit = failedChecks.some((c) =>
      c.filePath.includes(`AdminEdit${R}Form`),
    );

    if (missingAdminEdit) {
      log.warn(
        `Missing Admin Edit form — guide requires separate admin variants`,
      );
      console.log(
        `  ${COLORS.cyan}Admin-only fields (e.g. shadowbanned) should only appear in ${COLORS.bright}AdminEdit${R}Form${COLORS.cyan},`,
      );
      console.log(
        `  not in the user-facing Edit${R}Form. This prevents accidental exposure.${COLORS.reset}\n`,
      );
    }

    // Generate AI prompt
    generateAIPrompt(resource, R, rs, errorsByType, config);

    process.exit(1);
  }
}

main();
