// Long AI jobs (writing a whole week) can take longer than the 60 seconds a normal function gets.
// This background function (up to 15 minutes) runs the same AI request in-process, reads the whole
// answer, and saves it to Blobs as "aijob:<id>". The app polls GET /api/aijob?id=<id> for the result.
import { getStore } from "@netlify/blobs";
import api from "./api.mjs";

export default async (req) => {
  const store = getStore({ name: "ari-meals", consistency: "strong" });
  let id = "";
  try {
    const { jobId, payload } = await req.json();
    id = String(jobId || "").replace(/[^a-z0-9-]/gi, "").slice(0, 60);
    if (!id) return;
    await store.setJSON("aijob:" + id, { done: false, started: Date.now() });
    const r = await api(new Request(new URL("/api/ai", req.url), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload || {}) }));
    if (!r.ok || !r.body) {
      const j = await r.json().catch(() => ({}));
      await store.setJSON("aijob:" + id, { done: true, error: j.error || "The AI didn't answer. Try again in a minute." });
      return;
    }
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = "", text = "", failed = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        let ev; try { ev = JSON.parse(line.slice(5)); } catch { continue; }
        if (ev.type === "content_block_delta" && ev.delta?.text) text += ev.delta.text;
        if (ev.type === "error") failed = true;
      }
    }
    await store.setJSON("aijob:" + id, failed && !text ? { done: true, error: "The AI is busy. Try again in a minute." } : { done: true, text });
  } catch (e) {
    if (id) await store.setJSON("aijob:" + id, { done: true, error: "The AI didn't answer: " + String(e?.message || e).slice(0, 200) });
  }
};

export const config = { background: true, path: "/bg/aijob" };
