import { createServer } from "vite";

const strict = process.argv.includes("--strict");
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });

try {
  const { recipePhotoCoverage } = await server.ssrLoadModule("/app/FoodPlanner.tsx");
  const missing = recipePhotoCoverage.filter((recipe) => !recipe.dedicated);
  console.log(
    `Foto finali dell'intero catalogo: ${recipePhotoCoverage.length - missing.length}/${recipePhotoCoverage.length}.`,
  );
  if (missing.length) {
    console.log(JSON.stringify(missing, null, 2));
    if (strict) process.exitCode = 1;
  }
} finally {
  await server.close();
}
