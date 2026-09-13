/* Rechtsanwalt Donnerfaust – Finanznavigation / Mobile Sidebar Fix */
(() => {
  const STYLE_ID='df-finance-nav-fix-style';

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* Das alte Gebühren/Rechnungen-Menü aus app.js gehört nicht mehr zum neuen Finanzsystem. */
      aside.sidebar nav > [data-nav="invoices"]{display:none!important}

      /* Rechnungsformular: Auswahl konsequent linksbündig. */
      .df-invoice-lines,
      .df-invoice-lines *,
      label[style*="display:flex"]{
        text-align:left!important;
      }
      .df-invoice-lines label{
        justify-content:flex-start!important;
      }
      .df-invoice-lines label span{
        text-align:left!important;
      }

      @media(max-width:900px){
        .sidebar .mobile-sidebar-close{
          display:flex;
          position:absolute;
          right:12px;
          top:18px;
          width:36px;
          height:36px;
          border:1px solid #ffffff22;
          border-radius:10px;
          background:#ffffff12;
          color:#fff;
          align-items:center;
          justify-content:center;
          font-size:24px;
          line-height:1;
          z-index:30;
        }
        .df-sidebar-overlay{
          position:fixed;
          inset:0;
          background:rgba(17,24,39,.48);
          z-index:9;
          opacity:0;
          pointer-events:none;
          transition:opacity .2s;
        }
        .df-sidebar-overlay.show{
          opacity:1;
          pointer-events:auto;
        }
        .sidebar{z-index:20}
      }
      @media(min-width:901px){
        .sidebar .mobile-sidebar-close,
        .df-sidebar-overlay{display:none!important}
      }
    `;
    document.head.appendChild(s);
  }

  function closeSidebar(){
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.df-sidebar-overlay')?.classList.remove('show');
  }

  function add(){
    installStyle();
    const sidebar=document.querySelector('aside.sidebar');
    const nav=sidebar?.querySelector('nav');
    if(!sidebar||!nav)return;

    /* Alte Navigation aus app.js ausblenden. */
    nav.querySelectorAll('[data-nav="invoices"]').forEach(x=>x.remove());

    /* Die bisher von diesem Fix erzeugten doppelten Finanzlinks entfernen.
       Die eigentliche Finanznavigation kommt ausschließlich aus finance-invoice.js. */
    nav.querySelectorAll('[data-finance-link]').forEach(x=>x.remove());

    if(!sidebar.querySelector('.mobile-sidebar-close')){
      const close=document.createElement('button');
      close.type='button';
      close.className='mobile-sidebar-close';
      close.setAttribute('aria-label','Menü schließen');
      close.innerHTML='×';
      close.addEventListener('click',closeSidebar);
      sidebar.querySelector('.sidebrand')?.appendChild(close);
    }

    let overlay=document.querySelector('.df-sidebar-overlay');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.className='df-sidebar-overlay';
      overlay.addEventListener('click',closeSidebar);
      document.body.appendChild(overlay);
    }
  }

  add();
  new MutationObserver(add).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSidebar()});
})();