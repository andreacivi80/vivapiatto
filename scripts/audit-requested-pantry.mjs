import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const picturedFoods = new Map(
  [...source.matchAll(/food:\s*"([^"]+)"[\s\S]{0,260}?image:\s*photo\("([^"]+)"\)/g)].map(
    (match) => [match[1], match[2]],
  ),
);

const required = [
  "Latte parzialmente scremato", "Bevanda di soia", "Bevanda d'avena senza zucchero", "Caffè senza zucchero",
  "Fette biscottate integrali", "Confettura di frutta", "Fiocchi d'avena",
  "Mela", "Pera", "Banana", "Arancia", "Kiwi", "Fragole", "Uva", "Pesca",
  "Mango", "Papaya", "Ananas", "Ciliegie fresche", "Albicocche fresche", "Anguria", "Melone estivo",
  "Mandorle", "Noci", "Arachidi", "Crema 100% mandorle", "Semi di lino macinati",
  "Carote crude", "Carote cotte bollite", "Peperoni crudi", "Peperoni cotti senza olio",
  "Zucchine", "Melanzane", "Zucca", "Cavolfiore", "Broccoli bolliti", "Sedano crudo",
  "Asparagi crudi", "Cetrioli", "Pomodorini", "Funghi", "Olive", "Minestrone cotto",
  "Ceci cotti", "Lenticchie cotte", "Fagioli cannellini cotti", "Piselli cotti", "Hummus di barbabietola",
  "Uova sode", "Uova alla coque", "Uova strapazzate o in frittata", "Burger vegetale di soia",
  "Petto di pollo arrosto", "Coscia di pollo arrosto", "Merluzzo cotto", "Orata cotta", "Salmone cotto",
  "Yogurt greco 0%", "Yogurt proteico alla vaniglia", "Budino proteico al cioccolato",
  "Ricotta vaccina", "Mozzarella light", "Crescenza", "Primo sale", "Scamorza", "Provolone Dolce Auricchio",
  "Pasta integrale secca", "Pasta di lenticchie secca", "Riso basmati secco", "Riso Venere secco",
  "Quinoa cotta", "Gnocchi di patate", "Patate lesse", "Pane integrale", "Pane di segale",
  "Pane di farro", "Pane ai cereali", "Olio extravergine",
];

const missing = required.filter((food) => !picturedFoods.has(food));
if (missing.length) throw new Error(`Alimenti richiesti non selezionabili con foto: ${missing.join(", ")}`);

if (!/name:\s*"[^"]*Pancake[^"]*"[\s\S]{0,300}?image:\s*photo\("[^"]+"\)/i.test(source)) {
  throw new Error("Ricetta pancake richiesta non presente con foto dedicata");
}

console.log(`Paniere richiesto: ${required.length}/${required.length} alimenti selezionabili con foto dedicata; pancake presente.`);
