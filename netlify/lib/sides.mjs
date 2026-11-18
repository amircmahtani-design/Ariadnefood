// Recommended sides per recipe ("serve with"). Plans start from these; carb/veg gaps are filled after.
export const SIDES = {
  chickenspinballs: ["roast carrot coins"],
  meatballs: ["cucumber sticks"],
  yoghurtchicken: ["cucumber sticks"],
  kofta: ["cucumber sticks"],
  keftedes: ["cucumber sticks"],
  pittapizza: ["cucumber sticks"],
  roastchicken: ["roast carrot coins"],
};
export function applySides(recipes) {
  return recipes.map((r) => {
    let x = r;
    if (SIDES[r.id] && !r.sides) x = { ...x, sides: SIDES[r.id] };
    if (r.id === "kofta" && (r.parts || []).some((p) => p.name === "Tzatziki")) {
      x = { ...x, parts: x.parts.filter((p) => p.name !== "Tzatziki"),
        ingredients: x.ingredients.filter((i) => !/tzatziki/i.test(i)),
        method: x.method.map((m) => m.replace(" Serve with tzatziki to dip.", "")),
        tip: "Lamb is rich in iron and zinc. The finger shape is easy for her to hold." };
    }
    if (r.id === "yoghurtchicken" && /tzatziki/i.test(r.tip || "")) {
      x = { ...x, title: x.title, parts: (x.parts || []).filter((p) => p.name !== "Tzatziki"),
        tip: "The yoghurt only marinates the chicken and cooks in, so it isn't the plain yoghurt she gags on, and it makes the chicken very tender." };
    }
    if (r.id === "chickenspinballs" && /carrot coins on the side/.test(r.tip || "")) x = { ...x, tip: "Spinach hidden in a meatball she already likes." };
    return x;
  });
}
// Merge recommended sides with the sides already planned, without repeats.
export function withSides(recipe, side) {
  const have = String(side || "").split(/\s*\+\s*/).filter(Boolean);
  const out = [...(recipe?.sides || [])];
  for (const h of have) if (!out.some((o) => o.toLowerCase() === h.toLowerCase())) out.push(h);
  return out.join(" + ") || null;
}
