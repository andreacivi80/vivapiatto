import { readFile } from "node:fs/promises";

const [source, pantryAudit] = await Promise.all([
  readFile("app/FoodPlanner.tsx", "utf8"),
  readFile("scripts/audit-requested-pantry.mjs", "utf8"),
]);

const pantryStart = pantryAudit.indexOf("const required = [");
const pantryEnd = pantryAudit.indexOf("const duplicateRequired");
if (pantryStart < 0 || pantryEnd < 0) throw new Error("Checklist paniere non leggibile");

const requestedFoods = new Set(
  [...pantryAudit.slice(pantryStart, pantryEnd).matchAll(/"([^"]+)"/g)].map((match) => match[1]),
);
const recipeFoods = new Set(
  [...source.matchAll(/ingredients:\s*\[([\s\S]*?)\]/g)].flatMap((match) =>
    [...match[1].matchAll(/food:\s*"([^"]+)"/g)].map((foodMatch) => foodMatch[1]),
  ),
);

const missing = [...requestedFoods].filter((food) => !recipeFoods.has(food));
console.log(
  JSON.stringify(
    {
      requested: requestedFoods.size,
      usedByRecipes: requestedFoods.size - missing.length,
      missing,
    },
    null,
    2,
  ),
);

if (missing.length) process.exitCode = 1;
