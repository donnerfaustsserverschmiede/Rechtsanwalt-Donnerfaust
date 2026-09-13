/* Kurze externe Aktenlinks – /akte/Aktenzeichen/Token */
(() => {
  const DBKEY="donnerfaust_kanzlei_v1";
  const BASE=location.origin+location.pathname.replace(/[^/]*$/,'');
  const read=()=>{try{return JSON.parse(localStorage.getItem(DBKEY)||"{}")}catch{return {}}};
  const token=()=>{const a=new Uint8Array(9);crypto.getRandomValues(a);return [...a].map(x=>x.toString(36).padStart(2,'0')).join('').slice(0,12)};
  function getCurrentCase(){const marker=[...document.querySelectorAll('.eyebrow')].find(x=>x.textContent.trim().startsWith('AKTE '));if(!marker)return null;const number=marker.textContent.trim().replace(/^AKTE\s*/,"");return (read().cases||[]).find(x=>String(x.file_number)===number)||null}
  async function createShare(c){
    const cloud=window.DonnerfaustCloud?.supabase;if(!cloud)throw new Error('Cloud-Datenbank nicht bereit.');
    const fresh=read(),current=(fresh.cases||[]).find(x=>String(x.id)===String(c.id));if(!current)throw new Error('Akte nicht gefunden.');
    const cl=(fresh.clients||[]).find(x=>String(x.id)===String(current.client_id))||null;
    const documents=(fresh.documents||[]).filter(x=>String(x.case_id)===String(current.id)).map(x=>({name:x.name,type:x.type,note:x.note}));
    const evidence=(fresh.evidence_folders||[]).filter(x=>String(x.case_id)===String(current.id)).map(f=>({name:f.name,items:(f.items||[]).map(x=>({name:x.name,url:x.url,type:x.type,file_name:x.file_name}))}));
    const snapshot={version:2,case:{file_number:current.file_number,title:current.title,type:current.type,status:current.status,deadline:current.deadline,court:current.court,opponent:current.opponent,incident:current.incident,background:current.background},client:cl?{name:cl.name,email:cl.email,phone:cl.phone,address:cl.address}:null,documents,evidence_folders:evidence};
    const t=token();const {error}=await cloud.from('shared_case_access').insert({token:t,file_number:String(current.file_number),snapshot,active:true});if(error)throw error;
    return `${BASE}akte/${encodeURIComponent(String(current.file_number))}/${t}`;
  }
  function addPanel(){if(location.pathname.includes('/akte/'))return true;if(document.getElementById('externalSharePanel'))return true;const content=document.querySelector('.content'),c=getCurrentCase();if(!content||!c)return false;
    const panel=document.createElement('div');panel.id='externalSharePanel';panel.className='panel';panel.style.marginTop='18px';
    panel.innerHTML='<div class="panelhead"><b>🔗 Externer Aktenzugang</b><span>Nur-Lese-Zugriff</span></div><p class="muted">Separater Link für Justiz, Gericht oder andere berechtigte Stellen.</p><div class="actions"><button class="btn dark" id="createExternalCaseLink" type="button">🔗 Link erstellen</button><button class="btn outline" id="copyExternalCaseLink" type="button" disabled>📋 Link kopieren</button></div><input class="fullinput" id="externalCaseLink" readonly placeholder="Noch kein Freigabelink erstellt …" style="margin-top:10px"><small class="muted">Nur diese Akte wird freigegeben. Der Zugriff ist schreibgeschützt.</small>';
    content.appendChild(panel);
    document.getElementById('createExternalCaseLink').onclick=async()=>{const b=document.getElementById('createExternalCaseLink');b.disabled=true;b.textContent='⏳ Wird erstellt …';try{const link=await createShare(c);const input=document.getElementById('externalCaseLink'),copy=document.getElementById('copyExternalCaseLink');input.value=link;copy.disabled=false;if(navigator.clipboard)await navigator.clipboard.writeText(link);alert('Aktenlink erstellt und kopiert.');}catch(e){console.error(e);alert('Aktenlink konnte nicht erstellt werden. Prüfe die Supabase-Tabelle shared_case_access.')}finally{b.disabled=false;b.textContent='🔗 Link erstellen'}};
    document.getElementById('copyExternalCaseLink').onclick=()=>{const v=document.getElementById('externalCaseLink').value;if(navigator.clipboard)navigator.clipboard.writeText(v).then(()=>alert('Link kopiert.'));else prompt('Link:',v)};return true;
  }
  let attempts=0;const timer=setInterval(()=>{attempts++;if(addPanel()||attempts>240)clearInterval(timer)},500);addPanel();
})();
