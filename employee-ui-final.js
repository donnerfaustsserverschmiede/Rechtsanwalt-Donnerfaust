/* Mitarbeiterverwaltung – Bearbeiten, Löschen, Rollen und kopierbare Einladungslinks */
(() => {
  const DBKEY="donnerfaust_kanzlei_v1";
  const ROLES=["Sekretär","Rechtsanwalt","Inhaber"];
  const read=()=>{try{return JSON.parse(localStorage.getItem(DBKEY)||"{}")}catch{return{}}};
  const save=d=>{localStorage.setItem(DBKEY,JSON.stringify(d));try{window.dispatchEvent(new Event("donnerfaust-data-changed"))}catch{}};
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const normalize=r=>r==="Kanzleiinhaber"||r==="Stellv. Inhaber"?"Inhaber":r==="Assistent"?"Rechtsanwalt":ROLES.includes(r)?r:"Rechtsanwalt";
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const makeLink=(email,name,role)=>{
    if(window.DonnerfaustCreateInvite)return window.DonnerfaustCreateInvite(email,name,role);
    const u=new URL(location.href.split("?")[0].split("#")[0]);
    const data=btoa(unescape(encodeURIComponent(JSON.stringify({email,name,role})))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
    u.searchParams.set("einladung",data);return u.toString();
  };
  function normalizeEmployees(){const d=read();if(!Array.isArray(d.employees))return;let ch=false;d.employees.forEach(e=>{const r=normalize(e.role);if(e.role!==r){e.role=r;ch=true}});if(ch)save(d)}
  function copyLink(box){
    const ta=box.querySelector("#dfEmployeeLink");if(!ta)return;
    const done=()=>{const m=box.querySelector("#dfCopyMsg");if(m)m.textContent="✓ Einladungslink wurde kopiert."};
    const fallback=()=>{try{ta.focus();ta.select();document.execCommand("copy");done()}catch{ta.focus();ta.select();const m=box.querySelector("#dfCopyMsg");if(m)m.textContent="Bitte den markierten Link manuell kopieren."}};
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(ta.value).then(done).catch(fallback);else fallback();
  }
  function showLink(box,link){
    box.querySelector("#dfEmployeeResult").innerHTML=`<div style="margin-top:14px;padding:14px;border-radius:12px;background:#f3f4f6"><b>Einladungslink erstellt</b><textarea id="dfEmployeeLink" readonly style="width:100%;height:76px;box-sizing:border-box;margin-top:9px;padding:9px">${esc(link)}</textarea><button type="button" class="btn dark" id="dfCopyLink" style="margin-top:8px;width:100%">🔗 Link kopieren</button><div id="dfCopyMsg" style="margin-top:7px;font-size:13px"></div><button type="button" class="btn outline" id="dfFinish" style="margin-top:10px;width:100%">Fertig</button></div>`;
    box.querySelector("#dfCopyLink").onclick=()=>copyLink(box);
    box.querySelector("#dfFinish").onclick=()=>{box.remove();if(typeof render==="function")render()};
  }
  function open(mode="new",id=null){
    const old=document.getElementById("dfEmployeeFinalModal");if(old)old.remove();
    const d=read();const emp=id?(d.employees||[]).find(e=>String(e.id)===String(id)):null;
    const box=document.createElement("div");box.id="dfEmployeeFinalModal";box.className="modalback";
    box.innerHTML=`<div class="modal" style="max-width:560px"><div class="modalhead"><b>${emp?"Mitarbeiter bearbeiten":"Mitarbeiter hinzufügen"}</b><button type="button" id="dfefx">×</button></div><form id="dfeff"><label>Name<input name="name" required autocomplete="name" value="${esc(emp?.name||"")}"></label><label>E-Mail-Adresse<input name="email" type="email" required autocomplete="email" value="${esc(emp?.email||"")}"></label><label>Rolle<select name="role" required>${ROLES.map(r=>`<option value="${esc(r)}" ${normalize(emp?.role)===r?"selected":""}>${esc(r)}</option>`).join("")}</select></label><label>Status<select name="status"><option ${emp?.status!=="Offline"?"selected":""}>Online</option><option ${emp?.status==="Offline"?"selected":""}>Offline</option></select></label><div class="actions"><button type="button" class="btn outline" id="dfefc">Abbrechen</button><button class="btn dark">${emp?"Änderungen speichern":"Mitarbeiter speichern"}</button></div><div id="dfEmployeeResult"></div></form></div>`;
    document.body.appendChild(box);
    const close=()=>box.remove();box.querySelector("#dfefx").onclick=box.querySelector("#dfefc").onclick=close;
    box.querySelector("#dfeff").onsubmit=e=>{
      e.preventDefault();const f=new FormData(e.target),name=String(f.get("name")||"").trim(),email=String(f.get("email")||"").trim(),role=String(f.get("role")||""),status=String(f.get("status")||"Online");
      const db=read();db.employees ||= [];
      if(emp){const target=db.employees.find(e=>String(e.id)===String(emp.id));if(target)Object.assign(target,{name,email,role,status});save(db)}
      else {db.employees.push({id:uid(),name,email,role,status});save(db)}
      showLink(box,makeLink(email,name,role));
    };
  }
  function deleteEmployee(id){
    const d=read();const e=(d.employees||[]).find(x=>String(x.id)===String(id));if(!e)return;
    if(String(e.id)==="owner"){alert("Der Kanzleiinhaber kann nicht gelöscht werden.");return}
    if(!confirm(`Mitarbeiter „${e.name||""}“ wirklich löschen?`))return;
    d.employees=d.employees.filter(x=>String(x.id)!==String(id));save(d);
    if(typeof render==="function")render();
  }
  function enhance(){
    normalizeEmployees();
    const h=[...document.querySelectorAll("h1,h2,h3")].find(x=>/Mitarbeiter/.test(x.textContent||""));
    if(!h)return;
    const intro=h.closest(".intro");
    const add=intro?.querySelector('[data-action="newemployee"], [data-action="df-newemployee"]');
    if(add&&!add.dataset.dfBound){add.dataset.dfBound="1";add.textContent="+ Mitarbeiter";add.onclick=e=>{e.preventDefault();e.stopPropagation();open("new")};}
    const d=read(),employees=d.employees||[];
    const cards=[...document.querySelectorAll(".cards > .client")];
    cards.forEach((card,i)=>{
      const e=employees[i];if(!e||card.dataset.dfEmployeeBound)return;
      card.dataset.dfEmployeeBound="1";card.dataset.employeeId=e.id;
      const actions=document.createElement("div");actions.style.cssText="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px";
      actions.innerHTML='<button type="button" class="mini df-edit-employee">Bearbeiten</button><button type="button" class="mini df-delete-employee">Löschen</button>';
      card.appendChild(actions);
      actions.querySelector(".df-edit-employee").onclick=()=>open("edit",e.id);
      actions.querySelector(".df-delete-employee").onclick=()=>deleteEmployee(e.id);
    });
  }
  function intercept(){
    normalizeEmployees();
    document.addEventListener("click",e=>{const b=e.target.closest('[data-action="newemployee"]');if(b){e.preventDefault();e.stopImmediatePropagation();open("new")}},true);
    setInterval(enhance,500);enhance();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",intercept);else intercept();
})();
