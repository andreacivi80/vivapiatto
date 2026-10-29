import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { expandCiPlan, runCiSilent } from "../scripts/run-ci-silent.mjs";

const cwd = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nodePath = process.execPath;
const options = { cwd, nodePath, platform: "win32" };
const pkg = (scripts) => ({ scripts });
const script = (name) => `node scripts/${name}.mjs`;

test("silent CI expands the current package plan, rather than a second command list", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const before = JSON.stringify(packageJson);
  const plan = expandCiPlan(packageJson, options);
  assert.ok(plan.length > 15);
  assert.equal(plan[0].script, "typecheck");
  assert.deepEqual(plan[0].args, [join(cwd, "node_modules", "typescript", "bin", "tsc"), "--noEmit"]);
  assert.equal(plan[1].command, "node scripts/audit-food-database.mjs");
  assert.ok(plan.some((entry) => entry.script === "build" && entry.args[0] === join(cwd, "node_modules", "vite", "bin", "vite.js")));
  const testSteps = plan.filter((entry) => entry.args[0] === "--test");
  assert.equal(testSteps.length, 2);
  for (const step of testSteps) {
    assert.equal(step.args[1], "--test-isolation=none");
    const declared = step.command.split(/\s+/).slice(2).map((path) => resolve(cwd, path));
    assert.deepEqual(step.args.slice(2), declared);
  }
  for (const entry of plan) {
    assert.equal(entry.executable, process.execPath);
    assert.doesNotMatch(entry.executable, /(?:npm|cmd|powershell|pwsh)(?:\.exe|\.cmd)?$/i);
  }
  assert.equal(JSON.stringify(packageJson), before);
});

test("npm lifecycle order includes pretest/posttest and hooks around nested aliases", () => {
  const plan = expandCiPlan(pkg({
    pretest: `npm run check && ${script("before")}`,
    precheck: script("pre-check"), check: "tsc --noEmit", postcheck: script("post-check"),
    test: `${script("first")} && npm run build && node --test tests/one.test.mjs tests/two.test.mjs`,
    prebuild: script("pre-build"), build: "vite build", postbuild: script("post-build"),
    posttest: script("after"),
  }), options);
  assert.deepEqual(plan.map((entry) => entry.script), [
    "precheck", "check", "postcheck", "pretest", "test", "prebuild", "build", "postbuild", "test", "posttest",
  ]);
  assert.deepEqual(plan.at(-2).args, ["--test", "--test-isolation=none", join(cwd, "tests", "one.test.mjs"), join(cwd, "tests", "two.test.mjs")]);
});

test("Windows disables test workers explicitly; Linux and macOS keep the declared isolation", () => {
  const packageJson = pkg({ test: "node --test tests/a.test.mjs tests/b.test.mjs" });
  const windowsPlan = expandCiPlan(packageJson, options);
  assert.deepEqual(windowsPlan[0].args, ["--test", "--test-isolation=none", join(cwd, "tests", "a.test.mjs"), join(cwd, "tests", "b.test.mjs")]);
  for (const platform of ["linux", "darwin"]) {
    const plan = expandCiPlan(packageJson, { ...options, platform });
    assert.deepEqual(plan[0].args, ["--test", join(cwd, "tests", "a.test.mjs"), join(cwd, "tests", "b.test.mjs")]);
    assert.equal(plan[0].args.includes("--test-isolation=none"), false);
  }
  assert.throws(() => expandCiPlan(packageJson, { cwd, nodePath }), /Piattaforma/);
});

test("alias contents are taken from the supplied package, including newly added safe aliases", () => {
  const plan = expandCiPlan(pkg({ test: "npm run test:new", "test:new": script("new-audit") }), options);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].script, "test:new");
  assert.equal(plan[0].args[0], join(cwd, "scripts", "new-audit.mjs"));
});

test("automatic lifecycle hooks do not recursively execute their own hooks", () => {
  const plan = expandCiPlan(pkg({ prepretest: script("not-an-automatic-hook"), pretest: script("before"), test: script("main") }), options);
  assert.deepEqual(plan.map((entry) => entry.script), ["pretest", "test"]);
});

test("only local node scripts/tests, tsc noEmit and vite build can become argv", () => {
  for (const command of [
    "cmd /c echo unsafe", "powershell -Command echo unsafe", "pwsh -c echo unsafe",
    "npm test", "npx tsc --noEmit", "npm run missing", "npm run build -- --watch",
    "node -e unsafe", "node --eval unsafe", "node --require unsafe scripts/a.mjs",
    "node node_modules/unsafe.js", "node scripts/../unsafe.mjs", "node ../scripts/a.mjs",
    "node scripts/a.cmd", "node scripts/a.mjs --command=unsafe", "node scripts/a.mjs other.exe",
    "node --test --import=unsafe tests/a.test.mjs", "node --test scripts/a.mjs", "node --test tests/*.mjs",
    "tsc", "tsc --emitDeclarationOnly", "vite", "vite preview", "vite build --watch",
  ]) assert.throws(() => expandCiPlan(pkg({ test: command }), options), undefined, command);
  assert.deepEqual(expandCiPlan(pkg({ test: "node scripts/audit.mjs --strict" }), options)[0].args, [join(cwd, "scripts", "audit.mjs"), "--strict"]);
});

test("shell metacharacters and malformed chains/quoting fail closed before execution", () => {
  for (const suffix of [" | other", " & other", ";other", " > output", " < input", " ^other", " %PATH%", " !x!", " `other`", " $(other)", "\nother", "\rnext", "\0"]) {
    assert.throws(() => expandCiPlan(pkg({ test: `${script("audit")}${suffix}` }), options));
  }
  for (const command of ["", "&& node scripts/a.mjs", "node scripts/a.mjs &&", "node scripts/a.mjs &&&& node scripts/b.mjs", 'node "scripts/a.mjs', 'no"de" scripts/a.mjs', 'node "scripts/a.mjs"other']) {
    assert.throws(() => expandCiPlan(pkg({ test: command }), options));
  }
  assert.equal(expandCiPlan(pkg({ test: 'node "scripts/audit one.mjs"' }), options)[0].args[0], join(cwd, "scripts", "audit one.mjs"));
});

test("alias cycles, lifecycle cycles and missing/invalid packages are rejected", () => {
  for (const scripts of [
    { test: "npm run a", a: "npm run test" },
    { pretest: "npm run test", test: script("main") },
    { test: "npm run a", prea: "npm run b", a: script("a"), b: "npm run a" },
    { test: "npm run constructor" },
    { test: 42 },
  ]) assert.throws(() => expandCiPlan(pkg(scripts), options));
  for (const value of [null, {}, { scripts: [] }]) assert.throws(() => expandCiPlan(value, options));
  assert.throws(() => expandCiPlan(pkg({ test: script("a") }), { cwd: "relative", nodePath }));
  assert.throws(() => expandCiPlan(pkg({ test: script("a") }), { cwd, nodePath: "node" }));
});

const fakeRunner = (packageJson, results = []) => {
  const calls = [], messages = [];
  return {
    calls, messages,
    run: () => runCiSilent({
      ...options, readPackage: async () => packageJson,
      log: (message) => messages.push(message), error: (message) => messages.push(message),
      spawnImpl: (...args) => {
        const index = calls.length;
        calls.push(args);
        const child = new EventEmitter();
        queueMicrotask(() => {
          const result = results[index] ?? 0;
          if (result instanceof Error) child.emit("error", result);
          else if (typeof result === "string") child.emit("close", null, result);
          else child.emit("close", result, null);
        });
        return child;
      },
    }),
  };
};

test("every runner child is direct Node, invisible, shell-free and inherits logs", async () => {
  const f = fakeRunner(pkg({ pretest: "tsc --noEmit", test: `${script("audit")} && vite build && node --test tests/a.test.mjs` }));
  assert.equal(await f.run(), 0);
  assert.equal(f.calls.length, 4);
  for (const [executable, args, settings] of f.calls) {
    assert.equal(executable, process.execPath);
    assert.ok(Array.isArray(args));
    assert.deepEqual(settings, { cwd, windowsHide: true, shell: false, stdio: "inherit" });
  }
});

test("runner validates the entire expanded plan before starting the first child", async () => {
  const f = fakeRunner(pkg({ pretest: script("safe"), test: "cmd /c unsafe" }));
  await assert.rejects(f.run());
  assert.equal(f.calls.length, 0);
});

test("runner stops on the first nonzero exit, signal or spawn error", async () => {
  const packageJson = pkg({ test: `${script("first")} && ${script("second")} && ${script("third")}` });
  for (const [failure, expected] of [[7, 7], ["SIGTERM", 1], [new Error("ENOENT"), 1]]) {
    const f = fakeRunner(packageJson, [0, failure, 0]);
    assert.equal(await f.run(), expected);
    assert.equal(f.calls.length, 2);
  }
});

test("runner catches synchronous spawn failures and importing it does not execute CI", async () => {
  const code = await runCiSilent({
    ...options, readPackage: async () => pkg({ test: script("audit") }),
    log() {}, error() {}, spawnImpl() { throw new Error("spawn failed"); },
  });
  assert.equal(code, 1);
  const moduleSource = await readFile(new URL("../scripts/run-ci-silent.mjs", import.meta.url), "utf8");
  assert.match(moduleSource, /if \(process\.argv\[1\] && resolve\(process\.argv\[1\]\) === fileURLToPath\(import\.meta\.url\)\)/);
  assert.doesNotMatch(moduleSource, /shell:\s*true|execSync|spawnSync|npm\.cmd|cmd\.exe/);
});
