/* Rechtsanwalt Donnerfaust – zentrale Cloud-Datenbank, gemeinsamer Zugang */
(() => {
  const SUPABASE_URL = "https://qsyijgvikxmwmhaiulne.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5qeUg0c0T0IyLh8g0cUj6Q_ZJYgZYJ_";
  const STATE_KEY = "donnerfaust_kanzlei_v1";
  const REMOTE_ID = "main";
  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;
  let supabase = null, applyingRemote = false, writeTimer = null, appStarted = false;
  const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  function fatal(message){const app=document.getElementById("app");if(app)app.innerHTML=`<div style="max-width:680px;margin:8vh auto;padding:30px;font-family:system-ui;background:#fff;border:1px solid #ddd;border-radius:18px"><h2>⚠ Kanzlei-Datenbank nicht erreichbar</h2><p>${esc(message)}</p><p style="color:#667085">Lokale Daten wurden nicht gelöscht.</p></div>`}
  async function cloudState(){const {data,error}=await supabase.from("kanzlei_state").select("data,updated_at").eq("id",REMOTE_ID).maybeSingle();if(error)throw error;return data}
  async function writeCloud(obj){if(!supabase||applyingRemote)return;const {error}=await supabase.from("kanzlei_state").upsert({id:REMOTE_ID,data:obj,updated_at:new Date().toISOString()},{onConflict:"id"});if(error)console.error("Cloud-Speicherung:",error)}
  function hookStorage(){Storage.prototype.setItem=function(key,value){const result=originalSetItem.call(this,key,value);if(this===localStorage&&key===STATE_KEY&&!applyingRemote&&supabase){clearTimeout(writeTimer);writeTimer=setTimeout(()=>{try{writeCloud(JSON.parse(value))}catch(e){console.error(e)}},150)}return result}}
  function subscribe(){supabase.channel("donnerfaust-kanzlei-state").on("postgres_changes",{event:"*",schema:"public",table:"kanzlei_state",filter:"id=eq.main"},payload=>{if(!payload.new?.data||applyingRemote)return;applyingRemote=true;try{originalSetItem.call(localStorage,STATE_KEY,JSON.stringify(payload.new.data))}finally{applyingRemote=false}if(appStarted)location.reload()}).subscribe()}
  function startApp(){if(appStarted)return;appStarted=true;window.DonnerfaustCloud={supabase,ready:true};const s=document.createElement("script");s.src="./app.js?v=8";s.onerror=()=>fatal("Die Kanzlei-Anwendung konnte nicht geladen werden.");document.body.appendChild(s)}
  async function init(){try{if(!window.supabase?.createClient)throw new Error("Supabase-Bibliothek fehlt.");supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});hookStorage();const remote=await cloudState();const localRaw=originalGetItem.call(localStorage,STATE_KEY);if(remote?.data){applyingRemote=true;try{originalSetItem.call(localStorage,STATE_KEY,JSON.stringify(remote.data))}finally{applyingRemote=false}}else if(localRaw){await writeCloud(JSON.parse(localRaw))}subscribe();startApp()}catch(e){console.error(e);fatal("Die zentrale Datenbank konnte nicht geladen werden. Bitte prüfe die Supabase-Tabelle kanzlei_state und ihre öffentlichen Lese-/Schreibrechte.")}}
  init();
})();
