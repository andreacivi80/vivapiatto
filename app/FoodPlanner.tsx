"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { portionOptions, STANDARD_SOURCES } from "./nutritionEngine";

type Macro = { kcal: number; protein: number; carbs: number; fat: number };
type Food = Macro & { fiber: number; source: "CREA" | "USDA" | "ETICHETTA" };
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
};
type Day = { label: string; mood: string; recipes: string[] };
type Tab = "today" | "week" | "library" | "builder" | "progress";
type LogItem = { label: string; kcal: number; amount?: string };
const SLOT_LABELS = [
  "Colazione",
  "Spuntino mattina",
  "Pranzo",
  "Spuntino pomeriggio",
  "Cena",
];

const VERSION = "1.12.1";
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
  Miele: {
    kcal: 304,
    protein: 0.3,
    carbs: 82.4,
    fat: 0,
    fiber: 0.2,
    source: "CREA",
  },
  "Pane integrale": {
    kcal: 247,
    protein: 13,
    carbs: 41,
    fat: 4.2,
    fiber: 7,
    source: "USDA",
  },
  "Ricotta vaccina": {
    kcal: 146,
    protein: 8.8,
    carbs: 3.5,
    fat: 10.9,
    fiber: 0,
    source: "CREA",
  },
  Uovo: {
    kcal: 143,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.5,
    fiber: 0,
    source: "USDA",
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
  Carote: {
    kcal: 41,
    protein: 0.9,
    carbs: 9.6,
    fat: 0.2,
    fiber: 2.8,
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
  Peperoni: {
    kcal: 31,
    protein: 1,
    carbs: 6,
    fat: 0.3,
    fiber: 2.1,
    source: "CREA",
  },
  Cetriolo: {
    kcal: 15,
    protein: 0.7,
    carbs: 3.6,
    fat: 0.1,
    fiber: 0.5,
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
    kcal: 50,
    protein: 0.5,
    carbs: 13.1,
    fat: 0.1,
    fiber: 1.4,
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
  Nocciole: {
    kcal: 628,
    protein: 15,
    carbs: 16.7,
    fat: 60.8,
    fiber: 9.7,
    source: "CREA",
  },
  "Semi di chia": {
    kcal: 486,
    protein: 16.5,
    carbs: 42.1,
    fat: 30.7,
    fiber: 34.4,
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
  "Bistecca di manzo cotta": {
    kcal: 217,
    protein: 26,
    carbs: 0,
    fat: 12,
    fiber: 0,
    source: "USDA",
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
  "Wafer confezionati": {
    kcal: 516,
    protein: 5.4,
    carbs: 63,
    fat: 27,
    fiber: 2.5,
    source: "USDA",
  },
};

const calc = (
  ingredients: RecipeIngredient[],
  scale = 1,
): Macro & { fiber: number; weight: number } =>
  ingredients.reduce(
    (sum, item) => {
      const food = foods[item.food];
      const grams = item.grams * scale;
      const f = grams / 100;
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
      { food: "Uovo", grams: 60 },
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
      { food: "Peperoni", grams: 120 },
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
      { food: "Peperoni", grams: 100 },
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
    image: photo("snack"),
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
      { food: "Uovo", grams: 120 },
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
      { food: "Peperoni", grams: 150 },
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
  ["Uovo", "uova morbide"],
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
    cuisine: "Asiatico",
    aroma:
      "zenzero, lime e un cucchiaino di salsa di soia a ridotto contenuto di sale",
    finish: "taglio ordinato, erbe fresche e semi di zucca tostati",
  },
  {
    cuisine: "Asiatico",
    aroma: "lime, zenzero, peperoncino e coriandolo",
    finish: "verdure croccanti e una spremuta di lime",
  },
  {
    cuisine: "Asiatico",
    aroma: "curry dolce, curcuma, cumino e limone",
    finish: "spezie tostate e una cucchiaiata fresca di yogurt se gradito",
  },
  {
    cuisine: "Asiatico",
    aroma: "zenzero, aglio, peperoncino e aceto di riso",
    finish: "strisce sottili di verdura e semi tostati",
  },
  {
    cuisine: "Mediterraneo",
    aroma: "cumino, paprika affumicata, limone e menta",
    finish: "erbe fresche, limone e verdure ben colorate",
  },
  {
    cuisine: "Gourmet",
    aroma: "ras el hanout, cannella appena accennata e scorza di limone",
    finish: "contrasto caldo-fresco e impiattamento a mezzaluna",
  },
  {
    cuisine: "Gourmet",
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
    cuisine: "Gourmet",
    aroma: "aneto, scorza di limone, pepe e aceto delicato",
    finish: "linee pulite, verdure croccanti e ciuffi di aneto",
  },
  {
    cuisine: "Vegetale",
    aroma: "paprika, cumino, limone ed erbe miste",
    finish: "molti colori, consistenze diverse e semi tostati",
  },
  {
    cuisine: "Gourmet",
    aroma: "lime, peperoncino dolce, coriandolo e cipolla marinata",
    finish: "colori netti e una finitura fresca e acidula",
  },
  {
    cuisine: "Gourmet",
    aroma: "lime, aglio, paprika e prezzemolo",
    finish: "base compatta e verdure vivaci disposte a spicchi",
  },
  {
    cuisine: "Asiatico",
    aroma: "lime, zenzero, menta e coriandolo",
    finish: "erbe fresche, verdure sottili e parte calda separata",
  },
  {
    cuisine: "Asiatico",
    aroma: "curcuma, zenzero, lime e peperoncino",
    finish: "contrasto dorato e verde con lime a lato",
  },
  {
    cuisine: "Mediterraneo",
    aroma: "cumino, sommacco, menta e limone",
    finish: "erbe, spezie rosse e ingredienti disposti a ventaglio",
  },
  {
    cuisine: "Gourmet",
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
    cuisine: "Gourmet",
    aroma: "lime, pimento, timo e peperoncino",
    finish: "colori tropicali e una finitura fresca",
  },
  {
    cuisine: "Gourmet",
    aroma: "timo, senape delicata, limone e pepe",
    finish: "porzione raccolta, salsa leggera e verdure in altezza",
  },
  {
    cuisine: "Gourmet",
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
    protein[0] === "Uovo"
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
              : protein[0] === "Uovo"
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
              : protein[0] === "Uovo"
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
const snackNuts = ["Noci", "Mandorle", "Pistacchi", "Nocciole"];
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
    cuisine: "Gourmet",
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
      { food: "Uovo", grams: 50 },
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
        food: "Uovo",
        grams: 50,
        label: "1 uovo medio",
        image: photo("part-eggs-scrambled-v8"),
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
    image: photo("fruit-breakfast-v2"),
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
        image: photo("fruit-breakfast-v2"),
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
];
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
        image: photo("work-cotto-v5"),
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
    name: "Pane e fesa di tacchino",
    kicker: "Due ingredienti, zero cucina",
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
        image: photo("work-turkey-v5"),
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
      "Pesa pane e fesa di tacchino.",
      "Aggiungi i pomodorini lavati in un contenitore separato.",
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
      { food: "Uovo", grams: 120 },
      { food: "Pane integrale", grams: 90 },
      { food: "Pomodorini", grams: 150 },
    ],
    parts: [
      {
        category: "Proteina",
        food: "Uovo",
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
      { food: "Bistecca di manzo cotta", grams: 150 },
      { food: "Patate lesse", grams: 250 },
      { food: "Olio extravergine", grams: 8 },
    ],
    parts: [
      {
        category: "Proteina",
        food: "Bistecca di manzo cotta",
        grams: 150,
        label: "Bistecca ai ferri",
        image: photo("part-steak-grilled-v7"),
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
      "Cuoci la bistecca su piastra ben calda fino al grado di cottura sicuro e preferito.",
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
      { food: "Bistecca di manzo cotta", grams: 100 },
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
        food: "Bistecca di manzo cotta",
        grams: 100,
        label: "Bistecca ai ferri",
        image: photo("part-steak-grilled-v7"),
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
      "Scalda bene la piastra e cuoci la bistecca al grado di cottura desiderato e sicuro.",
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
    image: photo("simple-eggs-v5"),
    time: 25,
    ingredients: [
      { food: "Patate lesse", grams: 200 },
      { food: "Uovo", grams: 100 },
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
        food: "Uovo",
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
    image: photo("part-rice-basmati-v7"),
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
];
const mealPartOptions: Record<MealPart["category"], MealPart[]> = {
  Carboidrato: [
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
  ],
  Proteina: [
    {
      category: "Proteina",
      food: "Bistecca di manzo cotta",
      grams: 100,
      label: "Bistecca",
      image: photo("part-steak-grilled-v7"),
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
      food: "Uovo",
      grams: 100,
      label: "Due uova",
      image: photo("part-eggs-boiled-v7"),
    },
    {
      category: "Proteina",
      food: "Fesa di tacchino",
      grams: 100,
      label: "Fesa di tacchino",
      image: photo("work-turkey-v5"),
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
      image: photo("work-cotto-v5"),
    },
    {
      category: "Proteina",
      food: "Feta",
      grams: 50,
      label: "Feta · 50 g",
      image: photo("part-feta-v111"),
    },
  ],
  Contorno: [
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
      food: "Carote",
      grams: 200,
      label: "Carote",
      image: photo("part-carrots-v8"),
    },
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
  ],
  Latticino: [
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
      food: "Ricotta vaccina",
      grams: 50,
      label: "Ricotta",
      image: photo("part-ricotta-v7"),
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
      food: "Crema cacao e nocciole",
      grams: 15,
      label: "Crema cacao e nocciole",
      image: photo("part-chocolate-hazelnut-spread-v9"),
    },
  ],
};

const recommendedPartOptions = (part: MealPart, key: string) => {
  const slot = Number(key.split("-")[1]);
  const options = mealPartOptions[part.category];
  if (slot === 0) {
    if (part.category === "Latticino") {
      const breakfastDairyOrder = [
        "Latte parzialmente scremato",
        "Bevanda di soia senza zucchero",
        "Bevanda d'avena senza zucchero",
        "Yogurt greco 2%",
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
          "Grissini",
          "Pane integrale",
        ].includes(x.food),
      );
    if (part.category === "Extra")
      return options.filter((x) =>
        [
          "Confettura di frutta",
          "Miele",
          "Burro",
          "Noci",
          "Mandorle",
          "Crema cacao e nocciole",
          "Caffè senza zucchero",
        ].includes(x.food),
      );
    return options;
  }
  if (slot === 1 || slot === 3) {
    if (part.category === "Latticino")
      return options.filter((x) => x.food === "Yogurt greco 2%");
    if (part.category === "Carboidrato")
      return options.filter((x) =>
        [
          "Fette biscottate integrali",
          "Biscotti secchi",
          "Cracker integrali",
          "Grissini",
        ].includes(x.food),
      );
    if (part.category === "Proteina") return [];
  }
  if ((slot === 2 || slot === 4) && part.category === "Carboidrato")
    return options.filter(
      (x) =>
        !["Fette biscottate integrali", "Biscotti secchi"].includes(x.food),
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
    .flatMap((category) => mealPartOptions[category]);
};

const equivalentPart = (option: MealPart, current: MealPart, role: MealPart["category"]) => {
  if (option.category !== role || current.grams <= 0) return option;
  const targetKcal = calc([current]).kcal;
  const kcalPerGram = foods[option.food]?.kcal / 100;
  if (!kcalPerGram || targetKcal <= 0) return option;
  const step = role === "Contorno" ? 25 : role === "Frutta" ? 25 : 10;
  const minimum = role === "Contorno" ? 50 : role === "Extra" ? 5 : 20;
  const maximum = role === "Contorno" ? 400 : role === "Frutta" ? 300 : 250;
  const grams = Math.max(
    minimum,
    Math.min(maximum, Math.round(targetKcal / kcalPerGram / step) * step),
  );
  return { ...option, grams };
};

const rotationBreakfastCarbs = mealPartOptions.Carboidrato.filter((part) =>
  [
    "Fette biscottate integrali",
    "Biscotti secchi",
    "Cracker integrali",
    "Grissini",
    "Pane integrale",
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
      "Crema cacao e nocciole",
    ].includes(part.food),
);
const portableSnackDairy = mealPartOptions.Latticino.filter(
  (part) => part.food === "Yogurt greco 2%",
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

const catalogSnacks: Recipe[] = Array.from({ length: 30 }, (_, index) => {
  const fruit = mealPartOptions.Frutta[index % mealPartOptions.Frutta.length];
  const companion =
    index % 3 === 0
      ? portableSnackDairy[index % portableSnackDairy.length]
      : index % 3 === 1
        ? rotationBreakfastExtras[index % rotationBreakfastExtras.length]
        : rotationBreakfastCarbs[index % rotationBreakfastCarbs.length];
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

const rotationMainCarbs = mealPartOptions.Carboidrato.filter(
  (part) =>
    ![
      "Fette biscottate integrali",
      "Biscotti secchi",
      "Farina d'avena",
      "Farina di frumento integrale",
      "Farina di grano saraceno",
    ].includes(part.food),
);
const rotationMainExtras = mealPartOptions.Extra.filter((part) =>
  ["Olio extravergine", "Grana Padano DOP"].includes(part.food),
);
const catalogMains: Recipe[] = Array.from({ length: 84 }, (_, index) => {
  const parts = [
    rotationMainCarbs[index % rotationMainCarbs.length],
    mealPartOptions.Proteina[index % mealPartOptions.Proteina.length],
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
        food: "Bistecca di manzo cotta",
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
        food: "Bistecca di manzo cotta",
        grams: 100,
        label: "Hamburger di manzo",
        image: photo("part-steak-grilled-v7"),
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
      "dinner-three-italian",
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
      "salmon",
    ],
  },
  {
    label: "Giorno 3",
    mood: "Energia stabile",
    recipes: [
      "breakfast-crackers-ricotta",
      "catalog-snack-5",
      "work-cotto",
      "catalog-snack-6",
      "dinner-three-eggs",
    ],
  },
  {
    label: "Giorno 4",
    mood: "Mediterraneo",
    recipes: [
      "breakfast-rusks-butter",
      "catalog-snack-7",
      "simple-pasta-tomato",
      "catalog-snack-8",
      "lentil-quinoa",
    ],
  },
  {
    label: "Giorno 5",
    mood: "Veloce ma completo",
    recipes: [
      "breakfast-rusks-jam",
      "catalog-snack-9",
      "work-turkey",
      "catalog-snack-10",
      "eggs-quinoa",
    ],
  },
  {
    label: "Giorno 6",
    mood: "Più movimento",
    recipes: [
      "jar",
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
      "catalog-snack-13",
      "lentil-quinoa",
      "catalog-snack-14",
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
  const lastInteractionRef = useRef(Date.now());
  updateBlockedRef.current = Boolean(
    selected ||
      partPicker ||
      preferencesOpen ||
      checkinOpen ||
      shoppingOpen ||
      weekEditingDay !== null,
  );

  useEffect(() => {
    const rememberInteraction = () => {
      lastInteractionRef.current = Date.now();
    };
    window.addEventListener("pointerdown", rememberInteraction, true);
    window.addEventListener("keydown", rememberInteraction, true);
    window.addEventListener("input", rememberInteraction, true);
    return () => {
      window.removeEventListener("pointerdown", rememberInteraction, true);
      window.removeEventListener("keydown", rememberInteraction, true);
      window.removeEventListener("input", rememberInteraction, true);
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let updateWaiting = false;
    const applyWhenSafe = () => {
      if (
        !disposed &&
        updateWaiting &&
        !updateBlockedRef.current &&
        Date.now() - lastInteractionRef.current > 3000
      ) {
        window.location.reload();
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
    const versionTimer = window.setInterval(checkVersion, 15000);
    const safeTimer = window.setInterval(applyWhenSafe, 1000);
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
      }
    } catch {}
  }, []);
  useEffect(() => {
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
  ]);
  const groupFoods: Record<string, string[]> = {
    Latte: ["Yogurt greco 2%", "Ricotta vaccina", "Feta"],
    Uova: ["Uovo"],
    Pesce: ["Salmone cotto", "Tonno al naturale sgocciolato"],
    Glutine: [
      "Pane integrale",
      "Farro cotto",
      "Cous cous integrale cotto",
      "Orzo perlato cotto",
    ],
    "Frutta a guscio": ["Noci", "Mandorle", "Pistacchi", "Nocciole"],
  };
  const blockedFoods = [
    ...dislikedFoods,
    ...excludedGroups.flatMap((g) => groupFoods[g] || []),
  ];
  const isAllowed = (recipe: Recipe) =>
    recipe.ingredients.every((i) => !blockedFoods.includes(i.food));
  const availableBreakfasts = () =>
    [
      ...simpleBreakfasts,
      ...(dayContext === "Casa" ? matrixBreakfasts : []),
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
  const fitsSlot = (r: Recipe, slot: number) =>
    slot === 0
      ? recipeCourse(r) === "Colazione"
      : [1, 3].includes(slot)
        ? ["Spuntino", "Dolce", "Gelato"].includes(recipeCourse(r))
        : ["Piatto unico", "Primo", "Secondo"].includes(recipeCourse(r));
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
  const compatibleWithPlace = (r: Recipe) => {
    if (!swapTarget || dayContext !== "Lavoro") return true;
    if (swapTarget.slot === 2)
      return (
        portableRecipes.some((x) => x.id === r.id) &&
        calc(r.ingredients).protein >= 18
      );
    if (swapTarget.slot === 4)
      return balancedDinnerRecipes.some((x) => x.id === r.id);
    return true;
  };
  const filteredRecipes = allRecipes.filter(
    (r) =>
      isAllowed(r) &&
      compatibleWithSlot(r) &&
      compatibleWithPlace(r) &&
      (cuisineFilter === "Tutte" || recipeCuisine(r) === cuisineFilter) &&
      r.name.toLowerCase().includes(libraryQuery.toLowerCase()),
  );
  const replanFollowingDays = (changedDay: number) => {
    if (weekLocked) return;
    const breakfasts = availableBreakfasts();
    const snacks = [...quickSnacks, ...catalogSnacks].filter(isAllowed);
    const mains = allRecipes.filter(
      (r) =>
        isAllowed(r) &&
        recipeCuisine(r) === cuisineChoice &&
        ["Piatto unico", "Primo", "Secondo"].includes(recipeCourse(r)),
    );
    const lunches =
      dayContext === "Lavoro"
        ? [...portableRecipes, ...catalogWorkMains].filter(isAllowed)
        : mains;
    const dinners = [...balancedDinnerRecipes, ...catalogMains].filter(isAllowed);
    if (!breakfasts.length || !snacks.length || !lunches.length || !dinners.length)
      return;
    setChoices((current) => {
      const next = { ...current };
      for (let day = changedDay + 1; day < days.length; day += 1) {
        const pools = [breakfasts, snacks, lunches, snacks, dinners];
        pools.forEach((pool, slot) => {
          const key = `${day}-${slot}`;
          if (!completed[key]) next[key] = pool[(day * 3 + slot) % pool.length].id;
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
      calories >= 2400
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

  const additionAsPart = (item: RecipeIngredient): MealPart => {
    const category: MealPart["category"] =
      item.food === "Pane integrale"
        ? "Carboidrato"
        : ["Mela", "Banana"].includes(item.food)
          ? "Frutta"
          : item.food === "Yogurt greco 2%"
            ? "Latticino"
            : "Extra";
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
    if (!recipe.parts) return [];
    if (partSelections[key]) return partSelections[key];
    const slot = Number(key.split("-")[1]);
    const existingFoods = new Set(recipe.parts.map((part) => part.food));
    const additions = targetAdditionsFor(slot)
      .filter((item) => !existingFoods.has(item.food))
      .map(additionAsPart);
    return [...recipe.parts, ...additions];
  };

  const plannedIngredients = (key: string, recipe: Recipe) => {
    const slot = Number(key.split("-")[1]);
    const targetAdditions = targetAdditionsFor(slot);
    if (!recipe.parts) return [...recipe.ingredients, ...targetAdditions];
    const activeParts = activeMealParts(key, recipe);
    const pastaSelected = activeParts.some((x) => x.food.includes("Pasta"));
    const extras = recipe.ingredients.filter(
      (x) =>
        !recipe.parts?.some((p) => p.food === x.food) &&
        (x.food === "Olio extravergine" ||
          (pastaSelected && x.food === "Passata di pomodoro")),
    );
    return [...activeParts, ...extras];
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
          };
        },
        {
          kcal: plannedDrinkMacros.kcal,
          protein: plannedDrinkMacros.protein,
          carbs: plannedDrinkMacros.carbs,
          fat: plannedDrinkMacros.fat,
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
  const keepRecordedChoice = (
    current: Record<string, string>,
    slot: number,
    nextId: string,
  ) => {
    const key = `${dayIndex}-${slot}`;
    return completed[key] ? current[key] || getDayIds(dayIndex)[slot] : nextId;
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
    const snacks = [...quickSnacks, ...catalogSnacks].filter(isAllowed);
    const mains = styled.filter((r) =>
      ["Piatto unico", "Primo", "Secondo"].includes(recipeCourse(r)),
    );
    const homeMains = mains.filter(
      (r) =>
        r.time >= 20 &&
        !portableRecipes.some((portable) => portable.id === r.id),
    );
    const lunches =
      dayContext === "Lavoro"
        ? [...portableRecipes, ...catalogWorkMains]
            .filter(isAllowed)
            .filter((r) => calc(r.ingredients).protein >= 18)
        : homeMains.length
          ? homeMains
          : mains;
    const dinners =
      dayContext === "Lavoro"
        ? [...balancedDinnerRecipes, ...catalogMains].filter(isAllowed)
        : (homeMains.length ? homeMains : mains).filter(
            (r) => r.id !== "sweet-ricotta",
          );
    if (
      !breakfasts.length ||
      !snacks.length ||
      !mains.length ||
      !lunches.length ||
      !dinners.length
    )
      return;
    setChoices((v) => ({
      ...v,
      [`${dayIndex}-0`]: keepRecordedChoice(
        v,
        0,
        breakfasts[(dayIndex + profileSeed) % breakfasts.length].id,
      ),
      [`${dayIndex}-1`]: keepRecordedChoice(
        v,
        1,
        snacks[(dayIndex + profileSeed) % snacks.length].id,
      ),
      [`${dayIndex}-2`]: keepRecordedChoice(
        v,
        2,
        lunches[(dayIndex * 2 + profileSeed) % lunches.length].id,
      ),
      [`${dayIndex}-3`]: keepRecordedChoice(
        v,
        3,
        snacks[(dayIndex + profileSeed + 1) % snacks.length].id,
      ),
      [`${dayIndex}-4`]: keepRecordedChoice(
        v,
        4,
        dinners[(dayIndex * 2 + profileSeed + 1) % dinners.length].id,
      ),
    }));
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
    let snacks = [...quickSnacks, ...catalogSnacks].filter(isAllowed);
    let mains = allRecipes.filter(
      (r) =>
        isAllowed(r) &&
        recipeCuisine(r) === cuisineChoice &&
        ["Piatto unico", "Primo", "Secondo"].includes(recipeCourse(r)),
    );
    if (next.feeling === "gonfio") {
      mains = mains
        .filter(
          (r) =>
            !r.ingredients.some((i) =>
              ["Ceci cotti", "Lenticchie cotte"].includes(i.food),
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
        ? [...portableRecipes, ...catalogWorkMains]
            .filter(isAllowed)
            .filter((r) => calc(r.ingredients).protein >= 18)
        : homeMains.length
          ? homeMains
          : mains;
    const dinners =
      dayContext === "Lavoro"
        ? [...balancedDinnerRecipes, ...catalogMains].filter(isAllowed)
        : (homeMains.length ? homeMains : mains).filter(
            (r) => r.id !== "sweet-ricotta",
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
    applyCuisine();
  }, [goal, calories, cuisineChoice, dayContext, plannedDrink]);
  const addDrink = (day: number, item: LogItem) =>
    setDrinks((v) => ({ ...v, [day]: [...(v[day] || []), item] }));
  const addExtra = (day = diaryDay) => {
    if (!extraName.trim()) return;
    const match = Object.keys(foods).find(
      (food) => food.toLowerCase() === extraName.trim().toLowerCase(),
    );
    const grams = Math.max(0, Number(extraGrams) || 0);
    if (!match || !grams) {
      setReplanNote("Scegli un alimento suggerito e indica i grammi.");
      return;
    }
    const kcal = round((foods[match].kcal * grams) / 100);
    setExtras((v) => ({
      ...v,
      [day]: [
        ...(v[day] || []),
        { label: `${match} · ${grams} g`, kcal },
      ],
    }));
    setExtraName("");
    setExtraGrams("50");
  };
  const dayScale = (_day: number) => 1;
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
      Legumi: 0,
    };
    days.forEach((_, day) => {
      getDayIds(day).forEach((id, slot) => {
        const key = `${day}-${slot}`;
        if (!completed[key]) return;
        const recipe = recipeMap[completedRecipes[key] || id];
        const names = actualIngredients(key, recipe).map((item) => item.food);
        const has = (terms: string[]) =>
          names.some((name) =>
            terms.some((term) => name.toLowerCase().includes(term)),
          );
        if (has(["salmone", "tonno", "merluzzo", "orata", "pesce"]))
          counts.Pesce += 1;
        if (has(["pollo", "tacchino", "coniglio"])) counts["Carne bianca"] += 1;
        if (has(["manzo", "bistecca", "vitello"])) counts["Carne rossa"] += 1;
        if (has(["uovo"])) counts.Uova += 1;
        if (has(["ceci", "lenticchie", "fagioli", "piselli", "legumi"]))
          counts.Legumi += 1;
      });
    });
    return counts;
  };
  const weeklyCounts = weeklyProteinCounts();
  const weeklyTargets = [
    { label: "Pesce", target: "2–3", count: weeklyCounts.Pesce },
    {
      label: "Carne bianca",
      target: "1–3",
      count: weeklyCounts["Carne bianca"],
    },
    { label: "Carne rossa", target: "1–2", count: weeklyCounts["Carne rossa"] },
    { label: "Uova", target: "2–4", count: weeklyCounts.Uova },
    { label: "Legumi", target: "2–3", count: weeklyCounts.Legumi },
  ];
  const replanNextDay = (day: number) => {
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
        ["Piatto unico", "Primo", "Secondo"].includes(recipeCourse(r)),
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
                <button
                  onClick={() => {
                    replanFollowingDays(weekEditingDay);
                    setWeekEditingDay(null);
                    setTab("week");
                    scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Chiudi e riequilibra
                </button>
              </section>
            )}
            <section className="today-strip">
              <div>
                <span>OGGI · {days[dayIndex].label}</span>
                <b>
                  Piano {round(dayTotals.kcal)} · scelto {calories} kcal
                </b>
                <small>
                  Target oggi {plannedCalories} · scarto {round(dayTotals.kcal - plannedCalories) > 0 ? "+" : ""}
                  {round(dayTotals.kcal - plannedCalories)} kcal
                </small>
              </div>
              <button onClick={() => setPreferencesOpen((v) => !v)}>
                ⚙ Preferenze {blockedFoods.length ? `(${blockedFoods.length})` : ""}
              </button>
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
                  const portion =
                    visibleIngredients.length === 1
                      ? `${round(visibleIngredients[0].grams)} g porzione · `
                      : "";
                  const activeParts = activeMealParts(key, r);
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
                      className={`meal-card ${r.parts ? "composed" : "detailed"} ${allowed ? "" : "blocked"} ${caution ? "caution" : ""}`}
                      key={key}
                      onClick={() => {
                        setSelectedMealKey(key);
                        setSelected(r);
                      }}
                    >
                      {!r.parts && <img src={r.image} alt={r.name} />}
                      <div className="meal-body">
                        <span>{SLOT_LABELS[i]}</span>
                        <h3>
                          {r.parts
                            ? `${SLOT_LABELS[i]} · ${
                                activeParts
                                  .filter((part) => part.grams > 0)
                                  .map((part) => part.label || part.food)
                                  .join(", ") || "nessun elemento"
                              }`
                            : r.name}
                        </h3>
                        {r.parts ? (
                          <>
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
                                : `${portion}${round(m.kcal)} kcal · ${round(m.protein)} g proteine · ${r.time} min`
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
              <details className="today-extra">
                <summary>＋ Aggiungi extra o alimento diverso</summary>
                <div className="extra-form">
                  <input
                    placeholder="Scrivi pane, cracker, dolce…"
                    list="food-suggestions"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                  />
                  <datalist id="food-suggestions">
                    {Object.keys(foods).map((food) => (
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
                      <span>{x.label}</span>
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
                      : "Settimana confermata: le modifiche giornaliere non cambieranno il resto.",
                  );
                }}
              >
                {weekLocked ? "Riapri" : "Conferma"}
              </button>
            </section>
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
                <b>Rotazione registrata</b>
                <span>porzioni · riferimento CREA</span>
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
                                    role:
                                      r.parts?.[partIndex]?.category ||
                                      part.category,
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
                <button onClick={() => chooseRecipe(filteredRecipes[0])}>
                  {swapTarget ? "Scegli" : "Apri"}
                </button>
              </div>
            )}
            <div className="recipe-grid">
              {filteredRecipes.map((r) => {
                const m = calc(r.ingredients);
                return (
                  <article key={r.id} onClick={() => chooseRecipe(r)}>
                    <img src={r.image} alt={r.name} />
                    <div>
                      <span>
                        {r.course || recipeCuisine(r)} · {round(m.kcal)} kcal ·{" "}
                        {r.time} min
                      </span>
                      <h3>{r.name}</h3>
                      <p>{r.kicker}</p>
                    </div>
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
              <h3>Alternative</h3>
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
