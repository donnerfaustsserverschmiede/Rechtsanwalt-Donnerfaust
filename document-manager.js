/* Dokumentverwaltung: Name + Link, Aktenzuordnung und Dokumentansicht. */
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function openDocumentForm() {
    const selectedCase = typeof caseId !== 'undefined' && caseId ? db.cases.find(c => c.id === caseId) : null;
    const caseOptions = db.cases.map(c => `<option value="${esc(c.id)}">${esc(c.file_number)} · ${esc(c.title)}</option>`).join('');
    const root = document.getElementById('modalroot');
    if (!root) return;
    root.innerHTML = `<div class="modalback"><div class="modal">
      <div class="modalhead"><b>Dokument hinzufügen</b><button id="dfdocclose">×</button></div>
      <form id="dfdocform">
        <label>Dokumentname<input name="name" required placeholder="z. B. Mandatsvertrag"></label>
        <label>Dokument-Link<input name="url" type="url" required placeholder="https://..." autocomplete="url"></label>
        ${selectedCase ? `<label>Akte<input value="${esc(selectedCase.file_number + ' · ' + selectedCase.title)}" disabled><input type="hidden" name="case_id" value="${esc(selectedCase.id)}"></label>` : `<label>Akte<select name="case_id" required><option value="">Bitte Akte auswählen</option>${caseOptions}</select></label>`}
        <div class="actions"><button type="button" class="btn outline" id="dfdoccancel">Abbrechen</button><button class="btn dark" type="submit">Hinzufügen</button></div>
      </form>
    </div></div>`;
    const close = () => root.innerHTML = '';
    document.getElementById('dfdocclose').onclick = close;
    document.getElementById('dfdoccancel').onclick = close;
    document.getElementById('dfdocform').onsubmit = e => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(e.target));
      v.name = v.name.trim(); v.url = v.url.trim();
      if (!/^https?:\/\//i.test(v.url)) { alert('Bitte einen gültigen Link mit https:// oder http:// eingeben.'); return; }
      if (!v.case_id) { alert('Bitte eine Akte auswählen.'); return; }
      v.id = uid(); v.type = 'Link';
      db.documents.push(v);
      log(`Dokument hinzugefügt: ${v.name}`);
      close(); save(); render();
    };
  }

  function openDocumentViewer(doc) {
    const root = document.getElementById('modalroot');
    if (!root || !doc) return;
    root.innerHTML = `<div class="modalback"><div class="modal document-viewer">
      <div class="modalhead"><b>Dokument</b><button id="dfviewclose">×</button></div>
      <div class="docmeta"><div><small>Dokumentname:</small><strong>${esc(doc.name)}</strong></div><div><small>Link:</small><a class="kanzlei-link" href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">${esc(doc.url)}</a></div></div>
      <div class="doccontenthead"><b>Inhalt</b><button class="btn outline" id="dfcopy">📋 Inhalt kopieren</button></div>
      <textarea id="dfcontent" class="document-content" readonly>Dokument wird gelesen…</textarea>
      <div id="dfstatus" class="muted" style="margin-top:8px;font-size:11px"></div>
    </div></div>`;
    const close = () => root.innerHTML = '';
    document.getElementById('dfviewclose').onclick = close;
    document.getElementById('dfcopy').onclick = async () => {
      const text = document.getElementById('dfcontent').value;
      try { await navigator.clipboard.writeText(text); document.getElementById('dfstatus').textContent = 'Inhalt wurde in die Zwischenablage kopiert.'; }
      catch { document.getElementById('dfcontent').select(); document.execCommand('copy'); document.getElementById('dfstatus').textContent = 'Inhalt wurde kopiert.'; }
    };
    loadDocumentText(doc);
  }

  function googleDocsExport(url) {
    const m = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i);
    return m ? `https://docs.google.com/document/d/${m[1]}/export?format=txt` : null;
  }

  async function loadDocumentText(doc) {
    const area = document.getElementById('dfcontent');
    const status = document.getElementById('dfstatus');
    if (!area) return;
    const exportUrl = googleDocsExport(doc.url);
    const target = exportUrl || doc.url;
    try {
      const response = await fetch(target, {mode:'cors'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const type = (response.headers.get('content-type') || '').toLowerCase();
      let text = '';
      if (type.includes('text/html')) {
        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        parsed.querySelectorAll('script,style,noscript').forEach(x => x.remove());
        text = (parsed.body?.innerText || parsed.documentElement.innerText || '').trim();
      } else {
        text = await response.text();
      }
      if (!text.trim()) throw new Error('Kein auslesbarer Text gefunden.');
      area.value = text;
      status.textContent = exportUrl ? 'Text aus Google Docs übernommen.' : 'Dokumentinhalt aus dem Link übernommen.';
    } catch (err) {
      area.value = 'Der Dokumentinhalt konnte nicht automatisch ausgelesen werden.\n\nDas Dokument ist trotzdem über den Link oben erreichbar.';
      status.textContent = 'Hinweis: Das Zieldokument erlaubt dem Browser möglicherweise keinen direkten Zugriff (z. B. Anmeldung oder CORS-Schutz). Bei Google Docs muss das Dokument für den verwendeten Zugriff freigegeben sein.';
    }
  }

  document.addEventListener('click', e => {
    const addBtn = e.target.closest?.('[data-action="newdocument"]');
    if (addBtn) { e.preventDefault(); e.stopImmediatePropagation(); openDocumentForm(); return; }

    const docRow = e.target.closest?.('.document-row');
    if (docRow && typeof db !== 'undefined') {
      const id = docRow.dataset.documentId;
      const doc = db.documents.find(d => d.id === id);
      if (doc) { e.preventDefault(); e.stopImmediatePropagation(); openDocumentViewer(doc); }
    }
  }, true);

  function linkifyDocumentRows() {
    if (typeof db === 'undefined') return;
    document.querySelectorAll('.panel').forEach(panel => {
      const head = panel.querySelector('.panelhead b');
      if (!head || head.textContent.trim() !== 'Dokumente') return;
      const docs = typeof caseId !== 'undefined' && caseId ? db.documents.filter(d => d.case_id === caseId) : db.documents;
      panel.querySelectorAll('.listrow').forEach((row, index) => {
        const doc = docs[index];
        if (!doc) return;
        row.classList.add('document-row');
        row.dataset.documentId = doc.id;
        row.style.cursor = 'pointer';
        if (doc.url) {
          const title = row.querySelector('b');
          if (title) title.innerHTML = `📄 ${esc(doc.name)}`;
          const small = row.querySelector('small');
          if (small) small.innerHTML = `<span class="kanzlei-link">Dokument öffnen</span>`;
        }
      });
    });
  }

  const observer = new MutationObserver(() => setTimeout(linkifyDocumentRows, 0));
  const start = () => { const app = document.getElementById('app'); if (app) observer.observe(app, {childList:true, subtree:true}); else setTimeout(start, 200); };
  start();
  setInterval(linkifyDocumentRows, 800);
})();