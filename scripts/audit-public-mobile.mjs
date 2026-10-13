import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
  for (let attempt = 0; attempt < 100; attempt += 1) {
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
  const settleViewportImages = () => evaluate(`Promise.all(
    [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      return image.offsetParent !== null && rect.bottom > 0 && rect.top < window.innerHeight;
    }).map((image) => {
      image.loading = 'eager';
      return image.complete ? Promise.resolve() : new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 8000);
      });
    })
  )`);
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
    if (!clicked) throw new Error(`Scheda ${label} non trovata`);
    await wait(1000);
  };

  const today = await snapshot();
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
  await wait(1000);
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
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    input.focus();
    input._valueTracker?.setValue(String(before));
    setter.call(input, String(expected));
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: String(expected) }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.blur();
    return { found: true, label: input.getAttribute('aria-label'), before, expected };
  })()`);
  if (!gramsEdit.found) throw new Error("Grammatura modificabile non trovata");
  await wait(1000);
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
  await clickTab("Oggi");
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
      setTimeout(resolve, 8000);
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
      added: afterAdd === ${mealPartAddition.before} + 1,
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
      removed: afterRemove === ${mealPartAddition.before},
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
  const profileAdaptation = { found: true };
  await changeSelectValue('.compact-config select', 1, '1400');
  Object.assign(profileAdaptation, await evaluate(`(() => {
    const strip = document.querySelector('.today-strip')?.innerText || '';
    const match = strip.match(/piano\s+(\d+)/i);
    return {
      lowTargetSelected: strip.includes('scelto 1400 kcal'),
      lowPlanKcal: Number(match?.[1] || 0),
      lowMenu: [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim()),
    };
  })()`));
  await changeSelectValue('.compact-config select', 1, '2600');
  Object.assign(profileAdaptation, await evaluate(`(() => {
    const strip = document.querySelector('.today-strip')?.innerText || '';
    const match = strip.match(/piano\s+(\d+)/i);
    const highMenu = [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim());
    return {
      highTargetSelected: strip.includes('scelto 2600 kcal'),
      highPlanKcal: Number(match?.[1] || 0),
      highMenu,
      targetChangesPlan: Number(match?.[1] || 0) !== ${profileAdaptation.lowPlanKcal} || JSON.stringify(highMenu) !== JSON.stringify(${JSON.stringify(profileAdaptation.lowMenu)}),
    };
  })()`));
  await changeSelectValue('.cuisine-picker select', 1, 'Lavoro');
  profileAdaptation.workMenu = await evaluate(`[...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim())`);
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
  const exceptions = page.events.filter((event) =>
    event.method === "Runtime.exceptionThrown" ||
    (event.method === "Log.entryAdded" && event.params?.entry?.level === "error")
  );
  const report = {
    today,
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
    extraLog,
    gelatoComposer,
    historyConsent,
    mealRegistration,
    mealPartAddition,
    checkinAdaptation,
    profileAdaptation,
    javascriptErrors: exceptions.length,
  };
  console.log(JSON.stringify(report));
  if (
    !today.version || today.recovery || today.horizontalOverflow || today.brokenViewportImages.length || today.pendingViewportImages.length ||
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
    !checkinAdaptation.found || !checkinAdaptation.bloatingActive || !checkinAdaptation.bloatingNote ||
    !checkinAdaptation.bloatingMenuChanged || !checkinAdaptation.bloatingDinnerAvoidsTriggers ||
    !checkinAdaptation.tiredActive || !checkinAdaptation.tiredNote || !checkinAdaptation.tiredMenuChanged ||
    !checkinAdaptation.poorSleepActive || !checkinAdaptation.poorSleepNote ||
    !checkinAdaptation.intenseActivityActive || !checkinAdaptation.intenseActivityNote || checkinAdaptation.horizontalOverflow ||
    !profileAdaptation.found || !profileAdaptation.lowTargetSelected || !profileAdaptation.highTargetSelected ||
    !profileAdaptation.targetChangesPlan || !profileAdaptation.homeSelected || !profileAdaptation.contextChangesPlan ||
    profileAdaptation.horizontalOverflow ||
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

