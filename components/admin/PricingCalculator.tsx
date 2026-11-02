"use client";

import { useState } from "react";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { RecipeWithIngredients, RecipeCostSummary, PricingCalculation } from "@/lib/types";

interface PricingCalculatorProps {
  recipes: RecipeWithIngredients[];
  summary: RecipeCostSummary[];
}

export default function PricingCalculator({ recipes, summary }: PricingCalculatorProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [targetMargin, setTargetMargin] = useState<number>(50);
  const [calculation, setCalculation] = useState<PricingCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleCalculate = async () => {
    if (!selectedRecipeId) return;

    setIsCalculating(true);
    try {
      const response = await fetch("/api/admin/calculate-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_ids: [selectedRecipeId],
          target_profit_margin: targetMargin,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.calculations && data.calculations.length > 0) {
          setCalculation(data.calculations[0]);
        }
      } else {
        alert("Failed to calculate pricing");
      }
    } catch (error) {
      console.error("Error calculating pricing:", error);
      alert("Error calculating pricing");
    } finally {
      setIsCalculating(false);
    }
  };

  const selectedSummary = summary.find((s) => s.recipe_id === selectedRecipeId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Price Calculator</h2>
        <p className="text-sm text-gray-500 mt-1">
          Calculate suggested pricing based on ingredient costs and target profit
          margin
        </p>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No recipes available. Create recipes first to use the price calculator.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Input Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Recipe
                </label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => {
                    setSelectedRecipeId(e.target.value);
                    setCalculation(null);
                  }}
                  className="input"
                >
                  <option value="">Choose a recipe...</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name} ({recipe.product?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Profit Margin (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-semibold text-gray-900 w-16 text-right">
                    {targetMargin}%
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={!selectedRecipeId || isCalculating}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              {isCalculating ? "Calculating..." : "Calculate Pricing"}
            </button>
          </div>

          {/* Current Stats (if available) */}
          {selectedSummary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Current Pricing Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-blue-600 uppercase tracking-wide">
                    Batch Cost
                  </p>
                  <p className="text-lg font-semibold text-blue-900 mt-1">
                    {formatCurrency(selectedSummary.total_cost_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 uppercase tracking-wide">
                    Cost Per Cookie
                  </p>
                  <p className="text-lg font-semibold text-blue-900 mt-1">
                    {formatCurrency(selectedSummary.cost_per_cookie_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 uppercase tracking-wide">
                    Current Price
                  </p>
                  <p className="text-lg font-semibold text-blue-900 mt-1">
                    {formatCurrency(selectedSummary.current_selling_price_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 uppercase tracking-wide">
                    Current Margin
                  </p>
                  <p
                    className={`text-lg font-semibold mt-1 ${
                      selectedSummary.profit_margin_percentage >= 50
                        ? "text-green-600"
                        : selectedSummary.profit_margin_percentage >= 30
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedSummary.profit_margin_percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Results */}
          {calculation && (
            <div className="bg-white border-2 border-primary rounded-lg p-6 space-y-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Pricing Recommendation
                </h3>
              </div>

              {/* Suggested Price */}
              <div className="bg-primary/10 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Suggested Price Per Cookie
                </p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(calculation.suggestedPriceCents)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  for {targetMargin}% profit margin
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Total Cost
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {formatCurrency(calculation.totalCostCents)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    for {calculation.batchSize} cookies
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Cost Per Cookie
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {formatCurrency(calculation.costPerUnitCents)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">ingredient cost</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Profit Per Cookie
                  </p>
                  <p className="text-2xl font-semibold text-green-600 mt-2">
                    {formatCurrency(
                      calculation.suggestedPriceCents -
                        calculation.costPerUnitCents
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">at suggested price</p>
                </div>
              </div>

              {/* Ingredient Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Cost Breakdown by Ingredient
                </h4>
                <div className="space-y-2">
                  {calculation.ingredients.map((ing, index) => {
                    const percentage =
                      (ing.costCents / calculation.totalCostCents) * 100;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex-1">
                          <span className="text-gray-900 font-medium">
                            {ing.name}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({ing.quantity} {ing.unit})
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-gray-900 font-medium w-20 text-right">
                            {formatCurrency(ing.costCents)}
                          </span>
                          <span className="text-gray-500 w-12 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comparison with Current Price */}
              {calculation.currentPriceCents > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Comparison with Current Price
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Current Price</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(calculation.currentPriceCents)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {calculation.profitMarginPercentage.toFixed(1)}% margin
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Suggested Price
                      </p>
                      <p className="text-xl font-semibold text-primary">
                        {formatCurrency(calculation.suggestedPriceCents)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {targetMargin}% margin
                      </p>
                    </div>
                  </div>
                  {calculation.suggestedPriceCents !==
                    calculation.currentPriceCents && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        {calculation.suggestedPriceCents >
                        calculation.currentPriceCents ? (
                          <>
                            💡 Consider increasing your price by{" "}
                            <strong>
                              {formatCurrency(
                                calculation.suggestedPriceCents -
                                  calculation.currentPriceCents
                              )}
                            </strong>{" "}
                            to achieve your target {targetMargin}% profit margin.
                          </>
                        ) : (
                          <>
                            ✨ Your current price is{" "}
                            <strong>
                              {formatCurrency(
                                calculation.currentPriceCents -
                                  calculation.suggestedPriceCents
                              )}
                            </strong>{" "}
                            higher than needed for {targetMargin}% margin. You&apos;re
                            doing great!
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              How to use this calculator
            </h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Select a recipe from your configured recipes</li>
              <li>Adjust the target profit margin slider (typically 40-60%)</li>
              <li>Click &quot;Calculate Pricing&quot; to see the suggested price</li>
              <li>
                The suggested price ensures your target profit margin after
                ingredient costs
              </li>
              <li>
                Remember: this doesn&apos;t include labor, utilities, or overhead costs
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
