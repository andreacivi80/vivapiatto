import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
const recipeObjects = [];
for (const match of source.matchAll(/\bid:\s*["'][^"']+["']/g)) {
  const start = source.lastIndexOf("{", match.index);
  if (start < 0) continue;
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) { recipeObjects.push(source.slice(start, index + 1)); break; }
  }
}

const failures = [];
let combinations = 0;
for (const chunk of recipeObjects) {
  const id = chunk.match(/id:\s*["']([^"']+)/)?.[1];
  const foods = [...chunk.matchAll(/food:\s*["']([^"']+)["']\s*,\s*grams:\s*(\d+(?:\.\d+)?)/g)]
    .map((match) => match[1]);
  if (!id || !foods.some((food) => /(salmone|sgombro)/i.test(food))) continue;
  const oils = [...chunk.matchAll(/food:\s*["']Olio extravergine["']\s*,\s*grams:\s*(\d+(?:\.\d+)?)/g)]
    .map((match) => Number(match[1]));
  if (!oils.length) continue;
  combinations += 1;
  const excessive = oils.filter((grams) => grams > 5);
  if (excessive.length) failures.push(`${id}: olio EVO ${Math.max(...excessive)} g`);
}

if (!combinations) throw new Error("Audit pesce grasso: nessuna ricetta con olio rilevata.");
if (failures.length) throw new Error(`Olio da ridurre con salmone o sgombro:\n${failures.join("\n")}`);
console.log(`Audit pesce grasso: ${combinations} ricette con olio EVO non oltre 5 g.`);
