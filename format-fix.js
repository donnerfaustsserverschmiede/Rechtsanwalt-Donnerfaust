/* Kanzlei Textformatierung: Absätze + anklickbare URLs */
(() => {
  const URL_RE = /https?:\/\/[^\s<>"']+/gi;
  const TRAILING = /[),.;!?]+$/;

  function installStyle() {
    if (document.getElementById('donnerfaust-format-style')) return;
    const style = document.createElement('style');
    style.id = 'donnerfaust-format-style';
    style.textContent = `
      #app .content p,
      #app .content .field,
      #app .content .listrow,
      #app .content .message,
      #app .content .notification,
      #app .content .activityline,
      #app .content .client,
      #app .content .task,
      #app .content .timeline,
      #app .content .result {
        white-space: pre-wrap !important;
        overflow-wrap: anywhere;
        word-break: normal;
      }
      #app .content a.kanzlei-link {
        color: #2457a6 !important;
        text-decoration: underline !important;
        cursor: pointer;
        overflow-wrap: anywhere;
      }
    `;
    document.head.appendChild(style);
  }

  function linkify(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue || !URL_RE.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        URL_RE.lastIndex = 0;
        if (parent.closest('a,script,style,textarea,input,select,option')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(textNode => {
      const text = textNode.nodeValue;
      URL_RE.lastIndex = 0;
      let match, last = 0;
      const fragment = document.createDocumentFragment();
      while ((match = URL_RE.exec(text))) {
        const raw = match[0];
        const url = raw.replace(TRAILING, '');
        fragment.appendChild(document.createTextNode(text.slice(last, match.index)));
        const a = document.createElement('a');
        a.className = 'kanzlei-link';
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = url;
        fragment.appendChild(a);
        if (url.length < raw.length) fragment.appendChild(document.createTextNode(raw.slice(url.length)));
        last = match.index + raw.length;
      }
      fragment.appendChild(document.createTextNode(text.slice(last)));
      textNode.parentNode.replaceChild(fragment, textNode);
    });
  }

  function run() {
    installStyle();
    linkify(document.getElementById('app'));
  }

  // Run repeatedly because the SPA replaces its content on every navigation/save.
  document.addEventListener('DOMContentLoaded', run);
  setTimeout(run, 100);
  setTimeout(run, 500);
  setTimeout(run, 1500);
  setInterval(run, 1000);
  const startObserver = () => {
    const app = document.getElementById('app');
    if (app) new MutationObserver(() => setTimeout(run, 0)).observe(app, { childList: true, subtree: true });
    else setTimeout(startObserver, 250);
  };
  startObserver();
})();
