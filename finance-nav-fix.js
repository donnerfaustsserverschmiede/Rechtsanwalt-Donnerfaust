/* Rechtsanwalt Donnerfaust – Finanznavigation / Mobile Sidebar Fix */
(() => {
  const STYLE_ID = 'df-finance-nav-fix-style';

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      /* Gebühren/Rechnungen gehört vollständig zum neuen Finanzsystem. */
      [data-nav="invoices"],
      aside.sidebar nav > button[data-nav="invoices"] { display:none !important; }

      /* Keine doppelten Finanzlinks. */
      aside.sidebar nav [data-df-finance-duplicate="1"] { display:none !important; }

      /* Rechnungsformular immer linksbündig. */
      .df-invoice-lines,
      .df-invoice-lines *,
      label[style*="display:flex"] { text-align:left !important; }
      .df-invoice-lines label { justify-content:flex-start !important; }
      .df-invoice-lines label span { text-align:left !important; }

      @media(max-width:900px){
        .sidebar .mobile-sidebar-close {
          display:flex; position:absolute; right:12px; top:18px; width:36px; height:36px;
          border:1px solid #ffffff22; border-radius:10px; background:#ffffff12; color:#fff;
          align-items:center; justify-content:center; font-size:24px; line-height:1; z-index:30;
        }
        .df-sidebar-overlay { position:fixed; inset:0; background:rgba(17,24,39,.48); z-index:19;
          opacity:0; pointer-events:none; transition:opacity .2s; }
        .df-sidebar-overlay.show { opacity:1; pointer-events:auto; }
        .sidebar { z-index:20; }
      }
      @media(min-width:901px){ .sidebar .mobile-sidebar-close,.df-sidebar-overlay{display:none!important;} }
    `;
    document.head.appendChild(s);
  }

  function closeSidebar() {
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.df-sidebar-overlay')?.classList.remove('show');
  }

  function dedupeFinanceNav(nav) {
    if (!nav) return;
    nav.querySelectorAll('[data-nav="invoices"]').forEach(el => el.remove());
    nav.querySelectorAll('[data-finance-link]').forEach(el => el.remove());
    ['finance','cash','billing'].forEach(id => {
      const items=[...nav.querySelectorAll(`[data-dfFinanceNav="${id}"]`)];
      items.slice(1).forEach(el=>el.remove());
    });
  }

  function updateHeading() {
    document.querySelectorAll('h1,h2,.eyebrow').forEach(el => {
      if (el.textContent.trim() === 'Gebühren & Rechnungen') el.textContent = 'Rechnungen';
    });
  }

  function add() {
    installStyle();
    const sidebar=document.querySelector('aside.sidebar');
    const nav=sidebar?.querySelector('nav');
    if(!sidebar||!nav)return;
    dedupeFinanceNav(nav);

    if(!sidebar.querySelector('.mobile-sidebar-close')){
      const close=document.createElement('button');
      close.type='button'; close.className='mobile-sidebar-close';
      close.setAttribute('aria-label','Menü schließen'); close.innerHTML='×';
      close.addEventListener('click',closeSidebar);
      sidebar.querySelector('.sidebrand')?.appendChild(close);
    }

    let overlay=document.querySelector('.df-sidebar-overlay');
    if(!overlay){
      overlay=document.createElement('div'); overlay.className='df-sidebar-overlay';
      overlay.addEventListener('click',closeSidebar); document.body.appendChild(overlay);
    }
    updateHeading();
  }

  add();
  new MutationObserver(()=>setTimeout(add,0)).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('aside.sidebar nav [data-dfFinanceNav]')) closeSidebar();
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSidebar()});
})();
