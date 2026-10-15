import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const imageSettleTimeoutMs = 20_000;
const packageFile = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const version = process.env.VIVAPIATTO_AUDIT_VERSION || packageFile.version;
const auditBaseUrl = process.env.VIVAPIATTO_AUDIT_URL || "https://andreacivi80.github.io/vivapiatto/";
const edge = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
if (!edge) throw new Error("Microsoft Edge non trovato");
const profile = mkdtempSync(join(tmpdir(), "vivapiatto-cdp-"));
const child = spawn(edge, [
  "--headless=new",
  "--disable-gpu",
  "--disable-extensions",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-debugging-port=0",
  "--window-size=390,844",
  `--user-data-dir=${profile}`,
  `${auditBaseUrl}${auditBaseUrl.includes("?") ? "&" : "?"}stress=${version.replaceAll(".", "")}`,
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
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else {
      events.push(message);
    }
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
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try {
      const lines = readFileSync(join(profile, "DevToolsActivePort"), "utf8").trim().split(/\r?\n/);
      port = Number(lines[0]);
      browserPath = lines[1];
      break;
    } catch {
      await wait(100);
    }
  }
  if (!port || !browserPath) {
    throw new Error(`Edge headless non disponibile dopo 30 secondi (exitCode: ${child.exitCode ?? "attivo"}, profilo: ${profile})`);
  }
  const expectedHost = new URL(auditBaseUrl).host;
  let target;
  let targets = [];
  for (let attempt = 0; attempt < 100; attempt += 1) {
    targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
    target = targets.find((item) => item.type === "page" && new URL(item.url).host === expectedHost);
    if (target) break;
    await wait(100);
  }
  if (!target) throw new Error(`Pagina headless Tavola Mia non trovata: ${JSON.stringify(targets.map((item) => item.url))}`);
  const page = await connect(target.webSocketDebuggerUrl);
  browser = await connect(`ws://127.0.0.1:${port}${browserPath}`);
  await Promise.all([
    page.send("Page.enable"),
    page.send("Runtime.enable"),
    page.send("Log.enable"),
  ]);
  await wait(5000);
  const evaluate = async (expression) => {
    const result = await page.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const settleViewportImages = async () => {
    // React can replace an image node while the previous node is loading (for
    // example when returning from the full-dish picker). Re-scan the viewport
    // after each wait so the audit observes the images actually on screen.
    for (let pass = 0; pass < 3; pass += 1) {
      await evaluate(`Promise.all(
        [...document.images].filter((image) => {
          const rect = image.getBoundingClientRect();
          return image.offsetParent !== null && rect.bottom > 0 && rect.top < window.innerHeight;
        }).map((image) => {
          image.loading = 'eager';
          return image.complete ? Promise.resolve() : new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
            setTimeout(resolve, ${imageSettleTimeoutMs});
          });
        })
      )`);
      const pending = await evaluate(`[...document.images].filter((image) => {
        const rect = image.getBoundingClientRect();
        return image.offsetParent !== null && rect.bottom > 0 && rect.top < window.innerHeight && !image.complete;
      }).length`);
      if (pending === 0) break;
      await wait(250);
    }
  };
  const snapshot = async () => {
    await settleViewportImages();
    return evaluate(`(() => ({
    version: document.body.innerText.includes(${JSON.stringify(`v${version}`)}),
    recovery: document.body.innerText.includes('La pagina ha incontrato un errore'),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    textLength: document.body.innerText.length,
    scrollY: window.scrollY,
    visibleButtonCount: [...document.querySelectorAll('button')].filter((button) => button.offsetParent !== null).length,
    viewportImages: [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      return image.offsetParent !== null && rect.bottom > 0 && rect.top < window.innerHeight;
    }).length,
    brokenViewportImages: [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      return image.offsetParent !== null && rect.bottom > 0 && rect.top < window.innerHeight &&
        image.complete && image.naturalWidth === 0;
    }).map((image) => image.alt || image.currentSrc || image.src),
    pendingViewportImages: [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      return image.offsetParent !== null && rect.bottom > 0 && rect.top < window.innerHeight && !image.complete;
    }).map((image) => image.alt || image.currentSrc || image.src),
  }))()`);
  };
  const clickTab = async (label) => {
    const clicked = await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.innerText.trim().includes(${JSON.stringify(label)}));
      if (!button) return false;
      button.click();
      return true;
    })()`);
    if (!clicked) {
      const state = await evaluate(`(() => ({
        title: document.title,
        body: document.body.innerText.slice(0, 1200),
        readyState: document.readyState,
        scripts: [...document.scripts].map((script) => script.src),
      }))()`);
      const recentErrors = page.events
        .filter((event) => event.method === "Runtime.exceptionThrown" || event.method === "Log.entryAdded")
        .slice(-5);
      throw new Error(`Scheda ${label} non trovata: ${JSON.stringify({ state, recentErrors })}`);
    }
    await wait(1000);
  };

  let appReady = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    appReady = await evaluate(`document.body.innerText.includes('Settimana') && document.body.innerText.includes(${JSON.stringify(`v${version}`)})`);
    if (appReady) break;
    await wait(400);
  }
  if (!appReady) throw new Error("Tavola Mia non ha completato il caricamento entro 20 secondi");

  const today = await snapshot();
  const scrollStability = await evaluate(`(() => ({
    beforeMenu: [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim()),
    beforeGrams: [...document.querySelectorAll('.meal-card .part-grams input')].map((input) => input.value),
  }))()`);
  for (let pass = 0; pass < 3; pass += 1) {
    await evaluate(`window.scrollTo(0, Math.max(0, document.body.scrollHeight - window.innerHeight))`);
    await wait(250);
    await evaluate(`window.scrollTo(0, 0)`);
    await wait(250);
  }
  Object.assign(scrollStability, await evaluate(`(() => {
    const afterMenu = [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim());
    const afterGrams = [...document.querySelectorAll('.meal-card .part-grams input')].map((input) => input.value);
    return {
      afterMenu,
      afterGrams,
      menuUnchanged: JSON.stringify(afterMenu) === JSON.stringify(${JSON.stringify(scrollStability.beforeMenu)}),
      gramsUnchanged: JSON.stringify(afterGrams) === JSON.stringify(${JSON.stringify(scrollStability.beforeGrams)}),
      returnedTop: window.scrollY === 0,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  })()`));
  await clickTab("Settimana");
  const week = await snapshot();
  const weeklyConfirmation = await evaluate(`(() => {
    const lock = document.querySelector('.week-lock');
    const confirm = [...(lock?.querySelectorAll('button') || [])].find((button) => button.innerText.trim() === 'Conferma');
    confirm?.click();
    return { found: Boolean(lock && confirm) };
  })()`);
  await wait(500);
  Object.assign(weeklyConfirmation, await evaluate(`(() => {
    const lock = document.querySelector('.week-lock');
    const kcalSummary = document.querySelector('.week-kcal-summary');
    const frequency = document.querySelector('.weekly-frequency');
    const print = document.querySelector('.print-preview-trigger');
    const result = {
      locked: lock?.innerText.includes('Settimana confermata'),
      hasAverage: (kcalSummary?.innerText || '').toLowerCase().includes('media') && (kcalSummary?.innerText || '').includes('kcal'),
      calorieDays: kcalSummary?.querySelectorAll(':scope > div > span').length || 0,
      rotationConfirmed: frequency?.innerText.includes('Rotazione confermata'),
      rotationRows: frequency?.querySelectorAll(':scope > div > span').length || 0,
      rotationInRange: [...(frequency?.querySelectorAll(':scope > div > span') || [])].every((row) => row.classList.contains('within-target')),
      hasPrintPreview: Boolean(print),
    };
    print?.click();
    return result;
  })()`));
  await wait(500);
  const weeklyPrintPreview = await evaluate(`(() => {
    const sheet = document.querySelector('.print-preview-sheet');
    const close = sheet?.querySelector('[aria-label="Chiudi anteprima stampa"]');
    const text = sheet?.innerText || '';
    const rect = close?.getBoundingClientRect();
    return {
      found: Boolean(sheet),
      hasUpdatedAverage: text.includes('Media aggiornata'),
      dayCount: sheet?.querySelectorAll('.print-day').length || 0,
      mealCount: sheet?.querySelectorAll('.print-meal').length || 0,
      foodRows: sheet?.querySelectorAll('.print-food-row').length || 0,
      hasAllMacros: ['kcal', 'Proteine', 'Carboidrati', 'Grassi'].every((label) => text.includes(label)),
      hasExports: ['Copia tutto', 'TXT', 'CSV', 'Word', 'Stampa'].every((label) => text.includes(label)),
      closeVisible: Boolean(rect && rect.top >= 0 && rect.bottom <= window.innerHeight),
      horizontalOverflow: Boolean(sheet && sheet.scrollWidth > sheet.clientWidth + 1),
    };
  })()`);
  await evaluate(`document.querySelector('[aria-label="Chiudi anteprima stampa"]')?.click()`);
  await wait(300);
  weeklyPrintPreview.closed = await evaluate(`!document.querySelector('.print-preview-sheet')`);
  await evaluate(`(() => {
    const lock = document.querySelector('.week-lock');
    [...(lock?.querySelectorAll('button') || [])].find((button) => button.innerText.trim() === 'Riapri')?.click();
  })()`);
  await wait(300);
  weeklyConfirmation.reopened = await evaluate(`document.querySelector('.week-lock')?.innerText.includes('Settimana modificabile')`);
  await clickTab("Ricette");
  const recipes = await snapshot();
  const openedRecipe = await evaluate(`(() => {
    const button = document.querySelector('.start-here button');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!openedRecipe) throw new Error("Apertura ricetta consigliata non trovata");
  await wait(500);
  await settleViewportImages();
  const recipeDetail = await evaluate(`(() => {
    const sheet = document.querySelector('.recipe-sheet');
    if (!sheet) return { found: false };
    const image = sheet.querySelector('img');
    const text = sheet.innerText;
    return {
      found: true,
      hasIngredients: text.includes('Ingredienti e grammi reali'),
      hasPreparation: text.includes('Preparazione'),
      hasNutrition: text.includes('proteine') && text.includes('carboidrati') && text.includes('grassi'),
      hasAllergens: text.includes('Allergeni rilevati'),
      photoLoaded: Boolean(image?.complete && image.naturalWidth > 0),
      horizontalOverflow: sheet.scrollWidth > sheet.clientWidth + 1,
    };
  })()`);
  await evaluate(`document.querySelector('.recipe-sheet .close')?.click()`);
  await wait(300);
  recipeDetail.closed = await evaluate(`!document.querySelector('.recipe-sheet')`);
  await clickTab("Le tue 214");
  const recipeCoverage = await evaluate(`document.body.innerText.includes('214/214 presenti')`);
  const suppliedRecipeGroups = [];
  for (const [label, expected] of [
    ["44 colazioni", 44],
    ["42 spuntini", 42],
    ["64 pranzi", 64],
    ["64 cene", 64],
  ]) {
    const clicked = await evaluate(`(() => {
      const coverage = document.querySelector('.supplied-recipe-coverage');
      const button = [...(coverage?.querySelectorAll('button') || [])].find((item) => item.innerText.trim() === ${JSON.stringify(label)});
      button?.click();
      return Boolean(button);
    })()`);
    if (!clicked) throw new Error(`Gruppo ricette ${label} non trovato`);
    await wait(400);
    await settleViewportImages();
    suppliedRecipeGroups.push(await evaluate(`(() => {
      const coverage = document.querySelector('.supplied-recipe-coverage');
      const active = [...(coverage?.querySelectorAll('button') || [])].find((button) => button.getAttribute('aria-pressed') === 'true');
      const counter = document.querySelector('.library-tools b')?.innerText.trim() || '';
      const cards = [...document.querySelectorAll('.recipe-grid article')].filter((card) => card.offsetParent !== null);
      const image = cards[0]?.querySelector('img');
      return {
        label: ${JSON.stringify(label)},
        expected: ${expected},
        active: active?.innerText.trim() === ${JSON.stringify(label)},
        countMatches: counter.startsWith(${JSON.stringify(`${expected}/`)}),
        visibleCards: cards.length,
        firstPhotoLoaded: Boolean(image?.complete && image.naturalWidth > 0),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    })()`));
  }
  await evaluate(`window.scrollTo(0, Math.max(0, document.body.scrollHeight - window.innerHeight))`);
  const recipeScroll = await snapshot();
  await clickTab("Oggi");
  const backToday = await snapshot();
  const openedSwap = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.innerText.includes('Cambia piatto'));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!openedSwap) throw new Error("Cambio piatto non trovato");
  await wait(2500);
  const swap = await snapshot();
  await evaluate(`window.scrollTo(0, Math.max(0, document.body.scrollHeight - window.innerHeight))`);
  await wait(500);
  const swapBottom = await evaluate(`(() => {
    const button = document.querySelector('.swap-back');
    if (!button) return { found: false };
    const rect = button.getBoundingClientRect();
    return {
      found: true,
      visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      scrollY: Math.round(window.scrollY),
      hasOccasionalChoices: document.body.innerText.includes('Sgarri'),
      hasCompleteChoices: document.body.innerText.includes('Piatto unico'),
    };
  })()`);
  await evaluate(`document.querySelector('.swap-back')?.click()`);
  await wait(1000);
  const afterSwapReturn = await snapshot();
  const openedMilkAlternatives = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.innerText.includes('Latte') && item.innerText.includes('Alternative'));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!openedMilkAlternatives) throw new Error("Alternative latte non trovate");
  await wait(750);
  const milkAlternatives = await evaluate(`(() => {
    const sheet = document.querySelector('.part-picker-sheet');
    const scroller = document.querySelector('.part-picker-scroll');
    const close = document.querySelector('[aria-label="Chiudi alternative"]');
    if (!sheet || !scroller || !close) return { found: false };
    scroller.scrollTop = scroller.scrollHeight;
    const rect = close.getBoundingClientRect();
    const text = sheet.innerText;
    return {
      found: true,
      hasNone: text.includes('Nessuno'),
      hasSoy: text.includes('Bevanda di soia'),
      hasOat: text.includes('Bevanda d’avena') || text.includes("Bevanda d'avena"),
      hasSkimmed: text.includes('Latte scremato'),
      closeVisible: rect.top >= 0 && rect.bottom <= window.innerHeight,
      horizontalOverflow: sheet.scrollWidth > sheet.clientWidth + 1,
    };
  })()`);
  await evaluate(`document.querySelector('[aria-label="Chiudi alternative"]')?.click()`);
  await wait(500);
  const pickerClosed = await evaluate(`!document.querySelector('.part-picker-sheet')`);
  const gramsEdit = await evaluate(`(() => {
    const input = document.querySelector('.meal-part input[type="number"]');
    if (!input) return { found: false };
    const before = Number(input.value);
    const expected = before + 5;
    input.focus();
    input.select();
    return { found: true, label: input.getAttribute('aria-label'), before, expected };
  })()`);
  if (!gramsEdit.found) throw new Error("Grammatura modificabile non trovata");
  // Use a real browser text insertion instead of mutating the DOM value. This
  // follows the same React input path as a person typing on the phone and makes
  // the persistence check meaningful across React/browser upgrades.
  await page.send("Input.insertText", { text: String(gramsEdit.expected) });
  await evaluate(`document.activeElement?.blur()`);
  await wait(2500);
  gramsEdit.afterEdit = await evaluate(`Number(document.querySelector('.meal-part input[type="number"]')?.value)`);
  await page.send("Page.reload", { ignoreCache: false });
  await wait(5000);
  gramsEdit.afterReload = await evaluate(`Number(document.querySelector('.meal-part input[type="number"]')?.value)`);
  gramsEdit.persisted = gramsEdit.afterEdit === gramsEdit.expected && gramsEdit.afterReload === gramsEdit.expected;
  const afterReload = await snapshot();
  await clickTab("Settimana");
  const openedShopping = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.innerText.includes('Lista della spesa settimanale'));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!openedShopping) throw new Error("Lista della spesa settimanale non trovata");
  await wait(500);
  const shopping = await evaluate(`(() => {
    const sheet = document.querySelector('.shopping-sheet');
    if (!sheet) return { found: false };
    const checkboxes = [...sheet.querySelectorAll('.shopping-list input[type="checkbox"]')];
    const selectAll = [...sheet.querySelectorAll('button')].find((button) => button.innerText.includes('Seleziona tutto'));
    const deselectAll = [...sheet.querySelectorAll('button')].find((button) => button.innerText.includes('Deseleziona tutto'));
    selectAll?.click();
    return {
      found: true,
      itemCount: checkboxes.length,
      hasSelectAll: Boolean(selectAll),
      hasDeselectAll: Boolean(deselectAll),
      horizontalOverflow: sheet.scrollWidth > sheet.clientWidth + 1,
    };
  })()`);
  await wait(400);
  shopping.allSelected = await evaluate(`(() => {
    const boxes = [...document.querySelectorAll('.shopping-list input[type="checkbox"]')];
    return boxes.length > 0 && boxes.every((box) => box.checked);
  })()`);
  await evaluate(`(() => {
    const sheet = document.querySelector('.shopping-sheet');
    [...sheet.querySelectorAll('button')].find((button) => button.innerText.includes('Deseleziona tutto'))?.click();
  })()`);
  await wait(400);
  shopping.allDeselected = await evaluate(`(() => {
    const boxes = [...document.querySelectorAll('.shopping-list input[type="checkbox"]')];
    return boxes.length > 0 && boxes.every((box) => !box.checked);
  })()`);
  await evaluate(`document.querySelector('.shopping-sheet header button')?.click()`);
  await wait(400);
  shopping.closed = await evaluate(`!document.querySelector('.shopping-sheet')`);
  const openedWeekDay = await evaluate(`(() => {
    const button = document.querySelector('.week-day header button');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!openedWeekDay) throw new Error("Modifica giorno settimanale non trovata");
  await wait(700);
  const todayWeekSync = await evaluate(`(() => {
    const card = document.querySelector('.meal-card');
    const part = card?.querySelector('.meal-part .part-change');
    if (!part) return { found: false };
    const before = part.innerText.replace('Alternative', '').trim();
    part.click();
    return { found: true, before };
  })()`);
  await wait(500);
  Object.assign(todayWeekSync, await evaluate(`(() => {
    const picker = document.querySelector('.part-picker-sheet');
    const choices = [...(picker?.querySelectorAll('.part-choice-grid button') || [])];
    const choice = choices.find((button) => !button.classList.contains('selected'));
    const chosen = choice?.querySelector('span')?.innerText.trim() || choice?.querySelector('img')?.alt || '';
    choice?.click();
    return {
      pickerFound: Boolean(picker),
      alternatives: choices.length,
      replacementFound: Boolean(choice),
      chosen,
    };
  })()`));
  await wait(700);
  Object.assign(todayWeekSync, await evaluate(`(() => {
    const current = document.querySelector('.meal-card .meal-part .part-change')?.innerText.replace('Alternative', '').trim() || '';
    return {
      changedInEditor: Boolean(current && current === ${JSON.stringify(todayWeekSync.chosen)} && current !== ${JSON.stringify(todayWeekSync.before)}),
      editorValue: current,
    };
  })()`));
  await evaluate(`window.scrollTo(0, Math.max(0, document.body.scrollHeight - window.innerHeight))`);
  await wait(300);
  const weekEditor = await evaluate(`(() => {
    const banner = document.querySelector('.week-edit-banner');
    if (!banner) return { found: false };
    const rect = banner.getBoundingClientRect();
    const actions = [...banner.querySelectorAll('button')].map((button) => button.innerText.trim());
    return {
      found: true,
      visible: rect.top >= 0 && rect.top < window.innerHeight,
      scrollY: Math.round(window.scrollY),
      hasClose: actions.includes('Chiudi'),
      hasRebalance: actions.includes('Chiudi e riequilibra'),
      horizontalOverflow: banner.scrollWidth > banner.clientWidth + 1,
    };
  })()`);
  await evaluate(`(() => {
    const banner = document.querySelector('.week-edit-banner');
    [...banner.querySelectorAll('button')].find((button) => button.innerText.trim() === 'Chiudi')?.click();
  })()`);
  await wait(700);
  weekEditor.returnedToWeek = await evaluate(`document.body.innerText.includes('Calorie pianificate') && !document.querySelector('.week-edit-banner')`);
  Object.assign(todayWeekSync, await evaluate(`(() => {
    const firstDay = document.querySelector('.week-day');
    const weekValues = [...(firstDay?.querySelectorAll('.week-part-strip span') || [])].map((item) => item.innerText.trim());
    return {
      weekValuePersisted: weekValues.includes(${JSON.stringify(todayWeekSync.chosen)}),
      weekValues,
    };
  })()`));
  await clickTab("Oggi");
  Object.assign(todayWeekSync, await evaluate(`(() => {
    const todayValue = document.querySelector('.meal-card .meal-part .part-change')?.innerText.replace('Alternative', '').trim() || '';
    return {
      todayValue,
      todayMatchesWeek: todayValue === ${JSON.stringify(todayWeekSync.chosen)},
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  })()`));
  const extraLog = await evaluate(`(() => {
    const details = document.querySelector('#sgarri-extra');
    if (!details) return { found: false };
    details.open = true;
    const name = details.querySelector('input[placeholder^="Scrivi pane"]');
    const grams = details.querySelector('input[aria-label="Grammi extra"]');
    const add = [...details.querySelectorAll('button')].find((button) => button.innerText.trim() === 'Aggiungi');
    if (!name || !grams || !add) return { found: false };
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    name._valueTracker?.setValue(name.value);
    setter.call(name, 'Gelato al pistacchio');
    name.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'Gelato al pistacchio' }));
    grams._valueTracker?.setValue(grams.value);
    setter.call(grams, '60');
    grams.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '60' }));
    add.click();
    return { found: true };
  })()`);
  await wait(1_500);
  Object.assign(extraLog, await evaluate(`(() => {
    const rows = [...document.querySelectorAll('#sgarri-extra .log-list button')];
    const row = rows.find((button) => button.innerText.includes('Gelato al pistacchio'));
    return {
      added: Boolean(row),
      hasCalories: Boolean(row && /\\d+ kcal/.test(row.innerText)),
      hasMacros: Boolean(row && row.innerText.includes('proteine') && row.innerText.includes('carboidrati') && row.innerText.includes('grassi')),
    };
  })()`));
  await evaluate(`(() => {
    const row = [...document.querySelectorAll('#sgarri-extra .log-list button')].find((button) => button.innerText.includes('Gelato al pistacchio'));
    row?.click();
  })()`);
  await wait(500);
  extraLog.removed = await evaluate(`![...document.querySelectorAll('#sgarri-extra .log-list button')].some((button) => button.innerText.includes('Gelato al pistacchio'))`);
  const openedSnackAlternatives = await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[1];
    const button = card?.querySelector('.part-change');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!openedSnackAlternatives) throw new Error("Alternative spuntino mattutino non trovate");
  await wait(500);
  const openedGelatoComposer = await evaluate(`(() => {
    const group = document.querySelector('.cheat-picker-group');
    if (!group) return false;
    group.open = true;
    const button = [...group.querySelectorAll('.complete-meal-select')].find((item) => item.innerText.includes('Gelato artigianale personalizzabile'));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!openedGelatoComposer) throw new Error("Compositore gelato non trovato");
  await wait(400);
  const gelatoComposer = await evaluate(`(() => {
    const builder = document.querySelector('.gelato-builder');
    if (!builder) return { found: false };
    const three = [...builder.querySelectorAll('.gelato-scoops button')].find((button) => button.innerText.includes('3 palline'));
    three?.click();
    return {
      found: true,
      hasTwoScoops: builder.innerText.includes('2 palline'),
      hasThreeScoops: Boolean(three),
      horizontalOverflow: builder.scrollWidth > builder.clientWidth + 1,
    };
  })()`);
  await wait(300);
  Object.assign(gelatoComposer, await evaluate(`(() => {
    const builder = document.querySelector('.gelato-builder');
    const selects = [...builder.querySelectorAll('select')];
    const choose = builder.querySelector('.gelato-choose');
    return {
      flavorSelectors: selects.length,
      flavorOptions: selects.length ? selects[0].options.length : 0,
      hasCalculatedCalories: Boolean(choose && /\\d+ kcal/.test(choose.innerText)),
    };
  })()`));
  await evaluate(`document.querySelector('.gelato-builder .gelato-choose')?.click()`);
  await wait(700);
  await evaluate(`document.querySelectorAll('.meal-card')[1]?.scrollIntoView({ block: 'center' })`);
  await evaluate(`Promise.all([...document.querySelectorAll('.meal-card')[1].querySelectorAll('.meal-part img')].map((image) => {
    image.loading = 'eager';
    return image.complete ? Promise.resolve() : new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
      setTimeout(resolve, ${imageSettleTimeoutMs});
    });
  }))`);
  Object.assign(gelatoComposer, await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[1];
    const parts = [...card.querySelectorAll('.meal-part')];
    const images = [...card.querySelectorAll('.meal-part img')];
    const loadedImages = images.filter((image) => image.complete && image.naturalWidth > 0);
    return {
      applied: parts.length === 3 && parts.every((part) => part.innerText.includes('Pallina')),
      imageCount: images.length,
      loadedImageCount: loadedImages.length,
      photosLoaded: images.length === 3 && loadedImages.length === 3,
      pickerClosed: !document.querySelector('.part-picker-sheet'),
    };
  })()`));
  await clickTab("Progressi");
  const historyConsent = await evaluate(`(() => {
    const input = document.querySelector('.history-consent input[type="checkbox"]');
    if (!input) return { found: false };
    if (!input.checked) input.click();
    return { found: true, enabled: input.checked };
  })()`);
  await wait(500);
  await clickTab("Oggi");
  const mealRegistration = await evaluate(`(() => {
    const button = document.querySelectorAll('.meal-card')[1]?.querySelector('.check');
    if (!button) return { found: false };
    button.click();
    return { found: true };
  })()`);
  await wait(1_500);
  Object.assign(mealRegistration, await evaluate(`(() => {
    const button = document.querySelectorAll('.meal-card')[1]?.querySelector('.check');
    const summary = document.querySelector('.actual-day-summary');
    return {
      marked: button?.classList.contains('done') && button.getAttribute('aria-label') === 'Segna da fare',
      summaryUpdated: summary?.innerText.includes('1/5 registrati'),
    };
  })()`));
  await page.send("Page.reload", { ignoreCache: false });
  await wait(5000);
  Object.assign(mealRegistration, await evaluate(`(() => {
    const button = document.querySelectorAll('.meal-card')[1]?.querySelector('.check');
    const summary = document.querySelector('.actual-day-summary');
    return {
      persisted: button?.classList.contains('done') && summary?.innerText.includes('1/5 registrati'),
    };
  })()`));
  await evaluate(`document.querySelectorAll('.meal-card')[1]?.querySelector('.check')?.click()`);
  await wait(600);
  Object.assign(mealRegistration, await evaluate(`(() => {
    const button = document.querySelectorAll('.meal-card')[1]?.querySelector('.check');
    const summary = document.querySelector('.actual-day-summary');
    return {
      unmarked: !button?.classList.contains('done') && button?.getAttribute('aria-label') === 'Segna mangiato',
      summaryReverted: summary?.innerText.includes('0/5 registrati'),
    };
  })()`));
  const mealPartAddition = await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    const add = card?.querySelector('.add-part-compact');
    if (!card || !add) return { found: false };
    const before = card.querySelectorAll('.meal-part').length;
    add.click();
    return { found: true, before };
  })()`);
  await wait(500);
  Object.assign(mealPartAddition, await evaluate(`(() => {
    const sheet = document.querySelector('.part-picker-sheet');
    const close = sheet?.querySelector('[aria-label="Chiudi alternative"]');
    const choice = sheet?.querySelector('.part-choice-grid button');
    if (!sheet || !choice) return { pickerFound: false };
    const rect = close?.getBoundingClientRect();
    const result = {
      pickerFound: true,
      addHeading: sheet.innerText.includes('AGGIUNGI AL PASTO'),
      hasRecommendedChoices: sheet.querySelectorAll('.part-choice-grid button').length > 0,
      noBlankChoice: [...sheet.querySelectorAll('.part-choice-grid button')].every((button) =>
        button.innerText.trim().length > 0 || Boolean(button.getAttribute('aria-label')) || Boolean(button.querySelector('img')?.alt)
      ),
      closeVisible: Boolean(rect && rect.top >= 0 && rect.bottom <= window.innerHeight),
      horizontalOverflow: sheet.scrollWidth > sheet.clientWidth + 1,
    };
    choice.click();
    return result;
  })()`));
  await wait(700);
  Object.assign(mealPartAddition, await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    if (!card) return { added: false };
    const afterAdd = card.querySelectorAll('.meal-part').length;
    const removeButtons = card.querySelectorAll('.part-remove');
    const lastRemove = removeButtons[removeButtons.length - 1];
    const result = {
      afterAdd,
      added: afterAdd > ${mealPartAddition.before} &&
        (${mealPartAddition.before} === 0 || afterAdd === ${mealPartAddition.before} + 1),
      pickerClosed: !document.querySelector('.part-picker-sheet'),
      hasDirectRemove: Boolean(lastRemove),
    };
    lastRemove?.click();
    return result;
  })()`));
  await wait(700);
  Object.assign(mealPartAddition, await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    const afterRemove = card?.querySelectorAll('.meal-part').length ?? -1;
    return {
      afterRemove,
      removed: afterRemove === ${mealPartAddition.afterAdd} - 1,
    };
  })()`));
  const readyDishFlow = await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    const changePart = card?.querySelector('.meal-part .part-change');
    if (!card || !changePart) return { found: false };
    changePart.click();
    return { found: true };
  })()`);
  await wait(500);
  Object.assign(readyDishFlow, await evaluate(`(() => {
    const picker = document.querySelector('.part-picker-sheet');
    const complete = picker?.querySelector('.complete-meal-select');
    if (!picker || !complete) return { completePickerFound: false };
    const name = complete.querySelector('span')?.innerText.trim() || '';
    const result = {
      completePickerFound: true,
      completeOptions: picker.querySelectorAll('.complete-meal-select').length,
      recipeInfoAvailableBeforeChoice: Boolean(picker.querySelector('.complete-meal-info')),
      firstDishName: name,
    };
    complete.click();
    return result;
  })()`));
  await wait(900);
  await evaluate(`document.querySelectorAll('.meal-card')[2]?.scrollIntoView({ block: 'center' })`);
  await wait(500);
  Object.assign(readyDishFlow, await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    const buttons = [...(card?.querySelectorAll('.dish-view-actions button') || [])];
    return {
      fullDishApplied: Boolean(card?.querySelector('.recipe-visual-single, .recipe-visual-parts')) && card?.querySelector('h3')?.innerText.trim() === ${JSON.stringify(readyDishFlow.firstDishName)},
      hasRecipeDetail: buttons.some((button) => button.innerText.includes('Ricetta e preparazione')),
      hasReadyDishChange: buttons.some((button) => button.innerText.includes('Cambia piatto pronto')),
      hasSplit: buttons.some((button) => button.innerText.includes('Dividi in componenti')),
    };
  })()`));
  await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    [...(card?.querySelectorAll('.dish-view-actions button') || [])]
      .find((button) => button.innerText.includes('Ricetta e preparazione'))?.click();
  })()`);
  await wait(350);
  await evaluate(`(() => {
    const photos = [...(document.querySelectorAll('.recipe-sheet img.recipe-visual-single, .recipe-sheet .recipe-visual-parts img') || [])];
    return Promise.all(photos.map((photo) => {
      photo.loading = 'eager';
      return photo.complete ? Promise.resolve() : new Promise((resolve) => {
        photo.addEventListener('load', resolve, { once: true });
        photo.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, ${imageSettleTimeoutMs});
      });
    }));
  })()`);
  Object.assign(readyDishFlow, await evaluate(`(() => {
    const sheet = document.querySelector('.recipe-sheet');
    const photos = [...(sheet?.querySelectorAll('img.recipe-visual-single, .recipe-visual-parts img') || [])];
    const result = {
      detailOpened: Boolean(sheet),
      detailHasIngredients: Boolean(sheet?.querySelector('.ingredients li')),
      detailHasPreparation: Boolean(sheet?.querySelector('.steps li')),
      detailPhotoLoaded: photos.length > 0 && photos.every((photo) => photo.complete && photo.naturalWidth > 0),
    };
    sheet?.querySelector('.close')?.click();
    return result;
  })()`));
  await wait(350);
  await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    [...(card?.querySelectorAll('.dish-view-actions button') || [])]
      .find((button) => button.innerText.includes('Dividi in componenti'))?.click();
  })()`);
  await wait(550);
  await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    return Promise.all([...(card?.querySelectorAll('.meal-part img') || [])].map((photo) => {
      photo.loading = 'eager';
      return photo.complete ? Promise.resolve() : new Promise((resolve) => {
        photo.addEventListener('load', resolve, { once: true });
        photo.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, ${imageSettleTimeoutMs});
      });
    }));
  })()`);
  Object.assign(readyDishFlow, await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    const photos = [...(card?.querySelectorAll('.meal-part img') || [])];
    return {
      splitApplied: card?.querySelectorAll('.meal-part').length >= 2,
      splitPhotosLoaded: photos.length >= 2 && photos.every((photo) => photo.complete && photo.naturalWidth > 0),
      recombineBeforeEdit: [...(card?.querySelectorAll('.dish-view-actions button') || [])].some((button) => button.innerText.includes('Ricomponi piatto')),
    };
  })()`));
  await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    [...(card?.querySelectorAll('.dish-view-actions button') || [])]
      .find((button) => button.innerText.includes('Ricomponi piatto'))?.click();
  })()`);
  await wait(450);
  Object.assign(readyDishFlow, await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    const recomposed = !card?.querySelector('.meal-parts') && Boolean(card?.querySelector('.recipe-visual-single, .recipe-visual-parts'));
    [...(card?.querySelectorAll('.dish-view-actions button') || [])]
      .find((button) => button.innerText.includes('Dividi in componenti'))?.click();
    return { recomposed };
  })()`));
  await wait(450);
  await evaluate(`document.querySelectorAll('.meal-card')[2]?.querySelector('.meal-part .part-change')?.click()`);
  await wait(450);
  Object.assign(readyDishFlow, await evaluate(`(() => {
    const picker = document.querySelector('.part-picker-sheet');
    const alternatives = [...(picker?.querySelectorAll('.part-choice-grid button') || [])];
    const replacement = alternatives.find((button) => !button.classList.contains('selected'));
    const result = { componentAlternatives: alternatives.length, componentReplacementFound: Boolean(replacement) };
    replacement?.click();
    return result;
  })()`));
  await wait(650);
  Object.assign(readyDishFlow, await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    return {
      componentChanged: Boolean(card?.querySelector('.meal-parts')),
      recombineAfterEditHidden: ![...(card?.querySelectorAll('.dish-view-actions button') || [])].some((button) => button.innerText.includes('Ricomponi piatto')),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  })()`));
  await evaluate(`document.querySelectorAll('.meal-card')[2]?.querySelector('.meal-part .part-change')?.click()`);
  await wait(450);
  Object.assign(readyDishFlow, await evaluate(`(() => {
    const choices = [...document.querySelectorAll('.part-picker-sheet .complete-meal-select')];
    const choice = choices[1] || choices[0];
    const name = choice?.querySelector('span')?.innerText.trim() || '';
    choice?.click();
    return { secondReadyDishFound: Boolean(choice), secondDishName: name };
  })()`));
  await wait(700);
  Object.assign(readyDishFlow, await evaluate(`(() => {
    const card = document.querySelectorAll('.meal-card')[2];
    const buttons = [...(card?.querySelectorAll('.dish-view-actions button') || [])];
    return {
      secondReadyDishApplied: card?.querySelector('h3')?.innerText.trim() === ${JSON.stringify(readyDishFlow.secondDishName)},
      secondDishStillReplaceable: buttons.some((button) => button.innerText.includes('Cambia piatto pronto')),
      secondDishStillSplittable: buttons.some((button) => button.innerText.includes('Dividi in componenti')),
    };
  })()`));
  const checkinAdaptation = await evaluate(`(() => {
    const toggle = document.querySelector('.checkin-toggle');
    const beforeMenu = [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim());
    toggle?.click();
    return { found: Boolean(toggle), beforeMenu };
  })()`);
  const chooseCheckinAnswer = async (questionLabel, answerLabel) => {
    const clicked = await evaluate(`(() => {
      const question = [...document.querySelectorAll('.checkin-body .question')].find((item) =>
        item.querySelector(':scope > span')?.innerText.trim() === ${JSON.stringify(questionLabel)}
      );
      const button = [...(question?.querySelectorAll('button') || [])].find((item) => item.innerText.trim() === ${JSON.stringify(answerLabel)});
      button?.click();
      return Boolean(button);
    })()`);
    if (!clicked) throw new Error(`Check-in ${questionLabel}/${answerLabel} non trovato`);
    await wait(800);
  };
  await chooseCheckinAnswer('Stato', 'Gonfio');
  Object.assign(checkinAdaptation, await evaluate(`(() => {
    const afterMenu = [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim());
    const dinner = document.querySelectorAll('.meal-card')[4]?.innerText.toLowerCase() || '';
    const note = document.querySelector('.replan-note')?.innerText || '';
    return {
      bloatingActive: [...document.querySelectorAll('.checkin-body .question')].some((question) =>
        question.querySelector(':scope > span')?.innerText.trim() === 'Stato' &&
        [...question.querySelectorAll('button')].some((button) => button.innerText.trim() === 'Gonfio' && button.classList.contains('active'))
      ),
      bloatingNote: note.includes('Gonfio') && note.includes('senza legumi'),
      bloatingMenuChanged: JSON.stringify(afterMenu) !== JSON.stringify(${JSON.stringify(checkinAdaptation.beforeMenu)}),
      bloatingDinnerAvoidsTriggers: !/ceci|lenticchie|fagioli|piselli|cavolo|cavolfiore|broccoli|cipolla|porro/.test(dinner),
      afterBloatingMenu: afterMenu,
    };
  })()`));
  await chooseCheckinAnswer('Stato', 'Stanco');
  Object.assign(checkinAdaptation, await evaluate(`(() => {
    const menu = [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim());
    const note = document.querySelector('.replan-note')?.innerText || '';
    return {
      tiredActive: [...document.querySelectorAll('.checkin-body button.active')].some((button) => button.innerText.trim() === 'Stanco'),
      tiredNote: note.includes('Stanco') && note.includes('carboidrati distribuiti'),
      tiredMenuChanged: JSON.stringify(menu) !== JSON.stringify(${JSON.stringify(checkinAdaptation.afterBloatingMenu)}),
    };
  })()`));
  await chooseCheckinAnswer('Stato', 'Bene');
  await chooseCheckinAnswer('Riposo', 'Male');
  Object.assign(checkinAdaptation, await evaluate(`(() => ({
    poorSleepActive: [...document.querySelectorAll('.checkin-body button.active')].some((button) => button.innerText.trim() === 'Male'),
    poorSleepNote: document.querySelector('.replan-note')?.innerText.includes('poco riposato') || false,
  }))()`));
  await chooseCheckinAnswer('Riposo', 'Bene');
  await chooseCheckinAnswer('Attività oggi', 'Intensa');
  Object.assign(checkinAdaptation, await evaluate(`(() => ({
    intenseActivityActive: [...document.querySelectorAll('.checkin-body button.active')].some((button) => button.innerText.trim() === 'Intensa'),
    intenseActivityNote: document.querySelector('.replan-note')?.innerText.includes('Attività intensa') || false,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }))()`));
  await chooseCheckinAnswer('Attività oggi', 'Nessuna');
  await evaluate(`document.querySelector('.checkin-toggle')?.click()`);
  const changeSelectValue = async (selector, index, value) => {
    const changed = await evaluate(`(() => {
      const select = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
      if (!select) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(select, ${JSON.stringify(value)});
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!changed) throw new Error(`Selettore ${selector}[${index}] non trovato`);
    await wait(1_200);
  };
  await evaluate(`(() => {
    localStorage.clear();
    sessionStorage.clear();
    return true;
  })()`);
  await page.send("Page.reload", { ignoreCache: true });
  await wait(5_000);
  const profileAdaptation = await evaluate(`(() => ({
    found: true,
    cleanProfile: !document.body.innerText.includes('Gelato artigianale personalizzabile') &&
      !document.body.innerText.includes('Pasta di farro con sgombro e broccoli'),
    recovery: document.body.innerText.includes('La pagina ha incontrato un errore'),
  }))()`);
  await changeSelectValue('.compact-config select', 1, '1400');
  Object.assign(profileAdaptation, await evaluate(`(() => {
    const strip = document.querySelector('.today-strip')?.innerText || '';
    const planText = document.querySelector('.today-strip b')?.textContent || '';
    const planSegment = planText.toLowerCase().split('piano ')[1]?.split(' · ')[0] || '';
    const visiblePlanKcal = Number(planSegment.replaceAll('.', '').replaceAll(',', '').trim());
    return {
      lowTargetSelected: strip.includes('scelto 1400 kcal'),
      lowPlanText: planText,
      lowPlanKcal: visiblePlanKcal,
      lowMenu: [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim()),
    };
  })()`));
  await changeSelectValue('.compact-config select', 1, '2600');
  Object.assign(profileAdaptation, await evaluate(`(() => {
    const strip = document.querySelector('.today-strip')?.innerText || '';
    const planText = document.querySelector('.today-strip b')?.textContent || '';
    const planSegment = planText.toLowerCase().split('piano ')[1]?.split(' · ')[0] || '';
    const visiblePlanKcal = Number(planSegment.replaceAll('.', '').replaceAll(',', '').trim());
    const highMenu = [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim());
    const breakfastFoods = (highMenu[0] || '').split(' · ').slice(1).join(' · ').split(', ');
    const dairyCount = breakfastFoods.filter((food) => /latte|yogurt|skyr|kefir|ricotta|cottage|budino proteico/i.test(food)).length;
    const nutCount = breakfastFoods.filter((food) => /noci|nocciole|mandorle|pistacchi|arachidi|anacardi|semi di/i.test(food)).length;
    return {
      highTargetSelected: strip.includes('scelto 2600 kcal'),
      highPlanText: planText,
      highPlanKcal: visiblePlanKcal,
      highMenu,
      highBreakfastHasNoDuplicateDairyOrNuts: dairyCount <= 1 && nutCount <= 1,
      targetChangesPlan: visiblePlanKcal > ${profileAdaptation.lowPlanKcal} + 300 && JSON.stringify(highMenu) !== JSON.stringify(${JSON.stringify(profileAdaptation.lowMenu)}),
    };
  })()`));
  await changeSelectValue('.compact-config select', 1, '3000');
  Object.assign(profileAdaptation, await evaluate(`(() => {
    const strip = document.querySelector('.today-strip')?.innerText || '';
    const planText = document.querySelector('.today-strip b')?.textContent || '';
    const planSegment = planText.toLowerCase().split('piano ')[1]?.split(' · ')[0] || '';
    return {
      maxTargetSelected: strip.includes('scelto 3000 kcal'),
      maxPlanText: planText,
      maxPlanKcal: Number(planSegment.replaceAll('.', '').replaceAll(',', '').trim()),
      maxMenu: [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim()),
    };
  })()`));
  profileAdaptation.maxSnackHarmonious = [profileAdaptation.maxMenu[1], profileAdaptation.maxMenu[3]]
    .every((heading) => !(/finocchi|carote|cetrioli|ravanelli/i.test(heading || '') && /banana|mela/i.test(heading || '')));
  profileAdaptation.maxSnackNoDoubleCereal = [profileAdaptation.maxMenu[1], profileAdaptation.maxMenu[3]]
    .every((heading) => !(/biscott|fette biscottate|pane|grissini/i.test(heading || '') && /cracker/i.test(heading || '')));
  await evaluate(`(() => {
    [...document.querySelectorAll('.today-strip-actions button')]
      .find((button) => button.textContent?.includes('Preferenze'))?.click();
    return true;
  })()`);
  await wait(250);
  const glutenToggleFound = await evaluate(`(() => {
    const button = [...document.querySelectorAll('.preferences .chips')][0]
      ? [...document.querySelectorAll('.preferences .chips')[0].querySelectorAll('button')]
          .find((item) => item.textContent?.trim() === 'Glutine')
      : null;
    button?.click();
    return Boolean(button);
  })()`);
  if (!glutenToggleFound) throw new Error('Filtro allergia Glutine non disponibile');
  await wait(1_200);
  Object.assign(profileAdaptation, await evaluate(`(() => ({
    glutenFilterActive: [...document.querySelectorAll('.preferences .chips')[0].querySelectorAll('button')]
      .some((button) => button.textContent?.trim() === 'Glutine' && button.classList.contains('active')),
    glutenPlanSafe: document.querySelectorAll('.meal-card').length === 5 &&
      document.querySelectorAll('.meal-card.blocked').length === 0,
  }))()`));
  await evaluate(`(() => {
    [...document.querySelectorAll('.preferences .chips')[0].querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Glutine')?.click();
    [...document.querySelectorAll('.preferences button')]
      .find((button) => button.textContent?.trim() === 'Chiudi')?.click();
    return true;
  })()`);
  await wait(1_200);
  profileAdaptation.glutenFilterRestored = !await evaluate(`document.querySelectorAll('.meal-card.blocked').length > 0`);
  await changeSelectValue('.compact-config select', 1, '2600');
  await changeSelectValue('.cuisine-picker select', 1, 'Lavoro');
  profileAdaptation.workMenu = await evaluate(`[...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim())`);
  profileAdaptation.workBreakfastPractical = !/frullat|smoothie|centrifug|pancake|toast|uov/i.test(profileAdaptation.workMenu[0] || '');
  profileAdaptation.workSnacksPractical = [profileAdaptation.workMenu[1], profileAdaptation.workMenu[3]]
    .every((heading) => !/wafer|grissini/i.test(heading || ''));
  await changeSelectValue('.cuisine-picker select', 1, 'Casa');
  Object.assign(profileAdaptation, await evaluate(`(() => {
    const homeMenu = [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim());
    const context = document.querySelectorAll('.cuisine-picker select')[1];
    return {
      homeSelected: context?.value === 'Casa',
      homeMenu,
      contextChangesPlan: JSON.stringify(homeMenu) !== JSON.stringify(${JSON.stringify(profileAdaptation.workMenu)}),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  })()`));
  await changeSelectValue('.cuisine-picker select', 1, 'Lavoro');
  const loggedMealBeforeAllergy = await evaluate(`(() => {
    const forbidden = /pasta|pane|farro|orzo|bulgur|cous cous|cracker|fette biscottate|biscott|wafer|muesli|frumento|segale|grissini|avena/i;
    const cards = [...document.querySelectorAll('.meal-card')];
    const index = cards.findIndex((card) => !forbidden.test(card.innerText || ''));
    const card = cards[index];
    const heading = card?.querySelector('h3')?.innerText.trim() || '';
    card?.querySelector('.check')?.click();
    return { index, heading, marked: Boolean(card?.querySelector('.check')) };
  })()`);
  await wait(400);
  await clickTab('Settimana');
  profileAdaptation.lockedWeekConfirmed = await evaluate(`(() => {
    const lock = document.querySelector('.week-lock');
    const button = [...(lock?.querySelectorAll('button') || [])]
      .find((item) => item.innerText.trim() === 'Conferma');
    button?.click();
    return Boolean(button);
  })()`);
  await wait(400);
  await clickTab('Oggi');
  await evaluate(`(() => {
    [...document.querySelectorAll('.today-strip-actions button')]
      .find((button) => button.textContent?.includes('Preferenze'))?.click();
    return true;
  })()`);
  await wait(250);
  await evaluate(`(() => {
    [...document.querySelectorAll('.preferences .chips')[0].querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Glutine')?.click();
    return true;
  })()`);
  await wait(1_200);
  profileAdaptation.postFilterNote = await evaluate(`document.querySelector('.replan-note')?.innerText || ''`);
  await clickTab('Settimana');
  Object.assign(profileAdaptation, await evaluate(`(() => {
    const weekMeals = [...document.querySelectorAll('.week-meal')];
    const forbidden = /pasta|pane|farro|orzo|bulgur|cous cous|cracker|fette biscottate|biscott|wafer|muesli|frumento|segale|grissini|avena/i;
    return {
      lockedWeekReopenedForAllergy: document.querySelector('.week-lock')?.innerText.includes('Settimana modificabile') || false,
      weekMealsAfterAllergy: weekMeals.length,
      weekReplanNote: document.querySelector('.replan-note')?.innerText || '',
      weekForbiddenMeals: weekMeals.filter((meal) => forbidden.test(meal.innerText)).map((meal) => meal.innerText.slice(0, 180)),
      weekGlutenFree: weekMeals.length === 35 && weekMeals.every((meal) => !forbidden.test(meal.innerText)),
    };
  })()`));
  await clickTab('Oggi');
  profileAdaptation.loggedMealPreserved = Boolean(loggedMealBeforeAllergy.marked &&
    await evaluate(`(() => {
      const card = document.querySelectorAll('.meal-card')[${loggedMealBeforeAllergy.index}];
      return card?.querySelector('h3')?.innerText.trim() === ${JSON.stringify(loggedMealBeforeAllergy.heading)} &&
        card?.querySelector('.check')?.classList.contains('done');
    })()`));
  await clickTab('Settimana');
  const freeChoiceAndReplan = await evaluate(`(() => {
    const secondDay = document.querySelectorAll('.week-day')[1];
    const breakfastChange = secondDay?.querySelector('.week-meal-row .week-change');
    breakfastChange?.click();
    return { pickerOpened: Boolean(breakfastChange) };
  })()`);
  await wait(600);
  Object.assign(freeChoiceAndReplan, await evaluate(`(() => {
    const filter = [...document.querySelectorAll('.quick-recipe-tabs button')]
      .find((button) => button.innerText.trim() === 'Piatto unico');
    filter?.click();
    return { completeMealFilterFound: Boolean(filter) };
  })()`));
  await wait(600);
  Object.assign(freeChoiceAndReplan, await evaluate(`(() => {
    const recipe = document.querySelector('.recipe-grid article');
    const name = recipe?.querySelector('h3')?.innerText.trim() || '';
    recipe?.click();
    return { completeMealFound: Boolean(recipe), chosenName: name };
  })()`));
  await wait(850);
  Object.assign(freeChoiceAndReplan, await evaluate(`(() => {
    const rows = [...document.querySelectorAll('.week-meal')];
    const forbidden = /pasta|pane|farro|orzo|bulgur|cous cous|cracker|fette biscottate|biscott|wafer|muesli|frumento|segale|grissini|avena/i;
    return {
      breakfastShowsFreeChoice: rows[5]?.innerText.includes(${JSON.stringify(freeChoiceAndReplan.chosenName)}) || false,
      nextDaysGlutenFree: rows.slice(10).length === 25 && rows.slice(10).every((meal) => !forbidden.test(meal.innerText)),
      nextDaysNotBlocked: [...document.querySelectorAll('.week-day')].slice(2).every((day) => !day.querySelector('.week-meal-row.excluded')),
    };
  })()`));
  await page.send('Page.reload', { ignoreCache: false });
  await wait(5_000);
  freeChoiceAndReplan.persistedAfterReload = await evaluate(`document.querySelectorAll('.week-day')[1]?.querySelector('.week-meal')?.innerText.includes(${JSON.stringify(freeChoiceAndReplan.chosenName)}) || false`);
  const rawExceptions = page.events.filter((event) =>
    event.method === "Runtime.exceptionThrown" ||
    (event.method === "Log.entryAdded" && event.params?.entry?.level === "error")
  );
  const exceptions = [];
  for (const event of rawExceptions) {
    const entryText = event.params?.entry?.text || "";
    const entryUrl = event.params?.entry?.url || "";
    const isImageDeliveryError =
      event.method === "Log.entryAdded" &&
      entryText.includes("Failed to load resource") &&
      /\.(?:png|jpe?g|webp|gif)(?:\?|$)/i.test(entryUrl);
    if (isImageDeliveryError) {
      try {
        const separator = entryUrl.includes("?") ? "&" : "?";
        const response = await fetch(`${entryUrl}${separator}auditRetry=${Date.now()}`, {
          cache: "no-store",
        });
        if (response.ok) continue;
      } catch {
        // A failed verification remains a blocking browser error below.
      }
    }
    exceptions.push(event);
  }
  const report = {
    today,
    scrollStability,
    week,
    weeklyConfirmation,
    weeklyPrintPreview,
    recipes,
    recipeDetail,
    recipeCoverage,
    suppliedRecipeGroups,
    recipeScrollY: recipeScroll.scrollY,
    backToday,
    swap,
    swapBottom,
    afterSwapReturn,
    milkAlternatives,
    pickerClosed,
    gramsEdit,
    afterReload,
    shopping,
    weekEditor,
    todayWeekSync,
    extraLog,
    gelatoComposer,
    historyConsent,
    mealRegistration,
    mealPartAddition,
    readyDishFlow,
    checkinAdaptation,
    profileAdaptation,
    freeChoiceAndReplan,
    javascriptErrors: exceptions.length,
    javascriptErrorDetails: exceptions.slice(-8).map((event) => ({
      method: event.method,
      text:
        event.params?.exceptionDetails?.text ||
        event.params?.exceptionDetails?.exception?.description ||
        event.params?.entry?.text ||
        "Errore senza dettaglio",
      url: event.params?.exceptionDetails?.url || event.params?.entry?.url || "",
    })),
  };
  console.log(JSON.stringify(report));
  if (
    !today.version || today.recovery || today.horizontalOverflow || today.brokenViewportImages.length || today.pendingViewportImages.length ||
    !scrollStability.menuUnchanged || !scrollStability.gramsUnchanged || !scrollStability.returnedTop || scrollStability.horizontalOverflow ||
    week.recovery || week.horizontalOverflow || week.brokenViewportImages.length || week.pendingViewportImages.length ||
    !weeklyConfirmation.found || !weeklyConfirmation.locked || !weeklyConfirmation.hasAverage || weeklyConfirmation.calorieDays !== 7 ||
    !weeklyConfirmation.rotationConfirmed || weeklyConfirmation.rotationRows < 7 || !weeklyConfirmation.rotationInRange ||
    !weeklyConfirmation.hasPrintPreview || !weeklyConfirmation.reopened ||
    !weeklyPrintPreview.found || !weeklyPrintPreview.hasUpdatedAverage || weeklyPrintPreview.dayCount !== 7 ||
    weeklyPrintPreview.mealCount < 21 || weeklyPrintPreview.foodRows === 0 || !weeklyPrintPreview.hasAllMacros ||
    !weeklyPrintPreview.hasExports || !weeklyPrintPreview.closeVisible || weeklyPrintPreview.horizontalOverflow || !weeklyPrintPreview.closed ||
    recipes.recovery || recipes.horizontalOverflow || recipes.brokenViewportImages.length || recipes.pendingViewportImages.length ||
    !recipeDetail.found || !recipeDetail.hasIngredients || !recipeDetail.hasPreparation || !recipeDetail.hasNutrition ||
    !recipeDetail.hasAllergens || !recipeDetail.photoLoaded || recipeDetail.horizontalOverflow || !recipeDetail.closed || !recipeCoverage ||
    suppliedRecipeGroups.length !== 4 || suppliedRecipeGroups.some((group) =>
      !group.active || !group.countMatches || group.visibleCards === 0 || !group.firstPhotoLoaded || group.horizontalOverflow
    ) ||
    recipeScroll.brokenViewportImages.length || recipeScroll.pendingViewportImages.length ||
    backToday.recovery || backToday.horizontalOverflow || backToday.brokenViewportImages.length || backToday.pendingViewportImages.length ||
    swap.recovery || swap.horizontalOverflow || swap.brokenViewportImages.length || swap.pendingViewportImages.length || !swapBottom.found || !swapBottom.visible ||
    !swapBottom.hasOccasionalChoices || !swapBottom.hasCompleteChoices ||
    afterSwapReturn.recovery || afterSwapReturn.horizontalOverflow || afterSwapReturn.brokenViewportImages.length || afterSwapReturn.pendingViewportImages.length ||
    !milkAlternatives.found || !milkAlternatives.hasNone || !milkAlternatives.hasSoy ||
    !milkAlternatives.hasOat || !milkAlternatives.hasSkimmed ||
    !milkAlternatives.closeVisible || milkAlternatives.horizontalOverflow || !pickerClosed ||
    !gramsEdit.persisted || afterReload.recovery || afterReload.horizontalOverflow || afterReload.brokenViewportImages.length || afterReload.pendingViewportImages.length ||
    !shopping.found || shopping.itemCount === 0 || !shopping.hasSelectAll || !shopping.hasDeselectAll ||
    shopping.horizontalOverflow || !shopping.allSelected || !shopping.allDeselected || !shopping.closed ||
    !weekEditor.found || !weekEditor.visible || !weekEditor.hasClose || !weekEditor.hasRebalance ||
    weekEditor.horizontalOverflow || !weekEditor.returnedToWeek ||
    !todayWeekSync.found || !todayWeekSync.pickerFound || todayWeekSync.alternatives < 2 ||
    !todayWeekSync.replacementFound || !todayWeekSync.changedInEditor || !todayWeekSync.weekValuePersisted ||
    !todayWeekSync.todayMatchesWeek || todayWeekSync.horizontalOverflow ||
    !extraLog.found || !extraLog.added || !extraLog.hasCalories || !extraLog.hasMacros || !extraLog.removed ||
    !gelatoComposer.found || !gelatoComposer.hasTwoScoops || !gelatoComposer.hasThreeScoops ||
    gelatoComposer.horizontalOverflow || gelatoComposer.flavorSelectors !== 3 || gelatoComposer.flavorOptions < 10 ||
    !gelatoComposer.hasCalculatedCalories || !gelatoComposer.applied || !gelatoComposer.photosLoaded || !gelatoComposer.pickerClosed ||
    !historyConsent.found || !historyConsent.enabled ||
    !mealRegistration.found || !mealRegistration.marked || !mealRegistration.summaryUpdated ||
    !mealRegistration.persisted || !mealRegistration.unmarked || !mealRegistration.summaryReverted ||
    !mealPartAddition.found || !mealPartAddition.pickerFound || !mealPartAddition.addHeading ||
    !mealPartAddition.hasRecommendedChoices || !mealPartAddition.noBlankChoice || !mealPartAddition.closeVisible ||
    mealPartAddition.horizontalOverflow || !mealPartAddition.added || !mealPartAddition.pickerClosed ||
    !mealPartAddition.hasDirectRemove || !mealPartAddition.removed ||
    !readyDishFlow.found || !readyDishFlow.completePickerFound || readyDishFlow.completeOptions < 2 ||
    !readyDishFlow.recipeInfoAvailableBeforeChoice || !readyDishFlow.fullDishApplied ||
    !readyDishFlow.hasRecipeDetail || !readyDishFlow.hasReadyDishChange || !readyDishFlow.hasSplit ||
    !readyDishFlow.detailOpened || !readyDishFlow.detailHasIngredients || !readyDishFlow.detailHasPreparation ||
    !readyDishFlow.detailPhotoLoaded || !readyDishFlow.splitApplied || !readyDishFlow.splitPhotosLoaded ||
    !readyDishFlow.recombineBeforeEdit || !readyDishFlow.recomposed || readyDishFlow.componentAlternatives < 2 ||
    !readyDishFlow.componentReplacementFound || !readyDishFlow.componentChanged ||
    !readyDishFlow.recombineAfterEditHidden || !readyDishFlow.secondReadyDishFound ||
    !readyDishFlow.secondReadyDishApplied || !readyDishFlow.secondDishStillReplaceable ||
    !readyDishFlow.secondDishStillSplittable || readyDishFlow.horizontalOverflow ||
    !checkinAdaptation.found || !checkinAdaptation.bloatingActive || !checkinAdaptation.bloatingNote ||
    !checkinAdaptation.bloatingMenuChanged || !checkinAdaptation.bloatingDinnerAvoidsTriggers ||
    !checkinAdaptation.tiredActive || !checkinAdaptation.tiredNote || !checkinAdaptation.tiredMenuChanged ||
    !checkinAdaptation.poorSleepActive || !checkinAdaptation.poorSleepNote ||
    !checkinAdaptation.intenseActivityActive || !checkinAdaptation.intenseActivityNote || checkinAdaptation.horizontalOverflow ||
    !profileAdaptation.found || !profileAdaptation.cleanProfile || profileAdaptation.recovery ||
    !profileAdaptation.lowTargetSelected || !profileAdaptation.highTargetSelected ||
    profileAdaptation.lowPlanKcal <= 0 || profileAdaptation.highPlanKcal <= profileAdaptation.lowPlanKcal + 300 ||
    !profileAdaptation.targetChangesPlan || !profileAdaptation.highBreakfastHasNoDuplicateDairyOrNuts ||
    !profileAdaptation.maxTargetSelected || profileAdaptation.maxPlanKcal <= profileAdaptation.highPlanKcal + 250 ||
    !profileAdaptation.maxSnackHarmonious || !profileAdaptation.maxSnackNoDoubleCereal || !profileAdaptation.glutenFilterActive ||
    !profileAdaptation.glutenPlanSafe || !profileAdaptation.glutenFilterRestored ||
    !profileAdaptation.lockedWeekConfirmed || !profileAdaptation.lockedWeekReopenedForAllergy ||
    !profileAdaptation.weekGlutenFree || !profileAdaptation.loggedMealPreserved ||
    !profileAdaptation.workBreakfastPractical || !profileAdaptation.workSnacksPractical || !profileAdaptation.homeSelected || !profileAdaptation.contextChangesPlan ||
    profileAdaptation.horizontalOverflow ||
    !freeChoiceAndReplan.pickerOpened || !freeChoiceAndReplan.completeMealFilterFound ||
    !freeChoiceAndReplan.completeMealFound || !freeChoiceAndReplan.breakfastShowsFreeChoice ||
    !freeChoiceAndReplan.nextDaysGlutenFree || !freeChoiceAndReplan.nextDaysNotBlocked ||
    !freeChoiceAndReplan.persistedAfterReload ||
    exceptions.length
  ) process.exitCode = 1;
  page.close();
  browser.close();
} finally {
  spawnSync("C:/Windows/System32/taskkill.exe", [
    "/PID",
    String(child.pid),
    "/T",
    "/F",
  ], { windowsHide: true, stdio: "ignore" });
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await wait(attempt === 0 ? 1_500 : 1_000);
    try {
      rmSync(profile, { recursive: true, force: true });
      break;
    } catch {
      // Edge can retain a short-lived crash-report handle after its process tree exits.
      // A cleanup race must not turn a successful application audit into a failure.
    }
  }
}

