/* Beweise: Upload in Supabase Storage + öffentliche Einzelansicht ohne Kanzlei-Login. */
(() => {
  const URL = "https://qsyijgvikxmwmhaiulne.supabase.co";
  const KEY = "sb_publishable_5qeUg0c0T0IyLh8g0cUj6Q_ZJYgZYJ_";
  const BUCKET = "evidence";
  const STATE_KEY = "donnerfaust_kanzlei_v1";
  const VIEWER = "./beweis.html";
  const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const read = () => { try { return JSON.parse(localStorage.getItem(STATE_KEY)||"{}"); } catch { return {}; } };
  const write = db => localStorage.setItem(STATE_KEY, JSON.stringify(db));
  const client = window.supabase?.createClient ? window.supabase.createClient(URL, KEY) : null;
  let activeCase = "";

  function addNav(){
    const nav=document.querySelector(".sidebar nav");
    if(!nav || nav.querySelector('[data-evidence-nav]')) return;
    const b=document.createElement("button"); b.className="nav"; b.dataset.evidenceNav="1"; b.innerHTML="<i>🔎</i>Beweise";
    b.onclick=()=>openPanel(""); nav.appendChild(b);
  }

  function openPanel(caseId=""){
    activeCase=caseId||"";
    const db=read(); const cases=db.cases||[]; const items=(db.evidence||[]).filter(x=>!activeCase||x.case_id===activeCase);
    const root=document.getElementById("modalroot")||document.body.appendChild(Object.assign(document.createElement("div"),{id:"modalroot"}));
    root.innerHTML=`<div class="modalback"><div class="modal" style="max-width:820px"><div class="modalhead"><b>Beweise</b><button id="evClose">×</button></div>
      <form id="evForm">
        <label>Name des Beweises<input name="name" required placeholder="z. B. Überwachungsvideo 08.08.2026"></label>
        <label>Akte<select name="case_id"><option value="">Allgemeiner Beweis</option>${cases.map(c=>`<option value="${esc(c.id)}" ${c.id===activeCase?"selected":""}>${esc(c.file_number)} · ${esc(c.title)}</option>`).join("")}</select></label>
        <label>Datei (Bild oder Video)<input name="file" type="file" accept="image/*,video/*" required></label>
        <div id="evStatus" class="muted">Maximalgröße hängt von deiner Supabase-Storage-Konfiguration ab.</div>
        <div class="actions"><button type="button" class="btn outline" id="evCancel">Abbrechen</button><button class="btn dark" id="evUpload">Beweis hochladen</button></div>
      </form>
      <hr><h3>Vorhandene Beweise</h3><div>${items.map(x=>`<div class="listrow"><b>${esc(x.name)}</b><small>${esc(x.type)}${x.case_id?" · "+esc(cases.find(c=>c.id===x.case_id)?.file_number||""):""}</small><a class="mini" target="_blank" rel="noopener" href="${esc(x.viewer_url)}">Öffnen</a></div>`).join("")||'<p class="muted">Noch keine Beweise.</p>'}</div>
    </div></div>`;
    document.getElementById("evClose").onclick=document.getElementById("evCancel").onclick=()=>root.innerHTML="";
    document.getElementById("evForm").onsubmit=upload;
  }

  async function upload(e){
    e.preventDefault();
    if(!client){alert("Supabase ist nicht verfügbar.");return;}
    const f=new FormData(e.target), name=String(f.get("name")||"").trim(), file=f.get("file"), caseId=String(f.get("case_id")||"");
    if(!name || !(file instanceof File)){return;}
    const status=document.getElementById("evStatus"), btn=document.getElementById("evUpload");
    btn.disabled=true; status.textContent="Beweis wird hochgeladen…";
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=`${new Date().getFullYear()}/${Date.now()}-${safe}`;
    const {error}=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
    if(error){status.textContent="Upload fehlgeschlagen: "+error.message;btn.disabled=false;return;}
    const publicUrl=client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const params=new URLSearchParams({name,url:publicUrl,type:file.type||"Datei"});
    const viewerUrl=`${location.origin}${location.pathname.replace(/[^/]*$/,'')}${VIEWER}?${params.toString()}`;
    const db=read(); db.evidence=db.evidence||[];
    db.evidence.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),name,case_id:caseId,type:file.type||"Datei",file_name:file.name,path,public_url:publicUrl,viewer_url:viewerUrl,created_at:new Date().toISOString()});
    write(db);
    status.innerHTML=`Beweis gespeichert. <a href="${esc(viewerUrl)}" target="_blank">Öffentlichen Link öffnen</a>`;
    btn.disabled=false; setTimeout(()=>openPanel(caseId),500);
  }

  function decorateCase(){
    document.querySelectorAll("[data-case]").forEach(b=>{ if(b.parentElement?.querySelector("[data-case-evidence]")) return; const x=document.createElement("button"); x.className="mini"; x.dataset.caseEvidence="1"; x.textContent="Beweise"; x.onclick=e=>{e.stopPropagation();openPanel(b.dataset.case)}; b.parentElement.appendChild(x); });
  }
  function tick(){addNav();decorateCase();}
  const t=setInterval(()=>{ if(document.querySelector(".sidebar nav")){tick();} },500);
  setTimeout(()=>clearInterval(t),120000);
  window.DonnerfaustEvidence={open:openPanel};
})();
