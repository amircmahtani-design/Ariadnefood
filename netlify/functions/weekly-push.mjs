// Thursday 08:30 Dubai: the two weekly nudges, each to one person only.
//   Catherine: kitchen check for next week's shopping (if not done yet)
//   Amir: next week's menu still has empty days (if any)
import { getStore } from "@netlify/blobs";
import { pushTo } from "../lib/push.mjs";

const key = (d) => d.toISOString().slice(0, 10);

export default async () => {
  const store = getStore({ name: "ari-meals", consistency: "strong" });
  const now = new Date(Date.now() + 4 * 36e5); // Dubai time
  const sat = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + ((6 - now.getUTCDay() + 7) % 7 || 7)));
  const w = key(sat);
  const [pantry, days] = await Promise.all([store.get("pantry", { type: "json" }), store.get("days", { type: "json" })]);
  if (!pantry?.[w]?.at) await pushTo(store, "Catherine", { title: "Kitchen check for next week", body: "Tick what's already at home so the shopping list is ready for Lia.", url: `/?shop=${w}` });
  let empty = 0;
  for (let i = 0; i < 7; i++) { const m = days?.[key(new Date(sat.getTime() + i * 864e5))]?.meals || {};
    if (["lunch", "dinner"].some((s) => !m[s]?.recipeId && !m[s]?.custom)) empty++; }
  if (empty) await pushTo(store, "Amir", { title: "Next week's menu isn't finished", body: `${empty} ${empty === 1 ? "day still has" : "days still have"} an empty lunch or dinner.`, url: "/" });
  return new Response("ok");
};

export const config = { schedule: "30 4 * * 4" };
