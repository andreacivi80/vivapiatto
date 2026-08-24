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
const targets = {
  pesce: [2, 3],
  legumi: [3, 3],
  "carne-bianca": [1, 2],
  "carne-rossa": [0, 1],
  uova: [2, 4],
  latticini: [2, 3],
  salumi: [0, 1],
};
const outOfRange = Object.entries(targets).filter(([family, [minimum, maximum]]) => {
  const count = counts[family] || 0;
  return count < minimum || count > maximum;
});
if (outOfRange.length) {
  throw new Error(
    `Rotazione iniziale fuori range: ${outOfRange
      .map(([family, range]) => `${family} ${counts[family] || 0}/${range[0]}-${range[1]}`)
      .join(", ")}`,
  );
}

const consecutive = rotation.filter(
  (family, index) => index > 0 && family === rotation[index - 1],
);
if (consecutive.length) throw new Error(`Proteine consecutive duplicate: ${consecutive.join(", ")}`);

console.log(
  `Rotazione settimanale: 14/14 pasti nei range, senza famiglie proteiche consecutive (${Object.entries(counts)
    .map(([family, count]) => `${family} ${count}`)
    .join(", ")}).`,
);
