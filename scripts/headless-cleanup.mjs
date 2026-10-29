import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { win32 } from "node:path";
import { fileURLToPath } from "node:url";

const ownPrefix = /^vivapiatto-(?:cuisine-cdp|release-cdp|cdp)-[A-Za-z0-9_-]+$/;
const cmd = "C:\\Windows\\System32\\cmd.exe";
const wmic = "C:\\Windows\\System32\\wbem\\WMIC.exe";
const wmiCommand = "C:\\Windows\\System32\\wbem\\WMIC.exe path Win32_Process get Name,CommandLine,ProcessId,ParentProcessId /format:csv";
const wmiXmlCommand = "C:\\Windows\\System32\\wbem\\WMIC.exe path Win32_Process get Name,CommandLine,ProcessId,ParentProcessId,CreationDate,SessionId /format:rawxml";
const xmlParserPath = fileURLToPath(new URL("./parse-wmi-xml.py", import.meta.url));
const key = (value) => String(value).replaceAll("/", "\\").replace(/\\+$/, "").toLowerCase();

export const ownedProfilePath = (profile, temporaryRoot) => {
  const fullyQualified = (value) => typeof value === "string" &&
    /^(?:[A-Za-z]:[\\/]|\\\\[^\\/? .]+[\\/][^\\/]+[\\/])/.test(value) && !/^\\\\[?.]\\/.test(value);
  if (!fullyQualified(profile) || !fullyQualified(temporaryRoot)) return null;
  const resolved = win32.resolve(profile);
  // Only the direct mkdtemp child is owned; never accept tmp itself or a nested path.
  if (!ownPrefix.test(win32.basename(resolved)) || key(win32.dirname(resolved)) !== key(win32.resolve(temporaryRoot))) return null;
  return resolved;
};

export const ownsHeadlessChild = (child, profile) => Boolean(
  child && Array.isArray(child.spawnargs) &&
  /(?:^|[\\/])msedge\.exe$/i.test(child.spawnfile || child.spawnargs[0] || "") &&
  child.spawnargs.includes("--headless=new") &&
  child.spawnargs.some((arg) => typeof arg === "string" && arg.startsWith("--user-data-dir=") && key(arg.slice(16)) === key(profile)),
);

export const decodeWindowsOutput = (data) => {
  if (typeof data === "string") return data.replace(/^\uFEFF/, "");
  const bytes = Buffer.from(data || []);
  const unicode = (bytes[0] === 255 && bytes[1] === 254) || bytes.subarray(0, 128).includes(0);
  return bytes.toString(unicode ? "utf16le" : "utf8").replace(/^\uFEFF/, "");
};

export const parseWmiProcesses = (output) => {
  const rows = [];
  let row = [], field = "", quoted = false;
  const text = decodeWindowsOutput(output).replace(/\r\r\n/g, "\r\n");
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); if (row.some((cell) => cell.trim())) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  if (quoted) throw new Error("CSV WMI incompleto");
  row.push(field); if (row.some((cell) => cell.trim())) rows.push(row);
  const header = rows.shift()?.map((cell) => cell.trim().toLowerCase());
  const columns = ["name", "commandline", "processid", "parentprocessid"].map((name) => header?.indexOf(name) ?? -1);
  if (columns.some((index) => index < 0) || !rows.length) throw new Error("Risposta WMI non verificabile");
  return rows.map((cells) => {
    const [name, commandLine, pidText, parentText] = columns.map((index) => cells[index]);
    if (!name || !/^\d+$/.test(pidText || "") || !/^\d+$/.test(parentText || "")) throw new Error("Riga WMI non verificabile");
    return { name, commandLine: commandLine || "", pid: Number(pidText), parentPid: Number(parentText) };
  });
};

const profileInCommand = (commandLine, profile) => {
  const text = key(commandLine);
  const target = key(profile);
  let from = 0;
  while ((from = text.indexOf(target, from)) !== -1) {
    const after = text[from + target.length];
    if (!after || /[\\\s"']/.test(after)) return true;
    from += target.length;
  }
  return false;
};

export const processCreationMicros = (value) => {
  if (typeof value !== "string" || !/^[0-9]{14}\.[0-9]{6}[+-][0-9]{3}$/.test(value)) return null;
  const parts = [value.slice(0, 4), value.slice(4, 6), value.slice(6, 8), value.slice(8, 10), value.slice(10, 12), value.slice(12, 14)].map(Number);
  const [year, month, day, hour, minute, second] = parts;
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const offsetMinutes = Number(value.slice(22)) * (value[21] === "+" ? 1 : -1);
  return BigInt(date.getTime() - offsetMinutes * 60000) * 1000n + BigInt(value.slice(15, 21));
};

/** Diagnostic evidence only: session/parentage cannot prove that IPC or a file
 * handle from an opaque service is unrelated to this profile. Never grants clear.
 */
export const opaqueServiceCrashpadEvidence = (processes, candidate, profile, childPid, {
  observerPid = process.pid, observerName = win32.basename(process.execPath),
} = {}) => {
  const unknown = { compatible: false };
  if (!Array.isArray(processes) || !candidate || candidate.name?.toLowerCase() !== "crashpad_handler.exe" || candidate.commandLine !== "") return unknown;
  const byPid = new Map();
  for (const row of processes) {
    if (!row || typeof row.name !== "string" || typeof row.commandLine !== "string" ||
        !Number.isInteger(row.pid) || byPid.has(row.pid) || profileInCommand(row.commandLine, profile)) return unknown;
    byPid.set(row.pid, row);
  }
  if (byPid.get(candidate.pid) !== candidate) return unknown;
  const observer = byPid.get(observerPid);
  if (!observer || observer.name?.toLowerCase() !== observerName.toLowerCase() ||
      !Number.isInteger(observer.sessionId) || observer.sessionId <= 0 || processCreationMicros(observer.creationDate) === null) return unknown;
  const chain = [candidate];
  while (chain.length < 4) {
    const parent = byPid.get(chain.at(-1).parentPid);
    if (!parent || chain.some((row) => row.pid === parent.pid)) return unknown;
    chain.push(parent);
  }
  if (!/\.exe$/i.test(chain[1].name) || /edge|chrome|chromium|browser|updat|crashpad|services|wininit|node/i.test(chain[1].name) ||
      chain[2].name.toLowerCase() !== "services.exe" || chain[3].name.toLowerCase() !== "wininit.exe") return unknown;
  const times = chain.map((row) => processCreationMicros(row.creationDate));
  if (chain.some((row) => row.pid <= 0 || row.pid === childPid || row.pid === observerPid || row.sessionId !== 0 ||
      /--user-data-dir(?:=|\s)|msedge|microsoftedge|webview|chromium/i.test(row.commandLine)) || times.some((time) => time === null)) return unknown;
  // Reused or ambiguous parent IDs must not even receive a compatible label.
  if (times.slice(1).some((time, index) => time >= times[index]) || times[3] >= processCreationMicros(observer.creationDate)) return unknown;
  return { compatible: true };
};

// Missing command lines / orphan Edge helpers are uncertainty, never absence.
export const edgeProfileUse = (processes, profile, childPid) => {
  if (!Array.isArray(processes) || !processes.length) return { clear: false, reason: "Elenco processi non verificabile" };
  if (processes.some((item) => profileInCommand(item.commandLine, profile))) return { clear: false, reason: "Profilo ancora usato da un processo" };
  const byPid = new Map(processes.map((item) => [item.pid, item]));
  for (const item of processes.filter((entry) => /^(?:msedge.*|microsoftedge.*|crashpad_handler)\.exe$/i.test(entry.name))) {
    if (!item.commandLine.trim()) return { clear: false, reason: "Riga Edge senza CommandLine" };
    if (profileInCommand(item.commandLine, profile)) return { clear: false, reason: "Profilo ancora usato da Edge" };
    const seen = new Set();
    let ancestor = item, otherProfile = false;
    while (ancestor && !seen.has(ancestor.pid)) {
      seen.add(ancestor.pid);
      if (ancestor.pid === childPid || profileInCommand(ancestor.commandLine, profile)) return { clear: false, reason: "Discendente Edge ancora presente" };
      if (/--user-data-dir(?:=|\s)/i.test(ancestor.commandLine)) otherProfile = true;
      ancestor = byPid.get(ancestor.parentPid);
    }
    if (!otherProfile) return { clear: false, reason: "Proprietà di un processo Edge non verificabile" };
  }
  return { clear: true };
};

const deadlinePromise = async (operation, timeoutMs) => {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Scadenza cleanup")), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
};

export const createReadOnlyCommandRunner = ({ spawnImpl = spawn } = {}) =>
  (command, { cwd, unicode = false, raw = false, timeoutMs = 1500 } = {}) => new Promise((resolve, reject) => {
    if (![wmiCommand, wmiXmlCommand, "dir /a:-l /b"].includes(command)) { reject(new Error("Comando readonly non autorizzato")); return; }
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 5000) { reject(new Error("Budget readonly non valido")); return; }
    const wmiArgs = command === wmiXmlCommand
      ? ["path", "Win32_Process", "get", "Name,CommandLine,ProcessId,ParentProcessId,CreationDate,SessionId", "/format:rawxml"]
      : command === wmiCommand
        ? ["path", "Win32_Process", "get", "Name,CommandLine,ProcessId,ParentProcessId", "/format:csv"]
        : null;
    let query, timer, settled = false, closed = false, size = 0;
    const stdout = [], stderr = [];
    const finish = (error, output) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (error) {
        // Only this original readonly command handle, never an arbitrary numeric PID.
        // Close inherited pipes even if WMI stalls, so no stream/timer holds Node open.
        if (!closed && query?.exitCode === null && query?.signalCode === null) {
          try { query.kill(); } catch { /* Uncertain query => retain the profile. */ }
        }
        query?.stdout?.destroy(); query?.stderr?.destroy(); query?.unref();
        reject(error);
      } else resolve(output);
    };
    try {
      // WMIC is the original owned handle: no intermediate cmd process can exit
      // on timeout while leaving the actual WMI query orphaned behind it.
      // Only DIR is a cmd builtin, with a fixed literal and cwd kept out of text.
      query = spawnImpl(wmiArgs ? wmic : cmd, wmiArgs || ["/d", ...(unicode ? ["/u"] : []), "/s", "/c", "dir /a:-l /b"], {
        cwd, ...(wmiArgs ? { windowsHide: true, shell: false } : { windowsHide: true, windowsVerbatimArguments: true, shell: false }),
        stdio: ["ignore", "pipe", "pipe"],
      });
      query.once("error", (error) => finish(error));
      for (const [stream, chunks] of [[query.stdout, stdout], [query.stderr, stderr]]) {
        stream.once("error", (error) => finish(error));
        stream.on("data", (chunk) => {
          if (settled) return;
          size += chunk.length;
          if (size > 4 * 1024 * 1024) finish(new Error("Output readonly troppo grande"));
          else chunks.push(Buffer.from(chunk));
        });
      }
      query.once("close", (code, signal) => {
        closed = true;
        if (code !== 0 || signal || decodeWindowsOutput(Buffer.concat(stderr)).trim()) finish(new Error("Query readonly non verificabile"));
        else finish(null, raw ? Buffer.concat(stdout) : decodeWindowsOutput(Buffer.concat(stdout)));
      });
      timer = setTimeout(() => finish(new Error("Scadenza query readonly")), Math.max(1, timeoutMs));
    } catch (error) { finish(error); }
  });

const runReadOnly = createReadOnlyCommandRunner();

export const bundledPythonPath = (nodeExecutable) => {
  if (typeof nodeExecutable !== "string" ||
      !/^[A-Za-z]:[\\/]/.test(nodeExecutable) ||
      !/[\\/]dependencies[\\/]node[\\/]bin[\\/]node\.exe$/i.test(nodeExecutable)) return null;
  return win32.resolve(win32.dirname(nodeExecutable), "..", "..", "python", "python.exe");
};

const validatedProcessJson = (bytes) => {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(rows) || !rows.length || rows.length > 4096) throw new Error("WMI_XML_UNKNOWN");
  const seen = new Set();
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row) ||
        Object.keys(row).sort().join(",") !== "commandLine,creationDate,name,parentPid,pid,sessionId" ||
        typeof row.name !== "string" || !row.name || row.name.length > 260 || row.name !== row.name.trim() ||
        /[\x00-\x1f\\/:*?"<>|]/.test(row.name) ||
        typeof row.commandLine !== "string" || row.commandLine.length > 32768 || row.commandLine.includes("\0") ||
        !Number.isInteger(row.pid) || row.pid < 0 || row.pid > 4294967295 ||
        !Number.isInteger(row.parentPid) || row.parentPid < 0 || row.parentPid > 4294967295 || seen.has(row.pid) ||
        row.creationDate !== null && processCreationMicros(row.creationDate) === null ||
        row.sessionId !== null && (!Number.isInteger(row.sessionId) || row.sessionId < 0 || row.sessionId > 4294967295)) {
      throw new Error("WMI_XML_UNKNOWN");
    }
    seen.add(row.pid);
  }
  return rows;
};

/** Fixed readonly query + bundled Python parser share one bounded deadline. */
export const createWmiProcessQuery = ({
  nodeExecutable = process.execPath, spawnImpl = spawn, fsImpl = fs, now = Date.now,
  runReadOnlyImpl = createReadOnlyCommandRunner({ spawnImpl }),
} = {}) => async ({ timeoutMs = 5000 } = {}) => {
  try {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("WMI_XML_UNKNOWN");
    const deadline = now() + Math.min(5000, timeoutMs);
    const remaining = () => {
      const value = deadline - now();
      if (value <= 0) throw new Error("WMI_XML_UNKNOWN");
      return value;
    };
    const python = bundledPythonPath(nodeExecutable);
    if (!python) throw new Error("WMI_XML_UNKNOWN");
    await deadlinePromise(async () => {
      for (const file of [python, xmlParserPath]) {
        const stat = await fsImpl.lstat(file);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("WMI_XML_UNKNOWN");
      }
    }, Math.min(2000, remaining()));
    const xml = await deadlinePromise(() => runReadOnlyImpl(wmiXmlCommand, {
      raw: true, timeoutMs: remaining(),
    }), remaining());
    if (!Buffer.isBuffer(xml) || !xml.length || xml.length > 4 * 1024 * 1024) throw new Error("WMI_XML_UNKNOWN");
    remaining();
    return await new Promise((resolve, reject) => {
      let child, timer, settled = false, closed = false, size = 0;
      const chunks = [];
      const finish = (error, rows) => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        if (error) {
          if (!closed && child?.exitCode === null && child?.signalCode === null) {
            try { child.kill(); } catch { /* Own parser handle only; uncertainty retains the profile. */ }
          }
          child?.stdin?.destroy(); child?.stdout?.destroy(); child?.stderr?.destroy(); child?.unref();
          reject(new Error("WMI_XML_UNKNOWN"));
        } else resolve(rows);
      };
      try {
        child = spawnImpl(python, ["-I", "-B", xmlParserPath], {
          windowsHide: true, shell: false, stdio: ["pipe", "pipe", "pipe"],
        });
        child.once("error", () => finish(true));
        for (const stream of [child.stdin, child.stdout, child.stderr]) stream.once("error", () => finish(true));
        child.stdout.on("data", (chunk) => {
          if (settled) return;
          size += chunk.length;
          if (size > 4 * 1024 * 1024) finish(true);
          else chunks.push(Buffer.from(chunk));
        });
        child.stderr.on("data", (chunk) => { if (chunk.length) finish(true); });
        child.once("close", (code, signal) => {
          closed = true;
          if (code !== 0 || signal) { finish(true); return; }
          try {
            const rows = validatedProcessJson(Buffer.concat(chunks));
            remaining();
            finish(null, rows);
          }
          catch { finish(true); }
        });
        timer = setTimeout(() => finish(true), Math.max(1, remaining()));
        child.stdin.end(xml);
      } catch { finish(true); }
    });
  } catch { throw new Error("WMI_XML_UNKNOWN"); }
};

const defaultQueryProcesses = createWmiProcessQuery();
const defaultNonReparseNames = async (directory) => {
  // /a:-l excludes ALL reparse tags, not only Node's symbolic-link types.
  // No path is interpolated into this fixed command; cwd is a spawn option.
  const output = await runReadOnly("dir /a:-l /b", { cwd: directory, unicode: true });
  return output.split(/\r?\n/).filter(Boolean);
};
const identity = (stat) => `${stat.dev}:${stat.ino}:${stat.mode}:${stat.birthtimeMs}`;
const fingerprint = (stat) => `${identity(stat)}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;

/**
 * Factory for deterministic tests; production callers use cleanupHeadlessAudit.
 * Returns a report instead of throwing: retainedProfile always identifies skipped
 * cleanup. No numeric PID termination and no recursive/forced filesystem delete.
 */
export const createHeadlessCleanup = (overrides = {}) => {
  const deps = {
    fs, temporaryRoot: tmpdir, platform: process.platform, now: Date.now,
    queryProcesses: defaultQueryProcesses, nonReparseNames: defaultNonReparseNames,
    warn: (message) => console.warn(message), closeTimeoutMs: 1000, totalTimeoutMs: 30000,
    ...overrides,
  };
  return async ({ child, browser, page, profile }) => {
    const report = { removed: [], retainedProfile: profile, warnings: [], diskBefore: [], diskAfter: [] };
    const warn = (message) => { report.warnings.push(message); try { deps.warn(`[headless-cleanup] ${message}; profilo: ${profile}`); } catch { /* Reporting must not fail an audit. */ } };
    const started = deps.now();
    const withinBudget = () => { if (deps.now() - started > deps.totalTimeoutMs) throw new Error("Budget cleanup esaurito"); };
    const bounded = (operation) => { withinBudget(); return deadlinePromise(operation, Math.max(1, Math.min(2000, deps.totalTimeoutMs - (deps.now() - started)))); };
    const owned = ownedProfilePath(profile, deps.temporaryRoot());
    const childOwned = Boolean(owned && ownsHeadlessChild(child, owned));
    try {
      if (browser && childOwned) {
        try { await deadlinePromise(() => browser.send("Browser.close"), deps.closeTimeoutMs); }
        catch { warn("Chiusura CDP non confermata"); }
      }
    } finally {
      for (const client of new Set([page, browser].filter(Boolean))) {
        try { client.close(); } catch { warn("Chiusura socket non confermata"); }
      }
    }
    try {
      // kill() acts on the original ChildProcess handle only while still live.
      // It does not prove termination of descendants; WMI remains mandatory below.
      if (childOwned && Number.isInteger(child.pid) && child.pid > 0 && child.exitCode === null && child.signalCode === null) child.kill();
      if (!owned || !childOwned || deps.platform !== "win32") throw new Error("Proprietà del profilo/processo non verificata");
      const requireNoEdge = async () => {
        withinBudget();
        const queryBudget = Math.min(5000, deps.totalTimeoutMs - (deps.now() - started));
        if (queryBudget <= 0) throw new Error("Budget cleanup esaurito");
        const processes = await deadlinePromise(() => deps.queryProcesses({ timeoutMs: queryBudget }), queryBudget);
        const proof = edgeProfileUse(processes, owned, child.pid);
        if (!proof.clear) throw new Error(proof.reason);
      };
      await requireNoEdge();
      const rootStat = await bounded(() => deps.fs.lstat(owned));
      report.profileAgeMs = deps.now() - rootStat.birthtimeMs;
      if (!Number.isFinite(report.profileAgeMs) || report.profileAgeMs < -60000) throw new Error("Età del profilo non verificabile");
      if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) throw new Error("Radice profilo non sicura");
      const realRoot = await bounded(() => deps.fs.realpath(owned));
      const realTmp = await bounded(() => deps.fs.realpath(deps.temporaryRoot()));
      if (key(realRoot) !== key(owned) || key(win32.dirname(realRoot)) !== key(realTmp)) throw new Error("Percorso canonico fuori dal tmp verificato");
      const parentNames = await bounded(() => deps.nonReparseNames(win32.dirname(owned)));
      if (!parentNames.some((name) => key(name) === key(win32.basename(owned)))) throw new Error("Radice reparse o attributi non verificabili");
      const entries = [{ path: owned, directory: true, stat: rootStat }];
      for (let cursor = 0; cursor < entries.length; cursor += 1) {
        const entry = entries[cursor];
        if (!entry.directory) continue;
        withinBudget();
        const names = await bounded(() => deps.fs.readdir(entry.path));
        if (!names.length) continue;
        const plainNames = await bounded(() => deps.nonReparseNames(entry.path));
        const plain = new Set(plainNames.map(key));
        if (plain.size !== plainNames.length || names.length !== plainNames.length || names.some((name) => !plain.has(key(name)))) throw new Error("Reparse point o elenco directory incerto");
        for (const name of names) {
          if (!name || name === "." || name === ".." || /[\\/\r\n]/.test(name)) throw new Error("Nome non sicuro nel profilo");
          const path = win32.join(entry.path, name);
          const stat = await bounded(() => deps.fs.lstat(path));
          if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) throw new Error("Link o file speciale nel profilo");
          entries.push({ path, directory: stat.isDirectory(), stat });
          if (entries.length > 3000) throw new Error("Profilo troppo grande per cleanup limitato");
        }
      }
      // Recheck the complete snapshot and process absence immediately before deletes.
      for (const entry of entries) {
        const current = await bounded(() => deps.fs.lstat(entry.path));
        if (current.isSymbolicLink() || fingerprint(current) !== fingerprint(entry.stat) || key(await bounded(() => deps.fs.realpath(entry.path))) !== key(entry.path)) throw new Error("Profilo modificato durante verifica");
      }
      await requireNoEdge();
      const diskSample = async () => {
        const stat = await bounded(() => deps.fs.statfs(win32.parse(owned).root));
        return Number(stat.bavail) * Number(stat.bsize);
      };
      report.diskBefore = [await diskSample(), await diskSample()];
      try {
        for (const entry of entries.toReversed()) {
          withinBudget();
          const current = await bounded(() => deps.fs.lstat(entry.path));
          if (current.isSymbolicLink() || identity(current) !== identity(entry.stat) || key(await bounded(() => deps.fs.realpath(entry.path))) !== key(entry.path)) throw new Error("Identità cambiata prima della rimozione");
          if (entry.directory) await bounded(() => deps.fs.rmdir(entry.path));
          else await bounded(() => deps.fs.unlink(entry.path));
          report.removed.push(entry.path);
        }
        report.retainedProfile = null;
      } finally {
        try { report.diskAfter = [await diskSample(), await diskSample()]; }
        catch { warn("Misura spazio finale non disponibile"); }
      }
    } catch (error) { warn(`Cleanup saltato o parziale: ${error.message || error}`); }
    return report;
  };
};

export const cleanupHeadlessAudit = createHeadlessCleanup();
