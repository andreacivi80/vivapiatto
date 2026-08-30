import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const ids = [...source.matchAll(/id:\s*"(matrix-[cspd]\d{2})-[^"]+"/g)].map((match) => match[1]);
const runtimeOverrideIds = new Set(
  [...source.matchAll(/"(matrix-[cspd]\d{2})-[^"]+":\s*"recipe-[^"]+"/g)].map((match) => match[1]),
);

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
    if (escaped) { escaped = false; continue; }
    if (quote && character === "\\") { escaped = true; continue; }
    if (quote) { if (character === quote) quote = ""; continue; }
    if (character === '"' || character === "'" || character === "`") { quote = character; continue; }
    if (character === "{") depth += 1;
    if (character === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  return "";
};

const withoutDedicatedPhoto = ids.flatMap((id) => {
  const recipe = extractObjectAt(id);
  const asset = recipe.match(/image:\s*photo\("([^"]+)"\)/)?.[1] || "";
  return asset.startsWith("recipe-") || runtimeOverrideIds.has(id) ? [] : [{ id, asset }];
});

if (process.argv.includes("--strict") && withoutDedicatedPhoto.length) {
  throw new Error(`Ricette senza foto completa dedicata: ${withoutDedicatedPhoto.map(({ id }) => id).join(", ")}`);
}

console.log(`Foto complete dedicate: ${ids.length - withoutDedicatedPhoto.length}/${ids.length}.`);
if (withoutDedicatedPhoto.length) {
  console.log(withoutDedicatedPhoto.map(({ id, asset }) => `${id}: ${asset}`).join("\n"));
}
