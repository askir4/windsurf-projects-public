<div align="center">

# 🍓 Raspberry Pi Setup

**Vollständige Installationsanleitung für Raspberry Pi**

[![Raspberry Pi](https://img.shields.io/badge/Raspberry_Pi-4B+-C51A4A?style=for-the-badge&logo=raspberry-pi&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)]()

</div>

---

## 📋 Inhaltsverzeichnis

- [📦 Voraussetzungen](#-voraussetzungen)
- [🔧 Installation](#-installation)
- [🚀 Start](#-start)
- [⚡ Autostart einrichten](#-autostart-einrichten)
- [⚙️ Konfiguration](#️-konfiguration)
- [🔍 Troubleshooting](#-troubleshooting)
- [📊 Systemüberwachung](#-systemüberwachung)

---

## 📦 Voraussetzungen

### Hardware

| Komponente | Empfehlung |
|------------|------------|
| **Raspberry Pi** | Model 4B, 3B+ oder Zero 2 W |
| **RAM** | Mindestens 1 GB |
| **SD-Karte** | 16 GB+ (Class 10) |
| **Netzteil** | 5V/3A (USB-C für Pi 4) |
| **Netzwerk** | Ethernet oder WLAN |

### Software

| Software | Version |
|----------|---------|
| **Raspberry Pi OS** | Lite oder Desktop (64-bit empfohlen) |
| **Node.js** | 18 LTS oder höher |

---

## 🔧 Installation

### Schritt 1: System aktualisieren

```bash
sudo apt update && sudo apt upgrade -y
```

### Schritt 2: Node.js installieren

```bash
# Node.js 18 LTS Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js installieren
sudo apt install -y nodejs

# Version prüfen
node --version  # Sollte v18.x.x zeigen
npm --version   # Sollte 9.x.x zeigen
```

### Schritt 3: Projekt klonen/kopieren

```bash
# Projekt-Verzeichnis erstellen
mkdir -p ~/gewachshaus
cd ~/gewachshaus

# Option A: Git Clone
git clone https://github.com/yourname/gewachshaus.git .

# Option B: SCP vom eigenen Rechner
# scp -r /pfad/zum/projekt pi@raspberry-pi-ip:~/gewachshaus
```

### Schritt 4: Abhängigkeiten installieren

```bash
cd ~/gewachshaus
npm install
```

> ⏱️ **Hinweis:** Die Installation kann auf einem Pi Zero mehrere Minuten dauern.

---

## 🚀 Start

### Manueller Start

```bash
cd ~/gewachshaus
node server-simple.js
```

### Mit Startskript

```bash
# Skript ausführbar machen
chmod +x start.sh

# Server starten
./start.sh start

# Status prüfen
./start.sh status

# Logs anzeigen
./start.sh logs

# Server stoppen
./start.sh stop
```

### Zugriff

| Beschreibung | URL |
|--------------|-----|
| **Lokal** | `http://localhost:3001` |
| **Im Netzwerk** | `http://raspberry-pi-ip:3001` |

> 💡 **Tipp:** IP-Adresse herausfinden: `hostname -I`

### Standard-Login

| Feld | Wert |
|------|------|
| **Benutzer** | `admin` |
| **Passwort** | `admin123` |

> ⚠️ **Wichtig:** Passwort nach dem ersten Login ändern!

---

## ⚡ Autostart einrichten

### Option A: systemd Service (Empfohlen)

#### 1. Service-Datei erstellen

```bash
sudo nano /etc/systemd/system/gewachshaus.service
```

#### 2. Inhalt einfügen

```ini
[Unit]
Description=Gewächshaus Webapp
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/gewachshaus
ExecStart=/usr/bin/node server-simple.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gewachshaus

# Umgebungsvariablen
Environment=PORT=3001
Environment=NODE_ENV=production
# Environment=SESSION_SECRET=dein_geheimer_schluessel

[Install]
WantedBy=multi-user.target
```

#### 3. Service aktivieren

```bash
# Konfiguration neu laden
sudo systemctl daemon-reload

# Autostart aktivieren
sudo systemctl enable gewachshaus

# Service starten
sudo systemctl start gewachshaus

# Status prüfen
sudo systemctl status gewachshaus
```

### Service-Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `sudo systemctl start gewachshaus` | Starten |
| `sudo systemctl stop gewachshaus` | Stoppen |
| `sudo systemctl restart gewachshaus` | Neustarten |
| `sudo systemctl status gewachshaus` | Status anzeigen |
| `journalctl -u gewachshaus -f` | Logs live anzeigen |

### Option B: PM2 Process Manager

```bash
# PM2 global installieren
sudo npm install -g pm2

# Server mit PM2 starten
pm2 start server-simple.js --name gewachshaus

# Autostart einrichten
pm2 startup
pm2 save

# Status
pm2 status
pm2 logs gewachshaus
```

---

## ⚙️ Konfiguration

### Umgebungsvariablen

Entweder in der systemd Service-Datei oder als `.env` Datei:

```bash
nano ~/gewachshaus/.env
```

```env
# Server
PORT=3001

# Admin-Account
ADMIN_USER=admin
ADMIN_PASS=sicheres_passwort

# Sicherheit
SESSION_SECRET=ein_langer_zufaelliger_string

# Optional: CORS
ALLOWED_ORIGINS=http://192.168.1.100:3001
```

### SMTP-Konfiguration

Die E-Mail-Einstellungen werden im **Admin Panel** unter **E-Mail → SMTP-Einstellungen** konfiguriert:

1. Browser öffnen: `http://raspberry-pi-ip:3001`
2. Als Admin anmelden
3. Modus → Admin
4. E-Mail → SMTP-Einstellungen

---

## 🔍 Troubleshooting

### Häufige Probleme

#### Node.js Version zu alt

```bash
node --version
# Falls < v18:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Server startet nicht

```bash
# Logs prüfen
./start.sh logs
# oder
journalctl -u gewachshaus -n 50

# Port bereits belegt?
sudo lsof -i :3001
```

#### Keine Verbindung aus dem Netzwerk

```bash
# Firewall prüfen
sudo ufw status

# Port freigeben
sudo ufw allow 3001

# IP-Adresse prüfen
hostname -I
```

#### Berechtigungsprobleme

```bash
# Dateiberechtigungen reparieren
sudo chown -R pi:pi ~/gewachshaus
chmod 755 ~/gewachshaus
chmod 644 ~/gewachshaus/data.json
```

### Diagnose-Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `node --version` | Node.js Version |
| `npm --version` | npm Version |
| `hostname -I` | IP-Adresse |
| `free -h` | RAM-Nutzung |
| `df -h` | Speicherplatz |
| `top` | CPU-Nutzung |
| `journalctl -u gewachshaus -f` | Live-Logs |

---

## 📊 Systemüberwachung

### RAM-Nutzung optimieren

Für Raspberry Pi mit wenig RAM (1 GB):

```bash
# Swap vergrößern
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=512 setzen
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Automatisches Backup

```bash
# Backup-Skript erstellen
nano ~/backup-gewachshaus.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
cp ~/gewachshaus/data.json $BACKUP_DIR/data_$DATE.json
# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "data_*.json" -mtime +30 -delete
```

```bash
# Ausführbar machen
chmod +x ~/backup-gewachshaus.sh

# Cron-Job einrichten (täglich um 3 Uhr)
crontab -e
# Folgende Zeile hinzufügen:
0 3 * * * /home/pi/backup-gewachshaus.sh
```

---

## 🔐 Sicherheitsempfehlungen

| Empfehlung | Befehl / Anleitung |
|------------|-------------------|
| **SSH-Key statt Passwort** | `ssh-copy-id pi@raspberry-pi-ip` |
| **Standard-Passwort ändern** | `passwd` |
| **Firewall aktivieren** | `sudo ufw enable && sudo ufw allow 22 && sudo ufw allow 3001` |
| **Automatische Updates** | `sudo apt install unattended-upgrades` |
| **HTTPS (optional)** | Nginx + Let's Encrypt als Reverse Proxy |

---

<div align="center">

**[← Zurück zur README](README.md)** · **[Server-Dokumentation →](SERVER.md)**

</div>
