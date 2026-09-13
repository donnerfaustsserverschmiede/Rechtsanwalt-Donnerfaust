/* Rechtsanwalt Donnerfaust – finale Produktionskorrekturen */
(() => {
  const KEY='donnerfaust_kanzlei_v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const write=d=>localStorage.setItem(KEY,JSON.stringify(d));

  function ensureFinanceNav(){
    const nav=document.querySelector('aside.sidebar nav');
    if(!nav)return;
    nav.querySelectorAll('[data-nav="invoices"]').forEach(x=>x.remove());
    const items=[['finance','▣','Finanzen'],['cash','💶','Kasse'],['billing','🧾','Rechnungen']];
    items.forEach(([id,icon,text])=>{
      const nodes=[...nav.querySelectorAll(`[data-df-finance-nav="${id}"]`)];
      nodes.slice(1).forEach(x=>x.remove());
      if(!nav.querySelector(`[data-df-finance-nav="${id}"]`)){
        const b=document.createElement('button');b.type='button';b.className='nav';b.dataset.dfFinanceNav=id;b.innerHTML=`<i>${icon}</i>${text}`;
        nav.appendChild(b);
      }
    });
  }

  function prepareStatusButtons(){
    const d=read();
    document.querySelectorAll('table tbody tr').forEach(row=>{
      const number=(row.querySelector('td')?.textContent||'').match(/RE-\d{4}-\d+/)?.[0];
      if(!number)return;
      const inv=(d.invoices||[]).find(x=>x.invoice_number===number);
      if(!inv)return;
      row.querySelectorAll('button').forEach(b=>{
        const text=b.textContent.trim();
        if(text.includes('Bezahlt')||text.includes('Als bezahlt markieren')||text.includes('Offen')){
          b.disabled=false;
          b.removeAttribute('disabled');
          b.dataset.status=inv.id;
          b.dataset.invoiceStatus=inv.id;
          b.classList.add('df-status-button');
          b.title=inv.status==='Bezahlt'?'Auf Offen setzen':'Als Bezahlt markieren';
        }
      });
    });
  }

  function removeLegacyCaseInvoiceBox(){
    const root=document.querySelector('.content');if(!root)return;
    root.querySelectorAll('.panel').forEach(panel=>{
      if(!panel.querySelector('button[data-action="newinvoice"]'))return;
      const heading=[...panel.querySelectorAll('.panelhead b,h2,h3')].some(x=>x.textContent.trim().toLowerCase()==='rechnungen');
      if(heading)panel.remove();
    });
  }

  function refresh(){
    ensureFinanceNav();
    prepareStatusButtons();
    removeLegacyCaseInvoiceBox();
  }

  refresh();
  new MutationObserver(()=>setTimeout(refresh,0)).observe(document.body,{childList:true,subtree:true});
})();
