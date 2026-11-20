import { getStore } from "@netlify/blobs";
import { SEED_RECIPES, seedDays } from "../lib/seed.mjs";
import { FOODS } from "../lib/foods.mjs";
import { makeEngine } from "../lib/engine.mjs";
import { applyV4 } from "../lib/prefs-v4.mjs";
import { completeSide } from "../lib/plate.mjs";
import { applySides, withSides } from "../lib/sides.mjs";
import { applySafety } from "../lib/safety.mjs";
import { SCRAMBLED, STAPLES, VEAL_PORK } from "../lib/seed-more.mjs";
import { applyBreakfast, COURGETTE_COOKIES, SPANAK_COURGETTE, markFreezes } from "../lib/breakfast.mjs";
import { applyFamily } from "../lib/family.mjs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// Deep-merge a patch into a target. null deletes a key.
function merge(target, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    if (v === null) delete target[k];
    else if (isObj(v)) target[k] = merge(isObj(target[k]) ? target[k] : {}, v);
    else target[k] = v;
  }
  return target;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATA_VERSION = 15;
const DEFAULT_SETTINGS = {
  people: ["Amir", "Catherine", "Lia"],
  milkDefault: 600,
  drops: 3,
  iuPerDrop: 200,
  dropName: "D3 Fix Drops 200 IU (InterMed)",
  dropUg: 15,
  vitDTarget: 15,
  // Per 100 ml. Default: USDA FDC 170993, toddler formula ready-to-feed. Replace with the values on her tin.
  formula: { name: "LiptoGROW Plus 3", kcal: 64.23, protein: 1.8, fat: 2.84, fibre: 0.49, calcium: 75.6, iron: 0.95, vitD: 1.15, vitA: 67.51, vitC: 13.5, zinc: 0.74, omega3: 6.75 },
};

const ABOUT = `Ariadne is 16 months old and lives in Dubai. No food allergies seen so far. She loves chicken in any form (wings, breast, thighs, roast chicken); with roast chicken the family also roasts potatoes and sweet potatoes, but it is not yet clear she eats those, so check the log. She loves oat pancakes, beef meatballs, Greek youvarlakia soup, salmon, potatoes, carrots, spinach and fruit. Her breakfast at the moment is always 3 spanakopita triangles (shop-bought, frozen, cooked in the air fryer) and a homemade carrot cookie. Everything else the family cooks from scratch at home, so suggest home-cooked recipes, not ready-made products. She eats carrot cookies made with Greek yoghurt and eggs (that is how the family gets yoghurt and egg into her), and vegetables hidden in meatballs. She dislikes purées, mushy, creamy and saucy textures: she wants firm, crisp, finger-food shapes she can hold (fritters, bites, fingers, mini muffins, patties, bakes, soft meatballs). She REJECTS banana (mainly the smell) and GAGS on plain yoghurt: never use banana, and use yoghurt only baked into something (cookies, muffins, marinades). Her day: breakfast about 8:30, lunch 13:00, dinner 17:30, bath 17:30 to 18:00; most mornings she has a class (swimming, Gymboree, baby sensory or messy play), so snacks should travel well. Family staples she eats: chicken wings, chicken drumsticks, beef patties, chicken patties, meatball soup, salmon with potatoes or rice/orzo, watermelon and pancakes as snacks. The family is introducing veal and pork, mostly as keftedakia (small Greek meatballs, halved or flattened for her), soutzoukakia and patties; pork always cooked right through. Recipes marked (family recipe) are the family's own. Treat them like any other recipe: plan a varied mix across the whole library and do not favour them. Ideas the family wants to try: an omelette with cheese, and tahini mixed into yoghurt with fruit (remember she gags on plain yoghurt). Egg on its own was rejected earlier, but on 18/11/2026 she ate scrambled egg happily, so egg is back on: well-cooked scrambled egg with firm curds (no runny bits) and egg baked into recipes are both fine. Earlier she rejected purées of courgette, avocado and pear, but those foods are fine hidden in meatballs or bakes. She also enjoys bolognese, grilled chicken, Greek-style goat, soutzoukakia, diluted kefir, bakery foods, chicken patties, pancakes, carrot bites and watermelon (she no longer eats celery or bell pepper, so leave them out), and likes warm, well-seasoned family food rather than bland baby food. Bake and cook only what the week needs (halve a recipe when the week needs fewer portions) so she mostly eats fresh food, not frozen; freeze only the spare, cooled, with a sticker showing the name and the date it was made, and use frozen food within 3 months, oldest first. Lunch and dinner on the same day are never the same protein type, Catherine has other work so cooking stays around an hour a day, Saturday has no baking, and food is fresh where possible. Sunday is Catherine's day off: on Saturday she cooks for Saturday and Sunday, and on Sunday Amir and Lia only reheat, air-fry the frozen spanakopita triangles or serve no-cook food. Leftovers rhythm: the family cooks two dishes and each is eaten twice, swapped the next day. Day 1 lunch A and dinner B; day 2 lunch B and dinner A (e.g. Tuesday lunch beef patties is Wednesday dinner, Tuesday dinner salmon orzo is Wednesday lunch). Then two new dishes for days 3 and 4, and so on. The family is introducing small sea bream and large shrimp cooked in the air fryer (shellfish is an allergen: first tries at lunch). Choking safety (she is under 2): no hard raw chunks. Raw apple only grated (the family does not give apple slices, wedges or chunks, not even as a snack); baked or cooked apple is fine; raw carrot and other hard raw veg are grated or cooked soft; cucumber is peeled and cut into long thin spears, never rounds or cubes; round foods (grapes, cherry tomatoes, olives) are quartered lengthwise and blueberries squashed; hard cheese in thin slices or grated, not cubes; nuts only ground or as a thin smooth nut butter; no popcorn, whole nuts or hard sweets. Write the safe cut into every recipe method. She drinks about 600 ml of toddler formula a day and gets 3 drops of D3 Fix (200 IU each, 600 IU / 15 µg) every day.
Safety rules: no whole nuts, popcorn or whole roasted chickpeas; quarter round fruit and cherry tomatoes; no added salt, stock cubes or added sugar; rinse feta; cook egg through; take meat off the bone and check fish for bones. Ingredients must be easy to buy in Dubai. Greek and Mediterranean flavours welcome. Metric units, British spelling, concise.`;

const RECIPE_SHAPE = `{"title":"","meals":["breakfast"|"lunch"|"snack"|"dinner"],"time":"25 min","serves":4,"ingredients":["200 g chicken thigh, diced", "..."],"method":["step", "..."],"tip":"how to serve it so she eats it","parts":[{"name":"what is on her plate, e.g. Chicken bites","items":[["food_key", grams_in_ONE_toddler_portion]]}]}
"serves" = number of toddler portions the batch makes. "parts" = the separate things she sees on her plate (a single bake is one part; chicken with potatoes and carrots is three parts), so the family can log each one. "items" use ONLY these food keys, with grams as raw weight in one toddler portion; skip spices and herbs:
${Object.entries(FOODS).map(([k, f]) => `${k} (${f.name})`).join(", ")}`;

async function callAI(system, content, maxTokens) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: "AI isn't switched on for this site yet." }, 503);
  const base = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  const upstream = await fetch(`${base}/v1/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-4-5",
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => "");
    console.log("AI error", upstream.status, t.slice(0, 500));
    return json({ error: "The AI didn't answer. Try again in a minute." }, 502);
  }
  return new Response(upstream.body, { headers: { "content-type": "text/event-stream", "cache-control": "no-store" } });
}


// ---------- Catherine's Day (house schedule at /house/) ----------
const HOUSE_DEFAULT = {
  // Activity start times by weekday (1 = Monday). Ariadne is out about 2 hours with Catherine.
  activities: { 1: { t: "08:30", label: "Activity" }, 2: { t: "14:15", label: "Activity" }, 3: { t: "15:30", label: "Activity" }, 4: { t: "15:00", label: "Activity" }, 5: { t: "14:30", label: "Activity" } },
  outMins: 120,
  sheetsDay: 2,        // bedsheets and towels: Tuesday (Monday morning is the 8:30 class)
  ironing: [],         // weekdays the ironing lady comes; laundry is done the day before
  night: { name: "", from: "19:00", to: "06:00" },
  weekly: [],          // repeating extra jobs: { id, dow, text, time }
};
const HDATE = /^\d{4}-\d{2}-\d{2}$/;
const hid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pruneDates = (o, keep) => { for (const k of Object.keys(o).sort().slice(0, -keep)) delete o[k]; return o; };

const clip = (s, n) => (typeof s === "string" ? s.slice(0, n) : "");

export default async (req) => {
  const store = getStore({ name: "ari-meals", consistency: "strong" });
  const route = new URL(req.url).pathname.replace(/^\/api\/?/, "");

  // Profile pictures: GET /api/avatar/<name>
  if (req.method === "GET" && route.startsWith("avatar/")) {
    const name = decodeURIComponent(route.slice(7));
    const buf = await store.get("avatar:" + name, { type: "arrayBuffer" });
    if (!buf) return new Response("Not found", { status: 404 });
    return new Response(buf, { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" } });
  }

  if (req.method === "GET" && route === "state") {
    let [days, recipes, settings, insight, asks] = await Promise.all([
      store.get("days", { type: "json" }),
      store.get("recipes", { type: "json" }),
      store.get("settings", { type: "json" }),
      store.get("insight", { type: "json" }),
      store.get("asks", { type: "json" }),
    ]);
    // One-off data upgrades. v2: recipes carry their plate parts; plan stores recipeId + side.
    // Seed recipes are refreshed, family-added recipes kept, and any day with something logged is left alone.
    if ((settings?.dataVersion || 0) < 2) {
      const seedIds = new Set(SEED_RECIPES.map((r) => r.id));
      recipes = [...SEED_RECIPES.map((r) => { const old = (recipes || []).find((x) => x.id === r.id); return old?.fav ? { ...r, fav: true } : r; }),
        ...(recipes || []).filter((r) => !seedIds.has(r.id))];
      days = days || {};
      for (const [k, v] of Object.entries(seedDays(recipes))) {
        const cur = days[k];
        const used = cur && (cur.vitD || cur.milk != null || Object.values(cur.meals || {}).some((m) => m && ((m.log && Object.keys(m.log).length) || m.like || m.notes)));
        if (!used) days[k] = { ...(cur || {}), meals: v.meals };
      }
      settings = { ...DEFAULT_SETTINGS, ...(settings || {}), dataVersion: 2 };
    }
    // v3: 47 more recipes, her fixed breakfast (spanakopita triangles & carrot cookie), roast chicken on Sundays.
    // Adds missing recipes only; changes the plan only from today on, and only where nothing has been logged.
    if ((settings?.dataVersion || 0) < 3) {
      const have = new Set((recipes || []).map((r) => r.id));
      recipes = [...(recipes || []), ...SEED_RECIPES.filter((r) => !have.has(r.id))];
      days = days || {};
      const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
      const untouched = (m) => !m || !((m.log && Object.keys(m.log).length) || m.like || m.notes);
      for (let i = 0; i < 14; i++) {
        const k = new Date(Date.parse(today) + i * 864e5).toISOString().slice(0, 10);
        const d = (days[k] = days[k] || {}); d.meals = d.meals || {};
        if (untouched(d.meals.breakfast)) d.meals.breakfast = { recipeId: "spanakbreakfast" };
        if (new Date(k).getUTCDay() === 0 && untouched(d.meals.dinner)) d.meals.dinner = { recipeId: "roastchicken" };
      }
      settings = { ...DEFAULT_SETTINGS, ...(settings || {}), dataVersion: 3 };
    }
    // v4: family's 17/11 update (no banana, no plain yoghurt). Rewrites affected seed recipes, pauses the rest,
    // and swaps banana / yoghurt-bark snacks in unlogged days from today on.
    if ((settings?.dataVersion || 0) < 4) {
      recipes = applyV4(recipes || []);
      days = days || {};
      const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
      for (const [k, d] of Object.entries(days)) {
        if (k < today) continue;
        for (const m of Object.values(d.meals || {})) {
          if (!m || (m.log && Object.keys(m.log).length)) continue;
          if (m.custom && /banana/i.test(m.custom)) m.custom = m.custom.replace(/^banana \+ cheese cubes$/i, "Courgette & cheese muffins").replace(/banana/gi, "apple");
          if (m.side && /banana/i.test(m.side)) m.side = m.side.replace(/banana/gi, "apple");
          if (["yoghurtbark", "mangolollies", "tzatzikisticks", "bananaflax"].includes(m.recipeId)) { m.recipeId = null; m.custom = "Watermelon fingers"; }
        }
      }
      settings = { ...DEFAULT_SETTINGS, ...(settings || {}), dataVersion: 4 };
    }
    // v5: watermelon fingers as a real snack recipe; lunch and dinner never repeat breakfast's spanakopita.
    if ((settings?.dataVersion || 0) < 5) {
      const wm = SEED_RECIPES.find((r) => r.id === "watermelon");
      recipes = recipes || [];
      if (wm && !recipes.some((r) => r.id === "watermelon")) recipes.push(wm);
      days = days || {};
      const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
      for (const [k, d] of Object.entries(days)) {
        if (k < today) continue;
        const ms = d.meals || {};
        for (const [slot, m] of Object.entries(ms)) {
          if (!m || (m.log && Object.keys(m.log).length)) continue;
          const w = m.custom && m.custom.match(/^watermelon fingers(?:\s*\+\s*(.+))?$/i);
          if (w) { m.recipeId = "watermelon"; m.custom = null; if (w[1]) m.side = w[1]; }
          if ((slot === "lunch" || slot === "dinner") && ms.breakfast?.recipeId === "spanakbreakfast" && ["spanakopita", "frittata"].includes(m.recipeId)) m.recipeId = "chickenspinballs";
        }
      }
      settings = { ...DEFAULT_SETTINGS, ...(settings || {}), dataVersion: 5 };
    }
    // v6: every lunch and dinner gets protein + carb + veg; sides fill the gaps in unlogged days from today.
    if ((settings?.dataVersion || 0) < 6) {
      recipes = (recipes || []).map((r) => r.id === "meatballs" && r.title === "Hidden-veg meatballs" ? { ...r, title: "Turkey meatballs with veggies inside" } : r);
      const MOVE = {"chickpeafritters": ["snack", "side"], "broccoli": ["snack", "side"], "quinoabites": ["snack", "side"], "lentilpasties": ["snack", "side"], "spanakopita": ["snack", "side"], "vegfries": ["side", "snack"], "frittata": ["breakfast", "snack"], "lentilfritters": ["snack", "side"]};
      const REPL = {"chickpeafritters": "souvlaki", "broccoli": "broccolibake", "quinoabites": "salmoncakes", "lentilpasties": "pastitsio", "spanakopita": "chickenspinballs", "vegfries": "kofta", "frittata": "chickenspinballs", "lentilfritters": "keftedes"};
      recipes = recipes.map((r) => MOVE[r.id] ? { ...r, meals: MOVE[r.id] } : r);
      days = days || {};
      const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
      let n = 0;
      for (const k of Object.keys(days).sort()) {
        if (k < today) continue;
        const ms = days[k].meals || {};
        for (const slot of ["lunch", "dinner"]) {
          const m = ms[slot];
          if (!m || !m.recipeId || (m.log && Object.keys(m.log).length)) continue;
          if (REPL[m.recipeId]) { m.recipeId = REPL[m.recipeId]; m.side = null; }
          if (m.side && /tzatziki/i.test(m.side)) m.side = m.side.split(/\s*\+\s*/).filter((x) => !/tzatziki/i.test(x)).join(" + ") || null;
          const side = completeSide(FOODS, recipes, m, n++);
          if (side) m.side = side;
        }
      }
      settings = { ...DEFAULT_SETTINGS, ...(settings || {}), dataVersion: 6 };
    }
    // v7: recommended sides ("serve with"), no tzatziki with kofta; plans start from a recipe's sides.
    if ((settings?.dataVersion || 0) < 7) {
      recipes = applySides(recipes || []);
      days = days || {};
      const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
      let n = 0;
      for (const k of Object.keys(days).sort()) {
        if (k < today) continue;
        for (const slot of ["lunch", "dinner"]) {
          const m = (days[k].meals || {})[slot];
          if (!m || !m.recipeId || (m.log && Object.keys(m.log).length)) continue;
          const r = recipes.find((x) => x.id === m.recipeId);
          m.side = withSides(r, m.side);
          const side = completeSide(FOODS, recipes, m, n++);
          if (side) m.side = side;
        }
      }
      settings = { ...DEFAULT_SETTINGS, ...(settings || {}), dataVersion: 7 };
    }
    // v8: choking-safe prep (grated raw apple, peeled thin cucumber spears).
    if ((settings?.dataVersion || 0) < 8) recipes = applySafety(recipes || []);
    // v9: scrambled egg is back on (she ate it on 18/11/2026). v10: the family staples (wings, drumsticks, beef and chicken patties).
    if ((settings?.dataVersion || 0) < DATA_VERSION) {
      for (const r of [SCRAMBLED, ...STAPLES, ...VEAL_PORK, COURGETTE_COOKIES, SPANAK_COURGETTE]) if (!(recipes || []).some((x) => x.id === r.id)) recipes = [...(recipes || []), r];
      if ((settings?.dataVersion || 0) < 14) recipes = markFreezes(applyBreakfast(recipes));
      recipes = applyFamily(recipes);
      const daysTouched = (settings?.dataVersion || 0) < 8; // only the old migrations change days
      settings = { ...DEFAULT_SETTINGS, ...(settings || {}), dataVersion: DATA_VERSION };
      // Never rewrite days unless a migration changed them: a write here could undo a tick made during a deploy.
      await Promise.all([store.setJSON("recipes", recipes), daysTouched ? store.setJSON("days", days) : null, store.setJSON("settings", settings)]);
    }
    const shop = (await store.get("shop", { type: "json" })) || {};
    const pantry = (await store.get("pantry", { type: "json" })) || {};
    return json({ days, recipes, settings: { ...DEFAULT_SETTINGS, ...settings }, insight, asks: (asks || []).slice(-60), shop, pantry });
  }

  // Plain-text report for Claude (or anyone) to read: what she ate, gaps, plan, recipes, and how to write back.
  if (req.method === "GET" && route === "report") {
    const [days, recipes, settings] = await Promise.all([
      store.get("days", { type: "json" }), store.get("recipes", { type: "json" }), store.get("settings", { type: "json" }),
    ]);
    const st = { days: days || {}, recipes: recipes || [], settings: { ...DEFAULT_SETTINGS, ...(settings || {}) } };
    const E = makeEngine(FOODS, () => st);
    const url = new URL(req.url);
    const dubai = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
    const today = DATE_RE.test(url.searchParams.get("today") || "") ? url.searchParams.get("today") : dubai;
    const n = Math.min(Math.max(+url.searchParams.get("days") || 7, 1), 28);
    const A = E.analyse(today, n);
    const planLine = (k) => {
      const d = st.days[k] || {}, ms = d.meals || {};
      return `${E.dayTitle(k)} (${k})${d.vitD?.done ? " · vitamin D given" : ""}${d.poop?.n != null ? ` · poops: ${d.poop.n}` : d.poop?.v ? ` · pooped: ${d.poop.v}` : ""}${d.water != null ? ` · water: ${d.water} cups` : ""}${d.milk != null ? ` · formula: ${d.milk} ml${Array.isArray(d.feeds) && d.feeds.length ? ` (${d.feeds.map((f) => `${f.t || "?"} ${f.ml ?? "?"} ml`).join(", ")})` : ""}` : ""}\n` + E.SLOTS.map(([s, l]) => `  ${l}: ${E.mealTitle(ms[s]) || "-"}${ms[s]?.recipeId ? ` [${ms[s].recipeId}]` : ""}`).join("\n")
        + (d.poopNotes ? `\n  Poop notes: ${d.poopNotes}` : "") + (d.notes ? `\n  Other notes: ${d.notes}` : "");
    };
    const out = [
      `# Ariadne's Table: report for ${E.dayTitle(today)} ${today.slice(0, 4)}`,
      `Generated ${new Date().toISOString()}. Ariadne is 16 months (born 18/07/2025). Dislikes purées, mushy, creamy and saucy textures. Formula (${st.settings.formula?.name || "toddler formula"}) default ${st.settings.milkDefault} ml/day, vitamin D drops ${st.settings.dropUg} µg, vitamin D target ${st.settings.vitDTarget} µg.`,
      ``, `## Nutrition, last ${n} days (deterministic, USDA-based)`, E.analysisText(A),
      ``, `## Library recipes that best cover the gaps`, E.rankRecipes(A).map((x) => `- ${x.r.title} [${x.r.id}]: ${x.hits.join(", ")}`).join("\n") || "- none needed",
      ``, `## Plan, today and next 7 days`, [...Array(8)].map((_, i) => planLine(E.addDays(today, i))).join("\n"),
      ``, `## Recipe library (id: title [meals] · per-portion iron/calcium/vitA)`,
      st.recipes.map((r) => { const t = E.recipeNutrition(r); return `- ${r.id}: ${r.title} [${(r.meals || []).join("/")}] · ${E.r1(t.iron || 0)} mg / ${Math.round(t.calcium || 0)} mg / ${Math.round(t.vitA || 0)} µg${r.fav ? " · favourite" : ""}`; }).join("\n"),
      ``, `## Food keys for recipe parts (grams per toddler portion, raw weight)`, Object.entries(FOODS).map(([k, f]) => `${k} (${f.name})`).join(", "),
      ``, `## Writing back (JSON over POST, same origin)`,
      `- Add or update a recipe: POST /api/recipe {"recipe":{"id","title","meals":["lunch"],"time","serves","ingredients":[],"method":[],"tip","parts":[{"name":"Chicken bites","items":[["chicken_thigh",40]]}]}}`,
      `- Put a recipe in the plan: POST /api/days {"patches":{"YYYY-MM-DD":{"meals":{"lunch":{"recipeId":"id","side":"orange segments","custom":null}}}}}`,
      `- Full data as JSON: GET /api/state`,
    ].join("\n");
    return new Response(out, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  }

  if (req.method === "GET" && route === "house") {
    const [house, ticks, extras, asks, settings] = await Promise.all([
      store.get("house", { type: "json" }), store.get("house-ticks", { type: "json" }),
      store.get("house-extras", { type: "json" }), store.get("house-asks", { type: "json" }), store.get("settings", { type: "json" }),
    ]);
    return json({ house: { ...HOUSE_DEFAULT, ...(house || {}) }, ticks: ticks || {}, extras: extras || {}, asks: (asks || []).slice(-60),
      people: settings?.people || ["Amir", "Catherine", "Lia"], avatars: settings?.avatars || {} });
  }

  if (req.method !== "POST") return json({ error: "Not found" }, 404);
  const raw = await req.text();
  if (raw.length > (route === "ai" ? 5_500_000 : 400_000)) return json({ error: "Too large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Bad request" }, 400); }

  if (route === "days") {
    if (!isObj(body.patches)) return json({ error: "Bad request" }, 400);
    const days = (await store.get("days", { type: "json" })) || {};
    for (const [date, patch] of Object.entries(body.patches)) {
      if (!DATE_RE.test(date) || !isObj(patch)) continue;
      days[date] = merge(isObj(days[date]) ? days[date] : {}, patch);
    }
    await store.setJSON("days", days);
    return json({ ok: true, days });
  }

  if (route === "recipe" || route === "recipes") {
    const list = route === "recipes" ? body.recipes : [body.recipe];
    if (!Array.isArray(list) || !list.every((r) => isObj(r) && r.id && r.title)) return json({ error: "Bad request" }, 400);
    const recipes = (await store.get("recipes", { type: "json" })) || [];
    for (const r of list) {
      const i = recipes.findIndex((x) => x.id === r.id);
      if (i >= 0) recipes[i] = r; else recipes.push(r);
    }
    await store.setJSON("recipes", recipes);
    return json({ ok: true, recipes });
  }

  if (route === "recipe-delete") {
    const recipes = ((await store.get("recipes", { type: "json" })) || []).filter((x) => x.id !== body.id);
    await store.setJSON("recipes", recipes);
    return json({ ok: true, recipes });
  }

  // Shopping tick list: which items are already in the bag, per week (shared between phones).
  if (route === "shop-tick" || route === "shop-clear") {
    const w = String(body.w || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(w)) return json({ error: "Bad request" }, 400);
    const shop = (await store.get("shop", { type: "json" })) || {};
    const set = new Set(shop[w] || []);
    if (route === "shop-clear") set.clear();
    else { const k = clip(body.k, 80); if (!k) return json({ error: "Bad request" }, 400); body.on ? set.add(k) : set.delete(k); }
    shop[w] = [...set];
    for (const k of Object.keys(shop).sort().slice(0, -8)) delete shop[k];
    await store.setJSON("shop", shop);
    return json({ ok: true, shop });
  }
  // Kitchen check before shopping: what's already at home, and who confirmed the list is ready.
  if (route === "pantry-tick" || route === "pantry-done") {
    const w = String(body.w || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(w)) return json({ error: "Bad request" }, 400);
    const pantry = (await store.get("pantry", { type: "json" })) || {};
    const p = pantry[w] || { have: [] };
    if (route === "pantry-tick") { const k = clip(body.k, 80); if (!k) return json({ error: "Bad request" }, 400); const set = new Set(p.have || []); body.on ? set.add(k) : set.delete(k); p.have = [...set]; }
    else if (body.undo) { delete p.by; delete p.at; }
    else { p.by = clip(body.by, 40); p.at = new Date().toISOString(); }
    pantry[w] = p;
    for (const k of Object.keys(pantry).sort().slice(0, -8)) delete pantry[k];
    await store.setJSON("pantry", pantry);
    return json({ ok: true, pantry });
  }

  // Kitchen helper questions: saved Q&A, and Amir's replies (which become house rules for the helper).
  if (route === "ask-save") {
    const it = body.item;
    if (!isObj(it) || !String(it.q || "").trim()) return json({ error: "Bad request" }, 400);
    const asks = (await store.get("asks", { type: "json" })) || [];
    const item = { id: "q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), q: clip(it.q, 1500), who: clip(it.who, 40), at: new Date().toISOString(),
      answer: clip(it.answer, 4000), escalate: ["yes", "urgent"].includes(it.escalate) ? it.escalate : "no", toAmir: clip(it.toAmir, 600) };
    asks.push(item);
    await store.setJSON("asks", asks.slice(-300));
    return json({ ok: true, item, asks: asks.slice(-60) });
  }
  if (route === "ask-reply") {
    const asks = (await store.get("asks", { type: "json" })) || [];
    const it = asks.find((x) => x.id === body.id);
    if (!it) return json({ error: "Not found" }, 404);
    if (body.reply === null) { delete it.reply; delete it.replyBy; delete it.replyAt; }
    else { it.reply = clip(body.reply, 2000); it.replyBy = clip(body.by, 40); it.replyAt = new Date().toISOString(); }
    if (body.done) it.done = true;
    await store.setJSON("asks", asks);
    return json({ ok: true, asks: asks.slice(-60) });
  }

  // Catherine's Day: ticks, one-off jobs, schedule settings, questions.
  if (route === "house-tick") {
    const d = String(body.date || ""), id = clip(body.id, 120);
    if (!HDATE.test(d) || !id) return json({ error: "Bad request" }, 400);
    const ticks = (await store.get("house-ticks", { type: "json" })) || {};
    const day = ticks[d] || {};
    if (body.on) day[id] = { by: clip(body.by, 40), at: new Date().toISOString() }; else delete day[id];
    ticks[d] = day;
    await store.setJSON("house-ticks", pruneDates(ticks, 70));
    return json({ ok: true, ticks });
  }
  if (route === "house-extra") {
    const d = String(body.date || "");
    if (!HDATE.test(d)) return json({ error: "Bad request" }, 400);
    const extras = (await store.get("house-extras", { type: "json" })) || {};
    const list = extras[d] || [];
    if (body.remove) extras[d] = list.filter((x) => x.id !== body.remove);
    else {
      const text = clip(body.text, 200).trim();
      if (!text) return json({ error: "Type the job first." }, 400);
      list.push({ id: "x" + hid(), text, time: /^\d{2}:\d{2}$/.test(body.time || "") ? body.time : "", mins: Math.min(Math.max(+body.mins || 30, 5), 240), by: clip(body.by, 40) });
      extras[d] = list;
    }
    if (!extras[d]?.length) delete extras[d];
    await store.setJSON("house-extras", pruneDates(extras, 70));
    return json({ ok: true, extras });
  }
  if (route === "house-settings") {
    if (!isObj(body.house)) return json({ error: "Bad request" }, 400);
    const cur = { ...HOUSE_DEFAULT, ...((await store.get("house", { type: "json" })) || {}) };
    const h = body.house, out = { ...cur };
    if (isObj(h.activities)) {
      out.activities = {};
      for (const dw of [1, 2, 3, 4, 5, 6]) { const a = h.activities[dw]; if (isObj(a) && /^\d{2}:\d{2}$/.test(a.t || "")) out.activities[dw] = { t: a.t, label: clip(a.label, 40) || "Activity" }; }
    }
    if (h.outMins != null) out.outMins = Math.min(Math.max(+h.outMins || 120, 30), 300);
    if (h.sheetsDay != null) out.sheetsDay = [1, 2, 3, 4, 5, 6].includes(+h.sheetsDay) ? +h.sheetsDay : 2;
    if (Array.isArray(h.ironing)) out.ironing = [...new Set(h.ironing.map(Number).filter((x) => x >= 0 && x <= 6))];
    if (isObj(h.night)) out.night = { name: clip(h.night.name, 40), from: /^\d{2}:\d{2}$/.test(h.night.from || "") ? h.night.from : "19:00", to: /^\d{2}:\d{2}$/.test(h.night.to || "") ? h.night.to : "06:00" };
    if (Array.isArray(h.weekly)) out.weekly = h.weekly.filter(isObj).slice(0, 40).map((w) => ({ id: clip(w.id, 40) || "w" + hid(), dow: Math.min(Math.max(+w.dow || 1, 0), 6), text: clip(w.text, 200), time: /^\d{2}:\d{2}$/.test(w.time || "") ? w.time : "", mins: Math.min(Math.max(+w.mins || 30, 5), 240) })).filter((w) => w.text);
    await store.setJSON("house", out);
    return json({ ok: true, house: out });
  }
  if (route === "house-ask-save") {
    const it = body.item;
    if (!isObj(it) || !String(it.q || "").trim()) return json({ error: "Bad request" }, 400);
    const asks = (await store.get("house-asks", { type: "json" })) || [];
    asks.push({ id: "h" + hid(), q: clip(it.q, 1500), who: clip(it.who, 40), at: new Date().toISOString(), answer: clip(it.answer, 4000),
      escalate: ["yes", "urgent"].includes(it.escalate) ? it.escalate : "no", toAmir: clip(it.toAmir, 600) });
    await store.setJSON("house-asks", asks.slice(-300));
    return json({ ok: true, asks: asks.slice(-60) });
  }
  if (route === "house-ask-reply") {
    const asks = (await store.get("house-asks", { type: "json" })) || [];
    const it = asks.find((x) => x.id === body.id);
    if (!it) return json({ error: "Not found" }, 404);
    if (body.reply) { it.reply = clip(body.reply, 2000); it.replyBy = clip(body.by, 40); it.replyAt = new Date().toISOString(); }
    if (body.done) it.done = true;
    await store.setJSON("house-asks", asks);
    return json({ ok: true, asks: asks.slice(-60) });
  }

  if (route === "insight") {
    if (!isObj(body.insight)) return json({ error: "Bad request" }, 400);
    await store.setJSON("insight", body.insight);
    return json({ ok: true });
  }

  if (route === "avatar") {
    const settings = { ...DEFAULT_SETTINGS, ...((await store.get("settings", { type: "json" })) || {}) };
    const name = String(body.name || "");
    if (!(settings.people || []).includes(name)) return json({ error: "Unknown person" }, 400);
    settings.avatars = { ...(settings.avatars || {}) };
    if (body.data === null) {
      await store.delete("avatar:" + name);
      delete settings.avatars[name];
    } else {
      const m = /^data:image\/(webp|jpeg|png);base64,(.+)$/.exec(String(body.data || ""));
      if (!m || m[2].length > 400000) return json({ error: "Bad image" }, 400);
      await store.set("avatar:" + name, Buffer.from(m[2], "base64"));
      settings.avatars[name] = Date.now();
    }
    await store.setJSON("settings", settings);
    return json({ ok: true, settings });
  }

  if (route === "settings") {
    if (!isObj(body.settings)) return json({ error: "Bad request" }, 400);
    const cur = (await store.get("settings", { type: "json" })) || DEFAULT_SETTINGS;
    const next = merge({ ...DEFAULT_SETTINGS, ...cur }, body.settings);
    await store.setJSON("settings", next);
    return json({ ok: true, settings: next });
  }

  if (route === "ai") {
    const recipes = (await store.get("recipes", { type: "json" })) || [];
    const library = recipes.map((r) => `${r.id}: ${r.title} [${(r.meals || []).join("/")}]${r.sides?.length ? ` (serve with: ${r.sides.join(", ")})` : ""}${r.freezes ? " (freezes well)" : ""}${r.family ? " (family recipe)" : ""}`).join("\n");
    const analysis = clip(body.analysis, 12000);
    const focus = clip(body.focus, 400);
    const today = DATE_RE.test(body.today || "") ? body.today : new Date().toISOString().slice(0, 10);

    if (body.task === "house-ask") {
      const q = clip(body.q, 1500).trim();
      if (!q) return json({ error: "Type a question first." }, 400);
      const asks = (await store.get("house-asks", { type: "json" })) || [];
      const rules = asks.filter((a) => a.reply).slice(-40).map((a) => `- Q: ${a.q}\n  Amir/Lia: ${a.reply}`).join("\n") || "- none yet";
      const recent = asks.slice(-8).map((a) => `- ${a.who || "?"} asked: ${a.q}\n  helper said: ${a.answer}`).join("\n") || "- none";
      const system = `You are the helper inside "Catherine's Day", the household schedule app for Amir and Lia's home in Dubai. Catherine is the live-in nanny for their daughter Ariadne (16 months, born 18/07/2025). You answer Catherine's questions about what to do and when, so that Amir and Lia are only asked when it is truly needed.
How the house works: every day except Sunday (Catherine's day off) Catherine takes Ariadne to the park from 6:00 to about 8:00 and gives her breakfast at 8:30 (earlier when there is an early class). After breakfast Lia takes over with Ariadne so Catherine can do the house jobs. Catherine takes Ariadne to her activities (about 2 hours out). Catherine cooks Ariadne's food from the plan in Ariadne's Table (the meal app on the same site), cleans the cooking area and does the dishes. Beds are made every morning. Bedsheets and towels are changed once a week. Laundry is done the day before the ironing lady comes. A separate cleaning lady does the cleaning, so cleaning is NOT Catherine's job. Catherine has a 1 hour lunch break. Someone takes over at 19:00 and handles the night until 6:00.
The schedule you are given is the source of truth for times and jobs. Use it to answer "what next", "when do I", and "I'm running late" questions: suggest a sensible re-order of the remaining jobs (the activity times, Ariadne's meals and the lunch break stay fixed). Be decisive: ONE clear answer and the next step. For food and recipe questions, answer briefly and tell her the details are in Ariadne's Table (its Ask tab knows the food plan).
Escalate to Amir only when: it needs the parents' authority (spending money, changing a house rule, guests, anything about Ariadne's health), it depends on something only the parents know, or you are genuinely unsure. For any sign of illness, injury, choking or anything urgent: escalate as "urgent", tell her to call Amir or Lia right away, and in an emergency to call 998 (UAE ambulance).
Earlier answers from Amir or Lia (follow them; they are house rules):
${rules}
Write simple, warm, plain English (Catherine's first language may not be English). Times in 24-hour or am/pm as the schedule shows; dates day first.
Reply with ONLY JSON, no markdown: {"answer":"2-6 short sentences, written to the person asking","escalate":"no" or "yes" or "urgent","toAmir":"if escalating: the question for Amir in one sentence, otherwise empty"}`;
      const content = `Now: ${clip(body.now, 40)}. Asked by: ${clip(body.who, 40) || "someone"}.\n\nSchedule:\n${clip(body.schedule, 12000)}\n\nRecent questions:\n${recent}\n\nQuestion: ${q}`;
      return callAI(system, content, 900);
    }

    if (body.task === "ask") {
      const q = clip(body.q, 1500).trim();
      if (!q) return json({ error: "Type a question first." }, 400);
      const [days, settings, asks] = await Promise.all([store.get("days", { type: "json" }), store.get("settings", { type: "json" }), store.get("asks", { type: "json" })]);
      const st = { days: days || {}, recipes, settings: { ...DEFAULT_SETTINGS, ...(settings || {}) } };
      const E = makeEngine(FOODS, () => st);
      const title = (m) => (m?.recipeId && recipes.find((r) => r.id === m.recipeId)?.title) || m?.custom || "nothing planned";
      const line = (k) => { const d = st.days[k] || {}, ms = d.meals || {};
        return `${E.dayTitle(k)} ${k}: ` + E.SLOTS.map(([sl, l]) => `${l}: ${title(ms[sl])}${ms[sl]?.side ? " + " + ms[sl].side : ""}${ms[sl]?.like ? ` (${ms[sl].like})` : ""}`).join("; ") + (d.notes ? ` · notes: ${d.notes}` : ""); };
      const plan = [...Array(10)].map((_, i) => line(E.addDays(today, i - 2))).join("\n");
      const rules = (asks || []).filter((a) => a.reply).slice(-40).map((a) => `- Q: ${a.q}\n  Amir/Lia: ${a.reply}`).join("\n") || "- none yet";
      const recent = (asks || []).slice(-8).map((a) => `- ${a.who || "?"} asked: ${a.q}\n  helper said: ${a.answer}`).join("\n") || "- none";
      const system = `You are the kitchen helper inside Ariadne's Table, the family's toddler meal app. You answer questions from the people caring for Ariadne, mostly Catherine, the live-in nanny, so that Amir (the dad) is only asked when it is truly needed. ${ABOUT}
House rules: each week uses only 2 or 3 different made-ahead items for breakfasts and snacks (the breakfast cookie plus one or two more), so she is not living on frozen food, everything else is fresh fruit or no-cook; lunch and dinner follow the leftovers rhythm (day 1 lunch A, dinner B; day 2 swapped); breakfast alternates spanakopita days with other breakfasts. Recipes marked "freezes well" can go in the freezer. Standard food safety applies (defrost in the fridge, cooked food cooled and frozen within 2 hours, eat frozen cooked food within about 3 months, reheat until steaming hot then cool for her, never refreeze defrosted cooked food).
Facts about her age (16 months, born 18/07/2025) that you must get right: she is past 12 months, so honey and cow's milk in cooking are allowed (honey is only unsafe under 12 months), though added sugar and salt should stay small. Choking-safe cuts still apply. Only state facts you are sure of; never invent a rule. When you don't know what is in the freezer, tell her how to decide (oldest batch first, label and date everything) instead of naming dishes that may not exist.
Decide things yourself whenever a sensible parent would: freezing, defrosting, storage, using up leftovers or freezer food, swapping a planned meal for another from the library or the freezer, portions, timing, substitutions, recipe steps, what to do if she refuses something, what to cook next. Be decisive: give ONE clear answer and the next step, not a list of options. Where it helps, say which app screen to change (e.g. "swap Thursday's snack to broccoli bites in My Week").
Escalate to Amir only when: a decision needs the parents' authority (spending beyond normal groceries, changing a family rule, new foods that are common allergens she has not had before, anything outside food), or the answer depends on something only the parents know, or you are genuinely unsure. For any sign of illness, an allergic reaction, choking, injury, or anything urgent: escalate as "urgent", tell her to call Amir or Lia right away, and in an emergency to call 998 (UAE ambulance).
Earlier answers from Amir or Lia (follow them; they are house rules):
${rules}
Reply with ONLY JSON, no markdown: {"answer":"plain, warm, short (2-6 sentences), written to the person asking","escalate":"no" or "yes" or "urgent","toAmir":"if escalating: the question for Amir in one sentence, otherwise empty"}`;
      const content = `Today is ${today}. Asked by: ${clip(body.who, 40) || "someone"}.\n\nPlan (2 days back to 7 ahead):\n${plan}\n\nRecipe library:\n${library}\n\nRecent questions:\n${recent}\n\nQuestion: ${q}`;
      return callAI(system, content, 900);
    }

    if (body.task === "suggest") {
      const system = `You help a family feed their toddler well. ${ABOUT}
You receive a deterministic nutrition analysis (computed from USDA data and what she actually ate, part by part). Treat its numbers as estimates, never as a diagnosis, and do not invent new numbers. Name the specific foods she skipped when they explain a gap (e.g. "left her carrots on Tuesday, so vitamin A was low").
Then invent ONE new recipe in a texture she likes that fills the biggest gaps, using foods she already accepts as the carrier. Do not repeat a recipe from the library, and do not base it on a recipe listed as resting.
Reply with ONLY JSON, no markdown:
{"summary":"2-3 plain sentences","gaps":[{"what":"short","why":"one line naming the food or meal behind it"}],"recipe":${RECIPE_SHAPE.split("\n")[0]},"covers":"which gaps it fills","when":{"date":"YYYY-MM-DD within the next 4 days after ${today}","slot":"breakfast|lunch|snack|dinner"},"tryNext":["2-3 short ideas, ideally existing library recipes by name"]}
${RECIPE_SHAPE.split("\n").slice(1).join("\n")}`;
      const content = `Today is ${today}.\n\n${analysis}\n\nRecipe library:\n${library}${focus ? `\n\nParent's request: ${focus}` : ""}`;
      return callAI(system, content, 2500);
    }

    if (body.task === "plan") {
      const week = DATE_RE.test(body.weekStart || "") ? body.weekStart : today;
      const system = `You plan a week of toddler meals. ${ABOUT}
Plan breakfast, lunch, snack and dinner for 7 days starting ${week}. Breakfast alternates every other day: spanakopita days and a different breakfast in between (scrambled egg, oat or pumpkin pancakes, eggy bread, sweet potato hash, ricotta toast and so on, with fruit as the side if the recipe has none). Two or three things to make a week, no more: across breakfasts and snacks the week uses 2 or 3 different made-ahead items, never more, (cookies, muffins, pancakes, fritters, bites, hash and so on). Item 1 is the breakfast cookie, carrot one week ("spanakbreakfast" on every spanakopita day) and courgette the next ("spanakbreakfast2"). The other two are reused across the week's in-between breakfasts and snacks (e.g. oat pancakes for Thursday breakfast and Saturday snack). Made-to-order breakfasts like scrambled egg or eggy bread don't count. Every other snack is no-cook fresh food (fruit, watermelon or mango fingers, ricotta or hummus toast). Cookies: two small fresh batches a week, half a recipe each, eaten within 3 days: carrot cookies baked Saturday morning (Saturday breakfast "spanakplain") for Saturday to Tuesday, courgette cookies baked Tuesday afternoon for Wednesday to Friday. Every snack is "carrotsnack" or "courgsnack" (half a cookie with that week's fruit as the side), and spanakopita breakfasts on alternate days use the matching cookie ("spanakbreakfast" carrot, "spanakbreakfast2" courgette). The same cookie at breakfast and snack on one day is fine. Fruit: pick only 3 fruits for the whole week and use just those for every fruit side and fruit snack, then change the 3 the next week (strawberries, orange, watermelon, kiwi, pear, mango, halved blueberries, melon). The "fruitplate" snack takes two of the week's fruits as its side, e.g. "kiwi + pear slices". Follow the parent's request if it says otherwise. By default, lunch and dinner should not repeat breakfast: avoid spanakopita of any kind (ids "spanakopita", "frittata") at lunch or dinner on days when breakfast is spanakopita, unless the parent asks for it. The family can always choose it themselves. Each slot must use a recipe whose meals include that slot (breakfast recipes at breakfast, snack recipes at snack, and so on). Roast chicken with potatoes and sweet potatoes (id "roastchicken") is a family staple: include it once a week as one of the two dishes in a pair. For sides, prefer the names of side recipes in the library, written as plain words exactly as the family would say them (e.g. "broccoli trees"), never with an id or anything in brackets. Mostly use library recipes she has loved or eaten well; avoid ones she keeps rejecting (offer a rejected food again only in a different format). Never use any recipe listed as resting in the analysis. Add exactly 2 or 3 NEW recipes across the week that fill the nutrition gaps in the analysis. Follow the leftovers rhythm strictly: pair the days Mon+Tue, Wed+Thu and Sat+Sun; on the first day of a pair, lunch is dish A and dinner is dish B; on the second day, lunch is B and dinner is A, with the same sides. Friday stands alone: two quick dishes (about 30 minutes each), one for lunch and one for dinner. Protein variety: lunch and dinner on the same day must never be the same protein type (chicken and turkey both count as poultry; beef, lamb, pork, veal, fish, egg and lentils/chickpeas are the others), and avoid the same protein two days running where you can. Time: Catherine also has other work, so keep each day's cooking to about an hour. Saturday cooks the two weekend dishes, so pick quick ones (40 minutes or less each) and put no baking on Saturday (exception: if Saturday breakfast is the no-cook "spanakplain", the breakfast time is used to bake that week's cookies); schedule baking on light days (the leftover days, or Friday). Prefer fresh food: leftovers only the next day. Sunday is Catherine's day off, so everything on Sunday must be cooked on Saturday (the Sat+Sun pair), come from the freezer, or need no cooking; Sunday breakfast is the spanakopita breakfast (just air-fry the frozen triangles) or something made on Saturday, and the Sunday snack is the week's cookie, a freezer snack or fresh fruit. Include oily fish twice, red meat or lentils most days for iron. Every lunch and every dinner must be a complete plate: a protein, a carb (rice, potato, pasta, bread, grains) and a vegetable (hidden veg counts). If the recipe lacks one, add it as the side. When a recipe lists "serve with" sides, include them in the side. A "side" is a short extra such as "orange segments" or "cucumber sticks"; use it for fruit and visible veg. Put new foods at breakfast or lunch, not dinner.
Reply with ONLY JSON, no markdown:
{"note":"one sentence on the thinking behind the week","newRecipes":[{"ref":"new1", ...recipe fields}],"days":[{"date":"YYYY-MM-DD","breakfast":{"recipe":"library id or new1","side":""},"lunch":{...},"snack":{...},"dinner":{...}}]}
Each new recipe has these fields: ${RECIPE_SHAPE}`;
      const content = `${analysis}\n\nRecipe library (id: title [meals]):\n${library}${focus ? `\n\nParent's request: ${focus}` : ""}`;
      return callAI(system, content, 6000);
    }

    if (body.task === "photo") {
      const imgs = (Array.isArray(body.images) ? body.images : []).slice(0, 4)
        .filter((s) => typeof s === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(s))
        .map((s) => {
          const [, type, data] = s.match(/^data:(image\/\w+);base64,(.*)$/);
          return { type: "image", source: { type: "base64", media_type: type, data } };
        });
      if (!imgs.length) return json({ error: "No photo received." }, 400);
      const system = `You turn photos of recipes (a cookbook page, handwritten notes, a screen) or of a finished dish into a structured toddler recipe. ${ABOUT}
Copy the recipe faithfully when it is written down; if it is only a photo of food, work out a sensible home recipe for it. Adapt for a toddler only where safety requires it (no added salt, etc.) and say so in the tip.
Reply with ONLY JSON, no markdown: {"recipe":${RECIPE_SHAPE}}`;
      return callAI(system, [...imgs, { type: "text", text: `Turn this into a recipe for Ariadne.${focus ? ` Note from the family: ${focus}` : ""}` }], 2500);
    }

    return json({ error: "Unknown task" }, 400);
  }

  return json({ error: "Not found" }, 404);
};

export const config = { path: "/api/*" };
