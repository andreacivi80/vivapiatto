import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const url = process.argv.find((arg) => arg.startsWith("--url="))?.slice(6) ||
  process.env.VIVAPIATTO_AUDIT_URL || "https://andreacivi80.github.io/vivapiatto/";
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
  let lastWeeklyRotation = [];
  let lastEggMeals = [];
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
    lastWeeklyRotation = await evaluate(`[...document.querySelectorAll('.weekly-frequency > div > span')]
      .map((item) => ({
        label: [...item.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)?.textContent?.trim() || '',
        count: Number(item.querySelector('b')?.textContent || 0),
        status: item.querySelector('small')?.textContent?.trim() || '',
      }))`);
    lastEggMeals = await evaluate(`[...document.querySelectorAll('.week-day')]
      .flatMap((day, dayIndex) => [...day.querySelectorAll('.week-meal-row')]
        .map((row, slot) => ({ day: dayIndex + 1, slot, id: row.dataset.recipeId,
          parts: [...row.querySelectorAll('.week-part-strip span')].map((item) => item.textContent?.trim()) }))
        .filter((meal) => meal.parts.some((name) => /uova|uovo/i.test(name || ''))))`);
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
  const matrixFocus = process.argv.includes("--matrix") || process.env.VIVAPIATTO_MATRIX_FOCUS === "1";
  const matrixFull = process.argv.includes("--matrix-full") || process.env.VIVAPIATTO_MATRIX_AUDIT === "1";
  if (matrixFull || matrixFocus) {
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
    for (const style of matrixFocus ? ["Italiano"] : ["Italiano", "Asiatico"]) {
      await changeSelect(".cuisine-picker select", 0, style);
      for (const context of matrixFocus ? ["Casa"] : ["Lavoro", "Casa", "Mensa"]) {
        await changeSelect(".cuisine-picker select", 1, context);
        for (const target of matrixFocus ? [1400] : [1400, 2000, 2600, 3000]) {
          await changeSelect(".compact-config select", 1, String(target));
          const today = await evaluate(`(() => ({
            plan: document.querySelector('.today-strip b')?.innerText.trim() || '',
            meals: [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim()),
            mealIds: [...document.querySelectorAll('.meal-card')].map((card) => card.dataset.recipeId || ''),
            mealParts: [...document.querySelectorAll('.meal-card')].map((card) =>
              [...card.querySelectorAll('.meal-part')].map((part) => ({
                name: part.querySelector('.part-change')?.textContent?.trim() || '',
                grams: Number(part.querySelector('input')?.value || 0),
                kcal: Number(part.querySelector('.part-nutrients')?.textContent?.match(/(\\d+) kcal/)?.[1] || 0),
              }))),
            mealUnrepresentedExtras: [...document.querySelectorAll('.meal-card')].map((card) =>
              card.querySelectorAll('.part-extras span').length),
            mealKcal: [...document.querySelectorAll('.meal-card')].map((card) => {
              const lines = [...card.querySelectorAll('.meal-body p')];
              return Number(lines.at(-1)?.textContent?.match(/(\\d+) kcal/)?.[1] || 0);
            }),
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          }))()`);
          const week = await readVisibleWeek();
          contextTargetMatrix.push({
            style, context, target, ...today,
            rotation: lastWeeklyRotation,
            eggMeals: lastEggMeals,
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
    if (!matrixFocus) {
      await changeSelect(".cuisine-picker select", 0, "Italiano");
      await changeSelect(".cuisine-picker select", 1, "Casa");
      await changeSelect(".compact-config select", 1, "2000");
    }
  }
  let followUpAfterSwap = null;
  if (process.env.VIVAPIATTO_MATRIX_AUDIT === "1" && !matrixFocus) {
    const before = await evaluate(`(() => ({
      lunchId: document.querySelectorAll('.meal-card')[2]?.dataset.recipeId || '',
    }))()`);
    const opened = await evaluate(`(() => {
      const lunch = document.querySelectorAll('.meal-card')[2];
      const button = [...lunch?.querySelectorAll('button') || []]
        .find((item) => item.textContent?.includes('Cambia piatto'));
      button?.click();
      return Boolean(button);
    })()`);
    if (!opened) throw new Error("Cambio pranzo non disponibile");
    await wait(500);
    const chosenId = await evaluate(`(() => {
      const card = [...document.querySelectorAll('.recipe-grid article[data-recipe-id]')]
        .find((item) => item.dataset.recipeId !== ${JSON.stringify(before.lunchId)});
      card?.click();
      return card?.dataset.recipeId || '';
    })()`);
    if (!chosenId) throw new Error("Alternativa pranzo non disponibile");
    await wait(700);
    const lunchIdAfter = await evaluate(`document.querySelectorAll('.meal-card')[2]?.dataset.recipeId || ''`);
    const week = await readVisibleWeek();
    await evaluate(`([...document.querySelectorAll('button')]
      .find((item) => item.textContent?.includes('Settimana')))?.click()`);
    await wait(400);
    const tomorrow = await evaluate(`(() => {
      const rows = [...document.querySelectorAll('.week-day')[1]?.querySelectorAll('.week-meal-row') || []];
      return rows.map((row) => ({
        id: row.dataset.recipeId || '',
        kcal: Number(row.querySelector('em')?.textContent?.match(/(\\d+) kcal/)?.[1] || 0),
      }));
    })()`);
    followUpAfterSwap = {
      chosenId, lunchIdAfter, tomorrow,
      tomorrowKcal: tomorrow.reduce((total, meal) => total + meal.kcal, 0),
      mainMeals: week.length,
    };
  }
  let completeMealProjection = null;
  if (process.env.VIVAPIATTO_MATRIX_AUDIT === "1" && !matrixFocus) {
    await evaluate(`([...document.querySelectorAll('button')]
      .find((item) => item.textContent?.includes('Oggi')))?.click()`);
    await wait(400);
    const partEdit = await evaluate(`(() => {
      const input = document.querySelectorAll('.meal-card')[0]?.querySelector('.meal-part input[type="number"]');
      if (!input) return null;
      const before = Number(input.value);
      const after = before + 20;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      input._valueTracker?.setValue(String(before));
      setter.call(input, String(after));
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: String(after) }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return { before, after };
    })()`);
    await wait(350);
    const editedGrams = await evaluate(`Number(document.querySelectorAll('.meal-card')[0]?.querySelector('.meal-part input[type="number"]')?.value || 0)`);
    const pickerOpened = await evaluate(`(() => {
      const button = document.querySelectorAll('.meal-card')[0]?.querySelector('.part-change');
      button?.click();
      return Boolean(button);
    })()`);
    if (!pickerOpened) throw new Error("Alternative componenti colazione non disponibili");
    await wait(450);
    const projected = await evaluate(`(() => {
      const button = document.querySelector('.complete-meals .complete-meal-select');
      const kcal = Number(button?.querySelector('b')?.textContent?.match(/(\\d+) kcal/)?.[1] || 0);
      const name = button?.querySelector('span')?.textContent?.trim() || '';
      button?.click();
      return { name, kcal };
    })()`);
    await wait(650);
    const applied = await evaluate(`(() => {
      const card = document.querySelectorAll('.meal-card')[0];
      const lines = [...card?.querySelectorAll('.meal-body p') || []];
      return {
        name: card?.querySelector('h3')?.textContent?.trim() || '',
        kcal: Number(lines.at(-1)?.textContent?.match(/(\\d+) kcal/)?.[1] || 0),
      };
    })()`);
    completeMealProjection = { partEdit, editedGrams, projected, applied };
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
    followUpAfterSwap,
    completeMealProjection,
  };
  const rotationOnly = process.argv.includes("--rotation-only");
  console.log(JSON.stringify(rotationOnly
    ? {
        profiles: contextTargetMatrix.length,
        asianDocumentedCount: report.asianDocumentedCount,
        paneerDishesProposed: report.paneerDishesProposed,
        japaneseEggDishesProposed: report.japaneseEggDishesProposed,
        newLegumeDishesProposed: report.newLegumeDishesProposed,
        outOfRange: contextTargetMatrix.flatMap(({ style, context, target, rotation }) =>
          rotation.filter(({ status }) => status.startsWith("Da riequilibrare"))
            .map(({ label, count, status }) => ({ style, context, target, label, count, status }))),
        sample: contextTargetMatrix
          .filter(({ style, context, target }) =>
            (style === "Italiano" && context === "Lavoro" && [2000, 2600].includes(target)) ||
            (style === "Asiatico" && context === "Casa" && target === 2000))
          .map(({ style, context, target, rotation, eggMeals }) => ({ style, context, target, rotation, eggMeals })),
      }
    : matrixFull || matrixFocus
      ? { contextTargetMatrix, followUpAfterSwap, completeMealProjection, asianDocumentedCount: report.asianDocumentedCount }
      : report));
  if (matrixFull && !matrixFocus) {
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
        row.rotation.some(({ status }) => status.startsWith("Da riequilibrare")) ||
        row.meals.length !== 5 || !planKcal || Math.abs(planKcal - row.target) > 300 ||
        row.mealParts.some((parts, index) => parts.length > 0 && !row.mealUnrepresentedExtras[index] &&
          Math.abs(parts.reduce((total, part) => total + part.kcal, 0) - row.mealKcal[index]) > 10) ||
        (row.context === "Mensa" &&
          (row.weekdayLunches.length !== 5 || row.weekdayLunches.some((id) => !mensaIds.has(id))));
    });
    const followUpInvalid = process.env.VIVAPIATTO_MATRIX_AUDIT === "1" && (
      !followUpAfterSwap || followUpAfterSwap.chosenId !== followUpAfterSwap.lunchIdAfter ||
      followUpAfterSwap.tomorrow.length !== 5 || followUpAfterSwap.mainMeals !== 14 ||
      Math.abs(followUpAfterSwap.tomorrowKcal - 2000) > 350 ||
      !completeMealProjection?.partEdit ||
      completeMealProjection.editedGrams !== completeMealProjection.partEdit.after ||
      !completeMealProjection?.projected.kcal ||
      completeMealProjection.projected.kcal !== completeMealProjection.applied.kcal
    );
    if (contextTargetMatrix.length !== 24 || invalid.length || followUpInvalid) {
      console.error(`Matrice contesto/target non coerente: ${JSON.stringify({ invalid, completeMealProjection })}`);
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
