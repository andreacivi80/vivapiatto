import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const url = process.env.VIVAPIATTO_AUDIT_URL || "https://andreacivi80.github.io/vivapiatto/";
const edge = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
if (!edge) throw new Error("Microsoft Edge non trovato");

const profile = mkdtempSync(join(tmpdir(), "vivapiatto-cuisine-cdp-"));
const child = spawn(edge, [
  "--headless=new", "--disable-gpu", "--disable-extensions", "--no-first-run",
  "--no-default-browser-check", "--remote-debugging-port=0", "--window-size=390,844",
  `--user-data-dir=${profile}`, `${url}?cuisine-audit=${Date.now()}`,
], { windowsHide: true, stdio: "ignore" });

const connect = async (address) => {
  const socket = new WebSocket(address);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const call = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) call.reject(new Error(message.error.message));
    else call.resolve(message.result);
  });
  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const callId = ++id;
        pending.set(callId, { resolve, reject });
        socket.send(JSON.stringify({ id: callId, method, params }));
      });
    },
    close() { socket.close(); },
  };
};

try {
  let port;
  let browserPath;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const lines = readFileSync(join(profile, "DevToolsActivePort"), "utf8").trim().split(/\r?\n/);
      port = Number(lines[0]);
      browserPath = lines[1];
      break;
    } catch { await wait(100); }
  }
  if (!port || !browserPath) throw new Error("Edge headless non disponibile");
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const target = targets.find((item) => item.type === "page");
  if (!target) throw new Error("Pagina headless non trovata");
  const page = await connect(target.webSocketDebuggerUrl);
  const browser = await connect(`ws://127.0.0.1:${port}${browserPath}`);
  await Promise.all([page.send("Page.enable"), page.send("Runtime.enable")]);
  const evaluate = async (expression) => {
    const result = await page.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    ready = await evaluate(`Boolean(document.querySelector('.cuisine-picker select') && document.querySelectorAll('.meal-card').length >= 5)`);
    if (ready) break;
    await wait(250);
  }
  if (!ready) throw new Error("Piano non caricato");
  const setStyle = async (style) => {
    const changed = await evaluate(`(() => {
      const select = document.querySelector('.cuisine-picker select');
      if (!select) return false;
      select.value = ${JSON.stringify(style)};
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!changed) throw new Error(`Stile ${style} non disponibile`);
    await wait(1500);
    return evaluate(`(() => {
      const data = JSON.parse(localStorage.getItem('vivapiatto-v1') || '{}');
      const selected = Object.entries(data.choices || {})
        .filter(([key]) => /^[0-6]-(2|4)$/.test(key))
        .sort(([a], [b]) => a.localeCompare(b));
      return { style: document.querySelector('.cuisine-picker select')?.value, mainMeals: selected };
    })()`);
  };
  const italian = await setStyle("Italiano");
  const asian = await setStyle("Asiatico");
  const documented = new Set([
    "asian-oyakodon-authentic", "asian-bibimbap-authentic", "asian-negima-nabe-authentic",
    "asian-japchae-authentic", "asian-phat-thai-authentic", "catalog-verified-bulgogi-rice",
    "catalog-verified-keihan", "catalog-verified-kashiwa-meshi",
  ]);
  const report = {
    italian,
    asian,
    asianDocumentedCount: asian.mainMeals.filter(([, id]) => documented.has(id)).length,
    asianDistinct: new Set(asian.mainMeals.map(([, id]) => id)).size,
    unsafeWorkLunches: asian.mainMeals.filter(([key, id]) => key.endsWith("-2") && id === "sweet-ricotta"),
  };
  console.log(JSON.stringify(report));
  if (italian.mainMeals.length < 5 || asian.mainMeals.length !== 14 || asian.style !== "Asiatico" || report.unsafeWorkLunches.length) process.exitCode = 1;
  page.close();
  browser.close();
} finally {
  spawnSync("C:/Windows/System32/taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
    windowsHide: true, stdio: "ignore",
  });
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await wait(attempt === 0 ? 1500 : 1000);
    try { rmSync(profile, { recursive: true, force: true }); break; } catch { /* Edge releases handles late. */ }
  }
}
