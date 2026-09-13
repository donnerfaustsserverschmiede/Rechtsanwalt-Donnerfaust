/* Finale Rechnungsfreigabe – Supabase oder selbstenthaltener schreibgeschützter Link */
(() => {
  const KEY='donnerfaust_kanzlei_v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const token=()=>{const a=new Uint8Array(12);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('')};
  const encode=s=>btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  async function share(id){
    const d=read(),i=(d.invoices||[]).find(x=>x.id===id);if(!i)return;
    const c=(d.clients||[]).find(x=>x.id===i.client_id),a=(d.cases||[]).find(x=>x.id===i.case_id),e=(d.employees||[]).find(x=>x.id===i.employee_id);
    const snapshot={version:6,invoice:{invoice_number:i.invoice_number,date:i.date,status:i.status,amount:i.amount,lines:i.lines||[],billing_recipient:i.billing_recipient||{name:'Thorson Donnerfaust',account:'4693'},employee:e?{name:e.name,role:e.role}:null},client:c?{name:c.name,email:c.email,address:c.address}:null,case:a?{file_number:a.file_number,title:a.title}:null};
    const cloud=window.DonnerfaustCloud?.supabase;
    if(cloud){
      for(let n=0;n<3;n++){
        const t=token();const r=await cloud.from('shared_invoice_access').insert({token:t,invoice_number:i.invoice_number,snapshot,active:true});
        if(!r.error){openLink(i.invoice_number,t);return;}
      }
      for(let n=0;n<3;n++){
        const t=token();const r=await cloud.from('shared_case_access').insert({token:t,file_number:i.invoice_number,snapshot,active:true});
        if(!r.error){openLink(i.invoice_number,t);return;}
      }
    }
    /* Kein Backend erreichbar: Der Link enthält den schreibgeschützten Snapshot selbst. */
    const data=encode(snapshot);
    const link=`${location.origin}${location.pathname.replace(/[^/]*$/i,'')}rechnung.html#data=${encodeURIComponent(data)}`;
    prompt('Rechnungslink – nur Lesen:',link);
  }
  function openLink(number,t){const link=`${location.origin}${location.pathname.replace(/[^/]*$/i,'')}rechnung.html?invoice=${encodeURIComponent(number)}&token=${encodeURIComponent(t)}`;prompt('Rechnungslink – nur Lesen:',link)}
  window.__dfShareInvoice=share;
  document.addEventListener('click',e=>{const b=e.target.closest('[data-inv-share]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();share(b.dataset.invShare)},true);
})();
