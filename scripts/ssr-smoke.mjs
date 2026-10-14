import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { FoodPlanner, proteinFamilyForItems, initialWeeklyProteinFamilies } =
    await server.ssrLoadModule("/app/FoodPlanner.tsx");
  assert.equal(proteinFamilyForItems([{ food: "Roast beef magro", grams: 130 }, { food: "Fagiolini", grams: 180 }]), "carne-rossa");
  assert.equal(proteinFamilyForItems([{ food: "Fagiolini", grams: 180 }]), "altro");
  assert.equal(proteinFamilyForItems([{ food: "Fagioli cannellini cotti", grams: 150 }]), "legumi");
  assert.deepEqual(initialWeeklyProteinFamilies, [
    "legumi", "pesce", "carne-bianca", "uova", "legumi", "pesce", "latticini",
    "carne-bianca", "uova", "latticini", "legumi", "carne-rossa", "latticini", "uova",
  ]);
  const html = renderToString(React.createElement(FoodPlanner));
  console.log(`SSR render OK: ${html.length} characters`);
} finally {
  await server.close();
}
