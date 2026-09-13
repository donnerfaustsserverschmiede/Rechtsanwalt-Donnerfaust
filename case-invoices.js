/* Rechnungen direkt in der jeweiligen Akte anzeigen */
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":">","\"":"&quot;","'":"&#39;"}[m]));
  const money = n => new Intl.NumberFormat("de-DE", {style:"currency", currency:"EUR"}).format(Number(n) || 0);

  // Das alte Rechnungspanel der Aktenverwaltung wird nicht mehr benötigt.
  // Rechnungen werden ausschließlich über das neue Finanzsystem verwaltet
  // und hier in der Akte nur noch angezeigt.
  function removeLegacyInvoicePanel(content){
    [...content.querySelectorAll(".panel")].forEach(panel => {
      const text = panel.textContent.replace(/\s+/g," ").trim();
      const hasInvoiceHeading = /\bRechnungen\b/i.test(text);
      const hasOldCreateButton = [...panel.querySelectorAll("button")].some(b =>
        /^\s*\+\s*Rechnung\s*$/i.test(b.textContent.trim())
      );
      if(hasInvoiceHeading && hasOldCreateButton){
        panel.remove();
      }
    });
  }

  function addCaseInvoices(){
    const content=document.querySelector(".content");
    if(!content)return;

    // Alte "Rechnungen + Rechnung"-Sektion sicher entfernen.
    removeLegacyInvoicePanel(content);

    if(content.dataset.caseInvoicesAdded==="1")return;
    const eyebrow=[...content.querySelectorAll(".eyebrow")].find(x=>/^AKTE\s+/i.test(x.textContent.trim()));
    if(!eyebrow)return;
    const fileNumber=eyebrow.textContent.trim().replace(/^AKTE\s+/i,"").trim();
    let db;try{db=JSON.parse(localStorage.getItem(DBKEY)||"{}")}catch{return}
    const c=(db.cases||[]).find(x=>x.file_number===fileNumber);if(!c)return;
    const list=(db.invoices||[]).filter(x=>x.case_id===c.id);
    const panel=document.createElement("div");panel.className="panel";panel.dataset.caseInvoices="1";
    panel.innerHTML=`<div class="panelhead"><b>🧾 Rechnungen</b><span class="muted">${list.length}</span></div>${list.map(i=>`<div class="listrow"><b>${esc(i.invoice_number||"Rechnung")} · ${money(i.amount)}</b><small>${esc(i.date||"")} · ${esc(i.status||"Offen")}</small>${(i.lines||[]).length?`<small>${(i.lines||[]).map(x=>`${esc(x.name)} · ${money(x.price)}`).join("<br>")}</small>`:""}</div>`).join("")||'<p class="muted">Keine Rechnungen zu dieser Akte.</p>'}`;
    const documents=[...content.querySelectorAll(".panel")].find(p=>/^\s*Dokumente\b/.test(p.textContent));
    if(documents)documents.parentNode.insertBefore(panel,documents);else content.appendChild(panel);
    content.dataset.caseInvoicesAdded="1";
  }

  new MutationObserver(()=>setTimeout(addCaseInvoices,0)).observe(document.body,{childList:true,subtree:true});
  setTimeout(addCaseInvoices,300);
})();
