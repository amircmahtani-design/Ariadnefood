// Web push for the family's Home Screen apps. Keys are made once and kept in the store, never in the code.
import webpush from "web-push";

export async function pushKeys(store) {
  let k = await store.get("pushkeys", { type: "json" });
  if (!k?.publicKey) { k = webpush.generateVAPIDKeys(); await store.setJSON("pushkeys", k); }
  return k;
}

// Send to every phone signed in as `who` (Amir, Lia, Catherine). Phones that have unsubscribed are tidied away.
export async function pushTo(store, who, msg) {
  const subs = (await store.get("pushsubs", { type: "json" })) || {};
  const mine = Object.entries(subs).filter(([, s]) => s.who === who && !s.off);
  if (!mine.length) return 0;
  const k = await pushKeys(store);
  webpush.setVapidDetails("mailto:amircmahtani@gmail.com", k.publicKey, k.privateKey);
  let sent = 0, gone = false;
  await Promise.all(mine.map(async ([ep, s]) => {
    try { await webpush.sendNotification(s.sub, JSON.stringify(msg), { TTL: 60 * 60 * 24, urgency: "normal" }); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) { delete subs[ep]; gone = true; } }
  }));
  if (gone) await store.setJSON("pushsubs", subs);
  return sent;
}
