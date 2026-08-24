import { readFile } from "node:fs/promises";

const source = await readFile("app/FoodPlanner.tsx", "utf8");
const selectableBlocks = [
  source.match(/const mealPartOptions:[\s\S]+?\n};/)?.[0] || "",
  source.match(/const ingredientPartCatalog:[\s\S]+?\n};/)?.[0] || "",
].join("\n");
const picturedFoods = new Map(
  [...selectableBlocks.matchAll(/food:\s*"([^"]+)"[\s\S]{0,260}?image:\s*photo\("([^"]+)"\)/g)].map(
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
  "Nettarina fresca", "Seitan alla piastra", "Stracchino", "Prosciutto crudo sgrassato",
  "Parmigiano Reggiano DOP", "Rape crude", "Rape cotte bollite", "Patate cotte arrosto", "Aceto di mele",
  "Pesce spada cotto", "Palombo · peso a crudo", "Alici fresche · peso a crudo", "Lupini ammollati",
  "Yogurt greco 0%", "Yogurt proteico alla vaniglia", "Budino proteico al cioccolato",
  "Ricotta vaccina", "Mozzarella light", "Crescenza", "Primo sale", "Scamorza", "Provolone Dolce Auricchio",
  "Pasta integrale secca", "Pasta di lenticchie secca", "Riso basmati secco", "Riso Venere secco",
  "Quinoa cotta", "Gnocchi di patate", "Patate lesse", "Pane integrale", "Pane di segale",
  "Pane di farro", "Pane ai cereali", "Olio extravergine",
];

required.push(
  "Latte scremato", "Latte senza lattosio parzialmente scremato", "Bevanda di mandorla senza zucchero",
  "Muesli", "Gallette di riso integrale", "Farina d'avena", "Farina di frumento integrale", "Farina di grano saraceno",
  "Yogurt bianco", "Yogurt greco 2%", "Skyr bianco", "Kefir bianco magro", "Fiocchi di latte", "Formaggio fresco magro",
  "Pompelmo rosa fresco", "Mandarini freschi", "Mirtilli freschi", "Lamponi", "More", "Prugne fresche", "Melagrana fresca",
  "Nocciole", "Pistacchi", "Anacardi non salati", "Noci pecan", "Semi di chia", "Semi di zucca", "Semi di girasole", "Semi di sesamo",
  "Pasta di semola secca", "Pasta di farro secca", "Riso integrale secco", "Riso parboiled cotto", "Riso rosso integrale cotto",
  "Farro cotto", "Orzo perlato cotto", "Cous cous integrale cotto", "Bulgur cotto", "Grano saraceno cotto", "Miglio cotto", "Polenta cotta",
  "Patate al vapore", "Patata dolce cotta", "Nasello cotto", "Branzino cotto", "Sogliola · peso a crudo", "Platessa cotta",
  "Rombo · peso a crudo", "Trota cotta", "Tonno fresco cotto", "Tonno al naturale sgocciolato", "Sgombro cotto",
  "Sgombro al naturale sgocciolato", "Sardine cotte", "Polpo cotto", "Seppia · peso a crudo", "Calamari cotti alla griglia",
  "Gamberi cotti", "Cozze cotte", "Vongole cotte", "Petto di pollo alla griglia",
  "Petto di pollo lesso", "Petto di pollo al vapore", "Petto di tacchino cotto alla piastra", "Petto di tacchino al forno",
  "Coniglio cotto in umido", "Bistecca di vitello · peso a crudo", "Bistecca di manzo · peso a crudo", "Roast beef magro",
  "Carpaccio di manzo · peso a crudo", "Bresaola", "Prosciutto cotto", "Fagioli borlotti cotti", "Fagioli rossi cotti",
  "Fagioli neri cotti", "Fave cotte", "Edamame cotti", "Cicerchie cotte", "Hummus di ceci", "Tofu alla piastra", "Tempeh",
  "Uovo in camicia", "Mozzarella vaccina", "Feta", "Grana Padano DOP", "Insalata verde", "Lattuga fresca", "Rucola",
  "Radicchio cotto", "Songino fresco", "Spinaci", "Bietole cotte", "Cicoria cotta", "Catalogna fresca", "Cavolo nero cotto",
  "Cavolo cappuccio cotto", "Cavolo rosso crudo", "Verza fresca", "Cavolini di Bruxelles cotti", "Cime di rapa cotte",
  "Fagiolini", "Porro cotto", "Cipolle crude", "Cipollotti freschi", "Barbabietole cotte", "Ravanelli crudi",
  "Passato di verdure", "Vellutata di verdure senza panna", "Succo di limone", "Aceto di vino", "Aceto balsamico",
  "Sale iodato", "Erba cipollina fresca", "Aglio crudo", "Prezzemolo fresco", "Basilico fresco",
  "Rosmarino fresco", "Salvia fresca", "Origano secco", "Timo fresco", "Pepe nero",
  "Curcuma in polvere", "Paprika dolce", "Zenzero fresco", "Curry in polvere", "Peperoncino rosso fresco",
);

const duplicateRequired = required.filter(
  (food, index) => required.indexOf(food) !== index,
);
if (duplicateRequired.length) throw new Error(`Checklist paniere duplicata: ${duplicateRequired.join(", ")}`);

const missing = required.filter((food) => !picturedFoods.has(food));
if (missing.length) throw new Error(`Alimenti richiesti non selezionabili con foto: ${missing.join(", ")}`);

if (!/name:\s*"[^"]*Pancake[^"]*"[\s\S]{0,300}?image:\s*photo\("[^"]+"\)/i.test(source)) {
  throw new Error("Ricetta pancake richiesta non presente con foto dedicata");
}

console.log(`Paniere richiesto: ${required.length}/${required.length} alimenti selezionabili con foto dedicata; pancake presente.`);
