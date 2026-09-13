/* Externer Aktenzugang – fügt sich unabhängig vom App-Renderzyklus in die Aktenansicht ein. */
(() => {
  const DBKEY="donnerfaust_kanzlei_v1", SHARE_PAGE="./akte-extern.html";
  const esc=s=>String(s??"").replace(/[&<>\"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(DBKEY)||"{}")}catch{return {}}};
  const encode=o=>{const bytes=new TextEncoder().encode(JSON.stringify(o));let bin="";bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")};
  function getCurrentCase(){
    const marker=[...document.querySelectorAll(".eyebrow")].find(x=>x.textContent.trim().startsWith("AKTE "));
    if(!marker)return null;
    const number=marker.textContent.trim().replace(/^AKTE\s*/,"");
    return (read().cases||[]).find(x=>String(x.file_number)===number)||null;
  }
  function addPanel(){
    if(location.pathname.endsWith("akte-extern.html")||document.getElementById("externalSharePanel"))return true;
    const content=document.querySelector(".content"), c=getCurrentCase();
    if(!content||!c)return false;
    const db=read(), client=(db.clients||[]).find(x=>String(x.id)===String(c.client_id))||null;
    const panel=document.createElement("div");panel.id="externalSharePanel";panel.className="panel";panel.style.marginTop="18px";
    panel.innerHTML='<div class="panelhead"><b>🔗 Externer Aktenzugang</b><span>Nur-Lese-Zugriff</span></div><p class="muted">Separater Link für Justiz, Gericht oder andere berechtigte Stellen. Der Empfänger erhält keinen Zugriff auf die Kanzlei.</p><div class="actions"><button class="btn dark" id="createExternalCaseLink" type="button">🔗 Link erstellen</button><button class="btn outline" id="copyExternalCaseLink" type="button" disabled>📋 Link kopieren</button></div><input class="fullinput" id="externalCaseLink" readonly placeholder="Noch kein Freigabelink erstellt …" style="margin-top:10px"><small class="muted">Der Link enthält nur diese Akte, ihre Dokumente und die zugeordneten Beweise und ist schreibgeschützt.</small>';
    content.appendChild(panel);
    const makeLink=()=>{
      const fresh=read(), current=(fresh.cases||[]).find(x=>String(x.id)===String(c.id));
      if(!current){alert("Die Akte wurde nicht gefunden.");return;}
      const cl=(fresh.clients||[]).find(x=>String(x.id)===String(current.client_id))||null;
      const documents=(fresh.documents||[]).filter(x=>String(x.case_id)===String(current.id)).map(x=>({name:x.name,type:x.type,note:x.note}));
      const evidence=(fresh.evidence_folders||[]).filter(x=>String(x.case_id)===String(current.id)).map(f=>({name:f.name,items:(f.items||[]).map(x=>({name:x.name,url:x.url,type:x.type,file_name:x.file_name}))}));
      const snapshot={version:1,case:{file_number:current.file_number,title:current.title,type:current.type,status:current.status,deadline:current.deadline,court:current.court,opponent:current.opponent,incident:current.incident,background:current.background},client:cl?{name:cl.name,email:cl.email,phone:cl.phone,address:cl.address}:null,documents,evidence_folders:evidence};
      const url=new URL(SHARE_PAGE,location.href);url.hash="data="+encode(snapshot);
      const input=document.getElementById("externalCaseLink"),copy=document.getElementById("copyExternalCaseLink");input.value=url.href;copy.disabled=false;
      if(navigator.clipboard)navigator.clipboard.writeText(url.href).then(()=>alert("Aktenlink erstellt und kopiert.")).catch(()=>alert("Aktenlink erstellt. Bitte über 'Link kopieren' kopieren."));else alert("Aktenlink erstellt.");
    };
    document.getElementById("createExternalCaseLink").onclick=makeLink;
    document.getElementById("copyExternalCaseLink").onclick=()=>{const v=document.getElementById("externalCaseLink").value;if(navigator.clipboard)navigator.clipboard.writeText(v).then(()=>alert("Link kopiert."));else prompt("Link:",v)};
    return true;
  }
  let attempts=0;const timer=setInterval(()=>{attempts++;if(addPanel()||attempts>240)clearInterval(timer)},500);
  addPanel();
})();
