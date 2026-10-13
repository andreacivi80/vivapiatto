import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fromVersion = process.env.VIVAPIATTO_FROM_VERSION;
const toVersion = process.env.VIVAPIATTO_TO_VERSION;
const baseUrl = "https://andreacivi80.github.io/vivapiatto/";
if (!fromVersion || !toVersion) throw new Error("Impostare VIVAPIATTO_FROM_VERSION e VIVAPIATTO_TO_VERSION");

const edge = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
if (!edge) throw new Error("Microsoft Edge non trovato");

const profile = mkdtempSync(join(tmpdir(), "vivapiatto-release-cdp-"));
const child = spawn(edge, [
  "--headless=new",
  "--disable-gpu",
  "--disable-extensions",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-debugging-port=0",
  "--window-size=390,844",
  `--user-data-dir=${profile}`,
  `${baseUrl}?release-audit=${Date.now()}`,
], { windowsHide: true, stdio: "ignore" });

const connect = async (url) => {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  const events = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const handlers = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) handlers.reject(new Error(message.error.message));
      else handlers.resolve(message.result);
    } else events.push(message);
  });
  return {
    events,
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); },
  };
};

let browser;
try {
  let port;
  let browserPath;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const lines = readFileSync(join(profile, "DevToolsActivePort"), "utf8").trim().split(/\r?\n/);
      port = Number(lines[0]);
      browserPath = lines[1];
      break;
    } catch {
      await wait(100);
    }
  }
  if (!port || !browserPath) throw new Error("Edge headless non disponibile");
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const target = targets.find((item) => item.type === "page");
  if (!target) throw new Error("Pagina headless non trovata");
  const page = await connect(target.webSocketDebuggerUrl);
  browser = await connect(`ws://127.0.0.1:${port}${browserPath}`);
  await Promise.all([page.send("Page.enable"), page.send("Runtime.enable"), page.send("Log.enable")]);
  const evaluate = async (expression) => {
    const result = await page.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };

  await wait(6_000);
  const initialMeal = await evaluate(`(() => {
    const input = document.querySelector('.meal-part input[type="number"]');
    if (!input) return { ready: false };
    const before = Number(input.value);
    const expected = before + 9;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    input.focus();
    input._valueTracker?.setValue(String(before));
    setter.call(input, String(expected));
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: String(expected) }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.blur();
    return {
      ready: document.body.innerText.includes(${JSON.stringify(`v${fromVersion}`)}),
      before,
      expected,
      label: input.getAttribute('aria-label'),
      menu: [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim()),
    };
  })()`);
  if (!initialMeal.ready || !initialMeal.expected) throw new Error("Versione iniziale o stato di prova non disponibile");
  await wait(750);
  const openedLibrary = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.innerText.trim() === 'Ricette');
    button?.click();
    return Boolean(button);
  })()`);
  if (!openedLibrary) throw new Error("Navigazione Ricette non disponibile");
  await wait(2_000);
  const initialView = await evaluate(`(() => {
    window.scrollTo(0, Math.min(900, Math.max(0, document.documentElement.scrollHeight - window.innerHeight)));
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve({
      scrollY: Math.round(window.scrollY),
      libraryVisible: document.body.innerText.includes('Le tue 214'),
    }))));
  })()`);
  const initial = { ...initialMeal, ...initialView };
  if (!initial.libraryVisible || initial.scrollY <= 0) throw new Error(`Vista lunga di prova non disponibile: ${JSON.stringify(initial)}`);
  await wait(7_000);

  let finalState = null;
  let releaseNavigation = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await wait(5_000);
    try {
      finalState = await evaluate(`(() => ({
        versionUpdated: document.body.innerText.includes(${JSON.stringify(`v${toVersion}`)}),
        scrollY: Math.round(window.scrollY),
        libraryVisible: document.body.innerText.includes('Le tue 214'),
        recovery: document.body.innerText.includes('La pagina ha incontrato un errore'),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }))()`);
      releaseNavigation = page.events.some((event) =>
        event.method === 'Page.frameNavigated' &&
        String(event.params?.frame?.url || '').includes('_release=') &&
        String(event.params?.frame?.url || '').includes(toVersion)
      );
      if (finalState.versionUpdated && releaseNavigation) break;
    } catch {
      // Il contesto JavaScript viene sostituito durante il refresh automatico.
    }
  }

  const restoredScrollY = finalState?.scrollY || 0;
  const openedToday = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.innerText.trim() === 'Oggi');
    button?.click();
    return Boolean(button);
  })()`);
  await wait(1_500);
  const restoredMeal = openedToday ? await evaluate(`(() => {
    const input = [...document.querySelectorAll('.meal-part input[type="number"]')]
      .find((item) => item.getAttribute('aria-label') === ${JSON.stringify(initialMeal.label)});
    return {
      grams: Number(input?.value || 0),
      menu: [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim()),
    };
  })()`) : { grams: 0, menu: [] };

  const report = {
    fromVersion,
    toVersion,
    initial,
    finalState: { ...finalState, releaseNavigation, restoredScrollY, restoredMeal },
    gramsPreserved: restoredMeal.grams === initial.expected,
    menuPreserved: JSON.stringify(restoredMeal.menu) === JSON.stringify(initial.menu),
    scrollPreserved: Math.abs(restoredScrollY - initial.scrollY) <= 20,
    javascriptErrors: page.events.filter((event) =>
      event.method === "Runtime.exceptionThrown" ||
      (event.method === "Log.entryAdded" && event.params?.entry?.level === "error")
    ).length,
  };
  console.log(JSON.stringify(report));
  if (
    !finalState?.versionUpdated || !releaseNavigation || !finalState.libraryVisible || finalState.recovery || finalState.horizontalOverflow ||
    !report.gramsPreserved || !report.menuPreserved || !report.scrollPreserved || report.javascriptErrors
  ) process.exitCode = 1;
  page.close();
  browser.close();
} finally {
  spawnSync("C:/Windows/System32/taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
    windowsHide: true,
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await wait(attempt === 0 ? 1_500 : 1_000);
    try {
      rmSync(profile, { recursive: true, force: true });
      break;
    } catch {
      // Edge può trattenere per pochi secondi un handle del crash reporter.
    }
  }
}
