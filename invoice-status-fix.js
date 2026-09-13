/* Rechnungsstatus: Status kann nachträglich geändert werden.
   Bei Rücksetzung von Bezahlt wird die dazugehörige automatische Kasseneinnahme entfernt.
*/
(() => {
  const KEY='donnerfaust_kanzlei_v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const write=d=>localStorage.setItem(KEY,JSON.stringify(d));
  const money=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n)||0);
  function setStatus(id,status){
    const d=read(); d.invoices ||= []; d.cashbook ||= [];
    const inv=d.invoices.find(x=>x.id===id); if(!inv)return;
    const old=inv.status;
    if(old===status)return;
    if(status==='Bezahlt' && old!=='Bezahlt'){
      if(!confirm(`Rechnung ${inv.invoice_number} als bezahlt markieren?\n\n${money(inv.amount)} werden der Kasse gutgeschrieben.`))return;
      inv.status='Bezahlt'; inv.paid_at=new Date().toLocaleString('de-DE');
      d.cashbook.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),kind:'in',amount:Number(inv.amount)||0,reason:`Zahlung Rechnung ${inv.invoice_number}`,invoice_id:inv.id,date:new Date().toLocaleString('de-DE'),source:'invoice'});
    } else if(old==='Bezahlt' && status!=='Bezahlt'){
      if(!confirm(`Status der Rechnung ${inv.invoice_number} von „Bezahlt“ auf „${status}“ ändern?\n\nDie zugehörige automatische Kasseneinnahme wird rückgängig gemacht.`))return;
      d.cashbook=d.cashbook.filter(x=>!(x.source==='invoice' && x.invoice_id===inv.id));
      inv.status=status; inv.paid_at=null;
    } else { inv.status=status; if(status!=='Bezahlt')inv.paid_at=null; }
    write(d); location.reload();
  }
  function enhance(){
    document.querySelectorAll('[data-inv-share]').forEach(el=>{
      const id=el.dataset.invShare, parent=el.parentElement;
      if(!id||parent.querySelector(`[data-df-statusfix="${id}"]`))return;
      const d=read(), inv=(d.invoices||[]).find(x=>x.id===id); if(!inv)return;
      const b=document.createElement('button'); b.className='mini'; b.dataset.dfStatusfix=id; b.textContent='Status ändern';
      b.title='Rechnungsstatus ändern';
      b.onclick=()=>{const d2=read(),i=(d2.invoices||[]).find(x=>x.id===id);if(!i)return;const next=i.status==='Offen'?'Bezahlt':i.status==='Bezahlt'?'Offen':'Offen';setStatus(id,next)};
      parent.appendChild(b);
    });
  }
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true}); enhance();
})();
