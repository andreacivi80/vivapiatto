import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { FoodPlanner } = await server.ssrLoadModule("/app/FoodPlanner.tsx");
  const html = renderToString(React.createElement(FoodPlanner));
  console.log(`SSR render OK: ${html.length} characters`);
} finally {
  await server.close();
}
