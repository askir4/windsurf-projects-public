# Codebase Review - Gewaechshaus (Current)

## Kurzfazit
Die Anwendung ist eine monolithische Vanilla-Webapp mit einem minimalen Node Server (`server-simple.js`) und JSON Speicher (`data.json`). Zentrale Features sind Hochbeet-Verwaltung, Forum, Sensor-Dashboard, Admin Panel und SMTP E-Mail Alarme. Die Architektur ist bewusst simpel, aber dadurch gut fuer Raspberry Pi und Demo-Szenarien geeignet.

## Staerken
- Klarer Feature-Scope (Hochbeete, Forum, Sensoren, Admin)
- Geringe Server-Komplexitaet
- Alarmierung inkl. Templates und SMTP Test
- UI mit konsistenter Struktur

## Risiken / Schwachstellen
- Sessions nur In-Memory (keine Persistenz)
- Default Admin Credentials muessen in Produktion geaendert werden
- Statisches Serving aus Projektroot (sensitiven Dateien beachten)
- Rate Limiting nur In-Memory

## Hinweise
- SMTP Zugangsdaten liegen in `data.json` und sollten geschuetzt werden
- E-Mail Versand erfolgt bei Alarm-Zustandswechsel

