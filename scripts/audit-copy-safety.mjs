import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const forbiddenClaims = [
  /\bdetox\b/i,
  /brucia[ -]?grassi/i,
  /miracol/i,
  /anti[ -]?cancro/i,
  /\bcurativo\b/i,
];
const found = forbiddenClaims.filter((pattern) => pattern.test(source));
if (found.length) throw new Error(`Claim sanitario vietato: ${found.join(", ")}`);
console.log("Controllo copy sanitario: nessun claim vietato.");
