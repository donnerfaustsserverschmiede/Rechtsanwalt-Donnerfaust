/* Verbindung Rechnungen <-> Mitarbeiter
   Ergänzt das bestehende Rechnungssystem um den abrechnenden Mitarbeiter.
   Mitarbeiter erhalten 20 % jeder von ihnen erstellten, bezahlten Rechnung.
*/
(() => {
  const DBKEY = "donnerfaust_kanzlei_v1";
  const read = () => { try { return JSON.parse(localStorage.getItem(DBKEY)||"{}"); } catch { return {}; } };
  const write = d => localStorage.setItem(DBKEY, JSON.stringify(d));
  const esc = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  function addEmployeeField(form){
    if(!form || form.querySelector('[name="employee_id"]')) return;
    const d=read();
    const employees=(d.employees||[]).filter(e=>e.id!=="owner");
    const wrap=document.createElement("label");
    wrap.innerHTML=`Abrechnender Mitarbeiter<select name="employee_id"><option value="">Keinem Mitarbeiter zugeordnet</option>${employees.map(e=>`<option value="${esc(e.id)}">${esc(e.name)} · ${esc(e.role||"")}</option>`).join("")}</select><small style="display:block;color:#667085;margin-top:4px">Der ausgewählte Mitarbeiter erhält 20 % der Rechnungssumme, sobald die Rechnung bezahlt ist.</small>`;
    const caseSelect=form.querySelector('[name="case_id"]');
    if(caseSelect?.parentElement) caseSelect.parentElement.insertAdjacentElement("afterend",wrap);
    else form.querySelector('.actions')?.insertAdjacentElement("beforebegin",wrap);
  }

  function attach(){
    const observer=new MutationObserver(()=>{
      document.querySelectorAll('form').forEach(form=>{
        const heading=form.closest('.modal')?.querySelector('.modalhead b')?.textContent||"";
        if(/Rechnung/.test(heading)) addEmployeeField(form);
      });
      // Das bestehende Rechnungssystem speichert die Rechnung. Danach ergänzen wir die Mitarbeiter-ID.
      document.querySelectorAll('form').forEach(form=>{
        if(form.dataset.employeeBridgeBound) return;
        const heading=form.closest('.modal')?.querySelector('.modalhead b')?.textContent||"";
        if(!/Rechnung/.test(heading)) return;
        form.dataset.employeeBridgeBound="1";
        form.addEventListener('submit',()=>{
          const employeeId=form.querySelector('[name="employee_id"]')?.value||"";
          if(!employeeId) return;
          setTimeout(()=>{
            const d=read(), invoices=d.invoices||[];
            // Die zuletzt angelegte Rechnung gehört zu diesem Erstellvorgang.
            const latest=invoices[invoices.length-1];
            if(latest && !latest.employee_id){ latest.employee_id=employeeId; write(d); }
          },50);
        });
      });
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.takeRecords(),0);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',attach); else attach();
})();
