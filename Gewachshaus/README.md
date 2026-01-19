# Gewachshaus Webapp

Eine moderne Webanwendung zur Verwaltung von Hochbeeten im Gewachshaus mit Sensor-Integration, Forum und E-Mail Alarmen.

Lernfeld 7 - Praezisionsduengung mit Einzelsteuerung

---

## Inhalt

- Features
- Schnellstart
- Struktur und Technik
- Konfiguration
- Dokumentation
- Lizenz

---

## Features

### Hochbeete und Pflanzen
- Interaktive Karte mit Editor, Drag & Drop und Zoom
- Pflanzenmanagement mit Icon-Picker, Suche und Todos
- Mehrfachauswahl fuer Duengung (Shift + Klick)

### Forum
- Tags je Beitrag, Filter nach Tag
- Suche nach Nutzername oder Inhalt
- Treffer-Highlighting und Auto-Fokus
- Kommentare pro Beitrag ein- und ausklappbar

### Sensoren und Alarme
- Temperatur, Luftfeuchte, Bodenfeuchte
- Graphen und Trends
- Alarmwerte (Min/Max) pro Sensor
- Wassertank Anzeige inkl. Alarm

### E-Mail Alarme (SMTP)
- SMTP Konfiguration im Admin Panel
- Testmail Versand
- Mehrere Vorlagen mit Platzhaltern
- Alarmversand bei Zustandwechsel (OK -> Alarm)
- Versandprotokoll im Admin Panel

---

## Schnellstart

Voraussetzungen: Node.js 14+ und npm

```bash
npm install
npm start
```

Default URL: http://localhost:3001

Weitere Startoptionen:
```bash
npm run dev
npm run start:daemon
npm run start:status
npm run start:logs
```

---

## Struktur und Technik

- Server: `server-simple.js` (minimaler HTTP Server)
- Datenhaltung: `data.json` (atomisch gespeichert)
- Frontend: Vanilla JS, HTML, CSS
- SMTP Versand: nodemailer

---

## Konfiguration

### Umgebungsvariablen
- PORT (Default 3001)
- ADMIN_USER (Default admin)
- ADMIN_PASS (Default admin123)
- SESSION_SECRET (empfohlen)

### Admin Panel
- Benutzerverwaltung und Audit Logs
- Node-RED Verbindung
- System-Einstellungen (Sensor Alarme, SMTP, Templates)
- Farbschema

---

## Dokumentation

- SERVER.md: Server Setup, API und E-Mail Endpunkte
- RASPI-SETUP.md: Raspberry Pi Installation
- NodeRed.md: Node-RED Topics und Payloads
- NOTES.md: Implementierungsdetails

---

## Lizenz

MIT
