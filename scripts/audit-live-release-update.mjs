import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { capturePersistedPlanState } from "./release-audit-state.mjs";
import { connectHeadlessCdp, fetchCdpJson, waitForHeadlessEndpoint } from "./headless-startup.mjs";
import { cleanupHeadlessAudit } from "./headless-cleanup.mjs";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fromVersion = process.argv[2] || process.env.VIVAPIATTO_FROM_VERSION;
const toVersion = process.argv[3] || process.env.VIVAPIATTO_TO_VERSION;
const selfReload = process.argv.includes("--self-reload");
const simulateManifest = process.argv.includes("--simulate-manifest");
const simulateStall = process.argv.includes("--simulate-stall");
const baseUrl = process.argv.find((arg) => arg.startsWith("--url="))?.slice(6) ||
  "https://andreacivi80.github.io/vivapiatto/";
if (!fromVersion || !toVersion) throw new Error("Impostare VIVAPIATTO_FROM_VERSION e VIVAPIATTO_TO_VERSION");
if (![fromVersion, toVersion].every((value) => /^\d+\.\d+\.\d+$/.test(value))) throw new Error("Versioni di prova non valide");
// The background controller buffers short stdout messages. Use a small local
// handshake instead of waiting for its log to fill before deployment.
const readyDirectory = join(process.cwd(), "outputs");
mkdirSync(readyDirectory, { recursive: true });
const readyFile = join(readyDirectory, `live-release-${fromVersion}-to-${toVersion}-${process.pid}.ready.json`);
const writeReadiness = (status, details = {}) => writeFileSync(readyFile,
  `${JSON.stringify({ status, fromVersion, toVersion, pid: process.pid, writtenAt: new Date().toISOString(), ...details })}\n`,
  "utf8");
writeReadiness("starting");

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
], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
let startupError = null;
let browserDiagnostics = "";
child.once("error", (error) => { startupError = error; });
child.stderr.on("data", (chunk) => {
  browserDiagnostics = `${browserDiagnostics}${chunk}`.slice(-4000);
});

const connect = connectHeadlessCdp;

let page;
let browser;
try {
  const { port, browserWebSocketUrl } = await waitForHeadlessEndpoint({
    child, profile, getSpawnError: () => startupError, getDiagnostics: () => browserDiagnostics,
  });
  browser = await connect(browserWebSocketUrl);
  const targets = await fetchCdpJson(`http://127.0.0.1:${port}/json/list`);
  const target = targets.find((item) => item.type === "page");
  if (!target) throw new Error("Pagina headless non trovata");
  page = await connect(target.webSocketDebuggerUrl);
  await Promise.all([page.send("Page.enable"), page.send("Runtime.enable"), page.send("Log.enable")]);
  const evaluate = async (expression) => {
    const result = await page.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };

  await wait(6_000);
  await evaluate(`(() => {
    if (document.querySelector('.meal-part input[type="number"]')) return true;
    const split = [...document.querySelectorAll('.meal-card button')]
      .find((button) => button.textContent?.includes('Dividi in componenti'));
    split?.click();
    return Boolean(split);
  })()`);
  await wait(400);
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
      ready: document.querySelector('.topbar .version')?.textContent?.trim() === ${JSON.stringify(`v${fromVersion}`)},
      before,
      expected,
      label: input.getAttribute('aria-label'),
      menu: [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim()),
    };
  })()`);
  if (!initialMeal.ready || !initialMeal.expected) throw new Error("Versione iniziale o stato di prova non disponibile");
  await wait(750);
  const openedLibrary = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('Ricette'));
    button?.click();
    return Boolean(button);
  })()`);
  if (!openedLibrary) throw new Error("Navigazione Ricette non disponibile");
  await wait(2_000);
  const initialViewReady = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.min(900, Math.max(0, document.documentElement.scrollHeight - window.innerHeight)));
    return {
      libraryVisible: document.body.innerText.includes('Le tue 214'),
    };
  })()`);
  await wait(1_000);
  const initialView = {
    ...initialViewReady,
    scrollY: await evaluate('Math.round(window.scrollY)'),
  };
  const initial = { ...initialMeal, ...initialView };
  if (!initial.libraryVisible || initial.scrollY <= 0) throw new Error(`Vista lunga di prova non disponibile: ${JSON.stringify(initial)}`);
  const stateExpression = `(${capturePersistedPlanState.toString()})(localStorage.getItem('vivapiatto-v1'))`;
  const initialPlanState = await evaluate(stateExpression);
  writeReadiness("ready", { initial, profile, initialPlanState });
  console.log(`Transizione reale pronta: v${fromVersion} aperta nel browser isolato`);
  if (simulateManifest) {
    // Force only the advertised version to be newer while keeping the real
    // entry script. This isolates the app's periodic polling without a dummy
    // deployment. The navigation should happen autonomously within 15 s.
    await evaluate(`(() => {
      const originalFetch = window.fetch.bind(window);
      const script = document.querySelector('script[type="module"][src]')?.getAttribute('src');
      if (!script) throw new Error('Script della release non trovato');
      let manifestRequests = 0;
      window.fetch = (input, init) => {
        if (!String(input).includes('version.json')) return originalFetch(input, init);
        manifestRequests += 1;
        if (${simulateStall} && manifestRequests === 1) {
          return new Promise((resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Simulated stalled CDN request', 'AbortError')), { once: true });
          });
        }
        return Promise.resolve(new Response(JSON.stringify({ version: ${JSON.stringify(toVersion)}, script }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }));
      };
      return true;
    })()`);
  }
  await wait(7_000);
  if (selfReload) {
    // Reproduce the browser navigation independently of a new deployment,
    // so console events can be diagnosed without publishing a dummy release.
    await evaluate(`(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('_release', ${JSON.stringify(`${toVersion}-self-test`)});
      sessionStorage.setItem('vivapiatto-release-target', ${JSON.stringify(toVersion)});
      sessionStorage.setItem('vivapiatto-release-scroll-y', String(window.scrollY));
      window.location.replace(url.toString());
      return true;
    })()`);
  }

  let finalState = null;
  let releaseNavigation = false;
  // Pages deployment can take longer than ten minutes; distinguish a slow
  // publication from a broken refresh in the real browser.
  for (let attempt = 0; attempt < (selfReload || simulateManifest ? 24 : 240); attempt += 1) {
    await wait(5_000);
    try {
      finalState = await evaluate(`(() => ({
        versionUpdated: document.querySelector('.topbar .version')?.textContent?.trim() === ${JSON.stringify(`v${simulateManifest ? fromVersion : toVersion}`)},
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
      if (finalState.versionUpdated && releaseNavigation) {
        // The new bundle can be visible before hydration, image layout and
        // scroll restoration have completed. Give that process a bounded
        // chance to settle, then still fail if the original view is lost.
        for (let settle = 0; settle < 20; settle += 1) {
          if (Math.abs(finalState.scrollY - initial.scrollY) <= 20) break;
          await wait(100);
          finalState = await evaluate(`(() => ({
            versionUpdated: document.querySelector('.topbar .version')?.textContent?.trim() === ${JSON.stringify(`v${simulateManifest ? fromVersion : toVersion}`)},
            scrollY: Math.round(window.scrollY),
            libraryVisible: document.body.innerText.includes('Le tue 214'),
            recovery: document.body.innerText.includes('La pagina ha incontrato un errore'),
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          }))()`);
        }
        break;
      }
    } catch {
      // Il contesto JavaScript viene sostituito durante il refresh automatico.
    }
  }

  const restoredScrollY = finalState?.scrollY || 0;
  const restoredPlanState = await evaluate(stateExpression);
  const openedToday = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('Oggi'));
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

  const browserErrors = page.events.filter((event) =>
    event.method === "Runtime.exceptionThrown" ||
    (event.method === "Log.entryAdded" && event.params?.entry?.level === "error")
  );
  const changedPlanFields = Object.keys(initialPlanState).filter((key) =>
    !isDeepStrictEqual(restoredPlanState[key], initialPlanState[key]));
  const report = {
    fromVersion,
    toVersion,
    initial,
    finalState: { ...finalState, releaseNavigation, restoredScrollY, restoredMeal },
    gramsPreserved: restoredMeal.grams === initial.expected,
    menuPreserved: JSON.stringify(restoredMeal.menu) === JSON.stringify(initial.menu),
    planStatePreserved: isDeepStrictEqual(restoredPlanState, initialPlanState),
    changedPlanFields,
    changedPlanState: Object.fromEntries(changedPlanFields.map((key) => [key, {
      before: initialPlanState[key],
      after: restoredPlanState[key],
    }])),
    scrollPreserved: Math.abs(restoredScrollY - initial.scrollY) <= 20,
    javascriptErrors: browserErrors.length,
    javascriptErrorDetails: browserErrors.map((event) => ({
      kind: event.method,
      text: event.params?.entry?.text || event.params?.exceptionDetails?.exception?.description ||
        event.params?.exceptionDetails?.text || "Errore senza descrizione",
    })).slice(0, 30),
  };
  console.log(JSON.stringify(report));
  if (
    !finalState?.versionUpdated || !releaseNavigation || !finalState.libraryVisible || finalState.recovery || finalState.horizontalOverflow ||
    !report.gramsPreserved || !report.menuPreserved || !report.planStatePreserved || (!simulateManifest && !report.scrollPreserved) || report.javascriptErrors
  ) process.exitCode = 1;
} finally {
  const cleanupReport = await cleanupHeadlessAudit({ child, browser, page, profile });
  console.error(`[headless-cleanup-report] ${JSON.stringify(cleanupReport)}`);
}
