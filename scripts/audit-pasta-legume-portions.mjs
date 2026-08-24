import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
const dryPasta = /^Pasta (?!di lenticchie|di ceci|di piselli|di legumi)/i;
const legumes = /ceci|lenticchie|fagioli|cannellini|borlotti|piselli|fave|cicerchie/i;
const failures = [];
let combinations = 0;

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

for (const chunk of recipeObjects) {
  const id = chunk.match(/id:\s*["']([^"']+)/)?.[1];
  if (!id) continue;
  const entries = [...chunk.matchAll(/food:\s*["']([^"']+)["']\s*,\s*grams:\s*(\d+(?:\.\d+)?)/g)]
    .map((match) => ({ food: match[1], grams: Number(match[2]) }));
  const pastaEntries = entries.filter((item) => dryPasta.test(item.food));
  if (!pastaEntries.length || !entries.some((item) => legumes.test(item.food))) continue;
  combinations += 1;
  const excessive = pastaEntries.filter((item) => item.grams > 70);
  if (excessive.length) failures.push(`${id}: ${excessive.map((item) => `${item.food} ${item.grams} g`).join(", ")}`);
}

if (!combinations) throw new Error("Audit pasta + legumi: nessuna combinazione rilevata.");
if (failures.length) {
  throw new Error(`Pasta a porzione piena nelle combinazioni con legumi:\n${failures.join("\n")}`);
}

console.log(`Audit pasta + legumi: ${combinations} ricette, pasta secca non oltre 70 g.`);
