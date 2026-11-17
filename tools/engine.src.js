// Ariadne's Table: shared nutrition engine. Used by the app (public/engine.js) and the server report (netlify/lib/engine.mjs).
// Generated from tools/engine.src.js. Deterministic: every number comes from USDA FoodData Central values in FOODS.
function makeEngine(FOODS, getState){
  const SLOTS=[["breakfast","Breakfast"],["lunch","Lunch"],["snack","Snack"],["dinner","Dinner"]];
  const SLOT_LABEL=Object.fromEntries(SLOTS);
  const AMOUNTS=[["all","All",1],["most","Most",.75],["some","Some",.5],["none","None",0]];
  const FRAC=Object.fromEntries(AMOUNTS.map(a=>[a[0],a[2]]));
  const LIKES=[["loved","Loved it"],["ok","OK"],["rejected","Rejected"],["reaction","Reaction"]];
  const LIKE_LABEL=Object.fromEntries(LIKES);
  const GROUPS=[["protein","Protein"],["veg","Veg"],["fruit","Fruit"],["grain","Starch & grains"],["dairy","Dairy"]];
  const DOW=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const NKEYS=["kcal","protein","fat","fibre","calcium","iron","zinc","vitA","vitC","vitD","omega3"];
  const pad=n=>String(n).padStart(2,"0");
  const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parse=k=>{const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)};
  const addDays=(k,n)=>{const d=parse(k);d.setDate(d.getDate()+n);return key(d)};
  const mondayOf=k=>{const d=parse(k);d.setDate(d.getDate()-((d.getDay()+6)%7));return key(d)};
  const dayTitle=k=>{const d=parse(k);return `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`};
  const shortDay=k=>{const d=parse(k);return `${DOW[d.getDay()].slice(0,3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`};
  const dmy=k=>{const [y,m,d]=k.split("-");return `${d}/${m}/${y}`};
  const clone=o=>JSON.parse(JSON.stringify(o));
  const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
  const r1=n=>n>=10?Math.round(n):Math.round(n*10)/10;
  const S=()=>getState();
  const WORDS=Object.entries(FOODS).flatMap(([k,f])=>f.words.map(w=>[w,k])).sort((a,b)=>b[0].length-a[0].length);
  function matchFood(text){const t=" "+String(text||"").toLowerCase().replace(/[^a-z\s-]/g," ")+" ";for(const [w,k] of WORDS){if(t.includes(" "+w+" ")||t.includes(" "+w+"s ")||t.includes("-"+w+" "))return k}return null}
  const TARGETS=()=>[
    {k:"iron",label:"Iron",unit:"mg",t:7},
    {k:"calcium",label:"Calcium",unit:"mg",t:700},
    {k:"vitD",label:"Vitamin D",unit:"µg",t:+S().settings.vitDTarget||15},
    {k:"protein",label:"Protein",unit:"g",t:13},
    {k:"fibre",label:"Fibre",unit:"g",t:14},
    {k:"vitA",label:"Vitamin A",unit:"µg",t:300},
    {k:"vitC",label:"Vitamin C",unit:"mg",t:15},
    {k:"zinc",label:"Zinc",unit:"mg",t:3},
    {k:"omega3",label:"Omega-3 (DHA+EPA)",unit:"mg",t:100},
  ];
  function addItems(tot,items,frac){for(const [k,g] of items||[]){const f=FOODS[k];if(!f)continue;for(const n of NKEYS)tot[n]=(tot[n]||0)+f.per100[n]*g/100*frac}return tot}
  const recipeById=id=>S().recipes.find(r=>r.id===id);
  function sideParts(text){return String(text||"").split(/\s*(?:\+|,|\bwith\b)\s*/i).map(s=>s.trim()).filter(Boolean).map(s=>{const k=matchFood(s);return {name:cap(s),items:k?[[k,FOODS[k].portion]]:[]}})}
  function partsFor(m){
    if(!m)return [];
    const r=m.recipeId&&recipeById(m.recipeId);let parts=[];
    if(r)parts=(r.parts&&r.parts.length?clone(r.parts):[{name:r.title,items:[]}]);
    else if(m.custom)parts=sideParts(m.custom);
    if(r&&m.side)parts=parts.concat(sideParts(m.side));
    const seen={};return parts.map(p=>{let n=p.name;while(seen[n])n+=" ";seen[n]=1;return {...p,name:n}});
  }
  function mealTitle(m){if(!m)return "";const r=m.recipeId&&recipeById(m.recipeId);if(r)return r.title+(m.side?" + "+m.side:"");return m.custom||""}
  function recipeNutrition(r){const t={};(r.parts||[]).forEach(p=>addItems(t,p.items,1));return t}
  function dayNutrition(k){
    const st=S(),day=st.days[k]||{},meals=day.meals||{},tot={},groups={},missed=[],ate=[];let logged=0;
    SLOTS.forEach(([s])=>{const m=meals[s];if(!m)return;const log=m.log||{};let any=false;
      partsFor(m).forEach(p=>{const a=log[p.name];if(a===undefined||a===null)return;any=true;const fr=FRAC[a]??0;addItems(tot,p.items,fr);
        if(fr===0)missed.push({slot:s,name:p.name.trim(),items:p.items});else ate.push(p.name.trim());
        (p.items||[]).forEach(([fk,g])=>{const f=FOODS[fk];if(f&&g*fr>=8&&GROUPS.some(G=>G[0]===f.group))groups[f.group]=true})});
      if(any)logged++});
    const ml=day.milk!=null?+day.milk:(logged?+st.settings.milkDefault||0:0);
    const fm=st.settings.formula||{};
    NKEYS.forEach(n=>{if(fm[n])tot[n]=(tot[n]||0)+fm[n]*ml/100});
    if(day.vitD&&day.vitD.done)tot.vitD=(tot.vitD||0)+(+st.settings.dropUg||0);
    return {tot,groups,logged,missed,ml,ate};
  }
  function analyse(endKey,n=7){
    const keys=[];for(let i=n-1;i>=0;i--)keys.push(addDays(endKey,-i));
    const used=[],sum={},groupDays={},missed=[];
    keys.forEach(k=>{const d=dayNutrition(k);if(d.logged<2)return;used.push(k);NKEYS.forEach(x=>sum[x]=(sum[x]||0)+(d.tot[x]||0));Object.keys(d.groups).forEach(g=>groupDays[g]=(groupDays[g]||0)+1);d.missed.forEach(m=>missed.push({...m,k}))});
    const avg={};NKEYS.forEach(x=>avg[x]=used.length?(sum[x]||0)/used.length:0);
    const rows=TARGETS().map(t=>({...t,v:avg[t.k]||0,pct:Math.round(100*(avg[t.k]||0)/t.t)}));
    return {keys,used,avg,rows,groupDays,missed,short:rows.filter(r=>r.pct<80)};
  }
  function analysisText(A){
    const st=S(),lines=[];
    lines.push(`Estimated average daily intake over ${A.used.length} logged day(s)${A.used.length?` (${A.used.map(dmy).join(", ")})`:""}. Calculated from USDA FoodData Central, the parts of each meal she ate (All/Most/Some/None), formula and vitamin D drops. Reference values: US Dietary Reference Intakes for ages 1–3. Days with fewer than 2 meals logged are left out.`);
    A.rows.forEach(r=>lines.push(`- ${r.label}: ${r1(r.v)} ${r.unit} of ${r.t} ${r.unit} (${r.pct}%)`));
    lines.push(`Energy: about ${Math.round(A.avg.kcal||0)} kcal/day.`);
    lines.push(`Food groups (days eaten out of ${A.used.length}): `+GROUPS.map(([g,l])=>`${l} ${A.groupDays[g]||0}`).join(", "));
    if(A.missed.length)lines.push("Parts she did not eat at all: "+A.missed.map(m=>`${shortDay(m.k)} ${m.slot}: ${m.name}`).join("; "));
    const likes={},log=[];
    A.keys.forEach(k=>{const ms=(st.days[k]||{}).meals||{};SLOTS.forEach(([s])=>{const m=ms[s];if(!m)return;
      if(m.like)(likes[m.like]=likes[m.like]||[]).push(mealTitle(m));
      const eaten=Object.entries(m.log||{}).filter(([,a])=>a).map(([p,a])=>`${p.trim()} ${a}`).join(", ");
      if(eaten||m.notes)log.push(`${shortDay(k)} ${s} (${mealTitle(m)}): ${eaten||"not logged"}${m.like?` | ${LIKE_LABEL[m.like]}`:""}${m.notes?` | note: ${m.notes}`:""}`)})});
    Object.entries(likes).forEach(([l,arr])=>lines.push(`${LIKE_LABEL[l]}: ${[...new Set(arr)].join("; ")}`));
    if(log.length)lines.push("Meal log:\n"+log.join("\n"));
    return lines.join("\n");
  }
  function rankRecipes(A){
    if(!A.short.length)return [];
    return S().recipes.map(r=>{const n=recipeNutrition(r);let score=0;const hits=[];
      A.short.forEach(s=>{const p=(n[s.k]||0)/s.t;if(p>=.15)hits.push(`${s.label} ${Math.round(p*100)}%`);score+=Math.min(p,.6)*(100-s.pct)});
      return {r,score,hits}}).filter(x=>x.hits.length).sort((a,b)=>b.score-a.score).slice(0,3);
  }
  return {SLOTS,SLOT_LABEL,AMOUNTS,FRAC,LIKES,LIKE_LABEL,GROUPS,DOW,MONTHS,NKEYS,pad,key,parse,addDays,mondayOf,dayTitle,shortDay,dmy,clone,cap,r1,
    matchFood,TARGETS,addItems,recipeById,sideParts,partsFor,mealTitle,recipeNutrition,dayNutrition,analyse,analysisText,rankRecipes};
}
