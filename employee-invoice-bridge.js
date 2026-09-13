/* Rechnungen <-> Mitarbeiter – robuste Zuordnung
   Die Mitarbeiterliste wird aus dem zentralen Kanzleistatus übernommen.
   Jeder vorhandene Mitarbeiter kann beim Erstellen einer Rechnung ausgewählt werden.
*/
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY) || "{}"); } catch { return {}; } };
  const write = d => localStorage.setItem(DBKEY, JSON.stringify(d));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  function localEmployees() {
    const d = read();
    return Array.isArray(d.employees) ? d.employees.filter(e => e && e.id) : [];
  }

  async function hydrateEmployees() {
    try {
      const client = window.DonnerfaustCloud?.supabase;
      if (!client) return;
      const { data, error } = await client.from("kanzlei_state").select("data").eq("id", "main").maybeSingle();
      if (error || !data?.data || !Array.isArray(data.data.employees)) return;
      const current = read();
      /* Die zentrale Mitarbeiterliste ist maßgeblich; andere lokale Daten bleiben unangetastet. */
      current.employees = data.data.employees;
      write(current);
      refresh();
    } catch (e) {
      console.debug("Mitarbeiter-Synchronisierung für Rechnung fehlgeschlagen", e);
    }
  }

  function fillEmployeeSelect(select) {
    if (!select) return;
    const current = select.value || "";
    const list = localEmployees();
    const signature = list.map(e => `${e.id}:${e.name}:${e.role || ""}`).join("|");
    if (select.dataset.employeeSignature === signature && select.options.length === list.length + 1) return;
    select.innerHTML = ['<option value="">Keinem Mitarbeiter zugeordnet</option>']
      .concat(list.map(e => `<option value="${esc(e.id)}">${esc(e.name || "Unbenannt")}${e.role ? ` · ${esc(e.role)}` : ""}</option>`)).join("");
    select.value = list.some(e => String(e.id) === String(current)) ? current : "";
    select.dataset.employeeSignature = signature;
  }

  function ensureField(form) {
    if (!form) return;
    let select = form.querySelector('[name="employee_id"]');
    if (select) { fillEmployeeSelect(select); return; }
    const list = localEmployees();
    const wrap = document.createElement("label");
    wrap.dataset.dfEmployeeField = "1";
    wrap.innerHTML = `Abrechnender Mitarbeiter<select name="employee_id"><option value="">Keinem Mitarbeiter zugeordnet</option>${list.map(e => `<option value="${esc(e.id)}">${esc(e.name || "Unbenannt")}${e.role ? ` · ${esc(e.role)}` : ""}</option>`).join("")}</select><small style="display:block;color:#667085;margin-top:4px">Der ausgewählte Mitarbeiter erhält 20 % der Rechnungssumme, sobald die Rechnung bezahlt ist.</small>`;
    const caseSelect = form.querySelector('[name="case_id"]');
    if (caseSelect?.parentElement) caseSelect.parentElement.insertAdjacentElement("afterend", wrap);
    else form.querySelector('.actions')?.insertAdjacentElement("beforebegin", wrap);
    fillEmployeeSelect(wrap.querySelector('select[name="employee_id"]'));
  }

  function isInvoiceForm(form) {
    const heading = form?.closest('.modal')?.querySelector('.modalhead b')?.textContent || "";
    return /Rechnung/i.test(heading);
  }

  function bindForm(form) {
    if (!isInvoiceForm(form)) return;
    ensureField(form);
    if (form.dataset.dfEmployeeBridgeBound) return;
    form.dataset.dfEmployeeBridgeBound = "1";
    form.addEventListener("submit", () => {
      const employeeId = form.querySelector('[name="employee_id"]')?.value || "";
      window.__dfPendingInvoiceEmployee = employeeId;
      window.__dfPendingInvoiceTimestamp = Date.now();
      setTimeout(() => {
        const pending = window.__dfPendingInvoiceEmployee;
        const d = read();
        const invoices = d.invoices || [];
        const latest = invoices[invoices.length - 1];
        if (pending && latest && !latest.employee_id && Date.now() - (window.__dfPendingInvoiceTimestamp || 0) < 3000) {
          latest.employee_id = pending;
          write(d);
        }
        window.__dfPendingInvoiceEmployee = "";
      }, 100);
    });
  }

  function refresh() {
    document.querySelectorAll('form').forEach(bindForm);
    document.querySelectorAll('select[name="employee_id"]').forEach(fillEmployeeSelect);
  }

  const observer = new MutationObserver(refresh);
  function start() {
    refresh();
    observer.observe(document.body, { childList: true, subtree: true });
    hydrateEmployees();
    setInterval(refresh, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
