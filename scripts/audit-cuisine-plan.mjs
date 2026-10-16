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
  const readVisibleWeek = async () => {
    const weekOpened = await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')]
        .find((item) => item.textContent?.includes('Settimana'));
      button?.click();
      return Boolean(button);
    })()`);
    if (!weekOpened) throw new Error("Vista Settimana non disponibile");
    await wait(500);
    const mainMeals = await evaluate(`[...document.querySelectorAll('.week-day')]
      .flatMap((day, dayIndex) => [...day.querySelectorAll('.week-meal-row')]
        .filter((_, slot) => slot === 2 || slot === 4)
        .map((row, index) => [
          dayIndex + '-' + (index === 0 ? 2 : 4),
          row.dataset.recipeId,
          row.dataset.cuisine,
          row.dataset.workFriendly,
        ]))`);
    await evaluate(`(() => {
      [...document.querySelectorAll('button')]
        .find((item) => item.textContent?.includes('Oggi'))?.click();
    })()`);
    await wait(300);
    return mainMeals;
  };
  const initialItalian = await readVisibleWeek();
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
    const mainMeals = await readVisibleWeek();
    return { style, mainMeals };
  };
  const asian = await setStyle("Asiatico");
  const italian = await setStyle("Italiano");
  const contextTargetMatrix = [];
  if (process.env.VIVAPIATTO_MATRIX_AUDIT === "1") {
    const changeSelect = async (selector, index, value) => {
      const changed = await evaluate(`(() => {
        const select = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
        if (!select) return false;
        select.value = ${JSON.stringify(value)};
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return select.value === ${JSON.stringify(value)};
      })()`);
      if (!changed) throw new Error(`Selettore ${selector}[${index}] non disponibile: ${value}`);
      await wait(550);
    };
    for (const style of ["Italiano", "Asiatico"]) {
      await changeSelect(".cuisine-picker select", 0, style);
      for (const context of ["Lavoro", "Casa", "Mensa"]) {
        await changeSelect(".cuisine-picker select", 1, context);
        for (const target of [1400, 2000, 2600, 3000]) {
          await changeSelect(".compact-config select", 1, String(target));
          const today = await evaluate(`(() => ({
            plan: document.querySelector('.today-strip b')?.innerText.trim() || '',
            meals: [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim()),
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          }))()`);
          const week = await readVisibleWeek();
          contextTargetMatrix.push({
            style, context, target, ...today,
            weekdayLunches: week.filter(([key]) => key.endsWith("-2") && Number(key.split("-")[0]) < 5)
              .map(([, id]) => id),
            mainMealCount: week.length,
            distinctMainMeals: new Set(week.map(([, id]) => id)).size,
            weekendLunches: week.filter(([key]) => key.endsWith("-2") && Number(key.split("-")[0]) >= 5)
              .map(([, id]) => id),
          });
        }
      }
    }
  }
  const documented = new Set([
    "asian-oyakodon-authentic", "asian-bibimbap-authentic", "asian-negima-nabe-authentic",
    "asian-japchae-authentic", "asian-phat-thai-authentic", "catalog-verified-bulgogi-rice",
    "catalog-verified-keihan", "catalog-verified-kashiwa-meshi",
    "asian-kadhai-paneer-rice", "asian-hariyali-paneer-rice", "asian-baked-paneer-tikka-rice",
    "asian-tamagoyaki-rice-vegetables", "asian-green-vegetable-egg-chahan",
    "asian-dondoroke-tofu-rice", "asian-chana-masala-brown-rice",
  ]);
  const paneerDishes = new Set([
    "asian-kadhai-paneer-rice", "asian-hariyali-paneer-rice", "asian-baked-paneer-tikka-rice",
  ]);
  const report = {
    initialItalian,
    italian,
    asian,
    asianDocumentedCount: asian.mainMeals.filter(([, id]) => documented.has(id)).length,
    paneerDishesProposed: asian.mainMeals.filter(([, id]) => paneerDishes.has(id)).length,
    japaneseEggDishesProposed: asian.mainMeals.filter(([, id]) =>
      id === "asian-tamagoyaki-rice-vegetables" || id === "asian-green-vegetable-egg-chahan").length,
    newLegumeDishesProposed: asian.mainMeals.filter(([, id]) =>
      id === "asian-dondoroke-tofu-rice" || id === "asian-chana-masala-brown-rice").length,
    asianDistinct: new Set(asian.mainMeals.map(([, id]) => id)).size,
    unsafeWorkLunches: asian.mainMeals.filter(([key, id]) => key.endsWith("-2") && id === "sweet-ricotta"),
    contextTargetMatrix,
  };
  console.log(JSON.stringify(process.env.VIVAPIATTO_MATRIX_AUDIT === "1"
    ? { contextTargetMatrix, asianDocumentedCount: report.asianDocumentedCount }
    : report));
  if (process.env.VIVAPIATTO_MATRIX_AUDIT === "1") {
    const mensaIds = new Set([
      "simple-pasta-white", "simple-pasta-tomato", "simple-eggs",
      "simple-steak-potatoes", "everyday-pasta-e-fagioli",
      "matrix-d02-orata-al-cartoccio-con-verdure-e-pane",
      "matrix-d15-branzino-al-vapore-con-orzo-e-bietole",
      "matrix-d17-trota-al-forno-con-zucca-e-patate",
      "matrix-d31-zuppa-di-fagioli-borlotti-e-orzo",
      "matrix-d32-frittata-al-forno-con-broccoli-e-patate",
      "matrix-d41-sole-potatoes-fennel", "matrix-d42-chicken-brown-rice-peppers",
      "matrix-p09-barley-cannellini-black-kale",
      "matrix-p56-farro-con-ceci-barbabietole-e-finocchi",
      "catalog-main-1", "catalog-main-16", "catalog-main-50",
    ]);
    const invalid = contextTargetMatrix.filter((row) => {
      const planKcal = Number(row.plan.match(/piano (\d+)/)?.[1] || 0);
      return row.mainMealCount !== 14 || row.distinctMainMeals < 12 || row.horizontalOverflow ||
        row.meals.length !== 5 || !planKcal || Math.abs(planKcal - row.target) > 300 ||
        (row.context === "Mensa" &&
          (row.weekdayLunches.length !== 5 || row.weekdayLunches.some((id) => !mensaIds.has(id))));
    });
    if (contextTargetMatrix.length !== 24 || invalid.length) {
      console.error(`Matrice contesto/target non coerente: ${JSON.stringify(invalid)}`);
      process.exitCode = 1;
    }
  }
  const italianCuisine = ([, , cuisine]) => cuisine === "Italiano" || cuisine === "Mediterraneo";
  const practicalWorkLunch = ([key, , , workFriendly]) =>
    !key.endsWith("-2") || Number(key.split("-")[0]) >= 5 || workFriendly === "true";
  if (
    initialItalian.length !== 14 || !initialItalian.every(italianCuisine) ||
    !initialItalian.every(practicalWorkLunch) ||
    italian.mainMeals.length !== 14 || !italian.mainMeals.every(italianCuisine) ||
    !italian.mainMeals.every(practicalWorkLunch) ||
    asian.mainMeals.length !== 14 || asian.style !== "Asiatico" ||
    report.paneerDishesProposed !== 3 ||
    report.japaneseEggDishesProposed !== 2 ||
    report.newLegumeDishesProposed !== 2 ||
    !asian.mainMeals.every(([, , cuisine]) => cuisine === "Asiatico") ||
    !asian.mainMeals.every(practicalWorkLunch) ||
    report.unsafeWorkLunches.length
  ) process.exitCode = 1;
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
