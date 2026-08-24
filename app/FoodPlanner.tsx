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
  sourceLabel?: string;
  sourceUrl?: string;
  allergens?: string[];
  tags?: string[];
  seasonMonths?: number[];
  methods?: string[];
  difficulty?: "Facile" | "Media" | "Impegnativa";
};
type Day = { label: string; mood: string; recipes: string[] };

const RecipeVisual = ({ recipe }: { recipe: Recipe }) => {
  const componentPhotos = (recipe.parts || [])
    .filter((part) => part.grams > 0)
    .slice(0, 4);
  if (componentPhotos.length < 2) {
    return <img className="recipe-visual-single" src={recipe.image} alt={recipe.name} />;
  }
  return (
    <div
      className={`recipe-visual-parts recipe-visual-count-${componentPhotos.length}`}
      role="img"
      aria-label={`Componenti di ${recipe.name}`}
    >
      {componentPhotos.map((part, index) => (
        <img
          key={`${part.food}-${index}`}
          src={part.image}
          alt={part.label || part.food}
        />
      ))}
    </div>
  );
};
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
  image?: string;
  allergens?: string[];
};
const SLOT_LABELS = [
  "Colazione",
  "Spuntino mattina",
  "Pranzo",
  "Spuntino pomeriggio",
  "Cena",
];

const VERSION = "1.18.38";
const isNewerRelease = (candidate: string, current: string) => {
  const candidateParts = candidate.split(".").map(Number);
  const currentParts = current.split(".").map(Number);
  if (
    candidateParts.some((part) => !Number.isFinite(part)) ||
    currentParts.some((part) => !Number.isFinite(part))
  ) return false;
  const length = Math.max(candidateParts.length, currentParts.length);
  for (let index = 0; index < length; index += 1) {
    const next = candidateParts[index] || 0;
    const active = currentParts[index] || 0;
    if (next !== active) return next > active;
  }
  return false;
};
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
  { label: "Acqua naturale", kcal: 0, amount: "500 ml", image: photo("part-water-still-v11673") },
  { label: "Acqua frizzante", kcal: 0, amount: "500 ml", image: photo("part-water-sparkling-v11673") },
  { label: "Caffè senza zucchero", kcal: 2, amount: "1 tazzina · 30 ml", image: photo("part-coffee-v8") },
  { label: "Caffè decaffeinato senza zucchero", kcal: 2, amount: "1 tazzina · 30 ml", image: photo("part-coffee-decaf-v11673") },
  { label: "Caffè d'orzo senza zucchero", kcal: 7, amount: "1 tazza · 120 ml", image: photo("part-barley-coffee-v11673") },
  { label: "Tè verde senza zucchero", kcal: 2, amount: "1 tazza · 250 ml", image: photo("part-green-tea-v11673") },
  { label: "Tè nero senza zucchero", kcal: 2, amount: "1 tazza · 250 ml", image: photo("part-black-tea-v11673") },
  { label: "Tè deteinato senza zucchero", kcal: 2, amount: "1 tazza · 250 ml", image: photo("part-decaf-tea-v11673") },
  { label: "Tisana senza zucchero", kcal: 2, amount: "1 tazza · 250 ml", image: photo("part-herbal-tea-v11673") },
  { label: "Acqua aromatizzata al limone", kcal: 0, amount: "500 ml · senza zucchero", image: photo("part-lemon-water-v11673") },
  { label: "Acqua aromatizzata al cetriolo", kcal: 0, amount: "500 ml · senza zucchero", image: photo("part-cucumber-water-v11673") },
  { label: "Acqua aromatizzata alla menta", kcal: 0, amount: "500 ml · senza zucchero", image: photo("part-mint-water-v11673") },
  { label: "Coca-Cola Zero", kcal: 0, amount: "330 ml", image: photo("part-cola-zero-v11673") },
  { label: "Gassata zero", kcal: 0, amount: "330 ml", image: photo("part-zero-soda-v11673") },
  { label: "Bibita zuccherata", kcal: 140, amount: "330 ml", image: photo("part-sugary-soda-v11673") },
  { label: "Vino bianco", kcal: 102, amount: "1 bicchiere · 125 ml", image: photo("part-white-wine-v11673") },
  { label: "Vino rosso", kcal: 106, amount: "1 bicchiere · 125 ml", image: photo("part-red-wine-v11673") },
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
  "Tonno fresco cotto": {
    kcal: 184,
    protein: 29.9,
    carbs: 0,
    fat: 6.3,
    fiber: 0,
    source: "USDA",
  },
  "Porro cotto": {
    kcal: 31,
    protein: 0.8,
    carbs: 7.6,
    fat: 0.2,
    fiber: 1,
    source: "USDA",
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
  "Vermicelli di patata dolce cotti": {
    kcal: 84,
    protein: 0.1,
    carbs: 20.5,
    fat: 0.1,
    fiber: 0.7,
    source: "ETICHETTA",
  },
  "Erba cipollina fresca": {
    kcal: 30,
    protein: 3.3,
    carbs: 4.4,
    fat: 0.7,
    fiber: 2.5,
    source: "USDA",
  },
  Lime: {
    kcal: 30,
    protein: 0.7,
    carbs: 10.5,
    fat: 0.2,
    fiber: 2.8,
    source: "USDA",
  },
  "Salsa di tamarindo": {
    kcal: 70,
    protein: 0.5,
    carbs: 17,
    fat: 0.1,
    fiber: 1,
    source: "ETICHETTA",
  },
  "Olio di arachidi": {
    kcal: 900,
    protein: 0,
    carbs: 0,
    fat: 100,
    fiber: 0,
    source: "ETICHETTA",
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
  "Fagioli neri cotti": {
    kcal: 132,
    protein: 8.9,
    carbs: 23.7,
    fat: 0.5,
    fiber: 8.7,
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
  "Petto di tacchino al forno": { kcal: 135, protein: 29, carbs: 0, fat: 1.8, fiber: 0, source: "USDA" },
  "Formaggio fresco magro": { kcal: 150, protein: 9, carbs: 4, fat: 10.5, fiber: 0, source: "ETICHETTA" },
  "Succo di limone": { kcal: 22, protein: 0.4, carbs: 6.9, fat: 0.2, fiber: 0.3, source: "USDA" },
  "Aceto di vino": { kcal: 18, protein: 0, carbs: 0.6, fat: 0, fiber: 0, source: "USDA" },
  "Aceto balsamico": { kcal: 88, protein: 0.5, carbs: 17, fat: 0, fiber: 0, source: "USDA" },
  "Sale iodato": { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, source: "ETICHETTA" },
  "Passato di verdure": { kcal: 35, protein: 1.5, carbs: 6, fat: 0.5, fiber: 2, source: "RICETTA CALCOLATA" },
  "Vellutata di verdure senza panna": { kcal: 42, protein: 1.6, carbs: 7.5, fat: 0.7, fiber: 2.2, source: "RICETTA CALCOLATA" },
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
  "Uova alla coque": {
    kcal: 128,
    protein: 12.4,
    carbs: 0,
    fat: 8.7,
    fiber: 0,
    source: "CREA",
  },
  "Latte scremato": {
    kcal: 34,
    protein: 3.4,
    carbs: 5,
    fat: 0.1,
    fiber: 0,
    source: "USDA",
  },
  "Petto di pollo alla griglia": {
    kcal: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    source: "USDA",
  },
  "Petto di pollo lesso": {
    kcal: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    source: "USDA",
  },
  "Petto di pollo al vapore": {
    kcal: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    source: "USDA",
  },
  "Roast beef magro": {
    kcal: 149,
    protein: 26.5,
    carbs: 0,
    fat: 4.3,
    fiber: 0,
    source: "USDA",
  },
  "Carpaccio di manzo · peso a crudo": {
    kcal: 110,
    protein: 21.4,
    carbs: 0,
    fat: 2.6,
    fiber: 0,
    source: "CREA",
  },
  "Latte senza lattosio parzialmente scremato": {
    kcal: 46,
    protein: 3.3,
    carbs: 4.9,
    fat: 1.6,
    fiber: 0,
    source: "ETICHETTA",
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
  "Patate al vapore": {
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
  "Bevanda di mandorla senza zucchero": {
    kcal: 15,
    protein: 0.6,
    carbs: 0.3,
    fat: 1.2,
    fiber: 0.2,
    source: "ETICHETTA",
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
foods["Edamame cotti"] = {
  kcal: 121,
  protein: 11.9,
  carbs: 8.9,
  fat: 5.2,
  fiber: 5.2,
  source: "USDA",
};

foods["Uovo in camicia"] = {
  kcal: 143,
  protein: 12.6,
  carbs: 0.7,
  fat: 9.5,
  fiber: 0,
  source: "USDA",
};

foods["Yogurt bianco"] = {
  kcal: 63,
  protein: 5.3,
  carbs: 7,
  fat: 1.6,
  fiber: 0,
  source: "USDA",
};

foods["Crema 100% mandorle"] = {
  kcal: 614,
  protein: 21.1,
  carbs: 18.8,
  fat: 55.5,
  fiber: 10.3,
  source: "USDA",
};

foods["Semi di girasole"] = {
  kcal: 584,
  protein: 20.8,
  carbs: 20,
  fat: 51.5,
  fiber: 8.6,
  source: "USDA",
};

foods["Prugne fresche"] = {
  kcal: 46,
  protein: 0.7,
  carbs: 11.4,
  fat: 0.3,
  fiber: 1.4,
  source: "USDA",
};

foods["Lamponi"] = {
  kcal: 52,
  protein: 1.2,
  carbs: 11.9,
  fat: 0.7,
  fiber: 6.5,
  source: "USDA",
};

foods["Pasta di farro secca"] = {
  kcal: 348,
  protein: 14.6,
  carbs: 67.9,
  fat: 2.4,
  fiber: 6.8,
  source: "USDA",
};

foods["Sgombro al naturale sgocciolato"] = {
  kcal: 194,
  protein: 18.6,
  carbs: 0,
  fat: 13.9,
  fiber: 0,
  source: "USDA",
};

foods["Fagioli rossi cotti"] = {
  kcal: 127,
  protein: 8.7,
  carbs: 22.8,
  fat: 0.5,
  fiber: 6.4,
  source: "USDA",
};

foods["Trota cotta"] = {
  kcal: 168,
  protein: 23.8,
  carbs: 0,
  fat: 7.4,
  fiber: 0,
  source: "USDA",
};

foods["Polpo cotto"] = {
  kcal: 164,
  protein: 29.8,
  carbs: 4.4,
  fat: 2.1,
  fiber: 0,
  source: "USDA",
};

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
  ["Gelato fiordilatte",200,3.8,24,10,0,"ETICHETTA"],
  ["Gelato stracciatella",225,4.1,26,12,0.5,"ETICHETTA"],
  ["Gelato al pistacchio",240,4.5,24,14,1.2,"ETICHETTA"],
  ["Gelato alla nocciola",235,4.2,24,13,1.1,"ETICHETTA"],
  ["Gelato alla vaniglia",205,3.8,25,10,0,"ETICHETTA"],
  ["Gelato al caffe",215,3.8,26,11,0,"ETICHETTA"],
  ["Gelato alla fragola",160,2.5,29,4,1,"ETICHETTA"],
  ["Gelato al limone",145,0.5,33,1,0.5,"ETICHETTA"],
  ["Gelato al mango",160,1,34,2,1,"ETICHETTA"],
  ["Gelato allo yogurt",175,4.2,27,6,0,"ETICHETTA"],
  ["Gelato al cocco",230,3,25,14,1.5,"ETICHETTA"],
  ["Gelato al caramello",225,3.8,29,11,0,"ETICHETTA"],
  ["Gelato al tiramisu",230,4.5,27,12,0.5,"ETICHETTA"],
  ["Gelato all'amarena",180,2.8,32,5,0.7,"ETICHETTA"],
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
  ["Pizza farcita",290,13,32,13,2,"RICETTA CALCOLATA"],
  ["Pesce fritto",235,17,16,12,0.8,"RICETTA CALCOLATA"],
  ["Frittura di calamari",250,18,17,13,0.8,"RICETTA CALCOLATA"],
  ["Salatini",480,8,58,24,3,"ETICHETTA"],
  ["Toast molto farcito",310,16,28,15,1.7,"RICETTA CALCOLATA"],
  ["Tramezzini con maionese",290,11,26,16,1.3,"RICETTA CALCOLATA"],
  ["Panino con salumi e formaggi",320,17,29,16,1.7,"RICETTA CALCOLATA"],
  ["Risotto molto mantecato",190,5,26,8,1,"RICETTA CALCOLATA"],
  ["Burro in quantità abbondante",717,0.9,0.1,81.1,0,"CREA"],
  ["Salse industriali",250,1.5,15,21,0.6,"ETICHETTA"],
  ["Krapfen",380,7,48,18,1.5,"RICETTA CALCOLATA"],
  ["Pancake con creme e sciroppi",350,7,49,15,1.5,"RICETTA CALCOLATA"],
  ["Semifreddo",310,5,30,19,0.6,"RICETTA CALCOLATA"],
  ["Cassata siciliana",360,8,45,17,1,"RICETTA CALCOLATA"],
  ["Babà al rum",280,5,47,7,1,"RICETTA CALCOLATA"],
  ["Cioccolato bianco",539,5.9,59,32,0.2,"ETICHETTA"],
  ["Barrette dolci",490,7,60,25,2,"ETICHETTA"],
  ["Snack salati",500,7,57,27,4,"ETICHETTA"],
  ["Cocktail alcolici",150,0.2,15,0,0,"RICETTA CALCOLATA"],
];
const occasionalFoods: Record<string, Food> = Object.fromEntries(
  occasionalFoodRows.map(([name,kcal,protein,carbs,fat,fiber,source]) => [name,{kcal,protein,carbs,fat,fiber,source}]),
);
const foodSearchDatabase: Record<string, Food> = { ...foods, ...occasionalFoods };
const GELATO_FLAVORS = [
  "Gelato fiordilatte",
  "Gelato alla crema",
  "Gelato al cioccolato",
  "Gelato stracciatella",
  "Gelato al pistacchio",
  "Gelato alla nocciola",
  "Gelato alla vaniglia",
  "Gelato al caffe",
  "Gelato alla fragola",
  "Gelato al limone",
  "Gelato al mango",
  "Gelato allo yogurt",
  "Gelato al cocco",
  "Gelato al caramello",
  "Gelato al tiramisu",
  "Gelato all'amarena",
] as const;

const GELATO_FLAVOR_PHOTOS: Record<string, string> = {
  "Gelato fiordilatte": "part-gelato-fiordilatte-v11664",
  "Gelato alla crema": "part-gelato-crema-v11667",
  "Gelato al cioccolato": "part-gelato-chocolate-v11664",
  "Gelato stracciatella": "part-gelato-stracciatella-v11667",
  "Gelato al pistacchio": "part-gelato-pistacchio-v11667",
  "Gelato alla nocciola": "part-gelato-nocciola-v11667",
  "Gelato alla vaniglia": "part-gelato-vaniglia-v11667",
  "Gelato al caffe": "part-gelato-caffe-v11667",
  "Gelato alla fragola": "part-gelato-fragola-v11667",
  "Gelato al limone": "part-gelato-limone-v11667",
  "Gelato al mango": "part-gelato-mango-v11667",
  "Gelato allo yogurt": "part-gelato-yogurt-v11667",
  "Gelato al cocco": "part-gelato-cocco-v11667",
  "Gelato al caramello": "part-gelato-caramello-v11667",
  "Gelato al tiramisu": "part-gelato-tiramisu-v11667",
  "Gelato all'amarena": "part-gelato-amarena-v11667",
};

const gelatoFlavorPhoto = (food: string) =>
  photo(GELATO_FLAVOR_PHOTOS[food] || "cheat-gelato-v11619");

const HEALTHY_FILTERS = [
  ["verdure", "Ricca di verdure"],
  ["vegetale", "Prevalentemente vegetale"],
  ["integrali", "Cereali integrali"],
  ["legumi", "Con legumi"],
  ["pesce", "Con pesce"],
  ["pesce-grasso", "Con pesce grasso"],
  ["carne-bianca", "Con carne bianca"],
  ["proteico", "Più proteine"],
  ["fibre", "Più fibre"],
  ["vegetariana", "Vegetariana"],
  ["vegana", "Vegana"],
  ["lattosio", "Senza lattosio adattabile"],
  ["glutine", "Senza glutine adattabile"],
  ["pochi-ingredienti", "Meno ingredienti"],
  ["15-minuti", "Pronta in 15 minuti"],
  ["30-minuti", "Pronta in 30 minuti"],
  ["anticipo", "Da preparare in anticipo"],
  ["meal-prep", "Adatta al meal prep"],
  ["senza-cottura", "Senza cottura"],
  ["trasportabile", "Trasportabile"],
  ["stagione", "Adatta alla stagione"],
  ["vapore", "Cottura al vapore"],
  ["forno", "Cottura al forno"],
  ["senza-frittura", "Senza frittura"],
  ["poco-sale", "Poco sale aggiunto"],
] as const;
type HealthyFilterId = (typeof HEALTHY_FILTERS)[number][0];

foods["Branzino cotto"] = { kcal: 124, protein: 23.6, carbs: 0, fat: 2.7, fiber: 0, source: "USDA" };
foods["Nasello cotto"] = { kcal: 90, protein: 19.2, carbs: 0, fat: 1.2, fiber: 0, source: "USDA" };
foods["Calamari cotti alla griglia"] = { kcal: 92, protein: 15.6, carbs: 3.1, fat: 1.4, fiber: 0, source: "USDA" };
foods["Fave cotte"] = { kcal: 71, protein: 5.2, carbs: 11.7, fat: 0.4, fiber: 5, source: "CREA" };
foods["Fagioli borlotti cotti"] = { kcal: 102, protein: 6.9, carbs: 16.4, fat: 0.5, fiber: 5.7, source: "CREA" };
foods["Cozze cotte"] = { kcal: 172, protein: 23.8, carbs: 7.4, fat: 4.5, fiber: 0, source: "USDA" };
foods["Sardine cotte"] = { kcal: 208, protein: 24.6, carbs: 0, fat: 11.5, fiber: 0, source: "USDA" };
foods["Sgombro cotto"] = { kcal: 262, protein: 23.8, carbs: 0, fat: 17.8, fiber: 0, source: "USDA" };

foods["Cicoria cotta"] = { kcal: 24, protein: 1.4, carbs: 3.4, fat: 0.3, fiber: 3.6, source: "CREA" };

foods["Cavolo cappuccio cotto"] = { kcal: 23, protein: 1.3, carbs: 5.5, fat: 0.1, fiber: 2.6, source: "USDA" };

foods["Platessa cotta"] = { kcal: 86, protein: 18.6, carbs: 0, fat: 1.2, fiber: 0, source: "USDA" };



foods["Pompelmo rosa fresco"] = { kcal: 42, protein: 0.8, carbs: 10.7, fat: 0.1, fiber: 1.6, source: "USDA" };
foods["Riso parboiled cotto"] = { kcal: 123, protein: 2.9, carbs: 26, fat: 0.4, fiber: 0.9, source: "USDA" };
foods["Vongole cotte"] = { kcal: 148, protein: 25.6, carbs: 5.1, fat: 2, fiber: 0, source: "USDA" };
foods["Lattuga fresca"] = { kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, source: "USDA" };
foods["Songino fresco"] = { kcal: 21, protein: 2, carbs: 3.6, fat: 0.4, fiber: 1.8, source: "USDA" };
foods["Catalogna fresca"] = { kcal: 23, protein: 1.7, carbs: 4.7, fat: 0.3, fiber: 4, source: "USDA" };
foods["Verza fresca"] = { kcal: 27, protein: 2, carbs: 6.1, fat: 0.1, fiber: 3.1, source: "USDA" };
foods["Cavolini di Bruxelles cotti"] = { kcal: 36, protein: 2.6, carbs: 7.1, fat: 0.5, fiber: 2.6, source: "USDA" };
foods["Cime di rapa cotte"] = { kcal: 27, protein: 3.2, carbs: 3.1, fat: 0.5, fiber: 2.7, source: "USDA" };
foods["Cipollotti freschi"] = { kcal: 32, protein: 1.8, carbs: 7.3, fat: 0.2, fiber: 2.6, source: "USDA" };

foods["Bevanda di soia"] = { ...foods["Bevanda di soia senza zucchero"] };
foods.Cetrioli = { ...foods.Cetriolo };
foods["Cetrioli crudi"] = { ...foods.Cetriolo };
foods["Funghi cotti"] = { kcal: 28, protein: 3.6, carbs: 5.3, fat: 0.5, fiber: 2.2, source: "USDA" };
foods["Gelato fiordilatte"] = { ...occasionalFoods["Gelato alla crema"] };
foods["Peperoni cotti"] = { ...foods["Peperoni cotti senza olio"] };

const calc = (
  ingredients: RecipeIngredient[],
  scale = 1,
): Macro & { fiber: number; weight: number } =>
  ingredients.reduce(
    (sum, item) => {
      const food = foods[item.food] ?? occasionalFoods[item.food];
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
const hasWholeEgg = (items: RecipeIngredient[]) =>
  items.some((item) => /uovo|uova/i.test(item.food) && item.grams > 0);
const vegetablePortionForItems = (items: RecipeIngredient[]) => {
  const vegetablePattern = /zucchin|pomodor|spinac|broccol|cavol|carot|zucca|melanzan|finocch|asparag|bietol|radicch|rucola|insalat|fung|peperon|carciof|sedano|cetriol|barbabietol|fagiolin|verza|porro/i;
  const leafyPattern = /spinac|bietol|rucola|insalat|radicch|cavolo nero|verza/i;
  const vegetables = items.filter((item) => vegetablePattern.test(item.food));
  const total = vegetables.reduce((sum, item) => sum + item.grams, 0);
  const leafy = vegetables
    .filter((item) => leafyPattern.test(item.food))
    .reduce((sum, item) => sum + item.grams, 0);
  return { total, leafy, adequate: total >= 200 || leafy >= 80 };
};
const WEEKLY_MAIN_ROTATION: WeeklyProteinFamily[] = [
  "legumi", "pesce", "carne-bianca", "uova", "legumi", "pesce", "latticini",
  "carne-bianca", "uova", "latticini", "legumi", "carne-rossa", "latticini", "uova",
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
      { food: "Olio extravergine", grams: 5 },
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
      { food: "Cetrioli", grams: 100 },
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
    image: photo("snack-apple-yogurt-walnuts-v11816"),
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
      { food: "Cetrioli", grams: 120 },
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
      { food: "Cetrioli", grams: 100 },
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
      { food: "Cetrioli", grams: 120 },
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
  [["Fagiolini", 150], ["Cetrioli", 100], "fagiolini e cetriolo"],
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
        image: photo("part-greek-yogurt-2-v11663"),
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
        image: photo("part-soy-drink-v11649"),
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
        image: photo("part-greek-yogurt-2-v11663"),
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
      { category: "Contorno", food: "Funghi", grams: 100, label: "Funghi", image: photo("part-mushrooms-raw-v11663") },
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
      { category: "Latticino", food: "Yogurt greco 2%", grams: 60, label: "Yogurt bianco · 60 g", image: photo("part-greek-yogurt-2-v11663") },
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
      { category: "Latticino", food: "Yogurt greco 2%", grams: 125, label: "Yogurt bianco · 1 vasetto", image: photo("part-greek-yogurt-2-v11663") },
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
  { id: "matrix-s32-cottage-carrot-cucumber", name: "Fiocchi di latte con carote crude e cetrioli", kicker: "Spuntino fresco · matrice S32", course: "Spuntino", cuisine: "Italiano", kind: "combination", image: photo("part-cottage-cheese-v11512"), time: 7, ingredients: [{ food: "Fiocchi di latte", grams: 80 }, { food: "Carote crude", grams: 100 }, { food: "Cetrioli", grams: 100 }], parts: [{ category: "Latticino", food: "Fiocchi di latte", grams: 80, label: "Fiocchi di latte", image: photo("part-cottage-cheese-v11512") }, { category: "Contorno", food: "Carote crude", grams: 100, label: "Carote crude a bastoncino", image: photo("part-carrots-raw-v11512") }, { category: "Contorno", food: "Cetrioli", grams: 100, label: "Cetriolo a bastoncino", image: photo("part-cucumber-v8") }], steps: ["Lava e pela le carote, lava il cetriolo e tagliali a bastoncino. Servi con i fiocchi di latte e erbe aromatiche."], alternatives: ["Conserva refrigerato", "Contiene latte"] },
  { id: "matrix-s33-yogurt-pineapple-sesame", name: "Yogurt con ananas e sesamo", kicker: "Spuntino fresco · matrice S33", course: "Spuntino", cuisine: "Internazionale", kind: "combination", image: photo("part-pineapple-v11513"), time: 3, ingredients: [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Ananas", grams: 150 }, { food: "Semi di sesamo", grams: 5 }], parts: [{ category: "Latticino", food: "Yogurt greco 2%", grams: 125, label: "Yogurt bianco", image: photo("part-greek-yogurt-2-v11663") }, { category: "Frutta", food: "Ananas", grams: 150, label: "Ananas fresco · parte edibile", image: photo("part-pineapple-v11513") }, { category: "Extra", food: "Semi di sesamo", grams: 5, label: "Semi di sesamo", image: photo("part-sesame-v11512") }], steps: ["Taglia l'ananas fresco a cubetti, uniscilo allo yogurt e completa con 5 g di semi di sesamo."], alternatives: ["Conserva refrigerato", "Contiene latte e sesamo"] },
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
      { category: "Latticino", food: "Yogurt greco 2%", grams: 125, label: "Yogurt bianco · 1 vasetto", image: photo("part-greek-yogurt-2-v11663") },
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
      { category: "Latticino", food: "Yogurt greco 2%", grams: 125, label: "Yogurt bianco · 1 vasetto", image: photo("part-greek-yogurt-2-v11663") },
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
  { id:"matrix-p49-millet-chicken-pumpkin", name:"Miglio con pollo, zucca e cavolo nero", kicker:"Pranzo carne bianca · matrice P49", course:"Piatto unico", cuisine:"Italiano", image:photo("recipe-p49-millet-chicken-v11515"), time:35, ingredients:[{food:"Miglio cotto",grams:190},{food:"Petto di pollo cotto",grams:100},{food:"Zucca",grams:150},{food:"Cavolo nero cotto",grams:100},{food:"Olio extravergine",grams:10}], parts:[{category:"Carboidrato",food:"Miglio cotto",grams:190,label:"Miglio cotto · da circa 70 g secco",image:photo("part-millet-v11515")},{category:"Proteina",food:"Petto di pollo cotto",grams:100,label:"Petto di pollo alla piastra",image:photo("part-chicken-cooked-v11651")},{category:"Contorno",food:"Zucca",grams:150,label:"Zucca arrostita",image:photo("part-pumpkin-v8")},{category:"Contorno",food:"Cavolo nero cotto",grams:100,label:"Cavolo nero cotto",image:photo("part-kale-v11515")},{category:"Extra",food:"Olio extravergine",grams:10,label:"Olio EVO · 10 g",image:photo("part-olive-oil-v8")}], steps:["Cuoci il miglio seguendo la confezione.","Arrostisci la zucca, cuoci il cavolo nero e griglia il pollo fino a completa cottura.","Unisci e completa con olio pesato, rosmarino, paprika e pepe."], alternatives:["Senza glutine se certificato","Preferibile a casa; trasportabile preparato prima","Componenti modificabili separatamente"] },
  { id:"matrix-p50-gnocchi-cannellini-chard", name:"Gnocchi con cannellini, pomodoro e bietole", kicker:"Pranzo vegetale · matrice P50", course:"Piatto unico", cuisine:"Italiano", image:photo("recipe-p50-gnocchi-cannellini-v11515"), time:25, ingredients:[{food:"Gnocchi di patate",grams:150},{food:"Fagioli cannellini cotti",grams:120},{food:"Pomodorini",grams:125},{food:"Bietole cotte",grams:125},{food:"Olio extravergine",grams:10}], parts:[{category:"Carboidrato",food:"Gnocchi di patate",grams:150,label:"Gnocchi di patate",image:photo("part-gnocchi-v7")},{category:"Proteina",food:"Fagioli cannellini cotti",grams:120,label:"Cannellini cotti e sgocciolati",image:photo("part-cannellini-v1141")},{category:"Contorno",food:"Pomodorini",grams:125,label:"Pomodoro cotto",image:photo("part-tomatoes-v8")},{category:"Contorno",food:"Bietole cotte",grams:125,label:"Bietole cotte",image:photo("part-chard-v11515")},{category:"Extra",food:"Olio extravergine",grams:10,label:"Olio EVO · 10 g",image:photo("part-olive-oil-v8")}], steps:["Cuoci pomodoro e bietole, quindi aggiungi i cannellini risciacquati.","Lessa gli gnocchi e scolali quando salgono in superficie.","Unisci al condimento e completa con 10 g di olio pesato, aglio e salvia."], alternatives:["Verificare glutine e uova negli gnocchi","Adatto a casa","Componenti modificabili separatamente"] },
  { id:"matrix-p51-polenta-rabbit-mushrooms", name:"Polenta con coniglio, funghi e radicchio", kicker:"Pranzo casa · matrice P51", course:"Piatto completo", cuisine:"Italiano", image:photo("recipe-p51-polenta-rabbit-v11515"), time:45, ingredients:[{food:"Polenta cotta",grams:300},{food:"Coniglio cotto in umido",grams:100},{food:"Funghi",grams:125},{food:"Radicchio cotto",grams:125},{food:"Olio extravergine",grams:10}], parts:[{category:"Carboidrato",food:"Polenta cotta",grams:300,label:"Polenta cotta · da circa 70 g farina",image:photo("part-polenta-v11515")},{category:"Proteina",food:"Coniglio cotto in umido",grams:100,label:"Coniglio cotto · parte edibile",image:photo("part-rabbit-v11515")},{category:"Contorno",food:"Funghi",grams:125,label:"Funghi cotti",image:photo("part-mushrooms-raw-v11663")},{category:"Contorno",food:"Radicchio cotto",grams:125,label:"Radicchio cotto",image:photo("part-radicchio-v11515")},{category:"Extra",food:"Olio extravergine",grams:10,label:"Olio EVO · 10 g",image:photo("part-olive-oil-v8")}], steps:["Cuoci il coniglio in umido con rosmarino e salvia fino a completa cottura.","Prepara la polenta secondo confezione e cuoci funghi e radicchio in padella antiaderente.","Servi le tre componenti e distribuisci i 10 g di olio pesato."], alternatives:["Pasto da casa","Polenta certificata per senza glutine","Componenti modificabili separatamente"] },
  { id:"matrix-p52-bulgur-tofu-chickpeas", name:"Bulgur con tofu, ceci e verdure", kicker:"Pranzo vegano · matrice P52", course:"Piatto unico", cuisine:"Internazionale", image:photo("recipe-p52-bulgur-tofu-v11515"), time:30, ingredients:[{food:"Bulgur cotto",grams:130},{food:"Tofu alla piastra",grams:80},{food:"Ceci cotti",grams:100},{food:"Carote crude",grams:80},{food:"Zucchine",grams:85},{food:"Cavolo rosso crudo",grams:85},{food:"Olio extravergine",grams:10}], parts:[{category:"Carboidrato",food:"Bulgur cotto",grams:130,label:"Bulgur cotto · da circa 50 g secco",image:photo("part-bulgur-v11515")},{category:"Proteina",food:"Tofu alla piastra",grams:80,label:"Tofu alla piastra",image:photo("part-tofu-v11515")},{category:"Proteina",food:"Ceci cotti",grams:100,label:"Ceci cotti e sgocciolati",image:photo("part-chickpeas-v8")},{category:"Contorno",food:"Carote crude",grams:80,label:"Carote crude",image:photo("part-carrots-raw-v11512")},{category:"Contorno",food:"Zucchine",grams:85,label:"Zucchine cotte",image:photo("part-zucchini-v8")},{category:"Contorno",food:"Cavolo rosso crudo",grams:85,label:"Cavolo rosso",image:photo("part-red-cabbage-v11515")},{category:"Extra",food:"Olio extravergine",grams:10,label:"Olio EVO · 10 g",image:photo("part-olive-oil-v8")}], steps:["Cuoci il bulgur secondo confezione.","Griglia il tofu; cuoci carote e zucchine lasciando il cavolo rosso crudo e croccante; risciacqua i ceci.","Unisci e completa con olio pesato, zenzero, paprika e limone."], alternatives:["Contiene glutine e soia","Trasportabile refrigerato","Cereale, tofu e ceci restano in porzioni ridotte"] },  { id: "matrix-p45-couscous-shrimp-peppers", name: "Cous cous integrale con gamberi, piselli e peperoni", kicker: "Pranzo di pesce · matrice P45", course: "Piatto unico", cuisine: "Mediterraneo", image: photo("recipe-p45-couscous-shrimp-v11514"), time: 25, ingredients: [{ food: "Cous cous integrale cotto", grams: 180 }, { food: "Gamberi cotti", grams: 150 }, { food: "Piselli cotti", grams: 80 }, { food: "Peperoni cotti senza olio", grams: 200 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Carboidrato", food: "Cous cous integrale cotto", grams: 180, label: "Cous cous cotto · da circa 70 g secco", image: photo("part-couscous-v11514") }, { category: "Proteina", food: "Gamberi cotti", grams: 150, label: "Gamberi cotti", image: photo("part-shrimp-v11514") }, { category: "Proteina", food: "Piselli cotti", grams: 80, label: "Piselli cotti", image: photo("part-peas-v8") }, { category: "Contorno", food: "Peperoni cotti senza olio", grams: 200, label: "Peperoni cotti", image: photo("part-peppers-v11514") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Reidrata il cous cous secondo confezione e sgranalo.", "Cuoci i peperoni in padella antiaderente e i gamberi fino a completa cottura; unisci i piselli già cotti.", "Mescola e completa con 10 g di olio pesato, paprika, limone e prezzemolo."], alternatives: ["Contiene glutine e crostacei", "Trasportabile refrigerato", "Componenti modificabili separatamente"] },
  { id: "matrix-p46-barley-turkey-asparagus", name: "Orzo con tacchino, asparagi e funghi", kicker: "Pranzo carne bianca · matrice P46", course: "Piatto unico", cuisine: "Italiano", image: photo("recipe-p46-barley-turkey-v11514"), time: 30, ingredients: [{ food: "Orzo perlato cotto", grams: 180 }, { food: "Petto di tacchino cotto alla piastra", grams: 100 }, { food: "Asparagi crudi", grams: 125 }, { food: "Funghi", grams: 125 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Carboidrato", food: "Orzo perlato cotto", grams: 180, label: "Orzo cotto · da circa 70 g secco", image: photo("part-barley-v11514") }, { category: "Proteina", food: "Petto di tacchino cotto alla piastra", grams: 100, label: "Petto di tacchino alla piastra", image: photo("part-turkey-grilled-v11514") }, { category: "Contorno", food: "Asparagi crudi", grams: 125, label: "Asparagi · peso a crudo", image: photo("part-asparagus-v113") }, { category: "Contorno", food: "Funghi", grams: 125, label: "Funghi", image: photo("part-mushrooms-raw-v11663") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci l'orzo secondo confezione e scolalo.", "Cuoci asparagi e funghi in padella antiaderente; griglia il tacchino fino a completa cottura.", "Unisci e condisci con 10 g di olio pesato, timo, limone e pepe."], alternatives: ["Contiene glutine", "Adatto a casa o schiscetta", "Componenti modificabili separatamente"] },
  { id: "matrix-p47-red-rice-lentils", name: "Riso rosso con lenticchie e verdure grigliate", kicker: "Pranzo vegetale · matrice P47", course: "Piatto unico", cuisine: "Mediterraneo", image: photo("recipe-p47-red-rice-lentils-v11514"), time: 35, ingredients: [{ food: "Riso rosso integrale cotto", grams: 180 }, { food: "Lenticchie cotte", grams: 150 }, { food: "Melanzane", grams: 85 }, { food: "Zucchine", grams: 85 }, { food: "Peperoni cotti senza olio", grams: 80 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Carboidrato", food: "Riso rosso integrale cotto", grams: 180, label: "Riso rosso cotto · da circa 60 g secco", image: photo("part-red-rice-v11514") }, { category: "Proteina", food: "Lenticchie cotte", grams: 150, label: "Lenticchie cotte", image: photo("part-lentils-v1141") }, { category: "Contorno", food: "Melanzane", grams: 85, label: "Melanzane grigliate", image: photo("part-eggplant-v8") }, { category: "Contorno", food: "Zucchine", grams: 85, label: "Zucchine grigliate", image: photo("part-zucchini-v8") }, { category: "Contorno", food: "Peperoni cotti senza olio", grams: 80, label: "Peperoni grigliati", image: photo("part-peppers-v11514") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci il riso rosso secondo confezione e scolalo.", "Griglia melanzane, zucchine e peperoni; risciacqua le lenticchie già cotte.", "Unisci tutto e completa con 10 g di olio pesato, origano, basilico e limone."], alternatives: ["Vegano e senza glutine se certificato", "Trasportabile refrigerato", "Componenti modificabili separatamente"] },  {
    id: "matrix-p41-whole-pasta-peas-ricotta", name: "Pasta integrale con piselli, ricotta e zucchine", kicker: "Pranzo vegetariano · matrice P41", course: "Piatto unico", cuisine: "Italiano", image: photo("recipe-p41-pasta-peas-ricotta-v11513"), time: 25,
    ingredients: [{ food: "Pasta integrale secca", grams: 70 }, { food: "Piselli cotti", grams: 120 }, { food: "Ricotta vaccina", grams: 60 }, { food: "Zucchine", grams: 200 }, { food: "Olio extravergine", grams: 5 }],
    parts: [{ category: "Carboidrato", food: "Pasta integrale secca", grams: 70, label: "Pasta integrale · peso a crudo", image: photo("part-pasta-whole-v11618") }, { category: "Proteina", food: "Piselli cotti", grams: 120, label: "Piselli cotti", image: photo("part-peas-v8") }, { category: "Latticino", food: "Ricotta vaccina", grams: 60, label: "Ricotta vaccina", image: photo("part-ricotta-v7") }, { category: "Contorno", food: "Zucchine", grams: 200, label: "Zucchine cotte", image: photo("part-zucchini-v8") }, { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") }],
    steps: ["Porta a bollore l'acqua, sala moderatamente e cuoci la pasta per il tempo indicato in confezione.", "Cuoci le zucchine a mezze rondelle in padella antiaderente 8-10 minuti; aggiungi i piselli già cotti negli ultimi 3 minuti.", "Stempera la ricotta con poca acqua di cottura, scola la pasta e manteca tutto fuori dal fuoco; completa con 5 g di olio pesato, basilico e pepe."], alternatives: ["Adatto a casa; per il lavoro preparare la sera prima e conservare refrigerato", "Contiene glutine e latte", "Ogni componente resta sostituibile separatamente"]
  },
  {
    id: "matrix-p42-basmati-cod-spinach", name: "Riso basmati con merluzzo, spinaci e carote", kicker: "Pranzo completo di pesce · matrice P42", course: "Piatto completo", cuisine: "Italiano", image: photo("recipe-p42-basmati-cod-spinach-v11513"), time: 30,
    ingredients: [{ food: "Riso basmati secco", grams: 70 }, { food: "Merluzzo cotto", grams: 150 }, { food: "Spinaci", grams: 150 }, { food: "Carote cotte bollite", grams: 100 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Carboidrato", food: "Riso basmati secco", grams: 70, label: "Riso basmati · peso a crudo", image: photo("part-basmati-dry-v11650") }, { category: "Proteina", food: "Merluzzo cotto", grams: 150, label: "Merluzzo cotto al vapore", image: photo("part-cod-steamed-v8") }, { category: "Contorno", food: "Spinaci", grams: 150, label: "Spinaci cotti", image: photo("part-spinach-v7") }, { category: "Contorno", food: "Carote cotte bollite", grams: 100, label: "Carote cotte bollite", image: photo("part-carrots-cooked-v11512") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
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
        image: photo("part-basmati-cooked-v11650"),
      },
      {
        category: "Proteina",
        food: "Tonno al naturale sgocciolato",
        grams: 90,
        label: "Tonno al naturale",
        image: photo("part-tuna-canned-v11650"),
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
    image: photo("part-pasta-semolina-v11618"),
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
        image: photo("part-basmati-dry-v11650"),
      },
      {
        category: "Proteina",
        food: "Petto di pollo cotto",
        grams: 100,
        label: "Petto di pollo alla piastra",
        image: photo("part-chicken-cooked-v11651"),
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
      { food: "Olio extravergine", grams: 5 },
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
        grams: 5,
        label: "Olio extravergine · 5 g",
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
      { food: "Pasta integrale secca", grams: 70 },
      { food: "Lenticchie cotte", grams: 120 },
      { food: "Zucca", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pasta integrale secca", grams: 70, label: "Pasta integrale · peso a crudo", image: photo("part-pasta-whole-v11618") },
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
      { category: "Proteina", food: "Tonno al naturale sgocciolato", grams: 120, label: "Tonno al naturale sgocciolato", image: photo("part-tuna-canned-v11650") },
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
      { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 100, label: "Petto di pollo alla piastra · 100 g a crudo", image: photo("part-chicken-raw-v11651") },
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
    { category: "Proteina", food: "Edamame cotti", grams: 120, label: "Edamame cotti · 120 g", image: photo("part-edamame-v11634") },
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
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 170, label: "Riso basmati cotto · 170 g", image: photo("part-basmati-cooked-v11650") },
      { category: "Contorno", food: "Passata di pomodoro", grams: 100, label: "Salsa di pomodoro · 100 g", image: photo("part-passata-v11652") },
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
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 150, label: "Riso cotto · 150 g", image: photo("part-basmati-cooked-v11650") },
      { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 80, label: "Pollo · 80 g a crudo", image: photo("part-chicken-raw-v11651") },
      { category: "Proteina", food: "Uovo", grams: 100, label: "Uova · 2", image: photo("part-whole-egg-v11651") },
      { category: "Contorno", food: "Cipolle crude", grams: 40, label: "Cipolla · 40 g", image: photo("part-onions-v11519") },
      { category: "Contorno", food: "Funghi", grams: 20, label: "Shiitake o funghi · 20 g", image: photo("part-mushrooms-raw-v11663") },
    ],
    steps: ["Prepara il riso e tienilo caldo nella ciotola.", "Porta a leggero bollore poca acqua con soia, mirin e zucchero; aggiungi cipolla, funghi e pollo e cuoci completamente.", "Versa le uova appena sbattute in due riprese, copri brevemente e trasferisci il composto morbido sul riso."],
    alternatives: ["Fonte ricetta: Ministero giapponese dell'Agricoltura (MAFF)", "Contiene uova e soia", "Il piatto può essere diviso in componenti"],
    sourceLabel: "MAFF · Ministero giapponese dell'Agricoltura",
    sourceUrl: "https://www.maff.go.jp/e/policies/market/japan-cuisine/japan/9/index.html",
  },
  {
    id: "asian-bibimbap-authentic",
    name: "Bibimbap coreano con manzo, verdure e uovo",
    kicker: "Ricetta coreana verificata · VisitKorea", course: "Piatto unico", cuisine: "Asiatico",
    image: photo("recipe-asian-bibimbap-v11520"), time: 35,
    ingredients: [{ food: "Riso basmati cotto", grams: 150 }, { food: "Bistecca di manzo · peso a crudo", grams: 70 }, { food: "Uovo", grams: 50 }, { food: "Spinaci", grams: 70 }, { food: "Carote crude", grams: 60 }, { food: "Germogli di soia", grams: 70 }, { food: "Funghi", grams: 60 }, { food: "Gochujang", grams: 15 }, { food: "Olio extravergine", grams: 5 }],
    parts: [
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 150, label: "Riso cotto · 150 g", image: photo("part-basmati-cooked-v11650") },
      { category: "Proteina", food: "Bistecca di manzo · peso a crudo", grams: 70, label: "Manzo a striscioline · 70 g a crudo", image: photo("part-steak-beef-v114") },
      { category: "Proteina", food: "Uovo", grams: 50, label: "Uovo al tegamino · 1", image: photo("part-whole-egg-v11651") },
      { category: "Contorno", food: "Spinaci", grams: 70, label: "Spinaci · 70 g", image: photo("part-spinach-v7") },
      { category: "Contorno", food: "Carote crude", grams: 60, label: "Carote · 60 g", image: photo("part-carrots-raw-v11512") },
      { category: "Contorno", food: "Germogli di soia", grams: 70, label: "Germogli di soia · 70 g", image: photo("part-sprouts-v11520") },
      { category: "Contorno", food: "Funghi", grams: 60, label: "Funghi · 60 g", image: photo("part-mushrooms-raw-v11663") },
    ],
    steps: ["Cuoci il riso e sistemalo sul fondo della ciotola.", "Sbollenta i germogli e salta separatamente spinaci, carote e funghi. Cuoci completamente il manzo a striscioline.", "Disponi gli ingredienti a settori sul riso, aggiungi l'uovo cotto e servi con il gochujang dosato."],
    alternatives: ["Fonte ricetta: Korea Tourism Organization", "Contiene uova e soia", "Il piatto può essere diviso in componenti"],
    sourceLabel: "VisitKorea · Korea Tourism Organization",
    sourceUrl: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=224166",
  },
  {
    id: "asian-negima-nabe-authentic",
    name: "Negima-nabe giapponese con tonno, porro e riso",
    kicker: "Pentola tradizionale di Tokyo · ricetta verificata MAFF",
    course: "Piatto unico",
    cuisine: "Asiatico",
    image: photo("recipe-asian-negima-v1163"),
    time: 30,
    ingredients: [
      { food: "Riso basmati cotto", grams: 150 },
      { food: "Tonno fresco cotto", grams: 150 },
      { food: "Porro cotto", grams: 120 },
      { food: "Funghi", grams: 80 },
      { food: "Salsa di soia", grams: 15 },
      { food: "Zucchero", grams: 3 },
    ],
    parts: [
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 150, label: "Riso cotto · 150 g", image: photo("part-basmati-cooked-v11650") },
      { category: "Proteina", food: "Tonno fresco cotto", grams: 150, label: "Tonno fresco a cubi · 150 g cotti", image: photo("part-tuna-fresh-v11650") },
      { category: "Contorno", food: "Porro cotto", grams: 120, label: "Porro cotto · 120 g", image: photo("part-leek-v1163") },
      { category: "Contorno", food: "Funghi", grams: 80, label: "Funghi shiitake · 80 g", image: photo("part-mushrooms-raw-v11663") },
    ],
    steps: [
      "Cuoci il riso secondo confezione e tienine 150 g cotti al caldo, separati dalla pentola.",
      "Taglia il tonno fresco a cubi regolari, il porro in diagonale e i funghi a fette. Porta a leggero bollore 250 ml di acqua con salsa di soia e zucchero.",
      "Cuoci prima porro e funghi finché teneri; aggiungi il tonno solo alla fine e portalo a cottura completa senza sfaldarlo. Servi subito con il riso.",
    ],
    alternatives: ["Contiene pesce e soia", "Il riso è separato e sostituibile", "Componenti modificabili singolarmente"],
    sourceLabel: "MAFF · Our Regional Cuisines, Negima-nabe",
    sourceUrl: "https://www.maff.go.jp/e/policies/market/k_ryouri/search_menu/6628/index.html",
  },
  {
    id: "asian-japchae-authentic",
    name: "Japchae coreano con manzo e verdure",
    kicker: "Noodles di patata dolce · ricetta verificata VisitKorea",
    course: "Piatto unico",
    cuisine: "Asiatico",
    image: photo("recipe-asian-japchae-v1163"),
    time: 35,
    ingredients: [
      { food: "Vermicelli di patata dolce cotti", grams: 180 },
      { food: "Bistecca di manzo · peso a crudo", grams: 100 },
      { food: "Spinaci", grams: 80 },
      { food: "Carote crude", grams: 60 },
      { food: "Funghi", grams: 60 },
      { food: "Salsa di soia", grams: 12 },
      { food: "Semi di sesamo", grams: 5 },
      { food: "Olio di arachidi", grams: 5 },
    ],
    parts: [
      { category: "Carboidrato", food: "Vermicelli di patata dolce cotti", grams: 180, label: "Vermicelli traslucidi cotti · 180 g", image: photo("part-sweet-potato-noodles-v11652") },
      { category: "Proteina", food: "Bistecca di manzo · peso a crudo", grams: 100, label: "Manzo a striscioline · 100 g a crudo", image: photo("part-steak-beef-v114") },
      { category: "Contorno", food: "Spinaci", grams: 80, label: "Spinaci cotti · 80 g", image: photo("part-spinach-v7") },
      { category: "Contorno", food: "Carote crude", grams: 60, label: "Carote a julienne · 60 g", image: photo("part-carrots-raw-v11512") },
      { category: "Contorno", food: "Funghi", grams: 60, label: "Funghi shiitake · 60 g", image: photo("part-mushrooms-raw-v11663") },
      { category: "Extra", food: "Semi di sesamo", grams: 5, label: "Sesamo · 5 g", image: photo("part-sesame-v11512") },
    ],
    steps: [
      "Cuoci i vermicelli in acqua bollente per il tempo indicato in confezione, scolali e sciacquali brevemente.",
      "Taglia manzo, carote e funghi a strisce sottili. Cuoci separatamente manzo e verdure; sbollenta gli spinaci e strizzali.",
      "Rimetti i vermicelli in padella con soia e olio, poi unisci manzo e verdure. Mescola finché il condimento è assorbito e completa con sesamo.",
    ],
    alternatives: ["Contiene soia e sesamo", "Piatto autentico, non un nome geografico inventato", "Componenti modificabili singolarmente"],
    sourceLabel: "VisitKorea · Japchae",
    sourceUrl: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=181&vcontsId=179814",
  },
  {
    id: "asian-phat-thai-authentic",
    name: "Phat Thai con gamberi, uovo e germogli",
    kicker: "Noodles thailandesi · riferimento ufficiale TAT",
    course: "Piatto unico",
    cuisine: "Asiatico",
    image: photo("recipe-asian-phat-thai-v1163"),
    time: 30,
    ingredients: [
      { food: "Noodles di riso cotti", grams: 180 },
      { food: "Gamberi cotti", grams: 130 },
      { food: "Uovo", grams: 50 },
      { food: "Germogli di soia", grams: 80 },
      { food: "Erba cipollina fresca", grams: 20 },
      { food: "Arachidi", grams: 10 },
      { food: "Salsa di tamarindo", grams: 15 },
      { food: "Salsa di soia", grams: 8 },
      { food: "Olio di arachidi", grams: 5 },
      { food: "Lime", grams: 30 },
    ],
    parts: [
      { category: "Carboidrato", food: "Noodles di riso cotti", grams: 180, label: "Noodles di riso cotti · 180 g", image: photo("part-rice-noodles-v11652") },
      { category: "Proteina", food: "Gamberi cotti", grams: 130, label: "Gamberi cotti · 130 g", image: photo("part-shrimp-v11514") },
      { category: "Proteina", food: "Uovo", grams: 50, label: "Uovo strapazzato · 1", image: photo("part-whole-egg-v11651") },
      { category: "Contorno", food: "Germogli di soia", grams: 80, label: "Germogli di soia · 80 g", image: photo("part-sprouts-v11520") },
      { category: "Extra", food: "Arachidi", grams: 10, label: "Arachidi tritate · 10 g", image: photo("part-peanuts-v113") },
    ],
    steps: [
      "Prepara i noodles secondo confezione e scolali ancora elastici. Mescola tamarindo e salsa di soia in una ciotolina.",
      "Scalda l'olio nel wok, porta l'uovo a completa cottura mescolandolo e aggiungi gamberi, noodles e salsa. Salta a fuoco vivo senza asciugare troppo.",
      "Unisci germogli ed erba cipollina negli ultimi minuti. Servi con arachidi pesate e spicchio di lime.",
    ],
    alternatives: ["Contiene crostacei, uova, soia e arachidi", "La salsa può variare per marca: controlla l'etichetta", "Componenti modificabili singolarmente"],
    sourceLabel: "Tourism Authority of Thailand · Phat Thai",
    sourceUrl: "https://www.tatnews.org/2020/11/tat-and-rosas-thai-cafe-launch-phat-thai-party-to-celebrate-thailands-national-dish/",
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
];

const attachmentDinnersA: Recipe[] = [
  {
    id: "matrix-d01-merluzzo-al-forno-con-patate-e-zucchine",
    name: "Merluzzo al forno con patate e zucchine",
    kicker: "Cena completa · matrice D01",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-cod-steamed-v8"),
    time: 40,
    ingredients: [
      { food: "Merluzzo cotto", grams: 150 },
      { food: "Patate lesse", grams: 200 },
      { food: "Zucchine", grams: 250 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Merluzzo cotto", grams: 150, label: "Merluzzo al forno · 150 g", image: photo("part-cod-steamed-v8") },
      { category: "Carboidrato", food: "Patate lesse", grams: 200, label: "Patate · 200 g", image: photo("part-potatoes-boiled-v7") },
      { category: "Contorno", food: "Zucchine", grams: 250, label: "Zucchine al forno · 250 g", image: photo("part-zucchini-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Taglia le patate a spicchi e le zucchine; cuocile a 200 °C per 25 minuti.","Aggiungi il merluzzo, limone, aglio e prezzemolo e prosegui 12-15 minuti, fino a completa cottura.","Completa con i 10 g di olio misurato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d02-orata-al-cartoccio-con-verdure-e-pane",
    name: "Orata al cartoccio con verdure e pane",
    kicker: "Cena completa · matrice D02",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-sea-bream-baked-v8"),
    time: 30,
    ingredients: [
      { food: "Orata cotta", grams: 150 },
      { food: "Pomodorini", grams: 100 },
      { food: "Finocchi crudi", grams: 100 },
      { food: "Cipolle crude", grams: 50 },
      { food: "Pane integrale", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Orata cotta", grams: 150, label: "Orata al cartoccio · 150 g", image: photo("part-sea-bream-baked-v8") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori · 100 g", image: photo("part-tomatoes-v8") },
      { category: "Contorno", food: "Finocchi crudi", grams: 100, label: "Finocchi · 100 g", image: photo("part-fennel-v113") },
      { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolla · 50 g", image: photo("part-onions-v11519") },
      { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Affetta finocchi, pomodori e cipolla e adagiali su carta forno con l'orata.","Chiudi il cartoccio con limone e timo e cuoci a 190 °C per circa 20 minuti.","Apri con cautela, aggiungi l'olio pesato e servi il pane separatamente."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d03-pollo-alla-piastra-con-caponata-leggera",
    name: "Pollo alla piastra con caponata leggera",
    kicker: "Cena completa · matrice D03",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-chicken-raw-v11651"),
    time: 30,
    ingredients: [
      { food: "Petto di pollo · peso a crudo", grams: 100 },
      { food: "Melanzane", grams: 80 },
      { food: "Peperoni cotti senza olio", grams: 80 },
      { food: "Pomodorini", grams: 60 },
      { food: "Sedano crudo", grams: 40 },
      { food: "Cipolle crude", grams: 40 },
      { food: "Pane integrale", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 100, label: "Petto di pollo alla piastra · 100 g a crudo", image: photo("part-chicken-raw-v11651") },
      { category: "Contorno", food: "Melanzane", grams: 80, label: "Melanzane · 80 g", image: photo("part-eggplant-v8") },
      { category: "Contorno", food: "Peperoni cotti senza olio", grams: 80, label: "Peperoni · 80 g", image: photo("part-peppers-cooked-v11522") },
      { category: "Contorno", food: "Pomodorini", grams: 60, label: "Pomodori · 60 g", image: photo("part-tomatoes-v8") },
      { category: "Contorno", food: "Sedano crudo", grams: 40, label: "Sedano · 40 g", image: photo("part-celery-v1154") },
      { category: "Contorno", food: "Cipolle crude", grams: 40, label: "Cipolla · 40 g", image: photo("part-onions-v11519") },
      { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Taglia le verdure e cuocile in padella antiaderente 15-18 minuti con poca acqua, aceto e basilico, senza friggere.","Griglia il pollo su piastra calda fino a completa cottura.","Servi con il pane e distribuisci i 10 g di olio pesato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d04-tacchino-al-limone-con-broccoli-e-riso-basmati",
    name: "Tacchino al limone con broccoli e riso basmati",
    kicker: "Cena completa · matrice D04",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-turkey-grilled-v11514"),
    time: 25,
    ingredients: [
      { food: "Petto di tacchino cotto alla piastra", grams: 100 },
      { food: "Riso basmati secco", grams: 60 },
      { food: "Broccoli bolliti", grams: 250 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Petto di tacchino cotto alla piastra", grams: 100, label: "Tacchino al limone · 100 g", image: photo("part-turkey-grilled-v11514") },
      { category: "Carboidrato", food: "Riso basmati secco", grams: 60, label: "Riso basmati · 60 g a crudo", image: photo("part-basmati-dry-v11650") },
      { category: "Contorno", food: "Broccoli bolliti", grams: 250, label: "Broccoli · 250 g", image: photo("part-broccoli-v1154") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Sciacqua e cuoci il basmati secondo confezione.","Dividi i broccoli in cimette e cuocili al vapore o lessali 6-8 minuti.","Cuoci il tacchino in padella antiaderente con limone e salvia; completa il piatto con l'olio pesato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d05-zuppa-di-lenticchie-e-verdure-con-pane-di-segale",
    name: "Zuppa di lenticchie e verdure con pane di segale",
    kicker: "Cena completa · matrice D05",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-lentils-v1141"),
    time: 35,
    ingredients: [
      { food: "Lenticchie cotte", grams: 150 },
      { food: "Carote crude", grams: 60 },
      { food: "Sedano crudo", grams: 50 },
      { food: "Cipolle crude", grams: 50 },
      { food: "Passata di pomodoro", grams: 70 },
      { food: "Spinaci", grams: 70 },
      { food: "Pane di segale", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Lenticchie cotte", grams: 150, label: "Lenticchie cotte · 150 g", image: photo("part-lentils-v1141") },
      { category: "Contorno", food: "Carote crude", grams: 60, label: "Carote · 60 g", image: photo("part-carrots-raw-v11512") },
      { category: "Contorno", food: "Sedano crudo", grams: 50, label: "Sedano · 50 g", image: photo("part-celery-v1154") },
      { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolla · 50 g", image: photo("part-onions-v11519") },
      { category: "Contorno", food: "Passata di pomodoro", grams: 70, label: "Passata · 70 g", image: photo("part-passata-v11652") },
      { category: "Contorno", food: "Spinaci", grams: 70, label: "Spinaci · 70 g", image: photo("part-spinach-v7") },
      { category: "Carboidrato", food: "Pane di segale", grams: 50, label: "Pane di segale · 50 g", image: photo("part-bread-rye-v1156") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Taglia carota, sedano e cipolla e cuocili dolcemente con poca acqua.","Aggiungi passata e lenticchie, copri con acqua e sobbolle 20 minuti; unisci gli spinaci negli ultimi 5 minuti.","Servi con pane di segale e olio pesato a crudo."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d06-ceci-speziati-con-cavolfiore-e-cous-cous",
    name: "Ceci speziati con cavolfiore e cous cous",
    kicker: "Cena completa · matrice D06",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("part-chickpeas-v8"),
    time: 30,
    ingredients: [
      { food: "Ceci cotti", grams: 150 },
      { food: "Cous cous integrale cotto", grams: 170 },
      { food: "Cavolfiore", grams: 150 },
      { food: "Carote cotte bollite", grams: 100 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Ceci cotti", grams: 150, label: "Ceci cotti e sgocciolati · 150 g", image: photo("part-chickpeas-v8") },
      { category: "Carboidrato", food: "Cous cous integrale cotto", grams: 170, label: "Cous cous cotto · da circa 60 g secco", image: photo("part-couscous-v11514") },
      { category: "Contorno", food: "Cavolfiore", grams: 150, label: "Cavolfiore · 150 g", image: photo("part-cauliflower-v8") },
      { category: "Contorno", food: "Carote cotte bollite", grams: 100, label: "Carote · 100 g", image: photo("part-carrots-cooked-v11512") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Dividi il cavolfiore, taglia le carote e arrostiscili con ceci, curry, paprika e curcuma a 200 °C per 20-25 minuti.","Prepara il cous cous seguendo la confezione e sgranalo con una forchetta.","Unisci con limone e i 10 g di olio complessivi, senza aggiungere altri grassi."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d07-tofu-con-verdure-croccanti-e-riso-integrale",
    name: "Tofu con verdure croccanti e riso integrale",
    kicker: "Cena completa · matrice D07",
    course: "Piatto unico",
    cuisine: "Asiatico",
    kind: "combination",
    image: photo("part-tofu-v11515"),
    time: 30,
    ingredients: [
      { food: "Tofu alla piastra", grams: 100 },
      { food: "Riso integrale secco", grams: 60 },
      { food: "Broccoli bolliti", grams: 100 },
      { food: "Peperoni cotti senza olio", grams: 80 },
      { food: "Funghi", grams: 70 },
      { food: "Cipolle crude", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Tofu alla piastra", grams: 100, label: "Tofu alla piastra · 100 g", image: photo("part-tofu-v11515") },
      { category: "Carboidrato", food: "Riso integrale secco", grams: 60, label: "Riso integrale · 60 g a crudo", image: photo("part-brown-rice-v11519") },
      { category: "Contorno", food: "Broccoli bolliti", grams: 100, label: "Broccoli · 100 g", image: photo("part-broccoli-v1154") },
      { category: "Contorno", food: "Peperoni cotti senza olio", grams: 80, label: "Peperoni · 80 g", image: photo("part-peppers-cooked-v11522") },
      { category: "Contorno", food: "Funghi", grams: 70, label: "Funghi · 70 g", image: photo("part-mushrooms-raw-v11663") },
      { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipollotto o cipolla · 50 g", image: photo("part-onions-v11519") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci il riso integrale secondo confezione.","Tampona e griglia il tofu; salta rapidamente le verdure con zenzero, aglio e poca acqua.","Servi con l'olio misurato e peperoncino facoltativo."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d08-frittata-al-forno-con-zucchine-e-insalata",
    name: "Frittata al forno con zucchine e insalata",
    kicker: "Cena completa · matrice D08",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-eggs-scrambled-v1156"),
    time: 30,
    ingredients: [
      { food: "Uova strapazzate o in frittata", grams: 100 },
      { food: "Zucchine", grams: 150 },
      { food: "Cipolle crude", grams: 50 },
      { food: "Insalata verde", grams: 80 },
      { food: "Pane integrale", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Uova strapazzate o in frittata", grams: 100, label: "Frittata al forno · 2 uova", image: photo("part-eggs-scrambled-v1156") },
      { category: "Contorno", food: "Zucchine", grams: 150, label: "Zucchine · 150 g", image: photo("part-zucchini-v8") },
      { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolla · 50 g", image: photo("part-onions-v11519") },
      { category: "Contorno", food: "Insalata verde", grams: 80, label: "Insalata · 80 g", image: photo("part-lettuce-v8") },
      { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO complessivo · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci zucchine e cipolla in padella antiaderente con poca acqua.","Uniscile a due uova sbattute e cuoci in forno a 180 °C per 15-18 minuti, fino al centro ben cotto.","Servi con insalata, pane e i 10 g di olio complessivi."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d09-ricotta-con-pomodori-al-forno-e-pane-ai-cereali",
    name: "Ricotta con pomodori al forno e pane ai cereali",
    kicker: "Cena completa · matrice D09",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-ricotta-v7"),
    time: 30,
    ingredients: [
      { food: "Ricotta vaccina", grams: 100 },
      { food: "Pomodorini", grams: 120 },
      { food: "Zucchine", grams: 100 },
      { food: "Cipolle crude", grams: 80 },
      { food: "Pane ai cereali", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Latticino", food: "Ricotta vaccina", grams: 100, label: "Ricotta · 100 g", image: photo("part-ricotta-v7") },
      { category: "Contorno", food: "Pomodorini", grams: 120, label: "Pomodori · 120 g", image: photo("part-tomatoes-v8") },
      { category: "Contorno", food: "Zucchine", grams: 100, label: "Zucchine · 100 g", image: photo("part-zucchini-v8") },
      { category: "Contorno", food: "Cipolle crude", grams: 80, label: "Cipolla · 80 g", image: photo("part-onions-v11519") },
      { category: "Carboidrato", food: "Pane ai cereali", grams: 50, label: "Pane ai cereali · 50 g", image: photo("part-bread-cereals-v11511") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Taglia pomodori, zucchine e cipolla e arrostiscili a 200 °C per 20-25 minuti con origano.","Servi la ricotta separata dalle verdure e dal pane.","Completa con basilico e i 10 g di olio misurato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d10-salmone-alla-piastra-con-asparagi-e-quinoa",
    name: "Salmone alla piastra con asparagi e quinoa",
    kicker: "Cena completa · matrice D10",
    course: "Piatto unico",
    cuisine: "Gourmet",
    kind: "combination",
    image: photo("part-salmon-baked-v7"),
    time: 25,
    ingredients: [
      { food: "Salmone cotto", grams: 150 },
      { food: "Quinoa cotta", grams: 160 },
      { food: "Asparagi crudi", grams: 250 },
      { food: "Olio extravergine", grams: 5 },
    ],
    parts: [
      { category: "Proteina", food: "Salmone cotto", grams: 150, label: "Salmone alla piastra · 150 g", image: photo("part-salmon-baked-v7") },
      { category: "Carboidrato", food: "Quinoa cotta", grams: 160, label: "Quinoa cotta · da circa 60 g secca", image: photo("part-quinoa-v7") },
      { category: "Contorno", food: "Asparagi crudi", grams: 250, label: "Asparagi cotti · 250 g a crudo", image: photo("part-asparagus-v113") },
      { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Risciacqua la quinoa e cuocila secondo confezione.","Elimina la parte dura degli asparagi e cuocili al vapore 8-10 minuti.","Cuoci il salmone sulla piastra fino a completa cottura e servi con limone, erba cipollina e 5 g di olio."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d11-sgombro-al-forno-con-finocchi-arancia-e-pane-di-",
    name: "Sgombro al forno con finocchi, arancia e pane di segale",
    kicker: "Cena completa · matrice D11",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("part-mackerel-baked-v11654"),
    time: 25,
    ingredients: [
      { food: "Sgombro cotto", grams: 150 },
      { food: "Finocchi crudi", grams: 200 },
      { food: "Arancia", grams: 150 },
      { food: "Pane di segale", grams: 50 },
      { food: "Olio extravergine", grams: 5 },
    ],
    parts: [
      { category: "Proteina", food: "Sgombro cotto", grams: 150, label: "Sgombro al forno · 150 g", image: photo("part-mackerel-baked-v11654") },
      { category: "Contorno", food: "Finocchi crudi", grams: 200, label: "Finocchi · 200 g", image: photo("part-fennel-v113") },
      { category: "Frutta", food: "Arancia", grams: 150, label: "Arancia · 150 g", image: photo("part-orange-v7") },
      { category: "Carboidrato", food: "Pane di segale", grams: 50, label: "Pane di segale · 50 g", image: photo("part-bread-rye-v1156") },
      { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci lo sgombro in forno a 190 °C per 15-18 minuti, fino a completa cottura.","Affetta finemente finocchi e arancia e condiscili con pepe e limone.","Servi con pane di segale e 5 g di olio misurato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d12-polpo-con-patate-pomodori-e-rucola",
    name: "Polpo con patate, pomodori e rucola",
    kicker: "Cena completa · matrice D12",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("part-octopus-v11645"),
    time: 35,
    ingredients: [
      { food: "Polpo cotto", grams: 150 },
      { food: "Patate lesse", grams: 200 },
      { food: "Pomodorini", grams: 150 },
      { food: "Rucola", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Polpo cotto", grams: 150, label: "Polpo cotto · 150 g", image: photo("part-octopus-v11645") },
      { category: "Carboidrato", food: "Patate lesse", grams: 200, label: "Patate lesse · 200 g", image: photo("part-potatoes-boiled-v7") },
      { category: "Contorno", food: "Pomodorini", grams: 150, label: "Pomodori · 150 g", image: photo("part-tomatoes-v8") },
      { category: "Contorno", food: "Rucola", grams: 50, label: "Rucola · 50 g", image: photo("part-rucola-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Se parti dal polpo crudo, puliscilo e lessalo finché è tenero; altrimenti usa polpo già cotto non condito e conservato correttamente.","Lessa le patate, lasciale intiepidire e tagliale con pomodori e rucola.","Unisci il polpo e completa con limone, prezzemolo e olio pesato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d13-burger-di-legumi-al-forno-con-verdure",
    name: "Burger di legumi al forno con verdure",
    kicker: "Cena completa · matrice D13",
    course: "Piatto unico",
    cuisine: "Vegetale",
    kind: "combination",
    image: photo("part-chickpeas-v8"),
    time: 35,
    ingredients: [
      { food: "Ceci cotti", grams: 150 },
      { food: "Fiocchi d'avena", grams: 20 },
      { food: "Carote crude", grams: 40 },
      { food: "Cipolle crude", grams: 40 },
      { food: "Melanzane", grams: 100 },
      { food: "Zucchine", grams: 80 },
      { food: "Peperoni cotti senza olio", grams: 70 },
      { food: "Pane integrale", grams: 40 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Ceci cotti", grams: 150, label: "Burger di ceci · da 150 g cotti", image: photo("part-chickpeas-v8") },
      { category: "Carboidrato", food: "Fiocchi d'avena", grams: 20, label: "Fiocchi d'avena nell'impasto · 20 g", image: photo("part-oats-v113") },
      { category: "Contorno", food: "Carote crude", grams: 40, label: "Carota · 40 g", image: photo("part-carrots-raw-v11512") },
      { category: "Contorno", food: "Cipolle crude", grams: 40, label: "Cipolla · 40 g", image: photo("part-onions-v11519") },
      { category: "Contorno", food: "Melanzane", grams: 100, label: "Melanzane grigliate · 100 g", image: photo("part-eggplant-v8") },
      { category: "Contorno", food: "Zucchine", grams: 80, label: "Zucchine grigliate · 80 g", image: photo("part-zucchini-v8") },
      { category: "Contorno", food: "Peperoni cotti senza olio", grams: 70, label: "Peperoni grigliati · 70 g", image: photo("part-peppers-cooked-v11522") },
      { category: "Carboidrato", food: "Pane integrale", grams: 40, label: "Pane integrale · 40 g", image: photo("part-bread-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO complessivo · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Schiaccia i ceci e uniscili ad avena, carota e cipolla tritate con paprika e prezzemolo.","Forma il burger e cuocilo a 190 °C per 20-25 minuti, girandolo a metà cottura.","Griglia le verdure e servi con pane e 10 g di olio complessivi."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d14-tempeh-al-forno-con-cavolo-rosso-e-patata-dolce",
    name: "Tempeh al forno con cavolo rosso e patata dolce",
    kicker: "Cena completa · matrice D14",
    course: "Piatto unico",
    cuisine: "Vegetale",
    kind: "combination",
    image: photo("part-tempeh-v11520"),
    time: 35,
    ingredients: [
      { food: "Tempeh", grams: 100 },
      { food: "Patata dolce cotta", grams: 200 },
      { food: "Cavolo rosso crudo", grams: 250 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Tempeh", grams: 100, label: "Tempeh al forno · 100 g", image: photo("part-tempeh-v11520") },
      { category: "Carboidrato", food: "Patata dolce cotta", grams: 200, label: "Patata dolce al forno · 200 g", image: photo("part-sweet-potato-v8") },
      { category: "Contorno", food: "Cavolo rosso crudo", grams: 250, label: "Cavolo rosso cotto · 250 g", image: photo("part-red-cabbage-v11515") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Taglia patata dolce e cavolo e cuocili a 200 °C con zenzero, paprika e aceto di mele.","Aggiungi il tempeh a fette negli ultimi 15 minuti e giralo una volta.","Usa complessivamente i 10 g di olio misurati."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d15-branzino-al-vapore-con-orzo-e-bietole",
    name: "Branzino al vapore con orzo e bietole",
    kicker: "Cena completa · matrice D15",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-branzino-baked-v11654"),
    time: 30,
    ingredients: [
      { food: "Branzino cotto", grams: 150 },
      { food: "Orzo perlato cotto", grams: 170 },
      { food: "Bietole cotte", grams: 250 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Branzino cotto", grams: 150, label: "Branzino al vapore · 150 g", image: photo("part-branzino-baked-v11654") },
      { category: "Carboidrato", food: "Orzo perlato cotto", grams: 170, label: "Orzo cotto · da circa 60 g secco", image: photo("part-barley-v11514") },
      { category: "Contorno", food: "Bietole cotte", grams: 250, label: "Bietole cotte · 250 g", image: photo("part-chard-v11515") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Sciacqua l'orzo e lessalo secondo confezione, poi scolalo.","Cuoci branzino e bietole al vapore separatamente fino a cottura completa.","Servi con limone, aglio, prezzemolo e 10 g di olio pesato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d16-manzo-magro-con-radicchio-funghi-e-polenta",
    name: "Manzo magro con radicchio, funghi e polenta",
    kicker: "Cena completa · matrice D16",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("part-steak-beef-v114"),
    time: 30,
    ingredients: [
      { food: "Bistecca di manzo · peso a crudo", grams: 100 },
      { food: "Polenta cotta", grams: 300 },
      { food: "Radicchio cotto", grams: 120 },
      { food: "Funghi", grams: 130 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Proteina", food: "Bistecca di manzo · peso a crudo", grams: 100, label: "Manzo magro alla griglia · 100 g a crudo", image: photo("part-steak-beef-v114") },
      { category: "Carboidrato", food: "Polenta cotta", grams: 300, label: "Polenta cotta · da circa 60 g secca", image: photo("part-polenta-v11515") },
      { category: "Contorno", food: "Radicchio cotto", grams: 120, label: "Radicchio grigliato · 120 g", image: photo("part-radicchio-v11515") },
      { category: "Contorno", food: "Funghi", grams: 130, label: "Funghi cotti · 130 g", image: photo("part-mushrooms-raw-v11663") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Prepara la polenta seguendo la confezione e tienila morbida.","Griglia radicchio e manzo; cuoci i funghi in padella antiaderente con poca acqua e rosmarino.","Servi subito e distribuisci i 10 g di olio pesato sulle verdure."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  }
];


const attachmentDinnersB: Recipe[] = [
  {
    id: "matrix-d17-trota-al-forno-con-zucca-e-patate",
    name: "Trota al forno con zucca e patate", kicker: "Cena completa · matrice D17", course: "Piatto unico", cuisine: "Italiano", kind: "combination",
    image: photo("part-trout-v11645"), time: 40,
    ingredients: [{ food: "Trota cotta", grams: 150 }, { food: "Patate lesse", grams: 150 }, { food: "Zucca", grams: 200 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Trota cotta", grams: 150, label: "Trota al forno · 150 g", image: photo("part-trout-v11645") }, { category: "Carboidrato", food: "Patate lesse", grams: 150, label: "Patate al forno · 150 g", image: photo("part-potatoes-boiled-v7") }, { category: "Contorno", food: "Zucca", grams: 200, label: "Zucca al forno · 200 g", image: photo("part-pumpkin-v8") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Taglia patate e zucca a pezzi regolari e cuocile a 200 °C per 20 minuti.","Aggiungi la trota con rosmarino, limone e aglio e prosegui 15-20 minuti, fino a completa cottura.","Usa complessivamente 10 g di olio misurato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d18-tacchino-con-carciofi-e-pane-integrale",
    name: "Tacchino con carciofi e pane integrale", kicker: "Cena completa · matrice D18", course: "Piatto unico", cuisine: "Italiano", kind: "combination",
    image: photo("part-turkey-grilled-v11514"), time: 30,
    ingredients: [{ food: "Petto di tacchino cotto alla piastra", grams: 100 }, { food: "Carciofi cotti bolliti", grams: 250 }, { food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Petto di tacchino cotto alla piastra", grams: 100, label: "Tacchino alla griglia · 100 g", image: photo("part-turkey-grilled-v11514") }, { category: "Contorno", food: "Carciofi cotti bolliti", grams: 250, label: "Carciofi in umido · 250 g", image: photo("part-artichokes-v11519") }, { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Pulisci i carciofi, affettali e cuocili coperti con poca acqua, aglio e prezzemolo per 18-22 minuti.","Griglia il tacchino fino a completa cottura e condiscilo con limone e pepe.","Servi con pane e 10 g di olio complessivi."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d19-seppie-con-piselli-e-polenta",
    name: "Seppie con piselli e polenta", kicker: "Cena completa · matrice D19", course: "Piatto unico", cuisine: "Italiano", kind: "combination",
    image: photo("part-cuttlefish-v11520"), time: 40,
    ingredients: [{ food: "Seppia · peso a crudo", grams: 150 }, { food: "Piselli cotti", grams: 120 }, { food: "Passata di pomodoro", grams: 100 }, { food: "Cipolle crude", grams: 50 }, { food: "Polenta cotta", grams: 300 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Seppia · peso a crudo", grams: 150, label: "Seppie in umido · 150 g a crudo", image: photo("part-cuttlefish-v11520") }, { category: "Proteina", food: "Piselli cotti", grams: 120, label: "Piselli cotti · 120 g", image: photo("part-peas-v8") }, { category: "Contorno", food: "Passata di pomodoro", grams: 100, label: "Pomodoro · 100 g", image: photo("part-passata-v11652") }, { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolla · 50 g", image: photo("part-onions-v11519") }, { category: "Carboidrato", food: "Polenta cotta", grams: 300, label: "Polenta cotta · da circa 60 g secca", image: photo("part-polenta-v11515") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Affetta la cipolla e cuocila dolcemente con poca acqua; aggiungi seppie e passata e cuoci finché tenere.","Unisci i piselli negli ultimi 8-10 minuti.","Prepara la polenta secondo confezione e servi con 10 g di olio complessivi."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d20-omelette-con-funghi-spinaci-e-ricotta",
    name: "Omelette con funghi, spinaci e ricotta", kicker: "Cena completa · matrice D20", course: "Piatto unico", cuisine: "Italiano", kind: "combination",
    image: photo("part-eggs-scrambled-v1156"), time: 20,
    ingredients: [{ food: "Uova strapazzate o in frittata", grams: 100 }, { food: "Funghi", grams: 125 }, { food: "Spinaci", grams: 125 }, { food: "Ricotta vaccina", grams: 50 }, { food: "Pane di segale", grams: 40 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Uova strapazzate o in frittata", grams: 100, label: "Omelette · 2 uova", image: photo("part-eggs-scrambled-v1156") }, { category: "Contorno", food: "Funghi", grams: 125, label: "Funghi cotti · 125 g", image: photo("part-mushrooms-raw-v11663") }, { category: "Contorno", food: "Spinaci", grams: 125, label: "Spinaci cotti · 125 g", image: photo("part-spinach-v7") }, { category: "Latticino", food: "Ricotta vaccina", grams: 50, label: "Ricotta · 50 g", image: photo("part-ricotta-v7") }, { category: "Carboidrato", food: "Pane di segale", grams: 40, label: "Pane di segale · 40 g", image: photo("part-bread-rye-v1156") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO complessivo · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Cuoci funghi e spinaci in padella antiaderente finché perdono l'acqua in eccesso.","Aggiungi due uova sbattute, completa con ricotta e cuoci con coperchio fino al centro ben rappreso.","Servi con pane e usa complessivamente 10 g di olio."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d21-branzino-con-finocchi-pomodori-e-riso-integrale",
    name: "Branzino con finocchi, pomodori e riso integrale", kicker: "Cena completa · matrice D21", course: "Piatto unico", cuisine: "Mediterraneo", kind: "combination",
    image: photo("part-branzino-baked-v11654"), time: 35,
    ingredients: [{ food: "Branzino cotto", grams: 150 }, { food: "Riso integrale secco", grams: 60 }, { food: "Finocchi crudi", grams: 125 }, { food: "Pomodorini", grams: 125 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Branzino cotto", grams: 150, label: "Branzino al forno · 150 g", image: photo("part-branzino-baked-v11654") }, { category: "Carboidrato", food: "Riso integrale secco", grams: 60, label: "Riso integrale · 60 g a crudo", image: photo("part-brown-rice-v11519") }, { category: "Contorno", food: "Finocchi crudi", grams: 125, label: "Finocchi · 125 g", image: photo("part-fennel-v113") }, { category: "Contorno", food: "Pomodorini", grams: 125, label: "Pomodori · 125 g", image: photo("part-tomatoes-v8") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Cuoci il riso integrale secondo confezione.","Affetta i finocchi e cuocili al forno con il branzino, limone e timo fino a completa cottura del pesce.","Aggiungi i pomodori freschi e 10 g di olio misurato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d22-zuppa-di-ceci-bietole-e-patate",
    name: "Zuppa di ceci, bietole e patate", kicker: "Cena completa · matrice D22", course: "Piatto unico", cuisine: "Italiano", kind: "combination",
    image: photo("part-chickpeas-v8"), time: 35,
    ingredients: [{ food: "Ceci cotti", grams: 150 }, { food: "Patate lesse", grams: 150 }, { food: "Bietole cotte", grams: 100 }, { food: "Carote crude", grams: 50 }, { food: "Sedano crudo", grams: 50 }, { food: "Cipolle crude", grams: 50 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Ceci cotti", grams: 150, label: "Ceci cotti e sgocciolati · 150 g", image: photo("part-chickpeas-v8") }, { category: "Carboidrato", food: "Patate lesse", grams: 150, label: "Patate · 150 g", image: photo("part-potatoes-boiled-v7") }, { category: "Contorno", food: "Bietole cotte", grams: 100, label: "Bietole · 100 g", image: photo("part-chard-v11515") }, { category: "Contorno", food: "Carote crude", grams: 50, label: "Carote · 50 g", image: photo("part-carrots-raw-v11512") }, { category: "Contorno", food: "Sedano crudo", grams: 50, label: "Sedano · 50 g", image: photo("part-celery-v1154") }, { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolla · 50 g", image: photo("part-onions-v11519") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Taglia patate, carote, sedano e cipolla e cuocili in acqua finché sono teneri.","Aggiungi ceci e bietole e prosegui 10 minuti; frulla soltanto una piccola parte per addensare.","Completa nel piatto con rosmarino, pepe e olio pesato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d23-polpette-di-lenticchie-con-melanzane-e-salsa-all",
    name: "Polpette di lenticchie con melanzane e salsa allo yogurt", kicker: "Cena completa · matrice D23", course: "Piatto unico", cuisine: "Vegetale", kind: "combination",
    image: photo("part-lentils-v1141"), time: 40,
    ingredients: [{ food: "Lenticchie cotte", grams: 150 }, { food: "Fiocchi d'avena", grams: 20 }, { food: "Carote crude", grams: 40 }, { food: "Cipolle crude", grams: 40 }, { food: "Melanzane", grams: 150 }, { food: "Pomodorini", grams: 100 }, { food: "Yogurt bianco", grams: 60 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Lenticchie cotte", grams: 150, label: "Polpette di lenticchie · da 150 g cotti", image: photo("part-lentils-v1141") }, { category: "Carboidrato", food: "Fiocchi d'avena", grams: 20, label: "Avena nell'impasto · 20 g", image: photo("part-oats-v113") }, { category: "Contorno", food: "Carote crude", grams: 40, label: "Carota · 40 g", image: photo("part-carrots-raw-v11512") }, { category: "Contorno", food: "Cipolle crude", grams: 40, label: "Cipolla · 40 g", image: photo("part-onions-v11519") }, { category: "Contorno", food: "Melanzane", grams: 150, label: "Melanzane · 150 g", image: photo("part-eggplant-v8") }, { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori · 100 g", image: photo("part-tomatoes-v8") }, { category: "Latticino", food: "Yogurt bianco", grams: 60, label: "Salsa di yogurt · 60 g", image: photo("part-yogurt-white-v11651") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO complessivo · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Schiaccia le lenticchie e uniscile ad avena, carota e cipolla tritate con paprika e prezzemolo.","Forma le polpette e cuocile a 190 °C per 20-25 minuti; arrostisci melanzane e pomodori.","Mescola yogurt e limone e servi usando 10 g di olio complessivi."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d24-salmone-con-cavolo-rosso-e-patata-dolce",
    name: "Salmone con cavolo rosso e patata dolce", kicker: "Cena completa · matrice D24", course: "Piatto unico", cuisine: "Mediterraneo", kind: "combination",
    image: photo("part-salmon-baked-v7"), time: 35,
    ingredients: [{ food: "Salmone cotto", grams: 150 }, { food: "Patata dolce cotta", grams: 200 }, { food: "Cavolo rosso crudo", grams: 250 }, { food: "Olio extravergine", grams: 5 }],
    parts: [{ category: "Proteina", food: "Salmone cotto", grams: 150, label: "Salmone al forno o piastra · 150 g", image: photo("part-salmon-baked-v7") }, { category: "Carboidrato", food: "Patata dolce cotta", grams: 200, label: "Patata dolce · 200 g", image: photo("part-sweet-potato-v8") }, { category: "Contorno", food: "Cavolo rosso crudo", grams: 250, label: "Cavolo rosso cotto · 250 g", image: photo("part-red-cabbage-v11515") }, { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") }],
    steps: ["Taglia patata dolce e cavolo e cuocili al forno a 200 °C finché teneri.","Cuoci il salmone alla piastra o al forno fino a completa cottura.","Condisci con aceto di mele, pepe, erba cipollina e 5 g di olio."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d25-tofu-al-curry-con-zucca-e-riso-basmati",
    name: "Tofu al curry con zucca e riso basmati", kicker: "Cena completa · matrice D25", course: "Piatto unico", cuisine: "Asiatico", kind: "combination",
    image: photo("part-tofu-v11515"), time: 30,
    ingredients: [{ food: "Tofu alla piastra", grams: 100 }, { food: "Riso basmati secco", grams: 60 }, { food: "Zucca", grams: 180 }, { food: "Spinaci", grams: 70 }, { food: "Cipolle crude", grams: 50 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Tofu alla piastra", grams: 100, label: "Tofu grigliato · 100 g", image: photo("part-tofu-v11515") }, { category: "Carboidrato", food: "Riso basmati secco", grams: 60, label: "Riso basmati · 60 g a crudo", image: photo("part-basmati-dry-v11650") }, { category: "Contorno", food: "Zucca", grams: 180, label: "Zucca · 180 g", image: photo("part-pumpkin-v8") }, { category: "Contorno", food: "Spinaci", grams: 70, label: "Spinaci · 70 g", image: photo("part-spinach-v7") }, { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolla · 50 g", image: photo("part-onions-v11519") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Cuoci il basmati secondo confezione.","Griglia il tofu; cuoci zucca e cipolla con curry, curcuma, zenzero e poca acqua, aggiungendo gli spinaci alla fine.","Servi con 10 g di olio complessivi."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d26-coniglio-al-rosmarino-con-verdure-al-forno",
    name: "Coniglio al rosmarino con verdure al forno", kicker: "Cena completa · matrice D26", course: "Piatto unico", cuisine: "Italiano", kind: "combination",
    image: photo("part-rabbit-v11515"), time: 45,
    ingredients: [{ food: "Coniglio cotto in umido", grams: 100 }, { food: "Zucchine", grams: 80 }, { food: "Peperoni cotti senza olio", grams: 80 }, { food: "Cipolle crude", grams: 70 }, { food: "Carote cotte bollite", grams: 70 }, { food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Coniglio cotto in umido", grams: 100, label: "Coniglio al rosmarino · 100 g", image: photo("part-rabbit-v11515") }, { category: "Contorno", food: "Zucchine", grams: 80, label: "Zucchine · 80 g", image: photo("part-zucchini-v8") }, { category: "Contorno", food: "Peperoni cotti senza olio", grams: 80, label: "Peperoni · 80 g", image: photo("part-peppers-cooked-v11522") }, { category: "Contorno", food: "Cipolle crude", grams: 70, label: "Cipolla · 70 g", image: photo("part-onions-v11519") }, { category: "Contorno", food: "Carote cotte bollite", grams: 70, label: "Carote · 70 g", image: photo("part-carrots-cooked-v11512") }, { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Disponi il coniglio con rosmarino, salvia e aglio e cuocilo al forno fino a completa cottura.","Aggiungi le verdure a pezzi regolari senza superare i 10 g di olio complessivi.","Servi con il pane separato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d27-calamari-alla-griglia-con-quinoa-e-verdure",
    name: "Calamari alla griglia con quinoa e verdure", kicker: "Cena completa · matrice D27", course: "Piatto unico", cuisine: "Mediterraneo", kind: "combination",
    image: photo("part-calamari-grilled-v11654"), time: 25,
    ingredients: [{ food: "Calamari cotti alla griglia", grams: 150 }, { food: "Quinoa cotta", grams: 160 }, { food: "Zucchine", grams: 100 }, { food: "Pomodorini", grams: 100 }, { food: "Rucola", grams: 50 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Calamari cotti alla griglia", grams: 150, label: "Calamari alla griglia · 150 g", image: photo("part-calamari-grilled-v11654") }, { category: "Carboidrato", food: "Quinoa cotta", grams: 160, label: "Quinoa cotta · da circa 60 g secca", image: photo("part-quinoa-v7") }, { category: "Contorno", food: "Zucchine", grams: 100, label: "Zucchine · 100 g", image: photo("part-zucchini-v8") }, { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori · 100 g", image: photo("part-tomatoes-v8") }, { category: "Contorno", food: "Rucola", grams: 50, label: "Rucola · 50 g", image: photo("part-rucola-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Risciacqua e cuoci la quinoa secondo confezione.","Tampona i calamari e grigliali rapidamente su piastra molto calda fino a cottura completa; cuoci separatamente le zucchine.","Servi con pomodori, rucola, limone, prezzemolo e 10 g di olio."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  },
  {
    id: "matrix-d28-fave-cicoria-e-pane-integrale",
    name: "Fave, cicoria e pane integrale", kicker: "Cena completa · matrice D28", course: "Piatto unico", cuisine: "Italiano", kind: "combination",
    image: photo("part-fave-cooked-v11654"), time: 30,
    ingredients: [{ food: "Fave cotte", grams: 150 }, { food: "Cicoria cotta", grams: 250 }, { food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 10 }],
    parts: [{ category: "Proteina", food: "Fave cotte", grams: 150, label: "Fave cotte · 150 g", image: photo("part-fave-cooked-v11654") }, { category: "Contorno", food: "Cicoria cotta", grams: 250, label: "Cicoria lessa · 250 g", image: photo("part-cicoria-cooked-v11655") }, { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale tostato · 50 g", image: photo("part-bread-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }],
    steps: ["Frulla una parte delle fave con poca acqua fino a ottenere una crema grossolana.","Lessa la cicoria, scolala bene e condiscila con aglio, peperoncino e limone.","Servi con pane tostato e 10 g di olio pesato."],
    alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"],
  }
];


const attachmentDinnersC: Recipe[] = [
  { id: "matrix-d29-nasello-al-vapore-con-patata-dolce-e-bietole", name: "Nasello al vapore con patata dolce e bietole", kicker: "Cena completa · matrice D29", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-nasello-steamed-v11654"), time: 35, ingredients: [{ food: "Nasello cotto", grams: 150 }, { food: "Patata dolce cotta", grams: 200 }, { food: "Bietole cotte", grams: 250 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Nasello cotto", grams: 150, label: "Nasello al vapore · 150 g", image: photo("part-nasello-steamed-v11654") }, { category: "Carboidrato", food: "Patata dolce cotta", grams: 200, label: "Patata dolce al forno · 200 g", image: photo("part-sweet-potato-v8") }, { category: "Contorno", food: "Bietole cotte", grams: 250, label: "Bietole lesse · 250 g", image: photo("part-chard-v11515") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci il nasello al vapore fino a completa cottura.","Taglia e arrostisci la patata dolce a 200 °C; lessa e scola bene le bietole.","Condisci con limone, aglio, prezzemolo e 10 g di olio misurato."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d30-pollo-al-rosmarino-con-cavolfiore-e-pane", name: "Pollo al rosmarino con cavolfiore e pane", kicker: "Cena completa · matrice D30", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-chicken-raw-v11651"), time: 30, ingredients: [{ food: "Petto di pollo · peso a crudo", grams: 100 }, { food: "Cavolfiore", grams: 250 }, { food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 100, label: "Pollo alla griglia · 100 g a crudo", image: photo("part-chicken-raw-v11651") }, { category: "Contorno", food: "Cavolfiore", grams: 250, label: "Cavolfiore al forno · 250 g", image: photo("part-cauliflower-v8") }, { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Dividi il cavolfiore in cimette e cuocilo a 200 °C con paprika finché tenero e dorato.","Griglia il pollo con rosmarino e limone fino a completa cottura.","Servi con pane e usa complessivamente 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d31-zuppa-di-fagioli-borlotti-e-orzo", name: "Zuppa di fagioli borlotti e orzo", kicker: "Cena completa · matrice D31", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-borlotti-cooked-v11654"), time: 40, ingredients: [{ food: "Fagioli borlotti cotti", grams: 150 }, { food: "Orzo perlato cotto", grams: 140 }, { food: "Carote crude", grams: 70 }, { food: "Sedano crudo", grams: 60 }, { food: "Cipolle crude", grams: 60 }, { food: "Passata di pomodoro", grams: 60 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Fagioli borlotti cotti", grams: 150, label: "Borlotti cotti · 150 g", image: photo("part-borlotti-cooked-v11654") }, { category: "Carboidrato", food: "Orzo perlato cotto", grams: 140, label: "Orzo cotto · da circa 50 g secco", image: photo("part-barley-v11514") }, { category: "Contorno", food: "Carote crude", grams: 70, label: "Carote · 70 g", image: photo("part-carrots-raw-v11512") }, { category: "Contorno", food: "Sedano crudo", grams: 60, label: "Sedano · 60 g", image: photo("part-celery-v1154") }, { category: "Contorno", food: "Cipolle crude", grams: 60, label: "Cipolla · 60 g", image: photo("part-onions-v11519") }, { category: "Contorno", food: "Passata di pomodoro", grams: 60, label: "Pomodoro · 60 g", image: photo("part-passata-v11652") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Taglia carota, sedano e cipolla e cuocili con passata e acqua.","Aggiungi l'orzo e cuocilo secondo confezione; unisci i borlotti verso fine cottura.","Completa con rosmarino, pepe e olio pesato a crudo."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d32-frittata-al-forno-con-broccoli-e-patate", name: "Frittata al forno con broccoli e patate", kicker: "Cena completa · matrice D32", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-eggs-scrambled-v1156"), time: 35, ingredients: [{ food: "Uova strapazzate o in frittata", grams: 100 }, { food: "Broccoli bolliti", grams: 200 }, { food: "Patate lesse", grams: 150 }, { food: "Insalata verde", grams: 80 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Uova strapazzate o in frittata", grams: 100, label: "Frittata al forno · 2 uova", image: photo("part-eggs-scrambled-v1156") }, { category: "Contorno", food: "Broccoli bolliti", grams: 200, label: "Broccoli · 200 g", image: photo("part-broccoli-v1154") }, { category: "Carboidrato", food: "Patate lesse", grams: 150, label: "Patate · 150 g", image: photo("part-potatoes-boiled-v7") }, { category: "Contorno", food: "Insalata verde", grams: 80, label: "Insalata · 80 g", image: photo("part-lettuce-v8") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO complessivo · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Lessa patate e broccoli lasciandoli consistenti e tagliali.","Uniscili a due uova sbattute e cuoci a 180 °C finché il centro è completamente rappreso.","Servi con insalata e 10 g di olio complessivi."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d33-tempeh-con-peperoni-e-quinoa", name: "Tempeh con peperoni e quinoa", kicker: "Cena completa · matrice D33", course: "Piatto unico", cuisine: "Vegetale", kind: "combination", image: photo("part-tempeh-v11520"), time: 30, ingredients: [{ food: "Tempeh", grams: 100 }, { food: "Quinoa cotta", grams: 160 }, { food: "Peperoni cotti senza olio", grams: 100 }, { food: "Zucchine", grams: 90 }, { food: "Cipolle crude", grams: 60 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Tempeh", grams: 100, label: "Tempeh grigliato · 100 g", image: photo("part-tempeh-v11520") }, { category: "Carboidrato", food: "Quinoa cotta", grams: 160, label: "Quinoa cotta · da circa 60 g secca", image: photo("part-quinoa-v7") }, { category: "Contorno", food: "Peperoni cotti senza olio", grams: 100, label: "Peperoni · 100 g", image: photo("part-peppers-cooked-v11522") }, { category: "Contorno", food: "Zucchine", grams: 90, label: "Zucchine · 90 g", image: photo("part-zucchini-v8") }, { category: "Contorno", food: "Cipolle crude", grams: 60, label: "Cipolla · 60 g", image: photo("part-onions-v11519") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci la quinoa secondo confezione.","Griglia tempeh, peperoni, zucchine e cipolla con paprika e zenzero.","Unisci con limone e 10 g di olio misurato."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d34-orata-al-forno-con-carciofi-e-patate", name: "Orata al forno con carciofi e patate", kicker: "Cena completa · matrice D34", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-sea-bream-baked-v8"), time: 40, ingredients: [{ food: "Orata cotta", grams: 150 }, { food: "Patate lesse", grams: 200 }, { food: "Carciofi cotti bolliti", grams: 200 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Orata cotta", grams: 150, label: "Orata al forno · 150 g", image: photo("part-sea-bream-baked-v8") }, { category: "Carboidrato", food: "Patate lesse", grams: 200, label: "Patate al forno · 200 g", image: photo("part-potatoes-boiled-v7") }, { category: "Contorno", food: "Carciofi cotti bolliti", grams: 200, label: "Carciofi · 200 g", image: photo("part-artichokes-v11519") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Taglia patate e carciofi e cuocili a 200 °C per circa 20 minuti.","Aggiungi l'orata con aglio, prezzemolo e limone e prosegui 15-20 minuti, fino a completa cottura.","Usa complessivamente 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d35-tofu-con-cavolo-nero-funghi-e-riso-basmati", name: "Tofu con cavolo nero, funghi e riso basmati", kicker: "Cena completa · matrice D35", course: "Piatto unico", cuisine: "Asiatico", kind: "combination", image: photo("part-tofu-v11515"), time: 30, ingredients: [{ food: "Tofu alla piastra", grams: 100 }, { food: "Riso basmati secco", grams: 60 }, { food: "Cavolo nero cotto", grams: 130 }, { food: "Funghi", grams: 120 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Tofu alla piastra", grams: 100, label: "Tofu grigliato · 100 g", image: photo("part-tofu-v11515") }, { category: "Carboidrato", food: "Riso basmati secco", grams: 60, label: "Riso basmati · 60 g a crudo", image: photo("part-basmati-dry-v11650") }, { category: "Contorno", food: "Cavolo nero cotto", grams: 130, label: "Cavolo nero · 130 g", image: photo("part-kale-v11515") }, { category: "Contorno", food: "Funghi", grams: 120, label: "Funghi · 120 g", image: photo("part-mushrooms-raw-v11663") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci il basmati secondo confezione.","Griglia il tofu; cuoci cavolo nero e funghi in padella antiaderente con poca acqua, zenzero e aglio.","Servi con 10 g di olio e peperoncino facoltativo."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d36-vitello-magro-con-asparagi-e-polenta", name: "Vitello magro con asparagi e polenta", kicker: "Cena completa · matrice D36", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-steak-veal-v114"), time: 30, ingredients: [{ food: "Bistecca di vitello · peso a crudo", grams: 100 }, { food: "Polenta cotta", grams: 300 }, { food: "Asparagi crudi", grams: 250 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Bistecca di vitello · peso a crudo", grams: 100, label: "Vitello alla griglia · 100 g a crudo", image: photo("part-steak-veal-v114") }, { category: "Carboidrato", food: "Polenta cotta", grams: 300, label: "Polenta cotta · da circa 60 g secca", image: photo("part-polenta-v11515") }, { category: "Contorno", food: "Asparagi crudi", grams: 250, label: "Asparagi cotti · 250 g a crudo", image: photo("part-asparagus-v113") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Prepara la polenta secondo confezione.","Elimina la parte dura degli asparagi e cuocili al vapore; griglia il vitello fino al grado di cottura sicuro desiderato.","Condisci con salvia, limone, pepe e 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d37-cozze-al-pomodoro-con-pane-e-verdure-grigliate", name: "Cozze al pomodoro con pane e verdure grigliate", kicker: "Cena completa · matrice D37", course: "Piatto unico", cuisine: "Mediterraneo", kind: "combination", image: photo("part-mussels-cooked-v11654"), time: 35, ingredients: [{ food: "Cozze cotte", grams: 150 }, { food: "Passata di pomodoro", grams: 100 }, { food: "Sedano crudo", grams: 50 }, { food: "Cipolle crude", grams: 50 }, { food: "Melanzane", grams: 70 }, { food: "Zucchine", grams: 70 }, { food: "Peperoni cotti senza olio", grams: 60 }, { food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Cozze cotte", grams: 150, label: "Cozze cotte · 150 g edibile", image: photo("part-mussels-cooked-v11654") }, { category: "Contorno", food: "Passata di pomodoro", grams: 100, label: "Salsa di pomodoro · 100 g", image: photo("part-passata-v11652") }, { category: "Contorno", food: "Sedano crudo", grams: 50, label: "Sedano · 50 g", image: photo("part-celery-v1154") }, { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolla · 50 g", image: photo("part-onions-v11519") }, { category: "Contorno", food: "Melanzane", grams: 70, label: "Melanzane grigliate · 70 g", image: photo("part-eggplant-v8") }, { category: "Contorno", food: "Zucchine", grams: 70, label: "Zucchine grigliate · 70 g", image: photo("part-zucchini-v8") }, { category: "Contorno", food: "Peperoni cotti senza olio", grams: 60, label: "Peperoni grigliati · 60 g", image: photo("part-peppers-cooked-v11522") }, { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Pulisci accuratamente le cozze, cuocile finché si aprono ed elimina quelle rimaste chiuse.","Prepara una salsa leggera con passata, sedano e cipolla; griglia separatamente le verdure.","Servi con pane, prezzemolo, peperoncino e 10 g di olio complessivi."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d38-burger-di-ceci-con-radicchio-e-patata-dolce", name: "Burger di ceci con radicchio e patata dolce", kicker: "Cena completa · matrice D38", course: "Piatto unico", cuisine: "Vegetale", kind: "combination", image: photo("part-chickpeas-v8"), time: 40, ingredients: [{ food: "Ceci cotti", grams: 150 }, { food: "Fiocchi d'avena", grams: 20 }, { food: "Carote crude", grams: 40 }, { food: "Cipolle crude", grams: 40 }, { food: "Radicchio cotto", grams: 200 }, { food: "Patata dolce cotta", grams: 150 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Ceci cotti", grams: 150, label: "Burger di ceci · da 150 g cotti", image: photo("part-chickpeas-v8") }, { category: "Carboidrato", food: "Fiocchi d'avena", grams: 20, label: "Avena nell'impasto · 20 g", image: photo("part-oats-v113") }, { category: "Contorno", food: "Carote crude", grams: 40, label: "Carota · 40 g", image: photo("part-carrots-raw-v11512") }, { category: "Contorno", food: "Cipolle crude", grams: 40, label: "Cipolla · 40 g", image: photo("part-onions-v11519") }, { category: "Contorno", food: "Radicchio cotto", grams: 200, label: "Radicchio cotto · 200 g", image: photo("part-radicchio-v11515") }, { category: "Carboidrato", food: "Patata dolce cotta", grams: 150, label: "Patata dolce · 150 g", image: photo("part-sweet-potato-v8") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO complessivo · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Schiaccia i ceci e uniscili ad avena, carota e cipolla tritate con paprika.","Forma il burger e cuocilo a 190 °C per 20-25 minuti; cuoci separatamente radicchio e patata dolce.","Servi con prezzemolo e 10 g di olio complessivi."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d39-ricotta-con-verdure-grigliate-e-riso-rosso", name: "Ricotta con verdure grigliate e riso rosso", kicker: "Cena completa · matrice D39", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-ricotta-v7"), time: 30, ingredients: [{ food: "Ricotta vaccina", grams: 100 }, { food: "Riso rosso integrale cotto", grams: 180 }, { food: "Melanzane", grams: 100 }, { food: "Zucchine", grams: 100 }, { food: "Peperoni cotti senza olio", grams: 100 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Latticino", food: "Ricotta vaccina", grams: 100, label: "Ricotta · 100 g", image: photo("part-ricotta-v7") }, { category: "Carboidrato", food: "Riso rosso integrale cotto", grams: 180, label: "Riso rosso cotto · da circa 60 g secco", image: photo("part-red-rice-v11514") }, { category: "Contorno", food: "Melanzane", grams: 100, label: "Melanzane · 100 g", image: photo("part-eggplant-v8") }, { category: "Contorno", food: "Zucchine", grams: 100, label: "Zucchine · 100 g", image: photo("part-zucchini-v8") }, { category: "Contorno", food: "Peperoni cotti senza olio", grams: 100, label: "Peperoni · 100 g", image: photo("part-peppers-cooked-v11522") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci il riso rosso secondo confezione.","Griglia melanzane, zucchine e peperoni senza aggiungere grassi non conteggiati.","Servi con ricotta, basilico, origano, pepe e 10 g di olio misurato."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d40-sardine-al-forno-con-pomodori-zucchine-e-cous-co", name: "Sardine al forno con pomodori, zucchine e cous cous", kicker: "Cena completa · matrice D40", course: "Piatto unico", cuisine: "Mediterraneo", kind: "combination", image: photo("part-sardines-baked-v11654"), time: 30, ingredients: [{ food: "Sardine cotte", grams: 150 }, { food: "Cous cous integrale cotto", grams: 170 }, { food: "Pomodorini", grams: 125 }, { food: "Zucchine", grams: 125 }, { food: "Olio extravergine", grams: 5 }], parts: [{ category: "Proteina", food: "Sardine cotte", grams: 150, label: "Sardine al forno · 150 g", image: photo("part-sardines-baked-v11654") }, { category: "Carboidrato", food: "Cous cous integrale cotto", grams: 170, label: "Cous cous cotto · da circa 60 g secco", image: photo("part-couscous-v11514") }, { category: "Contorno", food: "Pomodorini", grams: 125, label: "Pomodori · 125 g", image: photo("part-tomatoes-v8") }, { category: "Contorno", food: "Zucchine", grams: 125, label: "Zucchine · 125 g", image: photo("part-zucchini-v8") }, { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci sardine, pomodori e zucchine al forno a 190 °C fino a completa cottura.","Prepara il cous cous secondo confezione e sgranalo.","Servi con limone, prezzemolo, aglio e 5 g di olio misurato."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] }
];


const attachmentDinnersD: Recipe[] = [
  { id: "matrix-d49-burger-di-fagioli-rossi-con-cavolo-e-patate", name: "Burger di fagioli rossi con cavolo e patate", kicker: "Cena completa · matrice D49", course: "Piatto unico", cuisine: "Vegetale", kind: "combination", image: photo("part-red-beans-v11643"), time: 40, ingredients: [{ food: "Fagioli rossi cotti", grams: 150 }, { food: "Fiocchi d'avena", grams: 20 }, { food: "Carote crude", grams: 40 }, { food: "Cipolle crude", grams: 40 }, { food: "Cavolo cappuccio cotto", grams: 200 }, { food: "Patate lesse", grams: 150 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Fagioli rossi cotti", grams: 150, label: "Burger di fagioli rossi · da 150 g cotti", image: photo("part-red-beans-v11643") }, { category: "Carboidrato", food: "Fiocchi d'avena", grams: 20, label: "Avena nell'impasto · 20 g", image: photo("part-oats-v113") }, { category: "Contorno", food: "Carote crude", grams: 40, label: "Carota · 40 g", image: photo("part-carrots-raw-v11512") }, { category: "Contorno", food: "Cipolle crude", grams: 40, label: "Cipolla · 40 g", image: photo("part-onions-v11519") }, { category: "Contorno", food: "Cavolo cappuccio cotto", grams: 200, label: "Cavolo cappuccio cotto · 200 g", image: photo("part-green-cabbage-cooked-v11657") }, { category: "Carboidrato", food: "Patate lesse", grams: 150, label: "Patate · 150 g", image: photo("part-potatoes-boiled-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO complessivo · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Schiaccia i fagioli e uniscili ad avena, carota e cipolla tritate con paprika e pepe.","Forma il burger e cuocilo a 190 °C per 20-25 minuti; cuoci separatamente cavolo e patate.","Servi usando complessivamente 10 g di olio misurato."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d50-tacchino-con-funghi-spinaci-e-polenta", name: "Tacchino con funghi, spinaci e polenta", kicker: "Cena completa · matrice D50", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-turkey-grilled-v11514"), time: 30, ingredients: [{ food: "Petto di tacchino cotto alla piastra", grams: 100 }, { food: "Polenta cotta", grams: 300 }, { food: "Funghi", grams: 125 }, { food: "Spinaci", grams: 125 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Petto di tacchino cotto alla piastra", grams: 100, label: "Tacchino alla griglia · 100 g", image: photo("part-turkey-grilled-v11514") }, { category: "Carboidrato", food: "Polenta cotta", grams: 300, label: "Polenta cotta · da circa 60 g secca", image: photo("part-polenta-v11515") }, { category: "Contorno", food: "Funghi", grams: 125, label: "Funghi · 125 g", image: photo("part-mushrooms-raw-v11663") }, { category: "Contorno", food: "Spinaci", grams: 125, label: "Spinaci · 125 g", image: photo("part-spinach-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Prepara la polenta secondo confezione.","Griglia il tacchino fino a completa cottura; cuoci funghi e spinaci in padella antiaderente con timo e aglio.","Servi con 10 g di olio misurato."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d51-sardine-con-cavolo-rosso-finocchi-e-pane-di-sega", name: "Sardine con cavolo rosso, finocchi e pane di segale", kicker: "Cena completa · matrice D51", course: "Piatto unico", cuisine: "Mediterraneo", kind: "combination", image: photo("part-sardines-baked-v11654"), time: 25, ingredients: [{ food: "Sardine cotte", grams: 150 }, { food: "Cavolo rosso crudo", grams: 125 }, { food: "Finocchi crudi", grams: 125 }, { food: "Pane di segale", grams: 50 }, { food: "Olio extravergine", grams: 5 }], parts: [{ category: "Proteina", food: "Sardine cotte", grams: 150, label: "Sardine al forno · 150 g", image: photo("part-sardines-baked-v11654") }, { category: "Contorno", food: "Cavolo rosso crudo", grams: 125, label: "Cavolo rosso · 125 g", image: photo("part-red-cabbage-v11515") }, { category: "Contorno", food: "Finocchi crudi", grams: 125, label: "Finocchi · 125 g", image: photo("part-fennel-v113") }, { category: "Carboidrato", food: "Pane di segale", grams: 50, label: "Pane di segale · 50 g", image: photo("part-bread-rye-v1156") }, { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci le sardine al forno a 190 °C fino a completa cottura.","Affetta finemente cavolo rosso e finocchi e condiscili con limone, prezzemolo e pepe.","Servi con pane di segale e 5 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d52-tofu-con-melanzane-pomodori-e-cous-cous", name: "Tofu con melanzane, pomodori e cous cous", kicker: "Cena completa · matrice D52", course: "Piatto unico", cuisine: "Vegetale", kind: "combination", image: photo("part-tofu-v11515"), time: 30, ingredients: [{ food: "Tofu alla piastra", grams: 100 }, { food: "Cous cous integrale cotto", grams: 170 }, { food: "Melanzane", grams: 150 }, { food: "Pomodorini", grams: 150 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Tofu alla piastra", grams: 100, label: "Tofu grigliato · 100 g", image: photo("part-tofu-v11515") }, { category: "Carboidrato", food: "Cous cous integrale cotto", grams: 170, label: "Cous cous cotto · da circa 60 g secco", image: photo("part-couscous-v11514") }, { category: "Contorno", food: "Melanzane", grams: 150, label: "Melanzane grigliate · 150 g", image: photo("part-eggplant-v8") }, { category: "Contorno", food: "Pomodorini", grams: 150, label: "Pomodori · 150 g", image: photo("part-tomatoes-v8") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Griglia il tofu e le melanzane fino a doratura.","Prepara il cous cous secondo confezione e sgranalo; taglia i pomodori.","Unisci con basilico, origano, paprika e 10 g di olio misurato."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] }
];


const attachmentDinnersE: Recipe[] = [
  { id: "matrix-d53-platessa-al-forno-con-zucca-zucchine-e-riso-rosso", name: "Platessa al forno con zucca, zucchine e riso rosso", kicker: "Cena completa · matrice D53", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-plaice-baked-v11658"), time: 35, ingredients: [{ food: "Platessa cotta", grams: 150 }, { food: "Riso rosso integrale cotto", grams: 180 }, { food: "Zucca", grams: 125 }, { food: "Zucchine", grams: 125 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Platessa cotta", grams: 150, label: "Platessa al forno · 150 g", image: photo("part-plaice-baked-v11658") }, { category: "Carboidrato", food: "Riso rosso integrale cotto", grams: 180, label: "Riso rosso cotto · da circa 60 g secco", image: photo("part-red-rice-v11514") }, { category: "Contorno", food: "Zucca", grams: 125, label: "Zucca · 125 g", image: photo("part-pumpkin-v8") }, { category: "Contorno", food: "Zucchine", grams: 125, label: "Zucchine · 125 g", image: photo("part-zucchini-v8") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci il riso rosso secondo confezione.","Arrostisci zucca e zucchine; aggiungi la platessa negli ultimi 10-12 minuti, fino a completa cottura.","Completa con limone, timo, pepe e 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d54-tacchino-con-cavolo-cappuccio-e-patata-dolce", name: "Tacchino con cavolo cappuccio e patata dolce", kicker: "Cena completa · matrice D54", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-turkey-grilled-v11514"), time: 30, ingredients: [{ food: "Petto di tacchino cotto alla piastra", grams: 100 }, { food: "Patata dolce cotta", grams: 200 }, { food: "Cavolo cappuccio cotto", grams: 250 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Petto di tacchino cotto alla piastra", grams: 100, label: "Tacchino grigliato · 100 g", image: photo("part-turkey-grilled-v11514") }, { category: "Carboidrato", food: "Patata dolce cotta", grams: 200, label: "Patata dolce · 200 g", image: photo("part-sweet-potato-v8") }, { category: "Contorno", food: "Cavolo cappuccio cotto", grams: 250, label: "Cavolo cappuccio cotto · 250 g", image: photo("part-green-cabbage-cooked-v11657") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci la patata dolce al forno a 200 °C.","Griglia il tacchino fino a completa cottura e cuoci il cavolo al vapore.","Condisci con paprika, aceto di mele, pepe e 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d55-zuppa-di-fagioli-neri-zucca-e-spinaci", name: "Zuppa di fagioli neri, zucca e spinaci", kicker: "Cena completa · matrice D55", course: "Piatto unico", cuisine: "Vegetale", kind: "combination", image: photo("part-black-beans-v11646"), time: 35, ingredients: [{ food: "Fagioli neri cotti", grams: 150 }, { food: "Zucca", grams: 140 }, { food: "Spinaci", grams: 80 }, { food: "Sedano crudo", grams: 40 }, { food: "Cipolle crude", grams: 40 }, { food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Fagioli neri cotti", grams: 150, label: "Fagioli neri cotti · 150 g", image: photo("part-black-beans-v11646") }, { category: "Contorno", food: "Zucca", grams: 140, label: "Zucca · 140 g", image: photo("part-pumpkin-v8") }, { category: "Contorno", food: "Spinaci", grams: 80, label: "Spinaci · 80 g", image: photo("part-spinach-v7") }, { category: "Contorno", food: "Sedano crudo", grams: 40, label: "Sedano · 40 g", image: photo("part-celery-v1154") }, { category: "Contorno", food: "Cipolle crude", grams: 40, label: "Cipolla · 40 g", image: photo("part-onions-v11519") }, { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci zucca, sedano e cipolla con acqua, paprika e peperoncino.","Aggiungi i fagioli neri e gli spinaci e prosegui finché le verdure sono tenere.","Servi con pane e olio pesato a crudo."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d56-uova-in-camicia-con-asparagi-pomodori-e-quinoa", name: "Uova in camicia con asparagi, pomodori e quinoa", kicker: "Cena completa · matrice D56", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-poached-egg-v11639"), time: 25, ingredients: [{ food: "Uovo in camicia", grams: 100 }, { food: "Quinoa cotta", grams: 160 }, { food: "Asparagi crudi", grams: 150 }, { food: "Pomodorini", grams: 100 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Uovo in camicia", grams: 100, label: "Due uova in camicia · 100 g", image: photo("part-poached-egg-v11639") }, { category: "Carboidrato", food: "Quinoa cotta", grams: 160, label: "Quinoa cotta · da circa 60 g secca", image: photo("part-quinoa-v7") }, { category: "Contorno", food: "Asparagi crudi", grams: 150, label: "Asparagi cotti · 150 g a crudo", image: photo("part-asparagus-v113") }, { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori · 100 g", image: photo("part-tomatoes-v8") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci la quinoa e gli asparagi.","Cuoci ogni uovo in acqua appena fremissante con poco aceto per 3-4 minuti, finché l'albume è rappreso.","Servi con pomodori, pepe, erba cipollina e 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d57-tofu-al-forno-con-broccoli-e-patate", name: "Tofu al forno con broccoli e patate", kicker: "Cena completa · matrice D57", course: "Piatto unico", cuisine: "Vegetale", kind: "combination", image: photo("part-tofu-v11515"), time: 40, ingredients: [{ food: "Tofu alla piastra", grams: 100 }, { food: "Patate lesse", grams: 200 }, { food: "Broccoli bolliti", grams: 250 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Tofu alla piastra", grams: 100, label: "Tofu al forno · 100 g", image: photo("part-tofu-v11515") }, { category: "Carboidrato", food: "Patate lesse", grams: 200, label: "Patate al forno · 200 g", image: photo("part-potatoes-boiled-v7") }, { category: "Contorno", food: "Broccoli bolliti", grams: 250, label: "Broccoli cotti · 250 g", image: photo("part-broccoli-v1154") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Taglia patate e broccoli e cuocili a 200 °C con paprika e zenzero.","Aggiungi il tofu a cubetti negli ultimi 15 minuti e giralo a metà cottura.","Completa con limone e 10 g di olio complessivi."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d58-trota-con-finocchi-arancia-e-orzo", name: "Trota con finocchi, arancia e orzo", kicker: "Cena completa · matrice D58", course: "Piatto unico", cuisine: "Mediterraneo", kind: "combination", image: photo("part-trout-v11645"), time: 30, ingredients: [{ food: "Trota cotta", grams: 150 }, { food: "Orzo perlato cotto", grams: 170 }, { food: "Finocchi crudi", grams: 200 }, { food: "Arancia", grams: 100 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Trota cotta", grams: 150, label: "Trota al forno · 150 g", image: photo("part-trout-v11645") }, { category: "Carboidrato", food: "Orzo perlato cotto", grams: 170, label: "Orzo cotto · da circa 60 g secco", image: photo("part-barley-v11514") }, { category: "Contorno", food: "Finocchi crudi", grams: 200, label: "Finocchi · 200 g", image: photo("part-fennel-v113") }, { category: "Frutta", food: "Arancia", grams: 100, label: "Arancia · 100 g", image: photo("part-orange-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci l'orzo secondo confezione.","Cuoci la trota al forno fino a completa cottura.","Affetta finocchi e arancia e servi con pepe, limone, erba cipollina e 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d59-ricotta-con-carciofi-pomodori-e-pane-di-farro", name: "Ricotta con carciofi, pomodori e pane di farro", kicker: "Cena completa · matrice D59", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-ricotta-v7"), time: 30, ingredients: [{ food: "Ricotta vaccina", grams: 100 }, { food: "Carciofi cotti bolliti", grams: 200 }, { food: "Pomodorini", grams: 100 }, { food: "Pane di farro", grams: 50 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Latticino", food: "Ricotta vaccina", grams: 100, label: "Ricotta · 100 g", image: photo("part-ricotta-v7") }, { category: "Contorno", food: "Carciofi cotti bolliti", grams: 200, label: "Carciofi in umido · 200 g", image: photo("part-artichokes-v11519") }, { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori · 100 g", image: photo("part-tomatoes-v8") }, { category: "Carboidrato", food: "Pane di farro", grams: 50, label: "Pane di farro · 50 g", image: photo("part-bread-spelt-v11511") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci i carciofi in umido con aglio e prezzemolo.","Servi ricotta, carciofi e pomodori con il pane di farro separato.","Completa con pepe e 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d60-polpo-con-cannellini-pomodori-sedano-e-rucola", name: "Polpo con cannellini, pomodori, sedano e rucola", kicker: "Cena completa · matrice D60", course: "Piatto unico", cuisine: "Mediterraneo", kind: "combination", image: photo("part-octopus-v11645"), time: 15, ingredients: [{ food: "Polpo cotto", grams: 150 }, { food: "Fagioli cannellini cotti", grams: 100 }, { food: "Pomodorini", grams: 120 }, { food: "Sedano crudo", grams: 80 }, { food: "Rucola", grams: 50 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Polpo cotto", grams: 150, label: "Polpo cotto · 150 g", image: photo("part-octopus-v11645") }, { category: "Proteina", food: "Fagioli cannellini cotti", grams: 100, label: "Cannellini cotti · 100 g", image: photo("part-cannellini-v1141") }, { category: "Contorno", food: "Pomodorini", grams: 120, label: "Pomodori · 120 g", image: photo("part-tomatoes-v8") }, { category: "Contorno", food: "Sedano crudo", grams: 80, label: "Sedano · 80 g", image: photo("part-celery-v1154") }, { category: "Contorno", food: "Rucola", grams: 50, label: "Rucola · 50 g", image: photo("part-rucola-v7") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Taglia il polpo già cotto e correttamente conservato.","Risciacqua i cannellini e uniscili a pomodori, sedano e rucola.","Condisci con limone, prezzemolo e 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d61-polpette-di-ceci-con-cavolfiore-e-riso-basmati", name: "Polpette di ceci con cavolfiore e riso basmati", kicker: "Cena completa · matrice D61", course: "Piatto unico", cuisine: "Vegetale", kind: "combination", image: photo("part-chickpeas-v8"), time: 40, ingredients: [{ food: "Ceci cotti", grams: 150 }, { food: "Fiocchi d'avena", grams: 20 }, { food: "Carote crude", grams: 40 }, { food: "Cipolle crude", grams: 40 }, { food: "Riso basmati secco", grams: 50 }, { food: "Cavolfiore", grams: 250 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Ceci cotti", grams: 150, label: "Polpette di ceci · da 150 g cotti", image: photo("part-chickpeas-v8") }, { category: "Carboidrato", food: "Fiocchi d'avena", grams: 20, label: "Avena nell'impasto · 20 g", image: photo("part-oats-v113") }, { category: "Contorno", food: "Carote crude", grams: 40, label: "Carota · 40 g", image: photo("part-carrots-raw-v11512") }, { category: "Contorno", food: "Cipolle crude", grams: 40, label: "Cipolla · 40 g", image: photo("part-onions-v11519") }, { category: "Carboidrato", food: "Riso basmati secco", grams: 50, label: "Riso basmati · 50 g a crudo", image: photo("part-basmati-dry-v11650") }, { category: "Contorno", food: "Cavolfiore", grams: 250, label: "Cavolfiore · 250 g", image: photo("part-cauliflower-v8") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO complessivo · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Schiaccia i ceci e uniscili ad avena, carota e cipolla con curry e curcuma.","Forma le polpette e cuocile al forno; cuoci separatamente riso e cavolfiore.","Servi usando complessivamente 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d62-coniglio-con-bietole-e-polenta", name: "Coniglio con bietole e polenta", kicker: "Cena completa · matrice D62", course: "Piatto unico", cuisine: "Italiano", kind: "combination", image: photo("part-rabbit-v11515"), time: 45, ingredients: [{ food: "Coniglio cotto in umido", grams: 100 }, { food: "Polenta cotta", grams: 300 }, { food: "Bietole cotte", grams: 250 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Coniglio cotto in umido", grams: 100, label: "Coniglio cotto · 100 g", image: photo("part-rabbit-v11515") }, { category: "Carboidrato", food: "Polenta cotta", grams: 300, label: "Polenta cotta · da circa 60 g secca", image: photo("part-polenta-v11515") }, { category: "Contorno", food: "Bietole cotte", grams: 250, label: "Bietole lesse · 250 g", image: photo("part-chard-v11515") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci il coniglio in umido o al forno con rosmarino e salvia fino a completa cottura.","Prepara la polenta e lessa le bietole.","Servi con pepe e 10 g di olio misurato."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d63-sgombro-con-barbabietole-rucola-finocchi-e-pane", name: "Sgombro con barbabietole, rucola, finocchi e pane", kicker: "Cena completa · matrice D63", course: "Piatto unico", cuisine: "Mediterraneo", kind: "combination", image: photo("part-mackerel-baked-v11654"), time: 25, ingredients: [{ food: "Sgombro cotto", grams: 150 }, { food: "Barbabietole cotte", grams: 150 }, { food: "Rucola", grams: 40 }, { food: "Finocchi crudi", grams: 60 }, { food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 5 }], parts: [{ category: "Proteina", food: "Sgombro cotto", grams: 150, label: "Sgombro al forno · 150 g", image: photo("part-mackerel-baked-v11654") }, { category: "Contorno", food: "Barbabietole cotte", grams: 150, label: "Barbabietole · 150 g", image: photo("part-beetroot-v11513") }, { category: "Contorno", food: "Rucola", grams: 40, label: "Rucola · 40 g", image: photo("part-rucola-v7") }, { category: "Contorno", food: "Finocchi crudi", grams: 60, label: "Finocchi · 60 g", image: photo("part-fennel-v113") }, { category: "Carboidrato", food: "Pane integrale", grams: 50, label: "Pane integrale · 50 g", image: photo("part-bread-v7") }, { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci lo sgombro al forno o alla piastra fino a completa cottura.","Unisci barbabietole, rucola e finocchi affettati.","Servi con pane, limone, pepe e 5 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] },
  { id: "matrix-d64-tempeh-con-melanzane-pomodori-e-miglio", name: "Tempeh con melanzane, pomodori e miglio", kicker: "Cena completa · matrice D64", course: "Piatto unico", cuisine: "Vegetale", kind: "combination", image: photo("part-tempeh-v11520"), time: 35, ingredients: [{ food: "Tempeh", grams: 100 }, { food: "Miglio cotto", grams: 170 }, { food: "Melanzane", grams: 140 }, { food: "Pomodorini", grams: 100 }, { food: "Cipolle crude", grams: 60 }, { food: "Olio extravergine", grams: 10 }], parts: [{ category: "Proteina", food: "Tempeh", grams: 100, label: "Tempeh grigliato · 100 g", image: photo("part-tempeh-v11520") }, { category: "Carboidrato", food: "Miglio cotto", grams: 170, label: "Miglio cotto · da circa 60 g secco", image: photo("part-millet-v11515") }, { category: "Contorno", food: "Melanzane", grams: 140, label: "Melanzane · 140 g", image: photo("part-eggplant-v8") }, { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori · 100 g", image: photo("part-tomatoes-v8") }, { category: "Contorno", food: "Cipolle crude", grams: 60, label: "Cipolla · 60 g", image: photo("part-onions-v11519") }, { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") }], steps: ["Cuoci il miglio secondo confezione.","Griglia il tempeh e cuoci melanzane, pomodori e cipolla al forno o in padella antiaderente.","Unisci con paprika, basilico, origano e 10 g di olio."], alternatives: ["Ogni componente può essere sostituito separatamente", "Porzioni orientative per un adulto sano", "Pesi e stato di cottura sono indicati in ogni componente"] }
];


const attachmentBreakfastsC37C44: Recipe[] = [
  {
    id: "matrix-c37-blueberry-chia-almond-porridge",
    name: "Porridge di mirtilli, chia e mandorle",
    kicker: "Colazione calda · matrice C37",
    course: "Colazione", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-c37-blueberry-porridge-v11659"), time: 10,
    ingredients: [
      { food: "Fiocchi d'avena", grams: 40 },
      { food: "Latte parzialmente scremato", grams: 180 },
      { food: "Mirtilli freschi", grams: 150 },
      { food: "Semi di chia", grams: 5 },
      { food: "Mandorle", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Fiocchi d'avena", grams: 40, label: "Fiocchi d'avena · 40 g", image: photo("part-oats-v113") },
      { category: "Latticino", food: "Latte parzialmente scremato", grams: 180, label: "Latte parzialmente scremato · 180 ml", image: photo("part-milk-v7") },
      { category: "Frutta", food: "Mirtilli freschi", grams: 150, label: "Mirtilli freschi · 150 g", image: photo("part-blueberries-v1160") },
      { category: "Extra", food: "Semi di chia", grams: 5, label: "Semi di chia · 5 g", image: photo("part-chia-v11511") },
      { category: "Extra", food: "Mandorle", grams: 10, label: "Mandorle · 10 g", image: photo("part-almonds-v9") },
    ],
    steps: ["Versa avena e latte in un pentolino.", "Cuoci per 5-7 minuti mescolando, finché il porridge è cremoso.", "Spegni e completa con mirtilli lavati, chia e mandorle tritate."],
    alternatives: ["Bevanda di soia senza zuccheri al posto del latte", "Frutti di bosco nella quantità equivalente", "Contiene latte e mandorle; adattabile senza lattosio"],
  },
  {
    id: "matrix-c38-skyr-mango-pistachio-oats",
    name: "Skyr con mango, pistacchi e avena",
    kicker: "Colazione rapida · matrice C38",
    course: "Colazione", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-c38-skyr-mango-v11659"), time: 5,
    ingredients: [
      { food: "Skyr bianco", grams: 170 }, { food: "Mango", grams: 150 },
      { food: "Fiocchi d'avena", grams: 30 }, { food: "Pistacchi", grams: 10 },
    ],
    parts: [
      { category: "Latticino", food: "Skyr bianco", grams: 170, label: "Skyr bianco · 170 g", image: photo("part-skyr-v11511") },
      { category: "Frutta", food: "Mango", grams: 150, label: "Mango · 150 g edibili", image: photo("part-mango-v11") },
      { category: "Carboidrato", food: "Fiocchi d'avena", grams: 30, label: "Fiocchi d'avena · 30 g", image: photo("part-oats-v113") },
      { category: "Extra", food: "Pistacchi", grams: 10, label: "Pistacchi non salati · 10 g", image: photo("part-pistachios-v1143") },
    ],
    steps: ["Taglia il mango a cubetti.", "Versa lo skyr in una ciotola e aggiungi avena, mango e pistacchi tritati."],
    alternatives: ["Yogurt greco 0% al posto dello skyr", "Pesca o papaya al posto del mango", "Contiene latte e pistacchi"],
  },
  {
    id: "matrix-c39-rye-egg-spinach-tomato",
    name: "Pane di segale con uovo, spinaci e pomodori",
    kicker: "Colazione salata da casa · matrice C39",
    course: "Colazione", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-c39-rye-egg-spinach-v11659"), time: 15,
    ingredients: [
      { food: "Pane di segale", grams: 50 }, { food: "Uova strapazzate o in frittata", grams: 60 },
      { food: "Albume", grams: 100 }, { food: "Spinaci", grams: 100 },
      { food: "Pomodorini", grams: 80 }, { food: "Olio extravergine", grams: 5 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pane di segale", grams: 50, label: "Pane di segale · 50 g", image: photo("part-bread-rye-v1156") },
      { category: "Proteina", food: "Uova strapazzate o in frittata", grams: 60, label: "Un uovo strapazzato senza grassi · 60 g", image: photo("part-eggs-scrambled-v1156") },
      { category: "Proteina", food: "Albume", grams: 100, label: "Albume · 100 g", image: photo("part-egg-white-v11641") },
      { category: "Contorno", food: "Spinaci", grams: 100, label: "Spinaci · 100 g", image: photo("part-spinach-v7") },
      { category: "Contorno", food: "Pomodorini", grams: 80, label: "Pomodori · 80 g", image: photo("part-tomatoes-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Tosta il pane di segale.", "Appassisci spinaci e pomodori in padella antiaderente.", "Aggiungi uovo e albume e cuoci completamente mescolando; completa con pepe, erba cipollina e 5 g di olio."],
    alternatives: ["Colazione salata più adatta a casa o al weekend", "Pane integrale nella quantità equivalente", "Contiene uova e glutine"],
  },
  {
    id: "matrix-c40-kefir-banana-walnut-flax",
    name: "Kefir con banana, noci e semi di lino",
    kicker: "Colazione rapida · matrice C40",
    course: "Colazione", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-c40-kefir-banana-v11659"), time: 5,
    ingredients: [
      { food: "Kefir bianco magro", grams: 170 }, { food: "Banana", grams: 150 },
      { food: "Muesli", grams: 30 }, { food: "Noci", grams: 10 }, { food: "Semi di lino macinati", grams: 5 },
    ],
    parts: [
      { category: "Latticino", food: "Kefir bianco magro", grams: 170, label: "Kefir bianco · 170 g", image: photo("part-kefir-v1152") },
      { category: "Frutta", food: "Banana", grams: 150, label: "Banana · 150 g edibili", image: photo("part-banana-v7") },
      { category: "Carboidrato", food: "Muesli", grams: 30, label: "Muesli senza zuccheri aggiunti · 30 g", image: photo("part-muesli-v1152") },
      { category: "Extra", food: "Noci", grams: 10, label: "Noci · 10 g", image: photo("walnuts-20g-v5") },
      { category: "Extra", food: "Semi di lino macinati", grams: 5, label: "Semi di lino macinati · 5 g", image: photo("part-flaxseed-v113") },
    ],
    steps: ["Taglia la banana a rondelle.", "Unisci kefir, muesli, banana, noci spezzettate e semi di lino macinati."],
    alternatives: ["Skyr o yogurt bianco al posto del kefir", "Pera nella quantità equivalente", "Contiene latte, noci ed eventuale glutine"],
  },
  {
    id: "matrix-c41-spelt-pancakes-ricotta-apricot",
    name: "Pancake di farro con ricotta e albicocche",
    kicker: "Colazione da casa · matrice C41",
    course: "Colazione", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-c41-spelt-pancakes-v11659"), time: 15,
    ingredients: [
      { food: "Farina di frumento integrale", grams: 40 }, { food: "Albume", grams: 100 },
      { food: "Latte parzialmente scremato", grams: 50 }, { food: "Ricotta vaccina", grams: 60 },
      { food: "Albicocche fresche", grams: 150 },
    ],
    parts: [
      { category: "Carboidrato", food: "Farina di frumento integrale", grams: 40, label: "Farina di farro o integrale nell'impasto · 40 g", image: photo("part-whole-wheat-flour-v9") },
      { category: "Proteina", food: "Albume", grams: 100, label: "Albume nell'impasto · 100 g", image: photo("part-egg-white-v11641") },
      { category: "Latticino", food: "Latte parzialmente scremato", grams: 50, label: "Latte nell'impasto · 50 ml", image: photo("part-milk-v7") },
      { category: "Latticino", food: "Ricotta vaccina", grams: 60, label: "Ricotta · 60 g", image: photo("part-ricotta-v7") },
      { category: "Frutta", food: "Albicocche fresche", grams: 150, label: "Albicocche · 150 g edibili", image: photo("part-apricots-v1152") },
    ],
    steps: ["Mescola farina, albume e latte fino a ottenere una pastella liscia.", "Cuoci piccoli pancake in padella antiaderente calda, girandoli quando compaiono le bolle.", "Servi con ricotta e albicocche lavate e affettate."],
    alternatives: ["Farina integrale al posto della farina di farro", "Pesca al posto delle albicocche", "Contiene glutine, uovo e latte"],
  },
  {
    id: "matrix-c42-greek-yogurt-pear-pumpkin-seeds-bread",
    name: "Yogurt greco con pera, semi di zucca e pane",
    kicker: "Colazione rapida · matrice C42",
    course: "Colazione", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-c42-greek-yogurt-pear-v11659"), time: 5,
    ingredients: [
      { food: "Yogurt greco 2%", grams: 170 }, { food: "Pera", grams: 150 },
      { food: "Semi di zucca", grams: 10 }, { food: "Pane integrale", grams: 40 },
    ],
    parts: [
      { category: "Latticino", food: "Yogurt greco 2%", grams: 170, label: "Yogurt greco bianco · 170 g", image: photo("part-greek-yogurt-2-v11663") },
      { category: "Frutta", food: "Pera", grams: 150, label: "Pera · 150 g edibili", image: photo("part-pear-v7") },
      { category: "Extra", food: "Semi di zucca", grams: 10, label: "Semi di zucca · 10 g", image: photo("part-pumpkin-seeds-v11641") },
      { category: "Carboidrato", food: "Pane integrale", grams: 40, label: "Pane integrale tostato · 40 g", image: photo("part-bread-v7") },
    ],
    steps: ["Lava e affetta la pera.", "Servi yogurt con pera e semi di zucca; accompagna con pane tostato."],
    alternatives: ["Skyr al posto dello yogurt", "Mela al posto della pera", "Contiene latte, glutine e semi"],
  },
  {
    id: "matrix-c43-cottage-pomegranate-hazelnut",
    name: "Fiocchi di latte con melagrana e nocciole",
    kicker: "Colazione rapida · matrice C43",
    course: "Colazione", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-c43-cottage-pomegranate-v11659"), time: 5,
    ingredients: [
      { food: "Fiocchi di latte", grams: 100 }, { food: "Melagrana fresca", grams: 150 },
      { food: "Pane ai cereali", grams: 50 }, { food: "Nocciole", grams: 10 },
    ],
    parts: [
      { category: "Latticino", food: "Fiocchi di latte", grams: 100, label: "Fiocchi di latte · 100 g", image: photo("part-cottage-cheese-v11512") },
      { category: "Frutta", food: "Melagrana fresca", grams: 150, label: "Chicchi di melagrana · 150 g", image: photo("part-pomegranate-v1160") },
      { category: "Carboidrato", food: "Pane ai cereali", grams: 50, label: "Pane ai cereali · 50 g", image: photo("part-bread-cereals-v11511") },
      { category: "Extra", food: "Nocciole", grams: 10, label: "Nocciole · 10 g", image: photo("part-hazelnuts-v11511") },
    ],
    steps: ["Ricava i chicchi dalla melagrana.", "Unisci fiocchi di latte, melagrana e nocciole tritate; servi con pane ai cereali."],
    alternatives: ["Ricotta magra al posto dei fiocchi di latte", "Pera al posto della melagrana", "Contiene latte, glutine e nocciole"],
  },
  {
    id: "matrix-c44-oat-soy-peach-sesame-pudding",
    name: "Budino di avena, soia, pesca e sesamo",
    kicker: "Colazione preparata la sera · matrice C44",
    course: "Colazione", cuisine: "Vegetale", kind: "combination",
    image: photo("recipe-c44-oat-soy-peach-pudding-v11659"), time: 5,
    ingredients: [
      { food: "Fiocchi d'avena", grams: 35 }, { food: "Bevanda di soia", grams: 180 },
      { food: "Pesca", grams: 150 }, { food: "Semi di chia", grams: 10 }, { food: "Semi di sesamo", grams: 5 },
    ],
    parts: [
      { category: "Carboidrato", food: "Fiocchi d'avena", grams: 35, label: "Fiocchi d'avena · 35 g", image: photo("part-oats-v113") },
      { category: "Latticino", food: "Bevanda di soia", grams: 180, label: "Bevanda di soia senza zuccheri · 180 ml", image: photo("part-soy-drink-plain-v11663") },
      { category: "Frutta", food: "Pesca", grams: 150, label: "Pesca o nettarina · 150 g edibili", image: photo("part-peach-v113") },
      { category: "Extra", food: "Semi di chia", grams: 10, label: "Semi di chia · 10 g", image: photo("part-chia-v11511") },
      { category: "Extra", food: "Semi di sesamo", grams: 5, label: "Semi di sesamo · 5 g", image: photo("part-sesame-v11512") },
    ],
    steps: ["La sera mescola avena, bevanda di soia e chia in un contenitore.", "Copri e lascia in frigorifero per almeno 3 ore.", "Al mattino aggiungi pesca affettata e sesamo."],
    alternatives: ["Nettarina o albicocche al posto della pesca", "Latte vaccino nella quantità equivalente", "Contiene soia, sesamo e avena"],
  },
];

const attachmentSnacksS35S42: Recipe[] = [
  {
    id: "matrix-s35-mirtilli-skyr-e-mandorle",
    name: "Mirtilli, skyr e mandorle", kicker: "Spuntino pratico · matrice S35", course: "Spuntino", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-s35-skyr-blueberries-v11660"), time: 3,
    ingredients: [
      { food: "Skyr bianco", grams: 125 },
      { food: "Mirtilli freschi", grams: 150 },
      { food: "Mandorle", grams: 10 },
    ],
    parts: [
      { category: "Latticino", food: "Skyr bianco", grams: 125, label: "Skyr bianco · 125 g", image: photo("part-skyr-v11511") },
      { category: "Frutta", food: "Mirtilli freschi", grams: 150, label: "Mirtilli freschi · 150 g", image: photo("part-blueberries-v1160") },
      { category: "Extra", food: "Mandorle", grams: 10, label: "Mandorle · 10 g", image: photo("part-almonds-v9") },
    ],
    steps: ["Lava e asciuga delicatamente i mirtilli.","Servili con lo skyr e le mandorle già pesate."], alternatives: ["Contiene latte e mandorle","Trasportabile in contenitore refrigerato"],
  },
  {
    id: "matrix-s36-banana-e-nocciole",
    name: "Banana e nocciole", kicker: "Spuntino pratico · matrice S36", course: "Spuntino", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-s36-banana-hazelnuts-v11660"), time: 2,
    ingredients: [
      { food: "Banana", grams: 150 },
      { food: "Nocciole", grams: 15 },
    ],
    parts: [
      { category: "Frutta", food: "Banana", grams: 150, label: "Banana · 150 g edibili", image: photo("part-banana-v7") },
      { category: "Extra", food: "Nocciole", grams: 15, label: "Nocciole · 15 g", image: photo("part-hazelnuts-v11511") },
    ],
    steps: ["Sbuccia e pesa la banana.","Abbinala alle nocciole già porzionate."], alternatives: ["Pratico al lavoro","Contiene nocciole"],
  },
  {
    id: "matrix-s37-pane-integrale-con-hummus-e-pomodori",
    name: "Pane integrale con hummus e pomodori", kicker: "Spuntino pratico · matrice S37", course: "Spuntino", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-s37-hummus-tomato-toast-v11660"), time: 5,
    ingredients: [
      { food: "Pane integrale", grams: 40 },
      { food: "Hummus di ceci", grams: 40 },
      { food: "Pomodorini", grams: 100 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pane integrale", grams: 40, label: "Pane integrale · 40 g", image: photo("part-bread-v7") },
      { category: "Proteina", food: "Hummus di ceci", grams: 40, label: "Hummus · 40 g", image: photo("part-hummus-v11512") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori · 100 g", image: photo("part-tomatoes-v8") },
    ],
    steps: ["Tosta il pane se sei a casa; al lavoro puoi usarlo senza tostatura.","Spalma l'hummus e aggiungi pomodori affettati, origano e pepe."], alternatives: ["Vegano","Contiene glutine e sesamo se presente nell'hummus"],
  },
  {
    id: "matrix-s38-yogurt-pesca-e-semi-di-girasole",
    name: "Yogurt, pesca e semi di girasole", kicker: "Spuntino pratico · matrice S38", course: "Spuntino", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-s38-yogurt-peach-seeds-v11660"), time: 3,
    ingredients: [
      { food: "Yogurt bianco", grams: 125 },
      { food: "Pesca", grams: 150 },
      { food: "Semi di girasole", grams: 10 },
    ],
    parts: [
      { category: "Latticino", food: "Yogurt bianco", grams: 125, label: "Yogurt bianco · 125 g", image: photo("part-yogurt-v7") },
      { category: "Frutta", food: "Pesca", grams: 150, label: "Pesca · 150 g edibili", image: photo("part-peach-v113") },
      { category: "Extra", food: "Semi di girasole", grams: 10, label: "Semi di girasole · 10 g", image: photo("part-sunflower-seeds-v11640") },
    ],
    steps: ["Lava e affetta la pesca.","Aggiungila allo yogurt con i semi di girasole pesati."], alternatives: ["Contiene latte","Skyr al posto dello yogurt"],
  },
  {
    id: "matrix-s39-ricotta-con-cetrioli-e-ravanelli",
    name: "Ricotta con cetrioli e ravanelli", kicker: "Spuntino pratico · matrice S39", course: "Spuntino", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-s39-ricotta-cucumber-radish-v11660"), time: 7,
    ingredients: [
      { food: "Ricotta vaccina", grams: 80 },
      { food: "Cetrioli", grams: 100 },
      { food: "Ravanelli crudi", grams: 100 },
    ],
    parts: [
      { category: "Latticino", food: "Ricotta vaccina", grams: 80, label: "Ricotta · 80 g", image: photo("part-ricotta-v7") },
      { category: "Contorno", food: "Cetrioli", grams: 100, label: "Cetrioli · 100 g", image: photo("part-cucumber-v8") },
      { category: "Contorno", food: "Ravanelli crudi", grams: 100, label: "Ravanelli · 100 g", image: photo("part-radishes-v11512") },
    ],
    steps: ["Lavora la ricotta con limone, pepe ed erba cipollina.","Lava e taglia cetrioli e ravanelli e servili separati per intingerli."], alternatives: ["Contiene latte","Fiocchi di latte al posto della ricotta"],
  },
  {
    id: "matrix-s40-mela-pistacchi-e-kefir",
    name: "Mela, pistacchi e kefir", kicker: "Spuntino pratico · matrice S40", course: "Spuntino", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-s40-apple-pistachio-kefir-v11660"), time: 3,
    ingredients: [
      { food: "Mela", grams: 150 },
      { food: "Pistacchi", grams: 10 },
      { food: "Kefir bianco magro", grams: 125 },
    ],
    parts: [
      { category: "Frutta", food: "Mela", grams: 150, label: "Mela · 150 g edibili", image: photo("part-apple-v7") },
      { category: "Extra", food: "Pistacchi", grams: 10, label: "Pistacchi non salati · 10 g", image: photo("part-pistachios-v1143") },
      { category: "Latticino", food: "Kefir bianco magro", grams: 125, label: "Kefir bianco · 125 g", image: photo("part-kefir-v1152") },
    ],
    steps: ["Lava e affetta la mela.","Servi con kefir e pistacchi già pesati."], alternatives: ["Contiene latte e pistacchi","Adatto al lavoro con borsa termica"],
  },
  {
    id: "matrix-s41-gallette-con-fiocchi-di-latte-e-rucola",
    name: "Gallette con fiocchi di latte e rucola", kicker: "Spuntino pratico · matrice S41", course: "Spuntino", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-s41-cottage-ricecakes-v11660"), time: 5,
    ingredients: [
      { food: "Gallette di riso integrale", grams: 27 },
      { food: "Fiocchi di latte", grams: 60 },
      { food: "Rucola", grams: 30 },
      { food: "Pomodorini", grams: 100 },
    ],
    parts: [
      { category: "Carboidrato", food: "Gallette di riso integrale", grams: 27, label: "Gallette integrali · circa 3", image: photo("part-rice-cakes-whole-v11512") },
      { category: "Latticino", food: "Fiocchi di latte", grams: 60, label: "Fiocchi di latte · 60 g", image: photo("part-cottage-cheese-v11512") },
      { category: "Contorno", food: "Rucola", grams: 30, label: "Rucola · 30 g", image: photo("part-rucola-v7") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodorini · 100 g", image: photo("part-tomatoes-v8") },
    ],
    steps: ["Distribuisci i fiocchi di latte sulle gallette solo al momento.","Completa con rucola lavata e pomodorini tagliati."], alternatives: ["Contiene latte; verificare il glutine in etichetta","Pane integrale al posto delle gallette"],
  },
  {
    id: "matrix-s42-frutti-di-bosco-con-yogurt-e-chia",
    name: "Frutti di bosco con yogurt e chia", kicker: "Spuntino pratico · matrice S42", course: "Spuntino", cuisine: "Italiano", kind: "combination",
    image: photo("recipe-s42-mixed-berries-yogurt-v11660"), time: 3,
    ingredients: [
      { food: "Frutti di bosco", grams: 150 },
      { food: "Yogurt bianco", grams: 125 },
      { food: "Semi di chia", grams: 5 },
    ],
    parts: [
      { category: "Frutta", food: "Frutti di bosco", grams: 150, label: "Fragole, mirtilli, lamponi e more · 150 g", image: photo("part-mixed-berries-v11") },
      { category: "Latticino", food: "Yogurt bianco", grams: 125, label: "Yogurt bianco · 125 g", image: photo("part-yogurt-v7") },
      { category: "Extra", food: "Semi di chia", grams: 5, label: "Semi di chia · 5 g", image: photo("part-chia-v11511") },
    ],
    steps: ["Lava e asciuga delicatamente i frutti di bosco.","Aggiungili allo yogurt e completa con chia pesata."], alternatives: ["Contiene latte","Skyr al posto dello yogurt"],
  }
];

const attachmentMainsP53P64: Recipe[] = [
  {
    id: "matrix-p53-pasta-integrale-con-lenticchie-e-spinaci", name: "Pasta integrale con lenticchie e spinaci", kicker: "Pranzo completo · matrice P53",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p53-whole-pasta-lentils-v11661"), time: 25,
    ingredients: [
      { food: "Pasta integrale secca", grams: 70 },
      { food: "Lenticchie cotte", grams: 120 },
      { food: "Spinaci", grams: 125 },
      { food: "Pomodorini", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pasta integrale secca", grams: 70, label: "Pasta integrale · 70 g a crudo", image: photo("part-pasta-whole-v11618") },
      { category: "Proteina", food: "Lenticchie cotte", grams: 120, label: "Lenticchie cotte · 120 g", image: photo("part-lentils-v1141") },
      { category: "Contorno", food: "Spinaci", grams: 125, label: "Spinaci · 125 g", image: photo("part-spinach-v7") },
      { category: "Contorno", food: "Pomodorini", grams: 125, label: "Pomodori · 125 g", image: photo("part-tomatoes-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci la pasta integrale al dente e conserva poca acqua di cottura.","Cuoci gli spinaci con aglio e aggiungi lenticchie e pomodori.","Unisci la pasta, manteca con poca acqua e completa a fuoco spento con 10 g di olio."], alternatives: ["Vegano","Contiene glutine"],
  },
  {
    id: "matrix-p54-riso-basmati-con-salmone-piselli-e-zucchine", name: "Riso basmati con salmone, piselli e zucchine", kicker: "Pranzo completo · matrice P54",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p54-basmati-salmon-peas-v11661"), time: 30,
    ingredients: [
      { food: "Riso basmati secco", grams: 70 },
      { food: "Salmone cotto", grams: 120 },
      { food: "Piselli cotti", grams: 80 },
      { food: "Zucchine", grams: 200 },
      { food: "Olio extravergine", grams: 5 },
    ],
    parts: [
      { category: "Carboidrato", food: "Riso basmati secco", grams: 70, label: "Riso basmati · 70 g a crudo", image: photo("part-basmati-dry-v11650") },
      { category: "Proteina", food: "Salmone cotto", grams: 120, label: "Salmone alla piastra · 120 g cotti", image: photo("part-salmon-baked-v7") },
      { category: "Proteina", food: "Piselli cotti", grams: 80, label: "Piselli cotti · 80 g", image: photo("part-peas-v8") },
      { category: "Contorno", food: "Zucchine", grams: 200, label: "Zucchine · 200 g", image: photo("part-zucchini-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci il riso basmati secondo confezione.","Cuoci il salmone alla piastra fino a completa cottura e le zucchine al vapore.","Unisci piselli, riso e zucchine; servi col salmone e condisci con limone, erba cipollina e 5 g di olio."], alternatives: ["Senza glutine se gli ingredienti sono certificati","Contiene pesce"],
  },
  {
    id: "matrix-p55-quinoa-con-tacchino-zucca-e-broccoli", name: "Quinoa con tacchino, zucca e broccoli", kicker: "Pranzo completo · matrice P55",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p55-quinoa-turkey-pumpkin-v11661"), time: 35,
    ingredients: [
      { food: "Quinoa cotta", grams: 190 },
      { food: "Petto di tacchino cotto alla piastra", grams: 100 },
      { food: "Zucca", grams: 125 },
      { food: "Broccoli bolliti", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Quinoa cotta", grams: 190, label: "Quinoa cotta · da circa 70 g secca", image: photo("part-quinoa-v7") },
      { category: "Proteina", food: "Petto di tacchino cotto alla piastra", grams: 100, label: "Tacchino grigliato · 100 g cotto", image: photo("part-turkey-grilled-v11514") },
      { category: "Contorno", food: "Zucca", grams: 125, label: "Zucca · 125 g", image: photo("part-pumpkin-v8") },
      { category: "Contorno", food: "Broccoli bolliti", grams: 125, label: "Broccoli · 125 g", image: photo("part-broccoli-v1154") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Sciacqua e cuoci la quinoa.","Arrostisci zucca e broccoli con paprika e rosmarino usando parte dell'olio pesato.","Griglia il tacchino fino a completa cottura e servi con limone e l'olio restante."], alternatives: ["Senza glutine","Carne bianca"],
  },
  {
    id: "matrix-p56-farro-con-ceci-barbabietole-e-finocchi", name: "Farro con ceci, barbabietole e finocchi", kicker: "Pranzo completo · matrice P56",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p56-farro-chickpeas-beet-v11661"), time: 25,
    ingredients: [
      { food: "Farro cotto", grams: 170 },
      { food: "Ceci cotti", grams: 150 },
      { food: "Barbabietole cotte", grams: 125 },
      { food: "Finocchi crudi", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Farro cotto", grams: 170, label: "Farro cotto · da circa 60 g secco", image: photo("farro") },
      { category: "Proteina", food: "Ceci cotti", grams: 150, label: "Ceci cotti e sgocciolati · 150 g", image: photo("part-chickpeas-v8") },
      { category: "Contorno", food: "Barbabietole cotte", grams: 125, label: "Barbabietole · 125 g", image: photo("part-beetroot-v11513") },
      { category: "Contorno", food: "Finocchi crudi", grams: 125, label: "Finocchi · 125 g", image: photo("part-fennel-v113") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci il farro e lascialo intiepidire.","Risciacqua i ceci e affetta finocchi e barbabietole.","Unisci tutto e condisci con limone, aceto di mele, prezzemolo e 10 g di olio."], alternatives: ["Vegano e trasportabile","Contiene glutine"],
  },
  {
    id: "matrix-p57-cous-cous-con-merluzzo-e-verdure-al-curry", name: "Cous cous con merluzzo e verdure al curry", kicker: "Pranzo completo · matrice P57",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p57-couscous-cod-curry-v11661"), time: 30,
    ingredients: [
      { food: "Cous cous integrale cotto", grams: 190 },
      { food: "Merluzzo cotto", grams: 150 },
      { food: "Carote cotte bollite", grams: 85 },
      { food: "Zucchine", grams: 85 },
      { food: "Cavolfiore", grams: 80 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Cous cous integrale cotto", grams: 190, label: "Cous cous cotto · da 70 g secco", image: photo("part-couscous-v11514") },
      { category: "Proteina", food: "Merluzzo cotto", grams: 150, label: "Merluzzo al vapore · 150 g", image: photo("part-cod-steamed-v8") },
      { category: "Contorno", food: "Carote cotte bollite", grams: 85, label: "Carote · 85 g", image: photo("part-carrots-cooked-v11512") },
      { category: "Contorno", food: "Zucchine", grams: 85, label: "Zucchine · 85 g", image: photo("part-zucchini-v8") },
      { category: "Contorno", food: "Cavolfiore", grams: 80, label: "Cavolfiore · 80 g", image: photo("part-cauliflower-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Reidrata il cous cous integrale secondo confezione.","Cuoci il merluzzo al vapore fino a completa cottura.","Cuoci le verdure con poca acqua, curry, curcuma e zenzero; unisci tutto e completa con 10 g di olio."], alternatives: ["Contiene pesce e glutine","Verificare la miscela di curry"],
  },
  {
    id: "matrix-p58-orzo-con-edamame-funghi-e-cavolo-rosso", name: "Orzo con edamame, funghi e cavolo rosso", kicker: "Pranzo completo · matrice P58",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p58-barley-edamame-cabbage-v11661"), time: 30,
    ingredients: [
      { food: "Orzo perlato cotto", grams: 195 },
      { food: "Edamame cotti", grams: 120 },
      { food: "Funghi cotti", grams: 125 },
      { food: "Cavolo rosso crudo", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Orzo perlato cotto", grams: 195, label: "Orzo cotto · da circa 70 g secco", image: photo("part-barley-v11514") },
      { category: "Proteina", food: "Edamame cotti", grams: 120, label: "Edamame cotti · 120 g", image: photo("part-edamame-v11634") },
      { category: "Contorno", food: "Funghi cotti", grams: 125, label: "Funghi cotti · 125 g", image: photo("part-mushrooms-v8") },
      { category: "Contorno", food: "Cavolo rosso crudo", grams: 125, label: "Cavolo rosso · 125 g", image: photo("part-red-cabbage-v11515") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci l'orzo secondo confezione.","Cuoci funghi e cavolo rosso in padella antiaderente con zenzero e aglio.","Aggiungi edamame e orzo e completa con limone e 10 g di olio."], alternatives: ["Vegano","Contiene glutine e soia"],
  },
  {
    id: "matrix-p59-riso-venere-con-orata-e-asparagi", name: "Riso Venere con orata e asparagi", kicker: "Pranzo completo · matrice P59",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p59-venere-seabream-asparagus-v11661"), time: 35,
    ingredients: [
      { food: "Riso Venere secco", grams: 70 },
      { food: "Orata cotta", grams: 150 },
      { food: "Asparagi crudi", grams: 150 },
      { food: "Pomodorini", grams: 100 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Riso Venere secco", grams: 70, label: "Riso Venere · 70 g a crudo", image: photo("part-rice-venere-v7") },
      { category: "Proteina", food: "Orata cotta", grams: 150, label: "Orata al forno · 150 g", image: photo("part-sea-bream-baked-v8") },
      { category: "Contorno", food: "Asparagi crudi", grams: 150, label: "Asparagi · 150 g a crudo", image: photo("part-asparagus-v113") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodorini · 100 g", image: photo("part-tomatoes-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci il riso Venere secondo confezione.","Cuoci orata e asparagi al forno fino a completa cottura.","Servi con pomodorini, limone, timo, pepe e 10 g di olio."], alternatives: ["Senza glutine","Contiene pesce"],
  },
  {
    id: "matrix-p60-pasta-di-legumi-con-ricotta-e-cavolo-nero", name: "Pasta di legumi con ricotta e cavolo nero", kicker: "Pranzo completo · matrice P60",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p60-legume-pasta-ricotta-kale-v11661"), time: 25,
    ingredients: [
      { food: "Pasta di lenticchie secca", grams: 70 },
      { food: "Ricotta vaccina", grams: 80 },
      { food: "Cavolo nero cotto", grams: 150 },
      { food: "Pomodorini", grams: 100 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pasta di lenticchie secca", grams: 70, label: "Pasta di lenticchie · 70 g a crudo", image: photo("part-lentil-pasta-v11515") },
      { category: "Latticino", food: "Ricotta vaccina", grams: 80, label: "Ricotta · 80 g", image: photo("part-ricotta-v7") },
      { category: "Contorno", food: "Cavolo nero cotto", grams: 150, label: "Cavolo nero · 150 g cotto", image: photo("part-kale-v11515") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori · 100 g", image: photo("part-tomatoes-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci la pasta di lenticchie secondo confezione e scola al dente.","Cuoci il cavolo nero e aggiungi i pomodori.","A fuoco spento unisci ricotta, poca acqua di cottura e 10 g di olio."], alternatives: ["Vegetariano","Contiene latte; verificare il legume della pasta"],
  },
  {
    id: "matrix-p61-miglio-con-tempeh-carciofi-e-carote", name: "Miglio con tempeh, carciofi e carote", kicker: "Pranzo completo · matrice P61",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p61-millet-tempeh-artichokes-v11661"), time: 35,
    ingredients: [
      { food: "Miglio cotto", grams: 190 },
      { food: "Tempeh", grams: 100 },
      { food: "Carciofi cotti bolliti", grams: 125 },
      { food: "Carote cotte bollite", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Miglio cotto", grams: 190, label: "Miglio cotto · da circa 70 g secco", image: photo("part-millet-v11515") },
      { category: "Proteina", food: "Tempeh", grams: 100, label: "Tempeh grigliato · 100 g", image: photo("part-tempeh-v11520") },
      { category: "Contorno", food: "Carciofi cotti bolliti", grams: 125, label: "Carciofi cotti · 125 g", image: photo("part-artichokes-v11519") },
      { category: "Contorno", food: "Carote cotte bollite", grams: 125, label: "Carote cotte · 125 g", image: photo("part-carrots-cooked-v11512") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci il miglio secondo confezione.","Griglia il tempeh e cuoci carciofi e carote al forno o in padella antiaderente.","Unisci con curcuma, limone, prezzemolo e 10 g di olio."], alternatives: ["Vegano","Contiene soia; verificare la certificazione del tempeh"],
  },
  {
    id: "matrix-p62-polenta-con-gamberi-e-verdure-in-umido", name: "Polenta con gamberi e verdure in umido", kicker: "Pranzo completo · matrice P62",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p62-polenta-shrimp-stew-v11661"), time: 35,
    ingredients: [
      { food: "Polenta cotta", grams: 350 },
      { food: "Gamberi cotti", grams: 150 },
      { food: "Zucchine", grams: 100 },
      { food: "Pomodorini", grams: 100 },
      { food: "Cipolle crude", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Polenta cotta", grams: 350, label: "Polenta cotta · da circa 70 g secca", image: photo("part-polenta-v11515") },
      { category: "Proteina", food: "Gamberi cotti", grams: 150, label: "Gamberi cotti · 150 g", image: photo("part-shrimp-v11514") },
      { category: "Contorno", food: "Zucchine", grams: 100, label: "Zucchine · 100 g", image: photo("part-zucchini-v8") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodori · 100 g", image: photo("part-tomatoes-v8") },
      { category: "Contorno", food: "Cipolle crude", grams: 50, label: "Cipolla · 50 g", image: photo("part-onions-v11519") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Prepara la polenta seguendo i tempi indicati sulla confezione.","Cuoci zucchine, pomodori e cipolla in umido con aglio e peperoncino.","Aggiungi i gamberi negli ultimi minuti, portali a completa cottura e servi sulla polenta con 10 g di olio."], alternatives: ["Contiene crostacei","Senza glutine se la polenta è certificata"],
  },
  {
    id: "matrix-p63-bulgur-con-pollo-cavolfiore-e-radicchio", name: "Bulgur con pollo, cavolfiore e radicchio", kicker: "Pranzo completo · matrice P63",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p63-bulgur-chicken-radicchio-v11661"), time: 35,
    ingredients: [
      { food: "Bulgur cotto", grams: 200 },
      { food: "Petto di pollo cotto", grams: 100 },
      { food: "Cavolfiore", grams: 125 },
      { food: "Radicchio cotto", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Bulgur cotto", grams: 200, label: "Bulgur cotto · da circa 70 g secco", image: photo("part-bulgur-v11515") },
      { category: "Proteina", food: "Petto di pollo cotto", grams: 100, label: "Petto di pollo alla piastra · 100 g", image: photo("part-chicken-cooked-v11651") },
      { category: "Contorno", food: "Cavolfiore", grams: 125, label: "Cavolfiore · 125 g", image: photo("part-cauliflower-v8") },
      { category: "Contorno", food: "Radicchio cotto", grams: 125, label: "Radicchio cotto · 125 g", image: photo("part-radicchio-v11515") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci il bulgur secondo confezione.","Arrostisci cavolfiore e radicchio con paprika e rosmarino.","Griglia il pollo fino a completa cottura e servi con limone e 10 g di olio."], alternatives: ["Carne bianca","Contiene glutine"],
  },
  {
    id: "matrix-p64-gnocchi-con-salmone-spinaci-e-yogurt", name: "Gnocchi con salmone, spinaci e yogurt", kicker: "Pranzo completo · matrice P64",
    course: "Piatto completo", cuisine: "Italiano", kind: "combination", image: photo("recipe-p64-gnocchi-salmon-spinach-v11661"), time: 25,
    ingredients: [
      { food: "Gnocchi di patate", grams: 150 },
      { food: "Salmone cotto", grams: 100 },
      { food: "Spinaci", grams: 200 },
      { food: "Yogurt bianco", grams: 50 },
      { food: "Olio extravergine", grams: 5 },
    ],
    parts: [
      { category: "Carboidrato", food: "Gnocchi di patate", grams: 150, label: "Gnocchi di patate · 150 g", image: photo("part-gnocchi-v7") },
      { category: "Proteina", food: "Salmone cotto", grams: 100, label: "Salmone cotto · 100 g", image: photo("part-salmon-baked-v7") },
      { category: "Contorno", food: "Spinaci", grams: 200, label: "Spinaci · 200 g", image: photo("part-spinach-v7") },
      { category: "Latticino", food: "Yogurt bianco", grams: 50, label: "Yogurt bianco · 50 g", image: photo("part-yogurt-v7") },
      { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci gli spinaci e il salmone fino a completa cottura.","Lessa gli gnocchi e scolali appena salgono in superficie.","A fuoco spento unisci yogurt, limone, spinaci e salmone; completa con pepe, erba cipollina e 5 g di olio."], alternatives: ["Contiene pesce e latte","Verificare glutine e uova nell'etichetta degli gnocchi"],
  }
];

const mealPartOptions: Record<MealPart["category"], MealPart[]> = {
  Carboidrato: [
    { category: "Carboidrato", food: "Riso parboiled cotto", grams: 150, label: "Riso parboiled cotto · 150 g", image: photo("part-parboiled-rice-v11668") },
    {
      category: "Carboidrato",
      food: "Vermicelli di patata dolce cotti",
      grams: 180,
      label: "Vermicelli coreani cotti · 180 g",
      image: photo("part-sweet-potato-noodles-v11652"),
    },
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
      image: photo("part-pasta-whole-v11618"),
    },
    {
      category: "Carboidrato",
      food: "Pasta di semola secca",
      grams: 80,
      label: "Pasta secca",
      image: photo("part-pasta-semolina-v11618"),
    },
    {
      category: "Carboidrato",
      food: "Riso basmati secco",
      grams: 80,
      label: "Riso basmati · peso a crudo",
      image: photo("part-basmati-dry-v11650"),
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
      food: "Patate al vapore",
      grams: 200,
      label: "Patate al vapore · 200 g",
      image: photo("part-potatoes-steamed-v1177"),
    },
    {
      category: "Carboidrato",
      food: "Patata dolce cotta",
      grams: 200,
      label: "Patata dolce cotta · 200 g",
      image: photo("part-sweet-potato-v8"),
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
    { category: "Carboidrato", food: "Orzo perlato cotto", grams: 180, label: "Orzo cotto · da circa 70 g secco", image: photo("part-barley-v11514") },
    { category: "Carboidrato", food: "Pasta di farro secca", grams: 80, label: "Pasta di farro · peso a crudo", image: photo("part-spelt-pasta-v11643") },
    { category: "Carboidrato", food: "Cous cous integrale cotto", grams: 180, label: "Cous cous integrale cotto · da circa 60 g secco", image: photo("part-couscous-v11514") },
    { category: "Carboidrato", food: "Farro cotto", grams: 175, label: "Farro cotto · da circa 70 g secco", image: photo("farro") },
  ],
  Proteina: [
    { category: "Proteina", food: "Vongole cotte", grams: 150, label: "Vongole cotte · 150 g", image: photo("part-clams-v11668") },
    { category: "Proteina", food: "Platessa cotta", grams: 150, label: "Platessa al forno · 150 g", image: photo("part-plaice-baked-v11658") },
    { category: "Proteina", food: "Branzino cotto", grams: 150, label: "Branzino al forno · 150 g", image: photo("part-branzino-baked-v11654") },
    { category: "Proteina", food: "Nasello cotto", grams: 150, label: "Nasello al vapore · 150 g", image: photo("part-nasello-steamed-v11654") },
    { category: "Proteina", food: "Calamari cotti alla griglia", grams: 150, label: "Calamari alla griglia · 150 g", image: photo("part-calamari-grilled-v11654") },
    { category: "Proteina", food: "Fave cotte", grams: 150, label: "Fave cotte · 150 g", image: photo("part-fave-cooked-v11654") },
    { category: "Proteina", food: "Fagioli borlotti cotti", grams: 150, label: "Borlotti cotti · 150 g", image: photo("part-borlotti-cooked-v11654") },
    { category: "Proteina", food: "Cozze cotte", grams: 150, label: "Cozze cotte · 150 g edibile", image: photo("part-mussels-cooked-v11654") },
    { category: "Proteina", food: "Sardine cotte", grams: 150, label: "Sardine al forno · 150 g", image: photo("part-sardines-baked-v11654") },
    { category: "Proteina", food: "Sgombro cotto", grams: 150, label: "Sgombro al forno · 150 g", image: photo("part-mackerel-baked-v11654") },
    {
      category: "Proteina",
      food: "Tonno fresco cotto",
      grams: 150,
      label: "Tonno fresco cotto · 150 g",
      image: photo("part-tuna-fresh-v11650"),
    },
    { category: "Proteina", food: "Tempeh", grams: 120, label: "Tempeh alla piastra · 120 g", image: photo("part-tempeh-v11520") },
    { category: "Proteina", food: "Rombo · peso a crudo", grams: 160, label: "Rombo al forno · 160 g a crudo", image: photo("part-turbot-v11520") },
    { category: "Proteina", food: "Seppia · peso a crudo", grams: 160, label: "Seppia alla piastra · 160 g a crudo", image: photo("part-cuttlefish-v11520") },
    { category: "Proteina", food: "Sogliola · peso a crudo", grams: 150, label: "Sogliola al forno · 150 g a crudo", image: photo("part-sole-baked-v11519") },
    { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 100, label: "Petto di pollo · 100 g a crudo", image: photo("part-chicken-raw-v11651") },
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
      label: "Petto di pollo cotto · 100 g",
      image: photo("part-chicken-cooked-v11651"),
    },
    {
      category: "Proteina",
      food: "Petto di pollo alla griglia",
      grams: 100,
      label: "Petto di pollo alla griglia · 100 g",
      image: photo("part-chicken-grilled-v1178"),
    },
    {
      category: "Proteina",
      food: "Petto di pollo lesso",
      grams: 100,
      label: "Petto di pollo lesso · 100 g",
      image: photo("part-chicken-poached-v1178"),
    },
    {
      category: "Proteina",
      food: "Petto di pollo al vapore",
      grams: 100,
      label: "Petto di pollo al vapore · 100 g",
      image: photo("part-chicken-steamed-v1178"),
    },
    {
      category: "Proteina",
      food: "Roast beef magro",
      grams: 100,
      label: "Roast beef magro · 100 g",
      image: photo("part-roast-beef-v1178"),
    },
    {
      category: "Proteina",
      food: "Carpaccio di manzo · peso a crudo",
      grams: 100,
      label: "Carpaccio di manzo · 100 g a crudo",
      image: photo("part-beef-carpaccio-v1178"),
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
      food: "Uova alla coque",
      grams: 100,
      label: "Due uova alla coque",
      image: photo("part-soft-boiled-egg-v1177"),
    },
    {
      category: "Proteina",
      food: "Uovo in camicia",
      grams: 50,
      label: "Un uovo in camicia",
      image: photo("part-poached-egg-v11639"),
    },
    {
      category: "Proteina",
      food: "Albume",
      grams: 100,
      label: "Albume pastorizzato · 100 g",
      image: photo("part-egg-white-v11641"),
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
      image: photo("part-tuna-canned-v11650"),
    },
    {
      category: "Proteina",
      food: "Sgombro al naturale sgocciolato",
      grams: 80,
      label: "Sgombro al naturale sgocciolato",
      image: photo("part-mackerel-v11643"),
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
      food: "Fagioli rossi cotti",
      grams: 150,
      label: "Fagioli rossi cotti",
      image: photo("part-red-beans-v11643"),
    },
    {
      category: "Proteina",
      food: "Fagioli neri cotti",
      grams: 150,
      label: "Fagioli neri cotti",
      image: photo("part-black-beans-v11646"),
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
    { category: "Proteina", food: "Petto di tacchino al forno", grams: 100, label: "Petto di tacchino al forno · 100 g", image: photo("part-turkey-baked-v1181") },
    { category: "Proteina", food: "Coniglio cotto in umido", grams: 100, label: "Coniglio cotto in umido", image: photo("part-rabbit-v11515") },
    { category: "Proteina", food: "Tofu alla piastra", grams: 100, label: "Tofu alla piastra", image: photo("part-tofu-v11515") },
    { category: "Proteina", food: "Edamame cotti", grams: 80, label: "Edamame cotti", image: photo("part-edamame-v11634") },
    { category: "Proteina", food: "Trota cotta", grams: 150, label: "Trota cotta al forno o al vapore", image: photo("part-trout-v11645") },
    { category: "Proteina", food: "Polpo cotto", grams: 150, label: "Polpo cotto", image: photo("part-octopus-v11645") },
  ],
  Contorno: [
    { category: "Contorno", food: "Lattuga fresca", grams: 100, label: "Lattuga fresca · 100 g", image: photo("part-lettuce-v11668") },
    { category: "Contorno", food: "Songino fresco", grams: 100, label: "Songino fresco · 100 g", image: photo("part-lambs-lettuce-v11668") },
    { category: "Contorno", food: "Catalogna fresca", grams: 150, label: "Catalogna fresca · 150 g", image: photo("part-catalogna-v11668") },
    { category: "Contorno", food: "Verza fresca", grams: 150, label: "Verza fresca · 150 g", image: photo("part-savoy-cabbage-v11668") },
    { category: "Contorno", food: "Cavolini di Bruxelles cotti", grams: 180, label: "Cavolini di Bruxelles cotti · 180 g", image: photo("part-brussels-sprouts-v11668") },
    { category: "Contorno", food: "Cime di rapa cotte", grams: 180, label: "Cime di rapa cotte · 180 g", image: photo("part-turnip-greens-v11668") },
    { category: "Contorno", food: "Cipollotti freschi", grams: 100, label: "Cipollotti freschi · 100 g", image: photo("part-spring-onions-v11668") },
    { category: "Contorno", food: "Cavolo cappuccio cotto", grams: 200, label: "Cavolo cappuccio cotto · 200 g", image: photo("part-green-cabbage-cooked-v11657") },
    { category: "Contorno", food: "Cicoria cotta", grams: 250, label: "Cicoria lessa · 250 g", image: photo("part-cicoria-cooked-v11655") },
    {
      category: "Contorno",
      food: "Porro cotto",
      grams: 120,
      label: "Porro cotto · 120 g",
      image: photo("part-leek-v1163"),
    },
    {
      category: "Contorno",
      food: "Erba cipollina fresca",
      grams: 20,
      label: "Erba cipollina fresca · 20 g",
      image: photo("part-garlic-chives-v1163"),
    },
    { category: "Contorno", food: "Peperoni crudi", grams: 200, label: "Peperoni crudi · 200 g", image: photo("part-peppers-raw-v11522") },
    { category: "Contorno", food: "Peperoni cotti senza olio", grams: 200, label: "Peperoni cotti senza olio · 200 g", image: photo("part-peppers-cooked-v11522") },
    { category: "Contorno", food: "Minestrone cotto", grams: 350, label: "Minestrone cotto · 350 g", image: photo("recipe-minestrone-v11522") },
    { category: "Contorno", food: "Passato di verdure", grams: 300, label: "Passato di verdure · 300 g", image: photo("part-vegetable-passato-v1181") },
    { category: "Contorno", food: "Vellutata di verdure senza panna", grams: 300, label: "Vellutata di verdure senza panna · 300 g", image: photo("part-vegetable-vellutata-v1181") },
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
      image: photo("part-mushrooms-raw-v11663"),
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
      food: "Cetrioli",
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
    { category: "Latticino", food: "Formaggio fresco magro", grams: 80, label: "Formaggio fresco magro · 80 g", image: photo("part-low-fat-fresh-cheese-v1181") },
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
      food: "Latte scremato",
      grams: 200,
      label: "Latte scremato · 200 ml",
      image: photo("part-milk-skimmed-v1177"),
    },
    {
      category: "Latticino",
      food: "Latte senza lattosio parzialmente scremato",
      grams: 200,
      label: "Latte senza lattosio · 200 ml",
      image: photo("part-milk-lactose-free-v1177"),
    },
    {
      category: "Latticino",
      food: "Yogurt greco 2%",
      grams: 125,
      label: "Yogurt · 1 vasetto",
      image: photo("part-greek-yogurt-2-v11663"),
    },
    {
      category: "Latticino",
      food: "Yogurt bianco",
      grams: 125,
      label: "Yogurt bianco naturale · 1 vasetto",
      image: photo("part-yogurt-white-v11651"),
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
      image: photo("part-soy-drink-v11649"),
    },
    {
      category: "Latticino",
      food: "Bevanda d'avena senza zucchero",
      grams: 200,
      label: "Bevanda d'avena",
      image: photo("part-oat-drink-v11649"),
    },
    {
      category: "Latticino",
      food: "Bevanda di mandorla senza zucchero",
      grams: 200,
      label: "Bevanda di mandorla senza zucchero · 200 ml",
      image: photo("part-almond-drink-v1177"),
    },
    { category: "Latticino", food: "Fiocchi di latte", grams: 80, label: "Fiocchi di latte", image: photo("part-cottage-cheese-v11512") },
  ],
  Frutta: [
    { category: "Frutta", food: "Pompelmo rosa fresco", grams: 200, label: "Pompelmo rosa · parte edibile 200 g", image: photo("part-grapefruit-v11668") },
    {
      category: "Frutta",
      food: "Lime",
      grams: 80,
      label: "Lime · parte edibile",
      image: photo("part-lime-v1163"),
    },
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
    { category: "Frutta", food: "Prugne fresche", grams: 150, label: "Prugne fresche", image: photo("part-plums-v11642") },
    { category: "Frutta", food: "Lamponi", grams: 150, label: "Lamponi freschi", image: photo("part-raspberries-v11642") },
    { category: "Frutta", food: "Ananas", grams: 150, label: "Ananas fresco", image: photo("part-pineapple-v11513") },
    { category: "Frutta", food: "Mirtilli freschi", grams: 150, label: "Mirtilli freschi", image: photo("part-blueberries-v1160") },
    { category: "Frutta", food: "Mandarini freschi", grams: 150, label: "Mandarini · parte edibile", image: photo("part-mandarins-v1160") },
    { category: "Frutta", food: "Melagrana fresca", grams: 150, label: "Melagrana · parte edibile", image: photo("part-pomegranate-v1160") },
  ],
  Extra: [
    { category: "Extra", food: "Succo di limone", grams: 15, label: "Succo di limone · 15 g", image: photo("part-lemon-juice-v1181") },
    { category: "Extra", food: "Aceto di vino", grams: 10, label: "Aceto di vino · 10 g", image: photo("part-wine-vinegar-v1181") },
    { category: "Extra", food: "Aceto balsamico", grams: 10, label: "Aceto balsamico · 10 g", image: photo("part-balsamic-vinegar-v1181") },
    { category: "Extra", food: "Sale iodato", grams: 1, label: "Sale iodato · 1 g", image: photo("part-iodized-salt-v1181") },
    {
      category: "Extra",
      food: "Salsa di tamarindo",
      grams: 15,
      label: "Salsa di tamarindo · 15 g",
      image: photo("part-tamarind-sauce-v11649"),
    },
    {
      category: "Extra",
      food: "Olio di arachidi",
      grams: 5,
      label: "Olio di arachidi · 5 g",
      image: photo("part-peanut-oil-v11649"),
    },
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
      food: "Semi di zucca",
      grams: 10,
      label: "Semi di zucca non salati · 10 g",
      image: photo("part-pumpkin-seeds-v11641"),
    },
    {
      category: "Extra",
      food: "Crema 100% mandorle",
      grams: 10,
      label: "Crema 100% mandorle · 10 g",
      image: photo("part-almond-butter-v11671"),
    },
    {
      category: "Extra",
      food: "Cioccolato fondente 70%",
      grams: 10,
      label: "Cioccolato fondente 70% · 10 g",
      image: photo("part-dark-chocolate-v11641"),
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
      food: "Semi di girasole",
      grams: 10,
      label: "Semi di girasole non salati",
      image: photo("part-sunflower-seeds-v11640"),
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

const ingredientPartCatalog: Record<string, MealPart> = {
  "Arancino di riso": { category: "Carboidrato", food: "Arancino di riso", grams: 180, label: "Arancino di riso", image: photo("cheat-arancino-v11630") },
  "Bevanda di soia": { category: "Latticino", food: "Bevanda di soia", grams: 200, label: "Bevanda di soia", image: photo("part-soy-drink-plain-v11663") },
  "Cannolo siciliano": { category: "Extra", food: "Cannolo siciliano", grams: 100, label: "Cannolo siciliano", image: photo("cheat-cannolo-v11627") },
  Cheesecake: { category: "Extra", food: "Cheesecake", grams: 120, label: "Cheesecake", image: photo("cheat-cheesecake-v11626") },
  "Cetrioli crudi": { category: "Contorno", food: "Cetrioli crudi", grams: 150, label: "Cetrioli crudi", image: photo("part-cucumber-raw-v11819") },
  "Funghi cotti": { category: "Contorno", food: "Funghi cotti", grams: 150, label: "Funghi cotti", image: photo("part-mushrooms-v8") },
  "Gelato al cioccolato": { category: "Extra", food: "Gelato al cioccolato", grams: 60, label: "Gelato al cioccolato", image: photo("part-gelato-chocolate-v11664") },
  "Gelato fiordilatte": { category: "Extra", food: "Gelato fiordilatte", grams: 60, label: "Gelato fiordilatte", image: photo("part-gelato-fiordilatte-v11664") },
  "Germogli di soia": { category: "Contorno", food: "Germogli di soia", grams: 100, label: "Germogli di soia", image: photo("part-sprouts-v11520") },
  Gochujang: { category: "Extra", food: "Gochujang", grams: 10, label: "Gochujang", image: photo("part-gochujang-v11819") },
  "Grano saraceno cotto": { category: "Carboidrato", food: "Grano saraceno cotto", grams: 160, label: "Grano saraceno cotto", image: photo("part-buckwheat-cooked-v11819") },
  Mirin: { category: "Extra", food: "Mirin", grams: 10, label: "Mirin", image: photo("part-mirin-v11819") },
  "Noodles di riso cotti": { category: "Carboidrato", food: "Noodles di riso cotti", grams: 180, label: "Noodles di riso cotti", image: photo("part-rice-noodles-v11652") },
  "Panna cotta": { category: "Extra", food: "Panna cotta", grams: 120, label: "Panna cotta", image: photo("cheat-panna-cotta-v11628") },
  "Passata di pomodoro": { category: "Contorno", food: "Passata di pomodoro", grams: 100, label: "Passata di pomodoro", image: photo("part-passata-v11652") },
  "Pasta all'amatriciana": { category: "Carboidrato", food: "Pasta all'amatriciana", grams: 250, label: "Pasta all’amatriciana", image: photo("cheat-amatriciana-v11625") },
  "Pasta alla carbonara": { category: "Carboidrato", food: "Pasta alla carbonara", grams: 250, label: "Pasta alla carbonara", image: photo("cheat-carbonara-v11619") },
  "Pasta cotta": { category: "Carboidrato", food: "Pasta cotta", grams: 180, label: "Pasta cotta", image: photo("simple-pasta-white-v5") },
  Pastiera: { category: "Extra", food: "Pastiera", grams: 100, label: "Pastiera", image: photo("cheat-pastiera-v11629") },
  "Patatine fritte": { category: "Carboidrato", food: "Patatine fritte", grams: 120, label: "Patatine fritte", image: photo("cheat-fries-v11619") },
  "Peperoni cotti": { category: "Contorno", food: "Peperoni cotti", grams: 150, label: "Peperoni cotti", image: photo("part-peppers-cooked-v11819") },
  "Pizza margherita": { category: "Carboidrato", food: "Pizza margherita", grams: 300, label: "Pizza margherita", image: photo("pizza-margherita-v7") },
  "Riso basmati cotto": { category: "Carboidrato", food: "Riso basmati cotto", grams: 180, label: "Riso basmati cotto", image: photo("part-basmati-cooked-v11650") },
  "Salsa di soia": { category: "Extra", food: "Salsa di soia", grams: 10, label: "Salsa di soia", image: photo("part-soy-sauce-v11819") },
  Tiramisu: { category: "Extra", food: "Tiramisu", grams: 120, label: "Tiramisù", image: photo("cheat-tiramisu-v11619") },
  Uovo: { category: "Proteina", food: "Uovo", grams: 50, label: "Uovo", image: photo("part-whole-egg-v11651") },
  "Wafer confezionati": { category: "Carboidrato", food: "Wafer confezionati", grams: 30, label: "Wafer confezionati", image: photo("part-wafer-v115") },
  Zucchero: { category: "Extra", food: "Zucchero", grams: 5, label: "Zucchero", image: photo("part-sugar-v11819") },
};

const normalizeMealPart = (part: MealPart): MealPart => {
  if (GELATO_FLAVORS.includes(part.food as (typeof GELATO_FLAVORS)[number]))
    return { ...part, image: gelatoFlavorPhoto(part.food) };
  const localOption = mealPartOptions[part.category]?.find(
    (option) => option.food === part.food,
  );
  if (localOption) return { ...part, image: localOption.image };
  const catalogOption = ingredientPartCatalog[part.food];
  if (catalogOption)
    return { ...part, category: catalogOption.category, image: catalogOption.image };
  const canonicalCategory = (
    Object.keys(mealPartOptions) as MealPart["category"][]
  ).find((category) =>
    mealPartOptions[category].some((option) => option.food === part.food),
  );
  if (!canonicalCategory) return part;
  const canonicalOption = mealPartOptions[canonicalCategory].find(
    (option) => option.food === part.food,
  );
  return {
    ...part,
    category: canonicalCategory,
    image: canonicalOption?.image || part.image,
  };
};

const seasonalMonths: Record<string, number[]> = {
  "Pompelmo rosa fresco": [11, 12, 1, 2, 3, 4],
  "Lattuga fresca": [3, 4, 5, 6, 7, 8, 9, 10],
  "Songino fresco": [10, 11, 12, 1, 2, 3],
  "Catalogna fresca": [10, 11, 12, 1, 2, 3],
  "Verza fresca": [10, 11, 12, 1, 2, 3],
  "Cavolini di Bruxelles cotti": [10, 11, 12, 1, 2, 3],
  "Cime di rapa cotte": [10, 11, 12, 1, 2, 3, 4],
  "Cipollotti freschi": [3, 4, 5, 6],
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
  const breakfastMilkAlternatives = [
    "Latte parzialmente scremato",
    "Latte scremato",
    "Latte senza lattosio parzialmente scremato",
    "Bevanda di soia senza zucchero",
    "Bevanda d'avena senza zucchero",
    "Bevanda di mandorla senza zucchero",
  ];
  const recipeFlours = [
    "Farina d'avena",
    "Farina di frumento integrale",
    "Farina di grano saraceno",
  ];
  if (
    slot === 0 &&
    part.category === "Latticino" &&
    breakfastMilkAlternatives.includes(part.food)
  )
    return breakfastMilkAlternatives
      .map((food) => options.find((option) => option.food === food))
      .filter((option): option is MealPart => Boolean(option));
  if (part.category === "Carboidrato" && recipeFlours.includes(part.food))
    return recipeFlours
      .map((food) => options.find((option) => option.food === food))
      .filter((option): option is MealPart => Boolean(option));
  if (part.category === "Carboidrato" && part.food.startsWith("Pane"))
    return options.filter((option) => option.food.startsWith("Pane"));
  if (part.category === "Proteina" && part.food.startsWith("Uova"))
    return options.filter((option) => option.food.startsWith("Uova"));
  if (slot === 0) {
    if (part.category === "Latticino") {
      const breakfastDairyOrder = [
        "Latte parzialmente scremato",
        "Latte scremato",
        "Latte senza lattosio parzialmente scremato",
        "Bevanda di soia senza zucchero",
        "Bevanda d'avena senza zucchero",
        "Bevanda di mandorla senza zucchero",
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
  riso: ["Petto di pollo cotto", "Petto di pollo alla griglia", "Petto di pollo lesso", "Petto di pollo al vapore", "Petto di pollo arrosto", "Petto di tacchino al forno", "Salmone cotto", "Merluzzo cotto", "Orata cotta", "Tonno al naturale sgocciolato", "Uova sode", "Uova strapazzate o in frittata", "Ceci cotti", "Piselli cotti", "Lenticchie cotte", "Fagioli cannellini cotti"],
  tubero: ["Bistecca di manzo · peso a crudo", "Bistecca di vitello · peso a crudo", "Lonza di maiale · peso a crudo", "Bistecca di cavallo magra · peso a crudo", "Roast beef magro", "Carpaccio di manzo · peso a crudo", "Petto di pollo cotto", "Petto di pollo alla griglia", "Petto di pollo lesso", "Petto di pollo al vapore", "Petto di tacchino al forno", "Merluzzo cotto", "Orata cotta", "Salmone cotto", "Uova sode", "Burger vegetale di soia"],
  altro: ["Petto di pollo cotto", "Petto di pollo alla griglia", "Petto di pollo lesso", "Petto di pollo al vapore", "Petto di tacchino al forno", "Roast beef magro", "Carpaccio di manzo · peso a crudo", "Merluzzo cotto", "Orata cotta", "Salmone cotto", "Uova sode", "Uova strapazzate o in frittata", "Ceci cotti", "Lenticchie cotte", "Fagioli cannellini cotti", "Burger vegetale di soia"],
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
  {
    id: "occasional-carbonara",
    name: "Spaghetti alla carbonara",
    kicker: "Sgarro salato conteggiato",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("cheat-carbonara-v11619"),
    time: 25,
    ingredients: [{ food: "Pasta alla carbonara", grams: 350 }],
    steps: [
      "Cuoci gli spaghetti al dente e conserva poca acqua di cottura.",
      "Rosola il guanciale senza olio. Mescola a parte tuorli, pecorino e pepe.",
      "Spegni il fuoco, unisci pasta, crema d'uovo e poca acqua; manteca senza far rapprendere l'uovo.",
      "Registra la quantità realmente mangiata: i valori derivano dalla ricetta completa.",
    ],
    alternatives: ["Porzione più piccola", "Amatriciana", "Pasta al forno"],
  },
  {
    id: "occasional-gelato",
    name: "Gelato artigianale personalizzabile",
    kicker: "Dolce occasionale conteggiato",
    course: "Dolce",
    cuisine: "Italiano",
    image: photo("cheat-gelato-v11619"),
    time: 2,
    ingredients: [
      { food: "Gelato fiordilatte", grams: 60 },
      { food: "Gelato al cioccolato", grams: 60 },
    ],
    steps: [
      "Scegli due gusti e chiedi una coppetta o un cono.",
      "Una pallina è stimata a 60 g; correggi il peso se conosci la quantità reale.",
      "Registra separatamente il cono e le guarnizioni.",
    ],
    alternatives: ["Tre palline", "Sorbetto alla frutta", "Yogurt gelato"],
  },
  {
    id: "occasional-tiramisu",
    name: "Tiramisù",
    kicker: "Porzione occasionale chiara",
    course: "Dolce",
    cuisine: "Italiano",
    image: photo("cheat-tiramisu-v11619"),
    time: 2,
    ingredients: [{ food: "Tiramisu", grams: 120 }],
    steps: [
      "Pesa o stima una fetta da circa 120 g.",
      "Registrala nel pasto o negli extra senza trasformare il pasto successivo in una punizione.",
    ],
    alternatives: ["Panna cotta", "Cheesecake", "Cannolo siciliano"],
  },
  {
    id: "occasional-fries",
    name: "Patatine fritte",
    kicker: "Porzione occasionale conteggiata",
    course: "Contorno",
    cuisine: "Internazionale",
    image: photo("cheat-fries-v11619"),
    time: 15,
    ingredients: [{ food: "Patatine fritte", grams: 120 }],
    steps: [
      "Pesa la porzione pronta senza includere il contenitore.",
      "Registra separatamente salse, hamburger e bevande.",
    ],
    alternatives: ["Crocchette di patate", "Patatine chips", "Patate al forno"],
  },
  {
    id: "occasional-amatriciana",
    name: "Bucatini all'amatriciana",
    kicker: "Piatto occasionale italiano con porzione conteggiata",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("cheat-amatriciana-v11625"),
    time: 25,
    ingredients: [{ food: "Pasta all'amatriciana", grams: 350 }],
    steps: [
      "Rosola il guanciale senza aggiungere olio e tienilo da parte.",
      "Cuoci il pomodoro nel grasso rilasciato, poi unisci i bucatini scolati al dente.",
      "Manteca con pecorino e completa con il guanciale croccante.",
      "Registra la quantità realmente mangiata; il valore deriva dalla ricetta completa.",
    ],
    alternatives: ["Carbonara", "Gricia", "Porzione più piccola"],
  },
  {
    id: "occasional-cheesecake",
    name: "Cheesecake ai frutti rossi",
    kicker: "Dolce occasionale con porzione e valori visibili",
    course: "Dolce",
    cuisine: "Internazionale",
    image: photo("cheat-cheesecake-v11626"),
    time: 5,
    ingredients: [{ food: "Cheesecake", grams: 120 }],
    steps: [
      "Taglia una fetta regolare e pesala, oppure usa come riferimento una porzione da 120 g.",
      "Servila senza aggiungere automaticamente panna o altre guarnizioni.",
      "Registra a parte eventuali salse o una porzione più grande.",
    ],
    alternatives: ["Tiramisù", "Panna cotta", "Gelato personalizzato"],
  },
  {
    id: "occasional-cannolo",
    name: "Cannolo siciliano",
    kicker: "Dolce occasionale con porzione e valori visibili",
    course: "Dolce",
    cuisine: "Italiano",
    image: photo("cheat-cannolo-v11627"),
    time: 5,
    ingredients: [{ food: "Cannolo siciliano", grams: 100 }],
    steps: [
      "Scegli un cannolo con cialda croccante e ricotta fresca, poi pesalo se la porzione è diversa da 100 g.",
      "Aggiungi pistacchio o scorza d'arancia soltanto se già compresi nella preparazione.",
      "Registra la quantità realmente mangiata: non serve compensare saltando il pasto successivo.",
    ],
    alternatives: ["Cheesecake ai frutti rossi", "Tiramisù", "Gelato personalizzato"],
  },
  {
    id: "occasional-panna-cotta",
    name: "Panna cotta ai frutti rossi",
    kicker: "Dolce occasionale con porzione e valori visibili",
    course: "Dolce",
    cuisine: "Italiano",
    image: photo("cheat-panna-cotta-v11628"),
    time: 10,
    ingredients: [{ food: "Panna cotta", grams: 120 }],
    steps: [
      "Scalda panna, zucchero e vaniglia senza far bollire; sciogli la gelatina già ammollata.",
      "Versa nello stampo, raffredda e lascia rassodare in frigorifero per almeno quattro ore.",
      "Sforma e aggiungi una quantità contenuta di coulis e frutti rossi; registra eventuali aggiunte.",
    ],
    alternatives: ["Cheesecake ai frutti rossi", "Cannolo siciliano", "Gelato personalizzato"],
  },
  {
    id: "occasional-pastiera",
    name: "Pastiera napoletana",
    kicker: "Dolce occasionale con porzione e valori visibili",
    course: "Dolce",
    cuisine: "Italiano",
    image: photo("cheat-pastiera-v11629"),
    time: 15,
    ingredients: [{ food: "Pastiera", grams: 100 }],
    steps: [
      "Prepara il guscio di pasta frolla e rivesti uno stampo, tenendo da parte alcune strisce.",
      "Mescola ricotta, grano cotto, uova, zucchero e una piccola quantità di canditi e aroma di fiori d'arancio.",
      "Versa il ripieno, completa con le strisce e cuoci finché la superficie è dorata; lascia raffreddare bene.",
      "Taglia e registra la porzione realmente mangiata.",
    ],
    alternatives: ["Cannolo siciliano", "Cheesecake ai frutti rossi", "Panna cotta ai frutti rossi"],
  },
  {
    id: "occasional-arancino",
    name: "Arancino siciliano al ragù",
    kicker: "Piatto occasionale con porzione e valori visibili",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("cheat-arancino-v11630"),
    time: 35,
    ingredients: [{ food: "Arancino di riso", grams: 180 }],
    steps: [
      "Cuoci il riso e lascialo raffreddare; prepara un ragù denso con carne, pomodoro e piselli.",
      "Forma una conca di riso, inserisci ragù e un piccolo cubetto di mozzarella, poi richiudi bene.",
      "Passa l'arancino in pastella e pangrattato e friggilo fino a doratura uniforme.",
      "Scola bene e registra il peso della porzione realmente mangiata.",
    ],
    alternatives: ["Supplì al telefono", "Panzerotto fritto", "Pizza margherita"],
  },
];
const verifiedWorldRecipeExpansion: Recipe[] = [
  {
    id: "catalog-verified-bulgogi-rice",
    name: "Bulgogi coreano con riso e verdure",
    kicker: "Ricetta coreana verificata · VisitKorea",
    course: "Piatto unico",
    cuisine: "Asiatico",
    image: photo("part-steak-beef-v114"),
    time: 30,
    ingredients: [
      { food: "Riso basmati cotto", grams: 150 },
      { food: "Bistecca di manzo · peso a crudo", grams: 100 },
      { food: "Carote cotte bollite", grams: 60 },
      { food: "Cipolle crude", grams: 50 },
      { food: "Spinaci", grams: 80 },
      { food: "Salsa di soia", grams: 10 },
      { food: "Olio extravergine", grams: 5 },
    ],
    parts: [
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 150, label: "Riso cotto · 150 g", image: photo("part-basmati-cooked-v11650") },
      { category: "Proteina", food: "Bistecca di manzo · peso a crudo", grams: 100, label: "Manzo a striscioline · 100 g a crudo", image: photo("part-steak-beef-v114") },
      { category: "Contorno", food: "Carote cotte bollite", grams: 60, label: "Carote · 60 g", image: photo("part-carrots-cooked-v11651") },
      { category: "Contorno", food: "Spinaci", grams: 80, label: "Spinaci · 80 g", image: photo("part-spinach-v7") },
    ],
    steps: [
      "Taglia il manzo a striscioline sottili e condiscilo con salsa di soia e cipolla affettata.",
      "Cuoci il manzo in padella molto calda fino a cottura completa; scalda separatamente carote e spinaci.",
      "Servi con 150 g di riso già cotto e aggiungi l'olio pesato soltanto alla fine.",
    ],
    alternatives: ["Ricetta adattata alle quantità del piano", "Contiene soia", "Preparabile la sera per il pranzo al lavoro", "Componenti modificabili separatamente"],
    sourceLabel: "VisitKorea · Bulgogi with rice",
    sourceUrl: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=181830",
  },
  {
    id: "catalog-verified-keihan",
    name: "Keihan giapponese · riso, pollo, uovo e verdure",
    kicker: "Ricetta regionale verificata · MAFF",
    course: "Piatto unico",
    cuisine: "Asiatico",
    image: photo("part-rice-basmati-v7"),
    time: 35,
    ingredients: [
      { food: "Riso basmati cotto", grams: 150 },
      { food: "Petto di pollo · peso a crudo", grams: 100 },
      { food: "Uovo", grams: 50 },
      { food: "Funghi", grams: 50 },
      { food: "Fagiolini", grams: 80 },
    ],
    parts: [
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 150, label: "Riso cotto · 150 g", image: photo("part-basmati-cooked-v11650") },
      { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 100, label: "Pollo · 100 g a crudo", image: photo("part-chicken-raw-v11651") },
      { category: "Proteina", food: "Uovo", grams: 50, label: "Uovo · 1", image: photo("part-whole-egg-v11651") },
      { category: "Contorno", food: "Funghi", grams: 50, label: "Funghi · 50 g", image: photo("part-mushrooms-raw-v11663") },
      { category: "Contorno", food: "Fagiolini", grams: 80, label: "Fagiolini · 80 g", image: photo("part-green-beans-v7") },
    ],
    steps: [
      "Cuoci completamente il pollo in acqua aromatica, poi sfilaccialo e conserva il brodo caldo.",
      "Cuoci l'uovo in una frittatina sottile e taglialo a striscioline; cuoci funghi e fagiolini finché teneri.",
      "Metti il riso nella ciotola, distribuisci pollo, uovo e verdure e versa poco brodo caldo.",
    ],
    alternatives: ["Fonte ufficiale regionale giapponese", "Contiene uovo", "Componenti modificabili separatamente"],
    sourceLabel: "MAFF · Keihan",
    sourceUrl: "https://www.maff.go.jp/e/policies/market/k_ryouri/search_menu/149/index.html",
  },
  {
    id: "catalog-verified-kashiwa-meshi",
    name: "Kashiwa-meshi · riso giapponese con pollo e funghi",
    kicker: "Ricetta regionale verificata · MAFF",
    course: "Piatto unico",
    cuisine: "Asiatico",
    image: photo("part-rice-basmati-v7"),
    time: 35,
    ingredients: [
      { food: "Riso basmati cotto", grams: 160 },
      { food: "Petto di pollo · peso a crudo", grams: 110 },
      { food: "Carote cotte bollite", grams: 70 },
      { food: "Funghi", grams: 70 },
      { food: "Salsa di soia", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Riso basmati cotto", grams: 160, label: "Riso cotto · 160 g", image: photo("part-basmati-cooked-v11650") },
      { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 110, label: "Pollo · 110 g a crudo", image: photo("part-chicken-raw-v11651") },
      { category: "Contorno", food: "Carote cotte bollite", grams: 70, label: "Carote · 70 g", image: photo("part-carrots-cooked-v11651") },
      { category: "Contorno", food: "Funghi", grams: 70, label: "Funghi · 70 g", image: photo("part-mushrooms-raw-v11663") },
    ],
    steps: [
      "Taglia pollo, carote e funghi in pezzi piccoli e uniformi.",
      "Cuoci il pollo completamente, aggiungi verdure e salsa di soia e lascia restringere il fondo.",
      "Unisci il condimento al riso caldo e mescola senza schiacciare i chicchi.",
    ],
    alternatives: ["Ricetta adattata alle quantità del piano", "Contiene soia", "Adatta al pranzo da portare se preparata la sera"],
    sourceLabel: "MAFF · Kashiwa-meshi",
    sourceUrl: "https://www.maff.go.jp/e/policies/market/k_ryouri/search_menu/3337/index.html",
  },
  {
    id: "catalog-verified-lentil-pumpkin-bulgur",
    name: "Bulgur con lenticchie, zucca arrosto e spinaci",
    kicker: "Composizione equilibrata · modello Harvard",
    course: "Piatto unico",
    cuisine: "Gourmet",
    image: photo("part-bulgur-v11515"),
    time: 35,
    ingredients: [
      { food: "Bulgur cotto", grams: 160 },
      { food: "Lenticchie cotte", grams: 150 },
      { food: "Zucca", grams: 180 },
      { food: "Spinaci", grams: 80 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Bulgur cotto", grams: 160, label: "Bulgur cotto · 160 g", image: photo("part-bulgur-v11515") },
      { category: "Proteina", food: "Lenticchie cotte", grams: 150, label: "Lenticchie cotte · 150 g", image: photo("part-lentils-v1141") },
      { category: "Contorno", food: "Zucca", grams: 180, label: "Zucca · 180 g", image: photo("part-pumpkin-v8") },
      { category: "Contorno", food: "Spinaci", grams: 80, label: "Spinaci · 80 g", image: photo("part-spinach-v7") },
    ],
    steps: [
      "Taglia la zucca a cubetti e cuocila in forno a 200 °C finché morbida e dorata.",
      "Scalda lenticchie e bulgur già cotti; salta brevemente gli spinaci con poca acqua.",
      "Componi il piatto e aggiungi l'olio extravergine pesato a crudo.",
    ],
    alternatives: ["Piatto vegetale ricco di fibre", "Preparabile la sera e trasportabile al lavoro", "Componenti modificabili separatamente"],
    sourceLabel: "Harvard T.H. Chan · Healthy Eating Plate",
    sourceUrl: "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/",
  },
  {
    id: "catalog-verified-salmon-quinoa-asparagus",
    name: "Salmone con quinoa e asparagi",
    kicker: "Composizione equilibrata · modello Harvard",
    course: "Piatto unico",
    cuisine: "Gourmet",
    image: photo("part-salmon-baked-v7"),
    time: 30,
    ingredients: [
      { food: "Quinoa cotta", grams: 160 },
      { food: "Salmone cotto", grams: 130 },
      { food: "Asparagi crudi", grams: 200 },
      { food: "Olio extravergine", grams: 5 },
    ],
    parts: [
      { category: "Carboidrato", food: "Quinoa cotta", grams: 160, label: "Quinoa cotta · 160 g", image: photo("part-quinoa-v7") },
      { category: "Proteina", food: "Salmone cotto", grams: 130, label: "Salmone cotto · 130 g", image: photo("part-salmon-baked-v7") },
      { category: "Contorno", food: "Asparagi crudi", grams: 200, label: "Asparagi · 200 g a crudo", image: photo("part-asparagus-v113") },
      { category: "Extra", food: "Olio extravergine", grams: 5, label: "Olio EVO · 5 g", image: photo("part-olive-oil-v8") },
    ],
    steps: [
      "Elimina la parte dura degli asparagi e cuocili al vapore o in padella con poca acqua.",
      "Cuoci il salmone in forno a 190 °C fino a cottura completa e scalda la quinoa.",
      "Servi i tre componenti distinti e aggiungi l'olio pesato sugli asparagi.",
    ],
    alternatives: ["Il salmone apporta anche grassi: l'olio resta contenuto", "Componenti modificabili separatamente"],
    sourceLabel: "Harvard T.H. Chan · Healthy Eating Plate",
    sourceUrl: "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/",
  },
  {
    id: "catalog-verified-quinoa-feta-beet",
    name: "Quinoa con feta, barbabietola e spinaci",
    kicker: "Composizione equilibrata · modello Harvard",
    course: "Piatto unico",
    cuisine: "Gourmet",
    image: photo("part-quinoa-v7"),
    time: 15,
    ingredients: [
      { food: "Quinoa cotta", grams: 170 },
      { food: "Feta", grams: 80 },
      { food: "Barbabietole cotte", grams: 150 },
      { food: "Spinaci", grams: 100 },
      { food: "Olio extravergine", grams: 5 },
    ],
    parts: [
      { category: "Carboidrato", food: "Quinoa cotta", grams: 170, label: "Quinoa cotta · 170 g", image: photo("part-quinoa-v7") },
      { category: "Latticino", food: "Feta", grams: 80, label: "Feta · 80 g", image: photo("part-feta-v111") },
      { category: "Contorno", food: "Barbabietole cotte", grams: 150, label: "Barbabietola · 150 g", image: photo("part-beetroot-v11513") },
      { category: "Contorno", food: "Spinaci", grams: 100, label: "Spinaci · 100 g", image: photo("part-spinach-v7") },
    ],
    steps: [
      "Taglia la barbabietola cotta a cubetti e sbriciola la feta.",
      "Scalda la quinoa oppure lasciala fredda; prepara gli spinaci ben asciutti.",
      "Componi la ciotola, aggiungi la feta e termina con l'olio pesato.",
    ],
    alternatives: ["Buona anche fredda e trasportabile", "Contiene latte", "Componenti modificabili separatamente"],
    sourceLabel: "Harvard T.H. Chan · Healthy Eating Plate",
    sourceUrl: "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/",
  },
  {
    id: "catalog-verified-tofu-eggplant-bulgur",
    name: "Tofu dorato con melanzane e bulgur",
    kicker: "Composizione vegetale equilibrata · modello Harvard",
    course: "Piatto unico",
    cuisine: "Gourmet",
    image: photo("part-tofu-v11515"),
    time: 30,
    ingredients: [
      { food: "Bulgur cotto", grams: 160 },
      { food: "Tofu alla piastra", grams: 150 },
      { food: "Melanzane", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Bulgur cotto", grams: 160, label: "Bulgur cotto · 160 g", image: photo("part-bulgur-v11515") },
      { category: "Proteina", food: "Tofu alla piastra", grams: 150, label: "Tofu alla piastra · 150 g", image: photo("part-tofu-v11515") },
      { category: "Contorno", food: "Melanzane", grams: 200, label: "Melanzane · 200 g", image: photo("part-eggplant-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: [
      "Taglia le melanzane a cubetti e cuocile in padella antiaderente con poca acqua, poi falle asciugare.",
      "Tampona il tofu, taglialo a cubi e doralo su piastra calda su tutti i lati.",
      "Servi con il bulgur caldo e aggiungi l'olio pesato alla fine.",
    ],
    alternatives: ["Piatto completamente vegetale", "Contiene soia", "Preparabile la sera e trasportabile al lavoro", "Componenti modificabili separatamente"],
    sourceLabel: "Harvard T.H. Chan · Vegetarian Healthy Eating Plate",
    sourceUrl: "https://nutritionsource.hsph.harvard.edu/vegetarian-healthy-eating-plate-recipes/",
  },
  {
    id: "catalog-verified-chicken-quinoa-beet",
    name: "Pollo dorato con quinoa, barbabietola e spinaci",
    kicker: "Composizione equilibrata · modello Harvard",
    course: "Piatto unico",
    cuisine: "Gourmet",
    image: photo("part-chicken-grilled-v7"),
    time: 25,
    ingredients: [
      { food: "Quinoa cotta", grams: 160 },
      { food: "Petto di pollo · peso a crudo", grams: 120 },
      { food: "Barbabietole cotte", grams: 130 },
      { food: "Spinaci", grams: 100 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Quinoa cotta", grams: 160, label: "Quinoa cotta · 160 g", image: photo("part-quinoa-v7") },
      { category: "Proteina", food: "Petto di pollo · peso a crudo", grams: 120, label: "Pollo · 120 g a crudo", image: photo("part-chicken-raw-v11651") },
      { category: "Contorno", food: "Barbabietole cotte", grams: 130, label: "Barbabietola · 130 g", image: photo("part-beetroot-v11513") },
      { category: "Contorno", food: "Spinaci", grams: 100, label: "Spinaci · 100 g", image: photo("part-spinach-v7") },
    ],
    steps: [
      "Taglia il pollo a bocconcini e cuocilo completamente su piastra calda.",
      "Scalda la quinoa e taglia la barbabietola cotta; prepara gli spinaci.",
      "Componi il piatto in parti riconoscibili e aggiungi l'olio pesato a crudo.",
    ],
    alternatives: ["Preparabile la sera per il pranzo al lavoro", "Componenti modificabili separatamente"],
    sourceLabel: "Harvard T.H. Chan · Healthy Eating Plate",
    sourceUrl: "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/",
  },
];

const attachmentBaseBreakfasts: Recipe[] = [
  {
    id: "matrix-c01-porridge-apple-walnuts-chia",
    name: "Porridge mela, noci e chia",
    kicker: "Colazione equilibrata · matrice C01",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c01-apple-walnut-chia-v11674"),
    time: 10,
    ingredients: [
      { food: "Fiocchi d'avena", grams: 40 },
      { food: "Latte parzialmente scremato", grams: 180 },
      { food: "Mela", grams: 150 },
      { food: "Noci", grams: 10 },
      { food: "Semi di chia", grams: 5 },
    ],
    steps: ["Cuoci l'avena nel latte per 5-7 minuti.", "Aggiungi la mela a cubetti e completa con noci e semi di chia."],
    alternatives: ["Pera al posto della mela", "Mandorle al posto delle noci"],
  },
  {
    id: "matrix-c02-overnight-oats-berries",
    name: "Overnight oats ai frutti di bosco",
    kicker: "Colazione pronta dal giorno prima · matrice C02",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c02-overnight-berries-v11674"),
    time: 5,
    ingredients: [
      { food: "Fiocchi d'avena", grams: 35 },
      { food: "Yogurt greco 2%", grams: 125 },
      { food: "Frutti di bosco", grams: 150 },
      { food: "Semi di lino macinati", grams: 10 },
    ],
    steps: ["Mescola avena e yogurt con poca acqua fino a ottenere una crema.", "Lascia in frigorifero per almeno quattro ore e aggiungi frutti di bosco e lino prima di mangiare."],
    alternatives: ["Mirtilli freschi al posto dei frutti misti", "Yogurt greco 0% al posto del 2%"],
  },
  {
    id: "matrix-c03-skyr-pear-hazelnuts",
    name: "Coppa di skyr, pera e nocciole",
    kicker: "Colazione rapida · matrice C03",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c03-skyr-pear-hazelnut-v11674"),
    time: 5,
    ingredients: [
      { food: "Skyr bianco", grams: 170 },
      { food: "Pera", grams: 150 },
      { food: "Muesli", grams: 30 },
      { food: "Nocciole", grams: 10 },
    ],
    steps: ["Taglia la pera e disponi skyr, frutta e muesli a strati.", "Completa con le nocciole tritate."],
    alternatives: ["Mela al posto della pera", "Mandorle al posto delle nocciole"],
  },
  {
    id: "matrix-c04-rye-ricotta-orange",
    name: "Pane di segale, ricotta e arancia",
    kicker: "Colazione semplice · matrice C04",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c04-rye-ricotta-orange-v11674"),
    time: 7,
    ingredients: [
      { food: "Pane di segale", grams: 50 },
      { food: "Ricotta vaccina", grams: 80 },
      { food: "Arancia", grams: 150 },
      { food: "Semi di sesamo", grams: 5 },
    ],
    steps: ["Tosta il pane e spalma la ricotta.", "Completa con sesamo e servi l'arancia intera a parte."],
    alternatives: ["Pane integrale al posto del segale", "Fiocchi di latte al posto della ricotta"],
  },
  {
    id: "matrix-c06-omelette-spinach-bread",
    name: "Omelette agli spinaci con pane integrale",
    kicker: "Colazione salata da weekend · matrice C06",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c06-spinach-omelette-v11674"),
    time: 15,
    ingredients: [
      { food: "Uova strapazzate o in frittata", grams: 100 },
      { food: "Spinaci", grams: 100 },
      { food: "Pane integrale", grams: 50 },
      { food: "Olio extravergine", grams: 5 },
      { food: "Kiwi", grams: 150 },
    ],
    steps: ["Cuoci gli spinaci con parte dell'olio.", "Aggiungi le uova, completa la cottura dell'omelette e servi con pane e kiwi."],
    alternatives: ["Uova sode al posto dell'omelette", "Arancia al posto del kiwi"],
  },
  {
    id: "matrix-c07-kefir-muesli-peach",
    name: "Kefir, muesli e pesca",
    kicker: "Colazione rapida · matrice C07",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c07-kefir-muesli-peach-v11674"),
    time: 5,
    ingredients: [
      { food: "Kefir bianco magro", grams: 170 },
      { food: "Muesli", grams: 35 },
      { food: "Pesca", grams: 150 },
      { food: "Mandorle", grams: 10 },
    ],
    steps: ["Versa kefir e muesli in una ciotola.", "Aggiungi la pesca a spicchi e le mandorle."],
    alternatives: ["Nettarina al posto della pesca", "Noci al posto delle mandorle"],
  },
  {
    id: "matrix-c08-soy-mango-chia",
    name: "Bowl di soia, mango e chia",
    kicker: "Colazione vegetale · matrice C08",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c08-soy-mango-chia-v11674"),
    time: 5,
    ingredients: [
      { food: "Bevanda di soia senza zucchero", grams: 200 },
      { food: "Fiocchi d'avena", grams: 35 },
      { food: "Mango", grams: 150 },
      { food: "Semi di chia", grams: 10 },
    ],
    steps: ["Mescola bevanda di soia, avena e chia.", "Lascia addensare venti minuti o tutta la notte e aggiungi il mango."],
    alternatives: ["Papaya al posto del mango", "Latte parzialmente scremato al posto della soia"],
  },
  {
    id: "matrix-c09-yogurt-pomegranate-pistachios",
    name: "Yogurt greco, melagrana e pistacchi",
    kicker: "Colazione fresca · matrice C09",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c09-yogurt-pomegranate-pistachio-v11674"),
    time: 5,
    ingredients: [
      { food: "Yogurt greco 2%", grams: 170 },
      { food: "Melagrana fresca", grams: 150 },
      { food: "Fiocchi d'avena", grams: 30 },
      { food: "Pistacchi", grams: 10 },
    ],
    steps: ["Unisci yogurt e avena.", "Completa con chicchi di melagrana e pistacchi non salati."],
    alternatives: ["Mirtilli freschi al posto della melagrana", "Mandorle al posto dei pistacchi"],
  },
  {
    id: "matrix-c10-cottage-cheese-peach-bread",
    name: "Fiocchi di latte, pesca e pane ai cereali",
    kicker: "Colazione semplice · matrice C10",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c10-cottage-peach-bread-v11675"),
    time: 7,
    ingredients: [
      { food: "Fiocchi di latte", grams: 100 },
      { food: "Pane ai cereali", grams: 50 },
      { food: "Pesca", grams: 150 },
      { food: "Semi di zucca", grams: 10 },
    ],
    steps: ["Tosta il pane.", "Servilo con fiocchi di latte, pesca a fette e semi di zucca."],
    alternatives: ["Pane integrale al posto del pane ai cereali", "Pera al posto della pesca"],
  },
  {
    id: "matrix-c11-buckwheat-pancake-apple",
    name: "Pancake di grano saraceno con mela",
    kicker: "Colazione da preparare · matrice C11",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c11-buckwheat-apple-v11675"),
    time: 15,
    ingredients: [
      { food: "Farina di grano saraceno", grams: 40 },
      { food: "Albume", grams: 100 },
      { food: "Bevanda di soia senza zucchero", grams: 60 },
      { food: "Mela", grams: 150 },
      { food: "Crema 100% mandorle", grams: 10 },
    ],
    steps: ["Mescola farina, albume e bevanda fino a ottenere una pastella.", "Cuoci piccoli pancake in padella antiaderente e completa con mela e crema di mandorle."],
    alternatives: ["Farina d'avena al posto del grano saraceno", "Pera al posto della mela"],
  },
  {
    id: "matrix-c12-toast-peanut-banana",
    name: "Toast integrale con crema di arachidi e banana",
    kicker: "Colazione veloce · matrice C12",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c12-peanut-banana-toast-v11675"),
    time: 5,
    ingredients: [
      { food: "Pane integrale", grams: 50 },
      { food: "Crema 100% arachidi", grams: 15 },
      { food: "Banana", grams: 150 },
      { food: "Latte parzialmente scremato", grams: 125 },
    ],
    steps: ["Tosta il pane e spalma la crema di arachidi.", "Aggiungi parte della banana e servi la restante frutta con il latte."],
    alternatives: ["Crema 100% mandorle al posto delle arachidi", "Bevanda di soia senza zucchero al posto del latte"],
  },
];

const attachmentBaseSnacks: Recipe[] = [
  {
    id: "matrix-s01-apple-almonds",
    name: "Mela e mandorle",
    kicker: "Spuntino immediato · matrice S01",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s01-apple-almonds-v11677"),
    time: 2,
    ingredients: [{ food: "Mela", grams: 150 }, { food: "Mandorle", grams: 15 }],
    steps: ["Lava la mela e porziona le mandorle separatamente."],
    alternatives: ["Pera con nocciole", "Arancia con pistacchi"],
  },
  {
    id: "matrix-s03-skyr-kiwi",
    name: "Skyr e kiwi",
    kicker: "Spuntino proteico · matrice S03",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s03-skyr-kiwi-v11677"),
    time: 3,
    ingredients: [{ food: "Skyr bianco", grams: 170 }, { food: "Kiwi", grams: 150 }],
    steps: ["Sbuccia il kiwi e servilo a pezzi con lo skyr."],
    alternatives: ["Yogurt proteico alla vaniglia al posto dello skyr", "Arancia al posto del kiwi"],
  },
  {
    id: "matrix-s04-kefir-pear",
    name: "Kefir e pera",
    kicker: "Spuntino semplice · matrice S04",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s04-kefir-pear-v11677"),
    time: 2,
    ingredients: [{ food: "Kefir bianco magro", grams: 125 }, { food: "Pera", grams: 150 }],
    steps: ["Servi il kefir freddo con la pera intera o tagliata al momento."],
    alternatives: ["Skyr al posto del kefir", "Mela al posto della pera"],
  },
  {
    id: "matrix-s05-hummus-crunchy-vegetables",
    name: "Hummus e verdure croccanti",
    kicker: "Spuntino salato · matrice S05",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s05-hummus-vegetables-v11677"),
    time: 5,
    ingredients: [
      { food: "Hummus di ceci", grams: 40 },
      { food: "Carote crude", grams: 100 },
      { food: "Finocchi crudi", grams: 100 },
    ],
    steps: ["Lava e taglia carote e finocchi a bastoncino.", "Porziona l'hummus in un contenitore separato."],
    alternatives: ["Hummus di barbabietola al posto di quello di ceci", "Cetrioli crudi al posto dei finocchi"],
  },
  {
    id: "matrix-s06-ricotta-strawberries",
    name: "Ricotta e fragole",
    kicker: "Spuntino dolce senza zucchero aggiunto · matrice S06",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s06-ricotta-strawberries-v11677"),
    time: 3,
    ingredients: [{ food: "Ricotta vaccina", grams: 80 }, { food: "Fragole", grams: 150 }],
    steps: ["Lava e taglia le fragole.", "Servile con la ricotta senza aggiungere automaticamente zucchero."],
    alternatives: ["Fiocchi di latte al posto della ricotta", "Pesca al posto delle fragole"],
  },
  {
    id: "matrix-s07-rye-cottage-tomatoes",
    name: "Pane di segale e fiocchi di latte",
    kicker: "Spuntino salato trasportabile · matrice S07",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s07-rye-cottage-tomatoes-v11677"),
    time: 4,
    ingredients: [
      { food: "Pane di segale", grams: 40 },
      { food: "Fiocchi di latte", grams: 60 },
      { food: "Pomodorini", grams: 100 },
    ],
    steps: ["Tosta facoltativamente il pane.", "Aggiungi i fiocchi di latte e servi i pomodorini a parte."],
    alternatives: ["Pane integrale al posto del segale", "Ricotta vaccina al posto dei fiocchi di latte"],
  },
  {
    id: "matrix-s08-orange-pistachios",
    name: "Arancia e pistacchi",
    kicker: "Spuntino immediato · matrice S08",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s08-orange-pistachios-v11678"),
    time: 2,
    ingredients: [{ food: "Arancia", grams: 150 }, { food: "Pistacchi", grams: 15 }],
    steps: ["Sbuccia l'arancia e accompagna con pistacchi non salati già pesati."],
    alternatives: ["Mandarini freschi al posto dell'arancia", "Mandorle al posto dei pistacchi"],
  },
  {
    id: "matrix-s09-unsweetened-smoothie",
    name: "Frullato non zuccherato con yogurt e banana",
    kicker: "Spuntino occasionale completo · matrice S09",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s09-yogurt-banana-smoothie-v11678"),
    time: 4,
    ingredients: [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Banana", grams: 150 }],
    steps: ["Frulla yogurt e banana con poca acqua fredda.", "Non aggiungere zucchero; registra eventuali ingredienti extra."],
    alternatives: ["Fragole al posto della banana", "Kefir bianco magro al posto dello yogurt"],
  },
  {
    id: "matrix-s10-dark-chocolate-pear-walnuts",
    name: "Cioccolato fondente, pera e noci",
    kicker: "Spuntino occasionale porzionato · matrice S10",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s10-pear-chocolate-walnuts-v11678"),
    time: 2,
    ingredients: [
      { food: "Cioccolato fondente 70%", grams: 10 },
      { food: "Pera", grams: 150 },
      { food: "Noci", grams: 10 },
    ],
    steps: ["Pesa cioccolato e noci e servili con la pera.", "La porzione è modificabile e viene ricalcolata nell'app."],
    alternatives: ["Mela al posto della pera", "Mandorle al posto delle noci"],
  },
];

const attachmentBaseMainsA: Recipe[] = [
  {
    id: "matrix-p01-whole-pasta-chickpeas",
    name: "Pasta integrale con ceci, pomodorini e rucola",
    kicker: "Pranzo vegetale completo · matrice P01",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-p01-whole-pasta-chickpeas-v11680"),
    time: 20,
    ingredients: [
      { food: "Pasta integrale secca", grams: 70 },
      { food: "Ceci cotti", grams: 120 },
      { food: "Pomodorini", grams: 150 },
      { food: "Rucola", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci la pasta e scola al dente.", "Scalda ceci e pomodorini con poca acqua, unisci la pasta e completa con rucola e olio pesato a crudo."],
    alternatives: ["Fagioli cannellini cotti al posto dei ceci", "Pasta di lenticchie secca al posto della pasta integrale"],
  },
  {
    id: "matrix-p02-farro-lentils-roasted-vegetables",
    name: "Farro con lenticchie e verdure arrosto",
    kicker: "Pranzo vegetale trasportabile · matrice P02",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-p02-farro-lentils-roasted-vegetables-v11680"),
    time: 35,
    ingredients: [
      { food: "Farro cotto", grams: 180 },
      { food: "Lenticchie cotte", grams: 120 },
      { food: "Zucchine", grams: 100 },
      { food: "Peperoni cotti", grams: 75 },
      { food: "Cipolle crude", grams: 75 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Arrostisci zucchine, peperoni e cipolla finché sono morbidi.", "Unisci farro e lenticchie già cotti e completa con limone ed olio pesato."],
    alternatives: ["Orzo perlato cotto al posto del farro", "Ceci cotti al posto delle lenticchie"],
  },
  {
    id: "matrix-p03-quinoa-edamame-ginger",
    name: "Quinoa, edamame e verdure allo zenzero",
    kicker: "Pranzo vegetale di ispirazione asiatica · matrice P03",
    course: "Piatto unico",
    cuisine: "Asiatico",
    kind: "combination",
    image: photo("recipe-p03-quinoa-edamame-ginger-v11680"),
    time: 25,
    ingredients: [
      { food: "Quinoa cotta", grams: 180 },
      { food: "Edamame cotti", grams: 120 },
      { food: "Broccoli bolliti", grams: 100 },
      { food: "Carote cotte bollite", grams: 75 },
      { food: "Zucchine", grams: 75 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci le verdure mantenendole consistenti e profumale con zenzero.", "Unisci quinoa ed edamame già cotti e completa con l'olio misurato."],
    alternatives: ["Tofu alla piastra al posto degli edamame", "Riso basmati secco al posto della quinoa rispettando la porzione proposta"],
  },
  {
    id: "matrix-p04-basmati-light-chicken-curry",
    name: "Riso basmati con pollo al curry leggero",
    kicker: "Pranzo completo · matrice P04",
    course: "Piatto unico",
    cuisine: "Asiatico",
    kind: "combination",
    image: photo("recipe-p04-basmati-light-chicken-curry-v11680"),
    time: 30,
    ingredients: [
      { food: "Riso basmati secco", grams: 70 },
      { food: "Petto di pollo · peso a crudo", grams: 100 },
      { food: "Zucchine", grams: 100 },
      { food: "Carote cotte bollite", grams: 75 },
      { food: "Cipolle crude", grams: 75 },
      { food: "Yogurt greco 2%", grams: 60 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il riso e tienilo sgranato.", "Cuoci completamente il pollo con verdure e curry; a fuoco spento incorpora lo yogurt e servi con il riso."],
    alternatives: ["Petto di tacchino cotto alla piastra al posto del pollo", "Yogurt greco 0% al posto del 2%"],
  },
  {
    id: "matrix-p05-couscous-chickpeas-vegetables",
    name: "Cous cous integrale con ceci e verdure",
    kicker: "Pranzo vegetale trasportabile · matrice P05",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("recipe-p05-couscous-chickpeas-vegetables-v11681"),
    time: 25,
    ingredients: [
      { food: "Cous cous integrale cotto", grams: 180 },
      { food: "Ceci cotti", grams: 120 },
      { food: "Peperoni cotti", grams: 80 },
      { food: "Zucchine", grams: 90 },
      { food: "Carote cotte bollite", grams: 80 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Prepara il cous cous e sgrana bene i chicchi.", "Cuoci le verdure, unisci ceci e cous cous e completa con spezie ed olio pesato."],
    alternatives: ["Lenticchie cotte al posto dei ceci", "Bulgur cotto al posto del cous cous"],
  },
];

const attachmentBaseMainsB: Recipe[] = [
  {
    id: "matrix-p06-brown-rice-salmon-broccoli",
    name: "Riso integrale con salmone e broccoli",
    kicker: "Pranzo di pesce completo · matrice P06",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-p06-brown-rice-salmon-broccoli-v11681"),
    time: 35,
    ingredients: [
      { food: "Riso integrale secco", grams: 70 },
      { food: "Salmone cotto", grams: 150 },
      { food: "Broccoli bolliti", grams: 250 },
      { food: "Olio extravergine", grams: 5 },
    ],
    steps: ["Cuoci il riso e i broccoli separatamente.", "Cuoci completamente il salmone al forno o al vapore e aggiungi olio, limone ed erbe a fine cottura."],
    alternatives: ["Merluzzo cotto al posto del salmone", "Riso basmati secco al posto dell'integrale"],
  },
  {
    id: "matrix-p07-bulgur-turkey-aubergines",
    name: "Bulgur con tacchino, melanzane e pomodori",
    kicker: "Pranzo trasportabile · matrice P07",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("recipe-p07-bulgur-turkey-aubergines-v11681"),
    time: 30,
    ingredients: [
      { food: "Bulgur cotto", grams: 180 },
      { food: "Petto di tacchino cotto alla piastra", grams: 100 },
      { food: "Melanzane", grams: 125 },
      { food: "Pomodorini", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Griglia le melanzane e cuoci completamente il tacchino.", "Unisci bulgur, pomodorini e componenti cotti; completa con l'olio misurato."],
    alternatives: ["Petto di pollo cotto alla piastra al posto del tacchino", "Farro cotto al posto del bulgur"],
  },
  {
    id: "matrix-p08-pasta-tuna-tomato",
    name: "Pasta con tonno al naturale e pomodoro",
    kicker: "Pranzo semplice da mensa o casa · matrice P08",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-p08-pasta-tuna-tomato-v11681"),
    time: 20,
    ingredients: [
      { food: "Pasta di semola secca", grams: 80 },
      { food: "Tonno al naturale sgocciolato", grams: 50 },
      { food: "Passata di pomodoro", grams: 200 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci la pasta al dente e scalda la passata.", "Unisci il tonno sgocciolato, condisci la pasta e aggiungi l'olio pesato a crudo."],
    alternatives: ["Pasta integrale secca al posto della semola", "Sgombro cotto al posto del tonno"],
  },
  {
    id: "matrix-p09-barley-cannellini-black-kale",
    name: "Orzo con cannellini e cavolo nero",
    kicker: "Zuppa densa vegetale · matrice P09",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-p09-barley-cannellini-black-kale-v11681"),
    time: 35,
    ingredients: [
      { food: "Orzo perlato cotto", grams: 180 },
      { food: "Fagioli cannellini cotti", grams: 150 },
      { food: "Cavolo nero cotto", grams: 100 },
      { food: "Carote cotte bollite", grams: 50 },
      { food: "Sedano crudo", grams: 50 },
      { food: "Cipolle crude", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci sedano, carota e cipolla con poca acqua, poi aggiungi cavolo, cannellini e orzo.", "Lascia restringere come zuppa densa e aggiungi l'olio a crudo."],
    alternatives: ["Farro cotto al posto dell'orzo", "Lenticchie cotte al posto dei cannellini"],
  },
  {
    id: "matrix-p10-greek-quinoa-salad",
    name: "Insalata greca rivisitata con quinoa",
    kicker: "Pranzo fresco completo · matrice P10",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("recipe-p10-greek-quinoa-salad-v11681"),
    time: 20,
    ingredients: [
      { food: "Quinoa cotta", grams: 180 },
      { food: "Feta", grams: 80 },
      { food: "Pomodorini", grams: 100 },
      { food: "Cetrioli crudi", grams: 75 },
      { food: "Peperoni crudi", grams: 50 },
      { food: "Cipolle crude", grams: 25 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Raffredda la quinoa cotta e taglia tutte le verdure.", "Unisci feta e verdure, poi condisci con l'olio pesato e origano."],
    alternatives: ["Primo sale al posto della feta", "Farro cotto al posto della quinoa"],
  },
];

const attachmentBaseMainsC: Recipe[] = [
  {
    id: "matrix-p11-polenta-mushrooms-ricotta",
    name: "Polenta con funghi e ricotta",
    kicker: "Piatto caldo vegetariano · matrice P11",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-p11-polenta-mushrooms-ricotta-v11681"),
    time: 35,
    ingredients: [
      { food: "Polenta cotta", grams: 300 },
      { food: "Funghi", grams: 250 },
      { food: "Ricotta vaccina", grams: 100 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci la polenta fino alla consistenza desiderata.", "Cuoci i funghi con poca acqua e completa il piatto con ricotta e olio misurato."],
    alternatives: ["Primo sale al posto della ricotta", "Patate lesse al posto della polenta nella quantità proposta"],
  },
  {
    id: "matrix-p12-red-rice-prawns-courgettes",
    name: "Riso rosso con gamberi e zucchine",
    kicker: "Pranzo di pesce completo · matrice P12",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("recipe-p12-red-rice-prawns-courgettes-v11681"),
    time: 30,
    ingredients: [
      { food: "Riso rosso integrale cotto", grams: 180 },
      { food: "Gamberi cotti", grams: 150 },
      { food: "Zucchine", grams: 125 },
      { food: "Carote cotte bollite", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci e raffredda leggermente il riso rosso.", "Cuoci rapidamente zucchine, carote e gamberi e unisci tutto con l'olio pesato."],
    alternatives: ["Riso Venere secco al posto del riso rosso rispettando la porzione proposta", "Merluzzo cotto al posto dei gamberi"],
  },
  {
    id: "matrix-p13-legume-pasta-aubergine-ricotta",
    name: "Pasta di legumi con melanzane e ricotta",
    kicker: "Pranzo vegetale completo · matrice P13",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-p13-legume-pasta-aubergine-ricotta-v11682"),
    time: 25,
    ingredients: [
      { food: "Pasta di lenticchie secca", grams: 80 },
      { food: "Melanzane", grams: 125 },
      { food: "Pomodorini", grams: 125 },
      { food: "Ricotta vaccina", grams: 80 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci la pasta e le melanzane separatamente.", "Unisci pomodorini e pasta, quindi manteca con ricotta e aggiungi l'olio misurato."],
    alternatives: ["Pasta integrale secca al posto della pasta di legumi", "Fiocchi di latte al posto della ricotta"],
  },
  {
    id: "matrix-p14-buckwheat-tofu-vegetables",
    name: "Bowl di grano saraceno, tofu e verdure",
    kicker: "Piatto vegetale di ispirazione asiatica · matrice P14",
    course: "Piatto unico",
    cuisine: "Asiatico",
    kind: "combination",
    image: photo("recipe-p14-buckwheat-tofu-vegetables-v11682"),
    time: 25,
    ingredients: [
      { food: "Grano saraceno cotto", grams: 180 },
      { food: "Tofu alla piastra", grams: 100 },
      { food: "Cavolo rosso crudo", grams: 80 },
      { food: "Carote cotte bollite", grams: 60 },
      { food: "Funghi", grams: 60 },
      { food: "Cipolle crude", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il grano saraceno e griglia il tofu.", "Cuoci rapidamente funghi, carote e cipolla, poi componi la bowl con cavolo croccante e olio misurato."],
    alternatives: ["Quinoa cotta al posto del grano saraceno", "Tempeh al posto del tofu"],
  },
  {
    id: "matrix-p15-millet-tempeh-pumpkin-radicchio",
    name: "Miglio con tempeh, zucca e radicchio",
    kicker: "Piatto vegetale completo · matrice P15",
    course: "Piatto unico",
    cuisine: "Vegetale",
    kind: "combination",
    image: photo("recipe-p15-millet-tempeh-pumpkin-radicchio-v11682"),
    time: 35,
    ingredients: [
      { food: "Miglio cotto", grams: 190 },
      { food: "Tempeh", grams: 100 },
      { food: "Zucca", grams: 125 },
      { food: "Radicchio cotto", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il miglio e arrostisci zucca e radicchio.", "Griglia il tempeh, componi il piatto e aggiungi l'olio pesato."],
    alternatives: ["Tofu alla piastra al posto del tempeh", "Bulgur cotto al posto del miglio"],
  },
  {
    id: "matrix-p16-potatoes-eggs-green-beans",
    name: "Patate, uova e fagiolini con salsa allo yogurt",
    kicker: "Piatto semplice e completo · matrice P16",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-p16-potatoes-eggs-green-beans-v11682"),
    time: 30,
    ingredients: [
      { food: "Patate lesse", grams: 200 },
      { food: "Uova sode", grams: 100 },
      { food: "Fagiolini", grams: 125 },
      { food: "Pomodorini", grams: 125 },
      { food: "Yogurt greco 0%", grams: 60 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Lessa patate, uova e fagiolini e lascia intiepidire.", "Mescola yogurt, limone ed erbe e servi la salsa separatamente; aggiungi l'olio pesato alle verdure."],
    alternatives: ["Tonno al naturale sgocciolato al posto delle uova", "Broccoli bolliti al posto dei fagiolini"],
  },
];

const attachmentBreakfastsC13C20: Recipe[] = [
  {
    id: "matrix-c13-pear-cocoa-hazelnut-porridge",
    name: "Porridge pera, cacao e nocciole",
    kicker: "Colazione calda · matrice C13",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c13-pear-cocoa-porridge-v11675"),
    time: 10,
    ingredients: [
      { food: "Fiocchi d'avena", grams: 40 },
      { food: "Latte parzialmente scremato", grams: 180 },
      { food: "Pera", grams: 150 },
      { food: "Nocciole", grams: 10 },
      { food: "Cioccolato fondente 70%", grams: 5 },
    ],
    steps: ["Cuoci l'avena nel latte per 5-7 minuti.", "Aggiungi la pera a cubetti e completa con nocciole e cioccolato fondente grattugiato."],
    alternatives: ["Mela al posto della pera", "Mandorle al posto delle nocciole"],
  },
  {
    id: "matrix-c14-yogurt-pineapple-oats-pumpkin-seeds",
    name: "Yogurt greco con ananas, avena e semi di zucca",
    kicker: "Colazione rapida · matrice C14",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c14-yogurt-pineapple-oats-v11675"),
    time: 5,
    ingredients: [
      { food: "Yogurt greco 2%", grams: 170 },
      { food: "Ananas", grams: 150 },
      { food: "Fiocchi d'avena", grams: 30 },
      { food: "Semi di zucca", grams: 10 },
    ],
    steps: ["Taglia l'ananas a cubetti e uniscilo allo yogurt.", "Aggiungi avena e semi di zucca già pesati."],
    alternatives: ["Yogurt greco 0% al posto del 2%", "Papaya al posto dell'ananas"],
  },
  {
    id: "matrix-c15-poached-egg-toast",
    name: "Toast con uovo in camicia, pomodorini e rucola",
    kicker: "Colazione salata da weekend · matrice C15",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c15-poached-egg-toast-v11675"),
    time: 15,
    ingredients: [
      { food: "Pane integrale", grams: 50 },
      { food: "Uovo in camicia", grams: 50 },
      { food: "Pomodorini", grams: 150 },
      { food: "Rucola", grams: 30 },
      { food: "Olio extravergine", grams: 5 },
    ],
    steps: ["Tosta il pane e cuoci l'uovo in acqua appena fremete finché l'albume è rappreso.", "Servilo sul pane con pomodorini e rucola e completa con olio pesato e pepe."],
    alternatives: ["Uova strapazzate o in frittata al posto dell'uovo in camicia", "Pane di segale al posto dell'integrale"],
  },
  {
    id: "matrix-c16-ricotta-blueberries-pistachios",
    name: "Crema di ricotta, mirtilli e pistacchi",
    kicker: "Colazione fresca · matrice C16",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c16-ricotta-blueberry-pistachio-v11675"),
    time: 7,
    ingredients: [
      { food: "Ricotta vaccina", grams: 100 },
      { food: "Mirtilli freschi", grams: 150 },
      { food: "Pane di segale", grams: 50 },
      { food: "Pistacchi", grams: 10 },
    ],
    steps: ["Lavora la ricotta fino a renderla cremosa.", "Aggiungi mirtilli e pistacchi tritati e servi con pane di segale tostato."],
    alternatives: ["Fiocchi di latte al posto della ricotta", "Fragole al posto dei mirtilli"],
  },
  {
    id: "matrix-c17-chia-kefir-mango-pudding",
    name: "Budino di chia, kefir e mango",
    kicker: "Colazione pronta dal giorno prima · matrice C17",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c17-chia-kefir-mango-v11675"),
    time: 5,
    ingredients: [
      { food: "Kefir bianco magro", grams: 170 },
      { food: "Semi di chia", grams: 15 },
      { food: "Mango", grams: 150 },
      { food: "Fiocchi d'avena", grams: 25 },
    ],
    steps: ["Mescola kefir, chia e avena.", "Lascia riposare in frigorifero almeno tre ore e aggiungi il mango prima di mangiare."],
    alternatives: ["Papaya al posto del mango", "Yogurt greco 0% al posto del kefir"],
  },
  {
    id: "matrix-c18-whole-pancakes-ricotta-cherries",
    name: "Pancake integrali con ricotta e ciliegie",
    kicker: "Colazione da weekend · matrice C18",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c18-pancakes-ricotta-cherries-v11676"),
    time: 15,
    ingredients: [
      { food: "Farina di frumento integrale", grams: 40 },
      { food: "Albume", grams: 100 },
      { food: "Latte parzialmente scremato", grams: 50 },
      { food: "Ricotta vaccina", grams: 60 },
      { food: "Ciliegie fresche", grams: 150 },
    ],
    steps: ["Mescola farina, albume e latte fino a ottenere una pastella.", "Cuoci piccoli pancake in padella antiaderente e servi con ricotta e ciliegie denocciolate."],
    alternatives: ["Farina d'avena al posto della farina integrale", "Fragole al posto delle ciliegie"],
  },
  {
    id: "matrix-c19-cottage-melon-walnut-bowl",
    name: "Bowl di fiocchi di latte, melone e noci",
    kicker: "Colazione rapida · matrice C19",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c19-cottage-melon-walnuts-v11676"),
    time: 5,
    ingredients: [
      { food: "Fiocchi di latte", grams: 100 },
      { food: "Melone estivo", grams: 200 },
      { food: "Pane ai cereali", grams: 40 },
      { food: "Noci", grams: 10 },
    ],
    steps: ["Taglia il melone a cubetti e servilo con i fiocchi di latte.", "Completa con noci tritate e pane ai cereali."],
    alternatives: ["Pesca al posto del melone", "Mandorle al posto delle noci"],
  },
  {
    id: "matrix-c20-cold-papaya-porridge",
    name: "Porridge freddo con papaya, lino e mandorle",
    kicker: "Colazione pronta in anticipo · matrice C20",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c20-cold-papaya-porridge-v11676"),
    time: 5,
    ingredients: [
      { food: "Fiocchi d'avena", grams: 35 },
      { food: "Yogurt greco 2%", grams: 125 },
      { food: "Papaya", grams: 150 },
      { food: "Semi di lino macinati", grams: 5 },
      { food: "Mandorle", grams: 10 },
    ],
    steps: ["Mescola avena, yogurt, poca acqua e semi di lino.", "Lascia in frigorifero almeno due ore e aggiungi papaya e mandorle prima del consumo."],
    alternatives: ["Mango al posto della papaya", "Yogurt greco 0% al posto del 2%"],
  },
];


const attachmentBreakfastsC22C28: Recipe[] = [
  {
    id: "matrix-c22-yogurt-apple-oats-sunflower",
    name: "Yogurt, mela, avena e semi di girasole",
    kicker: "Colazione rapida",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c22-yogurt-apple-sunflower-v11676"),
    time: 5,
    ingredients: [
      { food: "Yogurt bianco", grams: 170 },
      { food: "Mela", grams: 150 },
      { food: "Fiocchi d'avena", grams: 30 },
      { food: "Semi di girasole", grams: 10 },
    ],
    steps: ["Taglia la mela a cubetti.", "Uniscila allo yogurt e completa con avena e semi di girasole già pesati."],
    alternatives: ["Pera al posto della mela", "Semi di zucca al posto dei semi di girasole"],
  },
  {
    id: "matrix-c23-bread-cottage-pear-pecans",
    name: "Pane integrale con fiocchi di latte, pera e pecan",
    kicker: "Colazione veloce",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c23-cottage-pear-pecans-v11676"),
    time: 7,
    ingredients: [
      { food: "Pane integrale", grams: 50 },
      { food: "Fiocchi di latte", grams: 100 },
      { food: "Pera", grams: 150 },
      { food: "Noci pecan", grams: 10 },
    ],
    steps: ["Tosta il pane e servilo con i fiocchi di latte.", "Aggiungi la pera tagliata al momento e le noci pecan spezzettate."],
    alternatives: ["Pane di segale al posto dell'integrale", "Mela al posto della pera"],
  },
  {
    id: "matrix-c24-kefir-strawberry-oat-smoothie",
    name: "Frullato denso di kefir, fragole e avena",
    kicker: "Colazione frullata da casa",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c24-kefir-strawberry-smoothie-v11676"),
    time: 7,
    ingredients: [
      { food: "Kefir bianco magro", grams: 170 },
      { food: "Fragole", grams: 150 },
      { food: "Fiocchi d'avena", grams: 30 },
      { food: "Semi di chia", grams: 5 },
    ],
    steps: ["Frulla kefir, fragole lavate e avena con poca acqua.", "Aggiungi la chia e lascia riposare cinque minuti prima di bere."],
    alternatives: ["Yogurt bianco al posto del kefir", "Mirtilli freschi al posto delle fragole"],
  },
  {
    id: "matrix-c25-scrambled-eggs-asparagus-rye",
    name: "Uova strapazzate con asparagi, segale e kiwi",
    kicker: "Colazione salata da weekend",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c25-eggs-asparagus-kiwi-v11676"),
    time: 15,
    ingredients: [
      { food: "Uova strapazzate o in frittata", grams: 50 },
      { food: "Albume", grams: 100 },
      { food: "Asparagi crudi", grams: 150 },
      { food: "Pane di segale", grams: 50 },
      { food: "Olio extravergine", grams: 5 },
      { food: "Kiwi", grams: 150 },
    ],
    steps: ["Elimina la parte dura degli asparagi e cuocili al vapore.", "Cuoci uovo e albume in padella antiaderente finché sono completamente rappresi; aggiungi gli asparagi e l'olio pesato.", "Servi con pane di segale e kiwi."],
    alternatives: ["Uova sode al posto delle strapazzate", "Pane integrale al posto del pane di segale"],
  },
  {
    id: "matrix-c26-skyr-grapes-pistachio-muesli",
    name: "Skyr con uva, pistacchi e muesli",
    kicker: "Colazione pronta in cinque minuti",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c26-skyr-grapes-pistachio-v11676"),
    time: 5,
    ingredients: [
      { food: "Skyr bianco", grams: 170 },
      { food: "Uva", grams: 150 },
      { food: "Muesli", grams: 30 },
      { food: "Pistacchi", grams: 10 },
    ],
    steps: ["Lava l'uva, taglia a metà gli acini più grandi e rimuovi eventuali semi.", "Unisci skyr, muesli, uva e pistacchi non salati."],
    alternatives: ["Yogurt greco 0% al posto dello skyr", "Pera al posto dell'uva"],
  },
  {
    id: "matrix-c27-oat-pancakes-blueberries-almond",
    name: "Pancake d'avena con mirtilli e crema di mandorle",
    kicker: "Colazione da weekend",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c27-oat-pancakes-blueberries-v11677"),
    time: 15,
    ingredients: [
      { food: "Farina d'avena", grams: 40 },
      { food: "Albume", grams: 100 },
      { food: "Bevanda di soia senza zucchero", grams: 60 },
      { food: "Mirtilli freschi", grams: 150 },
      { food: "Crema 100% mandorle", grams: 10 },
    ],
    steps: ["Mescola farina, albume e bevanda di soia fino a ottenere una pastella.", "Cuoci piccoli pancake in padella antiaderente.", "Servi con mirtilli e crema di mandorle pesata."],
    alternatives: ["Latte parzialmente scremato al posto della soia", "Fragole al posto dei mirtilli"],
  },
  {
    id: "matrix-c28-ricotta-pineapple-rye-sesame",
    name: "Ricotta con ananas, segale e sesamo",
    kicker: "Colazione fresca e rapida",
    course: "Colazione",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-c28-ricotta-pineapple-rye-v11677"),
    time: 5,
    ingredients: [
      { food: "Ricotta vaccina", grams: 100 },
      { food: "Ananas", grams: 150 },
      { food: "Pane di segale", grams: 50 },
      { food: "Semi di sesamo", grams: 5 },
    ],
    steps: ["Taglia l'ananas a cubetti e servilo con la ricotta.", "Completa con sesamo e pane di segale tostato."],
    alternatives: ["Fiocchi di latte al posto della ricotta", "Papaya al posto dell'ananas"],
  },
];


const attachmentSnacksS14S26: Recipe[] = [
  {
    id: "matrix-s14-rice-cakes-ricotta-tomatoes",
    name: "Gallette integrali con ricotta e pomodorini",
    kicker: "Spuntino salato · pronto in 5 minuti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s14-rice-cakes-ricotta-tomatoes-v11678"),
    time: 5,
    ingredients: [
      { food: "Gallette di riso integrale", grams: 30 },
      { food: "Ricotta vaccina", grams: 60 },
      { food: "Pomodorini", grams: 100 },
    ],
    steps: ["Spalma la ricotta sulle gallette.", "Aggiungi i pomodorini lavati e tagliati e completa con origano."],
    alternatives: ["Pane integrale al posto delle gallette", "Fiocchi di latte al posto della ricotta"],
  },
  {
    id: "matrix-s15-hummus-cucumber-carrots",
    name: "Cetrioli e carote con hummus alla paprika",
    kicker: "Spuntino salato trasportabile",
    course: "Spuntino",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("recipe-s15-hummus-cucumber-carrots-v11678"),
    time: 7,
    ingredients: [
      { food: "Hummus di ceci", grams: 40 },
      { food: "Cetrioli", grams: 100 },
      { food: "Carote crude", grams: 100 },
    ],
    steps: ["Lava e taglia cetriolo e carote a bastoncini.", "Mescola l'hummus con paprika e qualche goccia di limone e portalo separato."],
    alternatives: ["Hummus di barbabietola al posto di quello di ceci", "Finocchi crudi al posto del cetriolo"],
  },
  {
    id: "matrix-s16-yogurt-plums-sunflower",
    name: "Yogurt con prugne e semi di girasole",
    kicker: "Spuntino fresco · pronto in 3 minuti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s16-yogurt-plums-sunflower-v11678"),
    time: 3,
    ingredients: [
      { food: "Yogurt bianco", grams: 125 },
      { food: "Prugne fresche", grams: 150 },
      { food: "Semi di girasole", grams: 10 },
    ],
    steps: ["Lava, denocciola e taglia le prugne.", "Servile con yogurt e semi di girasole non salati."],
    alternatives: ["Skyr bianco al posto dello yogurt", "Pesca al posto delle prugne"],
  },
  {
    id: "matrix-s17-bread-cottage-cucumber",
    name: "Pane integrale con fiocchi di latte e cetriolo",
    kicker: "Spuntino salato semplice",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s17-bread-cottage-cucumber-v11678"),
    time: 5,
    ingredients: [
      { food: "Pane integrale", grams: 40 },
      { food: "Fiocchi di latte", grams: 60 },
      { food: "Cetrioli", grams: 100 },
    ],
    steps: ["Tosta il pane solo se hai tempo.", "Completa con fiocchi di latte, cetriolo affettato ed erba cipollina."],
    alternatives: ["Pane di segale al posto dell'integrale", "Ricotta vaccina al posto dei fiocchi di latte"],
  },
  {
    id: "matrix-s18-pineapple-kefir-chia",
    name: "Ananas, kefir e semi di chia",
    kicker: "Spuntino fresco · pronto in 3 minuti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s18-pineapple-kefir-chia-v11678"),
    time: 3,
    ingredients: [
      { food: "Kefir bianco magro", grams: 125 },
      { food: "Ananas", grams: 150 },
      { food: "Semi di chia", grams: 5 },
    ],
    steps: ["Taglia l'ananas a cubetti.", "Servilo con kefir e chia; se lo porti al lavoro, conservalo refrigerato."],
    alternatives: ["Yogurt bianco al posto del kefir", "Papaya al posto dell'ananas"],
  },
  {
    id: "matrix-s20-greek-yogurt-raspberries",
    name: "Yogurt greco e lamponi",
    kicker: "Spuntino fresco · pronto in 3 minuti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s20-greek-yogurt-raspberries-v11679"),
    time: 3,
    ingredients: [
      { food: "Yogurt greco 2%", grams: 150 },
      { food: "Lamponi", grams: 150 },
    ],
    steps: ["Lava delicatamente i lamponi e asciugali.", "Servili con lo yogurt greco senza aggiungere zucchero non registrato."],
    alternatives: ["Yogurt greco 0% al posto del 2%", "Mirtilli freschi al posto dei lamponi"],
  },
  {
    id: "matrix-s21-cottage-tomatoes-rice-cakes",
    name: "Fiocchi di latte, pomodorini e gallette",
    kicker: "Spuntino salato e pratico",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s21-cottage-tomatoes-rice-cakes-v11679"),
    time: 5,
    ingredients: [
      { food: "Fiocchi di latte", grams: 80 },
      { food: "Pomodorini", grams: 150 },
      { food: "Gallette di riso integrale", grams: 25 },
    ],
    steps: ["Lava e taglia i pomodorini.", "Servili con fiocchi di latte e gallette tenute separate fino al consumo."],
    alternatives: ["Ricotta vaccina al posto dei fiocchi di latte", "Pane integrale al posto delle gallette"],
  },
  {
    id: "matrix-s22-apple-hazelnuts-dark-chocolate",
    name: "Mela, nocciole e cioccolato fondente",
    kicker: "Spuntino dolce porzionato",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s22-apple-hazelnuts-chocolate-v11679"),
    time: 2,
    ingredients: [
      { food: "Mela", grams: 150 },
      { food: "Nocciole", grams: 10 },
      { food: "Cioccolato fondente 70%", grams: 7 },
    ],
    steps: ["Lava e taglia la mela oppure portala intera.", "Abbinala alla porzione pesata di nocciole e cioccolato fondente."],
    alternatives: ["Pera al posto della mela", "Mandorle al posto delle nocciole"],
  },
  {
    id: "matrix-s23-fennel-herb-ricotta",
    name: "Finocchi con crema di ricotta alle erbe",
    kicker: "Spuntino salato e fresco",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s23-fennel-herb-ricotta-v11679"),
    time: 7,
    ingredients: [
      { food: "Finocchi crudi", grams: 200 },
      { food: "Ricotta vaccina", grams: 60 },
    ],
    steps: ["Lava il finocchio e taglialo a spicchi sottili.", "Lavora la ricotta con erbe aromatiche e limone e usala come crema."],
    alternatives: ["Hummus di ceci al posto della ricotta", "Carote crude al posto dei finocchi"],
  },
  {
    id: "matrix-s24-pear-almond-butter",
    name: "Pera con crema 100% mandorle",
    kicker: "Spuntino dolce · pronto in 2 minuti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s24-pear-almond-butter-v11679"),
    time: 2,
    ingredients: [
      { food: "Pera", grams: 150 },
      { food: "Crema 100% mandorle", grams: 10 },
    ],
    steps: ["Lava e taglia la pera.", "Aggiungi la crema di mandorle già pesata oppure portala in un piccolo contenitore."],
    alternatives: ["Mela al posto della pera", "Crema 100% arachidi al posto delle mandorle"],
  },
  {
    id: "matrix-s25-skyr-banana-pumpkin-seeds",
    name: "Skyr, banana e semi di zucca",
    kicker: "Spuntino proteico · pronto in 3 minuti",
    course: "Spuntino",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-s25-skyr-banana-pumpkin-v11679"),
    time: 3,
    ingredients: [
      { food: "Skyr bianco", grams: 125 },
      { food: "Banana", grams: 100 },
      { food: "Semi di zucca", grams: 10 },
    ],
    steps: ["Taglia la banana a rondelle.", "Servila con skyr e semi di zucca non salati."],
    alternatives: ["Yogurt greco 0% al posto dello skyr", "Pera al posto della banana"],
  },
  {
    id: "matrix-s26-hummus-tomatoes-cucumber",
    name: "Hummus con pomodorini e cetrioli",
    kicker: "Spuntino salato trasportabile",
    course: "Spuntino",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("recipe-s26-hummus-tomatoes-cucumber-v11679"),
    time: 5,
    ingredients: [
      { food: "Hummus di ceci", grams: 40 },
      { food: "Pomodorini", grams: 100 },
      { food: "Cetrioli", grams: 100 },
    ],
    steps: ["Lava e taglia pomodorini e cetriolo.", "Porta l'hummus separato e unisci tutto solo al momento."],
    alternatives: ["Hummus di barbabietola al posto di quello di ceci", "Carote crude al posto del cetriolo"],
  },
];


const attachmentMainsP17P22: Recipe[] = [
  {
    id: "matrix-p17-brown-risotto-peas-shrimp",
    name: "Risotto integrale con piselli, gamberi e zucchine",
    kicker: "Piatto unico di pesce",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p17-brown-risotto-peas-shrimp-v11682"),
    time: 35,
    ingredients: [
      { food: "Riso integrale secco", grams: 70 },
      { food: "Piselli cotti", grams: 100 },
      { food: "Gamberi cotti", grams: 120 },
      { food: "Zucchine", grams: 150 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il riso integrale con cipolla e acqua o brodo vegetale poco salato.", "A metà cottura aggiungi piselli e zucchine; unisci i gamberi già cotti solo negli ultimi minuti.", "Completa con olio misurato, prezzemolo e pepe."],
    alternatives: ["Quinoa cotta al posto del riso", "Merluzzo cotto al posto dei gamberi"],
  },
  {
    id: "matrix-p18-quinoa-chicken-peppers-turmeric",
    name: "Quinoa con pollo, peperoni e curcuma",
    kicker: "Piatto unico di carne bianca",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    image: photo("recipe-p18-quinoa-chicken-peppers-turmeric-v11682"),
    time: 30,
    ingredients: [
      { food: "Quinoa cotta", grams: 185 },
      { food: "Petto di pollo · peso a crudo", grams: 100 },
      { food: "Peperoni cotti senza olio", grams: 125 },
      { food: "Zucchine", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci la quinoa secondo confezione e scolala.", "Griglia pollo, peperoni e zucchine finché il pollo è completamente cotto.", "Taglia il pollo a strisce e unisci tutto con olio pesato, curcuma, paprika e limone."],
    alternatives: ["Riso basmati al posto della quinoa", "Petto di tacchino alla piastra al posto del pollo"],
  },
  {
    id: "matrix-p19-spelt-pasta-mackerel-broccoli",
    name: "Pasta di farro con sgombro e broccoli",
    kicker: "Piatto unico di pesce",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p19-spelt-pasta-mackerel-broccoli-v11682"),
    time: 25,
    ingredients: [
      { food: "Pasta di farro secca", grams: 80 },
      { food: "Sgombro al naturale sgocciolato", grams: 50 },
      { food: "Broccoli bolliti", grams: 250 },
      { food: "Olio extravergine", grams: 5 },
    ],
    steps: ["Lessa i broccoli e usa la stessa acqua per cuocere la pasta di farro.", "Scola la pasta al dente e uniscila a broccoli e sgombro sgocciolato.", "Completa con olio misurato, limone e peperoncino."],
    alternatives: ["Pasta integrale al posto della pasta di farro", "Tonno al naturale al posto dello sgombro"],
  },
  {
    id: "matrix-p20-bulgur-red-beans-cabbage",
    name: "Bulgur con fagioli rossi, pomodori e cavolo",
    kicker: "Piatto unico vegetale",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    image: photo("recipe-p20-bulgur-red-beans-cabbage-v11682"),
    time: 20,
    ingredients: [
      { food: "Bulgur cotto", grams: 180 },
      { food: "Fagioli rossi cotti", grams: 150 },
      { food: "Pomodorini", grams: 100 },
      { food: "Cavolo rosso crudo", grams: 75 },
      { food: "Peperoni crudi", grams: 75 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il bulgur secondo confezione e lascialo intiepidire.", "Risciacqua i fagioli e taglia le verdure.", "Unisci tutto con paprika, limone, cipolla e olio misurato."],
    alternatives: ["Quinoa cotta per una versione senza glutine", "Cannellini al posto dei fagioli rossi"],
  },
  {
    id: "matrix-p21-venere-tuna-zucchini-carrots",
    name: "Riso Venere con tonno, zucchine e carote",
    kicker: "Piatto unico di pesce",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p21-venere-tuna-zucchini-carrots-v11683"),
    time: 35,
    ingredients: [
      { food: "Riso Venere secco", grams: 70 },
      { food: "Tonno al naturale sgocciolato", grams: 50 },
      { food: "Zucchine", grams: 125 },
      { food: "Carote crude", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il riso Venere rispettando il tempo indicato sulla confezione.", "Cuoci zucchine e carote al vapore o in padella antiaderente.", "Unisci riso, tonno sgocciolato e verdure; completa con olio pesato, zenzero e limone."],
    alternatives: ["Riso basmati al posto del Venere", "Salmone cotto al posto del tonno"],
  },
  {
    id: "matrix-p22-barley-chicken-mushroom-spinach",
    name: "Orzo con pollo, funghi e spinaci",
    kicker: "Piatto unico di carne bianca",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p22-barley-chicken-mushroom-spinach-v11683"),
    time: 30,
    ingredients: [
      { food: "Orzo perlato cotto", grams: 180 },
      { food: "Petto di pollo · peso a crudo", grams: 100 },
      { food: "Funghi", grams: 125 },
      { food: "Spinaci", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci l'orzo secondo confezione e scolalo.", "Cuoci funghi e spinaci in padella antiaderente e griglia il pollo fino a completa cottura.", "Taglia il pollo a strisce e unisci tutto con olio misurato, timo e pepe."],
    alternatives: ["Farro cotto al posto dell'orzo", "Petto di tacchino alla piastra al posto del pollo"],
  },
];


const attachmentMainsP23P27: Recipe[] = [
  {
    id: "matrix-p23-couscous-lentils-pumpkin-feta",
    name: "Cous cous integrale con lenticchie, zucca e feta",
    kicker: "Piatto unico vegetariano",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    image: photo("recipe-p23-couscous-lentils-pumpkin-feta-v11683"),
    time: 30,
    ingredients: [
      { food: "Cous cous integrale cotto", grams: 180 },
      { food: "Lenticchie cotte", grams: 120 },
      { food: "Zucca", grams: 125 },
      { food: "Radicchio cotto", grams: 125 },
      { food: "Feta", grams: 40 },
      { food: "Olio extravergine", grams: 5 },
    ],
    steps: ["Arrostisci zucca e radicchio finché sono morbidi e leggermente dorati.", "Reidrata il cous cous integrale secondo confezione e sgranalo.", "Unisci lenticchie risciacquate, feta, verdure e olio misurato; completa con timo e limone."],
    alternatives: ["Bulgur cotto al posto del cous cous", "Cannellini al posto delle lenticchie", "Primo sale al posto della feta"],
  },
  {
    id: "matrix-p24-whole-pasta-salmon-zucchini-yogurt",
    name: "Pasta integrale con salmone, zucchine e yogurt",
    kicker: "Piatto unico di pesce",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p24-whole-pasta-salmon-zucchini-yogurt-v11683"),
    time: 25,
    ingredients: [
      { food: "Pasta integrale secca", grams: 80 },
      { food: "Salmone cotto", grams: 100 },
      { food: "Zucchine", grams: 250 },
      { food: "Yogurt bianco", grams: 50 },
      { food: "Olio extravergine", grams: 5 },
    ],
    steps: ["Cuoci la pasta integrale e le zucchine.", "Cuoci il salmone in padella antiaderente fino al centro.", "A fuoco spento unisci yogurt, limone e pasta; aggiungi il salmone a pezzi e l'olio misurato."],
    alternatives: ["Trota al posto del salmone", "Yogurt greco 0% al posto dello yogurt bianco"],
  },
  {
    id: "matrix-p25-gnocchi-tomato-ricotta-spinach",
    name: "Gnocchi con pomodoro, ricotta e spinaci",
    kicker: "Piatto unico vegetariano",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p25-gnocchi-tomato-ricotta-spinach-v11683"),
    time: 25,
    ingredients: [
      { food: "Gnocchi di patate", grams: 150 },
      { food: "Ricotta vaccina", grams: 100 },
      { food: "Pomodorini", grams: 150 },
      { food: "Spinaci", grams: 150 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci i pomodori con basilico fino a ottenere una salsa semplice.", "Cuoci gli spinaci al vapore e lessa gli gnocchi finché salgono a galla.", "Condisci gli gnocchi con pomodoro e ricotta e servi con gli spinaci e l'olio misurato."],
    alternatives: ["Pasta integrale al posto degli gnocchi", "Fiocchi di latte al posto della ricotta"],
  },
  {
    id: "matrix-p26-farro-bresaola-rucola-tomatoes",
    name: "Farro con bresaola, rucola, pomodorini e finocchi",
    kicker: "Pranzo occasionale trasportabile",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p26-farro-bresaola-rucola-tomatoes-v11683"),
    time: 25,
    ingredients: [
      { food: "Farro cotto", grams: 175 },
      { food: "Bresaola", grams: 50 },
      { food: "Rucola", grams: 50 },
      { food: "Pomodorini", grams: 100 },
      { food: "Finocchi crudi", grams: 100 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il farro, scolalo e raffreddalo rapidamente.", "Lava le verdure e taglia bresaola e finocchi a strisce.", "Unisci tutto con rucola, pomodorini, limone e olio misurato."],
    alternatives: ["Petto di pollo alla piastra al posto della bresaola", "Riso integrale al posto del farro"],
  },
  {
    id: "matrix-p27-millet-chickpeas-cauliflower-curry",
    name: "Miglio con ceci, cavolfiore e curry",
    kicker: "Piatto unico vegetale",
    course: "Piatto unico",
    cuisine: "Asiatico",
    image: photo("recipe-p27-millet-chickpeas-cauliflower-curry-v11683"),
    time: 35,
    ingredients: [
      { food: "Miglio cotto", grams: 190 },
      { food: "Ceci cotti", grams: 150 },
      { food: "Cavolfiore", grams: 125 },
      { food: "Carote crude", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il miglio secondo confezione.", "Arrostisci cavolfiore e carote con curry, curcuma e poca acqua; aggiungi l'olio misurato a fine cottura.", "Unisci ceci risciacquati e miglio e completa con zenzero e limone."],
    alternatives: ["Quinoa cotta al posto del miglio", "Lenticchie cotte al posto dei ceci"],
  },
];


const attachmentMainsP28P34: Recipe[] = [
  {
    id: "matrix-p28-red-rice-tofu-edamame-vegetables",
    name: "Riso rosso con tofu, edamame e verdure",
    kicker: "Piatto unico vegetale",
    course: "Piatto unico",
    cuisine: "Asiatico",
    image: photo("recipe-p28-red-rice-tofu-edamame-vegetables-v11683"),
    time: 35,
    ingredients: [
      { food: "Riso rosso integrale cotto", grams: 180 },
      { food: "Tofu alla piastra", grams: 100 },
      { food: "Edamame cotti", grams: 80 },
      { food: "Broccoli bolliti", grams: 90 },
      { food: "Carote crude", grams: 80 },
      { food: "Funghi", grams: 80 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il riso rosso secondo confezione.", "Griglia il tofu e cuoci broccoli, carote e funghi al vapore o in padella antiaderente.", "Unisci edamame, riso e verdure e completa con olio misurato, zenzero e salsa di soia a ridotto contenuto di sale se desiderata."],
    alternatives: ["Riso Venere al posto del riso rosso", "Tempeh al posto del tofu"],
  },
  {
    id: "matrix-p29-whole-pasta-cannellini-broccoli",
    name: "Pasta integrale con cannellini e broccoli",
    kicker: "Piatto unico vegetale",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p29-whole-pasta-cannellini-broccoli-v11684"),
    time: 25,
    ingredients: [
      { food: "Pasta integrale secca", grams: 70 },
      { food: "Fagioli cannellini cotti", grams: 120 },
      { food: "Broccoli bolliti", grams: 250 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Lessa i broccoli e usa la stessa acqua per cuocere la pasta.", "Scola la pasta al dente e uniscila a broccoli e cannellini risciacquati con poca acqua di cottura.", "Completa con olio a crudo, aglio e peperoncino."],
    alternatives: ["Pasta di farro al posto dell'integrale", "Ceci cotti al posto dei cannellini"],
  },
  {
    id: "matrix-p30-basmati-chicken-vegetable-salad",
    name: "Insalata di riso basmati con pollo e verdure",
    kicker: "Pranzo trasportabile di carne bianca",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p30-basmati-chicken-vegetable-salad-v11684"),
    time: 30,
    ingredients: [
      { food: "Riso basmati secco", grams: 70 },
      { food: "Petto di pollo · peso a crudo", grams: 100 },
      { food: "Zucchine", grams: 85 },
      { food: "Peperoni cotti senza olio", grams: 85 },
      { food: "Carote crude", grams: 80 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il riso, scolalo e raffreddalo rapidamente.", "Griglia pollo e verdure finché il pollo è completamente cotto.", "Taglia tutto a pezzi, unisci e completa con olio misurato e limone; conserva refrigerato."],
    alternatives: ["Petto di tacchino alla piastra al posto del pollo", "Riso integrale al posto del basmati"],
  },
  {
    id: "matrix-p31-barley-chickpeas-artichokes-tomatoes",
    name: "Orzo con ceci, carciofi e pomodori",
    kicker: "Piatto unico vegetale",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p31-barley-chickpeas-artichokes-tomatoes-v11684"),
    time: 35,
    ingredients: [
      { food: "Orzo perlato cotto", grams: 160 },
      { food: "Ceci cotti", grams: 150 },
      { food: "Carciofi cotti bolliti", grams: 125 },
      { food: "Pomodorini", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci l'orzo secondo confezione.", "Cuoci i carciofi con poca acqua e taglia i pomodorini.", "Unisci ceci risciacquati, orzo e verdure e completa con olio misurato, prezzemolo e limone."],
    alternatives: ["Farro cotto al posto dell'orzo", "Lenticchie cotte al posto dei ceci"],
  },
  {
    id: "matrix-p32-quinoa-trout-asparagus-tomatoes",
    name: "Quinoa con trota, asparagi e pomodorini",
    kicker: "Piatto unico di pesce",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p32-quinoa-trout-asparagus-tomatoes-v11684"),
    time: 30,
    ingredients: [
      { food: "Quinoa cotta", grams: 185 },
      { food: "Trota cotta", grams: 150 },
      { food: "Asparagi crudi", grams: 125 },
      { food: "Pomodorini", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci la quinoa secondo confezione.", "Cuoci trota e asparagi al forno o al vapore fino a completa cottura.", "Servi con pomodorini, quinoa e olio misurato; completa con limone e aneto."],
    alternatives: ["Salmone cotto al posto della trota", "Riso basmati al posto della quinoa"],
  },
  {
    id: "matrix-p33-couscous-turkey-pumpkin-radicchio",
    name: "Cous cous integrale con tacchino, zucca e radicchio",
    kicker: "Piatto unico di carne bianca",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    image: photo("recipe-p33-couscous-turkey-pumpkin-radicchio-v11684"),
    time: 30,
    ingredients: [
      { food: "Cous cous integrale cotto", grams: 210 },
      { food: "Petto di tacchino cotto alla piastra", grams: 100 },
      { food: "Zucca", grams: 125 },
      { food: "Radicchio cotto", grams: 125 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Arrostisci zucca e radicchio.", "Cuoci il tacchino alla piastra fino a completa cottura e taglialo a strisce.", "Prepara il cous cous, unisci tutto e completa con olio misurato, timo e limone."],
    alternatives: ["Petto di pollo al posto del tacchino", "Bulgur cotto al posto del cous cous"],
  },
  {
    id: "matrix-p34-venere-octopus-crunchy-vegetables",
    name: "Riso Venere con polpo e verdure croccanti",
    kicker: "Piatto unico di pesce",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    image: photo("recipe-p34-venere-octopus-crunchy-vegetables-v11684"),
    time: 30,
    ingredients: [
      { food: "Riso Venere secco", grams: 70 },
      { food: "Polpo cotto", grams: 150 },
      { food: "Finocchi crudi", grams: 100 },
      { food: "Carote crude", grams: 100 },
      { food: "Rucola", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il riso Venere e raffreddalo rapidamente.", "Taglia il polpo cotto e affetta finocchi e carote; lava e asciuga la rucola.", "Unisci tutto e completa con olio misurato e limone."],
    alternatives: ["Riso rosso al posto del Venere", "Gamberi cotti al posto del polpo"],
  },
];


const attachmentMainsP35P40: Recipe[] = [
  {
    id: "matrix-p35-farro-tofu-eggplant-tomatoes",
    name: "Farro con tofu, melanzane e pomodorini",
    kicker: "Piatto unico vegetale",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    image: photo("recipe-p35-farro-tofu-eggplant-tomatoes-v11684"),
    time: 30,
    ingredients: [
      { food: "Farro cotto", grams: 180 },
      { food: "Tofu alla piastra", grams: 100 },
      { food: "Melanzane", grams: 150 },
      { food: "Pomodorini", grams: 100 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il farro secondo confezione e scolalo.", "Griglia tofu e melanzane fino a doratura; taglia i pomodorini.", "Unisci tutto e completa con olio misurato e basilico."],
    alternatives: ["Orzo perlato cotto al posto del farro", "Tempeh al posto del tofu"],
  },
  {
    id: "matrix-p36-legume-pasta-tuna-peppers",
    name: "Pasta di legumi con tonno e peperoni",
    kicker: "Piatto unico di pesce",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p36-legume-pasta-tuna-peppers-v11684"),
    time: 25,
    ingredients: [
      { food: "Pasta di lenticchie secca", grams: 70 },
      { food: "Tonno al naturale sgocciolato", grams: 50 },
      { food: "Peperoni cotti senza olio", grams: 150 },
      { food: "Pomodorini", grams: 100 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Arrostisci i peperoni senza olio e taglia i pomodorini.", "Cuoci la pasta di legumi al dente.", "Unisci pasta, tonno sgocciolato e verdure; completa con olio misurato."],
    alternatives: ["Pasta di ceci al posto della pasta di lenticchie", "Sgombro al naturale al posto del tonno"],
  },
  {
    id: "matrix-p37-polenta-lentils-black-kale",
    name: "Polenta con lenticchie e cavolo nero",
    kicker: "Piatto unico vegetale caldo",
    course: "Piatto unico",
    cuisine: "Italiano",
    image: photo("recipe-p37-polenta-lentils-black-kale-v11685"),
    time: 40,
    ingredients: [
      { food: "Polenta cotta", grams: 280 },
      { food: "Lenticchie cotte", grams: 150 },
      { food: "Cavolo nero cotto", grams: 120 },
      { food: "Carote crude", grams: 60 },
      { food: "Sedano crudo", grams: 40 },
      { food: "Cipolle crude", grams: 30 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Prepara la polenta seguendo i tempi della confezione.", "Cuoci carota, sedano e cipolla con poca acqua; aggiungi lenticchie e cavolo nero.", "Servi lo stufato sulla polenta e completa con olio misurato."],
    alternatives: ["Riso integrale al posto della polenta", "Fagioli cannellini al posto delle lenticchie"],
  },
  {
    id: "matrix-p38-bulgur-salmon-fennel-orange",
    name: "Bulgur con salmone, finocchi e arancia",
    kicker: "Piatto unico di pesce",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    image: photo("recipe-p38-bulgur-salmon-fennel-orange-v11685"),
    time: 25,
    ingredients: [
      { food: "Bulgur cotto", grams: 190 },
      { food: "Salmone cotto", grams: 120 },
      { food: "Finocchi crudi", grams: 200 },
      { food: "Arancia", grams: 100 },
      { food: "Olio extravergine", grams: 5 },
    ],
    steps: ["Cuoci il bulgur e lascialo intiepidire.", "Cuoci il salmone alla piastra fino a completa cottura.", "Affetta finocchi e arancia, unisci al bulgur e completa con salmone e olio misurato."],
    alternatives: ["Trota cotta al posto del salmone", "Farro cotto al posto del bulgur"],
  },
  {
    id: "matrix-p39-millet-black-beans-pumpkin-cabbage",
    name: "Miglio con fagioli neri, zucca e cavolo rosso",
    kicker: "Piatto unico vegetale",
    course: "Piatto unico",
    cuisine: "Internazionale",
    image: photo("recipe-p39-millet-black-beans-pumpkin-cabbage-v11685"),
    time: 35,
    ingredients: [
      { food: "Miglio cotto", grams: 180 },
      { food: "Fagioli neri cotti", grams: 150 },
      { food: "Zucca", grams: 150 },
      { food: "Cavolo rosso crudo", grams: 100 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il miglio secondo confezione.", "Arrostisci la zucca e lascia il cavolo rosso croccante oppure scottalo brevemente.", "Unisci fagioli risciacquati, miglio e verdure e completa con olio misurato."],
    alternatives: ["Fagioli rossi al posto dei fagioli neri", "Quinoa cotta al posto del miglio"],
  },
  {
    id: "matrix-p40-brown-rice-eggs-peas-vegetables",
    name: "Riso integrale con uova, piselli e verdure",
    kicker: "Piatto unico con uova",
    course: "Piatto unico",
    cuisine: "Asiatico",
    image: photo("recipe-p40-brown-rice-eggs-peas-vegetables-v11685"),
    time: 30,
    ingredients: [
      { food: "Riso integrale secco", grams: 70 },
      { food: "Uova strapazzate o in frittata", grams: 120 },
      { food: "Piselli cotti", grams: 80 },
      { food: "Carote crude", grams: 70 },
      { food: "Zucchine", grams: 80 },
      { food: "Cipolle crude", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    steps: ["Cuoci il riso integrale secondo confezione.", "Cuoci carote, zucchine e cipolla in padella antiaderente; aggiungi i piselli.", "Versa le uova sbattute, cuocile completamente e unisci il riso; completa con olio misurato."],
    alternatives: ["Riso basmati al posto dell'integrale", "Tofu alla piastra al posto delle uova"],
  },
];

const inferTextAllergens = (textValue: string) => {
  const text = textValue.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["Glutine", /pasta|pane|farro|orzo|bulgur|cous cous|cracker|fette biscottate|biscott|wafer|muesli|frumento|segale|grissini/],
    ["Latte", /latte|yogurt|skyr|kefir|ricotta|feta|mozzarella|crescenza|scamorza|provolone|grana|parmigiano|burro/],
    ["Uova", /uov|albume/],
    ["Pesce", /salmone|tonno|merluzzo|orata|branzino|nasello|platessa|sogliola|trota|sgombro|sardine|rombo/],
    ["Crostacei", /gamber|scamp|aragost|granchio/],
    ["Molluschi", /cozze|vongole|seppia|calamar|polpo|ostric/],
    ["Soia", /soia|tofu|tempeh|edamame/],
    ["Arachidi", /arachid/],
    ["Frutta a guscio", /noci|mandorle|nocciole|pistacchi|anacardi|pecan/],
    ["Sesamo", /sesamo/],
    ["Sedano", /sedano/],
    ["Senape", /senape/],
    ["Lupini", /lupin/],
    ["Solfiti", /vino|solfit/],
  ];
  return rules.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
};
const inferRecipeAllergens = (recipe: Recipe) =>
  inferTextAllergens(recipe.ingredients.map((item) => item.food).join(" "));
const inferRecipeMethods = (recipe: Recipe) => {
  const text = recipe.steps.join(" ").toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["Cartoccio", /cartoccio/],
    ["Friggitrice ad aria", /friggitrice ad aria|air fryer/],
    ["In umido", /in umido|stufat/],
    ["Forno", /forno|inforna/],
    ["Vapore", /vapore/],
    ["Padella", /padella|salta|rosola/],
    ["Piastra o griglia", /piastra|griglia/],
    ["Bollitura", /boll|lessa|acqua salata/],
    ["Senza cottura", /senza cottura|assembla|mescola/],
  ];
  const methods = rules.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  return methods.length ? methods : ["Preparazione semplice"];
};
const inferRecipeDifficulty = (recipe: Recipe): NonNullable<Recipe["difficulty"]> => {
  if (recipe.time <= 15 && recipe.steps.length <= 3) return "Facile";
  if (recipe.time <= 35) return "Media";
  return "Impegnativa";
};
const ingredientWeightState = (food: string) => {
  const value = food.toLowerCase();
  if (/sgocciolat|in scatola|al naturale/.test(value)) return "sgocciolato";
  if (/cott|bollit|less|arrostit|al forno|alla griglia|alla piastra|al vapore|saltat|stufat|strapazzat|frittat/.test(value)) {
    return "cotto";
  }
  if (/fresc|crud|mela|pera|banana|arancia|mandarin|kiwi|uva|fragol|mirtill|ciliegi|albicocc|pesca|ananas|mango|papaya|anguria|melone/.test(value)) {
    return "parte edibile";
  }
  if (/olio|aceto|succo|passata|bevanda|latte|yogurt|kefir|skyr|ricotta|formaggio|miele|confettura|crema/.test(value)) {
    return "pronto all’uso";
  }
  return "a crudo";
};
const inferRecipeTags = (recipe: Recipe) => {
  const text = recipe.ingredients.map((item) => item.food).join(" ").toLowerCase();
  return [
    recipe.course || "Piatto",
    recipe.cuisine || "Italiano",
    recipe.time <= 15 ? "Veloce" : "Da cucinare",
    /ceci|lenticchie|fagioli|piselli|tofu|tempeh/.test(text) ? "Proteine vegetali" : "",
    /integrale|farro|orzo|quinoa|miglio|grano saraceno/.test(text) ? "Cereali e fibre" : "",
  ].filter(Boolean);
};
const recipeBalanceSummary = (recipe: Recipe) => {
  const categoryLabels: Record<MealPart["category"], string> = {
    Carboidrato: "cereale/tubero",
    Proteina: "proteina",
    Contorno: "verdura",
    Latticino: "latticino",
    Frutta: "frutta",
    Extra: "grasso/condimento",
  };
  const components = Array.from(
    new Set((recipe.parts || []).filter((part) => part.grams > 0).map((part) => categoryLabels[part.category])),
  );
  return components.length ? components.join(" + ") : "componenti indicati negli ingredienti";
};
const internationalInspirationNote = (recipe: Recipe) => {
  const cuisine = recipe.cuisine || "Italiano";
  return ["Italiano", "Vegetale", "Gourmet", "Creativo"].includes(cuisine)
    ? ""
    : `Ispirata alla cucina ${cuisine.toLowerCase()} · adattamento originale, non versione tradizionale autentica`;
};
const inferRecipeSeasonMonths = (recipe: Recipe) =>
  Array.from(
    new Set(
      recipe.ingredients.flatMap((ingredient) => seasonalMonths[ingredient.food] || []),
    ),
  ).sort((left, right) => left - right);

const everydayLegumeRecipes: Recipe[] = [
  {
    id: "everyday-pasta-e-fagioli",
    name: "Pasta e fagioli",
    kicker: "Pranzo italiano semplice e completo",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-pasta-beans-v1180"),
    time: 30,
    ingredients: [
      { food: "Pasta di semola secca", grams: 70 },
      { food: "Fagioli borlotti cotti", grams: 120 },
      { food: "Passata di pomodoro", grams: 100 },
      { food: "Carote crude", grams: 50 },
      { food: "Sedano crudo", grams: 50 },
      { food: "Olio extravergine", grams: 10 },
    ],
    parts: [
      { category: "Carboidrato", food: "Pasta di semola secca", grams: 70, label: "Pasta corta · 70 g a crudo", image: photo("part-pasta-semolina-v11618") },
      { category: "Proteina", food: "Fagioli borlotti cotti", grams: 120, label: "Borlotti cotti e sgocciolati · 120 g", image: photo("part-borlotti-cooked-v11654") },
      { category: "Contorno", food: "Passata di pomodoro", grams: 100, label: "Passata di pomodoro · 100 g", image: photo("part-passata-v11652") },
      { category: "Contorno", food: "Carote crude", grams: 50, label: "Carota · 50 g", image: photo("part-carrots-raw-v11512") },
      { category: "Contorno", food: "Sedano crudo", grams: 50, label: "Sedano · 50 g", image: photo("part-celery-v1154") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Taglia finemente carota e sedano e falli ammorbidire con passata e poca acqua per 8 minuti.", "Aggiungi i borlotti risciacquati; schiacciane un terzo per rendere il fondo cremoso.", "Cuoci la pasta a parte, scolala al dente e termina la cottura nel fondo di fagioli. Completa con l'olio pesato."],
    alternatives: ["Cannellini al posto dei borlotti", "Pasta integrale nella porzione proposta", "Trasportabile in contenitore termico"],
  },
  {
    id: "everyday-rice-lentils",
    name: "Riso integrale con lenticchie, carote e zucchine",
    kicker: "Piatto vegetale pratico da casa o lavoro",
    course: "Piatto unico",
    cuisine: "Italiano",
    kind: "combination",
    image: photo("recipe-rice-lentils-v1180"),
    time: 35,
    ingredients: [{ food: "Riso integrale secco", grams: 70 }, { food: "Lenticchie cotte", grams: 150 }, { food: "Carote crude", grams: 100 }, { food: "Zucchine", grams: 150 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Carboidrato", food: "Riso integrale secco", grams: 70, label: "Riso integrale · 70 g a crudo", image: photo("part-brown-rice-v11519") },
      { category: "Proteina", food: "Lenticchie cotte", grams: 150, label: "Lenticchie cotte · 150 g", image: photo("part-lentils-v1141") },
      { category: "Contorno", food: "Carote crude", grams: 100, label: "Carote · 100 g", image: photo("part-carrots-raw-v11512") },
      { category: "Contorno", food: "Zucchine", grams: 150, label: "Zucchine · 150 g", image: photo("part-zucchini-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Sciacqua il riso e cuocilo secondo la confezione.", "Taglia carote e zucchine a cubetti e cuocile in padella antiaderente con poca acqua per 10-12 minuti.", "Risciacqua le lenticchie, uniscile a riso e verdure e completa con olio misurato, limone ed erbe."],
    alternatives: ["Riso basmati nella quantità equivalente proposta", "Ceci o cannellini al posto delle lenticchie", "Buono anche freddo al lavoro"],
  },
  {
    id: "everyday-farro-chickpeas",
    name: "Farro con ceci, pomodorini e cetriolo",
    kicker: "Insalata completa da preparare in anticipo",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("recipe-farro-chickpeas-v1180"),
    time: 25,
    ingredients: [{ food: "Farro cotto", grams: 175 }, { food: "Ceci cotti", grams: 120 }, { food: "Pomodorini", grams: 125 }, { food: "Cetrioli", grams: 125 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Carboidrato", food: "Farro cotto", grams: 175, label: "Farro cotto · da circa 70 g secco", image: photo("farro") },
      { category: "Proteina", food: "Ceci cotti", grams: 120, label: "Ceci cotti e sgocciolati · 120 g", image: photo("part-chickpeas-v8") },
      { category: "Contorno", food: "Pomodorini", grams: 125, label: "Pomodorini · 125 g", image: photo("part-tomatoes-v8") },
      { category: "Contorno", food: "Cetrioli", grams: 125, label: "Cetriolo · 125 g", image: photo("part-cucumber-v8") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Cuoci il farro seguendo la confezione, scolalo e raffreddalo.", "Risciacqua i ceci e taglia pomodorini e cetriolo.", "Unisci tutto e condisci con olio pesato, limone, basilico e pepe; conserva refrigerato."],
    alternatives: ["Orzo al posto del farro", "Lenticchie al posto dei ceci", "Trasportabile in contenitore refrigerato"],
  },
  {
    id: "everyday-mixed-legume-salad",
    name: "Insalata di ceci, cannellini e lenticchie",
    kicker: "Piatto vegetale fresco con tre legumi",
    course: "Piatto unico",
    cuisine: "Mediterraneo",
    kind: "combination",
    image: photo("recipe-mixed-legumes-v1180"),
    time: 12,
    ingredients: [{ food: "Ceci cotti", grams: 80 }, { food: "Fagioli cannellini cotti", grams: 80 }, { food: "Lenticchie cotte", grams: 80 }, { food: "Pomodorini", grams: 100 }, { food: "Carote crude", grams: 80 }, { food: "Sedano crudo", grams: 60 }, { food: "Olio extravergine", grams: 10 }],
    parts: [
      { category: "Proteina", food: "Ceci cotti", grams: 80, label: "Ceci cotti · 80 g", image: photo("part-chickpeas-v8") },
      { category: "Proteina", food: "Fagioli cannellini cotti", grams: 80, label: "Cannellini cotti · 80 g", image: photo("part-cannellini-v1141") },
      { category: "Proteina", food: "Lenticchie cotte", grams: 80, label: "Lenticchie cotte · 80 g", image: photo("part-lentils-v1141") },
      { category: "Contorno", food: "Pomodorini", grams: 100, label: "Pomodorini · 100 g", image: photo("part-tomatoes-v8") },
      { category: "Contorno", food: "Carote crude", grams: 80, label: "Carote · 80 g", image: photo("part-carrots-raw-v11512") },
      { category: "Contorno", food: "Sedano crudo", grams: 60, label: "Sedano · 60 g", image: photo("part-celery-v1154") },
      { category: "Extra", food: "Olio extravergine", grams: 10, label: "Olio EVO · 10 g", image: photo("part-olive-oil-v8") },
    ],
    steps: ["Risciacqua molto bene tutti i legumi cotti e scolali.", "Taglia pomodorini, carota e sedano in pezzi piccoli.", "Unisci, condisci con olio misurato, aceto o limone ed erbe; conserva al fresco fino al pasto."],
    alternatives: ["Usa due soli legumi mantenendo il peso totale proposto", "Aggiungi una quota di pane o cereale dalla sezione carboidrati se prevista dal piano", "Trasportabile refrigerata"],
  },
];

const rawRecipes: Recipe[] = [
  ...everydayLegumeRecipes,
  ...simpleBreakfasts,
  ...attachmentBaseBreakfasts,
  ...attachmentBreakfastsC37C44,
  ...attachmentBreakfastsC13C20,
  ...attachmentBreakfastsC22C28,
  ...matrixBreakfasts,
  ...catalogBreakfasts,
  ...quickSnacks,
  ...attachmentSnacksS35S42,
  ...attachmentBaseSnacks,
  ...attachmentSnacksS14S26,
  ...matrixSnacks,
  ...attachmentMissingSnacks,
  ...attachmentBaseMainsA,
  ...attachmentBaseMainsB,
  ...attachmentBaseMainsC,
  ...attachmentMainsP17P22,
  ...attachmentMainsP23P27,
  ...attachmentMainsP28P34,
  ...attachmentMainsP35P40,
  ...attachmentMainsP53P64,
  ...matrixMainRecipes,
  ...catalogSnacks,
  ...portableRecipes,
  ...balancedDinnerRecipes,
  ...attachmentDinnersA,
  ...attachmentDinnersB,
  ...attachmentDinnersC,
  ...attachmentDinnersD,
  ...attachmentDinnersE,
  ...catalogMains,
  ...verifiedWorldRecipeExpansion,
  ...occasionalRecipes,
  ...recipes,
];
const recipeCatalogIds = new Set<string>();
const recipeCatalogIssues = rawRecipes.flatMap((recipe) => {
  const issues: string[] = [];
  if (!recipe.id.trim() || recipeCatalogIds.has(recipe.id)) issues.push("id mancante o duplicato");
  recipeCatalogIds.add(recipe.id);
  if (!recipe.name.trim()) issues.push("nome mancante");
  if (!recipe.image.trim()) issues.push("foto mancante");
  if (!recipe.ingredients.length) issues.push("ingredienti mancanti");
  if (!recipe.steps.length || recipe.steps.every((step) => !step.trim())) issues.push("preparazione mancante");
  const unknownIngredients = recipe.ingredients
    .filter((ingredient) => !foodSearchDatabase[ingredient.food])
    .map((ingredient) => ingredient.food);
  if (unknownIngredients.length) issues.push(`senza dati nutrizionali: ${unknownIngredients.join(", ")}`);
  return issues.map((issue) => `${recipe.id || "senza-id"}: ${issue}`);
});
if (recipeCatalogIssues.length) {
  throw new Error(`Catalogo ricette non valido:\n${recipeCatalogIssues.join("\n")}`);
}
const pantryPartByFood = new Map(
  [
    ...(Object.values(mealPartOptions).flat() as MealPart[]),
    ...Object.values(ingredientPartCatalog),
  ].map(
    (part) => [part.food, part] as const,
  ),
);
const produceGramsForItems = (items: RecipeIngredient[]) =>
  items.reduce((sum, item) => {
    const category = pantryPartByFood.get(item.food)?.category;
    return category === "Frutta" || category === "Contorno" ? sum + item.grams : sum;
  }, 0);
const allRecipes: Recipe[] = rawRecipes.map((recipe) => {
  const enrichedRecipe: Recipe = {
    ...recipe,
    allergens: recipe.allergens || inferRecipeAllergens(recipe),
    tags: recipe.tags || inferRecipeTags(recipe),
    seasonMonths: recipe.seasonMonths || inferRecipeSeasonMonths(recipe),
    methods: recipe.methods || inferRecipeMethods(recipe),
    difficulty: recipe.difficulty || inferRecipeDifficulty(recipe),
    sourceLabel:
      recipe.sourceLabel ||
      "Valori degli ingredienti da banca dati CREA, USDA, FRIDA o etichetta",
    sourceUrl: recipe.sourceUrl || "https://www.alimentinutrizione.it/",
  };
  if (enrichedRecipe.parts?.length) return enrichedRecipe;
  const inferredParts = enrichedRecipe.ingredients
    .map((ingredient) => {
      const known = pantryPartByFood.get(ingredient.food);
      return known
        ? {
            ...known,
            grams: ingredient.grams,
            label: ingredient.label || known.label || ingredient.food,
          }
        : null;
    })
    .filter((part): part is MealPart => Boolean(part));
  return inferredParts.length >= 2
    ? { ...enrichedRecipe, parts: inferredParts }
    : enrichedRecipe;
});
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
  const [targetDefined, setTargetDefined] = useState(false);
  const [goal, setGoal] = useState("Equilibrio");
  const [dayIndex, setDayIndex] = useState(0);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [selectedMealKey, setSelectedMealKey] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [completedRecipes, setCompletedRecipes] = useState<
    Record<string, string>
  >({});
  const [historyConsent, setHistoryConsent] = useState(false);
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
    adding?: boolean;
  } | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [excludedGroups, setExcludedGroups] = useState<string[]>([]);
  const [allergyGroups, setAllergyGroups] = useState<string[]>([]);
  const [intoleranceGroups, setIntoleranceGroups] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [foodToAvoid, setFoodToAvoid] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [swapTarget, setSwapTarget] = useState<{
    day: number;
    slot: number;
  } | null>(null);
  const [swapReturnTab, setSwapReturnTab] = useState<Tab>("today");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(10);
  const [compatibleRecipePage, setCompatibleRecipePage] = useState(0);
  const [cuisineChoice, setCuisineChoice] = useState("Italiano");
  const [dayContext, setDayContext] = useState("Lavoro");
  const [restaurantArea, setRestaurantArea] = useState("");
  const [plannedDrink, setPlannedDrink] = useState("Acqua");
  const [cuisineFilter, setCuisineFilter] = useState("Tutte");
  const [healthyFilters, setHealthyFilters] = useState<HealthyFilterId[]>([]);
  const [peopleCount, setPeopleCount] = useState(1);
  const [ageGroup, setAgeGroup] = useState("Adulto");
  const [foodStyle, setFoodStyle] = useState("Onnivoro");
  const [dailyMeals, setDailyMeals] = useState(5);
  const [maxPrepTime, setMaxPrepTime] = useState(45);
  const [availableEquipment, setAvailableEquipment] = useState("Piano cottura e forno");
  const [budgetLevel, setBudgetLevel] = useState("Medio");
  const [breakfastStyle, setBreakfastStyle] = useState("Indifferente");
  const [mealPrepMode, setMealPrepMode] = useState("No");
  const [drinks, setDrinks] = useState<Record<string, LogItem[]>>({});
  const [extras, setExtras] = useState<Record<string, LogItem[]>>({});
  const [diaryDay, setDiaryDay] = useState(0);
  const [extraName, setExtraName] = useState("");
  const [extraGrams, setExtraGrams] = useState("50");
  const [gelatoScoops, setGelatoScoops] = useState<2 | 3>(2);
  const [gelatoComposerOpen, setGelatoComposerOpen] = useState(false);
  const [gelatoFlavors, setGelatoFlavors] = useState<string[]>([
    "Gelato fiordilatte",
    "Gelato al cioccolato",
    "Gelato al pistacchio",
  ]);
  const [replanNote, setReplanNote] = useState("");
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
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
  const [shoppingAdditions, setShoppingAdditions] = useState<Record<string, number>>(
    {},
  );
  const [check, setCheck] = useState({
    yesterday: "regolare",
    todayActivity: "no",
    tomorrowActivity: "no",
    feeling: "bene",
    sleep: "bene",
  });
  const [builder, setBuilder] = useState<RecipeIngredient[]>([
    { food: "Rucola", grams: 60 },
    { food: "Petto di pollo cotto", grams: 120 },
    { food: "Pomodorini", grams: 120 },
    { food: "Quinoa cotta", grams: 100 },
    { food: "Olio extravergine", grams: 8 },
  ]);
  const [builderTime, setBuilderTime] = useState(20);
  const [builderMethod, setBuilderMethod] = useState("Padella e pentola");
  const [generatedBuilderRecipe, setGeneratedBuilderRecipe] = useState<Recipe | null>(null);
  const [leftoverFood, setLeftoverFood] = useState("Riso basmati cotto");
  const [leftoverGrams, setLeftoverGrams] = useState(150);
  const [leftoverState, setLeftoverState] = useState<"Cotto" | "Crudo">("Cotto");
  const [leftoverDate, setLeftoverDate] = useState("");
  const [leftoverStorage, setLeftoverStorage] = useState("Frigorifero entro 2 ore");
  const [leftoverResult, setLeftoverResult] = useState<Recipe | null>(null);
  const [leftoverWarning, setLeftoverWarning] = useState("");
  const updateBlockedRef = useRef(false);
  const userInteractionUntilRef = useRef(0);
  const refreshSnapshotRef = useRef("");
  refreshSnapshotRef.current = JSON.stringify({
    calories,
    targetDefined,
    goal,
    historyConsent,
    completed: historyConsent ? completed : {},
    completedRecipes: historyConsent ? completedRecipes : {},
    actualWeights: historyConsent ? actualWeights : {},
    removedIngredients,
    partSelections,
    mealView,
    check,
    excludedGroups,
    allergyGroups,
    intoleranceGroups,
    healthConditions,
    dislikedFoods,
    choices,
    drinks: historyConsent ? drinks : {},
    extras: historyConsent ? extras : {},
    gelatoScoops,
    gelatoComposerOpen,
    gelatoFlavors,
    groceryChecked,
    groceryAmounts,
    shoppingAdditions,
    plannedDrink,
    dayContext,
    restaurantArea,
    weekLocked,
    cuisineChoice,
    healthyFilters,
    peopleCount,
    ageGroup,
    foodStyle,
    dailyMeals,
    maxPrepTime,
    availableEquipment,
    budgetLevel,
    breakfastStyle,
    mealPrepMode,
    dayIndex,
    diaryDay,
    tab,
    builder,
  });
  updateBlockedRef.current = Boolean(
    selected ||
      partPicker ||
      swapTarget ||
      preferencesOpen ||
      checkinOpen ||
      shoppingOpen ||
      printPreviewOpen ||
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
        !updateBlockedRef.current &&
        Date.now() >= userInteractionUntilRef.current
      ) {
        localStorage.setItem("vivapiatto-v1", refreshSnapshotRef.current);
        sessionStorage.setItem("vivapiatto-release-target", pendingVersion);
        sessionStorage.setItem("vivapiatto-release-scroll-y", String(window.scrollY));
        const refreshUrl = new URL(window.location.href);
        refreshUrl.searchParams.set("_release", `${pendingVersion}-${Date.now()}`);
        window.location.replace(refreshUrl.toString());
      }
    };
    const checkVersion = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}version.json?time=${Date.now()}`,
          { cache: "no-store" },
        );
        const release = (await response.json()) as { version?: string };
        if (release.version && isNewerRelease(release.version, VERSION)) {
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
    const markInteraction = () => {
      userInteractionUntilRef.current = Date.now() + 5000;
    };
    checkVersion();
    const versionTimer = window.setInterval(checkVersion, 5000);
    const safeTimer = window.setInterval(applyWhenSafe, 500);
    window.addEventListener("focus", checkVersion);
    window.addEventListener("scroll", markInteraction, { passive: true });
    window.addEventListener("pointerdown", markInteraction, { passive: true });
    window.addEventListener("touchstart", markInteraction, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      window.clearInterval(versionTimer);
      window.clearInterval(safeTimer);
      window.removeEventListener("focus", checkVersion);
      window.removeEventListener("scroll", markInteraction);
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("touchstart", markInteraction);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has("_release")) {
      currentUrl.searchParams.delete("_release");
      const cleanUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
      window.history.replaceState(window.history.state, "", cleanUrl);
    }
    if (sessionStorage.getItem("vivapiatto-release-target") === VERSION) {
      const savedScrollY = Number(
        sessionStorage.getItem("vivapiatto-release-scroll-y") || 0,
      );
      sessionStorage.removeItem("vivapiatto-release-target");
      sessionStorage.removeItem("vivapiatto-release-scroll-y");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: savedScrollY, left: 0, behavior: "auto" });
        });
      });
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vivapiatto-v1");
      if (raw) {
        const s = JSON.parse(raw);
        setCalories(s.calories || 1800);
        setTargetDefined(s.targetDefined === true);
        setGoal(s.goal || "Equilibrio");
        const canLoadHistory = s.historyConsent === true;
        setHistoryConsent(canLoadHistory);
        setCompleted(canLoadHistory ? s.completed || {} : {});
        setCompletedRecipes(canLoadHistory ? s.completedRecipes || {} : {});
        setActualWeights(canLoadHistory ? s.actualWeights || {} : {});
        setRemovedIngredients(s.removedIngredients || {});
        setPartSelections(s.partSelections || {});
        setMealView(s.mealView || {});
        setCheck({ ...check, ...(s.check || {}) });
        setExcludedGroups([]);
        setAllergyGroups(Array.isArray(s.allergyGroups) ? s.allergyGroups : s.excludedGroups || []);
        setIntoleranceGroups(Array.isArray(s.intoleranceGroups) ? s.intoleranceGroups : []);
        setHealthConditions(Array.isArray(s.healthConditions) ? s.healthConditions : []);
        setDislikedFoods(s.dislikedFoods || []);
        setChoices(s.choices || {});
        setDrinks(canLoadHistory ? s.drinks || {} : {});
        setExtras(canLoadHistory ? s.extras || {} : {});
        setGroceryChecked(s.groceryChecked || {});
        setGroceryAmounts(s.groceryAmounts || {});
        setShoppingAdditions(s.shoppingAdditions || {});
        setPlannedDrink(s.plannedDrink || "Acqua");
        setDayContext(s.dayContext || "Lavoro");
        setRestaurantArea(s.restaurantArea || "");
        setWeekLocked(Boolean(s.weekLocked));
        setCuisineChoice(s.cuisineChoice || "Italiano");
        setHealthyFilters(Array.isArray(s.healthyFilters) ? s.healthyFilters : []);
        setPeopleCount(Math.max(1, Math.min(12, Number(s.peopleCount) || 1)));
        setAgeGroup(s.ageGroup || "Adulto");
        setFoodStyle(s.foodStyle || "Onnivoro");
        setDailyMeals([3, 4, 5].includes(Number(s.dailyMeals)) ? Number(s.dailyMeals) : 5);
        setMaxPrepTime([5, 15, 30, 45, 60].includes(Number(s.maxPrepTime)) ? Number(s.maxPrepTime) : 45);
        setAvailableEquipment(s.availableEquipment || "Piano cottura e forno");
        setBudgetLevel(s.budgetLevel || "Medio");
        setBreakfastStyle(s.breakfastStyle || "Indifferente");
        setMealPrepMode(s.mealPrepMode || "No");
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
        targetDefined,
        goal,
        historyConsent,
        completed: historyConsent ? completed : {},
        completedRecipes: historyConsent ? completedRecipes : {},
        actualWeights: historyConsent ? actualWeights : {},
        removedIngredients,
        partSelections,
        mealView,
        check,
        excludedGroups,
        allergyGroups,
        intoleranceGroups,
        healthConditions,
        dislikedFoods,
        choices,
        drinks: historyConsent ? drinks : {},
        extras: historyConsent ? extras : {},
        groceryChecked,
        groceryAmounts,
        shoppingAdditions,
        plannedDrink,
        dayContext,
        restaurantArea,
        weekLocked,
        cuisineChoice,
        healthyFilters,
        peopleCount,
        ageGroup,
        foodStyle,
        dailyMeals,
        maxPrepTime,
        availableEquipment,
        budgetLevel,
        breakfastStyle,
        mealPrepMode,
        dayIndex,
        diaryDay,
        tab,
        builder,
      }),
    );
  }, [
    calories,
    targetDefined,
    goal,
    historyConsent,
    completed,
    completedRecipes,
    actualWeights,
    removedIngredients,
    partSelections,
    mealView,
    check,
    excludedGroups,
    allergyGroups,
    intoleranceGroups,
    healthConditions,
    dislikedFoods,
    choices,
    drinks,
    extras,
    groceryChecked,
    groceryAmounts,
    shoppingAdditions,
    plannedDrink,
    dayContext,
    restaurantArea,
    weekLocked,
    cuisineChoice,
    healthyFilters,
    peopleCount,
    ageGroup,
    foodStyle,
    dailyMeals,
    maxPrepTime,
    availableEquipment,
    budgetLevel,
    breakfastStyle,
    mealPrepMode,
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
    Soia: Object.keys(foods).filter((food) => /soia|tofu|tempeh|edamame/i.test(food)),
    Sesamo: Object.keys(foods).filter((food) => /sesamo/i.test(food)),
    Crostacei: Object.keys(foods).filter((food) => /gamber|scamp|aragost|granchio/i.test(food)),
    Molluschi: Object.keys(foods).filter((food) => /cozze|vongole|seppia|calamar|polpo|ostric/i.test(food)),
    Sedano: Object.keys(foods).filter((food) => /sedano/i.test(food)),
    Senape: Object.keys(foods).filter((food) => /senape/i.test(food)),
    Lupini: Object.keys(foods).filter((food) => /lupin/i.test(food)),
    Solfiti: Object.keys(foods).filter((food) => /vino|solfit/i.test(food)),
  };
  const conditionBlockedGroups = healthConditions.includes("Celiachia diagnosticata")
    ? ["Glutine"]
    : [];
  const blockedFoods = [
    ...dislikedFoods,
    ...[...excludedGroups, ...allergyGroups, ...intoleranceGroups, ...conditionBlockedGroups]
      .flatMap((group) => groupFoods[group] || []),
  ];
  const recipeAllergens = (recipe: Recipe) =>
    recipe.allergens?.length
      ? recipe.allergens
      : Object.entries(groupFoods)
          .filter(([, members]) => recipe.ingredients.some((ingredient) => members.includes(ingredient.food)))
          .map(([group]) => group);
  const blockedAllergenGroups = new Set([
    ...allergyGroups,
    ...intoleranceGroups,
    ...conditionBlockedGroups,
  ]);
  const isAllowed = (recipe: Recipe) =>
    recipe.ingredients.every((i) => !blockedFoods.includes(i.food)) &&
    recipeAllergens(recipe).every((allergen) => !blockedAllergenGroups.has(allergen));
  const textMatchesFoodStyle = (textValue: string) => {
    const text = textValue.toLowerCase();
    const meat = /pollo|tacchino|coniglio|manzo|vitello|maiale|cavallo|bresaola|prosciutto|mortadella|salame|salsiccia|porchetta|pancetta/.test(text);
    const fish = /salmone|tonno|merluzzo|orata|branzino|nasello|platessa|sogliola|trota|sgombro|sardine|gamber|polpo|cozze|calamari|rombo|seppia/.test(text);
    const animal = meat || fish || /uov|albume|latte|yogurt|skyr|kefir|ricotta|feta|mozzarella|crescenza|scamorza|provolone|burro/.test(text);
    if (foodStyle === "Vegano") return !animal;
    if (foodStyle === "Vegetariano") return !meat && !fish;
    if (foodStyle === "Pescetariano") return !meat;
    return true;
  };
  const matchesFoodStyle = (recipe: Recipe) =>
    textMatchesFoodStyle(recipe.ingredients.map((item) => item.food).join(" "));
  const isAlternativeAllowed = (alternative: string) =>
    inferTextAllergens(alternative).every(
      (allergen) => !blockedAllergenGroups.has(allergen),
    ) && textMatchesFoodStyle(alternative);
  const matchesEquipment = (recipe: Recipe) => {
    const method = recipe.steps.join(" ").toLowerCase();
    if (availableEquipment === "Nessuna cottura")
      return !/cuoc|forno|padella|boll|vapore|tosta|griglia/.test(method);
    if (availableEquipment === "Solo piano cottura") return !/forno/.test(method);
    if (availableEquipment === "Microonde")
      return /microonde|già cott|senza cottura|assembla|mescola/.test(method);
    return true;
  };
  const isProfileEligible = (recipe: Recipe) =>
    isAllowed(recipe) &&
    matchesFoodStyle(recipe) &&
    matchesEquipment(recipe) &&
    recipe.time <= maxPrepTime;
  const recipeProteinSignature = (recipe: Recipe) => {
    const protein = recipe.ingredients.find((ingredient) =>
      /pollo|tacchino|coniglio|manzo|vitello|maiale|cavallo|bresaola|prosciutto|salmone|tonno|merluzzo|orata|branzino|nasello|platessa|sogliola|trota|sgombro|sardine|gamber|polpo|cozze|calamari|rombo|seppia|uov|ceci|lenticchie|fagioli|piselli|tofu|tempeh|ricotta|feta|mozzarella|crescenza|scamorza|provolone/i.test(ingredient.food),
    );
    return protein?.food || recipeProteinFamily(recipe);
  };
  const breakfastStyleScore = (recipe: Recipe) => {
    if (breakfastStyle === "Indifferente") return 0;
    const text = `${recipe.name} ${recipe.ingredients.map((item) => item.food).join(" ")}`.toLowerCase();
    const savoury = /uov|prosciutto|bresaola|tacchino|pomodor|avocado|salmone|tonno|formaggio/.test(text);
    return Number(breakfastStyle === "Salata" ? !savoury : savoury);
  };
  const availableBreakfasts = () =>
    [
      ...matrixBreakfasts.filter((recipe) => dayContext === "Casa" || recipe.time <= 7),
      ...simpleBreakfasts,
      ...catalogBreakfasts,
    ].filter(isProfileEligible).sort((a, b) => breakfastStyleScore(a) - breakfastStyleScore(b));
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
  const recipeVarietyScore = (recipe: Recipe) => {
    const text = recipe.ingredients.map((item) => item.food).join(" ").toLowerCase();
    const categories = new Set(
      recipe.ingredients.flatMap((ingredient) => {
        const known = pantryPartByFood.get(ingredient.food);
        return known ? [known.category] : [];
      }),
    );
    const macros = calc(recipe.ingredients);
    let score = 0;
    if (categories.has("Carboidrato")) score += 1;
    if (categories.has("Proteina") || categories.has("Latticino")) score += 1;
    if (categories.has("Contorno") || categories.has("Frutta")) score += 1;
    if (/integrale|farro|orzo|avena|quinoa|miglio|legum|ceci|lenticchie|fagioli/.test(text)) score += 1;
    if (macros.fiber >= 5 || recipe.ingredients.length >= 4) score += 1;
    return Math.min(5, score);
  };
  const recipeBudgetScore = (recipe: Recipe) => {
    const text = recipe.ingredients.map((item) => item.food).join(" ").toLowerCase();
    let score = 1;
    if (/salmone|orata|branzino|gamber|tonno fresco|cavallo|bresaola|frutti di mare|pistacch/.test(text)) score += 2;
    else if (/manzo|vitello|merluzzo|scamorza|mozzarella|feta|grana|prosciutto crudo/.test(text)) score += 1;
    if (/uova|lenticchie|ceci|fagioli|piselli|pasta|riso|patate|verdure di stagione/.test(text)) score -= 1;
    return Math.max(0, score);
  };
  const budgetLabel = (recipe: Recipe) =>
    recipeBudgetScore(recipe) === 0
      ? "ingredienti economici"
      : recipeBudgetScore(recipe) === 1
        ? "costo medio"
        : "ingredienti più costosi";
  const isMealPrepFriendly = (recipe: Recipe) => {
    const text = `${recipe.name} ${recipe.ingredients.map((item) => item.food).join(" ")}`.toLowerCase();
    return (
      recipe.time <= 30 &&
      !/uovo alla coque|fritto|gelato|spremuta|frullato|pesce crudo/.test(text)
    );
  };
  const recipeHasSeasonalProduce = (recipe: Recipe) => {
    const month = new Date().getMonth() + 1;
    return recipe.ingredients.some((ingredient) => seasonalMonths[ingredient.food]?.includes(month));
  };
  const recipeSeasonalityScore = (recipe: Recipe) => {
    const month = new Date().getMonth() + 1;
    const seasonalIngredients = recipe.ingredients.filter(
      (ingredient) => seasonalMonths[ingredient.food]?.length,
    );
    if (!seasonalIngredients.length) return 0;
    const inSeason = seasonalIngredients.filter((ingredient) =>
      seasonalMonths[ingredient.food].includes(month),
    ).length;
    return round((inSeason / seasonalIngredients.length) * 100);
  };
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
  const activeMealSlots = dailyMeals === 3
    ? [0, 2, 4]
    : dailyMeals === 4
      ? [0, 1, 2, 4]
      : [0, 1, 2, 3, 4];
  const isActiveMealSlot = (slot: number) => activeMealSlots.includes(slot);
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
  const baseMealCalorieShares = [0.22, 0.09, 0.3, 0.09, 0.3];
  const activeShareTotal = activeMealSlots.reduce(
    (sum, slot) => sum + baseMealCalorieShares[slot],
    0,
  );
  const mealCalorieShares = baseMealCalorieShares.map((share, slot) =>
    isActiveMealSlot(slot) ? share / activeShareTotal : 0,
  );
  const compatibleWithSlot = (r: Recipe) =>
    !swapTarget || fitsSlot(r, swapTarget.slot);
  const isWorkFriendly = (r: Recipe) =>
    portableRecipes.some((x) => x.id === r.id) ||
    (r.time <= 35 &&
      r.alternatives.some((text) => /trasport|schiscetta|lavoro|preparabile la sera|buona anche fredda/i.test(text)) &&
      !r.alternatives.some((text) => /pasto da casa|preferibile a casa/i.test(text)));
  const uniqueRecipes = (recipes: Recipe[]) =>
    recipes.filter(
      (recipe, index, list) =>
        list.findIndex((candidate) => candidate.id === recipe.id) === index,
    );
  const workLunchesFrom = (recipes: Recipe[]) => {
    const sameCuisine = uniqueRecipes([
      ...recipes.filter(
        (recipe) =>
          recipeCuisine(recipe) === cuisineChoice && isWorkFriendly(recipe),
      ),
      ...portableRecipes.filter(
        (recipe) => recipeCuisine(recipe) === cuisineChoice,
      ),
      ...catalogWorkMains.filter(
        (recipe) => recipeCuisine(recipe) === cuisineChoice,
      ),
    ]).filter(isAllowed);
    if (sameCuisine.length) return sameCuisine;
    return uniqueRecipes([
      ...recipes.filter(isWorkFriendly),
      ...portableRecipes,
      ...catalogWorkMains,
    ]).filter(isAllowed);
  };
  const isMensaFriendly = (recipe: Recipe) => {
    const text = `${recipe.name} ${recipe.ingredients.map((item) => item.food).join(" ")}`.toLowerCase();
    return /pasta|riso|farro|orzo|pollo|tacchino|bistecca|merluzzo|uov|frittata|patate|verdure|insalata|minestrone/.test(text);
  };
  const isRestaurantFriendly = (recipe: Recipe) =>
    recipe.ingredients.length >= 3 &&
    ["Piatto unico", "Piatto completo", "Primo", "Secondo"].includes(recipeCourse(recipe));
  const compatibleWithPlace = (_r: Recipe) => true;
  const isSubstantialRecipe = (recipe: Recipe) =>
    recipe.steps.length >= 2 &&
    recipe.ingredients.length >= 2 &&
    (recipe.time >= 5 || recipe.ingredients.length >= 3);
  const recipeMatchesHealthyFilter = (recipe: Recipe, filter: HealthyFilterId) => {
    const foodsText = recipe.ingredients.map((item) => item.food).join(" ").toLowerCase();
    const methodText = [...recipe.steps, ...recipe.alternatives].join(" ").toLowerCase();
    const vegetablePattern = /zucchin|pomodor|spinac|broccol|cavol|carot|zucca|melanzan|finocch|asparag|bietol|radicch|rucola|insalat|fung|peperon|carciof|sedano|cetriol|barbabietol|fagiolin/;
    const vegetableGrams = recipe.ingredients
      .filter((item) => vegetablePattern.test(item.food.toLowerCase()))
      .reduce((sum, item) => sum + item.grams, 0);
    const fish = /salmone|tonno|merluzzo|orata|branzino|nasello|platessa|sogliola|trota|sgombro|sardine|gamber|polpo|cozze|calamari|rombo|seppia/.test(foodsText);
    const meat = /pollo|tacchino|coniglio|manzo|vitello|maiale|cavallo|bresaola|prosciutto|mortadella|salame|salsiccia|porchetta|pancetta/.test(foodsText);
    const eggs = /\buov|albume/.test(foodsText);
    const dairy = /latte|yogurt|skyr|kefir|ricotta|feta|mozzarella|crescenza|scamorza|provolone|fiocchi di latte|burro/.test(foodsText);
    const gluten = /pasta|pane|farro|orzo|bulgur|cous cous|cracker|fette biscottate|biscott|wafer|muesli|farina di frumento|segale/.test(foodsText);
    const legumes = /ceci|lenticchie|fagioli|piselli|edamame|soia|tofu|tempeh|fave/.test(foodsText);
    const wholeGrains = /integrale|farro|orzo|riso venere|riso rosso|quinoa|miglio|bulgur|grano saraceno/.test(foodsText);
    const month = new Date().getMonth() + 1;
    const seasonal = recipe.ingredients.some((item) => seasonalMonths[item.food]?.includes(month));
    if (filter === "verdure") return vegetableGrams >= 180;
    if (filter === "vegetale") return !meat && !fish && vegetableGrams >= 100;
    if (filter === "integrali") return wholeGrains;
    if (filter === "legumi") return legumes;
    if (filter === "pesce") return fish;
    if (filter === "pesce-grasso") return /salmone|sgombro|sardine|trota/.test(foodsText);
    if (filter === "carne-bianca") return /pollo|tacchino|coniglio/.test(foodsText);
    if (filter === "proteico") return calc(recipe.ingredients).protein >= 25;
    if (filter === "fibre") return calc(recipe.ingredients).fiber >= 7;
    if (filter === "vegetariana") return !meat && !fish;
    if (filter === "vegana") return !meat && !fish && !eggs && !dairy;
    if (filter === "lattosio") return !dairy || /senza lattosio|soia|avena/.test(methodText + " " + foodsText);
    if (filter === "glutine") return !gluten || /senza glutine/.test(methodText);
    if (filter === "pochi-ingredienti") return recipe.ingredients.length <= 5;
    if (filter === "15-minuti") return recipe.time <= 15;
    if (filter === "30-minuti") return recipe.time <= 30;
    if (filter === "anticipo") return /anticipo|sera prima|frigorifero|riposo|preparabile/.test(methodText);
    if (filter === "meal-prep") return isMealPrepFriendly(recipe);
    if (filter === "senza-cottura") return !/cuoc|boll|forno|padella|grigli|vapore|tosta|friggi|arrost/.test(methodText);
    if (filter === "trasportabile") return isWorkFriendly(recipe);
    if (filter === "stagione") return seasonal;
    if (filter === "vapore") return /vapore/.test(methodText);
    if (filter === "forno") return /forno|arrost/.test(methodText);
    if (filter === "senza-frittura") return !/friggi|frittura|fritto/.test(methodText);
    return !/sale|dado|salamoia/.test(methodText);
  };
  const filteredRecipes = allRecipes
    .filter(
      (r) =>
        (swapTarget || r.kind !== "combination") &&
        (swapTarget || isSubstantialRecipe(r)) &&
        r.ingredients.every((item) => Boolean(foodSearchDatabase[item.food])) &&
        isAllowed(r) &&
        matchesFoodStyle(r) &&
        matchesEquipment(r) &&
        r.time <= maxPrepTime &&
        (swapTarget || compatibleWithSlot(r)) &&
        compatibleWithPlace(r) &&
        healthyFilters.every((filter) => recipeMatchesHealthyFilter(r, filter)) &&
        (cuisineFilter === "Tutte" ||
          (cuisineFilter === "Sgarri"
            ? r.id.startsWith("occasional-")
            : !r.id.startsWith("occasional-") && recipeCuisine(r) === cuisineFilter)) &&
        r.name.toLowerCase().includes(libraryQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (swapTarget) {
        const slotCompatibilityDelta =
          Number(fitsSlot(b, swapTarget.slot)) -
          Number(fitsSlot(a, swapTarget.slot));
        if (slotCompatibilityDelta) return slotCompatibilityDelta;
      }
      const cuisineDelta =
        Number(recipeCuisine(b) === cuisineChoice) -
        Number(recipeCuisine(a) === cuisineChoice);
      if (cuisineDelta) return cuisineDelta;
      if (dayContext === "Lavoro" && swapTarget?.slot === 2) {
        const workDelta =
          Number(isWorkFriendly(b)) - Number(isWorkFriendly(a));
        if (workDelta) return workDelta;
      }
      if (dayContext === "Mensa" && swapTarget && [2, 4].includes(swapTarget.slot)) {
        const mensaDelta = Number(isMensaFriendly(b)) - Number(isMensaFriendly(a));
        if (mensaDelta) return mensaDelta;
      }
      if (dayContext === "Ristorante" && swapTarget && [2, 4].includes(swapTarget.slot)) {
        const restaurantDelta = Number(isRestaurantFriendly(b)) - Number(isRestaurantFriendly(a));
        if (restaurantDelta) return restaurantDelta;
      }
      if (budgetLevel === "Economico") {
        const budgetDelta = recipeBudgetScore(a) - recipeBudgetScore(b);
        if (budgetDelta) return budgetDelta;
      }
      if (swapTarget) {
        const target =
          targetForDay(swapTarget.day) * mealCalorieShares[swapTarget.slot];
        return (
          Math.abs(calc(a.ingredients).kcal - target) -
          Math.abs(calc(b.ingredients).kcal - target)
        );
      }
      return 0;
    });
  const compatibleRecipeOffset = filteredRecipes.length
    ? (compatibleRecipePage * 10) % filteredRecipes.length
    : 0;
  const rotatedCompatibleRecipes = [
    ...filteredRecipes.slice(compatibleRecipeOffset),
    ...filteredRecipes.slice(0, compatibleRecipeOffset),
  ];
  const visibleRecipes = rotatedCompatibleRecipes.slice(0, visibleRecipeCount);
  useEffect(() => {
    setVisibleRecipeCount(10);
    setCompatibleRecipePage(0);
  }, [
    libraryQuery,
    cuisineFilter,
    healthyFilters,
    peopleCount,
    ageGroup,
    foodStyle,
    dailyMeals,
    maxPrepTime,
    availableEquipment,
    budgetLevel,
    swapTarget?.day,
    swapTarget?.slot,
    dayContext,
    cuisineChoice,
  ]);
  const swapFoodOptions: MealPart[] = swapTarget
    ? Array.from(
        new Map(
          [
            ...(Object.values(mealPartOptions).flat() as MealPart[]),
            ...Object.values(ingredientPartCatalog),
          ].map((part) => [
            part.food,
            part,
          ]),
        ).values(),
      )
        .filter((part) =>
          (part.label || part.food)
            .toLowerCase()
            .includes(libraryQuery.toLowerCase()),
        )
        .sort((left, right) => {
          const slot = swapTarget.slot;
          const preferred =
            slot === 0
              ? ["Latticino", "Frutta", "Carboidrato", "Extra", "Proteina", "Contorno"]
              : slot === 1 || slot === 3
                ? ["Frutta", "Latticino", "Extra", "Carboidrato", "Proteina", "Contorno"]
                : ["Proteina", "Carboidrato", "Contorno", "Latticino", "Extra", "Frutta"];
          return preferred.indexOf(left.category) - preferred.indexOf(right.category);
        })
    : [];
  const chooseSingleFoodFromLibrary = (part: MealPart) => {
    if (!swapTarget) return;
    const key = `${swapTarget.day}-${swapTarget.slot}`;
    const changedDay = swapTarget.day;
    setPartSelections((current) => ({ ...current, [key]: [{ ...part }] }));
    setMealView((current) => ({ ...current, [key]: "parts" }));
    setActualWeights((current) => { const next = { ...current }; delete next[key]; return next; });
    setRemovedIngredients((current) => { const next = { ...current }; delete next[key]; return next; });
    setReplanNote(`Pasto sostituito liberamente con ${part.label || part.food}. Puoi aggiungere altri elementi con il pulsante più.`);
    replanFollowingDays(changedDay);
    setSwapTarget(null);
    setLibraryQuery("");
    setTab(swapReturnTab);
    scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    if (!swapTarget) return;
    setCuisineFilter("Tutte");
    setLibraryQuery("");
  }, [swapTarget]);
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
      ["Lavoro", "Mensa"].includes(dayContext)
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
  const targetAdditionsFor = (slot: number, dailyTarget = calories): RecipeIngredient[] =>
      dailyTarget >= 3000
        ? slot === 0
          ? [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Noci", grams: 35 }]
          : slot === 1
            ? [{ food: "Banana", grams: 150 }, { food: "Cracker integrali", grams: 25 }]
            : slot === 2
              ? [{ food: "Pane integrale", grams: 100 }, { food: "Olio extravergine", grams: 10 }]
              : slot === 3
                ? [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Mela", grams: 150 }]
                : [{ food: "Pane integrale", grams: 100 }, { food: "Olio extravergine", grams: 10 }]
        : dailyTarget >= 2800
          ? slot === 0
            ? [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Noci", grams: 20 }, { food: "Mela", grams: 150 }]
            : slot === 1
              ? [{ food: "Banana", grams: 150 }]
              : slot === 2
                ? [{ food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 5 }]
                : slot === 3
                  ? [{ food: "Yogurt greco 2%", grams: 125 }, { food: "Cracker integrali", grams: 25 }]
                  : [{ food: "Pane integrale", grams: 50 }, { food: "Olio extravergine", grams: 5 }]
          : dailyTarget >= 2400
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
        : dailyTarget >= 2200
          ? slot === 0
            ? [{ food: "Yogurt greco 2%", grams: 125 }]
            : slot === 1
              ? [{ food: "Mela", grams: 150 }]
              : slot === 2
                ? [{ food: "Pane integrale", grams: 50 }]
                : slot === 3
                  ? [{ food: "Yogurt greco 2%", grams: 125 }]
                  : [{ food: "Pane integrale", grams: 50 }]
          : dailyTarget >= 2000
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
    const known = pantryPartByFood.get(item.food);
    const category = known?.category || "Extra";
    return {
      category,
      food: item.food,
      grams: item.grams,
      label: item.label || known?.label || item.food,
      image: known?.image || (GELATO_FLAVORS.includes(item.food as (typeof GELATO_FLAVORS)[number]) ? gelatoFlavorPhoto(item.food) : photo("part-bread-v7")),
    };
  };

  const activeMealParts = (key: string, recipe: Recipe): MealPart[] => {
    if (partSelections[key]) return partSelections[key].map(normalizeMealPart);
    const [dayText, slotText] = key.split("-");
    const day = Number(dayText);
    const slot = Number(slotText);
    const sourceParts = recipe.parts || recipe.ingredients.map(additionAsPart);
    const merged = sourceParts.map((part) => ({ ...part }));
    targetAdditionsFor(slot, targetForDay(day)).forEach((item) => {
      const existing = merged.find((part) => part.food === item.food);
      if (existing) existing.grams += item.grams;
      else merged.push(additionAsPart(item));
    });
    return merged.map(lowEnergyAdjusted).map(normalizeMealPart);
  };

  const calibratePlannedIngredients = (
    key: string,
    items: RecipeIngredient[],
  ): RecipeIngredient[] => {
    if (partSelections[key]) return items;
    const [dayText, slotText] = key.split("-");
    const day = Number(dayText);
    const slot = Number(slotText);
    const target = targetForDay(day) * mealCalorieShares[slot];
    const current = calc(items).kcal;
    if (!current || Math.abs(current - target) <= target * 0.06) return items;
    const adjustableFoods = new Set(
      [
        ...mealPartOptions.Carboidrato,
        ...mealPartOptions.Proteina,
        ...mealPartOptions.Latticino,
        ...mealPartOptions.Extra,
      ].map((part) => part.food),
    );
    const adjustable = items.filter((item) => adjustableFoods.has(item.food));
    const fixed = items.filter((item) => !adjustableFoods.has(item.food));
    const mealFoodText = items.map((item) => item.food).join(" ").toLowerCase();
    const hasLegumes = /ceci|lenticchie|fagioli|piselli|fave|edamame|lupini|cicerchie/.test(mealFoodText);
    const hasFattyFish = /salmone|sgombro|sardine|trota/.test(mealFoodText);
    const adjustableKcal = calc(adjustable).kcal;
    const fixedKcal = calc(fixed).kcal;
    if (!adjustableKcal || target <= fixedKcal) return items;
    const factor = Math.max(
      0.55,
      Math.min(1.5, (target - fixedKcal) / adjustableKcal),
    );
    const practicalGrams = (item: RecipeIngredient) => {
      const raw = item.grams * factor;
      const food = item.food.toLowerCase();
      const roundWithin = (min: number, max: number, step: number) =>
        Math.max(min, Math.min(max, Math.round(raw / step) * step));
      const cookedGrain =
        /riso|pasta|farro|quinoa|orzo|bulgur|cous cous|grano saraceno/.test(food) &&
        /cott/.test(food);
      if (cookedGrain) return roundWithin(120, hasLegumes ? 180 : 250, 10);
      if (/pasta|riso/.test(food)) return roundWithin(50, hasLegumes ? 80 : 100, 10);
      if (food.includes("gnocchi")) return roundWithin(120, 220, 10);
      if (food.includes("patate")) return roundWithin(150, 300, 25);
      if (/fette biscottate|biscott|cracker|grissini/.test(food))
        return roundWithin(20, 60, 5);
      if (food.includes("pane")) return roundWithin(30, 120, 10);
      if (/confettura|miele|crema 100%|nutella/.test(food))
        return roundWithin(10, 30, 5);
      if (/olio/.test(food)) return roundWithin(5, hasFattyFish ? 5 : 15, 5);
      if (/burro/.test(food)) return roundWithin(5, 15, 5);
      if (/noci|mandorle|pistacchi|arachidi|nocciole|anacardi|semi/.test(food))
        return roundWithin(10, 30, 5);
      if (/latte|bevanda di soia|bevanda d.avena/.test(food))
        return roundWithin(150, 300, 50);
      if (/yogurt|skyr|kefir|budino proteico/.test(food)) {
        const packs = [125, 150, 170, 200, 250];
        return packs.reduce((best, value) =>
          Math.abs(value - raw) < Math.abs(best - raw) ? value : best,
        );
      }
      if (/uovo|uova|albume/.test(food)) return roundWithin(50, 150, 50);
      if (/ceci|lenticchie|fagioli|piselli|fave|edamame|lupini|tofu|tempeh|burger vegetale/.test(food))
        return roundWithin(100, 200, 25);
      if (/bresaola|prosciutto|fesa|speck|salame|mortadella/.test(food))
        return roundWithin(40, 100, 10);
      if (/pollo|tacchino|coniglio|manzo|vitello|maiale|lonza|cavallo|bistecca|salmone|tonno|merluzzo|orata|branzino|sogliola|rombo|trota|seppia|gamber/.test(food))
        return roundWithin(80, 180, 10);
      if (/ricotta|mozzarella|feta|crescenza|primo sale|scamorza|provolone|grana|parmigiano/.test(food))
        return roundWithin(50, 150, 25);
      return roundWithin(10, 200, 5);
    };
    return items.map((item) =>
      adjustableFoods.has(item.food)
        ? { ...item, grams: practicalGrams(item) }
        : item,
    );
  };
  const plannedIngredients = (key: string, recipe: Recipe) => {
    const [dayText, slotText] = key.split("-");
    const day = Number(dayText);
    const slot = Number(slotText);
    const targetAdditions = targetAdditionsFor(slot, targetForDay(day));
    if (!recipe.parts && !partSelections[key])
      return calibratePlannedIngredients(
        key,
        mergeTargetAdditions(recipe.ingredients, targetAdditions).map(
          lowEnergyAdjusted,
        ),
      );
    const activeParts = activeMealParts(key, recipe);
    const pastaSelected = activeParts.some((x) => x.food.includes("Pasta"));
    const sourceParts = recipe.parts || recipe.ingredients.map(additionAsPart);
    const extras = recipe.ingredients.filter(
      (x) =>
        !sourceParts.some((p) => p.food === x.food) &&
        (x.food === "Olio extravergine" ||
          (pastaSelected && x.food === "Passata di pomodoro")),
    );
    return calibratePlannedIngredients(key, [...activeParts, ...extras]);
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
          if (!isActiveMealSlot(slot)) return s;
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
            produce: s.produce + produceGramsForItems(ingredients),
          };
        },
        {
          kcal: plannedDrinkMacros.kcal,
          protein: plannedDrinkMacros.protein,
          carbs: plannedDrinkMacros.carbs,
          fat: plannedDrinkMacros.fat,
          fiber: 0,
          produce: 0,
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
        if (!isActiveMealSlot(slot)) return sum;
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
    (_, slot) => isActiveMealSlot(slot) && completed[`${dayIndex}-${slot}`],
  ).length;
  const builderTotals = useMemo(() => calc(builder), [builder]);
  const builderRoles = useMemo(
    () =>
      new Set(
        builder.map((item) =>
          (Object.keys(mealPartOptions) as MealPart["category"][]).find((role) =>
            mealPartOptions[role].some((option) => option.food === item.food),
          ),
        ),
      ),
    [builder],
  );
  const builderBalanceNotes = [
    !builderRoles.has("Carboidrato") ? "Manca una fonte di carboidrati" : "",
    !builderRoles.has("Proteina") && !builderRoles.has("Latticino")
      ? "Manca una fonte proteica"
      : "",
    !builderRoles.has("Contorno") ? "Mancano verdure" : "",
  ].filter(Boolean);
  const generateBuilderRecipe = () => {
    const usable = builder.filter(
      (item) => item.grams > 0 && Boolean(foodSearchDatabase[item.food]),
    );
    if (!usable.length) {
      setReplanNote("Aggiungi almeno un ingrediente con una quantità maggiore di zero.");
      return;
    }
    const parts = usable
      .map((ingredient) => {
        const known = pantryPartByFood.get(ingredient.food);
        return known ? { ...known, grams: ingredient.grams } : null;
      })
      .filter((part): part is MealPart => Boolean(part));
    const names = usable.map((item) => item.label || item.food);
    const hasRaw = usable.some((item) => /crudo|insalata|rucola|pomodor|cetriol/i.test(item.food));
    const steps = [
      `Pesa prima tutti gli ingredienti: ${usable.map((item) => `${item.grams} g di ${item.label || item.food}`).join(", ")}.`,
      hasRaw
        ? "Lava e asciuga accuratamente gli ingredienti da consumare crudi; tagliali solo dopo il lavaggio."
        : "Prepara gli ingredienti sul piano di lavoro e separa quelli già cotti da quelli ancora da cuocere.",
      builderMethod === "Senza cottura"
        ? "Unisci gli ingredienti in una ciotola, mescola e condisci soltanto alla fine."
        : builderMethod === "Forno"
          ? `Cuoci gli ingredienti che lo richiedono in forno, controllando la cottura entro ${builderTime} minuti; unisci poi gli elementi freddi.`
          : builderMethod === "Vapore"
            ? `Cuoci al vapore gli ingredienti che lo richiedono finché sono teneri; completa e condisci entro ${builderTime} minuti.`
            : `Cuoci separatamente gli ingredienti che lo richiedono, poi componi il piatto e completa entro ${builderTime} minuti.`,
      "Assaggia prima di aggiungere sale e servi subito; per il trasporto lascia raffreddare e conserva in frigorifero.",
    ];
    setGeneratedBuilderRecipe({
      id: `builder-${Date.now()}`,
      name: names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} e altri ingredienti`,
      kicker: "CREATA CON I TUOI INGREDIENTI",
      image: parts[0]?.image || photo("moment-lunch-v1121"),
      time: builderTime,
      ingredients: usable,
      steps,
      alternatives: [
        builderBalanceNotes.length
          ? builderBalanceNotes.join(" · ")
          : "Composizione completa: carboidrati, proteine e verdure presenti.",
        "Le quantità restano modificabili: il calcolo nutrizionale si aggiorna sui grammi reali.",
        "Conserva gli ingredienti deperibili in frigorifero e non usare alimenti con conservazione dubbia.",
      ],
      cuisine: cuisineChoice,
      course: "Piatto completo",
      parts,
      kind: "recipe",
      sourceLabel: "Valori ingredienti da banca dati CREA, USDA, FRIDA ed etichette",
      sourceUrl: "https://www.alimentinutrizione.it/",
    });
  };
  const generateLeftoverRecipe = () => {
    setLeftoverResult(null);
    const prepared = leftoverDate ? new Date(`${leftoverDate}T12:00:00`) : null;
    const ageDays = prepared
      ? Math.floor((Date.now() - prepared.getTime()) / 86400000)
      : Number.NaN;
    if (!prepared || Number.isNaN(ageDays)) {
      setLeftoverWarning("Data di preparazione sconosciuta: non utilizzare l'alimento.");
      return;
    }
    if (ageDays < 0) {
      setLeftoverWarning("La data indicata è futura: correggila prima di continuare.");
      return;
    }
    if (leftoverStorage !== "Frigorifero entro 2 ore") {
      setLeftoverWarning("Conservazione non sicura o non verificabile: non utilizzare l'alimento.");
      return;
    }
    if (ageDays > 3) {
      setLeftoverWarning("Sono trascorsi più di 3 giorni: per prudenza non utilizzare l'alimento.");
      return;
    }
    const leftoverIngredient = { food: leftoverFood, grams: leftoverGrams };
    const supporting = builder
      .filter((item) => item.food !== leftoverFood && item.grams > 0)
      .slice(0, 4);
    const ingredients = [leftoverIngredient, ...supporting];
    const parts = ingredients
      .map((ingredient) => {
        const known = pantryPartByFood.get(ingredient.food);
        return known ? { ...known, grams: ingredient.grams } : null;
      })
      .filter((part): part is MealPart => Boolean(part));
    const mustReheat = leftoverState === "Cotto";
    setLeftoverWarning(
      "Compatibile con il limite prudenziale impostato. Consuma solo se odore, aspetto e conservazione sono normali.",
    );
    setLeftoverResult({
      id: `leftover-${Date.now()}`,
      name: `${leftoverFood} recuperato con ${supporting.slice(0, 2).map((item) => item.food).join(" e ") || "ingredienti disponibili"}`,
      kicker: "RICETTA ANTI-SPRECO",
      image: parts[0]?.image || photo("moment-lunch-v1121"),
      time: Math.max(10, builderTime),
      ingredients,
      steps: [
        `Verifica che i ${leftoverGrams} g di ${leftoverFood} siano stati conservati in frigorifero entro 2 ore dalla preparazione.`,
        mustReheat
          ? "Riscalda completamente l'avanzo fino a renderlo ben caldo anche al centro; non limitarti a intiepidirlo."
          : "Lava e prepara l'ingrediente crudo su utensili puliti, separandolo dagli alimenti già pronti.",
        `Prepara separatamente ${supporting.map((item) => item.food).join(", ") || "gli altri ingredienti"}, poi unisci tutto soltanto alla fine.`,
        "Consuma subito la porzione preparata e non rimettere nuovamente in frigorifero ciò che è già stato riscaldato.",
      ],
      alternatives: [
        "Se non ricordi data o modalità di conservazione, non usare l'avanzo.",
        "La verifica dell'app è prudenziale e non certifica la sicurezza del singolo alimento.",
      ],
      cuisine: cuisineChoice,
      course: "Piatto completo",
      parts,
      kind: "recipe",
      sourceLabel: "USDA Food Safety and Inspection Service · Leftovers",
      sourceUrl: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety",
    });
  };
  const doneCount = Object.values(completed).filter(Boolean).length;
  const guidance =
    check.yesterday === "molto"
      ? "Ieri hai mangiato più del previsto: oggi torna alla regolarità, senza saltare pasti. Scegli acqua, verdure e porzioni già pesate."
      : check.feeling === "gonfio"
        ? "Oggi ti senti gonfio: preferisci pasti regolari e non enormi, mangia lentamente e registra i cibi che sembrano associati al sintomo."
        : check.feeling === "stanco" || check.sleep === "scarso"
          ? "Stanchezza o poco sonno: mantieni pasti regolari, acqua, carboidrati e proteine distribuiti. Non compensare saltando pasti."
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
    const day = Number(dayText);
    const slot = Number(slotText);
    const current = recipeMap[getDayIds(day)[slot]];
    const currentMacros = calc(plannedIngredients(key, current));
    const currentRoles = new Set(activeMealParts(key, current).map((part) => part.category));
    const compatibilityScore = (recipe: Recipe) => {
      const candidateItems = mergeTargetAdditions(
        recipe.parts || recipe.ingredients,
        targetAdditionsFor(slot, targetForDay(day)),
      ).map(lowEnergyAdjusted);
      const candidateMacros = calc(candidateItems);
      const candidateRoles = new Set(
        (recipe.parts || []).map((part) => part.category),
      );
      const macroDistance =
        Math.abs(candidateMacros.kcal - currentMacros.kcal) /
          Math.max(120, currentMacros.kcal) +
        0.7 *
          Math.abs(candidateMacros.protein - currentMacros.protein) /
          Math.max(12, currentMacros.protein) +
        0.45 *
          Math.abs(candidateMacros.carbs - currentMacros.carbs) /
          Math.max(20, currentMacros.carbs) +
        0.55 *
          Math.abs(candidateMacros.fat - currentMacros.fat) /
          Math.max(8, currentMacros.fat);
      const missingRoles = [...currentRoles].filter(
        (role) => !candidateRoles.has(role),
      ).length;
      const extraRoles = [...candidateRoles].filter(
        (role) => !currentRoles.has(role),
      ).length;
      const structureDistance = missingRoles * 0.22 + extraRoles * 0.08;
      const courseDistance =
        recipe.course && current.course && recipe.course === current.course
          ? 0
          : 0.08;
      const cuisineDistance =
        recipeCuisine(recipe) === recipeCuisine(current)
          ? 0
          : recipeCuisine(recipe) === cuisineChoice
            ? 0.08
            : 0.22;
      const contextDistance =
        dayContext === "Lavoro" && !isWorkFriendly(recipe) ? 0.2 : 0;
      return (
        macroDistance +
        structureDistance +
        courseDistance +
        cuisineDistance +
        contextDistance
      );
    };
    return allRecipes
      .filter(
        (recipe) =>
          recipe.id !== current.id &&
          recipe.kind !== "combination" &&
          Boolean(recipe.parts?.length) &&
          fitsSlot(recipe, slot) &&
          isAllowed(recipe),
      )
      .sort((a, b) => compatibilityScore(a) - compatibilityScore(b))
      .slice(0, 6);
  };
  const chooseConfiguredGelato = () => {
    if (!partPicker) return;
    const [dayText] = partPicker.key.split("-");
    const changedDay = Number(dayText);
    const key = partPicker.key;
    const chosen = gelatoFlavors.slice(0, gelatoScoops);
    const scoops: MealPart[] = chosen.map((food, index) => ({
      category: "Extra",
      food,
      grams: 60,
      label: `Pallina ${index + 1} · ${food.replace("Gelato ", "")}`,
      image: gelatoFlavorPhoto(food),
    }));
    setChoices((current) => ({ ...current, [key]: "occasional-gelato" }));
    setMealView((current) => ({ ...current, [key]: "components" }));
    setPartSelections((current) => ({ ...current, [key]: scoops }));
    setActualWeights((current) => { const next = { ...current }; delete next[key]; return next; });
    setRemovedIngredients((current) => { const next = { ...current }; delete next[key]; return next; });
    setReplanNote(`Gelato inserito: ${gelatoScoops} palline. Il totale usa 60 g per gusto e resta modificabile.`);
    replanFollowingDays(changedDay);
    setGelatoComposerOpen(false);
    setPartPicker(null);
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
  const recipePartCategories = (recipe: Recipe) =>
    new Set(
      (recipe.parts || recipe.ingredients.map(additionAsPart))
        .filter((part) => part.grams > 0)
        .map((part) => part.category),
    );
  const mainMealBalanceScore = (recipe: Recipe) => {
    const categories = recipePartCategories(recipe);
    return (
      Number(categories.has("Carboidrato")) +
      Number(categories.has("Proteina") || categories.has("Latticino")) +
      Number(categories.has("Contorno"))
    );
  };
  const closestForSlot = (
    pool: Recipe[],
    slot: number,
    target: number,
    offset: number,
  ) => {
    const rankingScore = (recipe: Recipe) => {
      const mainMeal = [2, 4].includes(slot);
      const balancePenalty = mainMeal ? (3 - mainMealBalanceScore(recipe)) * 450 : 0;
      const contextPenalty =
        dayContext === "Mensa" && mainMeal
          ? Number(!isMensaFriendly(recipe)) * 180
          : dayContext === "Ristorante" && mainMeal
            ? Number(!isRestaurantFriendly(recipe)) * 180
            : 0;
      const prepPenalty =
        mealPrepMode === "Sì" && slot === 2
          ? Number(!isMealPrepFriendly(recipe)) * 120
          : 0;
      const budgetPenalty =
        budgetLevel === "Economico" ? recipeBudgetScore(recipe) * 30 : 0;
      const seasonalBonus = recipeSeasonalityScore(recipe) * 0.35;
      return (
        balancePenalty +
        contextPenalty +
        prepPenalty +
        budgetPenalty +
        Math.abs(profileRecipeKcal(recipe, slot) - target) -
        seasonalBonus
      );
    };
    const ranked = [...pool].sort((a, b) => rankingScore(a) - rankingScore(b));
    return ranked[offset % Math.min(5, ranked.length)];
  };
  const sharesFruit = (left: Recipe, right: Recipe) => {
    const fruitFoods = new Set(mealPartOptions.Frutta.map((part) => part.food));
    const leftFruit = new Set(
      left.ingredients
        .filter((ingredient) => fruitFoods.has(ingredient.food))
        .map((ingredient) => ingredient.food),
    );
    return right.ingredients.some((ingredient) => leftFruit.has(ingredient.food));
  };
  const isSmoothieRecipe = (recipe: Recipe) =>
    /frullato|smoothie/i.test(`${recipe.name} ${recipe.kicker}`);
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
      (r) => isProfileEligible(r) && recipeCuisine(r) === cuisineChoice,
    );
    const breakfasts = availableBreakfasts();
    const snacks = [...quickSnacks, ...matrixSnacks, ...attachmentMissingSnacks, ...catalogSnacks].filter(isProfileEligible);
    const mains = styled.filter((r) =>
      ["Piatto unico", "Piatto completo", "Primo", "Secondo"].includes(recipeCourse(r)),
    );
    const homeMains = mains.filter(
      (r) =>
        r.time >= 20 &&
        !portableRecipes.some((portable) => portable.id === r.id),
    );
    const lunches =
      ["Lavoro", "Mensa"].includes(dayContext)
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
    const shares = mealCalorieShares;
    const profileDays = weekLocked ? [dayIndex] : days.map((_, index) => index);
    setChoices((current) => {
      const next = { ...current };
      const usedRecipes = new Set<string>();
      const usedProteinSignatures = new Set<string>();
      let plannedWholeEggBreakfasts = 0;
      const chooseMain = (
        pool: Recipe[],
        family: WeeklyProteinFamily,
        slot: number,
        target: number,
        offset: number,
      ) => {
        const unused = pool.filter((recipe) => !usedRecipes.has(recipe.id));
        const byFamily = unused.filter(
          (recipe) => recipeProteinFamily(recipe) === family,
        );
        const sameCuisineFamily = allRecipes.filter(
          (recipe) =>
            isProfileEligible(recipe) &&
            fitsSlot(recipe, slot) &&
            recipeCuisine(recipe) === cuisineChoice &&
            recipeProteinFamily(recipe) === family &&
            !usedRecipes.has(recipe.id),
        );
        const anyCuisineFamily = allRecipes.filter(
          (recipe) =>
            isProfileEligible(recipe) &&
            fitsSlot(recipe, slot) &&
            recipeProteinFamily(recipe) === family &&
            !usedRecipes.has(recipe.id),
        );
        const candidates = byFamily.length
          ? byFamily
          : sameCuisineFamily.length
            ? sameCuisineFamily
            : anyCuisineFamily.length
              ? anyCuisineFamily
              : unused.length
                ? unused
                : pool;
        const unusedSpecies = candidates.filter(
          (recipe) => !usedProteinSignatures.has(recipeProteinSignature(recipe)),
        );
        const chosen = closestForSlot(
          unusedSpecies.length ? unusedSpecies : candidates,
          slot,
          target,
          offset,
        );
        usedRecipes.add(chosen.id);
        usedProteinSignatures.add(recipeProteinSignature(chosen));
        return chosen;
      };
      profileDays.forEach((day) => {
        const profileTarget = day === dayIndex ? plannedCalories : calories;
        const offset = profileSeed + day;
        const breakfastPool =
          plannedWholeEggBreakfasts >= 1
            ? breakfasts.filter((recipe) => !hasWholeEgg(recipe.ingredients))
            : breakfasts;
        const breakfast = closestForSlot(
          breakfastPool.length ? breakfastPool : breakfasts,
          0,
          profileTarget * shares[0],
          offset,
        );
        if (hasWholeEgg(breakfast.ingredients)) plannedWholeEggBreakfasts += 1;
        const morningSnackPool = isSmoothieRecipe(breakfast)
          ? snacks.filter((recipe) => !isSmoothieRecipe(recipe))
          : snacks;
        const morningSnack = closestForSlot(
          morningSnackPool.length ? morningSnackPool : snacks,
          1,
          profileTarget * shares[1],
          offset,
        );
        const smoothieAlreadyPlanned =
          isSmoothieRecipe(breakfast) || isSmoothieRecipe(morningSnack);
        const differentFruitSnacks = snacks.filter(
          (recipe) =>
            recipe.id !== morningSnack.id &&
            !sharesFruit(morningSnack, recipe) &&
            (!smoothieAlreadyPlanned || !isSmoothieRecipe(recipe)),
        );
        const afternoonPool = differentFruitSnacks.length
          ? differentFruitSnacks
          : snacks.filter((recipe) => recipe.id !== morningSnack.id);
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
    let snacks = [...quickSnacks, ...matrixSnacks, ...attachmentMissingSnacks, ...catalogSnacks].filter(isProfileEligible);
    let mains = allRecipes.filter(
      (r) =>
        isProfileEligible(r) &&
        recipeCuisine(r) === cuisineChoice &&
        ["Piatto unico", "Piatto completo", "Primo", "Secondo"].includes(recipeCourse(r)),
    );
    if (next.feeling === "gonfio") {
      const containsCommonBloatingTriggers = (recipe: Recipe) =>
        recipeProteinFamily(recipe) === "legumi" ||
        recipe.ingredients.some((item) =>
          /cavolo|cavolfiore|broccoli|cipoll|porro/i.test(item.food),
        );
      mains = mains
        .filter((recipe) => !containsCommonBloatingTriggers(recipe))
        .sort((a, b) => {
          const portionDelta = a.ingredients.length - b.ingredients.length;
          return portionDelta || calc(a.ingredients).fat - calc(b.ingredients).fat;
        });
      snacks = snacks
        .filter((recipe) => !containsCommonBloatingTriggers(recipe))
        .sort((a, b) => a.ingredients.length - b.ingredients.length);
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
    } else if (
      next.feeling === "stanco" ||
      next.sleep === "scarso" ||
      next.todayActivity === "intensa"
    ) {
      mains = [...mains].sort(
        (a, b) => calc(b.ingredients).carbs - calc(a.ingredients).carbs,
      );
      snacks = allRecipes
        .filter((r) => isProfileEligible(r) && recipeCourse(r) === "Spuntino")
        .sort((a, b) => calc(b.ingredients).carbs - calc(a.ingredients).carbs);
    } else {
      mains = [...mains].sort(
        (a, b) =>
          Math.abs(calc(a.ingredients).kcal - 550) -
          Math.abs(calc(b.ingredients).kcal - 550),
      );
    }
    if (next.feeling === "bene" && next.yesterday === "molto") {
      const energyDensity = (recipe: Recipe) => {
        const nutrition = calc(recipe.ingredients);
        return nutrition.kcal / Math.max(1, nutrition.weight);
      };
      mains = [...mains].sort(
        (a, b) =>
          energyDensity(a) - energyDensity(b) ||
          calc(b.ingredients).fiber - calc(a.ingredients).fiber,
      );
      snacks = [...snacks].sort(
        (a, b) =>
          calc(b.ingredients).fiber - calc(a.ingredients).fiber ||
          calc(a.ingredients).kcal - calc(b.ingredients).kcal,
      );
    } else if (next.feeling === "bene" && next.yesterday === "poco") {
      mains = [...mains].sort(
        (a, b) =>
          calc(b.ingredients).protein - calc(a.ingredients).protein ||
          calc(b.ingredients).fiber - calc(a.ingredients).fiber,
      );
      snacks = [...snacks].sort(
        (a, b) =>
          calc(b.ingredients).protein - calc(a.ingredients).protein ||
          calc(b.ingredients).kcal - calc(a.ingredients).kcal,
      );
    }
    if (!breakfasts.length || !snacks.length || !mains.length) return;
    const homeMains = mains.filter(
      (r) =>
        r.time >= 20 &&
        !portableRecipes.some((portable) => portable.id === r.id),
    );
    const lunches =
      ["Lavoro", "Mensa"].includes(dayContext)
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
      (next.feeling === "gonfio"
        ? 1
        : next.feeling === "stanco"
          ? 2
          : next.feeling === "fame"
            ? 3
            : 0) +
      (next.sleep === "scarso" ? 2 : next.sleep === "medio" ? 1 : 0) +
      (next.todayActivity === "intensa"
        ? 3
        : next.todayActivity === "leggera"
          ? 1
          : 0) +
      profileSeed;
    const otherWholeEggBreakfasts = days.reduce((total, _, day) => {
      if (day === dayIndex) return total;
      const recipe = recipeMap[getDayIds(day)[0]];
      return (
        total +
        Number(Boolean(recipe) && hasWholeEgg(plannedIngredients(String(day) + "-0", recipe)))
      );
    }, 0);
    const checkinBreakfastPool =
      otherWholeEggBreakfasts >= 1
        ? breakfasts.filter((recipe) => !hasWholeEgg(recipe.ingredients))
        : breakfasts;
    const breakfast =
      (checkinBreakfastPool.length ? checkinBreakfastPool : breakfasts)[
        (dayIndex + offset) % (checkinBreakfastPool.length || breakfasts.length)
      ];
    const morningSnackPool = isSmoothieRecipe(breakfast)
      ? snacks.filter((recipe) => !isSmoothieRecipe(recipe))
      : snacks;
    const morningSnack = (morningSnackPool.length ? morningSnackPool : snacks)[
      (dayIndex + offset) % (morningSnackPool.length || snacks.length)
    ];
    const smoothieAlreadyPlanned =
      isSmoothieRecipe(breakfast) || isSmoothieRecipe(morningSnack);
    const afternoonCandidates = snacks.filter(
      (recipe) =>
        recipe.id !== morningSnack.id &&
        !sharesFruit(morningSnack, recipe) &&
        (!smoothieAlreadyPlanned || !isSmoothieRecipe(recipe)),
    );
    const afternoonPool = afternoonCandidates.length
      ? afternoonCandidates
      : snacks.filter((recipe) => recipe.id !== morningSnack.id);
    const afternoonSnack =
      afternoonPool[(dayIndex + offset + 1) % afternoonPool.length] ||
      morningSnack;
    setChoices((v) => {
      const updated: Record<string, string> = {
        ...v,
        [`${dayIndex}-0`]: keepRecordedChoice(
          v,
          0,
          breakfast.id,
        ),
        [`${dayIndex}-1`]: keepRecordedChoice(v, 1, morningSnack.id),
        [`${dayIndex}-2`]: keepRecordedChoice(
          v,
          2,
          lunches[(dayIndex + offset) % lunches.length].id,
        ),
        [`${dayIndex}-3`]: keepRecordedChoice(v, 3, afternoonSnack.id),
        [`${dayIndex}-4`]: keepRecordedChoice(
          v,
          4,
          dinners[(dayIndex + offset + 1) % dinners.length].id,
        ),
      };
      const tomorrow = dayIndex + 1;
      if (
        !weekLocked &&
        tomorrow < days.length &&
        next.tomorrowActivity !== "no"
      ) {
        const bonus = next.tomorrowActivity === "intensa" ? 200 : 75;
        const tomorrowTarget = calories + bonus;
        const highCarbSnacks = [...snacks].sort(
          (a, b) => calc(b.ingredients).carbs - calc(a.ingredients).carbs,
        );
        const highCarbLunches = [...lunches].sort(
          (a, b) => calc(b.ingredients).carbs - calc(a.ingredients).carbs,
        );
        const highCarbDinners = [...dinners].sort(
          (a, b) => calc(b.ingredients).carbs - calc(a.ingredients).carbs,
        );
        const pools = [
          breakfasts,
          highCarbSnacks,
          highCarbLunches,
          highCarbSnacks.filter((recipe) => recipe.id !== highCarbSnacks[0]?.id),
          highCarbDinners,
        ];
        let tomorrowSmoothiePlanned = false;
        pools.forEach((pool, slot) => {
          const key = `${tomorrow}-${slot}`;
          if (completed[key] || !pool.length) return;
          const target = tomorrowTarget * mealCalorieShares[slot];
          let chosen = closestForSlot(
            pool,
            slot,
            target,
            offset + tomorrow + slot,
          );
          if ([0, 1, 3].includes(slot) && isSmoothieRecipe(chosen)) {
            if (tomorrowSmoothiePlanned) {
              chosen = pool.find((recipe) => !isSmoothieRecipe(recipe)) || chosen;
            } else {
              tomorrowSmoothiePlanned = true;
            }
          }
          updated[key] = chosen.id;
        });
      }
      return updated;
    });
    setReplanNote(
      next.feeling === "gonfio"
        ? "Gonfio: menu semplice, senza legumi e bibite gassate. Sintomi persistenti o dolore: medico."
        : next.feeling === "stanco" || next.sleep === "scarso"
          ? "Stanco o poco riposato: pasti regolari, carboidrati distribuiti, frutta e acqua."
          : next.feeling === "fame"
            ? "Fame: più proteine e fibre per la sazietà."
            : next.todayActivity === "intensa"
              ? "Attività intensa: più energia vicino all'attività."
              : next.yesterday === "molto"
                ? "Ieri hai mangiato di più: oggi pasti regolari, verdure e fibre; niente digiuno compensatorio."
                : next.yesterday === "poco"
                  ? "Ieri hai mangiato meno: oggi pasti completi e regolari."
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
      (previous
        ? calc([{ food: previous.food, grams: previous.grams }]).kcal
        : 0);
    setPartSelections((v) => ({
      ...v,
      [partPicker.key]: previous
        ? activeParts.map((x, index) =>
            index === partPicker.index ? nextPart : x,
          )
        : [...activeParts, nextPart],
    }));
    const nextSlot = slot === 0 ? 1 : slot <= 2 ? 3 : null;
    if (nextSlot !== null && !completed[`${day}-${nextSlot}`]) {
      const snackId =
        delta > 80 ? "quick-apple" : delta < -80 ? "quick-nuts" : null;
      if (snackId)
        setChoices((v) => ({ ...v, [`${day}-${nextSlot}`]: snackId }));
    }
    setReplanNote(
      partPicker.adding
        ? `Aggiunto: ${nextPart.label || nextPart.food} ${nextPart.grams} g. Totali aggiornati.`
        : nextSlot === null
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
  const removeMealPartAt = (key: string, recipe: Recipe, index: number) => {
    const activeParts = activeMealParts(key, recipe);
    setPartSelections((current) => ({
      ...current,
      [key]: activeParts.filter((_, partIndex) => partIndex !== index),
    }));
    setReplanNote("Elemento rimosso: calorie e nutrienti aggiornati.");
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
  const startAddingMealPart = (key: string, recipe: Recipe, slot: number) => {
    const role: MealPart["category"] =
      slot === 0 || slot === 1 || slot === 3 ? "Frutta" : "Contorno";
    const seed = seasonalFirst(mealPartOptions[role])[0] || mealPartOptions[role][0];
    if (!seed) return;
    setMealView((current) => ({ ...current, [key]: "parts" }));
    setPartPicker({
      key,
      index: activeMealParts(key, recipe).length,
      part: { ...seed },
      role,
      adding: true,
    });
  };
  useEffect(() => {
    if (!profileHydrated) return;
    if (skipFirstProfileApplyRef.current) {
      skipFirstProfileApplyRef.current = false;
      return;
    }
    applyCuisine();
  }, [
    goal,
    calories,
    cuisineChoice,
    dayContext,
    plannedDrink,
    foodStyle,
    dailyMeals,
    maxPrepTime,
    availableEquipment,
    budgetLevel,
    breakfastStyle,
    mealPrepMode,
    profileHydrated,
  ]);
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
          allergens: inferTextAllergens(match),
        },
      ],
    }));
    setExtraName("");
    setExtraGrams("50");
  };
  const dayScale = (_day: number) => 1;
  const loggedMealKcal = (day: number) =>
    getDayIds(day).reduce((sum, id, slot) => {
      if (!isActiveMealSlot(slot)) return sum;
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
        if (!isActiveMealSlot(slot)) return;
        const key = `${day}-${slot}`;
        const recordedId = completed[key] ? completedRecipes[key] || id : id;
        const recipe = recipeMap[recordedId];
        const items = completed[key]
          ? actualIngredients(key, recipe)
          : plannedIngredients(key, recipe);
        if (hasWholeEgg(items)) counts.Uova += 1;
        if (slot !== 2 && slot !== 4) return;
        const family = proteinFamilyForItems(items);
        if (family === "pesce") counts.Pesce += 1;
        if (family === "carne-bianca") counts["Carne bianca"] += 1;
        if (family === "carne-rossa") counts["Carne rossa"] += 1;
        if (family === "legumi") counts["Legumi e vegetali"] += 1;
        if (family === "latticini") counts.Formaggi += 1;
        if (family === "salumi") counts.Salumi += 1;
      });
    });
    return counts;
  };  const weeklyCounts = weeklyProteinCounts();
  const weeklyPlannedKcal = days.map((_, day) =>
    round(
      getDayIds(day).reduce((total, id, slot) => {
        if (!isActiveMealSlot(slot)) return total;
        const key = `${day}-${slot}`;
        return total + calc(plannedIngredients(key, recipeMap[id])).kcal;
      }, 0),
    ),
  );
  const weeklyPlannedFiber = days.map((_, day) =>
    fmt(
      getDayIds(day).reduce((total, id, slot) => {
        if (!isActiveMealSlot(slot)) return total;
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
    { label: "Pesce", target: "2–3", min: 2, max: 3, count: weeklyCounts.Pesce },
    { label: "Legumi e vegetali", target: "3", min: 3, max: 3, count: weeklyCounts["Legumi e vegetali"] },
    { label: "Carne bianca", target: "1–2", min: 1, max: 2, count: weeklyCounts["Carne bianca"] },
    { label: "Carne rossa", target: "0–1", min: 0, max: 1, count: weeklyCounts["Carne rossa"] },
    { label: "Uova", target: "2–4", min: 2, max: 4, count: weeklyCounts.Uova },
    { label: "Formaggi", target: "2–3", min: 2, max: 3, count: weeklyCounts.Formaggi },
    { label: "Salumi", target: "0–1", min: 0, max: 1, count: weeklyCounts.Salumi },
  ].map((item) => ({
    ...item,
    status: item.count >= item.min && item.count <= item.max ? "Nel range" : "Da riequilibrare",
  }));
  const weeklyKcalDelta = weeklyAverageKcal - calories;
  const consecutiveProteinRepeats = days
    .flatMap((_, day) => [2, 4].map((slot) => ({ day, slot })))
    .map(({ day, slot }) => {
      const key = `${day}-${slot}`;
      return proteinFamilyForItems(plannedIngredients(key, recipeMap[getDayIds(day)[slot]]));
    })
    .filter((family, index, sequence) => index > 0 && family !== "altro" && family === sequence[index - 1])
    .length;
  const rebalanceWeeklyProteinRotation = () => {
    const nonMainEggMeals = days.reduce(
      (total, _, day) =>
        total +
        [0, 1, 3].filter((slot) => {
          if (!isActiveMealSlot(slot)) return false;
          const key = `${day}-${slot}`;
          return hasWholeEgg(plannedIngredients(key, recipeMap[getDayIds(day)[slot]]));
        }).length,
      0,
    );
    let retainedEggMains = 0;
    let replacementIndex = 0;
    const eggMainTarget = Math.max(0, 3 - nonMainEggMeals);
    const eggReplacements: WeeklyProteinFamily[] = ["pesce", "salumi"];
    const requestedFamilies = WEEKLY_MAIN_ROTATION.map((family) => {
      if (family !== "uova" || retainedEggMains < eggMainTarget) {
        if (family === "uova") retainedEggMains += 1;
        return family;
      }
      const replacement = eggReplacements[replacementIndex];
      replacementIndex += 1;
      return replacement || family;
    });
    const mainSlots = days.flatMap((_, day) => [2, 4].map((slot) => ({ day, slot })));
    const used = new Set<string>();
    const usedProteinSignatures = new Set<string>();
    const updates: Record<string, string> = {};
    mainSlots.forEach(({ day, slot }, index) => {
      const family = requestedFamilies[index];
      const targetKcal = targetForDay(day) * mealCalorieShares[slot];
      const suitable = allRecipes.filter((recipe) => {
        if (recipe.id.startsWith("occasional-")) return false;
        if (!fitsSlot(recipe, slot) || !isProfileEligible(recipe)) return false;
        return proteinFamilyForItems(recipe.ingredients) === family;
      });
      const ranked = suitable.sort((left, right) => {
        const uniqueDelta = Number(used.has(left.id)) - Number(used.has(right.id));
        if (uniqueDelta) return uniqueDelta;
        if (dayContext === "Lavoro" && slot === 2) {
          const practicalDelta = Number(isWorkFriendly(right)) - Number(isWorkFriendly(left));
          if (practicalDelta) return practicalDelta;
        }
        const cuisineDelta = Number(recipeCuisine(right) === cuisineChoice) - Number(recipeCuisine(left) === cuisineChoice);
        if (cuisineDelta) return cuisineDelta;
        return Math.abs(calc(left.ingredients).kcal - targetKcal) - Math.abs(calc(right.ingredients).kcal - targetKcal);
      });
      const freshSpecies = ranked.find(
        (recipe) =>
          !used.has(recipe.id) &&
          !usedProteinSignatures.has(recipeProteinSignature(recipe)),
      );
      const selectedRecipe = freshSpecies || ranked.find((recipe) => !used.has(recipe.id)) || ranked[0];
      if (selectedRecipe) {
        updates[`${day}-${slot}`] = selectedRecipe.id;
        used.add(selectedRecipe.id);
        usedProteinSignatures.add(recipeProteinSignature(selectedRecipe));
      }
    });
    setChoices((current) => ({ ...current, ...updates }));
    setPartSelections((current) => {
      const next = { ...current };
      mainSlots.forEach(({ day, slot }) => delete next[`${day}-${slot}`]);
      return next;
    });
    setMealView((current) => {
      const next = { ...current };
      mainSlots.forEach(({ day, slot }) => delete next[`${day}-${slot}`]);
      return next;
    });
    setWeekLocked(false);
    setReplanNote("Rotazione settimanale ricostruita: 2 pesci, 3 legumi, 2 carni bianche, massimo 1 carne rossa, 3 uova e 3 formaggi, senza ripetere la stessa famiglia consecutivamente.");
  };
  const replanNextDay = (day: number) => {
    if (day >= days.length - 1) {
      setReplanNote(
        "Settimana completata: usa il diario per impostare la prossima.",
      );
      return;
    }
    const total = loggedTotal(day);
    const target = targetForDay(day);
    const usedRecipeIds = new Set(
      days
        .slice(0, day + 1)
        .flatMap((_, previousDay) => getDayIds(previousDay)),
    );
    const safe = allRecipes.filter(
      (recipe) =>
        isProfileEligible(recipe) &&
        !recipe.id.startsWith("occasional-") &&
        ["Piatto unico", "Piatto completo", "Primo", "Secondo"].includes(recipeCourse(recipe)),
    );
    if (!safe.length) {
      setReplanNote("Nessuna ricetta compatibile con tutte le esclusioni e le attrezzature selezionate.");
      return;
    }
    const ranked = [...safe].sort(
      (a, b) => calc(a.ingredients).kcal - calc(b.ingredients).kcal,
    );
    const pool =
      total > target * 1.1
        ? ranked.slice(0, Math.max(2, Math.floor(ranked.length / 2)))
        : total < target * 0.8
          ? ranked.slice(Math.floor(ranked.length / 2))
          : safe;
    const unused = pool.filter((recipe) => !usedRecipeIds.has(recipe.id));
    const lunchPool = unused.length ? unused : pool;
    const lunch = lunchPool[(day * 2) % lunchPool.length];
    const dinnerCandidates = lunchPool.filter(
      (recipe) =>
        recipe.id !== lunch.id &&
        recipeProteinFamily(recipe) !== recipeProteinFamily(lunch),
    );
    const dinnerPool = dinnerCandidates.length
      ? dinnerCandidates
      : lunchPool.filter((recipe) => recipe.id !== lunch.id);
    const dinner = (dinnerPool.length ? dinnerPool : pool)[(day * 2 + 1) % (dinnerPool.length || pool.length)];
    setChoices((v) => ({
      ...v,
      [`${day + 1}-2`]: lunch.id,
      [`${day + 1}-4`]: dinner.id,
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
    const open = activeMealSlots.filter((slot) => !completed[`${day}-${slot}`]);
    if (!open.length) {
      setReplanNote("Tutti i pasti di oggi sono già registrati.");
      return;
    }
    const remaining = Math.max(0, targetForDay(day) - loggedTotal(day));
    const average = remaining / open.length;
    const usedRecipeIds = new Set(getDayIds(day));
    const safe = allRecipes.filter(
      (recipe) => isProfileEligible(recipe) && !recipe.id.startsWith("occasional-"),
    );
    const updates: Record<string, string> = {};
    open.forEach((slot, n) => {
      const coursePool = safe.filter((r) => fitsSlot(r, slot));
      const ranked = [...(coursePool.length ? coursePool : safe)].sort(
        (a, b) =>
          Number(usedRecipeIds.has(a.id)) - Number(usedRecipeIds.has(b.id)) ||
          Math.abs(calc(a.ingredients).kcal - average) -
          Math.abs(calc(b.ingredients).kcal - average),
      );
      if (ranked.length) {
        const chosen = ranked[n % Math.min(ranked.length, 12)];
        updates[`${day}-${slot}`] = chosen.id;
        usedRecipeIds.add(chosen.id);
      }
    });
    setChoices((v) => ({ ...v, ...updates }));
    setReplanNote(
      `Restano circa ${round(remaining)} kcal: ho aggiornato ${open.length} proposte.`,
    );
  };
  const rebalanceDayPreservingEdits = (day: number) => {
    const adjustable = activeMealSlots.filter((slot) => {
      const key = `${day}-${slot}`;
      return !completed[key] && !partSelections[key];
    });
    if (!adjustable.length) {
      setReplanNote("Modifiche salvate; non ci sono altri momenti liberi da riequilibrare oggi.");
      return;
    }
    const fixedKcal = activeMealSlots
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
    const usedRecipeIds = new Set(getDayIds(day));
    const safe = allRecipes.filter(
      (recipe) => isProfileEligible(recipe) && !recipe.id.startsWith("occasional-"),
    );
    const updates: Record<string, string> = {};
    adjustable.forEach((slot, index) => {
      const pool = safe.filter((recipe) => fitsSlot(recipe, slot));
      const ranked = [...pool].sort(
        (a, b) =>
          Number(usedRecipeIds.has(a.id)) - Number(usedRecipeIds.has(b.id)) ||
          Math.abs(calc(a.ingredients).kcal - average) -
          Math.abs(calc(b.ingredients).kcal - average),
      );
      if (ranked.length) {
        const chosen = ranked[index % ranked.length];
        updates[`${day}-${slot}`] = chosen.id;
        usedRecipeIds.add(chosen.id);
      }
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
        if (!isActiveMealSlot(slot)) return;
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
    Object.entries(shoppingAdditions).forEach(([food, grams]) => {
      totals[food] = (totals[food] || 0) + grams;
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
    shoppingAdditions,
  ]);
  const copyRecipe = async (recipe: Recipe) => {
    const macros = calc(recipe.ingredients);
    const safeAlternatives = recipe.alternatives.filter(isAlternativeAllowed);
    const text = [
      recipe.name,
      "Porzioni standard non personalizzate · 1 persona",
      "Valori nutrizionali stimati: alimenti, marche e cottura possono variare; verifica etichetta e peso effettivo.",
      `${round(macros.kcal)} kcal · ${round(macros.protein)} g proteine · ${round(macros.carbs)} g carboidrati · ${round(macros.fat)} g grassi`,
      `Composizione: ${recipeBalanceSummary(recipe)}`,
      internationalInspirationNote(recipe),
      "",
      "Ingredienti",
      ...recipe.ingredients.map(
        (item) =>
          `• ${item.label || item.food}: ${item.grams} g · peso ${ingredientWeightState(item.food)}`,
      ),
      "",
      "Preparazione",
      ...recipe.steps.map((step, index) => `${index + 1}. ${step}`),
      "",
      "Sostituzioni",
      ...(safeAlternatives.length
        ? safeAlternatives.map((item) => `• ${item}`)
        : ["• Nessuna sostituzione compatibile con il profilo attuale"]),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setReplanNote("Ricetta copiata negli appunti.");
  };
  const addRecipeToShopping = (recipe: Recipe) => {
    setShoppingAdditions((current) => {
      const next = { ...current };
      recipe.ingredients.forEach((item) => {
        next[item.food] = round((next[item.food] || 0) + item.grams);
      });
      return next;
    });
    setReplanNote("Ingredienti aggiunti alla lista della spesa.");
    setShoppingOpen(true);
  };
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
  const weeklyExportRows = () =>
    days.flatMap((day, dayNumber) =>
      getDayIds(dayNumber).flatMap((recipeId, slot) => {
        if (!isActiveMealSlot(slot)) return [];
        const key = `${dayNumber}-${slot}`;
        const recipe = recipeMap[recipeId];
        return plannedIngredients(key, recipe).map((ingredient) => {
          const nutrients = calc([ingredient]);
          return {
            day: day.label,
            meal: SLOT_LABELS[slot],
            recipe: recipe.name,
            food: ingredient.label || ingredient.food,
            weightState: ingredientWeightState(ingredient.food),
            grams: ingredient.grams,
            kcal: round(nutrients.kcal),
            protein: fmt(nutrients.protein),
            carbs: fmt(nutrients.carbs),
            fat: fmt(nutrients.fat),
          };
        });
      }),
    );
  const weeklyPlanText = () => {
    const rows = weeklyExportRows();
    return [
      `Tavola Mia · piano settimanale · media ${weeklyAverageKcal} kcal/giorno`,
      ...days.flatMap((day) => {
        const dayRows = rows.filter((row) => row.day === day.label);
        return [
          `\n${day.label}`,
          ...SLOT_LABELS.flatMap((meal) => {
            const mealRows = dayRows.filter((row) => row.meal === meal);
            return mealRows.length
              ? [
                  `${meal} · ${mealRows[0].recipe}`,
                  ...mealRows.map(
                    (row) =>
                      `- ${row.food}: ${row.grams} g · peso ${row.weightState} · ${row.kcal} kcal · P ${row.protein} g · C ${row.carbs} g · G ${row.fat} g`,
                  ),
                ]
              : [];
          }),
        ];
      }),
    ].join("\n");
  };
  const downloadWeeklyFile = (content: string, type: string, extension: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `tavola-mia-settimana.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const copyWeeklyPlan = async () => {
    await navigator.clipboard.writeText(weeklyPlanText());
    setReplanNote("Piano settimanale copiato.");
  };
  const exportWeeklyCsv = () => {
    const header = ["Giorno", "Pasto", "Ricetta", "Alimento", "Stato peso", "Grammi", "kcal", "Proteine g", "Carboidrati g", "Grassi g"];
    const rows = weeklyExportRows().map((row) => [row.day, row.meal, row.recipe, row.food, row.weightState, row.grams, row.kcal, row.protein, row.carbs, row.fat]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"))
      .join("\r\n");
    downloadWeeklyFile(`\uFEFF${csv}`, "text/csv;charset=utf-8", "csv");
  };
  const exportWeeklyTxt = () => {
    downloadWeeklyFile(`\uFEFF${weeklyPlanText()}`, "text/plain;charset=utf-8", "txt");
  };
  const exportWeeklyWord = () => {
    const html = `<html><head><meta charset="utf-8"><title>Tavola Mia</title></head><body><pre style="font-family:Arial;white-space:pre-wrap">${weeklyPlanText().replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre></body></html>`;
    downloadWeeklyFile(html, "application/msword", "doc");
  };
  const selectedIngredients = selected
    ? selectedMealKey
      ? actualIngredients(selectedMealKey, selected)
      : selected.ingredients.map((x) => ({
          ...x,
          grams: round(x.grams * scale * peopleCount),
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
                  {targetDefined ? "Target" : "Esempio"} oggi {plannedCalories} · scarto {round(dayTotals.kcal - plannedCalories) > 0 ? "+" : ""}
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
                        setAllergyGroups([]);
                        setIntoleranceGroups([]);
                        setHealthConditions([]);
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
                <div className="profile-preferences-grid">
                  <label>
                    <span>Persone</span>
                    <input type="number" min="1" max="12" value={peopleCount} onChange={(event) => setPeopleCount(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} />
                  </label>
                  <label>
                    <span>Fascia d'età</span>
                    <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)}>
                      <option>Adulto</option>
                      <option>Anziano</option>
                      <option>Minore</option>
                    </select>
                  </label>
                  <label>
                    <span>Stile alimentare</span>
                    <select value={foodStyle} onChange={(event) => setFoodStyle(event.target.value)}>
                      <option>Onnivoro</option>
                      <option>Pescetariano</option>
                      <option>Vegetariano</option>
                      <option>Vegano</option>
                    </select>
                  </label>
                  <label>
                    <span>Pasti al giorno</span>
                    <select value={dailyMeals} onChange={(event) => setDailyMeals(Number(event.target.value))}>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  </label>
                  <label>
                    <span>Tempo massimo</span>
                    <select value={maxPrepTime} onChange={(event) => setMaxPrepTime(Number(event.target.value))}>
                      {[5, 15, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Attrezzature</span>
                    <select value={availableEquipment} onChange={(event) => setAvailableEquipment(event.target.value)}>
                      <option>Piano cottura e forno</option>
                      <option>Solo piano cottura</option>
                      <option>Microonde</option>
                      <option>Nessuna cottura</option>
                    </select>
                  </label>
                  <label>
                    <span>Budget</span>
                    <select value={budgetLevel} onChange={(event) => setBudgetLevel(event.target.value)}>
                      <option>Economico</option>
                      <option>Medio</option>
                      <option>Libero</option>
                    </select>
                  </label>
                  <label>
                    <span>Colazione</span>
                    <select value={breakfastStyle} onChange={(event) => setBreakfastStyle(event.target.value)}>
                      <option>Indifferente</option>
                      <option>Dolce</option>
                      <option>Salata</option>
                    </select>
                  </label>
                  <label>
                    <span>Meal prep</span>
                    <select value={mealPrepMode} onChange={(event) => setMealPrepMode(event.target.value)}>
                      <option>No</option>
                      <option>Sì</option>
                    </select>
                  </label>
                </div>
                {ageGroup === "Minore" && (
                  <p className="profile-stop">Le porzioni standard per adulti non vengono applicate ai minori: serve un professionista sanitario.</p>
                )}
                <b>Allergie diagnosticate</b>
                <div className="chips">
                  {Object.keys(groupFoods).map((g) => (
                    <button
                      key={g}
                      className={allergyGroups.includes(g) ? "active" : ""}
                      onClick={() =>
                        setAllergyGroups((v) =>
                          v.includes(g) ? v.filter((x) => x !== g) : [...v, g],
                        )
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <b>Intolleranze o sensibilità riferite</b>
                <div className="chips">
                  {["Latte", "Glutine", "Soia"].map((group) => (
                    <button
                      key={group}
                      className={intoleranceGroups.includes(group) ? "active" : ""}
                      onClick={() =>
                        setIntoleranceGroups((current) =>
                          current.includes(group)
                            ? current.filter((item) => item !== group)
                            : [...current, group],
                        )
                      }
                    >
                      {group}
                    </button>
                  ))}
                </div>
                <b>Condizioni da dichiarare</b>
                <div className="chips">
                  {["Celiachia diagnosticata", "Diabete", "Ipertensione", "Malattia renale", "Gravidanza"].map((condition) => (
                    <button
                      key={condition}
                      className={healthConditions.includes(condition) ? "active" : ""}
                      onClick={() =>
                        setHealthConditions((current) =>
                          current.includes(condition)
                            ? current.filter((item) => item !== condition)
                            : [...current, condition],
                        )
                      }
                    >
                      {condition}
                    </button>
                  ))}
                </div>
                {healthConditions.length > 0 && (
                  <p className="profile-stop">
                    Le condizioni selezionate richiedono indicazioni personalizzate del professionista sanitario. L'app applica solo esclusioni prudenziali e non crea una dieta terapeutica.
                  </p>
                )}
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
                <label>{targetDefined ? "Target kcal" : "Esempio kcal"}</label>
                <select
                  value={calories}
                  onChange={(e) => {
                    setCalories(Number(e.target.value));
                    setTargetDefined(true);
                  }}
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
                  <option>Mensa</option>
                  <option>Ristorante</option>
                </select>
                <label className="target-confirmation">
                  <input
                    type="checkbox"
                    checked={targetDefined}
                    onChange={(event) => setTargetDefined(event.target.checked)}
                  />
                  Target già definito
                </label>
              </div>
            </section>
            {(dayContext === "Mensa" || dayContext === "Ristorante") && (
              <p className="outside-context-note">
                {dayContext === "Mensa"
                  ? "Prima proposte comuni da mensa: primo semplice, secondo alla piastra o lessato, verdura e frutta."
                  : "Prima piatti completi e riconoscibili; condimenti e quantità reali restano modificabili dopo il pasto."}
                {" "}
                <a href="https://www.salute.gov.it/new/it/tema/nutrizione/ristorazione-collettiva/" target="_blank" rel="noreferrer">Ministero della Salute ↗</a>
              </p>
            )}
            {dayContext === "Ristorante" && (
              <section className="restaurant-area">
                <label htmlFor="restaurant-area-input">Zona o città</label>
                <div>
                  <input
                    id="restaurant-area-input"
                    value={restaurantArea}
                    onChange={(event) => setRestaurantArea(event.target.value)}
                    placeholder="Es. Torino centro o Bangkok"
                    autoComplete="address-level2"
                  />
                  {restaurantArea.trim() && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`ristoranti ${restaurantArea.trim()}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Cerca nella zona ↗
                    </a>
                  )}
                </div>
                <small>I locali mostrati sono risultati aggiornati di Google Maps; Tavola Mia suggerisce cosa scegliere, senza inventare nomi o disponibilità.</small>
              </section>
            )}
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
                    <span>Riposo</span>
                    <div className="chips">
                      {[
                        ["bene", "Bene"],
                        ["medio", "Poco"],
                        ["scarso", "Male"],
                      ].map(([v, l]) => (
                        <button
                          className={check.sleep === v ? "active" : ""}
                          key={v}
                          onClick={() => answerCheck("sleep", v)}
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
            <div
              className={`produce-status ${dayTotals.produce >= 400 ? "reached" : "open"}`}
              aria-label="Totale giornaliero di frutta e verdura"
            >
              <b>{round(dayTotals.produce)} g</b>
              <span>frutta + verdura · riferimento pratico 400 g</span>
            </div>
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
                  <h2>{dailyMeals} momenti pratici</h2>
                </div>
                <button className="text-btn" onClick={() => setTab("week")}>
                  7 giorni
                </button>
              </div>
              <div className="meal-list">
                {currentIds
                  .map((id, i) => ({ id, i }))
                  .filter(({ i }) => isActiveMealSlot(i))
                  .map(({ id, i }) => {
                  const r = recipeMap[id];
                  const key = `${dayIndex}-${i}`;
                  const visibleIngredients = actualIngredients(key, r);
                  const m = calc(visibleIngredients);
                  const activeParts = activeMealParts(key, r);
                  const hasPartCards = Boolean(
                    r.parts?.length || partSelections[key]?.length,
                  );
                  const fullDishView = Boolean(
                    r.parts &&
                      r.kind !== "combination" &&
                      (mealView[key] || "dish") === "dish",
                  );
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
                  const activeCategories = new Set(activeParts.map((part) => part.category));
                  const balanceMissing = [
                    !activeCategories.has("Carboidrato") ? "carboidrato" : "",
                    !activeCategories.has("Proteina") && !activeCategories.has("Latticino")
                      ? "proteina"
                      : "",
                    !activeCategories.has("Contorno") ? "verdura" : "",
                  ].filter(Boolean);
                  const vegetablePortion = vegetablePortionForItems(visibleIngredients);
                  return (
                    <article
                      className={`meal-card ${hasPartCards && !fullDishView ? "composed" : "detailed"} ${allowed ? "" : "blocked"} ${caution ? "caution" : ""}`}
                      key={key}
                      onClick={() => {
                        setSelectedMealKey(key);
                        setSelected(r);
                      }}
                    >
                      {(!hasPartCards || fullDishView) && <RecipeVisual recipe={r} />}
                      <div className="meal-body">
                        <span>{SLOT_LABELS[i]}</span>
                        <h3>
                          {hasPartCards && !fullDishView
                            ? `${SLOT_LABELS[i]} · ${
                                activeParts
                                  .filter((part) => part.grams > 0)
                                  .map((part) => part.label || part.food)
                                  .join(", ") || "nessun elemento"
                              }`
                            : r.name}
                        </h3>
                        {[2, 4].includes(i) && balanceMissing.length > 0 && (
                          <p className="meal-balance-status">
                            Da completare: {balanceMissing.join(", ")}. Puoi cambiare o aggiungere un elemento.
                          </p>
                        )}
                        {[2, 4].includes(i) &&
                          vegetablePortion.total > 0 &&
                          !vegetablePortion.adequate && (
                            <p className="meal-balance-status">
                              Verdure {round(vegetablePortion.total)} g: quota contenuta; puoi aumentarla verso 200 g, oppure 80 g se è solo verdura a foglia.
                            </p>
                          )}
                        {!fullDishView && (
                          <div className="dish-view-actions" onClick={(e) => e.stopPropagation()}>
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
                              ↻ Cambia piatto
                            </button>
                          </div>
                        )}
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
                        ) : hasPartCards ? (
                          <>
                            {(!partSelections[key] || r.kind !== "combination") && (
                              <div className="dish-view-actions" onClick={(e) => e.stopPropagation()}>
                                {!partSelections[key] && (
                                  <button onClick={() => setMealView((current) => ({ ...current, [key]: "dish" }))}>
                                    Ricomponi piatto
                                  </button>
                                )}
                                {r.kind !== "combination" && (
                                  <button onClick={() => { setSelectedMealKey(key); setSelected(r); }}>ⓘ Ricetta</button>
                                )}
                              </div>
                            )}
                            <div className="meal-parts">
                              {activeParts
                                .map((part, partIndex) => ({ part, partIndex }))
                                .filter(({ part }) => part.grams > 0)
                                .map(({ part, partIndex }) => (
                                <div
                                  className="meal-part"
                                  key={`${part.category}-${partIndex}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <img
                                    src={part.image}
                                    alt={part.label || part.food}
                                  />
                                  <button
                                    type="button"
                                    className="part-remove"
                                    aria-label={`Rimuovi ${part.label || part.food}`}
                                    title="Rimuovi elemento"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      removeMealPartAt(key, r, partIndex);
                                    }}
                                  >
                                    −
                                  </button>
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
                          className="add-part-compact"
                          aria-label={`Aggiungi elemento a ${SLOT_LABELS[i]}`}
                          title="Aggiungi elemento"
                          onClick={(event) => {
                            event.stopPropagation();
                            startAddingMealPart(key, r, i);
                          }}
                        >
                          ＋
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
                    <b>{completedToday === activeMealSlots.length ? "Totale consumato" : "Totale aggiornato"}</b>
                  </div>
                  <small>
                    {completedToday === activeMealSlots.length
                      ? `${activeMealSlots.length} pasti registrati · bevande ed extra inclusi`
                      : `${completedToday}/${activeMealSlots.length} registrati · il resto è ancora pianificato`}
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
                      <span>
                        {x.label}
                        <small>
                          P {fmt(x.protein || 0)} · C {fmt(x.carbs || 0)} · G {fmt(x.fat || 0)} · fibre {fmt(x.fiber || 0)} g
                        </small>
                        <small>
                          {x.allergens?.length ? `Allergeni: ${x.allergens.join(", ")} · ` : ""}
                          {x.source === "RICETTA CALCOLATA" ? "stima da ricetta" : x.source === "ETICHETTA" ? "valore medio: verifica etichetta" : x.source}
                        </small>
                      </span>
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
              <div className="week-lock-actions">
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
                <button
                  className="print-preview-trigger"
                  onClick={() => setPrintPreviewOpen(true)}
                >
                  Anteprima stampa
                </button>
              </div>
            </section>
            <div className="week-kcal-summary">
              <header>
                <b>Calorie pianificate</b>
                <span>
                  media {weeklyAverageKcal} kcal · target {calories} · {weeklyKcalDelta > 0 ? "+" : ""}{weeklyKcalDelta} kcal/giorno
                </span>
              </header>
              <div>
                {weeklyPlannedKcal.map((kcal, index) => (
                  <span
                    key={days[index].label}
                    className={Math.abs(kcal - targetForDay(index)) <= targetForDay(index) * 0.1 ? "within-target" : "outside-target"}
                  >
                    <small>G{index + 1}</small>
                    <b>{kcal} <em>kcal</em></b>
                    <i>{kcal - targetForDay(index) > 0 ? "+" : ""}{kcal - targetForDay(index)} · {weeklyPlannedFiber[index]} g fibre</i>
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
                <a
                  className="weekly-source"
                  href="https://www.crea.gov.it/documents/59764/0/Dossier%2BLG%2B2017_CAP10.pdf/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Fonte ↗
                </a>
              </header>
              <div>
                {weeklyTargets.map((item) => (
                  <span key={item.label} className={item.status === "Nel range" ? "within-target" : "outside-target"}>
                    <b>{item.count}</b>
                    {item.label}
                    <small>{item.status} · {item.target}</small>
                  </span>
                ))}
              </div>
              <p>
                Le proposte successive useranno ciò che registri per aumentare
                la varietà; i riferimenti non sono obblighi clinici.
              </p>
              {consecutiveProteinRepeats > 0 && (
                <p className="weekly-protein-warning">
                  {consecutiveProteinRepeats} ripetizione consecutiva della stessa fonte proteica. La scelta manuale resta valida; puoi riequilibrare se vuoi alternative.
                </p>
              )}
              <button className="weekly-rotation-fix" type="button" onClick={rebalanceWeeklyProteinRotation}>
                Riequilibra la rotazione dei 14 pasti
              </button>
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
                  {getDayIds(i)
                    .map((id, slot) => ({ id, slot }))
                    .filter(({ slot }) => isActiveMealSlot(slot))
                    .map(({ id, slot }) => {
                    const r = recipeMap[id];
                    const key = `${i}-${slot}`;
                    const weekParts = activeMealParts(key, r)
                      .map((part, originalIndex) => ({ ...part, originalIndex }))
                      .filter((part) => part.grams > 0);
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
                                    index: part.originalIndex,
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
                            <button
                              className="week-part-add"
                              aria-label={`Aggiungi elemento a ${SLOT_LABELS[slot]} ${d.label}`}
                              onClick={() => startAddingMealPart(key, r, slot)}
                            >
                              <i>＋</i>
                            </button>
                          </div>
                        )}
                        {weekParts.length === 0 && (
                          <button
                            className="week-empty-add"
                            onClick={() => startAddingMealPart(key, r, slot)}
                          >
                            ＋
                          </button>
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
          <section className={swapTarget ? "library-section swapping" : "library-section"}>
            {swapTarget && (
              <div className="swap-back-bar">
                <button
                  type="button"
                  className="swap-back"
                  aria-label="Torna indietro senza cambiare piatto"
                  title="Torna indietro"
                  onClick={() => {
                    setSwapTarget(null);
                    setLibraryQuery("");
                    setTab(swapReturnTab);
                    scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span aria-hidden="true">←</span>
                </button>
              </div>
            )}
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
                "Sgarri",
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
            <details className="healthy-filter-panel">
              <summary>
                Filtri healthy
                {healthyFilters.length > 0 && <b>{healthyFilters.length}</b>}
              </summary>
              <div className="healthy-filter-chips">
                {HEALTHY_FILTERS.map(([id, label]) => (
                  <button
                    type="button"
                    key={id}
                    className={healthyFilters.includes(id) ? "active" : ""}
                    onClick={() =>
                      setHealthyFilters((current) =>
                        current.includes(id)
                          ? current.filter((item) => item !== id)
                          : [...current, id],
                      )
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              {healthyFilters.length > 0 && (
                <button
                  type="button"
                  className="healthy-filter-reset"
                  onClick={() => setHealthyFilters([])}
                >
                  Azzera filtri
                </button>
              )}
              <small>
                Filtri pratici sul catalogo: non attribuiscono proprietà dimagranti o terapeutiche.
                Le opzioni senza lattosio o glutine indicano compatibilità degli ingredienti registrati, non certificazione contro contaminazioni.
              </small>
            </details>
            <div className="library-tools">
              <input
                aria-label="Cerca ricetta"
                placeholder="Cerca un piatto…"
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
              />
              <b title={`${allRecipes.length} ricette totali`}>
                {filteredRecipes.length}/{allRecipes.length}
              </b>
            </div>
            {!libraryQuery && filteredRecipes.length > 0 && (
              <div className="start-here">
                <span>INIZIA DA QUI</span>
                <b>{filteredRecipes[0].name}</b>
                <div className="start-here-actions">
                  <button onClick={() => { setSelectedMealKey(null); setSelected(filteredRecipes[0]); }}>
                    {swapTarget ? "ⓘ Ricetta" : "Apri"}
                  </button>
                </div>
              </div>
            )}
            <div className="recipe-grid">
              {visibleRecipes.map((r, recipeIndex) => {
                const m = calc(r.ingredients);
                const isRecommendedSwap =
                  Boolean(swapTarget) &&
                  recipeIndex < 3 &&
                  fitsSlot(r, swapTarget?.slot ?? 0);
                return (
                  <article
                    key={r.id}
                    onClick={() => chooseRecipe(r)}
                    aria-label={swapTarget ? `Applica ${r.name}` : undefined}
                  >
                    <RecipeVisual recipe={r} />
                    <div>
                      {isRecommendedSwap && (
                        <small className="recommended-swap-label">
                          SCELTA CONSIGLIATA
                        </small>
                      )}
                      <span>
                        {r.course || recipeCuisine(r)} · {round(m.kcal)} kcal ·{" "}
                        {r.time} min
                      </span>
                      <h3>{r.name}</h3>
                      <p>{cleanKicker(r.kicker)}</p>
                      <small className="recipe-card-quality">
                        Varietà {recipeVarietyScore(r)}/5
                        {recipeSeasonalityScore(r) > 0 ? ` · stagione ${recipeSeasonalityScore(r)}%` : ""}
                        {` · ${budgetLabel(r)}`}
                      </small>
                    </div>
                    {swapTarget && (
                      <button
                        className="recipe-card-info"
                        aria-label={`Vedi la ricetta di ${r.name}`}
                        title="Vedi ricetta"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedMealKey(null);
                          setSelected(r);
                        }}
                      >
                        i
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
            {visibleRecipeCount < filteredRecipes.length && (
              <button
                type="button"
                className="library-more"
                onClick={() => setVisibleRecipeCount((count) => count + 10)}
              >
                Mostra altre 10 ricette
              </button>
            )}
            {filteredRecipes.length > 10 && (
              <button
                type="button"
                className="library-more secondary"
                onClick={() => {
                  setCompatibleRecipePage((page) => page + 1);
                  setVisibleRecipeCount(10);
                  scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Genera altre ricette compatibili
              </button>
            )}
            {swapTarget && (
              <div className="swap-food-catalog">
                <div className="swap-food-heading">
                  <span>CATALOGO COMPLETO</span>
                  <b>{swapFoodOptions.length} alimenti</b>
                </div>
                <p>Scegli anche un singolo alimento; dopo puoi aggiungere liberamente gli altri componenti.</p>
                <div className="swap-food-grid">
                  {swapFoodOptions.map((part) => (
                    <button key={part.food} onClick={() => chooseSingleFoodFromLibrary(part)}>
                      <img src={part.image} alt={part.label || part.food} />
                      <span>{part.label || part.food}</span>
                      <b>{part.grams} g · {round(calc([part]).kcal)} kcal</b>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
        {tab === "builder" && (
          <section>
            <span className="eyebrow">LABORATORIO DEL PIATTO</span>
            <h1 className="page-title">Crea con gli ingredienti che hai</h1>
            <p className="page-lead">
              Inserisci alimenti e grammi: ottieni una ricetta completa da zero,
              con preparazione e valori aggiornati.
            </p>
            <div className="builder-settings">
              <label>
                <span>Tempo massimo</span>
                <select value={builderTime} onChange={(event) => setBuilderTime(Number(event.target.value))}>
                  {[10, 15, 20, 30, 45].map((minutes) => (
                    <option key={minutes} value={minutes}>{minutes} minuti</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Preparazione</span>
                <select value={builderMethod} onChange={(event) => setBuilderMethod(event.target.value)}>
                  {["Padella e pentola", "Senza cottura", "Forno", "Vapore"].map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </label>
            </div>
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
                setBuilder((v) => [...v, { food: "Cetrioli", grams: 100 }])
              }
            >
              ＋ Aggiungi ingrediente
            </button>
            <button className="primary-btn builder-generate" onClick={generateBuilderRecipe}>
              Crea la ricetta con questi ingredienti
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
            {builderBalanceNotes.length > 0 && (
              <div className="tip-card builder-balance-note">
                <b>Per completare il piatto</b>
                <p>{builderBalanceNotes.join(" · ")}.</p>
              </div>
            )}
            {generatedBuilderRecipe && (
              <article className="generated-builder-card">
                <RecipeVisual recipe={generatedBuilderRecipe} />
                <div>
                  <span>RICETTA GENERATA</span>
                  <h2>{generatedBuilderRecipe.name}</h2>
                  <p>{generatedBuilderRecipe.time} min · {round(calc(generatedBuilderRecipe.ingredients).kcal)} kcal</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMealKey(null);
                      setSelected(generatedBuilderRecipe);
                    }}
                  >
                    Vedi preparazione completa
                  </button>
                </div>
              </article>
            )}
            <details className="leftover-builder">
              <summary>Crea una ricetta con gli avanzi</summary>
              <p>Prima verifica data e conservazione. Se i dati non sono sicuri, l'app non genera la ricetta.</p>
              <div className="leftover-fields">
                <label className="wide">
                  <span>Alimento avanzato</span>
                  <select value={leftoverFood} onChange={(event) => setLeftoverFood(event.target.value)}>
                    {Object.keys(foodSearchDatabase).sort((a, b) => a.localeCompare(b, "it")).map((food) => (
                      <option key={food}>{food}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Quantità</span>
                  <div className="leftover-number">
                    <input type="number" min="1" max="1500" value={leftoverGrams} onChange={(event) => setLeftoverGrams(Number(event.target.value))} />
                    <i>g</i>
                  </div>
                </label>
                <label>
                  <span>Stato</span>
                  <select value={leftoverState} onChange={(event) => setLeftoverState(event.target.value as "Cotto" | "Crudo")}>
                    <option>Cotto</option>
                    <option>Crudo</option>
                  </select>
                </label>
                <label>
                  <span>Preparato il</span>
                  <input type="date" value={leftoverDate} onChange={(event) => setLeftoverDate(event.target.value)} />
                </label>
                <label>
                  <span>Conservazione</span>
                  <select value={leftoverStorage} onChange={(event) => setLeftoverStorage(event.target.value)}>
                    <option>Frigorifero entro 2 ore</option>
                    <option>Lasciato a temperatura ambiente</option>
                    <option>Non ricordo</option>
                  </select>
                </label>
              </div>
              <button className="primary-btn" type="button" onClick={generateLeftoverRecipe}>
                Verifica e crea ricetta anti-spreco
              </button>
              {leftoverWarning && (
                <p className={leftoverResult ? "leftover-status ok" : "leftover-status stop"}>{leftoverWarning}</p>
              )}
              {leftoverResult && (
                <article className="generated-builder-card">
                  <RecipeVisual recipe={leftoverResult} />
                  <div>
                    <span>AVANZO VERIFICATO</span>
                    <h2>{leftoverResult.name}</h2>
                    <p>{round(calc(leftoverResult.ingredients).kcal)} kcal · {leftoverResult.time} min</p>
                    <button type="button" onClick={() => { setSelectedMealKey(null); setSelected(leftoverResult); }}>
                      Vedi preparazione completa
                    </button>
                  </div>
                </article>
              )}
            </details>
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
              .filter((x) => isActiveMealSlot(x.slot) && completed[x.key]);
            const coffeeCount = (drinks[diaryDay] || []).filter((x) =>
              x.label.includes("Caffè"),
            ).length;
            return (
              <section>
                <span className="eyebrow">DIARIO</span>
                <h1 className="page-title">{days[diaryDay].label}</h1>
                <label className="history-consent">
                  <input
                    type="checkbox"
                    checked={historyConsent}
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      setHistoryConsent(enabled);
                      if (!enabled) {
                        setCompleted({});
                        setCompletedRecipes({});
                        setActualWeights({});
                        setDrinks({});
                        setExtras({});
                      }
                    }}
                  />
                  <span>
                    <b>Salva lo storico su questo dispositivo</b>
                    <small>{historyConsent ? "Attivo · puoi revocarlo quando vuoi" : "Disattivo · la sessione non viene conservata"}</small>
                  </span>
                </label>
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
                    <span>{targetDefined ? "Target" : "Esempio"}</span>
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
                      <img src={d.image} alt="" aria-hidden="true" />
                      <span>＋ {d.label}</span>
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
                      {x.image && <img src={x.image} alt="" aria-hidden="true" />}
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
                    const n = activeMealSlots.filter(
                      (slot) => completed[`${i}-${slot}`],
                    ).length;
                    const dayLogged = loggedTotal(i);
                    return (
                      <div key={d.label}>
                        <span>{d.label}</span>
                        <div>
                          <i style={{ width: `${(n / activeMealSlots.length) * 100}%` }} />
                        </div>
                        <b>{dayLogged ? `${round(dayLogged)}k` : `${n}/${activeMealSlots.length}`}</b>
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
                <span>{partPicker.adding ? "AGGIUNGI AL PASTO" : "CAMBIA UNA PARTE"}</span>
                <h2>
                  {partPicker.adding
                    ? "Scegli un altro elemento"
                    : partPicker.part.label || partPicker.part.food}
                </h2>
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
              {!partPicker.adding && (
                <button className="remove-part-choice" onClick={removeMealPart}>
                  − Nessuno · togli questo elemento
                </button>
              )}
              {!partPicker.adding && (
                <details className="picker-group complete-meals" open>
                <summary>Piatti completi consigliati</summary>
                <p>Sostituisci l'intero pasto. Dopo puoi tenerlo unico o dividerlo nei suoi componenti.</p>
                <div className="complete-meal-grid">
                  {completeMealOptions(partPicker.key).map((recipe, optionIndex) => {
                    const macros = calc(recipe.ingredients);
                    return (
                      <article key={recipe.id}>
                        <button
                          className="complete-meal-select"
                          onClick={() => chooseCompleteMeal(recipe)}
                        >
                          <RecipeVisual recipe={recipe} />
                          <span>{recipe.name}</span>
                          <b>{round(macros.kcal)} kcal · {recipe.time} min</b>
                        </button>
                        <div className="complete-meal-card-actions">
                          {optionIndex < 3 ? (
                            <small
                              className={
                                optionIndex === 0
                                  ? "complete-meal-recommended primary"
                                  : "complete-meal-recommended"
                              }
                            >
                              {optionIndex === 0
                                ? "Prima scelta"
                                : "Scelta consigliata"}
                            </small>
                          ) : (
                            <span aria-hidden="true" />
                          )}
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
                        </div>
                      </article>
                    );
                  })}
                </div>
                </details>
              )}
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
              {!partPicker.adding && (
                <details className="picker-group cheat-picker-group">
                  <summary>Sgarri</summary>
                  <p>Scelte occasionali: restano conteggiate nel totale reale, senza punizioni.</p>
                  <div className="complete-meal-grid">
                    {occasionalRecipes
                      .filter((recipe) => fitsSlot(recipe, Number(partPicker.key.split("-")[1])))
                      .map((recipe) => {
                        const macros = calc(recipe.ingredients);
                        return (
                          <article key={recipe.id}>
                            <button
                              className="complete-meal-select"
                              onClick={() => {
                                if (recipe.id === "occasional-gelato") {
                                  setGelatoComposerOpen(true);
                                  return;
                                }
                                setGelatoComposerOpen(false);
                                chooseCompleteMeal(recipe);
                              }}
                            >
                              <RecipeVisual recipe={recipe} />
                              <span>{recipe.name}</span>
                              <b>{round(macros.kcal)} kcal · {recipe.time} min</b>
                              
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
                  {gelatoComposerOpen && [1, 3].includes(Number(partPicker.key.split("-")[1])) && (
                    <div className="gelato-builder">
                      <div className="gelato-builder-title">
                        <b>Componi il gelato</b>
                        <button type="button" aria-label="Chiudi composizione gelato" onClick={() => setGelatoComposerOpen(false)}>×</button>
                      </div>
                      <div className="gelato-scoops">
                        {[2, 3].map((count) => (
                          <button
                            type="button"
                            className={gelatoScoops === count ? "active" : ""}
                            key={count}
                            onClick={() => setGelatoScoops(count as 2 | 3)}
                          >
                            {count} palline
                          </button>
                        ))}
                      </div>
                      {Array.from({ length: gelatoScoops }).map((_, index) => (
                        <select
                          aria-label={`Gusto pallina ${index + 1}`}
                          key={index}
                          value={gelatoFlavors[index]}
                          onChange={(event) =>
                            setGelatoFlavors((current) => {
                              const next = [...current];
                              next[index] = event.target.value;
                              return next;
                            })
                          }
                        >
                          {GELATO_FLAVORS.map((flavor) => (
                            <option key={flavor} value={flavor}>
                              {flavor.replace("Gelato ", "")}
                            </option>
                          ))}
                        </select>
                      ))}
                      <button type="button" className="gelato-choose" onClick={chooseConfiguredGelato}>
                        Scegli · {round(calc(gelatoFlavors.slice(0, gelatoScoops).map((food) => ({ food, grams: 60 }))).kcal)} kcal
                      </button>
                    </div>
                  )}
                </details>
              )}
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
            {swapTarget && !selectedMealKey ? (
              <button
                type="button"
                className="recipe-preview-photo-select"
                aria-label={`Applica ${selected.name}`}
                onClick={() => chooseRecipe(selected)}
              >
                <RecipeVisual recipe={selected} />
              </button>
            ) : (
              <RecipeVisual recipe={selected} />
            )}
            <div className="recipe-content">
              <span className="eyebrow">DA ZERO · {selected.time} MIN</span>
              <h2>{selected.name}</h2>
              {internationalInspirationNote(selected) && (
                <p className="recipe-inspiration-note">{internationalInspirationNote(selected)}</p>
              )}
              <p className="standard-portion-note">
                {ageGroup === "Minore"
                  ? "Porzioni standard per adulti non applicabili ai minori · chiedere al professionista sanitario"
                  : targetDefined
                    ? `Target indicato dall’utente · ${peopleCount} ${peopleCount === 1 ? "persona" : "persone"}`
                    : `Porzioni standard non personalizzate · ${peopleCount} ${peopleCount === 1 ? "persona" : "persone"}`}
              </p>
              <p className="nutrition-variability-note">
                Valori nutrizionali stimati: alimenti, marche e cottura possono variare. Verifica etichetta e peso effettivo.
              </p>
              <p className="recipe-quality-note">
                Indice varietà {recipeVarietyScore(selected)}/5
                {recipeSeasonalityScore(selected) > 0 ? ` · stagione ${recipeSeasonalityScore(selected)}%` : ""}
                {" · indicatore descrittivo, non voto sanitario"}
              </p>
              <p className="recipe-balance-note">
                <b>Composizione</b> {recipeBalanceSummary(selected)}
              </p>
              <div className="recipe-allergen-note">
                <b>Allergeni rilevati</b>
                <span>{recipeAllergens(selected).join(", ") || "nessuno tra quelli mappati"}</span>
                <small>Controlla sempre etichetta, certificazione e possibili contaminazioni. “Adattabile” non significa certificato senza allergeni.</small>
              </div>
              <div className="recipe-meta-chips">
                <span>Difficoltà: {selected.difficulty}</span>
                {(selected.methods || []).map((method) => <span key={method}>{method}</span>)}
                {(selected.tags || []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
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
              <div className="recipe-utility-actions">
                <button type="button" onClick={() => copyRecipe(selected)}>
                  Copia ricetta
                </button>
                <button type="button" onClick={() => addRecipeToShopping(selected)}>
                  Aggiungi alla lista della spesa
                </button>
              </div>
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
                    <span>
                      {x.label || x.food}
                      <small className="ingredient-weight-state">peso {ingredientWeightState(x.food)}</small>
                    </span>
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
                {selected.alternatives.filter(isAlternativeAllowed).map((x) => (
                  <span key={x}>{x}</span>
                ))}
                {selected.alternatives.some((x) => !isAlternativeAllowed(x)) && (
                  <small>Alternative incompatibili con il profilo nascoste.</small>
                )}
              </div>
              {selected.sourceUrl && selected.sourceLabel && (
                <a
                  className="recipe-source"
                  href={selected.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Fonte verificata: {selected.sourceLabel} ↗
                </a>
              )}
            </div>
          </article>
        </div>
      )}
      {printPreviewOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setPrintPreviewOpen(false)}
        >
          <article
            className="print-preview-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="print-preview-header">
              <div>
                <span>ANTEPRIMA SETTIMANALE</span>
                <h2>Menu, quantità e nutrienti</h2>
              </div>
              <button
                type="button"
                aria-label="Chiudi anteprima stampa"
                onClick={() => setPrintPreviewOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="print-preview-summary">
              <b>Media {weeklyAverageKcal} kcal al giorno</b>
              <span>{weeklyAverageFiber} g fibre/giorno</span>
              <small>Valori stimati: marche, cottura e peso effettivo possono variare.</small>
            </div>
            <div className="print-preview-days">
              {days.map((day, dayNumber) => {
                const dayIds = getDayIds(dayNumber);
                return (
                  <section key={day.label} className="print-day">
                    <header>
                      <b>{day.label}</b>
                      <span>
                        {weeklyPlannedKcal[dayNumber]} kcal ·{" "}
                        {weeklyPlannedFiber[dayNumber]} g fibre
                      </span>
                    </header>
                    {dayIds
                      .map((recipeId, slot) => ({ recipeId, slot }))
                      .filter(({ slot }) => isActiveMealSlot(slot))
                      .map(({ recipeId, slot }) => {
                      const key = `${dayNumber}-${slot}`;
                      const recipe = recipeMap[recipeId];
                      const ingredients = plannedIngredients(key, recipe);
                      const mealMacros = calc(ingredients);
                      return (
                        <div className="print-meal" key={key}>
                          <div className="print-meal-title">
                            <span>{SLOT_LABELS[slot]}</span>
                            <b>{recipe.name}</b>
                            <i>{round(mealMacros.kcal)} kcal</i>
                          </div>
                          <div className="print-food-head" aria-hidden="true">
                            <span>Alimento</span>
                            <span>g</span>
                            <span>kcal</span>
                            <span>P</span>
                            <span>C</span>
                            <span>G</span>
                          </div>
                          {ingredients.map((ingredient, ingredientIndex) => {
                            const nutrient = calc([ingredient]);
                            return (
                              <div
                                className="print-food-row"
                                key={`${ingredient.food}-${ingredientIndex}`}
                              >
                                <span>
                                  {ingredient.label || ingredient.food}
                                  <small>peso {ingredientWeightState(ingredient.food)}</small>
                                </span>
                                <b>{ingredient.grams}</b>
                                <i>{round(nutrient.kcal)}</i>
                                <i>{fmt(nutrient.protein)}</i>
                                <i>{fmt(nutrient.carbs)}</i>
                                <i>{fmt(nutrient.fat)}</i>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </div>
            <footer className="print-preview-actions">
              <button onClick={() => setPrintPreviewOpen(false)}>Chiudi</button>
              <button type="button" onClick={copyWeeklyPlan}>Copia tutto</button>
              <button type="button" onClick={exportWeeklyTxt}>TXT</button>
              <button type="button" onClick={exportWeeklyCsv}>CSV</button>
              <button type="button" onClick={exportWeeklyWord}>Word</button>
              <button type="button" onClick={() => window.print()}>Stampa</button>
            </footer>
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
