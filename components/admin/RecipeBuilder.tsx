"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import {
  RecipeWithIngredients,
  Ingredient,
  Product,
  MeasurementUnit,
  RecipeIngredientFormData,
} from "@/lib/types";

interface RecipeBuilderProps {
  recipes: RecipeWithIngredients[];
  ingredients: Ingredient[];
  products: Product[];
  onRecipesChange: (recipes: RecipeWithIngredients[]) => void;
  onRefreshSummary: () => void;
}

export default function RecipeBuilder({
  recipes,
  ingredients,
  products,
  onRecipesChange,
  onRefreshSummary,
}: RecipeBuilderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async (recipe: Partial<RecipeWithIngredients> & { ingredients?: RecipeIngredientFormData[] }) => {
    try {
      let response;
      if (editingId) {
        // Update existing recipe
        response = await fetch(`/api/admin/recipes/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recipe),
        });
      } else {
        // Create new recipe
        response = await fetch("/api/admin/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recipe),
        });
      }

      if (response.ok) {
        // Refresh recipes list
        const listResponse = await fetch("/api/admin/recipes");
        const data = await listResponse.json();
        onRecipesChange(data.recipes);
        onRefreshSummary();
        handleCancel();
      } else {
        alert("Failed to save recipe");
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("Error saving recipe");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    try {
      const response = await fetch(`/api/admin/recipes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRecipesChange(recipes.filter((recipe) => recipe.id !== id));
        onRefreshSummary();
      } else {
        alert("Failed to delete recipe");
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert("Error deleting recipe");
    }
  };

  // Get products that don't have recipes yet
  const availableProducts = products.filter(
    (product) =>
      !recipes.some((recipe) => recipe.product_id === product.id) ||
      (editingId &&
        recipes.find((r) => r.id === editingId)?.product_id === product.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recipes</h2>
          <p className="text-sm text-gray-500 mt-1">
            {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={availableProducts.length === 0 && !editingId}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Recipe
        </button>
      </div>

      {availableProducts.length === 0 && !isAdding && !editingId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          All active products have recipes. Create a new product first if you want
          to add more recipes.
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <RecipeForm
          recipe={editingId ? recipes.find((r) => r.id === editingId) : undefined}
          ingredients={ingredients}
          products={editingId ? products : availableProducts}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Recipes List */}
      {recipes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No recipes yet. Add your first recipe to start calculating costs!
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => handleEdit(recipe.id)}
              onDelete={() => handleDelete(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Recipe Card Component
function RecipeCard({
  recipe,
  onEdit,
  onDelete,
}: {
  recipe: RecipeWithIngredients;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{recipe.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {recipe.product?.name || "No product linked"} • Makes{" "}
            {recipe.batch_size} cookies
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-primary hover:text-primary-dark"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-red-600 hover:text-red-900">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Ingredients:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recipe.recipe_ingredients.map((ri) => (
              <div key={ri.id} className="text-sm text-gray-600">
                • {ri.quantity} {ri.unit} {ri.ingredient?.name}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No ingredients added yet</p>
      )}

      {recipe.notes && (
        <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <span className="font-medium">Notes:</span> {recipe.notes}
        </div>
      )}
    </div>
  );
}

// Recipe Form Component
function RecipeForm({
  recipe,
  ingredients,
  products,
  onSave,
  onCancel,
}: {
  recipe?: RecipeWithIngredients;
  ingredients: Ingredient[];
  products: Product[];
  onSave: (recipe: Partial<RecipeWithIngredients> & { ingredients?: RecipeIngredientFormData[] }) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: recipe?.name || "",
    product_id: recipe?.product_id || "",
    batch_size: recipe?.batch_size || 12,
    notes: recipe?.notes || "",
  });

  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredientFormData[]
  >(
    recipe?.recipe_ingredients?.map((ri) => ({
      recipe_id: recipe.id,
      ingredient_id: ri.ingredient_id,
      quantity: ri.quantity,
      unit: ri.unit,
      notes: ri.notes || "",
    })) || []
  );

  const units: MeasurementUnit[] = [
    "cup",
    "tbsp",
    "tsp",
    "oz",
    "lb",
    "g",
    "kg",
    "ml",
    "l",
    "count",
  ];

  const handleAddIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      {
        recipe_id: "",
        ingredient_id: "",
        quantity: 1,
        unit: "cup",
        notes: "",
      },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof RecipeIngredientFormData,
    value: string | number
  ) => {
    const updated = [...recipeIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeIngredients(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      ingredients: recipeIngredients,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        {recipe ? "Edit Recipe" : "Add New Recipe"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipe Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product *
          </label>
          <select
            required
            value={formData.product_id}
            onChange={(e) =>
              setFormData({ ...formData, product_id: e.target.value })
            }
            className="input"
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch Size (cookies) *
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.batch_size}
            onChange={(e) =>
              setFormData({ ...formData, batch_size: parseInt(e.target.value) })
            }
            className="input"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipe Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={2}
          />
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            Recipe Ingredients
          </h4>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Ingredient
          </button>
        </div>

        {recipeIngredients.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No ingredients added yet. Click &quot;Add Ingredient&quot; to start.
          </p>
        ) : (
          <div className="space-y-3">
            {recipeIngredients.map((ri, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-start bg-white p-3 rounded border border-gray-200"
              >
                <div className="col-span-5">
                  <select
                    required
                    value={ri.ingredient_id}
                    onChange={(e) =>
                      handleIngredientChange(index, "ingredient_id", e.target.value)
                    }
                    className="input text-sm"
                  >
                    <option value="">Select ingredient</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.001"
                    required
                    min="0.001"
                    value={ri.quantity}
                    onChange={(e) =>
                      handleIngredientChange(
                        index,
                        "quantity",
                        parseFloat(e.target.value)
                      )
                    }
                    className="input text-sm"
                    placeholder="Qty"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={ri.unit}
                    onChange={(e) =>
                      handleIngredientChange(index, "unit", e.target.value)
                    }
                    className="input text-sm"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={ri.notes || ""}
                    onChange={(e) =>
                      handleIngredientChange(index, "notes", e.target.value)
                    }
                    className="input text-sm"
                    placeholder="Notes"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {recipe ? "Update" : "Create"} Recipe
        </button>
      </div>
    </form>
  );
}
