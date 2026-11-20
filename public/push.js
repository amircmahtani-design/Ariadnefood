// Notifications for whoever is using this phone (Amir, Lia or Catherine). Shared by all three apps.
(function(){
  const WHAT={Amir:"Thursday morning, if next week's menu still has empty days.",Lia:"When Catherine finishes the kitchen check and the shopping list is ready.",Catherine:"Thursday morning: the kitchen check for next week's shopping."};
  const who=()=>{try{return localStorage.getItem("ari-me")||""}catch(e){return ""}};
  const ok=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
  const home=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
  const b64=s=>{const p="=".repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...r].map(c=>c.charCodeAt(0)))};
  const post=(r,b)=>fetch("/api/"+r,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}).then(x=>x.json());
  const reg=()=>navigator.serviceWorker.register("/sw.js",{scope:"/"});
  async function sub(){if(!ok())return null;const r=await navigator.serviceWorker.getRegistration("/");return r?r.pushManager.getSubscription():null}
  async function on(){
    const perm=await Notification.requestPermission(); // first thing in the tap, or iPhone ignores it
    if(perm!=="granted")throw new Error(perm==="denied"?"denied":"not now");
    const r=await reg();await navigator.serviceWorker.ready;
    const {key}=await fetch("/api/push-key").then(x=>x.json());
    let s=await r.pushManager.getSubscription();if(!s)s=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(key)});
    await post("push-sub",{who:who(),app:location.pathname.split("/")[1]||"ari",sub:s.toJSON()});
  }
  async function off(){const s=await sub();if(!s)return;await post("push-unsub",{endpoint:s.endpoint}).catch(()=>{});await s.unsubscribe()}
  const st=document.createElement("style");st.textContent=`.pushbox{margin:4px 0 14px;padding:14px 16px;border-radius:16px;background:rgb(82 100 71 / .08)}
.pushbox h3{margin:0 0 4px;font-size:16px;font-weight:700}.pushbox p{margin:0 0 10px;font-size:14.5px;line-height:1.45;opacity:.8}
.pushbox .prow{display:flex;gap:8px;flex-wrap:wrap}.pushbox button{min-height:44px;padding:0 18px;border-radius:999px;border:0;font:inherit;font-weight:700;font-size:15px;background:#526447;color:#fff}
.pushbox button.g{background:transparent;color:#526447;box-shadow:inset 0 0 0 1.5px #52644766}.pushbox .okl{font-weight:700;color:#3f5a2f}`;document.head.appendChild(st);
  async function mount(){
    const box=document.getElementById("pushBox");if(!box)return;const w=who();
    const head=`<h3>Notifications</h3>`;
    if(!w){box.innerHTML=head+`<p>Choose who's using this phone first.</p>`;return}
    if(!ok()||!home()){box.innerHTML=head+`<p>Open the app from its Home Screen icon (not from Safari) to turn these on.</p>`;return}
    const s=await sub().catch(()=>null),perm=Notification.permission;
    const what=`<p>For ${w}: ${WHAT[w]||"family updates."} Silent, on the lock screen.</p>`;
    if(perm==="denied"){box.innerHTML=head+what+`<p>They're blocked on this phone. Turn them on in iPhone Settings, Notifications, then this app.</p>`;return}
    box.innerHTML=head+what+(s?`<div class="prow"><span class="okl" style="align-self:center">On ✓</span><button class="g" data-push="test">Send a test</button><button class="g" data-push="off">Turn off</button></div>`:`<div class="prow"><button data-push="on">Turn on notifications</button></div>`);
  }
  document.addEventListener("click",async e=>{const b=e.target.closest?.("[data-push]");if(!b)return;e.preventDefault();e.stopPropagation();const a=b.dataset.push;b.disabled=true;
    try{if(a==="on")await on();else if(a==="off")await off();else if(a==="test"){const r=await post("push-test",{who:who(),url:location.pathname});if(!r.sent)throw new Error("none")}}
    catch(err){const p=document.querySelector("#pushBox p:last-of-type");if(p)p.textContent=err.message==="denied"?"Notifications were blocked. Turn them on in iPhone Settings, Notifications, then this app.":err.message==="none"?"Couldn't reach this phone. Turn notifications off and on again.":"That didn't work. Try again in a moment."}
    b.disabled=false;mount()},true);
  // Who's using the phone changed: move this phone's notifications to them
  async function setWho(){const s=await sub().catch(()=>null);if(s&&who())post("push-sub",{who:who(),app:location.pathname.split("/")[1]||"ari",sub:s.toJSON()}).catch(()=>{});mount()}
  if(ok()&&home())reg().catch(()=>{});
  window.AriPush={mount,setWho};
})();
