import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const block = source.match(/const occasionalFoodRows:[\s\S]+?\n\];/)?.[0] || "";
const rows = [...block.matchAll(/\["([^"]+)",\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*"([^"]+)"\]/g)]
  .map((match) => ({ name: match[1], values: match.slice(2, 7).map(Number), source: match[7] }));

if (rows.length < 100) throw new Error(`Banca dati sgarri troppo corta: ${rows.length}/100 minimo`);
const duplicateNames = rows.filter((row, index) => rows.findIndex((candidate) => candidate.name === row.name) !== index);
if (duplicateNames.length) throw new Error(`Sgarri duplicati: ${duplicateNames.map((row) => row.name).join(", ")}`);
const invalid = rows.filter(
  (row) => row.values.some((value) => !Number.isFinite(value) || value < 0) || !row.source.trim(),
);
if (invalid.length) throw new Error(`Sgarri senza dati completi: ${invalid.map((row) => row.name).join(", ")}`);

const requiredFamilies = [
  ["pizza", /pizza/i], ["focaccia", /focaccia/i], ["calzone", /calzone/i], ["piadina", /piadina/i],
  ["hamburger", /hamburger/i], ["kebab", /kebab/i], ["patatine", /patatine/i], ["arancini", /arancin/i],
  ["fritto di pesce", /fritto misto|pesce fritto/i], ["carbonara", /carbonara/i], ["lasagne", /lasagne/i],
  ["parmigiana", /parmigiana/i], ["salumi", /salame|mortadella|pancetta|porchetta/i], ["maionese", /maionese/i],
  ["cornetto", /cornetto/i], ["bombolone", /bombolone/i], ["muffin", /muffin/i], ["donut", /donut/i],
  ["waffle", /waffle/i], ["tiramisù", /tiramisu/i], ["cheesecake", /cheesecake/i],
  ["gelato", /gelato/i], ["torta", /torta/i], ["crostata", /crostata/i], ["cannolo", /cannolo/i],
  ["cassata", /cassata/i], ["babà", /babà/i], ["cioccolato", /cioccolato/i], ["caramelle", /caramelle/i],
  ["crema spalmabile", /crema spalmabile/i], ["bibite zuccherate", /bibita gassata/i],
  ["energy drink", /energy drink/i], ["frappè", /frappè/i], ["milkshake", /milkshake/i],
  ["birra", /birra/i], ["vino bianco", /vino bianco/i], ["vino rosso", /vino rosso/i],
  ["prosecco", /prosecco/i], ["liquori", /liquore/i], ["amari", /amaro/i],
];
const missingFamilies = requiredFamilies.filter(([, pattern]) => !rows.some((row) => pattern.test(row.name)));
if (missingFamilies.length) throw new Error(`Famiglie sgarri mancanti: ${missingFamilies.map(([name]) => name).join(", ")}`);

console.log(`Banca dati sgarri: ${rows.length} voci univoche con kcal, proteine, carboidrati, grassi, fibre e fonte.`);
