/* Dokumentverwaltung: Name + Link, automatisch der geöffneten Akte zuordnen. */
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
        <label>Dokumentname
          <input name="name" required placeholder="z. B. Mandatsvertrag">
        </label>
        <label>Dokument-Link
          <input name="url" type="url" required placeholder="https://..." autocomplete="url">
        </label>
        ${selectedCase ? `<label>Akte
          <input value="${esc(selectedCase.file_number + ' · ' + selectedCase.title)}" disabled>
          <input type="hidden" name="case_id" value="${esc(selectedCase.id)}">
        </label>` : `<label>Akte
          <select name="case_id" required><option value="">Bitte Akte auswählen</option>${caseOptions}</select>
        </label>`}
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
      v.id = uid();
      v.type = 'Link';
      db.documents.push(v);
      log(`Dokument hinzugefügt: ${v.name}`);
      close();
      save();
      render();
    };
  }

  // Capture the existing + Dokument buttons before the old generic dialog handles them.
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('[data-action="newdocument"]');
    if (!btn) return;
    e.preventDefault(); e.stopImmediatePropagation();
    openDocumentForm();
  }, true);

  function linkifyDocumentRows() {
    if (typeof db === 'undefined') return;
    document.querySelectorAll('.panel').forEach(panel => {
      const head = panel.querySelector('.panelhead b');
      if (!head || head.textContent.trim() !== 'Dokumente') return;
      const docs = caseId ? db.documents.filter(d => d.case_id === caseId) : db.documents;
      panel.querySelectorAll('.listrow').forEach((row, index) => {
        const doc = docs[index];
        if (!doc || !doc.url) return;
        const title = row.querySelector('b');
        if (title && !title.querySelector('a')) title.innerHTML = `📄 <a class="kanzlei-link" href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">${esc(doc.name)}</a>`;
        const small = row.querySelector('small');
        if (small && !small.querySelector('a')) small.innerHTML = `<a class="kanzlei-link" href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">Dokument öffnen</a>`;
      });
    });
  }

  const observer = new MutationObserver(() => setTimeout(linkifyDocumentRows, 0));
  const start = () => { const app = document.getElementById('app'); if (app) observer.observe(app, {childList:true, subtree:true}); else setTimeout(start, 200); };
  start();
  setInterval(linkifyDocumentRows, 800);
})();
