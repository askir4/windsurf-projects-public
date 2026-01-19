# Implementation Notes (Current)

## Architektur
- Server: `server-simple.js` (HTTP, keine Express Abhaengigkeiten)
- Datenhaltung: `data.json` (atomisches Schreiben, Backups bei Fehlern)
- Sessions: In-Memory Map (Cookie `session`)

## Rollen
- ADMIN: Admin Panel, E-Mail Konfiguration, Templates, Logs
- NORMAL_USER/Gast: Forum, Pflanzen, Sensoren (je nach UI Modus)

## Forum
- Tags, Suche (User + Inhalt)
- Highlighting der Treffer
- Kommentare pro Beitrag einklappbar

## Sensoren und Alarme
- Schwellwerte (Temperatur Min/Max, Luftfeuchte Min/Max, Bodenfeuchte Min/Max)
- Wassertank Warnung
- Alarm E-Mail wird nur bei Zustandswechsel (OK -> Alarm) gesendet

## SMTP / E-Mail
- SMTP Settings im Admin Panel
- Templates mit Platzhaltern: {sensor_name}, {sensor_value}, {timestamp}, {threshold}, {alarm_type}, {details}
- Logs fuer Test- und Alarm-Mails

## Sicherheit
- Rate Limiting (In-Memory)
- Security Headers
- CORS Restrictions

