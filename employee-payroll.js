/* Mitarbeitervergütung – bezahlte Rechnung -> 20 % -> offene Auszahlung */
(function(){
  const KEY="donnerfaust_employee_pay_v1";
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}};
  const saveP=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const pay=load();
  const ensure=e=>pay[e.id]||(pay[e.id]={hours:0,earned:0,payout:"weekly"});
  const sec=e=>/sekret|assist|büro/i.test(e.role||"");
  const eur=n=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(n)||0);
  function lawyerAmount(id){
    return (db.invoices||[]).filter(i=>i.status==="Bezahlt"&&!i.employee_paid_at&&(i.employee_id===id||i.lawyer_id===id)).reduce((s,i)=>s+Math.max(0,Number(i.amount)||0)*0.20,0);
  }
  function hourlySecretaryAmount(e){
    const p=ensure(e);return sec(e)?Math.max(0,Number(p.hours)||0)*400:0;
  }
  function payout(id){
    const e=(db.employees||[]).find(x=>x.id===id);if(!e)return;
    const p=ensure(e),amount=lawyerAmount(id)+hourlySecretaryAmount(e)+Math.max(0,Number(p.earned)||0);
    if(amount<=0)return alert("Kein auszuzahlender Betrag vorhanden.");
    const d=JSON.parse(localStorage.getItem("donnerfaust_kanzlei_v1")||"{}");d.cashbook=d.cashbook||[];
    const balance=d.cashbook.reduce((s,x)=>s+(x.kind==="in"?1:-1)*(Number(x.amount)||0),0);
    if(balance<amount)return alert(`Kassenbestand zu niedrig: ${eur(balance)} verfügbar, ${eur(amount)} benötigt.`);
    d.cashbook.push({id:typeof uid==="function"?uid():Date.now().toString(36),kind:"out",type:"Auszahlung",amount,reason:`Mitarbeiterzahlung: ${e.name}`,date:new Date().toLocaleString("de-DE"),source:"employee",employee_id:e.id});
    (db.invoices||[]).filter(i=>i.status==="Bezahlt"&&!i.employee_paid_at&&(i.employee_id===id||i.lawyer_id===id)).forEach(i=>i.employee_paid_at=new Date().toLocaleString("de-DE"));
    p.earned=0;p.hours=0;saveP(pay);localStorage.setItem("donnerfaust_kanzlei_v1",JSON.stringify(d));
    if(typeof log==="function")log(`Mitarbeiter ausgezahlt: ${e.name} · ${eur(amount)}`);
    if(typeof render==="function")render();
  }
  function patch(){
    if(typeof window.employees!=="function")return;
    const old=window.employees;
    window.employees=function(){
      const h=old();
      const rows=(db.employees||[]).map(e=>{const p=ensure(e),amount=lawyerAmount(e.id)+hourlySecretaryAmount(e)+Math.max(0,Number(p.earned)||0);return `<div class="panel" style="margin-top:10px"><div class="panelhead"><div><b>${esc(e.name)}</b><small>${esc(e.role||"")}</small></div><div><b>${eur(amount)}</b><small>Wöchentliche Auszahlung</small></div></div><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span>Arbeitszeit: <b>${p.hours||0} h</b>${sec(e)?" · 400 €/h Sekretariat":""}</span><span>Fallvergütung: <b>20 %</b></span><label>Rhythmus <select data-paymode="${e.id}"><option value="weekly" ${p.payout==="weekly"?"selected":""}>Wöchentlich (WE)</option><option value="daily" ${p.payout==="daily"?"selected":""}>Täglich</option><option value="manual" ${p.payout==="manual"?"selected":""}>Manuell</option></select></label><button class="btn dark" data-payout="${e.id}">Ausgezahlt</button></div></div>`}).join("");
      return h+rows;
    };
  }
  function hook(){patch();document.addEventListener("click",e=>{const b=e.target.closest("[data-payout]");if(b){e.preventDefault();e.stopPropagation();payout(b.dataset.payout)}});document.addEventListener("change",e=>{const s=e.target.closest("[data-paymode]");if(s){const e=(db.employees||[]).find(x=>x.id===s.dataset.paymode);if(e)ensure(e).payout=s.value;saveP(pay);save()}})}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",hook);else hook();
})();
