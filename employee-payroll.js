/* Rechtsanwalt Donnerfaust – Mitarbeiterrollen & Vergütung
   Rollen dienen der Aufgaben-Zuordnung, NICHT als Zugriffsrechte.
   Assistent: 350 €/Stunde
   Sekretär: 500 €/Stunde
   Alle anderen Rollen: 20 % je zugeordneter bezahlter Rechnung/Fall
*/
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const PAYKEY = "donnerfaust_employee_pay_v2";
  const ROLES = ["Assistent", "Rechtsanwalt", "Sekretär", "Stellv. Inhaber", "Inhaber"];
  const HOURLY = { "Assistent": 350, "Sekretär": 500 };
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY) || "{}"); } catch { return {}; } };
  const write = d => localStorage.setItem(DBKEY, JSON.stringify(d));
  const loadPay = () => { try { return JSON.parse(localStorage.getItem(PAYKEY) || "{}"); } catch { return {}; } };
  const savePay = p => localStorage.setItem(PAYKEY, JSON.stringify(p));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const eur = n => new Intl.NumberFormat("de-DE", {style:"currency", currency:"EUR"}).format(Number(n) || 0);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  const dateKey = d => { const x = d ? new Date(d) : new Date(); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; };
  const roleOf = e => ROLES.includes(e?.role) ? e.role : (e?.role === "Kanzleiinhaber" ? "Inhaber" : (e?.role || ""));
  const hourlyRole = e => Object.prototype.hasOwnProperty.call(HOURLY, roleOf(e));

  function ensurePay(e) {
    const p = loadPay();
    if (!p[e.id]) p[e.id] = { entries: {}, payout: "weekly", earned: 0 };
    p[e.id].entries ||= {}; p[e.id].payout ||= "weekly"; p[e.id].earned = Number(p[e.id].earned) || 0;
    savePay(p); return p[e.id];
  }
  const entriesTotal = p => Object.values(p.entries || {}).reduce((s,v) => s + Math.max(0, Number(v) || 0), 0);
  const hourlyTotal = (e,p) => entriesTotal(p) * (HOURLY[roleOf(e)] || 0);

  /*
     20 % erhalten AUSNAHMSLOS alle Rollen außer Assistent und Sekretär.
     Die Zuordnung wird bewusst robust gegen ältere Rechnungsdaten geprüft:
     employee_id, lawyer_id, employeeId und responsible_employee_id werden akzeptiert.
     Bestehende bezahlte Rechnungen werden damit automatisch rückwirkend berücksichtigt,
     solange für diese Rechnung noch keine Mitarbeiter-Auszahlung verbucht wurde.
  */
  function caseAmount(id) {
    const d = read();
    const sameId = v => String(v ?? "") === String(id ?? "");
    const isPaid = i => ["Bezahlt","bezahlt","Paid","paid"].includes(String(i?.status || "").trim());
    const assigned = i => [i?.employee_id, i?.lawyer_id, i?.employeeId, i?.assigned_employee_id, i?.responsible_employee_id].some(sameId);
    return (d.invoices || []).filter(i => isPaid(i) && !i.employee_paid_at && assigned(i))
      .reduce((s,i) => s + Math.max(0, Number(i.amount) || 0) * 0.20, 0);
  }
  function currentAmount(e) {
    const p = ensurePay(e), role = roleOf(e);
    return (hourlyRole(e) ? hourlyTotal(e,p) : caseAmount(e.id)) + Math.max(0, Number(p.earned) || 0);
  }
  function normalizeRoles() {
    const d = read(); if (!Array.isArray(d.employees)) return; let changed = false;
    d.employees.forEach(e => { if (e.role === "Kanzleiinhaber") { e.role = "Inhaber"; changed = true; } if (!ROLES.includes(e.role)) { e.role = e.id === "owner" ? "Inhaber" : (e.role || "Assistent"); changed = true; } });
    if (changed) write(d);
  }
  const roleOptions = selected => ROLES.map(r => `<option value="${esc(r)}" ${r === selected ? "selected" : ""}>${esc(r)}</option>`).join("");

  function patchEmployeeModal() {
    [...document.querySelectorAll("form")].forEach(form => {
      const title = form.closest(".modal")?.querySelector(".modalhead b")?.textContent || ""; if (!/Mitarbeiter/i.test(title)) return;
      const field = form.querySelector('[name="role"]'); if (!field || field.tagName === "SELECT") return;
      const current = field.value || "Assistent", select = document.createElement("select"); select.name = "role"; select.innerHTML = roleOptions(current); field.replaceWith(select);
    });
  }
  function dailyInput(e) {
    if (!hourlyRole(e)) return "";
    const p = ensurePay(e), today = dateKey();
    return `<div class="df-pay-entry"><label><b>Stunden heute (${esc(today)})</b><input type="number" min="0" max="24" step="0.25" value="${Number(p.entries[today]) || 0}" data-hours="${esc(e.id)}" inputmode="decimal"><small>${eur(HOURLY[roleOf(e)])} pro Stunde · Tagessumme: <b data-day-total="${esc(e.id)}">${eur((Number(p.entries[today])||0)*HOURLY[roleOf(e)])}</b></small></label></div>`;
  }
  function employeeCards() {
    normalizeRoles(); const d = read(), employees = d.employees || [], pAll = loadPay();
    return employees.map(e => {
      const p = pAll[e.id] || {entries:{}, payout:"weekly", earned:0}; p.entries ||= {};
      const role = roleOf(e), hourly = hourlyRole(e), rate = HOURLY[role] || 0, hours = entriesTotal(p), hourlyMoney = hourly ? hours * rate : 0, caseMoney = hourly ? 0 : caseAmount(e.id), amount = hourlyMoney + caseMoney + Math.max(0, Number(p.earned)||0);
      const label = hourly ? `${eur(rate)} / Stunde` : "20 % je zugeordneter bezahlter Rechnung";
      return `<div class="panel df-employee-pay" style="margin-top:12px"><div class="panelhead"><div><b>${esc(e.name || "Unbenannt")}</b><small>${esc(role)}</small></div><div style="text-align:right"><b>${eur(amount)}</b><small>Offene Auszahlung</small></div></div><div class="df-pay-role"><span><b>Aufgabe/Rolle:</b> ${esc(role)}</span><span>${esc(label)}</span></div>${dailyInput(e)}<div class="df-pay-summary"><span>Erfasste Gesamtstunden: <b>${hours.toLocaleString("de-DE")} h</b></span>${hourly ? `<span>Stundenlohn gesamt: <b>${eur(hourlyMoney)}</b></span>` : `<span>Fallvergütung: <b>${eur(caseMoney)}</b></span>`}<span>Gesamtauszahlung: <b>${eur(amount)}</b></span></div><div class="df-pay-controls"><label>Auszahlungsrhythmus <select data-paymode="${esc(e.id)}"><option value="weekly" ${p.payout === "weekly" ? "selected" : ""}>Wöchentlich (Wochenende)</option><option value="daily" ${p.payout === "daily" ? "selected" : ""}>Täglich</option><option value="manual" ${p.payout === "manual" ? "selected" : ""}>Manuell</option></select></label><button class="btn dark" data-payout="${esc(e.id)}">✓ Ausgezahlt</button></div></div>`;
    }).join("");
  }
  function patchEmployeesPage() {
    if (typeof window.employees !== "function") return; const old = window.employees; if (old.__dfPayrollPatched) return;
    const wrapped = function() { const base = old(); return `${base}<div class="panel" style="margin-top:18px"><div class="panelhead"><div><b>Mitarbeitervergütung</b><small>Rollen dienen ausschließlich der Aufgaben-Zuordnung. Es werden keine Zugriffsrechte daraus abgeleitet.</small></div></div><p class="muted" style="margin:0">Assistent: 350 €/h · Sekretär: 500 €/h · Alle übrigen Rollen: 20 % der jeweils zugeordneten bezahlten Rechnung. Stunden werden pro Tag erfasst und bis zur Auszahlung gesammelt.</p></div>${employeeCards()}`; };
    wrapped.__dfPayrollPatched = true; window.employees = wrapped;
  }
  function setHours(id, value) {
    const d = read(), e = (d.employees || []).find(x => String(x.id) === String(id)); if (!e || !hourlyRole(e)) return;
    const p = ensurePay(e), day = dateKey(), n = Math.max(0, Math.min(24, Number(String(value).replace(",",".")) || 0)); if (n === 0) delete p.entries[day]; else p.entries[day] = n;
    const all = loadPay(); all[id] = p; savePay(all); if (typeof render === "function") render();
  }
  function payout(id) {
    const d = read(), e = (d.employees || []).find(x => String(x.id) === String(id)); if (!e) return;
    const p = ensurePay(e), amount = currentAmount(e); if (amount <= 0) return alert("Kein auszuzahlender Betrag vorhanden."); d.cashbook ||= [];
    const balance = d.cashbook.reduce((s,x) => s + (x.kind === "in" ? 1 : -1) * (Number(x.amount)||0), 0); if (balance < amount) return alert(`Kassenbestand zu niedrig: ${eur(balance)} verfügbar, ${eur(amount)} benötigt.`);
    d.cashbook.push({id:uid(), kind:"out", type:"Auszahlung", amount, reason:`Mitarbeiterzahlung: ${e.name} (${roleOf(e)})`, date:new Date().toLocaleString("de-DE"), source:"employee", employee_id:e.id});
    (d.invoices || []).filter(i => ["Bezahlt","bezahlt","Paid","paid"].includes(String(i?.status || "").trim()) && !i.employee_paid_at && [i?.employee_id, i?.lawyer_id, i?.employeeId, i?.assigned_employee_id, i?.responsible_employee_id].some(v => String(v ?? "") === String(id ?? ""))).forEach(i => i.employee_paid_at = new Date().toLocaleString("de-DE"));
    p.earned = 0; p.entries = {}; const all = loadPay(); all[id] = p; savePay(all); write(d); if (typeof log === "function") log(`Mitarbeiter ausgezahlt: ${e.name} · ${eur(amount)}`); if (typeof render === "function") render();
  }
  function bind() {
    normalizeRoles(); patchEmployeesPage(); patchEmployeeModal();
    document.addEventListener("input", e => { const field = e.target.closest("[data-hours]"); if (!field) return; const id = field.dataset.hours, value = field.value; clearTimeout(field.__dfTimer); field.__dfTimer = setTimeout(() => setHours(id, value), 250); const d = read(), emp = (d.employees || []).find(x => String(x.id) === String(id)); if (emp) { const out = document.querySelector(`[data-day-total="${CSS.escape(id)}"]`); if (out) out.textContent = eur((Number(String(value).replace(",","."))||0) * (HOURLY[roleOf(emp)]||0)); } });
    document.addEventListener("change", e => { const mode = e.target.closest("[data-paymode]"); if (mode) { const all = loadPay(), p = all[mode.dataset.paymode] || {entries:{},earned:0}; p.payout = mode.value; all[mode.dataset.paymode] = p; savePay(all); } patchEmployeeModal(); });
    document.addEventListener("click", e => { const b = e.target.closest("[data-payout]"); if (b) { e.preventDefault(); e.stopPropagation(); payout(b.dataset.payout); } }, true);
    const observer = new MutationObserver(() => { patchEmployeesPage(); patchEmployeeModal(); }); observer.observe(document.body, {childList:true, subtree:true}); setInterval(() => { patchEmployeesPage(); patchEmployeeModal(); }, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})();