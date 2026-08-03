import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("build GitHub Pages autonomo e completo", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /Tavola Mia/);
  assert.match(html, /\.\/assets\//);
  await access(new URL("../dist/food/chicken-bowl.png", import.meta.url));
  await access(new URL("../dist/food/toast.png", import.meta.url));
  await access(new URL("../dist/og.png", import.meta.url));
});

test("sorgente mobile con versione e fonti", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(app, /VERSION = "1\.15\.16"/);
  assert.match(app, /Ricetta e preparazione/);
  assert.match(app, /Dividi in componenti/);
  assert.match(app, /Piatto unico/);
  assert.match(app, /workLunchesFrom/);
  assert.match(app, /mealView/);
  assert.match(app, /normalizeMealPart/);
  assert.match(app, /window\.location\.replace/);
  assert.match(app, /Seleziona tutto/);
  assert.match(app, /Deseleziona tutto/);
  assert.match(app, /week-kcal-summary/);
  assert.match(app, /Rotazione confermata/);
  assert.match(app, /simpleBreakfasts\.forEach\(\(recipe\) => \(recipe\.kind = "combination"\)\)/);
  assert.match(app, /version\.json/);
  assert.match(app, /part-grissini-v112/);
  assert.match(app, /matrix-c21-porridge-banana-peanut/);
  assert.match(app, /matrix-s11-banana-peanut/);
  assert.match(app, /matrix-s27-apricot-almond/);
  assert.match(app, /matrix-s34-rye-ricotta-radish/);
  assert.match(app, /matrix-p41-whole-pasta-peas-ricotta/);
  assert.match(app, /matrix-p42-basmati-cod-spinach/);
  assert.match(app, /matrix-p44-quinoa-cannellini-beet/);
  assert.match(app, /matrix-p48-legume-pasta-salmon/);
  assert.match(app, /matrix-p52-bulgur-tofu-chickpeas/);
  assert.match(app, /Hummus di barbabietola/);
  assert.match(app, /weeklyPlannedFiber\[index\]\} g fibre/);
  await access(new URL("../dist/food/part-pineapple-v11513.png", import.meta.url));
  await access(new URL("../dist/food/part-beet-hummus-v11513.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p41-pasta-peas-ricotta-v11513.png", import.meta.url));
  await access(new URL("../dist/food/part-carrots-raw-v11512.png", import.meta.url));
  await access(new URL("../dist/food/part-carrots-cooked-v11512.png", import.meta.url));
  await access(new URL("../dist/food/part-radishes-v11512.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c21-porridge-banana-peanut-v113.png", import.meta.url));
  await access(new URL("../dist/food/part-peanuts-v113.png", import.meta.url));
  assert.match(app, /matrix-c31-spelt-ricotta-apple/);
  assert.match(app, /matrix-c34-buckwheat-pancakes-pear/);
  assert.match(app, /matrix-c35-skyr-melon-chia/);
  assert.match(app, /matrix-c36-cereal-hazelnut-strawberry/);
  assert.match(app, /mainCompatibilityMatrix/);
  await access(new URL("../dist/food/recipe-c31-spelt-ricotta-apple-v11511.png", import.meta.url));
  await access(new URL("../dist/food/part-hazelnut-paste-v11511.png", import.meta.url));
  assert.match(app, /length:\s*284/);
  assert.match(app, /300\+ RICETTE GUIDATE/);
  assert.match(app, /CREA/);
  assert.match(app, /USDA/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /max-width:\s*520px/);
});
