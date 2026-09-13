/* Beweise: Ordner mit Bildern/Videos, Vorschau, Bearbeiten/Löschen und gemeinsamer Link. */
(() => {
  const SUPABASE_URL="https://qsyijgvikxmwmhaiulne.supabase.co";
  const SUPABASE_KEY="sb_publishable_5qeUg0c0T0IyLh8g0cUj6Q_ZJYgZYJ_";
  const BUCKET="evidence", STATE_KEY="donnerfaust_kanzlei_v1", VIEWER="./beweis.html";
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||"{}")}catch{return {}}};
  const write=x=>localStorage.setItem(STATE_KEY,JSON.stringify(x));
  const client=window.supabase?.createClient?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
  let activeCase="";
  const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const fileUrl=path=>client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  async function saveManifest(folder){
    if(!client||!folder)return;
    const manifest={id:folder.id,name:folder.name,case_id:folder.case_id||"",created_at:folder.created_at||new Date().toISOString(),items:(folder.items||[]).map(x=>({id:x.id,name:x.name,url:x.url,type:x.type||"",file_name:x.file_name||x.name,path:x.path||"",created_at:x.created_at||null}))};
    const blob=new Blob([JSON.stringify(manifest)],{type:"application/json"});
    const result=await client.storage.from(BUCKET).upload(`folders/${folder.id}/manifest.json`,blob,{contentType:"application/json",upsert:true});
    if(result.error)console.error("Beweis-Manifest:",result.error);
  }

  function folderUrl(folderId){const u=new URL(VIEWER,location.href);u.searchParams.set("folder",folderId);return u.href}

  function addNav(){
    const nav=document.querySelector(".sidebar nav");
    if(!nav||nav.querySelector('[data-evidence-nav]'))return;
    const b=document.createElement("button");b.className="nav";b.dataset.evidenceNav="1";b.innerHTML="<i>🔎</i>Beweise";b.onclick=()=>openPanel("");
    const docs=[...nav.querySelectorAll(".nav")].find(x=>x.dataset.nav==="documents"||x.textContent.includes("Dokumente"));
    if(docs)docs.insertAdjacentElement("afterend",b);else nav.appendChild(b);
  }

  function mediaHtml(x){
    const type=String(x.type||"").toLowerCase(),url=esc(x.url||"");
    if(type.startsWith("image/"))return `<div class="ev-media"><img src="${url}" alt="${esc(x.name||x.file_name||"Bild")}" loading="lazy"></div>`;
    if(type.startsWith("video/"))return `<div class="ev-media"><video src="${url}" controls playsinline preload="metadata"></video></div>`;
    return `<div class="ev-media ev-file">📎 ${esc(x.file_name||"Datei")}</div>`;
  }

  function openPanel(caseId=""){
    activeCase=caseId||"";
    const db=read(),cases=db.cases||[],folders=(db.evidence_folders||[]).filter(x=>!activeCase||x.case_id===activeCase);
    const root=document.getElementById("modalroot")||document.body.appendChild(Object.assign(document.createElement("div"),{id:"modalroot"}));
    root.innerHTML=`<div class="modalback"><div class="modal evidence-modal" style="max-width:1050px"><div class="modalhead"><b>Beweisordner</b><button id="evClose" type="button">×</button></div>
      <form id="folderForm"><label>Name des Beweisordners<input name="name" required placeholder="z. B. Beweismittel Akte AZ-2026-001"></label><label>Akte<select name="case_id"><option value="">Allgemeiner Beweisordner</option>${cases.map(c=>`<option value="${esc(c.id)}" ${c.id===activeCase?"selected":""}>${esc(c.file_number)} · ${esc(c.title)}</option>`).join("")}</select></label><button class="btn dark" type="submit">+ Ordner anlegen</button></form><hr>
      <style>.evidence-folders{display:grid;gap:16px}.ev-files{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:14px}.ev-card{border:1px solid #e2e6eb;border-radius:12px;overflow:hidden;background:#fff}.ev-media{height:190px;background:#111;display:flex;align-items:center;justify-content:center}.ev-media img{width:100%;height:100%;object-fit:contain}.ev-media video{width:100%;height:100%;object-fit:contain}.ev-file{color:#fff;padding:15px;box-sizing:border-box}.ev-info{padding:11px}.ev-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.ev-actions button{cursor:pointer}.ev-delete{background:#b42318!important;color:#fff!important;border:0!important}.ev-open{display:inline-block;text-decoration:none;padding:7px 10px;border:1px solid #d0d5dd;border-radius:8px;color:inherit}.ev-folder-actions{display:flex;gap:8px;flex-wrap:wrap}</style>
      <div class="evidence-folders">${folders.map(f=>`<div class="panel" style="margin:0"><div class="panelhead"><b>📁 ${esc(f.name)}</b><span>${(f.items||[]).length} Dateien</span></div><div class="ev-folder-actions"><button class="btn outline" type="button" data-add="${esc(f.id)}">+ Bilder/Videos hinzufügen</button><button class="btn outline" type="button" data-share="${esc(f.id)}">🔗 Gemeinsamen Link</button></div><div class="ev-files">${(f.items||[]).map(x=>`<article class="ev-card">${mediaHtml(x)}<div class="ev-info"><b>${esc(x.name||x.file_name||"Beweismittel")}</b><div class="muted">${esc(x.file_name||"")}</div><div class="ev-actions"><a class="ev-open" href="${esc(x.url||"")}" target="_blank" rel="noopener">Öffnen</a><button class="btn outline" type="button" data-rename="${esc(f.id)}" data-item="${esc(x.id)}">✏️ Bearbeiten</button><button class="btn ev-delete" type="button" data-delete-file="${esc(f.id)}" data-file-id="${esc(x.id)}">🗑️ Löschen</button></div></div></article>`).join("")||'<p class="muted">Noch keine Beweismittel.</p>'}</div></div>`).join("")||'<p class="muted">Noch keine Beweisordner.</p>'}</div>
      </div></div>`;

    root.querySelector("#evClose").onclick=()=>root.innerHTML="";
    root.querySelector("#folderForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),db=read();db.evidence_folders=db.evidence_folders||[];const folder={id:id(),name:String(f.get("name")||"").trim(),case_id:String(f.get("case_id")||""),items:[],created_at:new Date().toISOString()};db.evidence_folders.push(folder);write(db);saveManifest(folder);openPanel(activeCase)};
    root.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addFile(b.dataset.add));
    root.querySelectorAll("[data-share]").forEach(b=>b.onclick=async()=>{const db=read(),folder=(db.evidence_folders||[]).find(x=>x.id===b.dataset.share);if(!folder)return;await saveManifest(folder);const u=folderUrl(folder.id);try{await navigator.clipboard.writeText(u);alert("Gemeinsamer Ordner-Link kopiert:\n\n"+u)}catch{prompt("Gemeinsamer Ordner-Link:",u)}});
    root.querySelectorAll("[data-delete-file]").forEach(b=>b.onclick=()=>deleteFile(b.dataset.deleteFile,b.dataset.fileId));
    root.querySelectorAll("[data-rename]").forEach(b=>b.onclick=()=>renameFile(b.dataset.rename,b.dataset.item));
  }

  async function deleteFile(folderId,fileId){
    const db=read(),folder=(db.evidence_folders||[]).find(x=>x.id===folderId);if(!folder)return;
    const file=(folder.items||[]).find(x=>x.id===fileId);if(!file)return;
    if(!confirm(`Beweismittel „${file.name||file.file_name||"Datei"}“ wirklich löschen?`))return;
    if(client&&file.path){const result=await client.storage.from(BUCKET).remove([file.path]);if(result.error){alert("Löschen fehlgeschlagen:\n\n"+result.error.message);return}}
    folder.items=(folder.items||[]).filter(x=>x.id!==fileId);write(db);await saveManifest(folder);openPanel(activeCase);
  }

  function renameFile(folderId,fileId){
    const db=read(),folder=(db.evidence_folders||[]).find(x=>x.id===folderId),file=(folder?.items||[]).find(x=>x.id===fileId);if(!folder||!file)return;
    const value=prompt("Neuer Name des Beweismittels:",file.name||file.file_name||"");if(value===null)return;const name=value.trim();if(!name)return;file.name=name;write(db);saveManifest(folder);openPanel(activeCase);
  }

  function addFile(folderId){
    const root=document.getElementById("modalroot");
    root.innerHTML=`<div class="modalback"><div class="modal" style="max-width:720px"><div class="modalhead"><b>Beweismittel hinzufügen</b><button id="x" type="button">×</button></div><form id="fileForm"><label>Name für alle ausgewählten Dateien (optional)<input name="name" placeholder="z. B. Tatortfotos"></label><label>Fotos oder Videos<input name="file" type="file" accept="image/*,video/*" multiple required></label><p class="muted">Mehrfachauswahl ist aktiviert. Bilder und Videos werden im Originalformat gespeichert und als Bild bzw. Video dargestellt.</p><div id="st" class="muted">Keine Dateien ausgewählt.</div><div class="actions"><button type="button" class="btn outline" id="c">Abbrechen</button><button type="submit" class="btn dark">Auswahl hochladen</button></div></form></div></div>`;
    root.querySelector("#x").onclick=root.querySelector("#c").onclick=()=>openPanel(activeCase);
    const input=root.querySelector('input[type=file]');input.onchange=()=>{const n=input.files?.length||0;root.querySelector("#st").textContent=n?`${n} Datei${n===1?"":"en"} ausgewählt.`:"Keine Dateien ausgewählt."};
    root.querySelector("#fileForm").onsubmit=e=>uploadMany(e,folderId);
  }

  async function uploadMany(e,folderId){
    e.preventDefault();const form=e.currentTarget,files=Array.from(form.elements.file?.files||[]),fallbackName=String(form.elements.name?.value||"").trim(),db=read(),folder=(db.evidence_folders||[]).find(x=>x.id===folderId);
    if(!client){alert("Supabase ist nicht verfügbar.");return}if(!folder||!files.length){alert("Bitte mindestens eine Datei auswählen.");return}
    const st=document.getElementById("st"),btn=form.querySelector('button[type="submit"]');btn.disabled=true;folder.items=folder.items||[];let done=0;
    for(const file of files){st.textContent=`Upload ${done+1} von ${files.length}: ${file.name}`;const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const path=`folders/${folderId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safe}`;const result=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});if(result.error){console.error("Beweis-Upload:",result.error);continue}folder.items.push({id:id(),name:fallbackName||file.name,url:fileUrl(path),type:file.type||"",file_name:file.name,path,created_at:new Date().toISOString()});done++}
    write(db);if(done>0){st.textContent=`${done} von ${files.length} Dateien hochgeladen. Ordner-Link wird aktualisiert…`;await saveManifest(folder);setTimeout(()=>openPanel(activeCase),700)}else{btn.disabled=false;alert("Keine Datei konnte hochgeladen werden.")}
  }

  function decorateCase(){document.querySelectorAll("[data-case]").forEach(b=>{if(b.parentElement?.querySelector("[data-case-evidence]"))return;const x=document.createElement("button");x.className="mini";x.dataset.caseEvidence="1";x.textContent="Beweise";x.onclick=e=>{e.stopPropagation();openPanel(b.dataset.case)};b.parentElement.appendChild(x)})}
  const t=setInterval(()=>{if(document.querySelector(".sidebar nav")){addNav();decorateCase()}},500);setTimeout(()=>clearInterval(t),120000);
  window.DonnerfaustEvidence={open:openPanel};
})();

/* Beweisbereich direkt in der geöffneten Akte anzeigen. */
(() => {
  const KEY="donnerfaust_kanzlei_v1";
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}};
  function addToCase(){
    const content=document.querySelector(".content");if(!content||content.querySelector("[data-case-evidence-panel]"))return;
    const eyebrow=content.querySelector(".eyebrow");if(!eyebrow||!eyebrow.textContent.trim().startsWith("AKTE"))return;
    const fileNumber=eyebrow.textContent.replace(/^AKTE\s*/i,"").trim(),db=read(),c=(db.cases||[]).find(x=>x.file_number===fileNumber);if(!c)return;
    const folders=(db.evidence_folders||[]).filter(x=>x.case_id===c.id),panel=document.createElement("div");panel.className="panel";panel.dataset.caseEvidencePanel="1";
    panel.innerHTML=`<div class="panelhead"><b>🔎 Beweise</b><button class="btn outline" type="button" id="caseEvidenceAdd">+ Beweise verwalten</button></div>${folders.map(f=>`<div class="listrow"><b>📁 ${esc(f.name)}</b><small>${(f.items||[]).length} Beweismittel</small><button class="mini" type="button" data-folder-open="${esc(f.id)}">Öffnen</button></div>`).join("")||'<p class="muted">Dieser Akte sind noch keine Beweisordner zugeordnet.</p>'}`;
    const columns=content.querySelector(".grid2");if(columns){const right=columns.children[1]||columns;right.appendChild(panel)}else content.appendChild(panel);
    panel.querySelector("#caseEvidenceAdd").onclick=()=>window.DonnerfaustEvidence?.open(c.id);
    panel.querySelectorAll("[data-folder-open]").forEach(b=>b.onclick=()=>window.DonnerfaustEvidence?.open(c.id));
  }
  const observer=new MutationObserver(()=>addToCase());observer.observe(document.body,{childList:true,subtree:true});setTimeout(addToCase,100);
})();
