/* Finaler Rechnungsstatus-Hook: ausschließlich Offen <-> Bezahlt, ohne Rückfrage. */
(() => {
  const KEY="donnerfaust_kanzlei_v1";
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}};
  const write=d=>localStorage.setItem(KEY,JSON.stringify(d));
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  function toggle(id){
    const d=read();d.invoices||=[];d.cashbook||=[];const i=d.invoices.find(x=>x.id===id);if(!i)return;
    if(i.status==="Bezahlt"){
      i.status="Offen";i.paid_at=null;
      d.cashbook=d.cashbook.filter(x=>!(x.source==="invoice"&&x.invoice_id===i.id));
    }else{
      i.status="Bezahlt";i.paid_at=new Date().toLocaleString("de-DE");
      if(!d.cashbook.some(x=>x.source==="invoice"&&x.invoice_id===i.id))d.cashbook.push({id:uid(),kind:"in",amount:Number(i.amount)||0,reason:`Zahlung Rechnung ${i.invoice_number}`,date:new Date().toLocaleString("de-DE"),source:"invoice",invoice_id:i.id});
    }
    write(d);
    if(typeof window.__dfRefreshBilling==="function")window.__dfRefreshBilling();else location.reload();
  }
  window.__dfToggleInvoiceStatus=toggle;
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-invoice-status],[data-status]");if(!b)return;
    const id=b.dataset.invoiceStatus||b.dataset.status;if(!id)return;
    e.preventDefault();e.stopImmediatePropagation();toggle(id);
  },true);
})();
