(() => {
  const links=[['finance','▣','Finanzen','finanzen.html'],['cash','💶','Kasse','kasse.html'],['billing','🧾','Rechnungen','rechnungen.html']];
  function add(){const nav=document.querySelector('aside nav');if(!nav)return;if(nav.dataset.dfNavFix)return;nav.dataset.dfNavFix='1';links.forEach(([id,icon,text,url])=>{if(nav.querySelector(`[data-finance-link="${id}"]`))return;const a=document.createElement('a');a.className='nav';a.dataset.financeLink=id;a.href='./'+url;a.style.textDecoration='none';a.style.display='flex';a.style.alignItems='center';a.innerHTML=`<i>${icon}</i>${text}`;nav.appendChild(a)});}
  add(); new MutationObserver(add).observe(document.body,{childList:true,subtree:true});
})();