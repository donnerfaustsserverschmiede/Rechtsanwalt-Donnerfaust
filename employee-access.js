/* Mitarbeiter-Einladungen ohne Node.js / Edge Function.
   Die Einladung enthält nur Name, E-Mail und Rolle. Das Konto wird vom
   eingeladenen Mitarbeiter selbst mit seinem eigenen Passwort registriert. */
(() => {
  const qs = new URLSearchParams(location.search);
  const invite = qs.get('einladung');
  const decode = s => { try { const b=s.replace(/-/g,'+').replace(/_/g,'/'); return JSON.parse(decodeURIComponent(escape(atob(b)))); } catch { return null; } };
  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  async function getClient(){
    const src = await fetch('./supabase-sync.js?v=5',{cache:'no-store'}).then(r=>r.text());
    const url=(src.match(/const SUPABASE_URL\s*=\s*["']([^"']+)/)||[])[1];
    const key=(src.match(/const SUPABASE_KEY\s*=\s*["']([^"']+)/)||[])[1];
    if(!url||!key||!window.supabase?.createClient) throw new Error('Supabase-Konfiguration nicht gefunden.');
    return window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  }

  function encode(o){let bin='';new TextEncoder().encode(JSON.stringify(o)).forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  window.DonnerfaustCreateInvite = (email,name,role) => { const u=new URL(location.href.split('?')[0].split('#')[0]); u.searchParams.set('einladung',encode({email,name,role:role||'mitarbeiter'})); return u.toString(); };

  async function accept(){
    if(!invite) return;
    const data=decode(invite); if(!data?.email) return;
    document.body.innerHTML=`<div style="min-height:100vh;display:grid;place-items:center;background:#0b1220;padding:20px;font-family:system-ui"><form id="dfInvite" style="width:min(470px,100%);background:#fff;border-radius:22px;padding:30px;box-shadow:0 24px 80px #0008"><div style="font-size:40px">⚖</div><h1>Mitarbeiterzugang aktivieren</h1><p>Willkommen bei <b>Rechtsanwalt Donnerfaust</b>.</p><div style="background:#f3f4f6;padding:14px;border-radius:12px;margin:16px 0"><b>${esc(data.name||'Mitarbeiter')}</b><br>${esc(data.email)}<br><small>${esc(data.role||'Mitarbeiter')}</small></div><label>Dein persönliches Passwort</label><input id="p1" type="password" minlength="8" required autocomplete="new-password" style="width:100%;box-sizing:border-box;padding:13px;margin:7px 0 14px;border:1px solid #ccd2dc;border-radius:10px"><label>Passwort wiederholen</label><input id="p2" type="password" minlength="8" required autocomplete="new-password" style="width:100%;box-sizing:border-box;padding:13px;margin:7px 0 14px;border:1px solid #ccd2dc;border-radius:10px"><button style="width:100%;padding:13px;border:0;border-radius:10px;background:#111827;color:#fff;font-weight:700">Konto aktivieren</button><div id="msg" style="margin-top:12px"></div></form></div>`;
    const client=await getClient().catch(e=>null); const msg=document.getElementById('msg');
    if(!client){msg.textContent='Supabase konnte nicht geladen werden.';return;}
    document.getElementById('dfInvite').onsubmit=async e=>{e.preventDefault();const p1=document.getElementById('p1').value,p2=document.getElementById('p2').value;if(p1!==p2){msg.textContent='Die Passwörter stimmen nicht überein.';return;}msg.textContent='Konto wird eingerichtet…';const {data:r,error}=await client.auth.signUp({email:data.email,password:p1,options:{data:{name:data.name||'',role:data.role||'mitarbeiter'}}});if(error){msg.textContent=error.message;return;}if(!r.session){msg.textContent='Konto erstellt. Bitte bestätige die E-Mail und öffne anschließend die Kanzlei erneut.';return;}localStorage.setItem('df_profile_hint',JSON.stringify({name:data.name||'',role:data.role||'mitarbeiter'}));location.href=location.href.split('?')[0].split('#')[0];};
  }

  function addInviteButton(){
    if(!window.DonnerfaustCloud?.ready||document.getElementById('dfInviteButton')) return;
    const heading=[...document.querySelectorAll('h1,h2,h3')].find(h=>/Mitarbeiter/.test(h.textContent||'')); if(!heading) return;
    const b=document.createElement('button');b.id='dfInviteButton';b.textContent='✉ Mitarbeiter einladen';b.style.cssText='position:fixed;right:18px;bottom:18px;z-index:9998;padding:13px 17px;border:0;border-radius:14px;background:#111827;color:#fff;font-weight:700;box-shadow:0 10px 30px #0003';document.body.appendChild(b);
    b.onclick=()=>{const x=document.createElement('div');x.style.cssText='position:fixed;inset:0;z-index:10000;background:#0008;display:grid;place-items:center;padding:20px;font-family:system-ui';x.innerHTML='<form style="width:min(440px,100%);background:#fff;border-radius:20px;padding:26px"><h2>Mitarbeiter einladen</h2><label>Name</label><input id="n" required style="width:100%;box-sizing:border-box;padding:11px;margin:6px 0 12px"><label>E-Mail</label><input id="e" type="email" required style="width:100%;box-sizing:border-box;padding:11px;margin:6px 0 12px"><label>Rolle</label><select id="r" style="width:100%;box-sizing:border-box;padding:11px;margin:6px 0 18px"><option value="mitarbeiter">Mitarbeiter</option><option value="assistenz">Assistenz</option><option value="anwalt">Rechtsanwalt</option><option value="verwaltung">Verwaltung</option></select><button>Einladungslink erzeugen</button><button type="button" id="c">Abbrechen</button><div id="o"></div></form>';document.body.appendChild(x);x.querySelector('#c').onclick=()=>x.remove();x.querySelector('form').onsubmit=e=>{e.preventDefault();const url=window.DonnerfaustCreateInvite(x.querySelector('#e').value.trim(),x.querySelector('#n').value.trim(),x.querySelector('#r').value);x.querySelector('#o').innerHTML='<textarea readonly style="width:100%;height:100px;margin-top:12px">'+esc(url)+'</textarea><p>Link wurde erzeugt und kann kopiert und verschickt werden.</p>';navigator.clipboard?.writeText(url).catch(()=>{});};};
  }
  accept();setInterval(addInviteButton,1200);
})();
