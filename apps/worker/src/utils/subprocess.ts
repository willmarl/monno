import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Run a Python script with arguments
 */
export async function runPython(
  scriptPath: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync("python3", [
      scriptPath,
      ...args,
    ]);
    return { stdout, stderr };
  } catch (error) {
    const err = error as any;
    throw new Error(
      `Python script failed: ${err.message}\nStderr: ${err.stderr || ""}`
    );
  }
}

/**
 * Run a Bash script with arguments
 */
export async function runBash(
  scriptPath: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync("bash", [
      scriptPath,
      ...args,
    ]);
    return { stdout, stderr };
  } catch (error) {
    const err = error as any;
    throw new Error(
      `Bash script failed: ${err.message}\nStderr: ${err.stderr || ""}`
    );
  }
}

/**
 * Run any command with arguments
 */
export async function runCommand(
  command: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args);
    return { stdout, stderr };
  } catch (error) {
    const err = error as any;
    throw new Error(
      `Command failed: ${err.message}\nStderr: ${err.stderr || ""}`
    );
  }
}
