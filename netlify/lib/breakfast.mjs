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
