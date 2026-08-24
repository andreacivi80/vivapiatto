import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const foodsStart = source.indexOf("const foods:");
const foodsEnd = source.indexOf("const occasionalFoodRows", foodsStart);
const foodsBlock = source.slice(foodsStart, foodsEnd);
const known = new Set(
  [...foodsBlock.matchAll(/(?:^|[,{]\s*)(?:"([^"]+)"|([A-Za-zÀ-ÿ][\wÀ-ÿ]*))\s*:\s*\{/gm)]
    .map((match) => match[1] || match[2]),
);
for (const match of source.matchAll(/foods(?:\["([^"]+)"\]|\.([A-Za-zÀ-ÿ][\wÀ-ÿ]*))\s*=/g)) {
  known.add(match[1] || match[2]);
}
const occasionalStart = source.indexOf("const occasionalFoodRows");
const occasionalEnd = source.indexOf("const occasionalFoods", occasionalStart);
for (const match of source.slice(occasionalStart, occasionalEnd).matchAll(/\["([^"]+)"\s*,/g)) known.add(match[1]);
const recipeStart = source.indexOf("const simpleBreakfasts");
const recipeEnd = source.indexOf("const rawRecipes", recipeStart);
const ingredients = new Set();
for (const block of source.slice(recipeStart, recipeEnd).matchAll(/ingredients:\s*\[([\s\S]*?)\]/g)) {
  for (const match of block[1].matchAll(/food:\s*"([^"]+)"/g)) ingredients.add(match[1]);
}
const gelatoStart = source.indexOf("const GELATO_FLAVORS");
const gelatoEnd = source.indexOf("] as const", gelatoStart);
for (const match of source.slice(gelatoStart, gelatoEnd).matchAll(/"([^"]+)"/g)) ingredients.add(match[1]);
const missing = [...ingredients].filter((food) => !known.has(food)).sort();
if (missing.length) throw new Error(`Ingredienti senza dati nutrizionali: ${missing.join(", ")}`);
console.log(`Copertura nutrizionale: ${ingredients.size}/${ingredients.size} ingredienti ricetta.`);
