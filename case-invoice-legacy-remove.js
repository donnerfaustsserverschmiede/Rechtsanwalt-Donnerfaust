/* Entfernt die alte Rechnungsbox aus der Aktenansicht.
   Rechnungen werden ausschließlich über das zentrale Finanzsystem
   und die damit verbundene Rechnungsbox der Akte verwaltet. */
(() => {
  function removeLegacyInvoicePanel() {
    const content = document.querySelector(".content");
    if (!content) return;

    [...content.querySelectorAll(".panel")].forEach(panel => {
      const legacyButton = panel.querySelector('button[data-action="newinvoice"]');
      if (!legacyButton) return;

      // Nur die alte Rechnungsbox der Akte entfernen.
      const heading = [...panel.querySelectorAll(".panelhead b")]
        .some(el => /^Rechnungen$/i.test(el.textContent.trim()));
      if (heading) panel.remove();
    });
  }

  const observer = new MutationObserver(() => removeLegacyInvoicePanel());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(removeLegacyInvoicePanel, 0);
  setTimeout(removeLegacyInvoicePanel, 250);
  setTimeout(removeLegacyInvoicePanel, 750);
})();
