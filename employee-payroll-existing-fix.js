/* Bestehende Rechnungen – Mitarbeitervergütung rückwirkend anrechnen */
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const PAYKEY = "donnerfaust_employee_pay_v2";
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY) || "{}"); } catch { return {}; } };
  const write = d => localStorage.setItem(DBKEY, JSON.stringify(d));
  const loadPay = () => { try { return JSON.parse(localStorage.getItem(PAYKEY) || "{}"); } catch { return {}; } };
  const savePay = p => localStorage.setItem(PAYKEY, JSON.stringify(p));
  const isPaid = i => ["Bezahlt","bezahlt","Paid","paid"].includes(String(i?.status || "").trim());
  const isHourly = role => role === "Assistent" || role === "Sekretär";

  function normalizeAndCredit() {
    const d = read();
    if (!Array.isArray(d.invoices) || !Array.isArray(d.employees)) return;
    const employees = d.employees;
    const pay = loadPay();
    let changed = false;
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
      if (String(i.status || "").toLowerCase() === "paid") { i.status = "Bezahlt"; changed = true; }

      // Jede bereits bezahlte, einem Mitarbeiter zugeordnete Bestandsrechnung
      // wird genau einmal mit 20 % als Mitarbeitervergütung gutgeschrieben.
      if (isPaid(i) && i.employee_id && !i.employee_credit_applied) {
        const employee = employees.find(e => String(e.id) === String(i.employee_id));
        if (employee && !isHourly(employee.role)) {
          pay[employee.id] ||= { entries: {}, payout: "weekly", earned: 0 };
          pay[employee.id].entries ||= {};
          pay[employee.id].payout ||= "weekly";
          pay[employee.id].earned = (Number(pay[employee.id].earned) || 0) + Math.max(0, Number(i.amount) || 0) * 0.20;
          i.employee_credit_applied = true;
          changed = true;
        }
      }
    });

    if (changed) { write(d); savePay(pay); }
  }

  normalizeAndCredit();
  window.addEventListener("storage", normalizeAndCredit);
  setTimeout(normalizeAndCredit, 300);
  setTimeout(normalizeAndCredit, 1200);
})();
