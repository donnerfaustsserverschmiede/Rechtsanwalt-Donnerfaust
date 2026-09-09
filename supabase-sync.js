/* Rechtsanwalt Donnerfaust — Supabase Sync Layer
   GitHub Pages only: no Node.js/server required.
   Loads before the existing application and synchronizes its existing localStorage state.
*/
(() => {
  const SUPABASE_URL = "https://qsyijgvikxmwmhaiulne.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5qeUg0c0T0IyLh8g0cUj6Q_ZJYgZYJ_";
  const STATE_KEY = "donnerfaust_kanzlei_v1";
  const SESSION_KEY = "donnerfaust_supabase_session";
  const REMOTE_ID = "main";
  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;
  let supabase = null;
  let ready = false;
  let applyingRemote = false;
  let writeTimer = null;
  let channel = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function init() {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      await ensureLogin();
      await syncFromCloud();
      subscribeRealtime();
      ready = true;
      window.dispatchEvent(new CustomEvent("donnerfaust:supabase-ready"));
    } catch (e) {
      console.error("Supabase-Synchronisierung konnte nicht gestartet werden:", e);
      showFatal("Die zentrale Datenbank konnte nicht verbunden werden. Prüfe Supabase und die Datenbank-Tabelle.");
    }
  }

  function showFatal(msg) {
    const app = document.getElementById("app");
    if (app) app.innerHTML = `<div style="max-width:650px;margin:8vh auto;padding:28px;font-family:system-ui;background:#fff;border:1px solid #ddd;border-radius:18px;box-shadow:0 12px 40px #0001"><h2>⚠ Kanzlei-Datenbank nicht erreichbar</h2><p>${escapeHtml(msg)}</p><p style="color:#666">Die lokalen Daten wurden nicht gelöscht.</p></div>`;
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}

  async function ensureLogin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return;
    await new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.id = "df-login";
      overlay.innerHTML = `<div style="position:fixed;inset:0;z-index:99999;background:#0b1220ee;display:grid;place-items:center;padding:20px;font-family:system-ui"><form id="df-login-form" style="width:min(420px,100%);background:white;border-radius:20px;padding:28px;box-shadow:0 24px 80px #0008"><div style="font-size:36px">⚖</div><h1 style="margin:8px 0">Rechtsanwalt Donnerfaust</h1><p style="color:#667085">Anmeldung zur zentralen Kanzleidatenbank</p><label style="display:block;margin:16px 0 6px">E-Mail</label><input id="df-email" type="email" required style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #ccd2dc;border-radius:10px"><label style="display:block;margin:16px 0 6px">Passwort</label><input id="df-password" type="password" required style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #ccd2dc;border-radius:10px"><button style="width:100%;margin-top:20px;padding:13px;border:0;border-radius:10px;background:#111827;color:white;font-weight:700">Anmelden</button><div id="df-error" style="color:#b42318;margin-top:12px"></div></form></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector("form").onsubmit = async e => {
        e.preventDefault();
        const err = overlay.querySelector("#df-error"); err.textContent = "Anmeldung läuft…";
        const { error } = await supabase.auth.signInWithPassword({
          email: overlay.querySelector("#df-email").value.trim(),
          password: overlay.querySelector("#df-password").value
        });
        if (error) { err.textContent = "Anmeldung fehlgeschlagen. E-Mail oder Passwort prüfen."; return; }
        overlay.remove(); resolve();
      };
    });
  }

  async function syncFromCloud() {
    const { data, error } = await supabase.from("kanzlei_state").select("data,updated_at").eq("id", REMOTE_ID).maybeSingle();
    if (error) throw error;
    const local = originalGetItem.call(localStorage, STATE_KEY);
    if (!data) {
      if (local) await writeCloud(JSON.parse(local));
      return;
    }
    applyingRemote = true;
    try { originalSetItem.call(localStorage, STATE_KEY, JSON.stringify(data.data)); }
    finally { applyingRemote = false; }
    location.reload();
  }

  function subscribeRealtime() {
    channel = supabase.channel("donnerfaust-kanzlei-state")
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"kanzlei_state", filter:"id=eq.main" }, payload => {
        if (!payload.new || !payload.new.data || applyingRemote) return;
        applyingRemote = true;
        try { originalSetItem.call(localStorage, STATE_KEY, JSON.stringify(payload.new.data)); }
        finally { applyingRemote = false; }
        location.reload();
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"kanzlei_state", filter:"id=eq.main" }, payload => {
        if (!payload.new || !payload.new.data || applyingRemote) return;
        applyingRemote = true;
        try { originalSetItem.call(localStorage, STATE_KEY, JSON.stringify(payload.new.data)); }
        finally { applyingRemote = false; }
        location.reload();
      })
      .subscribe();
  }

  async function writeCloud(obj) {
    if (!supabase || applyingRemote) return;
    const { error } = await supabase.from("kanzlei_state").upsert({
      id: REMOTE_ID,
      data: obj,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });
    if (error) console.error("Supabase-Speicherung fehlgeschlagen:", error);
  }

  Storage.prototype.setItem = function(key, value) {
    const result = originalSetItem.call(this, key, value);
    if (this === localStorage && key === STATE_KEY && !applyingRemote) {
      clearTimeout(writeTimer);
      writeTimer = setTimeout(() => {
        try { writeCloud(JSON.parse(value)); } catch (e) { console.error(e); }
      }, 250);
    }
    return result;
  };

  window.DonnerfaustCloud = {
    get supabase(){ return supabase; },
    get ready(){ return ready; },
    async logout(){ if(supabase) await supabase.auth.signOut(); location.reload(); }
  };

  init();
})();
