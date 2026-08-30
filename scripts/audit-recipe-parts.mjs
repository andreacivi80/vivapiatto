import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const expected = [
  ...Array.from({ length: 44 }, (_, index) => `matrix-c${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 42 }, (_, index) => `matrix-s${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 64 }, (_, index) => `matrix-p${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 64 }, (_, index) => `matrix-d${String(index + 1).padStart(2, "0")}`),
];

const extractDelimited = (text, start, open, close) => {
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote && character === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === open) depth += 1;
    if (character === close) {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return "";
};

const extractRecipe = (id) => {
  const match = new RegExp(`id:\\s*"${id}-`).exec(source);
  if (!match) return "";
  const start = source.lastIndexOf("{", match.index);
  return extractDelimited(source, start, "{", "}");
};

const extractArray = (recipe, key) => {
  const keyIndex = recipe.indexOf(`${key}:`);
  const start = recipe.indexOf("[", keyIndex);
  return keyIndex >= 0 && start >= 0 ? extractDelimited(recipe, start, "[", "]") : "";
};

const entries = (block) =>
  [...block.matchAll(/food:\s*"([^"]+)"\s*,\s*grams:\s*(\d+(?:\.\d+)?)/g)].map(
    ([, food, grams]) => ({ food, grams: Number(grams) }),
  );

const signature = ({ food, grams }) => `${food}\u0000${grams}`;
const failures = [];

for (const id of expected) {
  const recipe = extractRecipe(id);
  const ingredients = entries(extractArray(recipe, "ingredients"));
  const explicitParts = extractArray(recipe, "parts");
  const parts = explicitParts ? entries(explicitParts) : ingredients;
  const ingredientCounts = new Map();
  const partCounts = new Map();
  for (const item of ingredients) ingredientCounts.set(signature(item), (ingredientCounts.get(signature(item)) || 0) + 1);
  for (const item of parts) partCounts.set(signature(item), (partCounts.get(signature(item)) || 0) + 1);
  const missing = [...ingredientCounts].filter(([item, count]) => (partCounts.get(item) || 0) !== count);
  const extra = [...partCounts].filter(([item, count]) => (ingredientCounts.get(item) || 0) !== count);
  if (missing.length || extra.length) {
    const format = ([item, count]) => `${item.replace("\u0000", " · ")} g${count > 1 ? ` ×${count}` : ""}`;
    failures.push(
      `${id}: mancanti [${missing.map(format).join(", ")}] extra [${extra.map(format).join(", ")}]`,
    );
  }
}

if (failures.length) {
  throw new Error(`Ingredienti e componenti non allineati:\n${failures.join("\n")}`);
}

console.log(`Coerenza ricette: ${expected.length}/${expected.length} con ingredienti, componenti e grammature allineati.`);
