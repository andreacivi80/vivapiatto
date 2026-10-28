import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const aromatics = {
  curry: { food: "Curry in polvere", grams: 2, asset: "part-curry-v11866" },
  turmeric: { food: "Curcuma in polvere", grams: 1, asset: "part-turmeric-v11866" },
  ginger: { food: "Zenzero fresco", grams: 5, asset: "part-ginger-v11866" },
  garlic: { food: "Aglio crudo", grams: 3, asset: "part-garlic-v11866" },
  paprika: { food: "Paprika dolce", grams: 2, asset: "part-paprika-v11866" },
};

// Editorial amounts for one person, not quantities attributed to recipe sources.
const whitelist = {
  bowl: ["paprika"],
  "chicken-farro": ["paprika"],
  "matrix-p49-millet-chicken-pumpkin": ["paprika"],
  "matrix-p50-gnocchi-cannellini-chard": ["garlic"],
  "matrix-p52-bulgur-tofu-chickpeas": ["ginger", "paprika"],
  "matrix-p45-couscous-shrimp-peppers": ["paprika"],
  "matrix-p42-basmati-cod-spinach": ["turmeric", "ginger"],
  "matrix-d01-merluzzo-al-forno-con-patate-e-zucchine": ["garlic"],
  "matrix-d06-ceci-speziati-con-cavolfiore-e-cous-cous": ["curry", "turmeric", "paprika"],
  "matrix-d07-tofu-con-verdure-croccanti-e-riso-integrale": ["ginger", "garlic"],
  "matrix-d13-burger-di-legumi-al-forno-con-verdure": ["paprika"],
  "matrix-d15-branzino-al-vapore-con-orzo-e-bietole": ["garlic"],
  "matrix-d17-trota-al-forno-con-zucca-e-patate": ["garlic"],
  "matrix-d18-tacchino-con-carciofi-e-pane-integrale": ["garlic"],
  "matrix-d23-polpette-di-lenticchie-con-melanzane-e-salsa-all": ["paprika"],
  "matrix-d25-tofu-al-curry-con-zucca-e-riso-basmati": ["curry", "turmeric", "ginger"],
  "matrix-d26-coniglio-al-rosmarino-con-verdure-al-forno": ["garlic"],
  "matrix-d28-fave-cicoria-e-pane-integrale": ["garlic"],
  "matrix-d29-nasello-al-vapore-con-patata-dolce-e-bietole": ["garlic"],
  "matrix-d30-pollo-al-rosmarino-con-cavolfiore-e-pane": ["paprika"],
  "matrix-d35-tofu-con-cavolo-nero-funghi-e-riso-basmati": ["ginger", "garlic"],
  "matrix-d38-burger-di-ceci-con-radicchio-e-patata-dolce": ["paprika"],
  "matrix-d40-sardine-al-forno-con-pomodori-zucchine-e-cous-co": ["garlic"],
  "matrix-d49-burger-di-fagioli-rossi-con-cavolo-e-patate": ["paprika"],
  "matrix-d50-tacchino-con-funghi-spinaci-e-polenta": ["garlic"],
  "matrix-d52-tofu-con-melanzane-pomodori-e-cous-cous": ["paprika"],
  "matrix-d54-tacchino-con-cavolo-cappuccio-e-patata-dolce": ["paprika"],
  "matrix-d55-zuppa-di-fagioli-neri-zucca-e-spinaci": ["paprika"],
  "matrix-d57-tofu-al-forno-con-broccoli-e-patate": ["ginger", "paprika"],
  "matrix-d59-ricotta-con-carciofi-pomodori-e-pane-di-farro": ["garlic"],
  "matrix-d61-polpette-di-ceci-con-cavolfiore-e-riso-basmati": ["curry", "turmeric"],
  "matrix-d64-tempeh-con-melanzane-pomodori-e-miglio": ["paprika"],
  "matrix-p53-pasta-integrale-con-lenticchie-e-spinaci": ["garlic"],
  "matrix-p55-quinoa-con-tacchino-zucca-e-broccoli": ["paprika"],
  "matrix-p57-cous-cous-con-merluzzo-e-verdure-al-curry": ["curry", "turmeric", "ginger"],
  "matrix-p61-miglio-con-tempeh-carciofi-e-carote": ["turmeric"],
  "matrix-p62-polenta-con-gamberi-e-verdure-in-umido": ["garlic"],
  "matrix-p63-bulgur-con-pollo-cavolfiore-e-radicchio": ["paprika"],
  "matrix-p03-quinoa-edamame-ginger": ["ginger"],
  "matrix-p04-basmati-light-chicken-curry": ["curry"],
  "matrix-s15-hummus-cucumber-carrots": ["paprika"],
  "matrix-p18-quinoa-chicken-peppers-turmeric": ["turmeric", "paprika"],
  "matrix-p20-bulgur-red-beans-cabbage": ["paprika"],
  "matrix-p21-venere-tuna-zucchini-carrots": ["ginger"],
  "matrix-p27-millet-chickpeas-cauliflower-curry": ["curry", "turmeric", "ginger"],
  "matrix-p28-red-rice-tofu-edamame-vegetables": ["ginger"],
  "matrix-p29-whole-pasta-cannellini-broccoli": ["garlic"],
};

const source = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("FoodPlanner.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const property = (node, name) => node.properties.find((entry) =>
  ts.isPropertyAssignment(entry) &&
  (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) && entry.name.text === name,
)?.initializer;
const stringValue = (node) => node && ts.isStringLiteral(node) ? node.text : undefined;
const recipes = new Map();
const visit = (node) => {
  if (ts.isObjectLiteralExpression(node)) {
    const id = stringValue(property(node, "id"));
    const ingredients = property(node, "ingredients");
    if (id && ingredients && ts.isArrayLiteralExpression(ingredients)) {
      const matches = recipes.get(id) || [];
      matches.push(node);
      recipes.set(id, matches);
    }
  }
  ts.forEachChild(node, visit);
};
visit(ast);

const arrayEntries = (node, field, id) => {
  const array = property(node, field);
  assert.ok(array && ts.isArrayLiteralExpression(array), `${id}: ${field} must be a literal array`);
  return array.elements.map((entry) => {
    assert.ok(ts.isObjectLiteralExpression(entry), `${id}: ${field} contains a non-object entry`);
    const food = stringValue(property(entry, "food"));
    const grams = property(entry, "grams");
    assert.equal(typeof food, "string", `${id}: ${field} has no literal food`);
    assert.ok(grams && ts.isNumericLiteral(grams), `${id}: ${food} has no literal grams`);
    return { node: entry, food, grams: Number(grams.text) };
  });
};
const signature = (entries) => entries.map(({ food, grams }) => JSON.stringify([food, grams])).sort();

test("v1.20.61 explicit aromatic whitelist covers 47 recipes and 62 measured additions", () => {
  assert.equal(ast.parseDiagnostics.length, 0);
  assert.equal(Object.keys(whitelist).length, 47);
  assert.equal(Object.values(whitelist).reduce((total, entries) => total + entries.length, 0), 62);
  for (const [id, keys] of Object.entries(whitelist)) {
    assert.equal(new Set(keys).size, keys.length, `${id}: duplicate aromatic whitelist entry`);
    assert.equal(recipes.get(id)?.length, 1, `${id}: expected one actual recipe object`);
    const entries = arrayEntries(recipes.get(id)[0], "ingredients", id);
    for (const key of keys) {
      const expected = aromatics[key];
      assert.ok(expected, `${id}: unknown aromatic key ${key}`);
      const matches = entries.filter(({ food }) => food === expected.food);
      assert.equal(matches.length, 1, `${id}: expected exactly one ${expected.food}`);
      assert.equal(matches[0].grams, expected.grams, `${id}: wrong ${expected.food} grams`);
    }
  }
});

test("v1.20.61 explicit aromatic components match ingredients, labels and canonical photos", () => {
  let explicitPartRecipes = 0;
  let aromaticParts = 0;
  for (const [id, keys] of Object.entries(whitelist)) {
    const recipe = recipes.get(id)?.[0];
    assert.ok(recipe, `${id}: recipe missing`);
    if (!property(recipe, "parts")) continue;
    explicitPartRecipes += 1;
    const ingredients = arrayEntries(recipe, "ingredients", id);
    const parts = arrayEntries(recipe, "parts", id);
    assert.deepEqual(signature(parts), signature(ingredients), `${id}: ingredient/component mismatch`);
    for (const key of keys) {
      const expected = aromatics[key];
      const matches = parts.filter(({ food }) => food === expected.food);
      assert.equal(matches.length, 1, `${id}: duplicate or missing ${expected.food} component`);
      const part = matches[0];
      assert.equal(part.grams, expected.grams, `${id}: wrong component grams`);
      assert.equal(stringValue(property(part.node, "category")), "Extra", `${id}: wrong aromatic category`);
      assert.equal(stringValue(property(part.node, "label")), expected.food, `${id}: label must not embed grams`);
      const image = property(part.node, "image");
      assert.ok(image && ts.isCallExpression(image), `${id}: component photo call missing`);
      assert.ok(ts.isIdentifier(image.expression) && image.expression.text === "photo", `${id}: canonical photo helper missing`);
      assert.equal(stringValue(image.arguments[0]), expected.asset, `${id}: wrong component photograph`);
      aromaticParts += 1;
    }
  }
  assert.equal(explicitPartRecipes, 36);
  assert.equal(aromaticParts, 48);
});

test("v1.20.61 canonical aromatic photographs exist in source assets and built distribution", async () => {
  for (const { asset } of Object.values(aromatics)) {
    await access(new URL(`../public/food/${asset}.png`, import.meta.url));
    await access(new URL(`../dist/food/${asset}.png`, import.meta.url));
  }
});

test("v1.20.61 six explicit onion and consumed-vinegar omissions use matching measured components", async () => {
  const onion = { food: "Cipolle crude", grams: 40, category: "Contorno", asset: "part-onions-raw-v1209" };
  const wineVinegar = { food: "Aceto di vino", grams: 5, category: "Extra", asset: "part-wine-vinegar-v1181" };
  const appleVinegar = { food: "Aceto di mele", grams: 5, category: "Extra", asset: "part-apple-cider-vinegar-v11850" };
  const measuredAdditions = {
    "matrix-p17-brown-risotto-peas-shrimp": onion,
    "matrix-p20-bulgur-red-beans-cabbage": onion,
    "matrix-d03-pollo-alla-piastra-con-caponata-leggera": wineVinegar,
    "matrix-d54-tacchino-con-cavolo-cappuccio-e-patata-dolce": appleVinegar,
    "matrix-p44-quinoa-cannellini-beet": appleVinegar,
    "matrix-p56-farro-con-ceci-barbabietole-e-finocchi": appleVinegar,
  };
  assert.equal(Object.keys(measuredAdditions).length, 6);
  for (const [id, expected] of Object.entries(measuredAdditions)) {
    assert.equal(recipes.get(id)?.length, 1, `${id}: expected one actual recipe object`);
    const recipe = recipes.get(id)[0];
    const ingredients = arrayEntries(recipe, "ingredients", id);
    const matchingIngredients = ingredients.filter(({ food }) => food === expected.food);
    assert.equal(matchingIngredients.length, 1, `${id}: missing or duplicated ${expected.food}`);
    assert.equal(matchingIngredients[0].grams, expected.grams, `${id}: wrong ingredient grams`);
    if (property(recipe, "parts")) {
      const parts = arrayEntries(recipe, "parts", id);
      assert.deepEqual(signature(parts), signature(ingredients), `${id}: ingredient/component mismatch`);
      const matches = parts.filter(({ food }) => food === expected.food);
      assert.equal(matches.length, 1, `${id}: missing or duplicate measured component`);
      const part = matches[0];
      assert.equal(part.grams, expected.grams, `${id}: wrong component grams`);
      assert.equal(stringValue(property(part.node, "category")), expected.category);
      assert.equal(stringValue(property(part.node, "label")), expected.food);
      const image = property(part.node, "image");
      assert.ok(image && ts.isCallExpression(image), `${id}: component photo call missing`);
      assert.ok(ts.isIdentifier(image.expression) && image.expression.text === "photo", `${id}: canonical photo helper missing`);
      assert.equal(stringValue(image.arguments[0]), expected.asset, `${id}: wrong measured-component photograph`);
    }
    await access(new URL(`../public/food/${expected.asset}.png`, import.meta.url));
    await access(new URL(`../dist/food/${expected.asset}.png`, import.meta.url));
  }
});
