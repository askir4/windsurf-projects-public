# Code Audit Report - Gewaechshaus (Current)

Datum: 2026-01-19

## Zusammenfassung
Das System basiert auf `server-simple.js` mit JSON Persistenz. Es beinhaltet Rate Limiting, Security Headers, Input Limits, Alarmwerte im UI und SMTP E-Mail Versand. Die Admin Oberflaeche verwaltet SMTP, Templates, Empfaenger und Logs.

## Wichtige Punkte
- Rate Limiting (In-Memory)
- Security Headers fuer alle Responses
- Body-Limit 1MB
- Atomisches Speichern von `data.json`
- SMTP Versand per nodemailer

## Offene Risiken
- Sessions sind nicht persistent
- Default Admin Credentials koennen aktiv sein
- SMTP Credentials liegen in `data.json`
- Keine CSP Header

## Empfehlungen
- HTTPS aktivieren
- SESSION_SECRET setzen
- SMTP Passwoerter in Datei mit restriktiven Rechten speichern
- Optional: separate Storage fuer Logs und Konfig

