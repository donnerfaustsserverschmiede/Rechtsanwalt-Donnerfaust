# Rechtsanwalt Donnerfaust – vollständiges RP-Kanzleisystem

Dieses Projekt enthält Frontend **und** Backend in einem Projekt.

## Enthalten
- Node.js + Express Backend
- SQLite-Datenbank
- Mandantenverwaltung mit Such-/Vorschlagsfunktion
- vollständige Akten
- Aktenzeichen
- Vorfall, Hintergrund, Gegnerseite, Gericht, Fristen
- Rechnungen mit automatischem Status `Offen`
- anklickbarer Rechnungsstatus: Offen → Bezahlt → Überfällig → Offen
- Termine
- Aufgaben
- Dokumenteinträge
- Notizen
- interne Nachrichten
- Ankündigungen
- Mitarbeiter
- zentrale Suche
- Aktivitätsprotokoll
- JSON-Datenexport
- mobile Oberfläche

## Start
1. Node.js installieren
2. Im Projektordner `npm install`
3. `npm start`
4. Browser auf `http://localhost:3000`

Beim ersten Start wird `data/kanzlei.db` automatisch erzeugt.

## Deployment
Das Projekt braucht einen Node.js-Host, nicht GitHub Pages allein. GitHub kann den Quellcode verwalten; der Server muss die Anwendung ausführen.

Für das RP-System ist bewusst keine komplizierte Multi-Tenant-Architektur enthalten. Ein einzelner Kanzleiinhaber ist der Standardfall. Mitarbeiter können später ergänzt werden.

## Hinweis
Nur für Roleplay. Keine echten Mandanten-, Gesundheits-, Finanz- oder sonstigen vertraulichen Daten verwenden, solange keine angemessene Authentifizierung, Verschlüsselung, Backups und Zugriffskontrolle eingerichtet sind.
