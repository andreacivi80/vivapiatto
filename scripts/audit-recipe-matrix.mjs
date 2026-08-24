import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const ids = [...source.matchAll(/id:\s*"(matrix-[cspd]\d{2})-[^"]+"/g)].map((match) => match[1]);
const counts = new Map();
for (const id of ids) counts.set(id, (counts.get(id) || 0) + 1);

const expected = [
  ...Array.from({ length: 44 }, (_, index) => `matrix-c${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 42 }, (_, index) => `matrix-s${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 64 }, (_, index) => `matrix-p${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 64 }, (_, index) => `matrix-d${String(index + 1).padStart(2, "0")}`),
];

const missing = expected.filter((id) => !counts.has(id));
const duplicates = [...counts.entries()].filter(([, count]) => count !== 1);
const unexpected = [...counts.keys()].filter((id) => !expected.includes(id));

const extractObjectAt = (id) => {
  const idMatch = new RegExp(`id:\\s*"${id}-`).exec(source);
  const idIndex = idMatch?.index ?? -1;
  if (idIndex < 0) return "";
  const start = source.lastIndexOf("{", idIndex);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
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
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return "";
};

const incomplete = expected.flatMap((id) => {
  const recipe = extractObjectAt(id);
  const issues = [];
  if (!/name:\s*"[^"]+"/.test(recipe)) issues.push("nome");
  if (!/course:\s*"[^"]+"/.test(recipe)) issues.push("pasto");
  if (!/image:\s*photo\("[^"]+"\)/.test(recipe)) issues.push("foto");
  if (!/time:\s*[1-9]\d*/.test(recipe)) issues.push("tempo");
  if (!/ingredients:\s*\[[\s\S]*?food:[\s\S]*?grams:\s*[1-9]/.test(recipe)) issues.push("ingredienti e grammi");
  if (!/steps:\s*\[[\s\S]*?["`][^"`]+["`]/.test(recipe)) issues.push("preparazione");
  if (!/alternatives:\s*\[[\s\S]*?["`][^"`]+["`]/.test(recipe)) issues.push("alternative");
  return issues.length ? [`${id}: ${issues.join(", ")}`] : [];
});

const dedicatedSnackPhotos = new Map([
  ["matrix-s11-banana-peanut", "recipe-s11-banana-peanut-v11867"],
  ["matrix-s27-apricot-almond", "recipe-s27-apricot-almond-v11867"],
  ["matrix-s28-kefir-blackberries-flax", "recipe-s28-kefir-blackberries-flax-v11867"],
  ["matrix-s29-ricotta-apple", "recipe-s29-ricotta-apple-v11867"],
  ["matrix-s30-rice-cakes-hummus", "recipe-s30-rice-cakes-hummus-v11867"],
  ["matrix-s31-orange-peanuts", "recipe-s31-orange-peanuts-v11867"],
  ["matrix-s32-cottage-carrot-cucumber", "recipe-s32-cottage-carrot-cucumber-v11867"],
  ["matrix-s33-yogurt-pineapple-sesame", "recipe-s33-yogurt-pineapple-sesame-v11867"],
  ["matrix-s34-rye-ricotta-radish", "recipe-s34-rye-ricotta-radish-v11867"],
]);
const missingDedicatedSnackPhotos = [...dedicatedSnackPhotos].filter(
  ([id, asset]) => !source.includes(id) || !source.includes(asset),
);

if (missing.length) throw new Error(`Ricette matrice mancanti: ${missing.join(", ")}`);
if (duplicates.length) {
  throw new Error(
    `ID matrice duplicati: ${duplicates.map(([id, count]) => `${id} × ${count}`).join(", ")}`,
  );
}
if (unexpected.length) throw new Error(`ID matrice inattesi: ${unexpected.join(", ")}`);
if (incomplete.length) throw new Error(`Ricette matrice incomplete: ${incomplete.join("; ")}`);
if (missingDedicatedSnackPhotos.length) {
  throw new Error(
    `Foto dedicate spuntini mancanti: ${missingDedicatedSnackPhotos.map(([id]) => id).join(", ")}`,
  );
}

console.log(`Matrice ricette: ${expected.length}/${expected.length} complete e univoche (C44, S42, P64, D64).`);
