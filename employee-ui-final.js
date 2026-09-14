/* Mitarbeiter-UI final: Rollen, E-Mail, Einladungen und saubere Darstellung */
(() => {
  const DBKEY="donnerfaust_kanzlei_v1";
  const ROLES=["Sekretär","Rechtsanwalt","Inhaber"];
  const read=()=>{try{return JSON.parse(localStorage.getItem(DBKEY)||"{}")}catch{return{}}};
  const save=d=>localStorage.setItem(DBKEY,JSON.stringify(d));
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const normalize=r=>r==="Kanzleiinhaber"||r==="Stellv. Inhaber"?"Inhaber":r==="Assistent"?"Rechtsanwalt":ROLES.includes(r)?r:"Rechtsanwalt";
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  function normalizeEmployees(){const d=read();if(!Array.isArray(d.employees))return;let ch=false;d.employees.forEach(e=>{const r=normalize(e.role);if(e.role!==r){e.role=r;ch=true}});if(ch)save(d)}
  function open(){
    const old=document.getElementById("dfEmployeeFinalModal");if(old)old.remove();
    const d=read();normalizeEmployees();const x=read();
    const box=document.createElement("div");box.id="dfEmployeeFinalModal";box.className="modalback";
    box.innerHTML=`<div class="modal" style="max-width:560px"><div class="modalhead"><b>Mitarbeiter hinzufügen</b><button type="button" id="dfefx">×</button></div><form id="dfeff"><label>Name<input name="name" required autocomplete="name"></label><label>E-Mail-Adresse<input name="email" type="email" required autocomplete="email"></label><label>Rolle<select name="role" required>${ROLES.map(r=>`<option value="${r}">${r}</option>`).join("")}</select></label><label>Status<select name="status"><option>Online</option><option>Offline</option></select></label><div class="actions"><button type="button" class="btn outline" id="dfefc">Abbrechen</button><button class="btn dark">Mitarbeiter speichern & Einladung erzeugen</button></div><p class="muted" id="dfefmsg"></p></form></div>`;
    document.body.appendChild(box);const close=()=>box.remove();box.querySelector("#dfefx").onclick=box.querySelector("#dfefc").onclick=close;
    box.querySelector("#dfeff").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=String(f.get("name")).trim(),email=String(f.get("email")).trim(),role=String(f.get("role"));const db=read();db.employees ||= [];const emp={id:uid(),name,email,role,status:String(f.get("status")||"Online")};db.employees.push(emp);save(db);let link="";if(window.DonnerfaustCreateInvite)link=window.DonnerfaustCreateInvite(email,name,role);const msg=box.querySelector("#dfefmsg");msg.innerHTML=`<b>Mitarbeiter gespeichert.</b>${link?`<br><textarea readonly style="width:100%;height:90px;margin-top:10px">${esc(link)}</textarea><br><small>Der Einladungslink wurde erzeugt und in die Zwischenablage kopiert.</small>`:"<br><small>Der Einladungsdienst ist noch nicht verfügbar.</small>"}`;if(link)navigator.clipboard?.writeText(link).catch(()=>{});if(typeof render==="function")render();setTimeout(()=>{const m=document.getElementById("dfEmployeeFinalModal");if(m)m.remove()},link?4000:1200)};
  }
  function intercept(){
    normalizeEmployees();
    document.addEventListener("click",e=>{const b=e.target.closest('[data-action="newemployee"]');if(b){e.preventDefault();e.stopImmediatePropagation();open()}},true);
    const css=document.createElement("style");css.id="df-clean-descriptions";css.textContent=`.intro>div>p,.intro p{display:none!important}.df-employee-pay .panelhead small + small{display:none!important}`;document.head.appendChild(css);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",intercept);else intercept();
})();
