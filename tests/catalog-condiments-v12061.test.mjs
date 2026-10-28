import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

test("v1.20.61 all 84 catalog meals prepare only their counted condiment", async () => {
  const source = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("FoodPlanner.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initializer;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "catalogMains") initializer = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(initializer, "Actual catalog generator not found");
  const part = (food, grams = 100) => ({ food, grams, label: food, image: "test.png" });
  const scope = {
    rotationMainCarbs: [part("Riso basmati secco")],
    compatibleMainProteins: () => [part("Petto di pollo alla griglia")],
    mealPartOptions: { Contorno: [part("Carote cotte bollite")] },
    rotationMainExtras: [part("Grana Padano DOP", 10), part("Olio extravergine", 10)],
    partDisplayName: (value) => value.label,
    result: null,
  };
  const js = ts.transpileModule(`result = ${initializer.getText(ast)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(js, scope, { timeout: 1000 });
  assert.equal(scope.result.length, 84);
  let cheeseMeals = 0;
  for (const recipe of scope.result) {
    const condiment = recipe.parts[3].food;
    const instructions = recipe.steps.join(" ");
    assert.ok(instructions.includes(condiment), recipe.id);
    assert.equal(recipe.ingredients[3].food, condiment);
    if (condiment === "Grana Padano DOP") {
      cheeseMeals += 1;
      assert.doesNotMatch(instructions, /olio/i, recipe.id);
    } else {
      assert.doesNotMatch(instructions, /grana/i, recipe.id);
    }
  }
  assert.equal(cheeseMeals, 21);
});

test("v1.20.61 unverified curry blends and vinegars are conservatively excluded by their relevant allergy filter", async () => {
  const source = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("FoodPlanner.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let groups;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "groupFoods") groups = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(groups && ts.isObjectLiteralExpression(groups));
  const sampleFoods = { "Curry in polvere": {}, "Curcuma in polvere": {}, "Senape": {}, "Aceto di mele": {}, "Aceto di vino": {}, "Mela": {} };
  const readGroup = (name) => {
    const property = groups.properties.find((value) => value.name?.getText(ast) === name);
    assert.ok(property && ts.isPropertyAssignment(property));
    const js = ts.transpileModule(`result = ${property.initializer.getText(ast)};`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    const scope = { foods: sampleFoods, result: null };
    vm.runInNewContext(js, scope, { timeout: 1000 });
    return Array.from(scope.result);
  };
  assert.deepEqual(readGroup("Senape"), ["Curry in polvere", "Senape"]);
  assert.deepEqual(readGroup("Solfiti"), ["Aceto di mele", "Aceto di vino"]);
  assert.match(source, /Curry: verifica la senape in etichetta/);
  assert.match(source, /Aceto: verifica i solfiti in etichetta/);
});
