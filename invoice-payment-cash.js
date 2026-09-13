/* Rechnungszahlungen: Nur als "Bezahlt" markierte Rechnungen erhöhen die Kasse. */
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY) || "{}"); } catch { return {}; } };
  const write = d => localStorage.setItem(DBKEY, JSON.stringify(d));
  const money = n => new Intl.NumberFormat("de-DE", {style:"currency", currency:"EUR"}).format(Number(n)||0);
  const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,8);

  function markPaid(id) {
    const d = read(); d.invoices ||= []; d.cashbook ||= [];
    const inv = d.invoices.find(x => x.id === id);
    if (!inv) return;
    if (inv.status === "Bezahlt") return;
    if (!confirm(`Rechnung ${inv.invoice_number} als bezahlt markieren?\n\n${money(inv.amount)} werden der Kasse gutgeschrieben.`)) return;
    inv.status = "Bezahlt";
    inv.paid_at = new Date().toLocaleString("de-DE");
    d.cashbook.push({
      id: uid(), kind: "in", amount: Number(inv.amount)||0,
      reason: `Zahlung Rechnung ${inv.invoice_number}`,
      invoice_id: inv.id, date: new Date().toLocaleString("de-DE")
    });
    write(d);
    location.reload();
  }

  function enhance() {
    document.querySelectorAll("[data-inv-share]").forEach(share => {
      const id = share.dataset.invShare;
      if (share.parentElement.querySelector(`[data-inv-paid=\"${id}\"]`)) return;
      const d = read(), inv = (d.invoices||[]).find(x=>x.id===id);
      if (!inv) return;
      if (inv.status === "Bezahlt") return;
      const b = document.createElement("button");
      b.className = "mini"; b.dataset.invPaid = id; b.textContent = "✓ Bezahlt";
      b.title = "Rechnung als bezahlt markieren und Zahlung in die Kasse buchen";
      b.onclick = () => markPaid(id);
      share.parentElement.appendChild(b);
    });
  }
  new MutationObserver(enhance).observe(document.body, {childList:true, subtree:true});
  enhance();
})();
