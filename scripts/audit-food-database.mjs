import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const start = source.indexOf("const foods:");
const end = source.indexOf("const occasionalFoodRows", start);
if (start < 0 || end < 0) throw new Error("Banca dati alimenti non trovata");

const block = source.slice(start, end);
const allowedSources = new Set(["CREA", "USDA", "FRIDA", "ETICHETTA", "HUMANITAS", "IEO", "RICETTA CALCOLATA"]);
const records = [];
for (const match of block.matchAll(/(?:^|[,;]\s*|foods\[)(?:"([^"]+)"|([A-Za-zÀ-ÿ][\wÀ-ÿ ]*))\]?\s*(?::|=)\s*\{([\s\S]*?)\}/gm)) {
  const name = (match[1] || match[2] || "").trim();
  const body = match[3];
  const readNumber = (field) => Number(new RegExp(`${field}:\\s*(-?\\d+(?:\\.\\d+)?)`).exec(body)?.[1]);
  const sourceName = /source:\s*"([^"]+)"/.exec(body)?.[1] || "";
  records.push({
    name,
    kcal: readNumber("kcal"),
    protein: readNumber("protein"),
    carbs: readNumber("carbs"),
    fat: readNumber("fat"),
    fiber: readNumber("fiber"),
    source: sourceName,
  });
}

const invalid = records.flatMap((record) => {
  const issues = [];
  if (!record.name) issues.push("nome mancante");
  for (const field of ["kcal", "protein", "carbs", "fat", "fiber"]) {
    const value = record[field];
    if (!Number.isFinite(value) || value < 0) issues.push(`${field} non valido`);
  }
  if (record.kcal > 950) issues.push("kcal oltre limite fisico plausibile");
  for (const field of ["protein", "carbs", "fat", "fiber"]) {
    if (record[field] > 100) issues.push(`${field} oltre 100 g/100 g`);
  }
  if (!allowedSources.has(record.source)) issues.push(`fonte non riconosciuta: ${record.source || "assente"}`);
  return issues.length ? [`${record.name || "voce senza nome"}: ${issues.join(", ")}`] : [];
});

if (records.length < 150) throw new Error(`Banca dati alimenti troppo piccola: ${records.length}`);
if (invalid.length) throw new Error(`Valori alimentari non validi:\n${invalid.join("\n")}`);

console.log(`Banca dati alimenti: ${records.length} voci con macro, fibre e fonte riconosciuta.`);
