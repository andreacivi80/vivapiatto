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
  return Object.fromEntries(fields.map((field) => [field, state[field] ?? null]));
}
