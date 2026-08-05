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
  await access(new URL("../dist/food/part-passata-v11652.png", import.meta.url));
  await access(new URL("../dist/food/part-sweet-potato-noodles-v11652.png", import.meta.url));
  await access(new URL("../dist/food/part-rice-noodles-v11652.png", import.meta.url));
  await access(new URL("../dist/food/part-branzino-baked-v11654.png", import.meta.url));
  await access(new URL("../dist/food/part-nasello-steamed-v11654.png", import.meta.url));
  await access(new URL("../dist/food/part-calamari-grilled-v11654.png", import.meta.url));
  await access(new URL("../dist/food/part-fave-cooked-v11654.png", import.meta.url));
  await access(new URL("../dist/food/part-borlotti-cooked-v11654.png", import.meta.url));
  await access(new URL("../dist/food/part-mussels-cooked-v11654.png", import.meta.url));
  await access(new URL("../dist/food/part-sardines-baked-v11654.png", import.meta.url));
  await access(new URL("../dist/food/part-mackerel-baked-v11654.png", import.meta.url));
  await access(new URL("../dist/food/part-cicoria-cooked-v11655.png", import.meta.url));
  await access(new URL("../dist/food/part-green-cabbage-cooked-v11657.png", import.meta.url));
  await access(new URL("../dist/food/part-plaice-baked-v11658.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c37-blueberry-porridge-v11659.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c38-skyr-mango-v11659.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c39-rye-egg-spinach-v11659.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c40-kefir-banana-v11659.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c41-spelt-pancakes-v11659.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c42-greek-yogurt-pear-v11659.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c43-cottage-pomegranate-v11659.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c44-oat-soy-peach-pudding-v11659.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s35-skyr-blueberries-v11660.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s36-banana-hazelnuts-v11660.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s37-hummus-tomato-toast-v11660.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s38-yogurt-peach-seeds-v11660.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s39-ricotta-cucumber-radish-v11660.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s40-apple-pistachio-kefir-v11660.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s41-cottage-ricecakes-v11660.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s42-mixed-berries-yogurt-v11660.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p53-whole-pasta-lentils-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p54-basmati-salmon-peas-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p55-quinoa-turkey-pumpkin-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p56-farro-chickpeas-beet-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p57-couscous-cod-curry-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p58-barley-edamame-cabbage-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p59-venere-seabream-asparagus-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p60-legume-pasta-ricotta-kale-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p61-millet-tempeh-artichokes-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p62-polenta-shrimp-stew-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p63-bulgur-chicken-radicchio-v11661.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p64-gnocchi-salmon-spinach-v11661.png", import.meta.url));
});

test("sorgente mobile con versione e fonti", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(app, /VERSION = "1\.16\.71"/);
  assert.match(app, /breakfastMilkAlternatives/);
  assert.match(app, /recipeFlours/);
  assert.match(app, /sharesFruit/);
  assert.match(app, /slot !== 2 && slot !== 4/);
  assert.match(app, /sameCuisineFamily/);
  assert.match(app, /const uniqueRecipes/);
  assert.match(app, /sameCuisine\.length/);
  assert.match(app, /setCuisineFilter\("Tutte"\)/);
  assert.match(app, /recipeCuisine\(b\) === cuisineChoice/);
  assert.match(app, /calibratePlannedIngredients/);
  assert.match(app, /const cookedGrain/);
  assert.match(app, /roundWithin\(120, 250, 10\)/);
  assert.match(app, /\.\.\.mealPartOptions\.Proteina/);
  assert.match(app, /targetAdditionsFor\(slot, targetForDay\(day\)\)/);
  assert.match(app, /mealCalorieShares/);
  assert.match(app, /max: 100, step: 10/);
  assert.match(app, /refreshSnapshotRef/);
  assert.match(app, /setMealView\(s\.mealView/);
  assert.match(css, /add-part-compact::before/);
  assert.match(app, /const rawRecipes: Recipe\[\]/);
  assert.match(app, /pantryPartByFood/);
  assert.match(app, /isSubstantialRecipe/);
  assert.match(app, /Cambia piatto pronto/);
  assert.match(app, /setCuisineFilter\(recipeCuisine\(r\)\)/);
  assert.match(app, /startAddingMealPart/);
  assert.match(app, /className="add-part-compact"/);
  assert.match(app, /title="Aggiungi elemento"/);
  assert.match(app, /partPicker\.adding/);
  assert.match(app, /filter\(\(\{ part \}\) => part\.grams > 0\)/);
  assert.match(css, /\.week-part-add/);
  assert.match(app, /food: "Crescenza"/);
  assert.match(app, /food: "Primo sale"/);
  assert.match(app, /food: "Scamorza"/);
  assert.match(app, /food: "Provolone Dolce Auricchio"/);
  assert.match(app, /horse-steak-potatoes-zucchini/);
  assert.match(app, /matrix-d41-sole-potatoes-fennel/);
  assert.match(app, /matrix-d42-chicken-brown-rice-peppers/);
  assert.match(app, /matrix-d43-grass-pea-soup/);
  assert.match(app, /matrix-d44-artichoke-frittata/);
  assert.match(app, /matrix-d45-tempeh-sweet-potato/);
  assert.match(app, /matrix-d46-turbot-quinoa-zucchini/);
  assert.match(app, /matrix-d47-ricotta-pumpkin-radicchio/);
  assert.match(app, /matrix-d48-cuttlefish-chard-basmati/);
  assert.match(app, /asian-oyakodon-authentic/);
  assert.match(app, /asian-bibimbap-authentic/);
  assert.match(app, /asian-negima-nabe-authentic/);
  assert.match(app, /asian-japchae-authentic/);
  assert.match(app, /asian-phat-thai-authentic/);
  assert.match(app, /Fonte verificata:/);
  assert.match(app, /sourceUrl/);
  assert.match(app, /Piatti completi consigliati/);
  assert.match(app, /chooseCompleteMeal/);
  assert.match(app, /complete-meal-info/);
  assert.match(app, /Vedi ingredienti e preparazione/);
  assert.doesNotMatch(app, /Scegli questo sgarro/);
  assert.doesNotMatch(app, /<strong>Scegli questo piatto<\/strong>/);
  assert.match(app, /Cambia ricetta/);
  assert.match(app, /Cambia un elemento/);
  assert.match(app, /recipe-mode-actions/);
  assert.match(app, /recipe-card-info/);
  assert.match(app, /Note utili/);
  assert.match(app, /italian-minestrone-complete/);
  assert.match(app, /Peperoni crudi/);
  assert.match(app, /Peperoni cotti senza olio/);
  assert.match(app, /Mozzarella vaccina/);
  assert.match(app, /Mozzarella light/);
  assert.match(app, /Yogurt greco 0%/);
  assert.match(app, /food: "Quinoa cotta"/);
  assert.match(app, /recipe\.parts \|\| recipe\.ingredients\.map\(additionAsPart\)/);
  assert.match(app, /!recipe\.parts && !partSelections\[key\]/);
  assert.match(app, /cleanKicker/);
  assert.match(app, /matrice\\s\+\[cspd\]/);
  assert.match(app, /Ricetta e preparazione/);
  assert.match(app, /Dividi in componenti/);
  assert.match(app, /Piatto unico/);
  assert.match(app, /workLunchesFrom/);
  assert.match(app, /mealView/);
  assert.match(app, /normalizeMealPart/);
  assert.match(app, /window\.location\.replace/);
  assert.match(app, /searchParams\.set\("_release"/);
  assert.match(app, /swapTarget \|\|/);
  assert.match(app, /history\.replaceState/);
  assert.match(app, /Seleziona tutto/);
  assert.match(app, /Deseleziona tutto/);
  assert.match(app, /week-kcal-summary/);
  assert.match(app, /Rotazione confermata/);
  assert.match(app, /simpleBreakfasts\.forEach\(\(recipe\) => \(recipe\.kind = "combination"\)\)/);
  for (let code = 35; code <= 40; code += 1) {
    const recipeId = `matrix-p${String(code).padStart(2, "0")}`;
    assert.match(app, new RegExp(recipeId), `piatto principale mancante: ${recipeId}`);
  }
  assert.match(app, /attachmentMainsP35P40/);
  assert.match(app, /part-black-beans-v11646/);
  assert.match(app, /className="recipe-card-info"/);
  assert.match(app, /containsCommonBloatingTriggers/);
  assert.match(app, /target: "2–3", count: weeklyCounts\["Legumi e vegetali"\]/);
  assert.match(app, /target: "1–3", count: weeklyCounts\["Carne bianca"\]/);
  assert.match(app, /className="weekly-source"/);
  assert.match(app, /part-soy-drink-v11649/);
  assert.match(app, /part-oat-drink-v11649/);
  assert.match(app, /part-tamarind-sauce-v11649/);
  assert.match(app, /part-peanut-oil-v11649/);
  await access(new URL("../dist/food/part-soy-drink-v11649.png", import.meta.url));
  await access(new URL("../dist/food/part-oat-drink-v11649.png", import.meta.url));
  await access(new URL("../dist/food/part-tamarind-sauce-v11649.png", import.meta.url));
  await access(new URL("../dist/food/part-peanut-oil-v11649.png", import.meta.url));
  for (const asset of [
    "part-chicken-raw-v11651",
    "part-chicken-cooked-v11651",
    "part-whole-egg-v11651",
    "part-carrots-cooked-v11651",
    "part-yogurt-white-v11651",
  ]) {
    assert.match(app, new RegExp(asset));
    await access(new URL(`../dist/food/${asset}.png`, import.meta.url));
  }
  for (const asset of [
    "part-basmati-dry-v11650",
    "part-basmati-cooked-v11650",
    "part-tuna-fresh-v11650",
    "part-tuna-canned-v11650",
  ]) {
    assert.match(app, new RegExp(asset));
    await access(new URL(`../dist/food/${asset}.png`, import.meta.url));
  }
  assert.match(app, /aria-label=\{swapTarget \? `Applica/);
  assert.doesNotMatch(app, /className="recipe-card-choose"/);
  await access(new URL("../dist/food/part-black-beans-v11646.png", import.meta.url));
  for (let code = 28; code <= 34; code += 1) {
    const recipeId = `matrix-p${String(code).padStart(2, "0")}`;
    assert.match(app, new RegExp(recipeId), `piatto principale mancante: ${recipeId}`);
  }
  assert.match(app, /attachmentMainsP28P34/);
  assert.match(app, /part-trout-v11645/);
  assert.match(app, /part-octopus-v11645/);
  assert.match(app, /part-edamame-v11634/);
  for (let code = 23; code <= 27; code += 1) {
    const recipeId = `matrix-p${String(code).padStart(2, "0")}`;
    assert.match(app, new RegExp(recipeId), `piatto principale mancante: ${recipeId}`);
  }
  assert.match(app, /attachmentMainsP23P27/);
  assert.match(app, /Cous cous integrale con lenticchie, zucca e feta/);
  assert.match(app, /Miglio con ceci, cavolfiore e curry/);
  for (let code = 17; code <= 22; code += 1) {
    const recipeId = `matrix-p${String(code).padStart(2, "0")}`;
    assert.match(app, new RegExp(recipeId), `piatto principale mancante: ${recipeId}`);
  }
  assert.match(app, /attachmentMainsP17P22/);
  assert.match(app, /part-spelt-pasta-v11643/);
  assert.match(app, /part-mackerel-v11643/);
  assert.match(app, /part-red-beans-v11643/);
  for (let code = 1; code <= 34; code += 1) {
    const recipeId = `matrix-s${String(code).padStart(2, "0")}`;
    assert.match(app, new RegExp(recipeId), `spuntino mancante: ${recipeId}`);
  }
  assert.match(app, /attachmentSnacksS14S26/);
  assert.match(app, /Prugne fresche/);
  assert.match(app, /Lamponi/);
  assert.match(app, /part-plums-v11642/);
  assert.match(app, /part-raspberries-v11642/);
  for (let code = 1; code <= 36; code += 1) {
    const recipeId = `matrix-c${String(code).padStart(2, "0")}`;
    assert.match(app, new RegExp(recipeId), `ricetta colazione mancante: ${recipeId}`);
  }
  assert.match(app, /part-pumpkin-seeds-v11641/);
  assert.match(app, /part-egg-white-v11641/);
  assert.match(app, /part-almond-butter-v11641/);
  assert.match(app, /part-dark-chocolate-v11641/);
  const realRecipeIndex = app.slice(app.indexOf("const rawRecipes"), app.indexOf("const pantryPartByFood"));
  assert.match(realRecipeIndex, /catalogMains/);
  assert.doesNotMatch(realRecipeIndex, /generatedRecipes|snackRecipes/);
  assert.match(app, /const RecipeVisual/);
  assert.match(app, /recipe-visual-parts/);
  assert.match(app, /verifiedWorldRecipeExpansion/);
  assert.match(app, /Torna indietro senza cambiare piatto/);
  assert.match(css, /\.swap-back/);
  assert.match(app, /catalog-verified-bulgogi-rice/);
  assert.match(app, /catalog-verified-keihan/);
  assert.match(app, /catalog-verified-lentil-pumpkin-bulgur/);
  assert.match(app, /VisitKorea · Bulgogi with rice/);
  assert.match(app, /Harvard T\.H\. Chan · Healthy Eating Plate/);
  assert.match(app, /version\.json/);
  assert.match(app, /part-grissini-v112/);
  assert.match(app, /attachmentBreakfastsC13C20/);
  assert.match(app, /matrix-c13-pear-cocoa-hazelnut-porridge/);
  assert.match(app, /matrix-c20-cold-papaya-porridge/);
  assert.match(app, /attachmentBreakfastsC22C28/);
  assert.match(app, /matrix-c22-yogurt-apple-oats-sunflower/);
  assert.match(app, /matrix-c28-ricotta-pineapple-rye-sesame/);
  assert.match(app, /Semi di girasole/);
  assert.match(app, /part-sunflower-seeds-v11640/);
  assert.match(app, /Uovo in camicia/);
  assert.match(app, /part-poached-egg-v11639/);
  assert.match(app, /matrix-c21-porridge-banana-peanut/);
  assert.match(app, /matrix-s11-banana-peanut/);
  assert.match(app, /matrix-s27-apricot-almond/);
  assert.match(app, /matrix-s34-rye-ricotta-radish/);
  assert.match(app, /matrix-s02-yogurt-blueberries/);
  assert.match(app, /matrix-s09-unsweetened-yogurt-smoothie/);
  assert.match(app, /matrix-s12-mandarins-walnuts/);
  assert.match(app, /matrix-s13-skyr-pomegranate/);
  assert.match(app, /matrix-s19-peach-cashews/);
  assert.match(app, /matrix-p41-whole-pasta-peas-ricotta/);
  assert.match(app, /matrix-p42-basmati-cod-spinach/);
  assert.match(app, /matrix-p44-quinoa-cannellini-beet/);
  assert.match(app, /matrix-p48-legume-pasta-salmon/);
  assert.match(app, /matrix-p52-bulgur-tofu-chickpeas/);
  assert.match(app, /Hummus di barbabietola/);
  assert.match(app, /weeklyPlannedFiber\[index\]\} g fibre/);
  assert.match(app, /WEEKLY_MAIN_ROTATION/);
  assert.match(app, /occasionalFoodRows/);
  assert.match(app, /foodSearchDatabase/);
  assert.match(app, /Sgarri ed extra/);
  assert.match(app, /Pizza quattro formaggi/);
  assert.match(app, /stima da ricetta/);
  assert.match(app, /proteinFamilyForItems/);
  assert.match(app, /Legumi e vegetali/);
  assert.match(app, /setCuisineChoice\(s\.cuisineChoice/);
  assert.match(app, /tab === "builder"/);
  await access(new URL("../dist/food/recipe-d41-sole-potatoes-fennel-v11519.png", import.meta.url));
  await access(new URL("../dist/food/recipe-d42-chicken-brown-rice-v11519.png", import.meta.url));
  await access(new URL("../dist/food/recipe-d43-grass-pea-soup-v11519.png", import.meta.url));
  await access(new URL("../dist/food/recipe-d44-artichoke-frittata-v11519.png", import.meta.url));
  await access(new URL("../dist/food/recipe-d45-tempeh-sweet-potato-v11520.png", import.meta.url));
  await access(new URL("../dist/food/recipe-d46-turbot-quinoa-v11520.png", import.meta.url));
  await access(new URL("../dist/food/recipe-d47-ricotta-pumpkin-v11520.png", import.meta.url));
  await access(new URL("../dist/food/recipe-d48-cuttlefish-chard-v11520.png", import.meta.url));
  await access(new URL("../dist/food/recipe-asian-oyakodon-v11520.png", import.meta.url));
  await access(new URL("../dist/food/recipe-asian-bibimbap-v11520.png", import.meta.url));
  await access(new URL("../dist/food/part-sunflower-seeds-v11640.png", import.meta.url));
  await access(new URL("../dist/food/part-trout-v11645.png", import.meta.url));
  await access(new URL("../dist/food/part-octopus-v11645.png", import.meta.url));
  await access(new URL("../dist/food/part-spelt-pasta-v11643.png", import.meta.url));
  await access(new URL("../dist/food/part-mackerel-v11643.png", import.meta.url));
  await access(new URL("../dist/food/part-red-beans-v11643.png", import.meta.url));
  await access(new URL("../dist/food/part-plums-v11642.png", import.meta.url));
  await access(new URL("../dist/food/part-raspberries-v11642.png", import.meta.url));
  await access(new URL("../dist/food/part-pumpkin-seeds-v11641.png", import.meta.url));
  await access(new URL("../dist/food/part-egg-white-v11641.png", import.meta.url));
  await access(new URL("../dist/food/part-almond-butter-v11641.png", import.meta.url));
  await access(new URL("../dist/food/part-dark-chocolate-v11641.png", import.meta.url));
  await access(new URL("../dist/food/part-tempeh-v11520.png", import.meta.url));
  await access(new URL("../dist/food/part-turbot-v11520.png", import.meta.url));
  await access(new URL("../dist/food/part-cuttlefish-v11520.png", import.meta.url));
  await access(new URL("../dist/food/part-sprouts-v11520.png", import.meta.url));
  await access(new URL("../dist/food/part-peppers-raw-v11522.png", import.meta.url));
  await access(new URL("../dist/food/part-peppers-cooked-v11522.png", import.meta.url));
  await access(new URL("../dist/food/part-mozzarella-v11522.png", import.meta.url));
  await access(new URL("../dist/food/part-mozzarella-light-v11522.png", import.meta.url));
  await access(new URL("../dist/food/part-greek-yogurt-zero-v11522.png", import.meta.url));
  await access(new URL("../dist/food/recipe-minestrone-v11522.png", import.meta.url));
  await access(new URL("../dist/food/part-sole-baked-v11519.png", import.meta.url));
  await access(new URL("../dist/food/part-brown-rice-v11519.png", import.meta.url));
  await access(new URL("../dist/food/part-grass-peas-v11519.png", import.meta.url));
  await access(new URL("../dist/food/part-artichokes-v11519.png", import.meta.url));
  await access(new URL("../dist/food/part-onions-v11519.png", import.meta.url));
  await access(new URL("../dist/food/part-crescenza-v11518.png", import.meta.url));
  await access(new URL("../dist/food/part-primo-sale-v11518.png", import.meta.url));
  await access(new URL("../dist/food/part-scamorza-v11518.png", import.meta.url));
  await access(new URL("../dist/food/part-provolone-auricchio-v11518.png", import.meta.url));
  await access(new URL("../dist/food/recipe-horse-steak-potatoes-zucchini-v11518.png", import.meta.url));
  await access(new URL("../dist/food/part-pineapple-v11513.png", import.meta.url));
  await access(new URL("../dist/food/part-beet-hummus-v11513.png", import.meta.url));
  await access(new URL("../dist/food/recipe-p41-pasta-peas-ricotta-v11513.png", import.meta.url));
  await access(new URL("../dist/food/part-carrots-raw-v11512.png", import.meta.url));
  await access(new URL("../dist/food/part-carrots-cooked-v11512.png", import.meta.url));
  await access(new URL("../dist/food/part-radishes-v11512.png", import.meta.url));
  await access(new URL("../dist/food/recipe-c21-porridge-banana-peanut-v113.png", import.meta.url));
  await access(new URL("../dist/food/part-peanuts-v113.png", import.meta.url));
  await access(new URL("../dist/food/part-blueberries-v1160.png", import.meta.url));
  await access(new URL("../dist/food/part-mandarins-v1160.png", import.meta.url));
  await access(new URL("../dist/food/part-pomegranate-v1160.png", import.meta.url));
  await access(new URL("../dist/food/part-cashews-v1160.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s02-yogurt-blueberries-v1160.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s09-yogurt-fruit-smoothie-v1160.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s12-mandarins-walnuts-v1160.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s13-skyr-pomegranate-v1160.png", import.meta.url));
  await access(new URL("../dist/food/recipe-s19-peach-cashews-v1160.png", import.meta.url));
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
  await access(new URL("../dist/food/recipe-asian-negima-v1163.png", import.meta.url));
  await access(new URL("../dist/food/recipe-asian-japchae-v1163.png", import.meta.url));
  await access(new URL("../dist/food/recipe-asian-phat-thai-v1163.png", import.meta.url));
  await access(new URL("../dist/food/part-lime-v1163.png", import.meta.url));
  await access(new URL("../dist/food/part-leek-v1163.png", import.meta.url));
  await access(new URL("../dist/food/part-garlic-chives-v1163.png", import.meta.url));
  const referencedPhotos = [...app.matchAll(/photo\("([^"]+)"\)/g)].map((match) => match[1]);
  await Promise.all(
    [...new Set(referencedPhotos)].map((name) =>
      access(new URL(`../dist/food/${name}.png`, import.meta.url)),
    ),
  );
});


test("v1.16.17 keeps swap navigation visible and exposes occasional choices", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(app, /swap-back-bar/);
  assert.match(app, /aria-label="Torna indietro senza cambiare piatto"/);
  assert.match(app, /<summary>Sgarri<\/summary>/);
  assert.match(app, /r\.id\.startsWith\("occasional-"\)/);
  assert.match(css, /\.swap-back-bar\s*\{[\s\S]*position:\s*fixed/);
  await access(new URL("../dist/food/part-pasta-whole-v11618.png", import.meta.url));
  await access(new URL("../dist/food/part-pasta-semolina-v11618.png", import.meta.url));
  assert.match(app, /photo\("part-pasta-whole-v11618"\)/);
  assert.match(app, /photo\("part-pasta-semolina-v11618"\)/);
  assert.match(app, /occasional-carbonara/);
  assert.match(app, /occasional-gelato/);
  assert.match(app, /occasional-tiramisu/);
  assert.match(app, /occasional-fries/);
  assert.match(app, /foods\[item\.food\] \?\? occasionalFoods\[item\.food\]/);
  assert.doesNotMatch(app, /},,/);
  assert.match(app, /const GELATO_FLAVORS/);
  assert.match(app, /chooseConfiguredGelato/);
  assert.match(app, /gelatoScoops === count/);
  assert.match(app, /Gusto pallina/);
  assert.match(css, /\.gelato-builder/);
  assert.match(app, /gelatoComposerOpen && \[1, 3\]/);
  assert.match(app, /Chiudi composizione gelato/);
  assert.match(app, /↻ Cambia piatto/);
  assert.match(app, /swapFoodOptions/);
  assert.match(app, /chooseSingleFoodFromLibrary/);
  assert.match(app, /Ricomponi piatto/);
  assert.match(app, /occasional-amatriciana/);
  assert.match(app, /cheat-amatriciana-v11625/);
  assert.match(css, /\.swap-food-grid/);
  assert.match(css, /object-fit: contain !important/);
  assert.match(app, /recipe-visual-count-/);
  assert.match(css, /recipe-visual-count-3/);
  assert.match(css, /grid-row: 1 \/ 3/);
  assert.match(css, /article > \.recipe-visual-parts/);
  assert.match(css, /padding-right: 0 !important/);
  assert.match(app, /occasional-cheesecake/);
  assert.match(app, /cheat-cheesecake-v11626/);
  assert.match(app, /occasional-cannolo/);
  assert.match(app, /cheat-cannolo-v11627/);
  assert.match(app, /occasional-panna-cotta/);
  assert.match(app, /cheat-panna-cotta-v11628/);
  assert.match(app, /occasional-pastiera/);
  assert.match(app, /cheat-pastiera-v11629/);
  assert.match(app, /occasional-arancino/);
  assert.match(app, /cheat-arancino-v11630/);
  assert.match(app, /attachmentBaseBreakfasts/);
  assert.match(app, /matrix-c01-porridge-apple-walnuts-chia/);
  assert.match(app, /matrix-c12-toast-peanut-banana/);
  assert.match(app, /attachmentBaseSnacks/);
  assert.match(app, /matrix-s01-apple-almonds/);
  assert.match(app, /matrix-s10-dark-chocolate-pear-walnuts/);
  assert.match(app, /Edamame cotti/);
  assert.match(app, /part-edamame-v11634/);
  assert.match(app, /matrix-p01-whole-pasta-chickpeas/);
  assert.match(app, /matrix-p05-couscous-chickpeas-vegetables/);
  assert.match(app, /attachmentBaseMainsB/);
  assert.match(app, /matrix-p06-brown-rice-salmon-broccoli/);
  assert.match(app, /matrix-p10-greek-quinoa-salad/);
  assert.match(app, /attachmentBaseMainsC/);
  assert.match(app, /matrix-p11-polenta-mushrooms-ricotta/);
  assert.match(app, /matrix-p16-potatoes-eggs-green-beans/);
  assert.match(app, /Passata di pomodoro[^}]+part-passata-v11652/);
  assert.match(app, /Vermicelli di patata dolce cotti[^}]+part-sweet-potato-noodles-v11652/);
  assert.match(app, /Noodles di riso cotti[^}]+part-rice-noodles-v11652/);
  const categoryObjects = [...app.matchAll(/\{\s*category:\s*"[^"]+"[\s\S]*?\}/g)].map((match) => match[0]);
  const imagePairs = categoryObjects.map((entry) => ({
    food: entry.match(/food:\s*"([^"]+)"/)?.[1],
    image: entry.match(/image:\s*photo\("([^"]+)"\)/)?.[1],
  })).filter((entry) => entry.food && entry.image);
  const foodNamesByImage = new Map();
  for (const pair of imagePairs) {
    const foodsForImage = foodNamesByImage.get(pair.image) ?? new Set();
    foodsForImage.add(pair.food);
    foodNamesByImage.set(pair.image, foodsForImage);
  }
  assert.deepEqual(
    [...foodNamesByImage.entries()].filter(([, foodsForImage]) => foodsForImage.size > 1),
    [],
    "ogni alimento del catalogo deve avere una fotografia distinta"
  );

  assert.doesNotMatch(app, /Scegli questo (?:piatto|sgarro)/);
  assert.doesNotMatch(app, /chooseRecipe\(filteredRecipes\[0\]\)/);
  assert.match(app, /recipe-preview-photo-select/);
  assert.match(css, /\.recipe-preview-photo-select/);

  assert.match(app, /const attachmentDinnersA: Recipe\[\]/);
  assert.match(app, /matrix-d01-merluzzo-al-forno-con-patate-e-zucchine/);
  assert.match(app, /matrix-d16-manzo-magro-con-radicchio-funghi-e-polenta/);
  assert.match(app, /\.\.\.attachmentDinnersA/);
  assert.match(app, /Branzino cotto/);
  assert.match(app, /part-branzino-baked-v11654/);
  assert.match(app, /part-nasello-steamed-v11654/);
  assert.match(app, /part-calamari-grilled-v11654/);
  assert.match(app, /part-fave-cooked-v11654/);
  assert.match(app, /part-borlotti-cooked-v11654/);
  assert.match(app, /part-mussels-cooked-v11654/);
  assert.match(app, /part-sardines-baked-v11654/);
  assert.match(app, /part-mackerel-baked-v11654/);

  assert.match(app, /const attachmentDinnersB: Recipe\[\]/);
  assert.match(app, /matrix-d17-trota-al-forno-con-zucca-e-patate/);
  assert.match(app, /matrix-d28-fave-cicoria-e-pane-integrale/);
  assert.match(app, /\.\.\.attachmentDinnersB/);
  assert.match(app, /part-cicoria-cooked-v11655/);

  assert.match(app, /const attachmentDinnersC: Recipe\[\]/);
  assert.match(app, /matrix-d29-nasello-al-vapore-con-patata-dolce-e-bietole/);
  assert.match(app, /matrix-d40-sardine-al-forno-con-pomodori-zucchine-e-cous/);
  assert.match(app, /\.\.\.attachmentDinnersC/);

  assert.match(app, /const attachmentDinnersD: Recipe\[\]/);
  assert.match(app, /matrix-d49-burger-di-fagioli-rossi-con-cavolo-e-patate/);
  assert.match(app, /matrix-d52-tofu-con-melanzane-pomodori-e-cous-cous/);
  assert.match(app, /\.\.\.attachmentDinnersD/);
  assert.match(app, /part-green-cabbage-cooked-v11657/);

  assert.match(app, /const attachmentDinnersE: Recipe\[\]/);
  assert.match(app, /matrix-d53-platessa-al-forno-con-zucca-zucchine-e-riso-rosso/);
  assert.match(app, /matrix-d64-tempeh-con-melanzane-pomodori-e-miglio/);
  assert.match(app, /\.\.\.attachmentDinnersE/);
  assert.match(app, /part-plaice-baked-v11658/);

  assert.match(app, /const attachmentBreakfastsC37C44: Recipe\[\]/);
  assert.match(app, /matrix-c37-blueberry-chia-almond-porridge/);
  assert.match(app, /matrix-c44-oat-soy-peach-sesame-pudding/);
  assert.match(app, /\.\.\.attachmentBreakfastsC37C44/);
  assert.match(app, /recipe-c41-spelt-pancakes-v11659/);

  assert.match(app, /const attachmentSnacksS35S42: Recipe\[\]/);
  assert.match(app, /matrix-s35-mirtilli-skyr-e-mandorle/);
  assert.match(app, /matrix-s42-frutti-di-bosco-con-yogurt-e-chia/);
  assert.match(app, /\.\.\.attachmentSnacksS35S42/);
  assert.match(app, /recipe-s41-cottage-ricecakes-v11660/);

  assert.match(app, /const attachmentMainsP53P64: Recipe\[\]/);
  assert.match(app, /matrix-p53-pasta-integrale-con-lenticchie-e-spinaci/);
  assert.match(app, /matrix-p64-gnocchi-con-salmone-spinaci-e-yogurt/);
  assert.match(app, /\.\.\.attachmentMainsP53P64/);
  assert.match(app, /recipe-p59-venere-seabream-asparagus-v11661/);
  await access(new URL("../dist/food/part-greek-yogurt-2-v11663.png", import.meta.url));
  await access(new URL("../dist/food/part-soy-drink-plain-v11663.png", import.meta.url));
  await access(new URL("../dist/food/part-mushrooms-raw-v11663.png", import.meta.url));
  assert.match(app, /part-greek-yogurt-2-v11663/);
  assert.match(app, /part-soy-drink-plain-v11663/);
  assert.match(app, /part-mushrooms-raw-v11663/);
  await access(new URL("../dist/food/part-gelato-fiordilatte-v11664.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-chocolate-v11664.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-crema-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-stracciatella-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-pistacchio-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-nocciola-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-vaniglia-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-caffe-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-fragola-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-limone-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-mango-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-yogurt-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-cocco-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-caramello-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-tiramisu-v11667.png", import.meta.url));
  await access(new URL("../dist/food/part-gelato-amarena-v11667.png", import.meta.url));
  assert.match(app, /gelatoFlavorPhoto/);
  assert.match(app, /GELATO_FLAVOR_PHOTOS/);
  assert.equal((app.match(/part-gelato-[a-z-]+-v1166[47]/g) || []).length >= 16, true);
  assert.match(app, /className="part-remove"/);
  assert.match(app, /removeMealPartAt/);
  assert.match(css, /\.meal-part \.part-remove/);
  assert.match(app, /const HEALTHY_FILTERS/);
  assert.match(app, /recipeMatchesHealthyFilter/);
  assert.match(app, /healthyFilters\.every/);
  assert.match(app, /Filtri healthy/);
  assert.match(css, /\.healthy-filter-panel/);
  assert.match(app, /Anteprima stampa/);
  assert.match(app, /className="print-preview-sheet"/);
  assert.match(app, /Menu, quantità e nutrienti/);
  assert.match(app, /className="print-food-row"/);
  assert.match(app, /Chiudi anteprima stampa/);
  assert.match(css, /\.print-preview-sheet/);
  assert.match(css, /\.print-food-row/);
  assert.match(app, /const hasPartCards = Boolean/);
  assert.match(app, /partSelections\[key\]\?\.length/);
  assert.match(app, /hasPartCards \? \(/);
});


test("v1.16.69 extends the verified everyday pantry with independent photos", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const foods = [
    ["Pompelmo rosa fresco", "part-grapefruit-v11668"],
    ["Riso parboiled cotto", "part-parboiled-rice-v11668"],
    ["Vongole cotte", "part-clams-v11668"],
    ["Lattuga fresca", "part-lettuce-v11668"],
    ["Songino fresco", "part-lambs-lettuce-v11668"],
    ["Catalogna fresca", "part-catalogna-v11668"],
    ["Verza fresca", "part-savoy-cabbage-v11668"],
    ["Cavolini di Bruxelles cotti", "part-brussels-sprouts-v11668"],
    ["Cime di rapa cotte", "part-turnip-greens-v11668"],
    ["Cipollotti freschi", "part-spring-onions-v11668"],
  ];
  for (const [food, asset] of foods) {
    assert.match(app, new RegExp('foods\\["' + food + '"\\]'));
    assert.match(app, new RegExp('food: "' + food + '"'));
    assert.match(app, new RegExp('photo\\("' + asset + '"\\)'));
    await access(new URL('../dist/food/' + asset + '.png', import.meta.url));
  }
  assert.match(app, /"Pompelmo rosa fresco": \[11, 12, 1, 2, 3, 4\]/);
  assert.match(app, /"Cime di rapa cotte": \[10, 11, 12, 1, 2, 3, 4\]/);
});


test("v1.16.69 expands compact daily drink logging without milk-as-day-drink", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  for (const label of [
    "Acqua naturale",
    "Acqua frizzante",
    "Caffè d'orzo senza zucchero",
    "Tè verde senza zucchero",
    "Tè nero senza zucchero",
    "Tè deteinato senza zucchero",
    "Tisana senza zucchero",
    "Acqua aromatizzata al limone",
    "Acqua aromatizzata al cetriolo",
    "Acqua aromatizzata alla menta",
  ]) assert.match(app, new RegExp('label: "' + label + '"'));
  const drinkBlock = app.slice(app.indexOf("const drinkOptions"), app.indexOf("];", app.indexOf("const drinkOptions")));
  assert.doesNotMatch(drinkBlock, /Latte|Bevanda di soia|Bevanda d'avena/);
});


test("v1.16.70 repairs saved gelato photos and exposes direct compact removal", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(app, /GELATO_FLAVORS\.includes\(part\.food/);
  assert.match(app, /return \{ \.\.\.part, image: gelatoFlavorPhoto\(part\.food\) \}/);
  assert.match(app, /className="part-remove"/);
  assert.match(app, /event\.stopPropagation\(\);[\s\S]*removeMealPartAt\(key, r, partIndex\)/);
  assert.match(css, /\.meal-part \.part-remove\s*\{[\s\S]*width:\s*16px;[\s\S]*height:\s*16px;/);
});


test("v1.16.71 repairs almond cream imagery and ranks complete meal replacements", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(app, /photo\("part-almond-butter-v11671"\)/);
  await access(new URL("../dist/food/part-almond-butter-v11671.png", import.meta.url));
  assert.match(app, /const compatibilityScore = \(recipe: Recipe\)/);
  assert.match(app, /candidateMacros\.protein - currentMacros\.protein/);
  assert.match(app, /candidateMacros\.carbs - currentMacros\.carbs/);
  assert.match(app, /candidateMacros\.fat - currentMacros\.fat/);
  assert.match(app, /contextDistance/);
  assert.match(app, /optionIndex === 0/);
  assert.match(app, /Scelta consigliata/);
  assert.match(css, /\.complete-meal-recommended/);
  assert.match(app, /if \(localOption\) return \{ \.\.\.part, image: localOption\.image \}/);
});
