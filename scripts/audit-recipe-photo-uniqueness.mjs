import { createServer } from "vite";

const strict = process.argv.includes("--strict");
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });

try {
  const { recipePhotoCoverage } = await server.ssrLoadModule("/app/FoodPlanner.tsx");
  const groups = new Map();
  for (const recipe of recipePhotoCoverage) {
    const list = groups.get(recipe.image) || [];
    list.push({ id: recipe.id, name: recipe.name });
    groups.set(recipe.image, list);
  }
  const duplicates = [...groups.entries()]
    .filter(([, recipes]) => recipes.length > 1)
    .map(([image, recipes]) => ({ image, recipes }));
  console.log(`Unicità foto ricette: ${recipePhotoCoverage.length - duplicates.reduce((total, group) => total + group.recipes.length - 1, 0)}/${recipePhotoCoverage.length} associazioni univoche.`);
  if (duplicates.length) {
    console.log(JSON.stringify(duplicates, null, 2));
    if (strict) process.exitCode = 1;
  }
} finally {
  await server.close();
}
