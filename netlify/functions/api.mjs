import { getStore } from "@netlify/blobs";
import { SEED_RECIPES, seedDays } from "../lib/seed.mjs";
import { FOODS } from "../lib/foods.mjs";
import { makeEngine } from "../lib/engine.mjs";

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
const DATA_VERSION = 2;
const DEFAULT_SETTINGS = {
  people: ["Amir", "Catherine", "Lia"],
  milkDefault: 600,
  dropUg: 10,
  vitDTarget: 15,
  // Per 100 ml. Default: USDA FDC 170993, toddler formula ready-to-feed. Replace with the values on her tin.
  formula: { name: "Toddler formula", kcal: 64, protein: 1.78, calcium: 133, iron: 1.37, vitD: 1.0, vitA: 58, vitC: 8.2, zinc: 0.68 },
};

const ABOUT = `Ariadne is 16 months old and lives in Dubai. No food allergies seen so far. She loves chicken (wings, breast, thighs), beef meatballs, Greek youvarlakia soup, salmon, potatoes, carrots, spinach and fruit. She eats carrot cookies made with Greek yoghurt and eggs (that is how the family gets yoghurt and egg into her), and vegetables hidden in meatballs. She dislikes purées and mushy textures: she wants firm, crisp, finger-food shapes she can hold (fritters, bites, fingers, mini muffins, patties, bakes, soft meatballs). She drinks about 600 ml of toddler formula a day and gets daily vitamin D drops.
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

  if (req.method === "GET" && route === "state") {
    let [days, recipes, settings, insight] = await Promise.all([
      store.get("days", { type: "json" }),
      store.get("recipes", { type: "json" }),
      store.get("settings", { type: "json" }),
      store.get("insight", { type: "json" }),
    ]);
    // One-off data upgrades. v2: recipes carry their plate parts; plan stores recipeId + side.
    // Seed recipes are refreshed, family-added recipes kept, and any day with something logged is left alone.
    if ((settings?.dataVersion || 0) < DATA_VERSION) {
      const seedIds = new Set(SEED_RECIPES.map((r) => r.id));
      recipes = [...SEED_RECIPES.map((r) => { const old = (recipes || []).find((x) => x.id === r.id); return old?.fav ? { ...r, fav: true } : r; }),
        ...(recipes || []).filter((r) => !seedIds.has(r.id))];
      days = days || {};
      for (const [k, v] of Object.entries(seedDays(recipes))) {
        const cur = days[k];
        const used = cur && (cur.vitD || cur.milk != null || Object.values(cur.meals || {}).some((m) => m && ((m.log && Object.keys(m.log).length) || m.like || m.notes)));
        if (!used) days[k] = { ...(cur || {}), meals: v.meals };
      }
      settings = { ...DEFAULT_SETTINGS, ...(settings || {}), dataVersion: DATA_VERSION };
      await Promise.all([store.setJSON("recipes", recipes), store.setJSON("days", days), store.setJSON("settings", settings)]);
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
      return `${E.dayTitle(k)} (${k})${d.vitD?.done ? " · vitamin D given" : ""}\n` + E.SLOTS.map(([s, l]) => `  ${l}: ${E.mealTitle(ms[s]) || "-"}${ms[s]?.recipeId ? ` [${ms[s].recipeId}]` : ""}`).join("\n");
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

  if (route === "settings") {
    if (!isObj(body.settings)) return json({ error: "Bad request" }, 400);
    const cur = (await store.get("settings", { type: "json" })) || DEFAULT_SETTINGS;
    const next = merge({ ...DEFAULT_SETTINGS, ...cur }, body.settings);
    await store.setJSON("settings", next);
    return json({ ok: true, settings: next });
  }

  if (route === "ai") {
    const recipes = (await store.get("recipes", { type: "json" })) || [];
    const library = recipes.map((r) => `${r.id}: ${r.title} [${(r.meals || []).join("/")}]`).join("\n");
    const analysis = clip(body.analysis, 12000);
    const focus = clip(body.focus, 400);
    const today = DATE_RE.test(body.today || "") ? body.today : new Date().toISOString().slice(0, 10);

    if (body.task === "suggest") {
      const system = `You help a family feed their toddler well. ${ABOUT}
You receive a deterministic nutrition analysis (computed from USDA data and what she actually ate, part by part). Treat its numbers as estimates, never as a diagnosis, and do not invent new numbers. Name the specific foods she skipped when they explain a gap (e.g. "left her carrots on Tuesday, so vitamin A was low").
Then invent ONE new recipe in a texture she likes that fills the biggest gaps, using foods she already accepts as the carrier. Do not repeat a recipe from the library.
Reply with ONLY JSON, no markdown:
{"summary":"2-3 plain sentences","gaps":[{"what":"short","why":"one line naming the food or meal behind it"}],"recipe":${RECIPE_SHAPE.split("\n")[0]},"covers":"which gaps it fills","when":{"date":"YYYY-MM-DD within the next 4 days after ${today}","slot":"breakfast|lunch|snack|dinner"},"tryNext":["2-3 short ideas, ideally existing library recipes by name"]}
${RECIPE_SHAPE.split("\n").slice(1).join("\n")}`;
      const content = `Today is ${today}.\n\n${analysis}\n\nRecipe library:\n${library}${focus ? `\n\nParent's request: ${focus}` : ""}`;
      return callAI(system, content, 2500);
    }

    if (body.task === "plan") {
      const week = DATE_RE.test(body.weekStart || "") ? body.weekStart : today;
      const system = `You plan a week of toddler meals. ${ABOUT}
Plan breakfast, lunch, snack and dinner for 7 days starting ${week}. Mostly use library recipes she has loved or eaten well; avoid ones she keeps rejecting (offer a rejected food again only in a different format). Add exactly 2 or 3 NEW recipes across the week that fill the nutrition gaps in the analysis. Reuse ingredients and leftovers across days (e.g. Sunday's roast chicken becomes Monday's chicken bites). Include oily fish twice, red meat or lentils most days for iron, and a vegetable at lunch and dinner. A "side" is a short extra such as "orange segments" or "cucumber sticks"; use it for fruit and visible veg. Put new foods at breakfast or lunch, not dinner.
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
