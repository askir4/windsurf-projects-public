# 🌱 Gewächshaus-Webapp

Eine moderne Webanwendung zur Verwaltung von Hochbeeten im Gewächshaus mit optionaler Sensor-Überwachung über Node-RED.

**Lernfeld 7 - Präzisionsdüngung mit Einzelsteuerung**

---

## 📋 Inhaltsverzeichnis

1. [Features](#-features)
2. [Schnellstart](#-schnellstart)
3. [Installation auf Raspberry Pi](#-installation-auf-raspberry-pi)
4. [Node-RED Integration](#-node-red-integration)
5. [API-Dokumentation](#-api-dokumentation)
6. [Bedienung](#-bedienung)
7. [Technologie-Stack](#-technologie-stack)
8. [Projektstruktur](#-projektstruktur)
9. [Lizenz](#-lizenz)

---

## 🚀 Features

### 🗺️ Interaktive Karte
- **Hochbeet-Editor**: Erstellen, bearbeiten und löschen von Hochbeeten
- **Drag & Drop**: Intuitive Positionierung auf der Karte
- **Zoom-Funktion**: Rein- und Rauszoomen mit Gras-Textur
- **3-Spalten-Layout**: Steuerung links, Karte mittig, Zusatzinfos rechts

### 🌱 Pflanzenmanagement
- **25+ Pflanzenarten**: Gemüse, Kräuter, Obst, Blumen
- **Icon-Picker**: Visuelle Auswahl mit Suchfunktion
- **Todo-Listen**: Aufgaben pro Hochbeet verwalten
- **Pflanzenliste**: Übersicht aller Pflanzen im Beet

### 🧪 Düngerkontrolle
- **NPK-Steuerung**: Stickstoff, Phosphor, Kalium in kg/ha
- **Mehrfachauswahl**: Mehrere Beete gleichzeitig düngen (Shift+Klick)
- **Statistik**: Gesamtübersicht aller Nährstoffe

### 📊 Sensor-Dashboard (optional)
- **Temperatur**: Live-Anzeige mit Trend und Graph
- **Luftfeuchtigkeit**: Echtzeit-Überwachung
- **Bodenfeuchtigkeit**: Feuchtigkeitsmessung
- **Wassertank**: Füllstand und Temperatur
> Hinweis: Sensorwerte kommen optional über Node-RED. Siehe `NodeRed.md`.

### 🔌 Backend & Datenhaltung
- **Node.js Server**: Minimaler HTTP-Server (keine npm-Abhängigkeiten)
- **JSON Datenbank**: Speicherung in `data.json`
- **Rate Limiting**: Schutz vor DoS-Angriffen

### 🌙 Dark Mode
- Automatische Speicherung der Einstellung
- Vollständig gestylte UI-Elemente

---

## ⚡ Schnellstart

### Voraussetzungen
- Node.js 14+ installiert
- Moderner Webbrowser

### Installation

```bash
# 1. Repository klonen oder Dateien kopieren
cd Gewachshaus

# 2. Dependencies installieren (optional, keine externen Abhängigkeiten)
npm install

# 3. Server starten
npm start

# 4. Browser öffnen
# http://localhost:3001
```

---

## 🍓 Installation auf Raspberry Pi

### Schritt 1: Raspberry Pi vorbereiten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js installieren (empfohlen: Node 18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Überprüfen
node --version  # Sollte v18.x.x zeigen
npm --version   # Sollte 9.x.x zeigen
```

### Schritt 2: Projekt übertragen

**Option A: Mit Git**
```bash
cd ~
git clone https://github.com/IHR_USERNAME/Gewachshaus.git
cd Gewachshaus
```

**Option B: Mit SCP (von Windows)**
```powershell
# Auf dem Windows-PC ausführen:
scp -r C:\Pfad\zum\Gewachshaus pi@RASPBERRY_IP:~/Gewachshaus
```

**Option C: Mit USB-Stick**
```bash
# USB-Stick mounten
sudo mount /dev/sda1 /mnt
cp -r /mnt/Gewachshaus ~/
sudo umount /mnt
```

### Schritt 3: Dependencies installieren

```bash
cd ~/Gewachshaus
npm install
```

### Schritt 4: Server testen

```bash
# Manuell starten
node server-simple.js
```

### Schritt 5: Als Systemdienst einrichten (Autostart)

```bash
# Service-Datei erstellen
sudo nano /etc/systemd/system/gewachshaus.service
```

Inhalt der Service-Datei:
```ini
[Unit]
Description=Gewächshaus Webapp
After=network.target

[Service]
ExecStart=/usr/bin/node /home/pi/Gewachshaus/server-simple.js
WorkingDirectory=/home/pi/Gewachshaus
StandardOutput=inherit
StandardError=inherit
Restart=always
User=pi
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

```bash
# Service aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable gewachshaus
sudo systemctl start gewachshaus

# Status prüfen
sudo systemctl status gewachshaus

# Logs ansehen
journalctl -u gewachshaus -f
```

### Schritt 6: Im Netzwerk erreichbar machen

```bash
# IP-Adresse des Raspberry Pi herausfinden
hostname -I

# Beispiel: 192.168.1.100
# Webapp erreichbar unter: http://192.168.1.100:3001
```

### Optional: Nginx als Reverse Proxy

```bash
# Nginx installieren
sudo apt install nginx -y

# Konfiguration erstellen
sudo nano /etc/nginx/sites-available/gewachshaus
```

```nginx
server {
    listen 80;
    server_name gewachshaus.local;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktivieren
sudo ln -s /etc/nginx/sites-available/gewachshaus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📡 Node-RED Integration

Die Webapp kann Sensordaten über Node-RED empfangen. Die komplette Anleitung ist in `NodeRed.md`.

---

## 📚 API-Dokumentation

### Basis-URL
```
http://localhost:3001/api
```

### Endpoints

#### GET /api/data
Alle gespeicherten Daten abrufen.

**Response:**
```json
{
  "zones": [...],
  "slots": [...],
  "plants": [...],
  "timestamp": "2026-01-16T12:00:00Z"
}
```

#### POST /api/data
Daten speichern (Hochbeete, Pflanzen).

#### GET /api/logs
Server-Logs abrufen.

**Query Parameter:**
- `level`: DEBUG, INFO, WARN, ERROR
- `limit`: Anzahl (max 1000)

#### POST /api/logs
Log-Eintrag erstellen.

---

## 📖 Bedienung

### Ansichtsmodus (View)
- Hochbeete auf der Karte ansehen
- Klick auf Beet: Details anzeigen
- Shift+Klick: Mehrere Beete auswählen

### Editor-Modus (Edit)
- Hochbeete erstellen/löschen
- Größe und Position anpassen
- Pflanzen hinzufügen

### Düngung
1. Hochbeet(e) auswählen
2. NPK-Werte eingeben
3. "Dünger anwenden" klicken

### Todos
1. Hochbeet auswählen
2. Tab "Todos" öffnen
3. Aufgabe mit Priorität hinzufügen

---

## 🛠️ Technologie-Stack

### Backend
- **Node.js** - JavaScript Runtime
- **HTTP Server** - Minimal ohne externe Dependencies
- **JSON** - Datenspeicherung in `data.json`

### Frontend
- **HTML5** - Struktur
- **CSS3** - Styling (Grid, Flexbox, Dark Mode)
- **JavaScript ES6+** - Logik
- **SVG** - Interaktive Karte
- **Font Awesome** - Icons

### Security
- Rate Limiting (100 Req/Min)
- Input Validation
- Security Headers
- Prepared Statements (SQL)

---

## 📁 Projektstruktur

```
Gewachshaus/
├── server-simple.js    # Node.js Backend (Standard)
├── index.html          # Hauptseite
├── styles.css          # Styling
├── script.js           # Frontend-Logik
├── package.json        # Start-Skripte
├── data.json           # JSON Datenbank
├── NodeRed.md          # Node-RED Anleitung
└── README.md           # Diese Dokumentation
```

---

## 📄 Lizenz

MIT License - Dieses Projekt wurde für Lernfeld 7 entwickelt.

---

## 👥 Mitwirkende

- **Entwicklung**: Lernfeld 7 Projektteam
- **Audit**: Senior Engineer Review

---

*Stand: Januar 2026*
