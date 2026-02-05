<div align="center">

# Raspberry Pi Setup

**Complete Installation Guide for Raspberry Pi**

[![Raspberry Pi](https://img.shields.io/badge/Raspberry_Pi-4B+-C51A4A?style=for-the-badge&logo=raspberry-pi&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)]()

</div>

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Start](#start)
- [Setup Autostart](#setup-autostart)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [System Monitoring](#system-monitoring)

---

## Prerequisites

### Hardware

| Component | Recommendation |
|------------|------------|
| **Raspberry Pi** | Model 4B, 3B+ or Zero 2 W |
| **RAM** | Minimum 1 GB |
| **SD Card** | 16 GB+ (Class 10) |
| **Power Supply** | 5V/3A (USB-C for Pi 4) |
| **Network** | Ethernet or WiFi |

### Software

| Software | Version |
|----------|---------|
| **Raspberry Pi OS** | Lite or Desktop (64-bit recommended) |
| **Node.js** | 18 LTS or higher |

---

## Installation

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js

```bash
# Add Node.js 20 LTS repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Alternative: Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Check version
node --version  # Should show v18.x.x or v20.x.x
npm --version   # Should show 9.x.x or 10.x.x
```

> Note: For Raspberry Pi Zero or older models, Node.js 18 is recommended.

### Step 3: Clone/Copy Project

```bash
# Create project directory
mkdir -p ~/gewachshaus
cd ~/gewachshaus

# Option A: Git Clone
git clone https://github.com/yourname/gewachshaus.git .

# Option B: SCP from your own machine
# scp -r /path/to/project pi@raspberry-pi-ip:~/gewachshaus

# Option C: Extract ZIP file
# wget https://github.com/yourname/gewachshaus/archive/main.zip
# unzip main.zip
# mv gewachshaus-main/* .
# rm -rf gewachshaus-main main.zip
```

### Step 4: Install Dependencies

```bash
cd ~/gewachshaus
npm install --production
```

> Note: Installation may take several minutes on a Pi Zero. The `--production` flag installs only production dependencies.

---

## Start

### Manual Start

```bash
cd ~/gewachshaus
node server-simple.js
```

### With Start Script

```bash
# Make script executable
chmod +x start.sh

# Start server
./start.sh start

# Check status
./start.sh status

# Show logs
./start.sh logs

# Stop server
./start.sh stop
```

### Access

| Description | URL |
|--------------|-----|
| **Local** | `http://localhost:3001` |
| **In Network** | `http://raspberry-pi-ip:3001` |

> Tip: Find IP address: `hostname -I`

### Default Login

| Field | Value |
|------|------|
| **User** | `admin` |
| **Password** | `admin123` |

> Important: Change password after first login!

---

## Setup Autostart

### Option A: systemd Service (Recommended)

#### 1. Create Service File

```bash
sudo nano /etc/systemd/system/gewachshaus.service
```

#### 2. Insert Content

```ini
[Unit]
Description=Greenhouse Webapp
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

# Environment variables
Environment=PORT=3001
Environment=NODE_ENV=production
# Environment=SESSION_SECRET=your_secret_key

[Install]
WantedBy=multi-user.target
```

#### 3. Enable Service

```bash
# Reload configuration
sudo systemctl daemon-reload

# Enable autostart
sudo systemctl enable gewachshaus

# Start service
sudo systemctl start gewachshaus

# Check status
sudo systemctl status gewachshaus
```

### Service Commands

| Command | Description |
|--------|-------------|
| `sudo systemctl start gewachshaus` | Start |
| `sudo systemctl stop gewachshaus` | Stop |
| `sudo systemctl restart gewachshaus` | Restart |
| `sudo systemctl status gewachshaus` | Show status |
| `journalctl -u gewachshaus -f` | Show live logs |

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

## Konfiguration

### Umgebungsvariablen

Entweder in der systemd Service-Datei oder als `.env` Datei:

```bash
nano ~/gewachshaus/.env
```

### Beispiel: `.env` Datei

```bash
nano ~/gewachshaus/.env
```

```env
# Server-Konfiguration
PORT=3001
NODE_ENV=production

# Admin-Account (ändern Sie dies!)
ADMIN_USER=admin
ADMIN_PASS=ihr_sicheres_passwort

# Sicherheit (wichtig!)
SESSION_SECRET=$(openssl rand -hex 32)

# Optional: CORS für externe Zugriffe
ALLOWED_ORIGINS=http://192.168.1.100:3001
```

### SMTP-Konfiguration

Die E-Mail-Einstellungen werden im **Admin Panel** unter **E-Mail → SMTP-Einstellungen** konfiguriert:

1. Browser öffnen: `http://raspberry-pi-ip:3001`
2. Als Admin anmelden
3. Modus → Admin
4. E-Mail → SMTP-Einstellungen

---

## Troubleshooting

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

## Systemüberwachung

### Performance-Optimierung

#### RAM-Nutzung optimieren

Für Raspberry Pi mit wenig RAM (1 GB):

```bash
# Swap vergrößern
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=1024 setzen (statt 512)
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

#### Node.js Optimierung

```bash
# Umgebungsvariable für geringeren Speicherverbrauch
echo 'export NODE_OPTIONS="--max-old-space-size=256"' >> ~/.bashrc
source ~/.bashrc
```

#### System-Überwachung

```bash
# System-Monitoring Tools installieren
sudo apt install -y htop iotop

# Prozess-Überwachung
htop

# I/O-Überwachung
sudo iotop
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
SOURCE_DIR=~/gewachshaus

# Verzeichnisse erstellen
mkdir -p $BACKUP_DIR

# Daten sichern
cp $SOURCE_DIR/data.json $BACKUP_DIR/data_$DATE.json

# Konfiguration sichern (falls vorhanden)
if [ -f "$SOURCE_DIR/.env" ]; then
    cp $SOURCE_DIR/.env $BACKUP_DIR/env_$DATE.backup
fi

# Alte Backups aufräumen (älter als 30 Tage)
find $BACKUP_DIR -name "data_*.json" -mtime +30 -delete
find $BACKUP_DIR -name "env_*.backup" -mtime +30 -delete

# Log-Eintrag
echo "Backup erstellt: $DATE" >> $BACKUP_DIR/backup.log
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

## Sicherheitsempfehlungen

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
