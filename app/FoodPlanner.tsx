"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { portionOptions, STANDARD_SOURCES } from "./nutritionEngine";

type Macro = { kcal: number; protein: number; carbs: number; fat: number };
type Food = Macro & {
  fiber: number;
  source: "CREA" | "USDA" | "FRIDA" | "ETICHETTA" | "HUMANITAS" | "IEO" | "RICETTA CALCOLATA";
};
type RecipeIngredient = { food: string; grams: number; label?: string };
type MealPart = RecipeIngredient & {
  category:
    "Carboidrato" | "Proteina" | "Contorno" | "Latticino" | "Frutta" | "Extra";
  image: string;
};
type Recipe = {
  id: string;
  name: string;
  kicker: string;
  image: string;
  time: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  alternatives: string[];
  cuisine?: string;
  course?: string;
  parts?: MealPart[];
  kind?: "recipe" | "combination";
};
type Day = { label: string; mood: string; recipes: string[] };
type Tab = "today" | "week" | "library" | "builder" | "progress";
type LogItem = {
  label: string;
  kcal: number;
  amount?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  source?: Food["source"];
};
const SLOT_LABELS = [
  "Colazione",
  "Spuntino mattina",
  "Pranzo",
  "Spuntino pomeriggio",
  "Cena",
];

const VERSION = "1.16.1";
const TODAY_LABEL = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());
const photo = (name: string) =>
  `${import.meta.env.BASE_URL}food/${name}.png?v=${VERSION}`;
const WEEK_SLOT_IMAGES = [
  "moment-breakfast-v1121",
  "moment-snack-v1121",
  "moment-lunch-v1121",
  "moment-snack-v1121",
  "moment-dinner-v1121",
];
const drinkOptions: LogItem[] = [
  { label: "Acqua", kcal: 0, amount: "500 ml" },
  { label: "Caffè senza zucchero", kcal: 2, amount: "1 tazza" },
  { label: "Coca-Cola Zero", kcal: 0, amount: "330 ml" },
  { label: "Gassata zero", kcal: 0, amount: "330 ml" },
  { label: "Bibita zuccherata", kcal: 140, amount: "330 ml" },
  { label: "Vino bianco", kcal: 102, amount: "1 bicchiere · 125 ml" },
  { label: "Vino rosso", kcal: 106, amount: "1 bicchiere · 125 ml" },
];

const foods: Record<string, Food> = {
  "Kefir bianco magro": {
    kcal: 48,
    protein: 3.5,
    carbs: 4.8,
    fat: 1.6,
    fiber: 0,
    source: "FRIDA",
  },
  "Muesli": {
    kcal: 374,
    protein: 9.7,
    carbs: 71.7,
    fat: 6,
    fiber: 6.4,
    source: "CREA",
  },
  "Sedano crudo": {
    kcal: 23,
    protein: 2.3,
    carbs: 2.4,
    fat: 0.2,
    fiber: 1.6,
    source: "CREA",
  },
  "Broccoli bolliti": {
    kcal: 34,
    protein: 3.1,
    carbs: 3.2,
    fat: 0.4,
    fiber: 3.2,
    source: "CREA",
  },
  "Yogurt proteico alla vaniglia": {
    kcal: 53,
    protein: 9.4,
    carbs: 3.6,
    fat: 0.1,
    fiber: 0,
    source: "ETICHETTA",
  },
  "Budino proteico al cioccolato": {
    kcal: 76,
    protein: 10,
    carbs: 5.5,
    fat: 1.5,
    fiber: 0,
    source: "ETICHETTA",
  },
  "Burger vegetale di soia": {
    kcal: 158,
    protein: 17,
    carbs: 12,
    fat: 3.7,
    fiber: 4.4,
    source: "ETICHETTA",
  },
  "Ciliegie fresche": {
    kcal: 48,
    protein: 0.8,
    carbs: 11,
    fat: 0.1,
    fiber: 1.3,
    source: "CREA",
  },
  "Albicocche fresche": {
    kcal: 42,
    protein: 0.4,
    carbs: 9.8,
    fat: 0.1,
    fiber: 1.5,
    source: "CREA",
  },
  "Anguria": {
    kcal: 16,
    protein: 0.4,
    carbs: 3.7,
    fat: 0,
    fiber: 0.2,
    source: "CREA",
  },
  "Melone estivo": {
    kcal: 34,
    protein: 0.8,
    carbs: 7.4,
    fat: 0.2,
    fiber: 0.7,
    source: "CREA",
  },
  Albume: {
    kcal: 43,
    protein: 10.7,
    carbs: 0,
    fat: 0,
    fiber: 0,
    source: "CREA",
  },
  "Yogurt greco 2%": {
    kcal: 73,
    protein: 9.9,
    carbs: 3.9,
    fat: 2,
    fiber: 0,
    source: "USDA",
  },
  "Fiocchi d'avena": {
    kcal: 379,
    protein: 13.2,
    carbs: 67.7,
    fat: 6.5,
    fiber: 10.1,
    source: "CREA",
  },
  "Farina d'avena": {
    kcal: 378,
    protein: 12.6,
    carbs: 66.3,
    fat: 7.1,
    fiber: 7.6,
    source: "CREA",
  },
  "Farina di frumento integrale": {
    kcal: 313,
    protein: 11.9,
    carbs: 61.8,
    fat: 1.9,
    fiber: 8.4,
    source: "CREA",
  },
  "Farina di grano saraceno": {
    kcal: 335,
    protein: 12.6,
    carbs: 70.6,
    fat: 3.1,
    fiber: 10,
    source: "USDA",
  },
  "Pane di farro": {
    kcal: 264,
    protein: 8.9,
    carbs: 43,
    fat: 5.6,
    fiber: 3.3,
    source: "ETICHETTA",
  },
  "Pane ai cereali": {
    kcal: 287,
    protein: 10,
    carbs: 47,
    fat: 5.6,
    fiber: 4.2,
    source: "ETICHETTA",
  },
  "Skyr bianco": {
    kcal: 53,
    protein: 9.2,
    carbs: 3.3,
    fat: 0,
    fiber: 0,
    source: "ETICHETTA",
  },
  Nocciole: {
    kcal: 671,
    protein: 13.8,
    carbs: 6.1,
    fat: 64.1,
    fiber: 8.1,
    source: "CREA",
  },
  "Crema 100% nocciole": {
    kcal: 712,
    protein: 16,
    carbs: 8.5,
    fat: 66,
    fiber: 8.6,
    source: "ETICHETTA",
  },
  "Semi di chia": {
    kcal: 486,
    protein: 16.5,
    carbs: 42.1,
    fat: 30.7,
    fiber: 34.4,
    source: "USDA",
  },
  "Frutti di bosco": {
    kcal: 50,
    protein: 0.8,
    carbs: 11.5,
    fat: 0.4,
    fiber: 4.4,
    source: "USDA",
  },
  Fragole: {
    kcal: 32,
    protein: 0.7,
    carbs: 7.7,
    fat: 0.3,
    fiber: 2,
    source: "USDA",
  },
  Papaya: {
    kcal: 43,
    protein: 0.5,
    carbs: 10.8,
    fat: 0.3,
    fiber: 1.7,
    source: "USDA",
  },
  Kiwi: {
    kcal: 61,
    protein: 1.1,
    carbs: 14.7,
    fat: 0.5,
    fiber: 3,
    source: "CREA",
  },
  Noci: {
    kcal: 654,
    protein: 15.2,
    carbs: 13.7,
    fat: 65.2,
    fiber: 6.7,
    source: "CREA",
  },
  Arachidi: {
    kcal: 567,
    protein: 25.8,
    carbs: 16.1,
    fat: 49.2,
    fiber: 8.5,
    source: "USDA",
  },
  "Crema 100% arachidi": {
    kcal: 588,
    protein: 25.1,
    carbs: 20,
    fat: 50.4,
    fiber: 6,
    source: "USDA",
  },
  "Semi di lino macinati": {
    kcal: 534,
    protein: 18.3,
    carbs: 28.9,
    fat: 42.2,
    fiber: 27.3,
    source: "USDA",
  },
  Miele: {
    kcal: 304,
    protein: 0.3,
    carbs: 82.4,
    fat: 0,
    fiber: 0.2,
    source: "CREA",
  },
  "Pane integrale": {
    kcal: 224,
    protein: 8.5,
    carbs: 44.1,
    fat: 1.3,
    fiber: 6.5,
    source: "CREA",
  },
  "Pane bianco tipo 0": {
    kcal: 268,
    protein: 8.1,
    carbs: 59.5,
    fat: 0.5,
    fiber: 3.8,
    source: "CREA",
  },
  "Pane semintegrale tipo 1": {
    kcal: 239,
    protein: 8.3,
    carbs: 52,
    fat: 0.3,
    fiber: 4.2,
    source: "CREA",
  },
  "Pane di segale": {
    kcal: 228,
    protein: 8.3,
    carbs: 45.4,
    fat: 1.7,
    fiber: 4.6,
    source: "CREA",
  },
  "Ricotta vaccina": {
    kcal: 146,
    protein: 8.8,
    carbs: 3.5,
    fat: 10.9,
    fiber: 0,
    source: "CREA",
  },
  Crescenza: {
    kcal: 281,
    protein: 16.1,
    carbs: 1.9,
    fat: 23.3,
    fiber: 0,
    source: "CREA",
  },
  "Primo sale": {
    kcal: 204,
    protein: 13,
    carbs: 3.3,
    fat: 16,
    fiber: 0,
    source: "ETICHETTA",
  },
  Scamorza: {
    kcal: 291,
    protein: 22,
    carbs: 1.2,
    fat: 22,
    fiber: 0,
    source: "ETICHETTA",
  },
  "Provolone Dolce Auricchio": {
    kcal: 364,
    protein: 23,
    carbs: 0.5,
    fat: 30,
    fiber: 0,
    source: "ETICHETTA",
  },
  Tempeh: {
    kcal: 173, protein: 20.7, carbs: 6.4, fat: 6.4, fiber: 4.1, source: "IEO",
  },
  "Rombo · peso a crudo": {
    kcal: 81, protein: 16.3, carbs: 1.2, fat: 1.3, fiber: 0, source: "CREA",
  },
  "Seppia · peso a crudo": {
    kcal: 72, protein: 14, carbs: 0.7, fat: 1.5, fiber: 0, source: "CREA",
  },
  "Germogli di soia": {
    kcal: 30, protein: 3, carbs: 5.9, fat: 0.2, fiber: 1.8, source: "USDA",
  },
  "Salsa di soia": {
    kcal: 53, protein: 8.1, carbs: 4.9, fat: 0.6, fiber: 0.8, source: "USDA",
  },
  Gochujang: {
    kcal: 170, protein: 4, carbs: 35, fat: 2, fiber: 0, source: "ETICHETTA",
  },
  Mirin: {
    kcal: 196, protein: 0, carbs: 43, fat: 0, fiber: 0, source: "ETICHETTA",
  },
  Zucchero: {
    kcal: 392, protein: 0, carbs: 100, fat: 0, fiber: 0, source: "CREA",
  },
  "Mozzarella vaccina": {
    kcal: 253, protein: 18.7, carbs: 0.7, fat: 19.5, fiber: 0, source: "CREA",
  },
  "Mozzarella light": {
    kcal: 164, protein: 20, carbs: 1.5, fat: 8.7, fiber: 0, source: "ETICHETTA",
  },
  "Yogurt greco 0%": {
    kcal: 59, protein: 10.3, carbs: 3.6, fat: 0.4, fiber: 0, source: "USDA",
  },
  "Minestrone cotto": {
    kcal: 45, protein: 2, carbs: 7.8, fat: 0.4, fiber: 2.1, source: "CREA",
  },
  "Sogliola · peso a crudo": {
    kcal: 83, protein: 16.9, carbs: 0.8, fat: 1.4, fiber: 0, source: "CREA",
  },
  "Riso integrale secco": {
    kcal: 341, protein: 7.5, carbs: 77.4, fat: 1.9, fiber: 1.9, source: "CREA",
  },
  "Petto di pollo · peso a crudo": {
    kcal: 100, protein: 23.3, carbs: 0, fat: 0.8, fiber: 0, source: "CREA",
  },
  "Cipolle crude": {
    kcal: 28, protein: 1, carbs: 5.7, fat: 0.1, fiber: 1, source: "CREA",
  },
  "Cicerchie cotte": {
    kcal: 134, protein: 9.4, carbs: 17.1, fat: 1.7, fiber: 6, source: "HUMANITAS",
  },
  "Carciofi cotti bolliti": {
    kcal: 44, protein: 3.6, carbs: 3.3, fat: 0.3, fiber: 7.4, source: "CREA",
  },  Uovo: {
    kcal: 143,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.5,
    fiber: 0,
    source: "USDA",
  },
  "Uova sode": {
    kcal: 128,
    protein: 12.4,
    carbs: 0,
    fat: 8.7,
    fiber: 0,
    source: "CREA",
  },
  "Uova strapazzate o in frittata": {
    kcal: 150,
    protein: 14.6,
    carbs: 0,
    fat: 10.2,
    fiber: 0,
    source: "CREA",
  },
  "Petto di pollo cotto": {
    kcal: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    source: "USDA",
  },
  "Petto di pollo arrosto": {
    kcal: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    source: "USDA",
  },
  "Coscia di pollo arrosto": {
    kcal: 216,
    protein: 24,
    carbs: 0,
    fat: 13,
    fiber: 0,
    source: "USDA",
  },
  "Merluzzo cotto": {
    kcal: 89,
    protein: 19.9,
    carbs: 0,
    fat: 0.7,
    fiber: 0,
    source: "USDA",
  },
  "Orata cotta": {
    kcal: 121,
    protein: 20.5,
    carbs: 0,
    fat: 4.8,
    fiber: 0,
    source: "CREA",
  },
  "Salmone cotto": {
    kcal: 208,
    protein: 20.4,
    carbs: 0,
    fat: 13.4,
    fiber: 0,
    source: "USDA",
  },
  "Tonno al naturale sgocciolato": {
    kcal: 116,
    protein: 25.5,
    carbs: 0,
    fat: 0.8,
    fiber: 0,
    source: "CREA",
  },
  "Quinoa cotta": {
    kcal: 120,
    protein: 4.4,
    carbs: 21.3,
    fat: 1.9,
    fiber: 2.8,
    source: "USDA",
  },
  "Farro cotto": {
    kcal: 127,
    protein: 4.3,
    carbs: 26.4,
    fat: 0.7,
    fiber: 3.8,
    source: "CREA",
  },
  "Riso basmati cotto": {
    kcal: 121,
    protein: 3.5,
    carbs: 25.2,
    fat: 0.4,
    fiber: 0.4,
    source: "USDA",
  },
  "Miglio cotto": {
    kcal: 119,
    protein: 3.5,
    carbs: 23.7,
    fat: 1,
    fiber: 1.3,
    source: "USDA",
  },
  "Cous cous integrale cotto": {
    kcal: 112,
    protein: 3.8,
    carbs: 23.2,
    fat: 0.2,
    fiber: 2.4,
    source: "USDA",
  },
  "Grano saraceno cotto": {
    kcal: 92,
    protein: 3.4,
    carbs: 19.9,
    fat: 0.6,
    fiber: 2.7,
    source: "USDA",
  },
  "Orzo perlato cotto": {
    kcal: 123,
    protein: 2.3,
    carbs: 28.2,
    fat: 0.4,
    fiber: 3.8,
    source: "USDA",
  },
  "Noodles di riso cotti": {
    kcal: 109,
    protein: 0.9,
    carbs: 24.9,
    fat: 0.2,
    fiber: 1,
    source: "USDA",
  },
  "Ceci cotti": {
    kcal: 164,
    protein: 8.9,
    carbs: 27.4,
    fat: 2.6,
    fiber: 7.6,
    source: "USDA",
  },
  "Lenticchie cotte": {
    kcal: 116,
    protein: 9,
    carbs: 20.1,
    fat: 0.4,
    fiber: 7.9,
    source: "USDA",
  },
  "Fagioli cannellini cotti": {
    kcal: 107,
    protein: 8,
    carbs: 14.9,
    fat: 0.4,
    fiber: 7.8,
    source: "CREA",
  },
  "Patata dolce cotta": {
    kcal: 90,
    protein: 2,
    carbs: 20.7,
    fat: 0.2,
    fiber: 3.3,
    source: "USDA",
  },
  Pomodorini: {
    kcal: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
    fiber: 1.2,
    source: "CREA",
  },
  Zucchine: {
    kcal: 17,
    protein: 1.2,
    carbs: 3.1,
    fat: 0.3,
    fiber: 1,
    source: "CREA",
  },
  Spinaci: {
    kcal: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    fiber: 2.2,
    source: "CREA",
  },
  Fagiolini: {
    kcal: 31,
    protein: 1.8,
    carbs: 7,
    fat: 0.2,
    fiber: 3.4,
    source: "CREA",
  },
  "Insalata verde": {
    kcal: 15,
    protein: 1.4,
    carbs: 2.9,
    fat: 0.2,
    fiber: 1.3,
    source: "CREA",
  },
  Melanzane: {
    kcal: 25,
    protein: 1,
    carbs: 5.9,
    fat: 0.2,
    fiber: 3,
    source: "CREA",
  },
  Cavolfiore: {
    kcal: 25,
    protein: 1.9,
    carbs: 5,
    fat: 0.3,
    fiber: 2,
    source: "CREA",
  },
  Zucca: {
    kcal: 26,
    protein: 1,
    carbs: 6.5,
    fat: 0.1,
    fiber: 0.5,
    source: "CREA",
  },
  "Carote crude": {
    kcal: 41,
    protein: 1.1,
    carbs: 7.6,
    fat: 0.2,
    fiber: 3.1,
    source: "CREA",
  },
  "Carote cotte bollite": {
    kcal: 47,
    protein: 1.3,
    carbs: 8.7,
    fat: 0.2,
    fiber: 3.6,
    source: "CREA",
  },
  Funghi: {
    kcal: 22,
    protein: 3.1,
    carbs: 3.3,
    fat: 0.3,
    fiber: 1,
    source: "CREA",
  },
  Olive: {
    kcal: 145,
    protein: 1,
    carbs: 3.8,
    fat: 15.3,
    fiber: 3.3,
    source: "CREA",
  },
  "Peperoni crudi": {
    kcal: 26, protein: 0.9, carbs: 4.2, fat: 0.3, fiber: 1.9, source: "CREA",
  },
  "Peperoni cotti senza olio": {
    kcal: 42, protein: 1.1, carbs: 7.4, fat: 0.4, fiber: 2.5, source: "CREA",
  },
  Cetriolo: {
    kcal: 16,
    protein: 0.7,
    carbs: 1.8,
    fat: 0.5,
    fiber: 0.8,
    source: "CREA",
  },
  Rucola: {
    kcal: 25,
    protein: 2.6,
    carbs: 3.7,
    fat: 0.7,
    fiber: 1.6,
    source: "CREA",
  },
  Feta: {
    kcal: 250,
    protein: 15.6,
    carbs: 1.5,
    fat: 20.2,
    fiber: 0,
    source: "CREA",
  },
  "Grana Padano DOP": {
    kcal: 392,
    protein: 33.9,
    carbs: 0,
    fat: 28.5,
    fiber: 0,
    source: "CREA",
  },
  "Olio extravergine": {
    kcal: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    fiber: 0,
    source: "CREA",
  },
  "Semi di zucca": {
    kcal: 559,
    protein: 30.2,
    carbs: 10.7,
    fat: 49.1,
    fiber: 6,
    source: "USDA",
  },
  Banana: {
    kcal: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    fiber: 2.6,
    source: "CREA",
  },
  Pesca: {
    kcal: 28,
    protein: 0.7,
    carbs: 5.8,
    fat: 0.1,
    fiber: 1.9,
    source: "CREA",
  },
  "Finocchi crudi": {
    kcal: 15,
    protein: 1.2,
    carbs: 1.5,
    fat: 0.1,
    fiber: 2.2,
    source: "CREA",
  },
  "Asparagi crudi": {
    kcal: 28,
    protein: 3,
    carbs: 3,
    fat: 0.1,
    fiber: 2.1,
    source: "CREA",
  },
  Mela: {
    kcal: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    fiber: 2.4,
    source: "CREA",
  },
  Pera: {
    kcal: 57,
    protein: 0.4,
    carbs: 15.2,
    fat: 0.1,
    fiber: 3.1,
    source: "USDA",
  },
  Uva: {
    kcal: 61,
    protein: 0.5,
    carbs: 15.6,
    fat: 0.1,
    fiber: 1.5,
    source: "CREA",
  },
  Arancia: {
    kcal: 47,
    protein: 0.9,
    carbs: 11.8,
    fat: 0.1,
    fiber: 2.4,
    source: "CREA",
  },
  Mango: {
    kcal: 60,
    protein: 0.8,
    carbs: 15,
    fat: 0.4,
    fiber: 1.6,
    source: "USDA",
  },
  Ananas: {
    kcal: 42,
    protein: 0.5,
    carbs: 10,
    fat: 0,
    fiber: 1,
    source: "CREA",
  },
  More: {
    kcal: 43,
    protein: 1.4,
    carbs: 9.6,
    fat: 0.5,
    fiber: 5.3,
    source: "USDA",
  },
  "Gallette di riso integrale": {
    kcal: 383,
    protein: 8.5,
    carbs: 80,
    fat: 2.4,
    fiber: 3.2,
    source: "ETICHETTA",
  },
  "Hummus di ceci": {
    kcal: 219,
    protein: 6.4,
    carbs: 12,
    fat: 15,
    fiber: 5.2,
    source: "ETICHETTA",
  },
  "Hummus di barbabietola": {
    kcal: 184,
    protein: 5.5,
    carbs: 12.4,
    fat: 12,
    fiber: 4.6,
    source: "RICETTA CALCOLATA",
  },
  "Barbabietole cotte": {
    kcal: 44,
    protein: 1.2,
    carbs: 8,
    fat: 0.2,
    fiber: 2.6,
    source: "CREA",
  },  "Gamberi cotti": { kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, source: "USDA" },
  "Petto di tacchino cotto alla piastra": { kcal: 135, protein: 29, carbs: 0, fat: 1.8, fiber: 0, source: "USDA" },
  "Riso rosso integrale cotto": { kcal: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, source: "ETICHETTA" },
  "Pasta di lenticchie secca": { kcal: 330, protein: 24, carbs: 50, fat: 2, fiber: 8, source: "ETICHETTA" },
  "Cavolo nero cotto": { kcal: 35, protein: 3, carbs: 4.4, fat: 0.6, fiber: 4.1, source: "CREA" },
  "Bietole cotte": { kcal: 27, protein: 2.1, carbs: 2.8, fat: 0.1, fiber: 2.1, source: "CREA" },
  "Polenta cotta": { kcal: 80, protein: 1.8, carbs: 17.2, fat: 0.4, fiber: 0.8, source: "CREA" },
  "Coniglio cotto in umido": { kcal: 173, protein: 26, carbs: 0, fat: 7.2, fiber: 0, source: "CREA" },
  "Radicchio cotto": { kcal: 13, protein: 1.4, carbs: 1.6, fat: 0.1, fiber: 3, source: "CREA" },
  "Bulgur cotto": { kcal: 83, protein: 3.1, carbs: 18.6, fat: 0.2, fiber: 4.5, source: "USDA" },
  "Tofu alla piastra": { kcal: 144, protein: 17.3, carbs: 2.8, fat: 8.7, fiber: 2.3, source: "USDA" },
  "Cavolo rosso crudo": { kcal: 31, protein: 1.4, carbs: 7.4, fat: 0.2, fiber: 2.1, source: "USDA" },
  "Fiocchi di latte": {
    kcal: 91,
    protein: 9.9,
    carbs: 2.8,
    fat: 4.5,
    fiber: 0,
    source: "ETICHETTA",
  },
  "Semi di sesamo": {
    kcal: 573,
    protein: 17.7,
    carbs: 23.5,
    fat: 49.7,
    fiber: 11.8,
    source: "USDA",
  },
  "Ravanelli crudi": {
    kcal: 13,
    protein: 0.8,
    carbs: 1.8,
    fat: 0.1,
    fiber: 1.3,
    source: "CREA",
  },
  Mandorle: {
    kcal: 579,
    protein: 21.2,
    carbs: 21.6,
    fat: 49.9,
    fiber: 12.5,
    source: "USDA",
  },
  "Crema cacao e nocciole": {
    kcal: 539,
    protein: 6.3,
    carbs: 57.5,
    fat: 30.9,
    fiber: 0,
    source: "ETICHETTA",
  },
  Pistacchi: {
    kcal: 560,
    protein: 20.2,
    carbs: 27.2,
    fat: 45.3,
    fiber: 10.6,
    source: "USDA",
  },
  "Noci pecan": {
    kcal: 691,
    protein: 9.2,
    carbs: 13.9,
    fat: 72,
    fiber: 9.6,
    source: "USDA",
  },
  "Cioccolato fondente 70%": {
    kcal: 598,
    protein: 7.8,
    carbs: 45.9,
    fat: 42.6,
    fiber: 10.9,
    source: "USDA",
  },
  "Fette biscottate integrali": {
    kcal: 397,
    protein: 11,
    carbs: 72,
    fat: 7.5,
    fiber: 7,
    source: "CREA",
  },
  "Confettura di frutta": {
    kcal: 250,
    protein: 0.4,
    carbs: 62,
    fat: 0.1,
    fiber: 1.2,
    source: "CREA",
  },
  "Latte parzialmente scremato": {
    kcal: 46,
    protein: 3.3,
    carbs: 4.9,
    fat: 1.6,
    fiber: 0,
    source: "CREA",
  },
  "Latte intero": {
    kcal: 64,
    protein: 3.3,
    carbs: 4.9,
    fat: 3.6,
    fiber: 0,
    source: "CREA",
  },
  "Pasta cotta": {
    kcal: 157,
    protein: 5.8,
    carbs: 30.9,
    fat: 0.9,
    fiber: 1.8,
    source: "USDA",
  },
  "Pasta di semola secca": {
    kcal: 353,
    protein: 13,
    carbs: 71.5,
    fat: 1.5,
    fiber: 3,
    source: "CREA",
  },
  "Pasta integrale secca": {
    kcal: 348,
    protein: 14,
    carbs: 66,
    fat: 2.5,
    fiber: 8,
    source: "CREA",
  },
  "Riso basmati secco": {
    kcal: 356,
    protein: 8,
    carbs: 78,
    fat: 0.8,
    fiber: 1,
    source: "CREA",
  },
  "Riso Venere secco": {
    kcal: 355,
    protein: 8.5,
    carbs: 73,
    fat: 2.8,
    fiber: 4.5,
    source: "CREA",
  },
  "Gnocchi di patate": {
    kcal: 155,
    protein: 4,
    carbs: 33,
    fat: 0.7,
    fiber: 2,
    source: "CREA",
  },
  "Pizza margherita": {
    kcal: 250,
    protein: 10,
    carbs: 45,
    fat: 5.5,
    fiber: 2.5,
    source: "CREA",
  },
  "Passata di pomodoro": {
    kcal: 29,
    protein: 1.4,
    carbs: 4.8,
    fat: 0.2,
    fiber: 1.5,
    source: "CREA",
  },
  "Prosciutto cotto": {
    kcal: 215,
    protein: 19.8,
    carbs: 0.9,
    fat: 14.7,
    fiber: 0,
    source: "CREA",
  },
  "Prosciutto crudo": {
    kcal: 268,
    protein: 25.5,
    carbs: 0.3,
    fat: 18.4,
    fiber: 0,
    source: "CREA",
  },
  Bresaola: {
    kcal: 151,
    protein: 32,
    carbs: 0,
    fat: 2.6,
    fiber: 0,
    source: "CREA",
  },
  "Fesa di tacchino": {
    kcal: 107,
    protein: 24,
    carbs: 0,
    fat: 1.2,
    fiber: 0,
    source: "CREA",
  },
  "Bistecca di manzo · peso a crudo": {
    kcal: 140,
    protein: 21.3,
    carbs: 0,
    fat: 6.1,
    fiber: 0,
    source: "CREA",
  },
  "Bistecca di vitello · peso a crudo": {
    kcal: 107,
    protein: 20.7,
    carbs: 0,
    fat: 2.7,
    fiber: 0,
    source: "CREA",
  },
  "Lonza di maiale · peso a crudo": {
    kcal: 146,
    protein: 20.7,
    carbs: 0,
    fat: 7,
    fiber: 0,
    source: "CREA",
  },
  "Bistecca di cavallo magra · peso a crudo": {
    kcal: 106,
    protein: 23.5,
    carbs: 0.7,
    fat: 1,
    fiber: 0,
    source: "CREA",
  },
  "Patate lesse": {
    kcal: 87,
    protein: 1.9,
    carbs: 20.1,
    fat: 0.1,
    fiber: 1.8,
    source: "USDA",
  },
  "Piselli cotti": {
    kcal: 84,
    protein: 5.4,
    carbs: 15.6,
    fat: 0.2,
    fiber: 5.5,
    source: "USDA",
  },
  "Bevanda di soia senza zucchero": {
    kcal: 33,
    protein: 2.9,
    carbs: 1.7,
    fat: 1.8,
    fiber: 0.6,
    source: "USDA",
  },
  "Bevanda d'avena senza zucchero": {
    kcal: 43,
    protein: 1,
    carbs: 7,
    fat: 1.5,
    fiber: 0.8,
    source: "USDA",
  },
  "Succo d'arancia 100%": {
    kcal: 45,
    protein: 0.7,
    carbs: 10.4,
    fat: 0.2,
    fiber: 0.2,
    source: "USDA",
  },
  "Caffè senza zucchero": {
    kcal: 2,
    protein: 0.1,
    carbs: 0,
    fat: 0,
    fiber: 0,
    source: "USDA",
  },
  "Biscotti secchi": {
    kcal: 430,
    protein: 7.5,
    carbs: 75,
    fat: 11,
    fiber: 3,
    source: "CREA",
  },
  "Cracker integrali": {
    kcal: 421,
    protein: 10,
    carbs: 68,
    fat: 13,
    fiber: 7,
    source: "USDA",
  },
  Grissini: {
    kcal: 421,
    protein: 11.3,
    carbs: 65.1,
    fat: 13.9,
    fiber: 3.5,
    source: "CREA",
  },
  Burro: {
    kcal: 717,
    protein: 0.9,
    carbs: 0.1,
    fat: 81.1,
    fiber: 0,
    source: "CREA",
  },
  "Mirtilli freschi": {
    kcal: 49, protein: 0.9, carbs: 10.1, fat: 0.2, fiber: 3.1, source: "CREA",
  },
  "Mandarini freschi": {
    kcal: 76, protein: 0.9, carbs: 17.6, fat: 0.3, fiber: 1.7, source: "CREA",
  },
  "Melagrana fresca": {
    kcal: 68, protein: 0.5, carbs: 15.9, fat: 0.2, fiber: 2.2, source: "CREA",
  },
  "Anacardi non salati": {
    kcal: 604, protein: 15, carbs: 33, fat: 46, fiber: 3, source: "CREA",
  },  "Wafer confezionati": {
    kcal: 516,
    protein: 5.4,
    carbs: 63,
    fat: 27,
    fiber: 2.5,
    source: "USDA",
  },
};

// Banca dati separata per sgarri ed extra: ricercabile nel diario ma esclusa
// dalle proposte automatiche del piano quotidiano.
type OccasionalFoodRow = [string, number, number, number, number, number, Food["source"]];
const occasionalFoodRows: OccasionalFoodRow[] = [
  ["Pizza margherita da pizzeria",266,11,33,10,2.3,"RICETTA CALCOLATA"],
  ["Pizza quattro formaggi",330,15,31,17,1.8,"RICETTA CALCOLATA"],
  ["Pizza diavola",305,14,32,14,2,"RICETTA CALCOLATA"],
  ["Pizza capricciosa",275,12,31,12,2.2,"RICETTA CALCOLATA"],
  ["Focaccia all'olio",310,8,48,10,2.5,"RICETTA CALCOLATA"],
  ["Calzone farcito",285,13,32,12,2,"RICETTA CALCOLATA"],
  ["Panzerotto fritto",310,10,35,15,2,"RICETTA CALCOLATA"],
  ["Piadina farcita",295,13,30,14,2.1,"RICETTA CALCOLATA"],
  ["Hamburger completo",250,13,24,12,1.6,"RICETTA CALCOLATA"],
  ["Cheeseburger",270,14,23,14,1.5,"RICETTA CALCOLATA"],
  ["Hot dog",290,11,25,17,1.4,"RICETTA CALCOLATA"],
  ["Kebab nel pane",235,14,24,9,2.2,"RICETTA CALCOLATA"],
  ["Toast prosciutto e formaggio",285,16,27,13,1.7,"RICETTA CALCOLATA"],
  ["Tramezzino tonno e maionese",280,11,25,15,1.3,"RICETTA CALCOLATA"],
  ["Panino salumi e formaggio",300,16,28,14,1.7,"RICETTA CALCOLATA"],
  ["Patatine fritte",312,3.4,41,15,3.8,"RICETTA CALCOLATA"],
  ["Crocchette di patate",245,5,31,11,2.5,"RICETTA CALCOLATA"],
  ["Arancino di riso",255,9,34,9,1.8,"RICETTA CALCOLATA"],
  ["Suppli al telefono",250,9,34,9,1.7,"RICETTA CALCOLATA"],
  ["Mozzarella in carrozza",315,14,25,18,1.3,"RICETTA CALCOLATA"],
  ["Olive ascolane",270,10,22,16,2.2,"RICETTA CALCOLATA"],
  ["Fritto misto di pesce",235,17,16,12,0.8,"RICETTA CALCOLATA"],
  ["Calamari fritti",250,18,17,13,0.8,"RICETTA CALCOLATA"],
  ["Pollo fritto",285,21,10,18,0.6,"RICETTA CALCOLATA"],
  ["Cotoletta fritta",285,20,15,16,1,"RICETTA CALCOLATA"],
  ["Nachos",500,7,58,26,5,"ETICHETTA"],
  ["Patatine chips",536,6.5,53,34,4.8,"ETICHETTA"],
  ["Popcorn al burro",480,8,55,25,9,"ETICHETTA"],
  ["Pasta alla carbonara",225,10,27,9,1.5,"RICETTA CALCOLATA"],
  ["Pasta all'amatriciana",175,7,27,5,1.7,"RICETTA CALCOLATA"],
  ["Pasta ai quattro formaggi",245,11,25,12,1.3,"RICETTA CALCOLATA"],
  ["Lasagne al ragu",185,11,16,9,1.4,"RICETTA CALCOLATA"],
  ["Cannelloni ripieni",175,10,17,7.5,1.3,"RICETTA CALCOLATA"],
  ["Pasta al forno",190,10,20,8,1.5,"RICETTA CALCOLATA"],
  ["Gnocchi ai quattro formaggi",205,8,27,8,1.5,"RICETTA CALCOLATA"],
  ["Risotto mantecato",175,5,26,6,1,"RICETTA CALCOLATA"],
  ["Parmigiana di melanzane",170,8,10,11,2.2,"RICETTA CALCOLATA"],
  ["Salsiccia cotta",310,18,1,26,0,"RICETTA CALCOLATA"],
  ["Porchetta",335,22,1,27,0,"RICETTA CALCOLATA"],
  ["Salame",425,22,1.5,37,0,"ETICHETTA"],
  ["Mortadella",317,15,1,28,0,"ETICHETTA"],
  ["Pancetta",450,20,1,41,0,"ETICHETTA"],
  ["Wurstel",270,12,2,24,0,"ETICHETTA"],
  ["Maionese",680,1,1,75,0,"ETICHETTA"],
  ["Ketchup",110,1.3,25,0.2,0.5,"ETICHETTA"],
  ["Cornetto farcito",410,7,47,22,2,"ETICHETTA"],
  ["Brioche confezionata",390,7,50,18,2,"ETICHETTA"],
  ["Bombolone alla crema",335,6,45,15,1.5,"RICETTA CALCOLATA"],
  ["Muffin",390,6,50,19,1.5,"ETICHETTA"],
  ["Donut glassato",410,5,49,22,1.5,"ETICHETTA"],
  ["Waffle dolce",310,8,45,11,1.8,"RICETTA CALCOLATA"],
  ["Tiramisu",285,6,31,15,0.8,"RICETTA CALCOLATA"],
  ["Cheesecake",320,6,28,21,0.8,"RICETTA CALCOLATA"],
  ["Profiteroles",335,7,30,21,1.2,"RICETTA CALCOLATA"],
  ["Panna cotta",300,4,25,20,0,"RICETTA CALCOLATA"],
  ["Gelato alla crema",210,4,25,11,0,"ETICHETTA"],
  ["Gelato al cioccolato",220,4,27,11,1.5,"ETICHETTA"],
  ["Torta al cioccolato",385,6,50,19,2.5,"RICETTA CALCOLATA"],
  ["Crostata alla confettura",350,5,55,13,2,"RICETTA CALCOLATA"],
  ["Cannolo siciliano",350,9,38,18,1,"RICETTA CALCOLATA"],
  ["Pastiera",360,8,44,17,2,"RICETTA CALCOLATA"],
  ["Biscotti farciti",480,6,68,20,2,"ETICHETTA"],
  ["Merendina confezionata",420,6,55,20,1.5,"ETICHETTA"],
  ["Wafer",515,7,62,27,2.5,"ETICHETTA"],
  ["Cioccolato al latte",535,7,59,30,3,"ETICHETTA"],
  ["Cioccolato fondente",550,7,46,36,10,"ETICHETTA"],
  ["Barretta al cioccolato",490,7,60,25,2,"ETICHETTA"],
  ["Caramelle",390,0,98,0,0,"ETICHETTA"],
  ["Crema spalmabile cacao e nocciole",539,6.3,57.5,30.9,3.4,"ETICHETTA"],
  ["Frappè",145,4,23,4,0.5,"RICETTA CALCOLATA"],
  ["Milkshake",160,4,25,5,0.5,"RICETTA CALCOLATA"],
  ["Bibita gassata zuccherata",42,0,10.5,0,0,"ETICHETTA"],
  ["Energy drink zuccherato",45,0,11,0,0,"ETICHETTA"],
  ["Tè freddo zuccherato",36,0,9,0,0,"ETICHETTA"],
  ["Succo di frutta zuccherato",50,0.2,12,0,0.2,"ETICHETTA"],
  ["Birra",43,0.5,3.6,0,0,"ETICHETTA"],
  ["Vino bianco",82,0.1,2.6,0,0,"ETICHETTA"],
  ["Vino rosso",85,0.1,2.6,0,0,"ETICHETTA"],
  ["Prosecco",75,0.1,2,0,0,"ETICHETTA"],
  ["Liquore",250,0,20,0,0,"ETICHETTA"],
  ["Amaro",240,0,25,0,0,"ETICHETTA"],
];
const occasionalFoods: Record<string, Food> = Object.fromEntries(
  occasionalFoodRows.map(([name,kcal,protein,carbs,fat,fiber,source]) => [name,{kcal,protein,carbs,fat,fiber,source}]),
);
const foodSearchDatabase: Record<string, Food> = { ...foods, ...occasionalFoods };
const calc = (
  ingredients: RecipeIngredient[],
  scale = 1,
): Macro & { fiber: number; weight: number } =>
  ingredients.reduce(
    (sum, item) => {
      const food = foods[item.food];
      const grams = item.grams * scale;
      const f = grams / 100;
      if (!food) return { ...sum, weight: sum.weight + grams };
      return {
        kcal: sum.kcal + food.kcal * f,
        protein: sum.protein + food.protein * f,
        carbs: sum.carbs + food.carbs * f,
        fat: sum.fat + food.fat * f,
        fiber: sum.fiber + food.fiber * f,
        weight: sum.weight + grams,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, weight: 0 },
  );

type WeeklyProteinFamily = "pesce" | "carne-bianca" | "carne-rossa" | "uova" | "legumi" | "latticini" | "salumi" | "altro";
const proteinFamilyForItems = (items: RecipeIngredient[]): WeeklyProteinFamily => {
  const names = items.map((item) => item.food.toLowerCase());
  const has = (terms: string[]) => names.some((name) => terms.some((term) => name.includes(term)));
  if (has(["bresaola", "prosciutto", "salame", "mortadella", "speck", "wurstel"])) return "salumi";
  if (has(["salmone", "tonno", "merluzzo", "nasello", "orata", "branzino", "spigola", "sogliola", "platessa", "rombo", "trota", "sgombro", "sardine", "alici", "acciughe", "pesce spada", "palombo", "polpo", "sepp", "calamar", "gamber", "cozz", "vongol", "pesce"])) return "pesce";
  if (has(["pollo", "tacchino", "coniglio"])) return "carne-bianca";
  if (has(["manzo", "vitello", "maiale", "lonza", "cavallo", "bistecca"])) return "carne-rossa";
  if (has(["uovo", "uova", "albume"])) return "uova";
  if (has(["ceci", "lenticchie", "fagioli", "piselli", "fave", "edamame", "lupini", "cicerchie", "tofu", "tempeh", "seitan", "burger vegetale", "legumi"])) return "legumi";
  if (has(["ricotta", "mozzarella", "feta", "crescenza", "stracchino", "primo sale", "scamorza", "provolone", "fiocchi di latte", "parmigiano", "grana"])) return "latticini";
  return "altro";
};
const recipeProteinFamily = (recipe: Recipe) => proteinFamilyForItems(recipe.parts || recipe.ingredients);
const WEEKLY_MAIN_ROTATION: WeeklyProteinFamily[] = [
  "legumi", "pesce", "carne-bianca", "uova", "legumi", "pesce", "latticini",
  "legumi", "carne-bianca", "pesce", "legumi", "carne-rossa", "latticini", "uova",
];
const recipes: Recipe[] = [
  {
    id: "jar",
    name: "Jar yogurt, avena e frutti",
    kicker: "Colazione fresca e saziante",
    image: photo("yogurt"),
    time: 5,
    ingredients: [
      { food: "Yogurt greco 2%", grams: 220 },
      { food: "Fiocchi d'avena", grams: 45 },
      { food: "Frutti di bosco", grams: 100 },
      { food: "Kiwi", grams: 70 },
      { food: "Noci", grams: 12 },
      { food: "Miele", grams: 8 },
    ],
    steps: [
      "Lava e asciuga la frutta. Pela il kiwi, taglialo a cubetti e spezza grossolanamente le noci.",
      "Pesa lo yogurt direttamente nel barattolo e livellane metà con un cucchiaio.",
      "Aggiungi metà avena e metà frutta; ripeti gli strati senza schiacciarli.",
      "Completa con noci e miele. Chiudi e lascia 10 minuti in frigorifero, oppure preparalo la sera per una consistenza più morbida.",
    ],
    alternatives: [
      "Skyr al posto dello yogurt",
      "Pera al posto del kiwi",
      "Mandorle al posto delle noci",
    ],
  },
  {
    id: "toast",
    name: "Toast ricotta, uovo e pomodoro",
    kicker: "Croccante, proteico, veloce",
    image: photo("toast"),
    time: 10,
    ingredients: [
      { food: "Pane integrale", grams: 90 },
      { food: "Ricotta vaccina", grams: 80 },
      { food: "Uova strapazzate o in frittata", grams: 60, label: "Uovo cotto in padella senza grassi aggiunti" },
      { food: "Pomodorini", grams: 120 },
    ],
    steps: [
      "Lava i pomodorini e tagliali in quattro. Metti pane, ricotta, uovo e una padella sul piano di lavoro.",
      "Scalda la padella senza olio per un minuto. Tosta bene il pane 2-3 minuti per lato: deve diventare dorato e croccante sui bordi.",
      "Abbassa il fuoco, rompi l'uovo in padella e copri. Cuoci 4-5 minuti, finché l'albume è completamente bianco e rappreso.",
      "Spalma la ricotta sul pane caldo, aggiungi pomodorini, pepe ed erbe, poi appoggia sopra l'uovo. Servi subito per non perdere la croccantezza.",
    ],
    alternatives: [
      "Tonno al naturale al posto dell'uovo",
      "Yogurt greco denso al posto della ricotta",
    ],
  },
  {
    id: "bowl",
    name: "Bowl pollo, quinoa e ceci",
    kicker: "Energia stabile e gusto mediterraneo",
    image: photo("chicken-bowl"),
    time: 25,
    ingredients: [
      { food: "Petto di pollo cotto", grams: 130 },
      { food: "Quinoa cotta", grams: 130 },
      { food: "Ceci cotti", grams: 60 },
      { food: "Zucchine", grams: 160 },
      { food: "Pomodorini", grams: 100 },
      { food: "Spinaci", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: [
      "Pesa tutto. Sciacqua la quinoa in un colino fine per un minuto; mettila in pentola con il doppio del suo volume d'acqua, porta a bollore, copri e cuoci piano 12-15 minuti. Spegni, riposa 5 minuti e sgrana con la forchetta.",
      "Taglia il pollo crudo a bocconcini di 2-3 cm e le zucchine a mezze lune. Scalda bene una padella e aggiungi paprika, pepe e rosmarino.",
      "Cuoci il pollo 6-8 minuti girandolo spesso; aggiungi le zucchine e continua per altri 6 minuti. Il pollo deve raggiungere 74 °C al cuore.",
      "Sciacqua e scola i ceci, poi scaldali 3 minuti insieme alla quinoa. Lava spinaci e pomodorini.",
      "Metti quinoa e ceci sul fondo, aggiungi verdure e pollo ben dorato. Condisci solo alla fine con olio pesato, limone ed erbe.",
    ],
    alternatives: [
      "Tofu compatto al posto del pollo",
      "Farro al posto della quinoa",
      "Fagioli cannellini al posto dei ceci",
    ],
  },
  {
    id: "salmon",
    name: "Salmone, patata dolce e fagiolini",
    kicker: "Piatto completo senza complicazioni",
    image: photo("salmon"),
    time: 30,
    ingredients: [
      { food: "Salmone cotto", grams: 140 },
      { food: "Patata dolce cotta", grams: 230 },
      { food: "Fagiolini", grams: 180 },
      { food: "Olio extravergine", grams: 8 },
    ],
    steps: [
      "Scalda il forno a 200 °C. Lava la patata dolce, tagliala a cubetti di 2 cm e distribuiscila su carta forno senza sovrapporla.",
      "Cuoci la patata per 25 minuti, girandola dopo 15: è pronta quando la forchetta entra facilmente e gli spigoli sono dorati.",
      "Metti il salmone su una seconda teglia con limone ed erbe. Inforna a 190 °C per 12-15 minuti, finché è opaco e si divide in scaglie.",
      "Spunta i fagiolini e lessali 7-9 minuti: devono essere teneri ma non sfatti. Scolali bene.",
      "Disponi i tre elementi nel piatto e aggiungi l'olio misurato, limone e pepe solo alla fine.",
    ],
    alternatives: [
      "Trota al posto del salmone",
      "Patate comuni al posto della patata dolce",
      "Broccoli al posto dei fagiolini",
    ],
  },
  {
    id: "farro",
    name: "Farro, lenticchie e feta croccante",
    kicker: "Insalata particolare, ricca di fibre",
    image: photo("farro"),
    time: 18,
    ingredients: [
      { food: "Farro cotto", grams: 150 },
      { food: "Lenticchie cotte", grams: 110 },
      { food: "Peperoni cotti senza olio", grams: 120 },
      { food: "Cetriolo", grams: 100 },
      { food: "Rucola", grams: 50 },
      { food: "Feta", grams: 45 },
      { food: "Semi di zucca", grams: 10 },
      { food: "Olio extravergine", grams: 8 },
    ],
    steps: [
      "Cuoci il farro in acqua secondo la confezione, scolalo e allargalo nel piatto per far uscire il vapore.",
      "Sciacqua le lenticchie cotte. Taglia peperone e cetriolo a cubetti, lava la rucola e asciugala.",
      "Scalda una padella e arrostisci il peperone 7-8 minuti, finché compaiono parti dorate ma resta consistente.",
      "Mescola farro e lenticchie ancora tiepidi con peperone, cetriolo e rucola.",
      "Sbriciola la feta con le dita, aggiungi semi e olio pesato. Mescola una sola volta e servi.",
    ],
    alternatives: [
      "Ceci al posto delle lenticchie",
      "Ricotta salata al posto della feta",
      "Quinoa per una variante senza glutine",
    ],
  },
  {
    id: "rice",
    name: "Riso basmati, tonno e verdure",
    kicker: "Pranzo rapido da portare",
    image: photo("tuna-rice"),
    time: 15,
    ingredients: [
      { food: "Riso basmati cotto", grams: 190 },
      { food: "Tonno al naturale sgocciolato", grams: 120 },
      { food: "Zucchine", grams: 150 },
      { food: "Peperoni cotti senza olio", grams: 100 },
      { food: "Olio extravergine", grams: 9 },
    ],
    steps: [
      "Sciacqua il riso finché l'acqua è quasi limpida. Cuocilo secondo la confezione, spegni e lascialo riposare coperto 5 minuti.",
      "Taglia zucchine e peperoni in pezzi piccoli e uguali. Cuocili in padella calda 8-10 minuti, mescolando: devono colorarsi senza diventare molli.",
      "Apri il tonno, sgocciolalo molto bene e dividilo con una forchetta.",
      "Sgrana il riso, uniscilo alle verdure e scalda per 2 minuti. Spegni il fuoco e aggiungi tonno, olio pesato, limone ed erbe.",
    ],
    alternatives: [
      "Pollo al posto del tonno",
      "Farro al posto del riso",
      "Ceci per la variante vegetale",
    ],
  },
  {
    id: "snack-apple",
    name: "Mela, yogurt e noci",
    kicker: "Spuntino con masticazione e proteine",
    image: photo("snack"),
    time: 3,
    ingredients: [
      { food: "Mela", grams: 180 },
      { food: "Yogurt greco 2%", grams: 140 },
      { food: "Noci", grams: 12 },
    ],
    steps: [
      "Taglia la mela a spicchi.",
      "Servi con yogurt e noci; non serve aggiungere zucchero.",
    ],
    alternatives: ["Kiwi al posto della mela", "Skyr al posto dello yogurt"],
  },
  {
    id: "snack-banana",
    name: "Banana e crema yogurt",
    kicker: "Prima o dopo un'attività intensa",
    image: photo("snack-banana-yogurt-v115"),
    time: 3,
    ingredients: [
      { food: "Banana", grams: 130 },
      { food: "Yogurt greco 2%", grams: 170 },
      { food: "Fiocchi d'avena", grams: 20 },
    ],
    steps: [
      "Schiaccia metà banana nello yogurt.",
      "Completa con avena e la restante banana a rondelle.",
    ],
    alternatives: [
      "Mela e cannella al posto della banana",
      "Pane integrale al posto dell'avena",
    ],
  },
  {
    id: "eggs-quinoa",
    name: "Uova, quinoa e spinaci cremosi",
    kicker: "Colazione salata o pranzo leggero",
    image: photo("eggs-quinoa-v3"),
    time: 14,
    ingredients: [
      { food: "Uova strapazzate o in frittata", grams: 120 },
      { food: "Quinoa cotta", grams: 110 },
      { food: "Spinaci", grams: 140 },
      { food: "Pomodorini", grams: 100 },
      { food: "Olio extravergine", grams: 6 },
    ],
    steps: [
      "Scalda la quinoa in padella con due cucchiai d'acqua.",
      "Aggiungi gli spinaci e falli appassire per 3-4 minuti.",
      "Cuoci le uova a parte lasciando il tuorlo morbido oppure ben cotto, secondo preferenza.",
      "Metti tutto nel piatto, completa con pomodorini, olio pesato, pepe ed erbe.",
    ],
    alternatives: [
      "Pane integrale al posto della quinoa",
      "Ricotta al posto di un uovo",
    ],
  },
  {
    id: "chicken-farro",
    name: "Pollo speziato, farro e peperoni",
    kicker: "Piatto caldo, saziante e colorato",
    image: photo("chicken-bowl"),
    time: 24,
    ingredients: [
      { food: "Petto di pollo cotto", grams: 130 },
      { food: "Farro cotto", grams: 160 },
      { food: "Peperoni cotti senza olio", grams: 150 },
      { food: "Zucchine", grams: 120 },
      { food: "Rucola", grams: 40 },
      { food: "Olio extravergine", grams: 9 },
    ],
    steps: [
      "Taglia peperoni e zucchine e cuocili in padella per 10 minuti con paprika ed erbe.",
      "Scalda il farro con un cucchiaio d'acqua.",
      "Rosola il pollo già cotto per 2-3 minuti con le verdure.",
      "Servi sopra la rucola e aggiungi l'olio solo alla fine.",
    ],
    alternatives: [
      "Tonno al posto del pollo",
      "Riso basmati al posto del farro",
    ],
  },
  {
    id: "salmon-rice",
    name: "Bowl salmone, riso e cetriolo",
    kicker: "Fresca, completa e ricca di proteine",
    image: photo("salmon"),
    time: 20,
    ingredients: [
      { food: "Salmone cotto", grams: 125 },
      { food: "Riso basmati cotto", grams: 170 },
      { food: "Cetriolo", grams: 120 },
      { food: "Spinaci", grams: 60 },
      { food: "Pomodorini", grams: 100 },
      { food: "Semi di zucca", grams: 8 },
    ],
    steps: [
      "Cuoci il salmone in forno o friggitrice ad aria finché si sfalda con la forchetta.",
      "Scalda il riso e distribuiscilo nella ciotola.",
      "Aggiungi cetriolo, spinaci e pomodorini.",
      "Completa con salmone a pezzi, semi, limone ed erbe aromatiche.",
    ],
    alternatives: [
      "Tonno al naturale al posto del salmone",
      "Quinoa al posto del riso",
    ],
  },
  {
    id: "lentil-quinoa",
    name: "Quinoa tiepida, lenticchie e kiwi",
    kicker: "Contrasto particolare, fibre e freschezza",
    image: photo("farro"),
    time: 16,
    ingredients: [
      { food: "Quinoa cotta", grams: 150 },
      { food: "Lenticchie cotte", grams: 130 },
      { food: "Kiwi", grams: 80 },
      { food: "Rucola", grams: 60 },
      { food: "Cetriolo", grams: 100 },
      { food: "Feta", grams: 35 },
      { food: "Olio extravergine", grams: 7 },
    ],
    steps: [
      "Scalda quinoa e lenticchie per 3 minuti, senza farle asciugare.",
      "Taglia cetriolo e kiwi a cubetti.",
      "Unisci la base tiepida alla rucola e agli ingredienti freschi.",
      "Sbriciola la feta e condisci con olio pesato e limone.",
    ],
    alternatives: [
      "Farro al posto della quinoa",
      "Ceci al posto delle lenticchie",
    ],
  },
  {
    id: "tuna-chickpeas",
    name: "Insalatona tonno, ceci e croccante",
    kicker: "Molto saziante, pronta in dieci minuti",
    image: photo("tuna-rice"),
    time: 10,
    ingredients: [
      { food: "Tonno al naturale sgocciolato", grams: 110 },
      { food: "Ceci cotti", grams: 130 },
      { food: "Pomodorini", grams: 130 },
      { food: "Cetriolo", grams: 120 },
      { food: "Rucola", grams: 60 },
      { food: "Semi di zucca", grams: 10 },
      { food: "Olio extravergine", grams: 8 },
    ],
    steps: [
      "Sciacqua e scola bene i ceci; sgocciola completamente il tonno.",
      "Taglia pomodorini e cetriolo.",
      "Mescola tutto con la rucola in una ciotola capiente.",
      "Aggiungi semi, olio pesato, limone e pepe appena prima di mangiare.",
    ],
    alternatives: ["Pollo al posto del tonno", "Lenticchie al posto dei ceci"],
  },
  {
    id: "sweet-ricotta",
    name: "Patata dolce ripiena di ricotta",
    kicker: "Cremosa dentro, croccante fuori",
    image: photo("sweet-ricotta-v2"),
    time: 32,
    cuisine: "Italiano",
    ingredients: [
      { food: "Patata dolce cotta", grams: 280 },
      { food: "Ricotta vaccina", grams: 100 },
      { food: "Spinaci", grams: 150 },
      { food: "Pomodorini", grams: 100 },
      { food: "Semi di zucca", grams: 8 },
    ],
    steps: [
      "Dividi la patata dolce a metà e scaldala in forno finché i bordi diventano dorati.",
      "Cuoci gli spinaci in padella e strizzali bene.",
      "Mescola ricotta, spinaci, pepe ed erbe e riempi la patata.",
      "Rimetti in forno per 5 minuti e completa con pomodorini e semi.",
    ],
    alternatives: [
      "Feta al posto della ricotta",
      "Ceci schiacciati per una variante senza latticini",
    ],
  },
  {
    id: "apple-oats",
    name: "Coppa mela, avena e yogurt",
    kicker: "Dolce naturale e lunga sazietà",
    image: photo("yogurt"),
    time: 8,
    ingredients: [
      { food: "Yogurt greco 2%", grams: 200 },
      { food: "Mela", grams: 170 },
      { food: "Fiocchi d'avena", grams: 40 },
      { food: "Noci", grams: 10 },
      { food: "Miele", grams: 5 },
    ],
    steps: [
      "Taglia la mela a cubetti e scaldala 3 minuti con cannella e poca acqua.",
      "Tosta l'avena in padella per 2 minuti, mescolando continuamente.",
      "Versa yogurt, mela tiepida e avena in una coppa.",
      "Completa con noci tritate e il miele misurato.",
    ],
    alternatives: [
      "Kiwi al posto della mela",
      "Semi di zucca al posto delle noci",
    ],
  },
  {
    id: "toast-tuna",
    name: "Toast croccante con tonno e ricotta",
    kicker: "Veloce, saporito e davvero pratico",
    image: photo("toast-tuna-v2"),
    time: 9,
    cuisine: "Italiano",
    ingredients: [
      { food: "Pane integrale", grams: 90 },
      { food: "Tonno al naturale sgocciolato", grams: 90 },
      { food: "Ricotta vaccina", grams: 60 },
      { food: "Pomodorini", grams: 120 },
      { food: "Rucola", grams: 40 },
    ],
    steps: [
      "Tosta bene il pane per 3-4 minuti: deve risultare asciutto e croccante sui bordi.",
      "Sgocciola il tonno e mescolalo con la ricotta, pepe e qualche goccia di limone.",
      "Spalma la crema sul pane ancora caldo.",
      "Completa con pomodorini tagliati e rucola; mangialo subito per mantenerlo croccante.",
    ],
    alternatives: [
      "Uovo al posto del tonno",
      "Yogurt greco denso al posto della ricotta",
    ],
  },
];
const mainCombos = [
  ["Petto di pollo cotto", "pollo dorato"],
  ["Salmone cotto", "salmone al limone"],
  ["Tonno al naturale sgocciolato", "tonno mediterraneo"],
  ["Uova strapazzate o in frittata", "uova strapazzate"],
  ["Ceci cotti", "ceci speziati"],
  ["Lenticchie cotte", "lenticchie alle erbe"],
  ["Ricotta vaccina", "ricotta cremosa"],
] as const;
const baseCombos = [
  ["Quinoa cotta", "quinoa"],
  ["Farro cotto", "farro"],
  ["Riso basmati cotto", "riso basmati"],
  ["Patata dolce cotta", "patata dolce"],
  ["Pane integrale", "pane integrale croccante"],
  ["Miglio cotto", "miglio"],
  ["Cous cous integrale cotto", "cous cous integrale"],
  ["Grano saraceno cotto", "grano saraceno"],
  ["Orzo perlato cotto", "orzo perlato"],
  ["Noodles di riso cotti", "noodles di riso"],
] as const;
const baseHow: Record<string, string> = {
  "Quinoa cotta":
    "Sciacqua la quinoa in un colino fine per un minuto. Mettila in pentola con il doppio del suo volume d'acqua, porta a bollore, copri e cuoci piano 12-15 minuti. Spegni, riposa 5 minuti e sgrana con la forchetta.",
  "Farro cotto":
    "Sciacqua il farro. Versalo in abbondante acqua bollente leggermente salata e cuoci 25-30 minuti, o il tempo della confezione se è precotto. Assaggia: deve essere tenero ma ancora consistente, poi scolalo bene.",
  "Riso basmati cotto":
    "Sciacqua il riso 3-4 volte. Usa una parte di riso e una parte e mezza d'acqua. Porta a bollore, copri, abbassa al minimo e cuoci 10-12 minuti senza sollevare il coperchio. Riposa 5 minuti e sgrana.",
  "Miglio cotto":
    "Sciacqua il miglio, tostalo due minuti in pentola e aggiungi due parti e mezza d'acqua per una parte di miglio. Copri e cuoci piano 18-20 minuti. Riposa 5 minuti: i chicchi devono essere morbidi e separabili.",
  "Cous cous integrale cotto":
    "Metti il cous cous in una ciotola. Versa lo stesso volume di acqua bollente, copri 5 minuti, poi separa ogni grumo con una forchetta. Se resta duro aggiungi un cucchiaio d'acqua e attendi altri 2 minuti.",
  "Grano saraceno cotto":
    "Sciacqua i chicchi, usa due parti d'acqua per una di grano saraceno e cuoci coperto a fuoco basso per 12-15 minuti. Spegni quando l'acqua è assorbita e riposa 5 minuti.",
  "Orzo perlato cotto":
    "Sciacqua l'orzo e versalo in abbondante acqua bollente. Cuoci 30-35 minuti, assaggiando negli ultimi 5: deve essere morbido ma non sfatto. Scola e lascia uscire il vapore.",
  "Noodles di riso cotti":
    "Copri i noodles con acqua molto calda e lasciali 4-6 minuti, controllando la confezione. Scolali quando sono flessibili ma ancora consistenti e sciacquali rapidamente per fermare la cottura.",
  "Patata dolce cotta":
    "Taglia la patata dolce a cubetti di 2 cm. Cuocila in forno a 200 °C per 22-25 minuti, girandola a metà: è pronta quando la forchetta entra facilmente e gli angoli sono dorati.",
  "Pane integrale":
    "Scalda una padella pulita e tosta il pane 2-3 minuti per lato, finché è dorato, asciutto sui bordi e ancora appena morbido al centro.",
};
const vegCombos = [
  [["Zucchine", 140], ["Pomodorini", 110], "zucchine e pomodorini"],
  [["Peperoni", 140], ["Spinaci", 80], "peperoni e spinaci"],
  [["Fagiolini", 150], ["Cetriolo", 100], "fagiolini e cetriolo"],
  [["Rucola", 60], ["Pomodorini", 130], "rucola e pomodorini"],
] as const;
const flavorProfiles = [
  {
    cuisine: "Creativo",
    aroma:
      "zenzero, lime e un cucchiaino di salsa di soia a ridotto contenuto di sale",
    finish: "taglio ordinato, erbe fresche e semi di zucca tostati",
  },
  {
    cuisine: "Creativo",
    aroma: "lime, zenzero, peperoncino e coriandolo",
    finish: "verdure croccanti e una spremuta di lime",
  },
  {
    cuisine: "Creativo",
    aroma: "curry dolce, curcuma, cumino e limone",
    finish: "spezie tostate e una cucchiaiata fresca di yogurt se gradito",
  },
  {
    cuisine: "Creativo",
    aroma: "zenzero, aglio, peperoncino e aceto di riso",
    finish: "strisce sottili di verdura e semi tostati",
  },
  {
    cuisine: "Mediterraneo",
    aroma: "cumino, paprika affumicata, limone e menta",
    finish: "erbe fresche, limone e verdure ben colorate",
  },
  {
    cuisine: "Creativo",
    aroma: "ras el hanout, cannella appena accennata e scorza di limone",
    finish: "contrasto caldo-fresco e impiattamento a mezzaluna",
  },
  {
    cuisine: "Creativo",
    aroma: "senape, pepe nero, timo e limone",
    finish:
      "base compatta, verdure appoggiate in altezza e salsa a piccoli punti",
  },
  {
    cuisine: "Italiano",
    aroma: "origano, finocchietto, scorza di limone e pepe",
    finish: "pomodorini lucidi, rucola fresca e olio a filo",
  },
  {
    cuisine: "Italiano",
    aroma: "rosmarino, salvia, aglio e pepe nero",
    finish: "elementi rustici ben dorati e olio solo a crudo",
  },
  {
    cuisine: "Mediterraneo",
    aroma: "origano, limone, aglio e menta",
    finish: "ingredienti separati, feta sbriciolata se prevista ed erbe",
  },
  {
    cuisine: "Creativo",
    aroma: "aneto, scorza di limone, pepe e aceto delicato",
    finish: "linee pulite, verdure croccanti e ciuffi di aneto",
  },
  {
    cuisine: "Vegetale",
    aroma: "paprika, cumino, limone ed erbe miste",
    finish: "molti colori, consistenze diverse e semi tostati",
  },
  {
    cuisine: "Creativo",
    aroma: "lime, peperoncino dolce, coriandolo e cipolla marinata",
    finish: "colori netti e una finitura fresca e acidula",
  },
  {
    cuisine: "Creativo",
    aroma: "lime, aglio, paprika e prezzemolo",
    finish: "base compatta e verdure vivaci disposte a spicchi",
  },
  {
    cuisine: "Creativo",
    aroma: "lime, zenzero, menta e coriandolo",
    finish: "erbe fresche, verdure sottili e parte calda separata",
  },
  {
    cuisine: "Creativo",
    aroma: "curcuma, zenzero, lime e peperoncino",
    finish: "contrasto dorato e verde con lime a lato",
  },
  {
    cuisine: "Mediterraneo",
    aroma: "cumino, sommacco, menta e limone",
    finish: "erbe, spezie rosse e ingredienti disposti a ventaglio",
  },
  {
    cuisine: "Creativo",
    aroma: "coriandolo, paprika, aglio e aceto",
    finish: "verdure ben arrostite e noci solo se consentite",
  },
  {
    cuisine: "Vegetale",
    aroma: "paprika, curcuma, cumino e zenzero",
    finish: "componenti separati e spezie distribuite in superficie",
  },
  {
    cuisine: "Mediterraneo",
    aroma: "alloro, aglio, limone e prezzemolo",
    finish: "olio a crudo, erbe e una fetta di limone",
  },
  {
    cuisine: "Mediterraneo",
    aroma: "paprika affumicata, zafferano, limone e prezzemolo",
    finish: "base stesa, verdure ordinate e bordi ben dorati",
  },
  {
    cuisine: "Creativo",
    aroma: "lime, pimento, timo e peperoncino",
    finish: "colori tropicali e una finitura fresca",
  },
  {
    cuisine: "Creativo",
    aroma: "timo, senape delicata, limone e pepe",
    finish: "porzione raccolta, salsa leggera e verdure in altezza",
  },
  {
    cuisine: "Creativo",
    aroma: "paprika, origano, aglio e aceto",
    finish: "verdure arrostite, erbe e contrasti cremosi se consentiti",
  },
] as const;

const generatedRecipes: Recipe[] = Array.from({ length: 284 }, (_, index) => {
  const protein = mainCombos[index % mainCombos.length];
  const base =
    baseCombos[Math.floor(index / mainCombos.length) % baseCombos.length];
  const veg =
    vegCombos[
      Math.floor(index / (mainCombos.length * baseCombos.length)) %
        vegCombos.length
    ];
  const style = [
    "Bowl calda",
    "Piatto rustico",
    "Insalata tiepida",
    "Teglia profumata",
  ][index % 4];
  const course = ["Piatto unico", "Primo", "Secondo", "Contorno"][index % 4];
  const profile = flavorProfiles[index % flavorProfiles.length];
  const proteinGrams =
    protein[0] === "Uova strapazzate o in frittata"
      ? 120
      : protein[0].includes("cotti")
        ? 140
        : protein[0].includes("Ricotta")
          ? 110
          : 125;
  const baseGrams =
    base[0] === "Pane integrale"
      ? 90
      : base[0] === "Patata dolce cotta"
        ? 240
        : 165;
  const proteinKey = protein[0].toLowerCase();
  const image =
    base[0] === "Noodles di riso cotti"
      ? photo("rice-noodles-veg-v3")
      : course === "Contorno" && veg[2] === "zucchine e pomodorini"
        ? photo("zucchini-tomato-side-v3")
        : proteinKey.includes("salmone")
          ? photo("salmon")
          : proteinKey.includes("tonno")
            ? photo("tuna-rice")
            : proteinKey.includes("pollo")
              ? photo("chicken-bowl")
              : protein[0] === "Uova strapazzate o in frittata"
                ? photo("eggs-quinoa-v3")
                : photo("farro");
  const title =
    course === "Primo"
      ? `${base[1]} con ${veg[2]}`
      : course === "Secondo"
        ? `${protein[1]} con ${veg[2]}`
        : course === "Contorno"
          ? `${veg[2]} con erbe e spezie`
          : `${style} con ${protein[1]}, ${base[1]} e ${veg[2]}`;
  const ingredients: RecipeIngredient[] =
    course === "Primo"
      ? [
          { food: base[0], grams: baseGrams + 35 },
          { food: veg[0][0], grams: veg[0][1] },
          { food: veg[1][0], grams: veg[1][1] },
          { food: "Olio extravergine", grams: 8 },
        ]
      : course === "Secondo"
        ? [
            { food: protein[0], grams: proteinGrams + 25 },
            { food: veg[0][0], grams: veg[0][1] },
            { food: veg[1][0], grams: veg[1][1] },
            { food: "Olio extravergine", grams: 8 },
          ]
        : course === "Contorno"
          ? [
              { food: veg[0][0], grams: Number(veg[0][1]) + 80 },
              { food: veg[1][0], grams: Number(veg[1][1]) + 60 },
              { food: "Semi di zucca", grams: 10 },
              { food: "Olio extravergine", grams: 7 },
            ]
          : [
              { food: protein[0], grams: proteinGrams },
              { food: base[0], grams: baseGrams },
              { food: veg[0][0], grams: veg[0][1] },
              { food: veg[1][0], grams: veg[1][1] },
              { food: "Olio extravergine", grams: 8 },
            ];
  const steps = [
    "Prima di iniziare, pesa tutto, lava le verdure e prepara tagliere, coltello, padella, pentola e ciotola.",
    ...(course === "Primo" || course === "Piatto unico"
      ? [baseHow[base[0]]]
      : []),
    ...(course === "Secondo" || course === "Piatto unico"
      ? [
          proteinKey.includes("pollo")
            ? "Taglia il pollo crudo a bocconcini uguali. Cuocilo in padella calda 6-8 minuti, girandolo spesso: deve raggiungere 74 °C al cuore."
            : proteinKey.includes("salmone")
              ? "Cuoci il salmone su carta forno a 190 °C per 12-15 minuti: è pronto quando è opaco e si separa in scaglie."
            : protein[0] === "Uova strapazzate o in frittata"
                ? "Per uova ben cotte, usa fuoco medio-basso per 4-5 minuti finché l'albume è rappreso; per uova sode, parti da acqua fredda e calcola 9 minuti dal bollore."
                : `Scalda ${protein[1]} per 3-4 minuti a fuoco medio con spezie ed erbe, mescolando senza schiacciarlo.`,
        ]
      : []),
    `Cuoci le verdure più dure per 6-8 minuti e aggiungi quelle delicate negli ultimi 2. Insaporisci con ${profile.aroma}; devono restare colorate e leggermente consistenti.`,
    `Impiatta con ${profile.finish}. Aggiungi l'olio misurato solo alla fine e assaggia prima di aggiungere sale.`,
  ];
  return {
    id: `scelta-${index + 1}`,
    name: title,
    kicker: `${course} · stile ${profile.cuisine.toLowerCase()}`,
    cuisine: profile.cuisine,
    course,
    image,
    time:
      proteinKey.includes("pollo") || proteinKey.includes("salmone") ? 30 : 20,
    ingredients,
    steps,
    alternatives: [
      "Cambia la base mantenendo una porzione simile",
      "Sostituisci la parte proteica con una delle proposte del catalogo",
      "Usa verdure di stagione che tolleri bene",
    ],
  };
});
const snackFruits = [
  "Mela",
  "Banana",
  "Kiwi",
  "Pera",
  "Arancia",
  "Mango",
  "Ananas",
  "Papaya",
  "Fragole",
  "Frutti di bosco",
];
const snackNuts = ["Noci", "Mandorle", "Pistacchi", "Nocciole", "Anacardi non salati"];
const snackRecipes: Recipe[] = Array.from({ length: 32 }, (_, index) => {
  const fruit = snackFruits[Math.floor(index / 4) % snackFruits.length];
  const nuts = snackNuts[Math.floor(index / 8) % snackNuts.length];
  const kind = ["Colazione", "Spuntino", "Dolce", "Gelato"][index % 4];
  const frozen = kind === "Gelato";
  return {
    id: `dolce-${index + 1}`,
    name: frozen
      ? `Frozen yogurt a ${fruit.toLowerCase()} e ${nuts.toLowerCase()}`
      : `${kind} · coppa di ${fruit.toLowerCase()}, yogurt e ${nuts.toLowerCase()}`,
    kicker: `${kind} ${kind === "Colazione" ? "bilanciata" : "bilanciato"} con quantità modificabili`,
    course: kind,
    cuisine: "Creativo",
    image: photo("fruit-breakfast-v2"),
    time: frozen ? 185 : 8,
    ingredients: [
      { food: "Yogurt greco 2%", grams: 180 },
      { food: fruit, grams: 150 },
      { food: nuts, grams: 12 },
      {
        food: index % 3 === 0 ? "Cioccolato fondente 70%" : "Fiocchi d'avena",
        grams: index % 3 === 0 ? 10 : 20,
      },
    ],
    steps: frozen
      ? [
          `Lava e taglia ${fruit.toLowerCase()} in pezzi piccoli; tienine alcuni da parte per la finitura.`,
          `Frulla yogurt e frutta per 30-40 secondi, senza aggiungere zucchero. Versa in un contenitore basso.`,
          `Congela per 3 ore, mescolando energicamente ogni 45 minuti per rompere i cristalli. Prima di servire lascialo 8 minuti a temperatura ambiente.`,
          `Completa con ${nuts.toLowerCase()} tritati e la finitura prevista; usa una coppa piccola per mantenere la porzione chiara.`,
        ]
      : [
          `Lava e taglia ${fruit.toLowerCase()} in pezzi regolari.`,
          `Tosta avena o frutta secca per 2 minuti in padella asciutta, mescolando e senza farla scurire troppo.`,
          `Metti lo yogurt nella coppa, aggiungi la frutta e completa con ${nuts.toLowerCase()} tritati.`,
          `Servi subito se vuoi contrasto croccante; lascia 10 minuti se preferisci l'avena più morbida.`,
        ],
    alternatives: [
      "Cambia frutto mantenendo una quantità simile",
      "Usa un'alternativa vegetale compatibile con i tuoi filtri",
      "Aumenta o riduci i grammi e registra la quantità reale",
    ],
  };
});
const simpleBreakfasts: Recipe[] = [
  {
    id: "breakfast-rusks-jam",
    name: "Fette biscottate, ricotta e confettura",
    kicker: "Colazione pronta in tre minuti",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("rusks-ricotta-jam-v3"),
    time: 3,
    ingredients: [
      { food: "Latte parzialmente scremato", grams: 200 },
      { food: "Fette biscottate integrali", grams: 30 },
      { food: "Ricotta vaccina", grams: 50 },
      { food: "Confettura di frutta", grams: 20 },
      { food: "Arancia", grams: 150 },
    ],
    parts: [
      {
        category: "Latticino",
        food: "Latte parzialmente scremato",
        grams: 200,
        label: "Latte",
        image: photo("part-milk-v7"),
      },
      {
        category: "Carboidrato",
        food: "Fette biscottate integrali",
        grams: 30,
        label: "Fette biscottate",
        image: photo("part-rusks-v7"),
      },
      {
        category: "Latticino",
        food: "Ricotta vaccina",
        grams: 50,
        label: "Ricotta",
        image: photo("part-ricotta-v7"),
      },
      {
        category: "Extra",
        food: "Confettura di frutta",
        grams: 20,
        label: "Confettura",
        image: photo("part-jam-v7"),
      },
      {
        category: "Frutta",
        food: "Arancia",
        grams: 150,
        label: "Arancia",
        image: photo("part-orange-v7"),
      },
    ],
    steps: [
      "Pesa fette biscottate, ricotta e confettura.",
      "Spalma prima la ricotta e poi un velo di confettura; servi con l'arancia già lavata e tagliata.",
    ],
    alternatives: [
      "Yogurt al posto della ricotta",
      "Miele al posto della confettura",
    ],
  },
  {
    id: "breakfast-milk-biscuits",
    name: "Latte, biscotti secchi e frutta",
    kicker: "La colazione più immediata",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("fruit-breakfast-v2"),
    time: 2,
    ingredients: [
      { food: "Latte parzialmente scremato", grams: 250 },
      { food: "Biscotti secchi", grams: 45 },
      { food: "Mela", grams: 150 },
    ],
    parts: [
      {
        category: "Latticino",
        food: "Latte parzialmente scremato",
        grams: 250,
        label: "Latte",
        image: photo("part-milk-v7"),
      },
      {
        category: "Carboidrato",
        food: "Biscotti secchi",
        grams: 45,
        label: "Biscotti secchi",
        image: photo("part-biscuits-v7"),
      },
      {
        category: "Frutta",
        food: "Mela",
        grams: 150,
        label: "Mela",
        image: photo("part-apple-v7"),
      },
    ],
    steps: [
      "Versa il latte nella tazza e scaldalo 60-90 secondi se lo preferisci caldo.",
      "Pesa i biscotti e mangia la mela intera o tagliata a spicchi.",
    ],
    alternatives: ["Pera al posto della mela", "Yogurt al posto del latte"],
  },
  {
    id: "breakfast-crackers-ricotta",
    name: "Cracker integrali, ricotta e miele",
    kicker: "Salata-dolce, pronta senza cucinare",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("rusks-ricotta-jam-v3"),
    time: 3,
    ingredients: [
      { food: "Cracker integrali", grams: 50 },
      { food: "Ricotta vaccina", grams: 90 },
      { food: "Miele", grams: 10 },
      { food: "Kiwi", grams: 130 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Cracker integrali",
        grams: 50,
        label: "Cracker integrali",
        image: photo("crackers-35g-v5"),
      },
      {
        category: "Latticino",
        food: "Ricotta vaccina",
        grams: 90,
        label: "Ricotta",
        image: photo("part-ricotta-v7"),
      },
      {
        category: "Extra",
        food: "Miele",
        grams: 10,
        label: "Miele",
        image: photo("part-honey-v7"),
      },
      {
        category: "Frutta",
        food: "Kiwi",
        grams: 130,
        label: "Kiwi",
        image: photo("part-kiwi-v7"),
      },
    ],
    steps: [
      "Pesa gli ingredienti e pela il kiwi.",
      "Spalma la ricotta sui cracker, aggiungi il miele a filo e mangia il kiwi a parte.",
    ],
    alternatives: [
      "Confettura al posto del miele",
      "Fette biscottate al posto dei cracker",
    ],
  },
  {
    id: "breakfast-rusks-butter",
    name: "Fette biscottate, burro e confettura",
    kicker: "Classica, con quantità chiare",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("rusks-ricotta-jam-v3"),
    time: 3,
    ingredients: [
      { food: "Fette biscottate integrali", grams: 45 },
      { food: "Burro", grams: 10 },
      { food: "Confettura di frutta", grams: 25 },
      { food: "Latte parzialmente scremato", grams: 200 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Fette biscottate integrali",
        grams: 45,
        label: "Fette biscottate",
        image: photo("part-rusks-v7"),
      },
      {
        category: "Extra",
        food: "Burro",
        grams: 10,
        label: "Burro",
        image: photo("part-butter-v7"),
      },
      {
        category: "Extra",
        food: "Confettura di frutta",
        grams: 25,
        label: "Confettura",
        image: photo("part-jam-v7"),
      },
      {
        category: "Latticino",
        food: "Latte parzialmente scremato",
        grams: 200,
        label: "Latte",
        image: photo("part-milk-v7"),
      },
    ],
    steps: [
      "Lascia ammorbidire il burro un minuto e pesane la quantità.",
      "Spalmalo sulle fette biscottate, aggiungi la confettura e accompagna con il latte.",
    ],
    alternatives: ["Ricotta al posto del burro", "Yogurt al posto del latte"],
  },
];
simpleBreakfasts.forEach((recipe) => (recipe.kind = "combination"));
const matrixBreakfasts: Recipe[] = [
  {
    id: "matrix-c05-oat-pancakes",
    name: "Pancake d'avena e banana",
    kicker: "Colazione da casa · matrice C05",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-oat-pancakes-v112"),
    time: 15,
    ingredients: [
      { food: "Farina d'avena", grams: 40 },
      { food: "Banana", grams: 100 },
      { food: "Uova strapazzate o in frittata", grams: 50, label: "1 uovo nell'impasto" },
      { food: "Yogurt greco 2%", grams: 60 },
      { food: "Fragole", grams: 100 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Farina d'avena",
        grams: 40,
        label: "Farina d'avena · peso a crudo",
        image: photo("part-oat-flour-v9"),
      },
      {
        category: "Frutta",
        food: "Banana",
        grams: 100,
        label: "Banana",
        image: photo("part-banana-v7"),
      },
      {
        category: "Proteina",
        food: "Uova strapazzate o in frittata",
        grams: 50,
        label: "1 uovo medio",
        image: photo("part-eggs-scrambled-v1156"),
      },
      {
        category: "Latticino",
        food: "Yogurt greco 2%",
        grams: 60,
        label: "Yogurt bianco",
        image: photo("part-yogurt-v7"),
      },
      {
        category: "Frutta",
        food: "Fragole",
        grams: 100,
        label: "Fragole",
        image: photo("part-strawberries-v11"),
      },
    ],
    steps: [
      "Schiaccia la banana con una forchetta fino a ottenere una crema senza pezzi grandi.",
      "Unisci l'uovo, poi incorpora la farina d'avena fino a formare una pastella uniforme.",
      "Scalda una padella antiaderente. Versa tre piccoli pancake e cuocili 2-3 minuti per lato a fuoco medio-basso.",
      "Servi con lo yogurt e le fragole lavate e tagliate. Non aggiungere olio o zucchero non registrati.",
    ],
    alternatives: [
      "Pera al posto della banana, ricalcolando i grammi",
      "Yogurt senza lattosio al posto dello yogurt bianco",
      "La ricetta contiene un uovo: viene conteggiato nella frequenza settimanale",
    ],
  },
  {
    id: "matrix-c21-porridge-banana-peanut",
    name: "Porridge banana, arachidi e lino",
    kicker: "Colazione da casa · matrice C21",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-c21-porridge-banana-peanut-v113"),
    time: 10,
    ingredients: [
      { food: "Fiocchi d'avena", grams: 40 },
      { food: "Bevanda di soia senza zucchero", grams: 180 },
      { food: "Banana", grams: 150 },
      { food: "Crema 100% arachidi", grams: 10 },
      { food: "Semi di lino macinati", grams: 5 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Fiocchi d'avena",
        grams: 40,
        label: "Fiocchi d'avena · peso a crudo",
        image: photo("part-oats-v113"),
      },
      {
        category: "Latticino",
        food: "Bevanda di soia senza zucchero",
        grams: 180,
        label: "Bevanda di soia senza zuccheri",
        image: photo("part-milk-v7"),
      },
      {
        category: "Frutta",
        food: "Banana",
        grams: 150,
        label: "Banana",
        image: photo("part-banana-v7"),
      },
      {
        category: "Extra",
        food: "Crema 100% arachidi",
        grams: 10,
        label: "Crema 100% arachidi",
        image: photo("part-peanut-butter-v113"),
      },
      {
        category: "Extra",
        food: "Semi di lino macinati",
        grams: 5,
        label: "Semi di lino macinati",
        image: photo("part-flaxseed-v113"),
      },
    ],
    steps: [
      "Versa fiocchi d'avena e bevanda di soia in un pentolino.",
      "Cuoci a fuoco medio-basso per 5-7 minuti, mescolando finché il porridge diventa cremoso.",
      "Spegni il fuoco, aggiungi la banana a rondelle, la crema 100% arachidi e i semi di lino macinati già pesati.",
    ],
    alternatives: [
      "Bevanda d'avena senza zucchero al posto della soia, con ricalcolo automatico",
      "Contiene soia e arachidi",
      "Per la versione da lavoro preparalo la sera e conservalo in frigorifero",
    ],
  },
  {
    id: "matrix-c29-porridge-pear-pistachio",
    name: "Porridge con pera e pistacchi",
    kicker: "Colazione da casa · matrice C29",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-c29-porridge-pear-pistachio-v1143"),
    time: 10,
    ingredients: [
      { food: "Fiocchi d'avena", grams: 40 },
      { food: "Latte parzialmente scremato", grams: 180 },
      { food: "Pera", grams: 150 },
      { food: "Pistacchi", grams: 10 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Fiocchi d'avena",
        grams: 40,
        label: "Fiocchi d'avena · peso a crudo",
        image: photo("part-oats-v113"),
      },
      {
        category: "Latticino",
        food: "Latte parzialmente scremato",
        grams: 180,
        label: "Latte parzialmente scremato",
        image: photo("part-milk-v7"),
      },
      {
        category: "Frutta",
        food: "Pera",
        grams: 150,
        label: "Pera",
        image: photo("part-pear-v7"),
      },
      {
        category: "Extra",
        food: "Pistacchi",
        grams: 10,
        label: "Pistacchi non salati",
        image: photo("part-pistachios-v1143"),
      },
    ],
    steps: [
      "Versa 40 g di fiocchi d'avena e 180 ml di latte in un pentolino.",
      "Cuoci a fuoco medio-basso per 5-7 minuti, mescolando finché il porridge diventa cremoso.",
      "Lava la pera, tagliala a cubetti e aggiungila al porridge.",
      "Trita 10 g di pistacchi non salati e distribuiscili sopra senza aggiungere zuccheri non registrati.",
    ],
    alternatives: [
      "Bevanda di soia senza zuccheri al posto del latte, con ricalcolo automatico",
      "Contiene latte e pistacchi; con soia contiene soia",
      "Preparazione da casa o weekend: non viene privilegiata nelle mattine di lavoro",
    ],
  },
  {
    id: "matrix-c30-yogurt-kiwi-pecans",
    name: "Yogurt greco con kiwi, avena e noci pecan",
    kicker: "Colazione veloce · matrice C30",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-c30-yogurt-kiwi-pecans-v1144"),
    time: 5,
    ingredients: [
      { food: "Yogurt greco 2%", grams: 170 },
      { food: "Kiwi", grams: 150 },
      { food: "Fiocchi d'avena", grams: 30 },
      { food: "Noci pecan", grams: 10 },
    ],
    parts: [
      {
        category: "Latticino",
        food: "Yogurt greco 2%",
        grams: 170,
        label: "Yogurt greco bianco",
        image: photo("part-yogurt-v7"),
      },
      {
        category: "Frutta",
        food: "Kiwi",
        grams: 150,
        label: "Kiwi",
        image: photo("part-kiwi-v7"),
      },
      {
        category: "Carboidrato",
        food: "Fiocchi d'avena",
        grams: 30,
        label: "Fiocchi d'avena · peso a crudo",
        image: photo("part-oats-v113"),
      },
      {
        category: "Extra",
        food: "Noci pecan",
        grams: 10,
        label: "Noci pecan non salate",
        image: photo("part-pecans-v1144"),
      },
    ],
    steps: [
      "Versa 170 g di yogurt greco bianco in una ciotola.",
      "Sbuccia e affetta 150 g di kiwi.",
      "Aggiungi 30 g di fiocchi d'avena e completa con 10 g di noci pecan spezzettate.",
      "Per il lavoro, porta avena e pecan separati e aggiungili allo yogurt al momento di mangiare.",
    ],
    alternatives: [
      "Yogurt senza lattosio o di soia non zuccherato, con ricalcolo automatico",
      "Pistacchi, mandorle o noci nella quantità equivalente proposta",
      "Contiene latte, avena e frutta a guscio",
    ],
  },
  {
    id: "matrix-c32-omelette-tomato-mushroom",
    name: "Omelette con pomodori, funghi e pane integrale",
    kicker: "Colazione salata da casa · matrice C32",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-c32-omelette-v115"),
    time: 15,
    ingredients: [
      { food: "Uova strapazzate o in frittata", grams: 50 }, { food: "Albume", grams: 100 },
      { food: "Pomodorini", grams: 100 }, { food: "Funghi", grams: 100 },
      { food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 5 },
    ],
    parts: [
      { category: "Proteina", food: "Uova strapazzate o in frittata", grams: 50, label: "1 uovo per omelette", image: photo("part-eggs-scrambled-v1156") },
      { category: "Proteina", food: "Albume", grams: 100, label: "Albume · 100 g", image: photo("part-eggs-scrambled-v8") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori", image: photo("part-tomatoes-v8") },
      { category: "Contorno", food: "Funghi", grams: 100, label: "Funghi", image: photo("part-mushrooms-v8") },
      { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale", image: photo("part-bread-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio extravergine", image: photo("part-olive-oil-v8") },
    ],
    steps: [
      "Taglia pomodori e funghi e cuocili in padella antiaderente per 5-6 minuti con metà dell'olio pesato.",
      "Sbatti un uovo con 100 g di albume, versa sulle verdure e cuoci finché il centro è completamente rappreso.",
      "Piega l'omelette, completa con l'olio rimasto e servi con 50 g di pane integrale tostato.",
    ],
    alternatives: ["Colazione da casa o weekend", "Contiene uova e glutine", "Pomodori e funghi restano sostituibili separatamente"],
  },
  {
    id: "matrix-c33-kefir-papaya-muesli",
    name: "Kefir con papaya, muesli e mandorle",
    kicker: "Colazione pronta in tre minuti · matrice C33",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-c33-kefir-papaya-v1152"),
    time: 3,
    ingredients: [
      { food: "Kefir bianco magro", grams: 170 },
      { food: "Papaya", grams: 150 },
      { food: "Muesli", grams: 30 },
      { food: "Mandorle", grams: 10 },
    ],
    parts: [
      { category: "Latticino", food: "Kefir bianco magro", grams: 170, label: "Kefir bianco magro", image: photo("part-kefir-v1152") },
      { category: "Frutta", food: "Papaya", grams: 150, label: "Papaya", image: photo("part-papaya-v8") },
      { category: "Carboidrato", food: "Muesli", grams: 30, label: "Muesli · 30 g", image: photo("part-muesli-v1152") },
      { category: "Extra", food: "Mandorle", grams: 10, label: "Mandorle non salate", image: photo("part-almonds-v8") },
    ],
    steps: [
      "Versa 170 g di kefir bianco in una ciotola.",
      "Sbuccia la papaya, elimina i semi e pesa 150 g di polpa tagliata a cubetti.",
      "Aggiungi 30 g di muesli e 10 g di mandorle; per mantenerli croccanti, uniscili solo al momento di mangiare.",
    ],
    alternatives: [
      "Colazione rapida da casa o trasportabile",
      "Contiene latte, cereali con glutine e frutta a guscio",
      "Kefir, frutta, cereale e mandorle restano sostituibili separatamente",
    ],
  },
  {
    id: "matrix-c31-spelt-ricotta-apple",
    name: "Pane di farro con ricotta, mela e nocciole",
    kicker: "Colazione veloce · matrice C31",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-c31-spelt-ricotta-apple-v11511"),
    time: 5,
    ingredients: [
      { food: "Pane di farro", grams: 50 },
      { food: "Ricotta vaccina", grams: 80 },
      { food: "Mela", grams: 150 },
      { food: "Nocciole", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pane di farro", grams: 50, label: "Pane di farro · 50 g", image: photo("part-bread-spelt-v11511") },
      { category: "Latticino", food: "Ricotta vaccina", grams: 80, label: "Ricotta vaccina · 80 g", image: photo("part-ricotta-v7") },
      { category: "Frutta", food: "Mela", grams: 150, label: "Mela · parte edibile", image: photo("part-apple-v7") },
      { category: "Extra", food: "Nocciole", grams: 10, label: "Nocciole · 10 g", image: photo("part-hazelnuts-v11511") },
    ],
    steps: [
      "Tosta il pane di farro 2-3 minuti, senza aggiungere grassi non registrati.",
      "Spalma gli 80 g di ricotta sulle fette.",
      "Lava la mela, elimina il torsolo, pesane 150 g di parte edibile e affettala.",
      "Completa con 10 g di nocciole spezzettate; per il lavoro porta la mela separata.",
    ],
    alternatives: ["Pane di segale o ai cereali nella quantità equivalente", "Skyr o yogurt al posto della ricotta", "Contiene latte, glutine e nocciole"],
  },
  {
    id: "matrix-c34-buckwheat-pancakes-pear",
    name: "Pancake di grano saraceno con pera e yogurt",
    kicker: "Colazione da casa · matrice C34",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-c34-buckwheat-pancakes-v11511"),
    time: 15,
    ingredients: [
      { food: "Farina di grano saraceno", grams: 40 },
      { food: "Albume", grams: 100 },
      { food: "Latte parzialmente scremato", grams: 50 },
      { food: "Pera", grams: 150 },
      { food: "Yogurt greco 2%", grams: 60 },
    ],
    parts: [
      { category: "Carboidrato", food: "Farina di grano saraceno", grams: 40, label: "Farina di grano saraceno · peso a crudo", image: photo("part-buckwheat-flour-v9") },
      { category: "Proteina", food: "Albume", grams: 100, label: "Albume · 100 g", image: photo("part-eggs-scrambled-v8") },
      { category: "Latticino", food: "Latte parzialmente scremato", grams: 50, label: "Latte nell'impasto · 50 ml", image: photo("part-milk-v7") },
      { category: "Frutta", food: "Pera", grams: 150, label: "Pera · parte edibile", image: photo("part-pear-v7") },
      { category: "Latticino", food: "Yogurt greco 2%", grams: 60, label: "Yogurt bianco · 60 g", image: photo("part-yogurt-v7") },
    ],
    steps: [
      "Mescola farina, albume e latte fino a ottenere una pastella liscia.",
      "Scalda una padella antiaderente e forma tre piccoli pancake; cuoci 2-3 minuti per lato a fuoco medio-basso.",
      "Lava la pera, elimina il torsolo e affetta 150 g di parte edibile.",
      "Servi i pancake con la pera e 60 g di yogurt, senza sciroppi non registrati.",
    ],
    alternatives: ["Bevanda di soia senza zucchero al posto del latte", "Mela al posto della pera nella quantità proposta", "Da privilegiare a casa o nel weekend"],
  },
  {
    id: "matrix-c35-skyr-melon-chia",
    name: "Skyr con melone, chia e pane di segale",
    kicker: "Colazione fresca e rapida · matrice C35",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-c35-skyr-melon-chia-v11511"),
    time: 5,
    ingredients: [
      { food: "Skyr bianco", grams: 170 },
      { food: "Melone estivo", grams: 200 },
      { food: "Semi di chia", grams: 10 },
      { food: "Pane di segale", grams: 40 },
    ],
    parts: [
      { category: "Latticino", food: "Skyr bianco", grams: 170, label: "Skyr bianco · 170 g", image: photo("part-skyr-v11511") },
      { category: "Frutta", food: "Melone estivo", grams: 200, label: "Melone · polpa edibile", image: photo("part-melon-v1152") },
      { category: "Extra", food: "Semi di chia", grams: 10, label: "Semi di chia · 10 g", image: photo("part-chia-v11511") },
      { category: "Carboidrato", food: "Pane di segale", grams: 40, label: "Pane di segale · 40 g", image: photo("part-bread-rye-v1156") },
    ],
    steps: [
      "Versa lo skyr in una ciotola.",
      "Pulisci il melone, elimina buccia e semi e pesa 200 g di polpa a cubetti.",
      "Aggiungi 10 g di semi di chia e servi il pane di segale a parte.",
      "Se la prepari per il lavoro, conserva skyr e melone refrigerati e aggiungi la chia al momento.",
    ],
    alternatives: ["Yogurt greco o proteico al posto dello skyr", "Frutta di stagione nella quantità equivalente", "Contiene latte e segale"],
  },
  {
    id: "matrix-c36-cereal-hazelnut-strawberry",
    name: "Pane ai cereali con crema di nocciole, fragole e yogurt",
    kicker: "Colazione veloce · matrice C36",
    course: "Colazione",
    cuisine: "Italiano",
    image: photo("recipe-c36-cereal-hazelnut-strawberry-v11511"),
    time: 5,
    ingredients: [
      { food: "Pane ai cereali", grams: 50 },
      { food: "Crema 100% nocciole", grams: 15 },
      { food: "Fragole", grams: 150 },
      { food: "Yogurt greco 2%", grams: 125 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pane ai cereali", grams: 50, label: "Pane ai cereali · 50 g", image: photo("part-bread-cereals-v11511") },
      { category: "Extra", food: "Crema 100% nocciole", grams: 15, label: "Crema 100% nocciole · 15 g", image: photo("part-hazelnut-paste-v11511") },
      { category: "Frutta", food: "Fragole", grams: 150, label: "Fragole · parte edibile", image: photo("part-strawberries-v11") },
      { category: "Latticino", food: "Yogurt greco 2%", grams: 125, label: "Yogurt bianco · 1 vasetto", image: photo("part-yogurt-v7") },
    ],
    steps: [
      "Tosta leggermente il pane ai cereali.",
      "Mescola la crema 100% nocciole nel vasetto e pesane 15 g prima di spalmarla.",
      "Lava, asciuga e taglia le fragole; servi con lo yogurt bianco.",
      "Per il lavoro porta pane e crema separati da yogurt e fragole fino al consumo.",
    ],
    alternatives: ["Crema 100% arachidi nella quantità equivalente", "Skyr al posto dello yogurt", "Contiene glutine, latte e nocciole"],
  },
];
const matrixSnacks: Recipe[] = [
  {
    id: "matrix-s11-banana-peanut",
    name: "Banana con crema 100% arachidi",
    kicker: "Spuntino pratico · matrice S11",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-banana-v7"),
    time: 2,
    ingredients: [
      { food: "Banana", grams: 150 },
      { food: "Crema 100% arachidi", grams: 10 },
    ],
    parts: [
      {
        category: "Frutta",
        food: "Banana",
        grams: 150,
        label: "Banana",
        image: photo("part-banana-v7"),
      },
      {
        category: "Extra",
        food: "Crema 100% arachidi",
        grams: 10,
        label: "Crema 100% arachidi",
        image: photo("part-peanut-butter-v113"),
      },
    ],
    steps: ["Taglia la banana e aggiungi la crema composta esclusivamente da arachidi."],
    alternatives: ["Contiene arachidi", "Porta la crema già pesata in un piccolo contenitore"],
  },
  { id: "matrix-s27-apricot-almond", name: "Albicocche e mandorle", kicker: "Spuntino pratico · matrice S27", course: "Spuntino", cuisine: "Italiano", kind: "combination", image: photo("part-apricots-v1152"), time: 2, ingredients: [{ food: "Albicocche fresche", grams: 150 }, { food: "Mandorle", grams: 15 }], parts: [{ category: "Frutta", food: "Albicocche fresche", grams: 150, label: "Albicocche · parte edibile", image: photo("part-apricots-v1152") }, { category: "Extra", food: "Mandorle", grams: 15, label: "Mandorle non salate", image: photo("part-almonds-v9") }], steps: ["Lava e asciuga le albicocche; pesa 150 g di parte edibile e abbinale a 15 g di mandorle già porzionate."], alternatives: ["Trasportabile al lavoro", "Contiene frutta a guscio"] },
  { id: "matrix-s28-kefir-blackberries-flax", name: "Kefir con more e semi di lino", kicker: "Spuntino fresco · matrice S28", course: "Spuntino", cuisine: "Italiano", kind: "combination", image: photo("part-blackberries-v11512"), time: 3, ingredients: [{ food: "Kefir bianco magro", grams: 170 }, { food: "More", grams: 150 }, { food: "Semi di lino macinati", grams: 5 }], parts: [{ category: "Latticino", food: "Kefir bianco magro", grams: 170, label: "Kefir bianco", image: photo("part-kefir-v1152") }, { category: "Frutta", food: "More", grams: 150, label: "More fresche", image: photo("part-blackberries-v11512") }, { category: "Extra", food: "Semi di lino macinati", grams: 5, label: "Semi di lino macinati", image: photo("part-flaxseed-v113") }], steps: ["Versa il kefir in un contenitore, aggiungi le more lavate e completa con i semi di lino macinati al momento."], alternatives: ["Conserva refrigerato", "Contiene latte"] },
  { id: "matrix-s29-ricotta-apple", name: "Ricotta con mela e cannella", kicker: "Spuntino dolce · matrice S29", course: "Spuntino", cuisine: "Italiano", kind: "combination", image: photo("part-ricotta-v7"), time: 5, ingredients: [{ food: "Ricotta vaccina", grams: 80 }, { food: "Mela", grams: 150 }], parts: [{ category: "Latticino", food: "Ricotta vaccina", grams: 80, label: "Ricotta vaccina", image: photo("part-ricotta-v7") }, { category: "Frutta", food: "Mela", grams: 150, label: "Mela a cubetti", image: photo("part-apple-v7") }], steps: ["Lava e taglia la mela a cubetti; servila con la ricotta e cannella facoltativa, senza zucchero aggiunto."], alternatives: ["Conserva refrigerato", "Contiene latte"] },
  { id: "matrix-s30-rice-cakes-hummus", name: "Gallette integrali con hummus, rucola e pomodorini", kicker: "Spuntino salato · matrice S30", course: "Spuntino", cuisine: "Mediterraneo", kind: "combination", image: photo("part-rice-cakes-whole-v11512"), time: 5, ingredients: [{ food: "Gallette di riso integrale", grams: 27 }, { food: "Hummus di ceci", grams: 40 }, { food: "Rucola", grams: 30 }, { food: "Pomodorini", grams: 100 }], parts: [{ category: "Carboidrato", food: "Gallette di riso integrale", grams: 27, label: "Gallette integrali · 3 circa", image: photo("part-rice-cakes-whole-v11512") }, { category: "Proteina", food: "Hummus di ceci", grams: 40, label: "Hummus di ceci", image: photo("part-hummus-v11512") }, { category: "Contorno", food: "Rucola", grams: 30, label: "Rucola", image: photo("part-rucola-v7") }, { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodorini", image: photo("part-tomatoes-v8") }], steps: ["Lava rucola e pomodorini. Spalma l'hummus sulle gallette solo al momento e completa con le verdure."], alternatives: ["Trasporta hummus e verdure separati", "Contiene sesamo se presente nell'hummus"] },
  { id: "matrix-s31-orange-peanuts", name: "Arancia e arachidi non salate", kicker: "Spuntino pratico · matrice S31", course: "Spuntino", cuisine: "Italiano", kind: "combination", image: photo("part-orange-v7"), time: 2, ingredients: [{ food: "Arancia", grams: 150 }, { food: "Arachidi", grams: 15 }], parts: [{ category: "Frutta", food: "Arancia", grams: 150, label: "Arancia · parte edibile", image: photo("part-orange-v7") }, { category: "Extra", food: "Arachidi", grams: 15, label: "Arachidi non salate", image: photo("part-peanuts-v113") }], steps: ["Pesa 150 g di arancia pulita e abbinala a 15 g di arachidi non salate già porzionate."], alternatives: ["Trasportabile al lavoro", "Contiene arachidi"] },
  { id: "matrix-s32-cottage-carrot-cucumber", name: "Fiocchi di latte con carote crude e cetrioli", kicker: "Spuntino fresco · matrice S32", course: "Spuntino", cuisine: "Italiano", kind: "combination", image: photo("part-cottage-cheese-v11512"), time: 7, ingredients: [{ food: "Fiocchi di latte", grams: 80 }, { food: "Carote crude", grams: 100 }, { food: "Cetriolo", grams: 100 }], parts: [{ category: "Latticino", food: "Fiocchi di latte", grams: 80, label: "Fiocchi di latte", image: photo("part-cottage-cheese-v11512") }, { category: "Contorno", food: "Carote crude", grams: 100, label: "Carote crude a bastoncino", image: photo("part-carrots-raw-v11512") }, { category: "Contorno", food: "Cetriolo", grams: 100, label: "Cetriolo a bastoncino", image: photo("part-cucumber-v8") }], steps: ["Lava e pela le carote, lava il cetriolo e tagliali a bastoncino. Servi con i fiocchi di latte e erbe aromatiche."], alternatives: ["Conserva refrigerato", "Contiene latte"] },
  { id: "matrix-s33-yogurt-pineapple-sesame", name: "Yogurt con ananas e sesamo", kicker: "Spuntino fresco · matrice S33", course: "Spuntino", cuisine: "Internazionale", kind: "combination", image: photo("part-pineapple-v11513"), time: 3, ingredients: [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Ananas", grams: 150 }, { food: "Semi di sesamo", grams: 5 }], parts: [{ category: "Latticino", food: "Yogurt greco 2%", grams: 125, label: "Yogurt bianco", image: photo("part-yogurt-v7") }, { category: "Frutta", food: "Ananas", grams: 150, label: "Ananas fresco · parte edibile", image: photo("part-pineapple-v11513") }, { category: "Extra", food: "Semi di sesamo", grams: 5, label: "Semi di sesamo", image: photo("part-sesame-v11512") }], steps: ["Taglia l'ananas fresco a cubetti, uniscilo allo yogurt e completa con 5 g di semi di sesamo."], alternatives: ["Conserva refrigerato", "Contiene latte e sesamo"] },
  { id: "matrix-s34-rye-ricotta-radish", name: "Pane di segale con ricotta e ravanelli", kicker: "Spuntino salato · matrice S34", course: "Spuntino", cuisine: "Italiano", kind: "combination", image: photo("part-radishes-v11512"), time: 5, ingredients: [{ food: "Pane di segale", grams: 40 }, { food: "Ricotta vaccina", grams: 60 }, { food: "Ravanelli crudi", grams: 100 }], parts: [{ category: "Carboidrato", food: "Pane di segale", grams: 40, label: "Pane di segale", image: photo("part-bread-rye-v1156") }, { category: "Latticino", food: "Ricotta vaccina", grams: 60, label: "Ricotta vaccina", image: photo("part-ricotta-v7") }, { category: "Contorno", food: "Ravanelli crudi", grams: 100, label: "Ravanelli crudi", image: photo("part-radishes-v11512") }], steps: ["Lava e affetta sottilmente i ravanelli. Spalma la ricotta sul pane di segale e aggiungi i ravanelli."], alternatives: ["Trasportabile separando pane e farcitura", "Contiene latte e segale"] },];
const attachmentMissingSnacks: Recipe[] = [
  {
    id: "matrix-s02-yogurt-blueberries",
    name: "Yogurt bianco e mirtilli",
    kicker: "Spuntino fresco · pronto in 2 minuti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s02-yogurt-blueberries-v1160"),
    time: 2,
    ingredients: [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Mirtilli freschi", grams: 150 }],
    parts: [
      { category: "Latticino", food: "Yogurt greco 2%", grams: 125, label: "Yogurt bianco · 1 vasetto", image: photo("part-yogurt-v7") },
      { category: "Frutta", food: "Mirtilli freschi", grams: 150, label: "Mirtilli freschi · parte edibile", image: photo("part-blueberries-v1160") },
    ],
    steps: ["Lava e asciuga delicatamente i mirtilli.", "Versa lo yogurt in una ciotola e aggiungi i mirtilli senza zucchero."],
    alternatives: ["Conserva refrigerato fino al consumo", "Contiene latte"],
  },
  {
    id: "matrix-s09-unsweetened-yogurt-smoothie",
    name: "Frullato di yogurt e mirtilli senza zucchero",
    kicker: "Spuntino occasionale · frutta intera di norma preferita",
    course: "Spuntino",
    cuisine: "Italiano",
    image: photo("recipe-s09-yogurt-fruit-smoothie-v1160"),
    time: 4,
    ingredients: [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Mirtilli freschi", grams: 150 }],
    parts: [
      { category: "Latticino", food: "Yogurt greco 2%", grams: 125, label: "Yogurt bianco · 1 vasetto", image: photo("part-yogurt-v7") },
      { category: "Frutta", food: "Mirtilli freschi", grams: 150, label: "Mirtilli freschi", image: photo("part-blueberries-v1160") },
    ],
    steps: ["Lava i mirtilli.", "Frulla yogurt e mirtilli con poca acqua fredda fino alla consistenza desiderata; non aggiungere zucchero."],
    alternatives: ["Proposta occasionale: normalmente preferisci la frutta intera", "Contiene latte"],
  },
  {
    id: "matrix-s12-mandarins-walnuts",
    name: "Mandarini e noci",
    kicker: "Spuntino pratico · due ingredienti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s12-mandarins-walnuts-v1160"),
    time: 2,
    ingredients: [{ food: "Mandarini freschi", grams: 150 }, { food: "Noci", grams: 15 }],
    parts: [
      { category: "Frutta", food: "Mandarini freschi", grams: 150, label: "Mandarini · parte edibile", image: photo("part-mandarins-v1160") },
      { category: "Extra", food: "Noci", grams: 15, label: "Noci non salate · 15 g", image: photo("walnuts-20g-v5") },
    ],
    steps: ["Sbuccia i mandarini e pesa 150 g di parte edibile.", "Abbinali a 15 g di noci già porzionate."],
    alternatives: ["Trasportabile al lavoro", "Contiene frutta a guscio"],
  },
  {
    id: "matrix-s13-skyr-pomegranate",
    name: "Skyr con melagrana",
    kicker: "Spuntino fresco · pronto in 3 minuti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s13-skyr-pomegranate-v1160"),
    time: 3,
    ingredients: [{ food: "Skyr bianco", grams: 170 }, { food: "Melagrana fresca", grams: 150 }],
    parts: [
      { category: "Latticino", food: "Skyr bianco", grams: 170, label: "Skyr bianco · 1 vasetto", image: photo("part-skyr-v11511") },
      { category: "Frutta", food: "Melagrana fresca", grams: 150, label: "Chicchi di melagrana · parte edibile", image: photo("part-pomegranate-v1160") },
    ],
    steps: ["Apri la melagrana e ricava 150 g di chicchi puliti.", "Versa lo skyr in una ciotola e aggiungi i chicchi senza zucchero."],
    alternatives: ["Yogurt greco bianco al posto dello skyr", "Contiene latte"],
  },
  {
    id: "matrix-s19-peach-cashews",
    name: "Pesca e anacardi",
    kicker: "Spuntino estivo · pronto in 2 minuti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s19-peach-cashews-v1160"),
    time: 2,
    ingredients: [{ food: "Pesca", grams: 150 }, { food: "Anacardi non salati", grams: 15 }],
    parts: [
      { category: "Frutta", food: "Pesca", grams: 150, label: "Pesca · parte edibile", image: photo("part-peach-v113") },
      { category: "Extra", food: "Anacardi non salati", grams: 15, label: "Anacardi non salati · 15 g", image: photo("part-cashews-v1160") },
    ],
    steps: ["Lava, asciuga e taglia la pesca; pesa 150 g di parte edibile.", "Abbinala a 15 g di anacardi non salati già porzionati."],
    alternatives: ["Nettarina nella stessa quantità", "Contiene frutta a guscio"],
  },
];
const matrixMainRecipes: Recipe[] = [
  { id:"matrix-p48-legume-pasta-salmon", name:"Pasta di lenticchie con salmone e broccoli", kicker:"Pranzo di pesce · matrice P48", course:"Piatto unico", cuisine:"Italiano", image:photo("recipe-p48-legume-pasta-salmon-v11515"), time:25, ingredients:[{food:"Pasta di lenticchie secca",grams:70},{food:"Salmone cotto",grams:100},{food:"Broccoli bolliti",grams:250},{food:"Olio extravergine",grams:5}], parts:[{category:"Carboidrato",food:"Pasta di lenticchie secca",grams:70,label:"Pasta di lenticchie · peso a crudo",image:photo("part-lentil-pasta-v11515")},{category:"Proteina",food:"Salmone cotto",grams:100,label:"Salmone alla piastra",image:photo("part-salmon-baked-v7")},{category:"Contorno",food:"Broccoli bolliti",grams:250,label:"Broccoli cotti",image:photo("part-broccoli-v1154")},{category:"Extra",food:"Olio extravergine",grams:5,label:"Olio EVO · 5 g",image:photo("part-olive-oil-v8")}], steps:["Cuoci i broccoli al vapore o in acqua per 6-8 minuti.","Cuoci la pasta secondo confezione e il salmone alla piastra fino a completa cottura.","Unisci e completa con 5 g di olio pesato, limone ed erba cipollina."], alternatives:["Contiene pesce; verificare il legume della pasta","Adatto a casa o schiscetta refrigerata","Componenti modificabili separatamente"] },
  { id:"matrix-p49-millet-chicken-pumpkin", name:"Miglio con pollo, zucca e cavolo nero", kicker:"Pranzo carne bianca · matrice P49", course:"Piatto unico", cuisine:"Italiano", image:photo("recipe-p49-millet-chicken-v11515"), time:35, ingredients:[{food:"Miglio cotto",grams:190},{food:"Petto di pollo cotto",grams:100},{food:"Zucca",grams:150},{food:"Cavolo nero cotto",grams:100},{food:"Olio extravergine",grams:10}], parts:[{category:"Carboidrato",food:"Miglio cotto",grams:190,label:"Miglio cotto · da circa 70 g secco",image:photo("part-millet-v11515")},{category:"Proteina",food:"Petto di pollo cotto",grams:100,label:"Petto di pollo alla piastra",image:photo("part-chicken-grilled-v7")},{category:"Contorno",food:"Zucca",grams:150,label:"Zucca arrostita",image:photo("part-pumpkin-v8")},{category:"Contorno",food:"Cavolo nero cotto",grams:100,label:"Cavolo nero cotto",image:photo("part-kale-v11515")},{category:"Extra",food:"Olio extravergine",grams:10,label:"Olio EVO · 10 g",image:photo("part-olive-oil-v8")}], steps:["Cuoci il miglio seguendo la confezione.","Arrostisci la zucca, cuoci il cavolo nero e griglia il pollo fino a completa cottura.","Unisci e completa con olio pesato, rosmarino, paprika e pepe."], alternatives:["Senza glutine se certificato","Preferibile a casa; trasportabile preparato prima","Componenti modificabili separatamente"] },
  { id:"matrix-p50-gnocchi-cannellini-chard", name:"Gnocchi con cannellini, pomodoro e bietole", kicker:"Pranzo vegetale · matrice P50", course:"Piatto unico", cuisine:"Italiano", image:photo("recipe-p50-gnocchi-cannellini-v11515"), time:25, ingredients:[{food:"Gnocchi di patate",grams:150},{food:"Fagioli cannellini cotti",grams:120},{food:"Pomodorini",grams:125},{food:"Bietole cotte",grams:125},{food:"Olio extravergine",grams:10}], parts:[{category:"Carboidrato",food:"Gnocchi di patate",grams:150,label:"Gnocchi di patate",image:photo("part-gnocchi-v7")},{category:"Proteina",food:"Fagioli cannellini cotti",grams:120,label:"Cannellini cotti e sgocciolati",image:photo("part-cannellini-v1141")},{category:"Contorno",food:"Pomodorini",grams:125,label:"Pomodoro cotto",image:photo("part-tomatoes-v8")},{category:"Contorno",food:"Bietole cotte",grams:125,label:"Bietole cotte",image:photo("part-chard-v11515")},{category:"Extra",food:"Olio extravergine",grams:10,label:"Olio EVO · 10 g",image:photo("part-olive-oil-v8")}], steps:["Cuoci pomodoro e bietole, quindi aggiungi i cannellini risciacquati.","Lessa gli gnocchi e scolali quando salgono in superficie.","Unisci al condimento e completa con 10 g di olio pesato, aglio e salvia."], alternatives:["Verificare glutine e uova negli gnocchi","Adatto a casa","Componenti modificabili separatamente"] },
  { id:"matrix-p51-polenta-rabbit-mushrooms", name:"Polenta con coniglio, funghi e radicchio", kicker:"Pranzo casa · matrice P51", course:"Piatto completo", cuisine:"Italiano", image:photo("recipe-p51-polenta-rabbit-v11515"), time:45, ingredients:[{food:"Polenta cotta",grams:300},{food:"Coniglio cotto in umido",grams:100},{food:"Funghi",grams:125},{food:"Radicchio cotto",grams:125},{food:"Olio extravergine",grams:10}], parts:[{category:"Carboidrato",food:"Polenta cotta",grams:300,label:"Polenta cotta · da circa 70 g farina",image:photo("part-polenta-v11515")},{category:"Proteina",food:"Coniglio cotto in umido",grams:100,label:"Coniglio cotto · parte edibile",image:photo("part-rabbit-v11515")},{category:"Contorno",food:"Funghi",grams:125,label:"Funghi cotti",image:photo("part-mushrooms-v8")},{category:"Contorno",food:"Radicchio cotto",grams:125,label:"Radicchio cotto",image:photo("part-radicchio-v11515")},{category:"Extra",food:"Olio extravergine",grams:10,label:"Olio EVO · 10 g",image:photo("part-olive-oil-v8")}], steps:["Cuoci il coniglio in umido con rosmarino e salvia fino a completa cottura.","Prepara la polenta secondo confezione e cuoci funghi e radicchio in padella antiaderente.","Servi le tre componenti e distribuisci i 10 g di olio pesato."], alternatives:["Pasto da casa","Polenta certificata per senza glutine","Componenti modificabili separatamente"] },
  { id:"matrix-p52-bulgur-tofu-chickpeas", name:"Bulgur con tofu, ceci e verdure", kicker:"Pranzo vegano · matrice P52", course:"Piatto unico", cuisine:"Internazionale", image:photo("recipe-p52-bulgur-tofu-v11515"), time:30, ingredients:[{food:"Bulgur cotto",grams:130},{food:"Tofu alla piastra",grams:80},{food:"Ceci cotti",grams:100},{food:"Carote crude",grams:80},{food:"Zucchine",grams:85},{food:"Cavolo rosso crudo",grams:85},{food:"Olio extravergine",grams:10}], parts:[{category:"Carboidrato",food:"Bulgur cotto",grams:130,label:"Bulgur cotto · da circa 50 g secco",image:photo("part-bulgur-v11515")},{category:"Proteina",food:"Tofu alla piastra",grams:80,label:"Tofu alla piastra",image:photo("part-tofu-v11515")},{category:"Proteina",food:"Ceci cotti",grams:100,label:"Ceci cotti e sgocciolati",image:photo("part-chickpeas-v8")},{category:"Contorno",food:"Carote crude",grams:80,label:"Carote crude",image:photo("part-carrots-raw-v11512")},{category:"Contorno",food:"Zucchine",grams:85,label:"Zucchine cotte",image:photo("part-zucchini-v8")},{category:"Contorno",food:"Cavolo rosso crudo",grams:85,label:"Cavolo rosso",image:photo("part-red-cabbage-v11515")},{category:"Extra",food:"Olio extravergine",grams:10,label:"Olio EVO · 10 g",image:photo("part-olive-oil-v8")}], steps:["Cuoci il bulgur secondo confezione.","Griglia il tofu; cuoci carote e zucchine lasciando il cavolo rosso crudo e croccante; risciacqua i ceci.","Unisci e completa con olio pesato, zenzero, paprika e limone."], alternatives:["Contiene glutine e soia","Trasportabile refrigerato","Cereale, tofu e ceci restano in porzioni ridotte"] },  { id: "matrix-p45-couscous-shrimp-peppers", name: "Cous cous integrale con gamberi, piselli e peperoni", kicker: "Pranzo di pesce · matrice P45", course: "Piatto unico", cuisine: "Mediterraneo", image: photo("recipe-p45-couscous-shrimp-v11514"), time: 25, ingredients: [{ food: "Cous cous integrale cotto", grams: 180 }, { food: "Gamberi cotti", grams: 150 }, { food: "Piselli cotti", grams: 80 }, { food: "Peperoni cotti senza olio", grams: 200 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Carboidrato", food: "Cous cous integrale cotto", grams: 180, label: "Cous cous cotto · da circa 70 g secco", image: photo("part-couscous-v11514") }, { category: "Proteina", food: "Gamberi cotti", grams: 150, label: "Gamberi cotti", image: photo("part-shrimp-v11514") }, { category: "Proteina", food: "Piselli cotti", grams: 80, label: "Piselli cotti", image: photo("part-peas-v8") }, { category: "Contorno", food: "Peperoni cotti senza olio", grams: 200, label: "Peperoni cotti", image: photo("part-peppers-v11514") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Reidrata il cous cous secondo confezione e sgranalo.", "Cuoci i peperoni in padella antiaderente e i gamberi fino a completa cottura; unisci i piselli già cotti.", "Mescola e completa con 10 g di olio pesato, paprika, limone e prezzemolo."], alternatives: ["Contiene glutine e crostacei", "Trasportabile refrigerato", "Componenti modificabili separatamente"] },
  { id: "matrix-p46-barley-turkey-asparagus", name: "Orzo con tacchino, asparagi e funghi", kicker: "Pranzo carne bianca · matrice P46", course: "Piatto unico", cuisine: "Italiano", image: photo("recipe-p46-barley-turkey-v11514"), time: 30, ingredients: [{ food: "Orzo perlato cotto", grams: 180 }, { food: "Petto di tacchino cotto alla piastra", grams: 100 }, { food: "Asparagi crudi", grams: 125 }, { food: "Funghi", grams: 125 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Carboidrato", food: "Orzo perlato cotto", grams: 180, label: "Orzo cotto · da circa 70 g secco", image: photo("part-barley-v11514") }, { category: "Proteina", food: "Petto di tacchino cotto alla piastra", grams: 100, label: "Petto di tacchino alla piastra", image: photo("part-turkey-grilled-v11514") }, { category: "Contorno", food: "Asparagi crudi", grams: 125, label: "Asparagi · peso a crudo", image: photo("part-asparagus-v113") }, { category: "Contorno", food: "Funghi", grams: 125, label: "Funghi", image: photo("part-mushrooms-v8") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci l'orzo secondo confezione e scolalo.", "Cuoci asparagi e funghi in padella antiaderente; griglia il tacchino fino a completa cottura.", "Unisci e condisci con 10 g di olio pesato, timo, limone e pepe."], alternatives: ["Contiene glutine", "Adatto a casa o schiscetta", "Componenti modificabili separatamente"] },
  { id: "matrix-p47-red-rice-lentils", name: "Riso rosso con lenticchie e verdure grigliate", kicker: "Pranzo vegetale · matrice P47", course: "Piatto unico", cuisine: "Mediterraneo", image: photo("recipe-p47-red-rice-lentils-v11514"), time: 35, ingredients: [{ food: "Riso rosso integrale cotto", grams: 180 }, { food: "Lenticchie cotte", grams: 150 }, { food: "Melanzane", grams: 85 }, { food: "Zucchine", grams: 85 }, { food: "Peperoni cotti senza olio", grams: 80 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Carboidrato", food: "Riso rosso integrale cotto", grams: 180, label: "Riso rosso cotto · da circa 60 g secco", image: photo("part-red-rice-v11514") }, { category: "Proteina", food: "Lenticchie cotte", grams: 150, label: "Lenticchie cotte", image: photo("part-lentils-v1141") }, { category: "Contorno", food: "Melanzane", grams: 85, label: "Melanzane grigliate", image: photo("part-eggplant-v8") }, { category: "Contorno", food: "Zucchine", grams: 85, label: "Zucchine grigliate", image: photo("part-zucchini-v8") }, { category: "Contorno", food: "Peperoni cotti senza olio", grams: 80, label: "Peperoni grigliati", image: photo("part-peppers-v11514") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci il riso rosso secondo confezione e scolalo.", "Griglia melanzane, zucchine e peperoni; risciacqua le lenticchie già cotte.", "Unisci tutto e completa con 10 g di olio pesato, origano, basilico e limone."], alternatives: ["Vegano e senza glutine se certificato", "Trasportabile refrigerato", "Componenti modificabili separatamente"] },  {
    id: "matrix-p41-whole-pasta-peas-ricotta", name: "Pasta integrale con piselli, ricotta e zucchine", kicker: "Pranzo vegetariano · matrice P41", course: "Piatto unico", cuisine: "Italiano", image: photo("recipe-p41-pasta-peas-ricotta-v11513"), time: 25,
    ingredients: [{ food: "Pasta integrale secca", grams: 70 }, { food: "Piselli cotti", grams: 120 }, { food: "Ricotta vaccina", grams: 60 }, { food: "Zucchine", grams: 200 }, { food: "Olio extravergine", grams: 5 }],
    parts: [{ category: "Carboidrato", food: "Pasta integrale secca", grams: 70, label: "Pasta integrale · peso a crudo", image: photo("simple-pasta-white-v5") }, { category: "Proteina", food: "Piselli cotti", grams: 120, label: "Piselli cotti", image: photo("part-peas-v8") }, { category: "Latticino", food: "Ricotta vaccina", grams: 60, label: "Ricotta vaccina", image: photo("part-ricotta-v7") }, { category: "Contorno", food: "Zucchine", grams: 200, label: "Zucchine cotte", image: photo("part-zucchini-v8") }, { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") }],
    steps: ["Porta a bollore l'acqua, sala moderatamente e cuoci la pasta per il tempo indicato in confezione.", "Cuoci le zucchine a mezze rondelle in padella antiaderente 8-10 minuti; aggiungi i piselli già cotti negli ultimi 3 minuti.", "Stempera la ricotta con poca acqua di cottura, scola la pasta e manteca tutto fuori dal fuoco; completa con 5 g di olio pesato, basilico e pepe."], alternatives: ["Adatto a casa; per il lavoro preparare la sera prima e conservare refrigerato", "Contiene glutine e latte", "Ogni componente resta sostituibile separatamente"]
  },
  {
    id: "matrix-p42-basmati-cod-spinach", name: "Riso basmati con merluzzo, spinaci e carote", kicker: "Pranzo completo di pesce · matrice P42", course: "Piatto completo", cuisine: "Italiano", image: photo("recipe-p42-basmati-cod-spinach-v11513"), time: 30,
    ingredients: [{ food: "Riso basmati secco", grams: 70 }, { food: "Merluzzo cotto", grams: 150 }, { food: "Spinaci", grams: 150 }, { food: "Carote cotte bollite", grams: 100 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Carboidrato", food: "Riso basmati secco", grams: 70, label: "Riso basmati · peso a crudo", image: photo("part-rice-basmati-v7") }, { category: "Proteina", food: "Merluzzo cotto", grams: 150, label: "Merluzzo cotto al vapore", image: photo("part-cod-steamed-v8") }, { category: "Contorno", food: "Spinaci", grams: 150, label: "Spinaci cotti", image: photo("part-spinach-v7") }, { category: "Contorno", food: "Carote cotte bollite", grams: 100, label: "Carote cotte bollite", image: photo("part-carrots-cooked-v11512") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Sciacqua il riso e cuocilo secondo confezione, quindi scolalo o lascialo assorbire completamente.", "Cuoci il merluzzo al vapore fino a completa cottura; cuoci separatamente spinaci e carote senza grassi aggiunti.", "Servi le componenti distinguibili e condisci con 10 g di olio pesato, curcuma, zenzero e limone."], alternatives: ["Trasportabile in contenitore refrigerato", "Contiene pesce", "Ogni componente resta sostituibile separatamente"]
  },
  {
    id: "matrix-p44-quinoa-cannellini-beet", name: "Quinoa con cannellini, barbabietole e rucola", kicker: "Pranzo vegetale · matrice P44", course: "Piatto unico", cuisine: "Mediterraneo", image: photo("recipe-p44-quinoa-cannellini-beet-v11513"), time: 25,
    ingredients: [{ food: "Quinoa cotta", grams: 185 }, { food: "Fagioli cannellini cotti", grams: 150 }, { food: "Barbabietole cotte", grams: 150 }, { food: "Rucola", grams: 50 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Carboidrato", food: "Quinoa cotta", grams: 185, label: "Quinoa cotta · da circa 70 g secca", image: photo("part-quinoa-v7") }, { category: "Proteina", food: "Fagioli cannellini cotti", grams: 150, label: "Cannellini cotti e sgocciolati", image: photo("part-cannellini-v1141") }, { category: "Contorno", food: "Barbabietole cotte", grams: 150, label: "Barbabietole cotte", image: photo("part-beetroot-v11513") }, { category: "Contorno", food: "Rucola", grams: 50, label: "Rucola fresca", image: photo("part-rucola-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Sciacqua la quinoa e cuocila seguendo la confezione; falla intiepidire.", "Risciacqua e sgocciola i cannellini, taglia le barbabietole cotte a cubetti e lava la rucola.", "Unisci tutto e condisci con 10 g di olio pesato, limone, poco aceto di mele e pepe."], alternatives: ["Vegano e trasportabile", "Senza glutine se gli ingredienti sono certificati", "Ogni componente resta sostituibile separatamente"]
  },  {
    id: "matrix-p43-farro-eggs-green-beans",
    name: "Farro con uova, fagiolini e pomodori",
    kicker: "Pranzo trasportabile · matrice P43",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p43-farro-eggs-v1142"),
    time: 30,
    ingredients: [
      { food: "Farro cotto", grams: 175 },
      { food: "Uova sode", grams: 100 },
      { food: "Fagiolini", grams: 125 },
      { food: "Pomodorini", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Farro cotto",
        grams: 175,
        label: "Farro cotto · da circa 70 g secco",
        image: photo("farro"),
      },
      {
        category: "Proteina",
        food: "Uova sode",
        grams: 100,
        label: "2 uova sode",
        image: photo("part-eggs-boiled-v7"),
      },
      {
        category: "Contorno",
        food: "Fagiolini",
        grams: 125,
        label: "Fagiolini cotti",
        image: photo("part-green-beans-v7"),
      },
      {
        category: "Contorno",
        food: "Pomodorini",
        grams: 125,
        label: "Pomodori",
        image: photo("part-tomatoes-v8"),
      },
      {
        category: "Extra",
        food: "Olio extravergine",
        grams: 10,
        label: "Olio extravergine",
        image: photo("part-olive-oil-v8"),
      },
    ],
    steps: [
      "Sciacqua 70 g di farro secco e lessalo in acqua per il tempo indicato in confezione; scolalo e pesane circa 175 g cotto.",
      "Metti due uova in acqua fredda, porta a bollore e cuoci 9 minuti; raffreddale e sgusciale.",
      "Lessa o cuoci al vapore i fagiolini per 8-10 minuti, lasciandoli teneri ma non sfatti.",
      "Unisci farro, uova, fagiolini e pomodori lavati. Condisci con 10 g di olio, limone, basilico e pepe.",
      "Per il lavoro, raffredda rapidamente gli ingredienti cotti, conserva il contenitore in frigorifero e trasportalo in borsa termica.",
    ],
    alternatives: [
      "Le due uova vengono conteggiate nella frequenza settimanale",
      "Riso o quinoa nella quantità equivalente proposta al posto del farro",
      "Contiene glutine e uova",
    ],
  },
];
const quickSnacks: Recipe[] = [
  {
    id: "quick-apple",
    name: "Mela pronta",
    kicker: "Zero preparazione",
    course: "Spuntino",
    cuisine: "Italiano",
    image: photo("part-apple-v7"),
    time: 1,
    ingredients: [{ food: "Mela", grams: 150 }],
    parts: [
      {
        category: "Frutta",
        food: "Mela",
        grams: 150,
        label: "Mela",
        image: photo("part-apple-v7"),
      },
    ],
    steps: [
      "Lava la mela e portala intera; pesala solo se vuoi registrare una quantità precisa.",
    ],
    alternatives: ["Pera, kiwi o arancia con calorie riproporzionate"],
  },
  {
    id: "quick-nuts",
    name: "Noci già porzionate",
    kicker: "Da tenere in borsa",
    course: "Spuntino",
    cuisine: "Italiano",
    image: photo("walnuts-20g-v5"),
    time: 1,
    ingredients: [{ food: "Noci", grams: 20 }],
    parts: [
      {
        category: "Extra",
        food: "Noci",
        grams: 20,
        label: "Noci",
        image: photo("walnuts-20g-v5"),
      },
    ],
    steps: ["Pesa le noci una volta e mettile in un contenitore piccolo."],
    alternatives: ["Mandorle, nocciole o pistacchi in quantità equivalente"],
  },
  {
    id: "quick-crackers",
    name: "Cracker integrali",
    kicker: "Apri, pesa, mangia",
    course: "Spuntino",
    cuisine: "Italiano",
    image: photo("crackers-35g-v5"),
    time: 1,
    ingredients: [{ food: "Cracker integrali", grams: 35 }],
    parts: [
      {
        category: "Carboidrato",
        food: "Cracker integrali",
        grams: 35,
        label: "Cracker integrali",
        image: photo("crackers-35g-v5"),
      },
    ],
    steps: [
      "Controlla la porzione indicata in etichetta e registra i grammi realmente mangiati.",
    ],
    alternatives: ["Fette biscottate o frutta"],
  },
  {
    id: "quick-wafer",
    name: "Due wafer e frutta",
    kicker: "Spuntino dolce pratico",
    course: "Spuntino",
    cuisine: "Italiano",
    image: photo("part-wafer-v115"),
    time: 1,
    ingredients: [
      { food: "Wafer confezionati", grams: 25 },
      { food: "Arancia", grams: 150 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Wafer confezionati",
        grams: 25,
        label: "Wafer",
        image: photo("part-wafer-v115"),
      },
      {
        category: "Frutta",
        food: "Arancia",
        grams: 150,
        label: "Arancia",
        image: photo("part-orange-v7"),
      },
    ],
    steps: [
      "Leggi i grammi sulla confezione, prendi la porzione e aggiungi il frutto già lavato.",
    ],
    alternatives: [
      "Biscotti secchi o cracker; verifica sempre l'etichetta della marca",
    ],
  },
  {
    id: "quick-protein-yogurt-strawberries",
    name: "Yogurt proteico e fragole",
    kicker: "Spuntino fresco · due confezioni pratiche",
    course: "Spuntino",
    cuisine: "Italiano",
    image: photo("part-protein-yogurt-v1154"),
    time: 2,
    ingredients: [
      { food: "Yogurt proteico alla vaniglia", grams: 160 },
      { food: "Fragole", grams: 150 },
    ],
    parts: [
      {
        category: "Latticino",
        food: "Yogurt proteico alla vaniglia",
        grams: 160,
        label: "Yogurt proteico · 1 vasetto",
        image: photo("part-protein-yogurt-v1154"),
      },
      {
        category: "Frutta",
        food: "Fragole",
        grams: 150,
        label: "Fragole",
        image: photo("part-strawberries-v11"),
      },
    ],
    steps: [
      "Lava e asciuga le fragole; portale in un contenitore separato dal vasetto.",
      "Apri lo yogurt solo al momento dello spuntino e registra la confezione realmente consumata.",
    ],
    alternatives: ["Kiwi, pesca o ciliegie nella porzione equivalente proposta"],
  },
  {
    id: "quick-protein-pudding-pear",
    name: "Budino proteico e pera",
    kicker: "Spuntino dolce · pronto da portare",
    course: "Spuntino",
    cuisine: "Italiano",
    image: photo("part-protein-pudding-v1154"),
    time: 1,
    ingredients: [
      { food: "Budino proteico al cioccolato", grams: 200 },
      { food: "Pera", grams: 150 },
    ],
    parts: [
      {
        category: "Latticino",
        food: "Budino proteico al cioccolato",
        grams: 200,
        label: "Budino proteico · 1 vasetto",
        image: photo("part-protein-pudding-v1154"),
      },
      {
        category: "Frutta",
        food: "Pera",
        grams: 150,
        label: "Pera",
        image: photo("part-pear-v7"),
      },
    ],
    steps: ["Lava la pera e porta il vasetto refrigerato; non richiede preparazione."],
    alternatives: ["Yogurt proteico oppure un altro frutto nella porzione equivalente"],
  },
];
quickSnacks.forEach((recipe) => (recipe.kind = "combination"));
const portableRecipes: Recipe[] = [
  {
    id: "work-bresaola",
    name: "Panino bresaola, rucola e ricotta",
    kicker: "Freddo, trasportabile, pronto in 4 minuti",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("work-bresaola-v5"),
    time: 4,
    ingredients: [
      { food: "Pane integrale", grams: 100 },
      { food: "Bresaola", grams: 70 },
      { food: "Ricotta vaccina", grams: 35 },
      { food: "Rucola", grams: 25 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Pane integrale",
        grams: 100,
        label: "Pane",
        image: photo("part-bread-v7"),
      },
      {
        category: "Proteina",
        food: "Bresaola",
        grams: 70,
        label: "Bresaola",
        image: photo("part-bresaola-v7"),
      },
      {
        category: "Latticino",
        food: "Ricotta vaccina",
        grams: 35,
        label: "Ricotta",
        image: photo("part-ricotta-v7"),
      },
      {
        category: "Contorno",
        food: "Rucola",
        grams: 25,
        label: "Rucola",
        image: photo("part-rucola-v7"),
      },
    ],
    steps: [
      "Apri il pane e spalma la ricotta.",
      "Aggiungi bresaola e rucola asciutta; chiudi e avvolgi bene.",
    ],
    alternatives: [
      "Fesa di tacchino o prosciutto cotto al posto della bresaola",
    ],
  },
  {
    id: "work-cotto",
    name: "Panino prosciutto cotto e pomodoro",
    kicker: "Pranzo semplice da portare",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("work-cotto-v5"),
    time: 3,
    ingredients: [
      { food: "Pane integrale", grams: 110 },
      { food: "Prosciutto cotto", grams: 80 },
      { food: "Pomodorini", grams: 100 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Pane integrale",
        grams: 110,
        label: "Pane",
        image: photo("part-bread-v7"),
      },
      {
        category: "Proteina",
        food: "Prosciutto cotto",
        grams: 80,
        label: "Prosciutto cotto",
        image: photo("part-prosciutto-cotto-v114"),
      },
      {
        category: "Contorno",
        food: "Pomodorini",
        grams: 100,
        label: "Pomodoro",
        image: photo("part-tomatoes-v8"),
      },
    ],
    steps: [
      "Taglia pane e pomodorini.",
      "Farcisci con prosciutto cotto e pomodoro ben asciutto; conserva al fresco.",
    ],
    alternatives: ["Prosciutto crudo, bresaola o fesa di tacchino"],
  },
  {
    id: "work-rice-salad",
    name: "Insalata di riso semplice",
    kicker: "Preparabile la sera prima",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("work-rice-salad-v5"),
    time: 15,
    ingredients: [
      { food: "Riso basmati cotto", grams: 200 },
      { food: "Tonno al naturale sgocciolato", grams: 90 },
      { food: "Piselli cotti", grams: 70 },
      { food: "Pomodorini", grams: 100 },
      { food: "Olio extravergine", grams: 8 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Riso basmati cotto",
        grams: 200,
        label: "Riso basmati · peso cotto",
        image: photo("part-rice-basmati-v7"),
      },
      {
        category: "Proteina",
        food: "Tonno al naturale sgocciolato",
        grams: 90,
        label: "Tonno al naturale",
        image: photo("part-tuna-v7"),
      },
      {
        category: "Contorno",
        food: "Piselli cotti",
        grams: 70,
        label: "Piselli",
        image: photo("part-peas-v8"),
      },
      {
        category: "Extra",
        food: "Olio extravergine",
        grams: 8,
        label: "Olio extravergine",
        image: photo("part-olive-oil-v8"),
      },
    ],
    steps: [
      "Cuoci il riso, scolalo e raffreddalo rapidamente.",
      "Unisci tonno sgocciolato, piselli e pomodorini; aggiungi l'olio pesato.",
      "Conserva in frigorifero e trasporta in una borsa termica.",
    ],
    alternatives: [
      "Fesa di tacchino al posto del tonno",
      "Zucchine al posto dei piselli",
    ],
  },
  {
    id: "simple-pasta-white",
    name: "Pasta in bianco",
    kicker: "Semplice, disponibile anche in mensa",
    course: "Primo",
    cuisine: "Italiano",
    image: photo("simple-pasta-white-v5"),
    time: 12,
    ingredients: [
      { food: "Pasta cotta", grams: 220 },
      { food: "Olio extravergine", grams: 8 },
    ],
    steps: [
      "Cuoci la pasta in acqua secondo il tempo indicato sulla confezione.",
      "Scola e condisci con l'olio pesato.",
    ],
    alternatives: ["Aggiungi un secondo semplice per completare il pasto"],
  },
  {
    id: "simple-pasta-tomato",
    name: "Pasta al pomodoro",
    kicker: "Primo italiano quotidiano",
    course: "Primo",
    cuisine: "Italiano",
    image: photo("simple-pasta-tomato-v5"),
    time: 15,
    ingredients: [
      { food: "Pasta cotta", grams: 220 },
      { food: "Passata di pomodoro", grams: 120 },
      { food: "Olio extravergine", grams: 8 },
    ],
    steps: [
      "Scalda la passata per 8 minuti.",
      "Cuoci e scola la pasta; unisci passata e olio pesato.",
    ],
    alternatives: ["Riso al pomodoro mantenendo una quota simile"],
  },
  {
    id: "work-turkey",
    name: "Panino con fesa di tacchino e pomodorini",
    kicker: "Panino completo, distinto dalla fesa servita da sola",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("work-turkey-v5"),
    time: 2,
    ingredients: [
      { food: "Pane integrale", grams: 110 },
      { food: "Fesa di tacchino", grams: 100 },
      { food: "Pomodorini", grams: 120 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Pane integrale",
        grams: 110,
        label: "Pane",
        image: photo("part-bread-v7"),
      },
      {
        category: "Proteina",
        food: "Fesa di tacchino",
        grams: 100,
        label: "Fesa di tacchino",
        image: photo("part-turkey-slices-v114"),
      },
      {
        category: "Contorno",
        food: "Pomodorini",
        grams: 120,
        label: "Pomodorini",
        image: photo("part-tomatoes-v8"),
      },
    ],
    steps: [
      "Apri il pane e farciscilo con la fesa di tacchino pesata.",
      "Aggiungi i pomodorini lavati e ben asciutti, oppure portali in un contenitore separato.",
    ],
    alternatives: ["Bresaola, prosciutto cotto o crudo"],
  },
  {
    id: "simple-eggs",
    name: "Uova sode, pane e pomodori",
    kicker: "Preparabile la sera prima",
    course: "Secondo",
    cuisine: "Italiano",
    image: photo("simple-eggs-v5"),
    time: 11,
    ingredients: [
      { food: "Uova sode", grams: 120 },
      { food: "Pane integrale", grams: 90 },
      { food: "Pomodorini", grams: 150 },
    ],
    parts: [
      {
        category: "Proteina",
        food: "Uova sode",
        grams: 120,
        label: "Due uova sode",
        image: photo("part-eggs-boiled-v7"),
      },
      {
        category: "Carboidrato",
        food: "Pane integrale",
        grams: 90,
        label: "Pane",
        image: photo("part-bread-v7"),
      },
      {
        category: "Contorno",
        food: "Pomodorini",
        grams: 150,
        label: "Pomodori",
        image: photo("part-tomatoes-v8"),
      },
    ],
    steps: [
      "Metti le uova in acqua fredda, porta a bollore e cuoci 9 minuti.",
      "Raffreddale in acqua, sgusciale e conserva al fresco; servi con pane e pomodori.",
    ],
    alternatives: ["Bresaola o fesa di tacchino al posto delle uova"],
  },
  {
    id: "simple-steak-potatoes",
    name: "Bistecca ai ferri e patate lesse",
    kicker: "Cena semplice con cotture chiare",
    course: "Secondo",
    cuisine: "Italiano",
    image: photo("simple-steak-potatoes-v5"),
    time: 25,
    ingredients: [
      { food: "Bistecca di manzo · peso a crudo", grams: 150 },
      { food: "Patate lesse", grams: 250 },
      { food: "Olio extravergine", grams: 8 },
    ],
    parts: [
      {
        category: "Proteina",
        food: "Bistecca di manzo · peso a crudo",
        grams: 150,
        label: "Bistecca ai ferri",
        image: photo("part-steak-beef-v114"),
      },
      {
        category: "Carboidrato",
        food: "Patate lesse",
        grams: 250,
        label: "Patate lesse",
        image: photo("part-potatoes-boiled-v7"),
      },
      {
        category: "Extra",
        food: "Olio extravergine",
        grams: 8,
        label: "Olio extravergine",
        image: photo("part-olive-oil-v8"),
      },
    ],
    steps: [
      "Lessa le patate a pezzi per 15-20 minuti, finché la forchetta entra facilmente.",
      "Pesa 150 g di carne cruda. Cuocila su piastra ben calda senza aggiungere altri grassi, fino al grado di cottura sicuro e preferito.",
      "Condisci le patate con l'olio pesato.",
    ],
    alternatives: ["Fesa di tacchino o uova al posto della bistecca"],
  },
];
const balancedDinnerRecipes: Recipe[] = [
  {
    id: "dinner-three-italian",
    name: "Cena in 3 parti · pasta, bistecca, zucchine",
    kicker: "Tre componenti separate, porzioni standard",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("simple-pasta-tomato-v5"),
    time: 25,
    ingredients: [
      { food: "Pasta di semola secca", grams: 80 },
      { food: "Passata di pomodoro", grams: 120 },
      { food: "Bistecca di manzo · peso a crudo", grams: 120 },
      { food: "Zucchine", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Pasta di semola secca",
        grams: 80,
        label: "Pasta al pomodoro · peso a crudo",
        image: photo("simple-pasta-tomato-v5"),
      },
      {
        category: "Proteina",
        food: "Bistecca di manzo · peso a crudo",
        grams: 120,
        label: "Bistecca di manzo · peso a crudo",
        image: photo("part-steak-beef-v114"),
      },
      {
        category: "Contorno",
        food: "Zucchine",
        grams: 200,
        label: "Zucchine cotte",
        image: photo("part-zucchini-v7"),
      },
      {
        category: "Extra",
        food: "Olio extravergine",
        grams: 10,
        label: "Olio extravergine",
        image: photo("part-olive-oil-v8"),
      },
    ],
    steps: [
      "Scalda la passata 8 minuti; cuoci 80 g di pasta secca per il tempo indicato e condiscila con metà olio.",
      "Pesa 120 g di carne cruda. Scalda bene la piastra e cuocila senza aggiungere grassi non conteggiati, fino al grado di cottura desiderato e sicuro.",
      "Taglia le zucchine e cuocile in padella 8-10 minuti; completa con l'olio rimasto.",
    ],
    alternatives: [
      "Cambia separatamente base, proteina o contorno",
      "Passa a un piatto unico completo",
    ],
  },
  {
    id: "dinner-three-eggs",
    name: "Cena in 3 parti · patate, uova, fagiolini",
    kicker: "Semplice, pesabile, senza grammi casuali",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("dinner-eggs-potatoes-beans-v115"),
    time: 25,
    ingredients: [
      { food: "Patate lesse", grams: 200 },
      { food: "Uova sode", grams: 100 },
      { food: "Fagiolini", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Patate lesse",
        grams: 200,
        label: "Patate lesse",
        image: photo("part-potatoes-boiled-v7"),
      },
      {
        category: "Proteina",
        food: "Uova sode",
        grams: 100,
        label: "Due uova sode",
        image: photo("simple-eggs-v5"),
      },
      {
        category: "Contorno",
        food: "Fagiolini",
        grams: 200,
        label: "Fagiolini",
        image: photo("part-green-beans-v7"),
      },
      {
        category: "Extra",
        food: "Olio extravergine",
        grams: 10,
        label: "Olio extravergine",
        image: photo("part-olive-oil-v8"),
      },
    ],
    steps: [
      "Taglia le patate e lessale 15-20 minuti, finché la forchetta entra facilmente.",
      "Cuoci due uova dal bollore per 9 minuti e raffreddale subito.",
      "Lessa o cuoci al vapore i fagiolini 8-12 minuti; condisci patate e fagiolini con l'olio pesato.",
    ],
    alternatives: [
      "Pane 100 g al posto delle patate",
      "Pesce o carne bianca al posto delle uova",
    ],
  },
  {
    id: "dinner-three-rice-chicken",
    name: "Cena in 3 parti · riso, pollo, fagiolini",
    kicker: "Base, proteina e verdura separate",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("dinner-rice-chicken-beans-v115"),
    time: 25,
    ingredients: [
      { food: "Riso basmati secco", grams: 80 },
      { food: "Petto di pollo cotto", grams: 100 },
      { food: "Fagiolini", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Riso basmati secco",
        grams: 80,
        label: "Riso basmati · peso a crudo",
        image: photo("part-rice-basmati-v7"),
      },
      {
        category: "Proteina",
        food: "Petto di pollo cotto",
        grams: 100,
        label: "Petto di pollo alla piastra",
        image: photo("part-chicken-grilled-v7"),
      },
      {
        category: "Contorno",
        food: "Fagiolini",
        grams: 200,
        label: "Fagiolini al vapore",
        image: photo("part-green-beans-v7"),
      },
      {
        category: "Extra",
        food: "Olio extravergine",
        grams: 10,
        label: "Olio extravergine",
        image: photo("part-olive-oil-v8"),
      },
    ],
    steps: [
      "Sciacqua il riso e cuocilo nell'acqua per il tempo indicato sulla confezione; scolalo bene.",
      "Cuoci il petto di pollo su piastra calda 5-7 minuti per lato, fino a completa cottura.",
      "Cuoci i fagiolini al vapore o lessali 8-12 minuti e condisci con l'olio pesato.",
    ],
    alternatives: ["Cambia ogni parte dal pannello visivo"],
  },
  {
    id: "dinner-three-gnocchi-salmon",
    name: "Cena in 3 parti · gnocchi, salmone, spinaci",
    kicker: "Alternativa completa con quantità standard",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("part-gnocchi-v7"),
    time: 22,
    ingredients: [
      { food: "Gnocchi di patate", grams: 150 },
      { food: "Salmone cotto", grams: 150 },
      { food: "Spinaci", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Gnocchi di patate",
        grams: 150,
        label: "Gnocchi di patate",
        image: photo("part-gnocchi-v7"),
      },
      {
        category: "Proteina",
        food: "Salmone cotto",
        grams: 150,
        label: "Salmone al forno",
        image: photo("part-salmon-baked-v7"),
      },
      {
        category: "Contorno",
        food: "Spinaci",
        grams: 200,
        label: "Spinaci cotti",
        image: photo("part-spinach-v7"),
      },
      {
        category: "Extra",
        food: "Olio extravergine",
        grams: 10,
        label: "Olio extravergine",
        image: photo("part-olive-oil-v8"),
      },
    ],
    steps: [
      "Cuoci gli gnocchi in acqua bollente e scolali quando salgono in superficie.",
      "Cuoci il salmone in forno a 190 °C per 12-15 minuti, fino a cottura completa.",
      "Cuoci gli spinaci in padella coperta 6-8 minuti e aggiungi l'olio pesato.",
    ],
    alternatives: ["Cambia ogni parte dal pannello visivo"],
  },
  {
    id: "pasta-lentils-pumpkin",
    name: "Pasta integrale con lenticchie e zucca",
    kicker: "Piatto unico italiano · ingredienti riconoscibili",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-pasta-lentils-pumpkin-v1151"),
    time: 30,
    ingredients: [
      { food: "Pasta integrale secca", grams: 80 },
      { food: "Lenticchie cotte", grams: 120 },
      { food: "Zucca", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pasta integrale secca", grams: 80, label: "Pasta integrale · peso a crudo", image: photo("simple-pasta-white-v5") },
      { category: "Proteina", food: "Lenticchie cotte", grams: 120, label: "Lenticchie cotte", image: photo("part-lentils-v1141") },
      { category: "Contorno", food: "Zucca", grams: 200, label: "Zucca cotta", image: photo("part-pumpkin-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio extravergine", image: photo("part-olive-oil-v8") },
    ],
    steps: [
      "Taglia la zucca a cubetti e cuocila in forno a 190 °C per 20-25 minuti, finché è morbida ma ancora compatta.",
      "Lessa la pasta in acqua bollente salata per il tempo indicato sulla confezione e conserva poca acqua di cottura.",
      "Scalda le lenticchie già cotte, uniscile a pasta e zucca e completa fuori dal fuoco con i 10 g di olio pesato.",
    ],
    alternatives: ["Pasto da casa", "Contiene glutine", "Ogni componente resta sostituibile separatamente"],
  },
  {
    id: "gnocchi-tuna-zucchini",
    name: "Gnocchi con tonno e zucchine",
    kicker: "Piatto unico italiano · tre ingredienti ben distinti",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-gnocchi-tuna-zucchini-v1151"),
    time: 20,
    ingredients: [
      { food: "Gnocchi di patate", grams: 180 },
      { food: "Tonno al naturale sgocciolato", grams: 120 },
      { food: "Zucchine", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Gnocchi di patate", grams: 180, label: "Gnocchi di patate", image: photo("part-gnocchi-v7") },
      { category: "Proteina", food: "Tonno al naturale sgocciolato", grams: 120, label: "Tonno al naturale sgocciolato", image: photo("part-tuna-v7") },
      { category: "Contorno", food: "Zucchine", grams: 200, label: "Zucchine in padella", image: photo("part-zucchini-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio extravergine", image: photo("part-olive-oil-v8") },
    ],
    steps: [
      "Taglia le zucchine a mezze rondelle e cuocile in padella antiaderente 7-9 minuti con poca acqua.",
      "Lessa gli gnocchi in acqua bollente e scolali appena salgono in superficie.",
      "Unisci gnocchi, zucchine e tonno ben sgocciolato; spegni il fuoco e condisci con i 10 g di olio pesato.",
    ],
    alternatives: ["Pasto da casa", "Contiene pesce", "Ogni componente resta sostituibile separatamente"],
  },
  {
    id: "plant-burger-broccoli-bread",
    name: "Burger vegetali con broccoli e pane integrale",
    kicker: "Piatto completo vegetale · quattro componenti modificabili",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-plant-burger-broccoli-v1154"),
    time: 18,
    ingredients: [
      { food: "Pane integrale", grams: 80 },
      { food: "Burger vegetale di soia", grams: 150 },
      { food: "Broccoli bolliti", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pane integrale", grams: 80, label: "Pane integrale · 80 g", image: photo("part-bread-v7") },
      { category: "Proteina", food: "Burger vegetale di soia", grams: 150, label: "Burger vegetali di soia · 2 piccoli", image: photo("part-plant-burger-v1154") },
      { category: "Contorno", food: "Broccoli bolliti", grams: 200, label: "Broccoli bolliti · 200 g", image: photo("part-broccoli-v1154") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio extravergine · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: [
      "Dividi i broccoli in cimette, sciacquali e lessali in acqua bollente per 6-8 minuti, lasciandoli ancora consistenti; scolali bene.",
      "Scalda una padella antiaderente e cuoci i burger vegetali seguendo i tempi della confezione, girandoli a metà cottura.",
      "Servi burger, broccoli e pane separati nel piatto; pesa e aggiungi i 10 g di olio soltanto a fine cottura.",
    ],
    alternatives: ["Adatto a casa", "Controlla sempre l'etichetta del burger scelto", "Ogni componente resta sostituibile separatamente"],
  },
  {
    id: "horse-steak-potatoes-zucchini",
    name: "Bistecca di cavallo ai ferri con patate lesse e zucchine",
    kicker: "Cena italiana completa in tre parti",
    course: "Secondo",
    cuisine: "Italiano",
    image: photo("recipe-horse-steak-potatoes-zucchini-v11518"),
    time: 25,
    ingredients: [
      { food: "Bistecca di cavallo magra · peso a crudo", grams: 120 },
      { food: "Patate lesse", grams: 200 },
      { food: "Zucchine", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Bistecca di cavallo magra · peso a crudo", grams: 120, label: "Bistecca di cavallo ai ferri · 120 g a crudo", image: photo("part-steak-horse-v114") },
      { category: "Carboidrato", food: "Patate lesse", grams: 200, label: "Patate lesse · 200 g", image: photo("part-potatoes-boiled-v7") },
      { category: "Contorno", food: "Zucchine", grams: 200, label: "Zucchine grigliate · 200 g", image: photo("part-zucchini-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio extravergine · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: [
      "Lessa le patate intere con la buccia in acqua non salata per 25-35 minuti, finché la forchetta entra senza sfaldarle; scolale, pelale e tagliale.",
      "Affetta le zucchine per il lungo e grigliale 3-4 minuti per lato su piastra ben calda.",
      "Tampona la bistecca, scaldala sulla piastra molto calda e cuocila fino al grado desiderato e in sicurezza, girandola una sola volta.",
      "Servi le tre parti separate e distribuisci i 10 g di olio pesato tra patate e zucchine.",
    ],
    alternatives: ["A casa", "Cambia separatamente patate, carne o verdura", "Il peso della carne è indicato a crudo"],
  },
  {
    id: "matrix-d41-sole-potatoes-fennel",
    name: "Sogliola al forno con patate, finocchi e pomodori",
    kicker: "Cena completa di pesce",
    course: "Piatto unico", cuisine: "Italiano",
    image: photo("recipe-d41-sole-potatoes-fennel-v11519"), time: 35,
    ingredients: [{ food: "Sogliola · peso a crudo", grams: 150 }, { food: "Patate lesse", grams: 200 }, { food: "Finocchi crudi", grams: 150 }, { food: "Pomodorini", grams: 100 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Proteina", food: "Sogliola · peso a crudo", grams: 150, label: "Sogliola al forno · 150 g a crudo", image: photo("part-sole-baked-v11519") },
      { category: "Carboidrato", food: "Patate lesse", grams: 200, label: "Patate · 200 g", image: photo("part-potatoes-boiled-v7") },
      { category: "Contorno", food: "Finocchi crudi", grams: 150, label: "Finocchi al forno · 150 g a crudo", image: photo("part-fennel-v113") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori freschi · 100 g", image: photo("part-tomatoes-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Scalda il forno a 200 °C. Taglia patate e finocchi, condiscili con parte dell’olio e cuocili 20-25 minuti.", "Adagia la sogliola sulle verdure e prosegui per 10-12 minuti, fino a cottura completa.", "Servi con i pomodori freschi, limone, prezzemolo e l’olio rimasto pesato."],
    alternatives: ["Contiene pesce", "Senza glutine", "Ogni parte può essere cambiata separatamente"],
  },
  {
    id: "matrix-d42-chicken-brown-rice-peppers",
    name: "Pollo alla piastra con riso integrale, peperoni e cipolle",
    kicker: "Cena completa di carne bianca",
    course: "Piatto unico", cuisine: "Italiano",
    image: photo("recipe-d42-chicken-brown-rice-v11519"), time: 30,
    ingredients: [{ food: "Petto di pollo · peso a crudo", grams: 100 }, { food: "Riso integrale secco", grams: 60 }, { food: "Peperoni cotti senza olio", grams: 150 }, { food: "Cipolle crude", grams: 100 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 100, label: "Petto di pollo alla piastra · 100 g a crudo", image: photo("part-chicken-grilled-v7") },
      { category: "Carboidrato", food: "Riso integrale secco", grams: 60, label: "Riso integrale · 60 g a crudo", image: photo("part-brown-rice-v11519") },
      { category: "Contorno", food: "Peperoni cotti senza olio", grams: 150, label: "Peperoni · 150 g", image: photo("part-peppers-v11514") },
      { category: "Contorno", food: "Cipolle crude", grams: 100, label: "Cipolle · 100 g a crudo", image: photo("part-onions-v11519") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Sciacqua il riso e cuocilo nel tempo indicato sulla confezione, poi scolalo.", "Cuoci peperoni e cipolle affettati in padella antiaderente per 12-15 minuti.", "Griglia il pollo fino a cottura completa, taglialo e servi le tre parti con l’olio pesato."],
    alternatives: ["Carne bianca", "Senza glutine", "Adatta a casa; trasportabile se refrigerata"],
  },
  {
    id: "matrix-d43-grass-pea-soup",
    name: "Zuppa di cicerchie e verdure con pane integrale",
    kicker: "Cena vegetale completa",
    course: "Piatto unico", cuisine: "Italiano",
    image: photo("recipe-d43-grass-pea-soup-v11519"), time: 50,
    ingredients: [{ food: "Cicerchie cotte", grams: 150 }, { food: "Carote crude", grams: 60 }, { food: "Sedano crudo", grams: 50 }, { food: "Cipolle crude", grams: 50 }, { food: "Pomodorini", grams: 70 }, { food: "Spinaci", grams: 70 }, { food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Proteina", food: "Cicerchie cotte", grams: 150, label: "Cicerchie cotte · 150 g", image: photo("part-grass-peas-v11519") },
      { category: "Contorno", food: "Carote crude", grams: 60, label: "Carote · 60 g", image: photo("part-carrots-raw-v11512") },
      { category: "Contorno", food: "Sedano crudo", grams: 50, label: "Sedano · 50 g", image: photo("part-celery-v1154") },
      { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolla · 50 g", image: photo("part-onions-v11519") },
      { category: "Contorno", food: "Pomodorini", grams: 70, label: "Pomodoro · 70 g", image: photo("part-tomatoes-v8") },
      { category: "Contorno", food: "Spinaci", grams: 70, label: "Spinaci · 70 g", image: photo("part-spinach-v7") },
      { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Se parti dal secco, ammolla e cuoci le cicerchie seguendo rigorosamente tempi e istruzioni della confezione; non improvvisare la cottura.", "Cuoci carota, sedano, cipolla e pomodoro in acqua; unisci cicerchie e spinaci e prosegui finché le verdure sono tenere.", "Completa con rosmarino, pepe, 10 g di olio a crudo e il pane separato."],
    alternatives: ["Non proporre cicerchie ogni giorno", "Contiene glutine nel pane", "Legume da variare nella rotazione"],
  },
  {
    id: "matrix-d44-artichoke-frittata",
    name: "Frittata con carciofi e cipolle, insalata e pane di segale",
    kicker: "Cena vegetariana completa",
    course: "Piatto unico", cuisine: "Italiano",
    image: photo("recipe-d44-artichoke-frittata-v11519"), time: 30,
    ingredients: [{ food: "Uova strapazzate o in frittata", grams: 100 }, { food: "Carciofi cotti bolliti", grams: 150 }, { food: "Cipolle crude", grams: 50 }, { food: "Insalata verde", grams: 80 }, { food: "Pane di segale", grams: 50 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Proteina", food: "Uova strapazzate o in frittata", grams: 100, label: "Frittata · 2 uova", image: photo("part-eggs-scrambled-v1156") },
      { category: "Contorno", food: "Carciofi cotti bolliti", grams: 150, label: "Carciofi cotti · 150 g", image: photo("part-artichokes-v11519") },
      { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolle · 50 g a crudo", image: photo("part-onions-v11519") },
      { category: "Contorno", food: "Insalata verde", grams: 80, label: "Insalata verde · 80 g", image: photo("part-lettuce-v8") },
      { category: "Carboidrato", food: "Pane di segale", grams: 50, label: "Pane di segale · 50 g", image: photo("part-bread-rye-v1156") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Affetta la cipolla e scaldala con i carciofi già cotti in padella antiaderente.", "Sbatti due uova, versale sulle verdure e cuoci coperto a fuoco basso oppure in forno fino a completa coagulazione.", "Servi con insalata, pane di segale e l’olio totale pesato."],
    alternatives: ["Conta due uova nella rotazione settimanale", "Contiene uova e glutine", "Componenti modificabili separatamente"],
  },
  {
    id: "matrix-d45-tempeh-sweet-potato",
    name: "Tempeh alla piastra con patata dolce e broccoli",
    kicker: "Piatto vegetale completo · matrice D45", course: "Piatto unico", cuisine: "Vegetale",
    image: photo("recipe-d45-tempeh-sweet-potato-v11520"), time: 30,
    ingredients: [{ food: "Tempeh", grams: 120 }, { food: "Patata dolce cotta", grams: 220 }, { food: "Broccoli bolliti", grams: 200 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Proteina", food: "Tempeh", grams: 120, label: "Tempeh alla piastra · 120 g", image: photo("part-tempeh-v11520") },
      { category: "Carboidrato", food: "Patata dolce cotta", grams: 220, label: "Patata dolce cotta · 220 g", image: photo("part-sweet-potato-v8") },
      { category: "Contorno", food: "Broccoli bolliti", grams: 200, label: "Broccoli · 200 g", image: photo("part-broccoli-v1154") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Taglia la patata dolce a cubetti e arrostiscila a 200 °C per 22-25 minuti.", "Dividi i broccoli in cimette e lessali o cuocili al vapore 6-8 minuti.", "Tampona il tempeh, taglialo e doralo su piastra 3-4 minuti per lato; servi con l'olio totale pesato."],
    alternatives: ["Fonte tempeh: SmartFood IEO", "Piatto vegetale", "Componenti modificabili separatamente"],
  },
  {
    id: "matrix-d46-turbot-quinoa-zucchini",
    name: "Rombo al forno con quinoa, zucchine e pomodorini",
    kicker: "Piatto di pesce completo · matrice D46", course: "Piatto unico", cuisine: "Gourmet",
    image: photo("recipe-d46-turbot-quinoa-v11520"), time: 30,
    ingredients: [{ food: "Rombo · peso a crudo", grams: 160 }, { food: "Quinoa cotta", grams: 185 }, { food: "Zucchine", grams: 160 }, { food: "Pomodorini", grams: 100 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Proteina", food: "Rombo · peso a crudo", grams: 160, label: "Rombo al forno · 160 g a crudo", image: photo("part-turbot-v11520") },
      { category: "Carboidrato", food: "Quinoa cotta", grams: 185, label: "Quinoa cotta · 185 g", image: photo("part-quinoa-v8") },
      { category: "Contorno", food: "Zucchine", grams: 160, label: "Zucchine grigliate · 160 g", image: photo("part-zucchini-v7") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodorini arrostiti · 100 g", image: photo("part-tomatoes-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Sciacqua la quinoa e cuocila secondo confezione; pesa 185 g dopo la cottura.", "Inforna il rombo a 190 °C per 12-15 minuti, finché la polpa è opaca e si separa facilmente.", "Griglia le zucchine, arrostisci i pomodorini e completa il piatto con limone, erbe e 10 g di olio pesato."],
    alternatives: ["Fonte rombo: CREA", "Piatto da casa", "Componenti modificabili separatamente"],
  },
  {
    id: "matrix-d47-ricotta-pumpkin-radicchio",
    name: "Ricotta con zucca arrostita, radicchio e pane ai cereali",
    kicker: "Piatto vegetariano composto · matrice D47", course: "Piatto unico", cuisine: "Gourmet",
    image: photo("recipe-d47-ricotta-pumpkin-v11520"), time: 28,
    ingredients: [{ food: "Ricotta vaccina", grams: 120 }, { food: "Zucca", grams: 220 }, { food: "Radicchio cotto", grams: 140 }, { food: "Pane ai cereali", grams: 60 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Latticino", food: "Ricotta vaccina", grams: 120, label: "Ricotta vaccina · 120 g", image: photo("part-ricotta-v7") },
      { category: "Contorno", food: "Zucca", grams: 220, label: "Zucca arrostita · 220 g", image: photo("part-pumpkin-v8") },
      { category: "Contorno", food: "Radicchio cotto", grams: 140, label: "Radicchio grigliato · 140 g", image: photo("part-radicchio-v11515") },
      { category: "Carboidrato", food: "Pane ai cereali", grams: 60, label: "Pane ai cereali · 60 g", image: photo("part-bread-cereals-v11511") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Taglia la zucca a cubetti e arrostiscila a 200 °C per 22-25 minuti.", "Taglia il radicchio in spicchi e griglialo 3-4 minuti per lato.", "Servi ricotta, verdure e pane ben distinti; completa con pepe, timo e l'olio pesato."],
    alternatives: ["Contiene latte e glutine", "Piatto da casa", "Componenti modificabili separatamente"],
  },
  {
    id: "matrix-d48-cuttlefish-chard-basmati",
    name: "Seppia alla piastra con bietole, basmati e pomodoro",
    kicker: "Piatto di mare completo · matrice D48", course: "Piatto unico", cuisine: "Gourmet",
    image: photo("recipe-d48-cuttlefish-chard-v11520"), time: 30,
    ingredients: [{ food: "Seppia · peso a crudo", grams: 160 }, { food: "Bietole cotte", grams: 180 }, { food: "Riso basmati cotto", grams: 170 }, { food: "Passata di pomodoro", grams: 100 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Proteina", food: "Seppia · peso a crudo", grams: 160, label: "Seppia alla piastra · 160 g a crudo", image: photo("part-cuttlefish-v11520") },
      { category: "Contorno", food: "Bietole cotte", grams: 180, label: "Bietole cotte · 180 g", image: photo("part-chard-v11515") },
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 170, label: "Riso basmati cotto · 170 g", image: photo("part-rice-basmati-v7") },
      { category: "Contorno", food: "Passata di pomodoro", grams: 100, label: "Salsa di pomodoro · 100 g", image: photo("part-tomatoes-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci il basmati secondo confezione e pesane 170 g cotto.", "Scalda la passata 8-10 minuti e cuoci le bietole finché sono tenere.", "Tampona la seppia e cuocila su piastra molto calda pochi minuti per lato; servi con l'olio pesato."],
    alternatives: ["Fonte seppia: CREA", "Contiene molluschi", "Componenti modificabili separatamente"],
  },
  {
    id: "asian-oyakodon-authentic",
    name: "Oyakodon giapponese · pollo e uovo su riso",
    kicker: "Ricetta giapponese verificata · MAFF", course: "Piatto unico", cuisine: "Asiatico",
    image: photo("recipe-asian-oyakodon-v11520"), time: 25,
    ingredients: [{ food: "Riso basmati cotto", grams: 150 }, { food: "Petto di pollo · peso a crudo", grams: 80 }, { food: "Uovo", grams: 100 }, { food: "Cipolle crude", grams: 40 }, { food: "Funghi", grams: 20 }, { food: "Salsa di soia", grams: 10 }, { food: "Mirin", grams: 10 }, { food: "Zucchero", grams: 5 }],
    parts: [
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 150, label: "Riso cotto · 150 g", image: photo("part-rice-basmati-v7") },
      { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 80, label: "Pollo · 80 g a crudo", image: photo("part-chicken-grilled-v7") },
      { category: "Proteina", food: "Uovo", grams: 100, label: "Uova · 2", image: photo("part-eggs-scrambled-v1156") },
      { category: "Contorno", food: "Cipolle crude", grams: 40, label: "Cipolla · 40 g", image: photo("part-onions-v11519") },
      { category: "Contorno", food: "Funghi", grams: 20, label: "Shiitake o funghi · 20 g", image: photo("part-mushrooms-v8") },
    ],
    steps: ["Prepara il riso e tienilo caldo nella ciotola.", "Porta a leggero bollore poca acqua con soia, mirin e zucchero; aggiungi cipolla, funghi e pollo e cuoci completamente.", "Versa le uova appena sbattute in due riprese, copri brevemente e trasferisci il composto morbido sul riso."],
    alternatives: ["Fonte ricetta: Ministero giapponese dell'Agricoltura (MAFF)", "Contiene uova e soia", "Il piatto può essere diviso in componenti"],
  },
  {
    id: "asian-bibimbap-authentic",
    name: "Bibimbap coreano con manzo, verdure e uovo",
    kicker: "Ricetta coreana verificata · VisitKorea", course: "Piatto unico", cuisine: "Asiatico",
    image: photo("recipe-asian-bibimbap-v11520"), time: 35,
    ingredients: [{ food: "Riso basmati cotto", grams: 150 }, { food: "Bistecca di manzo · peso a crudo", grams: 70 }, { food: "Uovo", grams: 50 }, { food: "Spinaci", grams: 70 }, { food: "Carote crude", grams: 60 }, { food: "Germogli di soia", grams: 70 }, { food: "Funghi", grams: 60 }, { food: "Gochujang", grams: 15 }, { food: "Olio extravergine", grams: 5 }],
    parts: [
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 150, label: "Riso cotto · 150 g", image: photo("part-rice-basmati-v7") },
      { category: "Proteina", food: "Bistecca di manzo · peso a crudo", grams: 70, label: "Manzo a striscioline · 70 g a crudo", image: photo("part-steak-beef-v114") },
      { category: "Proteina", food: "Uovo", grams: 50, label: "Uovo al tegamino · 1", image: photo("simple-eggs-v5") },
      { category: "Contorno", food: "Spinaci", grams: 70, label: "Spinaci · 70 g", image: photo("part-spinach-v7") },
      { category: "Contorno", food: "Carote crude", grams: 60, label: "Carote · 60 g", image: photo("part-carrots-raw-v11512") },
      { category: "Contorno", food: "Germogli di soia", grams: 70, label: "Germogli di soia · 70 g", image: photo("part-sprouts-v11520") },
      { category: "Contorno", food: "Funghi", grams: 60, label: "Funghi · 60 g", image: photo("part-mushrooms-v8") },
    ],
    steps: ["Cuoci il riso e sistemalo sul fondo della ciotola.", "Sbollenta i germogli e salta separatamente spinaci, carote e funghi. Cuoci completamente il manzo a striscioline.", "Disponi gli ingredienti a settori sul riso, aggiungi l'uovo cotto e servi con il gochujang dosato."],
    alternatives: ["Fonte ricetta: Korea Tourism Organization", "Contiene uova e soia", "Il piatto può essere diviso in componenti"],
  },
  {
    id: "italian-minestrone-complete",
    name: "Minestrone italiano con cannellini e pane integrale",
    kicker: "Ricetta completa da zero · verdure e legumi pesati",
    course: "Piatto unico", cuisine: "Italiano",
    image: photo("recipe-minestrone-v11522"), time: 45,
    ingredients: [
      { food: "Patate lesse", grams: 50 }, { food: "Carote crude", grams: 30 },
      { food: "Zucchine", grams: 50 }, { food: "Sedano crudo", grams: 15 },
      { food: "Bietole cotte", grams: 30 }, { food: "Fagioli cannellini cotti", grams: 40 },
      { food: "Piselli cotti", grams: 30 }, { food: "Zucca", grams: 40 },
      { food: "Fagiolini", grams: 30 }, { food: "Cipolle crude", grams: 15 },
      { food: "Passata di pomodoro", grams: 50 }, { food: "Pane integrale", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Contorno", food: "Minestrone cotto", grams: 350, label: "Minestrone cotto · 350 g", image: photo("recipe-minestrone-v11522") },
      { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: [
      "Lava e pesa tutte le verdure. Taglia patata, carota, zucchina, sedano, zucca, fagiolini e cipolla in pezzi piccoli e regolari.",
      "Metti cipolla, sedano, carota, patata e zucca in pentola con acqua sufficiente a coprire. Porta a bollore e cuoci dolcemente 15 minuti.",
      "Aggiungi zucchina, fagiolini, bietole, piselli, passata e cannellini già cotti e risciacquati. Prosegui 15-20 minuti, finché le verdure sono tenere.",
      "Pesa 350 g di minestrone nel piatto, completa con 10 g di olio a crudo e servi il pane separato.",
    ],
    alternatives: ["Fonte composizione minestrone: CREA", "Il pane resta sostituibile", "Cannellini e verdure sono visibili nella ricetta completa"],
  },
];const mealPartOptions: Record<MealPart["category"], MealPart[]> = {
  Carboidrato: [
    {
      category: "Carboidrato",
      food: "Muesli",
      grams: 30,
      label: "Muesli · 30 g",
      image: photo("part-muesli-v1152"),
    },
    {
      category: "Carboidrato",
      food: "Fiocchi d'avena",
      grams: 40,
      label: "Fiocchi d'avena · peso a crudo",
      image: photo("part-oats-v113"),
    },
    {
      category: "Carboidrato",
      food: "Fette biscottate integrali",
      grams: 30,
      label: "Fette biscottate",
      image: photo("part-rusks-v7"),
    },
    {
      category: "Carboidrato",
      food: "Biscotti secchi",
      grams: 30,
      label: "Biscotti secchi",
      image: photo("part-biscuits-v7"),
    },
    {
      category: "Carboidrato",
      food: "Cracker integrali",
      grams: 30,
      label: "Cracker integrali",
      image: photo("crackers-35g-v5"),
    },
    {
      category: "Carboidrato",
      food: "Grissini",
      grams: 30,
      label: "Grissini · 1 porzione",
      image: photo("part-grissini-v112"),
    },
    {
      category: "Carboidrato",
      food: "Farina d'avena",
      grams: 40,
      label: "Farina d'avena · peso a crudo",
      image: photo("part-oat-flour-v9"),
    },
    {
      category: "Carboidrato",
      food: "Farina di frumento integrale",
      grams: 50,
      label: "Farina integrale · peso a crudo",
      image: photo("part-whole-wheat-flour-v9"),
    },
    {
      category: "Carboidrato",
      food: "Farina di grano saraceno",
      grams: 40,
      label: "Farina di grano saraceno · peso a crudo",
      image: photo("part-buckwheat-flour-v9"),
    },
    {
      category: "Carboidrato",
      food: "Pasta integrale secca",
      grams: 80,
      label: "Pasta integrale secca",
      image: photo("simple-pasta-white-v5"),
    },
    {
      category: "Carboidrato",
      food: "Pasta di semola secca",
      grams: 80,
      label: "Pasta secca",
      image: photo("simple-pasta-white-v5"),
    },
    {
      category: "Carboidrato",
      food: "Riso basmati secco",
      grams: 80,
      label: "Riso basmati · peso a crudo",
      image: photo("part-rice-basmati-v7"),
    },
    {
      category: "Carboidrato",
      food: "Riso Venere secco",
      grams: 80,
      label: "Riso Venere · peso a crudo",
      image: photo("part-rice-venere-v7"),
    },
    {
      category: "Carboidrato",
      food: "Gnocchi di patate",
      grams: 150,
      label: "Gnocchi",
      image: photo("part-gnocchi-v7"),
    },
    {
      category: "Carboidrato",
      food: "Patate lesse",
      grams: 200,
      label: "Patate lesse",
      image: photo("part-potatoes-boiled-v7"),
    },
    {
      category: "Carboidrato",
      food: "Pane integrale",
      grams: 100,
      label: "Pane",
      image: photo("part-bread-v7"),
    },
    {
      category: "Carboidrato",
      food: "Pane bianco tipo 0",
      grams: 50,
      label: "Pane bianco tipo 0 · 50 g",
      image: photo("part-bread-white-v1156"),
    },
    {
      category: "Carboidrato",
      food: "Pane semintegrale tipo 1",
      grams: 50,
      label: "Pane semintegrale tipo 1 · 50 g",
      image: photo("part-bread-semiwhole-v1156"),
    },
    {
      category: "Carboidrato",
      food: "Pane di segale",
      grams: 50,
      label: "Pane di segale · 50 g",
      image: photo("part-bread-rye-v1156"),
    },
    {
      category: "Carboidrato",
      food: "Pane di farro",
      grams: 50,
      label: "Pane di farro · 50 g",
      image: photo("part-bread-spelt-v11511"),
    },
    {
      category: "Carboidrato",
      food: "Pane ai cereali",
      grams: 50,
      label: "Pane ai cereali · 50 g",
      image: photo("part-bread-cereals-v11511"),
    },
    { category: "Carboidrato", food: "Gallette di riso integrale", grams: 27, label: "Gallette integrali · 3 circa", image: photo("part-rice-cakes-whole-v11512") },
    { category: "Carboidrato", food: "Quinoa cotta", grams: 185, label: "Quinoa cotta · da circa 70 g secca", image: photo("part-quinoa-v8") },
    { category: "Carboidrato", food: "Riso integrale secco", grams: 60, label: "Riso integrale · 60 g a crudo", image: photo("part-brown-rice-v11519") },
    { category: "Carboidrato", food: "Riso rosso integrale cotto", grams: 180, label: "Riso rosso integrale cotto", image: photo("part-red-rice-v11514") },
    { category: "Carboidrato", food: "Pasta di lenticchie secca", grams: 70, label: "Pasta di lenticchie · peso a crudo", image: photo("part-lentil-pasta-v11515") },
    { category: "Carboidrato", food: "Miglio cotto", grams: 190, label: "Miglio cotto", image: photo("part-millet-v11515") },
    { category: "Carboidrato", food: "Polenta cotta", grams: 300, label: "Polenta cotta", image: photo("part-polenta-v11515") },
    { category: "Carboidrato", food: "Bulgur cotto", grams: 130, label: "Bulgur cotto", image: photo("part-bulgur-v11515") },
  ],
  Proteina: [
    { category: "Proteina", food: "Tempeh", grams: 120, label: "Tempeh alla piastra · 120 g", image: photo("part-tempeh-v11520") },
    { category: "Proteina", food: "Rombo · peso a crudo", grams: 160, label: "Rombo al forno · 160 g a crudo", image: photo("part-turbot-v11520") },
    { category: "Proteina", food: "Seppia · peso a crudo", grams: 160, label: "Seppia alla piastra · 160 g a crudo", image: photo("part-cuttlefish-v11520") },
    { category: "Proteina", food: "Sogliola · peso a crudo", grams: 150, label: "Sogliola al forno · 150 g a crudo", image: photo("part-sole-baked-v11519") },
    { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 100, label: "Petto di pollo · 100 g a crudo", image: photo("part-chicken-grilled-v7") },
    { category: "Proteina", food: "Cicerchie cotte", grams: 150, label: "Cicerchie cotte · 150 g", image: photo("part-grass-peas-v11519") },
    {
      category: "Proteina",
      food: "Bistecca di manzo · peso a crudo",
      grams: 120,
      label: "Bistecca di manzo · peso a crudo",
      image: photo("part-steak-beef-v114"),
    },
    {
      category: "Proteina",
      food: "Bistecca di vitello · peso a crudo",
      grams: 120,
      label: "Bistecca di vitello · peso a crudo",
      image: photo("part-steak-veal-v114"),
    },
    {
      category: "Proteina",
      food: "Lonza di maiale · peso a crudo",
      grams: 120,
      label: "Lonza di maiale · peso a crudo",
      image: photo("part-steak-pork-loin-v114"),
    },
    {
      category: "Proteina",
      food: "Bistecca di cavallo magra · peso a crudo",
      grams: 120,
      label: "Bistecca di cavallo · peso a crudo",
      image: photo("part-steak-horse-v114"),
    },
    {
      category: "Proteina",
      food: "Petto di pollo cotto",
      grams: 100,
      label: "Pollo",
      image: photo("part-chicken-grilled-v7"),
    },
    {
      category: "Proteina",
      food: "Petto di pollo arrosto",
      grams: 100,
      label: "Petto di pollo arrosto",
      image: photo("part-chicken-breast-roasted-v8"),
    },
    {
      category: "Proteina",
      food: "Coscia di pollo arrosto",
      grams: 100,
      label: "Coscia di pollo arrosto",
      image: photo("part-chicken-leg-roasted-v8"),
    },
    {
      category: "Proteina",
      food: "Merluzzo cotto",
      grams: 150,
      label: "Merluzzo al vapore",
      image: photo("part-cod-steamed-v8"),
    },
    {
      category: "Proteina",
      food: "Orata cotta",
      grams: 150,
      label: "Orata al forno",
      image: photo("part-sea-bream-baked-v8"),
    },
    {
      category: "Proteina",
      food: "Salmone cotto",
      grams: 150,
      label: "Salmone",
      image: photo("part-salmon-baked-v7"),
    },
    {
      category: "Proteina",
      food: "Uova sode",
      grams: 100,
      label: "Due uova sode",
      image: photo("part-eggs-boiled-v7"),
    },
    {
      category: "Proteina",
      food: "Uova strapazzate o in frittata",
      grams: 100,
      label: "Due uova strapazzate · senza grassi aggiunti",
      image: photo("part-eggs-scrambled-v1156"),
    },
    {
      category: "Proteina",
      food: "Fesa di tacchino",
      grams: 100,
      label: "Fesa di tacchino",
      image: photo("part-turkey-slices-v114"),
    },
    {
      category: "Proteina",
      food: "Bresaola",
      grams: 50,
      label: "Bresaola",
      image: photo("part-bresaola-v7"),
    },
    {
      category: "Proteina",
      food: "Tonno al naturale sgocciolato",
      grams: 100,
      label: "Tonno al naturale",
      image: photo("part-tuna-v7"),
    },
    {
      category: "Proteina",
      food: "Prosciutto cotto",
      grams: 50,
      label: "Prosciutto cotto",
      image: photo("part-prosciutto-cotto-v114"),
    },
    {
      category: "Proteina",
      food: "Feta",
      grams: 50,
      label: "Feta · 50 g",
      image: photo("part-feta-v111"),
    },
    {
      category: "Proteina",
      food: "Ceci cotti",
      grams: 150,
      label: "Ceci cotti",
      image: photo("part-chickpeas-v8"),
    },
    {
      category: "Proteina",
      food: "Piselli cotti",
      grams: 150,
      label: "Piselli cotti",
      image: photo("part-peas-v8"),
    },
    {
      category: "Proteina",
      food: "Lenticchie cotte",
      grams: 150,
      label: "Lenticchie cotte",
      image: photo("part-lentils-v1141"),
    },
    {
      category: "Proteina",
      food: "Fagioli cannellini cotti",
      grams: 150,
      label: "Cannellini cotti",
      image: photo("part-cannellini-v1141"),
    },
    {
      category: "Proteina",
      food: "Burger vegetale di soia",
      grams: 150,
      label: "Burger vegetali di soia · 2 piccoli",
      image: photo("part-plant-burger-v1154"),
    },
    { category: "Proteina", food: "Hummus di ceci", grams: 40, label: "Hummus di ceci", image: photo("part-hummus-v11512") },
    { category: "Proteina", food: "Hummus di barbabietola", grams: 40, label: "Hummus di barbabietola", image: photo("part-beet-hummus-v11513") },
    { category: "Proteina", food: "Gamberi cotti", grams: 150, label: "Gamberi cotti", image: photo("part-shrimp-v11514") },
    { category: "Proteina", food: "Petto di tacchino cotto alla piastra", grams: 100, label: "Petto di tacchino alla piastra", image: photo("part-turkey-grilled-v11514") },
    { category: "Proteina", food: "Coniglio cotto in umido", grams: 100, label: "Coniglio cotto in umido", image: photo("part-rabbit-v11515") },
    { category: "Proteina", food: "Tofu alla piastra", grams: 100, label: "Tofu alla piastra", image: photo("part-tofu-v11515") },
  ],
  Contorno: [
    { category: "Contorno", food: "Peperoni crudi", grams: 200, label: "Peperoni crudi · 200 g", image: photo("part-peppers-raw-v11522") },
    { category: "Contorno", food: "Peperoni cotti senza olio", grams: 200, label: "Peperoni cotti senza olio · 200 g", image: photo("part-peppers-cooked-v11522") },
    { category: "Contorno", food: "Minestrone cotto", grams: 350, label: "Minestrone cotto · 350 g", image: photo("recipe-minestrone-v11522") },
    { category: "Contorno", food: "Cipolle crude", grams: 100, label: "Cipolle · 100 g a crudo", image: photo("part-onions-v11519") },
    { category: "Contorno", food: "Carciofi cotti bolliti", grams: 200, label: "Carciofi cotti bolliti · 200 g", image: photo("part-artichokes-v11519") },
    {
      category: "Contorno",
      food: "Zucchine",
      grams: 200,
      label: "Zucchine",
      image: photo("part-zucchini-v7"),
    },
    {
      category: "Contorno",
      food: "Spinaci",
      grams: 200,
      label: "Spinaci",
      image: photo("part-spinach-v7"),
    },
    {
      category: "Contorno",
      food: "Fagiolini",
      grams: 200,
      label: "Fagiolini",
      image: photo("part-green-beans-v7"),
    },
    {
      category: "Contorno",
      food: "Pomodorini",
      grams: 200,
      label: "Pomodori",
      image: photo("part-tomatoes-v8"),
    },
    {
      category: "Contorno",
      food: "Rucola",
      grams: 80,
      label: "Insalata di rucola",
      image: photo("part-rucola-v7"),
    },
    {
      category: "Contorno",
      food: "Carote crude",
      grams: 200,
      label: "Carote crude",
      image: photo("part-carrots-raw-v11512"),
    },
    {
      category: "Contorno",
      food: "Carote cotte bollite",
      grams: 200,
      label: "Carote cotte bollite",
      image: photo("part-carrots-cooked-v11512"),
    },
    {
      category: "Contorno",
      food: "Ravanelli crudi",
      grams: 100,
      label: "Ravanelli crudi",
      image: photo("part-radishes-v11512"),
    },
    {
      category: "Contorno",
      food: "Barbabietole cotte",
      grams: 150,
      label: "Barbabietole cotte",
      image: photo("part-beetroot-v11513"),
    },    { category: "Contorno", food: "Cavolo nero cotto", grams: 150, label: "Cavolo nero cotto", image: photo("part-kale-v11515") },
    { category: "Contorno", food: "Bietole cotte", grams: 200, label: "Bietole cotte", image: photo("part-chard-v11515") },
    { category: "Contorno", food: "Radicchio cotto", grams: 200, label: "Radicchio cotto", image: photo("part-radicchio-v11515") },
    { category: "Contorno", food: "Cavolo rosso crudo", grams: 150, label: "Cavolo rosso crudo", image: photo("part-red-cabbage-v11515") },
    {
      category: "Contorno",
      food: "Funghi",
      grams: 200,
      label: "Funghi",
      image: photo("part-mushrooms-v8"),
    },
    {
      category: "Contorno",
      food: "Olive",
      grams: 30,
      label: "Olive · contorno piccolo",
      image: photo("part-olives-v111"),
    },
    {
      category: "Contorno",
      food: "Insalata verde",
      grams: 150,
      label: "Insalata verde",
      image: photo("part-lettuce-v8"),
    },
    {
      category: "Contorno",
      food: "Cetriolo",
      grams: 200,
      label: "Cetrioli",
      image: photo("part-cucumber-v8"),
    },
    {
      category: "Contorno",
      food: "Melanzane",
      grams: 200,
      label: "Melanzane grigliate",
      image: photo("part-eggplant-v8"),
    },
    {
      category: "Contorno",
      food: "Cavolfiore",
      grams: 200,
      label: "Cavolfiore al vapore",
      image: photo("part-cauliflower-v8"),
    },
    {
      category: "Contorno",
      food: "Zucca",
      grams: 200,
      label: "Zucca cotta",
      image: photo("part-pumpkin-v8"),
    },
    {
      category: "Contorno",
      food: "Finocchi crudi",
      grams: 200,
      label: "Finocchi crudi",
      image: photo("part-fennel-v113"),
    },
    {
      category: "Contorno",
      food: "Asparagi crudi",
      grams: 200,
      label: "Asparagi · peso a crudo",
      image: photo("part-asparagus-v113"),
    },
    {
      category: "Contorno",
      food: "Sedano crudo",
      grams: 200,
      label: "Sedano crudo · parte edibile",
      image: photo("part-celery-v1154"),
    },
    {
      category: "Contorno",
      food: "Broccoli bolliti",
      grams: 200,
      label: "Broccoli bolliti",
      image: photo("part-broccoli-v1154"),
    },
  ],
  Latticino: [
    { category: "Latticino", food: "Mozzarella vaccina", grams: 100, label: "Mozzarella vaccina · 100 g", image: photo("part-mozzarella-v11522") },
    { category: "Latticino", food: "Mozzarella light", grams: 100, label: "Mozzarella light · 100 g", image: photo("part-mozzarella-light-v11522") },
    { category: "Latticino", food: "Yogurt greco 0%", grams: 150, label: "Yogurt greco 0% · 150 g", image: photo("part-greek-yogurt-zero-v11522") },
    {
      category: "Latticino",
      food: "Skyr bianco",
      grams: 150,
      label: "Skyr bianco · 1 vasetto",
      image: photo("part-skyr-v11511"),
    },
    {
      category: "Latticino",
      food: "Kefir bianco magro",
      grams: 170,
      label: "Kefir bianco magro",
      image: photo("part-kefir-v1152"),
    },
    {
      category: "Latticino",
      food: "Latte parzialmente scremato",
      grams: 200,
      label: "Latte",
      image: photo("part-milk-v7"),
    },
    {
      category: "Latticino",
      food: "Yogurt greco 2%",
      grams: 125,
      label: "Yogurt · 1 vasetto",
      image: photo("part-yogurt-v7"),
    },
    {
      category: "Latticino",
      food: "Yogurt proteico alla vaniglia",
      grams: 160,
      label: "Yogurt proteico · 1 vasetto",
      image: photo("part-protein-yogurt-v1154"),
    },
    {
      category: "Latticino",
      food: "Budino proteico al cioccolato",
      grams: 200,
      label: "Budino proteico · 1 vasetto",
      image: photo("part-protein-pudding-v1154"),
    },
    {
      category: "Latticino",
      food: "Ricotta vaccina",
      grams: 50,
      label: "Ricotta",
      image: photo("part-ricotta-v7"),
    },
    {
      category: "Latticino",
      food: "Crescenza",
      grams: 80,
      label: "Crescenza · 80 g",
      image: photo("part-crescenza-v11518"),
    },
    {
      category: "Latticino",
      food: "Primo sale",
      grams: 100,
      label: "Primo sale · 100 g",
      image: photo("part-primo-sale-v11518"),
    },
    {
      category: "Latticino",
      food: "Scamorza",
      grams: 80,
      label: "Scamorza bianca · 80 g",
      image: photo("part-scamorza-v11518"),
    },
    {
      category: "Latticino",
      food: "Provolone Dolce Auricchio",
      grams: 50,
      label: "Provolone Dolce Auricchio · 50 g",
      image: photo("part-provolone-auricchio-v11518"),
    },
    {
      category: "Latticino",
      food: "Bevanda di soia senza zucchero",
      grams: 200,
      label: "Bevanda di soia",
      image: photo("part-milk-v7"),
    },
    {
      category: "Latticino",
      food: "Bevanda d'avena senza zucchero",
      grams: 200,
      label: "Bevanda d'avena",
      image: photo("part-milk-v7"),
    },
    { category: "Latticino", food: "Fiocchi di latte", grams: 80, label: "Fiocchi di latte", image: photo("part-cottage-cheese-v11512") },
  ],
  Frutta: [
    {
      category: "Frutta",
      food: "Mela",
      grams: 150,
      label: "Mela",
      image: photo("part-apple-v7"),
    },
    {
      category: "Frutta",
      food: "Banana",
      grams: 150,
      label: "Banana",
      image: photo("part-banana-v7"),
    },
    {
      category: "Frutta",
      food: "Pera",
      grams: 150,
      label: "Pera",
      image: photo("part-pear-v7"),
    },
    {
      category: "Frutta",
      food: "Kiwi",
      grams: 150,
      label: "Kiwi",
      image: photo("part-kiwi-v7"),
    },
    {
      category: "Frutta",
      food: "Uva",
      grams: 150,
      label: "Uva",
      image: photo("part-grapes-v7"),
    },
    {
      category: "Frutta",
      food: "Arancia",
      grams: 150,
      label: "Arancia",
      image: photo("part-orange-v7"),
    },
    {
      category: "Frutta",
      food: "Frutti di bosco",
      grams: 150,
      label: "Frutti di bosco",
      image: photo("part-mixed-berries-v11"),
    },
    {
      category: "Frutta",
      food: "Fragole",
      grams: 150,
      label: "Fragole",
      image: photo("part-strawberries-v11"),
    },
    {
      category: "Frutta",
      food: "Mango",
      grams: 150,
      label: "Mango",
      image: photo("part-mango-v11"),
    },
    {
      category: "Frutta",
      food: "Papaya",
      grams: 150,
      label: "Papaya",
      image: photo("part-papaya-v11"),
    },
    {
      category: "Frutta",
      food: "Pesca",
      grams: 150,
      label: "Pesca · parte edibile",
      image: photo("part-peach-v113"),
    },
    {
      category: "Frutta",
      food: "Ciliegie fresche",
      grams: 150,
      label: "Ciliegie fresche · parte edibile",
      image: photo("part-cherries-v1152"),
    },
    {
      category: "Frutta",
      food: "Albicocche fresche",
      grams: 150,
      label: "Albicocche fresche · parte edibile",
      image: photo("part-apricots-v1152"),
    },
    {
      category: "Frutta",
      food: "Anguria",
      grams: 200,
      label: "Anguria · polpa edibile",
      image: photo("part-watermelon-v1152"),
    },
    {
      category: "Frutta",
      food: "Melone estivo",
      grams: 150,
      label: "Melone estivo · polpa edibile",
      image: photo("part-melon-v1152"),
    },
    { category: "Frutta", food: "More", grams: 150, label: "More fresche", image: photo("part-blackberries-v11512") },
    { category: "Frutta", food: "Ananas", grams: 150, label: "Ananas fresco", image: photo("part-pineapple-v11513") },
    { category: "Frutta", food: "Mirtilli freschi", grams: 150, label: "Mirtilli freschi", image: photo("part-blueberries-v1160") },
    { category: "Frutta", food: "Mandarini freschi", grams: 150, label: "Mandarini · parte edibile", image: photo("part-mandarins-v1160") },
    { category: "Frutta", food: "Melagrana fresca", grams: 150, label: "Melagrana · parte edibile", image: photo("part-pomegranate-v1160") },
  ],
  Extra: [
    {
      category: "Extra",
      food: "Caffè senza zucchero",
      grams: 30,
      label: "Caffè espresso",
      image: photo("part-coffee-v8"),
    },
    {
      category: "Extra",
      food: "Olio extravergine",
      grams: 10,
      label: "Olio extravergine",
      image: photo("part-olive-oil-v8"),
    },
    {
      category: "Extra",
      food: "Grana Padano DOP",
      grams: 20,
      label: "Grana Padano · 20 g",
      image: photo("part-grana-v111"),
    },
    {
      category: "Extra",
      food: "Confettura di frutta",
      grams: 20,
      label: "Confettura",
      image: photo("part-jam-v7"),
    },
    {
      category: "Extra",
      food: "Miele",
      grams: 10,
      label: "Miele",
      image: photo("part-honey-v7"),
    },
    {
      category: "Extra",
      food: "Burro",
      grams: 10,
      label: "Burro",
      image: photo("part-butter-v7"),
    },
    {
      category: "Extra",
      food: "Noci",
      grams: 20,
      label: "Noci",
      image: photo("walnuts-20g-v5"),
    },
    {
      category: "Extra",
      food: "Mandorle",
      grams: 20,
      label: "Mandorle",
      image: photo("part-almonds-v9"),
    },
    {
      category: "Extra",
      food: "Pistacchi",
      grams: 15,
      label: "Pistacchi non salati",
      image: photo("part-pistachios-v1143"),
    },
    {
      category: "Extra",
      food: "Noci pecan",
      grams: 15,
      label: "Noci pecan non salate",
      image: photo("part-pecans-v1144"),
    },
    {
      category: "Extra",
      food: "Nocciole",
      grams: 15,
      label: "Nocciole · 15 g",
      image: photo("part-hazelnuts-v11511"),
    },
    {
      category: "Extra",
      food: "Crema 100% nocciole",
      grams: 15,
      label: "Crema 100% nocciole · 15 g",
      image: photo("part-hazelnut-paste-v11511"),
    },
    {
      category: "Extra",
      food: "Semi di chia",
      grams: 10,
      label: "Semi di chia · 10 g",
      image: photo("part-chia-v11511"),
    },
    {
      category: "Extra",
      food: "Crema cacao e nocciole",
      grams: 15,
      label: "Crema cacao e nocciole",
      image: photo("part-chocolate-hazelnut-spread-v9"),
    },
    {
      category: "Extra",
      food: "Arachidi",
      grams: 15,
      label: "Arachidi · 1 porzione",
      image: photo("part-peanuts-v113"),
    },
    {
      category: "Extra",
      food: "Crema 100% arachidi",
      grams: 10,
      label: "Crema 100% arachidi",
      image: photo("part-peanut-butter-v113"),
    },
    {
      category: "Extra",
      food: "Semi di lino macinati",
      grams: 5,
      label: "Semi di lino macinati",
      image: photo("part-flaxseed-v113"),
    },
    {
      category: "Extra",
      food: "Semi di sesamo",
      grams: 5,
      label: "Semi di sesamo",
      image: photo("part-sesame-v11512"),
    },
    {
      category: "Extra",
      food: "Anacardi non salati",
      grams: 15,
      label: "Anacardi non salati · 15 g",
      image: photo("part-cashews-v1160"),
    },
  ],
};

const normalizeMealPart = (part: MealPart): MealPart => {
  if (mealPartOptions[part.category]?.some((option) => option.food === part.food))
    return part;
  const canonicalCategory = (
    Object.keys(mealPartOptions) as MealPart["category"][]
  ).find((category) =>
    mealPartOptions[category].some((option) => option.food === part.food),
  );
  return canonicalCategory && canonicalCategory !== part.category
    ? { ...part, category: canonicalCategory }
    : part;
};

const seasonalMonths: Record<string, number[]> = {
  "Mirtilli freschi": [6, 7, 8, 9],
  "Mandarini freschi": [11, 12, 1, 2, 3],
  "Melagrana fresca": [9, 10, 11, 12],
  More: [6, 7, 8, 9],
  "Ravanelli crudi": [3, 4, 5, 6, 7, 8, 9, 10],
  "Ciliegie fresche": [5, 6],
  "Albicocche fresche": [6, 7],
  Anguria: [6, 7, 8],
  "Melone estivo": [6, 7, 8],
  Fragole: [4, 5, 6],
  Pesca: [6, 7, 8],
  Uva: [8, 9, 10],
  Arancia: [11, 12, 1, 2, 3],
  Kiwi: [11, 12, 1, 2, 3, 4],
  Mela: [9, 10, 11, 12, 1, 2, 3],
  Pera: [8, 9, 10, 11, 12, 1, 2],
  "Asparagi crudi": [3, 4, 5, 6],
  "Broccoli bolliti": [10, 11, 12, 1, 2, 3],
  Cavolfiore: [10, 11, 12, 1, 2, 3],
  "Finocchi crudi": [10, 11, 12, 1, 2, 3, 4, 5],
  "Sedano crudo": [9, 10, 11, 12, 1, 2, 3, 4, 5],
  Zucca: [9, 10, 11, 12, 1, 2],
  Zucchine: [5, 6, 7, 8, 9],
  Pomodorini: [5, 6, 7, 8, 9],
  Fagiolini: [5, 6, 7, 8, 9],
};
const seasonalFirst = (options: MealPart[]) => {
  const month = new Date().getMonth() + 1;
  return [...options].sort(
    (a, b) =>
      Number(seasonalMonths[b.food]?.includes(month) || false) -
      Number(seasonalMonths[a.food]?.includes(month) || false),
  );
};

const recommendedPartOptions = (part: MealPart, key: string) => {
  const slot = Number(key.split("-")[1]);
  const options = ["Frutta", "Contorno"].includes(part.category)
    ? seasonalFirst(mealPartOptions[part.category])
    : mealPartOptions[part.category];
  if (part.category === "Carboidrato" && part.food.startsWith("Pane"))
    return options.filter((option) => option.food.startsWith("Pane"));
  if (part.category === "Proteina" && part.food.startsWith("Uova"))
    return options.filter((option) => option.food.startsWith("Uova"));
  if (slot === 0) {
    if (part.category === "Latticino") {
      const breakfastDairyOrder = [
        "Latte parzialmente scremato",
        "Bevanda di soia senza zucchero",
        "Bevanda d'avena senza zucchero",
        "Yogurt proteico alla vaniglia",
        "Skyr bianco",
        "Yogurt greco 2%",
        "Kefir bianco magro",
      "Fiocchi di latte",
        "Ricotta vaccina",
      ];
      return breakfastDairyOrder
        .map((food) => options.find((option) => option.food === food))
        .filter((option): option is MealPart => Boolean(option));
    }
    if (part.category === "Carboidrato")
      return options.filter((x) =>
        [
          "Fette biscottate integrali",
          "Biscotti secchi",
          "Cracker integrali",
          "Pane integrale",
          "Pane bianco tipo 0",
          "Pane semintegrale tipo 1",
          "Pane di segale",
          "Pane di farro",
          "Pane ai cereali",
        ].includes(x.food),
      );
    if (part.category === "Extra")
      return options.filter((x) =>
        [
          "Confettura di frutta",
          "Miele",
          "Noci",
          "Mandorle",
          "Pistacchi",
          "Noci pecan",
          "Nocciole",
          "Arachidi",
          "Crema 100% arachidi",
          "Crema 100% nocciole",
          "Semi di chia",
          "Crema cacao e nocciole",
        ].includes(x.food),
      );
    return options;
  }
  if (slot === 1 || slot === 3) {
    if (part.category === "Latticino")
      return options.filter((x) =>
        [
          "Yogurt proteico alla vaniglia",
          "Budino proteico al cioccolato",
          "Skyr bianco",
          "Yogurt greco 2%",
          "Kefir bianco magro",
      "Fiocchi di latte",
          "Ricotta vaccina",
        ].includes(x.food),
      );
    if (part.category === "Carboidrato")
      return options.filter((x) =>
        [
          "Fette biscottate integrali",
          "Biscotti secchi",
          "Cracker integrali",
        ].includes(x.food),
      );
    if (part.category === "Proteina") return [];
  }
  if ((slot === 2 || slot === 4) && part.category === "Carboidrato")
    return options.filter(
      (x) =>
        ![
          "Fette biscottate integrali",
          "Biscotti secchi",
          "Fiocchi d'avena",
          "Farina d'avena",
          "Farina di frumento integrale",
          "Farina di grano saraceno",
        ].includes(x.food),
    );
  if ((slot === 2 || slot === 4) && part.category === "Extra")
    return options.filter((x) =>
      ["Olio extravergine", "Grana Padano DOP"].includes(x.food),
    );
  return options;
};

const orderedFreePartOptions = (role: MealPart["category"], key: string) => {
  const slot = Number(key.split("-")[1]);
  const categoryOrder: MealPart["category"][] =
    slot === 0
      ? ["Latticino", "Frutta", "Carboidrato", "Extra", "Proteina", "Contorno"]
      : slot === 1 || slot === 3
        ? ["Frutta", "Latticino", "Carboidrato", "Extra", "Proteina", "Contorno"]
        : ["Carboidrato", "Proteina", "Contorno", "Extra", "Latticino", "Frutta"];
  return categoryOrder
    .filter((category) => category !== role)
    .flatMap((category) => mealPartOptions[category])
    .filter(
      (option) =>
        !([0, 1, 3].includes(slot) && option.food === "Grissini") &&
        ![
          "Farina d'avena",
          "Farina di frumento integrale",
          "Farina di grano saraceno",
          "Fiocchi d'avena",
          "Burro",
          "Olio extravergine",
          "Semi di lino macinati",
          "Caffè senza zucchero",
        ].includes(option.food),
    )
    .filter(
      (option, index, all) =>
        all.findIndex((candidate) => candidate.food === option.food) === index,
    );
};

const equivalentPart = (option: MealPart, current: MealPart, role: MealPart["category"]) => {
  if (option.category !== role || current.grams <= 0) return option;
  const targetKcal = calc([current]).kcal;
  const kcalPerGram = foods[option.food]?.kcal / 100;
  if (!kcalPerGram || targetKcal <= 0) return option;
  const practicalRange = (() => {
    if (option.food.includes("Pasta") || option.food.includes("Riso"))
      return { min: 60, max: 100, step: 10 };
    if (option.food === "Gnocchi di patate")
      return { min: 120, max: 200, step: 10 };
    if (option.food === "Patate lesse")
      return { min: 150, max: 300, step: 25 };
    if (option.food.startsWith("Pane"))
      return { min: 50, max: 120, step: 10 };
    if (role === "Carboidrato")
      return { min: Math.min(option.grams, 30), max: Math.max(option.grams, 100), step: 10 };
    if (
      role === "Proteina" &&
      ["manzo", "vitello", "maiale", "lonza", "cavallo"].some((term) =>
        option.food.toLowerCase().includes(term),
      )
    )
      return { min: 100, max: 150, step: 10 };
    if (role === "Proteina") return { min: 80, max: 200, step: 10 };
    if (role === "Contorno") return { min: 100, max: 400, step: 25 };
    if (role === "Frutta") return { min: 100, max: 300, step: 25 };
    if (role === "Latticino") return { min: 50, max: 250, step: 10 };
    return { min: 5, max: 30, step: 5 };
  })();
  const grams = Math.max(
    practicalRange.min,
    Math.min(
      practicalRange.max,
      Math.round(targetKcal / kcalPerGram / practicalRange.step) * practicalRange.step,
    ),
  );
  return { ...option, grams };
};

const rotationBreakfastCarbs = mealPartOptions.Carboidrato.filter((part) =>
  [
    "Fette biscottate integrali",
    "Biscotti secchi",
    "Cracker integrali",
    "Pane integrale",
    "Pane bianco tipo 0",
    "Pane semintegrale tipo 1",
    "Pane di segale",
    "Pane di farro",
    "Pane ai cereali",
  ].includes(part.food),
);
const rotationBreakfastExtras = mealPartOptions.Extra.filter(
  (part) =>
    [
      "Confettura di frutta",
      "Miele",
      "Burro",
      "Noci",
      "Mandorle",
      "Nocciole",
      "Crema cacao e nocciole",
      "Crema 100% nocciole",
      "Semi di chia",
    ].includes(part.food),
);
const portableSnackDairy = mealPartOptions.Latticino.filter(
  (part) =>
    [
      "Yogurt proteico alla vaniglia",
      "Budino proteico al cioccolato",
      "Skyr bianco",
      "Yogurt greco 2%",
      "Kefir bianco magro",
      "Fiocchi di latte",
    ].includes(part.food),
);
const catalogBreakfasts: Recipe[] = Array.from({ length: 36 }, (_, index) => {
  const parts = [
    rotationBreakfastCarbs[index % rotationBreakfastCarbs.length],
    mealPartOptions.Latticino[index % mealPartOptions.Latticino.length],
    mealPartOptions.Frutta[index % mealPartOptions.Frutta.length],
    rotationBreakfastExtras[index % rotationBreakfastExtras.length],
  ].map((part) => ({ ...part }));
  return {
    id: `catalog-breakfast-${index + 1}`,
    name: parts.map((part) => part.label || part.food).join(" · "),
    kicker: "Colazione del paniere quotidiano",
    course: "Colazione",
    cuisine: "Italiano",
    image: parts[0].image,
    time: 3,
    ingredients: parts,
    parts,
    steps: [
      "Pesa o conta le porzioni indicate.",
      "Prepara la bevanda o il latticino e servi il frutto lavato e tagliato se necessario.",
      "Spalma o abbina la parte extra alla base, senza aggiungere quantità non registrate.",
    ],
    alternatives: ["Cambia ogni tessera per vedere equivalenze e quantità"],
  };
});
catalogBreakfasts.forEach((recipe) => (recipe.kind = "combination"));

const asPracticalSnackPortion = (part: MealPart): MealPart => {
  const grams = part.food.startsWith("Pane")
    ? 40
    : part.food === "Fette biscottate integrali"
      ? 20
      : part.food === "Biscotti secchi"
        ? 25
        : part.food === "Cracker integrali"
          ? 25
          : ["Noci", "Mandorle", "Pistacchi", "Noci pecan", "Nocciole", "Arachidi", "Anacardi non salati"].includes(part.food)
            ? 15
            : part.grams;
  return { ...part, grams };
};

const catalogSnacks: Recipe[] = Array.from({ length: 30 }, (_, index) => {
  const fruit = mealPartOptions.Frutta[index % mealPartOptions.Frutta.length];
  const companionBase =
    index % 3 === 0
      ? portableSnackDairy[index % portableSnackDairy.length]
      : index % 3 === 1
        ? rotationBreakfastExtras[index % rotationBreakfastExtras.length]
        : rotationBreakfastCarbs[index % rotationBreakfastCarbs.length];
  const companion = asPracticalSnackPortion(companionBase);
  const parts = [{ ...fruit }, { ...companion }];
  return {
    id: `catalog-snack-${index + 1}`,
    name: parts.map((part) => part.label || part.food).join(" · "),
    kicker: "Spuntino pratico del paniere",
    course: "Spuntino",
    cuisine: "Italiano",
    image: fruit.image,
    time: 2,
    ingredients: parts,
    parts,
    steps: ["Lava il frutto, pesa le quantità e porta le due parti in contenitori separati se sei al lavoro."],
    alternatives: ["Sostituisci una sola parte con la porzione equivalente proposta"],
  };
});
catalogSnacks.forEach((recipe) => (recipe.kind = "combination"));

const rotationMainCarbs = mealPartOptions.Carboidrato.filter(
  (part) =>
    ![
      "Fette biscottate integrali",
      "Biscotti secchi",
      "Fiocchi d'avena",
      "Farina d'avena",
      "Farina di frumento integrale",
      "Farina di grano saraceno",
    ].includes(part.food),
);
const rotationMainExtras = mealPartOptions.Extra.filter((part) =>
  ["Olio extravergine", "Grana Padano DOP"].includes(part.food),
);
type MainBaseFamily = "pane" | "pasta" | "riso" | "tubero" | "altro";
const mainCompatibilityMatrix: Record<MainBaseFamily, string[]> = {
  pane: ["Fesa di tacchino", "Bresaola", "Tonno al naturale sgocciolato", "Prosciutto cotto", "Feta", "Uova sode", "Burger vegetale di soia"],
  pasta: ["Tonno al naturale sgocciolato", "Salmone cotto", "Feta", "Ceci cotti", "Piselli cotti", "Lenticchie cotte", "Fagioli cannellini cotti"],
  riso: ["Petto di pollo cotto", "Petto di pollo arrosto", "Salmone cotto", "Merluzzo cotto", "Orata cotta", "Tonno al naturale sgocciolato", "Uova sode", "Uova strapazzate o in frittata", "Ceci cotti", "Piselli cotti", "Lenticchie cotte", "Fagioli cannellini cotti"],
  tubero: ["Bistecca di manzo · peso a crudo", "Bistecca di vitello · peso a crudo", "Lonza di maiale · peso a crudo", "Bistecca di cavallo magra · peso a crudo", "Petto di pollo cotto", "Merluzzo cotto", "Orata cotta", "Salmone cotto", "Uova sode", "Burger vegetale di soia"],
  altro: ["Petto di pollo cotto", "Merluzzo cotto", "Orata cotta", "Salmone cotto", "Uova sode", "Uova strapazzate o in frittata", "Ceci cotti", "Lenticchie cotte", "Fagioli cannellini cotti", "Burger vegetale di soia"],
};
const mainBaseFamily = (food: string): MainBaseFamily => {
  if (["Pane", "Cracker", "Grissini"].some((term) => food.includes(term))) return "pane";
  if (["Pasta", "Gnocchi"].some((term) => food.includes(term))) return "pasta";
  if (food.includes("Riso")) return "riso";
  if (food.includes("Patate")) return "tubero";
  return "altro";
};
const compatibleMainProteins = (base: MealPart) => {
  const compatible = mainCompatibilityMatrix[mainBaseFamily(base.food)];
  return mealPartOptions.Proteina.filter((part) => compatible.includes(part.food));
};
const catalogMains: Recipe[] = Array.from({ length: 84 }, (_, index) => {
  const base = rotationMainCarbs[index % rotationMainCarbs.length];
  const compatibleProteins = compatibleMainProteins(base);
  const parts = [
    base,
    compatibleProteins[index % compatibleProteins.length],
    mealPartOptions.Contorno[index % mealPartOptions.Contorno.length],
    index % 4 === 0
      ? rotationMainExtras.find((part) => part.food === "Grana Padano DOP")!
      : rotationMainExtras.find((part) => part.food === "Olio extravergine")!,
  ].map((part) => ({ ...part }));
  return {
    id: `catalog-main-${index + 1}`,
    name: parts.slice(0, 3).map((part) => part.label || part.food).join(" · "),
    kicker: "Pasto completo costruito dal paniere",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: parts[0].image,
    time: 25,
    ingredients: parts,
    parts,
    steps: [
      "Pesa la base nella forma indicata dall'etichetta, a crudo o cotta.",
      "Cuoci la proteina con il metodo scritto nella tessera, fino a cottura completa.",
      "Cuoci o prepara il contorno e aggiungi soltanto alla fine l'olio pesato.",
    ],
    alternatives: ["Cambia base, proteina o contorno separatamente"],
  };
});
catalogMains.forEach((recipe) => (recipe.kind = "combination"));
const catalogWorkMains = catalogMains.filter((recipe) =>
  recipe.parts?.some((part) =>
    ["Pane integrale", "Riso basmati secco", "Riso Venere secco", "Patate lesse"].includes(part.food),
  ) && recipe.parts?.some((part) =>
    ["Bresaola", "Fesa di tacchino", "Tonno al naturale sgocciolato", "Prosciutto cotto"].includes(part.food),
  ),
);
const occasionalRecipes: Recipe[] = [
  {
    id: "occasional-pizza-margherita",
    name: "Pizza margherita",
    kicker: "Una scelta possibile, non una punizione",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("pizza-margherita-v7"),
    time: 15,
    ingredients: [{ food: "Pizza margherita", grams: 300 }],
    steps: [
      "Se la ordini, scegli una margherita semplice e registra il peso disponibile o la porzione realmente mangiata.",
      "Mangiala con calma e abbinala ad acqua; non saltare automaticamente il pasto successivo.",
    ],
    alternatives: [
      "Pizza marinara",
      "Porzione più piccola con un contorno di verdure",
    ],
  },
  {
    id: "occasional-hamburger",
    name: "Hamburger semplice fatto in casa",
    kicker: "Pane, carne e verdure con quantità chiare",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("hamburger-simple-v7"),
    time: 15,
    ingredients: [
      { food: "Pane integrale", grams: 100 },
      {
        food: "Bistecca di manzo · peso a crudo",
        grams: 100,
        label: "Hamburger di manzo",
      },
      { food: "Pomodorini", grams: 100, label: "Pomodoro" },
      { food: "Rucola", grams: 30 },
    ],
    parts: [
      {
        category: "Carboidrato",
        food: "Pane integrale",
        grams: 100,
        label: "Pane",
        image: photo("part-bread-v7"),
      },
      {
        category: "Proteina",
        food: "Bistecca di manzo · peso a crudo",
        grams: 100,
        label: "Hamburger di manzo",
        image: photo("part-steak-beef-v114"),
      },
      {
        category: "Contorno",
        food: "Rucola",
        grams: 30,
        label: "Rucola e pomodoro",
        image: photo("part-rucola-v7"),
      },
    ],
    steps: [
      "Forma un hamburger spesso circa 2 cm e cuocilo su piastra calda fino a cottura completa.",
      "Tosta il pane 1-2 minuti, aggiungi carne, pomodoro lavato e rucola asciutta.",
    ],
    alternatives: [
      "Pollo alla piastra al posto del manzo",
      "Pane 50 g per una porzione più piccola",
    ],
  },
];
const allRecipes = [
  ...simpleBreakfasts,
  ...matrixBreakfasts,
  ...catalogBreakfasts,
  ...quickSnacks,
  ...matrixSnacks,
  ...attachmentMissingSnacks,
  ...matrixMainRecipes,
  ...catalogSnacks,
  ...portableRecipes,
  ...balancedDinnerRecipes,
  ...catalogMains,
  ...occasionalRecipes,
  ...recipes,
  ...generatedRecipes,
  ...snackRecipes,
];
const recipeMap = Object.fromEntries(allRecipes.map((r) => [r.id, r]));
const days: Day[] = [
  {
    label: "Giorno 1",
    mood: "Partenza semplice",
    recipes: [
      "breakfast-rusks-jam",
      "catalog-snack-1",
      "work-bresaola",
      "catalog-snack-2",
      "plant-burger-broccoli-bread",
    ],
  },
  {
    label: "Giorno 2",
    mood: "Fibre e colore",
    recipes: [
      "breakfast-milk-biscuits",
      "catalog-snack-3",
      "work-rice-salad",
      "catalog-snack-4",
      "dinner-three-italian",
    ],
  },
  {
    label: "Giorno 3",
    mood: "Energia stabile",
    recipes: [
      "breakfast-crackers-ricotta",
      "catalog-snack-5",
      "work-turkey",
      "catalog-snack-6",
      "dinner-three-eggs",
    ],
  },
  {
    label: "Giorno 4",
    mood: "Mediterraneo",
    recipes: [
      "breakfast-rusks-butter",
      "matrix-s11-banana-peanut",
      "simple-pasta-tomato",
      "quick-wafer",
      "sweet-ricotta",
    ],
  },
  {
    label: "Giorno 5",
    mood: "Completo e saziante",
    recipes: [
      "jar",
      "catalog-snack-9",
      "work-turkey",
      "catalog-snack-10",
      "matrix-p43-farro-eggs-green-beans",
    ],
  },
  {
    label: "Giorno 6",
    mood: "Più movimento",
    recipes: [
      "breakfast-milk-biscuits",
      "catalog-snack-11",
      "chicken-farro",
      "catalog-snack-12",
      "salmon-rice",
    ],
  },
  {
    label: "Giorno 7",
    mood: "Equilibrio e varietà",
    recipes: [
      "apple-oats",
      "quick-protein-yogurt-strawberries",
      "simple-pasta-tomato",
      "quick-protein-pudding-pear",
      "tuna-chickpeas",
    ],
  },
];

function round(n: number) {
  return Math.round(n);
}
function fmt(n: number) {
  return Math.round(n * 10) / 10;
}
function percentOf(value: number, reference: number) {
  return reference > 0 ? round((value / reference) * 100) : 0;
}

export function FoodPlanner() {
  const [tab, setTab] = useState<Tab>("today");
  const [calories, setCalories] = useState(1800);
  const [goal, setGoal] = useState("Equilibrio");
  const [dayIndex, setDayIndex] = useState(0);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [selectedMealKey, setSelectedMealKey] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [completedRecipes, setCompletedRecipes] = useState<
    Record<string, string>
  >({});
  const [actualWeights, setActualWeights] = useState<Record<string, number[]>>(
    {},
  );
  const [removedIngredients, setRemovedIngredients] = useState<
    Record<string, number[]>
  >({});
  const [partSelections, setPartSelections] = useState<
    Record<string, MealPart[]>
  >({});
  const [mealView, setMealView] = useState<Record<string, "dish" | "parts">>(
    {},
  );
  const [partPicker, setPartPicker] = useState<{
    key: string;
    index: number;
    part: MealPart;
    role: MealPart["category"];
  } | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [excludedGroups, setExcludedGroups] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [foodToAvoid, setFoodToAvoid] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [swapTarget, setSwapTarget] = useState<{
    day: number;
    slot: number;
  } | null>(null);
  const [swapReturnTab, setSwapReturnTab] = useState<Tab>("today");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [cuisineChoice, setCuisineChoice] = useState("Italiano");
  const [dayContext, setDayContext] = useState("Lavoro");
  const [plannedDrink, setPlannedDrink] = useState("Acqua");
  const [cuisineFilter, setCuisineFilter] = useState("Tutte");
  const [drinks, setDrinks] = useState<Record<string, LogItem[]>>({});
  const [extras, setExtras] = useState<Record<string, LogItem[]>>({});
  const [diaryDay, setDiaryDay] = useState(0);
  const [extraName, setExtraName] = useState("");
  const [extraGrams, setExtraGrams] = useState("50");
  const [replanNote, setReplanNote] = useState("");
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [shoppingScope, setShoppingScope] = useState<"day" | "week">("day");
  const [weekLocked, setWeekLocked] = useState(false);
  const [weekEditingDay, setWeekEditingDay] = useState<number | null>(null);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const skipFirstProfileApplyRef = useRef(true);
  const [groceryChecked, setGroceryChecked] = useState<Record<string, boolean>>(
    {},
  );
  const [groceryAmounts, setGroceryAmounts] = useState<Record<string, number>>(
    {},
  );
  const [check, setCheck] = useState({
    yesterday: "regolare",
    todayActivity: "no",
    tomorrowActivity: "no",
    feeling: "bene",
  });
  const [builder, setBuilder] = useState<RecipeIngredient[]>([
    { food: "Rucola", grams: 60 },
    { food: "Petto di pollo cotto", grams: 120 },
    { food: "Pomodorini", grams: 120 },
    { food: "Quinoa cotta", grams: 100 },
    { food: "Olio extravergine", grams: 8 },
  ]);
  const updateBlockedRef = useRef(false);
  updateBlockedRef.current = Boolean(
    selected ||
      partPicker ||
      preferencesOpen ||
      checkinOpen ||
      shoppingOpen ||
      weekEditingDay !== null ||
      tab === "builder" ||
      Boolean(extraName.trim()),
  );

  useEffect(() => {
    let disposed = false;
    let updateWaiting = false;
    let pendingVersion = "";
    const applyWhenSafe = () => {
      if (
        !disposed &&
        updateWaiting &&
        !updateBlockedRef.current
      ) {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("v", pendingVersion || String(Date.now()));
        window.location.replace(nextUrl.toString());
      }
    };
    const checkVersion = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}version.json?time=${Date.now()}`,
          { cache: "no-store" },
        );
        const release = (await response.json()) as { version?: string };
        if (release.version && release.version !== VERSION) {
          updateWaiting = true;
          pendingVersion = release.version;
          applyWhenSafe();
        }
      } catch {
        // Offline: il controllo riprova senza modificare il lavoro salvato.
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkVersion();
    };
    checkVersion();
    const versionTimer = window.setInterval(checkVersion, 5000);
    const safeTimer = window.setInterval(applyWhenSafe, 500);
    window.addEventListener("focus", checkVersion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      window.clearInterval(versionTimer);
      window.clearInterval(safeTimer);
      window.removeEventListener("focus", checkVersion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vivapiatto-v1");
      if (raw) {
        const s = JSON.parse(raw);
        setCalories(s.calories || 1800);
        setGoal(s.goal || "Equilibrio");
        setCompleted(s.completed || {});
        setCompletedRecipes(s.completedRecipes || {});
        setActualWeights(s.actualWeights || {});
        setRemovedIngredients(s.removedIngredients || {});
        setPartSelections(s.partSelections || {});
        setCheck(s.check || check);
        setExcludedGroups(s.excludedGroups || []);
        setDislikedFoods(s.dislikedFoods || []);
        setChoices(s.choices || {});
        setDrinks(s.drinks || {});
        setExtras(s.extras || {});
        setGroceryChecked(s.groceryChecked || {});
        setGroceryAmounts(s.groceryAmounts || {});
        setPlannedDrink(s.plannedDrink || "Acqua");
        setDayContext(s.dayContext || "Lavoro");
        setWeekLocked(Boolean(s.weekLocked));
        setCuisineChoice(s.cuisineChoice || "Italiano");
        setDayIndex(Math.max(0, Math.min(days.length - 1, Number(s.dayIndex) || 0)));
        setDiaryDay(Math.max(0, Math.min(days.length - 1, Number(s.diaryDay) || 0)));
        if (["today", "week", "library", "builder", "progress"].includes(s.tab)) setTab(s.tab);
        if (Array.isArray(s.builder) && s.builder.length) setBuilder(s.builder);
      }
    } catch {}
    setProfileHydrated(true);
  }, []);
  useEffect(() => {
    if (!profileHydrated) return;
    localStorage.setItem(
      "vivapiatto-v1",
      JSON.stringify({
        calories,
        goal,
        completed,
        completedRecipes,
        actualWeights,
        removedIngredients,
        partSelections,
        check,
        excludedGroups,
        dislikedFoods,
        choices,
        drinks,
        extras,
        groceryChecked,
        groceryAmounts,
        plannedDrink,
        dayContext,
        weekLocked,
        cuisineChoice,
        dayIndex,
        diaryDay,
        tab,
        builder,
      }),
    );
  }, [
    calories,
    goal,
    completed,
    completedRecipes,
    actualWeights,
    removedIngredients,
    partSelections,
    check,
    excludedGroups,
    dislikedFoods,
    choices,
    drinks,
    extras,
    groceryChecked,
    groceryAmounts,
    plannedDrink,
    dayContext,
    weekLocked,
    cuisineChoice,
    dayIndex,
    diaryDay,
    tab,
    builder,
    profileHydrated,
  ]);
  const groupFoods: Record<string, string[]> = {
    Latte: ["Yogurt greco 2%", "Yogurt greco 0%", "Mozzarella vaccina", "Mozzarella light", "Ricotta vaccina", "Crescenza", "Primo sale", "Scamorza", "Provolone Dolce Auricchio", "Feta"],
    Uova: ["Uovo", "Uova sode", "Uova strapazzate o in frittata"],
    Pesce: ["Salmone cotto", "Tonno al naturale sgocciolato", "Sogliola · peso a crudo", "Rombo · peso a crudo", "Seppia · peso a crudo"],
    Glutine: [
      "Pane integrale",
      "Pane bianco tipo 0",
      "Pane semintegrale tipo 1",
      "Pane di segale",
      "Farro cotto",
      "Cous cous integrale cotto",
      "Orzo perlato cotto",
    ],
    "Frutta a guscio": ["Noci", "Mandorle", "Pistacchi", "Nocciole", "Anacardi non salati"],
    Arachidi: ["Arachidi", "Crema 100% arachidi"],
  };
  const blockedFoods = [
    ...dislikedFoods,
    ...excludedGroups.flatMap((g) => groupFoods[g] || []),
  ];
  const isAllowed = (recipe: Recipe) =>
    recipe.ingredients.every((i) => !blockedFoods.includes(i.food));
  const availableBreakfasts = () =>
    [
      ...matrixBreakfasts.filter((recipe) => dayContext === "Casa" || recipe.time <= 7),
      ...simpleBreakfasts,
      ...catalogBreakfasts,
    ].filter(isAllowed);
  const recipeCuisine = (r: Recipe) =>
    r.cuisine ||
    (r.id.includes("toast") || r.id.includes("sweet")
      ? "Italiano"
      : "Mediterraneo");
  const recipeCourse = (r: Recipe) =>
    r.course ||
    (["jar", "toast", "apple-oats"].includes(r.id)
      ? "Colazione"
      : r.id.startsWith("snack-")
        ? "Spuntino"
        : "Piatto unico");
  const cleanKicker = (text: string) =>
    text.replace(/\s*·?\s*matrice\s+[cspd]\d+/gi, "").trim();
  const fitsSlot = (r: Recipe, slot: number) =>
    slot === 0
      ? recipeCourse(r) === "Colazione"
      : [1, 3].includes(slot)
        ? ["Spuntino", "Dolce", "Gelato"].includes(recipeCourse(r))
        : ["Piatto unico", "Piatto completo", "Primo", "Secondo"].includes(recipeCourse(r));
  const getDayIds = (day: number) =>
    days[day].recipes.map((fallback, slot) => {
      const chosen = choices[`${day}-${slot}`];
      return chosen && recipeMap[chosen] && fitsSlot(recipeMap[chosen], slot)
        ? chosen
        : fallback;
    });
  const currentIds = getDayIds(dayIndex);
  const activityDelta =
    check.todayActivity === "intensa"
      ? 200
      : check.todayActivity === "leggera"
        ? 75
        : -75;
  const plannedCalories = Math.max(1200, calories + activityDelta);
  const plannedDrinkMap: Record<string, RecipeIngredient[]> = {
    Acqua: [],
    "Spremuta 150 ml": [{ food: "Succo d'arancia 100%", grams: 150 }],
    "Coca-Cola Zero": [],
    "Gassata zero": [],
  };
  const plannedDrinkMacros = calc(plannedDrinkMap[plannedDrink] || []);
  const targetForDay = (day: number) =>
    day === dayIndex ? plannedCalories : calories;
  const compatibleWithSlot = (r: Recipe) =>
    !swapTarget || fitsSlot(r, swapTarget.slot);
  const isWorkFriendly = (r: Recipe) =>
    portableRecipes.some((x) => x.id === r.id) ||
    (r.time <= 35 &&
      r.alternatives.some((text) => /trasport|schiscetta|lavoro/i.test(text)) &&
      !r.alternatives.some((text) => /pasto da casa|preferibile a casa/i.test(text)));
  const workLunchesFrom = (recipes: Recipe[]) =>
    [...recipes.filter(isWorkFriendly), ...portableRecipes, ...catalogWorkMains]
      .filter(isAllowed)
      .filter(
        (recipe, index, list) =>
          list.findIndex((candidate) => candidate.id === recipe.id) === index,
      );
  const compatibleWithPlace = (_r: Recipe) => true;
  const filteredRecipes = allRecipes
    .filter(
      (r) =>
        r.kind !== "combination" &&
        r.ingredients.every((item) => Boolean(foods[item.food])) &&
        isAllowed(r) &&
        compatibleWithSlot(r) &&
        compatibleWithPlace(r) &&
        (cuisineFilter === "Tutte" || recipeCuisine(r) === cuisineFilter) &&
        r.name.toLowerCase().includes(libraryQuery.toLowerCase()),
    )
    .sort((a, b) =>
      dayContext === "Lavoro" && swapTarget?.slot === 2
        ? Number(isWorkFriendly(b)) - Number(isWorkFriendly(a))
        : 0,
    );
  const replanFollowingDays = (changedDay: number) => {
    if (weekLocked) return;
    const breakfasts = availableBreakfasts();
    const snacks = [...quickSnacks, ...matrixSnacks, ...attachmentMissingSnacks, ...catalogSnacks].filter(isAllowed);
    const mains = allRecipes.filter(
      (r) =>
        isAllowed(r) &&
        recipeCuisine(r) === cuisineChoice &&
        ["Piatto unico", "Piatto completo", "Primo", "Secondo"].includes(recipeCourse(r)),
    );
    const lunches =
      dayContext === "Lavoro"
        ? workLunchesFrom(mains)
        : mains;
    const dinners = mains;
    if (!breakfasts.length || !snacks.length || !lunches.length || !dinners.length)
      return;
    setChoices((current) => {
      const next = { ...current };
      for (let day = changedDay + 1; day < days.length; day += 1) {
        const pools = [breakfasts, snacks, lunches, snacks, dinners];
        pools.forEach((pool, slot) => {
          const key = `${day}-${slot}`;
          if (completed[key]) return;
          const balancedItalianId = days[day].recipes[slot];
          next[key] =
            cuisineChoice === "Italiano" && dayContext === "Lavoro" && recipeMap[balancedItalianId]
              ? balancedItalianId
              : pool[(day * 3 + slot) % pool.length].id;
        });
      }
      return next;
    });
    setPartSelections((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        const [dayText] = key.split("-");
        if (Number(dayText) > changedDay && !completed[key]) delete next[key];
      });
      return next;
    });
  };
  const targetAdditionsFor = (slot: number): RecipeIngredient[] =>
      calories >= 3000
        ? slot === 0
          ? [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Noci", grams: 35 }]
          : slot === 1
            ? [{ food: "Banana", grams: 150 }, { food: "Cracker integrali", grams: 25 }]
            : slot === 2
              ? [{ food: "Pane integrale", grams: 100 }, { food: "Olio extravergine", grams: 10 }]
              : slot === 3
                ? [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Mela", grams: 150 }]
                : [{ food: "Pane integrale", grams: 100 }, { food: "Olio extravergine", grams: 10 }]
        : calories >= 2800
          ? slot === 0
            ? [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Noci", grams: 20 }, { food: "Mela", grams: 150 }]
            : slot === 1
              ? [{ food: "Banana", grams: 150 }]
              : slot === 2
                ? [{ food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 5 }]
                : slot === 3
                  ? [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Cracker integrali", grams: 25 }]
                  : [{ food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 5 }]
          : calories >= 2400
        ? slot === 0
          ? [
              {
                food: "Yogurt greco 2%",
                grams: 125,
                label: "Yogurt · 1 vasetto",
              },
              { food: "Noci", grams: 20 },
            ]
          : slot === 1
            ? [{ food: "Banana", grams: 150 }]
            : slot === 2
              ? [
                  {
                    food: "Pane integrale",
                    grams: 50,
                    label: "Pane · 1 porzione",
                  },
                  { food: "Olio extravergine", grams: 5 },
                ]
              : slot === 3
                ? [
                    {
                      food: "Yogurt greco 2%",
                      grams: 125,
                      label: "Yogurt · 1 vasetto",
                    },
                  ]
                : [
                    {
                      food: "Pane integrale",
                      grams: 50,
                      label: "Pane · 1 porzione",
                    },
                    { food: "Olio extravergine", grams: 5 },
                  ]
        : calories >= 2200
          ? slot === 0
            ? [{ food: "Yogurt greco 2%", grams: 125 }]
            : slot === 1
              ? [{ food: "Mela", grams: 150 }]
              : slot === 2
                ? [{ food: "Pane integrale", grams: 50 }]
                : slot === 3
                  ? [{ food: "Yogurt greco 2%", grams: 125 }]
                  : [{ food: "Pane integrale", grams: 50 }]
          : calories >= 2000
          ? slot === 0
            ? [
                {
                  food: "Yogurt greco 2%",
                  grams: 125,
                  label: "Yogurt · 1 vasetto",
                },
              ]
            : slot === 1
              ? [{ food: "Mela", grams: 150 }]
              : slot === 4
                ? [
                    {
                      food: "Pane integrale",
                      grams: 50,
                      label: "Pane · 1 porzione",
                    },
                  ]
                : []
          : [];

  const lowEnergyAdjusted = <T extends RecipeIngredient>(item: T): T => {
    if (calories >= 1800) return item;
    const name = item.food.toLowerCase();
    const adjustable = [
      "pasta", "riso", "pane", "fette biscottate", "biscotti", "cracker",
      "avena", "farro", "quinoa", "gnocchi", "patate", "olio", "burro",
      "confettura", "miele", "noci", "mandorle", "pistacchi", "arachidi",
    ].some((term) => name.includes(term));
    if (!adjustable) return item;
    const factor = calories <= 1400 ? 0.7 : 0.85;
    const minimum = item.grams >= 150 ? 100 : item.grams >= 50 ? 40 : 10;
    const grams = Math.max(minimum, Math.round((item.grams * factor) / 5) * 5);
    return { ...item, grams };
  };

  const mergeTargetAdditions = <T extends RecipeIngredient>(
    items: T[],
    additions: RecipeIngredient[],
  ): RecipeIngredient[] => {
    const merged: RecipeIngredient[] = items.map((item) => ({ ...item }));
    additions.forEach((addition) => {
      const existing = merged.find((item) => item.food === addition.food);
      if (existing) existing.grams += addition.grams;
      else merged.push({ ...addition });
    });
    return merged;
  };

  const additionAsPart = (item: RecipeIngredient): MealPart => {
    const category =
      (Object.keys(mealPartOptions) as MealPart["category"][]).find((role) =>
        mealPartOptions[role].some((option) => option.food === item.food),
      ) || "Extra";
    const known = mealPartOptions[category].find((x) => x.food === item.food);
    return {
      category,
      food: item.food,
      grams: item.grams,
      label: item.label || known?.label || item.food,
      image: known?.image || photo("part-bread-v7"),
    };
  };

  const activeMealParts = (key: string, recipe: Recipe): MealPart[] => {
    if (partSelections[key]) return partSelections[key].map(normalizeMealPart);
    const slot = Number(key.split("-")[1]);
    const sourceParts = recipe.parts || recipe.ingredients.map(additionAsPart);
    const merged = sourceParts.map((part) => ({ ...part }));
    targetAdditionsFor(slot).forEach((item) => {
      const existing = merged.find((part) => part.food === item.food);
      if (existing) existing.grams += item.grams;
      else merged.push(additionAsPart(item));
    });
    return merged.map(lowEnergyAdjusted).map(normalizeMealPart);
  };

  const plannedIngredients = (key: string, recipe: Recipe) => {
    const slot = Number(key.split("-")[1]);
    const targetAdditions = targetAdditionsFor(slot);
    if (!recipe.parts && !partSelections[key])
      return mergeTargetAdditions(recipe.ingredients, targetAdditions).map(lowEnergyAdjusted);
    const activeParts = activeMealParts(key, recipe);
    const pastaSelected = activeParts.some((x) => x.food.includes("Pasta"));
    const sourceParts = recipe.parts || recipe.ingredients.map(additionAsPart);
    const extras = recipe.ingredients.filter(
      (x) =>
        !sourceParts.some((p) => p.food === x.food) &&
        (x.food === "Olio extravergine" ||
          (pastaSelected && x.food === "Passata di pomodoro")),
    );
    return [...activeParts, ...extras];
  };
  const actualIngredients = (key: string, recipe: Recipe) => {
    const saved = actualWeights[key];
    const removed = removedIngredients[key] || [];
    return plannedIngredients(key, recipe)
      .map((x, i) => ({
        ...x,
        grams: saved?.[i] ?? x.grams,
        originalIndex: i,
      }))
      .filter((x) => !removed.includes(x.originalIndex));
  };
  const scale = 1;
  const dayTotals = useMemo(
    () =>
      currentIds.reduce(
        (s, id, slot) => {
          const key = `${dayIndex}-${slot}`;
          const removed = removedIngredients[key] || [];
          const ingredients = plannedIngredients(key, recipeMap[id]).filter(
            (_, index) => !removed.includes(index),
          );
          const m = calc(ingredients, scale);
          return {
            kcal: s.kcal + m.kcal,
            protein: s.protein + m.protein,
            carbs: s.carbs + m.carbs,
            fat: s.fat + m.fat,
            fiber: s.fiber + m.fiber,
          };
        },
        {
          kcal: plannedDrinkMacros.kcal,
          protein: plannedDrinkMacros.protein,
          carbs: plannedDrinkMacros.carbs,
          fat: plannedDrinkMacros.fat,
          fiber: 0,
        },
      ),
    [
      dayIndex,
      scale,
      choices,
      plannedDrink,
      partSelections,
      removedIngredients,
    ],
  );
  const effectiveDayTotals = useMemo(() => {
    const meals = currentIds.reduce(
      (sum, id, slot) => {
        const key = `${dayIndex}-${slot}`;
        const recipe = recipeMap[completedRecipes[key] || id];
        const nutrients = completed[key]
          ? calc(actualIngredients(key, recipe))
          : calc(plannedIngredients(key, recipe));
        return {
          kcal: sum.kcal + nutrients.kcal,
          protein: sum.protein + nutrients.protein,
          carbs: sum.carbs + nutrients.carbs,
          fat: sum.fat + nutrients.fat,
          fiber: sum.fiber + nutrients.fiber,
        };
      },
      {
        kcal: plannedDrinkMacros.kcal,
        protein: plannedDrinkMacros.protein,
        carbs: plannedDrinkMacros.carbs,
        fat: plannedDrinkMacros.fat,
        fiber: 0,
      },
    );
    const added = (extras[dayIndex] || []).reduce(
      (sum, item) => ({
        kcal: sum.kcal + item.kcal,
        protein: sum.protein + (item.protein || 0),
        carbs: sum.carbs + (item.carbs || 0),
        fat: sum.fat + (item.fat || 0),
        fiber: sum.fiber + (item.fiber || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
    const consumedDrinks = (drinks[dayIndex] || []).reduce(
      (sum, item) => ({
        kcal: sum.kcal + item.kcal,
        protein: sum.protein + (item.protein || 0),
        carbs: sum.carbs + (item.carbs || 0),
        fat: sum.fat + (item.fat || 0),
        fiber: sum.fiber + (item.fiber || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
    return {
      kcal: meals.kcal + added.kcal + consumedDrinks.kcal,
      protein: meals.protein + added.protein + consumedDrinks.protein,
      carbs: meals.carbs + added.carbs + consumedDrinks.carbs,
      fat: meals.fat + added.fat + consumedDrinks.fat,
      fiber: meals.fiber + added.fiber + consumedDrinks.fiber,
    };
  }, [
    currentIds,
    dayIndex,
    completed,
    completedRecipes,
    actualWeights,
    choices,
    partSelections,
    removedIngredients,
    plannedDrink,
    extras,
    drinks,
  ]);
  const completedToday = currentIds.filter(
    (_, slot) => completed[`${dayIndex}-${slot}`],
  ).length;
  const builderTotals = useMemo(() => calc(builder), [builder]);
  const doneCount = Object.values(completed).filter(Boolean).length;
  const guidance =
    check.yesterday === "molto"
      ? "Ieri hai mangiato più del previsto: oggi torna alla regolarità, senza saltare pasti. Scegli acqua, verdure e porzioni già pesate."
      : check.feeling === "gonfio"
        ? "Oggi ti senti gonfio: preferisci pasti regolari e non enormi, mangia lentamente e registra i cibi che sembrano associati al sintomo."
        : check.feeling === "stanco"
          ? "Giornata stanca: mantieni carboidrati e proteine distribuiti nei pasti. Non ridurre automaticamente il cibo."
          : check.todayActivity === "intensa"
            ? "Attività intensa oggi: usa lo spuntino banana e yogurt vicino all'allenamento e cura l'idratazione."
            : "Giornata regolare: segui le porzioni proposte e ascolta fame e sazietà.";

  const updateBuilder = (
    index: number,
    key: "food" | "grams",
    value: string | number,
  ) =>
    setBuilder((v) =>
      v.map((x, i) =>
        i === index
          ? { ...x, [key]: key === "grams" ? Number(value) : value }
          : x,
      ),
    );
  const chooseRecipe = (recipe: Recipe) => {
    if (swapTarget) {
      const changedDay = swapTarget.day;
      setChoices((v) => ({
        ...v,
        [`${swapTarget.day}-${swapTarget.slot}`]: recipe.id,
      }));
      setMealView((current) => ({ ...current, [`${swapTarget.day}-${swapTarget.slot}`]: "dish" }));
      setDayIndex(swapTarget.day);
      replanFollowingDays(changedDay);
      setSwapTarget(null);
      setTab(swapReturnTab);
      scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSelectedMealKey(null);
      setSelected(recipe);
    }
  };
  const completeMealOptions = (key: string) => {
    const [dayText, slotText] = key.split("-");
    const slot = Number(slotText);
    const current = recipeMap[getDayIds(Number(dayText))[slot]];
    const target = calc(plannedIngredients(key, current)).kcal;
    return allRecipes
      .filter((recipe) => recipe.id !== current.id && recipe.kind !== "combination" && Boolean(recipe.parts?.length) && fitsSlot(recipe, slot) && isAllowed(recipe))
      .sort((a, b) => {
        const cuisineA = recipeCuisine(a) === cuisineChoice ? 0 : 1;
        const cuisineB = recipeCuisine(b) === cuisineChoice ? 0 : 1;
        if (cuisineA !== cuisineB) return cuisineA - cuisineB;
        return Math.abs(calc(a.ingredients).kcal - target) - Math.abs(calc(b.ingredients).kcal - target);
      })
      .slice(0, 6);
  };
  const chooseCompleteMeal = (recipe: Recipe) => {
    if (!partPicker) return;
    const [dayText] = partPicker.key.split("-");
    const changedDay = Number(dayText);
    const key = partPicker.key;
    setChoices((current) => ({ ...current, [key]: recipe.id }));
    setMealView((current) => ({ ...current, [key]: "dish" }));
    setPartSelections((current) => { const next = { ...current }; delete next[key]; return next; });
    setActualWeights((current) => { const next = { ...current }; delete next[key]; return next; });
    setRemovedIngredients((current) => { const next = { ...current }; delete next[key]; return next; });
    setReplanNote("Pasto completo sostituito con " + recipe.name + ". Puoi tenerlo intero o dividerlo in componenti.");
    replanFollowingDays(changedDay);
    setPartPicker(null);
  };
  const keepRecordedChoice = (
    current: Record<string, string>,
    slot: number,
    nextId: string,
  ) => {
    const key = `${dayIndex}-${slot}`;
    return completed[key] ? current[key] || getDayIds(dayIndex)[slot] : nextId;
  };
  const profileRecipeKcal = (recipe: Recipe, slot: number) => {
    const source = recipe.parts || recipe.ingredients;
    return calc(
      mergeTargetAdditions(source, targetAdditionsFor(slot)).map(lowEnergyAdjusted),
    ).kcal;
  };
  const closestForSlot = (
    pool: Recipe[],
    slot: number,
    target: number,
    offset: number,
  ) => {
    const ranked = [...pool].sort(
      (a, b) =>
        Math.abs(profileRecipeKcal(a, slot) - target) -
        Math.abs(profileRecipeKcal(b, slot) - target),
    );
    return ranked[offset % Math.min(5, ranked.length)];
  };
  const applyCuisine = () => {
    const profileSeed =
      (calories >= 2400 ? 1 : calories >= 2000 ? 2 : 0) +
      (goal === "Dimagrimento graduale"
        ? 1
        : goal === "Mantenimento massa"
          ? 3
          : 2) +
      (plannedDrink === "Acqua" ? 0 : 1);
    const styled = allRecipes.filter(
      (r) => isAllowed(r) && recipeCuisine(r) === cuisineChoice,
    );
    const breakfasts = availableBreakfasts();
    const snacks = [...quickSnacks, ...matrixSnacks, ...attachmentMissingSnacks, ...catalogSnacks].filter(isAllowed);
    const mains = styled.filter((r) =>
      ["Piatto unico", "Piatto completo", "Primo", "Secondo"].includes(recipeCourse(r)),
    );
    const homeMains = mains.filter(
      (r) =>
        r.time >= 20 &&
        !portableRecipes.some((portable) => portable.id === r.id),
    );
    const lunches =
      dayContext === "Lavoro"
        ? workLunchesFrom(mains)
        : homeMains.length
          ? homeMains
          : mains;
    const dinners = (homeMains.length ? homeMains : mains).filter(
      (recipe) => recipe.id !== "sweet-ricotta",
    );
    if (
      !breakfasts.length ||
      !snacks.length ||
      !mains.length ||
      !lunches.length ||
      !dinners.length
    )
      return;
    const shares = [0.22, 0.09, 0.3, 0.09, 0.3];
    const profileDays = weekLocked ? [dayIndex] : days.map((_, index) => index);
    setChoices((current) => {
      const next = { ...current };
      const usedRecipes = new Set<string>();
      const chooseMain = (
        pool: Recipe[],
        family: WeeklyProteinFamily,
        slot: number,
        target: number,
        offset: number,
      ) => {
        const unused = pool.filter((recipe) => !usedRecipes.has(recipe.id));
        const byFamily = unused.filter((recipe) => recipeProteinFamily(recipe) === family);
        const candidates = byFamily.length ? byFamily : unused.length ? unused : pool;
        const chosen = closestForSlot(candidates, slot, target, offset);
        usedRecipes.add(chosen.id);
        return chosen;
      };
      profileDays.forEach((day) => {
        const profileTarget = day === dayIndex ? plannedCalories : calories;
        const offset = profileSeed + day;
        const breakfast = closestForSlot(breakfasts, 0, profileTarget * shares[0], offset);
        const morningSnack = closestForSlot(snacks, 1, profileTarget * shares[1], offset);
        const afternoonPool = snacks.filter((recipe) => recipe.id !== morningSnack.id);
        const afternoonSnack = closestForSlot(afternoonPool, 3, profileTarget * shares[3], offset + 1);
        const lunch = chooseMain(
          lunches,
          WEEKLY_MAIN_ROTATION[day * 2],
          2,
          profileTarget * shares[2],
          offset,
        );
        const dinnerPool = dinners.filter((recipe) => recipeProteinFamily(recipe) !== recipeProteinFamily(lunch));
        const dinner = chooseMain(
          dinnerPool.length ? dinnerPool : dinners,
          WEEKLY_MAIN_ROTATION[day * 2 + 1],
          4,
          profileTarget * shares[4],
          offset + 1,
        );
        [breakfast, morningSnack, lunch, afternoonSnack, dinner].forEach((recipe, slot) => {
          const key = `${day}-${slot}`;
          if (!completed[key]) next[key] = recipe.id;
        });
      });
      return next;
    });
    setReplanNote(
      `Menu completo ${cuisineChoice.toLowerCase()} creato: 5 momenti e spesa aggiornata.`,
    );
  };
  const planFromCheck = (next: typeof check) => {
    const profileSeed =
      (calories >= 2400 ? 1 : calories >= 2000 ? 2 : 0) +
      (goal === "Dimagrimento graduale"
        ? 1
        : goal === "Mantenimento massa"
          ? 3
          : 2);
    const breakfasts = availableBreakfasts();
    let snacks = [...quickSnacks, ...matrixSnacks, ...attachmentMissingSnacks, ...catalogSnacks].filter(isAllowed);
    let mains = allRecipes.filter(
      (r) =>
        isAllowed(r) &&
        recipeCuisine(r) === cuisineChoice &&
        ["Piatto unico", "Piatto completo", "Primo", "Secondo"].includes(recipeCourse(r)),
    );
    if (next.feeling === "gonfio") {
      mains = mains
        .filter(
          (r) =>
            !r.ingredients.some((i) =>
              [
                "Ceci cotti",
                "Lenticchie cotte",
                "Fagioli cannellini cotti",
                "Piselli cotti",
              ].includes(i.food),
            ),
        )
        .sort((a, b) => a.ingredients.length - b.ingredients.length);
      snacks = snacks.filter(
        (r) =>
          !r.ingredients.some((i) =>
            ["Wafer confezionati", "Pera", "Mela"].includes(i.food),
          ),
      );
    } else if (next.feeling === "fame") {
      mains = [...mains].sort(
        (a, b) =>
          calc(b.ingredients).protein +
          calc(b.ingredients).fiber * 2 -
          (calc(a.ingredients).protein + calc(a.ingredients).fiber * 2),
      );
      snacks = [...snacks].sort(
        (a, b) => calc(b.ingredients).kcal - calc(a.ingredients).kcal,
      );
    } else if (next.feeling === "stanco" || next.todayActivity === "intensa") {
      mains = [...mains].sort(
        (a, b) => calc(b.ingredients).carbs - calc(a.ingredients).carbs,
      );
      snacks = allRecipes
        .filter((r) => isAllowed(r) && recipeCourse(r) === "Spuntino")
        .sort((a, b) => calc(b.ingredients).carbs - calc(a.ingredients).carbs);
    } else {
      mains = [...mains].sort(
        (a, b) =>
          Math.abs(calc(a.ingredients).kcal - 550) -
          Math.abs(calc(b.ingredients).kcal - 550),
      );
    }
    if (!breakfasts.length || !snacks.length || !mains.length) return;
    const homeMains = mains.filter(
      (r) =>
        r.time >= 20 &&
        !portableRecipes.some((portable) => portable.id === r.id),
    );
    const lunches =
      dayContext === "Lavoro"
        ? workLunchesFrom(mains)
        : homeMains.length
          ? homeMains
          : mains;
    const dinners = (homeMains.length ? homeMains : mains).filter(
      (recipe) => recipe.id !== "sweet-ricotta",
    );
    if (!lunches.length || !dinners.length) return;
    const offset =
      (next.yesterday === "molto" ? 1 : next.yesterday === "poco" ? 2 : 0) +
      profileSeed;
    setChoices((v) => ({
      ...v,
      [`${dayIndex}-0`]: keepRecordedChoice(
        v,
        0,
        breakfasts[(dayIndex + offset) % breakfasts.length].id,
      ),
      [`${dayIndex}-1`]: keepRecordedChoice(
        v,
        1,
        snacks[(dayIndex + offset) % snacks.length].id,
      ),
      [`${dayIndex}-2`]: keepRecordedChoice(
        v,
        2,
        lunches[(dayIndex + offset) % lunches.length].id,
      ),
      [`${dayIndex}-3`]: keepRecordedChoice(
        v,
        3,
        snacks[(dayIndex + offset + 1) % snacks.length].id,
      ),
      [`${dayIndex}-4`]: keepRecordedChoice(
        v,
        4,
        dinners[(dayIndex + offset + 1) % dinners.length].id,
      ),
    }));
    setReplanNote(
      next.feeling === "gonfio"
        ? "Gonfio: menu semplice, senza legumi e bibite gassate. Sintomi persistenti o dolore: medico."
        : next.feeling === "stanco"
          ? "Stanco: pasti regolari, carboidrati distribuiti e frutta."
          : next.feeling === "fame"
            ? "Fame: più proteine e fibre per la sazietà."
            : next.todayActivity === "intensa"
              ? "Attività intensa: più energia vicino all'attività."
              : "Menu aggiornato.",
    );
  };
  const answerCheck = (key: keyof typeof check, value: string) => {
    const next = { ...check, [key]: value };
    setCheck(next);
    planFromCheck(next);
  };
  const chooseMealPart = (replacement: MealPart, keepOriginalRole = true) => {
    if (!partPicker) return;
    const [dayText, slotText] = partPicker.key.split("-");
    const day = Number(dayText);
    const slot = Number(slotText);
    const recipe = recipeMap[getDayIds(day)[slot]];
    const activeParts = activeMealParts(partPicker.key, recipe);
    const previous = activeParts[partPicker.index];
    const nextPart = {
      ...replacement,
      category: keepOriginalRole ? partPicker.role : replacement.category,
    };
    const delta =
      calc([{ food: nextPart.food, grams: nextPart.grams }]).kcal -
      calc([{ food: previous.food, grams: previous.grams }]).kcal;
    setPartSelections((v) => ({
      ...v,
      [partPicker.key]: activeParts.map((x, index) =>
        index === partPicker.index ? nextPart : x,
      ),
    }));
    const nextSlot = slot === 0 ? 1 : slot <= 2 ? 3 : null;
    if (nextSlot !== null && !completed[`${day}-${nextSlot}`]) {
      const snackId =
        delta > 80 ? "quick-apple" : delta < -80 ? "quick-nuts" : null;
      if (snackId)
        setChoices((v) => ({ ...v, [`${day}-${nextSlot}`]: snackId }));
    }
    setReplanNote(
      nextSlot === null
        ? `Parte cambiata: ${nextPart.label || nextPart.food} ${nextPart.grams} g.`
        : `Parte cambiata e ${SLOT_LABELS[nextSlot].toLowerCase()} ricalibrato.`,
    );
    replanFollowingDays(day);
    setPartPicker(null);
  };
  const removeMealPart = () => {
    if (!partPicker) return;
    const [dayText, slotText] = partPicker.key.split("-");
    const recipe = recipeMap[getDayIds(Number(dayText))[Number(slotText)]];
    const activeParts = activeMealParts(partPicker.key, recipe);
    setPartSelections((v) => ({
      ...v,
      [partPicker.key]: activeParts.map((part, index) =>
        index === partPicker.index
          ? { ...part, grams: 0, label: "Nessuno", category: partPicker.role }
          : part,
      ),
    }));
    setReplanNote("Elemento tolto: calorie e nutrienti aggiornati.");
    setPartPicker(null);
  };
  const updateMealPartGrams = (
    key: string,
    recipe: Recipe,
    index: number,
    grams: number,
  ) => {
    const activeParts = activeMealParts(key, recipe);
    setPartSelections((v) => ({
      ...v,
      [key]: activeParts.map((part, partIndex) =>
        partIndex === index
          ? { ...part, grams: Math.max(0, Math.min(1000, grams)) }
          : part,
      ),
    }));
  };
  useEffect(() => {
    if (!profileHydrated) return;
    if (skipFirstProfileApplyRef.current) {
      skipFirstProfileApplyRef.current = false;
      return;
    }
    applyCuisine();
  }, [goal, calories, cuisineChoice, dayContext, plannedDrink, profileHydrated]);
  const addDrink = (day: number, item: LogItem) =>
    setDrinks((v) => ({ ...v, [day]: [...(v[day] || []), item] }));
  const addExtra = (day = diaryDay) => {
    if (!extraName.trim()) return;
    const match = Object.keys(foodSearchDatabase).find(
      (food) => food.toLowerCase() === extraName.trim().toLowerCase(),
    );
    const grams = Math.max(0, Number(extraGrams) || 0);
    if (!match || !grams) {
      setReplanNote("Scegli un alimento suggerito e indica i grammi.");
      return;
    }
    const factor = grams / 100;
    const kcal = round(foodSearchDatabase[match].kcal * factor);
    setExtras((v) => ({
      ...v,
      [day]: [
        ...(v[day] || []),
        {
          label: `${match} · ${grams} g`,
          kcal,
          protein: foodSearchDatabase[match].protein * factor,
          carbs: foodSearchDatabase[match].carbs * factor,
          fat: foodSearchDatabase[match].fat * factor,
          fiber: foodSearchDatabase[match].fiber * factor,
          source: foodSearchDatabase[match].source,
        },
      ],
    }));
    setExtraName("");
    setExtraGrams("50");
  };
  const dayScale = (_day: number) => 1;
  const loggedMealKcal = (day: number) =>
    getDayIds(day).reduce((sum, id, slot) => {
      const key = `${day}-${slot}`;
      const recordedId = completedRecipes[key] || id;
      return (
        sum +
        (completed[key]
          ? calc(actualIngredients(key, recipeMap[recordedId])).kcal
          : 0)
      );
    }, 0);
  const loggedTotal = (day: number) =>
    loggedMealKcal(day) +
    (drinks[day] || []).reduce((s, x) => s + x.kcal, 0) +
    (extras[day] || []).reduce((s, x) => s + x.kcal, 0);
  const weeklyProteinCounts = () => {
    const counts: Record<string, number> = {
      Pesce: 0,
      "Carne bianca": 0,
      "Carne rossa": 0,
      Uova: 0,
      "Legumi e vegetali": 0,
      Formaggi: 0,
      Salumi: 0,
    };
    days.forEach((_, day) => {
      getDayIds(day).forEach((id, slot) => {
        const key = `${day}-${slot}`;
        const recordedId = completed[key] ? completedRecipes[key] || id : id;
        const recipe = recipeMap[recordedId];
        const items = completed[key]
          ? actualIngredients(key, recipe)
          : plannedIngredients(key, recipe);
        const family = proteinFamilyForItems(items);
        if (family === "pesce") counts.Pesce += 1;
        if (family === "carne-bianca") counts["Carne bianca"] += 1;
        if (family === "carne-rossa") counts["Carne rossa"] += 1;
        if (family === "legumi") counts["Legumi e vegetali"] += 1;
        if (family === "latticini") counts.Formaggi += 1;
        if (family === "salumi") counts.Salumi += 1;
        const eggGrams = items
          .filter((item) => /uovo|uova/i.test(item.food))
          .reduce((sum, item) => sum + item.grams, 0);
        counts.Uova += Math.round(eggGrams / 50);
      });
    });
    return counts;
  };  const weeklyCounts = weeklyProteinCounts();
  const weeklyPlannedKcal = days.map((_, day) =>
    round(
      getDayIds(day).reduce((total, id, slot) => {
        const key = `${day}-${slot}`;
        return total + calc(plannedIngredients(key, recipeMap[id])).kcal;
      }, 0),
    ),
  );
  const weeklyPlannedFiber = days.map((_, day) =>
    fmt(
      getDayIds(day).reduce((total, id, slot) => {
        const key = `${day}-${slot}`;
        return total + calc(plannedIngredients(key, recipeMap[id])).fiber;
      }, 0),
    ),
  );
  const weeklyAverageKcal = round(
    weeklyPlannedKcal.reduce((sum, kcal) => sum + kcal, 0) /
      weeklyPlannedKcal.length,
  );
  const weeklyAverageFiber = fmt(
    weeklyPlannedFiber.reduce((sum, fiber) => sum + fiber, 0) /
      weeklyPlannedFiber.length,
  );
  const weeklyTargets = [
    { label: "Pesce", target: "2–3", count: weeklyCounts.Pesce },
    { label: "Legumi e vegetali", target: "3–4", count: weeklyCounts["Legumi e vegetali"] },
    { label: "Carne bianca", target: "1–2", count: weeklyCounts["Carne bianca"] },
    { label: "Carne rossa", target: "0–1", count: weeklyCounts["Carne rossa"] },
    { label: "Uova", target: "2–4", count: weeklyCounts.Uova },
    { label: "Formaggi", target: "2–3", count: weeklyCounts.Formaggi },
    { label: "Salumi", target: "0–1", count: weeklyCounts.Salumi },
  ];  const replanNextDay = (day: number) => {
    if (day >= days.length - 1) {
      setReplanNote(
        "Settimana completata: usa il diario per impostare la prossima.",
      );
      return;
    }
    const total = loggedTotal(day);
    const target = targetForDay(day);
    const safe = allRecipes.filter(
      (r) =>
        isAllowed(r) &&
        ["Piatto unico", "Piatto completo", "Primo", "Secondo"].includes(recipeCourse(r)),
    );
    const ranked = [...safe].sort(
      (a, b) => calc(a.ingredients).kcal - calc(b.ingredients).kcal,
    );
    const pool =
      total > target * 1.1
        ? ranked.slice(0, Math.max(2, Math.floor(ranked.length / 2)))
        : total < target * 0.8
          ? ranked.slice(Math.floor(ranked.length / 2))
          : safe;
    setChoices((v) => ({
      ...v,
      [`${day + 1}-2`]: pool[(day * 2) % pool.length].id,
      [`${day + 1}-4`]: pool[(day * 2 + 1) % pool.length].id,
    }));
    setReplanNote(
      total > target * 1.1
        ? "Domani: pasti regolari e sazianti, senza saltare nulla."
        : total < target * 0.8
          ? "Domani: pasti completi e due spuntini confermati."
          : "Domani aggiornato mantenendo l'equilibrio.",
    );
  };
  const rebalanceRemaining = (day: number) => {
    const open = [0, 1, 2, 3, 4].filter((slot) => !completed[`${day}-${slot}`]);
    if (!open.length) {
      setReplanNote("Tutti i pasti di oggi sono già registrati.");
      return;
    }
    const remaining = Math.max(0, targetForDay(day) - loggedTotal(day));
    const average = remaining / open.length;
    const safe = allRecipes.filter(isAllowed);
    const updates: Record<string, string> = {};
    open.forEach((slot, n) => {
      const coursePool = safe.filter((r) => fitsSlot(r, slot));
      const ranked = [...(coursePool.length ? coursePool : safe)].sort(
        (a, b) =>
          Math.abs(calc(a.ingredients).kcal - average) -
          Math.abs(calc(b.ingredients).kcal - average),
      );
      updates[`${day}-${slot}`] = ranked[n % Math.min(ranked.length, 12)].id;
    });
    setChoices((v) => ({ ...v, ...updates }));
    setReplanNote(
      `Restano circa ${round(remaining)} kcal: ho aggiornato ${open.length} proposte.`,
    );
  };
  const rebalanceDayPreservingEdits = (day: number) => {
    const adjustable = [0, 1, 2, 3, 4].filter((slot) => {
      const key = `${day}-${slot}`;
      return !completed[key] && !partSelections[key];
    });
    if (!adjustable.length) {
      setReplanNote("Modifiche salvate; non ci sono altri momenti liberi da riequilibrare oggi.");
      return;
    }
    const fixedKcal = [0, 1, 2, 3, 4]
      .filter((slot) => !adjustable.includes(slot))
      .reduce((sum, slot) => {
        const key = `${day}-${slot}`;
        const id = completedRecipes[key] || getDayIds(day)[slot];
        const recipe = recipeMap[id];
        return (
          sum +
          (completed[key]
            ? calc(actualIngredients(key, recipe)).kcal
            : calc(plannedIngredients(key, recipe)).kcal)
        );
      }, 0);
    const average = Math.max(80, targetForDay(day) - fixedKcal) / adjustable.length;
    const safe = allRecipes.filter(isAllowed);
    const updates: Record<string, string> = {};
    adjustable.forEach((slot, index) => {
      const pool = safe.filter((recipe) => fitsSlot(recipe, slot));
      const ranked = [...pool].sort(
        (a, b) =>
          Math.abs(calc(a.ingredients).kcal - average) -
          Math.abs(calc(b.ingredients).kcal - average),
      );
      if (ranked.length) updates[`${day}-${slot}`] = ranked[index % ranked.length].id;
    });
    setChoices((current) => ({ ...current, ...updates }));
    setReplanNote("Giornata riequilibrata mantenendo gli elementi modificati; aggiornati anche i giorni successivi.");
  };
  const shoppingItems = useMemo(() => {
    const totals: Record<string, number> = {};
    const targetDays =
      shoppingScope === "day" ? [dayIndex] : days.map((_, i) => i);
    targetDays.forEach((day) =>
      getDayIds(day).forEach((id, slot) => {
        const key = `${day}-${slot}`;
        const removed = removedIngredients[key] || [];
        plannedIngredients(key, recipeMap[id])
          .filter((_, index) => !removed.includes(index))
          .forEach((x) => {
            totals[x.food] = (totals[x.food] || 0) + x.grams;
          });
      }),
    );
    if (targetDays.includes(dayIndex))
      (plannedDrinkMap[plannedDrink] || []).forEach((x) => {
        totals[x.food] = (totals[x.food] || 0) + x.grams;
      });
    return Object.entries(totals)
      .map(([food, grams]) => ({ food, grams: round(grams) }))
      .sort((a, b) => a.food.localeCompare(b.food));
  }, [
    shoppingScope,
    dayIndex,
    choices,
    calories,
    plannedDrink,
    partSelections,
    removedIngredients,
  ]);
  const shareShopping = async () => {
    const text =
      `Lista spesa ${shoppingScope === "day" ? days[dayIndex].label : "settimanale"}\n` +
      shoppingItems
        .filter((x) => !groceryChecked[x.food])
        .map((x) => `• ${x.food}: ${groceryAmounts[x.food] ?? x.grams} g`)
        .join("\n");
    if (navigator.share)
      await navigator.share({ title: "Lista spesa - Tavola Mia", text });
    else await navigator.clipboard.writeText(text);
  };
  const selectedIngredients = selected
    ? selectedMealKey
      ? actualIngredients(selectedMealKey, selected)
      : selected.ingredients.map((x) => ({
          ...x,
          grams: round(x.grams * scale),
        }))
    : [];
  const selectedMacros = calc(selectedIngredients);
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">T</div>
        <div>
          <strong>Tavola Mia</strong>
          <span>piano · ricette · diario</span>
        </div>
        <span className="version">v{VERSION}</span>
      </header>
      <section className="content">
        {tab === "today" && (
          <>
            {weekEditingDay !== null && (
              <section className="week-edit-banner">
                <div>
                  <span>MODIFICA SETTIMANA</span>
                  <b>{days[weekEditingDay].label}</b>
                </div>
                <div className="week-edit-actions">
                  <button
                    onClick={() => {
                      setWeekEditingDay(null);
                      setTab("week");
                      scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Chiudi
                  </button>
                  <button
                    onClick={() => {
                      rebalanceDayPreservingEdits(weekEditingDay);
                      replanFollowingDays(weekEditingDay);
                      setWeekEditingDay(null);
                      setTab("week");
                      scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Chiudi e riequilibra
                  </button>
                </div>
              </section>
            )}
            <section className="today-strip">
              <div>
                <span>OGGI · {TODAY_LABEL}</span>
                <b>
                  {days[dayIndex].label} · piano {round(dayTotals.kcal)} · scelto {calories} kcal
                </b>
                <small>
                  Target oggi {plannedCalories} · scarto {round(dayTotals.kcal - plannedCalories) > 0 ? "+" : ""}
                  {round(dayTotals.kcal - plannedCalories)} kcal
                </small>
              </div>
              <div className="today-strip-actions">
                <button onClick={() => setPreferencesOpen((v) => !v)}>
                  ⚙ Preferenze {blockedFoods.length ? `(${blockedFoods.length})` : ""}
                </button>
                <button
                  className="cheat-quick-btn"
                  onClick={() => {
                    const section = document.getElementById("sgarri-extra") as HTMLDetailsElement | null;
                    if (section) {
                      section.open = true;
                      section.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                >
                  ＋ Sgarri
                </button>
              </div>
            </section>
            {preferencesOpen && (
              <section className="preferences">
                <div className="section-title">
                  <div>
                    <span className="eyebrow">PRIMA DI SCEGLIERE</span>
                    <h2>Allergie e alimenti da evitare</h2>
                  </div>
                  <div className="filter-actions">
                    <button
                      className="text-btn"
                      onClick={() => {
                        setExcludedGroups([]);
                        setDislikedFoods([]);
                      }}
                    >
                      Azzera
                    </button>
                    <button
                      className="text-btn"
                      onClick={() => setPreferencesOpen(false)}
                    >
                      Chiudi
                    </button>
                  </div>
                </div>
                <b>Allergie o intolleranze</b>
                <div className="chips">
                  {Object.keys(groupFoods).map((g) => (
                    <button
                      key={g}
                      className={excludedGroups.includes(g) ? "active" : ""}
                      onClick={() =>
                        setExcludedGroups((v) =>
                          v.includes(g) ? v.filter((x) => x !== g) : [...v, g],
                        )
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <b>Oggi non voglio mangiare</b>
                <div className="avoid-add">
                  <select
                    value={foodToAvoid}
                    onChange={(e) => setFoodToAvoid(e.target.value)}
                  >
                    <option value="">Scegli un alimento…</option>
                    {Object.keys(foods)
                      .filter((f) => !dislikedFoods.includes(f))
                      .map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                  </select>
                  <button
                    disabled={!foodToAvoid}
                    onClick={() => {
                      setDislikedFoods((v) => [...v, foodToAvoid]);
                      setFoodToAvoid("");
                    }}
                  >
                    Escludi
                  </button>
                </div>
                {dislikedFoods.length > 0 && (
                  <div className="removed-foods">
                    {dislikedFoods.map((f) => (
                      <button
                        key={f}
                        onClick={() =>
                          setDislikedFoods((v) => v.filter((x) => x !== f))
                        }
                      >
                        {f} ×
                      </button>
                    ))}
                  </div>
                )}
                <p className="safety-mini">
                  In caso di allergia diagnosticata, controlla sempre etichette
                  e contaminazioni: il filtro aiuta a scegliere, ma non
                  sostituisce la verifica personale o medica.
                </p>
              </section>
            )}
            <section className="compact-config">
              <div>
                <label>Obiettivo</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                  <option>Dimagrimento graduale</option>
                  <option>Equilibrio</option>
                  <option>Mantenimento massa</option>
                </select>
              </div>
              <div>
                <label>Base kcal</label>
                <select
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                >
                  {[1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              </div>
            </section>
            <section className="cuisine-picker">
              <div>
                <span>Stile</span>
                <select
                  value={cuisineChoice}
                  onChange={(e) => {
                    setCuisineChoice(e.target.value);
                    e.currentTarget.blur();
                  }}
                >
                  {[
                    "Italiano",
                    "Asiatico",
                    "Gourmet",
                    "Mediterraneo",
                    "Vegetale",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <span>Dove</span>
                <select
                  value={dayContext}
                  onChange={(e) => {
                    setDayContext(e.target.value);
                    e.currentTarget.blur();
                  }}
                >
                  <option>Lavoro</option>
                  <option>Casa</option>
                </select>
              </div>
            </section>
            <section className="checkin compact">
              <button
                className="checkin-toggle"
                onClick={() => setCheckinOpen((v) => !v)}
              >
                <span>Check-in · cambia il menu</span>
                <b>
                  {check.todayActivity === "no"
                    ? "Nessuna attività"
                    : check.todayActivity}{" "}
                  · {check.feeling}
                </b>
                <i>{checkinOpen ? "−" : "＋"}</i>
              </button>
              {checkinOpen && (
                <div className="checkin-body">
                  <div className="question">
                    <span>Ieri</span>
                    <div className="chips">
                      {[
                        ["regolare", "Regolare"],
                        ["poco", "Meno"],
                        ["molto", "Più"],
                      ].map(([v, l]) => (
                        <button
                          className={check.yesterday === v ? "active" : ""}
                          key={v}
                          onClick={() => answerCheck("yesterday", v)}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="question">
                    <span>Attività oggi</span>
                    <div className="chips">
                      {[
                        ["no", "Nessuna"],
                        ["leggera", "Leggera"],
                        ["intensa", "Intensa"],
                      ].map(([v, l]) => (
                        <button
                          className={check.todayActivity === v ? "active" : ""}
                          key={v}
                          onClick={() => answerCheck("todayActivity", v)}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="question">
                    <span>Stato</span>
                    <div className="chips">
                      {[
                        ["bene", "Bene"],
                        ["gonfio", "Gonfio"],
                        ["stanco", "Stanco"],
                        ["fame", "Fame"],
                      ].map(([v, l]) => (
                        <button
                          className={check.feeling === v ? "active" : ""}
                          key={v}
                          onClick={() => answerCheck("feeling", v)}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="question">
                    <span>Attività domani</span>
                    <div className="chips">
                      {[
                        ["no", "Nessuna"],
                        ["leggera", "Leggera"],
                        ["intensa", "Intensa"],
                      ].map(([v, l]) => (
                        <button
                          className={
                            check.tomorrowActivity === v ? "active" : ""
                          }
                          key={v}
                          onClick={() => answerCheck("tomorrowActivity", v)}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
            <section className="macro-strip">
              <div>
                <b>{round(dayTotals.protein)}g</b>
                <span>proteine</span>
              </div>
              <div>
                <b>{round(dayTotals.carbs)}g</b>
                <span>carboidrati</span>
              </div>
              <div>
                <b>{round(dayTotals.fat)}g</b>
                <span>grassi</span>
              </div>
              <div>
                <b>{fmt(dayTotals.fiber)}g</b>
                <span>fibre</span>
              </div>
            </section>
            {getDayIds(dayIndex).some(
              (_, slot) => completed[`${dayIndex}-${slot}`],
            ) && (
              <button
                className="primary-btn compact"
                onClick={() => rebalanceRemaining(dayIndex)}
              >
                Riequilibra ciò che resta oggi
              </button>
            )}
            {replanNote && <div className="replan-note">{replanNote}</div>}
            <section>
              <div className="section-title">
                <div>
                  <span className="eyebrow">IL TUO MENU</span>
                  <h2>Cinque momenti pratici</h2>
                </div>
                <button className="text-btn" onClick={() => setTab("week")}>
                  7 giorni
                </button>
              </div>
              <div className="meal-list">
                {currentIds.map((id, i) => {
                  const r = recipeMap[id];
                  const key = `${dayIndex}-${i}`;
                  const visibleIngredients = actualIngredients(key, r);
                  const m = calc(visibleIngredients);
                  const activeParts = activeMealParts(key, r);
                  const fullDishView = Boolean(r.parts && r.kind !== "combination" && (mealView[key] || "dish") === "dish");
                  const allowed = isAllowed(r);
                  const actual = completed[key]
                    ? calc(actualIngredients(key, r))
                    : null;
                  const caution =
                    check.feeling === "gonfio" &&
                    r.ingredients.some((x) =>
                      [
                        "Ceci cotti",
                        "Lenticchie cotte",
                        "Mela",
                        "Pera",
                        "Wafer confezionati",
                      ].includes(x.food),
                    );
                  return (
                    <article
                      className={`meal-card ${r.parts && !fullDishView ? "composed" : "detailed"} ${allowed ? "" : "blocked"} ${caution ? "caution" : ""}`}
                      key={key}
                      onClick={() => {
                        setSelectedMealKey(key);
                        setSelected(r);
                      }}
                    >
                      {(!r.parts || fullDishView) && <img src={r.image} alt={r.name} />}
                      <div className="meal-body">
                        <span>{SLOT_LABELS[i]}</span>
                        <h3>
                          {r.parts && !fullDishView
                            ? `${SLOT_LABELS[i]} · ${
                                activeParts
                                  .filter((part) => part.grams > 0)
                                  .map((part) => part.label || part.food)
                                  .join(", ") || "nessun elemento"
                              }`
                            : r.name}
                        </h3>
                        {r.parts && r.kind !== "combination" && fullDishView ? (
                          <div className="dish-view-actions" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { setSelectedMealKey(key); setSelected(r); }}>ⓘ Ricetta e preparazione</button>
                            <button
                              onClick={() => {
                                setSwapReturnTab("today");
                                setSwapTarget({ day: dayIndex, slot: i });
                                setCuisineFilter(recipeCuisine(r));
                                setLibraryQuery("");
                                setTab("library");
                                scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              ↻ Cambia piatto pronto
                            </button>
                            <button onClick={() => setMealView((current) => ({ ...current, [key]: "parts" }))}>Dividi in componenti</button>
                          </div>
                        ) : r.parts ? (
                          <>
                            {r.kind !== "combination" && (
                              <div className="dish-view-actions" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setMealView((current) => ({ ...current, [key]: "dish" }))}>Piatto unico</button>
                                <button onClick={() => { setSelectedMealKey(key); setSelected(r); }}>ⓘ Ricetta</button>
                              </div>
                            )}
                            <div className="meal-parts">
                              {activeParts.map((part, partIndex) => (
                                <div
                                  className="meal-part"
                                  key={`${part.category}-${partIndex}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {part.grams > 0 ? (
                                    <img
                                      src={part.image}
                                      alt={part.label || part.food}
                                    />
                                  ) : (
                                    <div
                                      className="part-empty"
                                      aria-label="Elemento rimosso"
                                    >
                                      −
                                    </div>
                                  )}
                                  <button
                                    className="part-change"
                                    aria-label={`Cambia ${part.category}`}
                                    onClick={() => {
                                      setPartPicker({
                                        key,
                                        index: partIndex,
                                        part,
                                        role:
                                          r.parts?.[partIndex]?.category ||
                                          part.category,
                                      });
                                    }}
                                  >
                                    {part.label || part.food}
                                    <i>Alternative</i>
                                  </button>
                                  <label className="part-grams">
                                    <input
                                      aria-label={`Grammi ${part.label || part.food}`}
                                      type="number"
                                      min="0"
                                      max="1000"
                                      value={part.grams}
                                      onChange={(event) =>
                                        updateMealPartGrams(
                                          key,
                                          r,
                                          partIndex,
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                    <span>g</span>
                                  </label>
                                  <small className="part-nutrients">
                                    {round(calc([part]).kcal)} kcal ·{" "}
                                    {round(calc([part]).protein)} g prot.
                                  </small>
                                </div>
                              ))}
                            </div>
                            <div className="part-extras">
                              {visibleIngredients
                                .filter(
                                  (x) =>
                                    !activeParts.some((p) => p.food === x.food),
                                )
                                .map((x, extraIndex) => (
                                  <span key={`${x.food}-${extraIndex}`}>
                                    {x.label || x.food} {x.grams} g
                                  </span>
                                ))}
                            </div>
                            {(i === 2 || i === 4) &&
                              new Set(activeParts.map((x) => x.category)).size <
                                3 && (
                                <small className="structure-note">
                                  Scelta libera: manca una delle tre funzioni
                                  del pasto. Puoi continuare o riequilibrare
                                  dopo.
                                </small>
                              )}
                          </>
                        ) : plannedIngredients(key, r).length > 1 ? (
                          <div className="ingredient-preview">
                            {plannedIngredients(key, r).map(
                              (x, ingredientIndex) => {
                                const removed = (
                                  removedIngredients[key] || []
                                ).includes(ingredientIndex);
                                return (
                                  <button
                                    className={removed ? "removed" : ""}
                                    key={`${x.food}-${ingredientIndex}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRemovedIngredients((v) => ({
                                        ...v,
                                        [key]: removed
                                          ? (v[key] || []).filter(
                                              (n) => n !== ingredientIndex,
                                            )
                                          : [
                                              ...(v[key] || []),
                                              ingredientIndex,
                                            ],
                                      }));
                                    }}
                                  >
                                    <i>{removed ? "+" : "−"}</i>
                                    {x.label || x.food} {x.grams} g
                                  </button>
                                );
                              },
                            )}
                          </div>
                        ) : null}
                        <p>
                          {caution
                            ? "Sconsigliato oggi: possibile alimento fermentabile"
                            : allowed
                              ? actual
                                ? `Mangiato · ${round(actual.kcal)} kcal`
                                : `${round(m.kcal)} kcal · ${round(m.protein)} g proteine · ${round(m.carbs)} g carboidrati · ${round(m.fat)} g grassi · ${r.time} min`
                              : "Contiene un alimento escluso"}
                        </p>
                      </div>
                      <div className="meal-actions">
                        <button
                          aria-label={`Cambia ${SLOT_LABELS[i]}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSwapReturnTab("today");
                            setSwapTarget({ day: dayIndex, slot: i });
                            setTab("library");
                          }}
                        >
                          ↻
                        </button>
                        <button
                          aria-label={
                            completed[key] ? "Segna da fare" : "Segna mangiato"
                          }
                          className={`check ${completed[key] ? "done" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (completed[key]) {
                              setCompleted((v) => ({ ...v, [key]: false }));
                              setCompletedRecipes((v) => {
                                const next = { ...v };
                                delete next[key];
                                return next;
                              });
                              return;
                            }
                            setCompleted((v) => ({ ...v, [key]: true }));
                            setCompletedRecipes((v) => ({ ...v, [key]: r.id }));
                            setActualWeights((v) => ({
                              ...v,
                              [key]: plannedIngredients(key, r).map(
                                (item) => item.grams,
                              ),
                            }));
                          }}
                        >
                          {completed[key] ? "✓" : ""}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <section className="actual-day-summary" aria-label="Riepilogo alimentare aggiornato">
                <header>
                  <div>
                    <span>DOPO CENA</span>
                    <b>{completedToday === 5 ? "Totale consumato" : "Totale aggiornato"}</b>
                  </div>
                  <small>
                    {completedToday === 5
                      ? "5 pasti registrati · bevande ed extra inclusi"
                      : `${completedToday}/5 registrati · il resto è ancora pianificato`}
                  </small>
                </header>
                <div className="actual-day-values">
                  <span><b>{round(effectiveDayTotals.kcal)}</b> kcal</span>
                  <span><b>{round(effectiveDayTotals.protein)}</b> g proteine</span>
                  <span><b>{round(effectiveDayTotals.carbs)}</b> g carboidrati</span>
                  <span><b>{round(effectiveDayTotals.fat)}</b> g grassi</span>
                  <span><b>{fmt(effectiveDayTotals.fiber)}</b> g fibre</span>
                </div>
                <div className="actual-day-comparison">
                  <span>Rispetto al piano previsto</span>
                  <b>target {targetForDay(dayIndex)} kcal</b>
                  <b>
                    scarto {effectiveDayTotals.kcal >= targetForDay(dayIndex) ? "+" : ""}
                    {round(effectiveDayTotals.kcal - targetForDay(dayIndex))} kcal
                  </b>
                  <b>kcal {percentOf(effectiveDayTotals.kcal, dayTotals.kcal)}%</b>
                  <b>proteine {percentOf(effectiveDayTotals.protein, dayTotals.protein)}%</b>
                  <b>carboidrati {percentOf(effectiveDayTotals.carbs, dayTotals.carbs)}%</b>
                  <b>grassi {percentOf(effectiveDayTotals.fat, dayTotals.fat)}%</b>
                  <b>fibre {percentOf(effectiveDayTotals.fiber, 25)}% di 25 g</b>
                </div>
              </section>
              <details className="today-extra" id="sgarri-extra">
                <summary>＋ Sgarri ed extra</summary>
                <div className="extra-form">
                  <input
                    placeholder="Scrivi pane, cracker, dolce…"
                    list="food-suggestions"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                  />
                  <datalist id="food-suggestions">
                    {Object.keys(foodSearchDatabase).map((food) => (
                      <option key={food} value={food} />
                    ))}
                  </datalist>
                  <input
                    aria-label="Grammi extra"
                    type="number"
                    placeholder="grammi"
                    value={extraGrams}
                    onChange={(e) => setExtraGrams(e.target.value)}
                  />
                  <button onClick={() => addExtra(dayIndex)}>Aggiungi</button>
                </div>
                <div className="log-list">
                  {(extras[dayIndex] || []).map((x, extraIndex) => (
                    <button
                      key={`${x.label}-${extraIndex}`}
                      onClick={() =>
                        setExtras((v) => ({
                          ...v,
                          [dayIndex]: v[dayIndex].filter(
                            (_, index) => index !== extraIndex,
                          ),
                        }))
                      }
                    >
                      <span>{x.label}<small>{x.source === "RICETTA CALCOLATA" ? "stima da ricetta" : x.source === "ETICHETTA" ? "valore medio: verifica etichetta" : x.source}</small></span>
                      <b>{x.kcal} kcal ×</b>
                    </button>
                  ))}
                </div>
              </details>
            </section>
          </>
        )}
        {tab === "week" && (
          <section>
            <span className="eyebrow">SETTIMANA</span>
            <h1 className="page-title">Menu e andamento</h1>
            <section className={`week-lock ${weekLocked ? "locked" : ""}`}>
              <div>
                <b>{weekLocked ? "Settimana confermata" : "Settimana modificabile"}</b>
                <span>
                  {weekLocked
                    ? "Le modifiche in Oggi restano solo giornaliere."
                    : "Apri un giorno, cambialo e chiudilo per riequilibrare i successivi."}
                </span>
              </div>
              <button
                onClick={() => {
                  setWeekLocked((value) => !value);
                  setReplanNote(
                    weekLocked
                      ? "Settimana riaperta: i giorni successivi possono essere riequilibrati."
                      : "Settimana confermata: calorie dei 7 giorni e rotazione salvate.",
                  );
                }}
              >
                {weekLocked ? "Riapri" : "Conferma"}
              </button>
            </section>
            <div className="week-kcal-summary">
              <header>
                <b>Calorie pianificate</b>
                <span>media {weeklyAverageKcal} kcal · {weeklyAverageFiber} g fibre/giorno</span>
              </header>
              <div>
                {weeklyPlannedKcal.map((kcal, index) => (
                  <span key={days[index].label}>
                    <small>G{index + 1}</small>
                    <b>{kcal} <em>kcal</em></b>
                    <i>{weeklyPlannedFiber[index]} g fibre</i>
                  </span>
                ))}
              </div>
            </div>
            <button
              className="shopping-trigger"
              onClick={() => {
                setShoppingScope("week");
                setShoppingOpen(true);
              }}
            >
              🛒 Lista della spesa settimanale
            </button>
            <div className="weekly-frequency">
              <header>
                <b>{weekLocked ? "Rotazione confermata" : "Rotazione pianificata"}</b>
                <span>pasti della settimana · riferimento CREA</span>
              </header>
              <div>
                {weeklyTargets.map((item) => (
                  <span key={item.label}>
                    <b>{item.count}</b>
                    {item.label}
                    <small>su {item.target}</small>
                  </span>
                ))}
              </div>
              <p>
                Le proposte successive useranno ciò che registri per aumentare
                la varietà; i riferimenti non sono obblighi clinici.
              </p>
            </div>
            <div className="week-plan">
              {days.map((d, i) => (
                <article key={d.label} className="week-day">
                  <header>
                    <div>
                      <span>{d.label}</span>
                      <b>{d.mood}</b>
                    </div>
                    <button
                      onClick={() => {
                        setDayIndex(i);
                        setWeekEditingDay(i);
                        setTab("today");
                        scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Apri
                    </button>
                  </header>
                  {getDayIds(i).map((id, slot) => {
                    const r = recipeMap[id];
                    const key = `${i}-${slot}`;
                    const weekParts = activeMealParts(key, r).filter(
                      (part) => part.grams > 0,
                    );
                    const weekIngredients = plannedIngredients(key, r);
                    return (
                      <div className="week-meal-row" key={key}>
                        <button
                          className="week-meal"
                          onClick={() => {
                            setSelectedMealKey(key);
                            setSelected(r);
                          }}
                        >
                          <img
                            className="week-slot-visual"
                            src={photo(WEEK_SLOT_IMAGES[slot])}
                            alt=""
                          />
                          <span>
                            <small>{SLOT_LABELS[slot]}</small>
                            <b>
                              {weekParts.length
                                ? weekParts
                                    .map((part) => part.label || part.food)
                                    .join(" · ")
                                : r.name}
                            </b>
                            <em>
                              {round(calc(weekIngredients).kcal)} kcal
                            </em>
                          </span>
                          <i>{completed[key] ? "✓" : "→"}</i>
                        </button>
                        <button
                          className="week-change"
                          aria-label={`Cambia ${SLOT_LABELS[slot]} ${d.label}`}
                          onClick={() => {
                            setSwapReturnTab("week");
                            setSwapTarget({ day: i, slot });
                            setTab("library");
                          }}
                        >
                          ↻
                        </button>
                        {weekParts.length > 0 && (
                          <div className="week-part-strip">
                            {weekParts.map((part, partIndex) => (
                              <button
                                key={`${part.category}-${partIndex}`}
                                onClick={() =>
                                  setPartPicker({
                                    key,
                                    index: partIndex,
                                    part,
                                        role: part.category,
                                  })
                                }
                              >
                                <img
                                  src={part.image}
                                  alt={part.label || part.food}
                                />
                                <span>{part.label || part.food}</span>
                                <b>{part.grams} g</b>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "library" && (
          <section>
            <span className="eyebrow">300+ RICETTE GUIDATE</span>
            <h1 className="page-title">
              {swapTarget ? "Scegli il sostituto" : "Scegli cosa cucinare"}
            </h1>
            <div className="cuisine-tabs">
              {[
                "Tutte",
                "Italiano",
                "Asiatico",
                "Gourmet",
                "Mediterraneo",
                "Vegetale",
              ].map((x) => (
                <button
                  className={cuisineFilter === x ? "active" : ""}
                  key={x}
                  onClick={() => setCuisineFilter(x)}
                >
                  {x}
                </button>
              ))}
            </div>
            <div className="library-tools">
              <input
                aria-label="Cerca ricetta"
                placeholder="Cerca un piatto…"
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
              />
              <b>{filteredRecipes.length}</b>
            </div>
            {!libraryQuery && filteredRecipes.length > 0 && (
              <div className="start-here">
                <span>INIZIA DA QUI</span>
                <b>{filteredRecipes[0].name}</b>
                <div className="start-here-actions">
                  <button onClick={() => { setSelectedMealKey(null); setSelected(filteredRecipes[0]); }}>
                    {swapTarget ? "ⓘ Ricetta" : "Apri"}
                  </button>
                  {swapTarget && (
                    <button onClick={() => chooseRecipe(filteredRecipes[0])}>Scegli</button>
                  )}
                </div>
              </div>
            )}
            <div className="recipe-grid">
              {filteredRecipes.map((r) => {
                const m = calc(r.ingredients);
                return (
                  <article
                    key={r.id}
                    onClick={() => {
                      if (swapTarget) {
                        setSelectedMealKey(null);
                        setSelected(r);
                      } else chooseRecipe(r);
                    }}
                  >
                    <img src={r.image} alt={r.name} />
                    <div>
                      <span>
                        {r.course || recipeCuisine(r)} · {round(m.kcal)} kcal ·{" "}
                        {r.time} min
                      </span>
                      <h3>{r.name}</h3>
                      <p>{cleanKicker(r.kicker)}</p>
                    </div>
                    {swapTarget && (
                      <button
                        className="recipe-card-choose"
                        onClick={(event) => {
                          event.stopPropagation();
                          chooseRecipe(r);
                        }}
                      >
                        Scegli
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
        {tab === "builder" && (
          <section>
            <span className="eyebrow">LABORATORIO DEL PIATTO</span>
            <h1 className="page-title">Componi la tua insalatona</h1>
            <p className="page-lead">
              Aggiungi ciò che vuoi e indica i grammi. Il totale cambia in tempo
              reale.
            </p>
            <div className="builder-score">
              <div>
                <span>Peso totale</span>
                <strong>
                  {round(builderTotals.weight)}
                  <small> g</small>
                </strong>
              </div>
              <div>
                <span>Energia</span>
                <strong>
                  {round(builderTotals.kcal)}
                  <small> kcal</small>
                </strong>
              </div>
              <div>
                <span>Proteine</span>
                <strong>
                  {round(builderTotals.protein)}
                  <small> g</small>
                </strong>
              </div>
              <div>
                <span>Fibre</span>
                <strong>
                  {fmt(builderTotals.fiber)}
                  <small> g</small>
                </strong>
              </div>
            </div>
            <div className="balance-meter">
              <div className={builderTotals.protein >= 25 ? "ok" : ""}>
                <span>Proteine</span>
                <b>
                  {builderTotals.protein >= 25 ? "Buona quota" : "Da aumentare"}
                </b>
              </div>
              <div className={builderTotals.fiber >= 8 ? "ok" : ""}>
                <span>Fibre</span>
                <b>
                  {builderTotals.fiber >= 8 ? "Saziante" : "Aggiungi vegetali"}
                </b>
              </div>
              <div className={builderTotals.kcal <= 700 ? "ok" : "warn"}>
                <span>Budget</span>
                <b>
                  {builderTotals.kcal <= 700
                    ? "Compatibile"
                    : "Piatto energetico"}
                </b>
              </div>
            </div>
            <div className="ingredient-list">
              {builder.map((item, i) => (
                <div className="ingredient-row" key={i}>
                  <select
                    value={item.food}
                    onChange={(e) => updateBuilder(i, "food", e.target.value)}
                  >
                    {Object.keys(foods).map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                  <div>
                    <input
                      aria-label={`Grammi ${item.food}`}
                      type="number"
                      min="0"
                      max="1000"
                      value={item.grams}
                      onChange={(e) =>
                        updateBuilder(i, "grams", e.target.value)
                      }
                    />
                    <span>g</span>
                  </div>
                  <button
                    aria-label="Rimuovi ingrediente"
                    onClick={() =>
                      setBuilder((v) => v.filter((_, x) => x !== i))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              className="primary-btn"
              onClick={() =>
                setBuilder((v) => [...v, { food: "Cetriolo", grams: 100 }])
              }
            >
              ＋ Aggiungi ingrediente
            </button>
            <div className="builder-macros">
              <span>
                <b>{round(builderTotals.carbs)}g</b> carboidrati
              </span>
              <span>
                <b>{round(builderTotals.fat)}g</b> grassi
              </span>
              <span>
                <b>{round(builderTotals.protein)}g</b> proteine
              </span>
            </div>
            <div className="tip-card">
              <b>Idea “particolare”</b>
              <p>
                Prova una base di rucola, farro tiepido, salmone, kiwi a cubetti
                e semi di zucca. Pesa l'olio: è nutriente, ma molto concentrato
                in energia.
              </p>
            </div>
          </section>
        )}
        {tab === "progress" &&
          (() => {
            const total = loggedTotal(diaryDay);
            const target = targetForDay(diaryDay);
            const difference = round(total - target);
            const completedMeals = getDayIds(diaryDay)
              .map((id, slot) => ({
                recipe:
                  recipeMap[completedRecipes[`${diaryDay}-${slot}`] || id],
                slot,
                key: `${diaryDay}-${slot}`,
              }))
              .filter((x) => completed[x.key]);
            const coffeeCount = (drinks[diaryDay] || []).filter((x) =>
              x.label.includes("Caffè"),
            ).length;
            return (
              <section>
                <span className="eyebrow">DIARIO</span>
                <h1 className="page-title">{days[diaryDay].label}</h1>
                <div className="diary-tabs">
                  {days.map((d, i) => (
                    <button
                      className={diaryDay === i ? "active" : ""}
                      key={d.label}
                      onClick={() => setDiaryDay(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="diary-total">
                  <div>
                    <span>Registrato</span>
                    <strong>
                      {round(total)} <small>kcal</small>
                    </strong>
                  </div>
                  <div>
                    <span>Target</span>
                    <b>{target} kcal</b>
                    <em
                      className={
                        Math.abs(difference) <= 100
                          ? "ok"
                          : difference > 0
                            ? "over"
                            : "under"
                      }
                    >
                      {difference > 0 ? "+" : ""}
                      {difference} kcal
                    </em>
                  </div>
                </div>
                <h2 className="mini-title">Cosa hai mangiato</h2>
                <div className="diary-meals">
                  {completedMeals.length ? (
                    completedMeals.map(({ recipe, key, slot }) => (
                      <button
                        key={key}
                        onClick={() => {
                          setDayIndex(diaryDay);
                          setSelectedMealKey(key);
                          setSelected(recipe);
                        }}
                      >
                        <span>{SLOT_LABELS[slot]}</span>
                        <b>{recipe.name}</b>
                        <i>
                          {round(calc(actualIngredients(key, recipe)).kcal)}{" "}
                          kcal
                        </i>
                      </button>
                    ))
                  ) : (
                    <p>Nessun pasto registrato.</p>
                  )}
                </div>
                <h2 className="mini-title">Bevande · {coffeeCount} caffè</h2>
                <div className="quick-log">
                  {drinkOptions.map((d) => (
                    <button key={d.label} onClick={() => addDrink(diaryDay, d)}>
                      ＋ {d.label}
                    </button>
                  ))}
                </div>
                <div className="log-list">
                  {(drinks[diaryDay] || []).map((x, i) => (
                    <button
                      key={`${x.label}-${i}`}
                      onClick={() =>
                        setDrinks((v) => ({
                          ...v,
                          [diaryDay]: v[diaryDay].filter((_, n) => n !== i),
                        }))
                      }
                    >
                      <span>
                        {x.label} · {x.amount}
                      </span>
                      <b>{x.kcal} kcal ×</b>
                    </button>
                  ))}
                </div>
                <p className="safety-mini">
                  EFSA indica per adulti sani fino a 400 mg di caffeina al
                  giorno; una tazzina varia per miscela e preparazione, quindi
                  il conteggio non equivale ai mg.
                </p>
                <div className="diary-actions">
                  <button onClick={() => rebalanceRemaining(diaryDay)}>
                    Riequilibra il resto
                  </button>
                  <button onClick={() => replanNextDay(diaryDay)}>
                    Prepara domani
                  </button>
                </div>
                {replanNote && <div className="replan-note">{replanNote}</div>}
                <div className="history">
                  {days.map((d, i) => {
                    const n = [0, 1, 2, 3, 4].filter(
                      (slot) => completed[`${i}-${slot}`],
                    ).length;
                    const dayLogged = loggedTotal(i);
                    return (
                      <div key={d.label}>
                        <span>{d.label}</span>
                        <div>
                          <i style={{ width: `${(n / 5) * 100}%` }} />
                        </div>
                        <b>{dayLogged ? `${round(dayLogged)}k` : `${n}/5`}</b>
                      </div>
                    );
                  })}
                </div>
                <div className="source-card">
                  <b>Motore alimentare verificabile</b>
                  <p>
                    {STANDARD_SOURCES.length} riferimenti istituzionali ·{" "}
                    {portionOptions("Carboidrato").length} basi standard già
                    strutturate. Una giornata diversa non richiede digiuno.
                  </p>
                </div>
                <div className="links">
                  <a
                    href="https://www.crea.gov.it/-/on-line-le-linee-guida-per-una-sana-alimentazione-2018"
                    target="_blank"
                  >
                    CREA ↗
                  </a>
                  <a
                    href="https://www.efsa.europa.eu/en/topics/topic/caffeine"
                    target="_blank"
                  >
                    EFSA caffeina ↗
                  </a>
                  <a
                    href="https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition"
                    target="_blank"
                  >
                    NIDDK gonfiore ↗
                  </a>
                </div>
              </section>
            );
          })()}
      </section>
      <nav className="bottom-nav five" aria-label="Navigazione principale">
        {[
          ["today", "⌂", "Oggi"],
          ["week", "▦", "Settimana"],
          ["library", "≡", "Ricette"],
          ["builder", "＋", "Componi"],
          ["progress", "◔", "Progressi"],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setSwapTarget(null);
              setWeekEditingDay(null);
              setTab(id as Tab);
              scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <i>{icon}</i>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {partPicker && (
        <div className="modal-backdrop" onClick={() => setPartPicker(null)}>
          <article
            className="part-picker-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <span>CAMBIA UNA PARTE</span>
                <h2>{partPicker.part.label || partPicker.part.food}</h2>
              </div>
              <button
                type="button"
                aria-label="Chiudi alternative"
                onClick={() => setPartPicker(null)}
              >
                ×
              </button>
            </header>
            <div className="part-picker-scroll">
              <button className="remove-part-choice" onClick={removeMealPart}>
                − Nessuno · togli questo elemento
              </button>
              <details className="picker-group complete-meals" open>
                <summary>Piatti completi consigliati</summary>
                <p>Sostituisci l'intero pasto. Dopo puoi tenerlo unico o dividerlo nei suoi componenti.</p>
                <div className="complete-meal-grid">
                  {completeMealOptions(partPicker.key).map((recipe) => {
                    const macros = calc(recipe.ingredients);
                    return (
                      <article key={recipe.id}>
                        <button
                          className="complete-meal-select"
                          onClick={() => chooseCompleteMeal(recipe)}
                        >
                          <img src={recipe.image} alt={recipe.name} />
                          <span>{recipe.name}</span>
                          <b>{round(macros.kcal)} kcal · {recipe.time} min</b>
                          <strong>Scegli questo piatto</strong>
                        </button>
                        <button
                          className="complete-meal-info"
                          aria-label={"Vedi ricetta " + recipe.name}
                          title="Vedi ingredienti e preparazione"
                          onClick={() => {
                            setSelectedMealKey(null);
                            setSelected(recipe);
                          }}
                        >
                          i
                        </button>
                      </article>
                    );
                  })}
                </div>
              </details>
              <details className="picker-group" open>
                <summary>Alternative consigliate</summary>
                <div className="part-choice-grid">
                  {recommendedPartOptions(
                    { ...partPicker.part, category: partPicker.role },
                    partPicker.key,
                  ).map((option) => {
                    const adjusted = equivalentPart(
                      option,
                      partPicker.part,
                      partPicker.role,
                    );
                    return (
                      <button
                        className={
                          option.food === partPicker.part.food ? "selected" : ""
                        }
                        key={option.food}
                        onClick={() => chooseMealPart(adjusted, true)}
                      >
                        <img src={option.image} alt={option.label || option.food} />
                        <span>{option.label || option.food}</span>
                        <b>
                          {adjusted.grams} g · {round(calc([adjusted]).kcal)} kcal
                        </b>
                      </button>
                    );
                  })}
                </div>
              </details>
              <details className="picker-group">
                <summary>Scelta libera</summary>
                <p>
                  Prima trovi le scelte più comuni per questo momento; più
                  sotto resta disponibile tutto il catalogo.
                </p>
                <div className="part-choice-grid free">
                  {orderedFreePartOptions(partPicker.role, partPicker.key).map(
                    (option) => {
                      const adjusted = equivalentPart(
                        option,
                        partPicker.part,
                        partPicker.role,
                      );
                      return (
                        <button
                          key={option.food}
                          onClick={() => chooseMealPart(adjusted, false)}
                        >
                          <img
                            src={option.image}
                            alt={option.label || option.food}
                          />
                          <span>{option.label || option.food}</span>
                          <b>
                            {adjusted.grams} g · {round(calc([adjusted]).kcal)} kcal
                          </b>
                        </button>
                      );
                    },
                  )}
                </div>
              </details>
            </div>
          </article>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <article
            className="recipe-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setSelected(null)}>
              ×
            </button>
            <img src={selected.image} alt={selected.name} />
            <div className="recipe-content">
              <span className="eyebrow">DA ZERO · {selected.time} MIN</span>
              <h2>{selected.name}</h2>
              <div className="recipe-macros">
                <span>
                  <b>{round(selectedMacros.kcal)}</b> kcal
                </span>
                <span>
                  <b>{round(selectedMacros.protein)}g</b> proteine
                </span>
                <span>
                  <b>{round(selectedMacros.carbs)}g</b> carbo
                </span>
                <span>
                  <b>{round(selectedMacros.fat)}g</b> grassi
                </span>
              </div>
              {swapTarget && !selectedMealKey && (
                <button
                  className="primary-btn recipe-preview-choose"
                  onClick={() => chooseRecipe(selected)}
                >
                  Scegli questo piatto
                </button>
              )}
              {selectedMealKey && (
                <div className="recipe-mode-actions">
                  <button
                    onClick={() => {
                      const [dayText, slotText] = selectedMealKey.split("-");
                      setSwapReturnTab(tab === "week" ? "week" : "today");
                      setSwapTarget({ day: Number(dayText), slot: Number(slotText) });
                      setSelected(null);
                      setTab("library");
                      scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    ↻ Cambia ricetta
                  </button>
                  {selected.parts?.length ? (
                    <>
                      <button
                        onClick={() => {
                          setMealView((current) => ({ ...current, [selectedMealKey]: "parts" }));
                          setSelected(null);
                        }}
                      >
                        Dividi in componenti
                      </button>
                      <button
                        onClick={() => {
                          setMealView((current) => ({ ...current, [selectedMealKey]: "parts" }));
                          setSelected(null);
                          setReplanNote("Tocca il componente che vuoi sostituire: la ricetta resta invariata nelle altre parti.");
                        }}
                      >
                        Cambia un elemento
                      </button>
                    </>
                  ) : null}
                </div>
              )}
              <h3>Ingredienti e grammi reali</h3>
              <ul className="ingredients editable">
                {selectedIngredients.map((x, i) => (
                  <li key={i}>
                    <span>{x.label || x.food}</span>
                    {selectedMealKey ? (
                      <label>
                        <input
                          aria-label={`Grammi reali ${x.food}`}
                          type="number"
                          min="0"
                          max="2000"
                          value={x.grams}
                          onChange={(e) =>
                            setActualWeights((v) => ({
                              ...v,
                              [selectedMealKey]: selectedIngredients.map(
                                (z, n) =>
                                  n === i ? Number(e.target.value) : z.grams,
                              ),
                            }))
                          }
                        />
                        <i>g</i>
                      </label>
                    ) : (
                      <b>{x.grams} g</b>
                    )}
                  </li>
                ))}
              </ul>
              {selectedMealKey && (
                <button
                  className="primary-btn"
                  onClick={() => {
                    setCompleted((v) => ({ ...v, [selectedMealKey]: true }));
                    setCompletedRecipes((v) => ({
                      ...v,
                      [selectedMealKey]: selected.id,
                    }));
                    setSelected(null);
                  }}
                >
                  ✓ Registra ciò che ho mangiato
                </button>
              )}
              <h3>Preparazione</h3>
              <ol className="steps">
                {selected.steps.map((x, i) => (
                  <li key={`${i}-${x}`}>
                    <b>{i + 1}</b>
                    <span>{x}</span>
                  </li>
                ))}
              </ol>
              <h3>Note utili</h3>
              <div className="alternatives">
                {selected.alternatives.map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
            </div>
          </article>
        </div>
      )}
      {shoppingOpen && (
        <div className="modal-backdrop" onClick={() => setShoppingOpen(false)}>
          <article
            className="shopping-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <span>LISTA DELLA SPESA</span>
                <h2>
                  {shoppingScope === "day" ? days[dayIndex].label : "Settimana"}
                </h2>
              </div>
              <button onClick={() => setShoppingOpen(false)}>×</button>
            </header>
            <div className="shopping-scope">
              <button
                className={shoppingScope === "day" ? "active" : ""}
                onClick={() => setShoppingScope("day")}
              >
                Oggi
              </button>
              <button
                className={shoppingScope === "week" ? "active" : ""}
                onClick={() => setShoppingScope("week")}
              >
                Settimana
              </button>
              <button onClick={shareShopping}>Condividi</button>
            </div>
            <div className="shopping-bulk-actions">
              <button
                onClick={() =>
                  setGroceryChecked((current) => ({
                    ...current,
                    ...Object.fromEntries(
                      shoppingItems.map((item) => [item.food, true]),
                    ),
                  }))
                }
              >
                Seleziona tutto
              </button>
              <button
                onClick={() =>
                  setGroceryChecked((current) => ({
                    ...current,
                    ...Object.fromEntries(
                      shoppingItems.map((item) => [item.food, false]),
                    ),
                  }))
                }
              >
                Deseleziona tutto
              </button>
            </div>
            <div className="shopping-list">
              {shoppingItems.map((item) => (
                <label
                  className={groceryChecked[item.food] ? "bought" : ""}
                  key={item.food}
                >
                  <input
                    type="checkbox"
                    checked={!!groceryChecked[item.food]}
                    onChange={() =>
                      setGroceryChecked((v) => ({
                        ...v,
                        [item.food]: !v[item.food],
                      }))
                    }
                  />
                  <span>{item.food}</span>
                  <input
                    aria-label={`Quantità ${item.food}`}
                    type="number"
                    min="0"
                    value={groceryAmounts[item.food] ?? item.grams}
                    onChange={(e) =>
                      setGroceryAmounts((v) => ({
                        ...v,
                        [item.food]: Number(e.target.value),
                      }))
                    }
                  />
                  <i>g</i>
                </label>
              ))}
            </div>
            <button
              className="primary-btn"
              onClick={() => setGroceryChecked({})}
            >
              Ripristina spunte
            </button>
          </article>
        </div>
      )}
    </main>
  );
}
