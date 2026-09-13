/* Externer Aktenzugang: erzeugt einen zufälligen Nur-Lese-Link für die aktuell geöffnete Akte. */
(() => {
  const URL="https://qsyijgvikxmwmhaiulne.supabase.co", KEY="sb_publishable_5qeUg0cUj6Q_ZJYgZYJ_";
  const DBKEY="donnerfaust_kanzlei_v1", TABLE="shared_cases";
  const supabase=window.supabase?.createClient?.(URL,KEY); if(!supabase)return;
  const token=()=>crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-","");
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  function db(){try{return JSON.parse(localStorage.getItem(DBKEY)||"{}")}catch{return {}}}
  function currentCase(){const d=db(), cases=d.cases||[], text=document.querySelector(".content")?.innerText||"";return cases.find(c=>text.includes(c.file_number)||text.includes(c.title))||null}
  function publicUrl(t){return new URL("./akte.html?share="+encodeURIComponent(t),location.href).href}
  async function ensureShare(c, forceNew=false){
    if(!c)return null;
    if(!forceNew){const r=await supabase.from(TABLE).select("token").eq("case_id",c.id).eq("active",true).maybeSingle();if(!r.error&&r.data)return r.data.token}
    const t=token();const r=await supabase.from(TABLE).insert({token:t,case_id:c.id,active:true}).select("token").single();if(r.error){alert("Der externe Aktenzugang konnte nicht erstellt werden. Bitte prüfe die Supabase-Tabelle shared_cases und deren Richtlinien.\n\n"+r.error.message);return null}return r.data.token;
  }
  async function panel(c){
    const root=document.getElementById("modalroot")||document.body.appendChild(Object.assign(document.createElement("div"),{id:"modalroot"}));
    const existing=await ensureShare(c); const u=existing?publicUrl(existing):"";
    root.innerHTML=`<div class="modalback"><div class="modal" style="max-width:720px"><div class="modalhead"><b>🔗 Externer Aktenzugang</b><button id="csx" type="button">×</button></div><p>Dieser Link zeigt ausschließlich diese Akte im Nur-Lese-Modus. Kanzleiverwaltung, andere Akten und Bearbeitungsfunktionen bleiben verborgen.</p><label>Externer Link<input id="shareUrl" readonly value="${esc(u)}"></label><div class="actions"><button class="btn dark" id="copyShare" type="button">📋 Link kopieren</button><button class="btn outline" id="newShare" type="button">♻ Neuen Link erzeugen</button></div></div></div>`;
    root.querySelector("#csx").onclick=()=>root.innerHTML="";
    root.querySelector("#copyShare").onclick=async()=>{await navigator.clipboard?.writeText(u);alert("Der Nur-Lese-Link wurde kopiert.")};
    root.querySelector("#newShare").onclick=async()=>{if(!confirm("Den bisherigen Link deaktivieren und einen neuen erzeugen?"))return;await supabase.from(TABLE).update({active:false}).eq("case_id",c.id).eq("active",true);const t=await ensureShare(c,true);root.querySelector("#shareUrl").value=t?publicUrl(t):""};
  }
  function inject(){const content=document.querySelector(".content");if(!content||content.querySelector("[data-case-share]"))return;const c=currentCase();if(!c)return;const card=document.createElement("div");card.dataset.caseShare="1";card.className="panel";card.style.marginTop="24px";card.innerHTML=`<div class="panelhead"><b>🔗 Externer Aktenzugang</b><span>Nur Lesen</span></div><p class="muted">Freigabe dieser Akte für Justiz, Gericht oder andere berechtigte Stellen.</p><button class="btn dark" type="button">🔗 Externen Link verwalten</button>`;card.querySelector("button").onclick=()=>panel(c);content.appendChild(card)}
  const observer=new MutationObserver(()=>setTimeout(inject,80));observer.observe(document.body,{childList:true,subtree:true});setInterval(inject,1000);
})();
