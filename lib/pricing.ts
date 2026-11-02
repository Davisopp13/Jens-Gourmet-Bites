import type { Ingredient, MeasurementUnit, RecipeWithIngredients } from "./types";

const conversion: Record<MeasurementUnit, [string, number]> = {
  g: ["mass", 1], kg: ["mass", 1000], oz: ["mass", 28.349523125], lb: ["mass", 453.59237],
  ml: ["volume", 1], l: ["volume", 1000], tsp: ["volume", 4.92892159375], tbsp: ["volume", 14.78676478125], cup: ["volume", 236.5882365], count: ["count", 1],
};
export function convertQuantity(quantity: number, from: MeasurementUnit, to: MeasurementUnit): number {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Enter a positive quantity.");
  if (!conversion[from] || !conversion[to] || conversion[from][0] !== conversion[to][0]) throw new Error(`Cannot convert ${from} to ${to}. Use matching weight or volume units in the recipe.`);
  return quantity * conversion[from][1] / conversion[to][1];
}
export function recipeCost(recipe: RecipeWithIngredients, ingredients?: Ingredient[]) {
  if (!recipe.recipe_ingredients?.length) throw new Error("Add ingredients to this recipe before pricing it.");
  if (!Number.isInteger(recipe.batch_size) || recipe.batch_size <= 0) throw new Error("Recipe yield must be a positive whole number.");
  const lines = recipe.recipe_ingredients.map(line => {
    const ingredient = ingredients?.find(i => i.id === line.ingredient_id) ?? line.ingredient;
    if (!ingredient || ingredient.package_quantity <= 0 || !Number.isFinite(Number(ingredient.package_quantity)) || ingredient.current_price_cents < 0) throw new Error("An ingredient is missing a valid package cost.");
    const quantity = convertQuantity(Number(line.quantity), line.unit, ingredient.unit);
    return { name: ingredient.name, quantity: Number(line.quantity), unit: line.unit, costCents: quantity / Number(ingredient.package_quantity) * ingredient.current_price_cents };
  });
  return { lines, total: lines.reduce((sum, line) => sum + line.costCents, 0) };
}
export interface WorkbenchInputs { packs: number; packSize: number; packaging: number; minutes: number; hourly: number; overhead: number; waste: number; margin: number; selling: number }
export function calculateOrder(recipe: RecipeWithIngredients, ingredients: Ingredient[], values: WorkbenchInputs) {
  for (const [key, value] of Object.entries(values)) if (!Number.isFinite(value) || value < 0) throw new Error(`Enter a valid ${key}.`);
  if (!Number.isInteger(values.packs) || values.packs < 1 || !Number.isInteger(values.packSize) || values.packSize < 1 || values.margin >= 100) throw new Error("Use whole packs, a positive pack size and a margin below 100%.");
  const cost = recipeCost(recipe, ingredients);
  const sold = values.packs * values.packSize;
  const batches = Math.ceil(sold / recipe.batch_size);
  const ingredientCents = cost.total * batches;
  const packagingCents = values.packaging * 100 * values.packs;
  const laborCents = values.minutes / 60 * values.hourly * 100;
  const total = Math.round(ingredientCents + packagingCents + laborCents + (values.overhead + values.waste) * 100);
  const revenue = Math.round(values.selling * 100);
  return { total, ingredientCents, packagingCents, laborCents, batches, sold, leftovers: batches * recipe.batch_size - sold, suggested: Math.ceil(total / (1 - values.margin / 100)), profit: revenue - total, achieved: revenue > 0 ? (revenue - total) / revenue * 100 : null, lines: cost.lines };
}
