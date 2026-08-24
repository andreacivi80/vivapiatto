import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const selectableBlocks = [
  source.match(/const mealPartOptions:[\s\S]+?\n};/)?.[0] || "",
  source.match(/const ingredientPartCatalog:[\s\S]+?\n};/)?.[0] || "",
].join("\n");
const foods = [
  ...new Set(
    [...selectableBlocks.matchAll(/food:\s*"([^"]+)"/g)].map((match) => match[1]),
  ),
].sort((left, right) => left.localeCompare(right, "it"));

console.log(foods.join("\n"));
console.error(`Totale alimenti selezionabili: ${foods.length}`);
