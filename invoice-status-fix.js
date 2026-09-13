/* Rechtsanwalt Donnerfaust – direkter Rechnungsstatus ohne Rückfrage */
(() => {
  const DBKEY = 'donnerfaust_kanzlei_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY) || '{}'); } catch { return {}; } };
  const write = d => localStorage.setItem(DBKEY, JSON.stringify(d));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const money = n => new Intl.NumberFormat('de-DE', { style:'currency', currency:'EUR' }).format(Number(n) || 0);

  function toggle(id) {
    const d = read();
    d.invoices ||= [];
    d.cashbook ||= [];
    const inv = d.invoices.find(x => x.id === id);
    if (!inv) return;

    if (inv.status === 'Bezahlt') {
      inv.status = 'Offen';
      inv.paid_at = null;
      d.cashbook = d.cashbook.filter(x => !(x.source === 'invoice' && x.invoice_id === inv.id));
    } else {
      inv.status = 'Bezahlt';
      inv.paid_at = new Date().toLocaleString('de-DE');
      const alreadyBooked = d.cashbook.some(x => x.source === 'invoice' && x.invoice_id === inv.id);
      if (!alreadyBooked) {
        d.cashbook.push({
          id: uid(),
          kind: 'in',
          amount: Number(inv.amount) || 0,
          reason: `Zahlung Rechnung ${inv.invoice_number}`,
          date: new Date().toLocaleString('de-DE'),
          source: 'invoice',
          invoice_id: inv.id
        });
      }
    }

    write(d);
    if (typeof window.__dfRefreshBilling === 'function') window.__dfRefreshBilling();
    else if (typeof window.location !== 'undefined') window.location.reload();
  }

  document.addEventListener('click', e => {
    const button = e.target.closest('[data-paid]');
    if (!button) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    toggle(button.dataset.paid);
  }, true);
})();
