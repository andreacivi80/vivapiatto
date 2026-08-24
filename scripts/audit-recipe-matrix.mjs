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

if (missing.length) throw new Error(`Ricette matrice mancanti: ${missing.join(", ")}`);
if (duplicates.length) {
  throw new Error(
    `ID matrice duplicati: ${duplicates.map(([id, count]) => `${id} × ${count}`).join(", ")}`,
  );
}
if (unexpected.length) throw new Error(`ID matrice inattesi: ${unexpected.join(", ")}`);

console.log(`Matrice ricette: ${expected.length}/${expected.length} ID univoci presenti (C44, S42, P64, D64).`);
