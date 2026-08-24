import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const start = source.indexOf("const mealPartOptions:");
const end = source.indexOf("const seasonalMonths", start);
if (start < 0 || end < 0) throw new Error("Catalogo alternative non individuato");

const catalog = source.slice(start, end);
const categories = ["Carboidrato", "Proteina", "Contorno", "Latticino", "Frutta", "Extra"];
let checked = 0;

for (let index = 0; index < categories.length; index += 1) {
  const category = categories[index];
  const next = categories[index + 1];
  const categoryStart = catalog.indexOf(`${category}: [`);
  const categoryEnd = next ? catalog.indexOf(`${next}: [`, categoryStart) : catalog.length;
  if (categoryStart < 0 || categoryEnd < 0) throw new Error(`Categoria alternative mancante: ${category}`);
  const block = catalog.slice(categoryStart, categoryEnd);
  const foods = [...block.matchAll(/food:\s*"([^"]+)"/g)].map((match) => match[1].trim());
  const duplicates = [...new Set(foods.filter((food, position) => foods.indexOf(food) !== position))];
  if (duplicates.length) throw new Error(`Alternative duplicate in ${category}: ${duplicates.join(", ")}`);
  if (foods.some((food) => !food || /^(nessuno|null|undefined)$/i.test(food))) {
    throw new Error(`Segnaposto vuoto presente nelle alternative ${category}`);
  }
  checked += foods.length;
}

console.log(`Catalogo alternative: ${checked} alimenti senza duplicati o card vuote nella stessa categoria.`);
