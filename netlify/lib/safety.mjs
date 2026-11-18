// v8: choking-safe prep for an under-2. Raw apple is grated, cucumber is peeled and cut into long thin spears.
const SPEAR = "Peel the cucumber and cut it into long thin spears she can hold and bite (no rounds or cubes).";
const FIX = {
  pbtoast: (r) => ({ ...r,
    ingredients: r.ingredients.map((x) => /apple/i.test(x) ? "½ apple, finely grated" : x),
    method: r.method.map((x) => /apple on top/i.test(x) ? "Cut into fingers and press the grated apple on top." : x),
    tip: "If peanut is new for her, give it at breakfast and keep it thin. Raw apple is grated, never in chunks or wedges, until she is older. Never give whole nuts." }),
};
const cuc = (r) => ({ ...r,
  ingredients: (r.ingredients || []).map((x) => x.replace(/^(½ cucumber|5 cm cucumber|Cucumber sticks)(, in sticks)?$/i, (m, a) => `${a.replace(/ sticks$/i, "")}, peeled, in thin spears`)),
  method: (r.method || []).map((x) => x
    .replace(/Cut the cucumber into sticks and the feta into small cubes\./, "Peel the cucumber and cut it into long thin spears; cut the feta into small cubes.")
    .replace(/Cut the cucumber into sticks and quarter the tomatoes lengthwise\./, "Peel the cucumber and cut it into long thin spears; quarter the tomatoes lengthwise.")
    .replace(/^Cut the cucumber into sticks\.$/, SPEAR)
    .replace(/cucumber sticks/g, "thin cucumber spears")),
});
const CUC = new Set(["avocucumber", "hummustoast", "souvlaki", "horiatiki", "tzatzikisticks"]);
export function applySafety(recipes) {
  return recipes.map((r) => { let x = r; if (FIX[x.id]) x = FIX[x.id](x); if (CUC.has(x.id)) x = cuc(x); return x; });
}
