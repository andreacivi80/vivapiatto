// Kept self-contained so the same reader can run in the isolated audit page.
export function capturePersistedPlanState(raw) {
  const state = JSON.parse(raw || "null");
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("Stato persistente del piano non disponibile");
  }
  const fields = [
    "calories", "targetDefined", "goal", "historyConsent", "choices",
    "completed", "completedRecipes", "actualWeights", "removedIngredients",
    "partSelections", "mealView", "check", "excludedGroups", "allergyGroups",
    "intoleranceGroups", "healthConditions", "dislikedFoods", "drinks", "extras",
    "groceryChecked", "groceryAmounts", "shoppingAdditions", "plannedDrink",
    "dayContext", "restaurantArea", "weekLocked", "weekPreference", "cuisineChoice",
    "healthyFilters", "peopleCount", "ageGroup", "foodStyle", "dailyMeals",
    "maxPrepTime", "availableEquipment", "budgetLevel", "breakfastStyle",
    "mealPrepMode", "dayIndex", "diaryDay", "builder",
  ];
  const captured = Object.fromEntries(fields.map((field) => [field, state[field] ?? null]));
  const selections = captured.partSelections;
  if (selections && typeof selections === "object" && !Array.isArray(selections)) {
    captured.partSelections = Object.fromEntries(Object.entries(selections).map(([key, parts]) => [
      key,
      Array.isArray(parts) ? parts.map((part) => {
        // Do not whitelist fields or discard unexpected shapes/data. Only known
        // presentation metadata of an actual saved MealPart is canonicalized.
        if (!part || typeof part !== "object" || Array.isArray(part) ||
            typeof part.food !== "string" || typeof part.grams !== "number" ||
            !Number.isFinite(part.grams)) return part;
        const normalized = { ...part };
        // A new bundle intentionally refreshes these catalog-derived photo URLs.
        // Unexpected non-string values remain visible to the equality check.
        if (typeof normalized.image === "string") delete normalized.image;
        if (!Object.prototype.hasOwnProperty.call(part, "occasionalCollapsed") ||
            typeof part.occasionalCollapsed === "boolean") {
          normalized.occasionalCollapsed = part.occasionalCollapsed === true;
        }
        return normalized;
      }) : parts,
    ]));
  }
  return captured;
}
