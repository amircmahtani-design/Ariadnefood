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
const DATA_VERSION = 14;
const DEFAULT_SETTINGS = {
  people: ["Amir", "Catherine", "Lia"],
  milkDefault: 600,
  drops: 3,
  iuPerDrop: 200,
  dropName: "D3 Fix Drops 200 IU (InterMed)",
  dropUg: 15,
  vitDTarget: 15,
  // Per 100 ml. Default: USDA FDC 170993, toddler formula ready-to-feed. Replace with the values on her tin.
  formula: { name: "Toddler formula", kcal: 64, protein: 1.78, calcium: 133, iron: 1.37, vitD: 1.0, vitA: 58, vitC: 8.2, zinc: 0.68 },
};

const ABOUT = `Ariadne is 16 months old and lives in Dubai. No food allergies seen so far. She loves chicken in any form (wings, breast, thighs, roast chicken); with roast chicken the family also roasts potatoes and sweet potatoes, but it is not yet clear she eats those, so check the log. She loves oat pancakes, beef meatballs, Greek youvarlakia soup, salmon, potatoes, carrots, spinach and fruit. Her breakfast at the moment is always 3 spanakopita triangles (shop-bought, frozen, cooked in the air fryer) and a homemade carrot cookie. Everything else the family cooks from scratch at home, so suggest home-cooked recipes, not ready-made products. She eats carrot cookies made with Greek yoghurt and eggs (that is how the family gets yoghurt and egg into her), and vegetables hidden in meatballs. She dislikes purées and mushy textures: she wants firm, crisp, finger-food shapes she can hold (fritters, bites, fingers, mini muffins, patties, bakes, soft meatballs). She REJECTS banana (mainly the smell) and GAGS on plain yoghurt: never use banana, and use yoghurt only baked into something (cookies, muffins, marinades). Her day: breakfast about 8:30, lunch 13:00, dinner 17:30, bath 17:30 to 18:00; most mornings she has a class (swimming, Gymboree, baby sensory or messy play), so snacks should travel well. Family staples she eats: chicken wings, chicken drumsticks, beef patties, chicken patties, meatball soup, salmon with potatoes or rice/orzo, watermelon and pancakes as snacks. The family is introducing veal and pork, mostly as keftedakia (small Greek meatballs, halved or flattened for her), soutzoukakia and patties; pork always cooked right through. Ideas the family wants to try: an omelette with cheese, and tahini mixed into yoghurt with fruit (remember she gags on plain yoghurt). Egg on its own was rejected earlier, but on 18/11/2026 she ate scrambled egg happily, so egg is back on: well-cooked scrambled egg with firm curds (no runny bits) and egg baked into recipes are both fine. Earlier she rejected purées of courgette, avocado and pear, but those foods are fine hidden in meatballs or bakes. She also enjoys bolognese, grilled chicken, Greek-style goat, soutzoukakia, diluted kefir, bakery foods, chicken patties, pancakes, carrot bites and watermelon (she no longer eats celery or bell pepper, so leave them out), and likes warm, well-seasoned family food rather than bland baby food. Leftovers rhythm: the family cooks two dishes and each is eaten twice, swapped the next day. Day 1 lunch A and dinner B; day 2 lunch B and dinner A (e.g. Tuesday lunch beef patties is Wednesday dinner, Tuesday dinner salmon orzo is Wednesday lunch). Then two new dishes for days 3 and 4, and so on. The family is introducing small sea bream and large shrimp cooked in the air fryer (shellfish is an allergen: first tries at lunch). Choking safety (she is under 2): no hard raw chunks. Raw apple only grated (the family does not give apple slices, wedges or chunks, not even as a snack); baked or cooked apple is fine; raw carrot and other hard raw veg are grated or cooked soft; cucumber is peeled and cut into long thin spears, never rounds or cubes; round foods (grapes, cherry tomatoes, olives) are quartered lengthwise and blueberries squashed; hard cheese in thin slices or grated, not cubes; nuts only ground or as a thin smooth nut butter; no popcorn, whole nuts or hard sweets. Write the safe cut into every recipe method. She drinks about 600 ml of toddler formula a day and gets 3 drops of D3 Fix (200 IU each, 600 IU / 15 µg) every day.
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
    let [days, recipes, settings, insight] = await Promise.all([
      store.get("days", { type: "json" }),
      store.get("recipes", { type: "json" }),
      store.get("settings", { type: "json" }),
      store.get("insight", { type: "json" }),
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
      recipes = markFreezes(applyBreakfast(recipes));
      const daysTouched = (settings?.dataVersion || 0) < 8; // only the old migrations change days
      settings = { ...DEFAULT_SETTINGS, ...(settings || {}), dataVersion: DATA_VERSION };
      // Never rewrite days unless a migration changed them: a write here could undo a tick made during a deploy.
      await Promise.all([store.setJSON("recipes", recipes), daysTouched ? store.setJSON("days", days) : null, store.setJSON("settings", settings)]);
    }
    return json({ days, recipes, settings: { ...DEFAULT_SETTINGS, ...settings }, insight });
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
      return `${E.dayTitle(k)} (${k})${d.vitD?.done ? " · vitamin D given" : ""}${d.poop?.v ? ` · pooped: ${d.poop.v}` : ""}\n` + E.SLOTS.map(([s, l]) => `  ${l}: ${E.mealTitle(ms[s]) || "-"}${ms[s]?.recipeId ? ` [${ms[s].recipeId}]` : ""}`).join("\n")
        + (d.poopNotes ? `\n  Poop notes: ${d.poopNotes}` : "") + (d.notes ? `\n  Other notes: ${d.notes}` : "");
    };
    const out = [
      `# Ariadne's Table: report for ${E.dayTitle(today)} ${today.slice(0, 4)}`,
      `Generated ${new Date().toISOString()}. Ariadne is 16 months (born 18/07/2025). Dislikes purées and mushy textures. Milk default ${st.settings.milkDefault} ml/day, vitamin D drops ${st.settings.dropUg} µg, vitamin D target ${st.settings.vitDTarget} µg.`,
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
    const library = recipes.map((r) => `${r.id}: ${r.title} [${(r.meals || []).join("/")}]${r.sides?.length ? ` (serve with: ${r.sides.join(", ")})` : ""}${r.freezes ? " (freezes well)" : ""}`).join("\n");
    const analysis = clip(body.analysis, 12000);
    const focus = clip(body.focus, 400);
    const today = DATE_RE.test(body.today || "") ? body.today : new Date().toISOString().slice(0, 10);

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
Plan breakfast, lunch, snack and dinner for 7 days starting ${week}. Breakfast alternates every other day: spanakopita days and a different breakfast in between (scrambled egg, oat or pumpkin pancakes, eggy bread, sweet potato hash, ricotta toast and so on, with fruit as the side if the recipe has none). Two bakes a week, no more: the family bakes only two things per week, so little goes in the freezer. Bake 1 is the breakfast cookie, carrot one week ("spanakbreakfast" on every spanakopita day) and courgette the next ("spanakbreakfast2"). Bake 2 is one baked snack (muffins, oat fingers, sausage rolls and so on), a different one each week. Every snack that week is the cookie, that baked snack, no-cook fresh food (fruit, watermelon or mango fingers, ricotta or hummus toast), or up to 2 snacks from the freezer stash: recipes marked "freezes well" (pancakes, broccoli bites, fritters, sausage rolls and so on) that were batch-cooked once and are reheated from frozen. Aim for a balance: mostly fresh, never more than 2 freezer snacks a week. Follow the parent's request if it says otherwise. By default, lunch and dinner should not repeat breakfast: avoid spanakopita of any kind (ids "spanakopita", "frittata") at lunch or dinner on days when breakfast is spanakopita, unless the parent asks for it. The family can always choose it themselves. Each slot must use a recipe whose meals include that slot (breakfast recipes at breakfast, snack recipes at snack, and so on). Roast chicken with potatoes and sweet potatoes (id "roastchicken") is a family staple: include it once a week as one of the two dishes in a pair. For sides, prefer the names of side recipes in the library, written as plain words exactly as the family would say them (e.g. "broccoli trees"), never with an id or anything in brackets. Mostly use library recipes she has loved or eaten well; avoid ones she keeps rejecting (offer a rejected food again only in a different format). Never use any recipe listed as resting in the analysis. Add exactly 2 or 3 NEW recipes across the week that fill the nutrition gaps in the analysis. Follow the leftovers rhythm strictly: pair the days (Mon+Tue, Wed+Thu, Fri+Sat, Sun stands alone or pairs with next Monday); on the first day of a pair, lunch is dish A and dinner is dish B; on the second day, lunch is B and dinner is A, with the same sides. So the week has about 7 lunch/dinner dishes, each eaten twice. Include oily fish twice, red meat or lentils most days for iron. Every lunch and every dinner must be a complete plate: a protein, a carb (rice, potato, pasta, bread, grains) and a vegetable (hidden veg counts). If the recipe lacks one, add it as the side. When a recipe lists "serve with" sides, include them in the side. A "side" is a short extra such as "orange segments" or "cucumber sticks"; use it for fruit and visible veg. Put new foods at breakfast or lunch, not dinner.
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
