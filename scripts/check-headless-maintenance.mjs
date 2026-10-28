// Read-only host preflight. Never launches a browser or removes a file.
import { fileURLToPath } from "node:url";
import { createReadOnlyCommandRunner, parseWmiProcesses } from "./headless-cleanup.mjs";

const run = createReadOnlyCommandRunner();
const checks = [
  { name: "processes", command: "C:\\Windows\\System32\\wbem\\WMIC.exe path Win32_Process get Name,CommandLine,ProcessId,ParentProcessId /format:csv", options: { timeoutMs: 3000 } },
  { name: "non-reparse-directory", command: "dir /a:-l /b", options: { cwd: fileURLToPath(new URL("./", import.meta.url)), unicode: true, timeoutMs: 3000 } },
];
for (const check of checks) {
  try {
    const output = await run(check.command, check.options);
    const count = check.name === "processes" ? parseWmiProcesses(output).length : output.split(/\r?\n/).filter(Boolean).length;
    console.log(JSON.stringify({ check: check.name, ok: true, count }));
  } catch (error) {
    console.log(JSON.stringify({ check: check.name, ok: false, error: error.message }));
    process.exitCode = 1;
  }
}
