/**
 * Standalone history model. FoodPlanner does not use this module yet.
 * Every value comes from the caller's consumed meal, never a current catalogue,
 * calorie target, clock, timezone guess or positional legacy-weight migration.
 */
export type MealFactsPer100 = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source?: string;
  weightState?: string;
};

export type MealHistoryIngredient = {
  food: string;
  label?: string;
  grams: number;
  factsPer100: MealFactsPer100;
};

export type MealSnapshotTotals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Missing fibre data is unknown, not a silently invented zero. */
  fiber: number | null;
};

export type MealHistorySnapshotInput = {
  id: string;
  planSlotKey: string;
  recipeId: string;
  recipeName: string;
  recordedAtISO: string;
  /** Local consumption date supplied explicitly, including backdated entries. */
  consumedOn: string;
  sourceVersion: string;
  ingredients: readonly MealHistoryIngredient[];
};

export type MealHistorySnapshot = Omit<MealHistorySnapshotInput, "ingredients"> & {
  schema: 1;
  status: "recorded" | "voided";
  ingredients: MealHistoryIngredient[];
  totals: MealSnapshotTotals;
};

export type MealHistoryResolution =
  | { status: "resolved"; snapshot: MealHistorySnapshot }
  | {
      status: "needsReview";
      reason: "legacy-without-snapshot" | "invalid-snapshot";
      raw: unknown;
    };

const inputKeys = [
  "id", "planSlotKey", "recipeId", "recipeName", "recordedAtISO", "consumedOn",
  "sourceVersion", "ingredients",
] as const;
const nutrientKeys = ["kcal", "protein", "carbs", "fat"] as const;

function invalid(field: string): never {
  throw new Error(`Invalid meal history: ${field}`);
}

const objectValue = (value: unknown, field: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(field);
  return value as Record<string, unknown>;
};

const exactKeys = (
  value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = [],
) => {
  if (required.some((key) => !Object.hasOwn(value, key)) ||
      Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key))) {
    invalid("fields");
  }
};

const textValue = (value: unknown, field: string, maximum = 512): string => {
  if (typeof value !== "string" || !value.trim() || value.length > maximum || /[\x00-\x1f\x7f]/.test(value)) invalid(field);
  return value as string;
};

const nonnegative = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) invalid(field);
  return value === 0 ? 0 : value as number;
};

const isLocalDate = (value: string): boolean => {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  if (year < 1 || month < 1 || month > 12) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= days[month - 1];
};

const localDateValue = (value: unknown): string => {
  const date = textValue(value, "consumedOn", 10);
  if (!isLocalDate(date)) invalid("consumedOn");
  return date;
};

const recordedDateValue = (value: unknown): string => {
  const timestamp = textValue(value, "recordedAtISO", 48);
  const match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.[0-9]{1,9})?(Z|[+-]([0-9]{2}):([0-9]{2}))$/.exec(timestamp);
  if (!match || !isLocalDate(match[1]) || Number(match[2]) > 23 ||
      Number(match[3]) > 59 || Number(match[4]) > 59 ||
      (match[5] !== "Z" && (Number(match[6]) > 23 || Number(match[7]) > 59))) {
    invalid("recordedAtISO");
  }
  // Preserve the explicit caller timestamp, not its inferred UTC calendar day.
  return timestamp;
};

const factsValue = (value: unknown): MealFactsPer100 => {
  const facts = objectValue(value, "factsPer100");
  exactKeys(facts, nutrientKeys, ["fiber", "source", "weightState"]);
  const result: MealFactsPer100 = {
    kcal: nonnegative(facts.kcal, "kcal"),
    protein: nonnegative(facts.protein, "protein"),
    carbs: nonnegative(facts.carbs, "carbs"),
    fat: nonnegative(facts.fat, "fat"),
  };
  if (facts.fiber !== undefined) result.fiber = nonnegative(facts.fiber, "fiber");
  if (facts.source !== undefined) result.source = textValue(facts.source, "source", 1024);
  if (facts.weightState !== undefined) result.weightState = textValue(facts.weightState, "weightState", 256);
  return result;
};

const ingredientValue = (value: unknown): MealHistoryIngredient => {
  const ingredient = objectValue(value, "ingredient");
  exactKeys(ingredient, ["food", "grams", "factsPer100"], ["label"]);
  const result: MealHistoryIngredient = {
    food: textValue(ingredient.food, "food"),
    grams: nonnegative(ingredient.grams, "grams"),
    factsPer100: factsValue(ingredient.factsPer100),
  };
  if (ingredient.label !== undefined) result.label = textValue(ingredient.label, "label", 1024);
  return result;
};

const ingredientsValue = (value: unknown): MealHistoryIngredient[] => {
  if (!Array.isArray(value) || !value.length || value.length > 256) invalid("ingredients");
  return Array.from(value as unknown[], ingredientValue);
};

const totalsForIngredients = (ingredients: readonly MealHistoryIngredient[]): MealSnapshotTotals => {
  const totals: MealSnapshotTotals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const ingredient of ingredients) {
    const factor = ingredient.grams / 100;
    for (const key of nutrientKeys) {
      totals[key] += ingredient.factsPer100[key] * factor;
      if (!Number.isFinite(totals[key])) invalid("totals-overflow");
    }
    if (ingredient.factsPer100.fiber === undefined) totals.fiber = null;
    else if (totals.fiber !== null) {
      totals.fiber += ingredient.factsPer100.fiber * factor;
      if (!Number.isFinite(totals.fiber)) invalid("totals-overflow");
    }
  }
  // No integer rounding: presentation is distinct from the stored calculation.
  return totals;
};

const inputValue = (value: unknown): MealHistorySnapshotInput => {
  const input = objectValue(value, "snapshot-input");
  exactKeys(input, inputKeys);
  return {
    id: textValue(input.id, "id", 256),
    planSlotKey: textValue(input.planSlotKey, "planSlotKey", 256),
    recipeId: textValue(input.recipeId, "recipeId", 256),
    recipeName: textValue(input.recipeName, "recipeName", 1024),
    recordedAtISO: recordedDateValue(input.recordedAtISO),
    consumedOn: localDateValue(input.consumedOn),
    sourceVersion: textValue(input.sourceVersion, "sourceVersion", 128),
    ingredients: ingredientsValue(input.ingredients),
  };
};

/** Capture a new record. Every ingredient and facts object is copied. */
export const createMealHistorySnapshot = (input: MealHistorySnapshotInput): MealHistorySnapshot => {
  const saved = inputValue(input);
  return { schema: 1, ...saved, status: "recorded", ingredients: [...saved.ingredients], totals: totalsForIngredients(saved.ingredients) };
};

/** Validate a persisted schema-1 record without consulting a newer database. */
export const parseMealHistorySnapshot = (value: unknown): MealHistorySnapshot => {
  const record = objectValue(value, "snapshot");
  exactKeys(record, [...inputKeys, "schema", "status", "totals"]);
  if (record.schema !== 1 || (record.status !== "recorded" && record.status !== "voided")) invalid("schema-or-status");
  const fields = Object.fromEntries(inputKeys.map((key) => [key, record[key]]));
  const saved = inputValue(fields);
  const computed = totalsForIngredients(saved.ingredients);
  const stored = objectValue(record.totals, "totals");
  exactKeys(stored, [...nutrientKeys, "fiber"]);
  for (const key of nutrientKeys) {
    if (nonnegative(stored[key], `totals-${key}`) !== computed[key]) invalid("totals-mismatch");
  }
  if (stored.fiber !== computed.fiber) invalid("totals-fiber-mismatch");
  return { schema: 1, ...saved, status: record.status, ingredients: [...saved.ingredients], totals: computed };
};

export const calculateMealSnapshotTotals = (snapshot: unknown): MealSnapshotTotals =>
  ({ ...parseMealHistorySnapshot(snapshot).totals });

/** Difference is right minus left. Unknown fibre stays unknown in comparisons. */
export const compareMealHistorySnapshots = (left: unknown, right: unknown): {
  sameIngredients: boolean;
  delta: MealSnapshotTotals;
} => {
  const before = parseMealHistorySnapshot(left), after = parseMealHistorySnapshot(right);
  return {
    sameIngredients: JSON.stringify(before.ingredients) === JSON.stringify(after.ingredients),
    delta: {
      kcal: after.totals.kcal - before.totals.kcal,
      protein: after.totals.protein - before.totals.protein,
      carbs: after.totals.carbs - before.totals.carbs,
      fat: after.totals.fat - before.totals.fat,
      fiber: before.totals.fiber === null || after.totals.fiber === null ? null : after.totals.fiber - before.totals.fiber,
    },
  };
};

/** Explicit user correction, using the record's original facts, never today's. */
export const editMealHistoryIngredientGrams = (
  snapshot: unknown, ingredientIndex: number, grams: number,
): MealHistorySnapshot => {
  const saved = parseMealHistorySnapshot(snapshot);
  if (!Number.isInteger(ingredientIndex) || ingredientIndex < 0 || ingredientIndex >= saved.ingredients.length) invalid("ingredient-index");
  saved.ingredients[ingredientIndex].grams = nonnegative(grams, "grams");
  saved.totals = totalsForIngredients(saved.ingredients);
  return saved;
};

const slotIdentity = (snapshot: MealHistorySnapshot) => JSON.stringify([snapshot.consumedOn, snapshot.planSlotKey]);
const historyValue = (value: readonly unknown[]): MealHistorySnapshot[] => {
  if (!Array.isArray(value)) invalid("history");
  const records = value.map(parseMealHistorySnapshot);
  const ids = new Set<string>(), activeSlots = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) invalid("duplicate-record-id");
    ids.add(record.id);
    if (record.status === "recorded") {
      const slot = slotIdentity(record);
      if (activeSlots.has(slot)) invalid("duplicate-recorded-slot");
      activeSlots.add(slot);
    }
  }
  return records;
};

/** Duplicate IDs/active slots are errors, not an instruction to overwrite. */
export const insertMealHistorySnapshot = (history: readonly unknown[], snapshot: unknown): MealHistorySnapshot[] => {
  const records = historyValue(history), added = parseMealHistorySnapshot(snapshot);
  if (records.some((record) => record.id === added.id)) invalid("duplicate-record-id");
  if (added.status === "recorded" && records.some((record) => record.status === "recorded" && slotIdentity(record) === slotIdentity(added))) invalid("duplicate-recorded-slot");
  return [...records, added];
};

/** Undo/redo changes status only; the original meal remains available intact. */
export const setMealHistorySnapshotRecorded = (
  history: readonly unknown[], id: string, recorded: boolean,
): MealHistorySnapshot[] => {
  const records = historyValue(history);
  if (typeof recorded !== "boolean") invalid("recorded");
  const record = records.find((entry) => entry.id === id);
  if (!record) invalid("record-not-found");
  if (recorded && records.some((entry) => entry.id !== id && entry.status === "recorded" && slotIdentity(entry) === slotIdentity(record))) invalid("duplicate-recorded-slot");
  record.status = recorded ? "recorded" : "voided";
  return records;
};

export const toggleMealHistorySnapshot = (history: readonly unknown[], id: string): MealHistorySnapshot[] => {
  const records = historyValue(history);
  const record = records.find((entry) => entry.id === id);
  if (!record) invalid("record-not-found");
  return setMealHistorySnapshotRecorded(records, id, record.status !== "recorded");
};

/**
 * Legacy IDs and positional weights cannot recover a lost historical recipe.
 * Preserve the raw evidence for review; do not add foods or infer consumption.
 */
export const resolveMealHistoryRecord = (value: unknown): MealHistoryResolution => {
  const schemaOne = Boolean(value && typeof value === "object" && (value as Record<string, unknown>).schema === 1);
  try {
    return { status: "resolved", snapshot: parseMealHistorySnapshot(value) };
  } catch {
    let raw: unknown;
    try { raw = structuredClone(value); }
    catch {
      // Host values/functions cannot be made serializable without losing data.
      // Retain them as opaque evidence, never as an accepted/migrated snapshot.
      raw = value;
    }
    return {
      status: "needsReview",
      reason: schemaOne ? "invalid-snapshot" : "legacy-without-snapshot",
      raw,
    };
  }
};
