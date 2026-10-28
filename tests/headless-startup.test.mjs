import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { failedHeadlessExit, parseDevToolsEndpoint, fetchCdpJson, waitForHeadlessEndpoint, connectHeadlessCdp } from "../scripts/headless-startup.mjs";

test("headless launcher exit zero still permits waiting for its debugging endpoint", () => {
  for (const value of [null, undefined, 0]) assert.equal(failedHeadlessExit(value), false);
  for (const value of [1, 2, -1, 3221225477]) assert.equal(failedHeadlessExit(value), true);
});

const portFile = "43123\n/devtools/browser/test-browser\n";
const version = { webSocketDebuggerUrl: "ws://127.0.0.1:43123/devtools/browser/test-browser" };
const versionFetch = async () => ({ ok: true, json: async () => version });
const fixture = (overrides = {}) => {
  let time = 0;
  return { child: { exitCode: 0, signalCode: null }, profile: "test-profile", timeoutMs: 300,
    now: () => time, sleep: async (ms) => { time += ms; },
    readPortFile: async () => portFile, fetcher: versionFetch, ...overrides };
};

test("headless port files must be complete and strictly valid", () => {
  assert.deepEqual(parseDevToolsEndpoint(portFile), { port: 43123, browserPath: "/devtools/browser/test-browser" });
  for (const value of ["43123", "43123\n", "0\n/devtools/browser/a", "65536\n/devtools/browser/a", "2x\n/devtools/browser/a", "1234\nhttp://example.com/"]) {
    assert.equal(parseDevToolsEndpoint(value), null);
  }
});

test("exit zero with a delayed or initially partial port file is allowed", async () => {
  let reads = 0;
  const endpoint = await waitForHeadlessEndpoint(fixture({ readPortFile: async () => ++reads === 1 ? "43123\n" : portFile }));
  assert.equal(reads, 2);
  assert.equal(endpoint.browserWebSocketUrl, version.webSocketDebuggerUrl);
  assert.equal((await waitForHeadlessEndpoint(fixture())).port, 43123);
});

test("endpoint must belong to the same loopback port and browser identity", async () => {
  const wrong = async () => ({ ok: true, json: async () => ({ webSocketDebuggerUrl: "ws://example.com:43123/devtools/browser/test-browser" }) });
  await assert.rejects(waitForHeadlessEndpoint(fixture({ fetcher: wrong })), /non pronto entro 300 ms/);
});

test("exit zero without endpoint times out; nonzero, signal and spawn errors are explicit", async () => {
  const missing = async () => { throw new Error("port file absent"); };
  await assert.rejects(waitForHeadlessEndpoint(fixture({ readPortFile: missing })), /non pronto entro 300 ms/);
  for (const child of [{ exitCode: 2 }, { exitCode: null, signalCode: "SIGTERM" }]) {
    await assert.rejects(waitForHeadlessEndpoint(fixture({ child, readPortFile: missing })), /terminato prima dell'avvio/);
  }
  await assert.rejects(waitForHeadlessEndpoint(fixture({ getSpawnError: () => new Error("spawn denied") })), /spawn denied/);
});

test("CDP HTTP deadline also bounds an uncooperative fetch implementation", async () => {
  let signal;
  const started = Date.now();
  await assert.rejects(fetchCdpJson("http://127.0.0.1/test", { timeoutMs: 10,
    fetcher: async (_, options) => { signal = options.signal; return new Promise(() => {}); } }), /Scadenza/);
  assert.equal(signal.aborted, true);
  assert.ok(Date.now() - started < 1000);
});

class FakeSocket extends EventTarget {
  static latest;
  readyState = 0;
  constructor() {
    super(); FakeSocket.latest = this;
    queueMicrotask(() => { this.readyState = 1; this.dispatchEvent(new Event("open")); });
  }
  send() {}
  close() { this.readyState = 3; this.dispatchEvent(new Event("close")); }
}

test("CDP rejects pending requests on socket closure without leaking timers", async () => {
  const client = await connectHeadlessCdp("ws://test", { WebSocketImpl: FakeSocket, requestTimeoutMs: 5000 });
  const pending = assert.rejects(client.send("Browser.close"), /Connessione CDP chiusa/);
  FakeSocket.latest.close();
  await pending;
});

test("CDP commands and connection opening have deadlines", async () => {
  const client = await connectHeadlessCdp("ws://test", { WebSocketImpl: FakeSocket, requestTimeoutMs: 10 });
  await assert.rejects(client.send("Runtime.evaluate"), /Scadenza comando CDP/);
  client.close();
  class NeverOpens extends EventTarget { readyState = 0; close() { this.dispatchEvent(new Event("close")); } }
  await assert.rejects(connectHeadlessCdp("ws://test", { WebSocketImpl: NeverOpens, connectTimeoutMs: 10 }), /Scadenza apertura CDP/);
});

test("all audits retain silent launch and use the same bounded startup and safe cleanup", async () => {
  for (const file of ["audit-cuisine-plan.mjs", "audit-public-mobile.mjs", "audit-live-release-update.mjs"]) {
    const source = await readFile(new URL(`../scripts/${file}`, import.meta.url), "utf8");
    assert.match(source, /waitForHeadlessEndpoint/);
    assert.match(source, /connectHeadlessCdp/);
    assert.match(source, /cleanupHeadlessAudit/);
    assert.match(source, /windowsHide: true/);
    assert.match(source, /--headless=new/);
    assert.doesNotMatch(source, /taskkill|rmSync\(profile/);
  }
});

test("live release audit writes a local ready handshake only after its initial state is validated", async () => {
  const source = await readFile(new URL("../scripts/audit-live-release-update.mjs", import.meta.url), "utf8");
  assert.ok(source.includes('const readyDirectory = join(process.cwd(), "outputs")'));
  assert.ok(source.includes('${process.pid}.ready.json'));
  assert.ok(source.includes('writeReadiness("starting")'));
  const ready = source.indexOf('writeReadiness("ready", { initial, profile })');
  assert.ok(ready > source.indexOf('if (!initial.libraryVisible || initial.scrollY <= 0)'));
  assert.ok(ready < source.indexOf('console.log(`Transizione reale pronta:'));
  assert.ok(source.includes('writtenAt: new Date().toISOString()'));
});
