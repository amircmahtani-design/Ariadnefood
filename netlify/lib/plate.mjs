// Balanced plate for lunch and dinner: protein + carb (starch & grains) + veg. Sides fill the gaps.
const CARB_SIDES = ["rice", "roast potatoes", "orzo", "wholemeal pitta", "couscous"];
const VEG_SIDES = ["roast carrots", "green beans", "cucumber sticks", "broccoli trees", "peas"];
export function plateGroups(FOODS, items) {
  const g = {};
  for (const [k, gr] of items) { const f = FOODS[k]; if (f && gr >= 8) g[f.group] = true; }
  return g;
}
function match(FOODS, text) {
  const t = " " + String(text || "").toLowerCase().replace(/[^a-z\s-]/g, " ") + " ";
  const words = Object.entries(FOODS).flatMap(([k, f]) => f.words.map((w) => [w, k])).sort((a, b) => b[0].length - a[0].length);
  for (const [w, k] of words) if (t.includes(" " + w + " ") || t.includes(" " + w + "s ")) return k;
  return null;
}
export function mealItems(FOODS, recipes, m) {
  const r = m.recipeId && recipes.find((x) => x.id === m.recipeId);
  const items = r ? (r.parts || []).flatMap((p) => p.items || []) : [];
  const texts = [m.side, r ? null : m.custom].filter(Boolean).flatMap((t) => String(t).split(/\s*(?:\+|,)\s*/));
  for (const t of texts) { const k = match(FOODS, t); if (k) items.push([k, FOODS[k].portion]); }
  return items;
}
// Adds a side so the meal has a carb and a veg. n rotates the choice. Returns the new side or null.
export function completeSide(FOODS, recipes, m, n) {
  const g = plateGroups(FOODS, mealItems(FOODS, recipes, m));
  const add = [];
  if (!g.grain) add.push(CARB_SIDES[n % CARB_SIDES.length]);
  if (!g.veg) add.push(VEG_SIDES[n % VEG_SIDES.length]);
  if (!add.length) return null;
  return [m.side, ...add].filter(Boolean).join(" + ");
}
