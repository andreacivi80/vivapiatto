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
// The old audit gates used only the patch number. At 1.20.0 that reset to
// zero and silently skipped established mobile flows (including Sgarri).
const [versionMajor, versionMinor, versionPatch] = version.split(".").map(Number);
const releasePatch = versionMajor > 1 || versionMinor >= 20 ? 1000 : versionPatch;
const auditBaseUrl = process.argv[2] || process.env.VIVAPIATTO_AUDIT_URL || "https://andreacivi80.github.io/vivapiatto/";
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
  const searchPicker = async (query, expected) => {
    const focused = await evaluate(`(() => {
      const input = document.querySelector('.part-picker-sheet [aria-label="Cerca alimento o piatto"]');
      const scroller = document.querySelector('.part-picker-scroll');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
      input?.focus();
      return Boolean(input);
    })()`);
    if (!focused) return { found: false };
    await page.send('Input.insertText', { text: query });
    await wait(300);
    if (expected.includes('proteine whey')) {
      // The public CDN can take longer than a local preview to deliver all four
      // thumbnails. Re-query the current React nodes after each bounded decode:
      // the picker may replace them while search results are being rendered.
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const loaded = await evaluate(`(() => {
          const images = [...document.querySelectorAll('.picker-search-results .part-choice-grid button')]
            .filter((button) => button.innerText.toLocaleLowerCase('it').includes('proteine whey'))
            .map((button) => button.querySelector('img'));
          images.forEach((image) => { if (image) image.loading = 'eager'; });
          return images.length === 4 && images.every((image) => image?.complete && image.naturalWidth > 0);
        })()`);
        if (loaded) break;
        await evaluate(`Promise.race([
          Promise.all([...document.querySelectorAll('.picker-search-results .part-choice-grid button')]
            .filter((button) => button.innerText.toLocaleLowerCase('it').includes('proteine whey'))
            .map((button) => button.querySelector('img')?.decode().catch(() => {}))),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ])`);
        await wait(300);
      }
    }
    const result = await evaluate(`(() => {
      const sheet = document.querySelector('.part-picker-sheet');
      const results = sheet?.querySelector('.picker-search-results');
      const scroller = sheet?.querySelector('.part-picker-scroll');
      const names = [...(results?.querySelectorAll('.part-choice-grid button span, .complete-meal-select span') || [])]
        .map((node) => node.innerText.trim());
      const wheyImages = [...(results?.querySelectorAll('.part-choice-grid button') || [])]
        .filter((button) => button.innerText.toLocaleLowerCase('it').includes('proteine whey'))
        .map((button) => {
          const image = button.querySelector('img');
          const rect = image?.getBoundingClientRect();
          return { name: button.querySelector('span')?.innerText || '', src: image?.getAttribute('src') || '',
            loaded: Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0),
            visible: Boolean(rect && rect.width > 16 && rect.height > 16),
            complete: image?.complete, naturalWidth: image?.naturalWidth, currentSrc: image?.currentSrc,
            loading: image?.loading, fetchPriority: image?.fetchPriority };
        });
      return {
        found: Boolean(results),
        query: sheet?.querySelector('[aria-label="Cerca alimento o piatto"]')?.value,
        expectedFound: names.some((name) => name.toLocaleLowerCase('it').includes(${JSON.stringify(expected.toLocaleLowerCase('it'))})),
        wheyImages,
        count: names.length,
        resultsAtTop: Boolean(scroller && scroller.scrollTop < 2),
        horizontalOverflow: Boolean(sheet && sheet.scrollWidth > sheet.clientWidth + 1),
      };
    })()`);
    await evaluate(`document.querySelector('.part-picker-sheet [aria-label="Cancella ricerca"]')?.click()`);
    await wait(150);
    result.cleared = await evaluate(`(() => {
      const sheet = document.querySelector('.part-picker-sheet');
      return Boolean(sheet && !sheet.querySelector('.picker-search-results') &&
        sheet.querySelector('[aria-label="Cerca alimento o piatto"]')?.value === '');
    })()`);
    return result;
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
    version: document.querySelector('header.topbar .version')?.innerText.trim() === ${JSON.stringify(`v${version}`)},
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
    appReady = await evaluate(`document.body.innerText.includes('Settimana') && document.querySelector('header.topbar .version')?.innerText.trim() === ${JSON.stringify(`v${version}`)}`);
    if (appReady) break;
    await wait(400);
  }
  if (!appReady) throw new Error("Tavola Mia non ha completato il caricamento entro 20 secondi");

  const today = await snapshot();
  const initialMainBalance = [];
  for (const slot of [2, 4]) {
    const opened = await evaluate(`(() => {
      const card = document.querySelectorAll('.meal-card')[${slot}];
      const split = [...(card?.querySelectorAll('.dish-view-actions button') || [])]
        .find((button) => button.innerText.includes('Dividi in componenti'));
      split?.click();
      return { found: Boolean(card), split: Boolean(split), name: card?.querySelector('h3')?.innerText || '' };
    })()`);
    if (opened.split) await wait(250);
    const checked = await evaluate(`(() => {
      const card = document.querySelectorAll('.meal-card')[${slot}];
      const roles = [...(card?.querySelectorAll('.meal-part .part-change') || [])]
        .map((button) => button.getAttribute('aria-label'));
      const recombine = [...(card?.querySelectorAll('.dish-view-actions button') || [])]
        .find((button) => button.innerText.includes('Ricomponi piatto'));
      recombine?.click();
      return {
        roles,
        complete: roles.includes('Cambia Carboidrato') &&
          (roles.includes('Cambia Proteina') || roles.includes('Cambia Latticino')) &&
          roles.includes('Cambia Contorno'),
      };
    })()`);
    initialMainBalance.push({ slot, ...opened, ...checked });
    if (opened.split) await wait(250);
  }
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
  const weeklySeasonality = await evaluate(`(() => [...document.querySelectorAll('.week-day .week-meal-row')].map((row) => ({
    name: row.querySelector('.week-meal b')?.innerText || '',
    mismatches: Number(row.dataset.seasonMismatches),
  })))()`);
  const weeklyFruitRepeats = Array.from({ length: 7 }, (_, day) =>
    ["mela", "banana", "pera", "kiwi", "uva", "pesca", "nettarina", "mango", "papaya", "albicocca", "ciliegie", "anguria", "melone", "arancia", "fragole"]
      .filter((fruit) => [0, 1, 3].filter((slot) =>
        new RegExp(`\\b${fruit}\\b`, "i").test(weeklySeasonality[day * 5 + slot]?.name || "")).length > 1)
      .map((fruit) => ({ day: day + 1, fruit }))).flat();
  const weeklyMainBalance = await evaluate(`(() => [...document.querySelectorAll('.week-day')].flatMap((day, dayIndex) => {
    const rows = [...day.querySelectorAll('.week-meal-row')];
    return [2, 4].map((slot) => {
      const row = rows[slot];
      const roles = [...(row?.querySelectorAll('.week-part-strip button[aria-label^="Cambia "]') || [])]
        .map((button) => button.getAttribute('aria-label'));
      return {
        day: dayIndex + 1,
        slot,
        name: row?.querySelector('.week-meal b')?.innerText || '',
        found: Boolean(row),
        complete: roles.some((role) => role.startsWith('Cambia Carboidrato:')) &&
          roles.some((role) => role.startsWith('Cambia Proteina:') || role.startsWith('Cambia Latticino:')) &&
          roles.some((role) => role.startsWith('Cambia Contorno:')),
      };
    });
  }))()`);
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
      rotationInRange: (() => {
        const rows = [...(frequency?.querySelectorAll(':scope > div > span') || [])];
        const eggs = rows.find((row) => row.innerText.includes('Uova'));
        return Boolean(eggs?.classList.contains('within-target')) &&
          rows.filter((row) => row !== eggs).every((row) => row.querySelector('small')?.innerText.includes('Pasti pianificati'));
      })(),
      varietyHeader: frequency?.querySelector('header span')?.innerText || '',
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
    const headings = [...(sheet?.querySelector('.print-food-head')?.children || [])].slice(1);
    const values = [...(sheet?.querySelector('.print-food-row')?.children || [])].slice(1);
    const columnsAligned = headings.length === 5 && values.length === 5 && headings.every((heading, index) =>
      getComputedStyle(heading).textAlign === 'right' &&
      Math.abs(heading.getBoundingClientRect().right - values[index].getBoundingClientRect().right) <= 1);
    return {
      found: Boolean(sheet),
      hasUpdatedAverage: text.includes('Media aggiornata'),
      dayCount: sheet?.querySelectorAll('.print-day').length || 0,
      mealCount: sheet?.querySelectorAll('.print-meal').length || 0,
      foodRows: sheet?.querySelectorAll('.print-food-row').length || 0,
      columnsAligned,
      hasAllMacros: ['kcal', 'Proteine', 'Carboidrati', 'Grassi'].every((label) => text.includes(label)),
      hasExports: ['Copia tutto', 'TXT', 'CSV', 'Word', 'Stampa'].every((label) => text.includes(label)),
      closeVisible: Boolean(rect && rect.top >= 0 && rect.bottom <= window.innerHeight),
      horizontalOverflow: Boolean(sheet && sheet.scrollWidth > sheet.clientWidth + 1),
    };
  })()`);
  let printFlow = { skipped: true };
  if (versionMinor >= 20 && versionPatch >= 38) {
    await page.send("Emulation.setEmulatedMedia", { media: "print" });
    const flow = await evaluate(`(() => {
      const sheet = document.querySelector('.print-preview-sheet');
      const backdrop = sheet?.parentElement;
      const meal = sheet?.querySelector('.print-meal');
      const secondDay = sheet?.querySelector('.print-day + .print-day');
      return {
        sheetStatic: getComputedStyle(sheet).position === 'static',
        backdropStatic: getComputedStyle(backdrop).position === 'static',
        sheetNotClipped: getComputedStyle(sheet).overflow === 'visible' && getComputedStyle(sheet).display === 'block',
        mealKeptTogether: getComputedStyle(meal).breakInside === 'avoid',
        dayStartsNewPage: getComputedStyle(secondDay).breakBefore === 'page',
        dayCount: sheet?.querySelectorAll('.print-day').length || 0,
      };
    })()`);
    const pdf = await page.send("Page.printToPDF", { printBackground: true, preferCSSPageSize: true });
    const pdfBytes = Buffer.from(pdf.data, "base64");
    printFlow = { ...flow, pdfBytes: pdfBytes.length,
      pdfPages: (pdfBytes.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length };
    await page.send("Emulation.setEmulatedMedia", { media: "screen" });
  }
  await evaluate(`document.querySelector('[aria-label="Chiudi anteprima stampa"]')?.click()`);
  await wait(300);
  weeklyPrintPreview.closed = await evaluate(`!document.querySelector('.print-preview-sheet')`);
  await evaluate(`(() => {
    const lock = document.querySelector('.week-lock');
    [...(lock?.querySelectorAll('button') || [])].find((button) => button.innerText.trim() === 'Riapri')?.click();
  })()`);
  await wait(300);
  weeklyConfirmation.reopened = await evaluate(`document.querySelector('.week-lock')?.innerText.includes('Settimana modificabile')`);
  const editedWeekExports = { skipped: releasePatch < 40 };
  let editedWordHtml = "";
  if (!editedWeekExports.skipped) {
    editedWeekExports.dayOpened = await evaluate(`(() => {
      const button = document.querySelector('.week-day header button');
      button?.click();
      return Boolean(button);
    })()`);
    await wait(450);
    Object.assign(editedWeekExports, await evaluate(`(() => {
      const input = document.querySelector('.meal-card .part-grams input');
      if (!input) return { gramsInputFound: false };
      const before = Number(input.value);
      const after = before + 10;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, String(after));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return { gramsInputFound: true, before, after };
    })()`));
    await wait(500);
    editedWeekExports.inputUpdated = await evaluate(`Number(document.querySelector('.meal-card .part-grams input')?.value) === ${editedWeekExports.after}`);
    await evaluate(`(() => {
      [...document.querySelectorAll('.week-edit-banner button')]
        .find((button) => button.innerText.trim() === 'Chiudi')?.click();
    })()`);
    await wait(450);
    editedWeekExports.backInWeek = await evaluate(`Boolean(document.querySelector('.week-day') && !document.querySelector('.week-edit-banner'))`);
    await evaluate(`document.querySelector('.print-preview-trigger')?.click()`);
    await wait(450);
    Object.assign(editedWeekExports, await evaluate(`(() => {
      const sheet = document.querySelector('.print-preview-sheet');
      const firstRow = sheet?.querySelector('.print-day .print-food-row');
      return { printDayCount: sheet?.querySelectorAll('.print-day').length || 0,
        printMealCount: sheet?.querySelectorAll('.print-meal').length || 0,
        printFirstGrams: Number(firstRow?.querySelector('b')?.textContent),
        printFirstFood: firstRow?.querySelector('span')?.firstChild?.textContent?.trim() || '' };
    })()`));
    editedWeekExports.word = await evaluate(`(async () => {
      const originalCreate = URL.createObjectURL;
      const originalClick = HTMLAnchorElement.prototype.click;
      let captured = null;
      URL.createObjectURL = function(blob) { captured = blob; return originalCreate.call(URL, blob); };
      HTMLAnchorElement.prototype.click = function() {};
      try {
        const button = [...document.querySelectorAll('.print-preview-actions button')]
          .find((item) => item.innerText.trim() === 'Word');
        button?.click();
        if (!captured) return { found: Boolean(button), captured: false };
        const html = await captured.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const days = [...doc.querySelectorAll('.day')];
        const firstFood = days[0]?.querySelector('.meal .foods tbody tr');
        return { found: Boolean(button), captured: true, html,
          dayCount: days.length,
          mealCount: doc.querySelectorAll('.meal').length,
          firstGrams: Number(firstFood?.children[1]?.textContent.replace(' g', '')),
          groupedMeal: Boolean(days[0]?.querySelector('.meal > tbody > tr[style*="mso-row-split:avoid"]')),
          followingDaysStartNewPage: days.slice(1).every((day) => day.querySelector('h2')?.style.pageBreakBefore === 'always') };
      } finally {
        URL.createObjectURL = originalCreate;
        HTMLAnchorElement.prototype.click = originalClick;
      }
    })()`);
    editedWordHtml = editedWeekExports.word.html || "";
    delete editedWeekExports.word.html;
    await evaluate(`document.querySelector('[aria-label="Chiudi anteprima stampa"]')?.click()`);
    await wait(300);
  }
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
  const wheyShakerRecipes = { skipped: releasePatch < 39 };
  if (!wheyShakerRecipes.skipped) {
    await evaluate(`(() => { const input = document.querySelector('.library-tools input'); input.focus(); input.select(); })()`);
    await page.send("Input.insertText", { text: "Shaker whey" });
    await wait(450);
    await evaluate(`(() => {
      [...document.querySelectorAll('.recipe-grid article img')].forEach((image) => { image.loading = 'eager'; });
    })()`);
    await wait(850);
    Object.assign(wheyShakerRecipes, await evaluate(`(() => {
      const cards = [...document.querySelectorAll('.recipe-grid article')]
        .filter((card) => card.querySelector('h3')?.textContent?.startsWith('Shaker whey'));
      return {
        count: cards.length,
        photos: cards.map((card) => {
          const image = card.querySelector('img');
          return { name: card.querySelector('h3')?.textContent, src: image?.currentSrc || image?.src,
            loaded: Boolean(image?.complete && image.naturalWidth > 0) };
        }),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    })()`));
    await evaluate(`(() => { const input = document.querySelector('.library-tools input'); input.focus(); input.select(); })()`);
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
    await wait(300);
  }
  const recipeCardFit = [];
  if (releasePatch >= 83) {
    for (const width of [320, 390]) {
      await page.send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: true });
      for (const name of ["Coscia di pollo arrosto con verza e polenta", "Petto di pollo arrosto con patate e catalogna"]) {
        await evaluate(`(() => { const input = document.querySelector('.library-tools input'); input.focus(); input.select(); })()`);
        await page.send("Input.insertText", { text: name });
        await wait(350);
        recipeCardFit.push(await evaluate(`(() => {
          const card = [...document.querySelectorAll('.recipe-grid article')].find((item) => item.querySelector('h3')?.textContent === ${JSON.stringify(name)});
          if (!card) return { width: ${width}, name: ${JSON.stringify(name)}, found: false };
          const quality = card.querySelector('.recipe-card-quality');
          const cardRect = card.getBoundingClientRect();
          const qualityRect = quality?.getBoundingClientRect();
          return {
            width: ${width}, name: ${JSON.stringify(name)}, found: true,
            cardHeight: Math.round(cardRect.height),
            textInside: Boolean(qualityRect && qualityRect.right <= cardRect.right + 1 && qualityRect.bottom <= cardRect.bottom + 1),
            noInternalOverflow: card.scrollWidth <= card.clientWidth + 1 && card.scrollHeight <= card.clientHeight + 1,
            noPageOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          };
        })()`));
      }
    }
    await page.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate(`(() => { const input = document.querySelector('.library-tools input'); input.focus(); input.select(); })()`);
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
    await wait(300);
  }
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
  const occasionalLibrary = { skipped: releasePatch < 85 };
  if (!occasionalLibrary.skipped) {
    Object.assign(occasionalLibrary, await evaluate(`(() => {
      const button = [...document.querySelectorAll('.cuisine-tabs button')]
        .find((item) => item.innerText.trim() === 'Sgarri');
      button?.click();
      return { tabFound: Boolean(button) };
    })()`));
    await wait(350);
    Object.assign(occasionalLibrary, await evaluate(`(() => ({
      quickFilterReset: Boolean([...document.querySelectorAll('.quick-recipe-tabs button')]
        .find((item) => item.innerText.trim() === 'Tutti' && item.classList.contains('active'))),
      choicesVisible: document.querySelectorAll('.recipe-grid article').length > 0,
    }))()`));
    await evaluate(`(() => { const input = document.querySelector('.library-tools input'); input.focus(); input.select(); })()`);
    await page.send("Input.insertText", { text: "Pizza margherita" });
    await wait(350);
    occasionalLibrary.pizzaVisible = await evaluate(`Boolean([...document.querySelectorAll('.recipe-grid article h3')].find((item) => item.innerText.includes('Pizza margherita')))`);
    await evaluate(`(() => { const button = [...document.querySelectorAll('.cuisine-tabs button')].find((item) => item.innerText.trim() === 'Tutte'); button?.click(); })()`);
    await evaluate(`(() => { const input = document.querySelector('.library-tools input'); input.focus(); input.select(); })()`);
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
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
  const searchTodayAlternative = await searchPicker('el', 'mela');
  const searchTodayPompelmo = await searchPicker('pelmo', 'pompelmo');
  const searchTodayProtein = await searchPicker('pro', 'proteine whey');
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
  const openedWeekAdd = await evaluate(`(() => {
    const button = document.querySelector('.meal-card .add-part-compact, .week-part-add, .week-empty-add');
    button?.click();
    return Boolean(button);
  })()`);
  await wait(300);
  const searchWeekAdd = openedWeekAdd ? await searchPicker('wi', 'kiwi') : { found: false };
  const searchWeekProtein = openedWeekAdd ? await searchPicker('pro', 'proteine whey') : { found: false };
  await evaluate(`document.querySelector('.part-picker-sheet [aria-label="Chiudi alternative"]')?.click()`);
  await wait(300);
  const todayWeekSync = await evaluate(`(() => {
    const card = document.querySelector('.meal-card');
    const part = card?.querySelector('.meal-part .part-change');
    if (!part) return { found: false };
    const before = part.innerText.replace('Alternative', '').trim();
    part.click();
    return { found: true, before };
  })()`);
  await wait(500);
  const searchWeekAlternative = await searchPicker('el', 'mela');
  const searchWeekAlbicocca = await searchPicker('cocc', 'albicocche');
  const searchWeekAlternativeProtein = await searchPicker('pro', 'proteine whey');
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
  mealRegistration.persisted = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await wait(500);
    try {
      const restored = await evaluate(`(() => {
        const button = document.querySelectorAll('.meal-card')[1]?.querySelector('.check');
        const summary = document.querySelector('.actual-day-summary');
        return {
          buttonDone: Boolean(button?.classList.contains('done')),
          summaryText: summary?.innerText || '',
        };
      })()`);
      mealRegistration.afterReloadButtonDone = restored.buttonDone;
      mealRegistration.afterReloadSummary = restored.summaryText;
      mealRegistration.persisted = restored.buttonDone && restored.summaryText.includes('1/5 registrati');
    } catch {
      // The previous JavaScript context may still be closing during reload.
    }
    if (mealRegistration.persisted) break;
  }
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
  const searchTodayAdd = await searchPicker('wi', 'kiwi');
  const searchTodayAddProtein = await searchPicker('pro', 'proteine whey');
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
  const occasionalAddition = { skipped: releasePatch < 83 };
  if (!occasionalAddition.skipped) {
    Object.assign(occasionalAddition, await evaluate(`(() => {
      const card = document.querySelectorAll('.meal-card')[2];
      const before = card?.querySelectorAll('.meal-part').length ?? 0;
      card?.querySelector('.add-part-compact')?.click();
      return { before, addOpened: Boolean(card) };
    })()`));
    await wait(400);
    Object.assign(occasionalAddition, await evaluate(`(() => {
      const picker = document.querySelector('.part-picker-sheet');
      const shortcut = picker?.querySelector('.part-picker-shortcuts button');
      const shortcutVisible = Boolean(shortcut && shortcut.getBoundingClientRect().height > 0);
      shortcut?.click();
      const group = picker?.querySelector('.cheat-picker-group');
      if (group && !group.open && ${releasePatch < 85}) group.open = true;
      const pizza = [...(group?.querySelectorAll('.complete-meal-select') || [])]
        .find((button) => button.innerText.includes('Pizza margherita'));
      const variantImages = [
        ['Pizza con bresaola, rucola e grana', 'v12023'], ['Pizza ai quattro formaggi', 'v12023'],
        ['Pizza alla diavola', 'v12023'], ['Pizza capricciosa', 'v12023'],
      ];
      if (${versionMinor >= 20 && versionPatch >= 26}) variantImages.push(
        ['Pizza prosciutto cotto e funghi', 'v12026'], ['Pizza tonno e cipolla', 'v12026']);
      if (${versionMinor >= 20 && versionPatch >= 27}) variantImages.push(
        ['Pizza marinara fatta in casa', 'v12023']);
      if (${versionMinor >= 20 && versionPatch >= 29}) variantImages.push(
        ["Pizza all'ortolana fatta in casa", 'v12029']);
      if (${versionMinor >= 20 && versionPatch >= 30}) variantImages.push(
        ['Pizza con acciughe, broccoletti e pinoli', 'v12030']);
      if (${versionMinor >= 20 && versionPatch >= 31}) variantImages.push(
        ['Pizza bianca con patate e rosmarino', 'v12031']);
      const pizzaVariants = variantImages.every(([name, imageVersion]) => [...(group?.querySelectorAll('.complete-meal-select') || [])]
        .some((button) => button.innerText.includes(name) && button.querySelector('img')?.src.includes(imageVersion)));
      const pizzaVariantsShowWholeDish = variantImages.every(([name]) => [...(group?.querySelectorAll('.complete-meal-select') || [])]
        .some((button) => button.innerText.includes(name) &&
          button.querySelector('.recipe-visual-single img, img.recipe-visual-single')?.src.includes('cheat-pizza-') &&
          !button.querySelector('.recipe-visual-parts')));
      const hamburger = [...(group?.querySelectorAll('.complete-meal-select') || [])]
        .find((button) => button.innerText.includes('Hamburger semplice fatto in casa'));
      const carbonara = [...(group?.querySelectorAll('.complete-meal-select') || [])]
        .find((button) => button.innerText.includes('Spaghetti alla carbonara'));
      const amatriciana = [...(group?.querySelectorAll('.complete-meal-select') || [])]
        .find((button) => button.innerText.includes("Bucatini all'amatriciana"));
      const result = {
        visibleWithPlus: Boolean(group),
        shortcutVisible,
        shortcutOpenedSgarri: Boolean(group?.open),
        pizzaAvailable: Boolean(pizza),
        pizzaVariants,
        pizzaVariantsShowWholeDish,
        hamburgerWholeDish: Boolean(hamburger?.querySelector('img.recipe-visual-single')?.src.includes('hamburger-homemade-wholegrain-v12025') &&
          !hamburger?.querySelector('.recipe-visual-parts')),
        carbonaraWholeDish: Boolean(carbonara?.querySelector('img.recipe-visual-single')?.src.includes('cheat-carbonara-v11619') &&
          !carbonara?.querySelector('.recipe-visual-parts')),
        amatricianaWholeDish: Boolean(amatriciana?.querySelector('img.recipe-visual-single')?.src.includes('cheat-amatriciana-v11625') &&
          !amatriciana?.querySelector('.recipe-visual-parts')),
        freeChoiceAlsoAvailable: Boolean(picker?.querySelector('.part-choice-grid.free')),
      };
      pizza?.click();
      return result;
    })()`));
    await wait(800);
    Object.assign(occasionalAddition, await evaluate(`(() => {
      const card = document.querySelectorAll('.meal-card')[2];
      const parts = [...(card?.querySelectorAll('.meal-part') || [])];
      const pizza = parts.find((part) => part.innerText.includes('Pizza margherita'));
      const result = {
        appended: parts.length === ${occasionalAddition.before} + 1,
        pizzaPhoto: Boolean(pizza?.querySelector('img[src*="pizza-margherita"]')),
        pizzaWholeWithSplit: Boolean(pizza?.classList.contains('occasional-whole') &&
          pizza?.querySelector('button.occasional-split') &&
          !pizza?.querySelector('input')),
        pickerClosed: !document.querySelector('.part-picker-sheet'),
        originalPartsKept: parts.length > 1,
      };
      if (${releasePatch >= 84}) pizza?.querySelector('.part-change')?.click();
      else pizza?.querySelector('.part-remove')?.click();
      return result;
    })()`));
    if (releasePatch >= 84) {
      await wait(350);
      Object.assign(occasionalAddition, await evaluate(`(() => {
        const group = document.querySelector('.part-picker-sheet .cheat-picker-group');
        if (group) group.open = true;
        const tiramisu = [...(group?.querySelectorAll('.complete-meal-select') || [])]
          .find((button) => button.innerText.includes('Tiramisù'));
        const result = { replacementAvailable: Boolean(tiramisu) };
        tiramisu?.click();
        return result;
      })()`));
      await wait(600);
      Object.assign(occasionalAddition, await evaluate(`(() => {
        const card = document.querySelectorAll('.meal-card')[2];
        const parts = [...(card?.querySelectorAll('.meal-part') || [])];
        const tiramisu = parts.find((part) => part.innerText.includes('Tiramisù'));
        const result = {
          replacementKeptMeal: parts.length === ${occasionalAddition.before} + 1,
          oldPizzaGone: !parts.some((part) => part.innerText.includes('Pizza margherita')),
          tiramisuPhoto: Boolean(tiramisu?.querySelector('img[src*="cheat-tiramisu"]')),
        };
        tiramisu?.querySelector('.part-remove')?.click();
        return result;
      })()`));
    }
    await wait(600);
    Object.assign(occasionalAddition, await evaluate(`(() => ({
      removedDirectly: document.querySelectorAll('.meal-card')[2]?.querySelectorAll('.meal-part').length === ${occasionalAddition.before}
    }))()`));
    if (versionMinor >= 20 && versionPatch >= 46) {
      await evaluate(`(() => {
        const card = document.querySelectorAll('.meal-card')[2];
        card?.querySelector('.add-part-compact')?.click();
      })()`);
      await wait(350);
      await evaluate(`document.querySelector('.part-picker-sheet .part-picker-shortcuts button')?.click()`);
      await wait(350);
      Object.assign(occasionalAddition, await evaluate(`(() => {
        const picker = document.querySelector('.part-picker-sheet');
        const group = picker?.querySelector('.cheat-picker-group');
        if (group) group.open = true;
        const pizza = [...(group?.querySelectorAll('.complete-meal-select') || [])]
          .find((button) => button.innerText.includes('Pizza con bresaola, rucola e grana'));
        pizza?.click();
        return { bresaolaChoiceFound: Boolean(pizza) };
      })()`));
      await wait(600);
      Object.assign(occasionalAddition, await evaluate(`(() => {
        const card = document.querySelectorAll('.meal-card')[2];
        const whole = card?.querySelector('.meal-part.occasional-whole');
        const result = {
          bresaolaWhole: Boolean(whole?.innerText.includes('Pizza con bresaola, rucola e grana') &&
            whole.querySelector('img')?.src.includes('cheat-pizza-bresaola-rucola-grana') &&
            card.querySelectorAll('.meal-part').length === ${occasionalAddition.before} + 1),
          splitAvailable: Boolean(whole?.querySelector('.occasional-split')),
        };
        return result;
      })()`));
      await page.send('Page.reload', { ignoreCache: false });
      for (let attempt = 0; attempt < 40; attempt += 1) {
        occasionalAddition.bresaolaPersisted = await evaluate(`Boolean(document.querySelectorAll('.meal-card')[2]?.querySelector('.meal-part.occasional-whole img[src*="cheat-pizza-bresaola-rucola-grana"]'))`);
        if (occasionalAddition.bresaolaPersisted) break;
        await wait(250);
      }
      await evaluate(`document.querySelectorAll('.meal-card')[2]?.querySelector('.meal-part.occasional-whole .occasional-split')?.click()`);
      await wait(350);
      occasionalAddition.bresaolaSplit = await evaluate(`(() => {
        const card = document.querySelectorAll('.meal-card')[2];
        return !card?.querySelector('.meal-part.occasional-whole') &&
          card?.querySelectorAll('.meal-part').length === ${occasionalAddition.before} + 4;
      })()`);
      for (let part = 0; part < 4; part += 1) {
        await evaluate(`(() => {
          const parts = [...(document.querySelectorAll('.meal-card')[2]?.querySelectorAll('.meal-part') || [])];
          parts.at(-1)?.querySelector('.part-remove')?.click();
        })()`);
        await wait(100);
      }
      occasionalAddition.bresaolaRemoved = await evaluate(`document.querySelectorAll('.meal-card')[2]?.querySelectorAll('.meal-part').length === ${occasionalAddition.before}`);
    }
    if (versionMinor >= 20 && versionPatch >= 48) {
      occasionalAddition.wholePizzaVariants = [];
      for (const name of [
        'Pizza marinara fatta in casa', "Pizza all'ortolana fatta in casa",
        'Pizza con acciughe, broccoletti e pinoli', 'Pizza bianca con patate e rosmarino',
        'Pizza con bresaola, rucola e grana', 'Pizza ai quattro formaggi',
        'Pizza alla diavola', 'Pizza capricciosa',
        'Pizza prosciutto cotto e funghi', 'Pizza tonno e cipolla',
      ]) {
        await evaluate(`document.querySelectorAll('.meal-card')[2]?.querySelector('.add-part-compact')?.click()`);
        await wait(180);
        await evaluate(`document.querySelector('.part-picker-sheet .part-picker-shortcuts button')?.click()`);
        await wait(180);
        const found = await evaluate(`(() => {
          const group = document.querySelector('.part-picker-sheet .cheat-picker-group');
          if (group) group.open = true;
          const button = [...(group?.querySelectorAll('.complete-meal-select') || [])]
            .find((candidate) => candidate.querySelector('span')?.textContent?.trim() === ${JSON.stringify(name)});
          button?.click();
          return Boolean(button);
        })()`);
        await wait(260);
        const result = await evaluate(`(() => {
          const card = document.querySelectorAll('.meal-card')[2];
          const whole = [...(card?.querySelectorAll('.meal-part.occasional-whole') || [])]
            .find((part) => part.querySelector('.part-change')?.textContent?.includes(${JSON.stringify(name)}));
          const result = {
            singleCard: Boolean(whole && card.querySelectorAll('.meal-part').length === ${occasionalAddition.before} + 1),
            wholePhoto: Boolean(whole?.querySelector('img')?.src.includes('cheat-pizza-')),
            canSplit: Boolean(whole?.querySelector('.occasional-split')),
          };
          whole?.querySelector('.part-remove')?.click();
          return result;
        })()`);
        await wait(100);
        occasionalAddition.wholePizzaVariants.push({ name, found, ...result });
      }
      const originalProfile = await evaluate(`localStorage.getItem('vivapiatto-v1')`);
      await evaluate(`(() => {
        const saved = JSON.parse(localStorage.getItem('vivapiatto-v1') || '{}');
        saved.partSelections = saved.partSelections || {};
        saved.mealView = saved.mealView || {};
        saved.partSelections['0-2'] = [
          { food: 'Pizza Napoletana Margherita STG', grams: 340 },
          { food: 'Bresaola', grams: 65 },
          { food: 'Rucola', grams: 20 },
          { food: 'Parmigiano Reggiano DOP', grams: 15 },
        ];
        saved.mealView['0-2'] = 'parts';
        localStorage.setItem('vivapiatto-v1', JSON.stringify(saved));
      })()`);
      await page.send('Page.reload', { ignoreCache: false });
      for (let attempt = 0; attempt < 40; attempt += 1) {
        occasionalAddition.legacyPizzaRestored = await evaluate(`Boolean(document.querySelectorAll('.meal-card')[2]?.querySelector('.meal-part.occasional-whole img[src*="cheat-pizza-bresaola-rucola-grana"]'))`);
        if (occasionalAddition.legacyPizzaRestored) break;
        await wait(250);
      }
      if (versionPatch >= 55) {
        occasionalAddition.legacyPizzaGramsPreserved = await evaluate(`(() => {
          const saved = JSON.parse(localStorage.getItem('vivapiatto-v1') || '{}');
          const parts = saved.partSelections?.['0-2'] || [];
          return parts.map((part) => part.grams).join(',') === '340,65,20,15' &&
            parts.every((part) => part.occasionalCollapsed === true && part.occasionalGroupId);
        })()`);
        await evaluate(`(() => {
          const saved = JSON.parse(localStorage.getItem('vivapiatto-v1') || '{}');
          saved.partSelections['0-2'] = saved.partSelections['0-2'].map((part) => ({
            ...part, occasionalGroupId: 'explicit-user-split',
            occasionalRecipeId: 'occasional-pizza-bresaola-rucola-grana',
            occasionalCollapsed: false,
          }));
          localStorage.setItem('vivapiatto-v1', JSON.stringify(saved));
        })()`);
        await page.send('Page.reload', { ignoreCache: false });
        for (let attempt = 0; attempt < 40; attempt += 1) {
          if (await evaluate(`document.querySelectorAll('.meal-card').length === 5`)) break;
          await wait(250);
        }
        occasionalAddition.explicitPizzaSplitPreserved = await evaluate(`(() => {
          const card = document.querySelectorAll('.meal-card')[2];
          return Boolean(card && !card.querySelector('.meal-part.occasional-whole') &&
            card.querySelectorAll('.meal-part').length === 4);
        })()`);
      }
      await evaluate(`localStorage.setItem('vivapiatto-v1', ${JSON.stringify(originalProfile)})`);
      await page.send('Page.reload', { ignoreCache: false });
      for (let attempt = 0; attempt < 40; attempt += 1) {
        if (await evaluate(`document.querySelectorAll('.meal-card').length === 5`)) break;
        await wait(250);
      }
      if (versionPatch >= 54) {
        await evaluate(`document.querySelectorAll('.meal-card')[2]?.querySelector('.meal-part .part-change')?.click()`);
        await wait(180);
        occasionalAddition.weekWholePizzaChosen = await evaluate(`(() => {
          const group = document.querySelector('.part-picker-sheet .cheat-picker-group');
          if (group) group.open = true;
          const choice = [...(group?.querySelectorAll('.complete-meal-select') || [])]
            .find((button) => button.querySelector('span')?.textContent?.trim() === 'Pizza con bresaola, rucola e grana');
          choice?.click();
          return Boolean(choice);
        })()`);
        await wait(350);
        await clickTab('Settimana');
        occasionalAddition.weekWholePizza = await evaluate(`(() => {
          const row = document.querySelector('.week-meal-row[data-recipe-id="occasional-pizza-bresaola-rucola-grana"]');
          return Boolean(row?.querySelector('.week-whole-pizza img[src*="cheat-pizza-bresaola-rucola-grana"]') &&
            row.querySelectorAll('.week-part-strip button:not(.week-part-add)').length === 1 &&
            row.querySelector('.week-meal b')?.textContent?.trim() === 'Pizza con bresaola, rucola e grana');
        })()`);
        await evaluate(`localStorage.setItem('vivapiatto-v1', ${JSON.stringify(originalProfile)})`);
        await page.send('Page.reload', { ignoreCache: false });
        for (let attempt = 0; attempt < 40; attempt += 1) {
          if (await evaluate(`document.querySelectorAll('.meal-card').length === 5`)) break;
          await wait(250);
        }
      }
    }
  }
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
  const occasionalSplitPhoto = { skipped: releasePatch < 84 };
  if (!occasionalSplitPhoto.skipped) {
    await evaluate(`(() => {
      const card = document.querySelectorAll('.meal-card')[2];
      [...(card?.querySelectorAll('.dish-view-actions button') || [])]
        .find((button) => button.innerText.includes('Dividi in componenti'))?.click();
    })()`);
    await wait(350);
    await evaluate(`document.querySelectorAll('.meal-card')[2]?.querySelector('.meal-part .part-change')?.click()`);
    await wait(350);
    Object.assign(occasionalSplitPhoto, await evaluate(`(() => {
      const group = document.querySelector('.part-picker-sheet .cheat-picker-group');
      if (group) group.open = true;
      const tiramisu = [...(group?.querySelectorAll('.complete-meal-select') || [])]
        .find((button) => button.innerText.includes('Tiramisù'));
      const result = { optionFound: Boolean(tiramisu) };
      tiramisu?.click();
      return result;
    })()`));
    await wait(500);
    await evaluate(`(() => {
      const card = document.querySelectorAll('.meal-card')[2];
      [...(card?.querySelectorAll('.dish-view-actions button') || [])]
        .find((button) => button.innerText.includes('Modifica porzione'))?.click();
    })()`);
    await wait(400);
    Object.assign(occasionalSplitPhoto, await evaluate(`(() => {
      const card = document.querySelectorAll('.meal-card')[2];
      const part = [...(card?.querySelectorAll('.meal-part') || [])]
        .find((item) => /tiramis/i.test(item.innerText));
      const image = part?.querySelector('img');
      return {
        componentFound: Boolean(part),
        dedicatedPhoto: Boolean(image?.src.includes('cheat-tiramisu')),
        breadFallbackAbsent: Boolean(image && !image.src.includes('part-bread')),
        editable: Boolean(part?.querySelector('input')),
      };
    })()`));
  }
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
  profileAdaptation.lowWorkSnacksCompact = [profileAdaptation.lowMenu[1], profileAdaptation.lowMenu[3]]
    .every((heading) => ((heading || '').match(/carot|finocch|cetriol|ravanell|sedano/gi) || []).length < 2);
  await changeSelectValue('.compact-config select', 1, '2600');
  Object.assign(profileAdaptation, await evaluate(`(() => {
    const strip = document.querySelector('.today-strip')?.innerText || '';
    const planText = document.querySelector('.today-strip b')?.textContent || '';
    const planSegment = planText.toLowerCase().split('piano ')[1]?.split(' · ')[0] || '';
    const visiblePlanKcal = Number(planSegment.replaceAll('.', '').replaceAll(',', '').trim());
    const highMenu = [...document.querySelectorAll('.meal-card h3')].map((heading) => heading.innerText.trim());
    const breakfastFoods = (highMenu[0] || '').split(' · ').slice(1).join(' · ').split(', ');
    const dairyFoods = breakfastFoods.filter((food) => /latte|yogurt|skyr|kefir|ricotta|cottage|budino proteico/i.test(food));
    const dairyCount = dairyFoods.length;
    const milkAndRicotta = dairyCount === 2 && dairyFoods.some((food) => /latte/i.test(food)) && dairyFoods.some((food) => /ricotta/i.test(food));
    const nutCount = breakfastFoods.filter((food) => /noci|nocciole|mandorle|pistacchi|arachidi|anacardi|semi di/i.test(food)).length;
    return {
      highTargetSelected: strip.includes('scelto 2600 kcal'),
      highPlanText: planText,
      highPlanKcal: visiblePlanKcal,
      highMenu,
      highBreakfastHasNoDuplicateDairyOrNuts: (dairyCount <= 1 || milkAndRicotta) && nutCount <= 1,
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
  profileAdaptation.workBreakfastFamiliar = /latte|fette biscottate|yogurt greco|cracker integrali/i.test(profileAdaptation.workMenu[0] || '');
  profileAdaptation.workSnacksPractical = [profileAdaptation.workMenu[1], profileAdaptation.workMenu[3]]
    .every((heading) => !/wafer|grissini/i.test(heading || ''));
  profileAdaptation.workSnacksNoPrepVegetables = [profileAdaptation.workMenu[1], profileAdaptation.workMenu[3]]
    .every((heading) => !/rucola|pomodor|carot|finocch|cetriol|ravanell/i.test(heading || ''));
  profileAdaptation.workDrinkSnacksNotRepeated = [profileAdaptation.workMenu[1], profileAdaptation.workMenu[3]]
    .filter((heading) => /frullato|smoothie|shaker whey/i.test(heading || '')).length <= 1;
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
  await clickTab('Progressi');
  profileAdaptation.historyConsentReenabled = await evaluate(`(() => {
    const input = document.querySelector('.history-consent input[type="checkbox"]');
    if (!input) return false;
    if (!input.checked) input.click();
    return input.checked;
  })()`);
  await wait(350);
  await clickTab('Oggi');
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
    const open = document.querySelectorAll('.week-day')[1]?.querySelector('header button');
    open?.click();
    return { editorOpened: Boolean(open) };
  })()`);
  await wait(500);
  Object.assign(freeChoiceAndReplan, await evaluate(`(() => {
    const card = document.querySelector('.meal-card');
    const grams = card?.querySelector('.meal-part input[type="number"]');
    const log = card?.querySelector('.check');
    grams?.focus();
    grams?.select();
    return { editablePartFound: Boolean(grams), registrationFound: Boolean(log) };
  })()`));
  if (!freeChoiceAndReplan.editablePartFound) throw new Error('Componente della colazione del secondo giorno non trovato');
  await page.send('Input.insertText', { text: '777' });
  await evaluate(`document.activeElement?.blur()`);
  await wait(500);
  Object.assign(freeChoiceAndReplan, await evaluate(`(() => {
    const card = document.querySelector('.meal-card');
    const grams = card?.querySelector('.meal-part input[type="number"]');
    const log = card?.querySelector('.check');
    const edited = Number(grams?.value) === 777;
    log?.click();
    return { editedBeforeSwap: edited, loggedBeforeSwap: Boolean(log) };
  })()`));
  await wait(400);
  await evaluate(`(() => {
    [...document.querySelectorAll('.bottom-nav button')]
      .find((button) => button.innerText.includes('Settimana'))?.click();
  })()`);
  await wait(550);
  Object.assign(freeChoiceAndReplan, await evaluate(`(() => {
    const secondDay = document.querySelectorAll('.week-day')[1];
    const breakfastChange = secondDay?.querySelector('.week-meal-row .week-change');
    breakfastChange?.click();
    return { pickerOpened: Boolean(breakfastChange) };
  })()`));
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
    const id = recipe?.dataset.recipeId || '';
    recipe?.click();
    return { completeMealFound: Boolean(recipe && id), chosenName: name, chosenId: id };
  })()`));
  await wait(850);
  Object.assign(freeChoiceAndReplan, await evaluate(`(() => {
    const rows = [...document.querySelectorAll('.week-meal')];
    const forbidden = /pasta|pane|farro|orzo|bulgur|cous cous|cracker|fette biscottate|biscott|wafer|muesli|frumento|segale|grissini|avena/i;
    return {
      oldGramsCleared: !document.querySelectorAll('.week-day')[1]?.querySelector('.week-part-strip')?.innerText.includes('777'),
      mealUnregisteredAfterSwap: rows[5]?.querySelector('i')?.innerText.trim() === '→',
      nextDaysGlutenFree: rows.slice(10).length === 25 && rows.slice(10).every((meal) => !forbidden.test(meal.innerText)),
      nextDaysNotBlocked: [...document.querySelectorAll('.week-day')].slice(2).every((day) => !day.querySelector('.week-meal-row.excluded')),
    };
  })()`));
  await evaluate(`document.querySelectorAll('.week-day')[1]?.querySelector('header button')?.click()`);
  await wait(500);
  freeChoiceAndReplan.breakfastShowsFreeChoice = await evaluate(`document.querySelector('.meal-card')?.dataset.recipeId === ${JSON.stringify(freeChoiceAndReplan.chosenId)}`);
  await evaluate(`(() => {
    [...document.querySelectorAll('.bottom-nav button')]
      .find((button) => button.innerText.includes('Settimana'))?.click();
  })()`);
  await wait(450);
  await page.send('Page.reload', { ignoreCache: false });
  // Wait for the saved week to hydrate, not merely for a fixed wall-clock delay.
  // A public navigation can be slower than localhost without losing any data.
  freeChoiceAndReplan.persistedAfterReload = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await wait(500);
    const restored = await evaluate(`(() => {
      const rows = document.querySelectorAll('.week-day')[1]?.querySelectorAll('.week-meal-row');
      return {
        weekFound: Boolean(rows?.length),
        chosenFound: rows?.[0]?.dataset.recipeId === ${JSON.stringify(freeChoiceAndReplan.chosenId)},
      };
    })()`);
    if (restored.weekFound && restored.chosenFound) {
      await evaluate(`document.querySelectorAll('.week-day')[1]?.querySelector('header button')?.click()`);
      for (let editorAttempt = 0; editorAttempt < 10; editorAttempt += 1) {
        await wait(300);
        freeChoiceAndReplan.persistedAfterReload = await evaluate(`document.querySelector('.meal-card')?.dataset.recipeId === ${JSON.stringify(freeChoiceAndReplan.chosenId)}`);
        if (freeChoiceAndReplan.persistedAfterReload) break;
      }
      break;
    }
  }
  await evaluate(`(() => {
    if (!document.querySelector('.preferences'))
      [...document.querySelectorAll('.today-strip-actions button')]
        .find((button) => button.innerText.includes('Preferenze'))?.click();
  })()`);
  await wait(350);
  const setPreference = async (label, value) => {
    const opened = await evaluate(`(() => {
      if (document.querySelector('.preferences')) return true;
      const toggle = [...document.querySelectorAll('.today-strip-actions button')]
        .find((button) => button.innerText.includes('Preferenze'));
      toggle?.click();
      return Boolean(toggle);
    })()`);
    if (!opened) throw new Error(`Pannello preferenze non disponibile per ${label}`);
    await wait(250);
    const found = await evaluate(`(() => {
      const field = [...document.querySelectorAll('.preferences label')]
        .find((item) => item.querySelector('span')?.innerText.trim() === ${JSON.stringify(label)});
      const select = field?.querySelector('select');
      if (!select) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(select, ${JSON.stringify(value)});
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!found) throw new Error(`Preferenza ${label} non trovata`);
    await wait(350);
  };
  const confirmedProfileReplan = { skipped: releasePatch < 76 };
  if (!confirmedProfileReplan.skipped) {
    await clickTab('Settimana');
    Object.assign(confirmedProfileReplan, await evaluate(`(() => {
      const rows = [...document.querySelectorAll('.week-meal-row')];
      const recordedPosition = rows.findIndex((row) => row.dataset.completed === 'true');
      const recordedId = rows[recordedPosition]?.dataset.recipeId || '';
      const confirm = [...document.querySelectorAll('.week-lock button')]
        .find((button) => button.innerText.trim() === 'Conferma');
      confirm?.click();
      return { recordedId, recordedPosition, confirmAvailable: Boolean(confirm && !confirm.disabled) };
    })()`));
    await wait(450);
    confirmedProfileReplan.lockedBeforeStyleChange = await evaluate(`document.querySelector('.week-lock')?.innerText.includes('Settimana confermata') || false`);
    await clickTab('Oggi');
    await setPreference('Stile alimentare', 'Vegetariano');
    await wait(1_200);
    await clickTab('Settimana');
    Object.assign(confirmedProfileReplan, await evaluate(`(() => {
      const rows = [...document.querySelectorAll('.week-meal-row')];
      const animal = /\\bpollo\\b|tacchino|coniglio|manzo|vitello|maiale|cavallo|bresaola|prosciutto|salmone|tonno|merluzzo|orata|branzino|nasello|platessa|sogliola|trota|sgombro|sardine|gamber|polpo|cozze|calamari|rombo|seppia/i;
      const pending = rows.filter((row) => row.dataset.completed !== 'true');
      return {
        weekReopened: document.querySelector('.week-lock')?.innerText.includes('Settimana modificabile') || false,
        pendingMeals: pending.length,
        animalMeals: pending.filter((row) => animal.test(row.innerText)).map((row) => row.innerText.slice(0, 100)),
        recordedMealPreserved: Boolean(${JSON.stringify(confirmedProfileReplan.recordedId)}) &&
          rows[${confirmedProfileReplan.recordedPosition}]?.dataset.recipeId === ${JSON.stringify(confirmedProfileReplan.recordedId)} &&
          rows[${confirmedProfileReplan.recordedPosition}]?.dataset.completed === 'true',
      };
    })()`));
    if (releasePatch >= 78) {
      Object.assign(confirmedProfileReplan, await evaluate(`(() => ({
        visibleTargets: document.querySelectorAll('.weekly-frequency > div span').length,
        noAnimalTargets: ![...document.querySelectorAll('.weekly-frequency > div span')].some((row) => /Pesce|Carne|Salumi/.test(row.innerText)),
        noFalseRangeWarnings: !document.querySelector('.weekly-frequency .outside-target'),
        rotationButtonFound: Boolean(document.querySelector('.weekly-rotation-fix')),
      }))()`));
      await evaluate(`document.querySelector('.weekly-rotation-fix')?.click()`);
      await wait(800);
      Object.assign(confirmedProfileReplan, await evaluate(`(() => {
        const rows = [...document.querySelectorAll('.week-meal-row')];
        const animal = /\\bpollo\\b|tacchino|coniglio|manzo|vitello|maiale|cavallo|bresaola|prosciutto|salmone|tonno|merluzzo|orata|branzino|nasello|platessa|sogliola|trota|sgombro|sardine|gamber|polpo|cozze|calamari|rombo|seppia/i;
        return {
          animalMealsAfterRotation: rows.filter((row) => row.dataset.completed !== 'true' && animal.test(row.innerText)).map((row) => row.innerText.slice(0, 100)),
          recordedMealAfterRotation: rows[${confirmedProfileReplan.recordedPosition}]?.dataset.recipeId === ${JSON.stringify(confirmedProfileReplan.recordedId)} &&
            rows[${confirmedProfileReplan.recordedPosition}]?.dataset.completed === 'true',
        };
      })()`));
    }
    await clickTab('Oggi');
    await setPreference('Stile alimentare', 'Onnivoro');
    await wait(550);
  }
  await setPreference('Tempo massimo', '5');
  await setPreference('Attrezzature', 'Nessuna cottura');
  await setPreference('Stile alimentare', 'Vegano');
  const severeProfile = await evaluate(`(() => {
    const buttons = [...document.querySelectorAll('.preferences .chips')[0]?.querySelectorAll('button') || []];
    buttons.filter((button) => !button.classList.contains('active')).forEach((button) => button.click());
    return { allergyFiltersFound: buttons.length, selected: buttons.map((button) => button.innerText.trim()) };
  })()`);
  await wait(1_200);
  Object.assign(severeProfile, await evaluate(`(() => ({
    persistentWarningToday: Boolean(document.querySelector('.replan-note.profile-warning')?.innerText.includes('Nessuna proposta automatica')),
    excludedToday: document.querySelectorAll('.meal-card.blocked').length,
    mismatchToday: document.querySelectorAll('.meal-card.profile-mismatch').length,
  }))()`));
  severeProfile.pickerOpened = await evaluate(`(() => {
    const button = document.querySelector('.meal-card .add-part-compact, .meal-card .part-change');
    button?.click();
    return Boolean(button);
  })()`);
  if (severeProfile.pickerOpened) {
    await wait(350);
    const blockedWhey = await searchPicker('pro', 'proteine whey');
    const availableFruit = await searchPicker('el', 'mela');
    severeProfile.blockedWheyAbsent = blockedWhey.found && !blockedWhey.expectedFound;
    severeProfile.safeFruitStillFound = availableFruit.expectedFound;
    await evaluate(`document.querySelector('.part-picker-sheet [aria-label="Chiudi alternative"]')?.click()`);
  }
  await clickTab('Settimana');
  Object.assign(severeProfile, await evaluate(`(() => {
    const excluded = document.querySelectorAll('.week-meal-row.excluded').length;
    const mismatch = document.querySelectorAll('.week-meal-row.profile-mismatch').length;
    const confirm = [...document.querySelectorAll('.week-lock button')]
      .find((button) => button.innerText.trim() === 'Conferma');
    return {
      persistentWarningWeek: Boolean(document.querySelector('.week-plan-gap')?.innerText.includes('Nessuna proposta automatica')),
      excludedWeek: excluded,
      mismatchWeek: mismatch,
      incompatibleMealsFlagged: excluded + mismatch > 0,
      unsafeWeekCannotConfirm: excluded === 0 || Boolean(confirm?.disabled),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      veganTargetsOnlyPlant: [...document.querySelectorAll('.weekly-frequency > div span')].every((row) => row.innerText.includes('Legumi e vegetali')),
      veganNoFalseRangeWarnings: !document.querySelector('.weekly-frequency .outside-target'),
    };
  })()`));
  await page.send('Page.reload', { ignoreCache: false });
  // Profile hydration and weekly recalculation are asynchronous after reload.
  // Require the real warning to reappear within a bounded window instead of
  // treating a single early read as a data-loss regression.
  severeProfile.warningSurvivesReload = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await wait(500);
    try {
      severeProfile.warningSurvivesReload = await evaluate(`Boolean(document.querySelector('.week-plan-gap')?.innerText.includes('Nessuna proposta automatica'))`);
      if (severeProfile.warningSurvivesReload) break;
    } catch {
      // The previous JavaScript context may still be closing during reload.
    }
  }
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
  if (editedWordHtml) {
    // The Word document is A4, not a 390px phone screen. Render the exported
    // HTML at an A4-sized desktop viewport before checking its pagination.
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 794, height: 1123, deviceScaleFactor: 1, mobile: false,
    });
    const frameTree = await page.send("Page.getFrameTree");
    await page.send("Page.setDocumentContent", {
      frameId: frameTree.frameTree.frame.id,
      html: editedWordHtml,
    });
    await wait(350);
    editedWeekExports.word.layout = await evaluate(`(() => ({
      viewportWidth: document.documentElement.clientWidth,
      bodyHeight: document.body.scrollHeight,
      days: [...document.querySelectorAll('.day')].map((day) => ({
        height: Math.round(day.getBoundingClientRect().height),
        meals: [...day.querySelectorAll('.meal')].map((meal) => Math.round(meal.getBoundingClientRect().height)),
      })),
    }))()`);
    const wordPdf = await page.send("Page.printToPDF", { printBackground: true, preferCSSPageSize: true });
    const wordPdfBytes = Buffer.from(wordPdf.data, "base64");
    editedWeekExports.word.renderedPdfBytes = wordPdfBytes.length;
    editedWeekExports.word.renderedPdfPages = (wordPdfBytes.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
  }
  const report = {
    today,
    initialMainBalance,
    scrollStability,
    week,
    weeklySeasonality,
    weeklyFruitRepeats,
    weeklyMainBalance,
    weeklyConfirmation,
    weeklyPrintPreview,
    printFlow,
    editedWeekExports,
    recipes,
    recipeDetail,
    wheyShakerRecipes,
    recipeCardFit,
    recipeCoverage,
    suppliedRecipeGroups,
    occasionalLibrary,
    recipeScrollY: recipeScroll.scrollY,
    backToday,
    swap,
    swapBottom,
    afterSwapReturn,
    milkAlternatives,
    pickerSearch: { searchTodayAlternative, searchTodayPompelmo, searchWeekAlternative, searchWeekAlbicocca, searchTodayAdd, searchWeekAdd,
      searchTodayProtein, searchTodayAddProtein, searchWeekProtein, searchWeekAlternativeProtein },
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
    occasionalAddition,
    occasionalSplitPhoto,
    readyDishFlow,
    checkinAdaptation,
    profileAdaptation,
    freeChoiceAndReplan,
    confirmedProfileReplan,
    severeProfile,
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
    (versionMinor >= 20 && versionPatch >= 37 && initialMainBalance.some((meal) => !meal.found || !meal.complete)) ||
    !scrollStability.menuUnchanged || !scrollStability.gramsUnchanged || !scrollStability.returnedTop || scrollStability.horizontalOverflow ||
    (releasePatch >= 81 && new Date().getMonth() === 9 &&
      [scrollStability.beforeMenu[1], scrollStability.beforeMenu[3], profileAdaptation.lowMenu[1], profileAdaptation.lowMenu[3]]
        .some((heading) => /nettarina|anguria|pompelmo rosa|albicocc|ciliegie|melone estivo|fichi/i.test(heading || ''))) ||
    (releasePatch >= 81 && new Date().getMonth() === 9 &&
      !/mela|pera|uva|melagrana|cachi|pesca/i.test(scrollStability.beforeMenu[1] || '')) ||
    (releasePatch >= 81 &&
      [scrollStability.beforeMenu[1], scrollStability.beforeMenu[3]]
        .some((heading) => /· (?:noci|mandorle|nocciole|pistacchi|arachidi|anacardi)$/i.test(heading || ''))) ||
    week.recovery || week.horizontalOverflow || week.brokenViewportImages.length || week.pendingViewportImages.length ||
    (versionMinor >= 20 && versionPatch >= 38 &&
      (weeklyMainBalance.length !== 14 || weeklyMainBalance.some((meal) => !meal.found || !meal.complete))) ||
    (versionMinor >= 20 && versionPatch >= 38 &&
      (weeklySeasonality.length !== 35 || weeklySeasonality.some((meal) => !Number.isFinite(meal.mismatches) || meal.mismatches > 0))) ||
    (releasePatch >= 53 && weeklyFruitRepeats.length > 0) ||
    !weeklyConfirmation.found || !weeklyConfirmation.locked || !weeklyConfirmation.hasAverage || weeklyConfirmation.calorieDays !== 7 ||
    !weeklyConfirmation.rotationConfirmed || weeklyConfirmation.rotationRows < 7 || !weeklyConfirmation.rotationInRange ||
    (releasePatch >= 79 &&
      (!/\b\d+ basi · \d+ ortaggi\b/.test(weeklyConfirmation.varietyHeader) ||
       Number(weeklyConfirmation.varietyHeader.match(/(\d+) basi/)?.[1] || 0) < 2 ||
       Number(weeklyConfirmation.varietyHeader.match(/(\d+) ortaggi/)?.[1] || 0) < 2)) ||
    !weeklyConfirmation.hasPrintPreview || !weeklyConfirmation.reopened ||
    !weeklyPrintPreview.found || !weeklyPrintPreview.hasUpdatedAverage || !weeklyPrintPreview.columnsAligned || weeklyPrintPreview.dayCount !== 7 ||
    weeklyPrintPreview.mealCount < 21 || weeklyPrintPreview.foodRows === 0 || !weeklyPrintPreview.hasAllMacros ||
    !weeklyPrintPreview.hasExports || !weeklyPrintPreview.closeVisible || weeklyPrintPreview.horizontalOverflow || !weeklyPrintPreview.closed ||
    (versionMinor >= 20 && versionPatch >= 38 &&
      (!printFlow.sheetStatic || !printFlow.backdropStatic || !printFlow.sheetNotClipped ||
       !printFlow.mealKeptTogether || (versionPatch >= 44 && !printFlow.dayStartsNewPage) ||
       printFlow.dayCount !== 7 || printFlow.pdfBytes < 20_000 ||
       (versionPatch >= 41 ? printFlow.pdfPages !== 7 : printFlow.pdfPages < 2))) ||
    (!editedWeekExports.skipped && (!editedWeekExports.dayOpened || !editedWeekExports.gramsInputFound ||
      !editedWeekExports.inputUpdated || !editedWeekExports.backInWeek ||
      editedWeekExports.printDayCount !== 7 || editedWeekExports.printMealCount !== 35 ||
      editedWeekExports.printFirstGrams !== editedWeekExports.after ||
      !editedWeekExports.word.found || !editedWeekExports.word.captured ||
      editedWeekExports.word.dayCount !== 7 || editedWeekExports.word.mealCount !== 35 ||
      editedWeekExports.word.firstGrams !== editedWeekExports.after ||
      !editedWeekExports.word.groupedMeal || !editedWeekExports.word.followingDaysStartNewPage ||
      (versionMinor >= 20 && versionPatch >= 42 &&
        (editedWeekExports.word.renderedPdfBytes < 20_000 || editedWeekExports.word.renderedPdfPages !== 7)))) ||
    recipes.recovery || recipes.horizontalOverflow || recipes.brokenViewportImages.length || recipes.pendingViewportImages.length ||
    !recipeDetail.found || !recipeDetail.hasIngredients || !recipeDetail.hasPreparation || !recipeDetail.hasNutrition ||
    !recipeDetail.hasAllergens || !recipeDetail.photoLoaded || recipeDetail.horizontalOverflow || !recipeDetail.closed || !recipeCoverage ||
    (!wheyShakerRecipes.skipped && (wheyShakerRecipes.count !== 4 || wheyShakerRecipes.horizontalOverflow ||
      new Set(wheyShakerRecipes.photos.map((item) => item.src)).size !== 4 || wheyShakerRecipes.photos.some((item) => !item.loaded))) ||
    (releasePatch >= 83 && (recipeCardFit.length !== 4 || recipeCardFit.some((card) => !card.found || !card.textInside || !card.noInternalOverflow || !card.noPageOverflow))) ||
    (!occasionalLibrary.skipped && (!occasionalLibrary.tabFound || !occasionalLibrary.quickFilterReset || !occasionalLibrary.choicesVisible || !occasionalLibrary.pizzaVisible)) ||
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
    (versionMinor >= 20 && versionPatch >= 28 &&
      [searchTodayAlternative, searchTodayPompelmo, searchWeekAlternative, searchWeekAlbicocca, searchTodayAdd, searchWeekAdd]
        .some((search) => !search.found || !search.expectedFound || !search.cleared || !search.resultsAtTop || search.horizontalOverflow)) ||
    (versionMinor >= 20 && versionPatch >= 36 &&
      [searchTodayProtein, searchTodayAddProtein, searchWeekProtein, searchWeekAlternativeProtein]
        .some((search) => !search.found || !search.expectedFound || !search.cleared || !search.resultsAtTop || search.horizontalOverflow)) ||
    (versionMinor >= 20 && versionPatch >= 38 &&
      [searchTodayProtein, searchTodayAddProtein, searchWeekProtein, searchWeekAlternativeProtein].some((search) =>
        search.wheyImages.length !== 4 || search.wheyImages.some((image) => !image.loaded || !image.visible) ||
        new Set(search.wheyImages.map((image) => image.src)).size !== 4)) ||
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
    (!occasionalAddition.skipped && (!occasionalAddition.addOpened || !occasionalAddition.visibleWithPlus ||
      (releasePatch >= 85 && (!occasionalAddition.shortcutVisible || !occasionalAddition.shortcutOpenedSgarri)) ||
      !occasionalAddition.pizzaAvailable || !occasionalAddition.pizzaVariants ||
      (releasePatch >= 86 && !occasionalAddition.pizzaVariantsShowWholeDish) || !occasionalAddition.freeChoiceAlsoAvailable ||
      (versionMinor >= 20 && versionPatch >= 25 && !occasionalAddition.hamburgerWholeDish) ||
      (versionMinor >= 20 && versionPatch >= 34 && !occasionalAddition.carbonaraWholeDish) ||
      (versionMinor >= 20 && versionPatch >= 35 && !occasionalAddition.amatricianaWholeDish) ||
      !occasionalAddition.appended || !occasionalAddition.pizzaPhoto || !occasionalAddition.pizzaWholeWithSplit ||
      !occasionalAddition.pickerClosed || !occasionalAddition.originalPartsKept || !occasionalAddition.removedDirectly)) ||
    (versionMinor >= 20 && versionPatch >= 46 && (!occasionalAddition.bresaolaChoiceFound ||
      !occasionalAddition.bresaolaWhole || !occasionalAddition.splitAvailable ||
      !occasionalAddition.bresaolaPersisted || !occasionalAddition.bresaolaSplit || !occasionalAddition.bresaolaRemoved)) ||
    (versionMinor >= 20 && versionPatch >= 48 && (!occasionalAddition.legacyPizzaRestored || occasionalAddition.wholePizzaVariants?.length !== 10 ||
      occasionalAddition.wholePizzaVariants.some((pizza) => !pizza.found || !pizza.singleCard || !pizza.wholePhoto || !pizza.canSplit))) ||
    (versionMinor >= 20 && versionPatch >= 54 && (!occasionalAddition.weekWholePizzaChosen || !occasionalAddition.weekWholePizza)) ||
    (versionMinor >= 20 && versionPatch >= 55 && (!occasionalAddition.legacyPizzaGramsPreserved || !occasionalAddition.explicitPizzaSplitPreserved)) ||
    (releasePatch >= 84 && (!occasionalAddition.replacementAvailable ||
      !occasionalAddition.replacementKeptMeal || !occasionalAddition.oldPizzaGone || !occasionalAddition.tiramisuPhoto)) ||
    (!occasionalSplitPhoto.skipped && (!occasionalSplitPhoto.optionFound || !occasionalSplitPhoto.componentFound ||
      !occasionalSplitPhoto.dedicatedPhoto || !occasionalSplitPhoto.breadFallbackAbsent || !occasionalSplitPhoto.editable)) ||
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
    (releasePatch >= 80 && !profileAdaptation.lowWorkSnacksCompact) ||
    profileAdaptation.lowPlanKcal <= 0 || profileAdaptation.highPlanKcal <= profileAdaptation.lowPlanKcal + 300 ||
    !profileAdaptation.targetChangesPlan || !profileAdaptation.highBreakfastHasNoDuplicateDairyOrNuts ||
    // Complete meals use practical package sizes and capped cooked portions;
    // demand a material increase and a plan within 10% of the chosen 3000 kcal.
    !profileAdaptation.maxTargetSelected ||
    profileAdaptation.maxPlanKcal <= profileAdaptation.highPlanKcal + 200 ||
    Math.abs(profileAdaptation.maxPlanKcal - 3000) > 300 ||
    !profileAdaptation.maxSnackHarmonious || !profileAdaptation.maxSnackNoDoubleCereal || !profileAdaptation.glutenFilterActive ||
    !profileAdaptation.glutenPlanSafe || !profileAdaptation.glutenFilterRestored ||
    !profileAdaptation.historyConsentReenabled ||
    !profileAdaptation.lockedWeekConfirmed || !profileAdaptation.lockedWeekReopenedForAllergy ||
    !profileAdaptation.weekGlutenFree || !profileAdaptation.loggedMealPreserved ||
    !profileAdaptation.workBreakfastPractical || (version === '1.19.82' && !profileAdaptation.workBreakfastFamiliar) || !profileAdaptation.workSnacksPractical || !profileAdaptation.workSnacksNoPrepVegetables || !profileAdaptation.workDrinkSnacksNotRepeated || !profileAdaptation.homeSelected || !profileAdaptation.contextChangesPlan ||
    profileAdaptation.horizontalOverflow ||
    !freeChoiceAndReplan.editorOpened || !freeChoiceAndReplan.editablePartFound ||
    !freeChoiceAndReplan.registrationFound || !freeChoiceAndReplan.editedBeforeSwap ||
    !freeChoiceAndReplan.loggedBeforeSwap || !freeChoiceAndReplan.pickerOpened || !freeChoiceAndReplan.completeMealFilterFound ||
    !freeChoiceAndReplan.completeMealFound || !freeChoiceAndReplan.breakfastShowsFreeChoice ||
    !freeChoiceAndReplan.oldGramsCleared || !freeChoiceAndReplan.mealUnregisteredAfterSwap ||
    !freeChoiceAndReplan.nextDaysGlutenFree || !freeChoiceAndReplan.nextDaysNotBlocked ||
    !freeChoiceAndReplan.persistedAfterReload ||
    (!confirmedProfileReplan.skipped && (
      !confirmedProfileReplan.confirmAvailable || !confirmedProfileReplan.lockedBeforeStyleChange ||
      !confirmedProfileReplan.weekReopened || confirmedProfileReplan.pendingMeals < 30 ||
      confirmedProfileReplan.animalMeals.length > 0 || !confirmedProfileReplan.recordedMealPreserved
    )) ||
    (releasePatch >= 78 && (
      confirmedProfileReplan.visibleTargets !== 3 || !confirmedProfileReplan.noAnimalTargets ||
      !confirmedProfileReplan.noFalseRangeWarnings || !confirmedProfileReplan.rotationButtonFound ||
      confirmedProfileReplan.animalMealsAfterRotation.length > 0 || !confirmedProfileReplan.recordedMealAfterRotation ||
      !severeProfile.veganTargetsOnlyPlant || !severeProfile.veganNoFalseRangeWarnings
    )) ||
    severeProfile.allergyFiltersFound < 5 || !severeProfile.persistentWarningToday ||
    (versionMinor >= 20 && versionPatch >= 36 &&
      (!severeProfile.pickerOpened || !severeProfile.blockedWheyAbsent || !severeProfile.safeFruitStillFound)) ||
    !severeProfile.persistentWarningWeek || !severeProfile.incompatibleMealsFlagged ||
    !severeProfile.unsafeWeekCannotConfirm || severeProfile.horizontalOverflow ||
    !severeProfile.warningSurvivesReload ||
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
  ], { windowsHide: true, stdio: "ignore", timeout: 10_000 });
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

