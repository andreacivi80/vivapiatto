import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const rotationBlock = source.match(
  /const WEEKLY_MAIN_ROTATION:[\s\S]+?= \[([\s\S]+?)\];/,
)?.[1];
if (!rotationBlock) throw new Error("Rotazione settimanale principale non trovata");

const rotation = [...rotationBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
if (rotation.length !== 14) throw new Error(`Pasti principali nella rotazione: ${rotation.length}/14`);

const counts = rotation.reduce((result, family) => {
  result[family] = (result[family] || 0) + 1;
  return result;
}, {});
// These are meal slots, not CREA standard portions. The rendered weekly audit
// checks the actual 50 g egg equivalents after quantities are calibrated.
if (Object.keys(counts).length < 6 || Object.values(counts).some((count) => count > 4) || counts.uova > 1)
  throw new Error(`Rotazione iniziale poco varia: ${JSON.stringify(counts)}`);

const consecutive = rotation.filter(
  (family, index) => index > 0 && family === rotation[index - 1],
);
if (consecutive.length) throw new Error(`Proteine consecutive duplicate: ${consecutive.join(", ")}`);

console.log(
  `Rotazione settimanale: 14/14 pasti diversi per fonte, senza confondere pasti e porzioni CREA (${Object.entries(counts)
    .map(([family, count]) => `${family} ${count}`)
    .join(", ")}).`,
);
