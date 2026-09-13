/* Rechnungen direkt in der jeweiligen Akte anzeigen */
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const money = n => new Intl.NumberFormat("de-DE", {style:"currency", currency:"EUR"}).format(Number(n) || 0);

  function addCaseInvoices() {
    const content = document.querySelector(".content");
    if (!content || content.dataset.caseInvoicesAdded === "1") return;

    const eyebrow = [...content.querySelectorAll(".eyebrow")].find(x => /^AKTE\s+/i.test(x.textContent.trim()));
    if (!eyebrow) return;
    const fileNumber = eyebrow.textContent.trim().replace(/^AKTE\s+/i, "").trim();
    if (!fileNumber) return;

    let db;
    try { db = JSON.parse(localStorage.getItem(DBKEY) || "{}"); } catch { return; }
    const cases = db.cases || [];
    const invoices = db.invoices || [];
    const currentCase = cases.find(c => c.file_number === fileNumber);
    if (!currentCase) return;

    const list = invoices.filter(i => i.case_id === currentCase.id);
    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `<div class="panelhead"><b>Rechnungen</b></div>${list.map(i => {
      const regular = (i.lines || []).filter(x => x.category !== "Sonderleistung");
      const special = (i.lines || []).filter(x => x.category === "Sonderleistung");
      return `<div class="listrow">
        <b>💶 ${esc(i.invoice_number)} · ${money(i.amount)}</b>
        <small>${esc(i.date || "")} · ${esc(i.status || "Offen")}</small>
        <div style="margin-top:6px;font-size:.9em">
          ${regular.length ? `<div><strong>Leistung:</strong> ${regular.map(x => esc(x.name)).join(", ")}</div>` : ""}
          ${special.length ? `<div><strong>Sonderleistungen:</strong> ${special.map(x => esc(x.name)).join(", ")}</div>` : ""}
        </div>
      </div>`;
    }).join("") || '<p class="muted">Keine Rechnungen zu dieser Akte.</p>'}`;

    /* Die Aktenansicht hat rechts bereits die Bereiche Rechnungen/Dokumente/Notizen.
       Wir setzen die Rechnungsliste direkt vor Dokumente, damit sie dort logisch
       neben den übrigen Aktenbestandteilen erscheint. */
    const candidates = [...content.querySelectorAll(".panel")];
    const documentsPanel = candidates.find(p => p.textContent.trim().startsWith("Dokumente"));
    if (documentsPanel) documentsPanel.parentNode.insertBefore(panel, documentsPanel);
    else content.appendChild(panel);

    content.dataset.caseInvoicesAdded = "1";
  }

  new MutationObserver(addCaseInvoices).observe(document.body, {childList:true, subtree:true});
  addCaseInvoices();
})();
