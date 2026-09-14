/* Sekretär-Stundenerfassung – bestätigte Einträge statt Überschreiben des Tageswerts */
(() => {
  const DBKEY="donnerfaust_kanzlei_v1", PAYKEY="donnerfaust_employee_pay_v3";
  const read=()=>{try{return JSON.parse(localStorage.getItem(DBKEY)||"{}")}catch{return{}}};
  const load=()=>{try{return JSON.parse(localStorage.getItem(PAYKEY)||"{}")}catch{return{}}};
  const save=p=>localStorage.setItem(PAYKEY,JSON.stringify(p));
  const write=d=>localStorage.setItem(DBKEY,JSON.stringify(d));
  const eur=n=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(n)||0);
  const day=()=>new Date().toISOString().slice(0,10);
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  function rec(id){const p=load();p[id] ||= {hours:{},payout:"weekly",paid:0,credited:{}};p[id].entries ||= [];return p[id]}
  function total(r){return (r.entries||[]).reduce((s,x)=>s+(Number(x.hours)||0),0)}
  function patchCard(card,id){
    if(card.dataset.dfHoursFinal)return; const input=card.querySelector(`[data-df-hours="${CSS.escape(id)}"]`); if(!input)return;
    card.dataset.dfHoursFinal="1";
    const wrap=input.closest("label")?.parentElement || input.parentElement;
    const btn=document.createElement("button");btn.type="button";btn.className="btn dark";btn.textContent="✓ Stunden bestätigen";btn.style.marginTop="8px";
    const msg=document.createElement("div");msg.style.cssText="margin-top:7px;font-size:13px";
    input.removeAttribute("data-df-hours"); input.value=""; input.placeholder="z. B. 8";
    wrap.appendChild(btn);wrap.appendChild(msg);
    btn.onclick=()=>{
      const n=Number(String(input.value).replace(",","."));
      if(!Number.isFinite(n)||n<=0||n>24){msg.textContent="Bitte eine Stundenanzahl zwischen 0,25 und 24 eingeben.";return}
      const r=rec(id);r.entries.push({id:uid(),date:day(),hours:n,amount:n*500,createdAt:new Date().toISOString()});
      r.paid=Number(r.paid)||0;r.hours={};save(load());
      const d=read();write(d);input.value="";msg.textContent=`✓ ${n.toLocaleString("de-DE")} h erfasst · ${eur(n*500)} hinzugefügt.`;
      const sum=card.querySelector(".df-hours-total");if(sum)sum.textContent=`${total(r).toLocaleString("de-DE")} h`;
      setTimeout(()=>{if(typeof render==="function")render()},250);
    };
  }
  function run(){document.querySelectorAll(".df-employee-pay").forEach(card=>{const input=card.querySelector("input[data-df-hours]");if(!input)return;patchCard(card,input.dataset.dfHours)})}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
  setInterval(run,700);
})();
