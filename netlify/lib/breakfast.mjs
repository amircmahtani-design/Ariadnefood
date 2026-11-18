// v11 (18/11/2026): breakfast is 3 spanakopita triangles, half a carrot cookie and some fruit.
export function applyBreakfast(recipes) {
  return recipes.map((r) => r.id !== "spanakbreakfast" ? r : {
    ...r,
    title: "Spanakopita triangles, carrot cookie & fruit",
    ingredients: ["3 frozen spanakopita triangles", "½ homemade carrot & oat cookie", "A few pieces of soft fruit (orange segments, strawberries, pear or kiwi)"],
    method: [
      "Air fry the triangles straight from frozen at 180°C for about 12 to 15 minutes, turning once, until golden and crisp.",
      "Let them cool for a few minutes and check the filling is warm, not hot, before serving.",
      "Serve the 3 triangles with half a carrot cookie and a few pieces of fruit. Quarter strawberries, remove orange pips and membrane, and peel the pear.",
    ],
    tip: "Her breakfast every day. She mostly eats the filling, so log the triangles as Most when she leaves the pastry. Fruit with vitamin C (orange, strawberries, kiwi) helps her absorb the iron in the spinach.",
    parts: [
      { name: "Spanakopita triangles", items: [["spinach", 25], ["feta", 10], ["egg", 3], ["filo", 20], ["olive_oil", 4]] },
      { name: "½ carrot cookie", items: [["carrot", 2], ["egg", 2], ["greek_yoghurt", 2], ["apple", 4], ["oats", 3], ["olive_oil", 0.5]] },
      { name: "Fruit", items: [["orange", 40]] },
    ],
  });
}

// v13 (18/11/2026): breakfast alternates. Spanakopita days swap between a carrot and a courgette cookie;
// the days in between are a different breakfast (scrambled egg, pancakes, eggy bread...).
export const COURGETTE_COOKIES = {
  id: "courgettecookies", title: "Courgette & oat cookies", meals: ["snack", "breakfast"], time: "25 min", serves: 6,
  ingredients: ["1 small courgette, finely grated and squeezed dry", "1 egg", "3 tbsp plain Greek yoghurt", "1 apple, finely grated", "80 g rolled oats", "2 tbsp grated cheddar", "1 tbsp olive oil or melted butter", "Cinnamon"],
  method: [
    "Squeeze the grated courgette hard in a clean tea towel: the drier it is, the firmer the cookies.",
    "Whisk the egg, yoghurt and apple together, then stir in the courgette, oats, cheese, oil and a pinch of cinnamon.",
    "Spoon into small flattened rounds and bake at 180°C for 18 to 20 minutes until golden at the edges and firm.",
  ],
  tip: "The carrot cookie's sister: same batter and same texture, with courgette and a little cheese. Keeps 3 days in a tin and freezes well.",
  tags: ["egg", "dairy", "oats"],
  parts: [{ name: "Courgette cookies", items: [["courgette", 10], ["egg", 8], ["greek_yoghurt", 8], ["apple", 15], ["oats", 12], ["cheddar", 3], ["olive_oil", 2]] }],
};
export const SPANAK_COURGETTE = {
  id: "spanakbreakfast2", title: "Spanakopita triangles, courgette cookie & fruit", meals: ["breakfast"], time: "15 min", serves: 1,
  ingredients: ["3 frozen spanakopita triangles", "½ homemade courgette & oat cookie", "A few pieces of soft fruit (orange segments, strawberries, pear or kiwi)"],
  method: [
    "Air fry the triangles straight from frozen at 180°C for about 12 to 15 minutes, turning once, until golden and crisp.",
    "Let them cool for a few minutes and check the filling is warm, not hot, before serving.",
    "Serve the 3 triangles with half a courgette cookie and a few pieces of fruit. Quarter strawberries, remove orange pips and membrane, and peel the pear.",
  ],
  tip: "Same breakfast as the carrot cookie version, for the alternate spanakopita days.",
  tags: [],
  parts: [
    { name: "Spanakopita triangles", items: [["spinach", 25], ["feta", 10], ["egg", 3], ["filo", 20], ["olive_oil", 4]] },
    { name: "½ courgette cookie", items: [["courgette", 2.5], ["egg", 2], ["greek_yoghurt", 2], ["apple", 4], ["oats", 3], ["cheddar", 1]] },
    { name: "Fruit", items: [["orange", 40]] },
  ],
};

// v14: recipes that freeze well (a freezer stash on top of the two fresh bakes a week).
export const FREEZES = ["oatpancakes", "pumpkinpancakes", "pancakes", "broccoli", "muffins", "pumpkinmuffins", "sausagerolls", "chickpeafritters", "lentilfritters", "peafritters", "caulibites", "quinoabites", "sweetcheesefingers", "beetbites", "oatfingers", "carrotcookies", "courgettecookies", "chiabars", "lentilpasties", "spanakopita", "frittata", "meatballs", "chickenspinballs", "keftedes", "beefpatties", "chickenpatties", "vealkeftedakia", "porkkeftedakia", "vealspinach", "soutzoukakia", "youvarlakia", "bolognese", "pulledpork", "salmoncakes", "sardine", "vealschnitzel", "kofta", "chickensweet"];
export const markFreezes = (recipes) => recipes.map((r) => FREEZES.includes(r.id) ? { ...r, freezes: true } : r);
