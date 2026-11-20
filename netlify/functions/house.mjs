import { getStore } from "@netlify/blobs";

const store = getStore({ name: "ari-meals", consistency: "strong" });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
const validTime = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || "");
const actor = x => ["Amir", "Lia", "Catherine"].includes(x) ? x : "Household";
const defaults = { activity: ["08:30","14:15","15:30","15:00","14:30"], linenDay: 1, ironingDay: -1, laundryDays: [2,4], sundayOff: true };
const dateAdd = (s, i) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0,10); };
const listData = async prefix => { const r = await store.list({ prefix }); return Promise.all(r.blobs.slice(0,300).map(async b => ({ key:b.key, value:await store.get(b.key,{type:"json"}) }))); };

export default async (req) => {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const week = url.searchParams.get("week");
      if (!validDate(week)) return json({error:"Invalid week"},400);
      const dates = Array.from({length:7},(_,i)=>dateAdd(week,i));
      const [tickGroups, questions, custom, cfg] = await Promise.all([
        Promise.all(dates.map(d => listData("house/tick/" + d + "/"))),
        listData("house/q/"), listData("house/custom/"),
        store.get("house/config",{type:"json"})
      ]);
      const checks = {};
      tickGroups.flat().forEach(o => { if(o.value) {const [d,id] = o.key.slice(11).split("/");if(d&&id)checks[d + "/" + id]=o.value;} });
      return json({ checks, questions:questions.map(o=>o.value).filter(Boolean).sort((a,b)=>b.created.localeCompare(a.created)).slice(0,80), custom:custom.map(o=>o.value).filter(Boolean), config:{...defaults,...(cfg || {})} });
    }
    if (req.method !== "POST") return json({error:"Method not allowed"},405);
    const raw = await req.text();
    if (raw.length > 12000) return json({error:"Too large"},413);
    const b = JSON.parse(raw || "{}");
    if (b.action === "tick") {
      if (!validDate(b.date) || !/^[a-z0-9-]{1,80}$/.test(b.id || "")) return json({error:"Invalid task"},400);
      const key = "house/tick/" + b.date + "/" + b.id;
      if (b.done) {
        const record = {done:true,by:actor(b.by),at:new Date().toISOString()};
        await store.setJSON(key,record);
        return json({record});
      }
      await store.delete(key);
      return json({record:null});
    }
    if (b.action === "config") {
      const c = b.config || {};
      if (!Array.isArray(c.activity) || c.activity.length !== 5 || !c.activity.every(validTime) || ![1,2].includes(+c.linenDay)
        || !Number.isInteger(+c.ironingDay) || +c.ironingDay < -1 || +c.ironingDay > 6
        || !Array.isArray(c.laundryDays) || c.laundryDays.length > 7 || !c.laundryDays.every(d=>Number.isInteger(d)&&d>=0&&d<=6)
        || typeof c.sundayOff !== "boolean") return json({error:"Invalid settings"},400);
      const config = { activity:c.activity, linenDay:+c.linenDay, ironingDay:+c.ironingDay, laundryDays:[...new Set(c.laundryDays)], sundayOff:c.sundayOff };
      await store.setJSON("house/config",config);
      return json({config});
    }
    if (b.action === "question") {
      const message = String(b.message || "").trim().slice(0,800);
      if (!message) return json({error:"Please enter a question"},400);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2,7);
      const q = {id,message,by:actor(b.by),created:new Date().toISOString(),answer:"",answeredBy:"",answeredAt:""};
      await store.setJSON("house/q/" + id,q);
      return json({question:q});
    }
    if (b.action === "answer") {
      if (!/^[a-z0-9]{8,30}$/.test(b.id || "")) return json({error:"Invalid question"},400);
      const q = await store.get("house/q/" + b.id,{type:"json"});
      if (!q) return json({error:"Question not found"},404);
      q.answer = String(b.answer || "").trim().slice(0,1300);
      q.answeredBy=actor(b.by);q.answeredAt=new Date().toISOString();
      await store.setJSON("house/q/" + b.id,q);
      return json({question:q});
    }
    if (b.action === "addCustom") {
      const t = b.task || {};
      const title = String(t.title||"").trim().slice(0,90);
      if (!title || !Number.isInteger(+t.day) || +t.day<0 || +t.day>6 || !validTime(t.time)) return json({error:"Complete the task details"},400);
      const id = "extra-" + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
      const task = {id,title,day:+t.day,time:t.time,detail:String(t.detail||"").trim().slice(0,280),category:["Baby","Kitchen","Home"].includes(t.category)?t.category:"Home",by:actor(b.by)};
      await store.setJSON("house/custom/" + id,task);
      return json({task});
    }
    if (b.action === "deleteCustom") {
      if (!/^extra-[a-z0-9]{8,30}$/.test(b.id || "")) return json({error:"Invalid item"},400);
      await store.delete("house/custom/" + b.id);return json({ok:true});
    }
    return json({error:"Unknown action"},404);
  } catch (err) {
    console.error("House planner:",err);
    return json({error:"Could not save or retrieve household data."},500);
  }
};