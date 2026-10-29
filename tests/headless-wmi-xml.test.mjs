import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { bundledPythonPath, createHeadlessCleanup, createReadOnlyCommandRunner, createWmiProcessQuery, edgeProfileUse, opaqueServiceCrashpadEvidence, processCreationMicros } from "../scripts/headless-cleanup.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Production uses bundled Python only. Linux CI fixtures use its installed
// Python explicitly; no production PATH fallback is introduced by this test.
const python = process.platform === "win32"
  ? resolve(dirname(process.execPath), "..", "..", "python", "python.exe")
  : "/usr/bin/python3";
const parserPath = resolve(root, "scripts", "parse-wmi-xml.py");
const contextKeys = ["NAMESPACE", "ROLE", "IMPLEVEL", "AUTHLEVEL", "LOCALE", "PRIVILEGES", "TRACE", "RECORD", "INTERACTIVE", "FAILFAST", "OUTPUT", "APPEND", "USER", "AGGREGATE"];
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;").replaceAll("\r", "&#13;").replaceAll("\n", "&#10;").replaceAll("\t", "&#9;");
const creationDate = "20000102000000.000000+000";
const record = ({ commandLine = '"C:\\Apps\\msedge.exe" --flags=one,two', name = "msedge.exe", parentPid = 10, pid = 20, creationDate: created = creationDate, sessionId = 1 } = {}) => {
  const property = (name, type, value) => `<PROPERTY NAME="${name}" TYPE="${type}"${value === null ? ' PROPAGATED="true"' : ""}>${value === null ? "" : `<VALUE>${escape(value)}</VALUE>`}</PROPERTY>`;
  return `<INSTANCE CLASSNAME="Win32_Process">${property("CommandLine", "string", commandLine)}${property("CreationDate", "datetime", created)}${property("Name", "string", name)}${property("ParentProcessId", "uint32", parentPid)}${property("ProcessId", "uint32", pid)}${property("SessionId", "uint32", sessionId)}</INSTANCE>`;
};
const fixture = (records = [record()]) =>
  `<COMMAND EVERYCOUNT="1" ISSUEDFROM="LOCAL" SEQUENCENUM="1" STARTTIME="20000101000000.000000+000"><REQUEST><COMMANDLINE>fixed readonly query</COMMANDLINE><COMMANDLINECOMPONENTS><NODELIST><NODE>LOCAL</NODE></NODELIST></COMMANDLINECOMPONENTS><CONTEXT>${contextKeys.map((name) => `<${name}/>`).join("")}</CONTEXT></REQUEST><RESULTS NODE="LOCAL"><CIM>${records.join("")}</CIM></RESULTS></COMMAND>`;

const invoke = async (input, extraArgs = [], driver = null) => {
  await access(python);
  return new Promise((resolveResult, reject) => {
    const args = driver ? ["-I", "-B", "-c", driver, parserPath] : ["-I", "-B", parserPath, ...extraArgs];
    const child = spawn(python, args, {
      cwd: root, windowsHide: true, shell: false, stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [], stderr = [];
    let settled = false, size = 0;
    const finish = (error, code) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (error) {
        // Readonly parser tests never terminate any process, even on timeout.
        child.stdin.destroy(); child.stdout.destroy(); child.stderr.destroy(); child.unref();
        reject(error);
      } else resolveResult({ code, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") });
    };
    const timer = setTimeout(() => finish(new Error("Parser test timeout")), 5000);
    child.once("error", finish);
    child.stdin.on("error", () => { /* Oversized input may be rejected before all bytes are consumed. */ });
    for (const [stream, chunks] of [[child.stdout, stdout], [child.stderr, stderr]]) stream.on("data", (chunk) => {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) finish(new Error("Parser test output budget"));
      else chunks.push(chunk);
    });
    child.once("close", (code, signal) => signal ? finish(new Error("Parser ended by signal")) : finish(null, code));
    child.stdin.end(Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8"));
  });
};
const accepted = async (input) => {
  const result = await invoke(input);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
};
const batch = async (inputs) => {
  const driver = `import base64,json,runpy,sys
parser=runpy.run_path(sys.argv[1])["parse_wmi_xml"]
results=[]
for encoded in json.load(sys.stdin):
 try:
  results.append({"code":0,"records":parser(base64.b64decode(encoded,validate=True))})
 except Exception:
  results.append({"code":2})
sys.stdout.write(json.dumps(results,ensure_ascii=True,separators=(",",":")))
`;
  const encoded = inputs.map((input) => (Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8")).toString("base64"));
  const result = await invoke(JSON.stringify(encoded), [], driver);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
};
const unknownBatch = async (inputs) => {
  const results = await batch(inputs);
  assert.equal(results.length, inputs.length);
  for (const [index, result] of results.entries()) assert.deepEqual(result, { code: 2 }, `Unsafe fixture ${index} accepted`);
};

test("WMIC XML preserves Windows quotes, commas, equals and multiline command values", async () => {
  const commandLine = '"C:\\Apps\\msedge.exe" --flags=one,two --value=a=b\r\nName=not-a-record\nProcessId=999';
  const rows = await accepted(fixture([record({ commandLine })]));
  assert.deepEqual(rows, [{ name: "msedge.exe", commandLine, pid: 20, parentPid: 10, creationDate, sessionId: 1 }]);
});

test("WMIC XML handles Unicode UTF8 and UTF16 without corrupting profile paths", async () => {
  const commandLine = '"C:\\Apps\\msedge.exe" --user-data-dir="C:\\Temp\\città-日本"';
  const xml = fixture([record({ commandLine, name: "app-città.exe" })]);
  const declared16 = `<?xml version="1.0" encoding="utf-16"?>${xml}`;
  const variants = [
    Buffer.from(xml), Buffer.from(`<?xml version="1.0" encoding="utf-8"?>${xml}`),
    Buffer.concat([Buffer.from([255, 254]), Buffer.from(xml, "utf16le")]), Buffer.from(xml, "utf16le"),
    Buffer.concat([Buffer.from([255, 254]), Buffer.from(declared16, "utf16le")]),
    Buffer.concat([Buffer.from([254, 255]), Buffer.from(declared16, "utf16le").swap16()]),
    Buffer.from(xml, "utf16le").swap16(),
  ];
  for (const result of await batch(variants)) {
    assert.equal(result.code, 0);
    const rows = result.records;
    assert.equal(rows[0].commandLine, commandLine);
    assert.equal(rows[0].name, "app-città.exe");
  }
});

test("WMIC XML accepts null inaccessible command lines but retains every process", async () => {
  const rows = await accepted(fixture([record({ commandLine: null, name: "System Idle Process", pid: 0, parentPid: 0 }), record()]));
  assert.equal(rows.length, 2);
  assert.equal(rows[0].commandLine, "");
  assert.equal(rows[0].pid, 0);
});

test("WMIC XML requires the six-field schema and keeps unavailable identity metadata unknown", async () => {
  const rows = await accepted(fixture([record({ commandLine: null, creationDate: null, sessionId: null })]));
  assert.equal(rows[0].creationDate, null);
  assert.equal(rows[0].sessionId, null);
  await unknownBatch([
    fixture().replace(/<PROPERTY NAME="CreationDate"[\s\S]*?<\/PROPERTY>/, ""),
    fixture().replace(/<PROPERTY NAME="SessionId"[\s\S]*?<\/PROPERTY>/, ""),
    fixture().replace('NAME="CreationDate" TYPE="datetime"', 'NAME="CreationDate" TYPE="string"'),
    fixture().replace('NAME="SessionId" TYPE="uint32"', 'NAME="SessionId" TYPE="string"'),
    fixture().replace('NAME="SessionId"', 'NAME="ProcessId"'),
    fixture([record({ creationDate: "20000230000000.000000+000" })]),
    fixture([record({ creationDate: "20000101000000.******+000" })]),
    fixture([record({ creationDate: "" })]),
    fixture([record({ sessionId: -1 })]), fixture([record({ sessionId: 4294967296 })]),
  ]);
});

test("WMIC XML rejects DTD, ENTITY, processing instructions and CDATA before expansion", async () => {
  await unknownBatch([
    `<!DOCTYPE COMMAND [<!ENTITY x "unsafe">]>${fixture()}`,
    `<!ENTITY x SYSTEM "file:///never-read">${fixture()}`,
    `<?unexpected unsafe?>${fixture()}`,
    fixture().replace("fixed readonly query", "<![CDATA[unsafe]]>"),
  ]);
});

test("WMIC XML declaration filtering also protects UTF16 and malformed encodings", async () => {
  const dtd = `<!DOCTYPE COMMAND [<!ENTITY x "unsafe">]>${fixture()}`;
  await unknownBatch([
    Buffer.concat([Buffer.from([255, 254]), Buffer.from(dtd, "utf16le")]),
    Buffer.concat([Buffer.from([255, 254]), Buffer.from(fixture(), "utf16le"), Buffer.from([0])]),
    Buffer.from([255, 0, 60, 0]), `<?xml version="1.0" encoding="utf-7"?>${fixture()}`,
  ]);
});

test("WMIC XML rejects duplicate PID, property names and unknown properties without skipping records", async () => {
  await unknownBatch([
    fixture([record(), record()]), fixture().replace('NAME="Name"', 'NAME="CommandLine"'),
    fixture().replace('NAME="Name"', 'NAME="Unknown"'),
    fixture().replace("</INSTANCE>", '<PROPERTY NAME="Extra" TYPE="string"><VALUE>unsafe</VALUE></PROPERTY></INSTANCE>'),
  ]);
});

test("WMIC XML requires every expected key, ordered properties, class and primitive type", async () => {
  await unknownBatch([
    fixture().replace(/<PROPERTY NAME="Name"[\s\S]*?<\/PROPERTY>/, ""),
    fixture().replace('CLASSNAME="Win32_Process"', 'CLASSNAME="Other_Class"'),
    fixture().replace('NAME="ProcessId" TYPE="uint32"', 'NAME="ProcessId" TYPE="string"'),
    fixture().replace('NAME="ProcessId"', 'NAME="ParentProcessId"'),
    fixture().replace('PROPAGATED="true"', 'PROPAGATED="unknown"').replace('TYPE="string">', 'TYPE="string" PROPAGATED="unknown">'),
  ]);
});

test("WMIC XML rejects unknown/nested wrappers and data outside expected value elements", async () => {
  await unknownBatch([
    fixture().replace("<CIM>", "<CIM><UNKNOWN/>"),
    fixture().replace("<CIM>", "<CIM>unexpected"),
    fixture().replace("</REQUEST>", `${record({ pid: 30 })}</REQUEST>`),
    fixture().replace("<VALUE>msedge.exe</VALUE>", "<VALUE><VALUE>msedge.exe</VALUE></VALUE>"),
    fixture().replace('RESULTS NODE="LOCAL"', 'RESULTS NODE="REMOTE"'),
    fixture().replace("</COMMAND>", "<UNKNOWN/></COMMAND>"),
    fixture() + "trailing-unsafe",
  ]);
});

test("WMIC XML rejects invalid/missing PID or names and empty process inventories", async () => {
  await unknownBatch([
    ...[{ pid: -1 }, { pid: "+20" }, { pid: "20 " }, { pid: 4294967296 }, { parentPid: "NaN" }, { name: "" }, { name: "C:\\hidden.exe" }].map((values) => fixture([record(values)])),
    fixture([]), "", "No Instance(s) Available.",
  ]);
});

test("WMIC XML enforces input, command-value and tree-depth budgets", async () => {
  await unknownBatch([
    Buffer.alloc(4 * 1024 * 1024 + 1, 65), fixture([record({ commandLine: "a".repeat(32769) })]),
    "<a>".repeat(10) + "</a>".repeat(10),
    fixture(Array.from({ length: 4097 }, (_, index) => record({ pid: index, parentPid: 0 }))),
    `<root>${"<item/>".repeat(50001)}</root>`,
  ]);
});

test("WMIC parser refuses JSON expansion beyond its output budget before writing any record", async () => {
  const xml = fixture(Array.from({ length: 100 }, (_, index) => record({ pid: index, commandLine: "日".repeat(10000) })));
  assert.ok(Buffer.byteLength(xml, "utf8") < 4 * 1024 * 1024);
  const result = await invoke(xml);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "WMI_XML_UNKNOWN\n");
});

test("WMIC parser CLI is readonly and does not echo fixture data on failure", async () => {
  const result = await invoke(fixture().replace("<CIM>", "<CIM>PRIVATE_FIXTURE_MARKER"));
  assert.equal(result.code, 2);
  assert.equal(result.stdout, "");
  assert.doesNotMatch(result.stderr, /PRIVATE_FIXTURE_MARKER|Traceback/);
  const extra = await invoke(fixture(), ["unexpected-file.xml"]);
  assert.equal(extra.code, 2);
  const source = await readFile(parserPath, "utf8");
  assert.doesNotMatch(source, /import subprocess|import os|open\(|unlink|rmdir|kill\(/);
  assert.match(source, /if __name__ == "__main__"/);
});

const fakeNode = "C:\\Runtime\\dependencies\\node\\bin\\node.exe";
const cleanRows = [{ name: "node.exe", commandLine: "node audit.mjs", pid: 42, parentPid: 1, creationDate, sessionId: 1 }];
const queryFixture = (settings = {}) => {
  const calls = { query: [], spawn: [], writes: [], cleanup: [] };
  const fileStat = { isFile: () => true, isSymbolicLink: () => false };
  const query = createWmiProcessQuery({
    nodeExecutable: fakeNode,
    fsImpl: { lstat: async () => fileStat },
    runReadOnlyImpl: async (...args) => { calls.query.push(args); return Buffer.from("<anonymous-xml/>"); },
    spawnImpl: (...args) => {
      const index = calls.spawn.length;
      calls.spawn.push(args);
      const response = typeof settings.response === "function" ? settings.response(index) : settings.response || {};
      if (response.spawnThrow) throw new Error("PRIVATE_SPAWN_MESSAGE");
      const child = new EventEmitter();
      Object.assign(child, {
        exitCode: null, signalCode: null,
        kill() { calls.cleanup.push("kill-original-parser-handle"); },
        unref() { calls.cleanup.push("unref"); },
      });
      for (const name of ["stdin", "stdout", "stderr"]) {
        child[name] = new EventEmitter();
        child[name].destroy = () => calls.cleanup.push(`${name}.destroy`);
      }
      child.stdin.end = (xml) => {
        calls.writes.push(xml);
        if (response.hang) return;
        queueMicrotask(() => {
          if (response.spawnError) { child.emit("error", new Error("PRIVATE_SPAWN_MESSAGE")); return; }
          if (response.stderr) child.stderr.emit("data", Buffer.from(response.stderr));
          if (response.stdout !== null) child.stdout.emit("data", Buffer.isBuffer(response.stdout) ? response.stdout : Buffer.from(response.stdout ?? JSON.stringify(cleanRows)));
          child.exitCode = response.code ?? 0;
          child.signalCode = response.signal ?? null;
          response.beforeClose?.();
          child.emit("close", child.exitCode, child.signalCode);
        });
      };
      return child;
    },
    ...settings.overrides,
  });
  return { query, calls };
};
const queryUnknown = async (fixtureValue, options) => {
  await assert.rejects(fixtureValue.query(options), (error) => error.message === "WMI_XML_UNKNOWN");
};

test("WMI integration discovers only the Python bundled beside its own Node runtime", () => {
  assert.equal(bundledPythonPath(fakeNode), "C:\\Runtime\\dependencies\\python\\python.exe");
  for (const node of ["node", "C:\\Program Files\\nodejs\\node.exe", "C:\\Runtime\\node\\bin\\node.exe", "/usr/bin/node", null]) {
    assert.equal(bundledPythonPath(node), null);
  }
});

test("WMI integration sends fixed rawxml bytes to direct hidden isolated Python with bounded output", async () => {
  const f = queryFixture();
  assert.deepEqual(await f.query(), cleanRows);
  assert.match(f.calls.query[0][0], /WMIC\.exe path Win32_Process get Name,CommandLine,ProcessId,ParentProcessId,CreationDate,SessionId \/format:rawxml$/);
  assert.equal(f.calls.query[0][1].raw, true);
  assert.ok(f.calls.query[0][1].timeoutMs > 0 && f.calls.query[0][1].timeoutMs <= 5000);
  const [executable, args, options] = f.calls.spawn[0];
  assert.equal(executable, bundledPythonPath(fakeNode));
  assert.deepEqual(args, ["-I", "-B", parserPath]);
  assert.deepEqual(options, { windowsHide: true, shell: false, stdio: ["pipe", "pipe", "pipe"] });
  assert.ok(Buffer.isBuffer(f.calls.writes[0]));
  assert.deepEqual(f.calls.cleanup, []);
});

test("readonly query runner preserves binary rawxml for the Python decoder", async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
  let captured;
  const run = createReadOnlyCommandRunner({ spawnImpl: (...args) => { captured = args; return child; } });
  const command = "C:\\Windows\\System32\\wbem\\WMIC.exe path Win32_Process get Name,CommandLine,ProcessId,ParentProcessId,CreationDate,SessionId /format:rawxml";
  const pending = run(command, { raw: true });
  const xml = Buffer.concat([Buffer.from([255, 254]), Buffer.from("<COMMAND/>", "utf16le")]);
  child.stdout.emit("data", xml); child.emit("close", 0, null);
  assert.deepEqual(await pending, xml);
  assert.equal(captured[2].windowsHide, true);
  assert.equal(captured[2].shell, false);
});

const readonlyXmlCommand = "C:\\Windows\\System32\\wbem\\WMIC.exe path Win32_Process get Name,CommandLine,ProcessId,ParentProcessId,CreationDate,SessionId /format:rawxml";
const readonlyCsvCommand = "C:\\Windows\\System32\\wbem\\WMIC.exe path Win32_Process get Name,CommandLine,ProcessId,ParentProcessId /format:csv";
const readonlyChildFixture = () => {
  const child = new EventEmitter();
  const calls = [];
  Object.assign(child, { exitCode: null, signalCode: null, kill(...args) { calls.push(["kill-own-handle", ...args]); }, unref() { calls.push(["unref"]); } });
  for (const stream of ["stdout", "stderr"]) {
    child[stream] = new EventEmitter();
    child[stream].destroy = () => calls.push([`${stream}.destroy`]);
  }
  return { child, calls };
};

test("fixed WMI queries spawn WMIC directly with fixed argv and no intermediate shell", async () => {
  for (const [command, columns, format] of [
    [readonlyXmlCommand, "Name,CommandLine,ProcessId,ParentProcessId,CreationDate,SessionId", "/format:rawxml"],
    [readonlyCsvCommand, "Name,CommandLine,ProcessId,ParentProcessId", "/format:csv"],
  ]) {
    const f = readonlyChildFixture();
    let received;
    const run = createReadOnlyCommandRunner({ spawnImpl: (...args) => { received = args; return f.child; } });
    const pending = run(command, { unicode: true, raw: true, timeoutMs: 5000 });
    f.child.stdout.emit("data", Buffer.from("anonymous"));
    f.child.exitCode = 0;
    f.child.emit("close", 0, null);
    assert.deepEqual(await pending, Buffer.from("anonymous"));
    assert.equal(received[0], "C:\\Windows\\System32\\wbem\\WMIC.exe");
    assert.deepEqual(received[1], ["path", "Win32_Process", "get", columns, format]);
    assert.deepEqual(received[2], { cwd: undefined, windowsHide: true, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    assert.deepEqual(f.calls, []);
  }
});

test("only fixed DIR stays a hidden cmd builtin and cwd never enters command text", async () => {
  const f = readonlyChildFixture();
  let received;
  const run = createReadOnlyCommandRunner({ spawnImpl: (...args) => { received = args; return f.child; } });
  const cwd = "C:\\Temp\\directory & anonymous";
  const pending = run("dir /a:-l /b", { cwd, unicode: true });
  f.child.stdout.emit("data", Buffer.from("Default\r\n", "utf16le"));
  f.child.exitCode = 0;
  f.child.emit("close", 0, null);
  assert.equal(await pending, "Default\r\n");
  assert.equal(received[0], "C:\\Windows\\System32\\cmd.exe");
  assert.deepEqual(received[1], ["/d", "/u", "/s", "/c", "dir /a:-l /b"]);
  assert.deepEqual(received[2], { cwd, windowsHide: true, windowsVerbatimArguments: true, shell: false, stdio: ["ignore", "pipe", "pipe"] });
});

test("WMIC timeout closes pipes and only its original live handle, ignoring late events", async () => {
  const f = readonlyChildFixture();
  const run = createReadOnlyCommandRunner({ spawnImpl: () => f.child });
  await assert.rejects(run(readonlyXmlCommand, { timeoutMs: 5 }), /Scadenza/);
  assert.deepEqual(f.calls, [["kill-own-handle"], ["stdout.destroy"], ["stderr.destroy"], ["unref"]]);
  f.child.stdout.emit("data", Buffer.from("late"));
  f.child.stderr.emit("data", Buffer.from("late"));
  f.child.emit("error", new Error("late spawn error"));
  f.child.exitCode = 0;
  f.child.emit("close", 0, null);
  assert.equal(f.calls.filter(([name]) => name === "kill-own-handle").length, 1);
});

test("WMIC error and close paths never kill a closed or signalled handle", async () => {
  for (const state of [{ exitCode: 0 }, { exitCode: 1 }, { signalCode: "SIGTERM" }]) {
    const f = readonlyChildFixture();
    Object.assign(f.child, state);
    const run = createReadOnlyCommandRunner({ spawnImpl: () => f.child });
    const pending = run(readonlyXmlCommand, { timeoutMs: 5 });
    await assert.rejects(pending, /Scadenza/);
    assert.equal(f.calls.some(([name]) => name === "kill-own-handle"), false);
    assert.deepEqual(f.calls, [["stdout.destroy"], ["stderr.destroy"], ["unref"]]);
  }
  for (const event of [
    (f) => { f.child.stderr.emit("data", Buffer.from("denied")); f.child.emit("close", 0, null); },
    (f) => f.child.emit("close", 1, null),
    (f) => f.child.emit("close", 0, "SIGTERM"),
  ]) {
    const f = readonlyChildFixture();
    const run = createReadOnlyCommandRunner({ spawnImpl: () => f.child });
    const pending = run(readonlyXmlCommand);
    event(f);
    await assert.rejects(pending, /non verificabile/);
    assert.equal(f.calls.some(([name]) => name === "kill-own-handle"), false, "A delivered close event owns the truth even if handle state is unavailable");
  }
});

test("WMIC spawn/pipe/output errors are bounded and cannot expand the command surface", async () => {
  let spawns = 0;
  const rejectRun = createReadOnlyCommandRunner({ spawnImpl: () => { spawns += 1; throw new Error("spawn failed"); } });
  await assert.rejects(rejectRun(readonlyXmlCommand), /spawn failed/);
  assert.equal(spawns, 1);
  for (const command of [readonlyXmlCommand + " & anything", readonlyXmlCommand.replace("Win32_Process", "Other_Class"), "WMIC.exe", "dir /b", "arbitrary.exe"]) {
    await assert.rejects(rejectRun(command), /non autorizzato/);
  }
  for (const timeoutMs of [0, -1, NaN, Infinity, 5001]) await assert.rejects(rejectRun(readonlyXmlCommand, { timeoutMs }), /Budget/);
  assert.equal(spawns, 1);
  for (const trigger of [
    (f) => f.child.emit("error", new Error("spawn event")),
    (f) => f.child.stdout.emit("error", new Error("pipe event")),
    (f) => f.child.stdout.emit("data", Buffer.alloc(4 * 1024 * 1024 + 1)),
  ]) {
    const f = readonlyChildFixture();
    const run = createReadOnlyCommandRunner({ spawnImpl: () => f.child });
    const pending = run(readonlyXmlCommand);
    trigger(f);
    await assert.rejects(pending);
    assert.deepEqual(f.calls, [["kill-own-handle"], ["stdout.destroy"], ["stderr.destroy"], ["unref"]]);
  }
});

test("WMI integration returns unknown without querying when bundled Python/parser is absent or linked", async () => {
  for (const overrides of [
    { nodeExecutable: "C:\\Program Files\\nodejs\\node.exe" },
    { fsImpl: { lstat: async () => { throw new Error("PRIVATE_FILE_PATH"); } } },
    { fsImpl: { lstat: async () => ({ isFile: () => true, isSymbolicLink: () => true }) } },
  ]) {
    const f = queryFixture({ overrides });
    await queryUnknown(f);
    assert.equal(f.calls.query.length, 0);
    assert.equal(f.calls.spawn.length, 0);
  }
});

test("WMI query and parser use one shared deadline rather than two fresh five-second budgets", async () => {
  let clock = 0;
  const f = queryFixture({ response: { hang: true }, overrides: {
    now: () => clock,
    runReadOnlyImpl: async () => { clock = 4985; return Buffer.from("<xml/>"); },
  } });
  const start = Date.now();
  await queryUnknown(f, { timeoutMs: 5000 });
  assert.ok(Date.now() - start < 500, "Parser incorrectly received a fresh five-second budget");
  assert.ok(f.calls.cleanup.includes("kill-original-parser-handle"));
  assert.ok(f.calls.cleanup.includes("stdin.destroy"));
  assert.ok(f.calls.cleanup.includes("stdout.destroy"));
  assert.ok(f.calls.cleanup.includes("stderr.destroy"));
  const exhausted = queryFixture({ overrides: {
    now: () => clock,
    runReadOnlyImpl: async () => { clock += 5000; return Buffer.from("<xml/>"); },
  } });
  await queryUnknown(exhausted);
  assert.equal(exhausted.calls.spawn.length, 0);
});

test("WMI integration never accepts a parser response delivered after the shared deadline", async () => {
  let clock = 0;
  const f = queryFixture({
    response: { beforeClose: () => { clock = 5001; } },
    overrides: { now: () => clock },
  });
  await queryUnknown(f);
  assert.equal(f.calls.spawn.length, 1);
  assert.equal(f.calls.cleanup.includes("kill-original-parser-handle"), false, "Never kill a parser whose close event was delivered");
});

test("WMI integration fails closed on query timeout/nonbinary data and parser spawn/exit/stderr errors", async () => {
  const timeout = queryFixture({ overrides: { runReadOnlyImpl: () => new Promise(() => {}) } });
  await queryUnknown(timeout, { timeoutMs: 5 });
  assert.equal(timeout.calls.spawn.length, 0);
  for (const overrides of [
    { runReadOnlyImpl: async () => { throw new Error("PRIVATE_QUERY_OUTPUT"); } },
    { runReadOnlyImpl: async () => "decoded XML is not binary" },
    { runReadOnlyImpl: async () => Buffer.alloc(0) },
    { runReadOnlyImpl: async () => Buffer.alloc(4 * 1024 * 1024 + 1) },
  ]) await queryUnknown(queryFixture({ overrides }));
  for (const response of [
    { spawnThrow: true }, { spawnError: true }, { code: 2 }, { signal: "SIGTERM" },
    { stderr: "PRIVATE_PROCESS_COMMANDLINE" }, { stdout: null },
  ]) await queryUnknown(queryFixture({ response }));
});

test("WMI integration rejects malformed/oversized JSON, duplicate PIDs and malformed records", async () => {
  const invalid = [
    "not-json", "[]", "{}", JSON.stringify([cleanRows[0], cleanRows[0]]),
    JSON.stringify([{ ...cleanRows[0], pid: "42" }]),
    JSON.stringify([{ ...cleanRows[0], pid: 4294967296 }]),
    JSON.stringify([{ ...cleanRows[0], parentPid: -1 }]),
    JSON.stringify([{ ...cleanRows[0], commandLine: null }]),
    JSON.stringify([{ ...cleanRows[0], commandLine: "contains\0nul" }]),
    JSON.stringify([{ ...cleanRows[0], name: "C:\\hidden.exe" }]),
    JSON.stringify([{ ...cleanRows[0], extra: "unexpected" }]),
    JSON.stringify([{ name: "node.exe", commandLine: "node audit.mjs", pid: 42, parentPid: 1 }]),
    JSON.stringify([{ ...cleanRows[0], creationDate: "20000230000000.000000+000" }]),
    JSON.stringify([{ ...cleanRows[0], creationDate: undefined }]),
    JSON.stringify([{ ...cleanRows[0], sessionId: -1 }]),
    JSON.stringify([{ ...cleanRows[0], sessionId: "0" }]),
    JSON.stringify([{ ...cleanRows[0], sessionId: undefined }]),
    Buffer.from([255, 255]), Buffer.alloc(4 * 1024 * 1024 + 1, 65),
  ];
  for (const stdout of invalid) await queryUnknown(queryFixture({ response: { stdout } }));
});

const cleanupWithQuery = (queryProcesses, extra = {}) => {
  const profile = "C:\\Temp\\vivapiatto-cdp-anonymous";
  const removed = [], budgets = [];
  const directoryStat = {
    dev: 1, ino: 1, mode: 16822, birthtimeMs: Date.now() - 1000, size: 0, mtimeMs: 10, ctimeMs: 10,
    isSymbolicLink: () => false, isDirectory: () => true, isFile: () => false,
  };
  const child = { pid: 123, exitCode: 0, signalCode: null, spawnfile: "C:\\Edge\\msedge.exe", spawnargs: ["msedge.exe", "--headless=new", `--user-data-dir=${profile}`] };
  const cleanup = createHeadlessCleanup({
    platform: "win32", temporaryRoot: () => "C:\\Temp", warn() {},
    queryProcesses: async (options) => { budgets.push(options.timeoutMs); return queryProcesses(options, profile); },
    fs: {
      lstat: async () => directoryStat, realpath: async (path) => path, readdir: async () => [],
      statfs: async () => ({ bavail: 20, bsize: 4096 }),
      rmdir: async (path) => removed.push(path), unlink: async () => { throw new Error("Unexpected unlink"); },
    },
    nonReparseNames: async () => ["vivapiatto-cdp-anonymous"], ...extra,
  });
  return { run: (args = {}) => cleanup({ child, profile, ...args }), removed, budgets, profile };
};

test("both independent WMI XML snapshots must succeed before mock profile cleanup", async () => {
  const f = queryFixture();
  const c = cleanupWithQuery((options) => f.query(options));
  const report = await c.run();
  assert.equal(f.calls.query.length, 2);
  assert.equal(f.calls.spawn.length, 2);
  assert.equal(c.budgets.length, 2);
  assert.ok(c.budgets.every((value) => value > 2000 && value <= 5000));
  assert.deepEqual(c.removed, [c.profile]);
  assert.equal(report.retainedProfile, null);
});

test("failed second XML snapshot or renewed Edge use retains the mock profile", async () => {
  for (const second of ["invalid-json", JSON.stringify([{ ...cleanRows[0], name: "msedge.exe", commandLine: "msedge.exe --user-data-dir=C:\\Temp\\vivapiatto-cdp-anonymous", pid: 200, parentPid: 1 }])]) {
    const f = queryFixture({ response: (index) => ({ stdout: index === 0 ? JSON.stringify(cleanRows) : second }) });
    const c = cleanupWithQuery((options) => f.query(options));
    const report = await c.run();
    assert.equal(f.calls.query.length, 2);
    assert.equal(report.retainedProfile, c.profile);
    assert.deepEqual(c.removed, []);
  }
});

test("ownership still blocks every query and query timeout respects remaining cleanup budget", async () => {
  const f = queryFixture();
  const unowned = cleanupWithQuery((options) => f.query(options));
  const report = await unowned.run({ child: { spawnargs: [] } });
  assert.equal(report.retainedProfile, unowned.profile);
  assert.equal(f.calls.query.length, 0);
  assert.deepEqual(unowned.removed, []);
  const bounded = cleanupWithQuery(async () => cleanRows, { totalTimeoutMs: 2500 });
  await bounded.run();
  assert.ok(bounded.budgets.length === 2 && bounded.budgets.every((value) => value > 0 && value <= 2500));
  const source = await readFile(new URL("../scripts/headless-cleanup.mjs", import.meta.url), "utf8");
  assert.match(source, /totalTimeoutMs: 30000/);
  assert.match(source, /Math\.min\(2000, deps\.totalTimeoutMs/);
});

const anonymousServiceSnapshot = () => [
  { name: "crashpad_handler.exe", commandLine: "", pid: 130, parentPid: 120, creationDate: "20000104000000.000000+000", sessionId: 0 },
  { name: "genericThirdPartyService.exe", commandLine: '"C:\\Service\\genericThirdPartyService.exe"', pid: 120, parentPid: 110, creationDate: "20000103000000.000000+000", sessionId: 0 },
  { name: "services.exe", commandLine: "services.exe", pid: 110, parentPid: 100, creationDate: "20000102000000.000000+000", sessionId: 0 },
  { name: "wininit.exe", commandLine: "wininit.exe", pid: 100, parentPid: 1, creationDate: "20000101000000.000000+000", sessionId: 0 },
  { name: "node.exe", commandLine: "node audit.mjs", pid: 500, parentPid: 400, creationDate: "20000105000000.000000+000", sessionId: 1 },
];
const serviceEvidence = (rows, childPid = 900) => opaqueServiceCrashpadEvidence(
  rows, rows[0], "C:\\Temp\\vivapiatto-cdp-anonymous", childPid, { observerPid: 500, observerName: "node.exe" },
);

test("DMTF process identity comparison normalizes timezone and preserves microseconds", () => {
  assert.equal(processCreationMicros("20000101010000.000001+060"), processCreationMicros("20000101000000.000001+000"));
  assert.equal(processCreationMicros("19991231230000.000001-060"), processCreationMicros("20000101000000.000001+000"));
  assert.equal(processCreationMicros("20000101000000.000002+000") - processCreationMicros("20000101000000.000001+000"), 1n);
  for (const value of [null, undefined, "", "20000230000000.000000+000", "20000101240000.000000+000", "20000101000000.******+000", "00000101000000.000000+000"]) {
    assert.equal(processCreationMicros(value), null);
  }
});

test("a compatible service genealogy remains diagnostic only, never evidence of profile absence", () => {
  const rows = anonymousServiceSnapshot();
  assert.deepEqual(serviceEvidence(rows), { compatible: true });
  // Session separation cannot rule out IPC or cross-session file handles.
  assert.equal(edgeProfileUse(rows, "C:\\Temp\\vivapiatto-cdp-anonymous", 900).clear, false);
});

test("service diagnostics reject absent metadata, reused parents, own handles and ambiguous genealogy", () => {
  const changes = [
    (rows) => rows.splice(1, 1),
    (rows) => { rows[1].creationDate = null; },
    (rows) => { rows[1].sessionId = null; },
    (rows) => { rows[1].creationDate = "20000106000000.000000+000"; },
    (rows) => { rows[1].creationDate = rows[0].creationDate; },
    (rows) => { rows[2].parentPid = rows[0].pid; },
    (rows) => { rows[0].parentPid = 900; },
    (rows) => { rows[1].sessionId = 1; },
    (rows) => { rows[4].sessionId = 0; },
    (rows) => { rows[4].creationDate = null; },
    (rows) => { rows[4].name = "other.exe"; },
    (rows) => { rows[1].name = "browserUpdater.exe"; },
    (rows) => { rows[1].commandLine += " --type=msedge-helper"; },
    (rows) => { rows.push({ ...rows[4] }); },
    (rows) => { rows[0].name = "msedge.exe"; },
    (rows) => { rows[0].name = "msedgewebview2.exe"; },
    (rows) => { rows[0].commandLine = " "; },
    (rows) => { rows[0].creationDate = undefined; },
  ];
  for (const change of changes) {
    const rows = anonymousServiceSnapshot();
    change(rows);
    assert.deepEqual(serviceEvidence(rows), { compatible: false });
    assert.equal(edgeProfileUse(rows, "C:\\Temp\\vivapiatto-cdp-anonymous", 900).clear, false);
  }
  for (const childPid of [100, 110, 120, 130]) assert.deepEqual(serviceEvidence(anonymousServiceSnapshot(), childPid), { compatible: false });
});

test("any process referencing the profile blocks service diagnostics before genealogy checks", () => {
  const rows = anonymousServiceSnapshot();
  rows.push({ name: "genericOther.exe", commandLine: "genericOther --database=C:\\Temp\\vivapiatto-cdp-anonymous\\Crashpad", pid: 600, parentPid: 1, creationDate, sessionId: 2 });
  assert.deepEqual(serviceEvidence(rows), { compatible: false });
  assert.equal(edgeProfileUse(rows, "C:\\Temp\\vivapiatto-cdp-anonymous", 900).clear, false);
});

test("a missing or legacy four-field observer never establishes compatible service metadata", () => {
  const rows = anonymousServiceSnapshot();
  rows.pop();
  assert.deepEqual(serviceEvidence(rows), { compatible: false });
  const legacy = anonymousServiceSnapshot().map(({ name, commandLine, pid, parentPid }) => ({ name, commandLine, pid, parentPid }));
  assert.deepEqual(serviceEvidence(legacy), { compatible: false });
  assert.equal(edgeProfileUse(legacy, "C:\\Temp\\vivapiatto-cdp-anonymous", 900).clear, false);
});
