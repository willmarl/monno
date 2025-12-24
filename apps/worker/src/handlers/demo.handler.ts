import * as path from "path";
import { runBash, runCommand } from "../utils/subprocess";
import * as fs from "fs";

export async function demoHandler(): Promise<void> {
  console.log(`[demo] starting script`);

  try {
    const scriptsDir = path.join(__dirname, "../scripts");

    console.log(`[demo]running notification (Bash)...`);
    await runBash(path.join(scriptsDir, "notify.sh"));
  } catch (error) {
    console.error(`[demo] ✗ Error running script:`, error);
    throw error; // BullMQ will handle retry
  }
}
