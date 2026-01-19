<div align="center">

# 🌱 Gewächshaus Webapp

**Intelligente Gewächshausverwaltung mit Präzisionsdüngung**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)]()

*Lernfeld 7 - Präzisionsdüngung mit Einzelsteuerung*

<img src="https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/leaflet.svg" width="120" alt="Logo">

</div>

---

## 📋 Inhaltsverzeichnis

- [✨ Features](#-features)
- [🚀 Schnellstart](#-schnellstart)
- [🏗️ Architektur](#️-architektur)
- [⚙️ Konfiguration](#️-konfiguration)
- [📖 Dokumentation](#-dokumentation)
- [📜 Lizenz](#-lizenz)

---

## ✨ Features

### 🌿 Hochbeete & Pflanzenmanagement

| Feature | Beschreibung |
|---------|-------------|
| **Interaktive Karte** | Drag & Drop Editor mit Zoom und Pan |
| **Pflanzen-Picker** | Icon-Auswahl mit Suchfunktion |
| **Todo-System** | Aufgaben pro Pflanze verwalten |
| **Mehrfachauswahl** | `Shift + Klick` für Gruppendüngung |
| **Responsive Design** | Optimiert für Desktop und Mobile |

### 💬 Community Forum

| Feature | Beschreibung |
|---------|-------------|
| **Tags & Filter** | Beiträge kategorisieren und filtern |
| **Volltextsuche** | Suche nach Nutzer oder Inhalt |
| **Highlighting** | Treffer werden hervorgehoben |
| **Kommentare** | Ein-/ausklappbare Diskussionen |

### 📊 Sensoren & Monitoring

| Sensor | Beschreibung |
|--------|-------------|
| 🌡️ **Temperatur** | Echtzeit-Messung mit Trendanzeige |
| 💧 **Luftfeuchtigkeit** | Prozentuale Anzeige |
| 🌱 **Bodenfeuchtigkeit** | Feuchtigkeitsgrad pro Zone |
| 🚰 **Wassertank** | Füllstand und Temperatur |

### 📈 Graphen & Trends

- **Zeiträume:** 1h, 6h, 24h, 7d, 30d
- **Live-Updates** über WebSocket
- **Trendpfeile** für schnelle Übersicht

### 🚨 Alarm-System & E-Mail

| Feature | Beschreibung |
|---------|-------------|
| **Schwellwerte** | Min/Max pro Sensor konfigurierbar |
| **SMTP-Integration** | Eigener Mailserver oder Provider |
| **Templates** | Anpassbare E-Mail-Vorlagen |
| **Platzhalter** | `{sensor_name}`, `{value}`, `{timestamp}` |
| **Versandprotokoll** | Alle E-Mails nachvollziehbar |

---

## 🚀 Schnellstart

### Voraussetzungen

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (wird mit Node.js installiert)

### Installation

```bash
# Repository klonen
git clone https://github.com/yourname/gewachshaus.git
cd gewachshaus

# Abhängigkeiten installieren
npm install

# Server starten
npm start
```

### 🌐 Zugriff

| URL | Beschreibung |
|-----|-------------|
| `http://localhost:3001` | Weboberfläche |
| `http://localhost:3001/api/health` | Health-Check |

### 🔑 Standard-Login

| Feld | Wert |
|------|------|
| **Benutzer** | `admin` |
| **Passwort** | `admin123` |

> ⚠️ **Wichtig:** Passwort nach dem ersten Login ändern!

### Weitere Startoptionen

```bash
npm run dev           # Entwicklungsmodus
npm run start:daemon  # Als Hintergrundprozess
npm run start:status  # Status prüfen
npm run start:logs    # Logs anzeigen
```

---

## 🏗️ Architektur

```
gewachshaus/
├── 📄 server-simple.js   # HTTP-Server (Node.js)
├── 📄 index.html         # Haupt-UI
├── 📄 styles.css         # Styling
├── 📄 script.js          # Frontend-Logik
├── 📄 auth.js            # Authentifizierung
├── 📄 color-manager.js   # Farbschema-Verwaltung
├── 📄 log-utils.js       # Logging-Utilities
├── 📄 data.json          # Persistente Daten
└── 📁 assets/            # Icons und Bilder
```

### Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| **Backend** | Node.js (HTTP-Server, kein Framework) |
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **Datenbank** | JSON-Datei (atomisches Schreiben) |
| **E-Mail** | Nodemailer (SMTP) |
| **Sensoren** | Node-RED über WebSocket |

---

## ⚙️ Konfiguration

### Umgebungsvariablen

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `PORT` | `3001` | Server-Port |
| `ADMIN_USER` | `admin` | Administrator-Benutzername |
| `ADMIN_PASS` | `admin123` | Administrator-Passwort |
| `SESSION_SECRET` | - | Geheimer Schlüssel für Sessions |
| `ALLOWED_ORIGINS` | - | Erlaubte CORS-Origins (kommagetrennt) |

### Beispiel: `.env` Datei

```env
PORT=3001
ADMIN_USER=admin
ADMIN_PASS=sicheres_passwort_123
SESSION_SECRET=mein_geheimer_schluessel_xyz
```

### Admin Panel Funktionen

| Bereich | Funktionen |
|---------|-----------|
| 👥 **Benutzer** | Erstellen, Bearbeiten, Löschen, Passwort zurücksetzen |
| 📋 **Audit-Logs** | Alle Benutzeraktionen nachvollziehen |
| 🔗 **Node-RED** | WebSocket-Verbindung konfigurieren |
| 🚨 **Alarme** | Schwellwerte für Sensoren setzen |
| 📧 **E-Mail** | SMTP, Templates, Empfänger verwalten |
| 🎨 **Design** | Farbschema anpassen (live Preview) |

---

## 📖 Dokumentation

| Dokument | Beschreibung |
|----------|-------------|
| 📘 [SERVER.md](SERVER.md) | Server-Setup, API-Endpunkte, E-Mail-Konfiguration |
| 🍓 [RASPI-SETUP.md](RASPI-SETUP.md) | Raspberry Pi Installation & Autostart |
| 🔴 [NodeRed.md](NodeRed.md) | Node-RED Integration, Topics & Payloads |
| 📝 [NOTES.md](NOTES.md) | Technische Implementierungsdetails |
| 🔒 [AUDIT_REPORT.md](AUDIT_REPORT.md) | Sicherheitsaudit & Empfehlungen |

---

## 🤝 Mitwirken

Beiträge sind willkommen! Bitte erstelle einen Fork und reiche einen Pull Request ein.

1. Fork erstellen
2. Feature-Branch anlegen (`git checkout -b feature/neues-feature`)
3. Änderungen committen (`git commit -m 'Neues Feature hinzugefügt'`)
4. Branch pushen (`git push origin feature/neues-feature`)
5. Pull Request erstellen

---

## 📜 Lizenz

Dieses Projekt steht unter der **MIT-Lizenz**.

```
MIT License

Copyright (c) 2026 Gewächshaus Projekt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<div align="center">

**Made with 💚 for smart gardening**

</div>
