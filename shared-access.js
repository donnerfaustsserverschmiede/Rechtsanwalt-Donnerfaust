(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const SHARE_PAGE = "./akte-extern.html";
  const esc = s => String(s ?? "").replace(/[&<>\"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY) || "{}"); } catch { return {}; } };
  const encode = obj => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let binary = ""; bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
  };
  function addPanel() {
    if (location.pathname.endsWith("akte-extern.html")) return;
    const content = document.querySelector(".content");
    if (!content || document.getElementById("externalSharePanel")) return;
    const marker = [...content.querySelectorAll(".eyebrow")].find(x => x.textContent.trim().startsWith("AKTE "));
    if (!marker) return;
    const number = marker.textContent.trim().replace(/^AKTE\s*/,"");
    const db = read();
    const c = (db.cases || []).find(x => String(x.file_number) === number);
    if (!c) return;
    const panel = document.createElement("div");
    panel.id = "externalSharePanel"; panel.className = "panel"; panel.style.marginTop = "18px";
    panel.innerHTML = '<div class="panelhead"><b>🔗 Externer Aktenzugang</b><span>Nur-Lese-Zugriff</span></div><p class="muted">Separater Link für Justiz, Gericht oder andere berechtigte Stellen.</p><div class="actions"><button class="btn dark" id="createExternalCaseLink" type="button">🔗 Link erstellen</button><button class="btn outline" id="copyExternalCaseLink" type="button" disabled>📋 Link kopieren</button></div><input class="fullinput" id="externalCaseLink" readonly placeholder="Noch kein Freigabelink erstellt …" style="margin-top:10px"><small class="muted">Der Link ist schreibgeschützt und enthält nur diese Akte, ihre Dokumente und zugeordneten Beweise.</small>';
    content.appendChild(panel);
    const makeLink = () => {
      const fresh = read();
      const current = (fresh.cases || []).find(x => String(x.id) === String(c.id));
      if (!current) { alert("Die Akte wurde nicht gefunden."); return; }
      const client = (fresh.clients || []).find(x => String(x.id) === String(current.client_id)) || null;
      const documents = (fresh.documents || []).filter(x => String(x.case_id) === String(current.id)).map(x => ({name:x.name,type:x.type,note:x.note}));
      const evidence = (fresh.evidence_folders || []).filter(x => String(x.case_id) === String(current.id)).map(f => ({name:f.name,items:(f.items || []).map(x => ({name:x.name,url:x.url,type:x.type,file_name:x.file_name}))}));
      const snapshot = { version:1, case:{file_number:current.file_number,title:current.title,type:current.type,status:current.status,deadline:current.deadline,court:current.court,opponent:current.opponent,incident:current.incident,background:current.background}, client:client ? {name:client.name,email:client.email,phone:client.phone,address:client.address} : null, documents, evidence_folders:evidence };
      const url = new URL(SHARE_PAGE, location.href); url.hash = "data=" + encode(snapshot);
      const input = document.getElementById("externalCaseLink"); input.value = url.href;
      const copy = document.getElementById("copyExternalCaseLink"); copy.disabled = false;
      if (navigator.clipboard) navigator.clipboard.writeText(url.href).then(() => alert("Aktenlink erstellt und kopiert.")); else alert("Aktenlink erstellt.");
    };
    document.getElementById("createExternalCaseLink").onclick = makeLink;
    document.getElementById("copyExternalCaseLink").onclick = () => { const v=document.getElementById("externalCaseLink").value; if(navigator.clipboard) navigator.clipboard.writeText(v).then(()=>alert("Link kopiert.")); else prompt("Link:",v); };
  }
  const observer = new MutationObserver(addPanel);
  setTimeout(() => { const root=document.getElementById("app"); if(root) observer.observe(root,{childList:true,subtree:true}); addPanel(); }, 500);
})();
