/* Rechtsanwalt Donnerfaust – zentrale Cloud-Synchronisierung
   GitHub Pages only. Kein Node.js / kein eigener Server.
   Die bestehende App darf weiterhin localStorage benutzen; dieser Layer macht daraus
   einen zentralen, angemeldeten Supabase-Datenstand und synchronisiert Änderungen per Realtime.
*/
(() => {
  const SUPABASE_URL = "https://qsyijgvikxmwmhaiulne.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5qeUg0c0T0IyLh8g0cUj6Q_ZJYgZYJ_";
  const STATE_KEY = "donnerfaust_kanzlei_v1";
  const REMOTE_ID = "main";
  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;
  let supabase = null;
  let applyingRemote = false;
  let writeTimer = null;
  let appStarted = false;

  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  function fatal(message) {
    const app = document.getElementById("app");
    if (app) app.innerHTML = `<div style="max-width:680px;margin:8vh auto;padding:30px;font-family:system-ui;background:#fff;border:1px solid #ddd;border-radius:18px;box-shadow:0 12px 40px #0001"><h2>⚠ Kanzlei-Datenbank nicht erreichbar</h2><p>${esc(message)}</p><p style="color:#667085">Deine lokalen Daten wurden nicht gelöscht.</p></div>`;
  }

  async function login() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;

    return new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.id = "df-login";
      overlay.innerHTML = `<div style="position:fixed;inset:0;z-index:99999;background:#0b1220ee;display:grid;place-items:center;padding:20px;font-family:system-ui"><form id="df-login-form" style="width:min(440px,100%);background:#fff;border-radius:22px;padding:30px;box-shadow:0 24px 80px #0008"><div style="font-size:38px">⚖</div><h1 style="margin:8px 0">Rechtsanwalt Donnerfaust</h1><p style="color:#667085">Zentrale Kanzleidatenbank</p><label style="display:block;margin:16px 0 6px">E-Mail</label><input id="df-email" type="email" autocomplete="email" required style="width:100%;box-sizing:border-box;padding:13px;border:1px solid #ccd2dc;border-radius:10px"><label style="display:block;margin:16px 0 6px">Passwort</label><input id="df-password" type="password" autocomplete="current-password" minlength="6" required style="width:100%;box-sizing:border-box;padding:13px;border:1px solid #ccd2dc;border-radius:10px"><button id="df-submit" style="width:100%;margin-top:20px;padding:13px;border:0;border-radius:10px;background:#111827;color:white;font-weight:700">Anmelden</button><button id="df-signup" type="button" style="width:100%;margin-top:10px;padding:12px;border:1px solid #ccd2dc;border-radius:10px;background:#fff;font-weight:700">Neues Kanzleikonto anlegen</button><div id="df-error" style="color:#b42318;margin-top:12px"></div></form></div>`;
      document.body.appendChild(overlay);
      const form = overlay.querySelector("form");
      const email = overlay.querySelector("#df-email");
      const password = overlay.querySelector("#df-password");
      const error = overlay.querySelector("#df-error");
      const submit = overlay.querySelector("#df-submit");

      form.onsubmit = async e => {
        e.preventDefault();
        error.textContent = "Anmeldung läuft…";
        submit.disabled = true;
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
        submit.disabled = false;
        if (authError) { error.textContent = authError.message || "Anmeldung fehlgeschlagen."; return; }
        overlay.remove(); resolve(data.session);
      };

      overlay.querySelector("#df-signup").onclick = async () => {
        error.textContent = "Konto wird angelegt…";
        const { data, error: authError } = await supabase.auth.signUp({ email: email.value.trim(), password: password.value });
        if (authError) { error.textContent = authError.message || "Konto konnte nicht angelegt werden."; return; }
        if (data.session) { overlay.remove(); resolve(data.session); }
        else error.textContent = "Konto angelegt. Falls Supabase eine E-Mail-Bestätigung verlangt, bestätige diese und melde dich danach an.";
      };
    });
  }

  async function cloudState() {
    const { data, error } = await supabase.from("kanzlei_state").select("data,updated_at").eq("id", REMOTE_ID).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function writeCloud(obj) {
    if (!supabase || applyingRemote) return;
    const { error } = await supabase.from("kanzlei_state").upsert({ id: REMOTE_ID, data: obj, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) console.error("Supabase-Speicherung fehlgeschlagen:", error);
  }

  function hookStorage() {
    Storage.prototype.setItem = function(key, value) {
      const result = originalSetItem.call(this, key, value);
      if (this === localStorage && key === STATE_KEY && !applyingRemote && supabase) {
        clearTimeout(writeTimer);
        writeTimer = setTimeout(() => {
          try { writeCloud(JSON.parse(value)); } catch (e) { console.error(e); }
        }, 150);
      }
      return result;
    };
  }

  function subscribeRealtime() {
    supabase.channel("donnerfaust-kanzlei-state")
      .on("postgres_changes", { event:"*", schema:"public", table:"kanzlei_state", filter:"id=eq.main" }, payload => {
        if (!payload.new?.data || applyingRemote) return;
        applyingRemote = true;
        try { originalSetItem.call(localStorage, STATE_KEY, JSON.stringify(payload.new.data)); }
        finally { applyingRemote = false; }
        // Die vorhandene App liest ihren Zustand beim Start aus localStorage.
        // Ein Reload nach einer echten Fremdänderung stellt daher alle Ansichten sicher konsistent dar.
        if (appStarted) location.reload();
      })
      .subscribe();
  }

  function startApp() {
    if (appStarted) return;
    appStarted = true;
    window.DonnerfaustCloud = {
      supabase,
      ready: true,
      logout: async () => { await supabase.auth.signOut(); location.reload(); }
    };
    const s = document.createElement("script");
    s.src = "./app.js?v=5";
    s.onerror = () => fatal("Die Kanzlei-Anwendung konnte nicht geladen werden.");
    document.body.appendChild(s);
  }

  async function init() {
    try {
      if (!window.supabase?.createClient) throw new Error("Supabase-Bibliothek fehlt.");
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
      hookStorage();
      await login();
      const remote = await cloudState();
      const localRaw = originalGetItem.call(localStorage, STATE_KEY);

      if (remote?.data) {
        applyingRemote = true;
        try { originalSetItem.call(localStorage, STATE_KEY, JSON.stringify(remote.data)); }
        finally { applyingRemote = false; }
      } else if (localRaw) {
        await writeCloud(JSON.parse(localRaw));
      }

      subscribeRealtime();
      startApp();
    } catch (e) {
      console.error(e);
      fatal("Die Verbindung zu Supabase konnte nicht hergestellt werden. Prüfe, ob die Tabelle „kanzlei_state“ vorhanden ist und die RLS-Regeln ausgeführt wurden.");
    }
  }

  init();
})();
