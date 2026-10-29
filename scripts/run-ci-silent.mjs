import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const aliasPattern = /^[A-Za-z0-9][A-Za-z0-9:_-]*$/;
const forbidden = /[|;<>^%!`$()\r\n\0]/;

const tokenize = (command) => {
  const tokens = [];
  let value = "", quote = "", closedQuote = false;
  for (const character of command.trim()) {
    if (quote) {
      if (character === quote) { quote = ""; closedQuote = true; }
      else value += character;
    } else if (/\s/.test(character)) {
      if (value || closedQuote) { tokens.push(value); value = ""; closedQuote = false; }
    } else if (character === '"' || character === "'") {
      if (value || closedQuote) throw new Error("Virgolette concatenate non consentite");
      quote = character;
    } else {
      if (closedQuote) throw new Error("Testo dopo virgolette non consentito");
      value += character;
    }
  }
  if (quote) throw new Error("Virgolette non terminate");
  if (value || closedQuote) tokens.push(value);
  if (!tokens.length || tokens.some((token) => !token)) throw new Error("Comando o argomento vuoto");
  return tokens;
};

const localJsFile = (value, folder, cwd) => {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!new RegExp(`^${folder}/[A-Za-z0-9_. /-]+\\.(?:mjs|cjs|js)$`).test(normalized) ||
      normalized.split("/").some((segment) => segment === "." || segment === ".." || !segment)) {
    throw new Error(`File JavaScript locale non consentito: ${value}`);
  }
  return resolve(cwd, normalized);
};

/**
 * Pure expansion of npm test's lifecycle and reachable npm-run aliases.
 * Every command is validated before any process is launched. Only the three
 * supported CLI families can become argv: node, tsc --noEmit and vite build.
 * On Windows, Node tests retain every file but use no process isolation:
 * Node 24's default test-worker spawn lacks windowsHide and can open consoles.
 * This differs from local npm isolation; Linux CI keeps its standard npm test
 * workflow and no isolation flag is introduced for non-Windows plans.
 */
export const expandCiPlan = (packageJson, { cwd, nodePath, platform } = {}) => {
  if (typeof cwd !== "string" || !isAbsolute(cwd) || typeof nodePath !== "string" || !isAbsolute(nodePath)) {
    throw new Error("cwd e nodePath devono essere percorsi assoluti espliciti");
  }
  if (!["win32", "linux", "darwin"].includes(platform)) throw new Error("Piattaforma CI non supportata/non esplicita");
  const scripts = packageJson?.scripts;
  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts) || !Object.hasOwn(scripts, "test")) {
    throw new Error("package.json non contiene lo script test");
  }
  const plan = [];
  const add = (script, command, args) => {
    if (plan.length >= 256) throw new Error("Piano CI oltre il limite di espansione");
    plan.push({ script, command, executable: nodePath, args });
  };
  const body = (name, stack) => {
    const script = scripts[name];
    if (typeof script !== "string" || !script.trim() || forbidden.test(script)) throw new Error(`Script non consentito: ${name}`);
    const commands = script.split("&&");
    if (commands.some((command) => !command.trim() || command.includes("&"))) throw new Error(`Separatore shell non consentito: ${name}`);
    for (const command of commands) {
      const tokens = tokenize(command);
      if (tokens[0] === "npm" && tokens[1] === "run" && tokens.length === 3 && aliasPattern.test(tokens[2])) {
        alias(tokens[2], stack);
      } else if (tokens[0] === "tsc" && tokens.length === 2 && tokens[1] === "--noEmit") {
        add(name, command.trim(), [join(cwd, "node_modules", "typescript", "bin", "tsc"), "--noEmit"]);
      } else if (tokens[0] === "vite" && tokens.length === 2 && tokens[1] === "build") {
        add(name, command.trim(), [join(cwd, "node_modules", "vite", "bin", "vite.js"), "build"]);
      } else if (tokens[0] === "node" && tokens[1] === "--test" && tokens.length > 2) {
        add(name, command.trim(), ["--test", ...(platform === "win32" ? ["--test-isolation=none"] : []), ...tokens.slice(2).map((file) => localJsFile(file, "tests", cwd))]);
      } else if (tokens[0] === "node" && tokens.length >= 2 && tokens.slice(2).every((argument) => argument === "--strict")) {
        add(name, command.trim(), [localJsFile(tokens[1], "scripts", cwd), ...tokens.slice(2)]);
      } else {
        throw new Error(`CLI o argomenti non consentiti nello script ${name}`);
      }
    }
  };
  const alias = (name, stack = []) => {
    if (!aliasPattern.test(name) || !Object.hasOwn(scripts, name)) throw new Error(`Alias npm mancante/non consentito: ${name}`);
    if (stack.includes(name)) throw new Error(`Alias npm ciclico: ${[...stack, name].join(" -> ")}`);
    if (stack.length >= 64) throw new Error("Alias npm troppo profondi");
    const next = [...stack, name];
    for (const scriptName of [`pre${name}`, name, `post${name}`]) {
      if (!Object.hasOwn(scripts, scriptName)) continue;
      // Lifecycle hooks do not recursively invoke their own pre/post hooks.
      body(scriptName, scriptName === name ? next : [...next, scriptName]);
    }
  };
  alias("test");
  return plan;
};

/** Protected CLI entrypoint; dependencies can be replaced by fakes in tests. */
export const runCiSilent = async ({
  cwd = projectRoot, nodePath = process.execPath, platform = process.platform, spawnImpl = spawn,
  readPackage = async () => JSON.parse(await readFile(join(cwd, "package.json"), "utf8")),
  log = (message) => console.log(message), error = (message) => console.error(message),
} = {}) => {
  const plan = expandCiPlan(await readPackage(), { cwd, nodePath, platform });
  for (const [index, step] of plan.entries()) {
    log(`[ci-silent ${index + 1}/${plan.length}] ${step.script}: ${step.command}`);
    const code = await new Promise((resolveCode) => {
      let settled = false;
      const finish = (value) => { if (!settled) { settled = true; resolveCode(value); } };
      try {
        const child = spawnImpl(step.executable, step.args, {
          cwd, windowsHide: true, shell: false, stdio: "inherit",
        });
        child.once("error", (cause) => { error(`[ci-silent] Avvio fallito: ${cause.message}`); finish(1); });
        child.once("close", (exitCode, signal) => finish(
          !signal && exitCode === 0 ? 0 : Number.isInteger(exitCode) && exitCode > 0 ? exitCode : 1,
        ));
      } catch (cause) { error(`[ci-silent] Avvio fallito: ${cause.message}`); finish(1); }
    });
    if (code !== 0) return code;
  }
  return 0;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCiSilent().then((code) => { process.exitCode = code; }).catch((cause) => {
    console.error(`[ci-silent] ${cause.message}`);
    process.exitCode = 1;
  });
}
