/* Mitarbeiterverwaltung – stabile Oberfläche für Bearbeiten, Löschen und Einladungslinks */
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const ROLES = ["Sekretär", "Rechtsanwalt", "Inhaber"];
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY) || "{}"); } catch { return {}; } };
  const write = d => { localStorage.setItem(DBKEY, JSON.stringify(d)); try { window.dispatchEvent(new Event("donnerfaust-data-changed")); } catch {} };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const normalizeRole = r => r === "Kanzleiinhaber" || r === "Stellv. Inhaber" ? "Inhaber" : r === "Assistent" ? "Rechtsanwalt" : ROLES.includes(r) ? r : "Rechtsanwalt";
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const makeLink = (email, name, role) => {
    if (window.DonnerfaustCreateInvite) return window.DonnerfaustCreateInvite(email, name, role);
    const u = new URL(location.href.split("?")[0].split("#")[0]);
    const raw = encodeURIComponent(JSON.stringify({ email, name, role }));
    const data = btoa(unescape(raw)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    u.searchParams.set("einladung", data); return u.toString();
  };
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try { const t=document.createElement("textarea"); t.value=text; t.style.position="fixed"; t.style.opacity="0"; document.body.appendChild(t); t.focus(); t.select(); const ok=document.execCommand("copy"); t.remove(); return ok; } catch { return false; }
  };
  function findContent(){const h=[...document.querySelectorAll("h1,h2,h3")].find(x=>/Mitarbeiter/.test(x.textContent||""));return h?.closest(".content")||null;}
  function openForm(emp){
    const old=document.getElementById("dfEmployeeManagementModal");if(old)old.remove();
    const box=document.createElement("div");box.id="dfEmployeeManagementModal";box.className="modalback";
    box.innerHTML=`<div class="modal" style="max-width:560px"><div class="modalhead"><b>${emp?"Mitarbeiter bearbeiten":"Mitarbeiter hinzufügen"}</b><button type="button" id="dfemx">×</button></div><form id="dfemform"><label>Name<input name="name" required value="${esc(emp?.name||"")}"></label><label>E-Mail-Adresse<input name="email" type="email" required value="${esc(emp?.email||"")}"></label><label>Rolle<select name="role">${ROLES.map(r=>`<option ${normalizeRole(emp?.role)===r?"selected":""}>${r}</option>`).join("")}</select></label><label>Status<select name="status"><option ${emp?.status!=="Offline"?"selected":""}>Online</option><option ${emp?.status==="Offline"?"selected":""}>Offline</option></select></label><div class="actions"><button type="button" class="btn outline" id="dfemcancel">Abbrechen</button><button class="btn dark">${emp?"Änderungen speichern":"Mitarbeiter speichern"}</button></div><div id="dfemresult"></div></form></div>`;
    document.body.appendChild(box);const close=()=>box.remove();box.querySelector("#dfemx").onclick=box.querySelector("#dfemcancel").onclick=close;
    box.querySelector("#dfemform").onsubmit=async e=>{
      e.preventDefault();const f=new FormData(e.target),d=read();d.employees||=[];const name=String(f.get("name")||"").trim(),email=String(f.get("email")||"").trim(),role=normalizeRole(String(f.get("role")||"")),status=String(f.get("status")||"Online");
      if(emp){const target=d.employees.find(x=>String(x.id)===String(emp.id));if(target)Object.assign(target,{name,email,role,status});}
      else d.employees.push({id:uid(),name,email,role,status});
      write(d);const link=makeLink(email,name,role);
      box.querySelector("#dfemresult").innerHTML=`<div style="margin-top:14px;padding:14px;border-radius:12px;background:#f3f4f6"><b>Einladungslink erstellt</b><textarea id="dfemlink" readonly style="width:100%;height:78px;box-sizing:border-box;margin-top:8px;padding:9px">${esc(link)}</textarea><button type="button" class="btn dark" id="dfemcopy" style="width:100%;margin-top:8px">🔗 Link kopieren</button><div id="dfemcopymsg" style="margin-top:7px;font-size:13px"></div></div>`;
      box.querySelector("#dfemcopy").onclick=async()=>{const ok=await copy(link);box.querySelector("#dfemcopymsg").textContent=ok?"✓ Link wurde kopiert.":"Bitte den Link markieren und manuell kopieren.";};
      renderPanel();
    };
  }
  async function copyEmployeeLink(id,button){const e=(read().employees||[]).find(x=>String(x.id)===String(id));if(!e)return;const link=makeLink(e.email||"",e.name||"",normalizeRole(e.role));const ok=await copy(link);const old=button.textContent;button.textContent=ok?"✓ Kopiert":"Link markieren";setTimeout(()=>button.textContent=old,1800);}
  function removeEmployee(id){const d=read(),e=(d.employees||[]).find(x=>String(x.id)===String(id));if(!e)return;if(String(id)==="owner"){alert("Der Kanzleiinhaber kann nicht gelöscht werden.");return;}if(!confirm(`Mitarbeiter „${e.name||""}“ wirklich löschen?`))return;d.employees=d.employees.filter(x=>String(x.id)!==String(id));write(d);renderPanel();}
  function normalizeEmployees(){const d=read();if(!Array.isArray(d.employees))return;let changed=false;d.employees.forEach(e=>{const r=normalizeRole(e.role);if(e.role!==r){e.role=r;changed=true;}});if(changed)write(d);}
  function renderPanel(){
    const content=findContent();if(!content)return;let panel=document.getElementById("dfEmployeeManagementPanel");if(!panel){panel=document.createElement("div");panel.id="dfEmployeeManagementPanel";panel.className="panel";panel.style.marginTop="18px";content.appendChild(panel);}
    const d=read();d.employees||=[];
    panel.innerHTML=`<div class="panelhead"><div><b>Mitarbeiterverwaltung</b><small style="display:block">Aufgabe und Vergütung werden über die Rolle zugeordnet.</small></div><button type="button" class="btn dark" id="dfemnew">+ Mitarbeiter</button></div><div style="display:grid;gap:10px;margin-top:12px">${d.employees.map(e=>`<div class="listrow" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div style="flex:1;min-width:180px"><b>${esc(e.name||"Unbenannt")}</b><small style="display:block">${esc(e.email||"Keine E-Mail")} · ${esc(normalizeRole(e.role))}</small></div><span class="badge ${e.status==="Offline"?"warn":"good"}">${esc(e.status||"Online")}</span><button type="button" class="mini" data-df-edit="${esc(e.id)}">Bearbeiten</button><button type="button" class="mini" data-df-link="${esc(e.id)}">🔗 Link kopieren</button><button type="button" class="mini" data-df-delete="${esc(e.id)}">Löschen</button></div>`).join("")}</div>`;
    panel.querySelector("#dfemnew").onclick=()=>openForm(null);
    panel.querySelectorAll("[data-df-edit]").forEach(b=>b.onclick=()=>{const x=read().employees?.find(e=>String(e.id)===String(b.dataset.dfEdit));if(x)openForm(x);});
    panel.querySelectorAll("[data-df-link]").forEach(b=>b.onclick=()=>copyEmployeeLink(b.dataset.dfLink,b));
    panel.querySelectorAll("[data-df-delete]").forEach(b=>b.onclick=()=>removeEmployee(b.dataset.dfDelete));
  }
  function interceptOldButton(){document.querySelectorAll('[data-action="newemployee"]').forEach(b=>{if(b.dataset.dfManaged)return;b.dataset.dfManaged="1";b.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();openForm(null);},true);});}
  function run(){if(!findContent())return;normalizeEmployees();renderPanel();interceptOldButton();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();setInterval(run,700);
})();
