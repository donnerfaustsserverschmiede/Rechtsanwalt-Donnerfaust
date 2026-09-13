/* Rechnungsstatus-Fix – verhindert Navigation beim Klick auf den Status und erlaubt das Umschalten. */
(() => {
  const KEY='donnerfaust_kanzlei_v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const write=d=>localStorage.setItem(KEY,JSON.stringify(d));
  const money=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n)||0);
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-status]'); if(!btn)return;
    e.preventDefault(); e.stopImmediatePropagation();
    const id=btn.dataset.status,d=read(); d.invoices ||= []; d.cashbook ||= [];
    const inv=d.invoices.find(x=>x.id===id); if(!inv)return;
    const next=inv.status==='Bezahlt'?'Offen':'Bezahlt';
    const q=next==='Bezahlt'?`Rechnung ${inv.invoice_number} als BEZAHLT markieren?\n\n${money(inv.amount)} werden der Kanzleikasse gutgeschrieben.`:`Rechnung ${inv.invoice_number} wieder auf OFFEN setzen?\n\nDie zugehörige Kasseneinnahme wird entfernt.`;
    if(!confirm(q))return;
    if(next==='Bezahlt'){
      inv.status='Bezahlt'; inv.paid_at=new Date().toLocaleString('de-DE');
      if(!d.cashbook.some(x=>x.invoice_id===inv.id&&x.source==='invoice'))d.cashbook.push({id:uid(),kind:'in',amount:Number(inv.amount)||0,reason:`Zahlung Rechnung ${inv.invoice_number}`,invoice_id:inv.id,date:new Date().toLocaleString('de-DE'),source:'invoice'});
    }else{
      inv.status='Offen'; inv.paid_at=null;
      d.cashbook=d.cashbook.filter(x=>!(x.source==='invoice'&&x.invoice_id===inv.id));
    }
    localStorage.setItem(KEY,JSON.stringify(d)); location.reload();
  },true);
})();
