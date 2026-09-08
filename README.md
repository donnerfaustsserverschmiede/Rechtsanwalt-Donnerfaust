# Rechtsanwalt Donnerfaust – GitHub Pages Edition

## Ziel
Persönliches Kanzleisystem für RP, das **ausschließlich als statische GitHub-Pages-Webseite** läuft.

Kein Node.js, kein PHP, keine externe Datenbank.

## Enthalten
- Dashboard
- Mandantenverwaltung
- automatische Mandantensuche/Vorschläge
- vollständige digitale Akten
- Aktenzeichen
- Vorfall / Gegenstand
- Hintergrund / Sachverhalt
- Gegnerseite
- zuständiges Gericht
- Fristen
- Aktenstatus
- Rechnungen
- neue Rechnungen automatisch `Offen`
- Rechnungsstatus per Klick: Offen → Bezahlt → Überfällig → Offen
- Termine
- Aufgaben
- Dokumentenverzeichnis
- Notizen
- interne Nachrichten
- Ankündigungen
- Mitarbeiter
- zentrale Suche
- Benachrichtigungen
- Aktivitätsprotokoll
- Datenexport und Wiederherstellung
- mobile Oberfläche

## Speicherung
Die Datenbank wird lokal im Browser über `localStorage` gespeichert. Das ist bewusst so gewählt, weil GitHub Pages keinen serverseitigen Code ausführen kann.

**Wichtig:** Wenn Browserdaten gelöscht werden oder ein anderes Gerät benutzt wird, sind die Daten dort nicht automatisch vorhanden. Deshalb regelmäßig über `Verwaltung → Daten sichern` ein Backup erstellen.

## GitHub Pages
Den Inhalt dieses Projekts hochladen bzw. in das Repository übernehmen und GitHub Pages auf den Branch/Ordner mit `public` als Webseite konfigurieren.

Falls das Repository direkt als Pages-Root verwendet wird, den Inhalt von `public/` in den Pages-Root legen.

## RP-Hinweis
Nur für Roleplay gedacht. Keine echten vertraulichen Mandanten- oder Gesundheitsdaten verwenden.
