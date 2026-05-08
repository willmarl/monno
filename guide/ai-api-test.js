#!/usr/bin/env node

/**
 * Endpoint Test Helper
 *
 * Usage: node guide/endpoint-test.js
 *        pnpm run endpoint-test
 *
 * Reads auth config from apps/api/.env and generates credentials for testing.
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
  code: (msg) => console.log(`${COLORS.cyan}${msg}${COLORS.reset}`),
};

function loadEnv() {
  const envPath = path.join(process.cwd(), "apps/api/.env");

  if (!fs.existsSync(envPath)) {
    return {
      port: null,
      username: null,
      password: null,
      error: `${envPath} not found`,
    };
  }

  try {
    const content = fs.readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    const config = {};

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^['"]|['"]$/g, "");
      config[key.trim()] = value;
    });

    return {
      port: config.PORT || null,
      username: config.SEED_ADMIN_USERNAME || null,
      password: config.SEED_ADMIN_PASSWORD || null,
      error: null,
    };
  } catch (err) {
    return {
      port: null,
      username: null,
      password: null,
      error: err.message,
    };
  }
}

function showMissingConfigError(config) {
  console.log(
    `\n${COLORS.red}${COLORS.bright}⚠️  Cannot auto-generate credentials${COLORS.reset}\n`,
  );

  const missing = [];
  if (!config.port) missing.push("PORT");
  if (!config.username) missing.push("SEED_ADMIN_USERNAME");
  if (!config.password) missing.push("SEED_ADMIN_PASSWORD");

  console.log(`Missing from ${COLORS.cyan}apps/api/.env${COLORS.reset}:`);
  missing.forEach((m) =>
    console.log(`  ${COLORS.yellow}• ${m}${COLORS.reset}`),
  );

  console.log(
    `\n${COLORS.bright}To get credentials manually:${COLORS.reset}\n`,
  );
  console.log(`1. Start your dev server:`);
  log.code(`   pnpm dev`);
  console.log(`\n2. Authenticate with your admin credentials:`);
  log.code(`   curl -X POST http://localhost:3001/auth/login \\`);
  log.code(`     -H "Content-Type: application/json" \\`);
  log.code(`     -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'`);
  console.log(`\n3. Copy the token and sessionId from the response`);

  showInstructions();
}

function showInstructions() {
  console.log(
    `\n${COLORS.bright}📋 Step 4: Copy & Paste This Prompt to Claude:${COLORS.reset}\n`,
  );
  console.log(`---\n`);
  console.log(
    `first think of short postman tests to do to verify endpoints. then i want you to run bash commands in this chat to tests those endpoints.`,
  );
  console.log(
    `here is example command of my current admin session that i give you permission to use \`curl -H "Authorization: Bearer YOUR_TOKEN" -b "sessionId=YOUR_SESSION_ID" http://localhost:3001/admin/stats\` use should be able to use the token and session to test endpoints`,
  );
  console.log(`\n---\n`);
  console.log(
    `${COLORS.cyan}Replace YOUR_TOKEN and YOUR_SESSION_ID with the credentials from step 2${COLORS.reset}\n`,
  );
}

async function authenticate(port, username, password) {
  const url = `http://localhost:${port}/auth/login`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      log.error(`Login failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const setCookieHeader = response.headers.get("set-cookie");

    // Extract from Set-Cookie headers (preferred, as tokens are HttpOnly)
    const token = setCookieHeader ? extractAccessToken(setCookieHeader) : null;
    const sessionId = setCookieHeader
      ? extractSessionId(setCookieHeader)
      : null;

    return {
      token,
      sessionId,
      refreshToken: data.refresh_token || data.refreshToken,
    };
  } catch (err) {
    log.error(`Connection failed: ${err.message}`);
    log.info(`Make sure the dev server is running on http://localhost:${port}`);
    return null;
  }
}

function extractSessionId(cookieHeader) {
  const match = cookieHeader.match(/sessionId=([^;]+)/);
  return match ? match[1] : null;
}

function extractAccessToken(cookieHeader) {
  const match = cookieHeader.match(/accessToken=([^;]+)/);
  return match ? match[1] : null;
}

function generatePrompt(auth) {
  const token = auth.token || "<TOKEN>";
  const sessionId = auth.sessionId || "<SESSION_ID>";

  const prompt = `${COLORS.bright}📋 Copy & Paste This Prompt:${COLORS.reset}

---

first think of short postman tests to do to verify endpoints. then i want you to run bash commands in this chat to tests those endpoints.
here is example command of my current admin session that i give you permission to use \`curl -H "Authorization: Bearer ${token}" -b "sessionId=${sessionId}" http://localhost:3001/admin/stats\` use should be able to use the token and session to test endpoints

---

${COLORS.cyan}Fresh credentials generated at ${new Date().toLocaleTimeString()}${COLORS.reset}
`;

  return prompt;
}

async function main() {
  const config = loadEnv();

  // Check if .env loading failed
  if (config.error) {
    log.error(`Failed to load .env: ${config.error}`);
    showMissingConfigError({ port: null, username: null, password: null });
    process.exit(1);
  }

  // Check if required config values are missing
  if (!config.port || !config.username || !config.password) {
    showMissingConfigError(config);
    process.exit(1);
  }

  log.section("Authenticating");
  log.info(`Using ${COLORS.cyan}apps/api/.env${COLORS.reset} credentials`);

  const auth = await authenticate(
    config.port,
    config.username,
    config.password,
  );

  if (!auth) {
    process.exit(1);
  }

  log.success("Authenticated as admin");

  if (auth.token) {
    log.info(`Token: ${auth.token.substring(0, 20)}...`);
  } else {
    log.warn("No token extracted (may need to be provided manually)");
  }

  if (auth.sessionId) {
    log.info(`SessionId: ${auth.sessionId.substring(0, 10)}...`);
  } else {
    log.warn("No sessionId found in response");
  }

  const prompt = generatePrompt(auth);
  console.log(prompt);
}

main();
