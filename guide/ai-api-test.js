#!/usr/bin/env node

/**
 * AI API smoke-test helper
 *
 * Usage: pnpm run ai-api-test
 *
 * Logs in with SEED_ADMIN_* from apps/api/.env and prints a paste prompt
 * so an AI can curl live endpoints in the current chat.
 * Requires: API already running (pnpm dev).
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
  dim: "\x1b[2m",
};

const log = {
  success: (msg) => console.log(`${COLORS.green}✅ ${msg}${COLORS.reset}`),
  error: (msg) => console.log(`${COLORS.red}❌ ${msg}${COLORS.reset}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}`),
  section: (msg) => console.log(`\n${COLORS.bright}[${msg}]${COLORS.reset}`),
  info: (msg) => console.log(`${COLORS.cyan}ℹ  ${msg}${COLORS.reset}`),
  code: (msg) => console.log(`${COLORS.cyan}${msg}${COLORS.reset}`),
  dim: (msg) => console.log(`${COLORS.dim}${msg}${COLORS.reset}`),
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
  console.log(
    `\n${COLORS.dim}Then paste a prompt telling your AI to curl with Authorization: Bearer <token> and -b "sessionId=<id>"${COLORS.reset}\n`,
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

    const token = setCookieHeader ? extractAccessToken(setCookieHeader) : null;
    const sessionId = setCookieHeader
      ? extractSessionId(setCookieHeader)
      : null;

    return {
      token,
      sessionId,
      refreshToken: data.refresh_token || data.refreshToken,
      port,
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
  const port = auth.port || "3001";
  const base = `http://localhost:${port}`;

  // Plain text only inside copy markers (no ANSI) for easy drag-select.
  const lines = [
    `You have permission to smoke-test the live API with curl in this chat.`,
    ``,
    `1. Skim the resource's controller(s) / PROJECT-BRIEF / Bruno file if present and list a short smoke plan (create → read → update → media if any → delete/restore if admin).`,
    `2. Run those checks with bash curl commands. Fix failures before continuing the guide.`,
    `3. Use this admin session (keep the space after "Bearer"):`,
    ``,
    `curl -sS -H "Authorization: Bearer ${token}" -b "sessionId=${sessionId}" ${base}/admin/stats`,
    ``,
    `Reuse the same Authorization and -b cookie headers for other routes on ${base}.`,
    `Prefer JSON -H "Content-Type: application/json" for create/update unless the endpoint is multipart.`,
  ];

  return lines.join("\n");
}

async function main() {
  const config = loadEnv();

  if (config.error) {
    log.error(`Failed to load .env: ${config.error}`);
    showMissingConfigError({ port: null, username: null, password: null });
    process.exit(1);
  }

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

  console.log();
  log.section("Copy & paste this prompt to your AI");
  log.dim("--- copy below ---");
  console.log(generatePrompt(auth));
  log.dim("--- copy above ---");
  console.log();
  log.dim(`Fresh credentials at ${new Date().toLocaleTimeString()}`);
  console.log();
}

main();
