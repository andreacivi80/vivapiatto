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
  assert.match(app, /VERSION = "1\.18\.0"/);
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
  assert.match(app, /roundWithin\(120, hasLegumes \? 180 : 250, 10\)/);
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
  assert.match(app, /complete-meal-card-actions/);
  assert.match(app, /image\?: string/);
  assert.match(app, /<img src=\{d\.image\}/);
  assert.match(app, /<img src=\{x\.image\}/);
  assert.match(app, /part-coffee-v8/);
  assert.match(css, /\.quick-log button img/);
  assert.match(css, /width: 24px/);
  for (const asset of [
    "part-water-still-v11673",
    "part-water-sparkling-v11673",
    "part-coffee-decaf-v11673",
    "part-barley-coffee-v11673",
    "part-green-tea-v11673",
    "part-black-tea-v11673",
    "part-decaf-tea-v11673",
    "part-herbal-tea-v11673",
    "part-lemon-water-v11673",
    "part-cucumber-water-v11673",
    "part-mint-water-v11673",
    "part-cola-zero-v11673",
    "part-zero-soda-v11673",
    "part-sugary-soda-v11673",
    "part-white-wine-v11673",
    "part-red-wine-v11673"
]) {
    assert.match(app, new RegExp(asset));
    await access(new URL(`../dist/food/${asset}.png`, import.meta.url));
  }
  assert.match(app, /Prima scelta/);
  assert.match(app, /optionIndex < 3/);
  assert.match(app, /missingRoles \* 0\.22 \+ extraRoles \* 0\.08/);
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
  assert.match(app, /label: "Legumi e vegetali".*count: weeklyCounts\["Legumi e vegetali"\]/);
  assert.match(app, /label: "Carne bianca".*count: weeklyCounts\["Carne bianca"\]/);
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
  assert.match(app, /part-almond-butter-v11671/);
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
  await access(new URL("../dist/food/part-almond-butter-v11671.png", import.meta.url));
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


test("v1.16.74 gives the first breakfast matrix recipes their own faithful photos", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [["matrix-c01-porridge-apple-walnuts-chia","recipe-c01-apple-walnut-chia-v11674"],["matrix-c02-overnight-oats-berries","recipe-c02-overnight-berries-v11674"],["matrix-c03-skyr-pear-hazelnuts","recipe-c03-skyr-pear-hazelnut-v11674"],["matrix-c04-rye-ricotta-orange","recipe-c04-rye-ricotta-orange-v11674"],["matrix-c06-omelette-spinach-bread","recipe-c06-spinach-omelette-v11674"],["matrix-c07-kefir-muesli-peach","recipe-c07-kefir-muesli-peach-v11674"],["matrix-c08-soy-mango-chia","recipe-c08-soy-mango-chia-v11674"],["matrix-c09-yogurt-pomegranate-pistachios","recipe-c09-yogurt-pomegranate-pistachio-v11674"]];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
});

test("v1.16.75 gives the second breakfast matrix block faithful recipe photos", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-c10-cottage-cheese-peach-bread", "recipe-c10-cottage-peach-bread-v11675"],
    ["matrix-c11-buckwheat-pancake-apple", "recipe-c11-buckwheat-apple-v11675"],
    ["matrix-c12-toast-peanut-banana", "recipe-c12-peanut-banana-toast-v11675"],
    ["matrix-c13-pear-cocoa-hazelnut-porridge", "recipe-c13-pear-cocoa-porridge-v11675"],
    ["matrix-c14-yogurt-pineapple-oats-pumpkin-seeds", "recipe-c14-yogurt-pineapple-oats-v11675"],
    ["matrix-c15-poached-egg-toast", "recipe-c15-poached-egg-toast-v11675"],
    ["matrix-c16-ricotta-blueberries-pistachios", "recipe-c16-ricotta-blueberry-pistachio-v11675"],
    ["matrix-c17-chia-kefir-mango-pudding", "recipe-c17-chia-kefir-mango-v11675"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
});

test("v1.16.76 gives the third breakfast matrix block faithful recipe photos", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-c18-whole-pancakes-ricotta-cherries", "recipe-c18-pancakes-ricotta-cherries-v11676"],
    ["matrix-c19-cottage-melon-walnut-bowl", "recipe-c19-cottage-melon-walnuts-v11676"],
    ["matrix-c20-cold-papaya-porridge", "recipe-c20-cold-papaya-porridge-v11676"],
    ["matrix-c22-yogurt-apple-oats-sunflower", "recipe-c22-yogurt-apple-sunflower-v11676"],
    ["matrix-c23-bread-cottage-pear-pecans", "recipe-c23-cottage-pear-pecans-v11676"],
    ["matrix-c24-kefir-strawberry-oat-smoothie", "recipe-c24-kefir-strawberry-smoothie-v11676"],
    ["matrix-c25-scrambled-eggs-asparagus-rye", "recipe-c25-eggs-asparagus-kiwi-v11676"],
    ["matrix-c26-skyr-grapes-pistachio-muesli", "recipe-c26-skyr-grapes-pistachio-v11676"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
});

test("v1.16.77 completes generic breakfast imagery and starts faithful snack imagery", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-c27-oat-pancakes-blueberries-almond", "recipe-c27-oat-pancakes-blueberries-v11677"],
    ["matrix-c28-ricotta-pineapple-rye-sesame", "recipe-c28-ricotta-pineapple-rye-v11677"],
    ["matrix-s01-apple-almonds", "recipe-s01-apple-almonds-v11677"],
    ["matrix-s03-skyr-kiwi", "recipe-s03-skyr-kiwi-v11677"],
    ["matrix-s04-kefir-pear", "recipe-s04-kefir-pear-v11677"],
    ["matrix-s05-hummus-crunchy-vegetables", "recipe-s05-hummus-vegetables-v11677"],
    ["matrix-s06-ricotta-strawberries", "recipe-s06-ricotta-strawberries-v11677"],
    ["matrix-s07-rye-cottage-tomatoes", "recipe-s07-rye-cottage-tomatoes-v11677"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
  assert.equal((app.match(/id: "matrix-s02-yogurt-blueberries"/g) || []).length, 1);
});

test("v1.16.78 gives the next snack matrix block faithful recipe photos", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-s08-orange-pistachios", "recipe-s08-orange-pistachios-v11678"],
    ["matrix-s09-unsweetened-smoothie", "recipe-s09-yogurt-banana-smoothie-v11678"],
    ["matrix-s10-dark-chocolate-pear-walnuts", "recipe-s10-pear-chocolate-walnuts-v11678"],
    ["matrix-s14-rice-cakes-ricotta-tomatoes", "recipe-s14-rice-cakes-ricotta-tomatoes-v11678"],
    ["matrix-s15-hummus-cucumber-carrots", "recipe-s15-hummus-cucumber-carrots-v11678"],
    ["matrix-s16-yogurt-plums-sunflower", "recipe-s16-yogurt-plums-sunflower-v11678"],
    ["matrix-s17-bread-cottage-cucumber", "recipe-s17-bread-cottage-cucumber-v11678"],
    ["matrix-s18-pineapple-kefir-chia", "recipe-s18-pineapple-kefir-chia-v11678"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
});

test("v1.16.79 completes faithful photos for the remaining snack matrix", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-s20-greek-yogurt-raspberries", "recipe-s20-greek-yogurt-raspberries-v11679"],
    ["matrix-s21-cottage-tomatoes-rice-cakes", "recipe-s21-cottage-tomatoes-rice-cakes-v11679"],
    ["matrix-s22-apple-hazelnuts-dark-chocolate", "recipe-s22-apple-hazelnuts-chocolate-v11679"],
    ["matrix-s23-fennel-herb-ricotta", "recipe-s23-fennel-herb-ricotta-v11679"],
    ["matrix-s24-pear-almond-butter", "recipe-s24-pear-almond-butter-v11679"],
    ["matrix-s25-skyr-banana-pumpkin-seeds", "recipe-s25-skyr-banana-pumpkin-v11679"],
    ["matrix-s26-hummus-tomatoes-cucumber", "recipe-s26-hummus-tomatoes-cucumber-v11679"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
  assert.equal((app.match(/image: photo\("moment-snack-v1121"\)/g) || []).length, 0);
});

test("v1.16.80 starts faithful photos for the main-meal matrix", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-p01-whole-pasta-chickpeas", "recipe-p01-whole-pasta-chickpeas-v11680"],
    ["matrix-p02-farro-lentils-roasted-vegetables", "recipe-p02-farro-lentils-roasted-vegetables-v11680"],
    ["matrix-p03-quinoa-edamame-ginger", "recipe-p03-quinoa-edamame-ginger-v11680"],
    ["matrix-p04-basmati-light-chicken-curry", "recipe-p04-basmati-light-chicken-curry-v11680"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
});

test("v1.16.81 gives P05-P12 faithful main-meal photos", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-p05-couscous-chickpeas-vegetables", "recipe-p05-couscous-chickpeas-vegetables-v11681"],
    ["matrix-p06-brown-rice-salmon-broccoli", "recipe-p06-brown-rice-salmon-broccoli-v11681"],
    ["matrix-p07-bulgur-turkey-aubergines", "recipe-p07-bulgur-turkey-aubergines-v11681"],
    ["matrix-p08-pasta-tuna-tomato", "recipe-p08-pasta-tuna-tomato-v11681"],
    ["matrix-p09-barley-cannellini-black-kale", "recipe-p09-barley-cannellini-black-kale-v11681"],
    ["matrix-p10-greek-quinoa-salad", "recipe-p10-greek-quinoa-salad-v11681"],
    ["matrix-p11-polenta-mushrooms-ricotta", "recipe-p11-polenta-mushrooms-ricotta-v11681"],
    ["matrix-p12-red-rice-prawns-courgettes", "recipe-p12-red-rice-prawns-courgettes-v11681"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
});

test("v1.16.82 gives P13-P20 faithful main-meal photos", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-p13-legume-pasta-aubergine-ricotta", "recipe-p13-legume-pasta-aubergine-ricotta-v11682"],
    ["matrix-p14-buckwheat-tofu-vegetables", "recipe-p14-buckwheat-tofu-vegetables-v11682"],
    ["matrix-p15-millet-tempeh-pumpkin-radicchio", "recipe-p15-millet-tempeh-pumpkin-radicchio-v11682"],
    ["matrix-p16-potatoes-eggs-green-beans", "recipe-p16-potatoes-eggs-green-beans-v11682"],
    ["matrix-p17-brown-risotto-peas-shrimp", "recipe-p17-brown-risotto-peas-shrimp-v11682"],
    ["matrix-p18-quinoa-chicken-peppers-turmeric", "recipe-p18-quinoa-chicken-peppers-turmeric-v11682"],
    ["matrix-p19-spelt-pasta-mackerel-broccoli", "recipe-p19-spelt-pasta-mackerel-broccoli-v11682"],
    ["matrix-p20-bulgur-red-beans-cabbage", "recipe-p20-bulgur-red-beans-cabbage-v11682"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
});

test("v1.16.83 gives P21-P28 faithful main-meal photos", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-p21-venere-tuna-zucchini-carrots", "recipe-p21-venere-tuna-zucchini-carrots-v11683"],
    ["matrix-p22-barley-chicken-mushroom-spinach", "recipe-p22-barley-chicken-mushroom-spinach-v11683"],
    ["matrix-p23-couscous-lentils-pumpkin-feta", "recipe-p23-couscous-lentils-pumpkin-feta-v11683"],
    ["matrix-p24-whole-pasta-salmon-zucchini-yogurt", "recipe-p24-whole-pasta-salmon-zucchini-yogurt-v11683"],
    ["matrix-p25-gnocchi-tomato-ricotta-spinach", "recipe-p25-gnocchi-tomato-ricotta-spinach-v11683"],
    ["matrix-p26-farro-bresaola-rucola-tomatoes", "recipe-p26-farro-bresaola-rucola-tomatoes-v11683"],
    ["matrix-p27-millet-chickpeas-cauliflower-curry", "recipe-p27-millet-chickpeas-cauliflower-curry-v11683"],
    ["matrix-p28-red-rice-tofu-edamame-vegetables", "recipe-p28-red-rice-tofu-edamame-vegetables-v11683"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
});

test("v1.16.84 gives P29-P36 faithful main-meal photos", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-p29-whole-pasta-cannellini-broccoli", "recipe-p29-whole-pasta-cannellini-broccoli-v11684"],
    ["matrix-p30-basmati-chicken-vegetable-salad", "recipe-p30-basmati-chicken-vegetable-salad-v11684"],
    ["matrix-p31-barley-chickpeas-artichokes-tomatoes", "recipe-p31-barley-chickpeas-artichokes-tomatoes-v11684"],
    ["matrix-p32-quinoa-trout-asparagus-tomatoes", "recipe-p32-quinoa-trout-asparagus-tomatoes-v11684"],
    ["matrix-p33-couscous-turkey-pumpkin-radicchio", "recipe-p33-couscous-turkey-pumpkin-radicchio-v11684"],
    ["matrix-p34-venere-octopus-crunchy-vegetables", "recipe-p34-venere-octopus-crunchy-vegetables-v11684"],
    ["matrix-p35-farro-tofu-eggplant-tomatoes", "recipe-p35-farro-tofu-eggplant-tomatoes-v11684"],
    ["matrix-p36-legume-pasta-tuna-peppers", "recipe-p36-legume-pasta-tuna-peppers-v11684"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
});

test("v1.16.85 completes faithful photos for the main-meal matrix", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const assets = [
    ["matrix-p37-polenta-lentils-black-kale", "recipe-p37-polenta-lentils-black-kale-v11685"],
    ["matrix-p38-bulgur-salmon-fennel-orange", "recipe-p38-bulgur-salmon-fennel-orange-v11685"],
    ["matrix-p39-millet-black-beans-pumpkin-cabbage", "recipe-p39-millet-black-beans-pumpkin-cabbage-v11685"],
    ["matrix-p40-brown-rice-eggs-peas-vegetables", "recipe-p40-brown-rice-eggs-peas-vegetables-v11685"],
  ];
  for (const [id, asset] of assets) {
    assert.match(app, new RegExp('id: "' + id + '"[\\s\\S]{0,500}image: photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
  assert.doesNotMatch(app, /image: photo\("moment-(?:lunch|dinner)-v1121"\)/);
});

test("v1.16.86 preserves the exact scroll position across automatic releases", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /sessionStorage\.setItem\("vivapiatto-release-scroll-y", String\(window\.scrollY\)\)/);
  assert.match(app, /sessionStorage\.getItem\("vivapiatto-release-scroll-y"\)/);
  assert.match(app, /window\.scrollTo\(\{ top: savedScrollY, left: 0, behavior: "auto" \}\)/);
  assert.match(app, /localStorage\.setItem\("vivapiatto-v1", refreshSnapshotRef\.current\)/);
});

test("v1.16.87 exposes recipe pagination, copy and direct shopping actions", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /const \[visibleRecipeCount, setVisibleRecipeCount\] = useState\(10\)/);
  assert.match(app, /Mostra altre 10 ricette/);
  assert.match(app, /Copia ricetta/);
  assert.match(app, /navigator\.clipboard\.writeText\(text\)/);
  assert.match(app, /Aggiungi alla lista della spesa/);
  assert.match(app, /Porzioni standard non personalizzate · 1 persona/);
  assert.match(app, /shoppingAdditions/);
});

test("v1.16.88 creates a real recipe from the ingredients on hand", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /Crea con gli ingredienti che hai/);
  assert.match(app, /Crea la ricetta con questi ingredienti/);
  assert.match(app, /generateBuilderRecipe/);
  assert.match(app, /Tempo massimo/);
  assert.match(app, /Preparazione completa|Vedi preparazione completa/);
});

test("v1.16.89 validates storage before creating a leftovers recipe", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /Crea una ricetta con gli avanzi/);
  assert.match(app, /generateLeftoverRecipe/);
  assert.match(app, /Frigorifero entro 2 ore/);
  assert.match(app, /non utilizzare l'alimento/);
  assert.match(app, /più di 3 giorni/);
  assert.match(app, /USDA Food Safety and Inspection Service/);
});

test("v1.16.90 applies the saved household and cooking profile", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  for (const field of ["peopleCount", "ageGroup", "foodStyle", "dailyMeals", "maxPrepTime", "availableEquipment", "budgetLevel"]) {
    assert.match(app, new RegExp(field));
  }
  assert.match(app, /matchesFoodStyle/);
  assert.match(app, /matchesEquipment/);
  assert.match(app, /scale \* peopleCount/);
  assert.match(app, /Porzioni standard per adulti non applicabili ai minori/);
});

test("v1.16.91 exports the whole weekly plan", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(app, /weeklyExportRows/);
  assert.match(app, /Copia tutto/);
  assert.match(app, /exportWeeklyCsv/);
  assert.match(app, /exportWeeklyWord/);
  assert.match(app, /window\.print\(\)/);
  assert.match(css, /@media print/);
});

test("v1.16.92 generates another compatible recipe page without widening filters", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /compatibleRecipePage/);
  assert.match(app, /rotatedCompatibleRecipes/);
  assert.match(app, /Genera altre ricette compatibili/);
  assert.match(app, /setVisibleRecipeCount\(10\)/);
});

test("v1.16.93 rebuilds the 14 main meals into a coherent weekly protein rotation", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /rebalanceWeeklyProteinRotation/);
  assert.match(app, /requestedFamilies/);
  assert.match(app, /Riequilibra la rotazione dei 14 pasti/);
  assert.match(app, /3 pesci, 3 legumi, 3 carni bianche/);
  assert.match(app, /used\.has\(recipe\.id\)/);
});

test("v1.16.94 shows a neutral variety index and current season signal", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /recipeVarietyScore/);
  assert.match(app, /recipeHasSeasonalProduce/);
  assert.match(app, /Varietà \{recipeVarietyScore\(r\)\}\/5/);
  assert.match(app, /indicatore descrittivo, non voto sanitario/);
});

test("v1.16.95 separates allergies, intolerances and clinical conditions", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /allergyGroups/);
  assert.match(app, /intoleranceGroups/);
  assert.match(app, /healthConditions/);
  assert.match(app, /Celiachia diagnosticata/);
  assert.match(app, /recipeAllergens/);
  assert.match(app, /Controlla sempre etichetta, certificazione e possibili contaminazioni/);
  assert.match(app, /non crea una dieta terapeutica/);
});

test("v1.16.96 prevents repeated recipes and applies meal-level balance rules", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /isProfileEligible/);
  assert.match(app, /usedProteinSignatures/);
  assert.match(app, /recipeProteinSignature/);
  assert.match(app, /usedRecipeIds/);
  assert.match(app, /hasLegumes \? 180 : 250/);
  assert.match(app, /hasFattyFish \? 5 : 15/);
  assert.match(app, /recipeProteinFamily\(recipe\) !== recipeProteinFamily\(lunch\)/);
});

test("v1.16.97 enriches every recipe with auditable metadata and a source", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /inferRecipeAllergens/);
  assert.match(app, /inferRecipeMethods/);
  assert.match(app, /inferRecipeTags/);
  assert.match(app, /inferRecipeSeasonMonths/);
  assert.match(app, /Valori degli ingredienti da banca dati CREA, USDA, FRIDA o etichetta/);
  assert.match(app, /recipe-meta-chips/);
});

test("v1.16.98 applies meal count and budget to planning, totals and exports", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /const activeMealSlots = dailyMeals === 3/);
  assert.match(app, /share \/ activeShareTotal/);
  assert.match(app, /if \(!isActiveMealSlot\(slot\)\) return \[\]/);
  assert.match(app, /recipeBudgetScore/);
  assert.match(app, /budgetLevel === "Economico"/);
  assert.match(app, /ingredienti economici/);
});

test("v1.16.99 applies breakfast, meal-prep and quick-time preferences", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /breakfastStyleScore/);
  assert.match(app, /isMealPrepFriendly/);
  assert.match(app, /mealPrepMode === "Sì"/);
  assert.match(app, /\[5, 15, 30, 45, 60\]/);
  assert.match(app, /setBreakfastStyle/);
  assert.match(app, /setMealPrepMode/);
});

test("v1.17.0 makes weekly calorie and rotation status explicit", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(app, /weeklyKcalDelta/);
  assert.match(app, /status: item\.count >= item\.min/);
  assert.match(app, /Nel range/);
  assert.match(app, /Da riequilibrare/);
  assert.match(css, /\.weekly-frequency \.within-target/);
});

test("v1.17.1 adds functional nutrition and preparation filters", async () => {
  const app = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  assert.match(app, /\["proteico", "Più proteine"\]/);
  assert.match(app, /\["fibre", "Più fibre"\]/);
  assert.match(app, /\["meal-prep", "Adatta al meal prep"\]/);
  assert.match(app, /\["senza-cottura", "Senza cottura"\]/);
  assert.match(app, /calc\(recipe\.ingredients\)\.protein >= 25/);
  assert.match(app, /calc\(recipe\.ingredients\)\.fiber >= 7/);
});

test("v1.17.2 applies mensa and restaurant context without inventing venues", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(app, /isMensaFriendly/);
  assert.match(app, /isRestaurantFriendly/);
  assert.match(app, /<option>Mensa<\/option>/);
  assert.match(app, /<option>Ristorante<\/option>/);
  assert.match(app, /Ministero della Salute ↗/);
  assert.match(css, /\.outside-context-note/);
});

test("v1.17.3 adapts after yesterday without punitive calorie compensation", async () => {
  const source = await readFile("app/FoodPlanner.tsx", "utf8");
  assert.match(source, /next\.feeling === "bene" && next\.yesterday === "molto"/);
  assert.match(source, /energyDensity\(a\) - energyDensity\(b\)/);
  assert.match(source, /next\.feeling === "bene" && next\.yesterday === "poco"/);
  assert.match(source, /calc\(b\.ingredients\)\.protein - calc\(a\.ingredients\)\.protein/);
  assert.match(source, /niente digiuno compensatorio/);
  assert.doesNotMatch(source, /next\.yesterday === "molto"[^\n]+plannedCalories/);
});

test("v1.17.4 prevents a blank page and preserves a recovery backup", async () => {
  const main = await readFile("main.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");
  assert.match(main, /class AppGuard extends Component/);
  assert.match(main, /getDerivedStateFromError/);
  assert.match(main, /vivapiatto-recovery-backup/);
  assert.match(main, /Ricarica app/);
  assert.match(main, /Ripristina dati locali/);
  assert.match(css, /\.app-recovery\s*\{[\s\S]*min-height:\s*100dvh/);
});

test("v1.17.5 shows a mobile loading state while the large planner loads", async () => {
  const main = await readFile("main.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");
  assert.match(main, /const FoodPlanner = lazy/);
  assert.match(main, /<Suspense fallback=/);
  assert.match(main, /className="app-loading"/);
  assert.match(css, /\.app-loading\s*\{[\s\S]*min-height:\s*100dvh/);
});

test("v1.17.6 searches live restaurants by area without inventing venues", async () => {
  const app = await readFile("app/FoodPlanner.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");
  assert.match(app, /const \[restaurantArea, setRestaurantArea\]/);
  assert.match(app, /google\.com\/maps\/search\/\?api=1&query=/);
  assert.match(app, /encodeURIComponent\(`ristoranti \$\{restaurantArea\.trim\(\)\}`\)/);
  assert.match(app, /senza inventare nomi o disponibilità/);
  assert.match(css, /\.restaurant-area > div\s*\{[\s\S]*minmax\(0, 1fr\)/);
});

test("v1.17.7 adds missing everyday alternatives with faithful assets", async () => {
  const app = await readFile("app/FoodPlanner.tsx", "utf8");
  const required = [
    ["Latte scremato", "part-milk-skimmed-v1177"],
    ["Latte senza lattosio parzialmente scremato", "part-milk-lactose-free-v1177"],
    ["Bevanda di mandorla senza zucchero", "part-almond-drink-v1177"],
    ["Uova alla coque", "part-soft-boiled-egg-v1177"],
    ["Patate al vapore", "part-potatoes-steamed-v1177"],
  ];
  for (const [food, asset] of required) {
    assert.match(app, new RegExp(food));
    assert.match(app, new RegExp('photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
  assert.match(app, /const breakfastMilkAlternatives = \[[\s\S]*Bevanda di mandorla senza zucchero/);
});

test("v1.17.8 distinguishes chicken methods and lean beef alternatives", async () => {
  const app = await readFile("app/FoodPlanner.tsx", "utf8");
  const required = [
    ["Petto di pollo alla griglia", "part-chicken-grilled-v1178"],
    ["Petto di pollo lesso", "part-chicken-poached-v1178"],
    ["Petto di pollo al vapore", "part-chicken-steamed-v1178"],
    ["Roast beef magro", "part-roast-beef-v1178"],
    ["Carpaccio di manzo · peso a crudo", "part-beef-carpaccio-v1178"],
  ];
  for (const [food, asset] of required) {
    assert.match(app, new RegExp(food));
    assert.match(app, new RegExp('photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
  assert.match(app, /Carpaccio di manzo · peso a crudo[\s\S]*source: "CREA"/);
});

test("v1.17.9 recognises practical cooking methods in recipe metadata", async () => {
  const app = await readFile("app/FoodPlanner.tsx", "utf8");
  assert.match(app, /\["Cartoccio", \/cartoccio\/\]/);
  assert.match(app, /\["Friggitrice ad aria", \/friggitrice ad aria\|air fryer\/\]/);
  assert.match(app, /\["In umido", \/in umido\|stufat\/\]/);
  assert.match(app, /name: "Orata al cartoccio con verdure e pane"/);
  assert.match(app, /Cuoci il salmone in forno o friggitrice ad aria/);
});

test("v1.18.0 adds four complete everyday legume dishes with faithful photos", async () => {
  const app = await readFile("app/FoodPlanner.tsx", "utf8");
  const required = [
    ["Pasta e fagioli", "recipe-pasta-beans-v1180"],
    ["Riso integrale con lenticchie, carote e zucchine", "recipe-rice-lentils-v1180"],
    ["Farro con ceci, pomodorini e cetriolo", "recipe-farro-chickpeas-v1180"],
    ["Insalata di ceci, cannellini e lenticchie", "recipe-mixed-legumes-v1180"],
  ];
  for (const [name, asset] of required) {
    assert.match(app, new RegExp(name));
    assert.match(app, new RegExp('photo\\("' + asset + '"\\)'));
    await access(new URL("../dist/food/" + asset + ".png", import.meta.url));
  }
  assert.match(app, /\.\.\.everydayLegumeRecipes/);
});
