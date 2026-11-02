"use client";
import { useState } from "react";
import { Leaf, Package, Clock, Settings, Trash2, Info, Save } from "lucide-react";
import type { Ingredient, RecipeWithIngredients } from "@/lib/types";
import { calculateOrder, type WorkbenchInputs } from "@/lib/pricing";
import { money } from "@/lib/receipts/types";

export default function PricingWorkbench({recipes,ingredients,onSetup,onSaved}:{recipes:RecipeWithIngredients[];ingredients:Ingredient[];onSetup:()=>void;onSaved:()=>void}){
  const [recipeId,setRecipeId]=useState(recipes[0]?.id || "");
  const recipe=recipes.find(r=>r.id===recipeId);
  const [values,setValues]=useState<WorkbenchInputs>({packs:1,packSize:recipes[0]?.product?.batch_size || 16,packaging:0,minutes:0,hourly:0,overhead:0,waste:0,margin:40,selling:(recipes[0]?.product?.price_cents || 0)/100});
  const [confirmed,setConfirmed]=useState(false);const [message,setMessage]=useState("");const [saving,setSaving]=useState(false);
  let result:ReturnType<typeof calculateOrder>|null=null;let error="";
  if(recipe){try{result=calculateOrder(recipe,ingredients,values);}catch(e){error=e instanceof Error?e.message:"Check recipe quantities";}}
  const update=(key:keyof WorkbenchInputs,value:number)=>{setValues(v=>({...v,[key]:value}));setConfirmed(false);setMessage("");};
  function input(key:keyof WorkbenchInputs,label:string,step="0.01"){return <label className="block text-sm text-primary-800"><span className="block mb-1.5">{label}</span><input className="input-field !py-2.5" type="number" min="0" step={step} value={Number.isFinite(values[key])?values[key]:""} onChange={e=>update(key,e.target.value===""?NaN:Number(e.target.value))}/></label>;}
  async function save(){setSaving(true);setMessage("");try{const response=await fetch("/api/admin/pricing-drafts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({recipe_id:recipeId,values,costs_confirmed:confirmed})});const data=await response.json();if(!response.ok)throw new Error(data.error);setMessage("Pricing draft saved with this cost snapshot.");onSaved();}catch(e){setMessage(e instanceof Error?e.message:"Could not save draft");}finally{setSaving(false);}}
  return <div className="overflow-hidden rounded-xl border border-primary-100 bg-white">
    <div className="grid lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
      <section className="p-5 sm:p-8 min-w-0">
        <h2 className="text-xl sm:text-2xl mb-5">Recipe, format and quantity</h2>
        {!recipes.length && <div className="mb-6 rounded-lg bg-cream p-5"><h3 className="text-lg mb-2">Start with your first recipe</h3><p className="text-sm text-gray-600 mb-4">Add the ingredients and yield once. Then use receipts to keep its costs current.</p><button className="btn-primary" onClick={onSetup}>Create a recipe</button></div>}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="text-sm">Recipe<select className="input-field mt-1.5 !py-2.5" value={recipeId} onChange={e=>{setRecipeId(e.target.value);const r=recipes.find(x=>x.id===e.target.value);setValues(v=>({...v,packSize:r?.product?.batch_size||16,selling:(r?.product?.price_cents||0)*v.packs/100}));setConfirmed(false);}}><option value="">Choose a recipe</option>{recipes.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
          <div className="text-sm">Recipe yield<div className="rounded-lg border border-primary-100 p-2.5 mt-1.5">{recipe?`${recipe.batch_size} cookies`:"—"}</div></div>
          {input("packs","Packs to sell","1")}{input("packSize","Cookies per pack","1")}
        </div>
        {result && <p className="text-sm text-gray-600 mt-4">Make {result.batches} whole recipe {result.batches===1?"batch":"batches"} · Sell {result.sold} cookies · {result.leftovers} left over. All production costs are allocated to this order.</p>}
        <div className="mt-8 pt-6 border-t border-primary-100"><h2 className="text-2xl">Cost worksheet</h2><p className="text-gray-600 text-sm mt-1 mb-5">Review every cost for this order. Enter zero only when a cost does not apply.</p>
          <div className="flex gap-4 items-start py-4 border-b border-primary-100"><Leaf className="w-5 h-5 text-primary mt-1"/><div className="flex-1"><h3 className="font-body font-medium">Ingredients</h3><p className="text-sm text-gray-600">From recipe quantities and current package costs</p>{result&&<details className="mt-2 text-sm"><summary className="cursor-pointer text-primary">Show ingredient calculation</summary><ul className="space-y-2 mt-3">{result.lines.map(l=><li className="flex justify-between gap-3" key={l.name}><span>{l.name} · {l.quantity} {l.unit} / recipe</span><span>{money(l.costCents*result!.batches)}</span></li>)}</ul></details>}</div><span className="font-medium tabular-nums">{result?money(result.ingredientCents):"—"}</span></div>
          <div className="grid sm:grid-cols-[28px_1fr_1fr] gap-4 items-center py-5 border-b border-primary-100"><Package className="w-5 h-5 text-primary hidden sm:block"/>{input("packaging","Packaging per selling pack ($)")}<p className="text-sm text-gray-600">{result?`${values.packs} packs · ${money(result.packagingCents)} total`:"Boxes, bags and labels"}</p></div>
          <div className="grid sm:grid-cols-[28px_1fr_1fr] gap-4 items-center py-5 border-b border-primary-100"><Clock className="w-5 h-5 text-primary hidden sm:block"/>{input("minutes","Active minutes for this order","1")}{input("hourly","Labor rate ($ / hour)")}</div>
          <div className="grid sm:grid-cols-[28px_1fr_1fr] gap-4 items-center py-5 border-b border-primary-100"><Settings className="w-5 h-5 text-primary hidden sm:block"/>{input("overhead","Overhead for this order ($)")}<p className="text-sm text-gray-600">Utilities and other allocated costs</p></div>
          <div className="grid sm:grid-cols-[28px_1fr_1fr] gap-4 items-center py-5 border-b border-primary-100"><Trash2 className="w-5 h-5 text-primary hidden sm:block"/>{input("waste","Waste allowance for this order ($)")}<p className="text-sm text-gray-600">A fixed allowance; avoid counting leftovers twice</p></div>
          <div className="flex justify-between gap-4 py-5"><h3 className="text-xl">Total estimated order cost</h3><strong className="text-xl tabular-nums">{result?money(result.total):"—"}</strong></div>
        </div>
        {error&&<p role="alert" className="text-red-800 bg-red-50 p-4 rounded-lg">{error}</p>}
      </section>
      <aside className="bg-cream border-t lg:border-t-0 lg:border-l border-primary-100 p-5 sm:p-8">
        <h2 className="text-2xl mb-6">Pricing summary</h2>
        <div className="flex justify-between gap-4 mb-5"><span>Total estimated order cost</span><strong>{result?money(result.total):"—"}</strong></div>
        {input("margin","Target margin (%)")}
        <div className="flex justify-between gap-4 py-5 my-4 border-y border-primary-100"><span>Suggested order price</span><strong>{result?money(result.suggested):"—"}</strong></div>
        {input("selling","Order selling price ($)")}
        <div className="grid grid-cols-2 bg-cream-200 rounded-lg text-center p-4 my-5"><div><span className="text-xl">{result?money(values.selling*100/values.packs):"—"}</span><p className="text-xs mt-1">per pack of {values.packSize||"—"}</p></div><div className="border-l border-primary-200"><span className="text-xl">{result?money(values.selling*100/result.sold):"—"}</span><p className="text-xs mt-1">per cookie</p></div></div>
        <dl className="space-y-4"><div className="flex justify-between gap-3"><dt>Estimated profit</dt><dd className="text-xl font-display">{result?money(result.profit):"—"}</dd></div><div className="flex justify-between gap-3"><dt>Achieved margin</dt><dd>{result?.achieved!=null?`${result.achieved.toFixed(1)}%`:"—"}</dd></div><div className="flex justify-between gap-3 border-t border-primary-100 pt-4"><dt>Current storefront price</dt><dd className="text-right">{recipe?.product?money(recipe.product.price_cents):"—"}<p className="text-xs text-gray-600">per pack of {recipe?.product?.batch_size||"—"}</p></dd></div></dl>
        <p className="flex gap-2 text-xs text-gray-600 mt-5"><Info className="w-4 h-4 shrink-0"/>Payment fees, delivery and sales tax are excluded. Saving a draft does not change storefront prices.</p>
        <label className="flex gap-3 items-start text-sm my-6"><input type="checkbox" className="mt-1 accent-primary" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>I reviewed ingredient costs and entered all applicable production costs, including any zeros.</span></label>
        <button className="btn-primary w-full disabled:opacity-50 gap-2" disabled={!result||!confirmed||saving} onClick={save}><Save className="w-4 h-4"/>{saving?"Saving…":"Save pricing draft"}</button><p role="status" className="text-sm mt-3">{message}</p>
      </aside>
    </div>
  </div>;
}
