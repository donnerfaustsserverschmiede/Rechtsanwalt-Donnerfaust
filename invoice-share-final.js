/* Finale Rechnungsfreigabe: Supabase-Snapshot + schreibgeschützte rechnung.html */
(() => {
  const KEY="donnerfaust_kanzlei_v1";
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}};
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const token=()=>{const a=new Uint8Array(12);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,"0")).join("")};
  async function share(id){
    const d=read(),i=(d.invoices||[]).find(x=>x.id===id);if(!i)return;
    const cloud=window.DonnerfaustCloud?.supabase;if(!cloud)return alert("Supabase ist noch nicht verfügbar.");
    const c=(d.clients||[]).find(x=>x.id===i.client_id),a=(d.cases||[]).find(x=>x.id===i.case_id),e=(d.employees||[]).find(x=>x.id===i.employee_id);
    const snapshot={version:4,invoice:{invoice_number:i.invoice_number,date:i.date,status:i.status,amount:i.amount,lines:i.lines||[],billing_recipient:i.billing_recipient||{name:"Thorson Donnerfaust",account:"4693"},employee:e?{name:e.name,role:e.role}:null},client:c?{name:c.name,email:c.email,address:c.address}:null,case:a?{file_number:a.file_number,title:a.title}:null};
    for(let n=0;n<3;n++){const t=token();const {error}=await cloud.from("shared_invoice_access").insert({token:t,invoice_number:i.invoice_number,snapshot,active:true});if(!error){const link=`${location.origin}${location.pathname.replace(/[^/]*$/i,"")}rechnung.html?invoice=${encodeURIComponent(i.invoice_number)}&token=${encodeURIComponent(t)}`;prompt("Rechnungslink – nur Lesen:",link);return;}}
    alert("Der Rechnungslink konnte nicht erstellt werden. Die Supabase-Tabelle shared_invoice_access muss vorhanden sein und INSERT für anon erlauben.");
  }
  window.__dfShareInvoice=share;
  document.addEventListener("click",e=>{const b=e.target.closest("[data-inv-share]");if(!b)return;e.preventDefault();e.stopImmediatePropagation();share(b.dataset.invShare)},true);
})();
