/* Rechtsanwalt Donnerfaust – Verbindung Rechnungen <-> Mitarbeiter
   Der abrechnende Mitarbeiter wird direkt aus der bestehenden Mitarbeiterliste
   übernommen. Auch der Kanzleiinhaber ist auswählbar.
*/
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY) || "{}"); } catch { return {}; } };
  const write = d => localStorage.setItem(DBKEY, JSON.stringify(d));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  function employees() {
    const d = read();
    return Array.isArray(d.employees) ? d.employees : [];
  }

  function addEmployeeField(form) {
    if (!form || form.querySelector('[name="employee_id"]')) return;

    const list = employees();
    const wrap = document.createElement("label");
    wrap.innerHTML = `Abrechnender Mitarbeiter<select name="employee_id"><option value="">Keinem Mitarbeiter zugeordnet</option>${list.map(e => `<option value="${esc(e.id)}">${esc(e.name)}${e.role ? ` · ${esc(e.role)}` : ""}</option>`).join("")}</select><small style="display:block;color:#667085;margin-top:4px">Der ausgewählte Mitarbeiter erhält 20 % der Rechnungssumme, sobald die Rechnung bezahlt ist.</small>`;

    const caseSelect = form.querySelector('[name="case_id"]');
    if (caseSelect?.parentElement) caseSelect.parentElement.insertAdjacentElement("afterend", wrap);
    else form.querySelector('.actions')?.insertAdjacentElement("beforebegin", wrap);
  }

  function bindForm(form) {
    if (!form || form.dataset.employeeBridgeBound) return;
    const heading = form.closest('.modal')?.querySelector('.modalhead b')?.textContent || "";
    if (!/Rechnung/.test(heading)) return;

    form.dataset.employeeBridgeBound = "1";
    addEmployeeField(form);

    form.addEventListener('submit', () => {
      const employeeId = form.querySelector('[name="employee_id"]')?.value || "";
      if (!employeeId) return;

      setTimeout(() => {
        const d = read();
        const invoices = d.invoices || [];
        const latest = invoices[invoices.length - 1];
        if (latest && !latest.employee_id) {
          latest.employee_id = employeeId;
          write(d);
        }
      }, 50);
    });
  }

  function attach() {
    const scan = () => document.querySelectorAll('form').forEach(bindForm);
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
  else attach();
})();
