/* Rückwirkende Mitarbeitervergütung – bestehende Rechnungen bleiben auszahlbar */
(() => {
  const DBKEY="donnerfaust_kanzlei_v1", PAYKEY="donnerfaust_employee_pay_v3", FLAG="donnerfaust_payroll_existing_repair_v1";
  const read=()=>{try{return JSON.parse(localStorage.getItem(DBKEY)||"{}")}catch{return{}}};
  const readPay=()=>{try{return JSON.parse(localStorage.getItem(PAYKEY)||"{}")}catch{return{}}};
  const savePay=p=>localStorage.setItem(PAYKEY,JSON.stringify(p));
  const paid=i=>["bezahlt","paid"].includes(String(i?.status||"").trim().toLowerCase());
  const normalizeRole=r=>r==="Kanzleiinhaber"||r==="Stellv. Inhaber"?"Inhaber":r==="Assistent"?"Rechtsanwalt":["Sekretär","Rechtsanwalt","Inhaber"].includes(r)?r:"Rechtsanwalt";
  const assigned=(i,e)=>{
    const vals=[i?.employee_id,i?.employeeId,i?.lawyer_id,i?.lawyerId,i?.assigned_employee_id,i?.assignedEmployeeId,i?.responsible_employee_id,i?.responsibleEmployeeId];
    const id=String(e?.id??"").trim(),name=String(e?.name??"").trim().toLowerCase();
    return vals.some(v=>{const x=String(v??"").trim();return x!==""&&(x===id||x.toLowerCase()===name)});
  };
  function run(){
    const d=read();if(!Array.isArray(d.employees)||!Array.isArray(d.invoices))return;
    const p=readPay();let changed=false;
    d.employees.forEach(e=>{const r=normalizeRole(e.role);if(e.role!==r){e.role=r;changed=true;}});
    d.employees.forEach(e=>{
      if(e.role==="Sekretär")return;
      p[e.id] ||= {hours:{},payout:"weekly",paid:0,credited:{}};
      p[e.id].hours ||= {};p[e.id].payout ||= "weekly";p[e.id].paid=Number(p[e.id].paid)||0;p[e.id].credited ||= {};
    });
    // Einmalige Reparatur der bisherigen Migration: sie hatte vorhandene
    // bezahlte Rechnungen fälschlich als bereits ausgezahlt markiert. Diese
    // Markierungen werden genau einmal entfernt. Künftige echte Auszahlungen
    // setzen die Markierungen wieder korrekt.
    if(localStorage.getItem(FLAG)!=="done"){
      d.employees.filter(e=>e.role!=="Sekretär").forEach(e=>{
        const c=p[e.id]?.credited||{};
        d.invoices.filter(i=>paid(i)&&assigned(i,e)).forEach(i=>{if(Object.prototype.hasOwnProperty.call(c,i.id)){delete c[i.id];changed=true;}});
      });
      localStorage.setItem(FLAG,"done");
    }
    if(changed)localStorage.setItem(DBKEY,JSON.stringify(d));
    savePay(p);
  }
  run();setTimeout(run,500);setTimeout(run,1500);window.addEventListener("storage",run);
})();