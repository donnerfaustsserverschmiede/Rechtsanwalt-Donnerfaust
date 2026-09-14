/* Rückwirkende Mitarbeitervergütung – kompatibel mit employee-payroll.js v6 */
(() => {
  const DBKEY="donnerfaust_kanzlei_v1", PAYKEY="donnerfaust_employee_pay_v3";
  const read=()=>{try{return JSON.parse(localStorage.getItem(DBKEY)||"{}")}catch{return{}}};
  const save=p=>localStorage.setItem(PAYKEY,JSON.stringify(p));
  const paid=i=>String(i?.status||"").trim().toLowerCase()==="bezahlt";
  const normalizeRole=r=>r==="Kanzleiinhaber"||r==="Stellv. Inhaber"?"Inhaber":r==="Assistent"?"Rechtsanwalt":r;
  function run(){const d=read();if(!Array.isArray(d.employees)||!Array.isArray(d.invoices))return;const p=(()=>{try{return JSON.parse(localStorage.getItem(PAYKEY)||"{}")}catch{return{}}})();let changed=false;d.employees.forEach(e=>{const r=normalizeRole(e.role);if(["Sekretär","Rechtsanwalt","Inhaber"].includes(r)&&e.role!==r){e.role=r;changed=true}});d.invoices.forEach(i=>{const id=i.employee_id??i.employeeId??i.assigned_employee_id??i.assignedEmployeeId??i.lawyer_id??i.lawyerId;if(id==null||id===""||!paid(i))return;const e=d.employees.find(x=>String(x.id)===String(id)||String(x.name||"").trim().toLowerCase()===String(id).trim().toLowerCase());if(!e||e.role==="Sekretär")return;p[e.id] ||= {hours:{},payout:"weekly",paid:0,credited:{}};p[e.id].credited ||= {};if(!p[e.id].credited[i.id]){p[e.id].credited[i.id]=true;changed=true}});if(changed){localStorage.setItem(DBKEY,JSON.stringify(d));save(p)}}
  run();setTimeout(run,500);setTimeout(run,1500);window.addEventListener("storage",run);
})();
