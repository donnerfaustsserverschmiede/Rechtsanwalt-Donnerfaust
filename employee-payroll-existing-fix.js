/* Bestehende Rechnungen – Mitarbeitervergütung nachträglich kompatibel machen */
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY) || "{}"); } catch { return {}; } };
  const write = d => localStorage.setItem(DBKEY, JSON.stringify(d));

  function normalize() {
    const d = read();
    if (!Array.isArray(d.invoices) || !Array.isArray(d.employees)) return;
    let changed = false;
    const employees = d.employees;

    const findEmployeeId = raw => {
      if (raw == null || raw === "") return "";
      if (typeof raw === "object") raw = raw.id ?? raw.employee_id ?? raw.employeeId ?? raw.lawyer_id ?? raw.lawyerId ?? "";
      const value = String(raw);
      const match = employees.find(e => String(e.id) === value || String(e.name || "").trim().toLowerCase() === value.trim().toLowerCase());
      return match ? String(match.id) : value;
    };

    d.invoices.forEach(i => {
      if (!i || typeof i !== "object") return;
      const raw = i.employee_id ?? i.employeeId ?? i.assigned_employee_id ?? i.assignedEmployeeId ?? i.lawyer_id ?? i.lawyerId ?? i.employee;
      if (raw != null && raw !== "") {
        const id = findEmployeeId(raw);
        if (String(i.employee_id ?? "") !== id) { i.employee_id = id; changed = true; }
      }
      if (i.status && String(i.status).toLowerCase() === "paid") { i.status = "Bezahlt"; changed = true; }
    });
    if (changed) write(d);
  }

  normalize();
  window.addEventListener("storage", normalize);
  setTimeout(normalize, 300);
  setTimeout(normalize, 1200);
})();
