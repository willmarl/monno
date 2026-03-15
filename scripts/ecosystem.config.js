const fs = require("fs");
const path = require("path");

// Load environment variables from .env.deploy
const envPath = path.join(__dirname, ".env.deploy");
let deployPath = "/opt/apps/monno"; // default

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/DEPLOY_PATH=(.+)/);
  if (match) {
    deployPath = match[1].trim();
  }
}

module.exports = {
  apps: [
    {
      name: "api",
      cwd: `${deployPath}/apps/api`,
      script: "bash",
      args: "-c 'pnpm run start'",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      error_file: `${deployPath}/logs/api-error.log`,
      out_file: `${deployPath}/logs/api-out.log`,
      merge_logs: true,
      restart_delay: 4000,
    },
    {
      name: "web",
      cwd: `${deployPath}/apps/web`,
      script: "bash",
      args: "-c 'pnpm run start'",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      error_file: `${deployPath}/logs/web-error.log`,
      out_file: `${deployPath}/logs/web-out.log`,
      merge_logs: true,
      restart_delay: 4000,
    },
    {
      name: "worker",
      cwd: `${deployPath}/apps/worker`,
      script: "bash",
      args: "-c 'pnpm run start'",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      error_file: `${deployPath}/logs/worker-error.log`,
      out_file: `${deployPath}/logs/worker-out.log`,
      merge_logs: true,
      restart_delay: 4000,
    },
  ],
};
