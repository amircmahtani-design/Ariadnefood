import { MORE_RECIPES, SCRAMBLED, STAPLES, VEAL_PORK } from "./seed-more.mjs";
import { applyBreakfast, COURGETTE_COOKIES, SPANAK_COURGETTE, markFreezes } from "./breakfast.mjs";
import { applyFamily } from "./family.mjs";
import { applyV4 } from "./prefs-v4.mjs";
import { completeSide } from "./plate.mjs";
import { applySides, withSides } from "./sides.mjs";
import { applySafety } from "./safety.mjs";
import { FOODS } from "./foods.mjs";
// Starter recipes and a two-week starter plan. Only written to storage when empty.
// Built around Ariadne's preferences: firm, crisp finger food, no purées or mushy textures.

const P = {
  carrotcookies: [["Carrot cookies",[["carrot",8],["egg",8],["greek_yoghurt",8],["banana",15],["oats",12],["olive_oil",2]]]],
  pancakes: [["Pancakes",[["banana",30],["egg",25],["greek_yoghurt",15],["oats",12]]]],
  oatfingers: [["Oat fingers",[["oats",20],["egg",8],["greek_yoghurt",10],["apple",15],["banana",15]]]],
  frittata: [["Spanakopita squares",[["egg",50],["spinach",12],["courgette",12],["cheddar",5],["feta",4]]]],
  eggybread: [["Eggy bread",[["bread",25],["egg",25],["milk",8]]],["Avocado",[["avocado",30],["oats",3]]]],
  yoghurtbark: [["Yoghurt bark",[["greek_yoghurt",50],["strawberries",15],["blueberries",10]]]],
  youvarlakia: [["Meatballs",[["beef_mince",40],["rice",4],["onion",4],["egg",8]]],["Broth & carrots",[["carrot",15],["lemon",3]]]],
  meatballs: [["Meatballs",[["turkey_mince",40],["courgette",12],["carrot",8],["spinach",5],["lentils_red",3],["oats",3],["egg",6]]]],
  salmonbites: [["Salmon",[["salmon",40],["oats",5]]],["Potato wedges",[["potato",60],["olive_oil",3]]],["Peas",[["peas",20]]]],
  orzo: [["Chicken & orzo",[["chicken_thigh",35],["pasta",20],["passata",30],["onion",5]]],["Carrots",[["carrot",15]]]],
  lentilfritters: [["Lentil fritters",[["lentils_red",20],["carrot",15],["egg",10],["oats",6],["olive_oil",3]]]],
  chickpeafritters: [["Chickpea fritters",[["chickpeas",35],["courgette",15],["egg",8],["tahini",3],["flour",5]]]],
  spanakopita: [["Spanakopita",[["spinach",30],["ricotta",15],["feta",4],["egg",6],["filo",12],["olive_oil",3]]]],
  sardine: [["Fishcakes",[["sardines",25],["potato",45],["egg",8],["oats",4]]]],
  vegfries: [["Veg fries",[["carrot",20],["sweet_potato",25],["courgette",15],["olive_oil",4]]],["Tzatziki",[["greek_yoghurt",25],["cucumber",8]]]],
  chickensweet: [["Chicken bites",[["chicken_mince",35],["sweet_potato",25],["oats",5]]]],
  yoghurtchicken: [["Chicken strips",[["chicken_thigh",45],["greek_yoghurt",10]]],["Tzatziki",[["greek_yoghurt",20],["cucumber",8]]]],
  bolognese: [["Pasta",[["pasta",25]]],["Bolognese sauce",[["beef_mince",30],["lentils_red",6],["carrot",10],["courgette",10],["passata",40]]]],
  cod: [["Cod bites",[["cod",40],["oats",5]]],["Rice",[["rice",20]]],["Courgette",[["courgette",30]]]],
  muffins: [["Muffins",[["courgette",12],["cheddar",6],["egg",5],["greek_yoghurt",3],["sr_flour",10],["milk",6],["olive_oil",2]]]],
  broccoli: [["Broccoli bites",[["broccoli",30],["cheddar",8],["egg",8],["breadcrumbs",5]]]],
  lemonchicken: [["Chicken",[["chicken_thigh",45]]],["Potatoes",[["potato",60],["olive_oil",4]]],["Carrots",[["carrot",30]]]]
};
const SERVES = {"carrotcookies": 6, "pancakes": 2, "oatfingers": 6, "frittata": 4, "eggybread": 1, "yoghurtbark": 4, "youvarlakia": 6, "meatballs": 6, "salmonbites": 3, "orzo": 4, "lentilfritters": 5, "chickpeafritters": 6, "spanakopita": 6, "sardine": 5, "vegfries": 4, "chickensweet": 5, "yoghurtchicken": 3, "bolognese": 6, "cod": 3, "muffins": 6, "broccoli": 4, "lemonchicken": 6};
const R = (id, title, meals, time, ingredients, method, tip, tags = []) =>
  ({ id, title, meals, time, serves: SERVES[id] || 4, ingredients, method, tip, tags, parts: (P[id] || []).map(([name, items]) => ({ name, items })) });

const BASE_RECIPES = [
  R("carrotcookies", "Carrot & oat cookies", ["snack", "breakfast"], "25 min",
    ["1 carrot, finely grated", "1 egg", "3 tbsp plain Greek yoghurt", "1 ripe banana, mashed", "80 g rolled oats", "1 tbsp olive oil or melted butter", "Cinnamon", "Optional: 2 chopped dates"],
    ["Whisk the egg, yoghurt and banana together.", "Stir in the carrot, oats, oil and cinnamon.", "Spoon into small flattened rounds and bake at 180°C for 15–18 min until golden at the edges."],
    "Her favourite way to eat egg and yoghurt. Try adding a spoon of ground almonds, chia or grated courgette, one change at a time.", ["egg", "dairy", "oats"]),
  R("pancakes", "Banana yoghurt pancakes", ["breakfast"], "15 min",
    ["1 ripe banana", "1 egg", "2 tbsp plain Greek yoghurt", "5 tbsp oats, blitzed to flour", "Pinch of cinnamon", "Butter or olive oil for the pan"],
    ["Mash the banana, whisk in the egg and yoghurt, stir in the oats and cinnamon.", "Cook small spoonfuls in a lightly oiled pan, 2 min each side, until golden.", "Cool and cut into strips."],
    "Cook them a little longer for firmer edges. They freeze well: toast them straight from frozen.", ["egg", "dairy", "oats"]),
  R("oatfingers", "Baked oat fingers", ["breakfast", "snack"], "30 min",
    ["120 g rolled oats", "1 egg", "4 tbsp plain Greek yoghurt", "1 apple or pear, grated", "1 ripe banana, mashed", "Cinnamon", "Optional: 2 tbsp ground almonds"],
    ["Mix everything together.", "Press 2 cm deep into a lined small tin.", "Bake at 180°C for 20–25 min until set and golden. Cool, then cut into fingers."],
    "All the goodness of porridge with none of the mush. Rotate the fruit: blueberries, grated pear, chopped dates.", ["oats", "egg", "dairy"]),
  R("frittata", "Spanakopita", ["breakfast", "snack"], "25 min",
    ["4 eggs", "Big handful of spinach, finely chopped", "½ courgette, grated and squeezed", "20 g grated mild cheese", "15 g feta, rinsed and crumbled", "1 spring onion, finely chopped", "Fresh dill", "Olive oil"],
    ["Whisk the eggs, then stir in the spinach, courgette, spring onion, dill and both cheeses.", "Pour into an oiled small tin.", "Bake at 180°C for 15–18 min until firm all the way through, then cut into squares."],
    "All the flavour of spanakopita without the pastry. Baked, so it's firm and springy, not wet. Keeps 2 days in the fridge.", ["egg", "dairy"]),
  R("eggybread", "Eggy bread fingers & avocado wedges", ["breakfast"], "10 min",
    ["1 slice wholemeal bread", "1 egg", "1 tbsp milk", "Pinch of cinnamon", "¼ ripe avocado", "2 tbsp ground oats or desiccated coconut, for coating"],
    ["Soak the bread in the whisked egg, milk and cinnamon.", "Cook in a little butter until golden and firm on both sides, then cut into fingers.", "Cut the avocado into wedges and roll them in ground oats so she can grip them."],
    "Serving avocado in wedges rather than mashed keeps its shape, which suits her better.", ["egg", "wheat"]),
  R("yoghurtbark", "Frozen yoghurt berry bark", ["snack"], "5 min + freeze",
    ["200 g plain Greek yoghurt", "Handful of berries, chopped small", "Optional: ½ banana, mashed in, for sweetness"],
    ["Spread the yoghurt 1 cm thick on a lined tray.", "Scatter over the berries.", "Freeze 2 hours, then snap into pieces."],
    "Frozen yoghurt is firm and cold, a completely different texture from a spoonful of yoghurt. It also soothes teething gums.", ["dairy"]),
  R("youvarlakia", "Youvarlakia (meatball soup)", ["lunch", "dinner"], "45 min",
    ["250 g lean beef mince", "2 tbsp short-grain rice", "1 small onion, grated", "1 carrot, grated", "Fresh dill and parsley", "1 egg + juice of ½ lemon (for the avgolemono)", "1 litre water (no stock cube)"],
    ["Mix the mince, rice, onion, half the carrot and herbs. Roll small meatballs.", "Simmer in the water with the rest of the carrot for 30 min.", "Whisk egg and lemon, temper with a ladle of hot broth, stir back in off the heat."],
    "Halve the meatballs for her. Try adding 2 tbsp cooked red lentils to the meatball mix. She won't notice them.", ["beef", "egg"]),
  R("meatballs", "Turkey meatballs with veggies inside", ["lunch", "dinner"], "35 min",
    ["300 g turkey mince", "1 courgette, grated and squeezed dry", "1 carrot, grated", "Handful of spinach, finely chopped", "3 tbsp cooked red lentils or 2 tbsp ricotta", "2 tbsp oats", "1 egg", "Oregano"],
    ["Mix everything well with your hands.", "Roll into small, slightly flattened balls.", "Bake at 190°C for 18–20 min until browned and cooked through."],
    "Hide something different each batch: lentils, ricotta, grated broccoli stalk, salmon. Still put a few visible veg on her plate.", ["beef", "egg", "legumes"]),
  R("salmonbites", "Salmon bites with potato wedges & peas", ["lunch", "dinner"], "30 min",
    ["1 salmon fillet (about 150 g), skinned and cubed", "2 tbsp ground oats or breadcrumbs", "1 potato, cut into wedges", "Handful of frozen peas", "Olive oil, lemon"],
    ["Roast the potato wedges in olive oil at 200°C for 25 min.", "Roll the salmon cubes in the oats and add to the tray for the last 10–12 min.", "Boil the peas 3 min. Squash each one lightly for safety."],
    "A crisp coating changes how fish feels to eat. Oily fish twice a week covers her omega-3s.", ["fish"]),
  R("orzo", "Chicken & orzo with tomato (kritharaki)", ["lunch", "dinner"], "30 min",
    ["2 boneless chicken thighs, diced", "60 g orzo", "200 g passata", "½ onion, finely chopped", "1 carrot, diced", "Olive oil, oregano"],
    ["Soften the onion and carrot, then brown the chicken.", "Add the passata, 250 ml water and the orzo.", "Simmer about 10 min, until the orzo is just tender and the sauce is thick, not sloppy."],
    "Keep it thick and chunky rather than soupy. Leftovers firm up nicely in the fridge.", ["wheat"]),
  R("lentilfritters", "Lentil & carrot fritters", ["snack", "side"], "30 min",
    ["100 g red lentils, cooked and well drained", "1 carrot, grated", "1 spring onion, finely chopped", "1 egg", "3 tbsp oats or flour", "Cumin, paprika", "Olive oil"],
    ["Mix everything into a thick batter.", "Fry spoonfuls in olive oil, 3 min each side, until crisp.", "Or bake at 200°C for 20 min, turning once."],
    "Lentils with no mushy texture. Serve with orange or tomato on the side, as the vitamin C helps her absorb the iron.", ["legumes", "egg"]),
  R("chickpeafritters", "Chickpea & courgette fritters", ["snack", "side"], "30 min",
    ["1 tin chickpeas, drained", "1 courgette, grated and squeezed", "1 egg", "1 tbsp tahini", "3 tbsp flour", "Cumin, lemon zest, parsley"],
    ["Blitz the chickpeas roughly, leaving some texture.", "Mix in everything else.", "Shape into small patties and bake at 200°C for 20 min, turning once."],
    "This introduces both chickpeas and sesame (tahini). Serve at lunch and watch for any reaction afterwards. Never give whole roasted chickpeas: they're a choking risk.", ["legumes", "sesame", "egg"]),
  R("spanakopita", "Spanakopita fingers", ["snack", "side"], "40 min",
    ["200 g spinach, wilted and squeezed dry", "100 g ricotta", "30 g feta, rinsed", "1 egg", "4 sheets filo", "Olive oil", "Dill"],
    ["Mix the spinach, cheeses, egg and dill.", "Layer the filo with oil, spread the filling down one edge and roll into a long log.", "Bake at 190°C for 25 min until crisp, then cut into fingers."],
    "Spinach, egg and cheese in a crunchy shell. Rinsing the feta takes out a lot of the salt.", ["egg", "dairy", "wheat"]),
  R("sardine", "Sardine & potato fishcakes", ["lunch", "dinner"], "30 min",
    ["1 tin sardines in olive oil (boneless, or mash the soft bones in)", "2 potatoes, boiled and crushed", "1 spring onion", "Parsley, lemon zest", "1 egg", "Ground oats for coating"],
    ["Mix the potato, sardines, spring onion, herbs and egg.", "Shape into small patties and roll in the oats.", "Bake at 200°C for 18 min, turning once, until crisp."],
    "Cheap, full of omega-3s and calcium. Freeze extras before baking.", ["fish", "egg"]),
  R("vegfries", "Roast veg fries with tzatziki", ["side", "snack"], "30 min",
    ["Carrot, sweet potato, courgette, green beans: cut into fries", "Olive oil, oregano", "Tzatziki: 4 tbsp Greek yoghurt, grated cucumber (squeezed), tiny bit of garlic, dill"],
    ["Toss the veg in olive oil and oregano.", "Roast at 200°C for 20–25 min, until soft inside with caramelised edges.", "Mix the tzatziki and serve as a dip."],
    "Roasting brings out sweetness and gives the veg firm edges, and dipping makes yoghurt fun. Rotate the vegetables each time.", ["dairy"]),
  R("chickensweet", "Chicken & sweet potato bites", ["lunch", "dinner"], "30 min",
    ["200 g chicken mince", "1 small sweet potato, baked and mashed", "2 tbsp oats", "Pinch of paprika and cumin"],
    ["Mix everything together.", "Shape into small bites.", "Bake at 190°C for 18 min until golden."],
    "Good for lunchboxes and travel days.", []),
  R("yoghurtchicken", "Yoghurt-marinated chicken strips", ["lunch", "dinner"], "20 min + marinate",
    ["2 chicken thighs or 1 breast, cut into strips", "4 tbsp Greek yoghurt", "Lemon, oregano, pinch of paprika"],
    ["Marinate the chicken in the yoghurt, lemon and spices for at least an hour, or overnight.", "Bake at 200°C for 15–18 min or grill until cooked through."],
    "The yoghurt makes the chicken very tender and gets a bit more dairy into her. Serve with tzatziki to dip.", ["dairy"]),
  R("bolognese", "Beef & lentil bolognese", ["lunch", "dinner"], "45 min",
    ["250 g beef mince", "50 g red lentils", "1 carrot and 1 courgette, grated", "½ onion", "400 g passata", "Pasta shapes (fusilli or penne)"],
    ["Brown the mince with the onion.", "Add the grated veg, lentils, passata and 200 ml water, then simmer 30 min until thick.", "Toss with pasta that still has some bite."],
    "The red lentils disappear into the sauce and add a lot of iron. Firm pasta shapes she can pick up are better than spaghetti. Freezes well.", ["beef", "legumes", "wheat"]),
  R("cod", "Lemon cod bites with rice", ["lunch", "dinner"], "20 min",
    ["150 g cod or hake fillet", "Squeeze of lemon", "2 tbsp ground oats or breadcrumbs", "Rice", "Steamed courgette sticks"],
    ["Cut the fish into chunks and roll them in the oats.", "Bake at 200°C for 10–12 min until golden.", "Serve with rice and courgette, checking the fish for bones."],
    "White fish is mild, so rotate it with salmon. If loose rice is too soft for her, press it into small rice balls.", ["fish"]),
  R("muffins", "Courgette & cheese muffins", ["snack", "breakfast"], "30 min",
    ["1 courgette, grated and squeezed", "60 g grated mild cheese", "1 egg", "2 tbsp Greek yoghurt", "100 g self-raising flour", "60 ml milk", "2 tbsp olive oil"],
    ["Mix the wet ingredients, then fold in the flour, courgette and cheese.", "Spoon into a mini muffin tin.", "Bake at 180°C for 18 min."],
    "Freeze them and defrost one at a time for snacks.", ["egg", "dairy", "wheat"]),
  R("broccoli", "Broccoli cheese bites", ["snack", "side"], "30 min",
    ["1 cup broccoli florets, steamed and finely chopped", "50 g grated cheese", "1 egg", "3 tbsp breadcrumbs or oats"],
    ["Mix everything together.", "Shape into small patties.", "Bake at 190°C for 15–18 min until crisp."],
    "A good way to get broccoli in front of her in a form she'll recognise.", ["egg", "dairy"]),
  R("lemonchicken", "Lemon-oregano chicken thighs with potatoes", ["lunch", "dinner"], "50 min",
    ["4 bone-in chicken thighs", "3 potatoes, in wedges", "2 carrots, in batons", "Juice of 1 lemon, olive oil, oregano"],
    ["Toss everything in the lemon, oil and oregano.", "Roast at 200°C for 45 min.", "Take her meat off the bone and cut it into strips."],
    "Her favourite done the Greek way. Always take the meat off the bone for her, wings especially, because their bones are small.", []),
];
export const SEED_RECIPES = applyFamily(markFreezes(applyBreakfast(applySafety(applySides(applyV4([...BASE_RECIPES, ...MORE_RECIPES, SCRAMBLED, ...STAPLES, ...VEAL_PORK, COURGETTE_COOKIES, SPANAK_COURGETTE]))))));

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// [breakfast, lunch, snack, dinner, newFood, slot for new food]
const PLAN = [
  ["Spanakopita triangles, carrot cookie & fruit", "Youvarlakia (meatball soup)", "Watermelon fingers", "Salmon bites with potato wedges & peas", "", ""],
  ["Spanakopita triangles, carrot cookie & fruit", "Beef & lentil keftedes + orange segments", "Carrot & oat cookies + pear slices", "Lemon-oregano chicken thighs with potatoes", "Lentils", "lunch"],
  ["Spanakopita triangles, carrot cookie & fruit", "Chicken & spinach meatballs + cucumber sticks", "Courgette & cheese muffins", "Turkey meatballs with veggies inside + rice", "Filo & ricotta", "lunch"],
  ["Spanakopita triangles, carrot cookie & fruit", "Chicken & orzo with tomato (kritharaki)", "Courgette & cheese muffins", "Beef & lentil bolognese", "Avocado", "breakfast"],
  ["Spanakopita triangles, carrot cookie & fruit", "Chicken souvlaki with pitta & cucumber", "Carrot & oat cookies + halved blueberries", "Salmon bites with potato wedges & peas", "Chickpeas & tahini", "lunch"],
  ["Spanakopita triangles, carrot cookie & fruit", "Sardine & potato fishcakes", "Courgette & cheese muffins + strawberries", "Lemon-oregano chicken thighs with potatoes", "Sardines", "lunch"],
  ["Spanakopita triangles, carrot cookie & fruit", "Chicken & sweet potato bites + green beans", "Broccoli cheese bites", "Roast chicken with potatoes & sweet potatoes", "Sweet potato", "lunch"],
  ["Spanakopita triangles, carrot cookie & fruit", "Yoghurt-marinated chicken strips + tzatziki", "Baked oat fingers + strawberries", "Turkey meatballs with veggies inside + roast potatoes", "Tzatziki", "lunch"],
  ["Spanakopita triangles, carrot cookie & fruit", "Lemon cod bites with rice", "Courgette & cheese muffins + apple", "Beef & lentil keftedes", "Cod", "lunch"],
  ["Spanakopita triangles, carrot cookie & fruit", "Beef & lentil bolognese", "Carrot & oat cookies", "Salmon bites with potato wedges & peas", "Kiwi", "breakfast"],
  ["Spanakopita triangles, carrot cookie & fruit", "Chicken & broccoli pasta bake squares", "Chickpea & courgette fritters", "Chicken & spinach meatballs", "Broccoli", "lunch"],
  ["Spanakopita triangles, carrot cookie & fruit", "Chicken & orzo with tomato (kritharaki)", "Mango fingers", "Sardine & potato fishcakes", "Mango", "snack"],
  ["Spanakopita triangles, carrot cookie & fruit", "Chicken & sweet potato bites + roast veg fries", "Watermelon fingers + peach", "Youvarlakia (meatball soup)", "Peach", "snack"],
  ["Spanakopita triangles, carrot cookie & fruit", "Lemon-oregano chicken thighs with potatoes + cherry tomatoes", "Carrot & oat cookies", "Roast chicken with potatoes & sweet potatoes", "Cherry tomatoes (quartered)", "lunch"],
];

export function seedDays(recipes = SEED_RECIPES) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const find = (dish) => {
    const d = dish.toLowerCase();
    const r = recipes.find((x) => d === x.title.toLowerCase()) || [...recipes].sort((a, b) => b.title.length - a.title.length).find((x) => d.startsWith(x.title.toLowerCase()));
    if (!r) return { custom: dish };
    const side = dish.slice(r.title.length).replace(/^\s*\+\s*/, "").trim();
    return side ? { recipeId: r.id, side } : { recipeId: r.id };
  };
  const days = {};
  PLAN.forEach((row, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const meals = {};
    ["breakfast", "lunch", "snack", "dinner"].forEach((slot, j) => {
      meals[slot] = find(row[j]);
      if ((slot === "lunch" || slot === "dinner") && meals[slot].recipeId) { const rr = recipes.find((x) => x.id === meals[slot].recipeId); const ws = withSides(rr, meals[slot].side); if (ws) meals[slot].side = ws; }
      if ((slot === "lunch" || slot === "dinner") && meals[slot].recipeId) { const side = completeSide(FOODS, recipes, meals[slot], i + j); if (side) meals[slot].side = side; }
    });
    days[ymd(d)] = { meals };
  });
  return days;
}
