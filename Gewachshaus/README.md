# Gewachshaus Webapp

Eine Webanwendung zur Verwaltung von Hochbeeten im Gewachshaus mit optionaler Sensor-Integration und E-Mail Alarmen.

Lernfeld 7 - Praezisionsduengung mit Einzelsteuerung

---

## Features

- Interaktive Karte fuer Hochbeete (Editor, Drag & Drop, Zoom)
- Pflanzenmanagement mit Icon-Picker und Todo-Listen
- Duengerkontrolle (NPK) mit Mehrfachauswahl
- Forum mit Tags, Suche, Highlighting und einklappbaren Kommentaren
- Sensor-Dashboard mit Trends, Graphen und Alarmwerten
- Wassertank Anzeige mit Warnung
- SMTP E-Mail Integration (Testmail, Templates, Alarmlogs)
- Admin Panel fuer Benutzer, Node-RED, System, Farbschema

---

## Schnellstart

Voraussetzungen:
- Node.js 14+
- npm

```bash
npm install
npm start
```

Server URL: http://localhost:3001

Alternative Startoptionen:
```bash
npm run dev
npm run start:daemon
npm run start:status
npm run start:logs
```

---

## Konfiguration (Server)

Umgebungsvariablen:
- PORT (Standard: 3001)
- ADMIN_USER (Standard: admin)
- ADMIN_PASS (Standard: admin123)
- SESSION_SECRET (empfohlen)

SMTP Konfiguration und E-Mail Templates erfolgen im Admin Panel.

---

## Dokumentation

- Server API und Endpunkte: SERVER.md
- Raspberry Pi Setup: RASPI-SETUP.md
- Node-RED Integration: NodeRed.md

---

## Lizenz

MIT
