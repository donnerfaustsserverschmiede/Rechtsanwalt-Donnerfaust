/* Rechtsanwalt Donnerfaust – Finanznavigation / Mobile Sidebar Fix */
(() => {
  const STYLE_ID = 'df-finance-nav-fix-style';
  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      /* Das alte Gebühren/Rechnungen-Menü aus app.js wird vollständig ersetzt. */
      aside.sidebar nav > button[data-nav="invoices"] { display:none !important; }
      /* Rechnungsformular und Leistungen immer linksbündig. */
      .df-invoice-lines,.df-invoice-lines *, .df-service-list,.df-service-list * { text-align:left !important; }
      .df-service-list label { justify-content:flex-start !important; }
      @media(max-width:900px){
        .sidebar .mobile-sidebar-close{display:flex;position:absolute;right:12px;top:18px;width:36px;height:36px;border:1px solid #ffffff22;border-radius:10px;background:#ffffff12;color:#fff;align-items:center;justify-content:center;font-size:24px;line-height:1;z-index:30}
        .df-sidebar-overlay{position:fixed;inset:0;background:rgba(17,24,39,.48);z-index:19;opacity:0;pointer-events:none;transition:opacity .2s}
        .df-sidebar-overlay.show{opacity:1;pointer-events:auto}.sidebar{z-index:20}
      }
      @media(min-width:901px){.sidebar .mobile-sidebar-close,.df-sidebar-overlay{display:none!important}}
    `;
    document.head.appendChild(s);
  }
  function closeSidebar(){document.querySelector('.sidebar')?.classList.remove('open');document.querySelector('.df-sidebar-overlay')?.classList.remove('show');}
  function ensureFinanceNav(){
    installStyle();
    const sidebar=document.querySelector('aside.sidebar'),nav=sidebar?.querySelector('nav');
    if(!sidebar||!nav)return;
    nav.querySelectorAll('[data-nav="invoices"]').forEach(x=>x.remove());
    const wanted=[['finance','▣','Finanzen'],['cash','💶','Kasse'],['billing','🧾','Rechnungen']];
    wanted.forEach(([id,icon,text])=>{
      const existing=[...nav.querySelectorAll(`[data-df-finance-nav="${id}"]`)];
      existing.slice(1).forEach(x=>x.remove());
      if(!nav.querySelector(`[data-df-finance-nav="${id}"]`)){
        const b=document.createElement('button');b.type='button';b.className='nav';b.dataset.dfFinanceNav=id;b.innerHTML=`<i>${icon}</i>${text}`;nav.appendChild(b);
      }
    });
    if(!sidebar.querySelector('.mobile-sidebar-close')){
      const close=document.createElement('button');close.type='button';close.className='mobile-sidebar-close';close.setAttribute('aria-label','Menü schließen');close.textContent='×';close.onclick=closeSidebar;sidebar.querySelector('.sidebrand')?.appendChild(close);
    }
    let overlay=document.querySelector('.df-sidebar-overlay');
    if(!overlay){overlay=document.createElement('div');overlay.className='df-sidebar-overlay';overlay.onclick=closeSidebar;document.body.appendChild(overlay);}
    if(!nav.dataset.dfFinanceBound){
      nav.dataset.dfFinanceBound='1';
      nav.addEventListener('click',e=>{const b=e.target.closest('[data-df-finance-nav]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(typeof window.showPage==='function')window.showPage(b.dataset.dfFinanceNav);else if(typeof window.__dfShowFinancePage==='function')window.__dfShowFinancePage(b.dataset.dfFinanceNav);closeSidebar();},true);
    }
  }
  ensureFinanceNav();
  new MutationObserver(()=>setTimeout(ensureFinanceNav,0)).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('aside.sidebar nav [data-df-finance-nav]'))closeSidebar();},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSidebar();});
})();
