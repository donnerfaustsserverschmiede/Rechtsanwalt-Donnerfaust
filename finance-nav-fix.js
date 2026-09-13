(() => {
  const links=[['finance','▣','Finanzen','finanzen.html'],['cash','💶','Kasse','kasse.html'],['billing','🧾','Rechnungen','rechnungen.html']];
  const STYLE_ID='df-mobile-sidebar-style';
  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`@media(max-width:900px){.sidebar .mobile-sidebar-close{display:flex;position:absolute;right:12px;top:18px;width:36px;height:36px;border:1px solid #ffffff22;border-radius:10px;background:#ffffff12;color:#fff;align-items:center;justify-content:center;font-size:24px;line-height:1;z-index:30}.df-sidebar-overlay{position:fixed;inset:0;background:rgba(17,24,39,.48);z-index:9;opacity:0;pointer-events:none;transition:opacity .2s}.df-sidebar-overlay.show{opacity:1;pointer-events:auto}.sidebar{z-index:20}}@media(min-width:901px){.sidebar .mobile-sidebar-close,.df-sidebar-overlay{display:none!important}}`;
    document.head.appendChild(s);
  }
  function closeSidebar(){
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.df-sidebar-overlay')?.classList.remove('show');
  }
  function add(){
    installStyle();
    const sidebar=document.querySelector('aside.sidebar'),nav=sidebar?.querySelector('nav');
    if(!sidebar||!nav)return;
    if(!sidebar.querySelector('.mobile-sidebar-close')){
      const close=document.createElement('button');close.type='button';close.className='mobile-sidebar-close';close.setAttribute('aria-label','Menü schließen');close.innerHTML='×';close.addEventListener('click',closeSidebar);sidebar.querySelector('.sidebrand')?.appendChild(close);
    }
    let overlay=document.querySelector('.df-sidebar-overlay');
    if(!overlay){overlay=document.createElement('div');overlay.className='df-sidebar-overlay';overlay.addEventListener('click',closeSidebar);document.body.appendChild(overlay);}
    links.forEach(([id,icon,text,url])=>{
      if(nav.querySelector(`[data-finance-link="${id}"]`))return;
      const a=document.createElement('a');a.className='nav';a.dataset.financeLink=id;a.href='./'+url;a.style.textDecoration='none';a.style.display='flex';a.style.alignItems='center';a.innerHTML=`<i>${icon}</i>${text}`;nav.appendChild(a);
    });
  }
  add();
  new MutationObserver(add).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSidebar()});
})();