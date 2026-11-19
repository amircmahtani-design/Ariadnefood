// v15 (19/11/2026): the family's own recipes, from Catherine's handwritten cards. Written as she cooks them.
const F = (r) => ({ tags: [], family: true, ...r });
export const FAMILY = [
  F({ id: "wings", title: "Air-fried chicken wings", meals: ["lunch", "dinner"], time: "30 min (plus defrosting)", serves: 4, freezes: false,
    ingredients: ["500 g chicken wings (ready made)", "1 tbsp olive oil"],
    method: [
      "Defrost the wings. When ready, put them in a bowl.",
      "Add the olive oil and massage well until all the wings are fully coated.",
      "Preheat the air fryer to 210°C.",
      "Put all the wings in the air fryer on a liner.",
      "Cook at 195°C for 12 minutes on each side.",
      "For her: let them cool, pull the meat off the bone in strips and check for small bones and cartilage.",
    ],
    tip: "Ready-made wings are often seasoned, so check the pack for salt and keep her portion small if it's a salty one.",
    parts: [{ name: "Chicken wings", items: [["chicken_thigh", 60], ["olive_oil", 2]] }], sides: ["rice", "roast carrot coins"] }),
  F({ id: "oatpancakes", title: "Oatmeal blueberry pancakes", meals: ["breakfast", "snack"], time: "15 min + 20 min resting", serves: 8, freezes: true,
    ingredients: ["1½ cups oat flour", "4 eggs", "150 g blueberries", "200 g yoghurt", "20 ml milk", "1 tsp vanilla", "1 tbsp baking powder", "2 tbsp coconut oil", "1 tbsp maple syrup", "⅛ tsp salt"],
    method: [
      "Combine all the dry ingredients and set aside.",
      "Blend the blueberries with the milk until smooth.",
      "In a big mixing bowl add the dry ingredients and the blended blueberries, then the yoghurt, eggs, vanilla, coconut oil, maple syrup and salt.",
      "Mix everything together until well combined.",
      "Rest for 15 to 20 minutes, then cook in the pan on medium-high heat.",
    ],
    tip: "One of her favourites. Makes about 16 small pancakes: freeze the extras flat and reheat in the toaster or air fryer.",
    parts: [{ name: "Blueberry oat pancakes", items: [["oats", 17], ["egg", 25], ["blueberries", 19], ["greek_yoghurt", 25], ["milk", 3], ["olive_oil", 3.5]] }] }),
  F({ id: "chickenpatties", title: "Chicken patties with broccoli & courgette", meals: ["lunch", "dinner"], time: "20 min + 30 min resting", serves: 2, freezes: true,
    ingredients: ["100 g chicken mince", "30 g broccoli, finely chopped", "1 small courgette, finely julienned", "Salt", "Black pepper", "Paprika", "Chipotle", "2 tbsp olive oil"],
    method: [
      "Mix everything well together until fully combined, then leave to rest for 30 minutes.",
      "Shape thinly, like burger patties.",
      "Fry in a non-stick pan on medium heat until golden brown on both sides and cooked through.",
    ],
    tip: "For her, keep the salt and chipotle to a small pinch. Double or triple the batch and freeze the raw patties between baking paper.",
    parts: [{ name: "Chicken patties", items: [["chicken_mince", 50], ["broccoli", 15], ["courgette", 50], ["olive_oil", 5]] }], sides: ["rice", "cucumber sticks"] }),
  F({ id: "chickenorzosoup", title: "Chicken orzo soup", meals: ["lunch", "dinner"], time: "1 hr 30 min", serves: 3, freezes: true,
    ingredients: ["3 chicken drumsticks", "Chicken broth", "1 carrot", "1 courgette", "30 g orzo", "1 bay leaf", "1 allspice berry", "1 tbsp olive oil", "600 ml hot water"],
    method: [
      "Fry the drumsticks in a pot with the olive oil until golden.",
      "Add 600 ml hot water, the bay leaf and allspice and simmer for 45 minutes, adding the carrot while it simmers.",
      "After 45 minutes add the broth and cook for another 30 minutes.",
      "Add the courgette and the orzo and simmer until everything is well done and soft.",
      "For her: take the meat off the bones in small pieces, and remove the bay leaf and allspice berry.",
    ],
    tip: "Serve the chicken, carrot and orzo with a little broth so it stays easy to pick up, rather than a full bowl of soup.",
    parts: [{ name: "Chicken", items: [["chicken_thigh", 65], ["olive_oil", 4]] }, { name: "Orzo & vegetables", items: [["pasta", 10], ["carrot", 20], ["courgette", 60]] }] }),
  F({ id: "mustardsalmon", title: "Mustard salmon with smashed potatoes", meals: ["lunch", "dinner"], time: "1 hr (incl. 30 min marinating)", serves: 3, freezes: false,
    ingredients: ["150 g salmon", "1 tsp mustard", "½ tsp paprika", "1 tbsp olive oil (marinade)", "A little salt and black pepper", "300 g small potatoes", "1 tbsp olive oil (potatoes)", "½ tsp oregano"],
    method: [
      "Mix the mustard, paprika, olive oil and a little salt and pepper, and keep the salmon in the marinade for 30 minutes.",
      "Boil the potatoes until soft, drain and smash them flat on a tray.",
      "Drizzle the potatoes with the olive oil, sprinkle with oregano and a little salt and pepper, and bake in the oven at 200°C for 20 minutes.",
      "Cook the salmon in the air fryer at 185°C for 15 minutes.",
      "For her: flake the salmon and check for bones.",
    ],
    tip: "Mustard and paprika give flavour without much salt, so keep the salt light.",
    parts: [{ name: "Mustard salmon", items: [["salmon", 50], ["olive_oil", 3]] }, { name: "Smashed potatoes", items: [["potato", 100], ["olive_oil", 4]] }], sides: ["green beans"] }),
];
export function applyFamily(recipes) {
  const out = recipes.map((r) => { const f = FAMILY.find((x) => x.id === r.id); return f ? { ...r, ...f } : r; });
  for (const f of FAMILY) if (!out.some((r) => r.id === f.id)) out.push(f);
  return out;
}
