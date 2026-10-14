import { createServer } from "vite";

const strict = process.argv.includes("--strict");
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });

try {
  const { recipePhotoCoverage } = await server.ssrLoadModule("/app/FoodPlanner.tsx");
  const atomic = recipePhotoCoverage.filter((recipe) =>
    /\/food\/part-|\/food\/(?:breakfast|lunch|dinner|snack|chicken-bowl|pasta)(?:[.?]|$)/.test(recipe.image),
  );
  console.log(
    `Semantica foto ricette: ${recipePhotoCoverage.length - atomic.length}/${recipePhotoCoverage.length} usano una fotografia finale esplicita.`,
  );
  if (atomic.length) {
    console.log(JSON.stringify(atomic, null, 2));
    if (strict) process.exitCode = 1;
  }
} finally {
  await server.close();
}
