// 17/11/2026 update from the family: she rejects banana (mainly the smell) and gags on plain yoghurt.
// Baked-in yoghurt and egg are fine. Banana in her favourites becomes grated apple; recipes built on
// banana or plain yoghurt are paused with a reason (shown in Recipes > Resting, reversible).
const SWAP = ["carrotcookies", "oatpancakes", "spanakbreakfast", "pancakes", "oatfingers", "chiabars", "pbtoast"];
const PAUSE = {
  bananaflax: "She dislikes banana (mainly the smell)",
  yoghurtbark: "Plain yoghurt makes her gag",
  mangolollies: "Plain yoghurt makes her gag",
  tzatzikisticks: "Plain yoghurt makes her gag",
};
const swapText = (t) => String(t)
  .replace(/\b(\d|½|¼)?\s*ripe bananas?, mashed/gi, (m, n) => `${n || "1"} apple, finely grated`)
  .replace(/½ banana, sliced lengthwise/gi, "½ apple, in very thin slices")
  .replace(/\b(\d|½)\s*ripe bananas?\b/gi, (m, n) => `${n} apple${n === "2" ? "s" : ""}, finely grated`)
  .replace(/mashed in, for sweetness/gi, "grated in, for sweetness")
  .replace(/Mash the bananas?/g, "Grate the apple").replace(/mash the bananas?/g, "grate the apple")
  .replace(/Bananas/g, "Apples").replace(/bananas/g, "apples").replace(/Banana/g, "Apple").replace(/banana/g, "apple");
export function applyV4(recipes) {
  return recipes.map((r) => {
    if (SWAP.includes(r.id)) {
      return { ...r, title: swapText(r.title), ingredients: (r.ingredients || []).map(swapText), method: (r.method || []).map(swapText), tip: swapText(r.tip || ""),
        parts: (r.parts || []).map((p) => ({ name: swapText(p.name), items: p.items.map(([k, g]) => [k === "banana" ? "apple" : k, g]) })) };
    }
    if (PAUSE[r.id] && !r.avoid && !r.restCleared) return { ...r, avoid: PAUSE[r.id], avoidSince: "2026-11-17" };
    return r;
  });
}
export const PLAN_SWAPS = [[/^banana \+ cheese cubes$/i, "Courgette & cheese muffins"], [/banana/i, "apple"]];
