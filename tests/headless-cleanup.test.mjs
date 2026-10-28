import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EventEmitter } from "node:events";
import {
  createHeadlessCleanup, createReadOnlyCommandRunner, decodeWindowsOutput, edgeProfileUse,
  ownedProfilePath, ownsHeadlessChild, parseWmiProcesses,
} from "../scripts/headless-cleanup.mjs";

const temporaryRoot = "C:\\Users\\tester\\AppData\\Local\\Temp";
const profile = `${temporaryRoot}\\vivapiatto-cuisine-cdp-a1B2c3`;
const plainProcess = { name: "node.exe", commandLine: "node audit.mjs", pid: 42, parentPid: 1 };
const stat = (directory, ino, extra = {}) => ({
  dev: 1, ino, mode: directory ? 16822 : 33206, birthtimeMs: 10,
  size: directory ? 0 : 12, mtimeMs: 20, ctimeMs: 20,
  isDirectory: () => directory, isFile: () => !directory,
  isSymbolicLink: () => false, ...extra,
});
const fixture = (options = {}) => {
  const calls = [], warnings = [];
  const files = new Map([
    [profile, stat(true, 1)],
    [`${profile}\\Default`, stat(true, 2)],
    [`${profile}\\Default\\Preferences`, stat(false, 3)],
  ]);
  const child = {
    pid: 123, exitCode: null, signalCode: null,
    spawnfile: "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    spawnargs: ["msedge.exe", "--headless=new", `--user-data-dir=${profile}`],
    kill() { calls.push("child.kill"); return true; },
    ...options.child,
  };
  const page = { close() { calls.push("page.close"); } };
  const browser = {
    async send(method) { calls.push(method); },
    close() { calls.push("browser.close"); },
    ...options.browser,
  };
  const fakeFs = {
    async lstat(path) { if (!files.has(path)) throw new Error("ENOENT"); return files.get(path); },
    async realpath(path) { return path; },
    async readdir(path) {
      return [...files.keys()].filter((name) => name.startsWith(`${path}\\`) && !name.slice(path.length + 1).includes("\\")).map((name) => name.slice(path.length + 1));
    },
    async unlink(path) { calls.push(`unlink:${path}`); files.delete(path); },
    async rmdir(path) { calls.push(`rmdir:${path}`); files.delete(path); },
    async statfs() { calls.push("statfs"); return { bavail: 20, bsize: 4096 }; },
    ...options.fs,
  };
  const deps = {
    fs: fakeFs, platform: "win32", temporaryRoot: () => temporaryRoot,
    queryProcesses: async () => { calls.push("query"); return [plainProcess]; },
    nonReparseNames: async (path) => path === temporaryRoot ? [profile.split("\\").at(-1)] : fakeFs.readdir(path),
    warn: (message) => warnings.push(message),
    ...options.deps,
  };
  return {
    child, browser, page, calls, warnings, files, deps,
    cleanup: (args = {}) => createHeadlessCleanup(deps)({ child, browser, page, profile, ...args }),
  };
};

test("owned profile requires an absolute direct tmp child and exact audit prefix", () => {
  assert.equal(ownedProfilePath(profile, temporaryRoot), profile);
  for (const prefix of ["cdp", "release-cdp", "cuisine-cdp"]) {
    assert.ok(ownedProfilePath(`${temporaryRoot}\\vivapiatto-${prefix}-x`, temporaryRoot));
  }
  for (const candidate of [temporaryRoot, "relative\\vivapiatto-cdp-a", `${temporaryRoot}\\unrelated`, `${profile}\\nested`, `${temporaryRoot}\\..\\vivapiatto-cdp-a`, "C:\\vivapiatto-cdp-a", profile.slice(2), `\\\\?\\${profile}`]) {
    assert.equal(ownedProfilePath(candidate, temporaryRoot), null, candidate);
  }
});

test("child ownership is bound to Edge headless and its exact spawn argument", () => {
  const { child } = fixture();
  assert.equal(ownsHeadlessChild(child, profile), true);
  assert.equal(ownsHeadlessChild({ ...child, spawnfile: "unrelated.exe" }, profile), false);
  assert.equal(ownsHeadlessChild({ ...child, spawnargs: ["msedge.exe", `--user-data-dir=${profile}`] }, profile), false);
  assert.equal(ownsHeadlessChild(child, `${profile}-other`), false);
});

test("WMI parser handles UTF16, quoted commas and doubled quotes; rejects uncertainty", () => {
  const csv = '\ufeffNode,CommandLine,Name,ParentProcessId,ProcessId\r\r\nPC,"\"\"C:\\Edge\\msedge.exe\"\" --user-data-dir=\"\"C:\\one,two\"\"",msedge.exe,1,12\r\r\n';
  const rows = parseWmiProcesses(Buffer.from(csv, "utf16le"));
  assert.equal(rows[0].commandLine, '"C:\\Edge\\msedge.exe" --user-data-dir="C:\\one,two"');
  assert.equal(rows[0].pid, 12);
  assert.equal(decodeWindowsOutput(Buffer.from("hello")), "hello");
  for (const invalid of ["", "No Instance(s) Available.", "Name,ProcessId\nmsedge.exe,12", 'Name,CommandLine,ProcessId,ParentProcessId\nmsedge.exe,"unterminated,12,1', "Name,CommandLine,ProcessId,ParentProcessId\nmsedge.exe,cmd,?,1"]) {
    assert.throws(() => parseWmiProcesses(invalid));
  }
});

test("process proof rejects own profile, descendants and unidentifiable Edge helpers", () => {
  const edge = { name: "msedge.exe", commandLine: `msedge.exe --user-data-dir="${profile}"`, pid: 200, parentPid: 1 };
  assert.equal(edgeProfileUse([plainProcess], profile, 123).clear, true);
  assert.equal(edgeProfileUse([], profile, 123).clear, false);
  assert.equal(edgeProfileUse([edge], profile, 123).clear, false);
  assert.equal(edgeProfileUse([{ ...edge, commandLine: `msedge.exe --database=${profile}\\Crashpad` }], profile, 123).clear, false);
  assert.equal(edgeProfileUse([{ ...edge, commandLine: "" }], profile, 123).clear, false);
  assert.equal(edgeProfileUse([{ ...edge, commandLine: "msedge.exe --type=renderer" }], profile, 123).clear, false);
  assert.equal(edgeProfileUse([{ ...edge, commandLine: "msedge.exe --type=renderer", parentPid: 123 }], profile, 123).clear, false);
  const other = { ...edge, commandLine: `msedge.exe --user-data-dir="${profile}-other"` };
  assert.equal(edgeProfileUse([other], profile, 123).clear, true);
  assert.equal(edgeProfileUse([other, { ...edge, pid: 201, parentPid: 200, commandLine: "msedge.exe --type=renderer" }], profile, 123).clear, true);
  assert.equal(edgeProfileUse([{ ...edge, name: "crashpad_handler.exe", commandLine: `crashpad_handler.exe --database=${profile}\\Crashpad` }], profile, 123).clear, false);
});

const fakeCommand = () => {
  const child = new EventEmitter();
  const calls = [];
  Object.assign(child, { exitCode: null, signalCode: null, kill() { calls.push("kill"); }, unref() { calls.push("unref"); } });
  for (const name of ["stdout", "stderr"]) {
    child[name] = new EventEmitter();
    child[name].destroy = () => calls.push(`${name}.destroy`);
  }
  return { child, calls };
};

test("readonly runner uses invisible cmd with fixed command and cwd outside shell text", async () => {
  const f = fakeCommand();
  let received;
  const run = createReadOnlyCommandRunner({ spawnImpl: (...args) => { received = args; return f.child; } });
  const result = run("dir /a:-l /b", { cwd: profile, unicode: true });
  f.child.stdout.emit("data", Buffer.from("Default\r\n", "utf16le"));
  f.child.exitCode = 0;
  f.child.emit("close", 0, null);
  assert.equal(await result, "Default\r\n");
  assert.equal(received[0], "C:\\Windows\\System32\\cmd.exe");
  assert.deepEqual(received[1], ["/d", "/u", "/s", "/c", "dir /a:-l /b"]);
  assert.equal(received[2].windowsHide, true);
  assert.equal(received[2].shell, false);
  assert.equal(received[2].cwd, profile);
  assert.deepEqual(f.calls, []);
  await assert.rejects(run(`dir ${profile}`), /non autorizzato/);
});

test("readonly timeout closes pipes and unrefs its own handle without numeric PID kills", async () => {
  const f = fakeCommand();
  const run = createReadOnlyCommandRunner({ spawnImpl: () => f.child });
  await assert.rejects(run("dir /a:-l /b", { timeoutMs: 5 }), /Scadenza/);
  assert.deepEqual(f.calls, ["kill", "stdout.destroy", "stderr.destroy", "unref"]);
});

test("readonly stderr, nonzero exit, spawn errors and oversized output are uncertain", async () => {
  for (const trigger of [
    (f) => { f.child.stderr.emit("data", Buffer.from("access denied")); f.child.emit("close", 0, null); },
    (f) => { f.child.exitCode = 1; f.child.emit("close", 1, null); },
    (f) => { f.child.emit("error", new Error("ENOENT")); },
    (f) => { f.child.stdout.emit("data", Buffer.alloc(4 * 1024 * 1024 + 1)); },
  ]) {
    const f = fakeCommand();
    const run = createReadOnlyCommandRunner({ spawnImpl: () => f.child });
    const result = run("dir /a:-l /b");
    trigger(f);
    await assert.rejects(result);
    assert.ok(f.calls.includes("stdout.destroy"));
    assert.ok(f.calls.includes("stderr.destroy"));
  }
});

test("safe cleanup closes CDP, only kills its live handle, verifies twice and deletes bottom-up", async () => {
  const f = fixture();
  const report = await f.cleanup();
  assert.deepEqual(f.calls.slice(0, 4), ["Browser.close", "page.close", "browser.close", "child.kill"]);
  assert.equal(f.calls.filter((value) => value === "query").length, 2);
  assert.deepEqual(report.removed, [`${profile}\\Default\\Preferences`, `${profile}\\Default`, profile]);
  assert.equal(report.retainedProfile, null);
  assert.equal(report.diskBefore.length, 2);
  assert.equal(report.diskAfter.length, 2);
  assert.equal(f.calls.filter((value) => value === "statfs").length, 4);
  assert.deepEqual(report.warnings, []);
});

test("exit zero and signal termination never cause a kill of a possibly reused PID", async () => {
  for (const state of [{ exitCode: 0 }, { exitCode: 1 }, { signalCode: "SIGTERM" }, { pid: undefined }]) {
    const f = fixture({ child: state });
    await f.cleanup();
    assert.equal(f.calls.includes("child.kill"), false, JSON.stringify(state));
  }
});

test("Browser.close failure or timeout always closes both sockets and cannot fail an audit", async () => {
  for (const send of [async () => { throw new Error("socket gone"); }, () => new Promise(() => {})]) {
    const f = fixture({ browser: { send }, deps: { closeTimeoutMs: 5 } });
    const report = await f.cleanup();
    assert.equal(f.calls.includes("page.close"), true);
    assert.equal(f.calls.includes("browser.close"), true);
    assert.ok(report.warnings.some((value) => value.includes("Chiusura CDP")));
  }
});

test("a failed handle kill retains profile without escaping finally", async () => {
  const f = fixture({ child: { kill() { throw new Error("ESRCH"); } } });
  const report = await f.cleanup();
  assert.equal(report.retainedProfile, profile);
  assert.deepEqual(report.removed, []);
  assert.ok(f.calls.includes("page.close"));
});

test("unowned child/profile and unsupported platform only close sockets", async () => {
  for (const options of [{ child: { spawnargs: [] } }, { deps: { platform: "linux" } }]) {
    const f = fixture(options);
    const report = await f.cleanup();
    assert.deepEqual(report.removed, []);
    assert.equal(f.calls.includes("query"), false);
    assert.equal(report.retainedProfile, profile);
  }
  const f = fixture();
  await f.cleanup({ profile: temporaryRoot });
  assert.equal(f.calls.includes("child.kill"), false);
  assert.equal(f.calls.includes("Browser.close"), false);
});

test("uncertain WMI and active own Edge retain profile even when child exited zero", async () => {
  for (const queryProcesses of [
    async () => { throw new Error("WMIC unavailable"); },
    async () => [{ name: "msedge.exe", commandLine: `msedge.exe --user-data-dir=${profile}`, pid: 900, parentPid: 1 }],
  ]) {
    const f = fixture({ child: { exitCode: 0 }, deps: { queryProcesses } });
    const report = await f.cleanup();
    assert.equal(report.retainedProfile, profile);
    assert.deepEqual(report.removed, []);
    assert.ok(f.warnings.some((value) => value.includes(profile)));
  }
});

test("process appearing in the final query blocks all deletion", async () => {
  let queries = 0;
  const f = fixture({ deps: { queryProcesses: async () => ++queries === 1 ? [plainProcess] : [{ name: "msedge.exe", commandLine: `msedge.exe --user-data-dir=${profile}`, pid: 901, parentPid: 1 }] } });
  const report = await f.cleanup();
  assert.equal(queries, 2);
  assert.deepEqual(report.removed, []);
});

test("root or nested reparse attributes block cleanup even when lstat is not a symlink", async () => {
  for (const omitAt of [temporaryRoot, profile, `${profile}\\Default`]) {
    const f = fixture();
    const listing = f.deps.nonReparseNames;
    f.deps.nonReparseNames = async (path) => path === omitAt ? [] : listing(path);
    const report = await f.cleanup();
    assert.deepEqual(report.removed, [], omitAt);
    assert.equal(report.retainedProfile, profile);
  }
});

test("symbolic links, canonical redirects and changed snapshots are not deleted", async () => {
  const link = fixture();
  link.files.set(`${profile}\\Default\\Preferences`, stat(false, 3, { isSymbolicLink: () => true }));
  assert.deepEqual((await link.cleanup()).removed, []);
  const redirected = fixture({ fs: { async realpath(path) { return path === profile ? "C:\\outside" : path; } } });
  assert.deepEqual((await redirected.cleanup()).removed, []);
  const changed = fixture();
  const lstat = changed.deps.fs.lstat;
  let reads = 0;
  changed.deps.fs.lstat = async (path) => {
    const value = await lstat(path);
    return path === profile && ++reads > 1 ? { ...value, ctimeMs: 999 } : value;
  };
  assert.deepEqual((await changed.cleanup()).removed, []);
});

test("locked files retain profile without force, retries or changing audit exit status", async () => {
  const f = fixture({ fs: { async unlink() { throw new Error("EBUSY file in use"); } } });
  const beforeExitCode = process.exitCode;
  const report = await f.cleanup();
  assert.deepEqual(report.removed, []);
  assert.equal(report.retainedProfile, profile);
  assert.equal(report.diskBefore.length, 2);
  assert.equal(report.diskAfter.length, 2);
  assert.equal(process.exitCode, beforeExitCode);
});

test("budget exhaustion is conservative and leaves no timer keeping tests alive", async () => {
  let clock = 0;
  const f = fixture({ deps: { now: () => clock += 20, totalTimeoutMs: 10 } });
  const report = await f.cleanup();
  assert.deepEqual(report.removed, []);
  assert.equal(report.retainedProfile, profile);
});

test("production command surface is fixed readonly invisible cmd and no recursive delete", async () => {
  const source = await readFile(new URL("../scripts/headless-cleanup.mjs", import.meta.url), "utf8");
  assert.match(source, /windowsHide: true, windowsVerbatimArguments: true, shell: false/);
  assert.match(source, /dir \/a:-l \/b/);
  assert.match(source, /WMIC\.exe path Win32_Process get Name,CommandLine,ProcessId,ParentProcessId \/format:csv/);
  assert.doesNotMatch(source, /taskkill|powershell|pwsh|recursive\s*:|force\s*:/i);
  assert.match(source, /child\.exitCode === null && child\.signalCode === null\) child\.kill\(\)/);
});

test("all three audit launchers retain clients for shared finally cleanup and bounded startup", async () => {
  for (const name of ["audit-cuisine-plan", "audit-public-mobile", "audit-live-release-update"]) {
    const source = await readFile(new URL(`../scripts/${name}.mjs`, import.meta.url), "utf8");
    assert.match(source, /const connect = connectHeadlessCdp/);
    assert.match(source, /let page;\s*let browser;\s*try \{/);
    assert.match(source, /await waitForHeadlessEndpoint\(\{\s*child, profile, getSpawnError: \(\) => startupError, getDiagnostics: \(\) => browserDiagnostics/);
    assert.match(source, /child\.once\("error"/);
    assert.match(source, /\.slice\(-4000\)/);
    assert.match(source, /windowsHide: true, stdio: \["ignore", "ignore", "pipe"\]/);
    assert.match(source, /await fetchCdpJson\(`http:\/\/127\.0\.0\.1:\$\{port\}\/json\/list`\)/);
    assert.ok(source.indexOf("browser = await connect(browserWebSocketUrl)") < source.indexOf("page = await connect(target.webSocketDebuggerUrl)"));
    assert.match(source, /finally \{\s*const cleanupReport = await cleanupHeadlessAudit\(\{ child, browser, page, profile \}\);/);
    assert.ok(source.includes("[headless-cleanup-report]"));
    assert.doesNotMatch(source, /taskkill|rmSync|spawnSync|new WebSocket/);
  }
});
