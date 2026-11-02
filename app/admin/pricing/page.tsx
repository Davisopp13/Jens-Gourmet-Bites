import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PricingDashboard from "@/components/admin/PricingDashboard";
export const dynamic="force-dynamic";
export default async function AdminPricingPage(){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/admin/login");
  const [ingredients,recipes,products]=await Promise.all([
    supabase.from("ingredients").select("*").order("name"),
    supabase.from("recipes").select("*, product:products(*), recipe_ingredients(*,ingredient:ingredients(*))").order("name"),
    supabase.from("products").select("*").eq("is_active",true).order("name"),
  ]);
  return <PricingDashboard ingredients={ingredients.data||[]} recipes={recipes.data||[]} products={products.data||[]} loadError={ingredients.error||recipes.error||products.error?"Some pricing data could not load. Reload before creating an estimate; missing data is not a zero cost.":undefined}/>;
}
