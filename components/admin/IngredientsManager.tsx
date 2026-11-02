"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { Ingredient, MeasurementUnit } from "@/lib/types";

interface IngredientsManagerProps {
  ingredients: Ingredient[];
  onIngredientsChange: (ingredients: Ingredient[]) => void;
}

export default function IngredientsManager({
  ingredients,
  onIngredientsChange,
}: IngredientsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapingId, setScrapingId] = useState<string | null>(null);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

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

  const handleSave = async (ingredient: Partial<Ingredient>) => {
    try {
      let response;
      if (editingId) {
        // Update existing ingredient
        response = await fetch(`/api/admin/ingredients/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ingredient),
        });
      } else {
        // Create new ingredient
        response = await fetch("/api/admin/ingredients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ingredient),
        });
      }

      if (response.ok) {
        // Refresh ingredients list
        const listResponse = await fetch("/api/admin/ingredients");
        const data = await listResponse.json();
        onIngredientsChange(data.ingredients);
        handleCancel();
      } else {
        alert("Failed to save ingredient");
      }
    } catch (error) {
      console.error("Error saving ingredient:", error);
      alert("Error saving ingredient");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ingredient?")) return;

    try {
      const response = await fetch(`/api/admin/ingredients/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onIngredientsChange(ingredients.filter((ing) => ing.id !== id));
      } else {
        alert("Failed to delete ingredient");
      }
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      alert("Error deleting ingredient");
    }
  };

  const handleScrapeOne = async (id: string) => {
    setScrapingId(id);
    try {
      const response = await fetch("/api/admin/scrape-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_ids: [id] }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.results[0];
        if (result.success) {
          // Refresh ingredients list
          const listResponse = await fetch("/api/admin/ingredients");
          const listData = await listResponse.json();
          onIngredientsChange(listData.ingredients);
          alert(
            `Price updated: ${formatCurrency(result.old_price_cents)} → ${formatCurrency(result.new_price_cents)}`
          );
        } else {
          alert(`Failed to scrape: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("Error scraping price:", error);
      alert("Error scraping price");
    } finally {
      setScrapingId(null);
    }
  };

  const handleScrapeAll = async () => {
    if (
      !confirm(
        "This will scrape prices for all ingredients with supplier URLs. Continue?"
      )
    )
      return;

    setIsScrapingAll(true);
    try {
      const response = await fetch("/api/admin/scrape-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh ingredients list
        const listResponse = await fetch("/api/admin/ingredients");
        const listData = await listResponse.json();
        onIngredientsChange(listData.ingredients);
        alert(data.message);
      }
    } catch (error) {
      console.error("Error scraping all prices:", error);
      alert("Error scraping prices");
    } finally {
      setIsScrapingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ingredients</h2>
          <p className="text-sm text-gray-500 mt-1">
            {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""}{" "}
            total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleScrapeAll}
            disabled={isScrapingAll}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isScrapingAll ? "animate-spin" : ""}`}
            />
            {isScrapingAll ? "Scraping..." : "Update All Prices"}
          </button>
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <IngredientForm
          ingredient={
            editingId
              ? ingredients.find((ing) => ing.id === editingId)
              : undefined
          }
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Ingredients Table */}
      {ingredients.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No ingredients yet. Add your first ingredient to get started!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Package Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Supplier
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ingredients.map((ingredient) => (
                <tr key={ingredient.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ingredient.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ingredient.package_quantity} {ingredient.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(ingredient.current_price_cents)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {ingredient.supplier_name || "-"}
                      {ingredient.supplier_url && (
                        <a
                          href={ingredient.supplier_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      {ingredient.supplier_url && (
                        <button
                          onClick={() => handleScrapeOne(ingredient.id)}
                          disabled={scrapingId === ingredient.id}
                          className="text-blue-600 hover:text-blue-900"
                          title="Update price from supplier"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${scrapingId === ingredient.id ? "animate-spin" : ""}`}
                          />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(ingredient.id)}
                        className="text-primary hover:text-primary-dark"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ingredient.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Ingredient Form Component
function IngredientForm({
  ingredient,
  onSave,
  onCancel,
}: {
  ingredient?: Ingredient;
  onSave: (ingredient: Partial<Ingredient>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: ingredient?.name || "",
    unit: ingredient?.unit || ("cup" as MeasurementUnit),
    package_quantity: ingredient?.package_quantity || 1,
    current_price_cents: ingredient?.current_price_cents || 0,
    supplier_name: ingredient?.supplier_name || "",
    supplier_url: ingredient?.supplier_url || "",
    notes: ingredient?.notes || "",
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        {ingredient ? "Edit Ingredient" : "Add New Ingredient"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Size *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.package_quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  package_quantity: parseFloat(e.target.value),
                })
              }
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value as MeasurementUnit })
              }
              className="input"
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Price *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              step="0.01"
              required
              value={(formData.current_price_cents / 100).toFixed(2)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  current_price_cents: Math.round(
                    parseFloat(e.target.value) * 100
                  ),
                })
              }
              className="input pl-7"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier Name
          </label>
          <input
            type="text"
            value={formData.supplier_name}
            onChange={(e) =>
              setFormData({ ...formData, supplier_name: e.target.value })
            }
            className="input"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier URL (for price scraping)
          </label>
          <input
            type="url"
            value={formData.supplier_url}
            onChange={(e) =>
              setFormData({ ...formData, supplier_url: e.target.value })
            }
            className="input"
            placeholder="https://..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {ingredient ? "Update" : "Add"} Ingredient
        </button>
      </div>
    </form>
  );
}
